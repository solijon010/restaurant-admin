import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import { kitchenService } from "@/services/kitchenService";
import { useBranch } from "@/contexts/BranchContext";
import { formatPrice, statusLabels } from "@/lib/mock-data";
import api from "@/lib/api";
import {
    Plus,
    Loader2,
    Store,
    RefreshCw,
    MapPin,
    Star,
    Trash2,
    Search,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    SlidersHorizontal,
    X,
    ImagePlus,
    MoreVertical,
    Eye,
    Pencil,
    Package,
    LayoutGrid,
    List,
    TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Constants ────────────────────────────────────────────────────────────────
const UNIT_OPTIONS = [
    { value: "DONA", label: "Dona" },
    { value: "PORSIYA", label: "Porsiya" },
    { value: "KG", label: "Kg" },
    { value: "GRAM", label: "Gram" },
    { value: "LITR", label: "Litr" },
    { value: "ML", label: "Ml" },
    { value: "QUTI", label: "Quti" },
    { value: "BLOK", label: "Blok" },
    { value: "PACHKA", label: "Pachka" },
    { value: "TOVA", label: "Tova" },
];

// ─── Popular Product Service ──────────────────────────────────────────────────
const popularProductService = {
    getByBranch: (branchId: string) =>
        api.get(`/popular-products/all/manager/${branchId}`),
    create: (data: { productId: string; branchId: string }) =>
        api.post("/popular-products", data),
    delete: (id: string) => api.delete(`/popular-products/${id}`),
};

// ─── Types ────────────────────────────────────────────────────────────────────
type StatusType = "ACTIVE" | "INACTIVE";

interface ProductCategory {
    id: string;
    name: string;
    branchId: string;
    icon?: string | null;
    status: StatusType;
}

interface Product {
    id: string;
    name: string;
    desc: string;
    price: number;
    amount: number;
    unit: string;
    photo?: string | null;
    branchId: string;
    productCategoryId: string;
    kitchenId?: string | null;
    additionalInfo: string[];
    status: StatusType;
}

interface Kitchen {
    id: string;
    name: string;
    branchId: string;
    status: StatusType;
}

interface PopularProduct {
    id: string;
    productId: string;
    branchId: string;
    createdAt?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

function toPaginated<T>(raw: unknown): { items: T[]; total: number; totalPages: number } {
    if (!raw || typeof raw !== "object") return { items: [], total: 0, totalPages: 1 };
    const obj = raw as Record<string, unknown>;

    // Server { data: [...], total: 31, page: 1, limit: 10 } strukturasi
    const items = toArray<T>(raw);
    const total = Number(obj.total ?? obj.totalCount ?? obj.count ?? items.length) || items.length;

    // totalPages: serverdan kelsa ishlatamiz, yo'q bo'lsa limit bilan hisoblaymiz
    let totalPages = Number(obj.totalPages ?? obj.pages ?? obj.pageCount ?? 0);
    if (!totalPages && total > 0) {
        const limit = Number(obj.limit ?? obj.pageSize ?? 10);
        totalPages = Math.ceil(total / (limit || 10));
    }
    totalPages = Math.max(totalPages, 1);

    return { items, total, totalPages };
}

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

// ─── Image Compressor ─────────────────────────────────────────────────────────
async function compressImage(file: File, maxWidth = 900, quality = 0.78): Promise<File> {
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            const canvas = document.createElement('canvas');
            let { width, height } = img;
            if (width > maxWidth) {
                height = Math.round(height * maxWidth / width);
                width = maxWidth;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve(file); return; }
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
                (blob) => {
                    if (!blob) { resolve(file); return; }
                    const name = file.name.replace(/\.[^.]+$/, '.jpg');
                    resolve(new File([blob], name, { type: 'image/jpeg' }));
                },
                'image/jpeg',
                quality
            );
        };
        img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
        img.src = url;
    });
}

// ─── ImageUpload Component ────────────────────────────────────────────────────
interface ImageUploadProps {
    value: File | null;
    onChange: (file: File | null) => void;
    label?: string;
    hint?: string;
    existingUrl?: string | null;
}

function ImageUpload({ value, onChange, label = "Rasm", hint, existingUrl }: ImageUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const preview = value ? URL.createObjectURL(value) : existingUrl || null;

    return (
        <div className="space-y-1.5">
            <Label>
                {label}{" "}
                <span className="text-muted-foreground text-xs">(ixtiyoriy)</span>
            </Label>
            <div
                onClick={() => inputRef.current?.click()}
                className={`relative flex items-center gap-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors px-3 py-2.5
                    ${preview
                        ? "border-primary/40 bg-primary/5 hover:bg-primary/10"
                        : "border-border hover:border-primary/50 hover:bg-muted/40"
                    }`}
            >
                {preview ? (
                    <>
                        <img
                            src={preview}
                            alt="preview"
                            className="h-12 w-12 rounded-md object-cover shrink-0 border border-border"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-foreground">
                                {value ? value.name : "Mavjud rasm"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {value ? `${(value.size / 1024).toFixed(0)} KB` : "O'zgartirish uchun bosing"}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onChange(null); }}
                            className="shrink-0 rounded-full p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </>
                ) : (
                    <>
                        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-muted shrink-0">
                            <ImagePlus className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Rasm yuklash uchun bosing</p>
                            {hint && <p className="text-xs text-muted-foreground/70">{hint}</p>}
                        </div>
                    </>
                )}
            </div>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onChange(e.target.files?.[0] || null)}
            />
        </div>
    );
}

// ─── Pagination Component ─────────────────────────────────────────────────────
interface PaginationProps {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
    isLoading?: boolean;
}

