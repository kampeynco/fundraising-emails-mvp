export interface Draft {
    id: number
    subject: string
    status: 'ready' | 'review' | 'sent'
    created: string
    opens?: string
    date?: string
}
