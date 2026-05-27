import api from "@/lib/api";

export interface CategoryPayload {
  name: string;
  branchId: string;
}

export interface CategoryUpdatePayload {
  name: string;
}

export const categoryService = {
  getByBranch: (branchId: string) =>
    api.get(`/category/all/manager/${branchId}`),

  getAll: () => api.get("/category/all"),

  create: (data: CategoryPayload) => api.post("/category", data),

  update: (id: string, data: CategoryUpdatePayload) =>
    api.patch(`/category/${id}`, data),

  toggleStatus: (id: string) => api.patch(`/category/status/${id}`),

  delete: (id: string) => api.delete(`/category/${id}`),
};
