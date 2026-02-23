import { useRef, useState, useCallback } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { EditorBlock } from './types'
import { RichTextToolbar } from './RichTextToolbar'

interface EditorCanvasProps {
    blocks: EditorBlock[]
    onBlocksChange: (blocks: EditorBlock[]) => void
    selectedBlockId: string | null
    onSelectBlock: (id: string | null) => void
    brandKit: any
    outerBg: string
    innerBg: string
    onOuterBgChange: (color: string) => void
    onInnerBgChange: (color: string) => void
}

/* ─── Drop zone indicator between blocks ─── */
function DropZoneIndicator({ isOver }: { isOver: boolean }) {
    return (
        <div
            className={`relative mx-auto transition-all duration-200 ${isOver ? 'h-2 opacity-100' : 'h-0.5 opacity-0 group-hover/canvas:opacity-40'
                }`}
            style={{ maxWidth: 580 }}
        >
            <div
                className={`absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-full transition-all ${isOver
                    ? 'h-1 bg-[#e8614d] shadow-[0_0_12px_rgba(232,97,77,0.4)]'
                    : 'h-px bg-white/20'
                    }`}
            />
            {isOver && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e8614d] p-0.5 shadow-lg">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </div>
            )}
        </div>
    )
}

/* ─── Sortable block wrapper ─── */
function SortableBlock({
    block,
    isSelected,
    onSelect,
    onDelete,
    onDuplicate,
    onHtmlChange,
    onMoveUp,
    onMoveDown,
}: {
    block: EditorBlock
    isSelected: boolean
    onSelect: () => void
    onDelete: () => void
    onDuplicate: () => void
    onHtmlChange: (html: string) => void
    onMoveUp?: () => void
    onMoveDown?: () => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
        isOver,
    } = useSortable({ id: block.id })

    const contentRef = useRef<HTMLDivElement>(null)

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    const handleBlur = useCallback(() => {
        if (contentRef.current) {
            // Strip any injected <style> tags before saving
            let newHtml = contentRef.current.innerHTML
            newHtml = newHtml.replace(/<style>[\s\S]*?<\/style>/gi, '').trim()
            if (newHtml !== block.html) {
                onHtmlChange(newHtml)
            }
        }
    }, [block.html, onHtmlChange])

    return (
        <>
            {/* Drop zone indicator above this block */}
            <DropZoneIndicator isOver={isOver} />

            <div
                ref={setNodeRef}
                style={style}
                onClick={(e) => {
                    e.stopPropagation()
                    onSelect()
                }}
                className={`group relative transition-all duration-150 ${isDragging ? 'z-50 scale-[1.02] opacity-60 shadow-2xl' : ''
                    } ${isSelected
                        ? 'ring-2 ring-[#e8614d]/50 ring-offset-2 ring-offset-white'
                        : 'hover:ring-1 hover:ring-gray-200'
                    }`}
            >
                {/* Module label bar — drag handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className={`flex items-center justify-between px-3 py-1 cursor-grab active:cursor-grabbing transition-colors ${isSelected
                        ? 'bg-[#e8614d] text-white'
                        : 'bg-gray-100 text-gray-500 opacity-0 group-hover:opacity-100'
                        }`}
                >
                    <div className="flex items-center gap-1.5">
                        {/* Grip icon */}
                        <svg className="h-3.5 w-3.5 opacity-60" viewBox="0 0 16 16" fill="currentColor">
                            <circle cx="4" cy="4" r="1.2" />
                            <circle cx="9" cy="4" r="1.2" />
                            <circle cx="4" cy="8" r="1.2" />
                            <circle cx="9" cy="8" r="1.2" />
                            <circle cx="4" cy="12" r="1.2" />
                            <circle cx="9" cy="12" r="1.2" />
                        </svg>
                        <span className="text-[10px] font-semibold uppercase tracking-wider">
                            {block.category || 'Block'}
                        </span>
                    </div>

                    {/* Action buttons — prevent drag when clicking */}
                    <div className="flex items-center gap-0.5" onPointerDown={(e) => e.stopPropagation()}>
                        <button
                            onClick={(e) => { e.stopPropagation(); onMoveUp?.() }}
                            className={`flex h-5 w-5 items-center justify-center rounded transition-colors ${isSelected ? 'hover:bg-white/20' : 'hover:bg-gray-200'
                                }`}
                            title="Move up"
                        >
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                            </svg>
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onMoveDown?.() }}
                            className={`flex h-5 w-5 items-center justify-center rounded transition-colors ${isSelected ? 'hover:bg-white/20' : 'hover:bg-gray-200'
                                }`}
                            title="Move down"
                        >
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                        </button>

                        <div className={`mx-0.5 h-3 w-px ${isSelected ? 'bg-white/20' : 'bg-gray-300'}`} />

                        <button
                            onClick={(e) => { e.stopPropagation(); onDuplicate() }}
                            className={`flex h-5 w-5 items-center justify-center rounded transition-colors ${isSelected ? 'hover:bg-white/20' : 'hover:bg-gray-200'
                                }`}
                            title="Duplicate block"
                        >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                            </svg>
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete() }}
                            className={`flex h-5 w-5 items-center justify-center rounded transition-colors ${isSelected ? 'text-white hover:bg-white/20' : 'text-red-400 hover:bg-red-50 hover:text-red-500'
                                }`}
                            title="Delete block"
                        >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Block content — editable */}
                <div
                    ref={contentRef}
                    className="cursor-text overflow-hidden bg-white"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={handleBlur}
                    data-block-id={block.id}
                    dangerouslySetInnerHTML={{
                        __html: `<style>
                            [data-block-id="${block.id}"] * {
                                font-family: ${block.props.fontFamily || 'Arial, Helvetica, sans-serif'} !important;
                                font-size: ${block.props.fontSize ? `${block.props.fontSize}px` : '16px'} !important;
                                color: ${block.props.fontColor || '#333333'} !important;
                            }
                            [data-block-id="${block.id}"] h1, [data-block-id="${block.id}"] h2 {
                                font-size: ${block.props.fontSize ? `${Math.round(block.props.fontSize * 1.5)}px` : '24px'} !important;
                            }
                            ${block.props.imageMaxHeight ? `[data-block-id="${block.id}"] img { max-height: ${block.props.imageMaxHeight}px !important; width: auto !important; }` : ''}
                        </style>${block.html}`
                    }}
                    style={{
                        paddingTop: block.props.paddingTop,
                        paddingRight: block.props.paddingRight,
                        paddingBottom: block.props.paddingBottom,
                        paddingLeft: block.props.paddingLeft,
                        backgroundColor: block.props.backgroundColor || undefined,
                        maxWidth: block.props.width || 600,
                        lineHeight: 1.6,
                    }}
                />
            </div>
        </>
    )
}

