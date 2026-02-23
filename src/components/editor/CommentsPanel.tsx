import { HugeiconsIcon } from '@hugeicons/react'
import { Comment01Icon } from '@hugeicons/core-free-icons'

interface CommentsPanelProps {
    draftId: string
}

/**
 * Comments & Annotations Panel (Phase 1 stub).
 * Full implementation in Phase 3.5 with text highlights, pin annotations,
 * threaded replies, and resolve actions.
 */
export function CommentsPanel({ draftId: _draftId }: CommentsPanelProps) {
    return (
        <div className="flex h-full flex-col">
            <div className="border-b border-white/[0.06] px-4 py-3">
                <h3 className="text-sm font-semibold text-white/70">Comments</h3>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04]">
                    <HugeiconsIcon icon={Comment01Icon} size={22} className="text-white/20" />
                </div>
                <p className="text-sm text-white/30">No comments yet</p>
                <p className="mt-1 text-xs text-white/20">
                    Highlight text or drop a pin to add a comment.
                </p>
            </div>

            {/* Comment input — stub */}
            <div className="border-t border-white/[0.06] p-3">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Add a comment..."
                        className="flex-1 rounded-lg border border-white/[0.08] bg-[#1e293b] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#e8614d]/40 focus:outline-none"
                        disabled
                    />
                </div>
            </div>
        </div>
    )
}
