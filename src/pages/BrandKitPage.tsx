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

export default function BrandKitPage() {
    const [kitName, setKitName] = useState('')
    const [website, setWebsite] = useState('')
    const [brandSummary, setBrandSummary] = useState('')
    const [address, setAddress] = useState('')
    const [toneOfVoice, setToneOfVoice] = useState('Inspirational')

    const handleSave = () => {
        // TODO: Save to Supabase
        console.log({ kitName, website, brandSummary, address, toneOfVoice })
    }

    return (
        <div className="flex h-full">
            {/* Form area */}
            <div className="flex-1 overflow-y-auto">
                {/* Top bar */}
                <div className="flex items-center justify-between border-b border-white/[0.06] px-8 py-4">
                    <h1 className="text-lg font-semibold text-white">{kitName || 'Untitled Kit'}</h1>
                    <Button
                        onClick={handleSave}
                        className="bg-white/10 text-white hover:bg-white/20 border border-white/10 cursor-pointer"
                        size="sm"
                    >
                        Save
                    </Button>
                </div>

                {/* Form content */}
                <div className="max-w-2xl px-8 py-8">
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
                                className="w-full rounded-lg border border-white/[0.08] bg-[#1e293b] px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-[#e8614d]/50 focus:ring-1 focus:ring-[#e8614d]/30"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-white/50">Website</label>
                            <input
                                type="url"
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                                placeholder="https://www.example.com/"
                                className="w-full rounded-lg border border-white/[0.08] bg-[#1e293b] px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-[#e8614d]/50 focus:ring-1 focus:ring-[#e8614d]/30"
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
                            className="w-full resize-none rounded-lg border border-white/[0.08] bg-[#1e293b] px-4 py-3 text-sm leading-relaxed text-white placeholder-white/30 outline-none transition-colors focus:border-[#e8614d]/50 focus:ring-1 focus:ring-[#e8614d]/30"
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
                            className="w-full rounded-lg border border-white/[0.08] bg-[#1e293b] px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-[#e8614d]/50 focus:ring-1 focus:ring-[#e8614d]/30"
                        />
                    </div>

                    {/* Tone of Voice */}
                    <div className="mb-6">
                        <label className="mb-2 block text-sm font-medium text-white/50">Tone of Voice</label>
                        <div className="relative">
                            <select
                                value={toneOfVoice}
                                onChange={(e) => setToneOfVoice(e.target.value)}
                                className="w-full appearance-none cursor-pointer rounded-lg border border-white/[0.08] bg-[#1e293b] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#e8614d]/50 focus:ring-1 focus:ring-[#e8614d]/30"
                            >
                                {toneOptions.map((tone) => (
                                    <option key={tone} value={tone} className="bg-[#1e293b]">
                                        {tone}
                                    </option>
                                ))}
                            </select>
                            <svg
                                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right preview panel */}
            <div className="hidden w-80 flex-shrink-0 border-l border-white/[0.06] bg-[#0f172a] p-6 xl:block">
                <div className="mx-auto max-w-[280px]">
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
                    </div>
                </div>
            </div>
        </div>
    )
}
