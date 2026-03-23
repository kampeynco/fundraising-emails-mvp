import { AuthPage } from '@/components/ui/auth-page'
import { useAuthContext } from '@/providers/AuthProvider'

export default function LoginPage() {
    const { signIn, signInWithOAuth } = useAuthContext()

    return (
        <AuthPage
            mode="login"
            onSubmitLogin={async (email, password) => {
                const { error } = await signIn(email, password)
                return { error: error as Error | null }
            }}
            onSignInWithOAuth={(provider) => signInWithOAuth(provider)}
        />
    )
}
