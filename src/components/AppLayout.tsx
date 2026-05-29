import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { t } from '@/lib/i18n';
import { getRoleBasePath, UserRole } from '@/lib/auth';
import {
    LogOut, LayoutDashboard, Building2, Users, User,
    ShoppingCart, Package, Menu, X, Settings,
    HomeIcon, Wallet, ArrowLeft, TrendingUp,
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
        { label: "Savdo tahlili", path: "/manager/sales", icon: TrendingUp },
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
                {/* Brand */}
                <div className="h-14 px-4 flex items-center justify-between border-b border-sidebar-border shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
                            <span className="text-[11px] font-black text-white">SC</span>
                        </div>
                        <div>
                            <p className="text-[13px] font-semibold text-white leading-none">Sohil Choyxonasi</p>
                            <p className="text-[10px] text-sidebar-foreground/40 mt-0.5 uppercase tracking-widest">{t('Boshqaruv tizimi', language)}</p>
                        </div>
                    </div>
                    <button onClick={closeSidebar} className="lg:hidden p-1 rounded text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-hidden">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === getRoleBasePath(user.role)}
                            onClick={closeSidebar}
                            className={({ isActive }) =>
                                `group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${isActive
                                    ? 'bg-white/8 text-white'
                                    : 'text-sidebar-foreground hover:text-white hover:bg-white/5'
                                }`
                            }
                        >
                            {({ isActive }) => (<>
                                <item.icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? 'text-emerald-400' : 'text-sidebar-foreground/50 group-hover:text-white/70'}`} />
                                <span>{t(item.label, language)}</span>
                                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                            </>)}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div className="px-2 py-2 border-t border-sidebar-border shrink-0 space-y-0.5">
                    <NavLink
                        to={user.role === 'MANAGER' ? '/manager/settings' : '/superadmin/settings'}
                        onClick={closeSidebar}
                        className={({ isActive }) =>
                            `group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 w-full ${isActive
                                ? 'bg-white/8 text-white'
                                : 'text-sidebar-foreground hover:text-white hover:bg-white/5'
                            }`
                        }
                    >
                        {({ isActive }) => (<>
                            <Settings className={`h-4 w-4 shrink-0 transition-colors ${isActive ? 'text-emerald-400' : 'text-sidebar-foreground/50 group-hover:text-white/70'}`} />
                            {t('Sozlamalar', language)}
                            {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                        </>)}
                    </NavLink>
                    <button
                        onClick={handleLogout}
                        className="group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium w-full text-sidebar-foreground hover:text-red-400 hover:bg-red-500/8 transition-all duration-150"
                    >
                        <LogOut className="h-4 w-4 shrink-0 text-sidebar-foreground/50 group-hover:text-red-400 transition-colors" />
                        {t('Chiqish', language)}
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
                <div className="sticky top-0 z-30 lg:hidden bg-background border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
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
                    <img src="/LOGO.PNJ.png" alt="Logo" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                </div>
                <div className="flex-1 p-4 sm:p-6 lg:p-8">
                    {!isRoot && (
                        <button
                            onClick={() => navigate(-1)}
                            className="hidden lg:flex items-center gap-2 px-4 py-2 mb-5 rounded-xl border border-blue-200 bg-blue-50 text-sm font-medium text-blue-600 hover:bg-blue-100 hover:border-blue-300 transition-colors shadow-sm"
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
