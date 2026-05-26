import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { t } from '@/lib/i18n';
import { getRoleBasePath, UserRole } from '@/lib/auth';
import {
    LogOut, LayoutDashboard, Building2, Users, User,
    ShoppingCart, Package, Menu, X, Settings,
    HomeIcon, Wallet, ArrowLeft, ChefHat,
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
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isRoot = location.pathname === getRoleBasePath(requiredRole);

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
    const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="flex h-screen w-full overflow-hidden">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                    onClick={closeSidebar}
                />
            )}

            <aside className={`
        fixed lg:sticky lg:top-0
        inset-y-0 left-0 z-50
        h-screen w-64 shrink-0
        flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
                style={{ background: 'linear-gradient(180deg, #080e1f 0%, #0a1628 60%, #0c1a30 100%)' }}
            >
                {/* Logo */}
                <div className="px-5 pt-6 pb-5 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <ChefHat className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-[15px] font-bold text-white tracking-wide">Restourant</h1>
                                <p className="text-[10px] text-blue-400/70 font-medium tracking-wider uppercase">
                                    {t('Boshqaruv', language)}
                                </p>
                            </div>
                        </div>
                        <button onClick={closeSidebar} className="lg:hidden text-white/40 hover:text-white/80 transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="mt-5 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
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
                                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${isActive
                                    ? 'bg-blue-500/20 text-white font-semibold shadow-inner border border-blue-500/25'
                                    : 'text-white/45 hover:bg-white/5 hover:text-white/85 border border-transparent'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${isActive
                                        ? 'bg-blue-500 shadow-md shadow-blue-500/40'
                                        : 'bg-white/5 group-hover:bg-white/10'
                                    }`}>
                                        <item.icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`} />
                                    </div>
                                    <span>{t(item.label, language)}</span>
                                    {isActive && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-sm shadow-blue-400" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* User & Logout */}
                <div className="px-3 pb-5 shrink-0">
                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-3" />
                    <div className="flex items-center gap-3 px-2 py-2 rounded-xl mb-1">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md shadow-blue-500/30">
                            {initials || <User className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white/90 truncate">
                                {user.firstName} {user.lastName}
                            </p>
                            <p className="text-[11px] text-blue-400/70 font-medium">{user.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 border border-transparent hover:border-red-500/20"
                    >
                        <LogOut className="h-4 w-4" />
                        {t('Chiqish', language)}
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-background">
                {/* Mobile topbar */}
                <div className="sticky top-0 z-30 lg:hidden bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
                    {!isRoot ? (
                        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                            <ArrowLeft className="h-5 w-5" />
                            Orqaga
                        </button>
                    ) : (
                        <button onClick={() => setSidebarOpen(true)} className="text-foreground">
                            <Menu className="h-5 w-5" />
                        </button>
                    )}
                    <span className="font-bold text-foreground">Restourant</span>
                </div>

                <div className="flex-1 p-4 sm:p-6 lg:p-8">
                    {!isRoot && (
                        <button
                            onClick={() => navigate(-1)}
                            className="hidden lg:flex items-center gap-2 px-4 py-2 mb-5 rounded-xl border border-border bg-card text-sm font-medium text-foreground shadow-sm hover:bg-muted transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Orqaga
                        </button>
                    )}
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
