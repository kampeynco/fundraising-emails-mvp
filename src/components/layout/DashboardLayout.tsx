import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

const navItems = [
    { label: 'Overview', href: '/dashboard' },
    { label: 'Drafts', href: '/dashboard/drafts' },
]

export function DashboardLayout() {
    const { user, signOut } = useAuth()
    const location = useLocation()

    return (
        <div className="min-h-screen bg-muted/40">
            <header className="border-b bg-background">
                <div className="container mx-auto flex items-center justify-between h-16 px-6">
                    <div className="flex items-center gap-8">
                        <Link to="/dashboard" className="text-lg font-bold tracking-tight">
                            Fundraising <span className="text-primary">Emails</span>
                        </Link>
                        <nav className="hidden sm:flex items-center gap-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${location.pathname === item.href
                                            ? 'bg-muted text-foreground'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground hidden sm:inline">
                            {user?.email}
                        </span>
                        <Button variant="ghost" size="sm" onClick={signOut}>
                            Sign Out
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-10">
                <Outlet />
            </main>
        </div>
    )
}
