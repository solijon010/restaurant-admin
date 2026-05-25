import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { branchService, BranchPayload, BranchResponse } from "@/services/branchService";
import { Plus, Loader2, Percent, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/userService";
import { statusLabels } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";

export default function ManagerBranches() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [search, setSearch] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editItem, setEditItem] = useState<BranchResponse | null>(null);
    const [form, setForm] = useState({ name: "", addres: "", kpi: "" });

    const { data: branchData, isLoading: branchesLoading, isError } = useQuery({
        queryKey: ["branches"],
        queryFn: () => branchService.getAll(),
    });

    const branchList: BranchResponse[] = Array.isArray(branchData) ? branchData : (branchData as any)?.data || [];

    const { data: allUsersData } = useQuery({
        queryKey: ["all-users"],
        queryFn: async () => {
            try {
                const allStaff = [];
                for (const branch of branchList) {
                    try {
                        const response = await userService.getStaffByBranch(branch.id);
                        let staffData = [];
                        if (response?.data?.data && Array.isArray(response.data.data)) {
                            staffData = response.data.data;
                        } else if (response?.data && Array.isArray(response.data)) {
                            staffData = response.data;
                        } else if (Array.isArray(response)) {
                            staffData = response;
                        }
                        allStaff.push(...staffData);
                    } catch (err) {
                        console.error(`Error fetching staff for branch ${branch.id}:`, err);
                    }
                }
                return allStaff;
            } catch (error) {
                console.error("Error fetching all users:", error);
                return [];
            }
        },
        enabled: branchList.length > 0,
    });

    const allUsers = Array.isArray(allUsersData) ? allUsersData : [];

    const createMutation = useMutation({
        mutationFn: (data: BranchPayload) => branchService.create(data),
        onSuccess: () => {
            toast.success("Filial yaratildi");
            queryClient.invalidateQueries({ queryKey: ["branches"] });
            queryClient.invalidateQueries({ queryKey: ["all-users"] });
            setDialogOpen(false);
            setForm({ name: "", addres: "", kpi: "" });
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Xatolik yuz berdi");
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: BranchPayload }) =>
            branchService.update(id, data),
        onSuccess: () => {
            toast.success("Filial yangilandi");
            queryClient.invalidateQueries({ queryKey: ["branches"] });
            setDialogOpen(false);
            setEditItem(null);
            setForm({ name: "", addres: "", kpi: "" });
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Xatolik yuz berdi");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => branchService.delete(id),
        onSuccess: () => {
            toast.success("Filial o'chirildi");
            queryClient.invalidateQueries({ queryKey: ["branches"] });
            queryClient.invalidateQueries({ queryKey: ["all-users"] });
            setDeleteId(null);
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Xatolik yuz berdi");
        },
    });

    const toggleMutation = useMutation({
        mutationFn: (id: string) => branchService.toggleStatus(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["branches"] });
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Xatolik yuz berdi");
        },
    });

    const filtered = branchList.filter((b) =>
        b.name?.toLowerCase().includes(search.toLowerCase())
    );

    const getStaffCount = (branchId: string): number =>
        allUsers.filter((u) => u.branchId === branchId).length;

    const openAdd = () => {
        setEditItem(null);
        setForm({ name: "", addres: "", kpi: "" });
        setDialogOpen(true);
    };

    const openEdit = (b: BranchResponse) => {
        setEditItem(b);
        setForm({
            name: b.name,
            addres: b.addres || "",
            kpi: b.kpi != null ? String(b.kpi) : "",
        });
        setDialogOpen(true);
    };

    const handleSave = () => {
        if (!form.name.trim()) {
            toast.error("Filial nomini kiriting");
            return;
        }
        const kpiValue = Number(form.kpi);
        if (
            form.kpi !== "" &&
            (isNaN(kpiValue) || kpiValue < 0 || kpiValue > 100)
        ) {
            toast.error("KPI 0 dan 100 gacha bo'lishi kerak");
            return;
        }

        const payload: BranchPayload = {
            name: form.name.trim(),
            addres: form.addres.trim(),
            kpi: form.kpi === "" ? 0 : kpiValue,
        };

        if (editItem) {
            updateMutation.mutate({ id: editItem.id, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    if (branchesLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-destructive font-medium mb-2">Xatolik yuz berdi</p>
                    <Button
                        onClick={() =>
                            queryClient.invalidateQueries({ queryKey: ["branches"] })
                        }
                    >
                        Qayta urinish
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Filiallar</h2>
                <Button onClick={openAdd} size="sm">
                    <Plus className="h-4 w-4 mr-1" /> Qo'shish
                </Button>
            </div>

            <Input
                placeholder="Qidirish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs mb-4"
            />

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nomi</TableHead>
                            <TableHead>Manzil</TableHead>
                            <TableHead>Xodimlar</TableHead>
                            <TableHead>KPI (afitsant ulushi)</TableHead>
                            <TableHead>Holat</TableHead>
                            <TableHead className="text-right">Amallar</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((b) => {
                            const staffCount = getStaffCount(b.id);
                            return (
                                <TableRow key={b.id}>
                                    <TableCell className="font-medium">{b.name || "—"}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {b.addres || "—"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{staffCount}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {b.kpi != null ? (
                                            <div className="flex items-center gap-1.5">
                                                <div className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md px-2 py-0.5 text-sm font-semibold w-fit">
                                                    <Percent className="h-3.5 w-3.5" />
                                                    {b.kpi}
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    har buyurtmadan
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={b.status === "ACTIVE"}
                                                onCheckedChange={() => toggleMutation.mutate(b.id)}
                                                disabled={toggleMutation.isPending}
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                {statusLabels[b.status as keyof typeof statusLabels] ||
                                                    b.status}
                                            </span>
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
                                                <DropdownMenuItem onClick={() => openEdit(b)}>
                                                    <Pencil className="h-4 w-4 mr-2" /> Tahrirlash
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteId(b.id)}>
                                                    <Trash2 className="h-4 w-4 mr-2" /> O'chirish
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-center text-muted-foreground py-8"
                                >
                                    {search ? "Filial topilmadi" : "Hozircha filiallar yo'q"}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editItem ? "Filialni tahrirlash" : "Yangi filial"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>
                                Nomi <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="Filial nomi"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Manzil</Label>
                            <Input
                                value={form.addres}
                                onChange={(e) => setForm({ ...form, addres: e.target.value })}
                                placeholder="Filial manzili"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center gap-1.5">
                                <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                                Afitsant KPI ulushi (%)
                            </Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={form.kpi}
                                    onChange={(e) => setForm({ ...form, kpi: e.target.value })}
                                    placeholder="Masalan: 10"
                                    className="pr-8"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                                    %
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Afitsant har bir buyurtmadan oladigan foiz ulushi. 0-100
                                oralig'ida kiriting.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            disabled={isSubmitting}
                        >
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

            {/* O'chirish Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Filialni o'chirish</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu filialdagi barcha xodimlar, mahsulotlar va buyurtmalar o'chib
                            ketadi. Aniq o'chirmoqchimisiz?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>
                            Bekor qilish
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                            disabled={deleteMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteMutation.isPending && (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            )}
                            O'chirish
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
