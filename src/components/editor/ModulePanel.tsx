import { useDraggable } from '@dnd-kit/core'
import type { ModuleCategory, ModuleTemplate } from './types'
import { getModulesByCategory } from './modules/registry'

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

function DraggableModuleCard({
    template,
    brandKit,
}: {
    template: ModuleTemplate
    brandKit: any
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `module-${template.id}`,
        data: {
            type: 'module-template',
            moduleId: template.id,
            category: template.category,
        },
    })

    const style = transform
        ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
        : undefined

    // Render thumbnail with brand colors
    const thumbnailHtml = brandKit
        ? template.renderHtml(brandKit)
        : template.thumbnailHtml

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={style}
            className={`cursor-grab rounded-lg border border-white/[0.08] bg-[#1e293b] overflow-hidden transition-all active:cursor-grabbing ${isDragging ? 'opacity-50 shadow-xl ring-2 ring-[#e8614d]/30' : 'hover:border-white/[0.15] hover:bg-[#1e293b]/80'
                }`}
        >
            {/* Thumbnail preview — renders brand-kit HTML */}
            <div
                className="pointer-events-none max-h-[120px] overflow-hidden bg-white"
                style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%' }}
                dangerouslySetInnerHTML={{ __html: thumbnailHtml }}
            />
            <div className="px-3 py-2 border-t border-white/[0.06]">
                <p className="text-xs font-medium text-white/60">{template.name}</p>
            </div>
        </div>
    )
}

export function ModulePanel({ category, brandKit }: ModulePanelProps) {
    const modules = getModulesByCategory(category)
    const label = CATEGORY_LABELS[category]

    return (
        <div className="h-full overflow-y-auto p-4">
            <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-white/50">
                {label}
            </h3>
            <p className="mb-4 text-[11px] text-white/25">{modules.length} templates</p>
            <div className="space-y-3">
                {modules.map((template) => (
                    <DraggableModuleCard
                        key={template.id}
                        template={template}
                        brandKit={brandKit}
                    />
                ))}
            </div>
        </div>
    )
}
