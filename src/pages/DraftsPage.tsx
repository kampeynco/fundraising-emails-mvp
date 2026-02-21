import { Badge } from '@/components/ui/badge'
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
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Email Drafts</h2>
                    <p className="mt-1 text-white/50">
                        Review, approve, and track your fundraising emails.
                    </p>
                </div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#1e293b] overflow-hidden">
                <div className="border-b border-white/[0.06] px-6 py-4">
                    <h3 className="text-base font-semibold text-white">All Drafts</h3>
                </div>
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/[0.06]">
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">Subject</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">Created</th>
                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-white/40">Open Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockDrafts.map((draft) => (
                            <tr key={draft.id} className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.03] cursor-pointer">
                                <td className="px-6 py-4 text-sm font-medium text-white">{draft.subject}</td>
                                <td className="px-6 py-4">
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
                                </td>
                                <td className="px-6 py-4 text-sm text-white/40">{draft.created}</td>
                                <td className="px-6 py-4 text-right text-sm text-white/60">{draft.opens}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

