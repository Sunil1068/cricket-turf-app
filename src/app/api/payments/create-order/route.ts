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

    // Create Razorpay order
    const options = {
      amount: totalAmountPaise,
      currency: 'INR',
      receipt: `multi_booking_${bookingIds[0]}`,
    }

    const order = await razorpay.orders.create(options)

    // Create payment record and link to bookings
    const payment = await prisma.payment.create({
      data: {
        provider: 'razorpay',
        razorpayOrderId: order.id,
        amountPaise: totalAmountPaise,
        currency: 'INR',
        status: 'PENDING',
        bookings: {
          connect: bookingIds.map(id => ({ id }))
        }
      },
    })

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentId: payment.id,
      keyId: process.env.RAZORPAY_KEY_ID
    })
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
