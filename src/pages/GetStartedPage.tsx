import { AuthPage } from '@/components/ui/auth-page'
import { useAuth } from '@/hooks/useAuth'

export default function GetStartedPage() {
    const { signIn } = useAuth()

    return (
        <AuthPage
            mode="signup"
            onSubmitLogin={async (email) => {
                const { error } = await signIn(email)
                return { error: error as Error | null }
            }}
        />
    )
}
