import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { HugeiconsIcon } from '@hugeicons/react'
import {
    ArrowDown01Icon,
    ArrowUp01Icon,
    Calendar03Icon,
    CheckmarkBadge01Icon,
    Clock01Icon,
    Comment01Icon,
    FlashIcon,
    Mail01Icon,
    MoreHorizontalIcon,
    PencilEdit01Icon,
    ViewIcon,
} from '@hugeicons/core-free-icons'
import { type Draft, type DraftStatus, DRAFT_STATUS_CONFIG } from '@/types/draft'

// ── Status order for swimlanes ──
const STATUS_ORDER: DraftStatus[] = [
    'pending_review',
    'revision_requested',
    'approved',
    'scheduled',
    'sent',
]

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    })
}

function formatWeek(weekOf: string) {
    const start = new Date(weekOf)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    const fmt = (d: Date) =>
        d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${fmt(start)} – ${fmt(end)}`
}

export default function DraftsPage() {
    const { user, loading: authLoading } = useAuth()
    const navigate = useNavigate()
    const [drafts, setDrafts] = useState<Draft[]>([])
    const [loadingDrafts, setLoadingDrafts] = useState(true)
    const [collapsedSections, setCollapsedSections] = useState<Set<DraftStatus>>(new Set(['sent']))
    const [dropDay, setDropDay] = useState('Thursday')

    // ── Fetch drafts from Supabase ──
    useEffect(() => {
        if (authLoading || !user) return

        const fetchDrafts = async () => {
            setLoadingDrafts(true)
            const { data, error } = await supabase
                .from('email_drafts')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching drafts:', error)
            } else {
                setDrafts((data || []) as Draft[])
            }
            setLoadingDrafts(false)
        }

        fetchDrafts()
    }, [user, authLoading])

    // ── Fetch delivery day ──
    useEffect(() => {
        if (authLoading || !user) return
        const fetchDay = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('delivery_days')
                .eq('id', user.id)
                .maybeSingle()
            if (data?.delivery_days?.length) {
                const day = data.delivery_days[0]
                setDropDay(day.charAt(0).toUpperCase() + day.slice(1))
            }
        }
        fetchDay()
    }, [user, authLoading])

    const toggleSection = (status: DraftStatus) => {
        setCollapsedSections(prev => {
            const next = new Set(prev)
            if (next.has(status)) next.delete(status)
            else next.add(status)
            return next
        })
    }

    // Group drafts by status
    const grouped = STATUS_ORDER.reduce((acc, status) => {
        acc[status] = drafts.filter(d => d.status === status)
        return acc
    }, {} as Record<DraftStatus, Draft[]>)

    const totalDrafts = drafts.length
    const pendingCount = grouped.pending_review.length + grouped.revision_requested.length

    // ── Loading skeleton ──
    if (loadingDrafts || authLoading) {
        return (
            <div className="h-full overflow-y-auto">
                <div className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#111827]/95 px-8 py-5 backdrop-blur-sm">
                    <div className="h-6 w-36 animate-pulse rounded bg-white/[0.06]" />
                    <div className="mt-2 h-4 w-56 animate-pulse rounded bg-white/[0.04]" />
                </div>
                <div className="px-8 py-6 space-y-2">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="rounded-xl border border-white/[0.06] bg-[#1e293b]/50 overflow-hidden">
                            <div className="flex items-center gap-3 px-5 py-3.5">
                                <div className="h-4 w-4 animate-pulse rounded bg-white/[0.06]" />
                                <div className="h-4 w-28 animate-pulse rounded bg-white/[0.06]" style={{ animationDelay: `${i * 100}ms` }} />
                                <div className="h-5 w-5 animate-pulse rounded-full bg-white/[0.06]" />
                            </div>
                            {i < 2 && (
                                <div className="border-t border-white/[0.04] space-y-0">
                                    {[...Array(2)].map((_, j) => (
                                        <div key={j} className="flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.04] last:border-b-0">
                                            <div className="h-2 w-2 animate-pulse rounded-full bg-white/[0.06]" />
                                            <div className="flex-1 space-y-1.5">
                                                <div className="h-4 w-3/4 animate-pulse rounded bg-white/[0.06]" style={{ animationDelay: `${(i * 2 + j) * 80}ms` }} />
                                                <div className="h-3 w-1/2 animate-pulse rounded bg-white/[0.04]" />
                                            </div>
                                            <div className="h-3 w-20 animate-pulse rounded bg-white/[0.04]" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="h-full overflow-y-auto">
            {/* ── Header ── */}
            <div className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#111827]/95 px-8 py-5 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-white" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                            Email Drafts
                        </h1>
                        <p className="mt-1 text-sm text-white/40">
                            {pendingCount > 0
                                ? `${pendingCount} draft${pendingCount > 1 ? 's' : ''} awaiting your review`
                                : 'All caught up — no drafts need review'}
                            {' · '}{totalDrafts} total
                        </p>
                    </div>
                </div>
            </div>
            <div className="px-8 py-6 space-y-2">
                {STATUS_ORDER.map(status => {
                    const config = DRAFT_STATUS_CONFIG[status]
                    const drafts = grouped[status]
                    const isCollapsed = collapsedSections.has(status)

                    return (
                        <div key={status} className="rounded-xl border border-white/[0.06] bg-[#1e293b]/50 overflow-hidden">
                            {/* Section header */}
                            <button
                                onClick={() => toggleSection(status)}
                                className="flex w-full items-center justify-between px-5 py-3.5 transition-colors hover:bg-white/[0.03] cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <HugeiconsIcon
                                        icon={isCollapsed ? ArrowDown01Icon : ArrowUp01Icon}
                                        className="h-4 w-4 text-white/30"
                                    />
                                    <span className="text-sm">{config.emoji}</span>
                                    <span className={`text-sm font-semibold ${config.color}`}>
                                        {config.label}
                                    </span>
                                    <span className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${config.bgColor} ${config.color}`}>
                                        {drafts.length}
                                    </span>
                                </div>
                            </button>

                            {/* Drafts list */}
                            {!isCollapsed && drafts.length > 0 && (
                                <div className="border-t border-white/[0.04]">
                                    {drafts.map((draft, idx) => (
                                        <div
                                            key={draft.id}
                                            onClick={() => navigate(`/dashboard/drafts/${draft.id}/edit`)}
                                            className={`group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.03] cursor-pointer ${idx < drafts.length - 1 ? 'border-b border-white/[0.04]' : ''
                                                }`}
                                        >
                                            {/* Status dot */}
                                            <div className={`h-2 w-2 shrink-0 rounded-full ${config.bgColor.replace('/10', '')}`} />

                                            {/* Subject & meta */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="truncate text-sm font-medium text-white">
                                                        {draft.subject_line}
                                                    </p>
                                                    {draft.draft_type === 'rapid_response' && (
                                                        <Badge variant="outline" className="shrink-0 border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] px-1.5 py-0">
                                                            <HugeiconsIcon icon={FlashIcon} className="mr-0.5 h-2.5 w-2.5" />
                                                            Rapid
                                                        </Badge>
                                                    )}
                                                </div>
                                                {draft.preview_text && (
                                                    <p className="mt-0.5 truncate text-xs text-white/30">
                                                        {draft.preview_text}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Comments indicator */}
                                            {draft.user_comments && (
                                                <div className="flex items-center gap-1 text-orange-400/70" title={draft.user_comments}>
                                                    <HugeiconsIcon icon={Comment01Icon} className="h-3.5 w-3.5" />
                                                </div>
                                            )}

                                            {/* Alt subjects count */}
                                            {draft.alt_subject_lines && draft.alt_subject_lines.length > 0 && (
                                                <span className="shrink-0 text-[10px] font-medium text-white/20">
                                                    +{draft.alt_subject_lines.length} A/B
                                                </span>
                                            )}

                                            {/* Week */}
                                            <div className="flex shrink-0 items-center gap-1.5 text-xs text-white/25">
                                                <HugeiconsIcon icon={Calendar03Icon} className="h-3 w-3" />
                                                {formatWeek(draft.week_of)}
                                            </div>

                                            {/* Created date */}
                                            <span className="shrink-0 text-xs text-white/20">
                                                {formatDate(draft.created_at)}
                                            </span>

                                            {/* Actions (visible on hover) */}
                                            <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                {status === 'pending_review' && (
                                                    <>
                                                        <button className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-emerald-400" title="Approve">
                                                            <HugeiconsIcon icon={CheckmarkBadge01Icon} className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-orange-400" title="Request Revision">
                                                            <HugeiconsIcon icon={PencilEdit01Icon} className="h-3.5 w-3.5" />
                                                        </button>
                                                    </>
                                                )}
                                                {status === 'revision_requested' && (
                                                    <button className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white" title="View Comments">
                                                        <HugeiconsIcon icon={Comment01Icon} className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                                {status === 'approved' && (
                                                    <button className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-blue-400" title="Schedule">
                                                        <HugeiconsIcon icon={Clock01Icon} className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                                <button className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white" title="Preview">
                                                    <HugeiconsIcon icon={ViewIcon} className="h-3.5 w-3.5" />
                                                </button>
                                                <button className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white" title="More">
                                                    <HugeiconsIcon icon={MoreHorizontalIcon} className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Empty state */}
                            {!isCollapsed && drafts.length === 0 && (
                                <div className="border-t border-white/[0.04] px-5 py-6 text-center">
                                    <p className="text-xs text-white/20">No drafts in this stage</p>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* ── Drop Day Info ── */}
            <div className="mx-8 mb-8 rounded-xl border border-white/[0.06] bg-gradient-to-r from-[#e8614d]/5 to-transparent p-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8614d]/10">
                        <HugeiconsIcon icon={Mail01Icon} className="h-4 w-4 text-[#e8614d]" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white/80">The {dropDay} Drop</p>
                        <p className="text-xs text-white/30">
                            New drafts are generated every {dropDay} at 6:00 AM CT based on your subscription tier.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
