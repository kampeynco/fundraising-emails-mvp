import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
    MailAtSign01Icon,
    ArrowLeft01Icon,
    Mail01Icon,
} from '@hugeicons/core-free-icons'
import { Button } from './button'
import { Input } from './input'
import { cn } from '@/lib/utils'

interface AuthPageProps {
    mode: 'login' | 'signup'
    onSubmitLogin?: (email: string) => Promise<{ error: Error | null }>
}

export function AuthPage({ mode, onSubmitLogin }: AuthPageProps) {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        if (onSubmitLogin) {
            const result = await onSubmitLogin(email)
            if (result.error) {
                setError(result.error.message)
            } else {
                setSuccess(true)
            }
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
                                    ? 'Check your email for a magic link to sign in.'
                                    : 'Check your email for a magic link to get started.'}
                            </p>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setSuccess(false)}
                            >
                                Try again
                            </Button>
                        </div>
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



                            <Button type="submit" className="w-full bg-[#e8614d] hover:bg-[#d4553f] text-white" disabled={loading}>
                                {loading
                                    ? 'Sending…'
                                    : 'Send Magic Link'}
                            </Button>
                        </form>
                    )}

                    <AuthSeparator />

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
