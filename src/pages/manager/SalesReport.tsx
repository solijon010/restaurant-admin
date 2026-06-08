import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  Banknote,
  Calendar,
  Home,
  Loader2,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useBranch } from "@/contexts/BranchContext";
import { useSettings } from "@/contexts/SettingsContext";
import { formatPrice } from "@/lib/display";
import { filterOrdersByDate, todayStr, yesterdayStr } from "@/lib/order-analytics";
import { t } from "@/lib/i18n";
import { BranchOrder, getAllBranchOrders, getOrderTotal } from "@/lib/orders";
import {
  DashboardFilter,
  DashboardFinanceChartPoint,
  DashboardRangeParams,
  dashboardService,
} from "@/services/dashboardService";
import { userService } from "@/services/userService";

type FilterType = "today" | "yesterday" | "last7" | "last30" | "custom";

interface RoomStat {
  name: string;
  orders: number;
  sum: number;
}

const FILTERS: { label: string; filter: FilterType; active: string; inactive: string }[] = [
  {
    label: "Bugun",
    filter: "today",
    active: "border-emerald-500 bg-emerald-500 text-white",
    inactive: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  },
  {
    label: "Kecha",
    filter: "yesterday",
    active: "border-blue-500 bg-blue-500 text-white",
    inactive: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
  },
  {
    label: "7 kun",
    filter: "last7",
    active: "border-violet-500 bg-violet-500 text-white",
    inactive: "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100",
  },
  {
    label: "30 kun",
    filter: "last30",
    active: "border-orange-500 bg-orange-500 text-white",
    inactive: "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100",
  },
  {
    label: "Boshqa",
    filter: "custom",
    active: "border-slate-700 bg-slate-700 text-white",
    inactive: "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100",
  },
];

function buildRoomStats(orders: BranchOrder[]): RoomStat[] {
  const map = new Map<string, RoomStat>();

  orders
    .filter((order) => order.status === "SUCCESS")
    .forEach((order) => {
      const roomName = order.room?.name || "-";
      const current = map.get(roomName) ?? { name: roomName, orders: 0, sum: 0 };
      map.set(roomName, {
        name: roomName,
        orders: current.orders + 1,
        sum: current.sum + getOrderTotal(order),
      });
    });

  return Array.from(map.values()).sort((left, right) => right.sum - left.sum);
}

function mapFilter(filter: FilterType): DashboardFilter {
  switch (filter) {
    case "today":
      return "today";
    case "yesterday":
      return "yesterday";
    case "last7":
      return "last7";
    case "last30":
      return "last30";
    case "custom":
      return "custom";
  }
}

function toRevenueChartData(chart: DashboardFinanceChartPoint[]) {
  return chart.map((point) => ({
    date: point.date,
    revenue: Number(point.daromad ?? 0),
    expense: Number(point.xarajat ?? 0),
  }));
}

