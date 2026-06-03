import api from "@/lib/api";
import { extractPaginated } from "@/lib/api-response";

export type OrderStatus = "SUCCESS" | "CANCELED" | "PENDING";

export interface OrderProduct {
  id?: string;
  name?: string;
  price: string | number;
  unit?: string;
}

export interface BranchOrderItem {
  id: string;
  count: string | number;
  status?: string;
  product: OrderProduct;
}

export interface BranchOrderRoom {
  id?: string;
  name: string;
}

export interface BranchOrderUser {
  id?: string;
  firstName: string;
  lastName: string;
  phoneNumer: string;
  role?: string;
}

export interface BranchOrder {
  id: string;
  status: OrderStatus;
  type: string;
  createdAt: string;
  endAt: string | null;
  orderItem: BranchOrderItem[];
  room: BranchOrderRoom;
  user: BranchOrderUser;
}

export interface BranchOrdersQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export async function getBranchOrdersPage(
  branchId: string,
  params: BranchOrdersQuery = {},
) {
  const response = await api.get(`/order/branch/${branchId}`, { params });
  return extractPaginated<BranchOrder>(response.data);
}

export async function getAllBranchOrders(
  branchId: string,
  params: Omit<BranchOrdersQuery, "page"> = {},
  maxPages = 50,
) {
  const limit = params.limit ?? 100;
  const items: BranchOrder[] = [];
  let total = 0;

  for (let page = 1; page <= maxPages; page += 1) {
    const result = await getBranchOrdersPage(branchId, { ...params, page, limit });
    total = result.total;
    items.push(...result.items);

    if (result.items.length === 0 || result.items.length < limit || items.length >= total) {
      break;
    }
  }

  return { items, total };
}

export function getOrderTotal(order: Pick<BranchOrder, "orderItem">) {
  return order.orderItem.reduce(
    (sum, item) => sum + Number(item.product?.price ?? 0) * Number(item.count ?? 0),
    0,
  );
}
