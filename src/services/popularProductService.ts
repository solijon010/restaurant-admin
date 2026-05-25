import api from "@/lib/api";

export interface PopularProductPayload {
  productId: string;
  branchId: string;
}

export interface PopularProductResponse {
  id: string;
  productId: string;
  branchId: string;
  createdAt?: string;
}

export const popularProductService = {
  // Filial bo'yicha tezkor mahsulotlarni olish
  getByBranch: (branchId: string) =>
    api.get(`/popular-products/all/manager/${branchId}`),

  // Barcha tezkor mahsulotlarni olish
  getAll: () => api.get("/popular-products"),

  // Yangi tezkor mahsulot qo'shish
  create: (data: PopularProductPayload) => api.post("/popular-products", data),

  // Tezkor mahsulotni o'chirish
  delete: (id: string) => api.delete(`/popular-products/${id}`),
};
