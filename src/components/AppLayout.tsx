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
    ChevronRight, ChevronDown, Layers,
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
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [openGroups, setOpenGroups]   = useState<Record<string,boolean>>({ Boshqaruv: true });
    const isRoot = location.pathname === getRoleBasePath(requiredRole);

    useEffect(() => {
        if (!isAuthenticated) { navigate('/login', { replace: true }); return; }
        if (user && user.role !== requiredRole) navigate(getRoleBasePath(user.role), { replace: true });
    }, [isAuthenticated, user, requiredRole, navigate]);

    if (!user || user.role !== requiredRole) return null;

    const navItems: NavEntry[] = NAV_BY_ROLE[user.role] ?? [];
    const toggleGroup = (label: string) =>
        setOpenGroups(p => ({ ...p, [label]: !p[label] }));
    const handleLogout = () => { logout(); navigate('/login', { replace: true }); };
    const initials = `${user.firstName?.[0]||''}${user.lastName?.[0]||''}`.toUpperCase();

    /* ── shared nav item style ── */
    const navItemStyle = (active: boolean): React.CSSProperties => ({
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
        fontSize: 13.5, fontWeight: active ? 600 : 400,
        color: active ? '#fff' : 'hsl(215 20% 65%)',
        background: active ? 'hsl(160 84% 39% / 0.15)' : 'transparent',
        borderLeft: `2px solid ${active ? 'hsl(160 84% 45%)' : 'transparent'}`,
        transition: 'all 0.14s ease',
        textDecoration: 'none',
    });

    return (
        <div style={{ display:'flex', height:'100vh', width:'100%', overflow:'hidden', background:'hsl(var(--background))' }}>

            {/* overlay */}
            {sidebarOpen && (
                <div onClick={() => setSidebarOpen(false)}
                    style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:40, backdropFilter:'blur(2px)' }}
                    className="lg:hidden" />
            )}

            {/* ══ SIDEBAR ══════════════════════════════════════════════ */}
            <aside className={`fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50 h-screen flex flex-col transform transition-transform duration-250 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
                style={{ width: 224, background: 'hsl(var(--sidebar-background))', borderRight: '1px solid hsl(var(--sidebar-border))' }}>

                {/* Brand */}
                <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid hsl(var(--sidebar-border))' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                            <div style={{
                                width: 32, height: 32, borderRadius: 9,
                                background: 'linear-gradient(135deg, hsl(160 84% 35%), hsl(160 84% 28%))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                                <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>SC</span>
                            </div>
                            <div>
                                <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0 }}>Sohil Choyxonasi</p>
                                <p style={{ fontSize: 10, color: 'hsl(215 20% 45%)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    {t('Boshqaruv tizimi', language)}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden"
                            style={{ background:'none', border:'none', cursor:'pointer', color:'hsl(215 20% 50%)' }}>
                            <X size={15} />
                        </button>
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ flex:1, padding:'10px 8px', display:'flex', flexDirection:'column', gap:2, overflow:'hidden' }}>
                    {navItems.map((entry) => {
                        if (isGroup(entry)) {
                            const open   = !!openGroups[entry.label];
                            const active = entry.children.some(c => location.pathname.startsWith(c.path));
                            return (
                                <div key={entry.label}>
                                    <button onClick={() => toggleGroup(entry.label)} style={{
                                        ...navItemStyle(active), width:'100%', border:'none',
                                        justifyContent:'flex-start',
                                    }}
                                        onMouseEnter={e => { if(!active) { e.currentTarget.style.background='hsl(222 35% 14%)'; e.currentTarget.style.color='hsl(215 20% 88%)'; }}}
                                        onMouseLeave={e => { if(!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='hsl(215 20% 65%)'; }}}
                                    >
                                        <entry.icon size={15} style={{ flexShrink:0, opacity: active ? 1 : 0.7 }} />
                                        <span style={{ flex:1 }}>{t(entry.label, language)}</span>
                                        {open ? <ChevronDown size={13} style={{ opacity:0.5 }} /> : <ChevronRight size={13} style={{ opacity:0.5 }} />}
                                    </button>
                                    {open && (
                                        <div style={{ marginTop:2, marginLeft:14, paddingLeft:10, borderLeft:'1px solid hsl(var(--sidebar-border))', display:'flex', flexDirection:'column', gap:1 }}>
                                            {entry.children.map(child => (
                                                <NavLink key={child.path} to={child.path} onClick={() => setSidebarOpen(false)}>
                                                    {({ isActive }) => (
                                                        <div style={{ ...navItemStyle(isActive), padding:'7px 10px', fontSize:13 }}
                                                            onMouseEnter={e => { if(!isActive) { e.currentTarget.style.background='hsl(222 35% 14%)'; e.currentTarget.style.color='hsl(215 20% 88%)'; }}}
                                                            onMouseLeave={e => { if(!isActive) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='hsl(215 20% 65%)'; }}}
                                                        >
                                                            <child.icon size={13} style={{ flexShrink:0, opacity: isActive ? 1 : 0.65 }} />
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
                                onClick={() => setSidebarOpen(false)}
                            >
                                {({ isActive }) => (
                                    <div style={navItemStyle(isActive)}
                                        onMouseEnter={e => { if(!isActive) { e.currentTarget.style.background='hsl(222 35% 14%)'; e.currentTarget.style.color='hsl(215 20% 88%)'; }}}
                                        onMouseLeave={e => { if(!isActive) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='hsl(215 20% 65%)'; }}}
                                    >
                                        <entry.icon size={15} style={{ flexShrink:0, opacity: isActive ? 1 : 0.7 }} />
                                        {t(entry.label, language)}
                                    </div>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* User footer */}
                <div style={{ padding:'10px 8px', borderTop:'1px solid hsl(var(--sidebar-border))' }}>
                    <div style={{
                        display:'flex', alignItems:'center', gap:10,
                        padding:'9px 12px', borderRadius:9, marginBottom:4,
                        background:'hsl(var(--sidebar-accent))',
                    }}>
                        <div style={{
                            width:30, height:30, borderRadius:8, flexShrink:0,
                            background:'hsl(160 84% 35% / 0.25)',
                            display:'flex', alignItems:'center', justifyContent:'center',
                        }}>
                            <span style={{ fontSize:12, fontWeight:700, color:'hsl(160 84% 55%)' }}>{initials}</span>
                        </div>
                        <div style={{ minWidth:0, flex:1 }}>
                            <p style={{ fontSize:12, fontWeight:600, color:'#fff', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                {user.firstName} {user.lastName}
                            </p>
                            <p style={{ fontSize:10, color:'hsl(215 20% 45%)', margin:0, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                                {user.role}
                            </p>
                        </div>
                    </div>
                    <button onClick={handleLogout} style={{
                        display:'flex', alignItems:'center', gap:8,
                        width:'100%', padding:'7px 12px', borderRadius:8,
                        background:'none', border:'none', cursor:'pointer',
                        fontSize:13, color:'hsl(215 20% 50%)', transition:'all 0.14s',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.color='#f87171'; e.currentTarget.style.background='hsl(0 72% 51% / 0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color='hsl(215 20% 50%)'; e.currentTarget.style.background='none'; }}
                    >
                        <LogOut size={13} /> {t('Chiqish', language)}
                    </button>
                </div>
            </aside>

            {/* ══ MAIN ════════════════════════════════════════════════ */}
            <main style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, height:'100vh', overflowY:'auto' }}>

                {/* Mobile topbar */}
                <div className="sticky top-0 z-30 lg:hidden flex items-center gap-3 px-4 py-3 shrink-0"
                    style={{ background:'hsl(var(--background))', borderBottom:'1px solid hsl(var(--border))' }}>
                    {!isRoot ? (
                        <button onClick={() => navigate(-1)} style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, fontWeight:500, color:'hsl(var(--foreground))', background:'none', border:'none', cursor:'pointer' }}>
                            <ArrowLeft size={15} /> Orqaga
                        </button>
                    ) : (
                        <button onClick={() => setSidebarOpen(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'hsl(var(--foreground))' }}>
                            <Menu size={18} />
                        </button>
                    )}
                    <span style={{ fontSize:14, fontWeight:700, color:'hsl(var(--foreground))' }}>Sohil Choyxonasi</span>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 sm:p-6 lg:p-7 page-enter">
                    {!isRoot && (
                        <button onClick={() => navigate(-1)} className="hidden lg:inline-flex"
                            style={{
                                alignItems:'center', gap:6, padding:'5px 12px', marginBottom:20,
                                border:'1px solid hsl(var(--border))', borderRadius:8,
                                background:'hsl(var(--card))', fontSize:12, fontWeight:500,
                                color:'hsl(var(--muted-foreground))', cursor:'pointer', transition:'all 0.14s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor='hsl(var(--accent))'; e.currentTarget.style.color='hsl(var(--accent))'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor='hsl(var(--border))'; e.currentTarget.style.color='hsl(var(--muted-foreground))'; }}
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
