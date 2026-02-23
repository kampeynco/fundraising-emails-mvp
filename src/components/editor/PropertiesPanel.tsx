import { useState } from 'react'
import type { EditorBlock, ModuleProps } from './types'
import { ImageUploader } from './ImageUploader'

interface PropertiesPanelProps {
    selectedBlock: EditorBlock | null
    onUpdate: (props: Partial<ModuleProps>) => void
    brandKit: any
    canvasOuterBg: string
    canvasInnerBg: string
    onCanvasOuterBgChange: (color: string) => void
    onCanvasInnerBgChange: (color: string) => void
}

const EMAIL_FONTS = [
    { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
    { label: 'Georgia', value: 'Georgia, Times, serif' },
    { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
    { label: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
    { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
    { label: 'Courier New', value: '"Courier New", monospace' },
]

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

export function PropertiesPanel({ selectedBlock, onUpdate, brandKit, canvasOuterBg, canvasInnerBg, onCanvasOuterBgChange, onCanvasInnerBgChange }: PropertiesPanelProps) {
    const [linkUrl, setLinkUrl] = useState('')

    // Parse brand colors (used in both views)
    const brandColors: string[] = brandKit?.colors
        ? (Object.values(
            typeof brandKit.colors === 'string'
                ? JSON.parse(brandKit.colors)
                : brandKit.colors
        ) as string[]).slice(0, 6)
        : []

    if (!selectedBlock) {
        return (
            <div className="h-full overflow-y-auto">
                <div className="border-b border-white/[0.06] px-4 py-3">
                    <p className="text-xs font-medium text-white/50">Canvas Settings</p>
                    <p className="mt-0.5 text-[10px] text-white/25">Select a block to edit its properties</p>
                </div>

                {/* Outer canvas background */}
                <PropertyGroup label="Outer Background">
                    <div className="space-y-2">
                        <p className="text-[10px] text-white/20">The area surrounding the email body</p>
                        <div className="flex items-center gap-2">
                            <div
                                className="h-7 w-7 shrink-0 rounded border border-white/[0.1]"
                                style={{ backgroundColor: canvasOuterBg || '#e5e7eb' }}
                            />
                            <input
                                type="text"
                                value={canvasOuterBg || '#e5e7eb'}
                                onChange={(e) => onCanvasOuterBgChange(e.target.value)}
                                placeholder="#e5e7eb"
                                className="h-7 flex-1 rounded border border-white/[0.08] bg-[#1e293b] px-2 text-xs text-white/70 outline-none transition-colors focus:border-[#e8614d]/40"
                            />
                        </div>
                        {brandColors.length > 0 && (
                            <div className="flex gap-1">
                                {brandColors.map((color, i) => (
                                    <button
                                        key={i}
                                        onClick={() => onCanvasOuterBgChange(color)}
                                        className="h-5 w-5 rounded border border-white/[0.1] transition-transform hover:scale-110"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </PropertyGroup>

                {/* Inner canvas background */}
                <PropertyGroup label="Email Body Background">
                    <div className="space-y-2">
                        <p className="text-[10px] text-white/20">The centered email content area</p>
                        <div className="flex items-center gap-2">
                            <div
                                className="h-7 w-7 shrink-0 rounded border border-white/[0.1]"
                                style={{ backgroundColor: canvasInnerBg || '#ffffff' }}
                            />
                            <input
                                type="text"
                                value={canvasInnerBg || '#ffffff'}
                                onChange={(e) => onCanvasInnerBgChange(e.target.value)}
                                placeholder="#ffffff"
                                className="h-7 flex-1 rounded border border-white/[0.08] bg-[#1e293b] px-2 text-xs text-white/70 outline-none transition-colors focus:border-[#e8614d]/40"
                            />
                        </div>
                        {brandColors.length > 0 && (
                            <div className="flex gap-1">
                                {brandColors.map((color, i) => (
                                    <button
                                        key={i}
                                        onClick={() => onCanvasInnerBgChange(color)}
                                        className="h-5 w-5 rounded border border-white/[0.1] transition-transform hover:scale-110"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </PropertyGroup>
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

            {/* Typography — font family, size, color */}
            <PropertyGroup label="Typography">
                <div className="space-y-3">
                    {/* Font family */}
                    <div className="space-y-1.5">
                        <label className="text-xs text-white/40">Font Family</label>
                        <select
                            value={props.fontFamily || 'Arial, Helvetica, sans-serif'}
                            onChange={(e) => onUpdate({ fontFamily: e.target.value })}
                            className="h-8 w-full rounded border border-white/[0.08] bg-[#1e293b] px-2 text-xs text-white/70 outline-none transition-colors focus:border-[#e8614d]/40 cursor-pointer"
                        >
                            {EMAIL_FONTS.map((f) => (
                                <option key={f.value} value={f.value}>
                                    {f.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Font size */}
                    <NumberInput
                        label="Font Size"
                        value={props.fontSize || 16}
                        onChange={(v) => onUpdate({ fontSize: v })}
                        min={10}
                        max={72}
                    />

                    {/* Font color */}
                    <div className="space-y-1.5">
                        <label className="text-xs text-white/40">Font Color</label>
                        <div className="flex items-center gap-2">
                            <div
                                className="h-7 w-7 shrink-0 rounded border border-white/[0.1]"
                                style={{ backgroundColor: props.fontColor || '#333333' }}
                            />
                            <input
                                type="text"
                                value={props.fontColor || '#333333'}
                                onChange={(e) => onUpdate({ fontColor: e.target.value })}
                                placeholder="#333333"
                                className="h-7 flex-1 rounded border border-white/[0.08] bg-[#1e293b] px-2 text-xs text-white/70 outline-none transition-colors focus:border-[#e8614d]/40"
                            />
                        </div>
                        {/* Brand color swatches */}
                        {brandColors.length > 0 && (
                            <div className="flex gap-1 pt-1">
                                {brandColors.map((color, i) => (
                                    <button
                                        key={i}
                                        onClick={() => onUpdate({ fontColor: color })}
                                        className="h-5 w-5 rounded border border-white/[0.1] transition-transform hover:scale-110"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <p className="text-[10px] text-white/20 leading-relaxed pt-1">
                        Select text on the canvas to use the floating toolbar for bold, italic, underline, links, and text color.
                    </p>
                </div>
            </PropertyGroup>

            {/* Image sizing */}
            <PropertyGroup label="Images">
                <NumberInput
                    label="Image Width (%)"
                    value={props.imageMaxHeight || 100}
                    onChange={(v) => onUpdate({ imageMaxHeight: v })}
                    min={10}
                    max={100}
                />
                <p className="text-[10px] text-white/20 leading-relaxed pt-1">
                    Scales images and logos as a percentage of block width.
                </p>
            </PropertyGroup>

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
                    {brandColors.length > 0 && (
                        <div className="flex gap-1">
                            {brandColors.slice(0, 4).map((color, i) => (
                                <button
                                    key={i}
                                    onClick={() => onUpdate({ backgroundColor: color })}
                                    className="h-5 w-5 rounded border border-white/[0.1] transition-transform hover:scale-110"
                                    style={{ backgroundColor: color }}
                                    title={color}
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
                        const imgTag = `<img src="${url}" alt="Uploaded image" style="max-width:100%;height:auto;border-radius:4px;" />`
                        const currentHtml = selectedBlock.html
                        onUpdate({} as any)
                        const event = new CustomEvent('editor:insertHtml', { detail: { blockId: selectedBlock.id, html: imgTag, currentHtml } })
                        window.dispatchEvent(event)
                    }}
                />
            </PropertyGroup>
        </div>
    )
}
