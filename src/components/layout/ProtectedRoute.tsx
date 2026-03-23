import { Navigate } from 'react-router-dom'
import { useAuthContext } from '@/providers/AuthProvider'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuthContext()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading…</p>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    return <>{children}</>
}
