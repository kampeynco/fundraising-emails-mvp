import { useState, useEffect, useRef } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
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
    FlashIcon,
    NoteIcon,
} from '@hugeicons/core-free-icons'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// ── Icon sidebar nav items ──────────────────────────────────
const mainNavItems = [
    { icon: Home07Icon, label: 'Overview', href: '/dashboard' },
    { icon: AiSearch02Icon, label: 'Research', href: '/dashboard/research' },
    { icon: LicenseDraftIcon, label: 'Drafts', href: '/dashboard/drafts' },
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
            { icon: ImageUploadIcon, label: 'Logos', sectionId: 'logos' },
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
    const { user, signOut } = useAuth()
    const location = useLocation()
    const [activeSection, setActiveSection] = useState<string | null>(null)
    const [plusMenuOpen, setPlusMenuOpen] = useState(false)
    const [hasRapidResponse, setHasRapidResponse] = useState(false)
    const plusMenuRef = useRef<HTMLDivElement>(null)

    // Fetch subscription to check rapid response eligibility
    useEffect(() => {
        if (!user) return
        const checkPlan = async () => {
            const { data } = await supabase
                .from('subscriptions')
                .select('emails_per_week')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .maybeSingle()
            setHasRapidResponse((data?.emails_per_week ?? 0) >= 3)
        }
        checkPlan()
    }, [user])

    // Click outside to close plus menu
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
                setPlusMenuOpen(false)
            }
        }
        if (plusMenuOpen) document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [plusMenuOpen])
    const [activeSettingsSection, setActiveSettingsSection] = useState('general')
    const isBrandKit = location.pathname.startsWith('/dashboard/brand-kit')
    const isSettings = location.pathname.startsWith('/dashboard/settings')
    const isResearch = location.pathname.startsWith('/dashboard/research')
    const [activeResearchSection, setActiveResearchSection] = useState('saved')

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

                {/* New Request */}
                <div ref={plusMenuRef} className="relative">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                className="mb-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-[#e8614d] text-white transition-all hover:bg-[#d4553f] hover:shadow-lg hover:shadow-[#e8614d]/20 active:scale-95"
                                onClick={() => setPlusMenuOpen(prev => !prev)}
                            >
                                <HugeiconsIcon icon={Add01Icon} size={18} />
                            </button>
                        </TooltipTrigger>
                        {!plusMenuOpen && <TooltipContent side="right" sideOffset={12}>New Draft</TooltipContent>}
                    </Tooltip>

                    {plusMenuOpen && (
                        <div className="absolute left-full top-0 ml-3 z-50 w-52 rounded-xl border border-white/[0.08] bg-[#0f1724] p-1.5 shadow-2xl shadow-black/40">
                            <Link
                                to="/dashboard/drafts?new=regular"
                                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
                                onClick={() => setPlusMenuOpen(false)}
                            >
                                <HugeiconsIcon icon={NoteIcon} size={16} className="text-white/50" />
                                Regular Draft
                            </Link>
                            {hasRapidResponse && (
                                <Link
                                    to="/dashboard/drafts?new=rapid"
                                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
                                    onClick={() => setPlusMenuOpen(false)}
                                >
                                    <HugeiconsIcon icon={FlashIcon} size={16} className="text-amber-400" />
                                    Rapid Response
                                </Link>
                            )}
                        </div>
                    )}
                </div>

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
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8614d]/20 text-xs font-semibold text-[#e8614d]"
                        title={user?.email || ''}
                    >
                        {userInitial}
                    </div>
                </div>
            </aside>

            {/* ── Inner sidebar (Brand Kit or Settings) ── */}
            {(isBrandKit || isSettings || isResearch) && (
                <aside className="flex w-56 flex-col border-r border-white/[0.06] bg-[#142d48]">
                    {/* Title */}
                    <div className="px-5 py-5">
                        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-white">
                            {isSettings ? 'Settings' : isResearch ? 'Research' : 'Brand Kit'}
                            {isResearch && (
                                <span className="rounded-full bg-[#e8614d]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#e8614d]">Beta</span>
                            )}
                        </h2>
                    </div>

                    {/* Navigation sections */}
                    <nav className="flex-1 space-y-5 px-3">
                        {(isSettings ? settingsSections : isResearch ? researchSections : brandKitSections).map((section, sIdx) => (
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
                                                    ? 'bg-[#e8614d] text-white'
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
                        ))}
                    </nav>
                </aside>
            )}

            {/* ── Main content area ── */}
            <main className="flex-1 overflow-hidden">
                <Outlet context={{ activeSettingsSection, activeResearchSection }} />
            </main>
        </div>
    )
}
