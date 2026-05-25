import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBranch } from '@/contexts/BranchContext';
import {
    Loader2, Search, GitBranch, MoreVertical, Eye,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/mock-data';
import { Card } from '@/components/ui/card';
import api from '@/lib/api';

type OrderStatus = 'SUCCESS' | 'CANCELED' | 'PENDING';

interface OrderProduct {
    id: string;
    name: string;
    price: string | number;
    unit?: string;
}

interface OrderItem {
    id: string;
    count: string | number;
    status: string;
    product: OrderProduct;
}

interface OrderRoom {
    id: string;
    name: string;
}

interface OrderUser {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumer: string;
    role?: string;
}

interface Order {
    id: string;
    status: OrderStatus;
    type: string;
    createdAt: string;
    endAt: string | null;
    orderItem: OrderItem[];
    room: OrderRoom;
    user: OrderUser;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
    SUCCESS: 'Yakunlangan',
    PENDING: 'Kutilmoqda',
    CANCELED: 'Bekor qilingan',
};

const STATUS_VARIANT: Record<OrderStatus, 'default' | 'secondary' | 'destructive'> = {
    SUCCESS: 'default',
    PENDING: 'secondary',
    CANCELED: 'destructive',
};

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

function getOrderTotal(order: Order): number {
    return order.orderItem.reduce((sum, item) => {
        return sum + Number(item.product.price) * Number(item.count);
    }, 0);
}

export default function ManagerOrders() {
    const { branches, branchesLoading, selectedBranchId, setSelectedBranchId } = useBranch();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [dateFilter, setDateFilter] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [detailOrder, setDetailOrder] = useState<Order | null>(null);

    useEffect(() => { setPage(1); }, [statusFilter, dateFilter, selectedBranchId]);

    const { data: ordersRaw, isLoading: ordersLoading, isFetching } = useQuery({
        queryKey: ['orders', selectedBranchId, page, limit, statusFilter, dateFilter],
        queryFn: async () => {
            const params: Record<string, any> = { page, limit };
            if (statusFilter !== 'ALL') params.status = statusFilter;
            if (dateFilter) params.date = dateFilter;
            const res = await api.get(`/order/branch/${selectedBranchId}`, { params });
            return res.data;
        },
        enabled: !!selectedBranchId,
        placeholderData: (prev) => prev,
    });

    const allOrders = toArray<Order>(ordersRaw);
    const total: number = (ordersRaw as any)?.total ?? allOrders.length;
    const totalPages = Math.max(Math.ceil(total / limit), 1);

    // Client-side text search only
    const filtered = search
        ? allOrders.filter((o) => {
            const prodNames = o.orderItem.map((oi) => oi.product?.name || '').join(' ');
            const text = `${o.room?.name || ''} ${o.user?.firstName || ''} ${o.user?.lastName || ''} ${prodNames}`.toLowerCase();
            return text.includes(search.toLowerCase());
        })
        : allOrders;

    const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, total);

    return (
        <div className="space-y-6">
            {/* ── Header ──────────────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Buyurtmalar</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Filial bo'yicha barcha buyurtmalar
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <GitBranch className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Filial:</span>
                    </div>
                    {branchesLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                        <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                            <SelectTrigger className="w-44 h-9">
                                <SelectValue placeholder="Tanlang" />
                            </SelectTrigger>
                            <SelectContent>
                                {branches.map((b) => (
                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            {/* ── Filters + Table card ─────────────────────────────────────────────── */}
            <Card>
                <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border">
                    <div className="relative flex-1 min-w-[180px] max-w-xs">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Xona, afitsant, mahsulot..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 h-9"
                        />
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-44 h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Barcha holat</SelectItem>
                            <SelectItem value="PENDING">Kutilmoqda</SelectItem>
                            <SelectItem value="SUCCESS">Yakunlangan</SelectItem>
                            <SelectItem value="CANCELED">Bekor qilingan</SelectItem>
                        </SelectContent>
                    </Select>

                    <Input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-40 h-9"
                    />

                    <div className="ml-auto flex items-center gap-2">
                        {isFetching && !ordersLoading && (
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" /> Yangilanmoqda...
                            </span>
                        )}
                        {!ordersLoading && (
                            <span className="text-sm text-muted-foreground">
                                {total} ta buyurtma
                            </span>
                        )}
                    </div>
                </div>

                {/* ═══ MOBILE CARDS ═══ */}
                <div className="md:hidden space-y-3 p-4">
                    {ordersLoading ? (
                        <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></div>
                    ) : !selectedBranchId ? (
                        <p className="text-center text-muted-foreground py-8">Filial tanlang</p>
                    ) : filtered.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">Buyurtma topilmadi</p>
                    ) : (
                        filtered.map((o) => {
                            const total = getOrderTotal(o);
                            return (
                                <Card key={o.id} className="p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-foreground">{o.room?.name || '—'}</p>
                                                <Badge variant={STATUS_VARIANT[o.status]} className="text-xs">{STATUS_LABELS[o.status]}</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-0.5">
                                                {formatPrice(total)} · {new Date(o.createdAt).toLocaleDateString('uz-UZ')}
                                            </p>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setDetailOrder(o)}>
                                                    <Eye className="h-4 w-4 mr-2" /> Batafsil
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </Card>
                            );
                        })
                    )}
                </div>

                {/* ═══ DESKTOP TABLE ═══ */}
                <div className="hidden md:block overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                                <TableHead className="font-semibold">Buyurtma</TableHead>
                                <TableHead className="font-semibold">Xona / Stol</TableHead>
                                <TableHead className="font-semibold">Afitsant</TableHead>
                                <TableHead className="font-semibold">Mahsulotlar</TableHead>
                                <TableHead className="font-semibold">Summa</TableHead>
                                <TableHead className="font-semibold">Holat</TableHead>
                                <TableHead className="font-semibold">Sana</TableHead>
                                <TableHead className="text-right font-semibold">Amallar</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ordersLoading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-16">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">Yuklanmoqda...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : !selectedBranchId ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center text-muted-foreground py-16">
                                        Filial tanlang
                                    </TableCell>
                                </TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center text-muted-foreground py-16">
                                        Buyurtma topilmadi
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((o) => {
                                    const prodNames = o.orderItem.map((oi) => `${oi.product?.name || '?'} x${oi.count}`);
                                    const rowTotal = getOrderTotal(o);
                                    return (
                                        <TableRow key={o.id} className={`transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                {o.id.slice(0, 8)}
                                            </TableCell>
                                            <TableCell className="font-medium">{o.room?.name || '—'}</TableCell>
                                            <TableCell>
                                                {o.user ? `${o.user.firstName} ${o.user.lastName}` : '—'}
                                            </TableCell>
                                            <TableCell className="max-w-[220px]">
                                                <div className="flex flex-wrap gap-1">
                                                    {prodNames.slice(0, 3).map((n, i) => (
                                                        <Badge key={i} variant="outline" className="text-xs">{n}</Badge>
                                                    ))}
                                                    {prodNames.length > 3 && (
                                                        <Badge variant="outline" className="text-xs">+{prodNames.length - 3}</Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-semibold">{formatPrice(rowTotal)}</TableCell>
                                            <TableCell>
                                                <Badge variant={STATUS_VARIANT[o.status]}>{STATUS_LABELS[o.status]}</Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {new Date(o.createdAt).toLocaleDateString('uz-UZ')}
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
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* ─── Pagination ─────────────────────────────────────────────────── */}
                {total > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border/60 bg-muted/20">
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">
                                {ordersLoading ? (
                                    <span className="inline-flex items-center gap-1.5">
                                        <Loader2 className="h-3 w-3 animate-spin" /> Yuklanmoqda...
                                    </span>
                                ) : (
                                    <>
                                        <span className="font-semibold text-foreground">{startItem}–{endItem}</span>
                                        {' '}/ jami{' '}
                                        <span className="font-semibold text-foreground">{total}</span>
                                    </>
                                )}
                            </span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-muted-foreground">Ko'rsatish:</span>
                                <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
                                    <SelectTrigger className="h-7 w-16 text-xs border-border/60 bg-background">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[5, 10, 20, 50].map((n) => (
                                            <SelectItem key={n} value={String(n)} className="text-xs">{n} ta</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" className="h-7 w-7 border-border/60"
                                onClick={() => setPage(1)} disabled={page === 1 || ordersLoading}>
                                <ChevronsLeft className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-7 w-7 border-border/60"
                                onClick={() => setPage(page - 1)} disabled={page === 1 || ordersLoading}>
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let p: number;
                                if (totalPages <= 5) p = i + 1;
                                else if (page <= 3) p = i + 1;
                                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                                else p = page - 2 + i;
                                return (
                                    <Button key={p} variant={p === page ? 'default' : 'outline'} size="icon"
                                        className={`h-7 w-7 text-xs border-border/60 ${p === page ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                                        onClick={() => setPage(p)} disabled={ordersLoading}>
                                        {p}
                                    </Button>
                                );
                            })}
                            <Button variant="outline" size="icon" className="h-7 w-7 border-border/60"
                                onClick={() => setPage(page + 1)} disabled={page === totalPages || ordersLoading}>
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-7 w-7 border-border/60"
                                onClick={() => setPage(totalPages)} disabled={page === totalPages || ordersLoading}>
                                <ChevronsRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* ═══ ORDER DETAIL SHEET ═══ */}
            <Sheet open={!!detailOrder} onOpenChange={() => setDetailOrder(null)}>
                <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
                    <SheetHeader><SheetTitle>Buyurtma tafsilotlari</SheetTitle></SheetHeader>
                    {detailOrder && (
                        <div className="space-y-3 py-4">
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">ID</span>
                                <span className="font-mono text-xs">{detailOrder.id.slice(0, 8)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Xona</span>
                                <span className="font-medium">{detailOrder.room?.name || '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Afitsant</span>
                                <span>{detailOrder.user ? `${detailOrder.user.firstName} ${detailOrder.user.lastName}` : '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Holat</span>
                                <Badge variant={STATUS_VARIANT[detailOrder.status]}>{STATUS_LABELS[detailOrder.status]}</Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Jami summa</span>
                                <span className="font-semibold">{formatPrice(getOrderTotal(detailOrder))}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Sana</span>
                                <span className="text-sm">{new Date(detailOrder.createdAt).toLocaleDateString('uz-UZ')}</span>
                            </div>
                            {detailOrder.endAt && (
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Tugagan</span>
                                    <span className="text-sm">{new Date(detailOrder.endAt).toLocaleDateString('uz-UZ')}</span>
                                </div>
                            )}
                            <div className="pt-2">
                                <p className="text-sm font-medium mb-2">Mahsulotlar:</p>
                                <div className="space-y-2">
                                    {detailOrder.orderItem.map((oi, i) => (
                                        <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                                            <div>
                                                <span className="font-medium">{oi.product?.name || '?'}</span>
                                                <span className="text-muted-foreground ml-2 text-xs">{oi.product?.unit}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-muted-foreground">x{oi.count}</span>
                                                <span className="ml-2 font-semibold">
                                                    {formatPrice(Number(oi.product?.price) * Number(oi.count))}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
