import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendVerificationEmail(email: string, token: string) {
    try {
        const confirmationLink = `${process.env.NEXTAUTH_URL}/verify?token=${token}`

        await resend.emails.send({
            from: 'onboarding@resend.dev', // Default testing domain for Resend
            to: email,
            subject: 'Verify your email - Cricket Turf Booking',
            html: `
        <h1>Verify your email</h1>
        <p>Click the link below to verify your account:</p>
        <a href="${confirmationLink}">${confirmationLink}</a>
      `
        })
        console.log(`Verification email sent to ${email}`)
        return { success: true }
    } catch (error) {
        console.error('Failed to send verification email:', error)
        return { success: false, error }
    }
}
