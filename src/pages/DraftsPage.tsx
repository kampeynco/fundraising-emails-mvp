import { useState, useEffect } from 'react'
import { useSearchParams, useOutletContext } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { useAuthContext } from '@/providers/AuthProvider'
import { insforge } from '@/lib/insforge'
import { formatDate, formatWeek } from '@/lib/dates'
import { HugeiconsIcon } from '@hugeicons/react'
import {
    ArrowDown01Icon,
    ArrowUp01Icon,
    Calendar03Icon,
    CheckmarkBadge01Icon,
    Clock01Icon,
    Comment01Icon,
    FlashIcon,
    MoreHorizontalIcon,
    PencilEdit01Icon,
    ViewIcon,
} from '@hugeicons/core-free-icons'
import { type Draft, type DraftStatus, DRAFT_STATUS_CONFIG } from '@/types/draft'
import { NewDraftDialog } from '@/components/drafts/NewDraftDialog'

// ── Status order for swimlanes ──
const STATUS_ORDER: DraftStatus[] = [
    'pending_review',
    'revision_requested',
    'approved',
    'scheduled',
]

interface DraftsContext {
    drafts: Draft[]
    setDrafts: React.Dispatch<React.SetStateAction<Draft[]>>
    draftsLoading: boolean
}

export default function DraftsPage() {
    const { user, loading: authLoading } = useAuthContext()
    const { drafts, setDrafts, draftsLoading } = useOutletContext<DraftsContext>()
    const [searchParams, setSearchParams] = useSearchParams()
    const [collapsedSections, setCollapsedSections] = useState<Set<DraftStatus>>(new Set())
    const [showNewDraft, setShowNewDraft] = useState(false)
    const [previewDraft, setPreviewDraft] = useState<Draft | null>(null)

    // Close preview modal on Escape
    useEffect(() => {
        if (!previewDraft) return
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setPreviewDraft(null) }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [previewDraft])

    // Auto-open dialog from sidebar ?new=regular param
    useEffect(() => {
        const newParam = searchParams.get('new')
        if (newParam === 'regular' || newParam === 'rapid') {
            setShowNewDraft(true)
            searchParams.delete('new')
            setSearchParams(searchParams, { replace: true })
        }
    }, [searchParams, setSearchParams])

    const updateDraftStatus = async (draftId: string, newStatus: DraftStatus, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!user) return
        const prevStatus = drafts.find(d => d.id === draftId)?.status
        setDrafts(prev => prev.map(d => d.id === draftId ? { ...d, status: newStatus } : d))
        const { error } = await insforge.database
            .from('email_drafts')
            .update({ status: newStatus })
            .eq('id', draftId)
            .eq('user_id', user.id)
        if (error) {
            console.error('Failed to update draft status:', error)
            if (prevStatus) {
                setDrafts(prev => prev.map(d => d.id === draftId ? { ...d, status: prevStatus } : d))
            }
        }
    }

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
    if (draftsLoading || authLoading) {
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
        <>
            <div className="h-full overflow-y-auto">
                {/* ── Header ── */}
                <div className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#111827]/95 px-8 py-5 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-xl font-semibold text-white" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                                    Email Drafts
                                </h1>
                                <div className="group relative">
                                    <span className="inline-flex cursor-default items-center gap-1.5 rounded-full border border-brand/25 bg-brand/10 px-2.5 py-0.5 text-[11px] font-medium text-brand/80 transition-colors group-hover:border-brand/40 group-hover:bg-brand/15 group-hover:text-brand">
                                        ✦ The Weekly Drop
                                    </span>
                                    <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-lg border border-white/[0.08] bg-[#0f1724] px-3 py-2.5 opacity-0 shadow-xl transition-all duration-150 group-hover:opacity-100">
                                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-2.5 w-2.5 rotate-45 rounded-sm border-l border-t border-white/[0.08] bg-[#0f1724]" />
                                        <p className="text-xs leading-relaxed text-white/50">
                                            New drafts are generated every <span className="font-medium text-white/70">Thursday</span> at 6:00 AM CT based on your subscription tier.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <p className="mt-1 text-sm text-white/40">
                                {pendingCount > 0
                                    ? `${pendingCount} draft${pendingCount > 1 ? 's' : ''} awaiting your review`
                                    : 'All caught up — no drafts need review'}
                                {' · '}{totalDrafts} total
                            </p>
                        </div>

                        {/* New Draft button */}
                        <button
                            onClick={() => setShowNewDraft(true)}
                            className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/80 active:scale-[0.98]"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            New Draft
                        </button>
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
                                                onClick={() => draft.google_doc_url && window.open(draft.google_doc_url, '_blank')}
                                                className={`group flex items-center gap-4 px-5 py-3.5 transition-colors ${draft.google_doc_url ? 'hover:bg-white/[0.03] cursor-pointer' : 'cursor-default opacity-60'} ${idx < drafts.length - 1 ? 'border-b border-white/[0.04]' : ''
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
                                                            <button onClick={(e) => updateDraftStatus(draft.id, 'approved', e)} className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-emerald-400" title="Approve">
                                                                <HugeiconsIcon icon={CheckmarkBadge01Icon} className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button onClick={(e) => updateDraftStatus(draft.id, 'revision_requested', e)} className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-orange-400" title="Request Revision">
                                                                <HugeiconsIcon icon={PencilEdit01Icon} className="h-3.5 w-3.5" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {status === 'revision_requested' && (
                                                        <button onClick={(e) => { e.stopPropagation(); draft.google_doc_url && window.open(draft.google_doc_url, '_blank') }} className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white" title="View Comments">
                                                            <HugeiconsIcon icon={Comment01Icon} className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                    {status === 'approved' && (
                                                        <button onClick={(e) => updateDraftStatus(draft.id, 'scheduled', e)} className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-blue-400" title="Schedule">
                                                            <HugeiconsIcon icon={Clock01Icon} className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                    <button onClick={(e) => { e.stopPropagation(); setPreviewDraft(draft) }} className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white" title="Preview">
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

            </div>

            <NewDraftDialog open={showNewDraft} onOpenChange={setShowNewDraft} />

            {/* ── Email Preview Modal ── */}
            {previewDraft && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                    onClick={() => setPreviewDraft(null)}
                >
                    <div
                        className="relative flex h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-white/[0.08] bg-[#111827] shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div className="flex items-start justify-between border-b border-white/[0.06] px-6 py-4">
                            <div className="min-w-0 flex-1 pr-4">
                                <p className="truncate text-sm font-semibold text-white">{previewDraft.subject_line}</p>
                                <p className="mt-0.5 text-xs text-white/40">{previewDraft.preview_text}</p>
                            </div>
                            <button
                                onClick={() => setPreviewDraft(null)}
                                className="shrink-0 rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        {/* Sandboxed iframe — prevents XSS from AI-generated HTML */}
                        <div className="min-h-0 flex-1 overflow-hidden rounded-b-2xl bg-white">
                            {previewDraft.body_html ? (
                                <iframe
                                    sandbox=""
                                    srcDoc={previewDraft.body_html}
                                    className="h-full w-full border-0"
                                    title="Email preview"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center">
                                    <p className="text-sm text-gray-400">No HTML preview available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
