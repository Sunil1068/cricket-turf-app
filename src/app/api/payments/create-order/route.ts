import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import Razorpay from 'razorpay'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

const createOrderSchema = z.object({
  bookingIds: z.array(z.string()),
})

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { bookingIds } = createOrderSchema.parse(body)

    const bookings = await prisma.booking.findMany({
      where: {
        id: { in: bookingIds },
        user: { email: session.user.email }
      },
    })

    if (bookings.length !== bookingIds.length) {
      return NextResponse.json(
        { message: 'Some bookings not found or unauthorized' },
        { status: 404 }
      )
    }

    const totalAmountPaise = bookings.reduce((sum: number, b: any) => sum + b.amountPaise, 0)

    // 1. Create payment record first to get an ID
    const payment = await prisma.payment.create({
      data: {
        provider: 'razorpay',
        amountPaise: totalAmountPaise,
        currency: 'INR',
        status: 'PENDING',
        bookings: {
          connect: bookingIds.map(id => ({ id }))
        }
      },
    })

    const baseUrl = (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '')

    // 2. Create Razorpay Payment Link
    const paymentLinkRequest = {
      amount: totalAmountPaise,
      currency: 'INR',
      accept_partial: false,
      description: `Turf Booking for ${bookingIds.length} slot(s)`,
      customer: {
        name: session.user.name || 'User',
        email: session.user.email,
        contact: '', // Optional: can add phone if available in session
      },
      notify: {
        sms: false,
        email: true,
      },
      reminder_enable: true,
      notes: {
        paymentId: payment.id,
        bookingIds: bookingIds.join(','),
      },
      callback_url: `${baseUrl}/api/payments/verify-link`,
      callback_method: 'get' as const,
    }

    const paymentLink = await razorpay.paymentLink.create(paymentLinkRequest)

    // 3. Update payment record with Razorpay Order/Link details
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        razorpayOrderId: paymentLink.id, // Storing link ID as order ID for reference
      }
    })

    return NextResponse.json({
      paymentLinkUrl: paymentLink.short_url,
      paymentId: payment.id
    })
  } catch (error: any) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      {
        message: 'Internal server error',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
