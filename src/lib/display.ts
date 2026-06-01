import type { UserRole } from "./auth";

export function formatPrice(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0);
  return `${amount.toLocaleString("uz-UZ")} so'm`;
}

export const roleLabels: Record<UserRole, string> = {
  SUPERADMIN: "Super Admin",
  MANAGER: "Menejer",
  AFITSANT: "Afitsant",
  SUPER_AFITSANT: "Super Afitsant",
  CHEF: "Oshpaz",
  KASSA: "Kassir",
};

export const statusLabels: Record<string, string> = {
  ACTIVE: "Faol",
  INACTIVE: "Nofaol",
  PENDING: "Kutilmoqda",
  SUCCESS: "Yakunlangan",
  CANCELED: "Bekor qilingan",
};
