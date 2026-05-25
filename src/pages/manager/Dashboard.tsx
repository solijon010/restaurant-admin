import { useState } from 'react';
import { StatsCard } from '@/components/StatsCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useSettings } from '@/contexts/SettingsContext';
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
    Loader2, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Calendar,
} from 'lucide-react';
import { InsufficientDataOverlay } from '@/components/InsufficientDataOverlay';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface AnalyticsOverall {
    totalIncome: number;
    totalExpense: number;
    profit: number;
    incomePercent: number;
    expensePercent: number;
}
interface AnalyticsBranch {
    branchId: string;
    branchName: string;
    income: number;
    expense: number;
    profit: number;
    growth: string;
}
interface AnalyticsResponse {
    overall: AnalyticsOverall;
    branches: AnalyticsBranch[];
}
interface RevenueDataPoint {
    date: string;
    revenue: number;
    expense: number;
}
type FilterType = 'today' | 'yesterday' | 'last7' | 'last30' | 'custom';

// ─── Constants ─────────────────────────────────────────────────────────────────
const RANGES: { label: string; filter: FilterType }[] = [
    { label: 'Bugun', filter: 'today' },
    { label: 'Kecha', filter: 'yesterday' },
    { label: '7 kun', filter: 'last7' },
    { label: '30 kun', filter: 'last30' },
    { label: 'Boshqa', filter: 'custom' },
];

const PIE_COLORS = ['#22c55e', '#ef4444'];

// ─── Custom Tooltip ─────────────────────────────────────────────────────────
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
                    <span className="font-medium text-foreground">{formatPrice(p.value)}</span>
                </div>
            ))}
        </div>
    );
};

