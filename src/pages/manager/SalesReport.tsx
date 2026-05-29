import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useBranch } from '@/contexts/BranchContext';
import { useSettings } from '@/contexts/SettingsContext';
import { t } from '@/lib/i18n';
import { formatPrice } from '@/lib/mock-data';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer,
} from 'recharts';
import {
    Loader2, TrendingUp, ShoppingCart, Banknote,
    Home, Calendar, ArrowUpRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type FilterType = 'today' | 'yesterday' | 'last7' | 'last30' | 'custom';
interface RevenuePoint { date: string; revenue: number; expense: number; }
interface OrderItem { count: string | number; product: { price: string | number }; }
interface DayOrder { orderItem: OrderItem[]; room: { name: string }; status: string; }

const FILTERS: { label: string; filter: FilterType; active: string; inactive: string }[] = [
    { label: 'Bugun',    filter: 'today',     active: 'bg-emerald-500 text-white border-emerald-500', inactive: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
    { label: 'Kecha',    filter: 'yesterday', active: 'bg-emerald-500 text-white border-blue-500',       inactive: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
    { label: '7 kun',    filter: 'last7',     active: 'bg-emerald-500 text-white border-violet-500',   inactive: 'bg-emerald-50 text-violet-700 border-violet-200 hover:bg-violet-100' },
    { label: '30 kun',   filter: 'last30',    active: 'bg-orange-500 text-white border-orange-500',   inactive: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' },
    { label: 'Boshqa',   filter: 'custom',    active: 'bg-slate-700 text-white border-slate-700',     inactive: 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100' },
];

function todayStr() { return new Date().toISOString().slice(0, 10); }
function yesterdayStr() {
    const d = new Date(); d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
}

function toArray<T>(raw: unknown): T[] {
    if (Array.isArray(raw)) return raw as T[];
    if (raw && typeof raw === 'object') {
        const obj = raw as Record<string, unknown>;
        for (const key of ['data', 'items', 'result', 'results', 'content'])
            if (Array.isArray(obj[key])) return obj[key] as T[];
    }
    return [];
}

export default function SalesReport() {
    const { selectedBranchId } = useBranch();
    const { language } = useSettings();
    const [activeFilter, setActiveFilter] = useState<FilterType>('today');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [appliedFrom, setAppliedFrom] = useState('');
    const [appliedTo, setAppliedTo] = useState('');

    const isSingleDay = activeFilter === 'today' || activeFilter === 'yesterday'
        || (activeFilter === 'custom' && appliedFrom === appliedTo && !!appliedFrom);

    const singleDate = activeFilter === 'today' ? todayStr()
        : activeFilter === 'yesterday' ? yesterdayStr()
        : appliedFrom;

    // ── Revenue chart
    const isCustomReady = activeFilter === 'custom' && !!appliedFrom && !!appliedTo;
    const { data: revenueData = [], isLoading: revenueLoading } = useQuery<RevenuePoint[]>({
        queryKey: ['sales-revenue', activeFilter, appliedFrom, appliedTo],
        queryFn: () => {
            const params = new URLSearchParams({ filter: activeFilter });
            if (activeFilter === 'custom') { params.set('from', appliedFrom); params.set('to', appliedTo); }
            return api.get<RevenuePoint[]>(`/dashboard/revenue?${params.toString()}`).then(r => r.data);
        },
        enabled: activeFilter !== 'custom' || isCustomReady,
        staleTime: 2 * 60 * 1000,
    });

    // ── Single day room breakdown
    const { data: dayOrdersRaw, isLoading: dayLoading } = useQuery({
        queryKey: ['sales-day-orders', selectedBranchId, singleDate],
        queryFn: () =>
            api.get(`/order/branch/${selectedBranchId}`, { params: { limit: 1000 } }).then(r => r.data),
        enabled: !!selectedBranchId && isSingleDay && !!singleDate,
        staleTime: 60 * 1000,
    });
    const dayOrders = toArray<DayOrder>(dayOrdersRaw).filter(o => (o.createdAt ?? '').slice(0, 10) === singleDate);

    // Room stats
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

    // Summary
    const totalRevenue = revenueData.reduce((s, d) => s + d.revenue, 0);
    const totalOrders = isSingleDay ? dayOrders.length : revenueData.length;
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const dayTotal = roomStats.reduce((s, r) => s + r.sum, 0);
    const dayOrderCount = roomStats.reduce((s, r) => s + r.orders, 0);

    const isLoading = revenueLoading || (isSingleDay && dayLoading);

    return (
        <div className="space-y-6">
            {/* ── Header ─────────────────────────────────────────── */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-foreground">{t('Savdo tahlili', language)}</h2>
                    <p className="text-sm text-muted-foreground">Kunlik va davriy savdo hisoboti</p>
                </div>
            </div>

            {/* ── Filter bar ─────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-2">
                {FILTERS.map(f => (
                    <button
                        key={f.filter}
                        onClick={() => setActiveFilter(f.filter)}
                        className={`flex items-center gap-1.5 text-sm h-8 px-4 rounded-xl border font-medium transition-all ${activeFilter === f.filter ? f.active : f.inactive}`}
                    >
                        {f.filter === 'custom' && <Calendar className="h-3.5 w-3.5" />}
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Custom date range */}
            {activeFilter === 'custom' && (
                <div className="flex items-center gap-3 flex-wrap">
                    <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                        className="h-9 text-sm w-40 bg-muted/40 border-0 focus-visible:ring-1" />
                    <span className="text-sm text-muted-foreground">—</span>
                    <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                        className="h-9 text-sm w-40 bg-muted/40 border-0 focus-visible:ring-1" />
                    <button
                        disabled={!fromDate || !toDate}
                        onClick={() => { setAppliedFrom(fromDate); setAppliedTo(toDate); }}
                        className="h-9 px-4 rounded-xl bg-slate-700 text-white text-sm font-medium disabled:opacity-40 hover:bg-slate-800 transition-colors"
                    >
                        Ko'rsatish
                    </button>
                </div>
            )}

            {/* ── Summary cards ──────────────────────────────────── */}
            {!isLoading && (activeFilter !== 'custom' || isCustomReady) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                        { label: 'Jami daromad', value: formatPrice(isSingleDay ? dayTotal : totalRevenue), icon: Banknote, bg: 'bg-emerald-50', iconColor: 'text-emerald-600', valueColor: 'text-emerald-600' },
                        { label: 'Buyurtmalar', value: isSingleDay ? `${dayOrderCount} ta` : `${revenueData.length} kun`, icon: ShoppingCart, bg: 'bg-emerald-50', iconColor: 'text-emerald-600', valueColor: 'text-emerald-600' },
                        { label: "O'rtacha buyurtma", value: formatPrice(isSingleDay && dayOrderCount > 0 ? dayTotal / dayOrderCount : avgOrder), icon: ArrowUpRight, bg: 'bg-emerald-50', iconColor: 'text-emerald-600', valueColor: 'text-emerald-600' },
                    ].map((s, i) => (
                        <Card key={i} className="p-4 shadow-sm border border-border/60 rounded-2xl flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                                <s.icon className={`h-5 w-5 ${s.iconColor}`} />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">{s.label}</p>
                                <p className={`text-xl font-bold ${s.valueColor}`}>{s.value}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* ── Revenue chart ──────────────────────────────────── */}
            {!isSingleDay && (
                <Card className="p-4 sm:p-5 shadow-sm border border-border/60 rounded-2xl">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Daromad grafigi</h3>
                    {revenueLoading ? (
                        <div className="flex items-center justify-center h-[220px]">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : activeFilter === 'custom' && !isCustomReady ? (
                        <div className="flex flex-col items-center justify-center h-[220px] gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-7 w-7 opacity-20" />
                            <p>Sana oralig'ini tanlang va "Ko'rsatish" ni bosing</p>
                        </div>
                    ) : revenueData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[220px] gap-2 text-sm text-muted-foreground">
                            <TrendingUp className="h-7 w-7 opacity-20" />
                            <p>Ma'lumot topilmadi</p>
                        </div>
                    ) : (
                        <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueData} barGap={2} barCategoryGap="25%">
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,12%,91%)" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(222,10%,50%)' }} tickLine={false} axisLine={false}
                                        interval={Math.max(0, Math.floor(revenueData.length / 8))} />
                                    <YAxis tick={{ fontSize: 11, fill: 'hsl(222,10%,50%)' }} tickLine={false} axisLine={false}
                                        tickFormatter={v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : String(v)} />
                                    <Tooltip formatter={(v: number) => formatPrice(v)}
                                        contentStyle={{ background: '#fff', border: '1px solid hsl(222,12%,90%)', borderRadius: '10px', fontSize: '12px' }} />
                                    <Bar dataKey="revenue" fill="hsl(32,95%,52%)" name="Daromad" radius={[5, 5, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Card>
            )}

            {/* ── Single day room breakdown ──────────────────────── */}
            {isSingleDay && (
                <Card className="shadow-sm border border-border/60 rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <Home className="h-3.5 w-3.5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground">Xonalar bo'yicha savdo</p>
                            {!dayLoading && dayOrderCount > 0 && (
                                <p className="text-xs text-muted-foreground">{dayOrderCount} ta buyurtma · {formatPrice(dayTotal)}</p>
                            )}
                        </div>
                        <div className="ml-auto">
                            <Badge variant="outline" className="text-xs">{singleDate}</Badge>
                        </div>
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
                        <>
                            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {roomStats.map((r, i) => (
                                    <div key={r.name} className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold
                                            ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-foreground truncate">{r.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs text-muted-foreground">{r.orders} ta buyurtma</span>
                                                <span className="text-xs text-emerald-600 font-medium">{r.completed} yakunlangan</span>
                                            </div>
                                        </div>
                                        <p className="text-sm font-bold text-foreground shrink-0">{formatPrice(r.sum)}</p>
                                    </div>
                                ))}
                            </div>
                            {roomStats.length > 1 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-border/60 bg-muted/30">
                                    <span className="text-sm font-medium text-muted-foreground">Jami</span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs text-muted-foreground">{dayOrderCount} ta buyurtma</span>
                                        <span className="text-sm font-bold text-foreground">{formatPrice(dayTotal)}</span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </Card>
            )}
        </div>
    );
}
