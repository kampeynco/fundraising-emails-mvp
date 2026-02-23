import type { ModuleTemplate, ModuleCategory } from '../types'
import { menuModules } from './MenuModules'
import { headerModules } from './HeaderModules'
import { contentModules } from './ContentModules'
import { donationModules } from './DonationAskModules'
import { ctaModules } from './CTAModules'
import { psModules } from './PSBlockModules'
import { footerModules } from './FooterModules'

/** Central registry mapping category → templates */
export const moduleRegistry: Record<ModuleCategory, ModuleTemplate[]> = {
    menu: menuModules,
    header: headerModules,
    content: contentModules,
    donation: donationModules,
    cta: ctaModules,
    ps: psModules,
    footer: footerModules,
}

export function getModulesByCategory(category: ModuleCategory): ModuleTemplate[] {
    return moduleRegistry[category] || []
}

export function getModuleById(id: string): ModuleTemplate | undefined {
    for (const modules of Object.values(moduleRegistry)) {
        const found = modules.find(m => m.id === id)
        if (found) return found
    }
    return undefined
}
