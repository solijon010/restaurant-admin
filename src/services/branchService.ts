import api from "@/lib/api";

export interface BranchPayload {
    name: string;
    addres: string;
    companyId?: string;
    kpi: number;
}

export interface BranchResponse {
    id: string;
    name: string;
    addres: string;
    companyId: string;
    kpi: number;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export const branchService = {
    getById: async (id: string): Promise<BranchResponse> => {
        const res = await api.get(`/branch/${id}`);
        return res.data;
    },
    getAll: async (): Promise<BranchResponse[]> => {
        const res = await api.get(`/branch/my`);
        return res.data;
    },
    create: async (data: BranchPayload): Promise<BranchResponse> => {
        const res = await api.post("/branch/", data);
        return res.data;
    },
    update: async (id: string, data: BranchPayload): Promise<BranchResponse> => {
        const res = await api.patch(`/branch/${id}`, data);
        return res.data;
    },
    toggleStatus: async (id: string): Promise<BranchResponse> => {
        const res = await api.patch(`/branch/sattus/${id}`);
        return res.data;
    },
    delete: async (id: string): Promise<void> => {
        await api.delete(`/branch/${id}`);
    },
};
