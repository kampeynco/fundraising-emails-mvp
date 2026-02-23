import { useDraggable } from '@dnd-kit/core'
import type { ModuleCategory } from './types'

interface ModulePanelProps {
    category: ModuleCategory
    brandKit: any
}

const CATEGORY_LABELS: Record<ModuleCategory, string> = {
    menu: 'Menu',
    header: 'Header',
    content: 'Content',
    donation: 'Donation Ask',
    cta: 'Call to Action',
    ps: 'P.S. Block',
    footer: 'Footer',
}

// Placeholder module variations per category (Phase 2 will expand these)
const PLACEHOLDER_MODULES: Record<ModuleCategory, Array<{ id: string; name: string }>> = {
    menu: [
        { id: 'menu-1', name: 'Menu 1' },
        { id: 'menu-2', name: 'Menu 2' },
        { id: 'menu-3', name: 'Menu 3' },
    ],
    header: [
        { id: 'header-1', name: 'Header 1' },
        { id: 'header-2', name: 'Header 2' },
        { id: 'header-3', name: 'Header 3' },
    ],
    content: [
        { id: 'content-1', name: 'Content 1' },
        { id: 'content-2', name: 'Content 2' },
        { id: 'content-3', name: 'Content 3' },
    ],
    donation: [
        { id: 'donation-1', name: 'Donation 1' },
        { id: 'donation-2', name: 'Donation 2' },
        { id: 'donation-3', name: 'Donation 3' },
    ],
    cta: [
        { id: 'cta-1', name: 'CTA 1' },
        { id: 'cta-2', name: 'CTA 2' },
        { id: 'cta-3', name: 'CTA 3' },
    ],
    ps: [
        { id: 'ps-1', name: 'P.S. 1' },
        { id: 'ps-2', name: 'P.S. 2' },
    ],
    footer: [
        { id: 'footer-1', name: 'Footer 1' },
        { id: 'footer-2', name: 'Footer 2' },
    ],
}

function DraggableModuleCard({ moduleId, name, category }: { moduleId: string; name: string; category: ModuleCategory }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `module-${moduleId}`,
        data: {
            type: 'module-template',
            moduleId,
            category,
        },
    })

    const style = transform
        ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
        : undefined

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={style}
            className={`cursor-grab rounded-lg border border-white/[0.08] bg-[#1e293b] p-3 transition-all active:cursor-grabbing ${isDragging ? 'opacity-50 shadow-xl ring-2 ring-[#e8614d]/30' : 'hover:border-white/[0.15] hover:bg-[#1e293b]/80'
                }`}
        >
            {/* Thumbnail preview — Phase 2 will render real brand-kit HTML */}
            <div className="mb-2 flex h-24 items-center justify-center rounded-md bg-[#0f172a] text-[11px] uppercase tracking-wider text-white/20">
                {name}
            </div>
            <p className="text-xs font-medium text-white/60">{name}</p>
        </div>
    )
}

export function ModulePanel({ category, brandKit: _brandKit }: ModulePanelProps) {
    const modules = PLACEHOLDER_MODULES[category] || []
    const label = CATEGORY_LABELS[category]

    return (
        <div className="h-full overflow-y-auto p-4">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
                {label}
            </h3>
            <div className="space-y-3">
                {modules.map((mod) => (
                    <DraggableModuleCard
                        key={mod.id}
                        moduleId={mod.id}
                        name={mod.name}
                        category={category}
                    />
                ))}
            </div>
        </div>
    )
}
