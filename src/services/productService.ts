import api from "@/lib/api";

export interface ProductPayload {
    name: string;
    desc: string;
    price: number;
    amount: number;
    unit: string;
    branchId: string;
    productCategoryId: string;
    kitchenId?: string;
}

export interface ProductUpdatePayload {
    name?: string;
    desc?: string;
    price?: number;
    productCategoryId?: string;
    kitchenId?: string;
}

export const productService = {
    getByBranch: (branchId: string, params?: { page?: number; limit?: number; search?: string; categoryId?: string; }) =>
        api.get(`/product/all/manager/${branchId}`, {
            params: {
                page: params?.page ?? 1,
                limit: params?.limit ?? 10,
                ...(params?.search ? { search: params.search } : {}),
                ...(params?.categoryId ? { categoryId: params.categoryId } : {}),
            },
        }),


    getAll: () => api.get("/product/all"),

    create: (data: ProductPayload) => api.post("/product", data),

    update: (id: string, data: ProductUpdatePayload) =>
        api.patch(`/product/${id}`, data),

    toggleStatus: (id: string) => api.patch(`/product/status/${id}`),

    delete: (id: string) => api.delete(`/product/${id}`),
};
