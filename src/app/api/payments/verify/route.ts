import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            paymentId
        } = body

        // Verify signature
        const text = razorpay_order_id + '|' + razorpay_payment_id
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(text)
            .digest('hex')

        const isSignatureValid = expectedSignature === razorpay_signature

        if (!isSignatureValid) {
            return NextResponse.json({ message: 'Invalid payment signature' }, { status: 400 })
        }

        // Update payment and linked bookings
        await prisma.$transaction(async (tx) => {
            const payment = await tx.payment.update({
                where: { id: paymentId },
                data: {
                    status: 'SUCCESS',
                    razorpayPaymentId: razorpay_payment_id,
                    razorpaySignature: razorpay_signature,
                },
                include: { bookings: true }
            })

            // Update all bookings to CONFIRMED
            await tx.booking.updateMany({
                where: {
                    id: { in: payment.bookings.map(b => b.id) }
                },
                data: {
                    status: 'CONFIRMED'
                }
            })
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Payment verification error:', error)
        return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 })
    }
}
