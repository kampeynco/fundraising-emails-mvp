export type DraftStatus = 'pending_review' | 'revision_requested' | 'approved' | 'scheduled' | 'sent'
export type DraftType = 'weekly' | 'rapid_response'

export interface Draft {
    id: string
    user_id: string
    brand_kit_id?: string
    week_of: string
    draft_type: DraftType
    subject_line: string
    preview_text?: string
    body_html: string
    body_text?: string
    alt_subject_lines?: string[]
    status: DraftStatus
    user_comments?: string
    ai_model?: string
    research_topic_ids?: string[]
    created_at: string
    updated_at: string
}

/** Status configuration for the ClickUp-style swimlane sections */
export const DRAFT_STATUS_CONFIG: Record<DraftStatus, {
    label: string
    emoji: string
    color: string
    bgColor: string
    borderColor: string
}> = {
    pending_review: {
        label: 'Pending Review',
        emoji: '📥',
        color: 'text-amber-400',
        bgColor: 'bg-amber-400/10',
        borderColor: 'border-amber-400/30',
    },
    revision_requested: {
        label: 'Revision Requested',
        emoji: '✏️',
        color: 'text-orange-400',
        bgColor: 'bg-orange-400/10',
        borderColor: 'border-orange-400/30',
    },
    approved: {
        label: 'Approved',
        emoji: '✅',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-400/10',
        borderColor: 'border-emerald-400/30',
    },
    scheduled: {
        label: 'Scheduled',
        emoji: '📅',
        color: 'text-blue-400',
        bgColor: 'bg-blue-400/10',
        borderColor: 'border-blue-400/30',
    },
    sent: {
        label: 'Sent',
        emoji: '📨',
        color: 'text-white/40',
        bgColor: 'bg-white/5',
        borderColor: 'border-white/10',
    },
}
