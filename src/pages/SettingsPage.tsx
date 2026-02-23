import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { Tick01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'

type SettingsContext = { activeSettingsSection: string }

// ── General Section ─────────────────────────────────────────
function GeneralSection() {
    const [orgName, setOrgName] = useState('My Campaign')
    const [timezone, setTimezone] = useState('America/Chicago')
    const [deliveryDay, setDeliveryDay] = useState('thursday')

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-base font-semibold text-white">Organization</h3>
                <p className="mt-1 text-sm text-white/40">Basic information about your campaign</p>
            </div>

            {/* Org Name */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-white/70">Organization Name</label>
                <input
                    type="text"
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                    className="w-full max-w-md rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-[#e8614d]/50 focus:ring-1 focus:ring-[#e8614d]/30"
                />
            </div>

            {/* Timezone */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-white/70">Timezone</label>
                <select
                    value={timezone}
                    onChange={e => setTimezone(e.target.value)}
                    className="w-full max-w-md rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#e8614d]/50 focus:ring-1 focus:ring-[#e8614d]/30 [&>option]:bg-[#1e293b]"
                >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                </select>
            </div>

            {/* Delivery Day */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-white/70">Email Delivery Day</label>
                <p className="text-xs text-white/30">Which day of the week should drafts be delivered?</p>
                <div className="flex flex-wrap gap-2 pt-1">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(day => (
                        <button
                            key={day}
                            onClick={() => setDeliveryDay(day)}
                            className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-all ${deliveryDay === day
                                ? 'border-[#e8614d] bg-[#e8614d]/10 text-[#e8614d]'
                                : 'border-white/[0.08] text-white/40 hover:border-white/15 hover:text-white/60'
                                }`}
                        >
                            {day}
                        </button>
                    ))}
                </div>
            </div>

            <div className="pt-2">
                <Button className="bg-[#e8614d] text-white hover:bg-[#d4553f]">
                    <HugeiconsIcon icon={Tick01Icon} size={16} className="mr-1.5" />
                    Save Changes
                </Button>
            </div>
        </div>
    )
}

// ── Stances Section ─────────────────────────────────────────
function StancesSection() {
    const [stances, setStances] = useState([
        { issue: 'Healthcare', position: 'Support universal coverage through public option expansion', priority: 'high' },
        { issue: 'Climate', position: 'Net-zero by 2050 with green energy investment', priority: 'high' },
        { issue: 'Education', position: 'Increase public school funding, expand Pre-K access', priority: 'medium' },
    ])

    const [newIssue, setNewIssue] = useState('')
    const [newPosition, setNewPosition] = useState('')

    const addStance = () => {
        if (!newIssue.trim() || !newPosition.trim()) return
        setStances([...stances, { issue: newIssue, position: newPosition, priority: 'medium' }])
        setNewIssue('')
        setNewPosition('')
    }

    const removeStance = (idx: number) => {
        setStances(stances.filter((_, i) => i !== idx))
    }

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-base font-semibold text-white">Policy Stances</h3>
                <p className="mt-1 text-sm text-white/40">
                    Define your campaign's positions on key issues. The AI writer uses these to generate on-message emails.
                </p>
            </div>

            {/* Existing stances */}
            <div className="space-y-3">
                {stances.map((stance, i) => (
                    <div
                        key={i}
                        className="group flex items-start justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]"
                    >
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-white">{stance.issue}</span>
                                <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${stance.priority === 'high'
                                        ? 'bg-[#e8614d]/15 text-[#e8614d]'
                                        : 'bg-white/5 text-white/40'
                                        }`}
                                >
                                    {stance.priority}
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-white/50">{stance.position}</p>
                        </div>
                        <button
                            onClick={() => removeStance(i)}
                            className="ml-3 cursor-pointer text-xs text-white/20 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                        >
                            Remove
                        </button>
                    </div>
                ))}
            </div>

            {/* Add new stance */}
            <div className="rounded-xl border border-dashed border-white/10 p-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/30">Add a Stance</p>
                <div className="flex gap-3">
                    <input
                        type="text"
                        placeholder="Issue (e.g. Economy)"
                        value={newIssue}
                        onChange={e => setNewIssue(e.target.value)}
                        className="w-40 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-[#e8614d]/50"
                    />
                    <input
                        type="text"
                        placeholder="Your position on this issue…"
                        value={newPosition}
                        onChange={e => setNewPosition(e.target.value)}
                        className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-[#e8614d]/50"
                        onKeyDown={e => e.key === 'Enter' && addStance()}
                    />
                    <Button onClick={addStance} className="bg-[#e8614d] text-white hover:bg-[#d4553f]">
                        Add
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ── Billing Section ─────────────────────────────────────────
function BillingSection() {
    const plans = [
        { name: 'Starter', price: '$49', emails: '2 emails/week', current: false },
        { name: 'Growth', price: '$99', emails: '5 emails/week', current: true },
        { name: 'Full Send', price: '$199', emails: 'Unlimited emails', current: false },
    ]

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-base font-semibold text-white">Billing & Plan</h3>
                <p className="mt-1 text-sm text-white/40">Manage your subscription and payment method</p>
            </div>

            {/* Current plan */}
            <div className="rounded-xl border border-[#e8614d]/20 bg-[#e8614d]/5 p-5">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-[#e8614d]">Current Plan</p>
                        <p className="mt-1 text-2xl font-bold text-white">Growth</p>
                        <p className="mt-0.5 text-sm text-white/40">$99/month · 5 emails/week · Billed monthly</p>
                    </div>
                    <Button variant="outline" className="border-white/10 text-white/60 hover:text-white">
                        Manage Billing
                        <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="ml-1" />
                    </Button>
                </div>
            </div>

            {/* Plan comparison */}
            <div className="grid grid-cols-3 gap-4">
                {plans.map(plan => (
                    <div
                        key={plan.name}
                        className={`rounded-xl border p-5 transition-all ${plan.current
                            ? 'border-[#e8614d]/30 bg-[#e8614d]/5'
                            : 'border-white/[0.06] bg-white/[0.02] hover:border-white/10'
                            }`}
                    >
                        <p className="text-sm font-semibold text-white">{plan.name}</p>
                        <p className="mt-1 text-2xl font-bold text-white">
                            {plan.price}
                            <span className="text-sm font-normal text-white/30">/mo</span>
                        </p>
                        <p className="mt-2 text-xs text-white/40">{plan.emails}</p>
                        {plan.current ? (
                            <p className="mt-4 text-xs font-medium text-[#e8614d]">Current plan</p>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-4 w-full cursor-pointer border-white/10 text-xs text-white/50 hover:text-white"
                            >
                                Switch
                            </Button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

// ── Integrations Section ────────────────────────────────────
function IntegrationsSection() {
    const integrations = [
        {
            name: 'Mailchimp',
            desc: 'Send approved emails directly to your Mailchimp audience',
            status: 'not_connected' as const,
            icon: '📬',
        },
        {
            name: 'Gmail',
            desc: 'Send emails from your campaign Gmail account',
            status: 'not_connected' as const,
            icon: '📧',
        },
        {
            name: 'Stripe',
            desc: 'Track donation conversions from email campaigns',
            status: 'not_connected' as const,
            icon: '💳',
        },
        {
            name: 'ActBlue',
            desc: 'Embed ActBlue donation links in fundraising emails',
            status: 'not_connected' as const,
            icon: '🗳️',
        },
    ]

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-base font-semibold text-white">Integrations</h3>
                <p className="mt-1 text-sm text-white/40">
                    Connect your email platform and payment processor
                </p>
            </div>

            <div className="space-y-3">
                {integrations.map(integration => (
                    <div
                        key={integration.name}
                        className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition-colors hover:bg-white/[0.04]"
                    >
                        <div className="flex items-center gap-4">
                            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-xl">
                                {integration.icon}
                            </span>
                            <div>
                                <p className="text-sm font-semibold text-white">{integration.name}</p>
                                <p className="mt-0.5 text-xs text-white/40">{integration.desc}</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer border-white/10 text-xs text-white/50 hover:border-[#e8614d]/50 hover:text-[#e8614d]"
                        >
                            Connect
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ── Settings Page (Main Export) ──────────────────────────────
export default function SettingsPage() {
    const { activeSettingsSection: activeSection } = useOutletContext<SettingsContext>()
    return (
        <div className="h-full overflow-y-auto">
            <div className="mx-auto max-w-3xl px-10 py-10">
                {/* Page header */}
                <div className="mb-10">
                    <h1
                        className="text-2xl font-bold tracking-tight text-white"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
                        Settings
                    </h1>
                    <p className="mt-1 text-sm text-white/40">
                        Manage your campaign settings, policy stances, billing, and integrations
                    </p>
                </div>

                {/* Active section */}
                <div id="general" className={activeSection === 'general' ? '' : 'hidden'}>
                    <GeneralSection />
                </div>
                <div id="stances" className={activeSection === 'stances' ? '' : 'hidden'}>
                    <StancesSection />
                </div>
                <div id="billing" className={activeSection === 'billing' ? '' : 'hidden'}>
                    <BillingSection />
                </div>
                <div id="integrations" className={activeSection === 'integrations' ? '' : 'hidden'}>
                    <IntegrationsSection />
                </div>
            </div>
        </div>
    )
}
