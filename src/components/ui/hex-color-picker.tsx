import { useState, useRef, useEffect } from 'react'
import { HexColorPicker } from 'react-colorful'

interface HexColorPickerFieldProps {
    color: string
    onChange: (color: string) => void
    label: string
    description: string
}

export function HexColorPickerField({ color, onChange, label, description }: HexColorPickerFieldProps) {
    const [open, setOpen] = useState(false)
    const [hexInput, setHexInput] = useState(color.toUpperCase())
    const popoverRef = useRef<HTMLDivElement>(null)

    // Sync hex input with external color changes
    useEffect(() => {
        setHexInput(color.toUpperCase())
    }, [color])

    // Close on outside click
    useEffect(() => {
        if (!open) return
        const handleClick = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [open])

    const handleHexChange = (value: string) => {
        // Allow typing with validation
        const v = value.startsWith('#') ? value : '#' + value
        if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) {
            setHexInput(v.toUpperCase())
            if (v.length === 7) {
                onChange(v)
            }
        }
    }

    return (
        <div className="relative" ref={popoverRef}>
            {/* Color swatch */}
            <div
                className="h-36 cursor-pointer rounded-xl border border-white/[0.08] transition-all hover:border-[#e8614d]/40 hover:shadow-lg hover:shadow-black/20"
                style={{ backgroundColor: color }}
                onClick={() => setOpen(!open)}
            />

            {/* Label + description */}
            <p className="mt-2 text-sm font-medium text-white">{label}</p>
            <p className="text-xs text-white/40">{description}</p>

            {/* Popover color picker */}
            {open && (
                <div className="absolute left-0 top-[calc(100%+8px)] z-50 rounded-xl border border-white/[0.1] bg-[#1e293b] p-3 shadow-2xl shadow-black/40">
                    <HexColorPicker
                        color={color}
                        onChange={(c) => {
                            onChange(c)
                            setHexInput(c.toUpperCase())
                        }}
                    />
                    {/* Hex input inside picker */}
                    <div className="mt-3 flex items-center gap-2">
                        <div
                            className="h-7 w-7 flex-shrink-0 rounded-md border border-white/[0.08]"
                            style={{ backgroundColor: color }}
                        />
                        <input
                            type="text"
                            value={hexInput}
                            onChange={(e) => handleHexChange(e.target.value)}
                            maxLength={7}
                            className="w-full rounded-md border border-white/[0.08] bg-[#0f172a] px-3 py-1.5 text-sm font-mono text-white outline-none transition-colors focus:border-[#e8614d]/50"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
