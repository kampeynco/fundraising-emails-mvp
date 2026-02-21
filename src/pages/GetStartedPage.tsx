import { AuthPage } from '@/components/ui/auth-page'
import { supabase } from '@/lib/supabase'

export default function GetStartedPage() {
    return (
        <AuthPage
            mode="signup"
            onSubmitSignup={async (email, password) => {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/dashboard`,
                    },
                })
                return { error: error as Error | null }
            }}
        />
    )
}
