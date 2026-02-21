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
        <div className="p-8">
            <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-white">Dashboard</h2>
                <p className="mt-1 text-white/50">
                    Welcome back. Here's your email program overview.
                </p>
            </div>

            {/* Stats grid */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-10">
                {stats.map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-white/[0.08] bg-[#1e293b] p-5">
                        <p className="text-sm font-medium text-white/50">{stat.label}</p>
                        <p className="mt-2 text-3xl font-bold text-white">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Recent drafts */}
            <div className="rounded-xl border border-white/[0.08] bg-[#1e293b]">
                <div className="border-b border-white/[0.06] px-6 py-4">
                    <h3 className="text-base font-semibold text-white">Recent Drafts</h3>
                </div>
                <div className="p-4 space-y-2">
                    {recentDrafts.map((draft) => (
                        <div
                            key={draft.id}
                            className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-5 py-4 transition-colors hover:bg-white/[0.04] cursor-pointer"
                        >
                            <div>
                                <p className="font-medium text-sm text-white">{draft.subject}</p>
                                <p className="text-xs text-white/40 mt-0.5">{draft.date}</p>
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
            </div>
        </div>
    )
}

