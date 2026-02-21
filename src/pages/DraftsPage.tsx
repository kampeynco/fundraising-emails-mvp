import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

const mockDrafts = [
    { id: 1, subject: 'End-of-Quarter Push — Match Deadline', status: 'ready', created: '2026-02-20', opens: '—' },
    { id: 2, subject: 'Welcome Series — Email 3 of 5', status: 'review', created: '2026-02-19', opens: '—' },
    { id: 3, subject: 'Debate Response — Urgent Ask', status: 'sent', created: '2026-02-18', opens: '42.1%' },
    { id: 4, subject: 'Monthly Recurring Donor Thank You', status: 'sent', created: '2026-02-15', opens: '51.3%' },
    { id: 5, subject: 'FEC Deadline Countdown — 48hrs Left', status: 'sent', created: '2026-02-12', opens: '38.7%' },
]

export default function DraftsPage() {
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
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Email Drafts</h2>
                        <p className="text-muted-foreground mt-1">Review, approve, and track your fundraising emails.</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All Drafts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Open Rate</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mockDrafts.map((draft) => (
                                    <TableRow key={draft.id}>
                                        <TableCell className="font-medium">{draft.subject}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    draft.status === 'ready' ? 'default' :
                                                        draft.status === 'review' ? 'secondary' : 'outline'
                                                }
                                            >
                                                {draft.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{draft.created}</TableCell>
                                        <TableCell className="text-right">{draft.opens}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
