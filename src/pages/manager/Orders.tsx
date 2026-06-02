import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    Loader2, Search, MoreVertical, Eye, X,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    Clock, LogIn, LogOut, Flame, UtensilsCrossed, Bird, ShoppingCart,
} from 'lucide-react';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useBranch } from '@/contexts/BranchContext';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/display';
import { filterOrdersByDate } from '@/lib/order-analytics';
import { BranchOrder, BranchOrdersQuery, getAllBranchOrders, getBranchOrdersPage, getOrderTotal } from '@/lib/orders';
import { Card } from '@/components/ui/card';

// ─── Types ────────────────────────────────────────────────────────────────────
type Order = BranchOrder;
type OrderStatus = BranchOrder['status'];

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<OrderStatus, string> = {
    SUCCESS: 'Yakunlangan', PENDING: 'Kutilmoqda', CANCELED: 'Bekor qilingan',
};
const STATUS_VARIANT: Record<OrderStatus, 'default' | 'secondary' | 'destructive'> = {
    SUCCESS: 'default', PENDING: 'secondary', CANCELED: 'destructive',
};

const StatusBadge = ({ status }: { status: OrderStatus }) => {
    if (status === 'SUCCESS') return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
            Yakunlangan
        </span>
    );
    if (status === 'CANCELED') return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
            Bekor qilingan
        </span>
    );
    return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
            Kutilmoqda
        </span>
    );
};

// Shashlik hisobi uchun kategoriyalar
const PREDEFINED_CATEGORIES = [
    {
        id: 'qiyma',
        label: 'Qiyma shashlik',
        match: (n: string) => n.includes('qiyma'),
        dot: 'bg-orange-500',
        badge: 'bg-orange-50 text-orange-700 border-orange-200',
    },
    {
        id: 'gosht-shashlik',
        label: "Go'sht shashlik",
        match: (n: string) => n.includes('shashlik') && !n.includes('qiyma') && !n.includes("qo'y") && !n.includes('qoy'),
        dot: 'bg-red-500',
        badge: 'bg-red-50 text-red-700 border-red-200',
    },
    {
        id: 'qoy-shashlik',
        label: "Qo'y go'shtidan shashlik",
        match: (n: string) => n.includes("qo'y") || n.includes('qoy'),
        dot: 'bg-amber-500',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
    },
];

// Qanot va O'rdak hisobi uchun alohida kategoriyalar
const QANOT_ORDAK_CATEGORIES = [
    {
        id: 'qanot',
        label: 'Qanot',
        match: (n: string) => n.includes('qanot'),
        dot: 'bg-yellow-500',
        badge: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    },
    {
        id: 'ordak',
        label: "O'rdak",
        match: (n: string) => n.includes("o'rdak") || n.includes('ordak'),
        dot: 'bg-lime-600',
        badge: 'bg-lime-50 text-lime-700 border-lime-200',
    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
}
function formatDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function duration(start: string, end: string | null) {
    if (!end) return '—';
    const ms = new Date(end).getTime() - new Date(start).getTime();
    if (ms < 0) return '—';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}s ${m}d` : `${m} daqiqa`;
}

function norm(s: string) {
    return s.toLowerCase()
        .replace(/[ʻʼ`']/g, "'")
        .trim();
}

function isSpecialProduct(productName: string) {
    const n = norm(productName);
    return PREDEFINED_CATEGORIES.some(cat => cat.match(n));
}

function todayStr() {
    return new Date().toISOString().slice(0, 10);
}

type Category = { id: string; label: string; match: (n: string) => boolean; dot: string; badge: string };

