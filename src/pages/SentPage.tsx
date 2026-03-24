import { useState, useEffect } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
    Calendar03Icon,
    FlashIcon,
    ViewIcon,
    Mail01Icon,
} from '@hugeicons/core-free-icons'
import { Badge } from '@/components/ui/badge'
import { type Draft } from '@/types/draft'
import { formatDate, formatWeek } from '@/lib/dates'

interface SentContext {
    drafts: Draft[]
    draftsLoading: boolean
    activeSentMonth: string | null
}

export default function SentPage() {
    const { drafts, draftsLoading, activeSentMonth } = useOutletContext<SentContext>()
    const [previewDraft, setPreviewDraft] = useState<Draft | null>(null)

    // Close preview modal on Escape
    useEffect(() => {
        if (!previewDraft) return
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setPreviewDraft(null) }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [previewDraft])

    const sentDrafts = drafts.filter(d => d.status === 'sent')

    // Filter by selected month (YYYY-MM) — use updated_at as "sent date"
    const filteredDrafts = activeSentMonth
        ? sentDrafts.filter(d => {
            const date = new Date(d.updated_at)
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            return key === activeSentMonth
        })
        : sentDrafts

    // Display month label in header
    const selectedMonthLabel = activeSentMonth
        ? new Date(`${activeSentMonth}-01T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : null

    // ── Loading skeleton ──
    if (draftsLoading) {
        return (
            <div className="h-full overflow-y-auto">
                <div className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#111827]/95 px-8 py-5 backdrop-blur-sm">
                    <div className="h-6 w-36 animate-pulse rounded bg-white/[0.06]" />
                    <div className="mt-2 h-4 w-56 animate-pulse rounded bg-white/[0.04]" />
                </div>
                <div className="px-8 py-6 space-y-2">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-[#1e293b]/50 px-5 py-3.5">
                            <div className="h-2 w-2 animate-pulse rounded-full bg-white/[0.06]" />
                            <div className="flex-1 space-y-1.5">
                                <div className="h-4 w-3/4 animate-pulse rounded bg-white/[0.06]" style={{ animationDelay: `${i * 80}ms` }} />
                                <div className="h-3 w-1/2 animate-pulse rounded bg-white/[0.04]" />
                            </div>
                            <div className="h-3 w-20 animate-pulse rounded bg-white/[0.04]" />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // ── Global empty state (no sent drafts at all) ──
    if (sentDrafts.length === 0) {
        return (
            <div className="flex h-full flex-col">
                <div className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#111827]/95 px-8 py-5 backdrop-blur-sm">
                    <h1 className="text-xl font-semibold text-white" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                        Sent
                    </h1>
                </div>
                <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04]">
                        <HugeiconsIcon icon={Mail01Icon} size={28} className="text-white/20" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium text-white/50">No sent emails yet</p>
                        <p className="mt-1 text-xs text-white/25">Emails will appear here once they've been sent.</p>
                    </div>
                    <Link
                        to="/dashboard/drafts"
                        className="mt-2 rounded-lg bg-brand/10 px-4 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand/20"
                    >
                        Go to Drafts
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="h-full overflow-y-auto">
                {/* ── Header ── */}
                <div className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#111827]/95 px-8 py-5 backdrop-blur-sm">
                    <h1 className="text-xl font-semibold text-white" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                        {selectedMonthLabel ?? 'Sent'}
                    </h1>
                    <p className="mt-1 text-sm text-white/40">
                        {filteredDrafts.length === 0
                            ? 'No emails sent this month'
                            : `${filteredDrafts.length} email${filteredDrafts.length !== 1 ? 's' : ''} sent`}
                    </p>
                </div>

                {/* ── Month-specific empty state ── */}
                {filteredDrafts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04]">
                            <HugeiconsIcon icon={Calendar03Icon} size={24} className="text-white/20" />
                        </div>
                        <p className="mt-4 text-sm text-white/40">
                            No emails sent in {selectedMonthLabel}
                        </p>
                    </div>
                ) : (
                    <div className="px-8 py-6">
                        <div className="rounded-xl border border-white/[0.06] bg-[#1e293b]/50 overflow-hidden">
                            {filteredDrafts.map((draft, idx) => (
                                <div
                                    key={draft.id}
                                    onClick={() => draft.google_doc_url
                                        ? window.open(draft.google_doc_url, '_blank')
                                        : setPreviewDraft(draft)
                                    }
                                    className={`group flex items-center gap-4 px-5 py-3.5 transition-colors cursor-pointer hover:bg-white/[0.03] ${idx < filteredDrafts.length - 1 ? 'border-b border-white/[0.04]' : ''}`}
                                >
                                    {/* Status dot */}
                                    <div className="h-2 w-2 shrink-0 rounded-full bg-white/20" />

                                    {/* Subject & meta */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="truncate text-sm font-medium text-white/70">
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
                                            <p className="mt-0.5 truncate text-xs text-white/25">
                                                {draft.preview_text}
                                            </p>
                                        )}
                                    </div>

                                    {/* Alt subjects count */}
                                    {draft.alt_subject_lines && draft.alt_subject_lines.length > 0 && (
                                        <span className="shrink-0 text-[10px] font-medium text-white/20">
                                            +{draft.alt_subject_lines.length} A/B
                                        </span>
                                    )}

                                    {/* Week */}
                                    <div className="flex shrink-0 items-center gap-1.5 text-xs text-white/20">
                                        <HugeiconsIcon icon={Calendar03Icon} className="h-3 w-3" />
                                        {formatWeek(draft.week_of)}
                                    </div>

                                    {/* Sent date */}
                                    <span className="shrink-0 text-xs text-white/20">
                                        {formatDate(draft.updated_at)}
                                    </span>

                                    {/* Preview action */}
                                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setPreviewDraft(draft) }}
                                            className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                                            title="Preview"
                                        >
                                            <HugeiconsIcon icon={ViewIcon} className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

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
