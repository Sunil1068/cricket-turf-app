import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email } = body

        if (!email) {
            return NextResponse.json({ message: 'Email is required' }, { status: 400 })
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        })

        if (!user) {
            // We return 200 even if user doesn't exist for security (don't reveal registered emails)
            // But for this internal debug/testing app, we'll be more explicit
            return NextResponse.json({ message: 'User not found' }, { status: 404 })
        }

        if (user.emailVerified) {
            return NextResponse.json({ message: 'Email already verified' }, { status: 400 })
        }

        // If user has no token, generate one
        let token = user.verificationToken
        if (!token) {
            token = Math.random().toString(36).substring(2, 15)
            await prisma.user.update({
                where: { email },
                data: { verificationToken: token }
            })
        }

        // Send verification email
        const emailResult = await sendVerificationEmail(email, token)

        if (!emailResult.success) {
            console.error('Failed to resend email:', emailResult.error)
            return NextResponse.json({
                message: `Email failed: ${emailResult.error || 'Unknown provider error'}`,
                error: emailResult.error
            }, { status: 500 })
        }

        return NextResponse.json({ message: 'Verification email resent successfully' })
    } catch (error: any) {
        console.error('Resend error:', error)
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    }
}
