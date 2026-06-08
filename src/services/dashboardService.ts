import api from "@/lib/api";

export interface DashboardStatus {
  totalUsers: number;
  totalBranches: number;
  totalManagers: number;
  totalRevenue: number;
  averageDailyRevenue: number;
}

export type DashboardFilter = "yesterday" | "today" | "last7" | "last30" | "custom";

export interface DashboardRevenuePoint {
  date: string;
  revenue: number;
  expense: number;
}

export interface DashboardFinanceSummary {
  totalRevenue: number;
  totalExpense: number;
  totalProfit: number;
}

export interface DashboardFinanceChartPoint {
  date: string;
  daromad: number;
  xarajat: number;
}

export interface DashboardFinanceResponse {
  summary: DashboardFinanceSummary;
  chart: DashboardFinanceChartPoint[];
}

export interface DashboardRangeParams {
  filter: DashboardFilter;
  from?: string;
  to?: string;
}

function buildFilterParams({ filter, from, to }: DashboardRangeParams) {
  return {
    filter,
    ...(filter === "custom" && from ? { from } : {}),
    ...(filter === "custom" && to ? { to } : {}),
  };
}

export const dashboardService = {
  getStatus: () => api.get<DashboardStatus>("/dashboard/status"),

  getRevenue: (params: DashboardRangeParams) =>
    api.get<DashboardRevenuePoint | DashboardRevenuePoint[]>("/dashboard/revenue", {
      params: buildFilterParams(params),
    }),

  getFinance: (params: DashboardRangeParams) =>
    api.get<DashboardFinanceResponse>("/dashboard/finance", {
      params: buildFilterParams(params),
    }),
};
