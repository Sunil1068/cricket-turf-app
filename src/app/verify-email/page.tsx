'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Loader2, RotateCcw, ArrowLeft, CheckCircle2 } from 'lucide-react'
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
                title: "Login Required",
                description: "We couldn't find your email. Please try registering again.",
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
                    title: "Email Sent",
                    description: "A new verification link is on its way to your inbox."
                })
                setCountdown(60)
            } else {
                toast({
                    title: "Delivery Failed",
                    description: data.message || "We couldn't resend the email right now.",
                    variant: "destructive"
                })
            }
        } catch (error) {
            toast({
                title: "Network Error",
                description: "Please check your internet connection and try again.",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-md border-none shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden animate-in fade-in zoom-in duration-500">
            <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />

            <CardHeader className="text-center pb-2">
                <div className="mx-auto bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mb-4 ring-8 ring-blue-50/50">
                    <Mail className="w-10 h-10 text-blue-600 animate-bounce-slow" />
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900">Check your inbox</CardTitle>
                <CardDescription className="text-lg mt-2">
                    A verification link has been sent to:
                </CardDescription>
                <div className="mt-2 inline-block px-4 py-1.5 bg-gray-100 rounded-full text-blue-700 font-semibold border border-blue-100">
                    {email || 'your email'}
                </div>
            </CardHeader>

            <CardContent className="text-center pt-6 space-y-6">
                <p className="text-gray-600 leading-relaxed">
                    Click the link in the email to activate your account and start booking your favorite turfs.
                </p>

                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-left">
                    <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Quick Tip
                    </h4>
                    <p className="text-xs text-amber-700">
                        Check your <strong>Spam</strong> or <strong>Promotions</strong> folder if you don't see it in your Inbox within 2 minutes.
                    </p>
                </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2 pb-8 px-8">
                <Button
                    onClick={handleResend}
                    disabled={isLoading || countdown > 0}
                    className="w-full h-12 text-md font-semibold bg-blue-600 hover:bg-blue-700 transition-all shadow-md group"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <RotateCcw className={`w-5 h-5 transition-transform ${countdown > 0 ? '' : 'group-hover:rotate-180'}`} />
                    )}
                    <span className="ml-2">
                        {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Verification Email'}
                    </span>
                </Button>

                <Link href="/login" className="w-full">
                    <Button variant="ghost" className="w-full h-12 text-md text-gray-500 hover:text-gray-900 group">
                        <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
                        Back to Login
                    </Button>
                </Link>
            </CardFooter>

            <style jsx global>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 3s infinite ease-in-out;
                }
            `}</style>
        </Card>
    )
}

export default function VerifyEmailPromptPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-white to-gray-100 p-6">
            <Suspense fallback={
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                    <p className="text-gray-500 font-medium">Loading your details...</p>
                </div>
            }>
                <VerifyEmailContent />
            </Suspense>
        </div>
    )
}
