import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { EditorBlock } from '@/components/editor/types'

interface UseDraftPersistenceOptions {
    draftId: string
    blocks: EditorBlock[]
    autoSaveMs?: number
}

interface Version {
    id: string
    version_number: number
    label: string | null
    created_at: string
}

export function useDraftPersistence({ draftId, blocks, autoSaveMs = 30000 }: UseDraftPersistenceOptions) {
    const { user } = useAuth()
    const [saving, setSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [versions, setVersions] = useState<Version[]>([])
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const previousBlocksRef = useRef<string>('')

    // Track changes
    useEffect(() => {
        const blocksJson = JSON.stringify(blocks)
        if (previousBlocksRef.current && blocksJson !== previousBlocksRef.current) {
            setHasUnsavedChanges(true)
        }
        previousBlocksRef.current = blocksJson
    }, [blocks])

    // Compose blocks into final HTML
    const composeHtml = useCallback((editorBlocks: EditorBlock[]): string => {
        return editorBlocks.map(b => {
            const style = [
                b.props.paddingTop ? `padding-top:${b.props.paddingTop}px` : '',
                b.props.paddingRight ? `padding-right:${b.props.paddingRight}px` : '',
                b.props.paddingBottom ? `padding-bottom:${b.props.paddingBottom}px` : '',
                b.props.paddingLeft ? `padding-left:${b.props.paddingLeft}px` : '',
                b.props.backgroundColor ? `background-color:${b.props.backgroundColor}` : '',
            ].filter(Boolean).join(';')

            return style
                ? `<div style="${style}">${b.html}</div>`
                : b.html
        }).join('\n')
    }, [])

    // Save draft
    const save = useCallback(async (label?: string) => {
        if (!user || !draftId || blocks.length === 0) return

        setSaving(true)
        try {
            const bodyHtml = composeHtml(blocks)
            const blocksJson = blocks.map(b => ({
                id: b.id,
                type: b.type,
                category: b.category,
                moduleId: b.moduleId,
                html: b.html,
                props: b.props,
            }))

            // Update draft
            await supabase
                .from('email_drafts')
                .update({
                    body_html: bodyHtml,
                    editor_blocks: blocksJson as any,
                })
                .eq('id', draftId)

            // Get next version number
            const { data: lastVersion } = await (supabase as any)
                .from('draft_versions')
                .select('version_number')
                .eq('draft_id', draftId)
                .order('version_number', { ascending: false })
                .limit(1)

            const nextVersion = (lastVersion?.[0]?.version_number || 0) + 1

            // Create version
            await (supabase as any).from('draft_versions').insert({
                draft_id: draftId,
                user_id: user.id,
                body_html: bodyHtml,
                blocks_json: blocksJson,
                version_number: nextVersion,
                label: label || null,
            })

            setLastSaved(new Date())
            setHasUnsavedChanges(false)
            fetchVersions()
        } catch (err) {
            console.error('Save failed:', err)
        } finally {
            setSaving(false)
        }
    }, [user, draftId, blocks, composeHtml])

    // Auto-save
    useEffect(() => {
        if (!hasUnsavedChanges || !autoSaveMs) return

        const timer = setTimeout(() => {
            save('Auto-save')
        }, autoSaveMs)

        return () => clearTimeout(timer)
    }, [hasUnsavedChanges, autoSaveMs, save])

    // Fetch versions
    const fetchVersions = useCallback(async () => {
        if (!draftId) return

        const { data } = await (supabase as any)
            .from('draft_versions')
            .select('id, version_number, label, created_at')
            .eq('draft_id', draftId)
            .order('version_number', { ascending: false })
            .limit(20)

        if (data) setVersions(data as Version[])
    }, [draftId])

    useEffect(() => {
        fetchVersions()
    }, [fetchVersions])

    // Restore a version
    const restoreVersion = useCallback(async (versionId: string): Promise<EditorBlock[] | null> => {
        const { data } = await (supabase as any)
            .from('draft_versions')
            .select('blocks_json, body_html')
            .eq('id', versionId)
            .single()

        if (data?.blocks_json) {
            return data.blocks_json as EditorBlock[]
        }
        return null
    }, [])

    return {
        save,
        saving,
        lastSaved,
        hasUnsavedChanges,
        versions,
        restoreVersion,
        fetchVersions,
    }
}
