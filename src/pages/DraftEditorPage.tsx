import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DndContext, DragOverlay, closestCenter, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { EditorLayout } from '@/components/editor/EditorLayout'
import type { EditorBlock } from '@/components/editor/types'
import { DEFAULT_BLOCK_PROPS } from '@/components/editor/types'
import { getModuleById } from '@/components/editor/modules/registry'
import { useDraftPersistence } from '@/hooks/useDraftPersistence'
import { useUndoRedo } from '@/hooks/useUndoRedo'

export default function DraftEditorPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user, loading: authLoading } = useAuth()

    const { state: blocks, push: pushBlocks, undo, redo, reset: resetBlocks } = useUndoRedo<EditorBlock[]>([])
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
    const [draftSubject, setDraftSubject] = useState('')
    const [brandKit, setBrandKit] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [activeDragId, setActiveDragId] = useState<string | null>(null)

    // Track the active drag module template for overlay preview
    const activeDragRef = useRef<{ moduleId: string; category: string } | null>(null)

    // ── Block setter that integrates with undo/redo ──
    const setBlocks = useCallback((updater: EditorBlock[] | ((prev: EditorBlock[]) => EditorBlock[])) => {
        if (typeof updater === 'function') {
            pushBlocks(updater(blocks))
        } else {
            pushBlocks(updater)
        }
    }, [blocks, pushBlocks])

    // ── Fetch draft and brand kit on mount ──
    // Guard: don't fetch until auth is fully resolved
    useEffect(() => {
        if (authLoading || !user || !id) return

        let cancelled = false

        const fetchData = async () => {
            setLoading(true)

            const { data: draft, error: draftError } = await supabase
                .from('email_drafts')
                .select('*')
                .eq('id', id)
                .eq('user_id', user.id)
                .maybeSingle()

            if (cancelled) return

            if (draftError || !draft) {
                console.error('Draft not found:', draftError)
                navigate('/dashboard/drafts', { replace: true })
                return
            }

            setDraftSubject(draft.subject_line || 'Untitled Draft')

            const draftAny = draft as any
            if (draftAny.editor_blocks && Array.isArray(draftAny.editor_blocks) && draftAny.editor_blocks.length > 0) {
                resetBlocks(draftAny.editor_blocks as EditorBlock[])
            } else if (draft.body_html) {
                resetBlocks([{
                    id: 'raw-' + crypto.randomUUID(),
                    type: 'raw-html',
                    html: draft.body_html,
                    props: { ...DEFAULT_BLOCK_PROPS },
                }])
            }

            const { data: bk } = await supabase
                .from('brand_kits')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle()

            if (!cancelled) {
                setBrandKit(bk)
                setLoading(false)
            }
        }

        fetchData()

        return () => { cancelled = true }
    }, [authLoading, user, id, navigate, resetBlocks])

    // ── Keyboard shortcuts ──
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const isMeta = e.metaKey || e.ctrlKey

            // Cmd+S — save
            if (isMeta && e.key === 's') {
                e.preventDefault()
                save('Manual save')
                return
            }

            // Cmd+Z — undo
            if (isMeta && !e.shiftKey && e.key === 'z') {
                e.preventDefault()
                undo()
                return
            }

            // Cmd+Shift+Z — redo
            if (isMeta && e.shiftKey && e.key === 'z') {
                e.preventDefault()
                redo()
                return
            }
        }

        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [undo, redo]) // save added below after declaration

    // ── Drag & Drop ──
    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveDragId(event.active.id as string)
        const data = event.active.data.current
        if (data?.type === 'module-template') {
            activeDragRef.current = { moduleId: data.moduleId, category: data.category }
        } else {
            activeDragRef.current = null
        }
    }, [])

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        setActiveDragId(null)
        activeDragRef.current = null
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

            if (over.id === 'editor-canvas') {
                setBlocks(prev => [...prev, newBlock])
            } else {
                const overIndex = blocks.findIndex(b => b.id === over.id)
                if (overIndex >= 0) {
                    setBlocks(prev => {
                        const next = [...prev]
                        next.splice(overIndex, 0, newBlock)
                        return next
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
    }, [blocks, brandKit, setBlocks])

    // ── Persistence ──
    const { save, saving, lastSaved, hasUnsavedChanges, versions, restoreVersion } = useDraftPersistence({
        draftId: id!,
        blocks,
    })

    // ── Drag overlay preview ──
    const renderDragOverlay = () => {
        if (!activeDragId) return null

        // If dragging a module template — show thumbnail
        if (activeDragRef.current) {
            const template = getModuleById(activeDragRef.current.moduleId)
            if (template) {
                return (
                    <div className="w-[240px] rounded-lg border border-[#e8614d]/30 bg-[#1e293b] p-3 shadow-2xl shadow-[#e8614d]/20">
                        <div
                            className="overflow-hidden rounded"
                            dangerouslySetInnerHTML={{ __html: template.thumbnailHtml }}
                        />
                        <p className="mt-2 text-center text-[10px] font-medium uppercase tracking-wider text-[#e8614d]">
                            {activeDragRef.current.category}
                        </p>
                    </div>
                )
            }
        }

        // If dragging an existing block — show mini preview
        const block = blocks.find(b => b.id === activeDragId)
        if (block) {
            return (
                <div
                    className="w-[300px] overflow-hidden rounded-lg border border-white/20 bg-white shadow-2xl"
                    style={{ maxHeight: 120, opacity: 0.85 }}
                >
                    <div
                        className="pointer-events-none scale-75 origin-top-left"
                        dangerouslySetInnerHTML={{ __html: block.html }}
                    />
                </div>
            )
        }

        return null
    }

    // ── Loading skeleton ──
    if (loading || authLoading) {
        return (
            <div className="flex h-screen w-screen bg-[#0f172a] overflow-hidden">
                {/* Sidebar skeleton */}
                <div className="w-[60px] border-r border-white/[0.06] bg-[#111827] p-2">
                    <div className="space-y-4 pt-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="mx-auto h-8 w-8 animate-pulse rounded-lg bg-white/[0.06]" />
                        ))}
                    </div>
                </div>

                {/* Center skeleton */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    {/* Top bar skeleton */}
                    <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#111827] px-4 py-2.5">
                        <div className="flex items-center gap-3">
                            <div className="h-6 w-16 animate-pulse rounded bg-white/[0.06]" />
                            <div className="h-5 w-px bg-white/[0.08]" />
                            <div className="h-4 w-48 animate-pulse rounded bg-white/[0.06]" />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-7 w-16 animate-pulse rounded-lg bg-white/[0.06]" />
                            <div className="h-7 w-7 animate-pulse rounded-lg bg-white/[0.06]" />
                        </div>
                    </div>

                    {/* Canvas skeleton */}
                    <div className="flex-1 bg-[#1a1a2e] p-8">
                        <div className="mx-auto max-w-[660px] space-y-4">
                            {[180, 60, 240, 80, 120].map((h, i) => (
                                <div
                                    key={i}
                                    className="animate-pulse rounded-lg bg-white/[0.03]"
                                    style={{ height: h, animationDelay: `${i * 120}ms` }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right sidebar skeleton */}
                <div className="w-[300px] border-l border-white/[0.06] bg-[#111827] p-4">
                    <div className="space-y-4">
                        <div className="h-5 w-24 animate-pulse rounded bg-white/[0.06]" />
                        <div className="space-y-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i}>
                                    <div className="mb-1.5 h-3 w-16 animate-pulse rounded bg-white/[0.04]" />
                                    <div className="h-8 animate-pulse rounded-lg bg-white/[0.06]" />
                                </div>
                            ))}
                        </div>
                    </div>
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
                onSave={() => save('Manual save')}
                saving={saving}
                lastSaved={lastSaved}
                hasUnsavedChanges={hasUnsavedChanges}
                versions={versions}
                onRestoreVersion={restoreVersion}
            />
            <DragOverlay dropAnimation={{
                duration: 200,
                easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            }}>
                {renderDragOverlay()}
            </DragOverlay>
        </DndContext>
    )
}
