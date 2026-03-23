import React, { useState } from 'react'
import type { OAuthProvidersSchema } from '@insforge/sdk'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
    MailAtSign01Icon,
    ArrowLeft01Icon,
    Mail01Icon,
    LockPasswordIcon,
} from '@hugeicons/core-free-icons'
import { Button } from './button'
import { Input } from './input'

interface AuthPageProps {
    mode: 'login' | 'signup'
    onSubmitLogin?: (email: string, password: string) => Promise<{ error: Error | null }>
    onSubmitSignup?: (email: string, password: string) => Promise<{ error: Error | null; requireEmailVerification?: boolean }>
    onVerifyEmail?: (email: string, otp: string) => Promise<{ error: Error | null }>
    onSignInWithOAuth?: (provider: OAuthProvidersSchema) => Promise<void>
}

export function AuthPage({ mode, onSubmitLogin, onSubmitSignup, onVerifyEmail, onSignInWithOAuth }: AuthPageProps) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [otp, setOtp] = useState('')
    const [step, setStep] = useState<'form' | 'verify'>('form')
    const [pendingEmail, setPendingEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        if (mode === 'signup' && onSubmitSignup) {
            const result = await onSubmitSignup(email, password)
            if (result.error) {
                setError(result.error.message)
            } else if (result.requireEmailVerification) {
                setPendingEmail(email)
                setStep('verify')
            } else {
                setSuccess(true)
            }
        } else if (onSubmitLogin) {
            const result = await onSubmitLogin(email, password)
            if (result.error) {
                setError(result.error.message)
            } else {
                setSuccess(true)
            }
        }

        setLoading(false)
    }

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!onVerifyEmail) return
        setLoading(true)
        setError(null)

        const result = await onVerifyEmail(pendingEmail, otp)
        if (result.error) {
            setError(result.error.message)
        } else {
            setSuccess(true)
        }

        setLoading(false)
    }

    return (
        <main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
            {/* Left decorative panel — deep navy to match landing page */}
            <div className="relative hidden h-full flex-col p-10 lg:flex" style={{ background: 'linear-gradient(to bottom, #0f2137, #142d48)' }}>
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0f2137]/60 to-transparent" />
                <div className="z-10 flex items-center gap-2">
                    <HugeiconsIcon icon={Mail01Icon} size={24} className="text-white/90" />
                    <p className="text-xl font-bold tracking-tight text-white" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                        Fundraising <span className="text-[#e8614d]">Emails</span>
                    </p>
                </div>
                <div className="z-10 mt-auto">
                    <blockquote className="space-y-2">
                        <p className="text-xl text-white/90">
                            &ldquo;We raised 3× more in Q4 after switching to their email
                            program. The copy practically writes itself.&rdquo;
                        </p>
                        <footer className="font-mono text-sm font-semibold text-white/60">
                            ~ Campaign Finance Director
                        </footer>
                    </blockquote>
                </div>
                <div className="absolute inset-0">
                    <FloatingPaths position={1} />
                    <FloatingPaths position={-1} />
                </div>
            </div>

            {/* Right form panel */}
            <div className="relative flex min-h-screen flex-col justify-center p-4">
                <div
                    aria-hidden
                    className="absolute inset-0 isolate contain-strict -z-10 opacity-60"
                >
                    <div className="bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)] absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full" />
                    <div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 [translate:5%_-50%] rounded-full" />
                    <div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 -translate-y-87.5 rounded-full" />
                </div>

                {/* Home button — uses <a> to navigate outside the React SPA to the static landing page */}
                <Button variant="ghost" className="absolute top-7 left-5" asChild>
                    <a href="/">
                        <HugeiconsIcon icon={ArrowLeft01Icon} size={16} className="me-2" />
                        Home
                    </a>
                </Button>

                <div className="mx-auto space-y-4 sm:w-sm">
                    {/* Mobile branding — matches landing page: bold tracking-tight, coral accent */}
                    <div className="flex items-center gap-2 lg:hidden">
                        <HugeiconsIcon icon={Mail01Icon} size={24} />
                        <p className="text-xl font-bold tracking-tight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                            Fundraising <span className="text-[#e8614d]">Emails</span>
                        </p>
                    </div>

                    <div className="flex flex-col space-y-1">
                        <h1 className="text-2xl font-bold tracking-wide">
                            {mode === 'login' ? 'Welcome Back' : 'Get Started'}
                        </h1>
                        <p className="text-muted-foreground text-base">
                            {mode === 'login'
                                ? 'Sign in to your Fundraising Emails account.'
                                : 'Create your account to start raising more.'}
                        </p>
                    </div>

                    {success ? (
                        <div className="space-y-3 py-4">
                            <p className="text-sm text-muted-foreground">
                                {mode === 'login'
                                    ? 'Signed in successfully. Redirecting…'
                                    : 'Account created! You are now signed in.'}
                            </p>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => { setSuccess(false); setStep('form'); setOtp('') }}
                            >
                                Try again
                            </Button>
                        </div>
                    ) : step === 'verify' ? (
                        <form onSubmit={handleVerify} className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                We sent a 6-digit code to <strong>{pendingEmail}</strong>. Enter it below to verify your account.
                            </p>
                            {error && (
                                <p
                                    className="text-sm text-destructive text-center rounded-md bg-destructive/10 px-3 py-2"
                                    role="alert"
                                >
                                    {error}
                                </p>
                            )}
                            <div className="space-y-1.5">
                                <label htmlFor="auth-otp" className="text-sm font-medium">
                                    Verification Code
                                </label>
                                <Input
                                    id="auth-otp"
                                    placeholder="123456"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]{6}"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    autoComplete="one-time-code"
                                    autoFocus
                                />
                            </div>
                            <Button type="submit" className="w-full bg-[#e8614d] hover:bg-[#d4553f] text-white" disabled={loading}>
                                {loading ? 'Verifying…' : 'Verify Email'}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full text-sm"
                                onClick={() => { setStep('form'); setOtp(''); setError(null) }}
                            >
                                Back
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-3">
                            {error && (
                                <p
                                    className="text-sm text-destructive text-center rounded-md bg-destructive/10 px-3 py-2"
                                    role="alert"
                                >
                                    {error}
                                </p>
                            )}

                            <div className="space-y-1.5">
                                <label htmlFor="auth-email" className="text-sm font-medium">
                                    Email
                                </label>
                                <div className="relative">
                                    <Input
                                        id="auth-email"
                                        placeholder="you@campaign.com"
                                        className="peer ps-9"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                    />
                                    <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                                        <HugeiconsIcon icon={MailAtSign01Icon} size={16} aria-hidden="true" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="auth-password" className="text-sm font-medium">
                                    Password
                                </label>
                                <div className="relative">
                                    <Input
                                        id="auth-password"
                                        placeholder="••••••••"
                                        className="peer ps-9"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                        minLength={6}
                                    />
                                    <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                                        <HugeiconsIcon icon={LockPasswordIcon} size={16} aria-hidden="true" />
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" className="w-full bg-[#e8614d] hover:bg-[#d4553f] text-white" disabled={loading}>
                                {loading
                                    ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
                                    : (mode === 'login' ? 'Sign In' : 'Create Account')}
                            </Button>

                            {onSignInWithOAuth && (
                                <>
                                    <AuthSeparator />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full flex items-center gap-2"
                                        disabled={loading}
                                        onClick={() => onSignInWithOAuth('google')}
                                    >
                                        <GoogleIcon />
                                        Continue with Google
                                    </Button>
                                </>
                            )}
                        </form>
                    )}

                    <p className="text-muted-foreground text-center text-sm">
                        {mode === 'login' ? (
                            <>
                                Don't have an account?{' '}
                                <Link
                                    to="/get-started"
                                    className="hover:text-primary underline underline-offset-4"
                                >
                                    Get Started
                                </Link>
                            </>
                        ) : (
                            <>
                                Already have an account?{' '}
                                <Link
                                    to="/login"
                                    className="hover:text-primary underline underline-offset-4"
                                >
                                    Sign in
                                </Link>
                            </>
                        )}
                    </p>

                    <p className="text-muted-foreground text-center text-xs pt-2">
                        By continuing, you agree to our{' '}
                        <a
                            href="#"
                            className="hover:text-primary underline underline-offset-4"
                        >
                            Terms of Service
                        </a>{' '}
                        and{' '}
                        <a
                            href="#"
                            className="hover:text-primary underline underline-offset-4"
                        >
                            Privacy Policy
                        </a>
                        .
                    </p>
                </div>
            </div>
        </main>
    )
}

