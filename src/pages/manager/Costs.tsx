import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBranch } from "@/contexts/BranchContext";
import api from "@/lib/api";
import { formatPrice } from "@/lib/mock-data";
import {
    Loader2, Plus, Search, GitBranch, Tag, Layers,
    ChevronLeft, ChevronRight, Calendar, MoreVertical, Pencil,
} from "lucide-react";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface CostCategory {
    id: string; name: string; branchId: string;
    status: string; createdAt: string; updatedAt: string;
    cost: unknown[];
}
interface CostCategoryResponse { totalCost: number; data: CostCategory[]; }

interface CostsCategory {
    id: string; name: string; branchId: string; status: string;
    createdAt: string; updatedAt: string;
}
interface Cost {
    id: string; name: string; desc: string;
    quantity: number; costAmount: string;
    branchId: string; costsCategoryId: string;
    createdAt: string; updatedAt: string;
    costsCategory?: CostsCategory;
}
interface CostResponse { totalExpense: number; data: Cost[]; total?: number; }

type TimeFilter = "yesterday" | "today" | "last7" | "last30" | "custom";

const TIME_OPTIONS: { value: TimeFilter; label: string }[] = [
    { value: "today", label: "Bugun" },
    { value: "yesterday", label: "Kecha" },
    { value: "last7", label: "7 kun" },
    { value: "last30", label: "30 kun" },
    { value: "custom", label: "Boshqa" },
];

const LIMIT = 10;

// ─── Services ──────────────────────────────────────────────────────────────────
const catService = {
    getAll: (branchId: string, search?: string) => {
        const q = search ? `?search=${search}` : "";
        return api.get<CostCategoryResponse>(`/cost-category/${branchId}${q}`);
    },
    create: (data: { name: string; branchId: string }) =>
        api.post<CostCategory>("/cost-category", data),
    update: (id: string, name: string) =>
        api.patch<CostCategory>(`/cost-category/${id}`, { name }),
};

const costService = {
    getAll: (branchId: string, params: Record<string, string>) => {
        const q = new URLSearchParams(params).toString();
        return api.get<CostResponse>(`/cost/${branchId}${q ? `?${q}` : ""}`);
    },
    create: (data: {
        name: string; desc: string; quantity: number;
        costAmount: string; branchId: string; costsCategoryId: string;
    }) => api.post<Cost>("/cost", data),
    update: (id: string, data: Partial<{
        name: string; desc: string; quantity: number;
        costAmount: string; costsCategoryId: string;
    }>) => api.patch<Cost>(`/cost/${id}`, data),
};

