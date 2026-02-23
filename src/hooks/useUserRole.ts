import { useAuth } from '@/hooks/useAuth'

type UserRole = 'user' | 'manager' | 'superadmin'

/**
 * Hook to determine the current user's role.
 * Reads from user_metadata.role (set manually via Supabase dashboard).
 * Defaults to 'user' if not set.
 */
export function useUserRole() {
    const { user } = useAuth()

    const role: UserRole = (user?.user_metadata?.role as UserRole) || 'user'

    return {
        role,
        isAdmin: role === 'superadmin',
        isManager: role === 'manager',
        isAdminOrManager: role === 'superadmin' || role === 'manager',
        isUser: role === 'user',
    }
}
