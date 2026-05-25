import api from "@/lib/api";

export interface DashboardStatus {
  totalUsers: number;
  totalBranches: number;
  totalManagers: number;
  totalRevenue: number;
  averageDailyRevenue: number;
}

export const dashboardService = {
  getStatus: () => api.get<DashboardStatus>("/dashboard/status"),
};
