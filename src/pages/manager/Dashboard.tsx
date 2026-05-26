import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useSettings } from '@/contexts/SettingsContext';
import { useBranch } from '@/contexts/BranchContext';
import { t } from '@/lib/i18n';
import { formatPrice } from '@/lib/mock-data';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';
import api from '@/lib/api';
import {
    Loader2, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
    Calendar, Users, Building2, ShoppingBag, Banknote, Home,
} from 'lucide-react';
import { InsufficientDataOverlay } from '@/components/InsufficientDataOverlay';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface AnalyticsOverall {
    totalIncome: number; totalExpense: number; profit: number;
    incomePercent: number; expensePercent: number;
}
interface AnalyticsBranch {
    branchId: string; branchName: string;
    income: number; expense: number; profit: number; growth: string;
}
interface AnalyticsResponse { overall: AnalyticsOverall; branches: AnalyticsBranch[]; }
interface RevenueDataPoint { date: string; revenue: number; expense: number; }
interface OrderProduct { price: string | number; }
interface OrderItem { count: string | number; product: OrderProduct; }
interface OrderRoom { name: string; }
interface DayOrder { orderItem: OrderItem[]; room: OrderRoom; status: string; }
type FilterType = 'today' | 'yesterday' | 'last7' | 'last30' | 'custom';

const RANGES: { label: string; filter: FilterType }[] = [
    { label: 'Bugun', filter: 'today' },
    { label: 'Kecha', filter: 'yesterday' },
    { label: '7 kun', filter: 'last7' },
    { label: '30 kun', filter: 'last30' },
    { label: 'Boshqa', filter: 'custom' },
];

const PIE_COLORS = ['#22c55e', '#ef4444'];

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

const BarTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3 text-sm min-w-[160px]">
            <p className="font-semibold mb-2 text-foreground">{label}</p>
            {payload.map((p: any) => (
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

    // ── Cost analytics
    const { data: analytics, isLoading: analyticsLoading } = useQuery({
        queryKey: ['cost-analytics'],
        queryFn: () => api.get<AnalyticsResponse>('/cost/main/analytics').then(r => r.data),
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
    const totalExpense = revenueData.reduce((s, d) => s + d.expense, 0);
    const totalProfit = totalRevenue - totalExpense;
    const overall = analytics?.overall;
    const branches = analytics?.branches ?? [];
    const isProfit = (overall?.profit ?? 0) >= 0;
    const hasNoData = !statusLoading && !revenueLoading && !analyticsLoading
        && (!status || status.totalUsers === 0) && revenueData.length === 0 && !overall;

    const pieData = overall
        ? [{ name: 'Daromad', value: overall.totalIncome }, { name: 'Xarajat', value: overall.totalExpense }]
        : [];
    const branchChartData = branches.map(b => ({ name: b.branchName, Daromad: b.income, Xarajat: b.expense }));

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">{t('Bosh sahifa', language)}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Savdo tahlili va kunlik statistika</p>
            </div>

            {hasNoData && (
                <InsufficientDataOverlay
                    title="Ma'lumot kam"
                    description="Filiallar, xodimlar va buyurtmalar qo'shilgandan so'ng bu yerda grafiklar paydo bo'ladi."
                />
            )}

            {/* ── Stats Cards ──────────────────────────────────────────────── */}
            {statusLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        { label: t('Jami xodimlar', language), value: status?.totalUsers ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: t('Filiallar', language), value: status?.totalBranches ?? 0, icon: Building2, color: 'text-violet-600', bg: 'bg-violet-50' },
                        { label: t('Menejerlar', language), value: status?.totalManagers ?? 0, icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: t("O'rtacha kunlik daromad", language), value: formatPrice(status?.averageDailyRevenue ?? 0), icon: Banknote, color: 'text-amber-600', bg: 'bg-amber-50' },
                    ].map((s, i) => (
                        <Card key={i} className="p-4 flex items-center gap-3 shadow-none border border-border/60">
                            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                                <s.icon className={`h-5 w-5 ${s.color}`} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground truncate">{s.label}</p>
                                <p className="text-xl font-bold text-foreground leading-tight">{s.value}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* ── Kunlik savdo — xona bo'yicha ────────────────────────────── */}
            <Card className="shadow-none border border-border/60">
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border/60">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                            <Home className="h-3.5 w-3.5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground">Kunlik savdo — xona bo'yicha</p>
                            {!dayLoading && dayOrders2 > 0 && (
                                <p className="text-xs text-muted-foreground">{dayOrders2} ta buyurtma · {formatPrice(dayTotal)}</p>
                            )}
                        </div>
                    </div>
                    <Input type="date" value={dayDate}
                        onChange={e => setDayDate(e.target.value)}
                        className="w-40 h-8 text-sm bg-muted/40 border-0 focus-visible:ring-1" />
                </div>

                {dayLoading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : roomStats.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                        <Home className="h-8 w-8 opacity-20" />
                        <p className="text-sm">Bu kunda buyurtma yo'q</p>
                    </div>
                ) : (
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {roomStats.map((r, i) => (
                            <div key={r.name} className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 text-xs font-bold text-indigo-700">
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate">{r.name}</p>
                                    <p className="text-xs text-muted-foreground">{r.orders} ta buyurtma · {r.completed} yakunlangan</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-bold text-foreground">{formatPrice(r.sum)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Umumiy jami */}
                {roomStats.length > 1 && !dayLoading && (
                    <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/60 bg-muted/30">
                        <span className="text-sm font-medium text-muted-foreground">Jami</span>
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-muted-foreground">{dayOrders2} ta buyurtma</span>
                            <span className="text-sm font-bold text-foreground">{formatPrice(dayTotal)}</span>
                        </div>
                    </div>
                )}
            </Card>

            {/* ── Revenue Chart ────────────────────────────────────────────── */}
            <Card className="p-4 sm:p-5 shadow-none border border-border/60">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">{t("Moliyaviy ko'rsatkichlar", language)}</h3>
                        <div className="flex flex-wrap gap-3 mt-1.5">
                            <span className="text-xs text-muted-foreground">
                                Daromad: <span className="font-semibold text-green-600">{formatPrice(totalRevenue)}</span>
                            </span>
                            <span className="text-xs text-muted-foreground">
                                Xarajat: <span className="font-semibold text-red-500">{formatPrice(totalExpense)}</span>
                            </span>
                            <span className="text-xs text-muted-foreground">
                                Foyda: <span className={`font-semibold ${totalProfit >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>{formatPrice(totalProfit)}</span>
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                        <div className="flex gap-1 flex-wrap justify-end">
                            {RANGES.map(r => (
                                <Button key={r.filter}
                                    variant={activeFilter === r.filter ? 'default' : 'ghost'}
                                    size="sm" className="text-xs h-7 px-2.5"
                                    onClick={() => setActiveFilter(r.filter)}>
                                    {r.filter === 'custom' && <Calendar className="h-3 w-3 mr-1" />}
                                    {t(r.label, language)}
                                </Button>
                            ))}
                        </div>
                        {activeFilter === 'custom' && (
                            <div className="flex items-center gap-2">
                                <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="h-7 text-xs w-[120px] bg-muted/40 border-0" />
                                <span className="text-xs text-muted-foreground">—</span>
                                <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="h-7 text-xs w-[120px] bg-muted/40 border-0" />
                                <Button size="sm" className="h-7 text-xs px-3" disabled={!fromDate || !toDate}
                                    onClick={() => { setAppliedFrom(fromDate); setAppliedTo(toDate); }}>
                                    Qo'llash
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {revenueLoading ? (
                    <div className="flex items-center justify-center h-[240px]"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : activeFilter === 'custom' && !isCustomReady ? (
                    <div className="flex flex-col items-center justify-center h-[240px] gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-7 w-7 opacity-20" />
                        <p>Sana oralig'ini tanlang va "Qo'llash" ni bosing</p>
                    </div>
                ) : revenueData.length === 0 ? (
                    <div className="h-[240px]">
                        <InsufficientDataOverlay compact title="Ma'lumot yo'q" description="Tanlangan davr uchun ma'lumot topilmadi" />
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
                                <Tooltip formatter={(v: number) => formatPrice(v)} contentStyle={{ background: 'hsl(0,0%,100%)', border: '1px solid hsl(222,12%,90%)', borderRadius: '8px', fontSize: '12px' }} />
                                <Legend formatter={(v: string) => <span style={{ color: 'hsl(222,25%,12%)', fontSize: '12px' }}>{v}</span>} />
                                <Bar dataKey="revenue" fill="hsl(32,95%,52%)" name={t('Daromad', language)} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expense" fill="hsl(222,30%,16%)" name={t('Xarajat', language)} radius={[4, 4, 0, 0]} opacity={0.7} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </Card>

            {/* ── Cost Analytics ───────────────────────────────────────────── */}
            {analyticsLoading ? (
                <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : overall && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                            { label: 'Jami daromad', value: formatPrice(overall.totalIncome), sub: `${overall.incomePercent.toFixed(1)}% ulushi`, color: 'text-green-600', bg: 'bg-green-50', icon: ArrowUpRight, iconColor: 'text-green-600', bar: 'bg-green-500', pct: overall.incomePercent },
                            { label: 'Jami xarajat', value: formatPrice(overall.totalExpense), sub: `${overall.expensePercent.toFixed(1)}% ulushi`, color: 'text-red-600', bg: 'bg-red-50', icon: ArrowDownRight, iconColor: 'text-red-600', bar: 'bg-red-500', pct: overall.expensePercent },
                            { label: 'Sof foyda', value: formatPrice(overall.profit), sub: isProfit ? 'Foydada' : 'Zararda', color: isProfit ? 'text-blue-600' : 'text-orange-600', bg: isProfit ? 'bg-blue-50' : 'bg-orange-50', icon: isProfit ? TrendingUp : TrendingDown, iconColor: isProfit ? 'text-blue-600' : 'text-orange-600', bar: isProfit ? 'bg-blue-500' : 'bg-orange-500', pct: 100 },
                        ].map((s, i) => (
                            <Card key={i} className="p-4 shadow-none border border-border/60">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
                                    </div>
                                    <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                                        <s.icon className={`h-4 w-4 ${s.iconColor}`} />
                                    </div>
                                </div>
                                <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div className={`h-full ${s.bar} rounded-full transition-all`} style={{ width: `${Math.min(100, s.pct)}%` }} />
                                </div>
                            </Card>
                        ))}
                    </div>

                    <Card className="p-4 shadow-none border border-border/60">
                            <h3 className="text-sm font-semibold text-foreground mb-4">Daromad vs Xarajat</h3>
                            <div className="h-[180px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={3} dataKey="value">
                                            {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                                        </Pie>
                                        <Tooltip formatter={(v: number) => formatPrice(v)} contentStyle={{ background: 'hsl(0,0%,100%)', border: '1px solid hsl(222,12%,90%)', borderRadius: '8px', fontSize: '12px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex items-center justify-center gap-4 mt-1 text-xs">
                                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-green-500" /><span className="text-muted-foreground">Daromad</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-red-500" /><span className="text-muted-foreground">Xarajat</span></div>
                            </div>
                        </Card>
                </>
            )}
        </div>
    );
}
