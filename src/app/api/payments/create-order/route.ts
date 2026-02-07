import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import Razorpay from 'razorpay'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const createOrderSchema = z.object({
  bookingId: z.string(),
})

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { bookingId } = createOrderSchema.parse(body)

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true },
    })

    if (!booking) {
      return NextResponse.json(
        { message: 'Booking not found' },
        { status: 404 }
      )
    }

    if (booking.user.email !== session.user.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      )
    }

    if (booking.status !== 'PENDING') {
      return NextResponse.json(
        { message: 'Booking is not in pending state' },
        { status: 400 }
      )
    }

    // Create Razorpay order
    const options = {
      amount: booking.amountPaise,
      currency: 'INR',
      receipt: `booking_${booking.id}`,
    }

    const order = await razorpay.orders.create(options)

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        provider: 'razorpay',
        razorpayOrderId: order.id,
        amountPaise: booking.amountPaise,
        currency: 'INR',
        status: 'PENDING',
      },
    })

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentId: payment.id,
    })
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
