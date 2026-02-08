import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        const { searchParams } = new URL(request.url)
        const dateStr = searchParams.get('date')

        if (!dateStr) {
            return NextResponse.json({ error: 'Date is required' }, { status: 400 })
        }

        const date = dayjs(dateStr).startOf('day').toDate()
        const nextDay = dayjs(dateStr).add(1, 'day').startOf('day').toDate()

        const PENDING_TIMEOUT_MINS = 10
        const timeoutThreshold = dayjs().subtract(PENDING_TIMEOUT_MINS, 'minutes').toDate()

        const bookings = await prisma.booking.findMany({
            where: {
                date: {
                    gte: date,
                    lt: nextDay,
                },
                OR: [
                    { status: 'CONFIRMED' },
                    {
                        status: 'PENDING',
                        createdAt: { gte: timeoutThreshold },
                        // If user is logged in, don't show THEIR pending bookings as unavailable to them
                        ...(session?.user?.id ? { userId: { not: session.user.id } } : {})
                    }
                ]
            },
            select: {
                startTimeUtc: true,
                endTimeUtc: true,
            },
        })

        // Transform to simple hour list for frontend
        // Assuming hourly slots, we just need the hour of start time in local time
        // However, storing UTC implies we should convert back to display
        const bookedSlots = bookings.map((booking: any) => {
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
