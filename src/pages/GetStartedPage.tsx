import { AuthPage } from '@/components/ui/auth-page'
import { useAuthContext } from '@/providers/AuthProvider'

export default function GetStartedPage() {
    const { signUp, signInWithOAuth } = useAuthContext()

    return (
        <AuthPage
            mode="signup"
            onSubmitSignup={async (email, password) => {
                const { error, requireEmailVerification } = await signUp(email, password)
                return { error: error as Error | null, requireEmailVerification }
            }}
            onSignInWithOAuth={(provider) => signInWithOAuth(provider)}
        />
    )
}
