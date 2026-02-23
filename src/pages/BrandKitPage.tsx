import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { HexColorPickerField } from '@/components/ui/hex-color-picker'
import { HugeiconsIcon } from '@hugeicons/react'
import { BlueskyIcon, Globe02Icon, ThreadsIcon, Link02Icon, Loading03Icon } from '@hugeicons/core-free-icons'
import { useBrandKit, type BrandKitSocial } from '@/hooks/useBrandKit'
import { supabase } from '@/lib/supabase'

const toneOptions = [
    'Inspirational',
    'Neutral',
    'Formal',
    'Friendly',
    'Playful',
    'Professional',
    'Empathetic',
]

const socialPlatforms = [
    'Website',
    'Instagram',
    'Facebook',
    'Twitter / X',
    'Bluesky',
    'LinkedIn',
    'TikTok',
    'YouTube',
    'Threads',
]

// SVG path data for social media icons (simple, recognizable glyphs)
const socialIconPaths: Record<string, string> = {
    Website: 'hugeicon',
    Instagram: 'M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
    Facebook: 'M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95',
    'Twitter / X': 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
    Bluesky: 'hugeicon',
    Threads: 'hugeicon',
    LinkedIn: 'M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77',
    TikTok: 'M16.6 5.82s.51.49 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48',
    YouTube: 'M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73',
}

const hugeIconMap: Record<string, any> = {
    Website: Globe02Icon,
    Bluesky: BlueskyIcon,
    Threads: ThreadsIcon,
}

