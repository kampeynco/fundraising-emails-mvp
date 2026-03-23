export function formatDate(iso: string): string {
    const d = new Date(iso)
    const now = new Date()
    const days = Math.floor((now.getTime() - d.getTime()) / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Parses weekOf as local time (avoids UTC off-by-one for US clients) */
export function formatWeek(weekOf: string): string {
    const [year, month, day] = weekOf.split('-').map(Number)
    const start = new Date(year, month - 1, day)
    const end = new Date(year, month - 1, day + 6)
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${fmt(start)} – ${fmt(end)}`
}