function Pagination({ page, totalPages, total, limit, onPageChange, onLimitChange, isLoading }: PaginationProps) {
    const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, total);

    const getPageNumbers = (): (number | "...")[] => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const pages: (number | "...")[] = [1];
        if (page > 3) pages.push("...");
        for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
        if (page < totalPages - 2) pages.push("...");
        pages.push(totalPages);
        return pages;
    };

    return (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/60 bg-muted/20">
            <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                    {isLoading ? (
                        <span className="inline-flex items-center gap-1.5">
                            <Loader2 className="h-3 w-3 animate-spin" /> Yuklanmoqda...
                        </span>
                    ) : (
                        <>
                            <span className="font-semibold text-foreground">{startItem}–{endItem}</span>
                            {" "}/ jami{" "}
                            <span className="font-semibold text-foreground">{total}</span>
                        </>
                    )}
                </span>
                <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Ko'rsatish:</span>
                    <Select value={String(limit)} onValueChange={(v) => { onLimitChange(Number(v)); onPageChange(1); }}>
                        <SelectTrigger className="h-7 w-16 text-xs border-border/60 bg-background">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[5, 10, 20, 50].map((n) => (
                                <SelectItem key={n} value={String(n)} className="text-xs">{n} ta</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-7 w-7 border-border/60"
                    onClick={() => onPageChange(1)} disabled={page === 1 || isLoading}>
                    <ChevronsLeft className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-7 border-border/60"
                    onClick={() => onPageChange(page - 1)} disabled={page === 1 || isLoading}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                {getPageNumbers().map((p, i) =>
                    p === "..." ? (
                        <span key={`e${i}`} className="px-1 text-xs text-muted-foreground">···</span>
                    ) : (
                        <Button key={p} variant={p === page ? "default" : "outline"} size="icon"
                            className={`h-7 w-7 text-xs border-border/60 ${p === page ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-accent"}`}
                            onClick={() => onPageChange(p as number)} disabled={isLoading}>
                            {p}
                        </Button>
                    )
                )}
                <Button variant="outline" size="icon" className="h-7 w-7 border-border/60"
                    onClick={() => onPageChange(page + 1)} disabled={page === totalPages || isLoading || totalPages === 0}>
                    <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-7 border-border/60"
                    onClick={() => onPageChange(totalPages)} disabled={page === totalPages || isLoading || totalPages === 0}>
                    <ChevronsRight className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ManagerProducts() {
    const queryClient = useQueryClient();

    const { branches, branchesLoading, selectedBranchId, setSelectedBranchId } = useBranch();
    const [activeTab, setActiveTab] = useState("products");

    // Products filter & pagination
    const [search, setSearch] = useState("");
    const [catFilter, setCatFilter] = useState("ALL");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const debouncedSearch = useDebounce(search, 400);

    // Product dialog
    const [prodDialog, setProdDialog] = useState(false);
    const [editProd, setEditProd] = useState<Product | null>(null);
    const [prodForm, setProdForm] = useState({
        name: "",
        desc: "",
        price: "",
        amount: "0",
        unit: "DONA",
        productCategoryId: "",
        kitchenId: "",
    });
    const [prodPhoto, setProdPhoto] = useState<File | null>(null);
    const [deleteProdId, setDeleteProdId] = useState<string | null>(null);
    const [viewProdDialog, setViewProdDialog] = useState(false);
    const [viewProd, setViewProd] = useState<Product | null>(null);
    const [prodViewMode, setProdViewMode] = useState<'table' | 'card'>('table');
    const [prodAdditionalInfo, setProdAdditionalInfo] = useState<string[]>([]);
    const [additionalInfoInput, setAdditionalInfoInput] = useState("");
    const [viewAddInfoInput, setViewAddInfoInput] = useState("");

    // Category dialog
    const [catDialog, setCatDialog] = useState(false);
    const [editCat, setEditCat] = useState<ProductCategory | null>(null);
    const [catName, setCatName] = useState("");
    const [catIcon, setCatIcon] = useState<File | null>(null);
    const [deleteCatId, setDeleteCatId] = useState<string | null>(null);

    // Popular products
    const [popularDialog, setPopularDialog] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState("");
    const [deletePopularId, setDeletePopularId] = useState<string | null>(null);

    useEffect(() => {
        if (selectedBranchId) { setCatFilter("ALL"); setSearch(""); setPage(1); }
    }, [selectedBranchId]);

    useEffect(() => { setPage(1); }, [debouncedSearch, catFilter]);

    // ─── Categories ───────────────────────────────────────────────────────────
    const { data: catsRaw, isLoading: catsLoading, refetch: refetchCats } = useQuery({
        queryKey: ["categories", selectedBranchId],
        queryFn: () => categoryService.getByBranch(selectedBranchId).then((r) => r.data),
        enabled: !!selectedBranchId,
    });
    const categories = toArray<ProductCategory>(catsRaw);
    const activeCats = categories.filter((c) => c.status === "ACTIVE");

    // ─── Products (paginated) ─────────────────────────────────────────────────
    const { data: prodsRaw, isLoading: prodsLoading, isFetching: prodsFetching, refetch: refetchProds } = useQuery({
        queryKey: ["products", selectedBranchId, page, limit, debouncedSearch, catFilter],
        queryFn: () =>
            productService.getByBranch(selectedBranchId, {
                page,
                limit,
                search: debouncedSearch || undefined,
                categoryId: catFilter !== "ALL" ? catFilter : undefined,
            }).then((r) => r.data),
        enabled: !!selectedBranchId,
        placeholderData: (prev) => prev,
    });
    const { items: productsList, total: prodsTotal, totalPages: prodsTotalPages } = toPaginated<Product>(prodsRaw);

    // All products (for popular tab + stats)
    const { data: allProdsRaw } = useQuery({
        queryKey: ["products-all", selectedBranchId],
        queryFn: () =>
            productService.getByBranch(selectedBranchId, { page: 1, limit: 1000 }).then((r) => r.data),
        enabled: !!selectedBranchId,
        staleTime: 2 * 60 * 1000,
    });
    const allProducts = toArray<Product>(allProdsRaw);

    // ─── Kitchens ─────────────────────────────────────────────────────────────
    const { data: kitchensRaw } = useQuery({
        queryKey: ["kitchens", selectedBranchId],
        queryFn: async () => {
            const res = await kitchenService.getAll(selectedBranchId) as { data?: { data?: unknown } | unknown[] } | unknown[];
            const raw = res?.data?.data ?? res?.data ?? res ?? [];
            return Array.isArray(raw) ? raw : [];
        },
        enabled: !!selectedBranchId,
    });
    const activeKitchens = toArray<Kitchen>(kitchensRaw).filter((k) => k.status === "ACTIVE");

    // ─── Popular Products ─────────────────────────────────────────────────────
    const { data: popularRaw, isLoading: popularLoading, refetch: refetchPopular } = useQuery({
        queryKey: ["popular-products", selectedBranchId],
        queryFn: () => popularProductService.getByBranch(selectedBranchId).then((r) => r.data),
        enabled: !!selectedBranchId,
    });
    const popularList = toArray<PopularProduct>(popularRaw);
    const selectedBranch = branches.find((b) => b.id === selectedBranchId);

    // ─── Cache helpers ────────────────────────────────────────────────────────
    const getArrayKey = (obj: Record<string, unknown>) =>
        ["data", "items", "result", "results", "content"].find(k => Array.isArray(obj[k]));

    const updateProductInCache = (updated: Product) => {
        const mapper = (old: unknown) => {
            if (!old) return old;
            if (Array.isArray(old)) return (old as Product[]).map(p => p.id === updated.id ? updated : p);
            const obj = old as Record<string, unknown>;
            const key = getArrayKey(obj);
            if (key) return { ...obj, [key]: (obj[key] as Product[]).map(p => p.id === updated.id ? updated : p) };
            return old;
        };
        queryClient.setQueriesData({ queryKey: ["products", selectedBranchId], exact: false }, mapper);
        queryClient.setQueryData(["products-all", selectedBranchId], mapper);
    };

    const addProductToCache = (created: Product) => {
        queryClient.setQueryData<unknown>(["products-all", selectedBranchId], (old: unknown) => {
            if (Array.isArray(old)) return [created, ...old];
            return old;
        });
        queryClient.invalidateQueries({ queryKey: ["products", selectedBranchId], exact: false });
    };

    const removeProductFromCache = (id: string) => {
        const mapper = (old: unknown) => {
            if (!old) return old;
            if (Array.isArray(old)) return (old as Product[]).filter(p => p.id !== id);
            const obj = old as Record<string, unknown>;
            const key = getArrayKey(obj);
            if (key) {
                const filtered = (obj[key] as Product[]).filter(p => p.id !== id);
                return { ...obj, [key]: filtered, total: typeof obj.total === "number" ? obj.total - 1 : obj.total };
            }
            return old;
        };
        queryClient.setQueriesData({ queryKey: ["products", selectedBranchId], exact: false }, mapper);
        queryClient.setQueryData(["products-all", selectedBranchId], mapper);
    };

    const updateCategoryInCache = (updated: ProductCategory) => {
        queryClient.setQueryData<unknown>(["categories", selectedBranchId], (old: unknown) => {
            if (Array.isArray(old)) return old.map((c: ProductCategory) => c.id === updated.id ? updated : c);
            if (old && typeof old === "object") {
                const obj = old as Record<string, unknown>;
                const key = getArrayKey(obj);
                if (key) return { ...obj, [key]: (obj[key] as ProductCategory[]).map(c => c.id === updated.id ? updated : c) };
            }
            return old;
        });
    };

    const addCategoryToCache = (created: ProductCategory) => {
        queryClient.setQueryData<unknown>(["categories", selectedBranchId], (old: unknown) => {
            if (Array.isArray(old)) return [...old, created];
            if (old && typeof old === "object") {
                const obj = old as Record<string, unknown>;
                const key = getArrayKey(obj);
                if (key) return { ...obj, [key]: [...(obj[key] as ProductCategory[]), created] };
            }
            return old;
        });
    };

    const removeCategoryFromCache = (id: string) => {
        queryClient.setQueryData<unknown>(["categories", selectedBranchId], (old: unknown) => {
            if (Array.isArray(old)) return (old as ProductCategory[]).filter(c => c.id !== id);
            if (old && typeof old === "object") {
                const obj = old as Record<string, unknown>;
                const key = getArrayKey(obj);
                if (key) return { ...obj, [key]: (obj[key] as ProductCategory[]).filter(c => c.id !== id) };
            }
            return old;
        });
    };

    const addPopularToCache = (created: PopularProduct) => {
        queryClient.setQueryData<unknown>(["popular-products", selectedBranchId], (old: unknown) => {
            if (Array.isArray(old)) return [...old, created];
            if (old && typeof old === "object") {
                const obj = old as Record<string, unknown>;
                const key = getArrayKey(obj);
                if (key) return { ...obj, [key]: [...(obj[key] as PopularProduct[]), created] };
            }
            return old;
        });
    };

    const removePopularFromCache = (id: string) => {
        queryClient.setQueryData<unknown>(["popular-products", selectedBranchId], (old: unknown) => {
            if (Array.isArray(old)) return (old as PopularProduct[]).filter(p => p.id !== id);
            if (old && typeof old === "object") {
                const obj = old as Record<string, unknown>;
                const key = getArrayKey(obj);
                if (key) return { ...obj, [key]: (obj[key] as PopularProduct[]).filter(p => p.id !== id) };
            }
            return old;
        });
    };

    // ─── Product mutations ────────────────────────────────────────────────────
    const createProductMutation = useMutation({
        mutationFn: (formData: FormData) =>
            api.post("/product", formData, { headers: { "Content-Type": "multipart/form-data" } }),
        onSuccess: (res) => {
            toast.success("Mahsulot yaratildi");
            const created: Product = res?.data?.data ?? res?.data ?? res;
            if (created?.id) addProductToCache(created);
            else queryClient.invalidateQueries({ queryKey: ["products", selectedBranchId], exact: false });
            setProdDialog(false);
        },
        onError: () => toast.error("Mahsulot yaratishda xatolik"),
    });

    const updateProductMutation = useMutation({
        mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
            api.patch(`/product/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
        onSuccess: (res) => {
            toast.success("Mahsulot yangilandi");
            const updated: Product = res?.data?.data ?? res?.data ?? res;
            if (updated?.id) updateProductInCache(updated);
            setProdDialog(false);
        },
        onError: () => toast.error("Mahsulot yangilashda xatolik"),
    });

    const deleteProductMutation = useMutation({
        mutationFn: (id: string) => productService.delete(id),
        onSuccess: (_, id) => {
            toast.success("Mahsulot o'chirildi");
            removeProductFromCache(id);
            setDeleteProdId(null);
        },
        onError: () => toast.error("O'chirishda xatolik"),
    });

    const toggleProductMutation = useMutation({
        mutationFn: (id: string) => productService.toggleStatus(id),
        onSuccess: (res) => {
            const updated: Product = res?.data?.data ?? res?.data ?? res;
            if (updated?.id) updateProductInCache(updated);
        },
        onError: () => toast.error("Holat o'zgartirishda xatolik"),
    });

    // ─── Category mutations ───────────────────────────────────────────────────
    const createCategoryMutation = useMutation({
        mutationFn: (formData: FormData) =>
            api.post("/category", formData, { headers: { "Content-Type": "multipart/form-data" } }),
        onSuccess: (res) => {
            toast.success("Kategoriya yaratildi");
            const created: ProductCategory = res?.data?.data ?? res?.data ?? res;
            if (created?.id) addCategoryToCache(created);
            else queryClient.invalidateQueries({ queryKey: ["categories", selectedBranchId] });
            setCatDialog(false);
        },
        onError: () => toast.error("Kategoriya yaratishda xatolik"),
    });

    const updateCategoryMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name: string } }) =>
            api.patch(`/category/${id}`, data),
        onSuccess: (res) => {
            toast.success("Kategoriya yangilandi");
            const updated: ProductCategory = res?.data?.data ?? res?.data ?? res;
            if (updated?.id) updateCategoryInCache(updated);
            setCatDialog(false);
        },
        onError: () => toast.error("Kategoriya yangilashda xatolik"),
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: (id: string) => categoryService.delete(id),
        onSuccess: (_, id) => {
            toast.success("Kategoriya o'chirildi");
            removeCategoryFromCache(id);
            queryClient.invalidateQueries({ queryKey: ["products", selectedBranchId], exact: false });
            queryClient.invalidateQueries({ queryKey: ["products-all", selectedBranchId] });
            setDeleteCatId(null);
        },
        onError: () => toast.error("O'chirishda xatolik"),
    });

    const toggleCategoryMutation = useMutation({
        mutationFn: (id: string) => categoryService.toggleStatus(id),
        onSuccess: (res) => {
            const updated: ProductCategory = res?.data?.data ?? res?.data ?? res;
            if (updated?.id) updateCategoryInCache(updated);
        },
        onError: () => toast.error("Holat o'zgartirishda xatolik"),
    });

    // ─── Popular mutations ────────────────────────────────────────────────────
    const createPopularMutation = useMutation({
        mutationFn: (data: { productId: string; branchId: string }) => popularProductService.create(data),
        onSuccess: (res) => {
            toast.success("Tezkor mahsulotga qo'shildi");
            const created: PopularProduct = res?.data?.data ?? res?.data ?? res;
            if (created?.id) addPopularToCache(created);
            else queryClient.invalidateQueries({ queryKey: ["popular-products", selectedBranchId] });
            setPopularDialog(false);
            setSelectedProductId("");
        },
        onError: () => toast.error("Tezkor mahsulotga qo'shishda xatolik"),
    });

    const deletePopularMutation = useMutation({
        mutationFn: (id: string) => popularProductService.delete(id),
        onSuccess: (_, id) => {
            toast.success("Tezkor mahsulotdan o'chirildi");
            removePopularFromCache(id);
            setDeletePopularId(null);
        },
        onError: () => toast.error("O'chirishda xatolik"),
    });

    const addAdditionalInfoMutation = useMutation({
        mutationFn: ({ id, items }: { id: string; items: string[] }) =>
            api.post(`/product/addition-info/${id}`, items),
        onSuccess: (res) => {
            toast.success("Qo'shimcha ma'lumot qo'shildi");
            const updated: Product = res?.data?.data ?? res?.data ?? res;
            if (updated?.id) {
                updateProductInCache(updated);
                setViewProd(updated);
            }
        },
        onError: () => toast.error("Qo'shimcha ma'lumot qo'shishda xatolik"),
    });

    // ─── Computed ─────────────────────────────────────────────────────────────
    const availableForPopular = allProducts.filter(
        (p) => p.status === "ACTIVE" && !popularList.some((pop) => pop.productId === p.id)
    );
    const activeFilterCount = [debouncedSearch ? 1 : 0, catFilter !== "ALL" ? 1 : 0].reduce((a, b) => a + b, 0);

    // ─── Product handlers ─────────────────────────────────────────────────────
    const openAddProd = () => {
        setEditProd(null);
        setProdPhoto(null);
        setProdAdditionalInfo([]);
        setAdditionalInfoInput("");
        setProdForm({ name: "", desc: "", price: "", amount: "0", unit: "DONA", productCategoryId: activeCats[0]?.id || "", kitchenId: "" });
        setProdDialog(true);
    };

    const openEditProd = (p: Product) => {
        setEditProd(p);
        setProdPhoto(null);
        setProdAdditionalInfo(p.additionalInfo || []);
        setAdditionalInfoInput("");
        setProdForm({
            name: p.name, desc: p.desc || "", price: String(p.price),
            amount: String(p.amount), unit: p.unit || "DONA",
            productCategoryId: p.productCategoryId, kitchenId: p.kitchenId || "",
        });
        setProdDialog(true);
    };

    const openViewProd = (p: Product) => {
        setViewProd(p);
        setViewProdDialog(true);
    };

    const saveProd = async () => {
        if (!prodForm.name.trim()) return toast.error("Mahsulot nomini kiriting");
        if (!prodForm.price || isNaN(Number(prodForm.price))) return toast.error("Narxni to'g'ri kiriting");
        if (!prodForm.productCategoryId) return toast.error("Kategoriyani tanlang");

        const fd = new FormData();
        fd.append("name", prodForm.name);
        fd.append("desc", prodForm.desc);
        fd.append("price", prodForm.price);
        fd.append("amount", prodForm.amount || "0");
        fd.append("unit", prodForm.unit);
        fd.append("productCategoryId", prodForm.productCategoryId);
        if (prodForm.kitchenId) fd.append("kitchenId", prodForm.kitchenId);
        prodAdditionalInfo.forEach((item) => fd.append("additionalInfo", item));
        if (prodPhoto) {
            const compressed = await compressImage(prodPhoto);
            fd.append("photo", compressed);
        }

        if (editProd) {
            // PATCH: branchId YUBORILMAYDI
            updateProductMutation.mutate({ id: editProd.id, formData: fd });
        } else {
            // POST: branchId kerak
            fd.append("branchId", selectedBranchId);
            createProductMutation.mutate(fd);
        }
    };

    const handleProdKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" && !e.shiftKey && (e.target as HTMLElement).tagName !== "BUTTON") {
            e.preventDefault();
            saveProd();
        }
    };

    // ─── Category handlers ────────────────────────────────────────────────────
    const openAddCat = () => {
        setEditCat(null);
        setCatName("");
        setCatIcon(null);
        setCatDialog(true);
    };

    const openEditCat = (c: ProductCategory) => {
        setEditCat(c);
        setCatName(c.name);
        setCatIcon(null);
        setCatDialog(true);
    };

    const saveCat = async () => {
        if (!catName.trim()) return toast.error("Kategoriya nomini kiriting");

        if (editCat) {
            // PATCH /category/:id — faqat name JSON bilan
            updateCategoryMutation.mutate({ id: editCat.id, data: { name: catName } });
        } else {
            // POST /category — multipart (name + branchId + icon ixtiyoriy)
            const fd = new FormData();
            fd.append("name", catName);
            fd.append("branchId", selectedBranchId);
            if (catIcon) {
                const compressed = await compressImage(catIcon, 400, 0.8);
                fd.append("icon", compressed);
            }
            createCategoryMutation.mutate(fd);
        }
    };

    const handleCatKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" && !e.shiftKey && (e.target as HTMLElement).tagName !== "BUTTON") {
            e.preventDefault();
            saveCat();
        }
    };

    const clearFilters = () => { setSearch(""); setCatFilter("ALL"); setPage(1); };

    const isProdSaving = createProductMutation.isPending || updateProductMutation.isPending;
    const isCatSaving = createCategoryMutation.isPending || updateCategoryMutation.isPending;

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Mahsulotlar</h1>
                    <p className="text-sm text-muted-foreground mt-1">Filial bo'yicha mahsulot va kategoriyalarni boshqaring</p>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 h-8" disabled={!selectedBranchId}
                    onClick={() => { refetchCats(); refetchProds(); refetchPopular(); }}>
                    <RefreshCw className="h-3.5 w-3.5" /> Yangilash
                </Button>
            </div>

            {/* Branch selector */}
            <div className="rounded-xl border border-border bg-card p-4">
                {branchesLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Filiallar yuklanmoqda...
                    </div>
                ) : branches.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center">Hech qanday filial topilmadi</p>
                ) : (
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted shrink-0">
                                <Store className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground mb-0.5">Faol filial</p>
                                <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                                    <SelectTrigger className="h-8 border-0 p-0 text-sm font-semibold shadow-none focus:ring-0 w-72">
                                        <SelectValue placeholder="Filial tanlang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {branches.map((b) => (
                                            <SelectItem key={b.id} value={b.id}>
                                                <span className="font-medium">{b.name}</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {selectedBranchId && (
                            <div className="flex gap-2 shrink-0 flex-wrap">
                                {[
                                    { val: prodsTotal, label: 'Mahsulot', color: '#10b981' },
                                    { val: categories.length, label: 'Kategoriya', color: '#6366f1' },
                                    { val: allProducts.filter(p => p.status === 'ACTIVE').length, label: 'Faol', color: '#10b981' },
                                    { val: popularList.length, label: 'Tezkor', color: '#f59e0b' },
                                ].map(s => (
                                    <div key={s.label} className="rounded-lg border border-border px-3 py-1.5 text-center min-w-[60px]">
                                        <p className="text-base font-bold" style={{ color: s.color }}>{s.val}</p>
                                        <p className="text-[11px] text-muted-foreground">{s.label}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {!selectedBranchId ? (
                <div className="text-center py-16 text-muted-foreground text-sm">
                    Davom etish uchun yuqoridan filial tanlang
                </div>
            ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-muted/50 p-1 h-auto rounded-lg gap-1 w-auto justify-start mb-5">
                        <TabsTrigger value="products"
                            className="px-4 py-2 h-auto rounded-md text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground">
                            Mahsulotlar
                            {prodsTotal > 0 && <span className="ml-1.5 text-xs bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700">{prodsTotal}</span>}
                        </TabsTrigger>
                        <TabsTrigger value="categories"
                            className="px-4 py-2 h-auto rounded-md text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground">
                            Kategoriyalar
                            {categories.length > 0 && <span className="ml-1.5 text-xs bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">{categories.length}</span>}
                        </TabsTrigger>
                        <TabsTrigger value="popular"
                            className="px-4 py-2 h-auto rounded-md text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground">
                            <Star className="h-3.5 w-3.5 mr-1.5" />
                            Tezkor
                            {popularList.length > 0 && <span className="ml-1.5 text-xs bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">{popularList.length}</span>}
                        </TabsTrigger>
                    </TabsList>

                    {/* ══ Products Tab ══════════════════════════════════════════════════ */}
                    <TabsContent value="products">
                        {/* Filter Bar */}
                        <div className="flex items-center gap-3 flex-wrap bg-muted/40 rounded-2xl p-3 mb-4">
                            <div className="relative flex-1 min-w-[200px] max-w-xs">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                <Input placeholder="Mahsulot qidirish..." value={search}
                                    onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 text-sm" />
                                {search && (
                                    <button onClick={() => setSearch("")}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                                <Select value={catFilter} onValueChange={setCatFilter}>
                                    <SelectTrigger className="h-9 w-52 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Barcha kategoriyalar</SelectItem>
                                        {categories.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                <div className="flex items-center gap-2">
                                                    {c.icon && (
                                                        <img src={`${import.meta.env.VITE_API_BASE_URL}/image/${c.icon}`}
                                                            alt="" className="h-4 w-4 rounded object-cover" />
                                                    )}
                                                    {c.name}
                                                    {c.status === "INACTIVE" && (
                                                        <Badge variant="outline" className="text-xs py-0 px-1">Nofaol</Badge>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {activeFilterCount > 0 && (
                                <Button variant="ghost" size="sm" onClick={clearFilters}
                                    className="h-9 gap-1.5 text-muted-foreground hover:text-foreground">
                                    <X className="h-3.5 w-3.5" /> Filtrni tozalash
                                    <Badge variant="secondary" className="ml-0.5 px-1.5 text-xs">{activeFilterCount}</Badge>
                                </Button>
                            )}
                            <div className="flex-1" />
                            {prodsFetching && !prodsLoading && (
                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Loader2 className="h-3 w-3 animate-spin" /> Yangilanmoqda...
                                </span>
                            )}
                            {/* View toggle */}
                            <div className="flex items-center rounded-lg border border-border overflow-hidden">
                                <button onClick={() => setProdViewMode('table')}
                                    className={`h-9 px-2.5 flex items-center justify-center transition-colors ${prodViewMode === 'table' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'}`}>
                                    <List className="h-4 w-4" />
                                </button>
                                <button onClick={() => setProdViewMode('card')}
                                    className={`h-9 px-2.5 flex items-center justify-center transition-colors ${prodViewMode === 'card' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'}`}>
                                    <LayoutGrid className="h-4 w-4" />
                                </button>
                            </div>
                            <Button onClick={openAddProd} size="sm" className="h-9" disabled={activeCats.length === 0}>
                                <Plus className="h-4 w-4 mr-1" /> Mahsulot qo'shish
                            </Button>
                        </div>

                        {activeCats.length === 0 && !catsLoading && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm px-4 py-3 mb-4 flex items-center gap-2">
                                ⚠️ Mahsulot qo'shish uchun avval faol kategoriya yarating
                            </div>
                        )}

                        {/* ═══ CARD GRID VIEW ═══ */}
                        {prodViewMode === 'card' && (
                            <div>
                                {prodsLoading ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {[...Array(8)].map((_, i) => <div key={i} className="h-52 skeleton rounded-2xl" />)}
                                    </div>
                                ) : productsList.length === 0 ? (
                                    <div className="text-center py-16 text-muted-foreground text-sm">Mahsulot topilmadi</div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {productsList.map((p) => {
                                            const cat = categories.find(c => c.id === p.productCategoryId);
                                            const isPopular = popularList.some(pop => pop.productId === p.id);
                                            const isActive = p.status === 'ACTIVE';
                                            return (
                                                <div key={p.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid hsl(var(--border))', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', transition: 'box-shadow 0.2s' }}
                                                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)')}
                                                    onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)')}
                                                >
                                                    {/* Image */}
                                                    <div style={{ height: 100, background: 'hsl(var(--muted))', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {p.photo ? (
                                                            <img
                                                                src={`${import.meta.env.VITE_API_BASE_URL}/image/${p.photo}`}
                                                                alt={p.name}
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                onError={e => { const t = e.target as HTMLImageElement; t.style.display = 'none'; t.parentElement!.style.background = 'hsl(var(--muted))'; }}
                                                            />
                                                        ) : (
                                                            <Package style={{ width: 32, height: 32, color: 'hsl(var(--muted-foreground))', opacity: 0.4 }} />
                                                        )}
                                                        {/* Popular toggle */}
                                                        <button
                                                            onClick={() => {
                                                                if (isPopular) {
                                                                    const pop = popularList.find(x => x.productId === p.id);
                                                                    if (pop) deletePopularMutation.mutate(pop.id);
                                                                } else {
                                                                    createPopularMutation.mutate({ productId: p.id, branchId: selectedBranchId });
                                                                }
                                                            }}
                                                            style={{
                                                                position: 'absolute', top: 8, right: 8,
                                                                width: 30, height: 30, borderRadius: 8,
                                                                background: isPopular ? '#f59e0b' : 'rgba(255,255,255,0.9)',
                                                                border: isPopular ? 'none' : '1px solid #e2e8f0',
                                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                transition: 'all 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                                                            }}
                                                            title={isPopular ? "Tezkordan olib tashlash" : "Tezkorga qo'shish"}
                                                        >
                                                            <Star style={{ width: 14, height: 14, fill: isPopular ? '#fff' : 'none', color: isPopular ? '#fff' : '#94a3b8' }} />
                                                        </button>
                                                    </div>

                                                    {/* Content */}
                                                    <div style={{ padding: '12px 14px' }}>
                                                        {/* Name + actions row */}
                                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
                                                            <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{p.name}</p>
                                                            <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                                                                <button onClick={() => openEditProd(p)}
                                                                    style={{ width: 26, height: 26, borderRadius: 6, background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}
                                                                    onMouseEnter={e => { e.currentTarget.style.background = '#e0f2fe'; e.currentTarget.style.borderColor = '#0ea5e9'; }}
                                                                    onMouseLeave={e => { e.currentTarget.style.background = 'hsl(var(--muted))'; e.currentTarget.style.borderColor = 'hsl(var(--border))'; }}>
                                                                    <Pencil style={{ width: 11, height: 11, color: '#64748b' }} />
                                                                </button>
                                                                <button onClick={() => setDeleteProdId(p.id)}
                                                                    style={{ width: 26, height: 26, borderRadius: 6, background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}
                                                                    onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#ef4444'; }}
                                                                    onMouseLeave={e => { e.currentTarget.style.background = 'hsl(var(--muted))'; e.currentTarget.style.borderColor = 'hsl(var(--border))'; }}>
                                                                    <Trash2 style={{ width: 11, height: 11, color: '#ef4444' }} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {cat && (
                                                            <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--muted))', padding: '2px 8px', borderRadius: 99, display: 'inline-block', marginBottom: 10 }}>
                                                                {cat.name}
                                                            </span>
                                                        )}

                                                        {/* Stats grid */}
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 8px', marginBottom: 12 }}>
                                                            <div>
                                                                <p style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', margin: '0 0 1px' }}>Narx</p>
                                                                <p style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>{formatPrice(p.price)}</p>
                                                            </div>
                                                            <div>
                                                                <p style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', margin: '0 0 1px' }}>Birlik</p>
                                                                <p style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>{p.unit}</p>
                                                            </div>
                                                            <div>
                                                                <p style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', margin: '0 0 1px' }}>Miqdor</p>
                                                                <p style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>{p.amount}</p>
                                                            </div>
                                                            <div>
                                                                <p style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', margin: '0 0 1px' }}>Holat</p>
                                                                <p style={{ fontSize: 12, fontWeight: 700, color: isActive ? '#10b981' : '#94a3b8', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#10b981' : '#94a3b8', display: 'inline-block' }} />
                                                                    {isActive ? 'Faol' : 'Nofaol'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Action button */}
                                                        <button onClick={() => openViewProd(p)}
                                                            style={{ width: '100%', padding: '8px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: 'hsl(var(--foreground))', color: 'hsl(var(--background))', transition: 'opacity 0.15s' }}
                                                            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                                        >
                                                            Ko'rish
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ═══ MOBILE PRODUCT CARDS ═══ */}
                        <div className={`${prodViewMode === 'card' ? 'hidden' : 'md:hidden'} space-y-3`}>
                            {prodsLoading ? (
                                <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></div>
                            ) : productsList.length === 0 ? (
                                <div className="rounded-2xl border border-border/60 shadow-sm p-8 text-center text-muted-foreground text-sm">
                                    {debouncedSearch || catFilter !== "ALL" ? "Qidiruv natijasi topilmadi" : "Mahsulotlar mavjud emas"}
                                </div>
                            ) : (
                                productsList.map((p) => {
                                    const cat = categories.find((c) => c.id === p.productCategoryId);
                                    const isPopular = popularList.some((pop) => pop.productId === p.id);
                                    return (
                                        <div key={p.id} className={`rounded-2xl border border-border/60 shadow-sm p-4 bg-background ${prodsFetching ? "opacity-60" : ""}`}>
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    {p.photo && (
                                                        <img
                                                            src={`${import.meta.env.VITE_API_BASE_URL}/image/${p.photo}`}
                                                            alt={p.name}
                                                            className="h-10 w-10 rounded-xl object-cover border border-border shrink-0"
                                                        />
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="font-medium truncate">{p.name}</p>
                                                            {isPopular && <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 shrink-0" />}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                            <span className="text-sm font-semibold">{formatPrice(p.price)}</span>
                                                            {cat && <Badge variant="secondary" className="text-xs">{cat.name}</Badge>}
                                                            <Badge variant={p.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">
                                                                {statusLabels[p.status]}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Switch checked={p.status === "ACTIVE"}
                                                        onCheckedChange={() => toggleProductMutation.mutate(p.id)}
                                                        disabled={toggleProductMutation.isPending} />
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => openViewProd(p)}><Eye className="h-4 w-4 mr-2" /> Ko'rish</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => openEditProd(p)}><Pencil className="h-4 w-4 mr-2" /> Tahrirlash</DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteProdId(p.id)}>
                                                                <Trash2 className="h-4 w-4 mr-2" /> O'chirish
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            {(prodsTotal > 0 || prodsTotalPages > 1) && (
                                <Pagination page={page} totalPages={prodsTotalPages} total={prodsTotal}
                                    limit={limit} onPageChange={setPage} onLimitChange={setLimit} isLoading={prodsLoading} />
                            )}
                        </div>

                        {/* ═══ DESKTOP PRODUCT TABLE ═══ */}
                        <div className={`shadow-sm border border-border/60 rounded-2xl overflow-hidden ${prodViewMode === 'card' ? 'hidden' : 'hidden md:block'}`}>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3">Nomi</TableHead>
                                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3">Kategoriya</TableHead>
                                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3">Narx</TableHead>
                                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3">Birlik</TableHead>
                                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3">Holat</TableHead>
                                        <TableHead className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3">Amallar</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {prodsLoading ? (
                                        <TableRow><TableCell colSpan={6} className="text-center py-16">
                                            <div className="flex flex-col items-center gap-2"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /><span className="text-sm text-muted-foreground">Yuklanmoqda...</span></div>
                                        </TableCell></TableRow>
                                    ) : productsList.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-16">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
                                                        <Package className="h-7 w-7 text-muted-foreground/40" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-muted-foreground">
                                                            {debouncedSearch || catFilter !== "ALL" ? "Qidiruv natijasi topilmadi" : "Mahsulotlar mavjud emas"}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground/60 mt-1">
                                                            {debouncedSearch || catFilter !== "ALL"
                                                                ? <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs mt-1">Filtrni tozalash</Button>
                                                                : "Yuqoridagi \"+\" tugmasini bosib mahsulot qo'shing"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        productsList.map((p) => {
                                            const cat = categories.find((c) => c.id === p.productCategoryId);
                                            const isPopular = popularList.some((pop) => pop.productId === p.id);
                                            const unitLabel = UNIT_OPTIONS.find(u => u.value === p.unit)?.label || p.unit;
                                            return (
                                                <TableRow key={p.id} className={`transition-opacity ${prodsFetching ? "opacity-60" : ""}`}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            {p.photo && (
                                                                <img
                                                                    src={`${import.meta.env.VITE_API_BASE_URL}/image/${p.photo}`}
                                                                    alt={p.name}
                                                                    className="h-8 w-8 rounded-lg object-cover border border-border shrink-0"
                                                                />
                                                            )}
                                                            {p.name}
                                                            {isPopular && <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />}
                                                        </div>
                                                        {p.desc && <p className="text-xs text-muted-foreground truncate max-w-[160px]">{p.desc}</p>}
                                                    </TableCell>
                                                    <TableCell>
                                                        {cat ? (
                                                            <div className="flex items-center gap-1.5">
                                                                {cat.icon && <img src={`${import.meta.env.VITE_API_BASE_URL}/image/${cat.icon}`} alt="" className="h-4 w-4 rounded object-cover" />}
                                                                <Badge variant="secondary">{cat.name}</Badge>
                                                            </div>
                                                        ) : <span className="text-muted-foreground text-sm">—</span>}
                                                    </TableCell>
                                                    <TableCell className="font-semibold">{formatPrice(p.price)}</TableCell>
                                                    <TableCell><Badge variant="outline" className="text-xs">{unitLabel}</Badge></TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Switch checked={p.status === "ACTIVE"} onCheckedChange={() => toggleProductMutation.mutate(p.id)} disabled={toggleProductMutation.isPending} />
                                                            <Badge variant={p.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">{statusLabels[p.status]}</Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => openViewProd(p)}>
                                                                    <Eye className="h-4 w-4 mr-2" /> Ko'rish
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => openEditProd(p)}>
                                                                    <Pencil className="h-4 w-4 mr-2" /> Tahrirlash
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteProdId(p.id)}>
                                                                    <Trash2 className="h-4 w-4 mr-2" /> O'chirish
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                            {(prodsTotal > 0 || prodsTotalPages > 1) && (
                                <Pagination page={page} totalPages={prodsTotalPages} total={prodsTotal}
                                    limit={limit} onPageChange={setPage} onLimitChange={setLimit} isLoading={prodsLoading} />
                            )}
                        </div>
                    </TabsContent>

                    {/* ══ Categories Tab ════════════════════════════════════════════════ */}
                    <TabsContent value="categories">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">{selectedBranch?.name}</span> filialining kategoriyalari
                            </p>
                            <Button onClick={openAddCat} size="sm">
                                <Plus className="h-4 w-4 mr-1" /> Kategoriya qo'shish
                            </Button>
                        </div>
                        {/* Mobile categories */}
                        <div className="md:hidden space-y-3">
                            {catsLoading ? (
                                <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></div>
                            ) : categories.length === 0 ? (
                                <div className="rounded-2xl border border-border/60 shadow-sm p-8 text-center text-muted-foreground text-sm">Kategoriyalar mavjud emas</div>
                            ) : (
                                categories.map((c) => {
                                    const prodCount = allProducts.filter((p) => p.productCategoryId === c.id).length;
                                    return (
                                        <div key={c.id} className="rounded-2xl border border-border/60 shadow-sm p-4 bg-background">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0 flex-1 flex items-center gap-2">
                                                    {c.icon && <img src={`${import.meta.env.VITE_API_BASE_URL}/image/${c.icon}`} alt={c.name} className="h-6 w-6 rounded object-cover border border-border shrink-0" />}
                                                    <div>
                                                        <p className="font-medium">{c.name}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <Badge variant="secondary" className="text-xs">{prodCount} ta</Badge>
                                                            <Badge variant={c.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">{statusLabels[c.status]}</Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Switch checked={c.status === "ACTIVE"} onCheckedChange={() => toggleCategoryMutation.mutate(c.id)} disabled={toggleCategoryMutation.isPending} />
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => openEditCat(c)}><Pencil className="h-4 w-4 mr-2" /> Tahrirlash</DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteCatId(c.id)}><Trash2 className="h-4 w-4 mr-2" /> O'chirish</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Desktop categories table */}
                        <div className="hidden md:block shadow-sm border border-border/60 rounded-2xl overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3">Nomi</TableHead>
                                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3">Mahsulotlar</TableHead>
                                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3">Holat</TableHead>
                                        <TableHead className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3">Amallar</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {catsLoading ? (
                                        <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                                    ) : categories.length === 0 ? (
                                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-10">Kategoriyalar mavjud emas</TableCell></TableRow>
                                    ) : (
                                        categories.map((c) => {
                                            const prodCount = allProducts.filter((p) => p.productCategoryId === c.id).length;
                                            return (
                                                <TableRow key={c.id}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            {c.icon && <img src={`${import.meta.env.VITE_API_BASE_URL}/image/${c.icon}`} alt={c.name} className="h-6 w-6 rounded object-cover border border-border" />}
                                                            {c.name}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell><Badge variant="secondary">{prodCount} ta</Badge></TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Switch checked={c.status === "ACTIVE"} onCheckedChange={() => toggleCategoryMutation.mutate(c.id)} disabled={toggleCategoryMutation.isPending} />
                                                            <Badge variant={c.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">{statusLabels[c.status]}</Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => openEditCat(c)}>
                                                                    <Pencil className="h-4 w-4 mr-2" /> Tahrirlash
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteCatId(c.id)}>
                                                                    <Trash2 className="h-4 w-4 mr-2" /> O'chirish
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* ══ Popular Tab ═══════════════════════════════════════════════════ */}
                    <TabsContent value="popular">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-sm font-medium text-foreground">Tezkor mahsulotlar</p>
                                <p className="text-xs text-muted-foreground">Afitsantlar uchun tez buyurtma berish imkoniyati</p>
                            </div>
                            <Button onClick={() => { setSelectedProductId(""); setPopularDialog(true); }}
                                size="sm" disabled={availableForPopular.length === 0}>
                                <Plus className="h-4 w-4 mr-1" /> Qo'shish
                            </Button>
                        </div>
                        {availableForPopular.length === 0 && !popularLoading && allProducts.some(p => p.status === "ACTIVE") && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm px-4 py-3 mb-4 flex items-center gap-2">
                                ⚠️ Barcha faol mahsulotlar allaqachon tezkor ro'yxatda
                            </div>
                        )}
                        <div className="shadow-sm border border-border/60 rounded-2xl overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3">Mahsulot</TableHead>
                                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3">Kategoriya</TableHead>
                                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3">Narx</TableHead>
                                        <TableHead className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3">Amallar</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {popularLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-10">
                                                <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                                            </TableCell>
                                        </TableRow>
                                    ) : popularList.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                                                Hozircha tezkor mahsulotlar yo'q
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        popularList.map((pop) => {
                                            const product = allProducts.find((p) => p.id === pop.productId);
                                            const cat = categories.find((c) => c.id === product?.productCategoryId);
                                            return (
                                                <TableRow key={pop.id}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                                                            {product?.name || "—"}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {cat ? (
                                                            <div className="flex items-center gap-1.5">
                                                                {cat.icon && (
                                                                    <img src={`${import.meta.env.VITE_API_BASE_URL}/image/${cat.icon}`}
                                                                        alt="" className="h-4 w-4 rounded object-cover" />
                                                                )}
                                                                <Badge variant="secondary">{cat.name}</Badge>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground text-sm">—</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-semibold">
                                                        {product ? formatPrice(product.price) : "—"}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() => setDeletePopularId(pop.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>
            )}

            {/* ══ Product Dialog ════════════════════════════════════════════════════ */}
            <Dialog open={prodDialog} onOpenChange={setProdDialog}>
                <DialogContent className="max-w-lg" onKeyDown={handleProdKeyDown}>
                    <DialogHeader>
                        <DialogTitle>
                            {editProd ? "Mahsulotni tahrirlash" : "Yangi mahsulot qo'shish"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>Nomi <span className="text-destructive">*</span></Label>
                            <Input placeholder="Mahsulot nomini kiriting" value={prodForm.name} autoFocus
                                onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })} />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Tavsif</Label>
                            <Input placeholder="Qisqacha tavsif (ixtiyoriy)" value={prodForm.desc}
                                onChange={(e) => setProdForm({ ...prodForm, desc: e.target.value })} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Narx (so'm) <span className="text-destructive">*</span></Label>
                                <Input type="number" placeholder="0" min={0} value={prodForm.price}
                                    onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Birlik <span className="text-destructive">*</span></Label>
                                <Select value={prodForm.unit} onValueChange={(v) => setProdForm({ ...prodForm, unit: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {UNIT_OPTIONS.map((u) => (
                                            <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Kategoriya <span className="text-destructive">*</span></Label>
                                <Select value={prodForm.productCategoryId}
                                    onValueChange={(v) => setProdForm({ ...prodForm, productCategoryId: v })}>
                                    <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                                    <SelectContent>
                                        {activeCats.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                <div className="flex items-center gap-2">
                                                    {c.icon && (
                                                        <img src={`${import.meta.env.VITE_API_BASE_URL}/image/${c.icon}`}
                                                            alt="" className="h-4 w-4 rounded object-cover" />
                                                    )}
                                                    {c.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Oshxona <span className="text-muted-foreground text-xs">(ixtiyoriy)</span></Label>
                                <Select value={prodForm.kitchenId || "NONE"}
                                    onValueChange={(v) => setProdForm({ ...prodForm, kitchenId: v === "NONE" ? "" : v })}>
                                    <SelectTrigger><SelectValue placeholder="Ixtiyoriy" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NONE">— Tanlanmagan —</SelectItem>
                                        {activeKitchens.map((k) => (
                                            <SelectItem key={k.id} value={k.id}>{k.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Qo'shimcha ma'lumot <span className="text-muted-foreground text-xs">(ixtiyoriy)</span></Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Masalan: Tuzi kamroq"
                                    value={additionalInfoInput}
                                    onChange={(e) => setAdditionalInfoInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const val = additionalInfoInput.trim();
                                            if (val && !prodAdditionalInfo.includes(val)) {
                                                setProdAdditionalInfo([...prodAdditionalInfo, val]);
                                            }
                                            setAdditionalInfoInput("");
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="shrink-0"
                                    onClick={() => {
                                        const val = additionalInfoInput.trim();
                                        if (val && !prodAdditionalInfo.includes(val)) {
                                            setProdAdditionalInfo([...prodAdditionalInfo, val]);
                                        }
                                        setAdditionalInfoInput("");
                                    }}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            {prodAdditionalInfo.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {prodAdditionalInfo.map((item, idx) => (
                                        <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                                            {item}
                                            <button
                                                type="button"
                                                onClick={() => setProdAdditionalInfo(prodAdditionalInfo.filter((_, i) => i !== idx))}
                                                className="text-muted-foreground hover:text-destructive transition-colors"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <ImageUpload
                            value={prodPhoto}
                            onChange={setProdPhoto}
                            label="Mahsulot rasmi"
                            hint="PNG, JPG • maks 5MB"
                            existingUrl={
                                editProd?.photo
                                    ? `${import.meta.env.VITE_API_BASE_URL}/image/${editProd.photo}`
                                    : null
                            }
                        />

                        <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 shrink-0" />
                            Filial: <span className="font-medium text-foreground ml-1">{selectedBranch?.name}</span>
                            <span className="ml-auto opacity-60">Enter → saqlash</span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setProdDialog(false)} disabled={isProdSaving}>
                            Bekor qilish
                        </Button>
                        <Button onClick={saveProd} disabled={isProdSaving}>
                            {isProdSaving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                            {editProd ? "Saqlash" : "Qo'shish"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ══ Category Dialog ═══════════════════════════════════════════════════ */}
            <Dialog open={catDialog} onOpenChange={setCatDialog}>
                <DialogContent className="max-w-sm" onKeyDown={handleCatKeyDown}>
                    <DialogHeader>
                        <DialogTitle>
                            {editCat ? "Kategoriyani tahrirlash" : "Yangi kategoriya"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>Nomi <span className="text-destructive">*</span></Label>
                            <Input placeholder="Kategoriya nomini kiriting" value={catName} autoFocus
                                onChange={(e) => setCatName(e.target.value)} />
                        </div>

                        <ImageUpload
                            value={catIcon}
                            onChange={setCatIcon}
                            label="Kategoriya ikonkasi"
                            hint="PNG, JPG • maks 2MB"
                            existingUrl={
                                editCat?.icon
                                    ? `${import.meta.env.VITE_API_BASE_URL}/image/${editCat.icon}`
                                    : null
                            }
                        />

                        <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 shrink-0" />
                            Filial: <span className="font-medium text-foreground ml-1">{selectedBranch?.name}</span>
                            <span className="ml-auto opacity-60">Enter → saqlash</span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCatDialog(false)} disabled={isCatSaving}>
                            Bekor qilish
                        </Button>
                        <Button onClick={saveCat} disabled={isCatSaving}>
                            {isCatSaving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                            {editCat ? "Saqlash" : "Qo'shish"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ══ Popular Dialog ════════════════════════════════════════════════════ */}
            <Dialog open={popularDialog} onOpenChange={setPopularDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Tezkor mahsulotga qo'shish</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>Mahsulot <span className="text-destructive">*</span></Label>
                            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                                <SelectTrigger><SelectValue placeholder="Mahsulotni tanlang" /></SelectTrigger>
                                <SelectContent>
                                    {availableForPopular.map((p) => {
                                        const cat = categories.find((c) => c.id === p.productCategoryId);
                                        return (
                                            <SelectItem key={p.id} value={p.id}>
                                                <div className="flex flex-col py-0.5">
                                                    <span className="font-medium">{p.name}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {cat?.name} • {formatPrice(p.price)}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Tezkor mahsulotlar afitsantlarga buyurtma tezroq berish imkonini beradi
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPopularDialog(false)} disabled={createPopularMutation.isPending}>
                            Bekor qilish
                        </Button>
                        <Button onClick={() => {
                            if (!selectedProductId) return toast.error("Mahsulotni tanlang");
                            createPopularMutation.mutate({ productId: selectedProductId, branchId: selectedBranchId });
                        }} disabled={createPopularMutation.isPending}>
                            {createPopularMutation.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                            Qo'shish
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ══ View Product Dialog ══════════════════════════════════════════════ */}
            <Dialog open={viewProdDialog} onOpenChange={setViewProdDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            Mahsulot tafsilotlari
                        </DialogTitle>
                    </DialogHeader>
                    {viewProd && (
                        <div className="space-y-4 py-1">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-semibold">{viewProd.name}</h3>
                                    {viewProd.desc && <p className="text-sm text-muted-foreground mt-0.5">{viewProd.desc}</p>}
                                </div>
                                <Badge variant={viewProd.status === "ACTIVE" ? "default" : "secondary"} className="shrink-0">
                                    {statusLabels[viewProd.status]}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="rounded-lg bg-muted/50 px-3 py-2">
                                    <p className="text-xs text-muted-foreground mb-0.5">Narx</p>
                                    <p className="font-semibold">{formatPrice(viewProd.price)}</p>
                                </div>
                                <div className="rounded-lg bg-muted/50 px-3 py-2">
                                    <p className="text-xs text-muted-foreground mb-0.5">Birlik</p>
                                    <p className="font-semibold">{UNIT_OPTIONS.find((u) => u.value === viewProd.unit)?.label || viewProd.unit}</p>
                                </div>
                                <div className="rounded-lg bg-muted/50 px-3 py-2">
                                    <p className="text-xs text-muted-foreground mb-0.5">Kategoriya</p>
                                    <p className="font-semibold">{categories.find((c) => c.id === viewProd.productCategoryId)?.name || "—"}</p>
                                </div>
                                <div className="rounded-lg bg-muted/50 px-3 py-2">
                                    <p className="text-xs text-muted-foreground mb-0.5">Oshxona</p>
                                    <p className="font-semibold">{activeKitchens.find((k) => k.id === viewProd.kitchenId)?.name || "—"}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Qo'shimcha ma'lumot</p>
                                {viewProd.additionalInfo?.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {viewProd.additionalInfo.map((info, idx) => (
                                            <span key={idx} className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium">
                                                {info}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Hozircha yo'q</p>
                                )}
                                <div className="flex gap-2 pt-1">
                                    <Input
                                        placeholder="Yangi ma'lumot qo'shish..."
                                        value={viewAddInfoInput}
                                        onChange={(e) => setViewAddInfoInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                const val = viewAddInfoInput.trim();
                                                if (val) {
                                                    addAdditionalInfoMutation.mutate({ id: viewProd.id, items: [val] });
                                                    setViewAddInfoInput("");
                                                }
                                            }
                                        }}
                                        className="h-9 text-sm"
                                    />
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="shrink-0 h-9"
                                        disabled={addAdditionalInfoMutation.isPending}
                                        onClick={() => {
                                            const val = viewAddInfoInput.trim();
                                            if (val) {
                                                addAdditionalInfoMutation.mutate({ id: viewProd.id, items: [val] });
                                                setViewAddInfoInput("");
                                            }
                                        }}
                                    >
                                        {addAdditionalInfoMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2">
                        <Button variant="outline" size="sm" onClick={() => setViewProdDialog(false)}>
                            Yopish
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setViewProdDialog(false); if (viewProd) openEditProd(viewProd); }}>
                            <Pencil className="h-3.5 w-3.5 mr-1.5" /> Tahrirlash
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => { setViewProdDialog(false); if (viewProd) setDeleteProdId(viewProd.id); }}>
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> O'chirish
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ══ Delete Product ════════════════════════════════════════════════════ */}
            <AlertDialog open={!!deleteProdId} onOpenChange={() => setDeleteProdId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Mahsulotni o'chirish</AlertDialogTitle>
                        <AlertDialogDescription>Bu mahsulot butunlay o'chiriladi. Qaytarib bo'lmaydi.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteProdId && deleteProductMutation.mutate(deleteProdId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleteProductMutation.isPending}>
                            {deleteProductMutation.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                            O'chirish
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ══ Delete Category ═══════════════════════════════════════════════════ */}
            <AlertDialog open={!!deleteCatId} onOpenChange={() => setDeleteCatId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Kategoriyani o'chirish</AlertDialogTitle>
                        <AlertDialogDescription>
                            Unga bog'liq{" "}
                            <strong>
                                {deleteCatId ? allProducts.filter((p) => p.productCategoryId === deleteCatId).length : 0} ta mahsulot
                            </strong>{" "}
                            ham o'chishi mumkin. Davom etasizmi?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteCatId && deleteCategoryMutation.mutate(deleteCatId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleteCategoryMutation.isPending}>
                            {deleteCategoryMutation.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                            O'chirish
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ══ Delete Popular ════════════════════════════════════════════════════ */}
            <AlertDialog open={!!deletePopularId} onOpenChange={() => setDeletePopularId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tezkor mahsulotdan o'chirish</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu mahsulot tezkor ro'yxatdan olib tashlanadi. Asosiy mahsulotlar ro'yxatida qoladi.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deletePopularId && deletePopularMutation.mutate(deletePopularId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deletePopularMutation.isPending}>
                            {deletePopularMutation.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                            O'chirish
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
