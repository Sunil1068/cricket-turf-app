'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { XCircle, RefreshCw, Loader2 } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

interface BookingActionsProps {
    bookingId: string
    bookingDate: string
}

export function BookingActions({ bookingId, bookingDate }: BookingActionsProps) {
    const [loading, setLoading] = useState<string | null>(null)
    const router = useRouter()

    const handleCancel = async () => {
        if (!confirm('Are you sure you want to cancel this booking?')) return

        setLoading('cancel')
        try {
            const response = await fetch('/api/bookings/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId })
            })

            const data = await response.json()

            if (!response.ok) throw new Error(data.error || 'Failed to cancel')

            toast({
                title: 'Success',
                description: 'Booking cancelled successfully',
            })
            router.refresh()
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive'
            })
        } finally {
            setLoading(null)
        }
    }

    const handleReschedule = () => {
        // Navigate to venue page with a reschedule flag and the current booking ID
        // The venue page will then allow picking a new slot and update the existing booking instead of creating a new one
        router.push(`/venue?reschedule=${bookingId}`)
    }

    return (
        <div className="bg-white/5 border-t md:border-t-0 md:border-l border-white/5 p-4 flex md:flex-col gap-2 justify-center min-w-[160px]">
            <Button
                variant="ghost"
                className="w-full text-zinc-400 hover:text-white hover:bg-white/5"
                onClick={handleReschedule}
                disabled={!!loading}
            >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reschedule
            </Button>
            <Button
                variant="ghost"
                className="w-full text-red-400 hover:text-red-300 hover:bg-red-950/20"
                onClick={handleCancel}
                disabled={!!loading}
            >
                {loading === 'cancel' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                )}
                Cancel
            </Button>
        </div>
    )
}
