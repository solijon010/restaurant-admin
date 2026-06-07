import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, ChevronDown, ChevronRight, Loader2, Package, Search, ShoppingBag, TrendingUp, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBranch } from "@/contexts/BranchContext";
import { formatPrice } from "@/lib/display";
import { BranchOrder, getAllBranchOrders, getOrderTotal } from "@/lib/orders";
import { DashboardFilter } from "@/services/dashboardService";
import { WaiterInfoItem, userService } from "@/services/userService";

type TimeType = "today" | "weekly" | "monthly" | "custom";

const TIME_OPTIONS: { value: TimeType; label: string }[] = [
  { value: "today", label: "Bugun" },
  { value: "weekly", label: "Haftalik" },
  { value: "monthly", label: "Oylik" },
  { value: "custom", label: "Boshqa" },
];

function mapTimeType(value: TimeType): DashboardFilter {
  switch (value) {
    case "today":   return "today";
    case "weekly":  return "last7";
    case "monthly": return "last30";
    case "custom":  return "custom";
  }
}

function fmt(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

function getDateBounds(type: TimeType, fromDate: string, toDate: string) {
  const today = new Date(); today.setHours(23, 59, 59, 999);
  if (type === "today") {
    const s = new Date(); s.setHours(0, 0, 0, 0); return { start: s, end: today };
  }
  if (type === "weekly") {
    const s = new Date(); s.setDate(today.getDate() - 6); s.setHours(0, 0, 0, 0); return { start: s, end: today };
  }
  if (type === "monthly") {
    const s = new Date(); s.setDate(today.getDate() - 29); s.setHours(0, 0, 0, 0); return { start: s, end: today };
  }
  if (type === "custom" && fromDate && toDate) {
    const s = new Date(fromDate); s.setHours(0, 0, 0, 0);
    const e = new Date(toDate); e.setHours(23, 59, 59, 999);
    return { start: s, end: e };
  }
  return null;
}

function getDateRangeLabel(type: TimeType, fromDate: string, toDate: string): string | null {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  if (type === "today") return fmt(todayStr);
  if (type === "weekly") {
    const from = new Date(today); from.setDate(today.getDate() - 6);
    return `${fmt(from.toISOString().slice(0, 10))} — ${fmt(todayStr)}`;
  }
  if (type === "monthly") {
    const from = new Date(today); from.setDate(today.getDate() - 29);
    return `${fmt(from.toISOString().slice(0, 10))} — ${fmt(todayStr)}`;
  }
  if (type === "custom" && fromDate && toDate) {
    return `${fmt(fromDate)} — ${fmt(toDate)}`;
  }
  return null;
}

function RoomBreakdown({ roomStats, totalKpi, orders }: {
  roomStats: { name: string; orders: number; sum: number }[];
  totalKpi: number;
  orders: BranchOrder[];
}) {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  const roomProducts = useMemo(() => {
    if (!selectedRoom) return [];
    const productMap = new Map<string, { name: string; count: number; price: number }>();
    orders
      .filter((o) => (o.room?.name || "—") === selectedRoom)
      .forEach((order) => {
        order.orderItem.forEach((item) => {
          const name = item.product?.name || "Noma'lum";
          const price = Number(item.product?.price ?? 0);
          const count = Number(item.count ?? 0);
          const prev = productMap.get(name) ?? { name, count: 0, price };
          productMap.set(name, { ...prev, count: prev.count + count });
        });
      });
    return Array.from(productMap.values()).sort((a, b) => b.count * b.price - a.count * a.price);
  }, [selectedRoom, orders]);

  const totalSum = roomStats.reduce((s, r) => s + r.sum, 0);
  const totalOrders = roomStats.reduce((s, r) => s + r.orders, 0);

  return (
    <>
      <div className="mb-3 grid grid-cols-4 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Xona / Stol</span>
        <span className="text-center">Buyurtma</span>
        <span className="text-right">Summa</span>
        <span className="text-right">KPI</span>
      </div>

      <div className="space-y-2">
        {roomStats.map((room) => {
          const roomKpi = totalSum > 0 ? (room.sum / totalSum) * totalKpi : 0;
          return (
            <div
              key={room.name}
              onClick={() => setSelectedRoom(room.name)}
              className="grid cursor-pointer grid-cols-4 items-center rounded-xl border border-border/50 bg-background px-4 py-3 shadow-sm transition-all duration-200 hover:border-emerald-400 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 dark:hover:border-emerald-700 hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                <span className="text-sm font-semibold">{room.name}</span>
              </div>
              <div className="flex justify-center">
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  {room.orders} ta
                </span>
              </div>
              <div className="flex justify-end">
                <span className="text-sm font-bold text-green-700">{formatPrice(room.sum)}</span>
              </div>
              <div className="flex justify-end">
                <span className="text-sm font-bold text-amber-600">{formatPrice(Math.round(roomKpi))}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-4 items-center rounded-xl border border-border/40 bg-muted/40 px-4 py-3">
        <span className="text-sm font-bold text-muted-foreground">Jami</span>
        <div className="flex justify-center">
          <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">{totalOrders} ta</span>
        </div>
        <div className="flex justify-end">
          <span className="text-sm font-bold text-green-700">{formatPrice(totalSum)}</span>
        </div>
        <div className="flex justify-end">
          <span className="text-sm font-bold text-amber-600">{formatPrice(totalKpi)}</span>
        </div>
      </div>

      <Dialog open={!!selectedRoom} onOpenChange={() => setSelectedRoom(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
                <Package className="h-5 w-5 text-emerald-600" />
              </div>
              {selectedRoom} — Mahsulotlar
            </DialogTitle>
          </DialogHeader>
          {(() => {
            const roomStat = roomStats.find((r) => r.name === selectedRoom);
            const roomKpi = roomStat && totalSum > 0 ? (roomStat.sum / totalSum) * totalKpi : 0;
            const roomProductSum = roomProducts.reduce((s, p) => s + p.count * p.price, 0);
            return (
              <div className="mt-2 space-y-2">
                {roomProducts.length === 0 ? (
                  <p className="py-4 text-center text-base text-muted-foreground">Mahsulot topilmadi</p>
                ) : (
                  <>
                    <div className="grid grid-cols-4 border-b px-4 pb-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <span>Mahsulot</span>
                      <span className="text-center">Miqdor</span>
                      <span className="text-right">Summa</span>
                      <span className="text-right">KPI</span>
                    </div>
                    {roomProducts.map((product) => {
                      const productSum = product.count * product.price;
                      const productKpi = roomProductSum > 0 ? (productSum / roomProductSum) * roomKpi : 0;
                      return (
                        <div
                          key={product.name}
                          className="grid grid-cols-4 items-center rounded-xl border border-border/40 bg-muted/20 px-4 py-3.5"
                        >
                          <span className="text-base font-semibold">{product.name}</span>
                          <div className="flex justify-center">
                            <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                              {product.count} ta
                            </span>
                          </div>
                          <div className="flex justify-end">
                            <span className="text-base font-bold text-green-700">
                              {formatPrice(productSum)}
                            </span>
                          </div>
                          <div className="flex justify-end">
                            <span className="text-base font-bold text-amber-600">
                              {formatPrice(Math.round(productKpi))}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="mt-1 grid grid-cols-4 items-center rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3.5">
                      <span className="text-base font-bold">Jami</span>
                      <div className="flex justify-center">
                        <span className="rounded-full bg-emerald-600 px-3 py-1 text-sm font-bold text-white">
                          {roomProducts.reduce((s, p) => s + p.count, 0)} ta
                        </span>
                      </div>
                      <div className="flex justify-end">
                        <span className="text-base font-bold text-green-700">
                          {formatPrice(roomProductSum)}
                        </span>
                      </div>
                      <div className="flex justify-end">
                        <span className="text-base font-bold text-amber-600">
                          {formatPrice(Math.round(roomKpi))}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function Finance() {
  const { selectedBranchId } = useBranch();

  const [waiterSearch, setWaiterSearch] = useState("");
  const [timeType, setTimeType] = useState<TimeType>("today");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expandedWaiter, setExpandedWaiter] = useState<string | null>(null);

  const waiterQueryKey = ["waiters-finance", selectedBranchId, timeType, fromDate, toDate];

  const { data: waitersRaw = [], isLoading: waitersLoading } = useQuery({
    queryKey: waiterQueryKey,
    queryFn: async () => {
      const filter = mapTimeType(timeType);
      const response = await userService.getWaiterInfo(selectedBranchId, {
        filter,
        from: filter === "custom" ? fromDate : undefined,
        to: filter === "custom" ? toDate : undefined,
      });
      return response.data.data ?? [];
    },
    enabled: !!selectedBranchId && (timeType !== "custom" || (!!fromDate && !!toDate)),
  });

  const { data: expandedOrders = [], isLoading: expandedLoading } = useQuery({
    queryKey: ["waiter-room-breakdown", selectedBranchId, expandedWaiter, timeType, fromDate, toDate],
    queryFn: async () => {
      const result = await getAllBranchOrders(selectedBranchId, { limit: 200 });
      const bounds = getDateBounds(timeType, fromDate, toDate);
      const waiter = waitersRaw.find((w) => w.waiterId === expandedWaiter);
      return result.items.filter((order) => {
        if (order.status !== "SUCCESS") return false;
        if (bounds) {
          const d = new Date(order.createdAt);
          if (d < bounds.start || d > bounds.end) return false;
        }
        if (waiter) {
          const nameParts = waiter.fullName.toLowerCase().split(" ");
          const orderName = `${order.user?.firstName ?? ""} ${order.user?.lastName ?? ""}`.toLowerCase();
          if (order.user?.id && order.user.id !== expandedWaiter &&
              !nameParts.some((p) => orderName.includes(p))) return false;
          if (!order.user?.id && !nameParts.some((p) => orderName.includes(p))) return false;
        }
        return true;
      });
    },
    enabled: !!expandedWaiter && !!selectedBranchId,
  });

  const expandedRoomStats = useMemo(() => {
    const map = new Map<string, { orders: number; sum: number }>();
    expandedOrders.forEach((order) => {
      const room = order.room?.name || "—";
      const prev = map.get(room) ?? { orders: 0, sum: 0 };
      map.set(room, { orders: prev.orders + 1, sum: prev.sum + getOrderTotal(order) });
    });
    return Array.from(map.entries())
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.sum - a.sum);
  }, [expandedOrders]);

  const waitersList = useMemo(() => {
    const term = waiterSearch.trim().toLowerCase();
    if (!term) return waitersRaw;

    return waitersRaw.filter((waiter) => waiter.fullName.toLowerCase().includes(term));
  }, [waitersRaw, waiterSearch]);

  const totalOrders = waitersList.reduce((sum, waiter) => sum + Number(waiter.totalOrders ?? 0), 0);
  const totalSum = waitersList.reduce((sum, waiter) => sum + Number(waiter.totalSum ?? 0), 0);
  const totalKpi = waitersList.reduce((sum, waiter) => sum + Number(waiter.kpiAmount ?? 0), 0);

  const timeButtonStyles: Record<TimeType, string> = {
    today: "bg-emerald-500 text-white shadow-sm",
    weekly: "bg-emerald-500 text-white shadow-sm",
    monthly: "bg-emerald-500 text-white shadow-sm",
    custom: "bg-slate-500 text-white shadow-sm",
  };
  const timeButtonInactive = "text-muted-foreground hover:text-foreground hover:bg-muted";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 dark:bg-green-950/30">
            <Wallet className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground leading-tight">Ofitsiant hisoboti</h2>
            <p className="text-xs text-muted-foreground">Ofitsiantlar bo&apos;yicha moliyaviy hisobot</p>
          </div>
        </div>
        {waitersLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {!waitersLoading && waitersList.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
              <ShoppingBag className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Jami buyurtma</p>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{totalOrders}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-green-100 dark:border-green-900/40 bg-green-50 dark:bg-green-950/20 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/40">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Jami summa</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-400">{formatPrice(totalSum)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-amber-100 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
              <Wallet className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Jami KPI</p>
              <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{formatPrice(totalKpi)}</p>
            </div>
          </div>
        </div>
      )}

      <Card className="overflow-hidden rounded-2xl border border-border/60 shadow-sm">
        <div className="m-3 space-y-3 rounded-2xl bg-muted/40 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-52">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Ofitsiant qidirish..."
                value={waiterSearch}
                onChange={(event) => setWaiterSearch(event.target.value)}
                className="h-9 bg-background pl-8"
              />
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-background p-1">
              {TIME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeType(option.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    timeType === option.value ? timeButtonStyles[option.value] : timeButtonInactive
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {getDateRangeLabel(timeType, fromDate, toDate) && (
              <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-3 py-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  {getDateRangeLabel(timeType, fromDate, toDate)}
                </span>
              </div>
            )}
          </div>

          {timeType === "custom" && (
            <div className="flex flex-wrap items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="h-9 w-40 bg-background"
              />
              <span className="text-sm text-muted-foreground">—</span>
              <Input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="h-9 w-40 bg-background"
              />
              {(!fromDate || !toDate) && (
                <span className="text-xs text-amber-600">Ikkala sanani ham tanlang</span>
              )}
            </div>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/50">
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">#</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ism</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Buyurtmalar</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Jami summa</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">KPI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {waitersLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : timeType === "custom" && (!fromDate || !toDate) ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Calendar className="h-10 w-10 text-muted-foreground opacity-20" />
                    <p className="text-sm text-muted-foreground">Sana oralig&apos;ini tanlang</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : waitersList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Wallet className="h-10 w-10 text-muted-foreground opacity-20" />
                    <p className="text-sm text-muted-foreground">
                      {waiterSearch ? "Qidiruv bo'yicha natija topilmadi" : "Ma'lumot topilmadi"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              waitersList.map((waiter: WaiterInfoItem, index) => {
                const isExpanded = expandedWaiter === waiter.waiterId;
                return (
                  <>
                    <TableRow
                      key={waiter.waiterId}
                      className={`cursor-pointer transition-colors ${isExpanded ? "bg-emerald-50/50 dark:bg-emerald-950/20" : index % 2 === 0 ? "bg-background" : "bg-muted/20"} hover:bg-muted/40`}
                      onClick={() => setExpandedWaiter(isExpanded ? null : waiter.waiterId)}
                    >
                      <TableCell className="w-10 text-sm text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {isExpanded
                            ? <ChevronDown className="h-4 w-4 text-emerald-600 shrink-0" />
                            : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          }
                          {waiter.fullName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-emerald-200 dark:border-emerald-800 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
                          {waiter.totalOrders} ta
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-green-700">{formatPrice(waiter.totalSum)}</TableCell>
                      <TableCell className="font-semibold text-amber-700">{formatPrice(waiter.kpiAmount)}</TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow key={`${waiter.waiterId}-detail`}>
                        <TableCell colSpan={5} className="p-0">
                          <div className="border-t border-emerald-100 bg-muted/30 px-8 py-3">
                            {expandedLoading ? (
                              <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Yuklanmoqda...
                              </div>
                            ) : expandedRoomStats.length === 0 ? (
                              <p className="py-2 text-sm text-muted-foreground">Bu davrda yakunlangan buyurtma topilmadi</p>
                            ) : (
                              <RoomBreakdown
                                roomStats={expandedRoomStats}
                                totalKpi={Number(waiter.kpiAmount ?? 0)}
                                orders={expandedOrders}
                              />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
