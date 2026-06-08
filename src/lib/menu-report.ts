import { BranchOrder } from "@/lib/orders";
import { ProductRecord } from "@/services/productService";

export interface MenuCategoryRecord {
  id: string;
  name: string;
  status?: string;
}

export interface MenuReportGroup {
  id: string;
  label: string;
  dot: string;
  badge: string;
  aliases: string[];
  kind: "shashlik" | "birds";
}

export interface MenuTableStat {
  table: string;
  orderCount: number;
  quantity: number;
  sum: number;
}

export interface MenuGroupStat {
  id: string;
  label: string;
  dot: string;
  badge: string;
  orderCount: number;
  quantity: number;
  sum: number;
  tables: MenuTableStat[];
}

export type MenuGroupAssignments = Record<string, string>;

interface ProductMeta {
  id: string;
  normalizedName: string;
  normalizedCategoryName: string;
}

interface GroupLookup {
  byId: Map<string, string>;
  byName: Map<string, string>;
  ignoredIds: Set<string>;
}

export const SHASHLIK_REPORT_GROUPS: MenuReportGroup[] = [
  {
    id: "qiyma",
    label: "Qiyma shashlik",
    aliases: ["qiyma shashlik", "qiyma"],
    dot: "bg-orange-500",
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    kind: "shashlik",
  },
  {
    id: "gosht-shashlik",
    label: "Go'sht shashlik",
    aliases: ["go'sht shashlik", "gosht shashlik"],
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 border-red-200",
    kind: "shashlik",
  },
  {
    id: "qoy-shashlik",
    label: "Qo'y go'shtidan shashlik",
    aliases: ["qo'y go'shti shashlik", "qoy go'shti shashlik", "qo'y shashlik", "qoy shashlik"],
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    kind: "shashlik",
  },
];

export const BIRD_REPORT_GROUPS: MenuReportGroup[] = [
  {
    id: "qanot",
    label: "Qanot",
    aliases: ["qanot", "kanot", "kanotcha", "qanotcha"],
    dot: "bg-yellow-500",
    badge: "bg-yellow-50 text-yellow-700 border-yellow-200",
    kind: "birds",
  },
  {
    id: "ordak",
    label: "O'rdak",
    aliases: ["o'rdak", "ordak"],
    dot: "bg-lime-600",
    badge: "bg-lime-50 text-lime-700 border-lime-200",
    kind: "birds",
  },
];

