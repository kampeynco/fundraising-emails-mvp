import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { HugeiconsIcon } from '@hugeicons/react'
import {
    Mail01Icon,
    Home07Icon,
    LicenseDraftIcon,
    SwatchIcon,
    Add01Icon,
    Logout03Icon,
    GridIcon,
    JusticeScale01Icon,
    HashtagIcon,
    ImageUploadIcon,
    DropletIcon,
    AlertSquareIcon,
    Link02Icon,
} from '@hugeicons/core-free-icons'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// ── Icon sidebar nav items ──────────────────────────────────
const mainNavItems = [
    { icon: Home07Icon, label: 'Overview', href: '/dashboard' },
    { icon: LicenseDraftIcon, label: 'Drafts', href: '/dashboard/drafts' },
    { icon: SwatchIcon, label: 'Brand Kit', href: '/dashboard/brand-kit' },
]

// ── Inner sidebar items for Brand Kit ───────────────────────
const brandKitSections = [
    {
        label: null,
        items: [
            { icon: GridIcon, label: 'Brand Details', sectionId: 'brand-details' },
        ],
    },
    {
        label: 'Content',
        items: [
            { icon: AlertSquareIcon, label: 'Content', sectionId: 'legal' },
            { icon: Link02Icon, label: 'Links', sectionId: 'socials' },
        ],
    },
    {
        label: 'Visuals',
        items: [
            { icon: ImageUploadIcon, label: 'Logos', sectionId: 'logos' },
            { icon: DropletIcon, label: 'Color', sectionId: 'color' },
            { icon: Mail01Icon, label: 'Header & Footer', sectionId: 'email-format' },
        ],
    },
]

export function DashboardLayout() {
    const { user, signOut } = useAuth()
    const location = useLocation()
    const [activeSection, setActiveSection] = useState('brand-details')
    const isBrandKit = location.pathname.startsWith('/dashboard/brand-kit')

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
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            className="mb-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-[#e8614d] text-white transition-all hover:bg-[#d4553f] hover:shadow-lg hover:shadow-[#e8614d]/20 active:scale-95"
                            onClick={() => {/* TODO: open new request modal */ }}
                        >
                            <HugeiconsIcon icon={Add01Icon} size={18} />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={12}>New Request</TooltipContent>
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
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8614d]/20 text-xs font-semibold text-[#e8614d]"
                        title={user?.email || ''}
                    >
                        {userInitial}
                    </div>
                </div>
            </aside>

            {/* ── Inner sidebar (Brand Kit only) ── */}
            {isBrandKit && (
                <aside className="flex w-56 flex-col border-r border-white/[0.06] bg-[#142d48]">
                    {/* Title */}
                    <div className="px-5 py-5">
                        <h2 className="text-sm font-semibold tracking-wide text-white">Brand Kit</h2>
                    </div>

                    {/* Navigation sections */}
                    <nav className="flex-1 space-y-5 px-3">
                        {brandKitSections.map((section, sIdx) => (
                            <div key={sIdx}>
                                {section.label && (
                                    <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-white/40">
                                        {section.label}
                                    </p>
                                )}
                                <div className="space-y-0.5">
                                    {section.items.map((item) => {
                                        const isActive = activeSection === item.sectionId

                                        return (
                                            <button
                                                key={item.sectionId}
                                                onClick={() => {
                                                    setActiveSection(item.sectionId)
                                                    document.getElementById(item.sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                                }}
                                                className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive
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
                <Outlet />
            </main>
        </div>
    )
}
