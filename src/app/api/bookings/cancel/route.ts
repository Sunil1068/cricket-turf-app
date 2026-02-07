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

        const { bookingId } = await request.json()

        if (!bookingId) {
            return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
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

        // Check if booking is in the past (optional policy)
        if (new Date(booking.date) < new Date()) {
            // Maybe allow cancellation only 24h before? For now just block past bookings
            // return NextResponse.json({ error: 'Cannot cancel past bookings' }, { status: 400 })
        }

        await prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'CANCELLED' }
        })

        return NextResponse.json({ success: true, message: 'Booking cancelled successfully' })
    } catch (error: any) {
        console.error('Cancellation error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
