import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DndContext, DragOverlay, closestCenter, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { EditorLayout } from '@/components/editor/EditorLayout'
import type { EditorBlock } from '@/components/editor/types'
import { DEFAULT_BLOCK_PROPS } from '@/components/editor/types'
import { getModuleById } from '@/components/editor/modules/registry'

export default function DraftEditorPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()

    const [blocks, setBlocks] = useState<EditorBlock[]>([])
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
    const [draftSubject, setDraftSubject] = useState('')
    const [brandKit, setBrandKit] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [_activeDragId, setActiveDragId] = useState<string | null>(null)

    // Fetch draft and brand kit on mount
    useEffect(() => {
        if (!user || !id) return

        const fetchData = async () => {
            setLoading(true)

            // Fetch draft
            const { data: draft, error: draftError } = await supabase
                .from('email_drafts')
                .select('*')
                .eq('id', id)
                .eq('user_id', user.id)
                .single()

            if (draftError || !draft) {
                console.error('Draft not found:', draftError)
                navigate('/dashboard/drafts')
                return
            }

            setDraftSubject(draft.subject_line || 'Untitled Draft')

            // Load existing body_html as a single raw block
            if (draft.body_html) {
                setBlocks([{
                    id: 'raw-' + crypto.randomUUID(),
                    type: 'raw-html',
                    html: draft.body_html,
                    props: { ...DEFAULT_BLOCK_PROPS },
                }])
            }

            // Fetch brand kit
            const { data: bk } = await supabase
                .from('brand_kits')
                .select('*')
                .eq('user_id', user.id)
                .single()

            setBrandKit(bk)
            setLoading(false)
        }

        fetchData()
    }, [user, id, navigate])

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveDragId(event.active.id as string)
    }, [])

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        setActiveDragId(null)
        const { active, over } = event

        if (!over) return

        const activeData = active.data.current

        // Dragging a module template from the panel into the canvas
        if (activeData?.type === 'module-template') {
            const template = getModuleById(activeData.moduleId)
            const html = template
                ? template.renderHtml(brandKit)
                : `<div style="padding:24px;font-family:Arial,sans-serif;color:#333;"><p>${activeData.moduleId}</p></div>`

            const newBlock: EditorBlock = {
                id: 'block-' + crypto.randomUUID(),
                type: 'module',
                category: activeData.category,
                moduleId: activeData.moduleId,
                html,
                props: { ...DEFAULT_BLOCK_PROPS, ...(template?.defaultProps || {}) },
            }

            // Find the index to insert at
            if (over.id === 'editor-canvas') {
                // Drop at the end
                setBlocks(prev => [...prev, newBlock])
            } else {
                // Drop before a specific block
                const overIndex = blocks.findIndex(b => b.id === over.id)
                if (overIndex >= 0) {
                    setBlocks(prev => {
                        const newBlocks = [...prev]
                        newBlocks.splice(overIndex, 0, newBlock)
                        return newBlocks
                    })
                } else {
                    setBlocks(prev => [...prev, newBlock])
                }
            }
            setSelectedBlockId(newBlock.id)
            return
        }

        // Reordering existing blocks
        if (active.id !== over.id) {
            setBlocks(prev => {
                const oldIndex = prev.findIndex(b => b.id === active.id)
                const newIndex = prev.findIndex(b => b.id === over.id)
                if (oldIndex < 0 || newIndex < 0) return prev
                return arrayMove(prev, oldIndex, newIndex)
            })
        }
    }, [blocks])

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-[#0f172a]">
                <div className="text-center">
                    <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#e8614d] mx-auto" />
                    <p className="text-sm text-white/40">Loading editor...</p>
                </div>
            </div>
        )
    }

    return (
        <DndContext
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <EditorLayout
                draftId={id!}
                draftSubject={draftSubject}
                blocks={blocks}
                onBlocksChange={setBlocks}
                selectedBlockId={selectedBlockId}
                onSelectBlock={setSelectedBlockId}
                brandKit={brandKit}
            />
            <DragOverlay>
                {null /* Phase 2: render drag preview */}
            </DragOverlay>
        </DndContext>
    )
}
