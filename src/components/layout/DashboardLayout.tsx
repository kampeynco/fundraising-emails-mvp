import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuthContext } from '@/providers/AuthProvider'
import { insforge } from '@/lib/insforge'
import { type Draft } from '@/types/draft'
import { HugeiconsIcon } from '@hugeicons/react'
import {
    Mail01Icon,
    Home07Icon,
    LicenseDraftIcon,
    SwatchIcon,
    Add01Icon,
    Logout03Icon,
    ImageUploadIcon,
    DropletIcon,
    AlertSquareIcon,
    Link02Icon,
    ProfileIcon,
    EdgeStyleIcon,
    Settings02Icon,
    UserIcon,
    CreditCardPosIcon,
    Plug02Icon,
    InboxIcon,
    BookmarkIcon,
    SparklesIcon,
    SentIcon,
    Clock01Icon,
    TextAlignLeftIcon,
    Mic01Icon,
    AiSearch02Icon,
    Calendar03Icon,
} from '@hugeicons/core-free-icons'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// ── Icon sidebar nav items ──────────────────────────────────
const mainNavItems = [
    { icon: Home07Icon, label: 'Overview', href: '/dashboard' },
    { icon: AiSearch02Icon, label: 'Research', href: '/dashboard/research' },
    { icon: LicenseDraftIcon, label: 'Drafts', href: '/dashboard/drafts' },
    { icon: SentIcon, label: 'Sent', href: '/dashboard/sent' },
    { icon: SwatchIcon, label: 'Brand Kit', href: '/dashboard/brand-kit' },
    { icon: Settings02Icon, label: 'Settings', href: '/dashboard/settings' },
]

// ── Inner sidebar items for Brand Kit ───────────────────────
const brandKitSections = [
    {
        label: 'Identity',
        items: [
            { icon: ProfileIcon, label: 'Details', sectionId: 'brand-details' },
            { icon: TextAlignLeftIcon, label: 'Mission', sectionId: 'mission' },
            { icon: Mic01Icon, label: 'Voice', sectionId: 'voice' },
        ],
    },
    {
        label: 'Content',
        items: [
            { icon: AlertSquareIcon, label: 'Stances', sectionId: 'stances' },
            { icon: AlertSquareIcon, label: 'Compliance', sectionId: 'legal' },
            { icon: Link02Icon, label: 'Links', sectionId: 'socials' },
        ],
    },
    {
        label: 'Visuals',
        items: [
            { icon: ImageUploadIcon, label: 'Images', sectionId: 'logos' },
            { icon: DropletIcon, label: 'Color', sectionId: 'color' },
            { icon: EdgeStyleIcon, label: 'Formatting', sectionId: 'email-format' },
        ],
    },
]

// ── Inner sidebar items for Research ────────────────────────
const researchSections = [
    {
        label: null,
        items: [
            { icon: InboxIcon, label: 'In Queue', sectionId: 'in-queue' },
            { icon: BookmarkIcon, label: 'Saved', sectionId: 'saved' },
        ],
    },
    {
        label: 'Discovery',
        items: [
            { icon: SparklesIcon, label: 'Discover', sectionId: 'discover' },
        ],
    },
    {
        label: 'Archive',
        items: [
            { icon: SentIcon, label: 'Used', sectionId: 'used' },
            { icon: Clock01Icon, label: 'History', sectionId: 'history' },
        ],
    },
]

// ── Inner sidebar items for Settings ────────────────────────
const settingsSections = [
    {
        label: null,
        items: [
            { icon: UserIcon, label: 'General', sectionId: 'general' },
        ],
    },
    {
        label: 'Account',
        items: [
            { icon: CreditCardPosIcon, label: 'Billing', sectionId: 'billing' },
            { icon: Plug02Icon, label: 'Integrations', sectionId: 'integrations' },
        ],
    },
]

