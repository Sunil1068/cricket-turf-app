import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import Razorpay from 'razorpay'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

const createOrderSchema = z.object({
  bookingIds: z.array(z.string()),
})

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Move initialization inside to ensure runtime env vars are picked up
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { bookingIds } = createOrderSchema.parse(body)

    if (!bookingIds || bookingIds.length === 0) {
      return NextResponse.json({ message: 'No booking IDs provided' }, { status: 400 })
    }

    // 1. Verify environment variables
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({
        message: 'Razorpay configuration error',
        error: 'Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET on server'
      }, { status: 500 })
    }

    // 2. Fetch bookings
    const bookings = await prisma.booking.findMany({
      where: {
        id: { in: bookingIds },
        user: { email: session.user.email }
      },
    })

    if (bookings.length === 0) {
      return NextResponse.json({ message: 'No bookings found', error: `Could not find bookings for IDs: ${bookingIds.join(', ')}` }, { status: 404 })
    }

    if (bookings.length !== bookingIds.length) {
      return NextResponse.json({
        message: 'Some bookings not found',
        error: `Found ${bookings.length} out of ${bookingIds.length} requested bookings.`
      }, { status: 404 })
    }

    const totalAmountPaise = bookings.reduce((sum: number, b: any) => sum + b.amountPaise, 0)

    // 3. Create payment record
    let payment;
    try {
      payment = await prisma.payment.create({
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
    } catch (dbError: any) {
      console.error('Database error in payment creation:', dbError)
      return NextResponse.json({
        message: 'Database transaction failed',
        error: dbError.message,
        code: dbError.code
      }, { status: 500 })
    }

    const baseUrl = (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '')

    // 4. Create Razorpay Payment Link
    try {
      const paymentLinkRequest = {
        amount: totalAmountPaise,
        currency: 'INR',
        accept_partial: false,
        description: `Turf Booking for ${bookingIds.length} slot(s)`,
        customer: {
          name: session.user.name || 'User',
          email: session.user.email,
          contact: '',
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

      // 5. Update payment record with Razorpay Link details
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          razorpayOrderId: paymentLink.id,
        }
      })

      return NextResponse.json({
        paymentLinkUrl: paymentLink.short_url,
        paymentId: payment.id
      })
    } catch (rzpError: any) {
      console.error('Razorpay API error:', rzpError)
      return NextResponse.json({
        message: 'Razorpay payment link creation failed',
        error: rzpError.description || rzpError.message || JSON.stringify(rzpError)
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Global order creation error:', error)
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
