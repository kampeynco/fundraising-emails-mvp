import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'
import { insforge } from '@/lib/insforge'
import { HugeiconsIcon } from '@hugeicons/react'
import { SparklesIcon } from '@hugeicons/core-free-icons'

interface NewDraftDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function NewDraftDialog({ open, onOpenChange }: NewDraftDialogProps) {
    const { user } = useAuth()
    const [aiLoading, setAiLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [queued, setQueued] = useState(false)

    // ── AI Draft: trigger edge function → Trigger.dev ──
    const handleAiDraft = async () => {
        if (!user) return
        setAiLoading(true)
        setError(null)

        try {
            const { data, error: fnError } = await insforge.functions.invoke('trigger-draft-generation', {
                body: { emailsToGenerate: 1 },
            })

            if (fnError) {
                console.error('Edge function error:', fnError)
                setError('Failed to start AI generation. Please try again.')
                return
            }

            if (data?.error) {
                setError(data.error)
                return
            }

            // Show success briefly, then close — draft appears async (Trigger.dev job)
            setQueued(true)
            setTimeout(() => {
                onOpenChange(false)
                setQueued(false)
            }, 2000)
        } catch (err) {
            console.error('Failed to trigger AI draft:', err)
            setError('Something went wrong. Please try again.')
        } finally {
            setAiLoading(false)
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
                        Generate a new AI-written fundraising email.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                    {error && (
                        <p className="mb-3 text-xs text-red-400">{error}</p>
                    )}
                    {queued && (
                        <p className="mb-3 text-xs text-emerald-400">✨ Draft queued — it'll appear in your list in ~30 seconds.</p>
                    )}
                    <button
                        onClick={handleAiDraft}
                        disabled={aiLoading}
                        className="group relative flex w-full items-start gap-4 rounded-xl border border-white/[0.08] bg-gradient-to-br from-[#e8614d]/5 to-transparent p-4 text-left transition-all hover:border-[#e8614d]/30 hover:bg-[#e8614d]/5 disabled:opacity-50"
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
                </div>
            </DialogContent>
        </Dialog>
    )
}
