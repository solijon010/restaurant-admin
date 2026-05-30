import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { t } from '@/lib/i18n';
import { getRoleBasePath, UserRole } from '@/lib/auth';
import {
    LogOut, LayoutDashboard, Building2, Users, User,
    ShoppingCart, Package, Menu, X, Settings,
    HomeIcon, Wallet, TrendingUp, ChevronDown,
    BarChart3, ArrowLeft,
} from 'lucide-react';

interface NavItem  { label: string; path: string; icon: React.ElementType; badge?: string; }
interface NavGroup { label: string; icon: React.ElementType; children: NavItem[]; }
type NavEntry = NavItem | NavGroup;
const isGroup = (e: NavEntry): e is NavGroup => 'children' in e;

const NAV_BY_ROLE: Record<string, NavEntry[]> = {
    SUPERADMIN: [
        { label: 'Bosh sahifa',  path: '/superadmin',           icon: LayoutDashboard },
        { label: 'Kompaniyalar', path: '/superadmin/companies',  icon: Building2 },
        { label: 'Menejerlar',   path: '/superadmin/managers',   icon: Users },
        { label: 'Profil',       path: '/superadmin/profile',    icon: User },
        { label: 'Sozlamalar',   path: '/superadmin/settings',   icon: Settings },
    ],
    MANAGER: [
        { label: 'Bosh sahifa',        path: '/manager',         icon: LayoutDashboard },
        { label: 'Umumiy hisobot',     path: '/manager/orders',  icon: ShoppingCart },
        { label: 'Ofitsiant hisoboti', path: '/manager/finance', icon: Wallet },
        { label: 'Savdo tahlili',      path: '/manager/sales',   icon: BarChart3 },
        {
            label: 'Boshqaruv', icon: Building2,
            children: [
                { label: 'Xodimlar',      path: '/manager/staff',    icon: Users },
                { label: 'Mahsulotlar',   path: '/manager/products', icon: Package },
                { label: 'Xona yaratish', path: '/manager/rooms',    icon: HomeIcon },
            ],
        },
    ],
};

