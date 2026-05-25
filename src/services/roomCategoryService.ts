import api from "@/lib/api";

export interface RoomCategoryPayload {
  name: string;
  branchId: string;
}

export interface RoomCategoryUpdatePayload {
  name: string;
}

export const roomCategoryService = {
  getByBranch: (branchId: string) =>
    api.get(`/room-category/all/${branchId}`),

  getAll: () => api.get("/room-category"),

  create: (data: RoomCategoryPayload) => api.post("/room-category", data),

  update: (id: string, data: RoomCategoryUpdatePayload) =>
    api.put(`/room-category/${id}`, data),

  toggleStatus: (id: string) => api.patch(`/room-category/satus/${id}`),

  delete: (id: string) => api.delete(`/room-category/${id}`),
};
