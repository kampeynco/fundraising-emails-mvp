import { useState } from 'react'
import { useUserRole } from '@/hooks/useUserRole'
import { ModuleSidebar } from './ModuleSidebar'
import { ModulePanel } from './ModulePanel'
import { EditorCanvas } from './EditorCanvas'
import { PropertiesPanel } from './PropertiesPanel'
import { CommentsPanel } from './CommentsPanel'
import { HugeiconsIcon } from '@hugeicons/react'
import { Comment01Icon, ArrowLeft02Icon } from '@hugeicons/core-free-icons'
import { Link } from 'react-router-dom'
import type { EditorBlock, ModuleCategory } from './types'

interface EditorLayoutProps {
    draftId: string
    draftSubject: string
    blocks: EditorBlock[]
    onBlocksChange: (blocks: EditorBlock[]) => void
    selectedBlockId: string | null
    onSelectBlock: (id: string | null) => void
    brandKit: any
}

export function EditorLayout({
    draftId,
    draftSubject,
    blocks,
    onBlocksChange,
    selectedBlockId,
    onSelectBlock,
    brandKit,
}: EditorLayoutProps) {
    const { isAdminOrManager } = useUserRole()
    const [activeCategory, setActiveCategory] = useState<ModuleCategory | null>(null)
    const [showComments, setShowComments] = useState(!isAdminOrManager) // Users default to comments

    const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null

    return (
        <div className="flex h-screen w-screen bg-[#0f172a] overflow-hidden">
            {/* Module Sidebar — icon rail */}
            <ModuleSidebar
                activeCategory={activeCategory}
                onCategorySelect={(cat) => {
                    setActiveCategory((prev: ModuleCategory | null) => prev === cat ? null : cat)
                }}
            />

            {/* Module Panel — slides in/out */}
            <div
                className={`border-r border-white/[0.06] bg-[#111827] transition-all duration-300 ease-in-out overflow-hidden ${activeCategory ? 'w-[280px] opacity-100' : 'w-0 opacity-0'
                    }`}
            >
                {activeCategory && (
                    <ModulePanel
                        category={activeCategory}
                        brandKit={brandKit}
                    />
                )}
            </div>

            {/* Center — Top Bar + Canvas */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top bar */}
                <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#111827] px-4 py-2.5">
                    <div className="flex items-center gap-3">
                        <Link
                            to="/dashboard/drafts"
                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white"
                        >
                            <HugeiconsIcon icon={ArrowLeft02Icon} size={16} />
                            Back
                        </Link>
                        <div className="h-5 w-px bg-white/[0.08]" />
                        <p className="text-sm font-medium text-white/70 truncate max-w-[300px]">
                            {draftSubject || 'Untitled Draft'}
                        </p>
                    </div>

                    {/* Right side: admin comment toggle */}
                    {isAdminOrManager && (
                        <button
                            onClick={() => setShowComments(prev => !prev)}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${showComments
                                ? 'bg-[#e8614d]/10 text-[#e8614d]'
                                : 'text-white/40 hover:bg-white/[0.06] hover:text-white/60'
                                }`}
                        >
                            <HugeiconsIcon icon={Comment01Icon} size={16} />
                            Comments
                        </button>
                    )}
                </div>

                {/* Canvas with built-in preview toggle */}
                <EditorCanvas
                    blocks={blocks}
                    onBlocksChange={onBlocksChange}
                    selectedBlockId={selectedBlockId}
                    onSelectBlock={onSelectBlock}
                    brandKit={brandKit}
                />
            </div>

            {/* Right Sidebar — Properties or Comments based on role */}
            <div className="w-[300px] border-l border-white/[0.06] bg-[#111827] overflow-y-auto">
                {showComments ? (
                    <CommentsPanel draftId={draftId} />
                ) : (
                    <PropertiesPanel
                        selectedBlock={selectedBlock}
                        onUpdate={(props: Partial<import('./types').ModuleProps>) => {
                            if (!selectedBlockId) return
                            onBlocksChange(
                                blocks.map(b =>
                                    b.id === selectedBlockId
                                        ? { ...b, props: { ...b.props, ...props } }
                                        : b
                                )
                            )
                        }}
                        brandKit={brandKit}
                    />
                )}
            </div>
        </div>
    )
}
