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
import type { Draft } from '@/types/draft'

const mockDrafts: Draft[] = [
    { id: 1, subject: 'End-of-Quarter Push — Match Deadline', status: 'ready', created: '2026-02-20', opens: '—' },
    { id: 2, subject: 'Welcome Series — Email 3 of 5', status: 'review', created: '2026-02-19', opens: '—' },
    { id: 3, subject: 'Debate Response — Urgent Ask', status: 'sent', created: '2026-02-18', opens: '42.1%' },
    { id: 4, subject: 'Monthly Recurring Donor Thank You', status: 'sent', created: '2026-02-15', opens: '51.3%' },
    { id: 5, subject: 'FEC Deadline Countdown — 48hrs Left', status: 'sent', created: '2026-02-12', opens: '38.7%' },
]

export default function DraftsPage() {
    return (
        <>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Email Drafts</h2>
                    <p className="text-muted-foreground mt-1">
                        Review, approve, and track your fundraising emails.
                    </p>
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
                                                draft.status === 'ready'
                                                    ? 'default'
                                                    : draft.status === 'review'
                                                        ? 'secondary'
                                                        : 'outline'
                                            }
                                        >
                                            {draft.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {draft.created}
                                    </TableCell>
                                    <TableCell className="text-right">{draft.opens}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    )
}
