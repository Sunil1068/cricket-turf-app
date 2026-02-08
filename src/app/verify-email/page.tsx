'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Mail, Loader2, RotateCcw } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

function VerifyEmailContent() {
    const searchParams = useSearchParams()
    const email = searchParams.get('email')
    const [isLoading, setIsLoading] = useState(false)
    const [countdown, setCountdown] = useState(0)

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [countdown])

    const handleResend = async () => {
        if (!email) {
            toast({
                title: "Error",
                description: "Email address not found. Please try registering again.",
                variant: "destructive"
            })
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })

            const data = await response.json()

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Verification email resent! Please check your inbox."
                })
                setCountdown(60) // 1 minute cooldown
            } else {
                toast({
                    title: "Error",
                    description: data.message || "Failed to resend email",
                    variant: "destructive"
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Something went wrong. Please try again later.",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-10 h-10 text-blue-600" />
            </div>

            <h1 className="text-2xl font-bold mb-4">Check your email</h1>

            <p className="text-gray-600 mb-6">
                We've sent a verification link to <span className="font-semibold text-gray-900">{email || 'your email'}</span>.
                Please click the link in the email to activate your account.
            </p>

            <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-sm text-gray-600 mb-3">
                        Didn't receive the email? Check your spam folder or wait a few minutes.
                    </p>

                    <Button
                        onClick={handleResend}
                        disabled={isLoading || countdown > 0}
                        variant="secondary"
                        className="w-full flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <RotateCcw className="w-4 h-4" />
                        )}
                        {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Email'}
                    </Button>
                </div>

                <Link href="/login">
                    <Button variant="outline" className="w-full">
                        Back to Login
                    </Button>
                </Link>
            </div>
        </div>
    )
}

export default function VerifyEmailPromptPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-blue-600" />}>
                <VerifyEmailContent />
            </Suspense>
        </div>
    )
}
