import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    Loader2, Search, MoreVertical, Eye,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    Clock, LogIn, LogOut, Flame, UtensilsCrossed, Bird,
} from 'lucide-react';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useBranch } from '@/contexts/BranchContext';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/mock-data';
import { Card } from '@/components/ui/card';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
type OrderStatus = 'SUCCESS' | 'CANCELED' | 'PENDING';

interface OrderProduct { id: string; name: string; price: string | number; unit?: string; }
interface OrderItem    { id: string; count: string | number; status: string; product: OrderProduct; }
interface OrderRoom    { id: string; name: string; }
interface OrderUser    { id: string; firstName: string; lastName: string; phoneNumer: string; role?: string; }
interface Order {
    id: string; status: OrderStatus; type: string;
    createdAt: string; endAt: string | null;
    orderItem: OrderItem[]; room: OrderRoom; user: OrderUser;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<OrderStatus, string> = {
    SUCCESS: 'Yakunlangan', PENDING: 'Kutilmoqda', CANCELED: 'Bekor qilingan',
};
const STATUS_VARIANT: Record<OrderStatus, 'default' | 'secondary' | 'destructive'> = {
    SUCCESS: 'default', PENDING: 'secondary', CANCELED: 'destructive',
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
function toArray<T>(raw: unknown): T[] {
    if (Array.isArray(raw)) return raw as T[];
    if (raw && typeof raw === 'object') {
        const obj = raw as Record<string, unknown>;
        for (const key of ['data', 'items', 'result', 'results', 'content']) {
            if (Array.isArray(obj[key])) return obj[key] as T[];
        }
    }
    return [];
}

function getOrderTotal(o: Order) {
    return o.orderItem.reduce((s, i) => s + Number(i.product.price) * Number(i.count), 0);
}

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
    const { data: ordersRaw, isLoading: ordersLoading, isFetching } = useQuery({
        queryKey: ['orders', selectedBranchId, page, limit, statusFilter, dateFilter],
        queryFn: async () => {
            const params: Record<string, unknown> = { page, limit };
            if (statusFilter !== 'ALL') params.status = statusFilter;
            if (dateFilter) params.date = dateFilter;
            const res = await api.get(`/order/branch/${selectedBranchId}`, { params });
            return res.data;
        },
        enabled: !!selectedBranchId,
        placeholderData: prev => prev,
    });

    const allOrders = toArray<Order>(ordersRaw);
    const total     = (ordersRaw as any)?.total ?? allOrders.length;
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const startItem  = total === 0 ? 0 : (page - 1) * limit + 1;
    const endItem    = Math.min(page * limit, total);

    const filtered = search
        ? allOrders.filter(o => {
            const txt = `${o.room?.name || ''} ${o.user?.firstName || ''} ${o.user?.lastName || ''} ${o.orderItem.map(i => i.product?.name || '').join(' ')}`.toLowerCase();
            return txt.includes(search.toLowerCase());
        })
        : allOrders;

    // ── Shashlik hisobi
    const { data: shRaw, isLoading: shLoading } = useQuery({
        queryKey: ['orders-sh', selectedBranchId, shashlikDate],
        queryFn: async () => {
            const res = await api.get(`/order/branch/${selectedBranchId}`, {
                params: { date: shashlikDate, limit: 1000 },
            });
            return res.data;
        },
        enabled: !!selectedBranchId,
        staleTime: 2 * 60 * 1000,
    });

    const shOrders   = toArray<Order>(shRaw);
    const stats      = buildStats(shOrders, PREDEFINED_CATEGORIES);
    const grandTotal = stats.reduce((s, i) => s + i.count, 0);
    const grandSum   = stats.reduce((s, i) => s + i.sum, 0);

    // ── Qanot va O'rdak hisobi
    const { data: qoRaw, isLoading: qoLoading } = useQuery({
        queryKey: ['orders-qo', selectedBranchId, qanotDate],
        queryFn: async () => {
            const res = await api.get(`/order/branch/${selectedBranchId}`, {
                params: { date: qanotDate, limit: 1000 },
            });
            return res.data;
        },
        enabled: !!selectedBranchId,
        staleTime: 2 * 60 * 1000,
    });

    const qoOrders   = toArray<Order>(qoRaw);
    const qoStats    = buildStats(qoOrders, QANOT_ORDAK_CATEGORIES);
    const qoTotal    = qoStats.reduce((s, i) => s + i.count, 0);
    const qoSum      = qoStats.reduce((s, i) => s + i.sum, 0);

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-2xl font-bold text-foreground">Buyurtmalar</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Barcha buyurtmalar tarixi va maxsus hisobot</p>
            </div>

            <Tabs defaultValue="orders">
                <TabsList className="mb-4">
                    <TabsTrigger value="orders">
                        <UtensilsCrossed className="h-4 w-4 mr-1.5" />
                        Buyurtmalar tarixi
                    </TabsTrigger>
                    <TabsTrigger value="shashlik">
                        <Flame className="h-4 w-4 mr-1.5" />
                        Shashlik hisobi
                    </TabsTrigger>
                    <TabsTrigger value="qanot-ordak">
                        <Bird className="h-4 w-4 mr-1.5" />
                        Qanot va O'rdak
                    </TabsTrigger>
                </TabsList>

                {/* ══ BUYURTMALAR TARIXI ══════════════════════════════════════════ */}
                <TabsContent value="orders">
                    <Card>
                        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border">
                            <div className="relative flex-1 min-w-[180px] max-w-xs">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                <Input placeholder="Xona, afitsant, mahsulot..." value={search}
                                    onChange={e => setSearch(e.target.value)} className="pl-8 h-9" />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Barcha holat</SelectItem>
                                    <SelectItem value="PENDING">Kutilmoqda</SelectItem>
                                    <SelectItem value="SUCCESS">Yakunlangan</SelectItem>
                                    <SelectItem value="CANCELED">Bekor qilingan</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input type="date" value={dateFilter}
                                onChange={e => setDateFilter(e.target.value)} className="w-40 h-9" />
                            <div className="ml-auto flex items-center gap-2">
                                {isFetching && !ordersLoading && (
                                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Loader2 className="h-3 w-3 animate-spin" /> Yangilanmoqda...
                                    </span>
                                )}
                                {!ordersLoading && (
                                    <span className="text-sm text-muted-foreground">{total} ta buyurtma</span>
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
                                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                                        <TableHead className="font-semibold">Xona / Stol</TableHead>
                                        <TableHead className="font-semibold">
                                            <span className="flex items-center gap-1"><LogIn className="h-3.5 w-3.5 text-green-500" />O'tirgan</span>
                                        </TableHead>
                                        <TableHead className="font-semibold">
                                            <span className="flex items-center gap-1"><LogOut className="h-3.5 w-3.5 text-red-500" />Turgan</span>
                                        </TableHead>
                                        <TableHead className="font-semibold">
                                            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Davomiyligi</span>
                                        </TableHead>
                                        <TableHead className="font-semibold">Mahsulotlar</TableHead>
                                        <TableHead className="font-semibold">Summa</TableHead>
                                        <TableHead className="font-semibold">Holat</TableHead>
                                        <TableHead className="text-right font-semibold">Amallar</TableHead>
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
                                        <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-16">Buyurtma topilmadi</TableCell></TableRow>
                                    ) : filtered.map(o => {
                                        const prodNames = o.orderItem.map(oi => `${oi.product?.name || '?'} ×${oi.count}`);
                                        return (
                                            <TableRow key={o.id} className={`transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
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
                                                    <Badge variant={STATUS_VARIANT[o.status]}>{STATUS_LABELS[o.status]}</Badge>
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => setDetailOrder(o)}>
                                                                <Eye className="h-4 w-4 mr-2" /> Batafsil
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
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
                                        let p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
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

                        {/* Sana + umumiy kartalar */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-muted-foreground">Sana:</span>
                                <Input type="date" value={shashlikDate}
                                    onChange={e => setShashlikDate(e.target.value)} className="w-40 h-9" />
                            </div>
                            {!shLoading && stats.length > 0 && (
                                <>
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 text-sm font-bold">
                                        <Flame className="h-4 w-4" />
                                        Jami: {grandTotal} ta porsiya
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-bold">
                                        {formatPrice(grandSum)}
                                    </div>
                                </>
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
                        {/* Sana + umumiy */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-muted-foreground">Sana:</span>
                                <Input type="date" value={qanotDate}
                                    onChange={e => setQanotDate(e.target.value)} className="w-40 h-9" />
                            </div>
                            {!qoLoading && qoTotal > 0 && (
                                <>
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm font-bold">
                                        <Bird className="h-4 w-4" />
                                        Jami: {qoTotal} ta porsiya
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-bold">
                                        {formatPrice(qoSum)}
                                    </div>
                                </>
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
            <Sheet open={!!detailOrder} onOpenChange={() => setDetailOrder(null)}>
                <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
                    <SheetHeader><SheetTitle>Buyurtma tafsilotlari</SheetTitle></SheetHeader>
                    {detailOrder && (
                        <div className="space-y-3 py-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg bg-muted/50 px-3 py-2">
                                    <p className="text-xs text-muted-foreground mb-0.5">Xona / Stol</p>
                                    <p className="font-semibold">{detailOrder.room?.name || '—'}</p>
                                </div>
                                <div className="rounded-lg bg-muted/50 px-3 py-2">
                                    <p className="text-xs text-muted-foreground mb-0.5">Holat</p>
                                    <Badge variant={STATUS_VARIANT[detailOrder.status]}>{STATUS_LABELS[detailOrder.status]}</Badge>
                                </div>
                                <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                                    <p className="text-xs text-green-600 mb-0.5 flex items-center gap-1">
                                        <LogIn className="h-3 w-3" /> O'tirgan vaqti
                                    </p>
                                    <p className="font-semibold text-green-800">{formatTime(detailOrder.createdAt)}</p>
                                    <p className="text-xs text-green-600">{formatDate(detailOrder.createdAt)}</p>
                                </div>
                                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                                    <p className="text-xs text-red-600 mb-0.5 flex items-center gap-1">
                                        <LogOut className="h-3 w-3" /> Turgan vaqti
                                    </p>
                                    <p className="font-semibold text-red-800">{formatTime(detailOrder.endAt)}</p>
                                    {detailOrder.endAt && <p className="text-xs text-red-600">{formatDate(detailOrder.endAt)}</p>}
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" /> Davomiylik
                                </span>
                                <span className="font-semibold">{duration(detailOrder.createdAt, detailOrder.endAt)}</span>
                            </div>

                            <div className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/20 px-3 py-2.5">
                                <span className="text-sm font-medium">Jami summa</span>
                                <span className="text-lg font-bold text-primary">{formatPrice(getOrderTotal(detailOrder))}</span>
                            </div>

                            {detailOrder.user && (
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-sm text-muted-foreground">Afitsant</span>
                                    <span className="font-medium">{detailOrder.user.firstName} {detailOrder.user.lastName}</span>
                                </div>
                            )}

                            <div className="pt-1">
                                <p className="text-sm font-semibold mb-2">
                                    Buyurtma tarkibi ({detailOrder.orderItem.length} ta mahsulot):
                                </p>
                                <div className="space-y-2">
                                    {detailOrder.orderItem.map((oi, i) => {
                                        const isSpecial = isSpecialProduct(oi.product?.name || '');
                                        return (
                                            <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${isSpecial ? 'bg-orange-50 border border-orange-200' : 'bg-muted/40'}`}>
                                                <div>
                                                    <span className={`font-medium text-sm ${isSpecial ? 'text-orange-800' : ''}`}>
                                                        {oi.product?.name || '?'}
                                                    </span>
                                                    {oi.product?.unit && (
                                                        <span className="text-muted-foreground text-xs ml-1.5">{oi.product.unit}</span>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-muted-foreground text-sm">×{oi.count}</span>
                                                    <span className="ml-2 font-semibold text-sm">
                                                        {formatPrice(Number(oi.product?.price) * Number(oi.count))}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
