
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { date, slots, amount } = body

        if (!date || !slots || !Array.isArray(slots) || slots.length === 0) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
        }

        // Process each slot
        // We use a transaction to ensure all slots are available
        const result = await prisma.$transaction(async (tx) => {
            const createdBookings = []

            for (const slot of slots) {
                // slot.hour is the local hour (e.g., 7 for 7 AM)
                // We need to construct the Date objects correctly
                // Assuming 'date' is YYYY-MM-DD

                const bookingDate = dayjs(date).startOf('day').toDate()

                // Construct start time in UTC
                // We need to be careful with timezone. The input 'date' + 'hour' should map to a specific absolute time.
                // Let's assume the frontend sends the exact ISO string for start time to avoid ambiguity
                // Or we construct it here using the app's timezone (Asia/Kolkata)

                let startTime = dayjs(date).tz('Asia/Kolkata').hour(slot.hour).minute(0).second(0)

                // Handle Next Day slots (0 AM, 1 AM)
                if (slot.hour < 7) {
                    startTime = startTime.add(1, 'day')
                }

                const startTimeUtc = startTime.toDate()
                const endTimeUtc = startTime.add(1, 'hour').toDate()

                const PENDING_TIMEOUT_MINS = 10
                const timeoutThreshold = dayjs().subtract(PENDING_TIMEOUT_MINS, 'minutes').toDate()

                // Check if already booked
                const existing = await (tx as any).booking.findFirst({
                    where: {
                        startTimeUtc: startTimeUtc,
                        OR: [
                            { status: 'CONFIRMED' },
                            {
                                status: 'PENDING',
                                createdAt: { gte: timeoutThreshold },
                                // If the hold is held by someone ELSE, block it.
                                // If it's the SAME user, allow them to create a new one (retry).
                                userId: { not: (session.user as any).id }
                            }
                        ]
                    }
                })

                if (existing) {
                    throw new Error(`Slot ${slot.time} is no longer available`)
                }

                const booking = await (tx as any).booking.create({
                    data: {
                        userId: (session.user as any).id,
                        date: bookingDate,
                        startTimeUtc: startTimeUtc,
                        endTimeUtc: endTimeUtc,
                        slotsCount: 1,
                        amountPaise: slot.price * 100,
                        status: 'PENDING',
                    }
                })
                createdBookings.push(booking)
            }
            return createdBookings
        })

        return NextResponse.json({
            success: true,
            bookingIds: result.map((b: any) => b.id),
            totalAmountPaise: result.reduce((sum: number, b: any) => sum + b.amountPaise, 0)
        })

    } catch (error: any) {
        console.error('Booking error:', error)
        return NextResponse.json({ error: error.message || 'Failed to create booking' }, { status: 400 })
    }
}
