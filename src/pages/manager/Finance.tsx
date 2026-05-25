import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { formatPrice } from "@/lib/mock-data";
import { Loader2, Users, Wallet, Search, GitBranch, Calendar } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface BranchResponse { id: string; name: string; status: string; }
interface WaiterFinance { id: string; firstName: string; lastName: string; phoneNumer: string; totalOrders: number; totalSum: number; totalKpi: number; }
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
    const { branches, branchesLoading, selectedBranchId, setSelectedBranchId } = useBranch();
    const [detailWaiter, setDetailWaiter] = useState<WaiterFinance | null>(null);

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

    const totalKpi = waitersList.reduce((s, w) => s + (w.totalKpi || 0), 0);
    const totalOrders = waitersList.reduce((s, w) => s + (w.totalOrders || 0), 0);

    return (
        <div className="space-y-6">

            {/* ── Header ────────────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Moliya</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Xodimlar bo'yicha moliyaviy hisobot</p>
                </div>

                {/* Branch — global, o'ng tomonda */}
                <div className="flex items-center gap-2 shrink-0">
                    <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground hidden sm:inline">Filial:</span>
                    {branchesLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                        <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                            <SelectTrigger className="w-44 h-9">
                                <SelectValue placeholder="Tanlang" />
                            </SelectTrigger>
                            <SelectContent>
                                {branches.map((b) => (
                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            {/* ── Waiters ────────────────────────────────────────────────────────── */}
            <div className="mt-2">
                    <Card>
                        {/* ── Filter bar ─────────────────────────────────────────────── */}
                        <div className="p-4 border-b border-border space-y-3">
                            {/* Row 1: search + time buttons */}
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Search */}
                                <div className="relative w-52">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                    <Input
                                        placeholder="Afitsant qidirish..."
                                        value={waiterSearch}
                                        onChange={(e) => setWaiterSearch(e.target.value)}
                                        className="pl-8 h-9"
                                    />
                                </div>

                                {/* Divider */}
                                <div className="w-px h-6 bg-border hidden sm:block" />

                                {/* Time type buttons */}
                                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                                    {TIME_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setTimeType(opt.value)}
                                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${timeType === opt.value
                                                    ? "bg-background text-foreground shadow-sm"
                                                    : "text-muted-foreground hover:text-foreground"
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Loading */}
                                {waitersLoading && (
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-auto" />
                                )}

                                {/* Summary — o'ng tomonda */}
                                {!waitersLoading && waitersList.length > 0 && (
                                    <div className="ml-auto flex items-center gap-4 text-sm">
                                        <span className="text-muted-foreground">
                                            Jami buyurtma: <span className="font-semibold text-foreground">{totalOrders}</span>
                                        </span>
                                        <span className="text-muted-foreground">
                                            Jami KPI: <span className="font-semibold text-green-600">{formatPrice(totalKpi)}</span>
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Row 2: custom date range — faqat "Boshqa" tanlanganda */}
                            {timeType === "custom" && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <Input
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                        className="w-40 h-9"
                                        placeholder="Dan"
                                    />
                                    <span className="text-muted-foreground text-sm">—</span>
                                    <Input
                                        type="date"
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                        className="w-40 h-9"
                                        placeholder="Gacha"
                                    />
                                    {(!fromDate || !toDate) && (
                                        <span className="text-xs text-amber-600">
                                            Ikkala sanani ham tanlang
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ── Table ──────────────────────────────────────────────────── */}
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ism</TableHead>
                                    <TableHead>Telefon</TableHead>
                                    <TableHead>Buyurtmalar</TableHead>
                                    <TableHead>Jami summa</TableHead>
                                    <TableHead>KPI (ulush)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {waitersLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10">
                                            <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : timeType === "custom" && (!fromDate || !toDate) ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                                            Sana oralig'ini tanlang
                                        </TableCell>
                                    </TableRow>
                                ) : waitersList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                                            {waiterSearch ? "Qidiruv bo'yicha natija topilmadi" : "Ma'lumot topilmadi"}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    waitersList.map((w) => (
                                        <TableRow key={w.id}>
                                            <TableCell className="font-medium">{w.firstName} {w.lastName}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm">{w.phoneNumer}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{w.totalOrders} ta</Badge>
                                            </TableCell>
                                            <TableCell className="font-semibold">{formatPrice(w.totalSum)}</TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 rounded-md px-2 py-0.5 text-sm font-semibold">
                                                    <Wallet className="h-3 w-3" />
                                                    {formatPrice(w.totalKpi)}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>
            </div>
        </div>
    );
}
