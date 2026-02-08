import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const razorpay_payment_id = searchParams.get('razorpay_payment_id')
        const razorpay_payment_link_id = searchParams.get('razorpay_payment_link_id')
        const razorpay_payment_link_reference = searchParams.get('razorpay_payment_link_reference')
        const razorpay_payment_link_status = searchParams.get('razorpay_payment_link_status')
        const razorpay_signature = searchParams.get('razorpay_signature')

        if (!razorpay_payment_id || !razorpay_payment_link_id || !razorpay_signature) {
            return NextResponse.redirect(new URL('/dashboard?error=invalid_payment_params', request.url))
        }

        // 1. Verify Signature
        // Signature for Payment Links callback: payment_link_id + "|" + payment_id
        const text = razorpay_payment_link_id + '|' + razorpay_payment_id
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(text)
            .digest('hex')

        const isSignatureValid = expectedSignature === razorpay_signature

        if (!isSignatureValid) {
            console.error('Invalid signature in payment link verify')
            return NextResponse.redirect(new URL('/dashboard?error=invalid_signature', request.url))
        }

        if (razorpay_payment_link_status !== 'paid') {
            console.log('Payment link status is not paid:', razorpay_payment_link_status)
            return NextResponse.redirect(new URL('/dashboard?error=payment_not_paid', request.url))
        }

        // 2. Find and update the payment and linked bookings
        // We stored the linkage in the payment record during creation.
        // The razorpay_payment_link_id matches our saved razorpayOrderId.

        const payment = await prisma.payment.findFirst({
            where: { razorpayOrderId: razorpay_payment_link_id },
            include: { bookings: true }
        })

        if (!payment) {
            console.error('Payment record not found for link ID:', razorpay_payment_link_id)
            return NextResponse.redirect(new URL('/dashboard?error=payment_record_not_found', request.url))
        }

        if (payment.status !== 'SUCCESS') {
            await prisma.$transaction(async (tx) => {
                // Update payment to SUCCESS
                await tx.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: 'SUCCESS',
                        razorpayPaymentId: razorpay_payment_id,
                        razorpaySignature: razorpay_signature,
                    }
                })

                // Update all themed bookings to CONFIRMED
                await tx.booking.updateMany({
                    where: {
                        id: { in: payment.bookings.map(b => b.id) }
                    },
                    data: {
                        status: 'CONFIRMED'
                    }
                })
            })
        }

        // Redirect to success page or dashboard
        return NextResponse.redirect(new URL('/dashboard?payment=success', request.url))

    } catch (error: any) {
        console.error('Payment link verification error:', error)
        return NextResponse.redirect(new URL('/dashboard?error=internal_server_error', request.url))
    }
}
