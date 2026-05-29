import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { t } from '@/lib/i18n';
import { getRoleBasePath, UserRole } from '@/lib/auth';
import {
    LogOut, LayoutDashboard, Building2, Users, User,
    ShoppingCart, Package, Menu, X, Settings,
    HomeIcon, Wallet, ArrowLeft, TrendingUp, ChevronRight, ChevronDown,
    Layers,
} from 'lucide-react';

interface NavItem { label: string; path: string; icon: React.ElementType; }
interface NavGroup { label: string; icon: React.ElementType; children: NavItem[]; }
type NavEntry = NavItem | NavGroup;

function isGroup(e: NavEntry): e is NavGroup {
    return 'children' in e;
}

const NAV_BY_ROLE: Record<string, NavEntry[]> = {
    SUPERADMIN: [
        { label: 'Bosh sahifa',  path: '/superadmin',           icon: LayoutDashboard },
        { label: 'Kompaniyalar', path: '/superadmin/companies',  icon: Building2 },
        { label: 'Menejerlar',   path: '/superadmin/managers',   icon: Users },
        { label: 'Profil',       path: '/superadmin/profile',    icon: User },
        { label: 'Sozlamalar',   path: '/superadmin/settings',   icon: Settings },
    ],
    MANAGER: [
        { label: 'Bosh sahifa',        path: '/manager',          icon: LayoutDashboard },
        { label: 'Umumiy hisobot',     path: '/manager/orders',   icon: ShoppingCart },
        { label: 'Ofitsiant hisoboti', path: '/manager/finance',  icon: Wallet },
        { label: 'Savdo tahlili',      path: '/manager/sales',    icon: TrendingUp },
        {
            label: 'Boshqaruv', icon: Layers,
            children: [
                { label: 'Xodimlar',      path: '/manager/staff',    icon: Users },
                { label: 'Mahsulotlar',   path: '/manager/products', icon: Package },
                { label: 'Xona yaratish', path: '/manager/rooms',    icon: HomeIcon },
                { label: 'Profil',        path: '/manager/profile',  icon: User },
            ],
        },
    ],
};

const RETRO = {
    bg:          '#0B0F1A',
    border:      '#1e2640',
    borderLight: '#252d45',
    cream:       '#a0aec0',
    creamDim:    '#64748b',
    green:       '#10b981',
    greenDim:    '#065f46',
    greenBg:     'rgba(16,185,129,0.12)',
    white:       '#f1f5f9',
};

