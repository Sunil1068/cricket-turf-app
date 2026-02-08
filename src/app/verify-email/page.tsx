import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'

export default function VerifyEmailPromptPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Mail className="w-10 h-10 text-blue-600" />
                </div>

                <h1 className="text-2xl font-bold mb-4">Check your email</h1>

                <p className="text-gray-600 mb-6">
                    We've sent a verification link to your email address.
                    Please click the link in the email to activate your account.
                </p>

                <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                        Didn't receive the email? Check your spam folder or wait a few minutes.
                    </p>

                    <Link href="/login">
                        <Button variant="outline" className="w-full">
                            Back to Login
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