// ── Import from URL button ──
function ImportFromUrlButton({ onImport }: { onImport: (bio: string) => void }) {
    const [showInput, setShowInput] = useState(false)
    const [url, setUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleImport = async () => {
        if (!url.trim()) return
        setLoading(true)
        setError('')

        try {
            const { data, error: fnError } = await supabase.functions.invoke('scrape-bio', {
                body: { url: url.trim() },
            })

            if (fnError || data?.error) {
                setError(data?.error || fnError?.message || 'Failed to scrape URL')
                return
            }

            if (data?.bio) {
                onImport(data.bio)
                setShowInput(false)
                setUrl('')
            } else {
                setError('No content found at that URL')
            }
        } catch {
            setError('Failed to connect')
        } finally {
            setLoading(false)
        }
    }

    if (!showInput) {
        return (
            <button
                onClick={() => setShowInput(true)}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-[#e8614d] transition-colors hover:bg-[#e8614d]/10"
            >
                <HugeiconsIcon icon={Link02Icon} size={13} />
                Import from URL
            </button>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <input
                type="url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleImport()}
                placeholder="https://example.com/about"
                autoFocus
                className="h-8 w-56 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-xs text-white placeholder:text-white/25 outline-none focus:border-[#e8614d]/50"
            />
            <button
                onClick={handleImport}
                disabled={loading || !url.trim()}
                className="flex h-8 items-center gap-1.5 rounded-lg bg-[#e8614d] px-3 text-xs font-medium text-white transition-colors hover:bg-[#d4553f] disabled:opacity-50"
            >
                {loading ? (
                    <><HugeiconsIcon icon={Loading03Icon} size={13} className="animate-spin" /> Scraping...</>
                ) : (
                    'Import'
                )}
            </button>
            <button
                onClick={() => { setShowInput(false); setUrl(''); setError('') }}
                className="text-xs text-white/30 hover:text-white/60"
            >
                Cancel
            </button>
            {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
    )
}

function StancesSection({ inputClasses }: { inputClasses: string }) {
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
        <section id="stances" className="scroll-mt-20">
            <h2 className="mb-2 flex items-center gap-2 text-xl font-semibold text-white" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                Policy Stances
                <span className="rounded-full bg-[#e8614d]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#e8614d]">Beta</span>
            </h2>
            <p className="mb-6 text-sm text-white/40">
                Define your campaign's positions on key issues. The AI writer uses these to generate on-message emails.
            </p>

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

            <div className="mt-4 rounded-xl border border-dashed border-white/10 p-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/30">Add a Stance</p>
                <div className="flex gap-3">
                    <input
                        type="text"
                        placeholder="Issue (e.g. Economy)"
                        value={newIssue}
                        onChange={e => setNewIssue(e.target.value)}
                        className={`${inputClasses} !w-40`}
                    />
                    <input
                        type="text"
                        placeholder="Your position on this issue…"
                        value={newPosition}
                        onChange={e => setNewPosition(e.target.value)}
                        className={`${inputClasses} flex-1`}
                        onKeyDown={e => e.key === 'Enter' && addStance()}
                    />
                    <Button onClick={addStance} className="bg-[#e8614d] text-white hover:bg-[#d4553f] cursor-pointer">
                        Add
                    </Button>
                </div>
            </div>
        </section>
    )
}

export default function BrandKitPage() {
    const { data, setData, loading, saving, error, lastSaved, save, uploadLogo } = useBrandKit()
    const primaryLogoRef = useRef<HTMLInputElement>(null)
    const iconLogoRef = useRef<HTMLInputElement>(null)

    const updateField = <K extends keyof typeof data>(field: K, value: (typeof data)[K]) => {
        setData(prev => ({ ...prev, [field]: value }))
    }

    const updateSocial = (index: number, field: keyof BrandKitSocial, value: string) => {
        setData(prev => ({
            ...prev,
            socials: prev.socials.map((s, i) => i === index ? { ...s, [field]: value } : s),
        }))
    }

    const addSocial = () => {
        setData(prev => ({
            ...prev,
            socials: [...prev.socials, { platform: 'Facebook', url: '' }],
        }))
    }

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'primary' | 'icon') => {
        const file = e.target.files?.[0]
        if (file) await uploadLogo(file, type)
    }

    const removeLogo = (type: 'primary' | 'icon') => {
        const field = type === 'primary' ? 'primary_logo_url' : 'icon_logo_url'
        setData(prev => ({ ...prev, [field]: '' }))
    }

    const inputClasses = "w-full rounded-lg border border-white/[0.08] bg-[#1e293b] px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-[#e8614d]/50 focus:ring-1 focus:ring-[#e8614d]/30"

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-white/50">Loading brand kit...</div>
            </div>
        )
    }

    return (
        <div className="flex h-full overflow-hidden">
            {/* Form area */}
            <div className="w-1/2 overflow-y-auto">
                {/* Top bar */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.06] bg-[#111827]/95 backdrop-blur-sm px-8 py-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-lg font-semibold text-white">{data.kit_name || 'Untitled Kit'}</h1>
                        {lastSaved && (
                            <span className="text-xs text-white/30">
                                Saved {lastSaved.toLocaleTimeString()}
                            </span>
                        )}
                        {error && (
                            <span className="text-xs text-red-400">Error: {error}</span>
                        )}
                    </div>
                    <Button
                        onClick={save}
                        disabled={saving}
                        className="bg-white/10 text-white hover:bg-white/20 border border-white/10 cursor-pointer disabled:opacity-50"
                        size="sm"
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </div>

                {/* ═══════ SCROLLABLE FORM CONTENT ═══════ */}
                <div className="max-w-2xl px-8 py-8 space-y-12">

                    {/* ── DETAILS ── */}
                    <section id="brand-details" className="scroll-mt-20">
                        <h2 className="mb-8 text-xl font-semibold text-white" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                            Details
                        </h2>

                        <div className="mb-6">
                            <label className="mb-2 block text-sm font-medium text-white/50">Organization Name</label>
                            <input
                                type="text"
                                value={data.kit_name}
                                onChange={(e) => updateField('kit_name', e.target.value)}
                                placeholder="My Campaign"
                                className={inputClasses}
                            />
                        </div>

                        <div className="mb-6">
                            <label className="mb-2 block text-sm font-medium text-white/50">Organization Type</label>
                            <div className="relative">
                                <select
                                    value={data.org_type}
                                    onChange={(e) => {
                                        updateField('org_type', e.target.value)
                                        // Reset candidate-specific fields when switching away
                                        if (e.target.value !== 'Candidate') {
                                            updateField('org_level', '')
                                            updateField('office_sought', '')
                                            updateField('state', '')
                                            updateField('district', '')
                                        }
                                    }}
                                    className={`${inputClasses} appearance-none cursor-pointer`}
                                >
                                    <option value="" className="bg-[#1e293b]">Select type…</option>
                                    <option value="Candidate" className="bg-[#1e293b]">Candidate</option>
                                    <option value="Other Political Group" className="bg-[#1e293b]">Other Political Group</option>
                                    <option value="501c3" className="bg-[#1e293b]">501(c)(3)</option>
                                    <option value="501c4" className="bg-[#1e293b]">501(c)(4)</option>
                                </select>
                                <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {/* Candidate-specific fields */}
                        {data.org_type === 'Candidate' && (
                            <>
                                <div className="mb-6">
                                    <label className="mb-2 block text-sm font-medium text-white/50">Level</label>
                                    <div className="relative">
                                        <select
                                            value={data.org_level}
                                            onChange={(e) => {
                                                updateField('org_level', e.target.value)
                                                updateField('office_sought', '') // Reset office when level changes
                                            }}
                                            className={`${inputClasses} appearance-none cursor-pointer`}
                                        >
                                            <option value="" className="bg-[#1e293b]">Select level…</option>
                                            <option value="Federal" className="bg-[#1e293b]">Federal</option>
                                            <option value="State" className="bg-[#1e293b]">State</option>
                                            <option value="Local" className="bg-[#1e293b]">Local</option>
                                        </select>
                                        <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>

                                {data.org_level && (
                                    <div className="mb-6">
                                        <label className="mb-2 block text-sm font-medium text-white/50">Office Sought</label>
                                        <div className="relative">
                                            <select
                                                value={data.office_sought}
                                                onChange={(e) => updateField('office_sought', e.target.value)}
                                                className={`${inputClasses} appearance-none cursor-pointer`}
                                            >
                                                <option value="" className="bg-[#1e293b]">Select office…</option>
                                                {data.org_level === 'Federal' && (
                                                    <>
                                                        <option value="President" className="bg-[#1e293b]">President</option>
                                                        <option value="U.S. Senate" className="bg-[#1e293b]">U.S. Senate</option>
                                                        <option value="U.S. House" className="bg-[#1e293b]">U.S. House</option>
                                                    </>
                                                )}
                                                {data.org_level === 'State' && (
                                                    <>
                                                        <option value="Governor" className="bg-[#1e293b]">Governor</option>
                                                        <option value="Lt. Governor" className="bg-[#1e293b]">Lt. Governor</option>
                                                        <option value="Attorney General" className="bg-[#1e293b]">Attorney General</option>
                                                        <option value="Secretary of State" className="bg-[#1e293b]">Secretary of State</option>
                                                        <option value="State Senate" className="bg-[#1e293b]">State Senate</option>
                                                        <option value="State House" className="bg-[#1e293b]">State House</option>
                                                        <option value="Other Statewide" className="bg-[#1e293b]">Other Statewide</option>
                                                    </>
                                                )}
                                                {data.org_level === 'Local' && (
                                                    <>
                                                        <option value="Mayor" className="bg-[#1e293b]">Mayor</option>
                                                        <option value="City Council" className="bg-[#1e293b]">City Council</option>
                                                        <option value="County Commissioner" className="bg-[#1e293b]">County Commissioner</option>
                                                        <option value="School Board" className="bg-[#1e293b]">School Board</option>
                                                        <option value="District Attorney" className="bg-[#1e293b]">District Attorney</option>
                                                        <option value="Sheriff" className="bg-[#1e293b]">Sheriff</option>
                                                        <option value="Other Local" className="bg-[#1e293b]">Other Local</option>
                                                    </>
                                                )}
                                            </select>
                                            <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                )}

                                <div className="mb-6">
                                    <label className="mb-2 block text-sm font-medium text-white/50">State</label>
                                    <div className="relative">
                                        <select
                                            value={data.state}
                                            onChange={(e) => updateField('state', e.target.value)}
                                            className={`${inputClasses} appearance-none cursor-pointer`}
                                        >
                                            <option value="" className="bg-[#1e293b]">Select state…</option>
                                            {['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming', 'District of Columbia'].map(s => (
                                                <option key={s} value={s} className="bg-[#1e293b]">{s}</option>
                                            ))}
                                        </select>
                                        <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-white/50">District</label>
                                    <input
                                        type="text"
                                        value={data.district}
                                        onChange={(e) => updateField('district', e.target.value)}
                                        placeholder="e.g. 7th Congressional District"
                                        className={inputClasses}
                                    />
                                </div>
                            </>
                        )}
                    </section>

                    <hr className="border-white/[0.06]" />

                    {/* ── MISSION ── */}
                    <section id="mission" className="scroll-mt-20">
                        <h2 className="mb-2 text-xl font-semibold text-white" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                            Mission
                        </h2>
                        <p className="mb-6 text-sm text-white/40">
                            Describe your organization's purpose and goals.
                        </p>

                        <div className="mb-6">
                            <div className="mb-2 flex items-center justify-between">
                                <label className="block text-sm font-medium text-white/50">Tell us about your committee</label>
                                <ImportFromUrlButton onImport={(bio) => updateField('brand_summary', bio)} />
                            </div>
                            <textarea
                                value={data.brand_summary}
                                onChange={(e) => updateField('brand_summary', e.target.value)}
                                placeholder="Enter your candidate's bio, organization's mission..."
                                rows={5}
                                className={`${inputClasses} resize-none leading-relaxed`}
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-white/50">Official Address</label>
                            <input
                                type="text"
                                value={data.address}
                                onChange={(e) => updateField('address', e.target.value)}
                                placeholder="1000 Main Street NW, Suite 100, Washington, DC 20001"
                                className={inputClasses}
                            />
                        </div>
                    </section>

                    <hr className="border-white/[0.06]" />

                    {/* ── VOICE ── */}
                    <section id="voice" className="scroll-mt-20">
                        <h2 className="mb-2 text-xl font-semibold text-white" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                            Voice
                        </h2>
                        <p className="mb-6 text-sm text-white/40">
                            Set the tone and personality of your emails.
                        </p>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-white/50">Tone of Voice</label>
                            <div className="relative">
                                <select
                                    value={data.tone_of_voice}
                                    onChange={(e) => updateField('tone_of_voice', e.target.value)}
                                    className={`${inputClasses} appearance-none cursor-pointer`}
                                >
                                    {toneOptions.map((tone) => (
                                        <option key={tone} value={tone} className="bg-[#1e293b]">{tone}</option>
                                    ))}
                                </select>
                                <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </section>

                    <hr className="border-white/[0.06]" />

                    {/* ── POLICY STANCES ── */}
                    <StancesSection inputClasses={inputClasses} />

                    <hr className="border-white/[0.06]" />

                    {/* ── CONTENT: LEGAL ── */}
                    <section id="legal" className="scroll-mt-20">
                        <h2 className="mb-2 text-xl font-semibold text-white" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                            Content
                        </h2>

                        <div className="mb-6 mt-6">
                            <label className="mb-2 block text-sm font-medium text-white/50">Mail Checks To Address</label>
                            <input
                                type="text"
                                value={data.copyright}
                                onChange={(e) => updateField('copyright', e.target.value)}
                                placeholder="Where donors can mail checks"
                                className={inputClasses}
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-white/50">Disclaimers</label>
                            <input
                                type="text"
                                value={data.disclaimers}
                                onChange={(e) => updateField('disclaimers', e.target.value)}
                                placeholder="Paid for by Campaign Name 2026. Treasurer Name, Treasurer."
                                className={inputClasses}
                            />
                        </div>
                    </section>

                    <hr className="border-white/[0.06]" />

                    {/* ── CONTENT: SOCIALS ── */}
                    <section id="socials" className="scroll-mt-20">
                        <h2 className="mb-6 text-xl font-semibold text-white" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                            Links
                        </h2>

                        <div className="space-y-3">
                            {data.socials.map((social, index) => (
                                <div key={index} className="grid grid-cols-[140px_1fr] gap-3">
                                    <div className="relative">
                                        <select
                                            value={social.platform}
                                            onChange={(e) => updateSocial(index, 'platform', e.target.value)}
                                            className={`${inputClasses} appearance-none cursor-pointer`}
                                        >
                                            {socialPlatforms.map((p) => (
                                                <option key={p} value={p} className="bg-[#1e293b]">{p}</option>
                                            ))}
                                        </select>
                                        <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                    <input
                                        type="url"
                                        value={social.url}
                                        onChange={(e) => updateSocial(index, 'url', e.target.value)}
                                        placeholder={`https://www.${social.platform.toLowerCase().replace(/ \/ x/i, '').replace(/ /g, '')}.com/...`}
                                        className={inputClasses}
                                    />
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={addSocial}
                            className="mt-4 cursor-pointer text-sm font-medium text-[#e8614d] transition-colors hover:text-[#d4553f]"
                        >
                            + Add links
                        </button>
                    </section>

                    <hr className="border-white/[0.06]" />

                    {/* ── VISUALS: LOGOS ── */}
                    <section id="logos" className="scroll-mt-20">
                        <h2 className="mb-2 text-xl font-semibold text-white" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                            Logos
                        </h2>
                        <p className="mb-6 text-sm text-white/40">Add the logos that represent your brand.</p>

                        {/* Hidden file inputs */}
                        <input ref={primaryLogoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, 'primary')} />
                        <input ref={iconLogoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, 'icon')} />

                        <div className="grid grid-cols-2 gap-6">
                            {/* Primary Logo */}
                            <div>
                                <div className="relative">
                                    <div
                                        onClick={() => primaryLogoRef.current?.click()}
                                        className="flex h-44 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-white/[0.1] bg-[#1e293b] transition-colors hover:border-[#e8614d]/40 hover:bg-[#1e293b]/80"
                                    >
                                        {data.primary_logo_url ? (
                                            <img src={data.primary_logo_url} alt="Primary logo" className="h-full w-full object-contain p-4" />
                                        ) : (
                                            <div className="text-center">
                                                <svg className="mx-auto mb-2 h-8 w-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                                                </svg>
                                                <p className="text-xs text-white/30">Upload logo</p>
                                            </div>
                                        )}
                                    </div>
                                    {data.primary_logo_url && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeLogo('primary') }}
                                            className="absolute -right-2 -top-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-colors hover:bg-red-600"
                                        >
                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                <p className="mt-2 text-sm font-medium text-white">Primary</p>
                                <p className="text-xs text-white/40">Your main logo, usually full-width</p>
                            </div>

                            {/* Icon Logo */}
                            <div>
                                <div className="relative">
                                    <div
                                        onClick={() => iconLogoRef.current?.click()}
                                        className="flex h-44 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-white/[0.1] bg-[#1e293b] transition-colors hover:border-[#e8614d]/40 hover:bg-[#1e293b]/80"
                                    >
                                        {data.icon_logo_url ? (
                                            <img src={data.icon_logo_url} alt="Icon logo" className="h-full w-full object-contain p-4" />
                                        ) : (
                                            <div className="text-center">
                                                <svg className="mx-auto mb-2 h-8 w-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                                                </svg>
                                                <p className="text-xs text-white/30">Upload icon</p>
                                            </div>
                                        )}
                                    </div>
                                    {data.icon_logo_url && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeLogo('icon') }}
                                            className="absolute -right-2 -top-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-colors hover:bg-red-600"
                                        >
                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                <p className="mt-2 text-sm font-medium text-white">Icon</p>
                                <p className="text-xs text-white/40">A simplified version</p>
                            </div>
                        </div>
                    </section>

                    <hr className="border-white/[0.06]" />

                    {/* ── VISUALS: COLORS ── */}
                    <section id="color" className="scroll-mt-20 pb-16">
                        <h2 className="mb-2 text-xl font-semibold text-white" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                            Colors
                        </h2>
                        <p className="mb-6 text-sm text-white/40">Set the look and feel of your email with your brand colors.</p>

                        <div className="grid grid-cols-2 gap-6 mb-8">
                            {[
                                { key: 'background' as const, label: 'Background', desc: 'The panel behind the email' },
                                { key: 'container' as const, label: 'Container', desc: 'The email content background' },
                                { key: 'accent' as const, label: 'Accent', desc: 'Buttons, links, and highlights' },
                                { key: 'button_text' as const, label: 'Button Text', desc: 'Text on buttons' },
                            ].map((item) => (
                                <HexColorPickerField
                                    key={item.key}
                                    color={data.colors[item.key]}
                                    onChange={(c) => updateField('colors', { ...data.colors, [item.key]: c })}
                                    label={item.label}
                                    description={item.desc}
                                />
                            ))}
                        </div>

                        <HexColorPickerField
                            color={data.colors.foreground}
                            onChange={(c) => updateField('colors', { ...data.colors, foreground: c })}
                            label="Foreground"
                            description="Text and other content elements"
                        />
                    </section>

                    <hr className="border-white/[0.06]" />

                    {/* ── VISUALS: EMAIL FORMAT ── */}
                    <section id="email-format" className="scroll-mt-20 pb-16">
                        <h2 className="mb-2 text-xl font-semibold text-white" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                            Formatting
                        </h2>
                        <p className="mb-6 text-sm text-white/40">Toggle header and footer for your email template.</p>

                        {/* Header toggle */}
                        <div className="mb-6 rounded-xl border border-white/[0.08] bg-[#1e293b] p-5">
                            <label className="flex cursor-pointer items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={data.show_header || !!data.primary_logo_url}
                                    onChange={(e) => updateField('show_header', e.target.checked)}
                                    className="h-4 w-4 rounded border-white/20 bg-transparent accent-[#e8614d]"
                                />
                                <div>
                                    <p className="text-sm font-medium text-white">Header</p>
                                    <p className="text-xs text-white/40">Top section of the email{data.primary_logo_url ? ' — auto-enabled with logo' : ''}</p>
                                </div>
                            </label>
                            {(data.show_header || !!data.primary_logo_url) && (
                                <div className="mt-4 pl-7">
                                    <HexColorPickerField
                                        color={data.colors.header}
                                        onChange={(c) => updateField('colors', { ...data.colors, header: c })}
                                        label="Header Background"
                                        description="Background color of the email header"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Footer toggle */}
                        <div className="rounded-xl border border-white/[0.08] bg-[#1e293b] p-5">
                            <label className="flex cursor-pointer items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={data.show_footer}
                                    onChange={(e) => updateField('show_footer', e.target.checked)}
                                    className="h-4 w-4 rounded border-white/20 bg-transparent accent-[#e8614d]"
                                />
                                <div>
                                    <p className="text-sm font-medium text-white">Footer</p>
                                    <p className="text-xs text-white/40">Bottom section with legal, disclaimers, and address</p>
                                </div>
                            </label>
                            {data.show_footer && (
                                <div className="mt-4 pl-7">
                                    <HexColorPickerField
                                        color={data.colors.footer}
                                        onChange={(c) => updateField('colors', { ...data.colors, footer: c })}
                                        label="Footer Background"
                                        description="Background color of the email footer"
                                    />
                                </div>
                            )}
                        </div>
                    </section>

                </div>
            </div>

            {/* Right preview panel */}
            <div className="flex-1 flex items-center justify-center border-l border-white/[0.06] overflow-hidden p-6" style={{ backgroundColor: data.colors.background }}>
                <div className="h-[90%] w-full overflow-hidden rounded-2xl shadow-2xl shadow-black/30" style={{ backgroundColor: data.colors.container }}>
                    <div className="flex h-full flex-col">
                        {/* Preview header — shown when enabled or logo uploaded */}
                        {(data.show_header || !!data.primary_logo_url) && (
                            <div className="px-8 py-6 text-center" style={{ backgroundColor: data.colors.header }}>
                                {data.primary_logo_url ? (
                                    <img
                                        src={data.primary_logo_url}
                                        alt="Logo"
                                        className="mx-auto h-14 object-contain"
                                    />
                                ) : (
                                    <p className="text-lg font-bold text-white" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                                        {data.kit_name || 'Your Brand'}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Preview body */}
                        <div className="flex-1 px-8 py-10 text-center" style={{ backgroundColor: data.colors.container }}>
                            <h3 className="mb-4 text-xl font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: data.colors.foreground }}>
                                Your Journey Begins!
                            </h3>
                            <p className="mb-5 text-sm leading-relaxed text-[#5c7db5]">
                                Congratulations on taking this important step! You've joined a community of forward-thinkers and change-makers.
                            </p>
                            <p className="mb-5 text-sm leading-relaxed text-[#5c7db5]">
                                Every great journey starts with a single step. Complete your setup to unlock your full potential with us.
                            </p>
                            <button
                                className="mb-5 cursor-pointer rounded-lg px-8 py-3 text-sm font-semibold transition-colors"
                                style={{ backgroundColor: data.colors.accent, color: data.colors.button_text }}
                            >
                                Unlock Your Potential
                            </button>
                            <p className="mb-4 text-xs leading-relaxed text-[#8ba3cc]">
                                Remember, every expert was once a beginner. Our support team is here to guide you every step of the way.
                            </p>
                            <p className="text-xs font-medium" style={{ color: data.colors.foreground }}>
                                Believe in yourself,
                                <br />
                                {data.kit_name || 'Campaign'} Family
                            </p>
                        </div>

                        {/* Social icons */}
                        {data.socials.some(s => s.url) && (
                            <div className="flex items-center justify-center gap-3 py-4" style={{ backgroundColor: data.colors.container }}>
                                {data.socials.filter(s => s.url).map((s, i) => (
                                    <a
                                        key={i}
                                        href={s.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex h-9 w-9 items-center justify-center rounded-full transition-opacity hover:opacity-80"
                                        style={{ backgroundColor: data.colors.header }}
                                    >
                                        {hugeIconMap[s.platform] ? (
                                            <HugeiconsIcon icon={hugeIconMap[s.platform]} className="h-4 w-4 text-white" />
                                        ) : (
                                            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d={socialIconPaths[s.platform] || ''} />
                                            </svg>
                                        )}
                                    </a>
                                ))}
                            </div>
                        )}

                        {/* Footer preview — shown when enabled and has content */}
                        {data.show_footer && (data.disclaimers || data.copyright || data.address || data.footer) && (
                            <div className="border-t border-white/10 px-6 py-5 text-center" style={{ backgroundColor: data.colors.footer }}>
                                {data.disclaimers && (
                                    <p className="mb-2 text-[11px] leading-relaxed text-white/60">{data.disclaimers}</p>
                                )}
                                {data.footer && (
                                    <p className="mb-2 text-[11px] leading-relaxed text-white/60">{data.footer}</p>
                                )}
                                {data.copyright && (
                                    <p className="mb-1 text-[11px] text-white/60">
                                        Mail checks to:<br />{data.copyright}
                                    </p>
                                )}
                                {data.address && (
                                    <p className="text-[11px] text-white/60">{data.address}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