export default function SalesReport() {
  const { selectedBranchId } = useBranch();
  const { language } = useSettings();

  const [activeFilter, setActiveFilter] = useState<FilterType>("today");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  const isSingleDay =
    activeFilter === "today" ||
    activeFilter === "yesterday" ||
    (activeFilter === "custom" && appliedFrom === appliedTo && !!appliedFrom);

  const singleDate =
    activeFilter === "today"
      ? todayStr()
      : activeFilter === "yesterday"
        ? yesterdayStr()
        : appliedFrom;

  const isCustomReady = activeFilter !== "custom" || (!!appliedFrom && !!appliedTo);

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["sales-report-analytics", selectedBranchId, activeFilter, appliedFrom, appliedTo],
    queryFn: async () => {
      if (!selectedBranchId) {
        return { revenueData: [], totalRevenue: 0, totalOrders: 0, averageOrder: 0 };
      }

      const params: DashboardRangeParams =
        activeFilter === "custom"
          ? { filter: "custom", from: appliedFrom, to: appliedTo }
          : { filter: mapFilter(activeFilter) };

      const [financeResponse, waiterResponse] = await Promise.all([
        dashboardService.getFinance(params),
        userService.getWaiterInfo(selectedBranchId, params),
      ]);

      const finance = financeResponse.data;
      const waiters = waiterResponse.data.data ?? [];
      const totalRevenue = Number(finance.summary?.totalRevenue ?? 0);
      const totalOrders = waiters.reduce((sum, waiter) => sum + Number(waiter.totalOrders ?? 0), 0);

      return {
        revenueData: toRevenueChartData(finance.chart ?? []),
        totalRevenue,
        totalOrders,
        averageOrder: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      };
    },
    enabled: !!selectedBranchId && isCustomReady,
  });

  const { data: dayOrders = [], isLoading: dayLoading } = useQuery({
    queryKey: ["sales-report-day-orders", selectedBranchId, singleDate],
    queryFn: async () => {
      const branchOrders = await getAllBranchOrders(selectedBranchId, { limit: 100 });
      return filterOrdersByDate(branchOrders.items, singleDate);
    },
    enabled: !!selectedBranchId && isSingleDay && !!singleDate,
  });

  const revenueData = analytics?.revenueData ?? [];
  const totalRevenue = analytics?.totalRevenue ?? 0;
  const totalOrders = analytics?.totalOrders ?? 0;
  const averageOrder = analytics?.averageOrder ?? 0;
  const roomStats = useMemo(() => buildRoomStats(dayOrders), [dayOrders]);
  const dayTotal = roomStats.reduce((sum, room) => sum + room.sum, 0);
  const dayOrderCount = roomStats.reduce((sum, room) => sum + room.orders, 0);
  const isLoading = analyticsLoading || (isSingleDay && dayLoading);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{t("Savdo tahlili", language)}</h2>
          <p className="text-sm text-muted-foreground">Filial bo&apos;yicha kunlik va davriy savdo hisoboti</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.filter}
            onClick={() => setActiveFilter(item.filter)}
            className={`flex h-8 items-center gap-1.5 rounded-xl border px-4 text-sm font-medium transition-all ${
              activeFilter === item.filter ? item.active : item.inactive
            }`}
          >
            {item.filter === "custom" && <Calendar className="h-3.5 w-3.5" />}
            {item.label}
          </button>
        ))}
      </div>

      {activeFilter === "custom" && (
        <div className="flex flex-wrap items-center gap-3">
          <Input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="h-9 w-40 border-0 bg-muted/40 text-sm focus-visible:ring-1"
          />
          <span className="text-sm text-muted-foreground">-</span>
          <Input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="h-9 w-40 border-0 bg-muted/40 text-sm focus-visible:ring-1"
          />
          <button
            disabled={!fromDate || !toDate}
            onClick={() => {
              setAppliedFrom(fromDate);
              setAppliedTo(toDate);
            }}
            className="h-9 rounded-xl bg-slate-700 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-40"
          >
            Ko&apos;rsatish
          </button>
        </div>
      )}

      {!isLoading && (activeFilter !== "custom" || isCustomReady) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              label: "Jami daromad",
              value: formatPrice(isSingleDay ? dayTotal : totalRevenue),
              icon: Banknote,
              bg: "bg-emerald-50",
              iconColor: "text-emerald-600",
              valueColor: "text-emerald-600",
            },
            {
              label: "Buyurtmalar",
              value: `${isSingleDay ? dayOrderCount : totalOrders} ta`,
              icon: ShoppingCart,
              bg: "bg-blue-50",
              iconColor: "text-blue-600",
              valueColor: "text-blue-600",
            },
            {
              label: "O'rtacha buyurtma",
              value: formatPrice(isSingleDay ? (dayOrderCount > 0 ? dayTotal / dayOrderCount : 0) : averageOrder),
              icon: ArrowUpRight,
              bg: "bg-violet-50",
              iconColor: "text-violet-600",
              valueColor: "text-violet-600",
            },
          ].map((item, index) => (
            <Card key={index} className="flex items-center gap-4 rounded-2xl border border-border/60 p-4 shadow-sm">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.bg}`}>
                <item.icon className={`h-5 w-5 ${item.iconColor}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={`text-xl font-bold ${item.valueColor}`}>{item.value}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isSingleDay && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card className="rounded-2xl border border-border/60 p-4 shadow-sm sm:p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Daromad grafigi</h3>
            {analyticsLoading ? (
              <div className="flex h-[220px] items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : activeFilter === "custom" && !isCustomReady ? (
              <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-7 w-7 opacity-20" />
                <p>Sana oralig&apos;ini tanlang va ko&apos;rsatishni bosing</p>
              </div>
            ) : revenueData.length === 0 ? (
              <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-7 w-7 opacity-20" />
                <p>Ma&apos;lumot topilmadi</p>
              </div>
            ) : (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} barGap={2} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,12%,91%)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "hsl(222,10%,50%)" }}
                      tickLine={false}
                      axisLine={false}
                      interval={Math.max(0, Math.floor(revenueData.length / 8))}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "hsl(222,10%,50%)" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) =>
                        value >= 1_000_000
                          ? `${(value / 1_000_000).toFixed(1)}M`
                          : value >= 1_000
                            ? `${(value / 1_000).toFixed(0)}K`
                            : String(value)
                      }
                    />
                    <Tooltip
                      formatter={(value: number) => formatPrice(value)}
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(222,12%,90%)",
                        borderRadius: "10px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="revenue" fill="hsl(32,95%,52%)" name="Daromad" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card className="rounded-2xl border border-border/60 p-5 shadow-sm">
            <p className="mb-1 text-sm font-semibold text-foreground">Daromad dinamikasi</p>
            <p className="mb-4 text-xs text-muted-foreground">{formatPrice(totalRevenue)} jami daromad</p>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="sales-report-area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                    interval={Math.max(0, Math.floor(revenueData.length / 6))}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) =>
                      value >= 1_000_000
                        ? `${(value / 1_000_000).toFixed(1)}M`
                        : value >= 1_000
                          ? `${(value / 1_000).toFixed(0)}K`
                          : String(value)
                    }
                  />
                  <Tooltip
                    formatter={(value: number) => formatPrice(value)}
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid hsl(214,32%,91%)",
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0EA5E9"
                    strokeWidth={2.5}
                    fill="url(#sales-report-area)"
                    dot={{ r: 3, fill: "#0EA5E9" }}
                    activeDot={{ r: 5 }}
                    name="Daromad"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {isSingleDay && (
        <Card className="overflow-hidden rounded-2xl border border-border/60 shadow-sm">
          <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50">
              <Home className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Xonalar bo&apos;yicha savdo</p>
              {!dayLoading && dayOrderCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {dayOrderCount} ta buyurtma · {formatPrice(dayTotal)}
                </p>
              )}
            </div>
            <div className="ml-auto">
              <Badge variant="outline" className="text-xs">
                {singleDate}
              </Badge>
            </div>
          </div>

          {dayLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : roomStats.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50">
                <Home className="h-6 w-6 opacity-30" />
              </div>
              <p className="text-sm">Bu kunda yakunlangan buyurtma yo&apos;q</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {roomStats.map((room, index) => (
                  <div
                    key={room.name}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 transition-colors hover:bg-muted/40"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        index === 0
                          ? "bg-amber-100 text-amber-700"
                          : index === 1
                            ? "bg-slate-100 text-slate-600"
                            : "bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{room.name}</p>
                      <span className="text-xs text-muted-foreground">{room.orders} ta buyurtma</span>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-foreground">{formatPrice(room.sum)}</p>
                  </div>
                ))}
              </div>
              {roomStats.length > 1 && (
                <div className="flex items-center justify-between border-t border-border/60 bg-muted/30 px-4 py-3">
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

      {roomStats.length > 1 && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card className="rounded-2xl border border-border/60 p-5 shadow-sm">
            <p className="mb-1 text-sm font-semibold text-foreground">Xona bo&apos;yicha ulush</p>
            <p className="mb-4 text-xs text-muted-foreground">Har bir xonaning daromad ulushi</p>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roomStats.slice(0, 5)}
                    dataKey="sum"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                    fontSize={11}
                  >
                    {roomStats.slice(0, 5).map((_, index) => (
                      <Cell key={index} fill={["#0EA5E9", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444"][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatPrice(value)}
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid hsl(214,32%,91%)",
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="rounded-2xl border border-border/60 p-5 shadow-sm">
            <p className="mb-1 text-sm font-semibold text-foreground">Xona bo&apos;yicha savdo</p>
            <p className="mb-4 text-xs text-muted-foreground">Daromad bo&apos;yicha TOP xonalar</p>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roomStats.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) =>
                      value >= 1_000_000
                        ? `${(value / 1_000_000).toFixed(1)}M`
                        : value >= 1_000
                          ? `${(value / 1_000).toFixed(0)}K`
                          : String(value)
                    }
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                    width={55}
                  />
                  <Tooltip
                    formatter={(value: number) => formatPrice(value)}
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid hsl(214,32%,91%)",
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="sum" fill="#0EA5E9" radius={[0, 6, 6, 0]} name="Daromad" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
