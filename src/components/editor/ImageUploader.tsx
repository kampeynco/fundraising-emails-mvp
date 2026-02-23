import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { HugeiconsIcon } from '@hugeicons/react'
import { ImageUploadIcon, Loading03Icon } from '@hugeicons/core-free-icons'

interface ImageUploaderProps {
    onUpload: (url: string) => void
}

/**
 * Image uploader for email editor.
 * Uploads to Supabase storage bucket 'editor-images'.
 * Returns public URL for embedding in module HTML.
 */
export function ImageUploader({ onUpload }: ImageUploaderProps) {
    const { user } = useAuth()
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !user) return

        // Validate file
        const maxSize = 5 * 1024 * 1024 // 5MB
        if (file.size > maxSize) {
            setError('Image must be under 5MB')
            return
        }

        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if (!validTypes.includes(file.type)) {
            setError('Supported formats: JPG, PNG, GIF, WebP')
            return
        }

        setUploading(true)
        setError(null)

        try {
            const ext = file.name.split('.').pop()
            const path = `${user.id}/${Date.now()}.${ext}`

            const { error: uploadError } = await supabase.storage
                .from('editor-images')
                .upload(path, file, { cacheControl: '31536000', upsert: false })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('editor-images')
                .getPublicUrl(path)

            onUpload(publicUrl)
        } catch (err: any) {
            setError(err.message || 'Upload failed')
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    return (
        <div>
            <label className="mb-2 block text-xs font-medium text-white/40">Image</label>
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/[0.12] bg-[#1e293b] px-3 py-3 text-sm text-white/50 transition-colors hover:border-[#e8614d]/30 hover:text-white/70 disabled:opacity-50"
            >
                {uploading ? (
                    <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin" />
                ) : (
                    <HugeiconsIcon icon={ImageUploadIcon} size={16} />
                )}
                {uploading ? 'Uploading...' : 'Upload Image'}
            </button>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleUpload}
                className="hidden"
            />
            {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
        </div>
    )
}
