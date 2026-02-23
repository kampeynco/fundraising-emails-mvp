import type { EditorBlock, ModuleProps } from './types'

interface PropertiesPanelProps {
    selectedBlock: EditorBlock | null
    onUpdate: (props: Partial<ModuleProps>) => void
    brandKit: any
}

export function PropertiesPanel({ selectedBlock, onUpdate, brandKit: _brandKit }: PropertiesPanelProps) {
    if (!selectedBlock) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                <svg className="mb-3 h-10 w-10 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
                <p className="text-sm text-white/30">Select a block to edit its properties</p>
            </div>
        )
    }

    const { props } = selectedBlock

    return (
        <div className="p-4">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
                Properties
            </h3>

            {/* Padding */}
            <div className="mb-6">
                <label className="mb-2 block text-xs font-medium text-white/40">Padding (px)</label>
                <div className="grid grid-cols-4 gap-2">
                    {(['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'] as const).map((side) => (
                        <div key={side} className="flex flex-col items-center">
                            <input
                                type="number"
                                min={0}
                                max={100}
                                value={props[side]}
                                onChange={(e) => onUpdate({ [side]: parseInt(e.target.value) || 0 })}
                                className="w-full rounded-md border border-white/[0.1] bg-[#1e293b] px-2 py-1.5 text-center text-xs text-white focus:border-[#e8614d]/40 focus:outline-none"
                            />
                            <span className="mt-1 text-[10px] text-white/30">
                                {side.replace('padding', '').charAt(0)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Width */}
            <div className="mb-6">
                <label className="mb-2 block text-xs font-medium text-white/40">Width (px)</label>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-white/30">↔</span>
                    <input
                        type="number"
                        min={320}
                        max={900}
                        value={props.width}
                        onChange={(e) => onUpdate({ width: parseInt(e.target.value) || 600 })}
                        className="w-20 rounded-md border border-white/[0.1] bg-[#1e293b] px-2 py-1.5 text-center text-xs text-white focus:border-[#e8614d]/40 focus:outline-none"
                    />
                    <span className="text-xs text-white/30">px</span>
                </div>
            </div>

            {/* Background Color */}
            <div className="mb-6">
                <label className="mb-2 block text-xs font-medium text-white/40">Background Color</label>
                <div className="flex items-center gap-2">
                    <div
                        className="h-8 w-8 rounded-md border border-white/[0.1]"
                        style={{ backgroundColor: props.backgroundColor || '#ffffff' }}
                    />
                    <input
                        type="text"
                        value={props.backgroundColor || '#ffffff'}
                        onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                        placeholder="#ffffff"
                        className="flex-1 rounded-md border border-white/[0.1] bg-[#1e293b] px-2 py-1.5 text-xs text-white focus:border-[#e8614d]/40 focus:outline-none"
                    />
                </div>
            </div>

            {/* Block info */}
            <div className="border-t border-white/[0.06] pt-4">
                <p className="text-[11px] text-white/20">
                    Type: {selectedBlock.type === 'raw-html' ? 'Raw HTML' : `Module (${selectedBlock.category})`}
                </p>
                <p className="text-[11px] text-white/20 mt-0.5">
                    ID: {selectedBlock.id.slice(0, 8)}
                </p>
            </div>
        </div>
    )
}
