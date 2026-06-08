import api from "@/lib/api";
import { DashboardFilter } from "@/services/dashboardService";

export interface StaffPayload {
    firstName: string;
    lastName: string;
    phoneNumer: string;
    password: string;
    role: "MANAGER" | "AFITSANT" | "CHEF" | "KASSA" | "SUPER_AFITSANT";
    branchId: string;
    salary: number;
    pinCode?: string;
}

export interface StaffUpdatePayload {
    firstName?: string;
    lastName?: string;
    phoneNumer?: string;
    password?: string;
    salary?: number;
    pinCode?: string;
}

export interface ManagerPayload {
    firstName: string;
    lastName: string;
    phoneNumer: string;
    password: string;
    companyId: string;
    branchId?: string | null;
}

export interface ManagerUpdatePayload {
    firstName?: string;
    lastName?: string;
    phoneNumer?: string;
    password?: string;
}

export interface UserResponse {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumer: string;
    role: string;
    branchId: string;
    companyId: string;
    status: string;
    salary?: number;
    pinCode?: string;
    createdAt: string;
    updatedAt: string;
}

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    companyId?: string;
    branchId?: string;
    status: "ACTIVE" | "INACTIVE";
    role: "SUPERADMIN" | "MANAGER" | "EMPLOYEE";
}

export interface ManagerListParams {
    status?: "ACTIVE" | "INACTIVE";
    search?: string;
    offcet?: number;
    limit?: number;
}

export interface WaiterInfoItem {
    waiterId: string;
    fullName: string;
    salary: string | number;
    totalOrders: number;
    totalSum: number;
    kpiPercent: number;
    kpiAmount: number;
}

export interface WaiterInfoResponse {
    filter: DashboardFilter;
    from: string;
    to: string;
    totalWaiters: number;
    data: WaiterInfoItem[];
}

export interface WaiterInfoParams {
    filter: DashboardFilter;
    from?: string;
    to?: string;
}

export const userService = {
    getAll: () => api.get("/user"),

    getStaffByBranch: (branchId: string) => api.get(`/user/my/${branchId}`),

    createStaff: (data: StaffPayload) => api.post("/user", data),

    update: (id: string, data: StaffUpdatePayload) =>
        api.patch(`/user/${id}`, data),

    delete: (id: string) => api.delete(`/user/${id}`),

    toggleStatus: (id: string) => api.patch(`/user/status/${id}`),

    getManagers: (params?: ManagerListParams) => {
        const query = Object.fromEntries(
            Object.entries(params ?? {}).filter(([, value]) => value !== undefined && value !== "")
        );
        return api.get("/user/managaer", { params: query });
    },

    createManager: (data: ManagerPayload) => api.post("/user/manager", data),

    updateManager: (id: string, data: ManagerUpdatePayload) =>
        api.patch(`/user/manager/${id}`, data),

    deleteManager: (id: string) => api.delete(`/user/manager/${id}`),

    getWaiterInfo: (branchId: string, params: WaiterInfoParams) =>
        api.get<WaiterInfoResponse>(`/user/waiter/info/${branchId}`, {
            params: {
                filter: params.filter,
                ...(params.filter === "custom" && params.from ? { from: params.from } : {}),
                ...(params.filter === "custom" && params.to ? { to: params.to } : {}),
            },
        }),
};
