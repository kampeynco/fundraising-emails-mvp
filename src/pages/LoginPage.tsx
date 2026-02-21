import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
    const { signIn } = useAuth()
    const [email, setEmail] = useState('')
    const [sent, setSent] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const { error } = await signIn(email)
        if (!error) setSent(true)
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        Fundraising <span className="text-primary">Emails</span>
                    </CardTitle>
                    <CardDescription>
                        Sign in to access your email drafts
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {sent ? (
                        <div className="text-center space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Check your email for a magic link.
                            </p>
                            <Button variant="ghost" onClick={() => setSent(false)}>
                                Try again
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                type="email"
                                placeholder="you@campaign.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Sending...' : 'Send Magic Link'}
                            </Button>
                            <p className="text-xs text-center text-muted-foreground">
                                Don't have an account?{' '}
                                <a href="/get-started" className="underline hover:text-primary">Get Started</a>
                            </p>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
