import { Resend } from 'resend'

export async function sendVerificationEmail(email: string, token: string) {
    try {
        const apiKey = process.env.RESEND_API_KEY
        if (!apiKey) {
            throw new Error('RESEND_API_KEY is not defined')
        }

        const resend = new Resend(apiKey)
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

        if (process.env.NODE_ENV === 'production' && baseUrl.includes('localhost')) {
            console.warn('⚠️ WARNING: NEXTAUTH_URL is set to localhost in production. Verification links will be broken!')
        }

        const confirmationLink = `${baseUrl}/verify?token=${token}`

        const result = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: email,
            subject: 'Verify your email - Cricket Turf Booking',
            html: `
                <h1>Verify your email</h1>
                <p>Click the link below to verify your account:</p>
                <a href="${confirmationLink}">${confirmationLink}</a>
            `
        })

        if (result.error) {
            console.error('Resend API error:', result.error)
            return { success: false, error: result.error.message || JSON.stringify(result.error) }
        }

        console.log(`Verification email successfully sent to ${email}`)
        return { success: true }
    } catch (error: any) {
        console.error('Critical failure in sendVerificationEmail:', error)
        return { success: false, error: error.message || 'Unknown internal error' }
    }
}
