import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2 } from "lucide-react";

import { StatsCard } from "@/components/StatsCard";
import { InsufficientDataOverlay } from "@/components/InsufficientDataOverlay";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { extractObject, extractPaginated } from "@/lib/api-response";
import { formatPrice } from "@/lib/display";
import { branchService, BranchResponse } from "@/services/branchService";
import { companyService, Company } from "@/services/companyService";
import { dashboardService, DashboardStatus } from "@/services/dashboardService";

type Period = "7d" | "30d" | "90d" | "1y";

const periodLabels: Record<Period, string> = {
  "7d": "1 hafta",
  "30d": "1 oy",
  "90d": "3 oy",
  "1y": "1 yil",
};

const periodDays: Record<Period, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
};

const COLORS = ["hsl(160, 60%, 45%)", "hsl(40, 10%, 80%)", "hsl(220, 10%, 70%)"];

const EMPTY_STATUS: DashboardStatus = {
  totalUsers: 0,
  totalBranches: 0,
  totalManagers: 0,
  totalRevenue: 0,
  averageDailyRevenue: 0,
};

function formatShortDate(date: Date) {
  return date.toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit" });
}

function buildCompanySeries(companies: Company[], days: number) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const buckets = new Map<string, number>();
  const timeline: { key: string; date: string; companies: number }[] = [];

  for (let index = 0; index < days; index += 1) {
    const point = new Date(start);
    point.setDate(start.getDate() + index);
    const key = point.toISOString().slice(0, 10);
    buckets.set(key, 0);
    timeline.push({
      key,
      date: formatShortDate(point),
      companies: 0,
    });
  }

  companies.forEach((company) => {
    const createdAt = company.createdAt?.slice(0, 10);
    if (!createdAt || !buckets.has(createdAt)) return;
    buckets.set(createdAt, (buckets.get(createdAt) ?? 0) + 1);
  });

  return timeline.map((item) => ({
    date: item.date,
    companies: buckets.get(item.key) ?? 0,
  }));
}

export default function SuperAdminDashboard() {
  const [period, setPeriod] = useState<Period>("30d");

  const { data: status = EMPTY_STATUS, isLoading: statusLoading } = useQuery({
    queryKey: ["superadmin-dashboard-status"],
    queryFn: async () =>
      extractObject<DashboardStatus>((await dashboardService.getStatus()).data) ?? EMPTY_STATUS,
  });

  const { data: companiesResult, isLoading: companiesLoading } = useQuery({
    queryKey: ["superadmin-dashboard-companies"],
    queryFn: async () =>
      extractPaginated<Company>(
        (await companyService.getAll({ offcet: 0, limit: 1000 })).data,
      ),
  });

  const { data: branchesResult, isLoading: branchesLoading } = useQuery({
    queryKey: ["superadmin-dashboard-branches"],
    queryFn: async () => extractPaginated<BranchResponse>(await branchService.getAll()),
  });

  const companies = useMemo(() => companiesResult?.items ?? [], [companiesResult]);
  const branches = useMemo(() => branchesResult?.items ?? [], [branchesResult]);
  const activeBranches = branches.filter((branch) => branch.status === "ACTIVE").length;
  const inactiveBranches = branches.filter((branch) => branch.status === "INACTIVE").length;
  const otherBranches = Math.max(branches.length - activeBranches - inactiveBranches, 0);

  const chartData = useMemo(
    () => buildCompanySeries(companies, periodDays[period]),
    [companies, period],
  );

  const branchStatusData = useMemo(
    () =>
      [
        { name: "Faol", value: activeBranches },
        { name: "Nofaol", value: inactiveBranches },
        { name: "Boshqa", value: otherBranches },
      ].filter((item) => item.value > 0),
    [activeBranches, inactiveBranches, otherBranches],
  );

  const isLoading = statusLoading || companiesLoading || branchesLoading;
  const isDataInsufficient =
    companies.length === 0 &&
    branches.length === 0 &&
    status.totalManagers === 0 &&
    status.totalUsers === 0;

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-foreground">Bosh sahifa</h2>

      {isDataInsufficient && (
        <div className="mb-6">
          <InsufficientDataOverlay
            title="Ma'lumot yetarli emas"
            description="Hali kompaniya, filial yoki foydalanuvchi ma'lumotlari yo'q. Statistikalar ma'lumot kelishi bilan to'ldiriladi."
          />
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
        <StatsCard title="Kompaniyalar" value={companiesResult?.total ?? companies.length} />
        <StatsCard
          title="Filiallar"
          value={status.totalBranches || branches.length}
          subtitle={`${activeBranches} ta faol`}
        />
        <StatsCard title="Menejerlar" value={status.totalManagers} />
        <StatsCard title="Jami foydalanuvchilar" value={status.totalUsers} />
        <StatsCard title="Jami tushum" value={formatPrice(status.totalRevenue)} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <Card className="p-4 sm:p-6 lg:col-span-2">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-base font-semibold text-foreground">Yangi kompaniyalar</h3>
              <p className="text-sm text-muted-foreground">
                Tanlangan davr ichida ro'yxatdan o'tgan kompaniyalar soni
              </p>
            </div>
            <div className="flex gap-1">
              {(Object.keys(periodLabels) as Period[]).map((item) => (
                <Button
                  key={item}
                  variant={period === item ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setPeriod(item)}
                >
                  {periodLabels[item]}
                </Button>
              ))}
            </div>
          </div>

          <div className="h-[260px] sm:h-[300px]">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 12%, 90%)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "hsl(222, 10%, 46%)" }}
                    tickLine={false}
                    axisLine={false}
                    interval={Math.max(0, Math.floor(chartData.length / 8))}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(222, 10%, 46%)" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value} ta`, "Kompaniya"]}
                    contentStyle={{
                      background: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(222, 12%, 90%)",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="companies"
                    stroke="hsl(32, 95%, 52%)"
                    fill="hsl(32, 95%, 52%)"
                    fillOpacity={0.15}
                    strokeWidth={2}
                    name="Kompaniyalar"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-foreground">Filiallar holati</h3>
            <p className="text-sm text-muted-foreground">
              Hozirgi filial statuslari bo'yicha taqsimot
            </p>
          </div>

          <div className="flex h-[260px] items-center justify-center sm:h-[300px]">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : branchStatusData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Filiallar topilmadi</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={branchStatusData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="value"
                    paddingAngle={4}
                    strokeWidth={0}
                  >
                    {branchStatusData.map((_, index) => (
                      <Cell key={`branch-status-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    formatter={(value: string) => (
                      <span style={{ color: "hsl(222, 25%, 12%)", fontSize: "13px" }}>
                        {value}
                      </span>
                    )}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value} ta`, "Filial"]}
                    contentStyle={{
                      background: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(222, 12%, 90%)",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
