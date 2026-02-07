import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle } from 'lucide-react'

export default async function VerifyPage({
    searchParams,
}: {
    searchParams: { token?: string }
}) {
    const token = searchParams.token

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Invalid Link</h1>
                    <p className="text-gray-600 mb-6">No verification token found.</p>
                    <Link href="/login">
                        <Button>Go to Login</Button>
                    </Link>
                </div>
            </div>
        )
    }

    // Verify token in DB
    const user = await prisma.user.findFirst({
        where: { verificationToken: token },
    })

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Verification Failed</h1>
                    <p className="text-gray-600 mb-6">Invalid or expired token.</p>
                    <Link href="/login">
                        <Button>Go to Login</Button>
                    </Link>
                </div>
            </div>
        )
    }

    // Update user as verified
    await prisma.user.update({
        where: { id: user.id },
        data: {
            emailVerified: new Date(),
            verificationToken: null, // Clear token so it can't be used again
        },
    })

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">Email Verified!</h1>
                <p className="text-gray-600 mb-6">
                    Your account has been successfully verified. You can now login.
                </p>
                <Link href="/login">
                    <Button className="w-full">Proceed to Login</Button>
                </Link>
            </div>
        </div>
    )
}
