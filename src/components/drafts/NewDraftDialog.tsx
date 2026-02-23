import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { HugeiconsIcon } from '@hugeicons/react'
import { SparklesIcon, PencilEdit01Icon } from '@hugeicons/core-free-icons'

interface NewDraftDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function NewDraftDialog({ open, onOpenChange }: NewDraftDialogProps) {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [aiLoading, setAiLoading] = useState(false)
    const [manualLoading, setManualLoading] = useState(false)

    // Calculate current week's Monday
    const getWeekOf = () => {
        const now = new Date()
        const dayOfWeek = now.getUTCDay()
        const monday = new Date(now)
        monday.setUTCDate(now.getUTCDate() - ((dayOfWeek + 6) % 7))
        return monday.toISOString().split('T')[0]
    }

    // ── AI Draft: trigger edge function → Trigger.dev ──
    const handleAiDraft = async () => {
        if (!user) return
        setAiLoading(true)

        try {
            const { data, error } = await supabase.functions.invoke('trigger-draft-generation', {
                body: { emailsToGenerate: 1 },
            })

            if (error) {
                console.error('Edge function error:', error)
                alert('Failed to start AI generation. Please try again.')
                return
            }

            // Close dialog and show success toast / message
            onOpenChange(false)

            // Show a brief notification
            alert(`✨ ${data.message}\n\nYour AI draft is being generated. It will appear here in a few moments.`)

            // Refresh the page to pick up the new draft
            window.location.reload()
        } catch (err) {
            console.error('Failed to trigger AI draft:', err)
            alert('Something went wrong. Please try again.')
        } finally {
            setAiLoading(false)
        }
    }

    // ── Manual Draft: create blank row → navigate to editor ──
    const handleManualDraft = async () => {
        if (!user) return
        setManualLoading(true)

        try {
            // Fetch brand kit for the user
            const { data: brandKit } = await supabase
                .from('brand_kits')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle()

            const { data: draft, error } = await supabase
                .from('email_drafts')
                .insert({
                    user_id: user.id,
                    brand_kit_id: brandKit?.id || null,
                    week_of: getWeekOf(),
                    draft_type: 'weekly',
                    subject_line: 'Untitled Draft',
                    preview_text: '',
                    body_html: '',
                    status: 'pending_review',
                    ai_model: 'manual',
                })
                .select('id')
                .single()

            if (error || !draft) {
                console.error('Failed to create draft:', error)
                alert('Failed to create draft. Please try again.')
                return
            }

            onOpenChange(false)
            navigate(`/dashboard/drafts/${draft.id}/edit`)
        } catch (err) {
            console.error('Create draft error:', err)
            alert('Something went wrong. Please try again.')
        } finally {
            setManualLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="border-white/[0.08] bg-[#1e293b] sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-white" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                        Create New Draft
                    </DialogTitle>
                    <DialogDescription className="text-sm text-white/40">
                        Choose how you'd like to start your email draft.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4 grid gap-3">
                    {/* AI Generate option */}
                    <button
                        onClick={handleAiDraft}
                        disabled={aiLoading || manualLoading}
                        className="group relative flex items-start gap-4 rounded-xl border border-white/[0.08] bg-gradient-to-br from-[#e8614d]/5 to-transparent p-4 text-left transition-all hover:border-[#e8614d]/30 hover:bg-[#e8614d]/5 disabled:opacity-50"
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e8614d]/10 transition-colors group-hover:bg-[#e8614d]/20">
                            {aiLoading ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#e8614d]/30 border-t-[#e8614d]" />
                            ) : (
                                <HugeiconsIcon icon={SparklesIcon} className="h-5 w-5 text-[#e8614d]" />
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">
                                {aiLoading ? 'Generating...' : 'AI-Generated Draft'}
                            </p>
                            <p className="mt-0.5 text-xs text-white/40 leading-relaxed">
                                Our AI writes a complete fundraising email using your brand kit, tone, and current news topics.
                            </p>
                        </div>
                    </button>

                    {/* Manual option */}
                    <button
                        onClick={handleManualDraft}
                        disabled={aiLoading || manualLoading}
                        className="group relative flex items-start gap-4 rounded-xl border border-white/[0.08] bg-gradient-to-br from-white/[0.02] to-transparent p-4 text-left transition-all hover:border-white/[0.15] hover:bg-white/[0.03] disabled:opacity-50"
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] transition-colors group-hover:bg-white/[0.1]">
                            {manualLoading ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                            ) : (
                                <HugeiconsIcon icon={PencilEdit01Icon} className="h-5 w-5 text-white/60" />
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">
                                {manualLoading ? 'Creating...' : 'Start from Scratch'}
                            </p>
                            <p className="mt-0.5 text-xs text-white/40 leading-relaxed">
                                Open a blank editor with drag-and-drop modules. Write your own copy and build your email manually.
                            </p>
                        </div>
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
