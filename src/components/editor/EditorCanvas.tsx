import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { EditorBlock } from './types'

interface EditorCanvasProps {
    blocks: EditorBlock[]
    onBlocksChange: (blocks: EditorBlock[]) => void
    selectedBlockId: string | null
    onSelectBlock: (id: string | null) => void
    brandKit: any
}

function SortableBlock({
    block,
    isSelected,
    onSelect,
}: {
    block: EditorBlock
    isSelected: boolean
    onSelect: () => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={(e) => {
                e.stopPropagation()
                onSelect()
            }}
            className={`group relative cursor-pointer transition-all ${isDragging ? 'z-50 opacity-60' : ''
                } ${isSelected
                    ? 'ring-2 ring-[#e8614d]/50 ring-offset-2 ring-offset-[#1a1a2e]'
                    : 'hover:ring-1 hover:ring-white/20'
                }`}
        >
            {/* Drag handle */}
            <div
                {...attributes}
                {...listeners}
                className="absolute -left-8 top-1/2 -translate-y-1/2 cursor-grab opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
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

            {/* Block content */}
            <div
                className="overflow-hidden rounded-lg bg-white"
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

            {/* Delete button */}
            {isSelected && (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        // Handled by parent via onBlocksChange
                    }}
                    className="absolute -right-3 -top-3 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    )
}

export function EditorCanvas({
    blocks,
    onBlocksChange: _onBlocksChange,
    selectedBlockId,
    onSelectBlock,
    brandKit: _brandKit,
}: EditorCanvasProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: 'editor-canvas',
    })

    return (
        <div
            className="flex-1 overflow-y-auto bg-[#1a1a2e] p-8"
            onClick={() => onSelectBlock(null)}
        >
            <div
                ref={setNodeRef}
                className={`mx-auto min-h-[600px] max-w-[660px] rounded-lg border-2 border-dashed p-8 transition-colors ${isOver
                        ? 'border-[#e8614d]/40 bg-[#e8614d]/5'
                        : blocks.length === 0
                            ? 'border-white/[0.1]'
                            : 'border-transparent'
                    }`}
            >
                {blocks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <svg className="mb-4 h-12 w-12 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <p className="text-lg font-medium text-white/30">Drag & drop modules</p>
                        <p className="mt-1 text-sm text-white/20">from the left panel</p>
                    </div>
                ) : (
                    <SortableContext
                        items={blocks.map(b => b.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-4">
                            {blocks.map((block) => (
                                <SortableBlock
                                    key={block.id}
                                    block={block}
                                    isSelected={selectedBlockId === block.id}
                                    onSelect={() => onSelectBlock(block.id)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                )}
            </div>
        </div>
    )
}
