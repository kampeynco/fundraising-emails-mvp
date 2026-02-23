import { useState } from 'react'
import type { EditorBlock } from './types'

interface Version {
    id: string
    version_number: number
    label: string | null
    created_at: string
}

interface VersionHistoryPanelProps {
    versions: Version[]
    onRestore: (versionId: string) => Promise<EditorBlock[] | null>
    onBlocksChange: (blocks: EditorBlock[]) => void
    onClose: () => void
}

export function VersionHistoryPanel({ versions, onRestore, onBlocksChange, onClose }: VersionHistoryPanelProps) {
    const [restoring, setRestoring] = useState<string | null>(null)

    const formatDate = (date: string) => {
        const d = new Date(date)
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        })
    }

    const handleRestore = async (versionId: string) => {
        setRestoring(versionId)
        const blocks = await onRestore(versionId)
        if (blocks) {
            onBlocksChange(blocks)
        }
        setRestoring(null)
        onClose()
    }

    return (
        <div className="fixed inset-y-0 right-0 z-50 w-[320px] border-l border-white/[0.08] bg-[#0f172a] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                <h3 className="text-sm font-semibold text-white/60">Version History</h3>
                <button
                    onClick={onClose}
                    className="rounded p-1 text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/60"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Version list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {versions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <svg className="mb-2 h-8 w-8 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs text-white/20">No versions yet</p>
                        <p className="mt-1 text-[10px] text-white/10">Save to create your first version</p>
                    </div>
                ) : (
                    versions.map((version) => (
                        <div
                            key={version.id}
                            className="group rounded-lg border border-white/[0.06] bg-[#1e293b] px-3 py-2.5 transition-colors hover:border-white/[0.1]"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-medium text-white/60">
                                        v{version.version_number}
                                        {version.label && (
                                            <span className="ml-1.5 text-[10px] text-white/25">• {version.label}</span>
                                        )}
                                    </p>
                                    <p className="mt-0.5 text-[10px] text-white/20">
                                        {formatDate(version.created_at)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleRestore(version.id)}
                                    disabled={restoring === version.id}
                                    className="rounded px-2.5 py-1 text-[10px] font-medium text-[#e8614d] opacity-0 transition-all hover:bg-[#e8614d]/10 group-hover:opacity-100 disabled:opacity-50"
                                >
                                    {restoring === version.id ? 'Restoring...' : 'Restore'}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
