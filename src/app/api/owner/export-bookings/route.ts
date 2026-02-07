import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

const TIMEZONE = 'Asia/Kolkata'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== 'OWNER') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      )
    }

    const bookings = await prisma.booking.findMany({
      include: {
        user: true,
        payment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Create CSV content
    const csvHeaders = [
      'Booking ID',
      'Date',
      'Start Time',
      'End Time',
      'Slots',
      'Amount (₹)',
      'Status',
      'User Name',
      'User Email',
      'User Phone',
      'Payment Status',
      'Razorpay Order ID',
      'Razorpay Payment ID',
      'Created At',
    ]

    const csvRows = bookings.map((booking: any) => [
      booking.id,
      dayjs(booking.date).format('YYYY-MM-DD'),
      dayjs(booking.startTimeUtc).tz(TIMEZONE).format('HH:mm:ss'),
      dayjs(booking.endTimeUtc).tz(TIMEZONE).format('HH:mm:ss'),
      booking.slotsCount.toString(),
      (booking.amountPaise / 100).toFixed(2),
      booking.status,
      booking.user.name,
      booking.user.email,
      booking.user.phone,
      booking.payment?.status || 'N/A',
      booking.payment?.razorpayOrderId || 'N/A',
      booking.payment?.razorpayPaymentId || 'N/A',
      dayjs(booking.createdAt).format('YYYY-MM-DD HH:mm:ss'),
    ])

    const csvContent = [csvHeaders, ...csvRows]
      .map((row) => row.map((cell: any) => `"${cell}"`).join(','))
      .join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="bookings.csv"',
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
