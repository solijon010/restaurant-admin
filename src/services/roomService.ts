import api from "@/lib/api";

export interface RoomPayload {
  name: string;
  price: number;
  branchId: string;
  roomCategoryId: string;
}

export interface RoomUpdatePayload {
  name?: string;
  price?: number;
  roomCategoryId?: string;
}

export const roomService = {
  getByBranch: (branchId: string) => api.get(`/room/all/${branchId}`),

  getAll: () => api.get("/room/all"),

  create: (data: RoomPayload) => api.post("/room", data),

  update: (id: string, data: RoomUpdatePayload) => api.put(`/room/${id}`, data),

  toggleStatus: (id: string) => api.patch(`/room/status/${id}`),

  delete: (id: string) => api.delete(`/room/${id}`),
};
