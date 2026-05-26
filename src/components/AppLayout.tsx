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
        <div className="flex h-screen w-full overflow-hidden bg-background">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:sticky lg:top-0
                inset-y-0 left-0 z-50
                h-screen w-60 shrink-0
                bg-sidebar-background
                flex flex-col
                transform transition-transform duration-200 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>

                {/* Logo */}
                <div className="px-5 py-5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
                            <span className="text-white text-xs font-bold">R</span>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white leading-none">Restaurant</p>
                            <p className="text-[10px] text-sidebar-foreground/50 mt-0.5">Admin panel</p>
                        </div>
                    </div>
                    <button
                        onClick={closeSidebar}
                        className="lg:hidden text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 pb-3 space-y-0.5 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === getRoleBasePath(user.role)}
                            onClick={closeSidebar}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                                    isActive
                                        ? 'bg-sidebar-primary text-white'
                                        : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                                }`
                            }
                        >
                            <item.icon className="h-[15px] w-[15px] shrink-0" />
                            {t(item.label, language)}
                        </NavLink>
                    ))}
                </nav>

                {/* User info + logout */}
                <div className="px-3 py-3 border-t border-sidebar-border shrink-0">
                    <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors group">
                        <div className="w-7 h-7 rounded-full bg-sidebar-primary/20 flex items-center justify-center shrink-0">
                            <span className="text-sidebar-primary text-[10px] font-bold">{initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-sidebar-foreground truncate">
                                {user.firstName} {user.lastName}
                            </p>
                            <p className="text-[10px] text-sidebar-foreground/40">{user.role}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            title="Chiqish"
                            className="text-sidebar-foreground/30 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
                {/* Mobile topbar */}
                <div className="sticky top-0 z-30 lg:hidden bg-background/80 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
                    <button onClick={() => setSidebarOpen(true)} className="text-foreground">
                        <Menu className="h-5 w-5" />
                    </button>
                    <span className="font-semibold text-sm text-foreground">Restaurant</span>
                </div>

                <div className="flex-1 p-5 sm:p-6 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
