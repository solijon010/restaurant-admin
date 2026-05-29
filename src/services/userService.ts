import api from "@/lib/api";

// ========== STAFF (Xodimlar) ==========
export interface StaffPayload {
    firstName: string;
    lastName: string;
    phoneNumer: string; // ✅ Backend typo: "phoneNumer" (not "phoneNumber")
    password: string;
    role: "MANAGER" | "AFITSANT" | "CHEF" | "KASSA" | "SUPER_AFITSANT";
    branchId: string;
    salary: number;
    pinCode?: string; // 4 xonali PIN kod (afitsant ilovasi uchun)
}

export interface StaffUpdatePayload {
    firstName?: string;
    lastName?: string;
    phoneNumer?: string;
    password?: string;
    salary?: number;
    pinCode?: string; // 4 xonali PIN kod yangilash
}

// ========== MANAGER ==========
export interface ManagerPayload {
    firstName: string;
    lastName: string;
    phoneNumer: string; // backend shu nomni kutadi
    password: string;
    companyId: string;
    branchId?: string | null;
}

// Manager update uchun alohida payload
export interface ManagerUpdatePayload {
    firstName: string;
    lastName: string;
    phoneNumer: string;
    password: string;
}

// ========== USER RESPONSE ==========
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
    pinCode?: string; // backend qo'shgandan keyin to'ldiriladi
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

export const userService = {
    // ========== STAFF METHODS ==========

    // Barcha xodimlarni olish
    getAll: () => api.get("/user"),

    // Filial bo'yicha xodimlarni olish (faqat branchId)
    getStaffByBranch: (branchId: string) => api.get(`/user/my/${branchId}`),

    // Xodim yaratish
    createStaff: (data: StaffPayload) => api.post("/user", data),

    // Xodim tahrirlash
    update: (id: string, data: StaffUpdatePayload) =>
        api.patch(`/user/${id}`, data),

    // Xodim o'chirish
    delete: (id: string) => api.delete(`/user/${id}`),

    // Status toggle
    toggleStatus: (id: string) => api.patch(`/user/status/${id}`),

    // ========== MANAGER METHODS ==========

    // Managers olish
    getManagers: (params?: { status?: string }) => {
        const query: Record<string, string> = { ...params };
        if (!query.status) delete query.status;
        // to'g'ri endpoint – managaer (backend typo)
        return api.get("/user/managaer", { params: query });
    },

    // Manager yaratish
    createManager: (data: ManagerPayload) => api.post("/user/manager", data),

    // Manager tahrirlash
    updateManager: (id: string, data: ManagerUpdatePayload) =>
        api.patch(`/user/manager/${id}`, data),

    // Manager o'chirish
    deleteManager: (id: string) => api.delete(`/user/manager/${id}`),
};
