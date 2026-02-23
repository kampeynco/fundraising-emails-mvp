import { HugeiconsIcon } from '@hugeicons/react'
import {
    Menu01Icon,
    TextIcon,
    ParagraphIcon,
    MoneyReceiveSquareIcon,
    CursorClick01Icon,
    Edit02Icon,
    Mail01Icon,
} from '@hugeicons/core-free-icons'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { ModuleCategory } from './types'

interface ModuleSidebarProps {
    activeCategory: ModuleCategory | null
    onCategorySelect: (category: ModuleCategory) => void
}

const CATEGORIES: Array<{ id: ModuleCategory; label: string; icon: any }> = [
    { id: 'menu', label: 'Menu', icon: Menu01Icon },
    { id: 'header', label: 'Header', icon: TextIcon },
    { id: 'content', label: 'Content', icon: ParagraphIcon },
    { id: 'donation', label: 'Donation Ask', icon: MoneyReceiveSquareIcon },
    { id: 'cta', label: 'Call to Action', icon: CursorClick01Icon },
    { id: 'ps', label: 'P.S. Block', icon: Edit02Icon },
    { id: 'footer', label: 'Footer', icon: Mail01Icon },
]

export function ModuleSidebar({ activeCategory, onCategorySelect }: ModuleSidebarProps) {
    return (
        <div className="flex w-16 flex-col items-center gap-1 border-r border-white/[0.06] bg-[#0f172a] py-4">
            {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id
                return (
                    <Tooltip key={cat.id}>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => onCategorySelect(cat.id)}
                                className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all cursor-pointer ${isActive
                                        ? 'bg-[#e8614d]/15 text-[#e8614d]'
                                        : 'text-white/40 hover:bg-white/[0.06] hover:text-white/70'
                                    }`}
                            >
                                <HugeiconsIcon icon={cat.icon} size={20} />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8}>
                            {cat.label}
                        </TooltipContent>
                    </Tooltip>
                )
            })}
        </div>
    )
}
