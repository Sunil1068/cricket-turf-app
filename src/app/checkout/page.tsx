
'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import dayjs from 'dayjs'

export default function CheckoutPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const dateStr = searchParams.get('date')
    const slotsParam = searchParams.get('slots') // Expecting JSON string of slot objects or ids

    // Parse slots
    const slots = slotsParam ? JSON.parse(decodeURIComponent(slotsParam)) : []

    const totalAmount = slots.reduce((sum: number, slot: any) => sum + slot.price, 0)

    const handleBooking = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: dateStr,
                    slots: slots,
                    amount: totalAmount
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Booking failed')
            }

            toast({
                title: 'Booking Confirmed!',
                description: 'Your slots have been successfully booked.',
                variant: 'default', // success
            })

            // Redirect to dashboard or success page
            router.push('/dashboard')
            router.refresh()

        } catch (error: any) {
            toast({
                title: 'Booking Failed',
                description: error.message,
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    if (!dateStr || slots.length === 0) {
        return (
            <div className="min-h-screen bg-brand-dark flex items-center justify-center text-white">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">No slots selected</h2>
                    <Button onClick={() => router.back()} variant="outline">Go Back</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-brand-dark text-white p-6">
            <div className="max-w-2xl mx-auto">
                <Button onClick={() => router.back()} variant="ghost" className="mb-6 text-zinc-400 hover:text-white pl-0">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Venue
                </Button>

                <Card className="glass-card border-white/5">
                    <CardHeader>
                        <CardTitle className="text-3xl text-white">Checkout</CardTitle>
                        <CardDescription className="text-zinc-400">Review your booking details</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/5">
                                <div className="text-sm text-zinc-400 mb-1">Date</div>
                                <div className="text-xl font-semibold text-white">{dayjs(dateStr).format('dddd, MMMM D, YYYY')}</div>
                            </div>

                            <div>
                                <h3 className="text-lg font-medium mb-3 text-white">Selected Slots</h3>
                                <div className="space-y-2">
                                    {slots.map((slot: any, index: number) => (
                                        <div key={index} className="flex justify-between items-center p-3 rounded-md bg-white/5 border border-white/5">
                                            <div className="flex items-center">
                                                <div className="w-2 h-2 rounded-full bg-brand-pink mr-3"></div>
                                                <span className="text-zinc-100">{slot.time}</span>
                                            </div>
                                            <span className="font-mono text-zinc-100">₹{slot.price}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                                <span className="text-xl font-bold text-white">Total Amount</span>
                                <span className="text-2xl font-bold text-brand-purple">₹{totalAmount}</span>
                            </div>

                            <Button
                                onClick={handleBooking}
                                className="w-full h-14 text-lg bg-gradient-to-r from-brand-purple to-brand-pink hover:opacity-90"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    'Pay & Confirm Booking'
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
