import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendVerificationEmail } from '@/lib/email'

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
})

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 })
    }

    const validation = registerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: validation.error.errors },
        { status: 400 }
      )
    }

    const { name, email, phone, password } = validation.data

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
    const verificationToken = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)

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
    try {
      const emailResult = await sendVerificationEmail(email, verificationToken)
      if (!emailResult.success) {
        console.warn('User created but verification email failed to send:', emailResult.error)
      }
    } catch (emailErr: any) {
      console.error('Critical failure in sendVerificationEmail call:', emailErr.message || emailErr)
      // We don't want to fail the whole registration if email fails
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
      { message: `Internal server error: ${error.message || 'Unknown error'}` },
      { status: 500 }
    )
  }
}