function buildStats(orders: Order[], categories: Category[]) {
    return categories.map(cat => {
        const tableMap = new Map<string, { count: number; sum: number }>();
        let totalCount = 0;
        let totalSum   = 0;

        orders.forEach(order => {
            const table = order.room?.name || '—';
            order.orderItem.forEach(oi => {
                if (!oi.product?.name) return;
                if (!cat.match(norm(oi.product.name))) return;
                const cnt   = Number(oi.count);
                const price = Number(oi.product.price);
                const prev  = tableMap.get(table) ?? { count: 0, sum: 0 };
                tableMap.set(table, { count: prev.count + cnt, sum: prev.sum + cnt * price });
                totalCount += cnt;
                totalSum   += cnt * price;
            });
        });

        return {
            id:    cat.id,
            label: cat.label,
            dot:   cat.dot,
            badge: cat.badge,
            count: totalCount,
            sum:   totalSum,
            tables: Array.from(tableMap.entries())
                .map(([table, d]) => ({ table, ...d }))
                .sort((a, b) => b.count - a.count),
        };
    });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ManagerOrders() {
    const { selectedBranchId } = useBranch();

    const [search, setSearch]             = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [dateFilter, setDateFilter]     = useState('');
    const [page, setPage]                 = useState(1);
    const [limit, setLimit]               = useState(10);
    const [detailOrder, setDetailOrder]   = useState<Order | null>(null);
    const [shashlikDate, setShashlikDate] = useState(todayStr);
    const [qanotDate, setQanotDate]       = useState(todayStr);

    useEffect(() => { setPage(1); }, [statusFilter, dateFilter, selectedBranchId]);

    // ── Buyurtmalar
    const { data: ordersResult, isLoading: ordersLoading, isFetching } = useQuery({
        queryKey: ['orders', selectedBranchId, page, limit, statusFilter, dateFilter, search],
        queryFn: async () => {
            if (!selectedBranchId) return { items: [] as Order[], total: 0 };

            const params: BranchOrdersQuery = {
                page,
                limit,
                status: statusFilter !== 'ALL' ? statusFilter : undefined,
            };

            const normalizedSearch = search.trim().toLowerCase();
            const needsLocalFiltering = !!dateFilter || !!normalizedSearch;

            if (!needsLocalFiltering) {
                const pageResult = await getBranchOrdersPage(selectedBranchId, params);
                return { items: pageResult.items, total: pageResult.total };
            }

            const allOrdersResult = await getAllBranchOrders(selectedBranchId, {
                limit: 100,
                status: params.status,
            });

            const filteredOrders = allOrdersResult.items.filter((order) => {
                const matchesDate = !dateFilter || order.createdAt?.slice(0, 10) === dateFilter;
                if (!matchesDate) return false;

                if (!normalizedSearch) return true;

                const haystack = `${order.room?.name || ''} ${order.user?.firstName || ''} ${order.user?.lastName || ''} ${order.orderItem.map(item => item.product?.name || '').join(' ')}`.toLowerCase();
                return haystack.includes(normalizedSearch);
            });

            const startIndex = (page - 1) * limit;
            return {
                items: filteredOrders.slice(startIndex, startIndex + limit),
                total: filteredOrders.length,
            };
        },
        enabled: !!selectedBranchId,
        placeholderData: prev => prev,
    });

    const allOrders = ordersResult?.items ?? [];
    const total     = ordersResult?.total ?? allOrders.length;
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const startItem  = total === 0 ? 0 : (page - 1) * limit + 1;
    const endItem    = Math.min(page * limit, total);
    const filtered = allOrders;

    // ── Shashlik hisobi
    const { data: shOrders = [], isLoading: shLoading } = useQuery({
        queryKey: ['orders-sh', selectedBranchId, shashlikDate],
        queryFn: async () => {
            const result = await getAllBranchOrders(selectedBranchId, {
                limit: 100,
                status: 'SUCCESS',
            });
            return filterOrdersByDate(result.items, shashlikDate);
        },
        enabled: !!selectedBranchId,
        staleTime: 2 * 60 * 1000,
    });
    const stats      = buildStats(shOrders, PREDEFINED_CATEGORIES);
    const grandTotal = stats.reduce((s, i) => s + i.count, 0);
    const grandSum   = stats.reduce((s, i) => s + i.sum, 0);

    // ── Qanot va O'rdak hisobi
    const { data: qoOrders = [], isLoading: qoLoading } = useQuery({
        queryKey: ['orders-qo', selectedBranchId, qanotDate],
        queryFn: async () => {
            const result = await getAllBranchOrders(selectedBranchId, {
                limit: 100,
                status: 'SUCCESS',
            });
            return filterOrdersByDate(result.items, qanotDate);
        },
        enabled: !!selectedBranchId,
        staleTime: 2 * 60 * 1000,
    });
    const qoStats    = buildStats(qoOrders, QANOT_ORDAK_CATEGORIES);
    const qoTotal    = qoStats.reduce((s, i) => s + i.count, 0);
    const qoSum      = qoStats.reduce((s, i) => s + i.sum, 0);

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Umumiy hisobot</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Barcha buyurtmalar tarixi va maxsus hisobotlar</p>
            </div>

            <Tabs defaultValue="orders">
                <TabsList className="bg-transparent p-0 h-auto rounded-none gap-3 w-full justify-start mb-6">
                    <TabsTrigger
                        value="orders"
                        className="flex items-center gap-2 px-5 py-2.5 h-auto rounded-lg border text-sm font-medium transition-all
                            data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 data-[state=active]:shadow-sm
                            data-[state=inactive]:bg-background data-[state=inactive]:text-blue-600 data-[state=inactive]:border-blue-200 data-[state=inactive]:hover:bg-blue-50"
                    >
                        <ShoppingCart className="h-4 w-4 shrink-0" />
                        Buyurtmalar tarixi
                    </TabsTrigger>
                    <TabsTrigger
                        value="shashlik"
                        className="flex items-center gap-2 px-5 py-2.5 h-auto rounded-lg border text-sm font-medium transition-all
                            data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:border-emerald-600 data-[state=active]:shadow-sm
                            data-[state=inactive]:bg-background data-[state=inactive]:text-emerald-600 data-[state=inactive]:border-emerald-200 data-[state=inactive]:hover:bg-emerald-50"
                    >
                        <Flame className="h-4 w-4 shrink-0" />
                        Shashlik hisobi
                    </TabsTrigger>
                    <TabsTrigger
                        value="qanot-ordak"
                        className="flex items-center gap-2 px-5 py-2.5 h-auto rounded-lg border text-sm font-medium transition-all
                            data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:border-amber-500 data-[state=active]:shadow-sm
                            data-[state=inactive]:bg-background data-[state=inactive]:text-amber-600 data-[state=inactive]:border-amber-200 data-[state=inactive]:hover:bg-amber-50"
                    >
                        <Bird className="h-4 w-4 shrink-0" />
                        Qanot va O'rdak
                    </TabsTrigger>
                </TabsList>

                {/* ══ BUYURTMALAR TARIXI ══════════════════════════════════════════ */}
                <TabsContent value="orders">
                    <Card className="shadow-none border border-border/60">
                        <div className="flex flex-wrap items-center gap-2.5 px-4 py-3 border-b border-border/60">
                            <div className="relative flex-1 min-w-[180px] max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                <Input placeholder="Xona, afitsant, mahsulot..." value={search}
                                    onChange={e => setSearch(e.target.value)} className="pl-9 h-9 bg-muted/40 border-0 focus-visible:ring-1" />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-40 h-9 bg-muted/40 border-0 focus:ring-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Barcha holat</SelectItem>
                                    <SelectItem value="PENDING">Kutilmoqda</SelectItem>
                                    <SelectItem value="SUCCESS">Yakunlangan</SelectItem>
                                    <SelectItem value="CANCELED">Bekor qilingan</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input type="date" value={dateFilter}
                                onChange={e => setDateFilter(e.target.value)} className="w-40 h-9 bg-muted/40 border-0 focus-visible:ring-1" />
                            <div className="ml-auto flex items-center gap-2">
                                {isFetching && !ordersLoading && (
                                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Loader2 className="h-3 w-3 animate-spin" /> Yangilanmoqda...
                                    </span>
                                )}
                                {!ordersLoading && (
                                    <span className="text-xs font-medium text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full">{total} ta buyurtma</span>
                                )}
                            </div>
                        </div>

                        {/* Mobile */}
                        <div className="md:hidden space-y-3 p-4">
                            {ordersLoading ? (
                                <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></div>
                            ) : filtered.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">Buyurtma topilmadi</p>
                            ) : filtered.map(o => (
                                <Card key={o.id} className="p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold">{o.room?.name || '—'}</p>
                                        <Badge variant={STATUS_VARIANT[o.status]}>{STATUS_LABELS[o.status]}</Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><LogIn className="h-3 w-3 text-green-500" />{formatTime(o.createdAt)}</span>
                                        <span className="flex items-center gap-1"><LogOut className="h-3 w-3 text-red-500" />{formatTime(o.endAt)}</span>
                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{duration(o.createdAt, o.endAt)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-sm">{formatPrice(getOrderTotal(o))}</span>
                                        <Button variant="ghost" size="sm" onClick={() => setDetailOrder(o)}>
                                            <Eye className="h-4 w-4 mr-1" /> Ko'rish
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* Desktop */}
                        <div className="hidden md:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-muted/40 bg-muted/40 border-border/60">
                                        <TableHead className="text-xs font-bold text-foreground/70 py-3">Xona / Stol</TableHead>
                                        <TableHead className="text-xs font-bold py-3">
                                            <span className="flex items-center gap-1.5 text-green-600">
                                                <LogIn className="h-3.5 w-3.5" />O'tirgan
                                            </span>
                                        </TableHead>
                                        <TableHead className="text-xs font-bold py-3">
                                            <span className="flex items-center gap-1.5 text-red-500">
                                                <LogOut className="h-3.5 w-3.5" />Turgan
                                            </span>
                                        </TableHead>
                                        <TableHead className="text-xs font-bold py-3">
                                            <span className="flex items-center gap-1.5 text-blue-500">
                                                <Clock className="h-3.5 w-3.5" />Davomiylik
                                            </span>
                                        </TableHead>
                                        <TableHead className="text-xs font-bold text-foreground/70 py-3">Mahsulotlar</TableHead>
                                        <TableHead className="text-xs font-bold text-foreground/70 py-3">Summa</TableHead>
                                        <TableHead className="text-xs font-bold text-foreground/70 py-3">Holat</TableHead>
                                        <TableHead className="text-right text-xs font-bold text-foreground/70 py-3">Amallar</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ordersLoading ? (
                                        <TableRow><TableCell colSpan={8} className="text-center py-16">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground">Yuklanmoqda...</span>
                                            </div>
                                        </TableCell></TableRow>
                                    ) : filtered.length === 0 ? (
                                        <TableRow><TableCell colSpan={8} className="py-20">
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <UtensilsCrossed className="h-8 w-8 opacity-30" />
                                                <span className="text-sm">Buyurtma topilmadi</span>
                                            </div>
                                        </TableCell></TableRow>
                                    ) : filtered.map(o => {
                                        const prodNames = o.orderItem.map(oi => `${oi.product?.name || '?'} ${oi.count} dona`);
                                        return (
                                            <TableRow key={o.id} className={`transition-opacity border-b border-border hover:bg-muted/30 ${isFetching ? 'opacity-60' : ''}`} style={{ height: 64 }}>
                                                <TableCell className="font-semibold">{o.room?.name || '—'}</TableCell>

                                                <TableCell>
                                                    <p className="font-medium text-sm">{formatTime(o.createdAt)}</p>
                                                    <p className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</p>
                                                </TableCell>

                                                <TableCell>
                                                    {o.endAt ? (
                                                        <>
                                                            <p className="font-medium text-sm">{formatTime(o.endAt)}</p>
                                                            <p className="text-xs text-muted-foreground">{formatDate(o.endAt)}</p>
                                                        </>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-xs">Hali ketmagan</Badge>
                                                    )}
                                                </TableCell>

                                                <TableCell className="text-sm text-muted-foreground">
                                                    {duration(o.createdAt, o.endAt)}
                                                </TableCell>

                                                <TableCell className="max-w-[200px]">
                                                    <div className="flex flex-wrap gap-1">
                                                        {prodNames.slice(0, 3).map((n, i) => (
                                                            <Badge key={i} variant="outline" className="text-xs">{n}</Badge>
                                                        ))}
                                                        {prodNames.length > 3 && (
                                                            <Badge variant="outline" className="text-xs">+{prodNames.length - 3}</Badge>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                <TableCell className="font-semibold">{formatPrice(getOrderTotal(o))}</TableCell>

                                                <TableCell>
                                                    <StatusBadge status={o.status} />
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => setDetailOrder(o)}>
                                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {total > 0 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-border/60 bg-muted/20">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground">
                                        {ordersLoading
                                            ? <span className="inline-flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" />Yuklanmoqda...</span>
                                            : <><span className="font-semibold text-foreground">{startItem}–{endItem}</span> / jami <span className="font-semibold text-foreground">{total}</span></>
                                        }
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs text-muted-foreground">Ko'rsatish:</span>
                                        <Select value={String(limit)} onValueChange={v => { setLimit(Number(v)); setPage(1); }}>
                                            <SelectTrigger className="h-7 w-16 text-xs border-border/60 bg-background"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {[5, 10, 20, 50].map(n => <SelectItem key={n} value={String(n)} className="text-xs">{n} ta</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(1)} disabled={page === 1}><ChevronsLeft className="h-3.5 w-3.5" /></Button>
                                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(p => p - 1)} disabled={page === 1}><ChevronLeft className="h-3.5 w-3.5" /></Button>
                                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                        const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                                        return (
                                            <Button key={p} variant={p === page ? 'default' : 'outline'} size="icon"
                                                className={`h-7 w-7 text-xs ${p === page ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                                                onClick={() => setPage(p)}>{p}</Button>
                                        );
                                    })}
                                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}><ChevronRight className="h-3.5 w-3.5" /></Button>
                                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(totalPages)} disabled={page === totalPages}><ChevronsRight className="h-3.5 w-3.5" /></Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </TabsContent>

                {/* ══ SHASHLIK HISOBI ═════════════════════════════════════════════ */}
                <TabsContent value="shashlik">
                    <div className="space-y-5">

                        <div className="flex flex-wrap items-center gap-3 mb-1">
                            <Input type="date" value={shashlikDate}
                                onChange={e => setShashlikDate(e.target.value)} className="w-40 h-9 bg-muted/40 border-0 focus-visible:ring-1" />
                            {!shLoading && grandTotal > 0 && (
                                <div className="flex items-center gap-2 ml-auto">
                                    <span className="flex items-center gap-1.5 text-sm font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full">
                                        <Flame className="h-3.5 w-3.5" />{grandTotal} ta porsiya
                                    </span>
                                    <span className="text-sm font-semibold text-foreground bg-muted/60 px-3 py-1.5 rounded-full">
                                        {formatPrice(grandSum)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {shLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {stats.map(item => (
                                    <Card key={item.id} className="overflow-hidden">
                                        {/* Sarlavha */}
                                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60 bg-muted/20">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full shrink-0 ${item.dot}`} />
                                                <span className="font-semibold text-base text-foreground">{item.label}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`inline-flex items-center rounded-full border px-3 py-0.5 text-sm font-bold ${item.badge}`}>
                                                    {item.count} ta porsiya
                                                </span>
                                                <span className="text-sm font-semibold text-muted-foreground">
                                                    {item.sum > 0 ? formatPrice(item.sum) : '—'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Stol bo'yicha jadval */}
                                        {item.tables.length === 0 ? (
                                            <div className="px-5 py-4 text-sm text-muted-foreground italic">
                                                Bu kunda buyurtma yo'q
                                            </div>
                                        ) : (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-muted/10 hover:bg-muted/10">
                                                        <TableHead className="text-xs font-semibold pl-5">Stol / Xona</TableHead>
                                                        <TableHead className="text-xs font-semibold">Soni</TableHead>
                                                        <TableHead className="text-xs font-semibold text-right pr-5">Summa</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {item.tables.map((row, idx) => (
                                                        <TableRow key={idx}>
                                                            <TableCell className="font-medium pl-5">{row.table}</TableCell>
                                                            <TableCell>
                                                                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${item.badge}`}>
                                                                    {row.count} ta
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-right font-semibold pr-5">
                                                                {formatPrice(row.sum)}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                    {item.tables.length > 1 && (
                                                        <TableRow className="bg-muted/20 font-bold">
                                                            <TableCell className="pl-5 text-sm">Jami</TableCell>
                                                            <TableCell>
                                                                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${item.badge}`}>
                                                                    {item.count} ta
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-right pr-5">{formatPrice(item.sum)}</TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* ══ QANOT VA O'RDAK HISOBI ══════════════════════════════════════ */}
                <TabsContent value="qanot-ordak">
                    <div className="space-y-5">
                        <div className="flex flex-wrap items-center gap-3 mb-1">
                            <Input type="date" value={qanotDate}
                                onChange={e => setQanotDate(e.target.value)} className="w-40 h-9 bg-muted/40 border-0 focus-visible:ring-1" />
                            {!qoLoading && qoTotal > 0 && (
                                <div className="flex items-center gap-2 ml-auto">
                                    <span className="flex items-center gap-1.5 text-sm font-semibold text-yellow-600 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-full">
                                        <Bird className="h-3.5 w-3.5" />{qoTotal} ta porsiya
                                    </span>
                                    <span className="text-sm font-semibold text-foreground bg-muted/60 px-3 py-1.5 rounded-full">
                                        {formatPrice(qoSum)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {qoLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {qoStats.map(item => (
                                    <Card key={item.id} className="overflow-hidden">
                                        {/* Sarlavha */}
                                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60 bg-muted/20">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full shrink-0 ${item.dot}`} />
                                                <span className="font-semibold text-base text-foreground">{item.label}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`inline-flex items-center rounded-full border px-3 py-0.5 text-sm font-bold ${item.badge}`}>
                                                    {item.count} ta porsiya
                                                </span>
                                                <span className="text-sm font-semibold text-muted-foreground">
                                                    {item.sum > 0 ? formatPrice(item.sum) : '—'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Stol bo'yicha */}
                                        {item.tables.length === 0 ? (
                                            <div className="px-5 py-4 text-sm text-muted-foreground italic">
                                                Bu kunda buyurtma yo'q
                                            </div>
                                        ) : (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-muted/10 hover:bg-muted/10">
                                                        <TableHead className="text-xs font-semibold pl-5">Stol / Xona</TableHead>
                                                        <TableHead className="text-xs font-semibold">Soni</TableHead>
                                                        <TableHead className="text-xs font-semibold text-right pr-5">Summa</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {item.tables.map((row, idx) => (
                                                        <TableRow key={idx}>
                                                            <TableCell className="font-medium pl-5">{row.table}</TableCell>
                                                            <TableCell>
                                                                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${item.badge}`}>
                                                                    {row.count} ta
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-right font-semibold pr-5">
                                                                {formatPrice(row.sum)}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                    {item.tables.length > 1 && (
                                                        <TableRow className="bg-muted/20 font-bold">
                                                            <TableCell className="pl-5 text-sm">Jami</TableCell>
                                                            <TableCell>
                                                                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${item.badge}`}>
                                                                    {item.count} ta
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-right pr-5">{formatPrice(item.sum)}</TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* ═══ DETAIL SHEET ═══ */}
            <Dialog open={!!detailOrder} onOpenChange={() => setDetailOrder(null)}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 gap-0 [&>button]:hidden">
                    {detailOrder && (
                        <div>
                            {/* Header */}
                            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 z-10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-bold tracking-tight">Buyurtma tafsilotlari</h2>
                                        <p className="text-sm text-muted-foreground mt-0.5">{detailOrder.room?.name || '—'}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <StatusBadge status={detailOrder.status} />
                                        <button
                                            onClick={() => setDetailOrder(null)}
                                            className="w-7 h-7 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                                        >
                                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-5 space-y-5">
                                {/* Vaqt va davomiylik */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                                        <p className="text-xs text-emerald-600 font-medium mb-1 flex items-center gap-1"><LogIn className="h-3 w-3" /> Kirdi</p>
                                        <p className="text-base font-bold text-emerald-800">{formatTime(detailOrder.createdAt)}</p>
                                        <p className="text-xs text-emerald-600 mt-0.5">{formatDate(detailOrder.createdAt)}</p>
                                    </div>
                                    <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                                        <p className="text-xs text-red-600 font-medium mb-1 flex items-center gap-1"><LogOut className="h-3 w-3" /> Chiqdi</p>
                                        <p className="text-base font-bold text-red-800">{formatTime(detailOrder.endAt)}</p>
                                        {detailOrder.endAt && <p className="text-xs text-red-600 mt-0.5">{formatDate(detailOrder.endAt)}</p>}
                                    </div>
                                    <div className="rounded-xl border border-border bg-muted/40 p-3">
                                        <p className="text-xs text-muted-foreground font-medium mb-1 flex items-center gap-1"><Clock className="h-3 w-3" /> Davomiylik</p>
                                        <p className="text-base font-bold">{duration(detailOrder.createdAt, detailOrder.endAt)}</p>
                                    </div>
                                </div>

                                {/* Summa + Afitsant */}
                                <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-0.5">Jami summa</p>
                                        <p className="text-2xl font-black text-emerald-600">{formatPrice(getOrderTotal(detailOrder))}</p>
                                    </div>
                                    {detailOrder.user && (
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground mb-0.5">Afitsant</p>
                                            <p className="text-sm font-semibold">{detailOrder.user.firstName} {detailOrder.user.lastName}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Mahsulotlar */}
                                <div>
                                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                                        Mahsulotlar · {detailOrder.orderItem.length} ta
                                    </p>
                                    <div className="rounded-xl border border-border overflow-hidden">
                                        {detailOrder.orderItem.map((oi, i) => {
                                            const isSpecial = isSpecialProduct(oi.product?.name || '');
                                            return (
                                                <div key={i} className={`flex items-center justify-between px-4 py-3 ${i < detailOrder.orderItem.length - 1 ? 'border-b border-border' : ''} ${isSpecial ? 'bg-amber-50' : i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${isSpecial ? 'bg-amber-200 text-amber-800' : 'bg-muted text-muted-foreground'}`}>
                                                            {i + 1}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className={`text-sm font-medium truncate ${isSpecial ? 'text-amber-800' : ''}`}>{oi.product?.name || '?'}</p>
                                                            {oi.product?.unit && <p className="text-xs text-muted-foreground">{oi.product.unit}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 shrink-0 ml-3">
                                                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                                                            {oi.count} dona
                                                        </span>
                                                        <span className="text-sm font-bold w-28 text-right">
                                                            {formatPrice(Number(oi.product?.price) * Number(oi.count))}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
