import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, MoreVertical, Eye, Pencil, Trash2, Wifi, Hash } from "lucide-react";
import { toast } from "sonner";
import { kitchenService, Kitchen } from "@/services/kitchenService";
import { useBranch } from "@/contexts/BranchContext";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Kitchens() {
    const queryClient = useQueryClient();
    const isMobile = useIsMobile();

    const { branches, branchesLoading, selectedBranchId, setSelectedBranchId } = useBranch();
    const safeBranches = branches;

    const [search, setSearch] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editItem, setEditItem] = useState<Kitchen | null>(null);
    const [detailItem, setDetailItem] = useState<Kitchen | null>(null);
    const [form, setForm] = useState({ name: "", branchId: selectedBranchId, posIp: "", posPort: "" });

    // ================= KITCHENS =================
    const { data: kitchensList = [] } = useQuery({
        queryKey: ["kitchens", selectedBranchId],
        queryFn: () => kitchenService.getAll(selectedBranchId),
        enabled: !!selectedBranchId,
        select: (res: any) => {
            const raw = res?.data?.data ?? res?.data ?? res ?? [];
            return Array.isArray(raw) ? raw : [];
        },
        initialData: [],
    });

    const safeKitchens = Array.isArray(kitchensList) ? kitchensList : [];

    const filtered = safeKitchens.filter((k: Kitchen) =>
        k.name?.toLowerCase().includes(search.toLowerCase())
    );

    // ================= MUTATIONS =================
    const createMutation = useMutation({
        mutationFn: () =>
            kitchenService.create({
                name: form.name,
                branchId: form.branchId,
                ...(form.posIp ? { posIp: form.posIp } : {}),
                ...(form.posPort ? { posPort: form.posPort } : {}),
            }),
        onSuccess: () => {
            toast.success("Oshxona yaratildi");
            queryClient.invalidateQueries({ queryKey: ["kitchens", selectedBranchId] });
            setDialogOpen(false);
            setForm({ name: "", branchId: selectedBranchId, posIp: "", posPort: "" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: () =>
            kitchenService.update(editItem!.id, {
                name: form.name,
                ...(form.posIp ? { posIp: form.posIp } : {}),
                ...(form.posPort ? { posPort: form.posPort } : {}),
            }),
        onSuccess: () => {
            toast.success("Oshxona yangilandi");
            queryClient.invalidateQueries({ queryKey: ["kitchens", selectedBranchId] });
            setDialogOpen(false);
            setEditItem(null);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => kitchenService.delete(id),
        onSuccess: () => {
            toast.success("O'chirildi");
            queryClient.invalidateQueries({ queryKey: ["kitchens", selectedBranchId] });
            setDeleteId(null);
        },
    });

    const toggleMutation = useMutation({
        mutationFn: (id: string) => kitchenService.toggleStatus(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["kitchens", selectedBranchId] });
        },
    });

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    const openAdd = () => {
        setEditItem(null);
        setForm({ name: "", branchId: selectedBranchId, posIp: "", posPort: "" });
        setDialogOpen(true);
    };

    const openEdit = (k: Kitchen) => {
        setEditItem(k);
        setForm({ name: k.name, branchId: k.branchId, posIp: k.posIp || "", posPort: k.posPort || "" });
        setDialogOpen(true);
    };

    const handleSave = () => {
        if (!form.name.trim()) return toast.error("Nom kiriting");
        editItem ? updateMutation.mutate() : createMutation.mutate();
    };

    // ================= UI =================
    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Oshxonalar</h2>
                <Button onClick={openAdd} size="sm">
                    <Plus className="h-4 w-4 mr-1" /> Qo'shish
                </Button>
            </div>

            <div className="flex gap-3 mb-4 flex-wrap">
                <Input
                    placeholder="Qidirish..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-xs"
                />

                <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                    <SelectTrigger className="w-full sm:max-w-xs">
                        <SelectValue placeholder="Filial tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                        {safeBranches.map((b: any) => (
                            <SelectItem key={b.id} value={b.id}>
                                {b.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* ═══ MOBILE CARDS ═══ */}
            <div className="md:hidden space-y-3">
                {filtered.length === 0 ? (
                    <Card className="p-8 text-center text-muted-foreground text-sm">
                        Ma'lumot yo'q
                    </Card>
                ) : (
                    filtered.map((k: Kitchen) => (
                        <Card key={k.id} className="p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="min-w-0">
                                        <p className="font-medium text-foreground truncate">{k.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Switch
                                        checked={k.status === "ACTIVE"}
                                        onCheckedChange={() => toggleMutation.mutate(k.id)}
                                        disabled={toggleMutation.isPending}
                                    />
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => setDetailItem(k)}>
                                                <Eye className="h-4 w-4 mr-2" />
                                                Batafsil
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => openEdit(k)}>
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Tahrirlash
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                onClick={() => setDeleteId(k.id)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                O'chirish
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* ═══ DESKTOP TABLE ═══ */}
            <div className="hidden md:block">
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nomi</TableHead>
                                <TableHead>POS IP</TableHead>
                                <TableHead>POS Port</TableHead>
                                <TableHead>Holat</TableHead>
                                <TableHead className="text-right">Amallar</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((k: Kitchen) => (
                                <TableRow key={k.id}>
                                    <TableCell>{k.name}</TableCell>
                                    <TableCell>{k.posIp || "—"}</TableCell>
                                    <TableCell>{k.posPort || "—"}</TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={k.status === "ACTIVE"}
                                            onCheckedChange={() => toggleMutation.mutate(k.id)}
                                            disabled={toggleMutation.isPending}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openEdit(k)}>
                                                    <Pencil className="h-4 w-4 mr-2" /> Tahrirlash
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteId(k.id)}>
                                                    <Trash2 className="h-4 w-4 mr-2" /> O'chirish
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {filtered.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        Ma'lumot yo'q
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>

            {/* ═══ DETAIL SHEET (mobile) ═══ */}
            <Sheet open={!!detailItem} onOpenChange={() => setDetailItem(null)}>
                <SheetContent side="bottom" className="rounded-t-2xl">
                    <SheetHeader>
                        <SheetTitle>Oshxona ma'lumotlari</SheetTitle>
                    </SheetHeader>
                    {detailItem && (
                        <div className="space-y-4 py-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Nomi</span>
                                <span className="font-medium">{detailItem.name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                                    <Wifi className="h-3.5 w-3.5" /> POS IP
                                </span>
                                <span className="font-mono text-sm">{detailItem.posIp || "—"}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                                    <Hash className="h-3.5 w-3.5" /> POS Port
                                </span>
                                <span className="font-mono text-sm">{detailItem.posPort || "—"}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Holat</span>
                                <Badge variant={detailItem.status === "ACTIVE" ? "default" : "secondary"}>
                                    {detailItem.status === "ACTIVE" ? "Faol" : "Nofaol"}
                                </Badge>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button size="icon" variant="outline" onClick={() => { setDetailItem(null); openEdit(detailItem); }}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="destructive" onClick={() => { setDetailItem(null); setDeleteId(detailItem.id); }}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* ADD / EDIT DIALOG */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editItem ? "Tahrirlash" : "Yangi oshxona"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Nomi</Label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>POS IP manzili (ixtiyoriy)</Label>
                            <Input
                                placeholder="192.168.1.100"
                                value={form.posIp}
                                onChange={(e) => setForm({ ...form, posIp: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>POS Port (ixtiyoriy)</Label>
                            <Input
                                placeholder="9100"
                                value={form.posPort}
                                onChange={(e) => setForm({ ...form, posPort: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Bekor qilish
                        </Button>
                        <Button onClick={handleSave} disabled={isSubmitting}>
                            {isSubmitting && (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            )}
                            Saqlash
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DELETE CONFIRM */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Rostdan ham o'chirmoqchimisiz?
                        </AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Bekor</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                        >
                            O'chirish
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
