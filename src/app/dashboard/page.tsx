import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, XCircle, RefreshCw } from 'lucide-react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import Link from 'next/link'
import { BookingActions } from '@/components/BookingActions'

dayjs.extend(utc)
dayjs.extend(timezone)

const TIMEZONE = 'Asia/Kolkata'

export default async function DashboardPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        redirect('/login')
    }

    const bookings = await prisma.booking.findMany({
        where: {
            userId: session.user.id
        },
        include: {
            payment: true
        },
        orderBy: {
            date: 'desc'
        }
    })

    return (
        <div className="min-h-screen bg-brand-dark text-white p-6 pt-24">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">My Bookings</h1>
                        <p className="text-zinc-400">View and manage your upcoming turf sessions</p>
                    </div>
                    <Link href="/venue">
                        <Button className="bg-brand-purple hover:bg-brand-purple/90">
                            Book New Slot
                        </Button>
                    </Link>
                </div>

                {bookings.length === 0 ? (
                    <Card className="glass-card border-white/5 p-12 text-center">
                        <div className="mb-4 flex justify-center">
                            <Calendar className="w-12 h-12 text-zinc-600" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">No bookings yet</h2>
                        <p className="text-zinc-400 mb-6">You haven't made any bookings yet. Ready to play?</p>
                        <Link href="/venue">
                            <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
                                Start Booking
                            </Button>
                        </Link>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {bookings.map((booking: any) => (
                            <Card key={booking.id} className="glass-card border-white/5 overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row">
                                        <div className="p-6 flex-grow">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <Badge variant={booking.status === 'CONFIRMED' ? 'default' : 'secondary'} className={booking.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}>
                                                        {booking.status}
                                                    </Badge>
                                                    <h3 className="text-xl font-bold mt-2">Cricket Turf - Ground 1</h3>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-white">₹{booking.amountPaise / 100}</div>
                                                    <div className="text-xs text-zinc-500">
                                                        {booking.payment?.status === 'SUCCESS' ? 'Paid' : 'Unpaid'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="flex items-center text-zinc-300">
                                                    <Calendar className="w-4 h-4 mr-2 text-brand-purple" />
                                                    {dayjs(booking.date).format('dddd, MMMM D, YYYY')}
                                                </div>
                                                <div className="flex items-center text-zinc-300">
                                                    <Clock className="w-4 h-4 mr-2 text-brand-purple" />
                                                    {dayjs(booking.startTimeUtc).tz(TIMEZONE).format('h:mm A')} - {dayjs(booking.endTimeUtc).tz(TIMEZONE).format('h:mm A')}
                                                </div>
                                                <div className="flex items-center text-zinc-300">
                                                    <MapPin className="w-4 h-4 mr-2 text-brand-purple" />
                                                    Nora En Pure, New Delhi
                                                </div>
                                            </div>
                                        </div>

                                        <BookingActions bookingId={booking.id} bookingDate={booking.date.toISOString()} />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
