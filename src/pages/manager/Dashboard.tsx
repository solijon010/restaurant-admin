import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSettings } from '@/contexts/SettingsContext';
import { useBranch } from '@/contexts/BranchContext';
import { t } from '@/lib/i18n';
import { formatPrice } from '@/lib/mock-data';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';
import api from '@/lib/api';
import {
    Loader2,
    Calendar, Users, Building2, ShoppingBag, Banknote, Home,
} from 'lucide-react';
// ─── Types ─────────────────────────────────────────────────────────────────────
interface RevenueDataPoint { date: string; revenue: number; expense: number; }
interface OrderProduct { price: string | number; }
interface OrderItem { count: string | number; product: OrderProduct; }
interface OrderRoom { name: string; }
interface DayOrder { orderItem: OrderItem[]; room: OrderRoom; status: string; }
type FilterType = 'today' | 'yesterday' | 'last7' | 'last30' | 'custom';

const RANGES: { label: string; filter: FilterType; active: string; inactive: string }[] = [
    { label: 'Bugun',  filter: 'today',     active: 'bg-emerald-500 text-white border-emerald-500', inactive: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
    { label: 'Kecha',  filter: 'yesterday', active: 'bg-blue-500 text-white border-blue-500',       inactive: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
    { label: '7 kun',  filter: 'last7',     active: 'bg-violet-500 text-white border-violet-500',   inactive: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100' },
    { label: '30 kun', filter: 'last30',    active: 'bg-orange-500 text-white border-orange-500',   inactive: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' },
    { label: 'Boshqa', filter: 'custom',    active: 'bg-slate-700 text-white border-slate-700',     inactive: 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100' },
];

function todayStr() { return new Date().toISOString().slice(0, 10); }

function toArray<T>(raw: unknown): T[] {
    if (Array.isArray(raw)) return raw as T[];
    if (raw && typeof raw === 'object') {
        const obj = raw as Record<string, unknown>;
        for (const key of ['data', 'items', 'result', 'results', 'content'])
            if (Array.isArray(obj[key])) return obj[key] as T[];
    }
    return [];
}

interface TooltipEntry { dataKey: string; name: string; value: number; fill: string; }
const BarTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3 text-sm min-w-[160px]">
            <p className="font-semibold mb-2 text-foreground">{label}</p>
            {payload.map((p) => (
                <div key={p.dataKey} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: p.fill }} />
                        <span className="text-muted-foreground">{p.name}</span>
                    </div>
                    <span className="font-medium">{formatPrice(p.value)}</span>
                </div>
            ))}
        </div>
    );
};

// ─── Component ─────────────────────────────────────────────────────────────────
export default function ManagerDashboard() {
    const { language } = useSettings();
    const { selectedBranchId } = useBranch();

    const [activeFilter, setActiveFilter] = useState<FilterType>('last30');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [appliedFrom, setAppliedFrom] = useState('');
    const [appliedTo, setAppliedTo] = useState('');
    const [dayDate, setDayDate] = useState(todayStr);

    // ── Status
    const { data: status, isLoading: statusLoading } = useQuery({
        queryKey: ['dashboard-status'],
        queryFn: async () => (await dashboardService.getStatus()).data,
    });

    // ── Revenue chart
    const isCustomReady = activeFilter === 'custom' && !!appliedFrom && !!appliedTo;
    const { data: revenueData = [], isLoading: revenueLoading } = useQuery<RevenueDataPoint[]>({
        queryKey: ['dashboard-revenue', activeFilter, appliedFrom, appliedTo],
        queryFn: () => {
            const params = new URLSearchParams({ filter: activeFilter });
            if (activeFilter === 'custom') { params.set('from', appliedFrom); params.set('to', appliedTo); }
            return api.get<RevenueDataPoint[]>(`/dashboard/revenue?${params.toString()}`).then(r => r.data);
        },
        enabled: activeFilter !== 'custom' || isCustomReady,
        staleTime: 2 * 60 * 1000,
    });

    // ── Kunlik xona/stol savdosi
    const { data: dayOrdersRaw, isLoading: dayLoading } = useQuery({
        queryKey: ['day-orders', selectedBranchId, dayDate],
        queryFn: async () => {
            const res = await api.get(`/order/branch/${selectedBranchId}`, {
                params: { date: dayDate, limit: 1000 },
            });
            return res.data;
        },
        enabled: !!selectedBranchId,
        staleTime: 60 * 1000,
    });

    const dayOrders = toArray<DayOrder>(dayOrdersRaw);

    // Xona bo'yicha guruhla
    const roomStats = (() => {
        const map = new Map<string, { orders: number; sum: number; completed: number }>();
        dayOrders.forEach(o => {
            const name = o.room?.name || '—';
            const sum = o.orderItem.reduce((s, i) => s + Number(i.product?.price ?? 0) * Number(i.count ?? 0), 0);
            const prev = map.get(name) ?? { orders: 0, sum: 0, completed: 0 };
            map.set(name, {
                orders: prev.orders + 1,
                sum: prev.sum + sum,
                completed: prev.completed + (o.status === 'SUCCESS' ? 1 : 0),
            });
        });
        return Array.from(map.entries())
            .map(([name, d]) => ({ name, ...d }))
            .sort((a, b) => b.sum - a.sum);
    })();

    const dayTotal = roomStats.reduce((s, r) => s + r.sum, 0);
    const dayOrders2 = roomStats.reduce((s, r) => s + r.orders, 0);

    // ── Derived
    const totalRevenue = revenueData.reduce((s, d) => s + d.revenue, 0);

    return (
        <div className="space-y-5">

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                    <Banknote className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-foreground">{t('Bosh sahifa', language)}</h2>
                    <p className="text-sm text-muted-foreground">Savdo tahlili va kunlik statistika</p>
                </div>
            </div>

            {/* ── Stats Cards ─────────────────────────────────────────────────── */}
            {statusLoading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        { label: t('Jami xodimlar', language), value: status?.totalUsers ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-500', border: 'border-blue-100', light: 'bg-blue-50' },
                        { label: t('Filiallar', language), value: status?.totalBranches ?? 0, icon: Building2, color: 'text-violet-600', bg: 'bg-violet-500', border: 'border-violet-100', light: 'bg-violet-50' },
                        { label: t('Menejerlar', language), value: status?.totalManagers ?? 0, icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-500', border: 'border-emerald-100', light: 'bg-emerald-50' },
                        { label: t("O'rtacha kunlik daromad", language), value: formatPrice(status?.averageDailyRevenue ?? 0), icon: Banknote, color: 'text-amber-600', bg: 'bg-amber-500', border: 'border-amber-100', light: 'bg-amber-50' },
                    ].map((s, i) => (
                        <Card key={i} className={`p-4 shadow-sm border ${s.border} rounded-2xl overflow-hidden relative`}>
                            <div className={`absolute top-0 left-0 right-0 h-1 ${s.bg} opacity-60`} />
                            <div className={`w-10 h-10 rounded-xl ${s.light} flex items-center justify-center mb-3`}>
                                <s.icon className={`h-5 w-5 ${s.color}`} />
                            </div>
                            <p className="text-2xl font-bold text-foreground leading-none">{s.value}</p>
                            <p className="text-xs text-muted-foreground mt-1.5 truncate">{s.label}</p>
                        </Card>
                    ))}
                </div>
            )}

            {/* ── Kunlik savdo — xona bo'yicha ────────────────────────────────── */}
            <Card className="shadow-sm border border-border/60 rounded-2xl overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border/60 bg-muted/20">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
                            <Home className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground">Kunlik savdo — xona bo'yicha</p>
                            {!dayLoading && dayOrders2 > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    <span className="text-blue-600 font-medium">{dayOrders2} ta buyurtma</span>
                                    {' · '}
                                    <span className="text-emerald-600 font-medium">{formatPrice(dayTotal)}</span>
                                </p>
                            )}
                        </div>
                    </div>
                    <Input type="date" value={dayDate} onChange={e => setDayDate(e.target.value)}
                        className="w-40 h-8 text-sm bg-background border-border/60 focus-visible:ring-1 rounded-xl" />
                </div>

                {dayLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : roomStats.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                        <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center">
                            <Home className="h-6 w-6 opacity-30" />
                        </div>
                        <p className="text-sm">Bu kunda buyurtma yo'q</p>
                    </div>
                ) : (
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {roomStats.map((r, i) => (
                            <div key={r.name} className="flex items-center gap-3 p-3.5 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold
                                    ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate">{r.name}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{r.orders} buyurtma · <span className="text-emerald-600">{r.completed} yakunlangan</span></p>
                                </div>
                                <p className="text-sm font-bold text-foreground shrink-0">{formatPrice(r.sum)}</p>
                            </div>
                        ))}
                    </div>
                )}

                {roomStats.length > 1 && !dayLoading && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-border/60 bg-gradient-to-r from-muted/40 to-muted/20">
                        <span className="text-sm font-semibold text-foreground">Jami</span>
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-muted-foreground">{dayOrders2} ta buyurtma</span>
                            <span className="text-sm font-bold text-emerald-600">{formatPrice(dayTotal)}</span>
                        </div>
                    </div>
                )}
            </Card>

            {/* ── Revenue Chart ─────────────────────────────────────────────────── */}
            <Card className="shadow-sm border border-border/60 rounded-2xl overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-border/60 bg-muted/20">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center">
                            <Banknote className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground">{t("Moliyaviy ko'rsatkichlar", language)}</p>
                            <p className="text-xs text-muted-foreground">
                                Daromad: <span className="font-semibold text-emerald-600">{formatPrice(totalRevenue)}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 items-start sm:items-end">
                        <div className="flex gap-1.5 flex-wrap">
                            {RANGES.map(r => (
                                <button key={r.filter}
                                    className={`flex items-center gap-1 text-xs h-7 px-3 rounded-xl border font-medium transition-all ${activeFilter === r.filter ? r.active : r.inactive}`}
                                    onClick={() => setActiveFilter(r.filter)}>
                                    {r.filter === 'custom' && <Calendar className="h-3 w-3" />}
                                    {t(r.label, language)}
                                </button>
                            ))}
                        </div>
                        {activeFilter === 'custom' && (
                            <div className="flex items-center gap-2">
                                <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="h-7 text-xs w-[120px] bg-muted/40 border-0" />
                                <span className="text-xs text-muted-foreground">—</span>
                                <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="h-7 text-xs w-[120px] bg-muted/40 border-0" />
                                <Button size="sm" className="h-7 text-xs px-3 rounded-xl" disabled={!fromDate || !toDate}
                                    onClick={() => { setAppliedFrom(fromDate); setAppliedTo(toDate); }}>
                                    Qo'llash
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 sm:p-5">
                    {revenueLoading ? (
                        <div className="flex items-center justify-center h-[240px]">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : activeFilter === 'custom' && !isCustomReady ? (
                        <div className="flex flex-col items-center justify-center h-[240px] gap-3 text-muted-foreground">
                            <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center">
                                <Calendar className="h-6 w-6 opacity-30" />
                            </div>
                            <p className="text-sm">Sana oralig'ini tanlang va "Qo'llash" ni bosing</p>
                        </div>
                    ) : revenueData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[240px] gap-3 text-muted-foreground">
                            <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center">
                                <Banknote className="h-6 w-6 opacity-30" />
                            </div>
                            <p className="text-sm">Tanlangan davr uchun ma'lumot topilmadi</p>
                        </div>
                    ) : (
                        <div className="h-[240px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueData} barGap={2} barCategoryGap="20%">
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,12%,91%)" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(222,10%,50%)' }} tickLine={false} axisLine={false}
                                        interval={Math.max(0, Math.floor(revenueData.length / 8))} />
                                    <YAxis tick={{ fontSize: 11, fill: 'hsl(222,10%,50%)' }} tickLine={false} axisLine={false}
                                        tickFormatter={v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : String(v)} />
                                    <Tooltip formatter={(v: number) => formatPrice(v)} contentStyle={{ background: '#fff', border: '1px solid hsl(222,12%,90%)', borderRadius: '10px', fontSize: '12px' }} />
                                    <Bar dataKey="revenue" fill="hsl(32,95%,52%)" name={t('Daromad', language)} radius={[5, 5, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </Card>

        </div>
    );
}
