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
}: {
    block: EditorBlock
    isSelected: boolean
    onSelect: () => void
    onDelete: () => void
    onDuplicate: () => void
    onHtmlChange: (html: string) => void
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
            const newHtml = contentRef.current.innerHTML
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
                {/* Drag handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute -left-8 top-1/2 -translate-y-1/2 cursor-grab rounded p-1 opacity-0 transition-opacity hover:bg-white/10 group-hover:opacity-100 active:cursor-grabbing"
                >
                    <svg className="h-4 w-4 text-white/30" viewBox="0 0 16 16" fill="currentColor">
                        <circle cx="5" cy="4" r="1.5" />
                        <circle cx="11" cy="4" r="1.5" />
                        <circle cx="5" cy="8" r="1.5" />
                        <circle cx="11" cy="8" r="1.5" />
                        <circle cx="5" cy="12" r="1.5" />
                        <circle cx="11" cy="12" r="1.5" />
                    </svg>
                </div>

                {/* Block content — editable */}
                <div
                    ref={contentRef}
                    className="cursor-text overflow-hidden rounded-lg bg-white"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={handleBlur}
                    dangerouslySetInnerHTML={{ __html: block.html }}
                    style={{
                        paddingTop: block.props.paddingTop,
                        paddingRight: block.props.paddingRight,
                        paddingBottom: block.props.paddingBottom,
                        paddingLeft: block.props.paddingLeft,
                        backgroundColor: block.props.backgroundColor || undefined,
                        maxWidth: block.props.width || 600,
                    }}
                />

                {/* Category label */}
                {isSelected && block.category && (
                    <div className="absolute -top-5 left-0 rounded-t bg-[#e8614d] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white">
                        {block.category}
                    </div>
                )}

                {/* Delete button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete()
                    }}
                    className="absolute -right-3 -top-3 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                    title="Delete block"
                >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Duplicate button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onDuplicate()
                    }}
                    className="absolute -right-3 top-5 flex h-6 w-6 items-center justify-center rounded-full bg-[#1e293b] text-white/60 opacity-0 shadow-lg transition-opacity hover:bg-[#334155] hover:text-white group-hover:opacity-100"
                    title="Duplicate block"
                >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                </button>
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

            {/* Canvas area */}
            <div
                ref={canvasRef}
                className="group/canvas relative flex-1 overflow-y-auto bg-white p-8"
                onClick={() => onSelectBlock(null)}
            >
                {/* Floating toolbar */}
                <RichTextToolbar containerRef={canvasRef} />

                <div
                    ref={setNodeRef}
                    className={`mx-auto min-h-[600px] rounded-lg border-2 border-dashed p-8 transition-all duration-200 ${isOver
                        ? 'border-[#e8614d]/40 bg-[#e8614d]/5'
                        : blocks.length === 0
                            ? 'border-gray-200'
                            : 'border-transparent'
                        }`}
                    style={{
                        maxWidth: canvasWidth,
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
