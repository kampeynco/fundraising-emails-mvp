import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useBrandKit, type BrandKitSocial } from '@/hooks/useBrandKit'

const toneOptions = [
    'Inspirational',
    'Urgent',
    'Personal',
    'Professional',
    'Conversational',
    'Empathetic',
    'Bold',
]

const socialPlatforms = [
    'Instagram',
    'Facebook',
    'Twitter / X',
    'Bluesky',
    'LinkedIn',
    'TikTok',
    'YouTube',
    'Threads',
]

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

    const inputClasses = "w-full rounded-lg border border-white/[0.08] bg-[#1e293b] px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-[#e8614d]/50 focus:ring-1 focus:ring-[#e8614d]/30"

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-white/50">Loading brand kit...</div>
            </div>
        )
    }

    return (
        <div className="flex h-full">
            {/* Form area */}
            <div className="flex-1 overflow-y-auto">
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

                    {/* ── BRAND DETAILS ── */}
                    <section id="brand-details">
                        <h2 className="mb-8 text-xl font-semibold text-white" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                            Brand Details
                        </h2>

                        <div className="mb-6 grid grid-cols-2 gap-6">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-white/50">Kit Name</label>
                                <input
                                    type="text"
                                    value={data.kit_name}
                                    onChange={(e) => updateField('kit_name', e.target.value)}
                                    placeholder="My Campaign"
                                    className={inputClasses}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-white/50">Website</label>
                                <input
                                    type="url"
                                    value={data.website}
                                    onChange={(e) => updateField('website', e.target.value)}
                                    placeholder="https://www.example.com/"
                                    className={inputClasses}
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="mb-2 block text-sm font-medium text-white/50">Brand Summary</label>
                            <textarea
                                value={data.brand_summary}
                                onChange={(e) => updateField('brand_summary', e.target.value)}
                                placeholder="Describe your campaign's brand, mission, and key messages..."
                                rows={5}
                                className={`${inputClasses} resize-none leading-relaxed`}
                            />
                        </div>

                        <div className="mb-6">
                            <label className="mb-2 block text-sm font-medium text-white/50">Address</label>
                            <input
                                type="text"
                                value={data.address}
                                onChange={(e) => updateField('address', e.target.value)}
                                placeholder="1000 Main Street NW, Suite 100, Washington, DC 20001"
                                className={inputClasses}
                            />
                        </div>

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

                    {/* ── CONTENT: LEGAL ── */}
                    <section id="legal">
                        <h2 className="mb-2 text-xl font-semibold text-white" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                            Content
                        </h2>

                        <div className="mb-6 mt-6">
                            <label className="mb-2 block text-sm font-medium text-white/50">Copyright</label>
                            <input
                                type="text"
                                value={data.copyright}
                                onChange={(e) => updateField('copyright', e.target.value)}
                                placeholder="Add your copyright notice"
                                className={inputClasses}
                            />
                        </div>

                        <div className="mb-6">
                            <label className="mb-2 block text-sm font-medium text-white/50">Footer</label>
                            <input
                                type="text"
                                value={data.footer}
                                onChange={(e) => updateField('footer', e.target.value)}
                                placeholder="Add standard footer text that appears in every email"
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
                    <section id="socials">
                        <h2 className="mb-6 text-xl font-semibold text-white" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                            Socials
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
                            + Add social link
                        </button>
                    </section>

                    <hr className="border-white/[0.06]" />

                    {/* ── VISUALS: LOGOS ── */}
                    <section id="logos">
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
                                <p className="mt-2 text-sm font-medium text-white">Primary</p>
                                <p className="text-xs text-white/40">Your main logo, usually full-width</p>
                            </div>

                            {/* Icon Logo */}
                            <div>
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
                                <p className="mt-2 text-sm font-medium text-white">Icon</p>
                                <p className="text-xs text-white/40">A simplified version</p>
                            </div>
                        </div>
                    </section>

                    <hr className="border-white/[0.06]" />

                    {/* ── VISUALS: COLORS ── */}
                    <section id="color" className="pb-16">
                        <h2 className="mb-2 text-xl font-semibold text-white" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                            Colors
                        </h2>
                        <p className="mb-6 text-sm text-white/40">Set the look and feel of your email with your brand colors.</p>

                        <div className="grid grid-cols-2 gap-6 mb-8">
                            {[
                                { key: 'background' as const, label: 'Background', desc: 'The main background of your email' },
                                { key: 'container' as const, label: 'Container', desc: 'The content box of the email' },
                                { key: 'accent' as const, label: 'Accent', desc: 'Buttons, links, and highlights' },
                                { key: 'button_text' as const, label: 'Button Text', desc: 'Text on buttons' },
                            ].map((item) => (
                                <div key={item.key}>
                                    <label className="group cursor-pointer">
                                        <div
                                            className="h-36 rounded-xl border border-white/[0.08] transition-colors hover:border-[#e8614d]/40"
                                            style={{ backgroundColor: data.colors[item.key] }}
                                        />
                                        <input
                                            type="color"
                                            value={data.colors[item.key]}
                                            onChange={(e) => updateField('colors', { ...data.colors, [item.key]: e.target.value })}
                                            className="sr-only"
                                        />
                                    </label>
                                    <p className="mt-2 text-sm font-medium text-white">{item.label}</p>
                                    <p className="text-xs text-white/40">{item.desc}</p>
                                </div>
                            ))}
                        </div>

                        <div>
                            <label className="group cursor-pointer">
                                <div
                                    className="h-36 rounded-xl border border-white/[0.08] transition-colors hover:border-[#e8614d]/40"
                                    style={{ backgroundColor: data.colors.foreground }}
                                />
                                <input
                                    type="color"
                                    value={data.colors.foreground}
                                    onChange={(e) => updateField('colors', { ...data.colors, foreground: e.target.value })}
                                    className="sr-only"
                                />
                            </label>
                            <p className="mt-2 text-sm font-medium text-white">Foreground</p>
                            <p className="text-xs text-white/40">Text and other content elements</p>
                        </div>
                    </section>

                </div>
            </div>

            {/* Right preview panel */}
            <div className="hidden w-80 flex-shrink-0 border-l border-white/[0.06] bg-[#0f172a] p-6 xl:block">
                <div className="sticky top-6 mx-auto max-w-[280px]">
                    <div className="overflow-hidden rounded-xl bg-white shadow-2xl shadow-black/30">
                        {/* Preview header */}
                        <div className="bg-gradient-to-br from-[#0f2137] to-[#142d48] px-5 py-4 text-center">
                            <p className="text-sm font-bold text-white" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                                Fundraising <span className="text-[#e8614d]">Emails</span>
                            </p>
                        </div>
                        {/* Preview body */}
                        <div className="px-5 py-6 text-center" style={{ backgroundColor: data.colors.background }}>
                            <h3 className="mb-3 text-base font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: data.colors.foreground }}>
                                Your Journey Begins!
                            </h3>
                            <p className="mb-4 text-xs leading-relaxed text-[#5c7db5]">
                                Congratulations on taking this important step! You've joined a community of forward-thinkers and change-makers.
                            </p>
                            <p className="mb-4 text-xs leading-relaxed text-[#5c7db5]">
                                Every great journey starts with a single step. Complete your setup to unlock your full potential with us.
                            </p>
                            <button
                                className="mb-4 cursor-pointer rounded-lg px-5 py-2.5 text-xs font-semibold transition-colors"
                                style={{ backgroundColor: data.colors.accent, color: data.colors.button_text }}
                            >
                                Unlock Your Potential
                            </button>
                            <p className="mb-3 text-[10px] leading-relaxed text-[#8ba3cc]">
                                Remember, every expert was once a beginner. Our support team is here to guide you every step of the way.
                            </p>
                            <p className="text-[10px] font-medium" style={{ color: data.colors.foreground }}>
                                Believe in yourself,
                                <br />
                                {data.kit_name || 'Campaign'} Family
                            </p>
                        </div>

                        {/* Social icons */}
                        {data.socials.some(s => s.url) && (
                            <div className="flex items-center justify-center gap-2 pb-2" style={{ backgroundColor: data.colors.background }}>
                                {data.socials.filter(s => s.url).map((s, i) => (
                                    <div key={i} className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0f2137]">
                                        <span className="text-[8px] font-bold text-white">{s.platform[0]}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Footer preview */}
                        <div className="border-t border-gray-100 px-4 py-3 text-center" style={{ backgroundColor: data.colors.background }}>
                            {data.disclaimers && (
                                <p className="mb-1 text-[8px] leading-relaxed text-[#8ba3cc]">{data.disclaimers}</p>
                            )}
                            {data.copyright && (
                                <p className="text-[8px] text-[#8ba3cc]">{data.copyright}</p>
                            )}
                            {data.address && (
                                <p className="text-[8px] text-[#8ba3cc]">{data.address}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
