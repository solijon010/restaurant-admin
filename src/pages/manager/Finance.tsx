import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { useBranch } from "@/contexts/BranchContext";
import api from "@/lib/api";
import { formatPrice } from "@/lib/display";
import { Loader2, Search, Calendar, Wallet, TrendingUp, ShoppingBag } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface WaiterFinance { id: string; firstName: string; lastName: string; totalOrders: number; totalSum: number; }
type TimeType = "today" | "weekly" | "monthly" | "custom";

const TIME_OPTIONS: { value: TimeType; label: string }[] = [
    { value: "today", label: "Bugun" },
    { value: "weekly", label: "Haftalik" },
    { value: "monthly", label: "Oylik" },
    { value: "custom", label: "Boshqa" },
];


function toArray<T>(raw: unknown): T[] {
    if (Array.isArray(raw)) return raw as T[];
    if (raw && typeof raw === "object") {
        const obj = raw as Record<string, unknown>;
        for (const key of ["data", "items", "result", "results", "content"]) {
            if (Array.isArray(obj[key])) return obj[key] as T[];
        }
    }
    return [];
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function Finance() {
    const { selectedBranchId } = useBranch();

    // Waiter filters
    const [waiterSearch, setWaiterSearch] = useState("");
    const [timeType, setTimeType] = useState<TimeType>("today");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    // Build query params
    const waiterQueryKey = ["waiters-finance", selectedBranchId, waiterSearch, timeType, fromDate, toDate];

    const { data: waitersRaw, isLoading: waitersLoading } = useQuery({
        queryKey: waiterQueryKey,
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set("timeType", timeType);
            if (waiterSearch) params.set("search", waiterSearch);
            if (timeType === "custom" && fromDate) params.set("fromDate", fromDate);
            if (timeType === "custom" && toDate) params.set("toDate", toDate);

            const res = await api.get(`/user/waiters/finance/${selectedBranchId}?${params.toString()}`);
            return res.data;
        },
        enabled: !!selectedBranchId && (timeType !== "custom" || (!!fromDate && !!toDate)),
    });
    const waitersList = toArray<WaiterFinance>(waitersRaw);

    const totalOrders = waitersList.reduce((s, w) => s + (w.totalOrders || 0), 0);
    const totalSum = waitersList.reduce((s, w) => s + (w.totalSum || 0), 0);

  const timeButtonStyles: Record<TimeType, string> = {
    today: "bg-emerald-500 text-white shadow-sm",
    weekly: "bg-emerald-500 text-white shadow-sm",
    monthly: "bg-emerald-500 text-white shadow-sm",
    custom: "bg-slate-500 text-white shadow-sm",
  };
  const timeButtonInactive = "text-muted-foreground hover:text-foreground hover:bg-muted";

    return (
        <div className="space-y-6">

            {/* ── Header ────────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                        <Wallet className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground leading-tight">Ofitsiant hisoboti</h2>
                        <p className="text-xs text-muted-foreground">Afitsantlar bo'yicha moliyaviy hisobot</p>
                    </div>
                </div>
                {waitersLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>

            {/* ── Summary mini-cards ────────────────────────────────────────────── */}
            {!waitersLoading && waitersList.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                            <ShoppingBag className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Jami buyurtma</p>
                            <p className="text-lg font-bold text-emerald-700">{totalOrders}</p>
                        </div>
                    </div>
                    <div className="p-3 rounded-xl bg-green-50 border border-green-100 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Jami summa</p>
                            <p className="text-lg font-bold text-green-700">{formatPrice(totalSum)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Waiters ────────────────────────────────────────────────────────── */}
            <Card className="shadow-sm border border-border/60 rounded-2xl overflow-hidden">
                {/* ── Filter bar ─────────────────────────────────────────────── */}
                <div className="bg-muted/40 rounded-2xl p-3 m-3 mb-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Search */}
                        <div className="relative w-52">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder="Afitsant qidirish..."
                                value={waiterSearch}
                                onChange={(e) => setWaiterSearch(e.target.value)}
                                className="pl-8 h-9 bg-background"
                            />
                        </div>

                        {/* Time type pill buttons */}
                        <div className="flex items-center gap-1 bg-background rounded-xl p-1 border border-border/60">
                            {TIME_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setTimeType(opt.value)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${timeType === opt.value ? timeButtonStyles[opt.value] : timeButtonInactive}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom date range */}
                    {timeType === "custom" && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                            <Input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="w-40 h-9 bg-background"
                            />
                            <span className="text-muted-foreground text-sm">—</span>
                            <Input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="w-40 h-9 bg-background"
                            />
                            {(!fromDate || !toDate) && (
                                <span className="text-xs text-amber-600">Ikkala sanani ham tanlang</span>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Table ──────────────────────────────────────────────────── */}
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/50">
                            <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">#</TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ism</TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Buyurtmalar</TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Jami summa</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {waitersLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-12">
                                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : timeType === "custom" && (!fromDate || !toDate) ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-12">
                                    <div className="flex flex-col items-center gap-2">
                                        <Calendar className="h-10 w-10 text-muted-foreground opacity-20" />
                                        <p className="text-muted-foreground text-sm">Sana oralig'ini tanlang</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : waitersList.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-12">
                                    <div className="flex flex-col items-center gap-2">
                                        <Wallet className="h-10 w-10 text-muted-foreground opacity-20" />
                                        <p className="text-muted-foreground text-sm">{waiterSearch ? "Qidiruv bo'yicha natija topilmadi" : "Ma'lumot topilmadi"}</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            waitersList.map((w, idx) => (
                                <TableRow key={w.id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                                    <TableCell className="text-muted-foreground text-sm w-10">{idx + 1}</TableCell>
                                    <TableCell className="font-medium">{w.firstName} {w.lastName}</TableCell>
                                    <TableCell>
                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                                            {w.totalOrders} ta
                                        </span>
                                    </TableCell>
                                    <TableCell className="font-semibold text-green-700">{formatPrice(w.totalSum)}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