function FloatingPaths({ position }: { position: number }) {
    const paths = Array.from({ length: 36 }, (_, i) => ({
        id: i,
        d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position
            } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${152 - i * 5 * position
            } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${684 - i * 5 * position
            } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
        color: `rgba(15,23,42,${0.1 + i * 0.03})`,
        width: 0.5 + i * 0.03,
    }))

    return (
        <div className="pointer-events-none absolute inset-0">
            <svg
                className="h-full w-full text-white/50"
                viewBox="0 0 696 316"
                fill="none"
            >
                <title>Background Paths</title>
                {paths.map((path) => (
                    <motion.path
                        key={path.id}
                        d={path.d}
                        stroke="currentColor"
                        strokeWidth={path.width}
                        strokeOpacity={0.15 + path.id * 0.04}
                        initial={{ pathLength: 0.3, opacity: 0.8 }}
                        animate={{
                            pathLength: 1,
                            opacity: [0.5, 0.9, 0.5],
                            pathOffset: [0, 1, 0],
                        }}
                        transition={{
                            duration: 20 + Math.random() * 10,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: 'linear',
                        }}
                    />
                ))}
            </svg>
        </div>
    )
}

const AuthSeparator = () => {
    return (
        <div className="flex w-full items-center justify-center">
            <div className="bg-border h-px w-full" />
            <span className="text-muted-foreground px-2 text-xs">OR</span>
            <div className="bg-border h-px w-full" />
        </div>
    )
}

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
)
