import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function DashboardPage() {
    const { user, signOut } = useAuth()

    return (
        <div className="min-h-screen bg-muted/40">
            {/* Top bar */}
            <header className="border-b bg-background">
                <div className="container mx-auto flex items-center justify-between h-16 px-6">
                    <h1 className="text-lg font-bold tracking-tight">
                        Fundraising <span className="text-primary">Emails</span>
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{user?.email}</span>
                        <Button variant="ghost" size="sm" onClick={signOut}>
                            Sign Out
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="container mx-auto px-6 py-10">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground mt-1">Welcome back. Here's your email program overview.</p>
                </div>

                {/* Stats grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Drafts Ready</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">3</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Sent This Month</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">12</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Raised</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">$84.2K</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Open Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">38.4%</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent drafts */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Drafts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { subject: 'End-of-Quarter Push — Match Deadline', status: 'ready', date: 'Today' },
                                { subject: 'Welcome Series — Email 3', status: 'review', date: 'Yesterday' },
                                { subject: 'Debate Response — Urgent Ask', status: 'sent', date: 'Feb 18' },
                            ].map((draft, i) => (
                                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <p className="font-medium text-sm">{draft.subject}</p>
                                        <p className="text-xs text-muted-foreground">{draft.date}</p>
                                    </div>
                                    <Badge
                                        variant={draft.status === 'ready' ? 'default' : draft.status === 'review' ? 'secondary' : 'outline'}
                                    >
                                        {draft.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
