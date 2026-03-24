import { useState, useEffect, useCallback } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { Tick01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { insforge } from '@/lib/insforge'
import { useAuthContext } from '@/providers/AuthProvider'

type SettingsContext = { activeSettingsSection: string }

// ── General Section ─────────────────────────────────────────
function GeneralSection() {
    const { user } = useAuthContext()
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
            const { data: profile } = await insforge.database
                .from('profiles')
                .select('delivery_days')
                .eq('id', user.id)
                .maybeSingle()

            if (profile?.delivery_days && Array.isArray(profile.delivery_days)) {
                setDeliveryDays(profile.delivery_days)
            }

            // Fetch subscription for plan limit
            const { data: sub } = await insforge.database
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
            if (prev.length >= maxDays) return [day]
            return [...prev, day]
        })
    }

    const handleSave = async () => {
        if (!user) return
        setSaving(true)
        setSaved(false)

        const { error } = await insforge.database
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
                    className="w-full max-w-md rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-brand/50 focus:ring-1 focus:ring-brand/30 [&>option]:bg-[#1e293b]"
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
                                    ? 'border-brand bg-brand/10 text-brand'
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
                    className="bg-brand text-white hover:bg-brand-dark disabled:opacity-50"
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
            <div className="rounded-xl border border-brand/20 bg-brand/5 p-5">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-brand">Current Plan</p>
                        <p className="mt-1 text-2xl font-bold text-white">$500<span className="text-sm font-normal text-white/40">/month</span></p>
                        <p className="mt-0.5 text-sm text-white/40">1 email/week · Base platform · Billed monthly</p>
                    </div>
                    <Button variant="outline" className="cursor-pointer border-brand bg-brand/10 text-brand hover:bg-brand hover:text-white">
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
                        <p className="text-lg font-bold text-white">$250<span className="text-xs font-normal text-white/30">/mo</span></p>
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
                        <p className="text-lg font-bold text-white">$250<span className="text-xs font-normal text-white/30">/mo</span></p>
                        <p className="text-[10px] uppercase tracking-wider text-white/30">Base tier</p>
                    </div>
                </div>

                {/* List Building */}
                <div className="flex items-center justify-between rounded-xl border border-dashed border-white/[0.06] bg-white/[0.01] p-5">
                    <div>
                        <p className="text-sm font-semibold text-white">List Building</p>
                        <p className="mt-0.5 text-xs text-white/40">Targeted prospecting, data hygiene, and list acquisition strategy</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold text-white/40">$500<span className="text-xs font-normal text-white/20">/mo</span></p>
                        <p className="text-[10px] uppercase tracking-wider text-white/20">Add-on</p>
                    </div>
                </div>

                {/* Rapid Response */}
                <div className="flex items-center justify-between rounded-xl border border-dashed border-white/[0.06] bg-white/[0.01] p-5 opacity-50">
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-white">Rapid Response Service</p>
                            <span className="text-[10px] font-medium text-brand">⚡ Available at 3+ emails/wk</span>
                        </div>
                        <p className="mt-0.5 text-xs text-white/40">24-hour turnaround for breaking news, opposition hits, deadline surprises</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold text-white/40">$250<span className="text-xs font-normal text-white/20">/mo</span></p>
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
    { name: 'Campaigner', provider: 'campaigner', desc: 'Create and send campaigns via Campaigner email marketing', logo: 'https://cdn.brandfetch.io/campaigner.com/theme/dark/h/64/w/64/icon?c=1idKdx0hyJdTmrt5Jal', authType: 'apikey' },
    { name: 'Constant Contact', provider: 'constant_contact', desc: 'Send through Constant Contact campaigns', logo: 'https://cdn.brandfetch.io/constantcontact.com/theme/dark/h/64/w/64/icon?c=1idKdx0hyJdTmrt5Jal', authType: 'none' },
    { name: 'SendGrid', provider: 'sendgrid', desc: 'Deliver emails via SendGrid transactional API', logo: 'https://cdn.brandfetch.io/sendgrid.com/theme/dark/h/64/w/64/icon?c=1idKdx0hyJdTmrt5Jal', authType: 'none' },
    { name: 'GetResponse', provider: 'getresponse', desc: 'Send emails through GetResponse marketing automation', logo: 'https://cdn.brandfetch.io/getresponse.com/theme/dark/h/64/w/64/icon?c=1idKdx0hyJdTmrt5Jal', authType: 'none' },
    { name: 'Brevo', provider: 'brevo', desc: 'Send emails through your Brevo (Sendinblue) campaigns', logo: 'https://cdn.brandfetch.io/brevo.com/theme/dark/h/64/w/64/icon?c=1idKdx0hyJdTmrt5Jal', authType: 'none' },
    { name: 'Klaviyo', provider: 'klaviyo', desc: 'Deliver emails via Klaviyo marketing automation', logo: 'https://cdn.brandfetch.io/klaviyo.com/theme/dark/h/64/w/64/icon?c=1idKdx0hyJdTmrt5Jal', authType: 'none' },
]

