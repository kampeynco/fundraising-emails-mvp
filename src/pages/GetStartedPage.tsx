import { AuthPage } from '@/components/ui/auth-page'
import { useAuth } from '@/hooks/useAuth'

export default function GetStartedPage() {
    const { signUp, verifyEmail, signInWithOAuth } = useAuth()

    return (
        <AuthPage
            mode="signup"
            onSubmitSignup={async (email, password) => {
                const { error, requireEmailVerification } = await signUp(email, password)
                return { error: error as Error | null, requireEmailVerification }
            }}
            onVerifyEmail={async (email, otp) => {
                const { error } = await verifyEmail(email, otp)
                return { error: error as Error | null }
            }}
            onSignInWithOAuth={signInWithOAuth}
        />
    )
}
