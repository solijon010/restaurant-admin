import { extractPaginated } from "@/lib/api-response";
import api from "@/lib/api";

export interface ProductRecord {
    id: string;
    name: string;
    desc: string;
    price: string | number;
    amount: number;
    unit: string;
    photo?: string | null;
    branchId: string;
    productCategoryId: string;
    kitchenId?: string | null;
    additionalInfo?: string[];
    status?: string;
}

export interface ProductBranchParams {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
}

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
    getByBranch: (branchId: string, params?: ProductBranchParams) =>
        api.get(`/product/all/manager/${branchId}`, {
            params: {
                page: params?.page ?? 1,
                limit: params?.limit ?? 10,
                ...(params?.search ? { search: params.search } : {}),
                ...(params?.categoryId ? { categoryId: params.categoryId } : {}),
            },
        }),

    getBranchPage: async (branchId: string, params?: ProductBranchParams) => {
        const response = await productService.getByBranch(branchId, params);
        return extractPaginated<ProductRecord>(response.data);
    },

    getAllByBranch: async (
        branchId: string,
        params: Omit<ProductBranchParams, "page"> = {},
        maxPages = 20,
    ) => {
        const limit = params.limit ?? 100;
        const items: ProductRecord[] = [];
        let total = 0;

        for (let page = 1; page <= maxPages; page += 1) {
            const result = await productService.getBranchPage(branchId, { ...params, page, limit });
            total = result.total;
            items.push(...result.items);

            if (result.items.length === 0 || result.items.length < limit || items.length >= total) {
                break;
            }
        }

        return { items, total };
    },


    getAll: () => api.get("/product/all"),

    create: (data: ProductPayload) => api.post("/product", data),

    update: (id: string, data: ProductUpdatePayload) =>
        api.patch(`/product/${id}`, data),

    toggleStatus: (id: string) => api.patch(`/product/status/${id}`),

    delete: (id: string) => api.delete(`/product/${id}`),
};
