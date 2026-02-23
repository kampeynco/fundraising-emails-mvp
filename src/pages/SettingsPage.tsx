import { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { Tick01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

type SettingsContext = { activeSettingsSection: string }

// ── General Section ─────────────────────────────────────────
function GeneralSection() {
    const { user } = useAuth()
    const [timezone, setTimezone] = useState('America/Chicago')
    const [deliveryDays, setDeliveryDays] = useState<string[]>(['thursday'])
    const [maxDays, setMaxDays] = useState<number>(1)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    // Load existing profile settings + subscription limit
    useEffect(() => {
        if (!user) return
        const load = async () => {
            // Fetch profile for current delivery_days
            const { data: profile } = await supabase
                .from('profiles')
                .select('delivery_days')
                .eq('id', user.id)
                .maybeSingle()

            if (profile?.delivery_days && Array.isArray(profile.delivery_days)) {
                setDeliveryDays(profile.delivery_days)
            }

            // Fetch subscription for plan limit
            const { data: sub } = await supabase
                .from('subscriptions')
                .select('emails_per_week')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .maybeSingle()

            if (sub?.emails_per_week) {
                setMaxDays(sub.emails_per_week)
            }
        }
        load()
    }, [user])

    const toggleDay = (day: string) => {
        setSaved(false)
        setDeliveryDays(prev => {
            if (prev.includes(day)) {
                return prev.filter(d => d !== day)
            }
            if (prev.length >= maxDays) return prev
            return [...prev, day]
        })
    }

    const handleSave = async () => {
        if (!user) return
        setSaving(true)
        setSaved(false)

        const { error } = await supabase
            .from('profiles')
            .update({ delivery_days: deliveryDays })
            .eq('id', user.id)

        setSaving(false)
        if (!error) {
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        }
    }

    const atLimit = deliveryDays.length >= maxDays

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-base font-semibold text-white">General</h3>
                <p className="mt-1 text-sm text-white/40">Configure your delivery preferences</p>
            </div>

            {/* Timezone */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-white/70">Timezone</label>
                <select
                    value={timezone}
                    onChange={e => { setTimezone(e.target.value); setSaved(false) }}
                    className="w-full max-w-md rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#e8614d]/50 focus:ring-1 focus:ring-[#e8614d]/30 [&>option]:bg-[#1e293b]"
                >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                </select>
            </div>

            {/* Delivery Days (multi-select, limited by plan) */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-white/70">Email Delivery Days</label>
                <p className="text-xs text-white/30">
                    Your plan allows <span className="font-medium text-white/50">{maxDays} delivery {maxDays === 1 ? 'day' : 'days'}</span> per week.
                    {' '}Drafts generate every Thursday.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(day => {
                        const isSelected = deliveryDays.includes(day)
                        const isDisabled = !isSelected && atLimit
                        return (
                            <button
                                key={day}
                                onClick={() => toggleDay(day)}
                                disabled={isDisabled}
                                className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-all ${isSelected
                                    ? 'border-[#e8614d] bg-[#e8614d]/10 text-[#e8614d]'
                                    : isDisabled
                                        ? 'cursor-not-allowed border-white/[0.04] text-white/15'
                                        : 'border-white/[0.08] text-white/40 hover:border-white/15 hover:text-white/60'
                                    }`}
                            >
                                {day}
                                {isSelected && (
                                    <HugeiconsIcon icon={Tick01Icon} size={12} className="ml-1.5 inline-block" />
                                )}
                            </button>
                        )
                    })}
                </div>
                {deliveryDays.length === 0 && (
                    <p className="text-xs text-amber-400/60">Select at least one delivery day</p>
                )}
            </div>

            <div className="pt-2">
                <Button
                    onClick={handleSave}
                    disabled={saving || deliveryDays.length === 0}
                    className="bg-[#e8614d] text-white hover:bg-[#d4553f] disabled:opacity-50"
                >
                    <HugeiconsIcon icon={Tick01Icon} size={16} className="mr-1.5" />
                    {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
                </Button>
            </div>
        </div >
    )
}



// ── Billing Section ─────────────────────────────────────────
function BillingSection() {
    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-base font-semibold text-white">Billing & Plan</h3>
                <p className="mt-1 text-sm text-white/40">Manage your subscription and payment method</p>
            </div>

            {/* Current plan summary */}
            <div className="rounded-xl border border-[#e8614d]/20 bg-[#e8614d]/5 p-5">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-[#e8614d]">Current Plan</p>
                        <p className="mt-1 text-2xl font-bold text-white">$498<span className="text-sm font-normal text-white/40">/month</span></p>
                        <p className="mt-0.5 text-sm text-white/40">1 email/week · Base platform · Billed monthly</p>
                    </div>
                    <Button variant="outline" className="cursor-pointer border-[#e8614d] bg-[#e8614d]/10 text-[#e8614d] hover:bg-[#e8614d] hover:text-white">
                        Manage Billing
                        <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="ml-1" />
                    </Button>
                </div>
            </div>

            {/* Line items matching pricing page */}
            <div className="space-y-3">
                {/* Email Writing */}
                <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <div>
                        <p className="text-sm font-semibold text-white">Email Writing Service</p>
                        <p className="mt-0.5 text-xs text-white/40">Done-for-you fundraising emails, delivered weekly via the Thursday Drop</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold text-white">$249<span className="text-xs font-normal text-white/30">/mo</span></p>
                        <p className="text-[10px] uppercase tracking-wider text-white/30">1 email/wk</p>
                    </div>
                </div>

                {/* Platform */}
                <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-white">Platform</p>
                            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/40">Base</span>
                        </div>
                        <p className="mt-0.5 text-xs text-white/40">Dashboard and client portal access</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold text-white">$249<span className="text-xs font-normal text-white/30">/mo</span></p>
                        <p className="text-[10px] uppercase tracking-wider text-white/30">Base tier</p>
                    </div>
                </div>

                {/* Rapid Response */}
                <div className="flex items-center justify-between rounded-xl border border-dashed border-white/[0.06] bg-white/[0.01] p-5 opacity-50">
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-white">Rapid Response Service</p>
                            <span className="text-[10px] font-medium text-[#e8614d]">⚡ Available at 3+ emails/wk</span>
                        </div>
                        <p className="mt-0.5 text-xs text-white/40">24-hour turnaround for breaking news, opposition hits, deadline surprises</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold text-white/40">$995<span className="text-xs font-normal text-white/20">/mo</span></p>
                        <p className="text-[10px] uppercase tracking-wider text-white/20">Add-on</p>
                    </div>
                </div>
            </div>

            <p className="text-center text-xs italic text-white/25">Pause or cancel anytime. Keep everything we've written.</p>
        </div>
    )
}

// ── Integrations Section ────────────────────────────────────
interface Integration {
    name: string
    provider: string
    desc: string
    logo: string
    authType: 'oauth' | 'apikey' | 'none'
}

const INTEGRATIONS: Integration[] = [
    { name: 'Mailchimp', provider: 'mailchimp', desc: 'Send approved emails directly to your Mailchimp audience', logo: 'https://cdn.brandfetch.io/mailchimp.com/theme/dark/h/64/w/64/icon?c=1idKdx0hyJdTmrt5Jal', authType: 'oauth' },
    { name: 'Action Network', provider: 'action_network', desc: 'Send approved emails directly to your Action Network list', logo: 'https://cdn.brandfetch.io/actionnetwork.org/theme/dark/h/64/w/64/icon?c=1idKdx0hyJdTmrt5Jal', authType: 'apikey' },
    { name: 'HubSpot', provider: 'hubspot', desc: 'Send through your HubSpot email marketing', logo: 'https://cdn.brandfetch.io/hubspot.com/theme/dark/h/64/w/64/icon?c=1idKdx0hyJdTmrt5Jal', authType: 'oauth' },
    { name: 'Active Campaign', provider: 'active_campaign', desc: 'Deliver emails via Active Campaign automations', logo: 'https://cdn.brandfetch.io/activecampaign.com/theme/dark/h/64/w/64/icon?c=1idKdx0hyJdTmrt5Jal', authType: 'apikey' },
    { name: 'Constant Contact', provider: 'constant_contact', desc: 'Send through Constant Contact campaigns', logo: 'https://cdn.brandfetch.io/constantcontact.com/theme/dark/h/64/w/64/icon?c=1idKdx0hyJdTmrt5Jal', authType: 'none' },
    { name: 'SendGrid', provider: 'sendgrid', desc: 'Deliver emails via SendGrid transactional API', logo: 'https://cdn.brandfetch.io/sendgrid.com/theme/dark/h/64/w/64/icon?c=1idKdx0hyJdTmrt5Jal', authType: 'none' },
    { name: 'NationBuilder', provider: 'nationbuilder', desc: 'Sync emails with your NationBuilder nation', logo: 'https://cdn.brandfetch.io/nationbuilder.com/theme/dark/h/64/w/64/icon?c=1idKdx0hyJdTmrt5Jal', authType: 'none' },
    { name: 'Brevo', provider: 'brevo', desc: 'Send emails through your Brevo (Sendinblue) campaigns', logo: 'https://cdn.brandfetch.io/brevo.com/theme/dark/h/64/w/64/icon?c=1idKdx0hyJdTmrt5Jal', authType: 'none' },
    { name: 'Campaigner', provider: 'campaigner', desc: 'Create and send campaigns via Campaigner email marketing', logo: 'https://cdn.brandfetch.io/campaigner.com/theme/dark/h/64/w/64/icon?c=1idKdx0hyJdTmrt5Jal', authType: 'apikey' },
    { name: 'Klaviyo', provider: 'klaviyo', desc: 'Deliver emails via Klaviyo marketing automation', logo: 'https://cdn.brandfetch.io/klaviyo.com/theme/dark/h/64/w/64/icon?c=1idKdx0hyJdTmrt5Jal', authType: 'none' },
]

function IntegrationsSection() {
    const { user } = useAuth()
    const [connectedProviders, setConnectedProviders] = useState<Record<string, { account_name?: string; list_name?: string }>>({})
    const [connecting, setConnecting] = useState<string | null>(null)
    const [apiKeyDialogProvider, setApiKeyDialogProvider] = useState<string | null>(null)
    const [apiKeyInput, setApiKeyInput] = useState('')
    const [accountUrlInput, setAccountUrlInput] = useState('')
    const [apiKeyError, setApiKeyError] = useState('')
    const [apiKeyLoading, setApiKeyLoading] = useState(false)

    // Check if any platform is already connected
    const hasConnectedPlatform = Object.keys(connectedProviders).length > 0

    // Fetch connected integrations on mount
    const fetchIntegrations = useCallback(async () => {
        if (!user) return
        const { data } = await supabase
            .from('email_integrations')
            .select('provider, metadata')
            .eq('user_id', user.id)

        if (data) {
            const map: Record<string, { account_name?: string; list_name?: string }> = {}
            for (const row of data) {
                const meta = (row.metadata || {}) as Record<string, string>
                map[row.provider] = {
                    account_name: meta.account_name,
                    list_name: meta.list_name,
                }
            }
            setConnectedProviders(map)
        }
    }, [user])

    useEffect(() => {
        fetchIntegrations()
    }, [fetchIntegrations])

    const handleConnect = async (integration: Integration) => {
        if (integration.authType === 'none') return

        // API key flow — show dialog
        if (integration.authType === 'apikey') {
            setApiKeyDialogProvider(integration.provider)
            setApiKeyInput('')
            setApiKeyError('')
            return
        }

        // OAuth flow — dispatch to provider-specific edge function
        setConnecting(integration.provider)

        const oauthFunctionMap: Record<string, string> = {
            mailchimp: 'get-mailchimp-oauth-url',
            hubspot: 'get-hubspot-oauth-url',
        }

        const functionName = oauthFunctionMap[integration.provider]
        if (!functionName) {
            alert(`OAuth not configured for ${integration.name}`)
            setConnecting(null)
            return
        }

        try {
            const { data, error } = await supabase.functions.invoke(functionName)

            if (error) {
                console.error('OAuth URL error:', error)
                alert(`Failed to start ${integration.name} connection. Please try again.`)
                return
            }

            if (data?.error) {
                console.error('OAuth URL error:', data.error)
                alert(`${integration.name} OAuth error: ${data.error}`)
                return
            }

            if (data?.url) {
                window.location.href = data.url
            }
        } catch (err) {
            console.error('Connect failed:', err)
            alert('Connection failed. Please try again.')
        } finally {
            setConnecting(null)
        }
    }

    const handleApiKeySubmit = async () => {
        if (!user || !apiKeyDialogProvider || !apiKeyInput.trim()) return
        setApiKeyLoading(true)
        setApiKeyError('')

        try {
            let orgName = ''

            if (apiKeyDialogProvider === 'action_network') {
                // Action Network: validate via OSDI endpoint
                const testResponse = await fetch('https://actionnetwork.org/api/v2/', {
                    headers: { 'OSDI-API-Token': apiKeyInput.trim() },
                })
                if (!testResponse.ok) {
                    setApiKeyError('Invalid API key. Please check and try again.')
                    setApiKeyLoading(false)
                    return
                }
                const testData = await testResponse.json()
                orgName = testData?.motd || 'Action Network'

            } else if (apiKeyDialogProvider === 'active_campaign') {
                // Active Campaign: needs account URL + API key
                if (!accountUrlInput.trim()) {
                    setApiKeyError('Please enter your Active Campaign account URL.')
                    setApiKeyLoading(false)
                    return
                }
                // Normalize the URL
                let baseUrl = accountUrlInput.trim().replace(/\/$/, '')
                if (!baseUrl.startsWith('https://')) baseUrl = `https://${baseUrl}`

                const testResponse = await fetch(`${baseUrl}/api/3/users/me`, {
                    headers: { 'Api-Token': apiKeyInput.trim() },
                })
                if (!testResponse.ok) {
                    setApiKeyError('Invalid API key or account URL. Please check and try again.')
                    setApiKeyLoading(false)
                    return
                }
                const testData = await testResponse.json()
                orgName = testData?.user?.firstName
                    ? `${testData.user.firstName} ${testData.user.lastName || ''}`.trim()
                    : 'Active Campaign'
            }

            // Save to email_integrations
            const { error } = await supabase
                .from('email_integrations')
                .upsert({
                    user_id: user.id,
                    provider: apiKeyDialogProvider,
                    access_token: apiKeyInput.trim(),
                    server_prefix: apiKeyDialogProvider === 'active_campaign' ? accountUrlInput.trim().replace(/\/$/, '') : null,
                    metadata: { account_name: orgName },
                    connected_at: new Date().toISOString(),
                }, { onConflict: 'user_id,provider' })

            if (error) {
                setApiKeyError(`Failed to save: ${error.message}`)
                setApiKeyLoading(false)
                return
            }

            setConnectedProviders(prev => ({
                ...prev,
                [apiKeyDialogProvider]: { account_name: orgName },
            }))
            setApiKeyDialogProvider(null)
            setApiKeyInput('')
            setAccountUrlInput('')
        } catch (err) {
            setApiKeyError('Connection failed. Please try again.')
        } finally {
            setApiKeyLoading(false)
        }
    }

    const handleDisconnect = async (provider: string) => {
        if (!user) return
        await supabase
            .from('email_integrations')
            .delete()
            .eq('user_id', user.id)
            .eq('provider', provider)

        setConnectedProviders(prev => {
            const next = { ...prev }
            delete next[provider]
            return next
        })
    }

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-base font-semibold text-white">Integrations</h3>
                <p className="mt-1 text-sm text-white/40">
                    Connect your email marketing platform
                </p>
            </div>

            {hasConnectedPlatform && (
                <p className="text-xs text-amber-400/60">
                    Only one platform can be connected at a time. Disconnect your current platform to switch.
                </p>
            )}

            <div className="space-y-3">
                {INTEGRATIONS.map(integration => {
                    const connected = connectedProviders[integration.provider]
                    const isConnecting = connecting === integration.provider
                    const isAvailable = integration.authType !== 'none'
                    const isLockedOut = hasConnectedPlatform && !connected

                    return (
                        <div
                            key={integration.name}
                            className={`flex items-center justify-between rounded-xl border p-5 transition-colors ${connected
                                ? 'border-emerald-500/20 bg-emerald-500/5'
                                : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white/5">
                                    <img src={integration.logo} alt={integration.name} className="h-7 w-7 rounded object-contain" />
                                </span>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-white">{integration.name}</p>
                                        {connected && (
                                            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                                Connected
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-0.5 text-xs text-white/40">
                                        {integration.desc}
                                    </p>
                                </div>
                            </div>

                            {connected ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDisconnect(integration.provider)}
                                    className="cursor-pointer border-[#e8614d] bg-[#e8614d]/10 text-xs text-[#e8614d] hover:bg-[#e8614d] hover:text-white"
                                >
                                    Disconnect
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={isConnecting}
                                    onClick={() => { if (!isLockedOut && isAvailable) handleConnect(integration) }}
                                    className={`text-xs ${isLockedOut
                                        ? 'pointer-events-none border-white/[0.06] bg-transparent text-white/20'
                                        : isAvailable
                                            ? 'cursor-pointer border-[#e8614d] bg-[#e8614d]/10 text-[#e8614d] hover:bg-[#e8614d] hover:text-white'
                                            : 'pointer-events-none border-white/[0.06] bg-transparent text-white/20'
                                        }`}
                                >
                                    {isConnecting ? 'Connecting…' : isLockedOut ? 'Locked' : isAvailable ? 'Connect' : 'Coming Soon'}
                                </Button>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* API Key Dialog */}
            {apiKeyDialogProvider && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="mx-4 w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0f1724] p-6 shadow-2xl">
                        <h3 className="text-lg font-semibold text-white">
                            Connect {INTEGRATIONS.find(i => i.provider === apiKeyDialogProvider)?.name}
                        </h3>
                        <p className="mt-1 text-sm text-white/40">
                            {apiKeyDialogProvider === 'active_campaign'
                                ? 'Enter your Active Campaign account URL and API key. Find them under Settings → Developer.'
                                : apiKeyDialogProvider === 'campaigner'
                                    ? 'Enter your Campaigner Integration Key. Find it under Account Settings → Integration Keys.'
                                    : `Paste your API key below. You can find it in your ${INTEGRATIONS.find(i => i.provider === apiKeyDialogProvider)?.name} dashboard under Settings → API Keys.`
                            }
                        </p>
                        <div className="mt-4 space-y-3">
                            {apiKeyDialogProvider === 'active_campaign' && (
                                <input
                                    type="text"
                                    value={accountUrlInput}
                                    onChange={e => setAccountUrlInput(e.target.value)}
                                    placeholder="yourname.api-us1.com"
                                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-[#e8614d]/50 focus:ring-1 focus:ring-[#e8614d]/30"
                                    autoFocus
                                />
                            )}
                            <input
                                type="text"
                                value={apiKeyInput}
                                onChange={e => setApiKeyInput(e.target.value)}
                                placeholder="Paste your API key here…"
                                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-[#e8614d]/50 focus:ring-1 focus:ring-[#e8614d]/30"
                                onKeyDown={e => e.key === 'Enter' && handleApiKeySubmit()}
                                autoFocus={apiKeyDialogProvider !== 'active_campaign'}
                            />
                            {apiKeyError && (
                                <p className="text-xs text-red-400">{apiKeyError}</p>
                            )}
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => { setApiKeyDialogProvider(null); setApiKeyInput(''); setAccountUrlInput(''); setApiKeyError('') }}
                                    className="cursor-pointer border-[#e8614d] bg-[#e8614d]/10 text-xs text-[#e8614d] hover:bg-[#e8614d] hover:text-white"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    disabled={!apiKeyInput.trim() || apiKeyLoading}
                                    onClick={handleApiKeySubmit}
                                    className="cursor-pointer bg-[#e8614d] text-xs text-white hover:bg-[#d4553f]"
                                >
                                    {apiKeyLoading ? 'Validating…' : 'Connect'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
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
                        Manage your campaign settings, billing, and integrations
                    </p>
                </div>

                {/* Active section */}
                <div id="general" className={activeSection === 'general' ? '' : 'hidden'}>
                    <GeneralSection />
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
