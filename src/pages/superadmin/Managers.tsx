import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useState, useMemo } from "react";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { userService, ManagerPayload, User, ManagerUpdatePayload } from "@/services/userService";
import { companyService, Company } from "@/services/companyService";
import { branches, statusLabels } from "@/lib/mock-data"; // filiallar va status labellar static qoladi

export default function Managers() {
    const queryClient = useQueryClient();

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "INACTIVE" | "">(
        ""
    );
    const [offset, setOffset] = useState(0);
    const [limit] = useState(20);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editItem, setEditItem] = useState<User | null>(null);
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        password: "",
        companyId: "",
        branchId: "",
    });

    // Fetch managers with search and status filter
    const { data: managersList = [], isLoading } = useQuery({
        queryKey: ["managers", statusFilter],
        queryFn: async () => {
            try {
                const res = await userService.getManagers({
                    status: statusFilter || "ACTIVE",
                });
                return res.data?.data || [];
            } catch (err) {
                toast.error("Menejerlarni olishda xatolik yuz berdi");
                return [];
            }
        },
    });



    // Fetch companies
    const { data: companiesList = [] } = useQuery({
        queryKey: ["companies"],
        queryFn: async () => {
            try {
                const res = await companyService.getAll() as any;
                return Array.isArray(res.data) ? res.data : res.data?.data || [];
            } catch {
                toast.error("Kompaniyalarni olishda xatolik yuz berdi");
                return [];
            }
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: ManagerPayload) => userService.createManager(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["managers"] });
            toast.success("Menejer yaratildi");
        },
        onError: () => toast.error("Xatolik yuz berdi"),
    });

    const filtered = useMemo(() => {
        return managersList;
    }, [managersList]);

    const openAdd = () => {
        setEditItem(null);
        setForm({
            firstName: "",
            lastName: "",
            phoneNumber: "",
            password: "",
            companyId: "",
            branchId: "",
        });
        setDialogOpen(true);
    };

    const openEdit = (m: User) => {
        setEditItem(m);
        setForm({
            firstName: m.firstName,
            lastName: m.lastName,
            phoneNumber: m.phoneNumber,
            password: "",
            companyId: m.companyId || "",
            branchId: m.branchId || "",
        });
        setDialogOpen(true);
    };

    const handleSave = () => {
        if (!editItem) {
            const payload: ManagerPayload = {
                firstName: form.firstName,
                lastName: form.lastName,
                phoneNumer: form.phoneNumber,
                password: form.password,
                companyId: form.companyId,
            };
            createMutation.mutate(payload);
        } else {
            const updatePayload: ManagerUpdatePayload = {
                firstName: form.firstName,
                lastName: form.lastName,
                phoneNumer: form.phoneNumber,
                password: form.password,
            };
            userService
                .updateManager(editItem.id, updatePayload)
                .then(() => {
                    queryClient.invalidateQueries({ queryKey: ["managers"] });
                    toast.success("Menejer yangilandi");
                })
                .catch(() => toast.error("Xatolik yuz berdi"));
        }

        setDialogOpen(false);
    };


    const handleDelete = () => {
        if (deleteId) {
            userService
                .deleteManager(deleteId)
                .then(() => {
                    queryClient.invalidateQueries({ queryKey: ["managers"] });
                    toast.success("Menejer o‘chirildi");
                })
                .catch(() => toast.error("Xatolik yuz berdi"));
            setDeleteId(null);
        }
    };

    const companyBranches = form.companyId
        ? branches.filter((b) => b.companyId === form.companyId)
        : [];

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Menejerlar</h2>
                <Button onClick={openAdd} size="sm">
                    <Plus className="h-4 w-4 mr-1" /> Qo'shish
                </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-4">
                <Input
                    placeholder="Qidirish..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-xs"
                />
                <Select
                    value={statusFilter}
                    onValueChange={(v) =>
                        setStatusFilter(v === "ALL" ? "" : (v as "ACTIVE" | "INACTIVE"))
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Holat" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Hammasi</SelectItem>
                        <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                        <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Ism familiya</TableHead>
                                <TableHead>Telefon</TableHead>
                                <TableHead>Kompaniya</TableHead>
                                <TableHead>Holat</TableHead>
                                <TableHead className="text-right">Amallar</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((m) => {
                                const company = (companiesList as Company[]).find(
                                    (c) => c.id === m.companyId
                                );
                                const branch = branches.find((b) => b.id === m.branchId);
                                return (
                                    <TableRow key={m.id}>
                                        <TableCell className="font-medium">
                                            {m.firstName} {m.lastName}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {m.phoneNumer}
                                        </TableCell>
                                        <TableCell>{company?.name || "—"}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    m.status === "ACTIVE" ? "default" : "secondary"
                                                }
                                            >
                                                {statusLabels[m.status] || m.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openEdit(m)}
                                            >
                                                Tahrirlash
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive"
                                                onClick={() => setDeleteId(m.id)}
                                            >
                                                O'chirish
                                            </Button>
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
                                        Menejer topilmadi
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>
            )}

            {/* Dialog for Add/Edit */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editItem ? "Menejerni tahrirlash" : "Yangi menejer"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Ism</Label>
                                <Input
                                    value={form.firstName}
                                    onChange={(e) =>
                                        setForm({ ...form, firstName: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Familiya</Label>
                                <Input
                                    value={form.lastName}
                                    onChange={(e) =>
                                        setForm({ ...form, lastName: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Telefon</Label>
                            <Input
                                value={form.phoneNumber}
                                onChange={(e) =>
                                    setForm({ ...form, phoneNumber: e.target.value })
                                }
                            />
                        </div>
                        {(
                            <div className="space-y-2">
                                <Label>Parol</Label>
                                <Input
                                    type="password"
                                    value={form.password}
                                    onChange={(e) =>
                                        setForm({ ...form, password: e.target.value })
                                    }
                                />
                            </div>
                        )}
                        {!editItem && (
                            <div className="space-y-2">
                                <Label>Kompaniya</Label>
                                <Select
                                    value={form.companyId}
                                    onValueChange={(v) =>
                                        setForm({ ...form, companyId: v, branchId: "" })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tanlang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(companiesList as Company[]).map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {!editItem && companyBranches.length > 0 && (
                            <div className="space-y-2">
                                <Label>Filial</Label>
                                <Select
                                    value={form.branchId}
                                    onValueChange={(v) => setForm({ ...form, branchId: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tanlang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {companyBranches.map((b) => (
                                            <SelectItem key={b.id} value={b.id}>
                                                {b.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {companyBranches.length > 0 && (
                            <div className="space-y-2">
                                <Label>Filial</Label>
                                <Select
                                    value={form.branchId}
                                    onValueChange={(v) => setForm({ ...form, branchId: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tanlang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {companyBranches.map((b) => (
                                            <SelectItem key={b.id} value={b.id}>
                                                {b.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Bekor qilish
                        </Button>
                        <Button onClick={handleSave} disabled={createMutation.isPending}>
                            {createMutation.isPending && (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            )}
                            Saqlash
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* AlertDialog for Delete */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Menejerni o'chirish</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu amalni ortga qaytarib bo'lmaydi. Aniq o'chirmoqchimisiz?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            O'chirish
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
