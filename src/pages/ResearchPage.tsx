import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import {
    Add01Icon,
    CheckmarkBadge01Icon,
    Delete02Icon,
    Globe02Icon,
    Search01Icon,
    SparklesIcon,
    TextIcon,
} from '@hugeicons/core-free-icons'

interface ResearchTopic {
    id: string
    title: string
    summary: string
    source_url: string
    source_domain: string
    content_snippet: string
    relevance_score: number
    suggested_by: 'user' | 'ai'
    used_in_draft: boolean
    created_at: string
}

// ── Mock data ──
const mockTopics: ResearchTopic[] = [
    {
        id: 'topic-1',
        title: 'FEC Q1 Filing Deadline Approaching for All Federal Committees',
        summary: 'All federal committees must file their Q1 reports by April 15, 2026. This deadline is a critical fundraising moment.',
        source_url: 'https://www.fec.gov/updates/quarterly-filing-dates/',
        source_domain: 'fec.gov',
        content_snippet: 'Federal Election Commission reminds all campaign committees that quarterly reports for Q1 2026 are due by April 15.',
        relevance_score: 9.2,
        suggested_by: 'ai',
        used_in_draft: false,
        created_at: '2026-02-21T10:00:00Z',
    },
    {
        id: 'topic-2',
        title: 'Small Dollar Fundraising Hits Record Numbers in 2026 Cycle',
        summary: 'Average small-dollar donations are up 23% compared to the same period in 2024, driven by digital-first campaigns.',
        source_url: 'https://www.politico.com/fundraising-trends-2026',
        source_domain: 'politico.com',
        content_snippet: 'Small-dollar donors — those giving under $200 — are making up a larger share of total fundraising than ever before.',
        relevance_score: 7.8,
        suggested_by: 'ai',
        used_in_draft: false,
        created_at: '2026-02-20T14:00:00Z',
    },
    {
        id: 'topic-3',
        title: 'New Data: Email Open Rates Highest on Tuesdays and Thursdays',
        summary: 'Campaign email analytics reveal optimal send times for fundraising asks, with Tuesday evenings showing highest engagement.',
        source_url: 'https://www.axios.com/email-open-rates-campaigns',
        source_domain: 'axios.com',
        content_snippet: 'Campaigns that send fundraising appeals between 6-8pm on Tuesdays see 18% higher open rates than the daily average.',
        relevance_score: 6.5,
        suggested_by: 'ai',
        used_in_draft: true,
        created_at: '2026-02-19T09:00:00Z',
    },
    {
        id: 'topic-4',
        title: 'Infrastructure Bill Vote Expected Next Week — Key Talking Point',
        summary: 'Congress is set to vote on a major infrastructure package. This could be a strong fundraising hook for committees focused on local issues.',
        source_url: 'https://thehill.com/infrastructure-vote-2026',
        source_domain: 'thehill.com',
        content_snippet: 'The upcoming infrastructure vote presents an opportunity for down-ballot candidates to connect federal policy to local impact.',
        relevance_score: 8.1,
        suggested_by: 'user',
        used_in_draft: false,
        created_at: '2026-02-18T16:00:00Z',
    },
]

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    })
}