export function AppLayout({ requiredRole }: { requiredRole: UserRole }) {
    const { user, isAuthenticated, logout } = useAuth();
    const { language } = useSettings();
    const navigate  = useNavigate();
    const location  = useLocation();
    const [mob, setMob]       = useState(false);
    const [groups, setGroups] = useState<Record<string, boolean>>({ Boshqaruv: true });
    const isRoot = location.pathname === getRoleBasePath(requiredRole);

    useEffect(() => {
        if (!isAuthenticated) { navigate('/login', { replace: true }); return; }
        if (user && user.role !== requiredRole) navigate(getRoleBasePath(user.role), { replace: true });
    }, [isAuthenticated, user, requiredRole, navigate]);

    if (!user || user.role !== requiredRole) return null;

    const entries: NavEntry[] = NAV_BY_ROLE[user.role] ?? [];
    const initials = `${user.firstName?.[0]??''}${user.lastName?.[0]??''}`.toUpperCase();

    return (
        <div className="flex h-screen w-full overflow-hidden" style={{ background: 'hsl(var(--background))' }}>

            {mob && (
                <div onClick={() => setMob(false)}
                    className="fixed inset-0 z-40 lg:hidden"
                    style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }} />
            )}

            <aside className={`
        fixed lg:sticky lg:top-0
        inset-y-0 left-0 z-50
        h-screen
        w-64 shrink-0
        bg-sidebar text-sidebar-foreground
        flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${mob ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid hsl(var(--sidebar-border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>
                            Sohil Choyxonasi
                        </h1>
                        <p style={{ fontSize: 11, color: 'hsl(var(--sidebar-foreground))', margin: '3px 0 0', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            {t('Boshqaruv tizimi', language)}
                        </p>
                    </div>
                    <button onClick={() => setMob(false)} className="lg:hidden"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--sidebar-foreground))', opacity: 0.5 }}>
                        <X size={16} />
                    </button>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>

                    {entries.map((entry) => {
                        if (isGroup(entry)) {
                            const open = !!groups[entry.label];
                            const hasActive = entry.children.some(c => location.pathname.startsWith(c.path));
                            return (
                                <div key={entry.label}>
                                    <button
                                        onClick={() => setGroups(p => ({ ...p, [entry.label]: !p[entry.label] }))}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            width: '100%', padding: '8px 10px', borderRadius: 8,
                                            border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                                            fontSize: 13.5, fontWeight: 500,
                                            background: hasActive ? 'hsl(var(--sidebar-accent))' : 'transparent',
                                            color: hasActive ? '#fff' : 'hsl(var(--sidebar-foreground))',
                                        }}
                                        onMouseEnter={e => { if (!hasActive) e.currentTarget.style.background = 'hsl(var(--sidebar-accent)/0.7)'; }}
                                        onMouseLeave={e => { if (!hasActive) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <entry.icon size={16} style={{ flexShrink: 0, opacity: hasActive ? 1 : 0.6 }} />
                                        <span style={{ flex: 1, textAlign: 'left' }}>{t(entry.label, language)}</span>
                                        <ChevronDown size={13} style={{ opacity: 0.4, transform: open ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
                                    </button>
                                    {open && (
                                        <div style={{ marginTop: 2, marginLeft: 12, paddingLeft: 10, borderLeft: '1px solid hsl(var(--sidebar-border))', display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {entry.children.map(child => (
                                                <NavLink key={child.path} to={child.path} onClick={() => setMob(false)}>
                                                    {({ isActive }) => (
                                                        <div style={{
                                                            display: 'flex', alignItems: 'center', gap: 9,
                                                            padding: '7px 10px', borderRadius: 7, cursor: 'pointer',
                                                            fontSize: 13, fontWeight: isActive ? 600 : 400,
                                                            transition: 'all 0.15s',
                                                            background: isActive ? 'hsl(var(--sidebar-primary)/0.18)' : 'transparent',
                                                            color: isActive ? 'hsl(var(--sidebar-primary))' : 'hsl(var(--sidebar-foreground))',
                                                        }}
                                                            onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'hsl(var(--sidebar-accent)/0.6)'; e.currentTarget.style.color = '#fff'; }}}
                                                            onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'hsl(var(--sidebar-foreground))'; }}}
                                                        >
                                                            <child.icon size={14} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.55 }} />
                                                            {t(child.label, language)}
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
                                onClick={() => setMob(false)}
                            >
                                {({ isActive }) => (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                                        fontSize: 13.5, fontWeight: isActive ? 600 : 400,
                                        transition: 'all 0.15s',
                                        background: isActive ? 'hsl(var(--sidebar-primary)/0.16)' : 'transparent',
                                        color: isActive ? 'hsl(var(--sidebar-primary))' : 'hsl(var(--sidebar-foreground))',
                                    }}
                                        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'hsl(var(--sidebar-accent))'; e.currentTarget.style.color = '#fff'; }}}
                                        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'hsl(var(--sidebar-foreground))'; }}}
                                    >
                                        <entry.icon size={16} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.6 }} />
                                        <span style={{ flex: 1 }}>{t(entry.label, language)}</span>
                                        {isActive && (
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'hsl(var(--sidebar-primary))', flexShrink: 0 }} />
                                        )}
                                    </div>
                                )}
                            </NavLink>
                        );
                    })}

                    {/* Settings */}
                    <div style={{ marginTop: 'auto' }}>
                        <NavLink to={user.role === 'MANAGER' ? '/manager/settings' : '/superadmin/settings'} onClick={() => setMob(false)}>
                            {({ isActive }) => (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                                    fontSize: 13.5, fontWeight: isActive ? 600 : 400,
                                    transition: 'all 0.15s',
                                    background: isActive ? 'hsl(var(--sidebar-primary)/0.16)' : 'transparent',
                                    color: isActive ? 'hsl(var(--sidebar-primary))' : 'hsl(var(--sidebar-foreground))',
                                }}
                                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'hsl(var(--sidebar-accent))'; e.currentTarget.style.color = '#fff'; }}}
                                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'hsl(var(--sidebar-foreground))'; }}}
                                >
                                    <Settings size={16} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.6 }} />
                                    {t('Sozlamalar', language)}
                                    {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'hsl(var(--sidebar-primary))', marginLeft: 'auto' }} />}
                                </div>
                            )}
                        </NavLink>
                    </div>
                </nav>

                {/* User */}
                <div style={{ padding: '10px', borderTop: '1px solid hsl(var(--sidebar-border))' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'hsl(var(--sidebar-accent))', marginBottom: 4 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'hsl(var(--sidebar-primary)/0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--sidebar-primary))' }}>{initials}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {user.firstName} {user.lastName}
                            </p>
                            <p style={{ fontSize: 10, color: 'hsl(var(--sidebar-foreground))', margin: 0, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                {user.role}
                            </p>
                        </div>
                    </div>
                    <button onClick={() => { logout(); navigate('/login', { replace: true }); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, color: 'hsl(var(--sidebar-foreground))', background: 'transparent', transition: 'all 0.15s', opacity: 0.6 }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; e.currentTarget.style.opacity = '1'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'hsl(var(--sidebar-foreground))'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.opacity = '0.6'; }}
                    >
                        <LogOut size={13} /> {t('Chiqish', language)}
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
                <div className="sticky top-0 z-30 lg:hidden bg-background border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
                    {!isRoot ? (
                        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 500, color: 'hsl(var(--muted-foreground))', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <ArrowLeft size={15} /> Orqaga
                        </button>
                    ) : (
                        <button onClick={() => setMob(true)} className="text-foreground">
                            <Menu className="h-5 w-5" />
                        </button>
                    )}
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))' }}>Sohil Choyxonasi</span>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 sm:p-6 lg:p-8 page-enter">
                    {!isRoot && (
                        <button onClick={() => navigate(-1)}
                            className="hidden lg:inline-flex items-center gap-1.5 mb-6"
                            style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontSize: 12, fontWeight: 500, color: 'hsl(var(--muted-foreground))', cursor: 'pointer', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'hsl(var(--primary))'; e.currentTarget.style.color = 'hsl(var(--primary))'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'hsl(var(--border))'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}
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
