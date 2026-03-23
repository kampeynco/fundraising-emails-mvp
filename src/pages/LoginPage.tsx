import { AuthPage } from '@/components/ui/auth-page'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
    const { signIn, signInWithOAuth } = useAuth()

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
