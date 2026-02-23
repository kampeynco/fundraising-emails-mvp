import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface Comment {
    id: string
    draft_id: string
    user_id: string
    parent_id: string | null
    view_scope: 'user' | 'admin'
    body: string
    highlight_selector: string | null
    highlight_text: string | null
    resolved: boolean
    resolved_by: string | null
    resolved_at: string | null
    created_at: string
}

interface CommentsPanelProps {
    draftId: string
    viewScope?: 'user' | 'admin'
}

export function CommentsPanel({ draftId, viewScope = 'user' }: CommentsPanelProps) {
    const { user } = useAuth()
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState('')
    const [replyingTo, setReplyingTo] = useState<string | null>(null)
    const [replyText, setReplyText] = useState('')
    const [loading, setLoading] = useState(true)

    const fetchComments = useCallback(async () => {
        if (!user) return
        setLoading(true)

        const { data, error } = await (supabase as any)
            .from('draft_comments')
            .select('*')
            .eq('draft_id', draftId)
            .eq('view_scope', viewScope)
            .order('created_at', { ascending: true })

        if (!error && data) {
            setComments(data as unknown as Comment[])
        }
        setLoading(false)
    }, [user, draftId, viewScope])

    useEffect(() => {
        fetchComments()
    }, [fetchComments])

    const addComment = useCallback(async (parentId: string | null = null) => {
        if (!user) return
        const body = parentId ? replyText.trim() : newComment.trim()
        if (!body) return

        const { error } = await (supabase as any).from('draft_comments').insert({
            draft_id: draftId,
            user_id: user.id,
            parent_id: parentId,
            view_scope: viewScope,
            body,
        })

        if (!error) {
            if (parentId) {
                setReplyText('')
                setReplyingTo(null)
            } else {
                setNewComment('')
            }
            fetchComments()
        }
    }, [user, draftId, viewScope, newComment, replyText, fetchComments])

    const resolveComment = useCallback(async (commentId: string) => {
        if (!user) return
        const { error } = await (supabase as any)
            .from('draft_comments')
            .update({
                resolved: true,
                resolved_by: user.id,
                resolved_at: new Date().toISOString(),
            })
            .eq('id', commentId)

        if (!error) fetchComments()
    }, [user, fetchComments])

    const deleteComment = useCallback(async (commentId: string) => {
        const { error } = await (supabase as any)
            .from('draft_comments')
            .delete()
            .eq('id', commentId)

        if (!error) fetchComments()
    }, [fetchComments])

    // Group comments: top-level + replies
    const topLevel = comments.filter(c => !c.parent_id)
    const replies = (parentId: string) => comments.filter(c => c.parent_id === parentId)

    const formatTime = (date: string) => {
        const d = new Date(date)
        const now = new Date()
        const diff = now.getTime() - d.getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 1) return 'just now'
        if (mins < 60) return `${mins}m ago`
        const hours = Math.floor(mins / 60)
        if (hours < 24) return `${hours}h ago`
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="border-b border-white/[0.06] px-4 py-3">
                <h3 className="text-sm font-semibold text-white/60">
                    {viewScope === 'admin' ? 'Admin Comments' : 'Comments'}
                </h3>
                <p className="mt-0.5 text-[10px] text-white/25">
                    {topLevel.length} {topLevel.length === 1 ? 'thread' : 'threads'}
                </p>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-[#e8614d]" />
                    </div>
                ) : topLevel.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <svg className="mb-2 h-8 w-8 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-xs text-white/20">No comments yet</p>
                    </div>
                ) : (
                    topLevel.map((comment) => (
                        <div
                            key={comment.id}
                            className={`rounded-lg border border-white/[0.06] bg-[#1e293b] ${comment.resolved ? 'opacity-50' : ''
                                }`}
                        >
                            {/* Comment body */}
                            <div className="px-3 py-2.5">
                                {comment.highlight_text && (
                                    <div className="mb-2 rounded border-l-2 border-yellow-400/50 bg-yellow-400/5 px-2 py-1">
                                        <p className="text-[10px] text-yellow-400/60 truncate">"{comment.highlight_text}"</p>
                                    </div>
                                )}
                                <p className="text-xs text-white/70 leading-relaxed">{comment.body}</p>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-[10px] text-white/20">{formatTime(comment.created_at)}</span>
                                    <div className="flex items-center gap-1.5">
                                        {!comment.resolved && (
                                            <button
                                                onClick={() => resolveComment(comment.id)}
                                                className="text-[10px] text-green-400/60 hover:text-green-400 transition-colors"
                                            >
                                                Resolve
                                            </button>
                                        )}
                                        {comment.resolved && (
                                            <span className="text-[10px] text-green-400/40">✓ Resolved</span>
                                        )}
                                        <button
                                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                            className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
                                        >
                                            Reply
                                        </button>
                                        {comment.user_id === user?.id && (
                                            <button
                                                onClick={() => deleteComment(comment.id)}
                                                className="text-[10px] text-red-400/40 hover:text-red-400 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Replies */}
                            {replies(comment.id).length > 0 && (
                                <div className="border-t border-white/[0.04] px-3 py-2 space-y-2">
                                    {replies(comment.id).map((reply) => (
                                        <div key={reply.id} className="pl-3 border-l-2 border-white/[0.06]">
                                            <p className="text-[11px] text-white/50 leading-relaxed">{reply.body}</p>
                                            <div className="mt-1 flex items-center gap-2">
                                                <span className="text-[9px] text-white/15">{formatTime(reply.created_at)}</span>
                                                {reply.user_id === user?.id && (
                                                    <button
                                                        onClick={() => deleteComment(reply.id)}
                                                        className="text-[9px] text-red-400/30 hover:text-red-400 transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Reply input */}
                            {replyingTo === comment.id && (
                                <div className="border-t border-white/[0.04] px-3 py-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addComment(comment.id)}
                                            placeholder="Write a reply..."
                                            className="h-7 flex-1 rounded border border-white/[0.08] bg-[#0f172a] px-2 text-xs text-white/70 outline-none focus:border-[#e8614d]/30"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => addComment(comment.id)}
                                            className="h-7 rounded bg-[#e8614d] px-3 text-[10px] font-medium text-white transition-colors hover:bg-[#e8614d]/80"
                                        >
                                            Reply
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* New comment input */}
            <div className="border-t border-white/[0.06] px-3 py-3">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addComment()}
                        placeholder="Add a comment..."
                        className="h-8 flex-1 rounded-lg border border-white/[0.08] bg-[#1e293b] px-3 text-xs text-white/70 outline-none transition-colors focus:border-[#e8614d]/30"
                    />
                    <button
                        onClick={() => addComment()}
                        disabled={!newComment.trim()}
                        className="h-8 rounded-lg bg-[#e8614d] px-4 text-xs font-medium text-white transition-colors hover:bg-[#e8614d]/80 disabled:opacity-30"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    )
}
