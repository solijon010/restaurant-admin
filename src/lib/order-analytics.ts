import { BranchOrder, getOrderTotal } from "@/lib/orders";

export type AnalyticsFilter = "today" | "yesterday" | "last7" | "last30" | "custom";

export interface RevenuePoint {
  date: string;
  revenue: number;
  expense: number;
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function yesterdayStr() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

function formatShortDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
  });
}

function shiftDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(base.getDate() + days);
  return next;
}

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getFilterBounds(filter: AnalyticsFilter, from?: string, to?: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (filter === "today") {
    const value = toDateString(today);
    return { start: value, end: value };
  }

  if (filter === "yesterday") {
    const value = toDateString(shiftDays(today, -1));
    return { start: value, end: value };
  }

  if (filter === "last7") {
    return { start: toDateString(shiftDays(today, -6)), end: toDateString(today) };
  }

  if (filter === "last30") {
    return { start: toDateString(shiftDays(today, -29)), end: toDateString(today) };
  }

  if (!from || !to) return null;
  return { start: from, end: to };
}

export function filterOrdersByDate(orders: BranchOrder[], date: string) {
  return orders.filter((order) => order.createdAt?.slice(0, 10) === date);
}

export function filterOrdersByRange(orders: BranchOrder[], start: string, end: string) {
  return orders.filter((order) => {
    const date = order.createdAt?.slice(0, 10);
    return !!date && date >= start && date <= end;
  });
}

export function summarizeOrders(orders: BranchOrder[]) {
  const successfulOrders = orders.filter((order) => order.status === "SUCCESS");
  const totalRevenue = successfulOrders.reduce((sum, order) => sum + getOrderTotal(order), 0);
  const totalOrders = successfulOrders.length;

  return {
    successfulOrders,
    totalOrders,
    totalRevenue,
    averageOrder: totalOrders > 0 ? totalRevenue / totalOrders : 0,
  };
}

export function buildRevenueSeries(orders: BranchOrder[], start: string, end: string) {
  const values = new Map<string, number>();
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);

  for (let cursor = new Date(startDate); cursor <= endDate; cursor = shiftDays(cursor, 1)) {
    values.set(toDateString(cursor), 0);
  }

  orders
    .filter((order) => order.status === "SUCCESS")
    .forEach((order) => {
      const key = order.createdAt?.slice(0, 10);
      if (!key || !values.has(key)) return;
      values.set(key, (values.get(key) ?? 0) + getOrderTotal(order));
    });

  return Array.from(values.entries()).map(([date, revenue]) => ({
    date: formatShortDate(date),
    revenue,
    expense: 0,
  })) as RevenuePoint[];
}
