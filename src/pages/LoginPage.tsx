import { AuthPage } from '@/components/ui/auth-page'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
    const { signIn } = useAuth()

    return (
        <AuthPage
            mode="login"
            onSubmitLogin={async (email) => {
                const { error } = await signIn(email)
                return { error: error as Error | null }
            }}
        />
    )
}
