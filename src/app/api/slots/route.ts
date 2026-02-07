
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const dateStr = searchParams.get('date')

        if (!dateStr) {
            return NextResponse.json({ error: 'Date is required' }, { status: 400 })
        }

        const date = dayjs(dateStr).startOf('day').toDate()
        const nextDay = dayjs(dateStr).add(1, 'day').startOf('day').toDate()

        const bookings = await prisma.booking.findMany({
            where: {
                date: {
                    gte: date,
                    lt: nextDay,
                },
                status: {
                    in: ['CONFIRMED', 'PENDING'], // Treat pending as booked to avoid race conditions shown in UI
                },
            },
            select: {
                startTimeUtc: true,
                endTimeUtc: true,
            },
        })

        // Transform to simple hour list for frontend
        // Assuming hourly slots, we just need the hour of start time in local time
        // However, storing UTC implies we should convert back to display
        const bookedSlots = bookings.map(booking => {
            // This logic depends on how we store time. 
            // If we store UTC dates, we just send back the start times.
            return {
                startTime: booking.startTimeUtc,
                endTime: booking.endTimeUtc
            }
        })

        return NextResponse.json({ bookedSlots })
    } catch (error) {
        console.error('Error fetching slots:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
