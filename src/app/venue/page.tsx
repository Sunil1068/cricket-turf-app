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
import { useRouter } from 'next/navigation'

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

  const handleProceed = () => {
    const selectedObjects = slots.filter(s => selectedSlots.includes(s.id))
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
                    <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-white/5 opacity-50 mr-2"></div> Booked</span>
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
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-white">Available Slots</CardTitle>
                    <CardDescription className="text-zinc-400">
                      {selectedDate ? dayjs(selectedDate).format('dddd, MMMM D, YYYY') : 'Select a date'}
                    </CardDescription>
                  </div>
                  {loading && <Loader2 className="h-5 w-5 animate-spin text-brand-purple" />}
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
                            isBooked && "opacity-30 cursor-not-allowed bg-transparent border-white/5 decoration-slice pointer-events-none",
                            isPeak && !isSelected && !isBooked && "border-brand-pink/30"
                          )}
                          onClick={() => !isBooked && toggleSlot(slot.id)}
                          disabled={isBooked}
                        >
                          <span className="font-semibold text-lg">{slot.time}</span>
                          <span className={cn(
                            "text-xs mt-1",
                            isSelected ? "text-white/90" : (isPeak ? "text-brand-pink" : "text-zinc-500"),
                            isBooked && "text-zinc-600"
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

                {/* Booking Summary Floating Bar */}
                {selectedSlots.length > 0 && (
                  <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-2xl bg-zinc-900/90 backdrop-blur-xl border border-brand-purple/50 p-4 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 animate-in slide-in-from-bottom-5">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-zinc-400 text-xs uppercase tracking-wider">Total Amount</span>
                        <span className="text-2xl font-bold text-white">₹{totalAmount}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="hidden sm:block text-right">
                          <span className="text-brand-purple font-medium">{selectedSlots.length} Slots</span>
                          <div className="text-xs text-zinc-500">Selected</div>
                        </div>
                        <Button
                          onClick={handleProceed}
                          className="bg-gradient-to-r from-brand-purple to-brand-pink hover:opacity-90 text-white px-8 h-12 shadow-lg"
                        >
                          Proceed
                        </Button>
                      </div>
                    </div>
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