export function AppLayout({ requiredRole }: { requiredRole: UserRole }) {
    const { user, isAuthenticated, logout } = useAuth();
    const { language } = useSettings();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ 'Boshqaruv': true });
    const isRoot = location.pathname === getRoleBasePath(requiredRole);

    const toggleGroup = (label: string) =>
        setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));

    useEffect(() => {
        if (!isAuthenticated) { navigate('/login', { replace: true }); return; }
        if (user && user.role !== requiredRole) navigate(getRoleBasePath(user.role), { replace: true });
    }, [isAuthenticated, user, requiredRole, navigate]);

    if (!user || user.role !== requiredRole) return null;

    const navItems: NavEntry[] = NAV_BY_ROLE[user.role] ?? [];
    const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden', background: 'hsl(var(--background))' }}>

            {sidebarOpen && (
                <div onClick={() => setSidebarOpen(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }}
                    className="lg:hidden"
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
                        <img src="/LOGO.PNJ.png" alt="Logo" style={{ width: 36, height: 36, objectFit: 'contain' }} />
                        <div>
                            <h1 className="text-lg font-bold text-sidebar-primary-foreground">Sohil Choyxonasi</h1>
                            <p className="text-xs text-sidebar-foreground/60 mt-0.5">{t('Boshqaruv tizimi', language)}</p>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: '12px 8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {navItems.map((entry) => {
                        if (isGroup(entry)) {
                            const isOpen = !!openGroups[entry.label];
                            const hasActive = entry.children.some(c => location.pathname.startsWith(c.path));
                            return (
                                <div key={entry.label}>
                                    {/* Group header */}
                                    <button
                                        onClick={() => toggleGroup(entry.label)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            width: '100%', padding: '11px 14px',
                                            cursor: 'pointer',
                                            fontFamily: 'Inter, system-ui, sans-serif',
                                            fontSize: 16, fontWeight: hasActive ? 700 : 500,
                                            color: '#ffffff',
                                            background: hasActive ? RETRO.greenBg : 'rgba(255,255,255,0.03)',
                                            border: `1px solid ${hasActive ? RETRO.green + '55' : 'rgba(255,255,255,0.07)'}`,
                                            borderLeft: `3px solid ${hasActive ? RETRO.green : 'rgba(255,255,255,0.07)'}`,
                                            borderRadius: 6, opacity: 0.9,
                                            transition: 'all 0.12s ease',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.08)'; e.currentTarget.style.opacity = '1'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = hasActive ? RETRO.greenBg : 'rgba(255,255,255,0.03)'; e.currentTarget.style.opacity = '0.9'; }}
                                    >
                                        <entry.icon size={16} style={{ flexShrink: 0, color: hasActive ? RETRO.green : '#fff' }} />
                                        <span style={{ flex: 1, textAlign: 'left' }}>{t(entry.label, language)}</span>
                                        {isOpen
                                            ? <ChevronDown size={14} style={{ color: RETRO.green, flexShrink: 0 }} />
                                            : <ChevronRight size={14} style={{ color: '#64748b', flexShrink: 0 }} />
                                        }
                                    </button>

                                    {/* Children */}
                                    {isOpen && (
                                        <div style={{ marginTop: 2, marginLeft: 12, display: 'flex', flexDirection: 'column', gap: 2, borderLeft: `2px solid rgba(255,255,255,0.07)`, paddingLeft: 8 }}>
                                            {entry.children.map(child => (
                                                <NavLink key={child.path} to={child.path} onClick={() => setSidebarOpen(false)}>
                                                    {({ isActive }) => (
                                                        <div style={{
                                                            display: 'flex', alignItems: 'center', gap: 8,
                                                            padding: '9px 12px', borderRadius: 5, cursor: 'pointer',
                                                            fontFamily: 'Inter, system-ui, sans-serif',
                                                            fontSize: 15, fontWeight: isActive ? 700 : 400,
                                                            color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                                                            background: isActive ? RETRO.greenBg : 'transparent',
                                                            borderLeft: `2px solid ${isActive ? RETRO.green : 'transparent'}`,
                                                            transition: 'all 0.1s ease',
                                                        }}
                                                            onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#fff'; } }}
                                                            onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; } }}
                                                        >
                                                            <child.icon size={14} style={{ flexShrink: 0, color: isActive ? RETRO.green : 'rgba(255,255,255,0.5)' }} />
                                                            <span>{t(child.label, language)}</span>
                                                        </div>
                                                    )}
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
                                onClick={() => setSidebarOpen(false)}
                            >
                                {({ isActive }) => (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '11px 14px', cursor: 'pointer',
                                        fontFamily: 'Inter, system-ui, sans-serif',
                                        fontSize: 16, fontWeight: isActive ? 700 : 500,
                                        color: '#ffffff',
                                        background: isActive ? RETRO.greenBg : 'rgba(255,255,255,0.03)',
                                        border: `1px solid ${isActive ? RETRO.green + '55' : 'rgba(255,255,255,0.07)'}`,
                                        borderLeft: `3px solid ${isActive ? RETRO.green : 'rgba(255,255,255,0.07)'}`,
                                        borderRadius: 6, transition: 'all 0.12s ease', opacity: isActive ? 1 : 0.8,
                                    }}
                                        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(16,185,129,0.08)'; e.currentTarget.style.opacity = '1'; e.currentTarget.style.borderLeftColor = RETRO.green; e.currentTarget.style.borderColor = RETRO.green + '40'; } }}
                                        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.borderLeftColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; } }}
                                    >
                                        <entry.icon size={16} style={{ flexShrink: 0, color: isActive ? RETRO.green : '#ffffff' }} />
                                        <span>{t(entry.label, language)}</span>
                                    </div>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* User + Sozlamalar + Logout */}
                <div style={{ borderTop: `2px solid ${RETRO.border}`, padding: '14px 8px 12px' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', marginBottom: 8,
                        background: 'linear-gradient(135deg, #1a1f35 0%, #0f1923 100%)',
                        border: '1px solid #2d3a55',
                        borderRadius: 10,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}>
                        <div style={{
                            width: 32, height: 32, flexShrink: 0, borderRadius: 8,
                            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 6px rgba(124,58,237,0.4)',
                        }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>
                                {user.firstName?.[0]?.toUpperCase()}{user.lastName?.[0]?.toUpperCase()}
                            </span>
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {user.firstName} {user.lastName}
                            </p>
                            <p style={{ fontSize: 10, color: '#64748b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                {user.role}
                            </p>
                        </div>
                        <NavLink to={user.role === 'MANAGER' ? '/manager/settings' : '/superadmin/settings'} onClick={() => setSidebarOpen(false)}>
                            {({ isActive }) => (
                                <div style={{
                                    width: 28, height: 28, flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: 4, border: `1px solid ${isActive ? RETRO.green : 'rgba(255,255,255,0.1)'}`,
                                    background: isActive ? RETRO.greenBg : 'transparent',
                                    cursor: 'pointer', transition: 'all 0.12s',
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = RETRO.green; e.currentTarget.style.background = RETRO.greenBg; }}
                                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'transparent'; } }}
                                >
                                    <Settings size={13} color={isActive ? RETRO.green : RETRO.creamDim} />
                                </div>
                            )}
                        </NavLink>
                    </div>

                    <button onClick={handleLogout}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            width: '100%', padding: '7px 12px',
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: RETRO.creamDim, fontSize: 13, fontFamily: 'Inter, system-ui, sans-serif',
                            borderRadius: 2, transition: 'all 0.1s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = RETRO.creamDim; e.currentTarget.style.background = 'none'; }}
                    >
                        <LogOut size={13} /> {t('Chiqish', language)}
                    </button>
                </div>
            </aside>

            {/* ── MAIN ── */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflowY: 'auto', background: 'hsl(var(--background))' }}>

                {/* Mobile topbar */}
                <div className="sticky top-0 z-30 lg:hidden flex items-center gap-3 px-4 py-3 shrink-0"
                    style={{ background: RETRO.bg, borderBottom: `2px solid ${RETRO.border}` }}>
                    {!isRoot ? (
                        <button onClick={() => navigate(-1)}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: RETRO.cream, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Courier Prime, monospace' }}>
                            <ArrowLeft size={15} /> Orqaga
                        </button>
                    ) : (
                        <button onClick={() => setSidebarOpen(true)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: RETRO.cream }}>
                            <Menu size={18} />
                        </button>
                    )}
                    <img src="/LOGO.PNJ.png" alt="Logo" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                </div>

                {/* Content */}
                <div className="flex-1 p-4 sm:p-6 lg:p-7 page-enter">
                    {!isRoot && (
                        <button onClick={() => navigate(-1)}
                            className="hidden lg:inline-flex"
                            style={{
                                alignItems: 'center', gap: 6, padding: '5px 14px', marginBottom: 20,
                                border: `2px solid hsl(var(--border))`,
                                background: 'hsl(var(--card))',
                                boxShadow: '2px 2px 0 hsl(var(--border))',
                                fontSize: 13, fontWeight: 700, fontFamily: 'Inter, system-ui, sans-serif',
                                color: 'hsl(var(--foreground))', cursor: 'pointer',
                                borderRadius: 2, transition: 'all 0.08s ease',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'hsl(var(--accent))'; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'hsl(var(--card))'; e.currentTarget.style.color = 'hsl(var(--foreground))'; }}
                        >
                            <ArrowLeft size={13} /> Orqaga
                        </button>
                    )}
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
