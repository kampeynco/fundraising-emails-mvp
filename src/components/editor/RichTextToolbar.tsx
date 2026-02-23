import { useState, useEffect, useRef, useCallback } from 'react'

interface RichTextToolbarProps {
    /** The container element to watch for text selections */
    containerRef: React.RefObject<HTMLElement | null>
}

/**
 * Floating toolbar that appears when text is selected inside the editor canvas.
 * Provides bold, italic, underline, link, and alignment controls.
 */
export function RichTextToolbar({ containerRef }: RichTextToolbarProps) {
    const [visible, setVisible] = useState(false)
    const [position, setPosition] = useState({ top: 0, left: 0 })
    const toolbarRef = useRef<HTMLDivElement>(null)

    const checkSelection = useCallback(() => {
        const selection = window.getSelection()
        if (!selection || selection.isCollapsed || !selection.rangeCount) {
            setVisible(false)
            return
        }

        // Ensure the selection is within our container
        const range = selection.getRangeAt(0)
        if (!containerRef.current?.contains(range.commonAncestorContainer)) {
            setVisible(false)
            return
        }

        const rect = range.getBoundingClientRect()
        const containerRect = containerRef.current.getBoundingClientRect()

        setPosition({
            top: rect.top - containerRect.top - 44,
            left: rect.left - containerRect.left + rect.width / 2 - 120,
        })
        setVisible(true)
    }, [containerRef])

    useEffect(() => {
        document.addEventListener('selectionchange', checkSelection)
        return () => document.removeEventListener('selectionchange', checkSelection)
    }, [checkSelection])

    const execCommand = useCallback((command: string, value?: string) => {
        document.execCommand(command, false, value)
        // Keep selection after command
        checkSelection()
    }, [checkSelection])

    const handleLink = useCallback(() => {
        const url = window.prompt('Enter URL:')
        if (url) {
            execCommand('createLink', url)
        }
    }, [execCommand])

    if (!visible) return null

    return (
        <div
            ref={toolbarRef}
            className="absolute z-50 flex items-center gap-0.5 rounded-lg border border-white/[0.1] bg-[#1e293b] px-1.5 py-1 shadow-xl"
            style={{ top: position.top, left: Math.max(0, position.left) }}
            onMouseDown={(e) => e.preventDefault()} // Prevent losing selection
        >
            <ToolbarButton
                onClick={() => execCommand('bold')}
                title="Bold (Cmd+B)"
                active={document.queryCommandState('bold')}
            >
                <strong>B</strong>
            </ToolbarButton>
            <ToolbarButton
                onClick={() => execCommand('italic')}
                title="Italic (Cmd+I)"
                active={document.queryCommandState('italic')}
            >
                <em>I</em>
            </ToolbarButton>
            <ToolbarButton
                onClick={() => execCommand('underline')}
                title="Underline (Cmd+U)"
                active={document.queryCommandState('underline')}
            >
                <span className="underline">U</span>
            </ToolbarButton>

            <div className="mx-1 h-4 w-px bg-white/[0.1]" />

            <ToolbarButton onClick={handleLink} title="Insert Link">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
            </ToolbarButton>
            <ToolbarButton
                onClick={() => execCommand('unlink')}
                title="Remove Link"
            >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    <line x1="4" y1="20" x2="20" y2="4" strokeWidth={2.5} className="text-red-400" />
                </svg>
            </ToolbarButton>

            <div className="mx-1 h-4 w-px bg-white/[0.1]" />

            <ToolbarButton onClick={() => execCommand('justifyLeft')} title="Align Left">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="18" y2="18" />
                </svg>
            </ToolbarButton>
            <ToolbarButton onClick={() => execCommand('justifyCenter')} title="Align Center">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <line x1="3" y1="6" x2="21" y2="6" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
                </svg>
            </ToolbarButton>

            <div className="mx-1 h-4 w-px bg-white/[0.1]" />

            {/* Font color */}
            <ToolbarButton
                onClick={() => {
                    const color = window.prompt('Enter text color (hex):', '#e8614d')
                    if (color) execCommand('foreColor', color)
                }}
                title="Text Color"
            >
                <span className="relative text-xs font-bold">
                    A
                    <span className="absolute -bottom-0.5 left-0 right-0 h-[2px] rounded bg-[#e8614d]" />
                </span>
            </ToolbarButton>
        </div>
    )
}

function ToolbarButton({
    onClick,
    title,
    active = false,
    children,
}: {
    onClick: () => void
    title: string
    active?: boolean
    children: React.ReactNode
}) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={`flex h-7 w-7 items-center justify-center rounded text-xs transition-colors ${active
                ? 'bg-[#e8614d]/20 text-[#e8614d]'
                : 'text-white/60 hover:bg-white/[0.08] hover:text-white'
                }`}
        >
            {children}
        </button>
    )
}