type PreviewMode = 'desktop' | 'mobile'

export function EditorCanvas({
    blocks,
    onBlocksChange,
    selectedBlockId,
    onSelectBlock,
    outerBg,
    innerBg,
}: EditorCanvasProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: 'editor-canvas',
    })
    const canvasRef = useRef<HTMLDivElement>(null)
    const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop')

    const canvasWidth = previewMode === 'mobile' ? 375 : 660

    const handleDelete = useCallback((blockId: string) => {
        onBlocksChange(blocks.filter(b => b.id !== blockId))
        if (selectedBlockId === blockId) onSelectBlock(null)
    }, [blocks, selectedBlockId, onBlocksChange, onSelectBlock])

    const handleDuplicate = useCallback((blockId: string) => {
        const idx = blocks.findIndex(b => b.id === blockId)
        if (idx < 0) return
        const src = blocks[idx]
        const clone: EditorBlock = {
            ...src,
            id: 'block-' + crypto.randomUUID(),
        }
        const next = [...blocks]
        next.splice(idx + 1, 0, clone)
        onBlocksChange(next)
        onSelectBlock(clone.id)
    }, [blocks, onBlocksChange, onSelectBlock])

    const handleHtmlChange = useCallback((blockId: string, newHtml: string) => {
        onBlocksChange(blocks.map(b => b.id === blockId ? { ...b, html: newHtml } : b))
    }, [blocks, onBlocksChange])

    const handleMoveUp = useCallback((blockId: string) => {
        const idx = blocks.findIndex(b => b.id === blockId)
        if (idx <= 0) return
        const next = [...blocks]
            ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
        onBlocksChange(next)
    }, [blocks, onBlocksChange])

    const handleMoveDown = useCallback((blockId: string) => {
        const idx = blocks.findIndex(b => b.id === blockId)
        if (idx < 0 || idx >= blocks.length - 1) return
        const next = [...blocks]
            ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
        onBlocksChange(next)
    }, [blocks, onBlocksChange])

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            {/* Preview mode toggle */}
            <div className="flex items-center justify-end gap-1 border-b border-white/[0.04] bg-[#111827] px-4 py-1.5">
                <span className="mr-2 text-[10px] uppercase tracking-wider text-white/25">Preview</span>
                <button
                    onClick={() => setPreviewMode('desktop')}
                    className={`rounded px-2.5 py-1 text-xs transition-colors ${previewMode === 'desktop'
                        ? 'bg-white/[0.08] text-white/70'
                        : 'text-white/30 hover:text-white/50'
                        }`}
                >
                    <svg className="inline-block h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
                    </svg>
                    Desktop
                </button>
                <button
                    onClick={() => setPreviewMode('mobile')}
                    className={`rounded px-2.5 py-1 text-xs transition-colors ${previewMode === 'mobile'
                        ? 'bg-white/[0.08] text-white/70'
                        : 'text-white/30 hover:text-white/50'
                        }`}
                >
                    <svg className="inline-block h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <rect x="5" y="2" width="14" height="20" rx="3" /><path d="M12 18h.01" />
                    </svg>
                    Mobile
                </button>
            </div>

            {/* Outer canvas area */}
            <div
                ref={canvasRef}
                className="group/canvas relative flex-1 overflow-y-auto p-8"
                style={{ backgroundColor: outerBg || '#e5e7eb' }}
                onClick={() => onSelectBlock(null)}
            >
                {/* Floating toolbar */}
                <RichTextToolbar containerRef={canvasRef} />

                {/* Inner canvas — email body */}
                <div
                    ref={setNodeRef}
                    className={`mx-auto min-h-[600px] border-2 border-dashed transition-all duration-200 ${isOver
                        ? 'border-[#e8614d]/40'
                        : blocks.length === 0
                            ? 'border-gray-300'
                            : 'border-transparent'
                        }`}
                    style={{
                        maxWidth: canvasWidth,
                        backgroundColor: innerBg || '#ffffff',
                        transition: 'max-width 0.3s ease, border-color 0.2s ease, background-color 0.2s ease',
                    }}
                >
                    {blocks.length === 0 ? (
                        <div className={`flex flex-col items-center justify-center py-32 text-center transition-transform duration-200 ${isOver ? 'scale-105' : ''}`}>
                            <div className={`mb-4 rounded-xl p-4 transition-colors duration-200 ${isOver ? 'bg-[#e8614d]/10' : ''}`}>
                                <svg className={`h-12 w-12 transition-colors duration-200 ${isOver ? 'text-[#e8614d]/40' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                            </div>
                            <p className="text-lg font-medium text-gray-400">
                                {isOver ? 'Drop here to add' : 'Drag & drop modules'}
                            </p>
                            <p className="mt-1 text-sm text-gray-300">
                                {isOver ? '' : 'from the left panel'}
                            </p>
                        </div>
                    ) : (
                        <SortableContext
                            items={blocks.map(b => b.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-1">
                                {blocks.map((block) => (
                                    <SortableBlock
                                        key={block.id}
                                        block={block}
                                        isSelected={selectedBlockId === block.id}
                                        onSelect={() => onSelectBlock(block.id)}
                                        onDelete={() => handleDelete(block.id)}
                                        onDuplicate={() => handleDuplicate(block.id)}
                                        onHtmlChange={(html) => handleHtmlChange(block.id, html)}
                                        onMoveUp={() => handleMoveUp(block.id)}
                                        onMoveDown={() => handleMoveDown(block.id)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    )}
                </div>
            </div>
        </div>
    )
}
