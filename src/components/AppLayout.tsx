import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { t } from '@/lib/i18n';
import { getRoleBasePath, UserRole } from '@/lib/auth';
import {
    LogOut, LayoutDashboard, Building2, Users, User,
    ShoppingCart, Package, Menu, X, Settings,
    HomeIcon, Wallet, ArrowLeft, TrendingUp, ChevronDown, Layers,
} from 'lucide-react';

interface NavItem  { label: string; path: string; icon: React.ElementType; }
interface NavGroup { label: string; icon: React.ElementType; children: NavItem[]; }
type NavEntry = NavItem | NavGroup;
const isGroup = (e: NavEntry): e is NavGroup => 'children' in e;

const NAV_BY_ROLE: Record<string, NavEntry[]> = {
    SUPERADMIN: [
        { label: "Bosh sahifa",  path: "/superadmin",           icon: LayoutDashboard },
        { label: "Kompaniyalar", path: "/superadmin/companies",  icon: Building2 },
        { label: "Menejerlar",   path: "/superadmin/managers",   icon: Users },
        { label: "Profil",       path: "/superadmin/profile",    icon: User },
        { label: "Sozlamalar",   path: "/superadmin/settings",   icon: Settings },
    ],
    MANAGER: [
        { label: "Bosh sahifa",        path: "/manager",         icon: LayoutDashboard },
        { label: "Umumiy hisobot",     path: "/manager/orders",  icon: ShoppingCart },
        { label: "Ofitsiant hisoboti", path: "/manager/finance", icon: Wallet },
        { label: "Savdo tahlili",      path: "/manager/sales",   icon: TrendingUp },
        {
            label: "Boshqaruv", icon: Layers,
            children: [
                { label: "Xodimlar",      path: "/manager/staff",    icon: Users },
                { label: "Mahsulotlar",   path: "/manager/products", icon: Package },
                { label: "Xona yaratish", path: "/manager/rooms",    icon: HomeIcon },
            ],
        },
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
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ Boshqaruv: true });
    const isRoot = location.pathname === getRoleBasePath(requiredRole);
    const toggleGroup = (label: string) => setOpenGroups(p => ({ ...p, [label]: !p[label] }));

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

    const navItems: NavEntry[] = NAV_BY_ROLE[user.role] ?? [];

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
                    <div className="flex items-center gap-2">
                        <img src="/hisobchim-logo.ico" alt="Logo" style={{ width: 36, height: 36, objectFit: 'contain' }} />
                        <div>
                            <h1 className="text-lg font-bold text-sidebar-primary-foreground">Sohil Choyxonasi</h1>
                            <p className="text-xs text-sidebar-foreground/60 mt-0.5">{t('Boshqaruv tizimi', language)}</p>
                        </div>
                    </div>
                    <button onClick={closeSidebar} className="lg:hidden p-1 rounded text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-hidden">
                    {navItems.map((entry) => {
                        if (isGroup(entry)) {
                            const open = !!openGroups[entry.label];
                            const hasActive = entry.children.some(c => location.pathname.startsWith(c.path));
                            return (
                                <div key={entry.label}>
                                    <button onClick={() => toggleGroup(entry.label)} style={{ width:'100%' }}
                                        className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200 ${hasActive ? 'bg-emerald-500/20 text-white' : 'text-sidebar-foreground/70 hover:text-white hover:bg-white/8'}`}>
                                        <span className={`flex items-center justify-center w-7 h-7 rounded-md shrink-0 ${hasActive ? 'bg-emerald-500/30' : 'bg-transparent group-hover:bg-white/10'}`}>
                                            <entry.icon className={`h-4 w-4 ${hasActive ? 'text-emerald-400' : 'text-sidebar-foreground/50 group-hover:text-white/80'}`} />
                                        </span>
                                        <span className="flex-1 text-left">{t(entry.label, language)}</span>
                                        <ChevronDown className={`h-3.5 w-3.5 opacity-50 transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`} />
                                    </button>
                                    {open && (
                                        <div className="mt-1 ml-3 pl-3 border-l border-sidebar-border space-y-0.5">
                                            {entry.children.map(child => (
                                                <NavLink key={child.path} to={child.path} onClick={closeSidebar}
                                                    className={({ isActive }) =>
                                                        `group flex items-center gap-2.5 px-2 py-2 rounded-md text-[13px] font-medium transition-all duration-150 ${isActive
                                                            ? 'bg-emerald-500/20 text-white'
                                                            : 'text-sidebar-foreground/60 hover:text-white hover:bg-white/6'
                                                        }`
                                                    }
                                                >
                                                    {({ isActive }) => (<>
                                                        <child.icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 'opacity-50 group-hover:opacity-80'}`} />
                                                        {t(child.label, language)}
                                                        {isActive && <span className="ml-auto w-1 h-1 rounded-full bg-emerald-400 shrink-0" />}
                                                    </>)}
                                                </NavLink>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        }
                        return (
                            <NavLink key={entry.path} to={entry.path}
                                end={entry.path === getRoleBasePath(user.role)}
                                onClick={closeSidebar}
                                className={({ isActive }) =>
                                    `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200 ${isActive
                                        ? 'bg-emerald-500/20 text-white shadow-sm'
                                        : 'text-sidebar-foreground/70 hover:text-white hover:bg-white/8 hover:translate-x-0.5'
                                    }`
                                }
                            >
                                {({ isActive }) => (<>
                                    <span className={`flex items-center justify-center w-7 h-7 rounded-md transition-all duration-200 shrink-0 ${isActive ? 'bg-emerald-500/30' : 'bg-transparent group-hover:bg-white/10'}`}>
                                        <entry.icon className={`h-4 w-4 transition-colors ${isActive ? 'text-emerald-400' : 'text-sidebar-foreground/50 group-hover:text-white/80'}`} />
                                    </span>
                                    <span className="flex-1">{t(entry.label, language)}</span>
                                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />}
                                </>)}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="px-3 py-3 border-t border-sidebar-border shrink-0 space-y-1">
                    <NavLink
                        to={user.role === 'MANAGER' ? '/manager/settings' : '/superadmin/settings'}
                        onClick={closeSidebar}
                        className={({ isActive }) =>
                            `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200 w-full ${isActive
                                ? 'bg-emerald-500/20 text-white shadow-sm'
                                : 'text-sidebar-foreground/70 hover:text-white hover:bg-white/8 hover:translate-x-0.5'
                            }`
                        }
                    >
                        {({ isActive }) => (<>
                            <span className={`flex items-center justify-center w-7 h-7 rounded-md transition-all duration-200 shrink-0 ${isActive ? 'bg-emerald-500/30' : 'bg-transparent group-hover:bg-white/10'}`}>
                                <Settings className={`h-4 w-4 transition-colors ${isActive ? 'text-emerald-400' : 'text-sidebar-foreground/50 group-hover:text-white/80'}`} />
                            </span>
                            {t('Sozlamalar', language)}
                            {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                        </>)}
                    </NavLink>
                    <button
                        onClick={handleLogout}
                        className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-medium w-full text-sidebar-foreground hover:text-red-400 hover:bg-red-500/8 border border-transparent transition-all duration-150"
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
                    <img src="/hisobchim-logo.ico" alt="Logo" style={{ width: 28, height: 28, objectFit: 'contain' }} />
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
