import { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { HugeiconsIcon } from '@hugeicons/react'
import {
    CheckmarkBadge01Icon,
    Delete02Icon,
    Globe02Icon,
    InformationCircleIcon,
    Search01Icon,
} from '@hugeicons/core-free-icons'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

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

interface ResearchContext {
    activeResearchSection: string
}

interface SearchHistoryEntry {
    query: string
    resultCount: number
    timestamp: string
}

function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getScoreLabel(score: number): string {
    if (score >= 8) return 'High'
    if (score >= 5) return 'Medium'
    return 'Low'
}

function ScoreBadge({ score }: { score: number }) {
    const color =
        score >= 8 ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
            : score >= 5 ? 'text-amber-400 bg-amber-400/10 border-amber-400/30'
                : 'text-white/40 bg-white/5 border-white/10'

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-bold tabular-nums cursor-help ${color}`}>
                    {score.toFixed(1)}
                </span>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[220px]">
                <p className="font-semibold">{getScoreLabel(score)} Relevance ({score.toFixed(1)}/10)</p>
                <p className="mt-1 text-xs text-white/60">
                    Score based on recency, keyword relevance to your brand, fundraising angle, and source quality.
                </p>
            </TooltipContent>
        </Tooltip>
    )
}

// Tab metadata
const TAB_META: Record<string, { title: string; subtitle: string }> = {
    'in-queue': { title: 'In Queue', subtitle: 'Topics marked for draft generation' },
    'saved': { title: 'Saved', subtitle: 'Bookmarked topics for future emails' },
    'discover': { title: 'Discover', subtitle: 'Search for trending news and topics' },
    'used': { title: 'Used', subtitle: 'Topics already incorporated into drafts' },
    'history': { title: 'History', subtitle: 'Your past searches' },
}

export default function ResearchPage() {
    const { user } = useAuth()
    const { activeResearchSection } = useOutletContext<ResearchContext>()
    const [searchQuery, setSearchQuery] = useState('')
    const [topics, setTopics] = useState<ResearchTopic[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [searchMessage, setSearchMessage] = useState<string | null>(null)
    const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([])

    // Load existing topics from Supabase on mount
    const loadTopics = useCallback(async () => {
        if (!user) return
        setIsLoading(true)

        const { data, error } = await supabase
            .from('research_topics')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50)

        if (!error && data) {
            setTopics(data as ResearchTopic[])
        }
        setIsLoading(false)
    }, [user])

    useEffect(() => {
        loadTopics()
    }, [loadTopics])

    // Filter topics based on active tab
    const getFilteredTopics = () => {
        // Client-side filtering by search query first
        const searchFiltered = searchQuery.trim()
            ? topics.filter(t =>
                t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.source_domain.toLowerCase().includes(searchQuery.toLowerCase())
            )
            : topics

        switch (activeResearchSection) {
            case 'in-queue':
                return searchFiltered.filter(t => t.used_in_draft)
            case 'saved':
                return searchFiltered.filter(t => !t.used_in_draft)
            case 'discover':
                return searchFiltered.filter(t => !t.used_in_draft)
            case 'used':
                return searchFiltered.filter(t => t.used_in_draft)
            case 'history':
                return [] // History tab shows search history, not topics
            default:
                return searchFiltered
        }
    }

    const filteredTopics = getFilteredTopics()

    const handleSearch = async () => {
        if (!searchQuery.trim()) return

        setIsSearching(true)
        setSearchMessage(null)

        try {
            const { data, error } = await supabase.functions.invoke('search-research', {
                body: { query: searchQuery.trim() },
            })

            if (error) {
                console.error('Search error:', error)
                setSearchMessage('Search failed. Please try again.')
                setIsSearching(false)
                return
            }

            if (data?.error) {
                setSearchMessage(`Search error: ${data.error}`)
                setIsSearching(false)
                return
            }

            const newTopics = (data?.topics || []) as ResearchTopic[]

            // Add to search history
            setSearchHistory(prev => [{
                query: searchQuery.trim(),
                resultCount: newTopics.length,
                timestamp: new Date().toISOString(),
            }, ...prev])

            if (newTopics.length > 0) {
                // Add new topics to the top of the list (avoid duplicates by id)
                setTopics(prev => {
                    const existingIds = new Set(prev.map(t => t.id))
                    const unique = newTopics.filter(t => !existingIds.has(t.id))
                    return [...unique, ...prev]
                })
                setSearchMessage(`Found ${newTopics.length} result${newTopics.length !== 1 ? 's' : ''} for "${searchQuery}"`)
            } else {
                setSearchMessage(`No results found for "${searchQuery}"`)
            }
        } catch (err) {
            console.error('Search failed:', err)
            setSearchMessage('Search failed. Please try again.')
        } finally {
            setIsSearching(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch()
    }

    const handleMarkForDraft = async (topicId: string) => {
        setTopics(prev => prev.map(t =>
            t.id === topicId ? { ...t, used_in_draft: true } : t
        ))
        await supabase
            .from('research_topics')
            .update({ used_in_draft: true })
            .eq('id', topicId)
    }

    const handleRemoveTopic = async (topicId: string) => {
        setTopics(prev => prev.filter(t => t.id !== topicId))
        await supabase
            .from('research_topics')
            .delete()
            .eq('id', topicId)
    }

    const handleClearSearch = () => {
        setSearchQuery('')
        setSearchMessage(null)
    }

    const meta = TAB_META[activeResearchSection] || TAB_META['saved']

    return (
        <div className="h-full overflow-y-auto">
            {/* ── Header ── */}
            <div className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#111827]/95 px-8 py-5 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-white" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                            {meta.title}
                        </h1>
                        <p className="mt-1 text-sm text-white/40">
                            {meta.subtitle}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-white/20">
                            {filteredTopics.length} topic{filteredTopics.length !== 1 ? 's' : ''}
                        </span>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button className="rounded-lg p-2 text-white/20 transition-colors hover:bg-white/5 hover:text-white/40 cursor-help">
                                    <HugeiconsIcon icon={InformationCircleIcon} className="h-4 w-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-[260px]">
                                <p className="font-semibold">How Research Works</p>
                                <p className="mt-1 text-xs text-white/60">
                                    Search for topics relevant to your campaign. AI scores each result by recency, relevance, and source quality.
                                    Mark topics to include them in your next email draft.
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {/* Search bar — always visible on Discover tab, compact on others */}
                {(activeResearchSection === 'discover' || activeResearchSection === 'saved') && (
                    <div className="mt-4 flex gap-3">
                        <div className="relative flex-1">
                            <HugeiconsIcon icon={Search01Icon} className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search for topics, news, or issues..."
                                className="w-full rounded-xl border border-white/[0.08] bg-[#1e293b] py-3 pl-10 pr-4 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-[#e8614d]/50 focus:ring-1 focus:ring-[#e8614d]/30"
                            />
                        </div>
                        <Button
                            onClick={handleSearch}
                            disabled={isSearching || !searchQuery.trim()}
                            className="bg-[#e8614d] text-white hover:bg-[#e8614d]/90 cursor-pointer px-5 disabled:opacity-50 disabled:cursor-not-allowed"
                            size="default"
                        >
                            <HugeiconsIcon icon={Search01Icon} className="mr-1.5 h-4 w-4" />
                            {isSearching ? 'Searching...' : 'Search'}
                        </Button>
                    </div>
                )}

                {/* Search status */}
                {searchMessage && (
                    <div className="mt-3 flex items-center justify-between">
                        <p className="text-xs text-white/40">{searchMessage}</p>
                        <button
                            onClick={handleClearSearch}
                            className="text-xs text-[#e8614d]/70 transition-colors hover:text-[#e8614d] cursor-pointer"
                        >
                            Clear search
                        </button>
                    </div>
                )}
            </div>

            {/* ── Content ── */}
            <div className="px-8 py-6">
                {activeResearchSection === 'history' ? (
                    /* History tab */
                    <div className="space-y-2">
                        {searchHistory.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-white/[0.08] p-8 text-center">
                                <HugeiconsIcon icon={Search01Icon} className="mx-auto mb-2 h-6 w-6 text-white/15" />
                                <p className="text-sm text-white/25">
                                    Your search history will appear here
                                </p>
                            </div>
                        ) : (
                            searchHistory.map((entry, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]"
                                >
                                    <div className="flex items-center gap-3">
                                        <HugeiconsIcon icon={Search01Icon} className="h-4 w-4 text-white/30" />
                                        <div>
                                            <p className="text-sm font-medium text-white">{entry.query}</p>
                                            <p className="mt-0.5 text-xs text-white/30">
                                                {entry.resultCount} result{entry.resultCount !== 1 ? 's' : ''} · {formatDate(entry.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    /* Topic cards for all other tabs */
                    <div className="space-y-2">
                        {isLoading ? (
                            <div className="rounded-xl border border-dashed border-white/[0.08] p-8 text-center">
                                <p className="text-sm text-white/25">Loading…</p>
                            </div>
                        ) : filteredTopics.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-white/[0.08] p-8 text-center">
                                <HugeiconsIcon icon={Search01Icon} className="mx-auto mb-2 h-6 w-6 text-white/15" />
                                <p className="text-sm text-white/25">
                                    {activeResearchSection === 'in-queue' && 'No topics in queue yet. Mark a saved topic to add it here.'}
                                    {activeResearchSection === 'saved' && 'Search for topics above to save them here.'}
                                    {activeResearchSection === 'discover' && 'Search above to discover trending topics.'}
                                    {activeResearchSection === 'used' && 'Topics used in drafts will appear here.'}
                                </p>
                            </div>
                        ) : (
                            filteredTopics.map(topic => (
                                <TopicCard
                                    key={topic.id}
                                    topic={topic}
                                    onMarkForDraft={handleMarkForDraft}
                                    onRemove={handleRemoveTopic}
                                />
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

// ── Topic Card Component ──
function TopicCard({ topic, onMarkForDraft, onRemove }: {
    topic: ResearchTopic
    onMarkForDraft: (id: string) => void
    onRemove: (id: string) => void
}) {
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
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 text-[11px] text-[#e8614d]/50 underline decoration-[#e8614d]/20 underline-offset-2 transition-colors hover:text-[#e8614d] hover:decoration-[#e8614d]/50"
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
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => onMarkForDraft(topic.id)}
                                    className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-emerald-500/10 hover:text-emerald-400 cursor-pointer"
                                >
                                    <HugeiconsIcon icon={CheckmarkBadge01Icon} className="h-3.5 w-3.5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Use in next email</TooltipContent>
                        </Tooltip>
                    )}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => onRemove(topic.id)}
                                className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
                            >
                                <HugeiconsIcon icon={Delete02Icon} className="h-3.5 w-3.5" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>Remove topic</TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </div>
    )
}