function normalizeText(value?: string | null) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[‘’`´ʻʼ]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAlias(value: string, aliases: string[]) {
  return aliases.some((alias) => value.includes(normalizeText(alias)));
}

function isQiyma(meta: ProductMeta) {
  return includesAlias(meta.normalizedName, ["qiyma"]);
}

function isQoyShashlik(meta: ProductMeta) {
  return includesAlias(meta.normalizedName, ["qo'y", "qoy"]) && includesAlias(meta.normalizedName, ["shashlik"]);
}

function isShashlik(meta: ProductMeta) {
  return includesAlias(meta.normalizedName, ["shashlik"]) || includesAlias(meta.normalizedCategoryName, ["shashlik"]);
}

function resolveGroupId(meta: ProductMeta, group: MenuReportGroup) {
  if (group.id === "qiyma") {
    return isQiyma(meta);
  }

  if (group.id === "qoy-shashlik") {
    return isQoyShashlik(meta);
  }

  if (group.id === "gosht-shashlik") {
    return isShashlik(meta) && !isQiyma(meta) && !isQoyShashlik(meta);
  }

  return includesAlias(meta.normalizedName, group.aliases);
}

function buildLookup(
  products: ProductRecord[],
  categories: MenuCategoryRecord[],
  groups: MenuReportGroup[],
  assignments: MenuGroupAssignments = {},
): GroupLookup {
  const categoryMap = new Map(categories.map((category) => [category.id, normalizeText(category.name)]));
  const byId = new Map<string, string>();
  const byName = new Map<string, string>();
  const ignoredIds = new Set<string>();
  const groupIds = new Set(groups.map((group) => group.id));

  products.forEach((product) => {
    const meta: ProductMeta = {
      id: product.id,
      normalizedName: normalizeText(product.name),
      normalizedCategoryName: categoryMap.get(product.productCategoryId) ?? "",
    };

    if (Object.prototype.hasOwnProperty.call(assignments, product.id)) {
      const assignedGroupId = assignments[product.id];

      if (!assignedGroupId || !groupIds.has(assignedGroupId)) {
        ignoredIds.add(product.id);
        return;
      }

      byId.set(product.id, assignedGroupId);
      byName.set(meta.normalizedName, assignedGroupId);
      return;
    }

    const matchedGroup = groups.find((group) => resolveGroupId(meta, group));
    if (!matchedGroup) return;

    byId.set(product.id, matchedGroup.id);
    byName.set(meta.normalizedName, matchedGroup.id);
  });

  return { byId, byName, ignoredIds };
}

function resolveOrderItemGroup(
  item: BranchOrder["orderItem"][number],
  lookup: GroupLookup,
) {
  const productId = item.product?.id;
  if (productId && lookup.ignoredIds.has(productId)) {
    return null;
  }

  if (productId && lookup.byId.has(productId)) {
    return lookup.byId.get(productId) ?? null;
  }

  const normalizedName = normalizeText(item.product?.name);
  if (!normalizedName) return null;
  return lookup.byName.get(normalizedName) ?? null;
}

export function isTrackedMenuProduct(
  product: { id?: string; name?: string } | null | undefined,
  products: ProductRecord[],
  categories: MenuCategoryRecord[],
  assignments: MenuGroupAssignments = {},
) {
  if (!product) return false;
  const lookup = buildLookup(products, categories, [...SHASHLIK_REPORT_GROUPS, ...BIRD_REPORT_GROUPS], assignments);

  if (product.id && lookup.ignoredIds.has(product.id)) {
    return false;
  }

  if (product.id && lookup.byId.has(product.id)) {
    return true;
  }

  return lookup.byName.has(normalizeText(product.name));
}

export function buildSuggestedMenuAssignments(
  products: ProductRecord[],
  categories: MenuCategoryRecord[],
  groups: MenuReportGroup[],
): MenuGroupAssignments {
  const lookup = buildLookup(products, categories, groups);
  return Object.fromEntries(lookup.byId.entries());
}

export function buildMenuGroupStats(
  orders: BranchOrder[],
  products: ProductRecord[],
  categories: MenuCategoryRecord[],
  groups: MenuReportGroup[],
  assignments: MenuGroupAssignments = {},
): MenuGroupStat[] {
  const lookup = buildLookup(products, categories, groups, assignments);

  return groups.map((group) => {
    const tableMap = new Map<string, MenuTableStat>();
    let orderCount = 0;
    let quantity = 0;
    let sum = 0;

    orders.forEach((order) => {
      let orderQuantity = 0;
      let orderSum = 0;

      order.orderItem.forEach((item) => {
        const groupId = resolveOrderItemGroup(item, lookup);
        if (groupId !== group.id) return;

        const itemCount = Number(item.count ?? 0);
        const itemPrice = Number(item.product?.price ?? 0);

        orderQuantity += itemCount;
        orderSum += itemCount * itemPrice;
      });

      if (orderQuantity <= 0) return;

      const table = order.room?.name || "-";
      const current = tableMap.get(table) ?? { table, orderCount: 0, quantity: 0, sum: 0 };

      current.orderCount += 1;
      current.quantity += orderQuantity;
      current.sum += orderSum;

      tableMap.set(table, current);

      orderCount += 1;
      quantity += orderQuantity;
      sum += orderSum;
    });

    return {
      id: group.id,
      label: group.label,
      dot: group.dot,
      badge: group.badge,
      orderCount,
      quantity,
      sum,
      tables: Array.from(tableMap.values()).sort((left, right) => {
        if (right.orderCount !== left.orderCount) return right.orderCount - left.orderCount;
        if (right.quantity !== left.quantity) return right.quantity - left.quantity;
        return right.sum - left.sum;
      }),
    };
  });
}
