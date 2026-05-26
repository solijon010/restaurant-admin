import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { t } from '@/lib/i18n';
import { getRoleBasePath, UserRole } from '@/lib/auth';
import {
    LogOut, LayoutDashboard, Building2, Users, User,
    ShoppingCart, Package, Menu, X, Settings,
    HomeIcon, Wallet, Receipt,
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

    const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();

    return (
        <div className="flex h-screen w-full overflow-hidden">
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={closeSidebar} />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50
                h-screen w-56 shrink-0
                bg-sidebar flex flex-col
                transform transition-transform duration-200 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>

                {/* Logo */}
                <div className="h-14 px-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-sidebar-primary flex items-center justify-center shrink-0">
                            <span className="text-white text-[10px] font-bold">R</span>
                        </div>
                        <span className="text-[13px] font-semibold text-sidebar-foreground tracking-wide">
                            Restourant
                        </span>
                    </div>
                    <button onClick={closeSidebar} className="lg:hidden text-sidebar-foreground/40 hover:text-sidebar-foreground">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === getRoleBasePath(user.role)}
                            onClick={closeSidebar}
                            className={({ isActive }) =>
                                `flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-all duration-150 ${
                                    isActive
                                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                                        : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                                }`
                            }
                        >
                            <item.icon className="h-[15px] w-[15px] shrink-0 opacity-80" />
                            {t(item.label, language)}
                        </NavLink>
                    ))}
                </nav>

                {/* User */}
                <div className="px-2 py-3 border-t border-sidebar-border shrink-0">
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-md">
                        <div className="w-6 h-6 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
                            <span className="text-sidebar-accent-foreground text-[9px] font-bold">{initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-medium text-sidebar-foreground truncate leading-tight">
                                {user.firstName} {user.lastName}
                            </p>
                            <p className="text-[10px] text-sidebar-foreground/40 leading-tight">{user.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="mt-1 flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] w-full text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
                    >
                        <LogOut className="h-[14px] w-[14px] shrink-0" />
                        {t('Chiqish', language)}
                    </button>
                </div>
            </aside>

            {/* Main */}
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
