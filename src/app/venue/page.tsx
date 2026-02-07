'use client'

import { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, MapPin, Clock, Info, Loader2 } from 'lucide-react'
import Link from 'next/link'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { cn } from '@/lib/utils'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'

dayjs.extend(utc)
dayjs.extend(timezone)

const TIMEZONE = 'Asia/Kolkata'

const generateSlots = (date: Date) => {
  const slots = []
  const startHour = 7
  const endHour = 26 // 2 AM next day

  for (let hour = startHour; hour < endHour; hour++) {
    const slotTime = dayjs(date).tz(TIMEZONE).hour(hour).minute(0).second(0)
    const displayTime = slotTime.format('h:mm A')
    const price = hour >= 22 || hour < 7 ? 1600 : 1500 // 10 PM to 2 AM is 1600, else 1500

    slots.push({
      id: `${date.toISOString().split('T')[0]}-${hour}`,
      time: displayTime,
      hour,
      price,
    })
  }

  return slots
}

export default function VenuePage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])
  const [unavailableSlots, setUnavailableSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const slots = selectedDate ? generateSlots(selectedDate) : []

  // Fetch availability when date changes
  useEffect(() => {
    if (selectedDate) {
      const fetchAvailability = async () => {
        setLoading(true)
        try {
          const dateStr = selectedDate.toISOString()
          const res = await fetch(`/api/slots?date=${dateStr}`)
          const data = await res.json()

          if (data.bookedSlots) {
            // Map booked slots to our IDs or start times to disable
            // The API returns startTime etc. We need to match with our 'hour' logic.
            // Our ID format: YYYY-MM-DD-HOUR

            // Simplification: Match by hour. 
            // Note: date.toISOString sends UTC. The backend handles finding bookings for that day.
            // We need to know which HOURS are booked.

            const bookedIds = data.bookedSlots.map((booking: any) => {
              const bookingTime = dayjs(booking.startTime).tz(TIMEZONE)
              // If the booking is for tomorrow early morning (e.g. 1 AM), it belongs to "today's" logical slots > 24
              const bookingHour = bookingTime.hour()

              // Adjust for next day logic if needed, but for now let's just match hour+day
              // Actually the simplest is to match the exact ISO start time or just trust the backend logic

              // Let's refine the matching. 
              // We generated slots for `selectedDate`.
              // A slot has a specific `hour`. 
              // We should check if any returned booking overlaps.

              // Hack: Convert the returned start time to hour.
              // If booking is 7 AM, hour is 7.
              // If booking is 1 AM (next day), hour is 1. But in our loop 1 AM is 25.

              let hour = bookingHour
              if (hour < 7) hour += 24 // Map 0-6 to 24-30 for display logic

              return `${selectedDate.toISOString().split('T')[0]}-${hour}`
            })

            setUnavailableSlots(bookedIds)
          }
        } catch (e) {
          console.error("Failed to fetch slots", e)
        } finally {
          setLoading(false)
        }
      }
      fetchAvailability()
      setSelectedSlots([]) // Reset selection on date change
    }
  }, [selectedDate])


  const toggleSlot = (slotId: string) => {
    setSelectedSlots(prev =>
      prev.includes(slotId)
        ? prev.filter(id => id !== slotId)
        : [...prev, slotId]
    )
  }

  const searchParams = useSearchParams()
  const rescheduleBookingId = searchParams.get('reschedule')

  const handleProceed = async () => {
    const selectedObjects = slots.filter(s => selectedSlots.includes(s.id))

    if (rescheduleBookingId) {
      setLoading(true)
      try {
        const response = await fetch('/api/bookings/reschedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: rescheduleBookingId,
            date: selectedDate?.toISOString().split('T')[0],
            slots: selectedObjects
          })
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Failed to reschedule')

        toast({
          title: 'Rescheduled!',
          description: 'Your booking has been moved successfully.',
        })
        router.push('/dashboard')
        router.refresh()
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
      return
    }

    const slotsParam = encodeURIComponent(JSON.stringify(selectedObjects))
    const dateParam = selectedDate?.toISOString()
    router.push(`/checkout?date=${dateParam}&slots=${slotsParam}`)
  }

  const selectedSlotObjects = slots.filter(slot => selectedSlots.includes(slot.id))
  const totalAmount = selectedSlotObjects.reduce((sum, slot) => sum + slot.price, 0)

  return (
    <div className="min-h-screen bg-brand-dark text-white selection:bg-brand-purple selection:text-white">
      {/* Background Gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-brand-purple/10 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand-pink/5 rounded-full blur-[150px]"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-brand-purple/20 to-brand-pink/10 border border-white/5 backdrop-blur-md">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-brand-pink hover:bg-brand-pink/80 border-0">PREMIUM</Badge>
                <Badge variant="outline" className="border-white/20 text-white">CRICKET</Badge>
              </div>
              <h1 className="text-4xl font-bold mb-2">Pro Arena Turf</h1>
              <div className="flex flex-wrap items-center text-zinc-400 gap-4 text-sm">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1 text-brand-purple" />
                  <span>Bangalore, KA</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1 text-brand-pink" />
                  <span>07:00 AM - 02:00 AM</span>
                </div>
              </div>
            </div>
            <div className="text-right hidden md:block">
              <div className="text-sm text-zinc-400">Rate per hour</div>
              <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">₹1,500 - ₹1,600</div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Date Picker */}
          <div className="lg:col-span-1">
            <Card className="glass-card border-white/5">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <CalendarIcon className="w-5 h-5 mr-2 text-brand-purple" />
                  Select Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date.getTime() < new Date().setHours(0, 0, 0, 0)}
                  className={cn(
                    "rounded-md border border-white/10 bg-black/20 text-white w-full",
                    "[&_.rdp-day_button:hover]:bg-brand-purple/20",
                    "[&_.rdp-day_button.rdp-day_selected]:bg-brand-purple",
                    "[&_.rdp-day_button.rdp-day_selected]:text-white"
                  )}
                />
              </CardContent>
            </Card>

            <Card className="glass-card border-white/5 mt-6">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-white/10 border border-white/20 mr-2"></div> Available</span>
                    <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-brand-purple mr-2"></div> Selected</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-green-500/30 border border-green-500/60 mr-2"></div> Booked</span>
                    <span className="flex items-center"><div className="w-3 h-3 rounded-full border border-brand-pink/50 mr-2"></div> Peak Hrs</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Slots */}
          <div className="lg:col-span-2">
            <Card className="glass-card border-white/5 h-full">
              <CardHeader>
                <div className="flex justify-between items-center sm:items-center flex-wrap gap-4">
                  <div>
                    <CardTitle className="text-white">Available Slots</CardTitle>
                    <CardDescription className="text-zinc-400">
                      {selectedDate ? dayjs(selectedDate).format('dddd, MMMM D, YYYY') : 'Select a date'}
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-4 ml-auto">
                    {loading && <Loader2 className="h-5 w-5 animate-spin text-brand-purple" />}

                    {selectedSlots.length > 0 && (
                      <div className="flex items-center gap-6 bg-white/5 border border-white/10 p-2 px-6 rounded-xl animate-in fade-in zoom-in-95 duration-300 shadow-xl backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Total</div>
                            <div className="text-xl font-bold text-white leading-none">₹{totalAmount}</div>
                          </div>
                          <div className="h-8 w-[1px] bg-white/10 hidden sm:block" />
                          <div className="hidden sm:block text-right">
                            <div className="text-[10px] text-brand-purple uppercase font-bold tracking-wider">Selected</div>
                            <div className="text-xl font-bold text-white leading-none">{selectedSlots.length}</div>
                          </div>
                        </div>
                        <Button
                          onClick={handleProceed}
                          className="bg-gradient-to-r from-brand-purple to-brand-pink hover:opacity-90 text-white shadow-lg h-10 px-6 font-bold"
                        >
                          {rescheduleBookingId ? 'Reschedule' : 'Proceed'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {selectedDate ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {slots.map((slot) => {
                      const isSelected = selectedSlots.includes(slot.id);
                      const isBooked = unavailableSlots.includes(slot.id);
                      const isPeak = slot.price > 1500;

                      return (
                        <Button
                          key={slot.id}
                          variant="ghost"
                          className={cn(
                            "h-auto py-3 px-2 flex flex-col items-center border transition-all duration-200",
                            isSelected
                              ? "bg-brand-purple hover:bg-brand-purple/90 border-brand-purple text-white shadow-[0_0_15px_rgba(109,40,217,0.5)]"
                              : "bg-white/5 hover:bg-white/10 border-white/5 text-zinc-300",
                            isBooked && "bg-green-500/30 border-green-500/60 text-green-300 cursor-not-allowed pointer-events-none",
                            isPeak && !isSelected && !isBooked && "border-brand-pink/30"
                          )}
                          onClick={() => !isBooked && toggleSlot(slot.id)}
                          disabled={isBooked}
                        >
                          <span className="font-semibold text-lg">{slot.time}</span>
                          <span className={cn(
                            "text-xs mt-1",
                            isSelected ? "text-white/90" : (isPeak ? "text-brand-pink" : "text-zinc-500"),
                            isBooked && "text-green-500 font-bold"
                          )}>
                            {isBooked ? 'Booked' : `₹${slot.price}`}
                          </span>
                        </Button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                    <Info className="w-12 h-12 mb-4 opacity-50" />
                    <p>Please select a date to view available slots</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
