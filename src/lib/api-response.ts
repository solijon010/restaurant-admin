export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
  offset?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function extractArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!isRecord(payload)) return [];

  for (const key of ["data", "value", "items", "result", "results", "content"]) {
    if (Array.isArray(payload[key])) {
      return payload[key] as T[];
    }
  }

  return [];
}

export function extractObject<T>(payload: unknown): T | null {
  if (!payload) return null;
  if (!isRecord(payload)) return payload as T;

  for (const key of ["data", "value", "item", "result"]) {
    const nested = payload[key];
    if (nested && !Array.isArray(nested)) {
      return nested as T;
    }
  }

  return payload as T;
}

export function extractPaginated<T>(payload: unknown): PaginatedResult<T> {
  if (Array.isArray(payload)) {
    return { items: payload as T[], total: payload.length };
  }

  if (!isRecord(payload)) {
    return { items: [], total: 0 };
  }

  const items = extractArray<T>(payload);
  const total =
    Number(payload.total ?? payload.Total ?? payload.count ?? payload.Count) || items.length;
  const page = typeof payload.page === "number" ? payload.page : undefined;
  const limit = typeof payload.limit === "number" ? payload.limit : undefined;
  const offset =
    typeof payload.offset === "number"
      ? payload.offset
      : typeof payload.offcet === "number"
        ? payload.offcet
        : undefined;

  return { items, total, page, limit, offset };
}
