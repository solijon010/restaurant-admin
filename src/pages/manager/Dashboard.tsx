import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
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
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBranch } from "@/contexts/BranchContext";
import { useSettings } from "@/contexts/SettingsContext";
import { filterOrdersByDate, todayStr } from "@/lib/order-analytics";
import { formatPrice } from "@/lib/display";
import { getAllBranchOrders } from "@/lib/orders";
import { t } from "@/lib/i18n";
import {
  DashboardFilter,
  DashboardFinanceChartPoint,
  DashboardRangeParams,
  dashboardService,
} from "@/services/dashboardService";
import { UserResponse, userService } from "@/services/userService";

type FilterType = "today" | "yesterday" | "last7" | "last30" | "custom";

const RANGES: { label: string; filter: FilterType }[] = [
  { label: "Bugun", filter: "today" },
  { label: "Kecha", filter: "yesterday" },
  { label: "7 kun", filter: "last7" },
  { label: "30 kun", filter: "last30" },
  { label: "Boshqa", filter: "custom" },
];

type RoomStat = { name: string; orders: number; sum: number };

function buildRoomStats(dateOrders: Awaited<ReturnType<typeof getAllBranchOrders>>["items"]): RoomStat[] {
  const rooms = new Map<string, RoomStat>();

  dateOrders
    .filter((order) => order.status === "SUCCESS")
    .forEach((order) => {
      const roomName = order.room?.name || "-";
      const orderTotal = order.orderItem.reduce(
        (sum, item) => sum + Number(item.product?.price ?? 0) * Number(item.count ?? 0),
        0,
      );

      const current = rooms.get(roomName) ?? { name: roomName, orders: 0, sum: 0 };
      rooms.set(roomName, {
        name: roomName,
        orders: current.orders + 1,
        sum: current.sum + orderTotal,
      });
    });

  return Array.from(rooms.values()).sort((left, right) => right.sum - left.sum);
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

export default function ManagerDashboard() {
  const { language } = useSettings();
  const { selectedBranchId } = useBranch();

  const [activeFilter, setActiveFilter] = useState<FilterType>("last30");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [dayDate, setDayDate] = useState(todayStr);

  const isCustomReady = activeFilter !== "custom" || (!!appliedFrom && !!appliedTo);

  const { data: staff = [], isLoading: staffLoading } = useQuery({
    queryKey: ["branch-staff", selectedBranchId],
    queryFn: async () => {
      const response = await userService.getStaffByBranch(selectedBranchId);
      const payload = response.data as { data?: UserResponse[]; value?: UserResponse[] };
      return payload.data ?? payload.value ?? [];
    },
    enabled: !!selectedBranchId,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["dashboard-analytics", selectedBranchId, activeFilter, appliedFrom, appliedTo],
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
    queryKey: ["dashboard-day-orders", selectedBranchId, dayDate],
    queryFn: async () => {
      const branchOrders = await getAllBranchOrders(selectedBranchId, { limit: 100 });
      return filterOrdersByDate(branchOrders.items, dayDate);
    },
    enabled: !!selectedBranchId,
  });

  const revenueData = analytics?.revenueData ?? [];
  const totalRevenue = analytics?.totalRevenue ?? 0;
  const totalOrders = analytics?.totalOrders ?? 0;
  const averageOrder = analytics?.averageOrder ?? 0;
  const roomStats = useMemo(() => buildRoomStats(dayOrders), [dayOrders]);
  const dayTotal = roomStats.reduce((sum, room) => sum + room.sum, 0);
  const dayOrdersCount = roomStats.reduce((sum, room) => sum + room.orders, 0);

  const cardsLoading = analyticsLoading || staffLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("Bosh sahifa", language)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Filial bo&apos;yicha savdo tahlili va kunlik statistika
          </p>
        </div>
      </div>

      {cardsLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: "Xodimlar",
              value: staff.length,
              icon: Users,
              color: "#0EA5E9",
            },
            {
              label: "Buyurtmalar",
              value: totalOrders,
              icon: ShoppingCart,
              color: "#F59E0B",
            },
            {
              label: "Jami daromad",
              value: formatPrice(totalRevenue),
              icon: Banknote,
              color: "#10B981",
            },
            {
              label: "O'rtacha buyurtma",
              value: formatPrice(averageOrder),
              icon: ArrowUpRight,
              color: "#8B5CF6",
            },
          ].map((item, index) => (
            <div
              key={index}
              className="card-hover"
              style={{
                background: "hsl(var(--card))",
                borderRadius: 16,
                border: "1px solid hsl(var(--border))",
                padding: "14px",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: `${item.color}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <item.icon style={{ width: 20, height: 20, color: item.color }} />
                </div>
              </div>
              <p
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "hsl(var(--foreground))",
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                {item.value}
              </p>
              <p style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", margin: "4px 0 0" }}>
                {item.label}
              </p>
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: `linear-gradient(90deg, ${item.color}, transparent)`,
                  opacity: 0.5,
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="text-sm font-semibold">Kunlik savdo - xona bo&apos;yicha</p>
            {!dayLoading && dayOrdersCount > 0 && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {dayOrdersCount} ta yakunlangan buyurtma ·{" "}
                <span className="font-medium text-emerald-600">{formatPrice(dayTotal)}</span>
              </p>
            )}
          </div>
          <Input
            type="date"
            value={dayDate}
            onChange={(event) => setDayDate(event.target.value)}
            className="h-8 w-36 text-xs"
          />
        </div>

        {!selectedBranchId ? (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <Home className="h-8 w-8 opacity-20" />
            <p className="text-sm">Filial tanlanmagan</p>
          </div>
        ) : dayLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : roomStats.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <Home className="h-8 w-8 opacity-20" />
            <p className="text-sm">Bu kunda yakunlangan buyurtma yo&apos;q</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 p-3 lg:grid-cols-3">
            {roomStats.map((room, index) => (
              <div
                key={room.name}
                className="group flex items-center gap-3 rounded-lg border border-border p-3.5 transition-colors hover:bg-muted/30"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground transition-colors group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/30 group-hover:text-emerald-600">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{room.name}</p>
                  <p className="text-xs text-muted-foreground">{room.orders} ta buyurtma</p>
                </div>
                <p className="shrink-0 text-sm font-semibold">{formatPrice(room.sum)}</p>
              </div>
            ))}
          </div>
        )}

        {roomStats.length > 1 && !dayLoading && (
          <div className="flex items-center justify-between border-t border-border bg-muted/30 px-5 py-3">
            <span className="text-xs font-medium text-muted-foreground">Jami</span>
            <span className="text-sm font-semibold text-emerald-600">{formatPrice(dayTotal)}</span>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-col justify-between gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold">{t("Moliyaviy ko'rsatkichlar", language)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Daromad: <span className="font-semibold text-emerald-600">{formatPrice(totalRevenue)}</span>
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="flex flex-wrap gap-1">
              {RANGES.map((range) => (
                <button
                  key={range.filter}
                  onClick={() => setActiveFilter(range.filter)}
                  className={`flex h-7 items-center gap-1 rounded-md border px-3 text-xs font-medium transition-all ${
                    activeFilter === range.filter
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-border bg-background text-muted-foreground hover:border-emerald-300 hover:text-emerald-600"
                  }`}
                >
                  {range.filter === "custom" && <Calendar className="h-3 w-3" />}
                  {t(range.label, language)}
                </button>
              ))}
            </div>

            {activeFilter === "custom" && (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                  className="h-7 w-[120px] text-xs"
                />
                <span className="text-xs text-muted-foreground">-</span>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                  className="h-7 w-[120px] text-xs"
                />
                <Button
                  size="sm"
                  className="h-7 px-3 text-xs"
                  disabled={!fromDate || !toDate}
                  onClick={() => {
                    setAppliedFrom(fromDate);
                    setAppliedTo(toDate);
                  }}
                >
                  Qo&apos;llash
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="p-5">
          {!selectedBranchId ? (
            <div className="flex h-56 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Home className="h-8 w-8 opacity-20" />
              <p className="text-sm">Filial tanlang</p>
            </div>
          ) : analyticsLoading ? (
            <div className="flex h-56 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : activeFilter === "custom" && !isCustomReady ? (
            <div className="flex h-56 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Calendar className="h-8 w-8 opacity-20" />
              <p className="text-sm">Sana oralig&apos;ini tanlang</p>
            </div>
          ) : revenueData.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Banknote className="h-8 w-8 opacity-20" />
              <p className="text-sm">Ma&apos;lumot topilmadi</p>
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    interval={Math.max(0, Math.floor(revenueData.length / 8))}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
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
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "hsl(var(--foreground))",
                    }}
                    wrapperStyle={{ outline: "none" }}
                  />
                  <Bar dataKey="revenue" fill="#0EA5E9" name={t("Daromad", language)} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
