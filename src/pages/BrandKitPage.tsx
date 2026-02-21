import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { HexColorPickerField } from '@/components/ui/hex-color-picker'
import { useBrandKit, type BrandKitSocial } from '@/hooks/useBrandKit'

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

                    {/* ── BRAND DETAILS ── */}
                    <section id="brand-details" className="scroll-mt-20">
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
                    <section id="legal" className="scroll-mt-20">
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
                    <section id="socials" className="scroll-mt-20">
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
                    <div>
                        {/* Preview header — shown when enabled or logo uploaded */}
                        {(data.show_header || !!data.primary_logo_url) && (
                            <div className="px-8 py-6 text-center" style={{ backgroundColor: data.colors.header }}>
                                {data.primary_logo_url ? (
                                    <img
                                        src={data.primary_logo_url}
                                        alt="Logo"
                                        className="mx-auto h-10 object-contain"
                                    />
                                ) : (
                                    <p className="text-lg font-bold text-white" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                                        {data.kit_name || 'Your Brand'}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Preview body */}
                        <div className="px-8 py-10 text-center" style={{ backgroundColor: data.colors.container }}>
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
                            <div className="flex items-center justify-center gap-3 pb-4" style={{ backgroundColor: data.colors.container }}>
                                {data.socials.filter(s => s.url).map((s, i) => (
                                    <div key={i} className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: data.colors.header }}>
                                        <span className="text-[10px] font-bold text-white">{s.platform[0]}</span>
                                    </div>
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
                                    <p className="mb-1 text-[11px] text-white/60">{data.copyright}</p>
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
