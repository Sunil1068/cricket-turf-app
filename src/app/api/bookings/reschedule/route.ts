import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { bookingId, date, slots } = await request.json()

        if (!bookingId || !date || !slots || slots.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId }
        })

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }

        if (booking.userId !== session.user.id && session.user.role !== 'OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Calculate new times
        const startTimeStr = slots[0].time.split(' - ')[0]
        const endTimeStr = slots[slots.length - 1].time.split(' - ')[1]

        const startTimeUtc = new Date(`${date}T${startTimeStr}:00Z`)
        const endTimeUtc = new Date(`${date}T${endTimeStr}:00Z`)

        // Check for conflicts (excluding the current booking)
        const conflict = await prisma.booking.findFirst({
            where: {
                id: { not: bookingId },
                date: new Date(date),
                status: 'CONFIRMED',
                OR: [
                    {
                        startTimeUtc: { lt: endTimeUtc },
                        endTimeUtc: { gt: startTimeUtc }
                    }
                ]
            }
        })

        if (conflict) {
            return NextResponse.json({ error: 'New slot is already booked' }, { status: 400 })
        }

        // Update booking
        await prisma.booking.update({
            where: { id: bookingId },
            data: {
                date: new Date(date),
                startTimeUtc,
                endTimeUtc,
                slotsCount: slots.length
            }
        })

        return NextResponse.json({ success: true, message: 'Booking rescheduled successfully' })
    } catch (error: any) {
        console.error('Rescheduling error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