function IntegrationsSection() {
    const { user } = useAuthContext()
    const [searchParams, setSearchParams] = useSearchParams()
    const [connectedProviders, setConnectedProviders] = useState<Record<string, { account_name?: string; list_name?: string }>>({})
    const [connecting, setConnecting] = useState<string | null>(null)
    const [connectError, setConnectError] = useState<string | null>(null)
    const [connectSuccess, setConnectSuccess] = useState<string | null>(null)
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
        const { data } = await insforge.database
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

    // Handle OAuth redirect params (?connected=mailchimp or ?error=...)
    useEffect(() => {
        const connected = searchParams.get('connected')
        const error = searchParams.get('error')
        if (connected) {
            setConnectSuccess(`${connected.charAt(0).toUpperCase() + connected.slice(1)} connected successfully!`)
            fetchIntegrations()
            setSearchParams({}, { replace: true })
        } else if (error) {
            const messages: Record<string, string> = {
                oauth_failed: 'OAuth authorization was cancelled.',
                not_configured: 'Integration not configured. Contact support.',
                invalid_state: 'Session expired. Please try again.',
                token_exchange_failed: 'Failed to exchange authorization code. Please try again.',
                auth_failed: 'Authentication failed. Please sign out and back in.',
                callback_failed: 'Connection failed. Please try again.',
            }
            setConnectError(messages[error] || `Connection failed: ${error}`)
            setSearchParams({}, { replace: true })
        }
    }, [searchParams, fetchIntegrations, setSearchParams])

    const handleConnect = async (integration: Integration) => {
        if (integration.authType === 'none') return
        setConnectError(null)

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
            setConnectError(`OAuth not configured for ${integration.name}.`)
            setConnecting(null)
            return
        }

        const oauthErrorMessages: Record<string, string> = {
            oauth_failed: 'OAuth authorization was cancelled.',
            not_configured: 'Integration not configured. Contact support.',
            invalid_state: 'Session expired. Please try again.',
            token_exchange_failed: 'Failed to exchange authorization code. Please try again.',
            auth_failed: 'Authentication failed. Please sign out and back in.',
            callback_failed: 'Connection failed. Please try again.',
            // Mailchimp-specific diagnostic codes
            mc_token_http_error: 'Mailchimp: token exchange HTTP error. Check client credentials.',
            mc_token_http_400: 'Mailchimp: token rejected (redirect URI mismatch or expired code). Check MAILCHIMP_REDIRECT_URI secret.',
            mc_token_http_401: 'Mailchimp: invalid client credentials. Check MAILCHIMP_CLIENT_ID / MAILCHIMP_CLIENT_SECRET.',
            mc_token_http_500: 'Mailchimp server error during token exchange. Please try again.',
            mc_token_missing: 'Mailchimp: token exchange returned no access token.',
            mc_metadata_error: 'Mailchimp: could not fetch account metadata.',
            mc_no_datacenter: 'Mailchimp: account has no data center assigned.',
            mc_db_write_failed: 'Mailchimp: connected but failed to save. Please try again.',
        }

        try {
            const { data, error } = await insforge.functions.invoke(functionName)

            if (error) {
                console.error('OAuth URL error:', error)
                setConnectError(`Failed to start ${integration.name} connection. Please try again.`)
                setConnecting(null)
                return
            }

            if (data?.error) {
                console.error('OAuth URL error:', data.error)
                setConnectError(`${integration.name} error: ${data.error}`)
                setConnecting(null)
                return
            }

            if (data?.url) {
                // Open OAuth in a popup so the main window session stays alive
                const popup = window.open(data.url, '_blank', 'width=600,height=700,left=200,top=100')

                if (popup) {
                    setConnecting(null)
                    // Clear any stale result before starting
                    localStorage.removeItem('oauth_result')

                    const handleOAuthResult = (result: { type: string; provider?: string; error?: string }) => {
                        cleanup()
                        if (result.error) {
                            setConnectError(oauthErrorMessages[result.error] || `Connection failed: ${result.error}`)
                        } else if (result.provider) {
                            const name = result.provider.charAt(0).toUpperCase() + result.provider.slice(1)
                            setConnectSuccess(`${name} connected successfully!`)
                            fetchIntegrations()
                        }
                    }

                    // Primary: storage event — fires in all other same-origin windows when localStorage changes
                    // Works even when window.opener is null and window.close() is blocked
                    const handleStorage = (event: StorageEvent) => {
                        if (event.key !== 'oauth_result' || !event.newValue) return
                        try {
                            const result = JSON.parse(event.newValue)
                            if (result.type === 'oauth_complete') handleOAuthResult(result)
                        } catch { /* ignore malformed */ }
                    }
                    window.addEventListener('storage', handleStorage)

                    // Secondary: BroadcastChannel (for same-tab scenarios and fast browsers)
                    let bc: BroadcastChannel | null = null
                    if (typeof BroadcastChannel !== 'undefined') {
                        bc = new BroadcastChannel('oauth_complete')
                        bc.onmessage = (event) => handleOAuthResult(event.data)
                    }

                    const cleanup = () => {
                        window.removeEventListener('storage', handleStorage)
                        bc?.close()
                        clearInterval(closedTimer)
                        localStorage.removeItem('oauth_result')
                    }

                    // Clean up if popup is closed without completing
                    let closedTimer: ReturnType<typeof setInterval>
                    closedTimer = setInterval(() => {
                        if (popup.closed) cleanup()
                    }, 1000)
                } else {
                    // Popup blocked — fall back to main-window redirect
                    window.location.href = data.url
                }
                return
            }
            setConnecting(null)
        } catch (err) {
            console.error('Connect failed:', err)
            setConnectError('Connection failed. Please try again.')
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
            } else if (apiKeyDialogProvider === 'campaigner') {
                // Campaigner: validate via lists endpoint with IntegrationKey header
                const testResponse = await fetch('https://api.campaigner.com/v1/Lists', {
                    headers: { 'IntegrationKey': apiKeyInput.trim() },
                })
                if (!testResponse.ok) {
                    setApiKeyError('Invalid Integration Key. Please check and try again.')
                    setApiKeyLoading(false)
                    return
                }
                orgName = 'Campaigner'
            }

            // Save to email_integrations (check-then-update-or-insert)
            const { data: existing } = await insforge.database
                .from('email_integrations')
                .select('id')
                .eq('user_id', user.id)
                .eq('provider', apiKeyDialogProvider)
                .maybeSingle()

            const integrationPayload = {
                user_id: user.id,
                provider: apiKeyDialogProvider,
                access_token: apiKeyInput.trim(),
                server_prefix: apiKeyDialogProvider === 'active_campaign' ? accountUrlInput.trim().replace(/\/$/, '') : null,
                metadata: { account_name: orgName },
                connected_at: new Date().toISOString(),
            }

            const { error } = existing
                ? await insforge.database
                    .from('email_integrations')
                    .update(integrationPayload)
                    .eq('id', existing.id)
                : await insforge.database
                    .from('email_integrations')
                    .insert([integrationPayload])

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
        await insforge.database
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
            {connectSuccess && (
                <p className="text-xs text-emerald-400">{connectSuccess}</p>
            )}
            {connectError && (
                <p className="text-xs text-red-400">{connectError}</p>
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
                                    className="cursor-pointer border-brand bg-brand/10 text-xs text-brand hover:bg-brand hover:text-white"
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
                                            ? 'cursor-pointer border-brand bg-brand/10 text-brand hover:bg-brand hover:text-white'
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
                                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-brand/50 focus:ring-1 focus:ring-brand/30"
                                    autoFocus
                                />
                            )}
                            <input
                                type="text"
                                value={apiKeyInput}
                                onChange={e => setApiKeyInput(e.target.value)}
                                placeholder="Paste your API key here…"
                                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-brand/50 focus:ring-1 focus:ring-brand/30"
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
                                    className="cursor-pointer border-brand bg-brand/10 text-xs text-brand hover:bg-brand hover:text-white"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    disabled={!apiKeyInput.trim() || apiKeyLoading}
                                    onClick={handleApiKeySubmit}
                                    className="cursor-pointer bg-brand text-xs text-white hover:bg-brand-dark"
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

                {/* Active section — conditionally rendered to avoid mounting hidden effects */}
                {activeSection === 'general' && <GeneralSection />}
                {activeSection === 'billing' && <BillingSection />}
                {activeSection === 'integrations' && <IntegrationsSection />}
            </div>
        </div>
    )
}
