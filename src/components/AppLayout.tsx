import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { t } from '@/lib/i18n';
import { getRoleBasePath, UserRole } from '@/lib/auth';
import {
    LogOut, LayoutDashboard, Building2, Users, User,
    ShoppingCart, Package, Menu, X, Settings,
    HomeIcon, Wallet,
    Receipt,
} from 'lucide-react';

interface NavItem {
    label: string;
    path: string;
    icon: React.ElementType;
}

const NAV_BY_ROLE: Record<string, NavItem[]> = {
    SUPERADMIN: [
        { label: "Bosh sahifa", path: "/superadmin", icon: LayoutDashboard },
        { label: "Kompaniyalar", path: "/superadmin/companies", icon: Building2 },
        { label: "Menejerlar", path: "/superadmin/managers", icon: Users },
        { label: "Profil", path: "/superadmin/profile", icon: User },
        { label: "Sozlamalar", path: "/superadmin/settings", icon: Settings },
    ],
    MANAGER: [
        { label: "Bosh sahifa", path: "/manager", icon: LayoutDashboard },
        { label: "Xodimlar", path: "/manager/staff", icon: Users },
        { label: "Mahsulotlar", path: "/manager/products", icon: Package },
        { label: "Umumiy hisobot", path: "/manager/orders", icon: ShoppingCart },
        { label: "Xona yaratish", path: "/manager/rooms", icon: HomeIcon },
        { label: "Ofitsiant hisoboti", path: "/manager/finance", icon: Wallet },
        { label: "Kirim Chiqim", path: "/manager/expenses", icon: Receipt },
        { label: "Profil", path: "/manager/profile", icon: User },
        { label: "Sozlamalar", path: "/manager/settings", icon: Settings },
    ],
};

interface AppLayoutProps {
    requiredRole: UserRole;
}

export function AppLayout({ requiredRole }: AppLayoutProps) {
    const { user, isAuthenticated, logout } = useAuth();
    const { language } = useSettings();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login', { replace: true });
            return;
        }
        if (user && user.role !== requiredRole) {
            navigate(getRoleBasePath(user.role), { replace: true });
        }
    }, [isAuthenticated, user, requiredRole, navigate]);

    if (!user || user.role !== requiredRole) return null;

    const navItems = NAV_BY_ROLE[user.role] ?? [];

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="flex h-screen w-full overflow-hidden">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                    onClick={closeSidebar}
                />
            )}

            <aside className={`
        fixed lg:sticky lg:top-0
        inset-y-0 left-0 z-50
        h-screen
        w-64 shrink-0
        bg-sidebar text-sidebar-foreground
        flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                <div className="p-6 border-b border-sidebar-border flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-lg font-bold text-sidebar-primary-foreground">Restourant</h1>
                        <p className="text-xs text-sidebar-foreground/60 mt-1">{t('Boshqaruv tizimi', language)}</p>
                    </div>
                    <button
                        onClick={closeSidebar}
                        className="lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === getRoleBasePath(user.role)}
                            onClick={closeSidebar}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive
                                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                                }`
                            }
                        >
                            <item.icon className="h-4 w-4 shrink-0" />
                            {t(item.label, language)}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-sidebar-border shrink-0">
                    <div className="mb-3 px-3">
                        <p className="text-sm font-medium text-sidebar-foreground">
                            {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-sidebar-foreground/50">{user.role}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        {t('Chiqish', language)}
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
                <div className="sticky top-0 z-30 lg:hidden bg-background border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
                    <button onClick={() => setSidebarOpen(true)} className="text-foreground">
                        <Menu className="h-5 w-5" />
                    </button>
                    <span className="font-semibold text-foreground">Restourant</span>
                </div>
                <div className="flex-1 p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