// ─── Component ─────────────────────────────────────────────────────────────────
export default function Xarajatlar() {
    const queryClient = useQueryClient();
    const { branches, branchesLoading, selectedBranchId, setSelectedBranchId } = useBranch();
    const [activeTab, setActiveTab] = useState("costs");

    // ── Category state
    const [catSearch, setCatSearch] = useState("");
    const [catDialog, setCatDialog] = useState(false);
    const [catEdit, setCatEdit] = useState<CostCategory | null>(null);
    const [catName, setCatName] = useState("");

    // ── Cost filters
    const [costSearch, setCostSearch] = useState("");
    const [timeFilter, setTimeFilter] = useState<TimeFilter>("today");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [catIdFilter, setCatIdFilter] = useState("ALL");
    const [page, setPage] = useState(1);

    // ── Cost CRUD state
    const [costDialog, setCostDialog] = useState(false);
    const [costEdit, setCostEdit] = useState<Cost | null>(null);
    const [costForm, setCostForm] = useState({
        name: "", desc: "", quantity: "1", costAmount: "", costsCategoryId: "",
    });

    // reset page on filter change
    useEffect(() => { setPage(1); }, [costSearch, timeFilter, fromDate, toDate, catIdFilter, selectedBranchId]);

    // ── Category query
    const catQK = ["cost-categories", selectedBranchId, catSearch];
    const { data: catRes, isLoading: catsLoading } = useQuery({
        queryKey: catQK,
        queryFn: () => catService.getAll(selectedBranchId, catSearch).then((r) => r.data),
        enabled: !!selectedBranchId,
    });
    const categories: CostCategory[] = catRes?.data ?? [];

    // ── Cost query
    const isCustom = timeFilter === "custom";
    const canFetch = !!selectedBranchId && (!isCustom || (!!fromDate && !!toDate));

    const buildCostParams = (): Record<string, string> => {
        const p: Record<string, string> = {
            filter: timeFilter,
            page: String(page),
            limit: String(LIMIT),
        };
        if (costSearch) p.search = costSearch;
        if (catIdFilter !== "ALL") p.costsCategoryId = catIdFilter;
        if (isCustom && fromDate) p.from = fromDate;
        if (isCustom && toDate) p.to = toDate;
        return p;
    };

    const costQK = ["costs", selectedBranchId, costSearch, timeFilter, fromDate, toDate, catIdFilter, page];
    const { data: costRes, isLoading: costsLoading } = useQuery({
        queryKey: costQK,
        queryFn: () => costService.getAll(selectedBranchId, buildCostParams()).then((r) => r.data),
        enabled: canFetch,
    });
    const costs: Cost[] = costRes?.data ?? [];
    const totalExpense: number = costRes?.totalExpense ?? 0;
    const totalCount: number = costRes?.total ?? costs.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / LIMIT));

    // ── Category mutations
    const catCreateMut = useMutation({
        mutationFn: (name: string) => catService.create({ name, branchId: selectedBranchId }),
        onSuccess: (res) => {
            queryClient.setQueryData(catQK, (old: CostCategoryResponse | undefined) => ({
                totalCost: old?.totalCost ?? 0,
                data: [...(old?.data ?? []), res.data],
            }));
            toast.success("Kategoriya yaratildi");
            setCatDialog(false);
        },
        onError: () => toast.error("Xatolik yuz berdi"),
    });

    const catUpdateMut = useMutation({
        mutationFn: ({ id, name }: { id: string; name: string }) => catService.update(id, name),
        onSuccess: (res) => {
            queryClient.setQueryData(catQK, (old: CostCategoryResponse | undefined) => ({
                totalCost: old?.totalCost ?? 0,
                data: (old?.data ?? []).map((c) => c.id === res.data.id ? { ...c, ...res.data } : c),
            }));
            toast.success("Kategoriya yangilandi");
            setCatDialog(false);
        },
        onError: () => toast.error("Xatolik yuz berdi"),
    });

    // ── Cost mutations
    const costCreateMut = useMutation({
        mutationFn: () => costService.create({
            name: costForm.name, desc: costForm.desc,
            quantity: Number(costForm.quantity) || 1,
            costAmount: costForm.costAmount,
            branchId: selectedBranchId,
            costsCategoryId: costForm.costsCategoryId,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["costs", selectedBranchId] });
            toast.success("Xarajat qo'shildi");
            setCostDialog(false);
        },
        onError: () => toast.error("Xatolik yuz berdi"),
    });

    const costUpdateMut = useMutation({
        mutationFn: () => costService.update(costEdit!.id, {
            name: costForm.name, desc: costForm.desc,
            quantity: Number(costForm.quantity) || 1,
            costAmount: costForm.costAmount,
            costsCategoryId: costForm.costsCategoryId,
        }),
        onSuccess: (res) => {
            queryClient.setQueryData(costQK, (old: CostResponse | undefined) => ({
                totalExpense: old?.totalExpense ?? 0,
                total: old?.total,
                data: (old?.data ?? []).map((c) => c.id === res.data.id ? { ...c, ...res.data } : c),
            }));
            toast.success("Xarajat yangilandi");
            setCostDialog(false);
        },
        onError: () => toast.error("Xatolik yuz berdi"),
    });

    // ── Handlers
    const openAddCat = () => { setCatEdit(null); setCatName(""); setCatDialog(true); };
    const openEditCat = (c: CostCategory) => { setCatEdit(c); setCatName(c.name); setCatDialog(true); };
    const saveCat = () => {
        if (!catName.trim()) return toast.error("Nom kiriting");
        if (catEdit) { catUpdateMut.mutate({ id: catEdit.id, name: catName.trim() }); } else { catCreateMut.mutate(catName.trim()); }
    };

    const openAddCost = () => {
        setCostEdit(null);
        setCostForm({ name: "", desc: "", quantity: "1", costAmount: "", costsCategoryId: categories[0]?.id ?? "" });
        setCostDialog(true);
    };
    const openEditCost = (c: Cost) => {
        setCostEdit(c);
        setCostForm({ name: c.name, desc: c.desc, quantity: String(c.quantity), costAmount: c.costAmount, costsCategoryId: c.costsCategoryId });
        setCostDialog(true);
    };
    const saveCost = () => {
        if (!costForm.name.trim()) return toast.error("Nom kiriting");
        if (!costForm.costAmount) return toast.error("Summa kiriting");
        if (!costForm.costsCategoryId) return toast.error("Kategoriya tanlang");
        if (costEdit) { costUpdateMut.mutate(); } else { costCreateMut.mutate(); }
    };

    const isCatSaving = catCreateMut.isPending || catUpdateMut.isPending;
    const isCostSaving = costCreateMut.isPending || costUpdateMut.isPending;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Xarajatlar</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Xarajat kategoriyalari va hisobotlar</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground hidden sm:inline">Filial:</span>
                    {branchesLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : (
                        <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                            <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Tanlang" /></SelectTrigger>
                            <SelectContent>
                                {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="costs" className="gap-1.5">
                        <Layers className="h-3.5 w-3.5" />
                        Xarajatlar
                        {totalCount > 0 && <Badge variant="secondary" className="ml-0.5 px-1.5 text-xs">{totalCount}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="categories" className="gap-1.5">
                        <Tag className="h-3.5 w-3.5" />
                        Kategoriyalar
                        {categories.length > 0 && <Badge variant="secondary" className="ml-0.5 px-1.5 text-xs">{categories.length}</Badge>}
                    </TabsTrigger>
                </TabsList>

                {/* ══ COSTS ══════════════════════════════════════════════════════ */}
                <TabsContent value="costs" className="mt-4">
                    <Card>
                        <div className="p-4 border-b border-border space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative w-52">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                    <Input placeholder="Qidirish..." value={costSearch}
                                        onChange={(e) => setCostSearch(e.target.value)} className="pl-8 h-9" />
                                </div>

                                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                                    {TIME_OPTIONS.map((opt) => (
                                        <button key={opt.value} onClick={() => setTimeFilter(opt.value)}
                                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${timeFilter === opt.value
                                                    ? "bg-background text-foreground shadow-sm"
                                                    : "text-muted-foreground hover:text-foreground"
                                                }`}>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>

                                <Select value={catIdFilter} onValueChange={setCatIdFilter}>
                                    <SelectTrigger className="w-44 h-9">
                                        <SelectValue placeholder="Barcha kategoriya" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Barcha kategoriya</SelectItem>
                                        {categories.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {costsLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}

                                <div className="ml-auto">
                                    <Button size="sm" onClick={openAddCost} className="gap-1.5" disabled={categories.length === 0}>
                                        <Plus className="h-4 w-4" />
                                        Xarajat qo'shish
                                    </Button>
                                </div>
                            </div>

                            {timeFilter === "custom" && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40 h-9" />
                                    <span className="text-muted-foreground text-sm">—</span>
                                    <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40 h-9" />
                                    {(!fromDate || !toDate) && (
                                        <span className="text-xs text-amber-600">Ikkala sanani ham tanlang</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {categories.length === 0 && !catsLoading && (
                            <div className="text-center py-2.5 text-sm text-amber-700 bg-amber-50 border-b border-amber-200 px-4">
                                ⚠️ Xarajat qo'shish uchun avval kategoriya yarating
                            </div>
                        )}

                        {/* ═══ MOBILE CARDS ═══ */}
                        <div className="md:hidden space-y-3 p-4">
                            {costsLoading ? (
                                <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></div>
                            ) : costs.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">Xarajatlar topilmadi</p>
                            ) : (
                                costs.map((c) => (
                                    <Card key={c.id} className="p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium truncate">{c.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {c.costsCategory && <Badge variant="secondary" className="text-xs">{c.costsCategory.name}</Badge>}
                                                    <span className="text-sm font-semibold">{formatPrice(Number(c.costAmount))}</span>
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><MoreVertical className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEditCost(c)}><Pencil className="h-4 w-4 mr-2" /> Tahrirlash</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>

                        {/* ═══ DESKTOP TABLE ═══ */}
                        <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nomi</TableHead>
                                    <TableHead>Tavsif</TableHead>
                                    <TableHead>Kategoriya</TableHead>
                                    <TableHead>Miqdor</TableHead>
                                    <TableHead>Summa</TableHead>
                                    <TableHead>Sana</TableHead>
                                    <TableHead className="text-right">Amallar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {costsLoading ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-12"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                                ) : isCustom && (!fromDate || !toDate) ? (
                                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">Sana oralig'ini tanlang</TableCell></TableRow>
                                ) : !selectedBranchId ? (
                                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">Filial tanlang</TableCell></TableRow>
                                ) : costs.length === 0 ? (
                                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">Xarajatlar topilmadi</TableCell></TableRow>
                                ) : (
                                    costs.map((c) => (
                                        <TableRow key={c.id}>
                                            <TableCell className="font-medium">{c.name}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm max-w-[160px] truncate">{c.desc || "—"}</TableCell>
                                            <TableCell>{c.costsCategory ? <Badge variant="secondary">{c.costsCategory.name}</Badge> : <span className="text-muted-foreground text-sm">—</span>}</TableCell>
                                            <TableCell className="text-sm">{c.quantity} dona</TableCell>
                                            <TableCell className="font-semibold">{formatPrice(Number(c.costAmount))}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm">{new Date(c.createdAt).toLocaleDateString("uz-UZ")}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openEditCost(c)}><Pencil className="h-4 w-4 mr-2" /> Tahrirlash</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        </div>

                        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                            <div className="text-sm text-muted-foreground">
                                {totalCount > 0 && (
                                    <>
                                        <span>{totalCount} ta xarajat</span>
                                        {totalExpense > 0 && (
                                            <span className="ml-3">Jami: <span className="font-semibold text-foreground">{formatPrice(totalExpense)}</span></span>
                                        )}
                                    </>
                                )}
                            </div>
                            {totalPages > 1 && (
                                <div className="flex items-center gap-1">
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                        .reduce<(number | "...")[]>((acc, p, i, arr) => { if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("..."); acc.push(p); return acc; }, [])
                                        .map((p, i) =>
                                            p === "..." ? <span key={`e-${i}`} className="px-1 text-muted-foreground text-sm">…</span>
                                                : <Button key={p} variant={page === p ? "default" : "outline"} size="icon" className="h-8 w-8 text-sm" onClick={() => setPage(p as number)}>{p}</Button>
                                        )}
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                                </div>
                            )}
                        </div>
                    </Card>
                </TabsContent>

                {/* ══ CATEGORIES ══════════════════════════════════════════════════ */}
                <TabsContent value="categories" className="mt-4">
                    <Card>
                        <div className="flex items-center gap-3 p-4 border-b border-border flex-wrap">
                            <div className="relative w-56">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                <Input placeholder="Kategoriya qidirish..." value={catSearch}
                                    onChange={(e) => setCatSearch(e.target.value)} className="pl-8 h-9" />
                            </div>
                            <Button size="sm" onClick={openAddCat} className="ml-auto gap-1.5">
                                <Plus className="h-4 w-4" />Kategoriya qo'shish
                            </Button>
                        </div>

                        {/* Mobile categories */}
                        <div className="md:hidden space-y-3 p-4">
                            {catsLoading ? (
                                <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></div>
                            ) : categories.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">{catSearch ? "Qidiruv bo'yicha natija topilmadi" : "Kategoriyalar mavjud emas"}</p>
                            ) : (
                                categories.map((c) => (
                                    <Card key={c.id} className="p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium">{c.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="secondary" className="text-xs">{Array.isArray(c.cost) ? c.cost.length : 0} ta</Badge>
                                                    <Badge variant={c.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">{c.status === "ACTIVE" ? "Faol" : "Nofaol"}</Badge>
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><MoreVertical className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEditCat(c)}><Pencil className="h-4 w-4 mr-2" /> Tahrirlash</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>

                        {/* Desktop categories table */}
                        <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nomi</TableHead>
                                    <TableHead>Xarajatlar</TableHead>
                                    <TableHead>Holat</TableHead>
                                    <TableHead>Yaratilgan</TableHead>
                                    <TableHead className="text-right">Amallar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {catsLoading ? (
                                    <TableRow><TableCell colSpan={5} className="text-center py-12"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                                ) : !selectedBranchId ? (
                                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12">Filial tanlang</TableCell></TableRow>
                                ) : categories.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12">{catSearch ? "Qidiruv bo'yicha natija topilmadi" : "Kategoriyalar mavjud emas"}</TableCell></TableRow>
                                ) : (
                                    categories.map((c) => (
                                        <TableRow key={c.id}>
                                            <TableCell className="font-medium">{c.name}</TableCell>
                                            <TableCell><Badge variant="secondary">{Array.isArray(c.cost) ? c.cost.length : 0} ta</Badge></TableCell>
                                            <TableCell><Badge variant={c.status === "ACTIVE" ? "default" : "secondary"}>{c.status === "ACTIVE" ? "Faol" : "Nofaol"}</Badge></TableCell>
                                            <TableCell className="text-muted-foreground text-sm">{new Date(c.createdAt).toLocaleDateString("uz-UZ")}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openEditCat(c)}><Pencil className="h-4 w-4 mr-2" /> Tahrirlash</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        </div>

                        {categories.length > 0 && (
                            <div className="px-4 py-3 border-t border-border text-sm text-muted-foreground">
                                {categories.length} ta kategoriya
                            </div>
                        )}
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ══ Category Dialog ════════════════════════════════════════════════ */}
            <Dialog open={catDialog} onOpenChange={setCatDialog}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{catEdit ? "Kategoriyani tahrirlash" : "Yangi kategoriya"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1.5">
                            <Label>Nomi <span className="text-destructive">*</span></Label>
                            <Input placeholder="Kategoriya nomi" value={catName}
                                onChange={(e) => setCatName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && saveCat()} autoFocus />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCatDialog(false)} disabled={isCatSaving}>Bekor qilish</Button>
                        <Button onClick={saveCat} disabled={isCatSaving}>
                            {isCatSaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Saqlash
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ══ Cost Dialog ════════════════════════════════════════════════════ */}
            <Dialog open={costDialog} onOpenChange={setCostDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{costEdit ? "Xarajatni tahrirlash" : "Yangi xarajat"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1.5">
                            <Label>Nomi <span className="text-destructive">*</span></Label>
                            <Input placeholder="Masalan: Svet" value={costForm.name}
                                onChange={(e) => setCostForm({ ...costForm, name: e.target.value })} autoFocus />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Tavsif</Label>
                            <Input placeholder="Izoh (ixtiyoriy)" value={costForm.desc}
                                onChange={(e) => setCostForm({ ...costForm, desc: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Miqdor</Label>
                                <Input type="number" min={1} placeholder="1" value={costForm.quantity}
                                    onChange={(e) => setCostForm({ ...costForm, quantity: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Summa (so'm) <span className="text-destructive">*</span></Label>
                                <Input type="number" min={0} placeholder="0" value={costForm.costAmount}
                                    onChange={(e) => setCostForm({ ...costForm, costAmount: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Kategoriya <span className="text-destructive">*</span></Label>
                            <Select value={costForm.costsCategoryId}
                                onValueChange={(v) => setCostForm({ ...costForm, costsCategoryId: v })}>
                                <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                                <SelectContent>
                                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCostDialog(false)} disabled={isCostSaving}>Bekor qilish</Button>
                        <Button onClick={saveCost} disabled={isCostSaving}>
                            {isCostSaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Saqlash
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
