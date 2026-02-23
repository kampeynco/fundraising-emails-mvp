import { useState } from 'react'
import { useUserRole } from '@/hooks/useUserRole'
import { ModuleSidebar } from './ModuleSidebar'
import { ModulePanel } from './ModulePanel'
import { EditorCanvas } from './EditorCanvas'
import { PropertiesPanel } from './PropertiesPanel'
import { CommentsPanel } from './CommentsPanel'
import { VersionHistoryPanel } from './VersionHistoryPanel'
import { HugeiconsIcon } from '@hugeicons/react'
import { Comment01Icon, ArrowLeft02Icon, FloppyDiskIcon, Clock01Icon } from '@hugeicons/core-free-icons'
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
    // Canvas backgrounds
    canvasOuterBg: string
    canvasInnerBg: string
    onCanvasOuterBgChange: (color: string) => void
    onCanvasInnerBgChange: (color: string) => void
    // Persistence
    onSave?: () => void
    saving?: boolean
    lastSaved?: Date | null
    hasUnsavedChanges?: boolean
    versions?: { id: string; version_number: number; label: string | null; created_at: string }[]
    onRestoreVersion?: (versionId: string) => Promise<EditorBlock[] | null>
}

export function EditorLayout({
    draftId,
    draftSubject,
    blocks,
    onBlocksChange,
    selectedBlockId,
    onSelectBlock,
    brandKit,
    canvasOuterBg,
    canvasInnerBg,
    onCanvasOuterBgChange,
    onCanvasInnerBgChange,
    onSave,
    saving,
    lastSaved,
    hasUnsavedChanges,
    versions = [],
    onRestoreVersion,
}: EditorLayoutProps) {
    const { isAdminOrManager } = useUserRole()
    const [activeCategory, setActiveCategory] = useState<ModuleCategory | null>(null)
    const [showComments, setShowComments] = useState(false)
    const [showVersions, setShowVersions] = useState(false)

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

                    <div className="flex items-center gap-2">
                        {/* Save indicator */}
                        {lastSaved && (
                            <span className="text-[10px] text-white/20">
                                Saved {lastSaved.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                            </span>
                        )}
                        {hasUnsavedChanges && (
                            <span className="h-2 w-2 rounded-full bg-amber-400" title="Unsaved changes" />
                        )}

                        {/* Save button */}
                        <button
                            onClick={onSave}
                            disabled={saving || !hasUnsavedChanges}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors bg-[#e8614d] text-white hover:bg-[#e8614d]/80 disabled:opacity-30"
                        >
                            <HugeiconsIcon icon={FloppyDiskIcon} size={14} />
                            {saving ? 'Saving...' : 'Save'}
                        </button>

                        {/* Version history toggle */}
                        <button
                            onClick={() => setShowVersions(v => !v)}
                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/60"
                            title="Version history"
                        >
                            <HugeiconsIcon icon={Clock01Icon} size={16} />
                        </button>

                        <div className="h-5 w-px bg-white/[0.08]" />

                        {/* Comments toggle — all roles */}
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
                    </div>
                </div>

                {/* Canvas with built-in preview toggle */}
                <EditorCanvas
                    blocks={blocks}
                    onBlocksChange={onBlocksChange}
                    selectedBlockId={selectedBlockId}
                    onSelectBlock={onSelectBlock}
                    brandKit={brandKit}
                    outerBg={canvasOuterBg}
                    innerBg={canvasInnerBg}
                    onOuterBgChange={onCanvasOuterBgChange}
                    onInnerBgChange={onCanvasInnerBgChange}
                />
            </div>

            {/* Right Sidebar — Properties or Comments based on role */}
            <div className="w-[300px] border-l border-white/[0.06] bg-[#111827] overflow-y-auto">
                {showComments ? (
                    <CommentsPanel draftId={draftId} viewScope={isAdminOrManager ? 'admin' : 'user'} />
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
                        canvasOuterBg={canvasOuterBg}
                        canvasInnerBg={canvasInnerBg}
                        onCanvasOuterBgChange={onCanvasOuterBgChange}
                        onCanvasInnerBgChange={onCanvasInnerBgChange}
                    />
                )}
            </div>

            {/* Version history overlay */}
            {showVersions && onRestoreVersion && (
                <VersionHistoryPanel
                    versions={versions}
                    onRestore={onRestoreVersion}
                    onBlocksChange={onBlocksChange}
                    onClose={() => setShowVersions(false)}
                />
            )}
        </div>
    )
}