export function DashboardLayout() {
    const { user, signOut } = useAuthContext()
    const location = useLocation()
    const [activeSection, setActiveSection] = useState<string | null>(null)
    const [activeSettingsSection, setActiveSettingsSection] = useState('general')
    const [activeResearchSection, setActiveResearchSection] = useState('saved')
    const isBrandKit = location.pathname.startsWith('/dashboard/brand-kit')
    const isSettings = location.pathname.startsWith('/dashboard/settings')
    const isResearch = location.pathname.startsWith('/dashboard/research')
    const isSent = location.pathname.startsWith('/dashboard/sent')
    const [activeSentMonth, setActiveSentMonth] = useState<string | null>(null)

    // Auto-select settings section from URL param (e.g. after OAuth redirect)
    useEffect(() => {
        if (!isSettings) return
        const params = new URLSearchParams(location.search)
        const section = params.get('section')
        if (section === 'integrations' || section === 'billing' || section === 'general') {
            setActiveSettingsSection(section)
        }
    }, [location.search, isSettings])

    // Shared draft state — fetched once, passed to all routes via outlet context
    const [drafts, setDrafts] = useState<Draft[]>([])
    const [draftsLoading, setDraftsLoading] = useState(true)

    const fetchDrafts = useCallback(async () => {
        if (!user) return
        setDraftsLoading(true)
        const { data } = await insforge.database
            .from('email_drafts')
            .select('id, user_id, subject_line, preview_text, body_html, status, draft_type, week_of, created_at, updated_at, user_comments, alt_subject_lines, google_doc_url')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
        setDrafts((data || []) as Draft[])
        setDraftsLoading(false)
    }, [user])

    useEffect(() => { fetchDrafts() }, [fetchDrafts])

    // Compute month/year folder structure for Sent page inner sidebar
    const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December']

    const sentSections = useMemo(() => {
        const sentDrafts = drafts.filter(d => d.status === 'sent')
        if (!sentDrafts.length) return []

        // Find earliest sent draft — use updated_at (when status changed to 'sent')
        const earliest = sentDrafts.reduce((min, d) =>
            d.updated_at < min ? d.updated_at : min, sentDrafts[0].updated_at)

        const start = new Date(earliest)
        const now = new Date()

        // Build all months from start → now
        const months: { year: number; month: number }[] = []
        const cur = new Date(start.getFullYear(), start.getMonth(), 1)
        while (cur <= new Date(now.getFullYear(), now.getMonth(), 1)) {
            months.push({ year: cur.getFullYear(), month: cur.getMonth() })
            cur.setMonth(cur.getMonth() + 1)
        }

        // Group by year, newest first
        const byYear = months.reduce((acc, { year, month }) => {
            if (!acc[year]) acc[year] = []
            acc[year].push(month)
            return acc
        }, {} as Record<number, number[]>)

        return Object.entries(byYear)
            .sort(([a], [b]) => Number(b) - Number(a))
            .map(([year, monthNums]) => ({
                label: year,
                items: monthNums
                    .sort((a, b) => b - a)
                    .map(m => ({
                        label: MONTH_NAMES[m],
                        sectionId: `${year}-${String(m + 1).padStart(2, '0')}`,
                    })),
            }))
    }, [drafts])

    // Auto-select most recent month when navigating to Sent
    useEffect(() => {
        if (!isSent || !sentSections.length) return
        if (!activeSentMonth) {
            setActiveSentMonth(sentSections[0].items[0].sectionId)
        }
    }, [isSent, sentSections, activeSentMonth])

    // Get user initial for avatar
    const userInitial = user?.email?.[0]?.toUpperCase() || 'U'

    return (
        <div className="flex h-screen overflow-hidden bg-[#111827]">
            {/* ── Left icon sidebar ── */}
            <aside className="flex w-16 flex-col items-center border-r border-white/[0.06] bg-[#0f2137] py-4">
                {/* Logo */}
                <Link
                    to="/dashboard"
                    className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-white/10"
                >
                    <HugeiconsIcon icon={Mail01Icon} size={22} className="text-white/90" />
                </Link>

                {/* New Draft */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link
                            to="/dashboard/drafts"
                            className="mb-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-brand text-white transition-all hover:bg-brand-dark hover:shadow-lg hover:shadow-brand/20 active:scale-95"
                        >
                            <HugeiconsIcon icon={Add01Icon} size={18} />
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={12}>New Draft</TooltipContent>
                </Tooltip>

                {/* Separator */}
                <div className="mb-3 h-px w-8 bg-white/10" />

                {/* Main nav icons */}
                <nav className="flex flex-1 flex-col items-center gap-1">
                    {mainNavItems.map((item) => {
                        const isActive = item.href === '/dashboard'
                            ? location.pathname === '/dashboard'
                            : location.pathname.startsWith(item.href)

                        return (
                            <Tooltip key={item.href}>
                                <TooltipTrigger asChild>
                                    <Link
                                        to={item.href}
                                        className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-colors ${isActive
                                            ? 'bg-white/15 text-white'
                                            : 'text-white/50 hover:bg-white/8 hover:text-white/80'
                                            }`}
                                    >
                                        <HugeiconsIcon icon={item.icon} size={20} />
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right" sideOffset={12}>{item.label}</TooltipContent>
                            </Tooltip>
                        )
                    })}
                </nav>

                {/* Bottom: user avatar + sign out */}
                <div className="mt-auto flex flex-col items-center gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={signOut}
                                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/8 hover:text-white/70"
                            >
                                <HugeiconsIcon icon={Logout03Icon} size={20} />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={12}>Sign Out</TooltipContent>
                    </Tooltip>

                    <div
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20 text-xs font-semibold text-brand"
                        title={user?.email || ''}
                    >
                        {userInitial}
                    </div>
                </div>
            </aside>

            {/* ── Inner sidebar (Brand Kit, Settings, Research, or Sent) ── */}
            {(isBrandKit || isSettings || isResearch || isSent) && (
                <aside className="flex w-56 flex-col border-r border-white/[0.06] bg-[#142d48]">
                    {/* Title */}
                    <div className="px-5 py-5">
                        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-white">
                            {isSettings ? 'Settings' : isResearch ? 'Research' : isSent ? 'Sent' : 'Brand Kit'}
                            {isResearch && (
                                <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand">Beta</span>
                            )}
                        </h2>
                    </div>

                    {/* Navigation sections */}
                    <nav className="flex-1 space-y-5 px-3">
                        {isSent ? (
                            sentSections.length === 0 ? (
                                <p className="px-2 text-xs text-white/30">No sent emails yet</p>
                            ) : (
                                sentSections.map((section, sIdx) => (
                                    <div key={sIdx}>
                                        <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-white/40">
                                            {section.label}
                                        </p>
                                        <div className="space-y-0.5">
                                            {section.items.map((item) => (
                                                <button
                                                    key={item.sectionId}
                                                    onClick={() => setActiveSentMonth(item.sectionId)}
                                                    className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${activeSentMonth === item.sectionId
                                                        ? 'bg-brand text-white'
                                                        : 'text-white/60 hover:bg-white/8 hover:text-white/90'
                                                        }`}
                                                >
                                                    <HugeiconsIcon icon={Calendar03Icon} size={16} />
                                                    {item.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )
                        ) : (
                            (isSettings ? settingsSections : isResearch ? researchSections : brandKitSections).map((section, sIdx) => (
                                <div key={sIdx}>
                                    {section.label && (
                                        <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-white/40">
                                            {section.label}
                                        </p>
                                    )}
                                    <div className="space-y-0.5">
                                        {section.items.map((item) => {
                                            const currentActive = isSettings ? activeSettingsSection : isResearch ? activeResearchSection : activeSection
                                            const isItemActive = currentActive === item.sectionId

                                            return (
                                                <button
                                                    key={item.sectionId}
                                                    onClick={() => {
                                                        if (isSettings) {
                                                            setActiveSettingsSection(item.sectionId)
                                                        } else if (isResearch) {
                                                            setActiveResearchSection(item.sectionId)
                                                        } else {
                                                            setActiveSection(item.sectionId)
                                                            document.getElementById(item.sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                                        }
                                                    }}
                                                    className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isItemActive
                                                        ? 'bg-brand text-white'
                                                        : 'text-white/60 hover:bg-white/8 hover:text-white/90'
                                                        }`}
                                                >
                                                    <HugeiconsIcon icon={item.icon} size={16} />
                                                    {item.label}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </nav>
                </aside>
            )}

            {/* ── Main content area ── */}
            <main className="flex-1 overflow-hidden">
                <Outlet context={{ activeSettingsSection, activeResearchSection, activeSentMonth, setActiveSentMonth, drafts, setDrafts, draftsLoading, refetchDrafts: fetchDrafts }} />
            </main>
        </div>
    )
}
