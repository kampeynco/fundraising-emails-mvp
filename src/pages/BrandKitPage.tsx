import { useState } from 'react'
import { Button } from '@/components/ui/button'

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
    const [kitName, setKitName] = useState('')
    const [website, setWebsite] = useState('')
    const [brandSummary, setBrandSummary] = useState('')
    const [address, setAddress] = useState('')
    const [toneOfVoice, setToneOfVoice] = useState('Inspirational')

    // Legal
    const [copyright, setCopyright] = useState('')
    const [footer, setFooter] = useState('')
    const [disclaimers, setDisclaimers] = useState('')

    // Socials
    const [socials, setSocials] = useState([
        { platform: 'Instagram', url: '' },
        { platform: 'Bluesky', url: '' },
    ])

    const handleSave = () => {
        // TODO: Save to Supabase
        console.log({ kitName, website, brandSummary, address, toneOfVoice, copyright, footer, disclaimers, socials })
    }

    const updateSocial = (index: number, field: 'platform' | 'url', value: string) => {
        setSocials(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
    }

    const addSocial = () => {
        setSocials(prev => [...prev, { platform: 'Facebook', url: '' }])
    }

    const inputClasses = "w-full rounded-lg border border-white/[0.08] bg-[#1e293b] px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-[#e8614d]/50 focus:ring-1 focus:ring-[#e8614d]/30"

    return (
        <div className="flex h-full">
            {/* Form area */}
            <div className="flex-1 overflow-y-auto">
                {/* Top bar */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.06] bg-[#111827]/95 backdrop-blur-sm px-8 py-4">
                    <h1 className="text-lg font-semibold text-white">{kitName || 'Untitled Kit'}</h1>
                    <Button
                        onClick={handleSave}
                        className="bg-white/10 text-white hover:bg-white/20 border border-white/10 cursor-pointer"
                        size="sm"
                    >
                        Save
                    </Button>
                </div>

                {/* ═══════ SCROLLABLE FORM CONTENT ═══════ */}
                <div className="max-w-2xl px-8 py-8 space-y-12">

                    {/* ── BRAND DETAILS ── */}
                    <section id="brand-details">
                        <h2 className="mb-8 text-xl font-semibold text-white" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                            Brand Details
                        </h2>

                        {/* Kit Name + Website row */}
                        <div className="mb-6 grid grid-cols-2 gap-6">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-white/50">Kit Name</label>
                                <input
                                    type="text"
                                    value={kitName}
                                    onChange={(e) => setKitName(e.target.value)}
                                    placeholder="My Campaign"
                                    className={inputClasses}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-white/50">Website</label>
                                <input
                                    type="url"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    placeholder="https://www.example.com/"
                                    className={inputClasses}
                                />
                            </div>
                        </div>

                        {/* Brand Summary */}
                        <div className="mb-6">
                            <label className="mb-2 block text-sm font-medium text-white/50">Brand Summary</label>
                            <textarea
                                value={brandSummary}
                                onChange={(e) => setBrandSummary(e.target.value)}
                                placeholder="Describe your campaign's brand, mission, and key messages..."
                                rows={5}
                                className={`${inputClasses} resize-none leading-relaxed`}
                            />
                        </div>

                        {/* Address */}
                        <div className="mb-6">
                            <label className="mb-2 block text-sm font-medium text-white/50">Address</label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="1000 Main Street NW, Suite 100, Washington, DC 20001"
                                className={inputClasses}
                            />
                        </div>

                        {/* Tone of Voice */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-white/50">Tone of Voice</label>
                            <div className="relative">
                                <select
                                    value={toneOfVoice}
                                    onChange={(e) => setToneOfVoice(e.target.value)}
                                    className={`${inputClasses} appearance-none cursor-pointer`}
                                >
                                    {toneOptions.map((tone) => (
                                        <option key={tone} value={tone} className="bg-[#1e293b]">
                                            {tone}
                                        </option>
                                    ))}
                                </select>
                                <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </section>

                    {/* ── Divider ── */}
                    <hr className="border-white/[0.06]" />

                    {/* ── CONTENT: LEGAL ── */}
                    <section id="legal">
                        <h2 className="mb-2 text-xl font-semibold text-white" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                            Content
                        </h2>

                        {/* Copyright */}
                        <div className="mb-6 mt-6">
                            <label className="mb-2 block text-sm font-medium text-white/50">Copyright</label>
                            <input
                                type="text"
                                value={copyright}
                                onChange={(e) => setCopyright(e.target.value)}
                                placeholder="Add your copyright notice"
                                className={inputClasses}
                            />
                        </div>

                        {/* Footer */}
                        <div className="mb-6">
                            <label className="mb-2 block text-sm font-medium text-white/50">Footer</label>
                            <input
                                type="text"
                                value={footer}
                                onChange={(e) => setFooter(e.target.value)}
                                placeholder="Add standard footer text that appears in every email"
                                className={inputClasses}
                            />
                        </div>

                        {/* Disclaimers */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-white/50">Disclaimers</label>
                            <input
                                type="text"
                                value={disclaimers}
                                onChange={(e) => setDisclaimers(e.target.value)}
                                placeholder="Paid for by Campaign Name 2026. Treasurer Name, Treasurer."
                                className={inputClasses}
                            />
                        </div>
                    </section>

                    {/* ── Divider ── */}
                    <hr className="border-white/[0.06]" />

                    {/* ── CONTENT: SOCIALS ── */}
                    <section id="socials">
                        <h2 className="mb-6 text-xl font-semibold text-white" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                            Socials
                        </h2>

                        <div className="space-y-3">
                            {socials.map((social, index) => (
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

                    {/* ── Divider ── */}
                    <hr className="border-white/[0.06]" />

                    {/* ── VISUALS: LOGOS ── */}
                    <section id="logos">
                        <h2 className="mb-2 text-xl font-semibold text-white" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                            Logos
                        </h2>
                        <p className="mb-6 text-sm text-white/40">Add the logos that represent your brand.</p>

                        <div className="grid grid-cols-2 gap-6">
                            {/* Primary Logo */}
                            <div>
                                <div className="flex h-44 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-white/[0.1] bg-[#1e293b] transition-colors hover:border-[#e8614d]/40 hover:bg-[#1e293b]/80">
                                    <div className="text-center">
                                        <svg className="mx-auto mb-2 h-8 w-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                                        </svg>
                                        <p className="text-xs text-white/30">Upload logo</p>
                                    </div>
                                </div>
                                <p className="mt-2 text-sm font-medium text-white">Primary</p>
                                <p className="text-xs text-white/40">Your main logo, usually full-width</p>
                            </div>

                            {/* Icon Logo */}
                            <div>
                                <div className="flex h-44 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-white/[0.1] bg-[#1e293b] transition-colors hover:border-[#e8614d]/40 hover:bg-[#1e293b]/80">
                                    <div className="text-center">
                                        <svg className="mx-auto mb-2 h-8 w-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                                        </svg>
                                        <p className="text-xs text-white/30">Upload icon</p>
                                    </div>
                                </div>
                                <p className="mt-2 text-sm font-medium text-white">Icon</p>
                                <p className="text-xs text-white/40">A simplified version</p>
                            </div>
                        </div>
                    </section>

                    {/* ── Divider ── */}
                    <hr className="border-white/[0.06]" />

                    {/* ── VISUALS: COLORS ── */}
                    <section id="color" className="pb-16">
                        <h2 className="mb-2 text-xl font-semibold text-white" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                            Colors
                        </h2>
                        <p className="mb-6 text-sm text-white/40">Set the look and feel of your email with your brand colors.</p>

                        <div className="grid grid-cols-2 gap-6 mb-8">
                            {/* Background */}
                            <div>
                                <div className="h-36 cursor-pointer rounded-xl border border-white/[0.08] bg-white transition-colors hover:border-[#e8614d]/40" />
                                <p className="mt-2 text-sm font-medium text-white">Background</p>
                                <p className="text-xs text-white/40">The main background of your email</p>
                            </div>

                            {/* Container */}
                            <div>
                                <div className="h-36 cursor-pointer rounded-xl border border-white/[0.08] bg-white transition-colors hover:border-[#e8614d]/40" />
                                <p className="mt-2 text-sm font-medium text-white">Container</p>
                                <p className="text-xs text-white/40">The content box of the email</p>
                            </div>

                            {/* Accent */}
                            <div>
                                <div className="h-36 cursor-pointer rounded-xl border border-white/[0.08] bg-[#e8614d] transition-colors hover:border-[#e8614d]/60" />
                                <p className="mt-2 text-sm font-medium text-white">Accent</p>
                                <p className="text-xs text-white/40">Buttons, links, and highlights</p>
                            </div>

                            {/* Button Text */}
                            <div>
                                <div className="h-36 cursor-pointer rounded-xl border border-white/[0.08] bg-white transition-colors hover:border-[#e8614d]/40" />
                                <p className="mt-2 text-sm font-medium text-white">Button Text</p>
                                <p className="text-xs text-white/40">Text on buttons</p>
                            </div>
                        </div>

                        {/* Foreground */}
                        <div>
                            <div className="h-36 cursor-pointer rounded-xl border border-white/[0.08] bg-[#1e293b] transition-colors hover:border-[#e8614d]/40" />
                            <p className="mt-2 text-sm font-medium text-white">Foreground</p>
                            <p className="text-xs text-white/40">Text and other content elements</p>
                        </div>
                    </section>

                </div>
            </div>

            {/* Right preview panel */}
            <div className="hidden w-80 flex-shrink-0 border-l border-white/[0.06] bg-[#0f172a] p-6 xl:block">
                <div className="sticky top-6 mx-auto max-w-[280px]">
                    {/* Email preview card */}
                    <div className="overflow-hidden rounded-xl bg-white shadow-2xl shadow-black/30">
                        {/* Preview header */}
                        <div className="bg-gradient-to-br from-[#0f2137] to-[#142d48] px-5 py-4 text-center">
                            <p className="text-sm font-bold text-white" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                                Fundraising <span className="text-[#e8614d]">Emails</span>
                            </p>
                        </div>
                        {/* Preview body */}
                        <div className="px-5 py-6 text-center">
                            <h3 className="mb-3 text-base font-bold text-[#0f2137]" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                                Your Journey Begins!
                            </h3>
                            <p className="mb-4 text-xs leading-relaxed text-[#5c7db5]">
                                Congratulations on taking this important step! You've joined a community of forward-thinkers and change-makers.
                            </p>
                            <p className="mb-4 text-xs leading-relaxed text-[#5c7db5]">
                                Every great journey starts with a single step. Complete your setup to unlock your full potential with us.
                            </p>
                            <button className="mb-4 cursor-pointer rounded-lg bg-[#e8614d] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#d4553f]">
                                Unlock Your Potential
                            </button>
                            <p className="mb-3 text-[10px] leading-relaxed text-[#8ba3cc]">
                                Remember, every expert was once a beginner. Our support team is here to guide you every step of the way.
                            </p>
                            <p className="text-[10px] font-medium text-[#5c7db5]">
                                Believe in yourself,
                                <br />
                                {kitName || 'Campaign'} Family
                            </p>
                        </div>

                        {/* Social icons */}
                        {socials.some(s => s.url) && (
                            <div className="flex items-center justify-center gap-2 pb-2">
                                {socials.filter(s => s.url).map((s, i) => (
                                    <div key={i} className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0f2137]">
                                        <span className="text-[8px] font-bold text-white">{s.platform[0]}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Footer preview */}
                        <div className="border-t border-gray-100 px-4 py-3 text-center">
                            {disclaimers && (
                                <p className="mb-1 text-[8px] leading-relaxed text-[#8ba3cc]">{disclaimers}</p>
                            )}
                            {copyright && (
                                <p className="text-[8px] text-[#8ba3cc]">{copyright}</p>
                            )}
                            {address && (
                                <p className="text-[8px] text-[#8ba3cc]">{address}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
