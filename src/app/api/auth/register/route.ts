import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(6),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, password } = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Generate random verification token
    const verificationToken = crypto.randomUUID()

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        role: 'USER',
        verificationToken,
      },
    })

    // Send verification email
    const { sendVerificationEmail } = await import('@/lib/email')
    const emailResult = await sendVerificationEmail(email, verificationToken)

    if (!emailResult.success) {
      console.warn('User created but verification email failed to send:', emailResult.error)
    }

    return NextResponse.json(
      { message: 'User created successfully. Please check your email.', userId: user.id },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Registration error details:', {
      message: error.message,
      stack: error.stack,
    })
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
