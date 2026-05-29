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
    ChevronDown, Layers,
} from 'lucide-react';

interface NavItem  { label: string; path: string; icon: React.ElementType; }
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
        { label: 'Savdo tahlili',      path: '/manager/sales',   icon: TrendingUp },
        {
            label: 'Boshqaruv', icon: Layers,
            children: [
                { label: 'Xodimlar',      path: '/manager/staff',    icon: Users },
                { label: 'Mahsulotlar',   path: '/manager/products', icon: Package },
                { label: 'Xona yaratish', path: '/manager/rooms',    icon: HomeIcon },
                { label: 'Profil',        path: '/manager/profile',  icon: User },
            ],
        },
        { label: 'Sozlamalar', path: '/manager/settings', icon: Settings },
    ],
};

export function AppLayout({ requiredRole }: { requiredRole: UserRole }) {
    const { user, isAuthenticated, logout } = useAuth();
    const { language } = useSettings();
    const navigate  = useNavigate();
    const location  = useLocation();
    const [open, setOpen] = useState(false);
    const [groups, setGroups] = useState<Record<string, boolean>>({ Boshqaruv: true });
    const isRoot = location.pathname === getRoleBasePath(requiredRole);

    useEffect(() => {
        if (!isAuthenticated) { navigate('/login', { replace: true }); return; }
        if (user && user.role !== requiredRole) navigate(getRoleBasePath(user.role), { replace: true });
    }, [isAuthenticated, user, requiredRole, navigate]);

    if (!user || user.role !== requiredRole) return null;

    const navItems: NavEntry[] = NAV_BY_ROLE[user.role] ?? [];
    const initials = `${user.firstName?.[0]||''}${user.lastName?.[0]||''}`.toUpperCase();
    const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

    const NavItem = ({ entry, indent = false }: { entry: NavItem; indent?: boolean }) => (
        <NavLink to={entry.path} end={entry.path === getRoleBasePath(user.role)} onClick={() => setOpen(false)}>
            {({ isActive }) => (
                <div style={{
                    display: 'flex', alignItems: 'center',
                    gap: indent ? 8 : 10,
                    padding: indent ? '6px 10px 6px 12px' : '7px 10px',
                    borderRadius: 6, cursor: 'pointer',
                    fontSize: indent ? 13 : 13.5,
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? '#fff' : 'hsl(240 5% 58%)',
                    background: isActive ? 'hsl(240 5% 18%)' : 'transparent',
                    transition: 'all 0.12s',
                    position: 'relative',
                }}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'hsl(240 5% 14%)'; e.currentTarget.style.color = 'hsl(240 5% 82%)'; }}}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'hsl(240 5% 58%)'; }}}
                >
                    {isActive && (
                        <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 2.5, height: '60%', background: 'hsl(142 71% 45%)', borderRadius: '0 2px 2px 0' }} />
                    )}
                    <entry.icon size={indent ? 13 : 14} style={{ flexShrink: 0, color: isActive ? 'hsl(142 71% 55%)' : 'inherit', opacity: isActive ? 1 : 0.65 }} />
                    <span>{t(entry.label, language)}</span>
                </div>
            )}
        </NavLink>
    );

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden', background: 'hsl(var(--background))' }}>

            {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40, backdropFilter: 'blur(2px)' }} className="lg:hidden" />}

            {/* ══ SIDEBAR ═══════════════════════════════════════════════ */}
            <aside className={`fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50 h-screen flex flex-col transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
                style={{ width: 220, background: 'hsl(240 6% 10%)', borderRight: '1px solid hsl(240 5% 15%)' }}>

                {/* Brand */}
                <div style={{ padding: '16px 14px', borderBottom: '1px solid hsl(240 5% 15%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 7, background: 'hsl(142 71% 35%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>SC</span>
                        </div>
                        <div>
                            <p style={{ fontSize: 12.5, fontWeight: 600, color: '#fff', margin: 0 }}>Sohil Choyxonasi</p>
                            <p style={{ fontSize: 10, color: 'hsl(240 5% 40%)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{t('Boshqaruv tizimi', language)}</p>
                        </div>
                    </div>
                    <button onClick={() => setOpen(false)} className="lg:hidden" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 45%)', padding: 2 }}>
                        <X size={14} />
                    </button>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: 1, overflow: 'hidden' }}>
                    {navItems.map((entry) => {
                        if (isGroup(entry)) {
                            const expanded = !!groups[entry.label];
                            const hasActive = entry.children.some(c => location.pathname.startsWith(c.path));
                            return (
                                <div key={entry.label} style={{ marginBottom: 2 }}>
                                    <button onClick={() => setGroups(p => ({ ...p, [entry.label]: !p[entry.label] }))} style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        width: '100%', padding: '7px 10px', borderRadius: 6,
                                        background: hasActive ? 'hsl(240 5% 14%)' : 'transparent',
                                        border: 'none', cursor: 'pointer',
                                        fontSize: 13.5, fontWeight: hasActive ? 500 : 400,
                                        color: hasActive ? 'hsl(240 5% 82%)' : 'hsl(240 5% 55%)',
                                        transition: 'all 0.12s',
                                    }}
                                        onMouseEnter={e => { if (!hasActive) { e.currentTarget.style.background = 'hsl(240 5% 14%)'; e.currentTarget.style.color = 'hsl(240 5% 80%)'; }}}
                                        onMouseLeave={e => { if (!hasActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'hsl(240 5% 55%)'; }}}
                                    >
                                        <entry.icon size={14} style={{ flexShrink: 0, opacity: 0.65 }} />
                                        <span style={{ flex: 1, textAlign: 'left' }}>{t(entry.label, language)}</span>
                                        <ChevronDown size={12} style={{ opacity: 0.4, transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s' }} />
                                    </button>
                                    {expanded && (
                                        <div style={{ marginLeft: 10, paddingLeft: 8, marginTop: 1, borderLeft: '1px solid hsl(240 5% 18%)', display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {entry.children.map(c => <NavItem key={c.path} entry={c} indent />)}
                                        </div>
                                    )}
                                </div>
                            );
                        }
                        return <NavItem key={entry.path} entry={entry} />;
                    })}
                </nav>

                {/* User */}
                <div style={{ padding: '8px 6px', borderTop: '1px solid hsl(240 5% 15%)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 7, background: 'hsl(240 5% 14%)', marginBottom: 4 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'hsl(142 71% 20%)', border: '1px solid hsl(142 71% 30%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'hsl(142 71% 65%)' }}>{initials}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 12, fontWeight: 500, color: '#e2e8f0', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.firstName} {user.lastName}</p>
                            <p style={{ fontSize: 10, color: 'hsl(240 5% 40%)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{user.role}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        width: '100%', padding: '6px 10px', borderRadius: 6,
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 12.5, color: 'hsl(240 5% 45%)', transition: 'all 0.12s',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'hsl(0 84% 60% / 0.07)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'hsl(240 5% 45%)'; e.currentTarget.style.background = 'none'; }}
                    >
                        <LogOut size={12} /> {t('Chiqish', language)}
                    </button>
                </div>
            </aside>

            {/* ══ MAIN ══════════════════════════════════════════════════ */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflowY: 'auto', background: 'hsl(var(--background))' }}>

                {/* Mobile topbar */}
                <div className="sticky top-0 z-30 lg:hidden flex items-center gap-3 px-4 py-3 shrink-0"
                    style={{ background: 'hsl(var(--background))', borderBottom: '1px solid hsl(var(--border))' }}>
                    {!isRoot
                        ? <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 500, color: 'hsl(var(--foreground))', background: 'none', border: 'none', cursor: 'pointer' }}><ArrowLeft size={15} /> Orqaga</button>
                        : <button onClick={() => setOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--foreground))' }}><Menu size={18} /></button>
                    }
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: 'hsl(var(--foreground))' }}>Sohil Choyxonasi</span>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 sm:p-6 lg:p-8 page-enter">
                    {!isRoot && (
                        <button onClick={() => navigate(-1)} className="hidden lg:inline-flex mb-5"
                            style={{
                                alignItems: 'center', gap: 6, padding: '5px 12px',
                                border: '1px solid hsl(var(--border))', borderRadius: 6,
                                background: 'hsl(var(--background))', fontSize: 12, fontWeight: 500,
                                color: 'hsl(var(--muted-foreground))', cursor: 'pointer', transition: 'all 0.12s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'hsl(var(--ring))'; e.currentTarget.style.color = 'hsl(var(--ring))'; }}
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
