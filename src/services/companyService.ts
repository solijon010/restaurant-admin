// companyService.ts
import api from "@/lib/api";

export interface CompanyPayload {
  name: string;
  phone: string;
  founderName: string;
  bio?: string;
  logo?: File | null;
}

export interface Company {
  id: string;
  name: string;
  phone: string;
  founderName: string;
  bio?: string | null;
  logo?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const companyService = {
  // Get all companies (SUPERADMIN)
  getAll: (): Promise<{ data: Company[] }> => api.get("/company/all"),

  // Get my company (SUPERADMIN, MANAGER)
  getMy: (): Promise<{ data: Company }> => api.get("/company/my"),

  // Get company by ID (SUPERADMIN)
  getById: (id: string): Promise<{ data: Company }> =>
    api.get(`/company/${id}`),

  // Create company (SUPERADMIN)
  create: (data: CompanyPayload): Promise<{ data: Company }> => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("phone", data.phone);
    formData.append("founderName", data.founderName);
    formData.append("bio", data.bio ?? ""); // optional, send empty string if undefined
    if (data.logo) formData.append("logo", data.logo);

    return api.post("/company", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Update company (SUPERADMIN)
  update: (
    id: string,
    data: Partial<CompanyPayload>
  ): Promise<{ data: Company }> => {
    const formData = new FormData();
    if (data.name) formData.append("name", data.name);
    if (data.phone) formData.append("phone", data.phone);
    if (data.founderName) formData.append("founderName", data.founderName);
    formData.append("bio", data.bio ?? ""); // send empty string if undefined
    if (data.logo) formData.append("logo", data.logo);

    return api.patch(`/company/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Delete company (SUPERADMIN)
  delete: (id: string): Promise<{ data: { message: string } }> =>
    api.delete(`/company/${id}`),
};
