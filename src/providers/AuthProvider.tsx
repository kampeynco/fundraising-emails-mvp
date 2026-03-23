import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { insforge } from '@/lib/insforge'

export type OAuthProvider = Parameters<typeof insforge.auth.signInWithOAuth>[0]['provider']

interface InsForgeUser {
    id: string
    email: string
    emailVerified: boolean
    providers: string[]
    createdAt: string
    updatedAt: string
    profile?: { name?: string; avatar_url?: string }
    metadata?: Record<string, unknown>
}

interface InsForgeSession {
    accessToken: string
    user: InsForgeUser
    expiresAt?: Date
}

interface AuthContextValue {
    session: InsForgeSession | null
    user: InsForgeUser | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>
    signUp: (email: string, password: string) => Promise<{ error: Error | null; requireEmailVerification?: boolean }>
    verifyEmail: (email: string, otp: string) => Promise<{ error: Error | null }>
    signInWithOAuth: (provider: OAuthProvider) => Promise<{ error: Error | null }>
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<InsForgeSession | null>(null)
    const [user, setUser] = useState<InsForgeUser | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        insforge.auth.getCurrentUser().then(({ data }) => {
            setUser((data?.user ?? null) as InsForgeUser | null)
            setLoading(false)
        })
    }, [])

    const signIn = async (email: string, password: string) => {
        const { data, error } = await insforge.auth.signInWithPassword({ email, password })
        if (data?.user) {
            setSession(data as unknown as InsForgeSession)
            setUser(data.user as unknown as InsForgeUser)
        }
        return { error: error as Error | null }
    }

    const signUp = async (email: string, password: string) => {
        const { data, error } = await insforge.auth.signUp({ email, password })
        if (data?.user && data.accessToken) {
            setSession(data as unknown as InsForgeSession)
            setUser(data.user as unknown as InsForgeUser)
        }
        return { error: error as Error | null, requireEmailVerification: data?.requireEmailVerification }
    }

    const verifyEmail = async (email: string, otp: string) => {
        const { data, error } = await insforge.auth.verifyEmail({ email, otp })
        if (data?.user && data.accessToken) {
            setSession(data as unknown as InsForgeSession)
            setUser(data.user as unknown as InsForgeUser)
        }
        return { error: error as Error | null }
    }

    const signInWithOAuth = async (provider: OAuthProvider) => {
        const { error } = await insforge.auth.signInWithOAuth({
            provider,
            redirectTo: `${window.location.origin}/dashboard`,
        })
        return { error: error as Error | null }
    }

    const signOut = async () => {
        await insforge.auth.signOut()
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