function ScoreBadge({ score }: { score: number }) {
    const color =
        score >= 8 ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
            : score >= 5 ? 'text-amber-400 bg-amber-400/10 border-amber-400/30'
                : 'text-white/40 bg-white/5 border-white/10'

    return (
        <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${color}`}>
            {score.toFixed(1)}
        </span>
    )
}

export default function ResearchPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [showUsed, setShowUsed] = useState(false)

    const filteredTopics = mockTopics.filter(t =>
        showUsed ? true : !t.used_in_draft
    )

    const availableTopics = filteredTopics.filter(t => !t.used_in_draft)
    const usedTopics = filteredTopics.filter(t => t.used_in_draft)

    return (
        <div className="h-full overflow-y-auto">
            {/* ── Header ── */}
            <div className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#111827]/95 px-8 py-5 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-white" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                            Research
                        </h1>
                        <p className="mt-1 text-sm text-white/40">
                            Discover topics and news for your fundraising emails
                        </p>
                    </div>
                </div>

                {/* Search bar */}
                <div className="mt-4 flex gap-3">
                    <div className="relative flex-1">
                        <HugeiconsIcon icon={Search01Icon} className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for topics, news, or issues..."
                            className="w-full rounded-xl border border-white/[0.08] bg-[#1e293b] py-3 pl-10 pr-4 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-[#e8614d]/50 focus:ring-1 focus:ring-[#e8614d]/30"
                        />
                    </div>
                    <Button
                        className="bg-[#e8614d] text-white hover:bg-[#e8614d]/90 cursor-pointer px-5"
                        size="default"
                    >
                        <HugeiconsIcon icon={Search01Icon} className="mr-1.5 h-4 w-4" />
                        Search
                    </Button>
                </div>
            </div>

            {/* ── Topics ── */}
            <div className="px-8 py-6 space-y-6">

                {/* AI Recommended */}
                <section>
                    <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <HugeiconsIcon icon={SparklesIcon} className="h-4 w-4 text-amber-400" />
                            <h2 className="text-sm font-semibold text-white">AI Recommended</h2>
                            <span className="text-xs text-white/30">
                                Topics discovered for your brand
                            </span>
                        </div>
                        <button
                            onClick={() => setShowUsed(!showUsed)}
                            className="text-xs text-white/30 transition-colors hover:text-white/60 cursor-pointer"
                        >
                            {showUsed ? 'Hide used' : 'Show used'}
                        </button>
                    </div>

                    <div className="space-y-2">
                        {availableTopics
                            .filter(t => t.suggested_by === 'ai')
                            .map(topic => (
                                <TopicCard key={topic.id} topic={topic} />
                            ))}

                        {showUsed && usedTopics
                            .filter(t => t.suggested_by === 'ai')
                            .map(topic => (
                                <TopicCard key={topic.id} topic={topic} />
                            ))}
                    </div>
                </section>

                {/* User Added */}
                <section>
                    <div className="mb-3 flex items-center gap-2">
                        <HugeiconsIcon icon={TextIcon} className="h-4 w-4 text-blue-400" />
                        <h2 className="text-sm font-semibold text-white">Your Topics</h2>
                        <span className="text-xs text-white/30">
                            Topics you've saved for future emails
                        </span>
                    </div>

                    <div className="space-y-2">
                        {availableTopics
                            .filter(t => t.suggested_by === 'user')
                            .map(topic => (
                                <TopicCard key={topic.id} topic={topic} />
                            ))}

                        {availableTopics.filter(t => t.suggested_by === 'user').length === 0 && (
                            <div className="rounded-xl border border-dashed border-white/[0.08] p-8 text-center">
                                <HugeiconsIcon icon={Add01Icon} className="mx-auto mb-2 h-6 w-6 text-white/15" />
                                <p className="text-sm text-white/25">
                                    Search for a topic above to add it to your research
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    )
}

function TopicCard({ topic }: { topic: ResearchTopic }) {
    return (
        <div className={`group rounded-xl border border-white/[0.06] bg-[#1e293b]/50 p-4 transition-colors hover:bg-[#1e293b]/80 ${topic.used_in_draft ? 'opacity-50' : ''
            }`}>
            <div className="flex items-start gap-3">
                {/* Score */}
                <div className="mt-0.5 shrink-0">
                    <ScoreBadge score={topic.relevance_score} />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-white leading-snug">
                            {topic.title}
                        </h3>
                        {topic.suggested_by === 'ai' && (
                            <Badge variant="outline" className="shrink-0 border-amber-500/20 bg-amber-500/5 text-amber-400/70 text-[10px] px-1.5 py-0">
                                ✨ AI
                            </Badge>
                        )}
                        {topic.used_in_draft && (
                            <Badge variant="outline" className="shrink-0 border-emerald-500/20 bg-emerald-500/5 text-emerald-400/70 text-[10px] px-1.5 py-0">
                                Used
                            </Badge>
                        )}
                    </div>
                    <p className="mt-1 text-xs text-white/35 leading-relaxed line-clamp-2">
                        {topic.summary}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                        <a
                            href={topic.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] text-white/20 transition-colors hover:text-[#e8614d]/70"
                        >
                            <HugeiconsIcon icon={Globe02Icon} className="h-3 w-3" />
                            {topic.source_domain}
                        </a>
                        <span className="text-[11px] text-white/15">
                            {formatDate(topic.created_at)}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {!topic.used_in_draft && (
                        <button
                            className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-emerald-400"
                            title="Use in next email"
                        >
                            <HugeiconsIcon icon={CheckmarkBadge01Icon} className="h-3.5 w-3.5" />
                        </button>
                    )}
                    <button
                        className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-red-400"
                        title="Remove"
                    >
                        <HugeiconsIcon icon={Delete02Icon} className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </div>
    )
}
