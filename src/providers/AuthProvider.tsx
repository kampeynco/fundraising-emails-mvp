import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export type OAuthProvider = Parameters<typeof supabase.auth.signInWithOAuth>[0]['provider']

interface AuthContextValue {
    session: Session | null
    user: User | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>
    signUp: (email: string, password: string) => Promise<{ error: Error | null; requireEmailVerification?: boolean }>
    verifyEmail: (email: string, otp: string) => Promise<{ error: Error | null }>
    signInWithOAuth: (provider: OAuthProvider) => Promise<{ error: Error | null }>
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase.auth.getSession()
            .then(({ data }) => {
                setSession(data.session)
                setUser(data.session?.user ?? null)
                setLoading(false)
            })
            .catch(() => setLoading(false))

        const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
            setSession(nextSession)
            setUser(nextSession?.user ?? null)
            setLoading(false)
        })

        return () => listener.subscription.unsubscribe()
    }, [])

    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        setSession(data.session)
        setUser(data.user)
        return { error: error as Error | null }
    }

    const signUp = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        })
        setSession(data.session)
        setUser(data.user)
        return { error: error as Error | null, requireEmailVerification: !!data.user && !data.session }
    }

    const verifyEmail = async (email: string, otp: string) => {
        const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'signup' })
        setSession(data.session)
        setUser(data.user)
        return { error: error as Error | null }
    }

    const signInWithOAuth = async (provider: OAuthProvider) => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo: `${window.location.origin}/dashboard` },
        })
        return { error: error as Error | null }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        setSession(null)
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ session, user, loading, signIn, signUp, verifyEmail, signInWithOAuth, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuthContext() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuthContext must be used within an AuthProvider')
    }
    return context
}
