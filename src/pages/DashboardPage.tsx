import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { useAuthContext } from '@/providers/AuthProvider'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/dates'
import { type Draft } from '@/types/draft'
import { HugeiconsIcon } from '@hugeicons/react'
import {
    LicenseDraftIcon,
    SentIcon,
    ChartRoseIcon,
    PercentIcon,
    FlashIcon,
    CheckmarkBadge01Icon,
    Clock01Icon,
} from '@hugeicons/core-free-icons'

interface DraftStats {
    totalDrafts: number
    sentThisMonth: number
    pendingReview: number
    approvalRate: number
}

interface TopicStat {
    topic: string
    total: number
    approved: number
    rate: number
}

interface TemplateStat {
    template: string
    total: number
    approved: number
    rate: number
}

interface RecentDraft {
    id: string
    subject_line: string
    status: string
    draft_type: string
    created_at: string
    google_doc_url?: string | null
}

interface DashboardContext {
    drafts: Draft[]
    draftsLoading: boolean
}

export default function DashboardPage() {
    const { user } = useAuthContext()
    const { drafts, draftsLoading } = useOutletContext<DashboardContext>()
    const [stats, setStats] = useState<DraftStats>({ totalDrafts: 0, sentThisMonth: 0, pendingReview: 0, approvalRate: 0 })
    const [topicStats, setTopicStats] = useState<TopicStat[]>([])
    const [templateStats, setTemplateStats] = useState<TemplateStat[]>([])
    const [recentDrafts, setRecentDrafts] = useState<RecentDraft[]>([])
    const loading = draftsLoading

    // Derive stats + recent drafts from shared context whenever drafts change
    useEffect(() => {
        if (draftsLoading) return

        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        const sentThisMonth = drafts.filter(d => d.status === 'sent' && d.created_at >= monthStart).length
        const pendingReview = drafts.filter(d => ['pending_review', 'revision_requested'].includes(d.status)).length
        const completed = drafts.filter(d => ['sent', 'approved', 'scheduled'].includes(d.status)).length
        const approvalRate = drafts.length > 0 ? Math.round((completed / drafts.length) * 100) : 0

        setStats({ totalDrafts: drafts.length, sentThisMonth, pendingReview, approvalRate })

        setRecentDrafts(drafts.slice(0, 5).map(d => ({
            id: d.id,
            subject_line: d.subject_line || 'Untitled Draft',
            status: d.status,
            draft_type: d.draft_type,
            created_at: d.created_at,
            google_doc_url: d.google_doc_url,
        })))

        const templateMap = new Map<string, { total: number; approved: number }>()
        ;(['weekly', 'rapid_response'] as const).forEach(t => {
            const subset = drafts.filter(d => d.draft_type === t)
            const approved = subset.filter(d => ['sent', 'approved', 'scheduled'].includes(d.status)).length
            if (subset.length > 0) templateMap.set(t, { total: subset.length, approved })
        })
        setTemplateStats(
            Array.from(templateMap.entries())
                .map(([template, v]) => ({
                    template: template === 'weekly' ? 'Weekly Draft' : 'Rapid Response',
                    total: v.total,
                    approved: v.approved,
                    rate: Math.round((v.approved / v.total) * 100),
                }))
                .sort((a, b) => b.rate - a.rate)
        )
    }, [drafts, draftsLoading])

    // Topic metrics still fetched locally (not part of draft data)
    useEffect(() => {
        if (!user) return
        const fetchTopics = async () => {
            const { data: topics } = await supabase
                .from('topic_metrics')
                .select('topic, status')
                .eq('user_id', user.id)

            if (topics?.length) {
                const topicMap = new Map<string, { total: number; approved: number }>()
                ;(topics as Array<{ topic: string; status: string }>).forEach((t) => {
                    const existing = topicMap.get(t.topic) || { total: 0, approved: 0 }
                    existing.total++
                    if (['sent', 'approved', 'scheduled'].includes(t.status)) existing.approved++
                    topicMap.set(t.topic, existing)
                })
                setTopicStats(
                    Array.from(topicMap.entries())
                        .map(([topic, v]) => ({
                            topic,
                            total: v.total,
                            approved: v.approved,
                            rate: v.total > 0 ? Math.round((v.approved / v.total) * 100) : 0,
                        }))
                        .sort((a, b) => b.rate - a.rate)
                        .slice(0, 8)
                )
            }
        }
        fetchTopics()
    }, [user])

    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
        pending_review: { label: 'Review', variant: 'secondary' },
        approved: { label: 'Approved', variant: 'default' },
        sent: { label: 'Sent', variant: 'outline' },
        scheduled: { label: 'Scheduled', variant: 'default' },
        revision_requested: { label: 'Revision', variant: 'destructive' },
    }

    const statCards = [
        { label: 'Total Drafts', value: stats.totalDrafts.toString(), icon: LicenseDraftIcon, color: 'text-blue-400' },
        { label: 'Sent This Month', value: stats.sentThisMonth.toString(), icon: SentIcon, color: 'text-emerald-400' },
        { label: 'Pending Review', value: stats.pendingReview.toString(), icon: Clock01Icon, color: 'text-amber-400' },
        { label: 'Approval Rate', value: `${stats.approvalRate}%`, icon: PercentIcon, color: 'text-brand' },
    ]

    return (
        <div className="h-full overflow-y-auto">
            <div className="p-8">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold tracking-tight text-white" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                        Dashboard
                    </h2>
                    <p className="mt-1 text-white/50">
                        Welcome back. Here's your email program overview.
                    </p>
                </div>

                {/* Stats grid */}
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-10">
                    {statCards.map((stat) => (
                        <div key={stat.label} className="rounded-xl border border-white/[0.08] bg-[#1e293b] p-5">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-white/50">{stat.label}</p>
                                <HugeiconsIcon icon={stat.icon} size={18} className={stat.color} />
                            </div>
                            <p className="mt-2 text-3xl font-bold text-white">
                                {loading ? '—' : stat.value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Analytics Row */}
                <div className="grid gap-6 lg:grid-cols-2 mb-10">
                    {/* Topic Performance */}
                    <div className="rounded-xl border border-white/[0.08] bg-[#1e293b]">
                        <div className="flex items-center gap-2 border-b border-white/[0.06] px-6 py-4">
                            <HugeiconsIcon icon={ChartRoseIcon} size={16} className="text-brand" />
                            <h3 className="text-base font-semibold text-white">Topic Performance</h3>
                        </div>
                        <div className="p-4">
                            {loading ? (
                                <p className="py-8 text-center text-sm text-white/30">Loading...</p>
                            ) : topicStats.length === 0 ? (
                                <p className="py-8 text-center text-sm text-white/30">
                                    No topic data yet — topics will appear as drafts are generated.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {topicStats.map((t) => (
                                        <div key={t.topic} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-sm font-medium text-white">{t.topic}</p>
                                                <span className={`text-xs font-semibold ${t.rate >= 70 ? 'text-emerald-400' : t.rate >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                                                    {t.rate}%
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full rounded-full bg-white/[0.06]">
                                                <div
                                                    className={`h-1.5 rounded-full transition-all ${t.rate >= 70 ? 'bg-emerald-500' : t.rate >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                    style={{ width: `${t.rate}%` }}
                                                />
                                            </div>
                                            <p className="mt-1.5 text-[11px] text-white/30">
                                                {t.approved} approved of {t.total} drafts
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Format Effectiveness */}
                    <div className="rounded-xl border border-white/[0.08] bg-[#1e293b]">
                        <div className="flex items-center gap-2 border-b border-white/[0.06] px-6 py-4">
                            <HugeiconsIcon icon={CheckmarkBadge01Icon} size={16} className="text-emerald-400" />
                            <h3 className="text-base font-semibold text-white">Format Effectiveness</h3>
                        </div>
                        <div className="p-4">
                            {loading ? (
                                <p className="py-8 text-center text-sm text-white/30">Loading...</p>
                            ) : templateStats.length === 0 ? (
                                <p className="py-8 text-center text-sm text-white/30">
                                    No format data yet — stats appear after drafts are generated.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {templateStats.map((t) => (
                                        <div key={t.template} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    {t.template === 'Rapid Response' && (
                                                        <HugeiconsIcon icon={FlashIcon} size={14} className="text-amber-400" />
                                                    )}
                                                    <p className="text-sm font-medium text-white">{t.template}</p>
                                                </div>
                                                <span className={`text-xs font-semibold ${t.rate >= 70 ? 'text-emerald-400' : t.rate >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                                                    {t.rate}% approval
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full rounded-full bg-white/[0.06]">
                                                <div
                                                    className={`h-1.5 rounded-full transition-all ${t.rate >= 70 ? 'bg-emerald-500' : t.rate >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                    style={{ width: `${t.rate}%` }}
                                                />
                                            </div>
                                            <p className="mt-1.5 text-[11px] text-white/30">
                                                {t.approved} approved of {t.total} total
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent drafts */}
                <div className="rounded-xl border border-white/[0.08] bg-[#1e293b]">
                    <div className="border-b border-white/[0.06] px-6 py-4">
                        <h3 className="text-base font-semibold text-white">Recent Drafts</h3>
                    </div>
                    <div className="p-4 space-y-2">
                        {loading ? (
                            <p className="py-6 text-center text-sm text-white/30">Loading...</p>
                        ) : recentDrafts.length === 0 ? (
                            <p className="py-6 text-center text-sm text-white/30">No drafts yet.</p>
                        ) : (
                            recentDrafts.map((draft) => {
                                const cfg = statusConfig[draft.status] || { label: draft.status, variant: 'outline' as const }
                                return (
                                    <div
                                        key={draft.id}
                                        onClick={() => draft.google_doc_url && window.open(draft.google_doc_url, '_blank')}
                                        className={`flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-5 py-4 transition-colors ${draft.google_doc_url ? 'hover:bg-white/[0.04] cursor-pointer' : 'cursor-default opacity-60'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {draft.draft_type === 'rapid_response' && (
                                                <HugeiconsIcon icon={FlashIcon} size={14} className="text-amber-400" />
                                            )}
                                            <div>
                                                <p className="font-medium text-sm text-white">{draft.subject_line}</p>
                                                <p className="text-xs text-white/40 mt-0.5">{formatDate(draft.created_at)}</p>
                                            </div>
                                        </div>
                                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
