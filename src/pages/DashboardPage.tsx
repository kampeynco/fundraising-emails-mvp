import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Draft } from '@/types/draft'

const recentDrafts: Draft[] = [
    { id: 1, subject: 'End-of-Quarter Push — Match Deadline', status: 'ready', created: '2026-02-20', date: 'Today' },
    { id: 2, subject: 'Welcome Series — Email 3', status: 'review', created: '2026-02-19', date: 'Yesterday' },
    { id: 3, subject: 'Debate Response — Urgent Ask', status: 'sent', created: '2026-02-18', date: 'Feb 18' },
]

const stats = [
    { label: 'Drafts Ready', value: '3' },
    { label: 'Sent This Month', value: '12' },
    { label: 'Total Raised', value: '$84.2K' },
    { label: 'Avg. Open Rate', value: '38.4%' },
]

export default function DashboardPage() {
    return (
        <>
            <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground mt-1">
                    Welcome back. Here's your email program overview.
                </p>
            </div>

            {/* Stats grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
                {stats.map((stat) => (
                    <Card key={stat.label}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.label}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent drafts */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Drafts</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentDrafts.map((draft) => (
                            <div
                                key={draft.id}
                                className="flex items-center justify-between p-4 border rounded-lg"
                            >
                                <div>
                                    <p className="font-medium text-sm">{draft.subject}</p>
                                    <p className="text-xs text-muted-foreground">{draft.date}</p>
                                </div>
                                <Badge
                                    variant={
                                        draft.status === 'ready'
                                            ? 'default'
                                            : draft.status === 'review'
                                                ? 'secondary'
                                                : 'outline'
                                    }
                                >
                                    {draft.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </>
    )
}
