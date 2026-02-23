import { useState } from 'react'
import type { EditorBlock, ModuleProps } from './types'
import { ImageUploader } from './ImageUploader'

interface PropertiesPanelProps {
    selectedBlock: EditorBlock | null
    onUpdate: (props: Partial<ModuleProps>) => void
    brandKit: any
}

function PropertyGroup({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="border-b border-white/[0.06] px-4 py-4">
            <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">{label}</h4>
            {children}
        </div>
    )
}

function NumberInput({
    label,
    value,
    onChange,
    min = 0,
    max = 200,
    suffix = 'px',
}: {
    label: string
    value: number
    onChange: (v: number) => void
    min?: number
    max?: number
    suffix?: string
}) {
    return (
        <div className="flex items-center justify-between">
            <label className="text-xs text-white/40">{label}</label>
            <div className="flex items-center gap-1.5">
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value))))}
                    className="h-7 w-16 rounded border border-white/[0.08] bg-[#1e293b] px-2 text-right text-xs text-white/70 outline-none transition-colors focus:border-[#e8614d]/40"
                    min={min}
                    max={max}
                />
                <span className="text-[10px] text-white/25">{suffix}</span>
            </div>
        </div>
    )
}

export function PropertiesPanel({ selectedBlock, onUpdate, brandKit }: PropertiesPanelProps) {
    const [linkUrl, setLinkUrl] = useState('')

    if (!selectedBlock) {
        return (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <svg className="mb-3 h-10 w-10 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm font-medium text-white/25">No block selected</p>
                <p className="mt-1 text-xs text-white/15">Click a block on the canvas to edit</p>
            </div>
        )
    }

    const props = selectedBlock.props

    return (
        <div className="h-full overflow-y-auto">
            {/* Block info header */}
            <div className="border-b border-white/[0.06] px-4 py-3">
                <p className="text-xs font-medium text-white/50">
                    {selectedBlock.category
                        ? selectedBlock.category.charAt(0).toUpperCase() + selectedBlock.category.slice(1) + ' Block'
                        : 'Raw HTML Block'}
                </p>
                {selectedBlock.moduleId && (
                    <p className="mt-0.5 text-[10px] text-white/25">{selectedBlock.moduleId}</p>
                )}
            </div>

            {/* Spacing controls */}
            <PropertyGroup label="Spacing">
                <div className="space-y-2.5">
                    <NumberInput label="Top" value={props.paddingTop} onChange={(v) => onUpdate({ paddingTop: v })} />
                    <NumberInput label="Right" value={props.paddingRight} onChange={(v) => onUpdate({ paddingRight: v })} />
                    <NumberInput label="Bottom" value={props.paddingBottom} onChange={(v) => onUpdate({ paddingBottom: v })} />
                    <NumberInput label="Left" value={props.paddingLeft} onChange={(v) => onUpdate({ paddingLeft: v })} />
                </div>
            </PropertyGroup>

            {/* Width */}
            <PropertyGroup label="Layout">
                <NumberInput label="Width" value={props.width} onChange={(v) => onUpdate({ width: v })} min={320} max={800} />
            </PropertyGroup>

            {/* Background Color */}
            <PropertyGroup label="Background">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={props.backgroundColor || ''}
                        onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                        placeholder="#ffffff"
                        className="h-7 flex-1 rounded border border-white/[0.08] bg-[#1e293b] px-2 text-xs text-white/70 outline-none transition-colors focus:border-[#e8614d]/40"
                    />
                    {brandKit?.colors && (
                        <div className="flex gap-1">
                            {Object.values(
                                typeof brandKit.colors === 'string'
                                    ? JSON.parse(brandKit.colors)
                                    : brandKit.colors
                            ).slice(0, 4).map((color, i) => (
                                <button
                                    key={i}
                                    onClick={() => onUpdate({ backgroundColor: color as string })}
                                    className="h-5 w-5 rounded border border-white/[0.1] transition-transform hover:scale-110"
                                    style={{ backgroundColor: color as string }}
                                    title={color as string}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </PropertyGroup>

            {/* Link URL editing */}
            <PropertyGroup label="Link / Button URL">
                <div className="space-y-2">
                    <input
                        type="url"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="https://example.com/donate"
                        className="h-8 w-full rounded border border-white/[0.08] bg-[#1e293b] px-2 text-xs text-white/70 outline-none transition-colors focus:border-[#e8614d]/40"
                    />
                    <p className="text-[10px] text-white/20">Select a link/button on canvas, then enter URL</p>
                </div>
            </PropertyGroup>

            {/* Image upload */}
            <PropertyGroup label="Media">
                <ImageUploader
                    onUpload={(url) => {
                        // Insert image at cursor or append to block
                        const imgTag = `<img src="${url}" alt="Uploaded image" style="max-width:100%;height:auto;border-radius:4px;" />`
                        const currentHtml = selectedBlock.html
                        onUpdate({} as any)
                        // Update parent with new HTML
                        const event = new CustomEvent('editor:insertHtml', { detail: { blockId: selectedBlock.id, html: imgTag, currentHtml } })
                        window.dispatchEvent(event)
                    }}
                />
            </PropertyGroup>

            {/* Font size hint */}
            <PropertyGroup label="Typography">
                <p className="text-[10px] text-white/20 leading-relaxed">
                    Select text on the canvas to use the floating toolbar for bold, italic, underline, links, and alignment.
                </p>
            </PropertyGroup>
        </div>
    )
}
