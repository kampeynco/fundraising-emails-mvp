import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DndContext, DragOverlay, closestCenter, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { EditorLayout } from '@/components/editor/EditorLayout'
import type { EditorBlock } from '@/components/editor/types'
import { DEFAULT_BLOCK_PROPS } from '@/components/editor/types'

// Placeholder HTML for new module drops (Phase 2 replaces with real templates)
function getPlaceholderHtml(category: string, moduleId: string): string {
    const styles = 'font-family: Arial, sans-serif; color: #333;'
    switch (category) {
        case 'menu':
            return `<div style="${styles} background: #1a3a5c; color: white; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between;"><strong>Your Logo</strong><div style="font-size: 14px;">Home &nbsp; About &nbsp; Donate</div></div>`
        case 'header':
            return `<div style="${styles} padding: 32px 24px; text-align: center;"><h1 style="margin: 0 0 8px; font-size: 28px; color: #1a3a5c;">Headline Goes Here</h1><p style="margin: 0; color: #666; font-size: 16px;">A compelling subheadline that sets the stage.</p></div>`
        case 'content':
            return `<div style="${styles} padding: 24px;"><p style="line-height: 1.6; margin: 0;">Your email content goes here. Tell your story, share your mission, and connect with your supporters. Every word matters in fundraising.</p></div>`
        case 'donation':
            return `<div style="${styles} padding: 24px; text-align: center; background: #faf8f5;"><p style="margin: 0 0 16px; font-size: 18px; font-weight: bold;">Make Your Impact</p><div style="display: flex; gap: 12px; justify-content: center;"><span style="background: #e8614d; color: white; padding: 10px 20px; border-radius: 6px; font-weight: bold;">$25</span><span style="background: #e8614d; color: white; padding: 10px 20px; border-radius: 6px; font-weight: bold;">$50</span><span style="background: #e8614d; color: white; padding: 10px 20px; border-radius: 6px; font-weight: bold;">$100</span></div></div>`
        case 'cta':
            return `<div style="${styles} padding: 24px; text-align: center;"><a href="#" style="display: inline-block; background: #e8614d; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">DONATE NOW →</a></div>`
        case 'ps':
            return `<div style="${styles} padding: 16px 24px; border-top: 1px solid #eee;"><p style="margin: 0; font-style: italic; color: #555;"><strong>P.S.</strong> Every dollar is matched 2-to-1 through midnight. Don't miss this chance to triple your impact.</p></div>`
        case 'footer':
            return `<div style="${styles} padding: 16px 24px; text-align: center; background: #f5f5f5; font-size: 12px; color: #999;"><p style="margin: 0;">Paid for by Organization Name</p><p style="margin: 4px 0 0;"><a href="#" style="color: #999;">Unsubscribe</a> &middot; <a href="#" style="color: #999;">View in browser</a></p></div>`
        default:
            return `<div style="${styles} padding: 24px;"><p>${moduleId}</p></div>`
    }
}

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
            const newBlock: EditorBlock = {
                id: 'block-' + crypto.randomUUID(),
                type: 'module',
                category: activeData.category,
                moduleId: activeData.moduleId,
                html: getPlaceholderHtml(activeData.category, activeData.moduleId),
                props: { ...DEFAULT_BLOCK_PROPS },
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