// ─── Component ─────────────────────────────────────────────────────────────────
export default function ManagerDashboard() {
    const { language } = useSettings();

    const [activeFilter, setActiveFilter] = useState<FilterType>('last30');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    // Faqat "Qo'llash" bosilganda ishga tushadi
    const [appliedFrom, setAppliedFrom] = useState('');
    const [appliedTo, setAppliedTo] = useState('');

    // ── Status query
    const { data: status, isLoading: statusLoading } = useQuery({
        queryKey: ['dashboard-status'],
        queryFn: async () => {
            const res = await dashboardService.getStatus();
            return res.data;
        },
    });

    // ── Revenue chart query
    const isCustomReady = activeFilter === 'custom' && !!appliedFrom && !!appliedTo;

    const { data: revenueData = [], isLoading: revenueLoading } = useQuery<RevenueDataPoint[]>({
        queryKey: ['dashboard-revenue', activeFilter, appliedFrom, appliedTo],
        queryFn: () => {
            const params = new URLSearchParams({ filter: activeFilter });
            if (activeFilter === 'custom') {
                params.set('from', appliedFrom);
                params.set('to', appliedTo);
            }
            return api
                .get<RevenueDataPoint[]>(`/dashboard/revenue?${params.toString()}`)
                .then((r) => r.data);
        },
        enabled: activeFilter !== 'custom' || isCustomReady,
        staleTime: 2 * 60 * 1000,
    });

    // ── Cost analytics query
    const { data: analytics, isLoading: analyticsLoading } = useQuery({
        queryKey: ['cost-analytics'],
        queryFn: () => api.get<AnalyticsResponse>('/cost/main/analytics').then((r) => r.data),
        staleTime: 2 * 60 * 1000,
    });

    // ── Revenue derived totals
    const totalRevenue = revenueData.reduce((s, d) => s + d.revenue, 0);
    const totalExpense = revenueData.reduce((s, d) => s + d.expense, 0);
    const totalProfit = totalRevenue - totalExpense;

    // ── Analytics derived
    const overall = analytics?.overall;
    const branches = analytics?.branches ?? [];
    const isProfit = (overall?.profit ?? 0) >= 0;

    // ── Check if data is insufficient
    const hasNoStatus = !statusLoading && (!status || (status.totalUsers === 0 && status.totalBranches === 0));
    const hasNoRevenue = !revenueLoading && revenueData.length === 0 && activeFilter !== 'custom';
    const hasNoAnalytics = !analyticsLoading && !overall;
    const isDataInsufficient = hasNoStatus && hasNoRevenue && hasNoAnalytics;

    const branchChartData = branches.map((b) => ({
        name: b.branchName,
        Daromad: b.income,
        Xarajat: b.expense,
        Foyda: b.profit,
    }));

    const pieData = overall
        ? [
            { name: 'Daromad', value: overall.totalIncome },
            { name: 'Xarajat', value: overall.totalExpense },
        ]
        : [];

    const handleApplyCustom = () => {
        if (fromDate && toDate) {
            setAppliedFrom(fromDate);
            setAppliedTo(toDate);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">{t('Bosh sahifa', language)}</h2>

            {/* ── Insufficient data overlay ─────────────────────────────── */}
            {isDataInsufficient && (
                <InsufficientDataOverlay
                    title="Ma'lumot kam"
                    description="Hozircha statistikani ko'rsatish uchun yetarli ma'lumot to'planmagan. Filiallar, xodimlar va buyurtmalar qo'shilgandan so'ng bu yerda grafiklar paydo bo'ladi."
                />
            )}

            {/* ── Stats Cards ────────────────────────────────────────────────── */}
            {statusLoading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <StatsCard title={t('Jami xodimlar', language)} value={status?.totalUsers ?? 0} />
                    <StatsCard title={t('Filiallar', language)} value={status?.totalBranches ?? 0} />
                    <StatsCard title={t('Menejerlar', language)} value={status?.totalManagers ?? 0} />
                    <StatsCard
                        title={t("O'rtacha kunlik daromad", language)}
                        value={formatPrice(status?.averageDailyRevenue ?? 0)}
                    />
                </div>
            )}

            {/* ── Revenue Chart ───────────────────────────────────────────────── */}
            <Card className="p-4 sm:p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
                    <div>
                        <h3 className="text-base sm:text-lg font-semibold text-foreground">
                            {t("Moliyaviy ko'rsatkichlar", language)}
                        </h3>
                        <div className="flex flex-wrap gap-3 sm:gap-4 mt-1">
                            <span className="text-xs sm:text-sm text-muted-foreground">
                                {t('Daromad', language)}:{' '}
                                <span className="font-medium text-green-600">{formatPrice(totalRevenue)}</span>
                            </span>
                            <span className="text-xs sm:text-sm text-muted-foreground">
                                {t('Xarajat', language)}:{' '}
                                <span className="font-medium text-red-500">{formatPrice(totalExpense)}</span>
                            </span>
                            <span className="text-xs sm:text-sm text-muted-foreground">
                                {t('Foyda', language)}:{' '}
                                <span className={`font-medium ${totalProfit >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>
                                    {formatPrice(totalProfit)}
                                </span>
                            </span>
                        </div>
                    </div>

                    {/* Filter buttons + custom date picker */}
                    <div className="flex flex-col gap-2 items-end">
                        <div className="flex gap-1 flex-wrap justify-end">
                            {RANGES.map((r) => (
                                <Button
                                    key={r.filter}
                                    variant={activeFilter === r.filter ? 'default' : 'ghost'}
                                    size="sm"
                                    className="text-xs h-7 px-2.5"
                                    onClick={() => setActiveFilter(r.filter)}
                                >
                                    {r.filter === 'custom' && <Calendar className="h-3 w-3 mr-1" />}
                                    {t(r.label, language)}
                                </Button>
                            ))}
                        </div>

                        {activeFilter === 'custom' && (
                            <div className="flex items-center gap-2">
                                <Input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="h-7 text-xs w-[130px]"
                                />
                                <span className="text-xs text-muted-foreground">—</span>
                                <Input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="h-7 text-xs w-[130px]"
                                />
                                <Button
                                    size="sm"
                                    className="h-7 text-xs px-3"
                                    disabled={!fromDate || !toDate}
                                    onClick={handleApplyCustom}
                                >
                                    Qo'llash
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chart area */}
                {revenueLoading ? (
                    <div className="flex items-center justify-center h-[260px]">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : activeFilter === 'custom' && !isCustomReady ? (
                    <div className="flex flex-col items-center justify-center h-[260px] gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-8 w-8 opacity-30" />
                        <p>Sana oralig'ini tanlang va "Qo'llash" ni bosing</p>
                    </div>
                ) : revenueData.length === 0 ? (
                    <div className="h-[260px]">
                        <InsufficientDataOverlay compact title="Ma'lumot yo'q" description="Tanlangan davr uchun ma'lumot topilmadi" />
                    </div>
                ) : (
                    <div className="h-[260px] sm:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData} barGap={2} barCategoryGap="20%">
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 12%, 90%)" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 11, fill: 'hsl(222, 10%, 46%)' }}
                                    tickLine={false}
                                    axisLine={false}
                                    interval={Math.max(0, Math.floor(revenueData.length / 8))}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: 'hsl(222, 10%, 46%)' }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v) =>
                                        v >= 1_000_000
                                            ? `${(v / 1_000_000).toFixed(1)}M`
                                            : v >= 1_000
                                                ? `${(v / 1_000).toFixed(0)}K`
                                                : String(v)
                                    }
                                />
                                <Tooltip
                                    formatter={(value: number) => formatPrice(value)}
                                    contentStyle={{
                                        background: 'hsl(0, 0%, 100%)',
                                        border: '1px solid hsl(222, 12%, 90%)',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                    }}
                                />
                                <Legend
                                    formatter={(value: string) => (
                                        <span style={{ color: 'hsl(222, 25%, 12%)', fontSize: '13px' }}>{value}</span>
                                    )}
                                />
                                <Bar
                                    dataKey="revenue"
                                    fill="hsl(32, 95%, 52%)"
                                    name={t('Daromad', language)}
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    dataKey="expense"
                                    fill="hsl(222, 30%, 16%)"
                                    name={t('Xarajat', language)}
                                    radius={[4, 4, 0, 0]}
                                    opacity={0.7}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </Card>

            {/* ── Cost Analytics Summary ──────────────────────────────────────── */}
            {analyticsLoading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : overall && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Income */}
                        <Card className="p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Jami daromad</p>
                                    <p className="text-2xl font-bold text-green-600">{formatPrice(overall.totalIncome)}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{overall.incomePercent.toFixed(1)}% ulushi</p>
                                </div>
                                <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                                </div>
                            </div>
                            <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, overall.incomePercent)}%` }} />
                            </div>
                        </Card>

                        {/* Expense */}
                        <Card className="p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Jami xarajat</p>
                                    <p className="text-2xl font-bold text-red-600">{formatPrice(overall.totalExpense)}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{overall.expensePercent.toFixed(1)}% ulushi</p>
                                </div>
                                <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                                </div>
                            </div>
                            <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, overall.expensePercent)}%` }} />
                            </div>
                        </Card>

                        {/* Profit */}
                        <Card className="p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Sof foyda</p>
                                    <p className={`text-2xl font-bold ${isProfit ? 'text-blue-600' : 'text-orange-600'}`}>
                                        {formatPrice(overall.profit)}
                                    </p>
                                    <Badge variant={isProfit ? 'default' : 'destructive'} className="mt-1 text-xs">
                                        {isProfit ? 'Foydada' : 'Zararda'}
                                    </Badge>
                                </div>
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isProfit ? 'bg-blue-50' : 'bg-orange-50'}`}>
                                    {isProfit
                                        ? <TrendingUp className="h-4 w-4 text-blue-600" />
                                        : <TrendingDown className="h-4 w-4 text-orange-600" />}
                                </div>
                            </div>
                            <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${isProfit ? 'bg-blue-500' : 'bg-orange-500'}`} style={{ width: '100%' }} />
                            </div>
                        </Card>
                    </div>

                    {/* Charts row */}
                    <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
                        {/* Pie */}
                        <Card className="p-4">
                            <h3 className="text-sm font-semibold text-foreground mb-4">Daromad vs Xarajat</h3>
                            <div className="flex flex-col items-center">
                                <div className="h-[180px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                                                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                                            </Pie>
                                            <Tooltip
                                                formatter={(v: number) => formatPrice(v)}
                                                contentStyle={{ background: 'hsl(0,0%,100%)', border: '1px solid hsl(222,12%,90%)', borderRadius: '8px', fontSize: '12px' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-sm">
                                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-green-500" /><span className="text-muted-foreground">Daromad</span></div>
                                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-500" /><span className="text-muted-foreground">Xarajat</span></div>
                                </div>
                            </div>
                        </Card>

                        {/* Branch bar */}
                        <Card className="p-4 lg:col-span-2">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-foreground">Filiallar bo'yicha</h3>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-green-500" />Daromad</div>
                                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-red-500" />Xarajat</div>
                                </div>
                            </div>

                            {branchChartData.length === 0 ? (
                                <div className="h-[180px]">
                                    <InsufficientDataOverlay compact title="Ma'lumot yo'q" description="Filiallar bo'yicha tahlil mavjud emas" />
                                </div>
                            ) : (
                                <div className="h-[180px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={branchChartData} barGap={4} barCategoryGap="30%">
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,12%,92%)" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(222,10%,46%)' }} tickLine={false} axisLine={false} />
                                            <YAxis
                                                tick={{ fontSize: 11, fill: 'hsl(222,10%,46%)' }}
                                                tickLine={false} axisLine={false}
                                                tickFormatter={(v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : String(v)}
                                            />
                                            <Tooltip content={<BarTooltip />} />
                                            <Bar dataKey="Daromad" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="Xarajat" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.85} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {branches.length > 0 && (
                                <div className="mt-4 border-t border-border pt-3 space-y-2">
                                    {branches.map((b) => (
                                        <div key={b.branchId} className="flex items-center justify-between text-sm">
                                            <span className="font-medium text-foreground">{b.branchName}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-green-600">{formatPrice(b.income)}</span>
                                                <span className="text-red-500">{formatPrice(b.expense)}</span>
                                                <Badge variant={b.profit >= 0 ? 'default' : 'destructive'} className="text-xs">{b.growth}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
