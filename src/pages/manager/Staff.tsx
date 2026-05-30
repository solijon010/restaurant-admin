import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  userService,
  StaffPayload,
  StaffUpdatePayload,
  UserResponse,
} from "@/services/userService";
import { useBranch } from "@/contexts/BranchContext";
import { roleLabels, statusLabels, UserRole } from "@/lib/mock-data";
import { Plus, Loader2, MoreVertical, Eye, Pencil, Trash2, Users, KeyRound, Banknote } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
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

// ✅ Xodim rollari (SUPER_AFITSANT ham qo'shilgan)
const STAFF_ROLES: UserRole[] = [
  "MANAGER",
  "AFITSANT",
  "SUPER_AFITSANT", // ← Bu yerda mavjud
  "CHEF",
  "KASSA",
];

type ApiError = { response?: { data?: { message?: string } } };
const errMsg = (e: unknown, fallback: string) => (e as ApiError)?.response?.data?.message || fallback;

export default function ManagerStaff() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const { branches: branchList, branchesLoading: _bl, selectedBranchId, setSelectedBranchId } = useBranch();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<UserResponse | null>(null);
  const [detailItem, setDetailItem] = useState<UserResponse | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumer: "",
    password: "",
    role: "AFITSANT" as UserRole,
    branchId: "",
    salary: "",
    pinCode: "",
  });

  const activeBranchId = selectedBranchId || branchList[0]?.id || "";

  // 📦 Tanlangan filial bo'yicha xodimlarni olish
  const {
    data: userData,
    isLoading: usersLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["users", activeBranchId],
    queryFn: async () => {
      try {
        const response = await userService.getStaffByBranch(activeBranchId);

        // Axios response: response.data.data (double wrapped)
        if (response?.data?.data && Array.isArray(response.data.data)) {
          return response.data.data;
        }

        // Backend paginated: response.data
        if (response?.data && Array.isArray(response.data)) {
          return response.data;
        }

        // Direct array
        if (Array.isArray(response)) {
          return response;
        }

        return [];
      } catch (err: unknown) {
        const e = err as { response?: { status?: number } };
        if (e?.response?.status === 404) return [];
        throw err;
      }
    },
    enabled: !!activeBranchId,
  });

  const staffList: UserResponse[] = Array.isArray(userData) ? userData : [];

  // Client-side filtering
  const filtered = staffList.filter((u) => {
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    const matchSearch =
      !search ||
      fullName.includes(search.toLowerCase()) ||
      u.phoneNumer?.includes(search);
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // ✅ Xodim yaratish
  const createMutation = useMutation({
    mutationFn: (data: StaffPayload) => userService.createStaff(data),
    onSuccess: () => {
      toast.success("Xodim yaratildi");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDialogOpen(false);
      setForm({
        firstName: "",
        lastName: "",
        phoneNumer: "",
        password: "",
        role: "AFITSANT",
        branchId: "",
        salary: "",
        pinCode: "",
      });
    },
    onError: (error: unknown) => {
      toast.error(errMsg(error, "Xatolik yuz berdi"));
    },
  });

  // ✅ Xodim tahrirlash
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: StaffUpdatePayload }) =>
      userService.update(id, data),
    onSuccess: () => {
      toast.success("Xodim yangilandi");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDialogOpen(false);
      setEditItem(null);
      setForm({
        firstName: "",
        lastName: "",
        phoneNumer: "",
        password: "",
        role: "AFITSANT",
        branchId: "",
        salary: "",
        pinCode: "",
      });
    },
    onError: (error: unknown) => {
      toast.error(errMsg(error, "Xatolik yuz berdi"));
    },
  });

  // ✅ Status o'zgartirish (PATCH /user/status/{id})
  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => userService.toggleStatus(id),
    onSuccess: (_response, id) => {
      const user = staffList.find((u) => u.id === id);
      const newStatus = user?.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

      toast.success(
        `Status ${newStatus === "ACTIVE" ? "faollashtirildi" : "o'chirildi"}`
      );
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: unknown) => {
      toast.error(errMsg(error, "Status o'zgartirishda xatolik"));
    },
  });

  // ✅ Xodim o'chirish
  const deleteMutation = useMutation({
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: () => {
      toast.success("Xodim o'chirildi");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDeleteId(null);
    },
    onError: (error: unknown) => {
      toast.error(errMsg(error, "Xatolik yuz berdi"));
    },
  });

  // --- Dialoglar ---
  const openAdd = () => {
    setEditItem(null);
    setForm({
      firstName: "",
      lastName: "",
      phoneNumer: "",
      password: "",
      role: "AFITSANT",
      branchId: activeBranchId,
      salary: "",
      pinCode: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (u: UserResponse) => {
    setEditItem(u);
    setForm({
      firstName: u.firstName,
      lastName: u.lastName,
      phoneNumer: u.phoneNumer || "",
      password: "",
      role: u.role as UserRole,
      branchId: u.branchId || "",
      salary: u.salary != null ? String(u.salary) : "",
      pinCode: "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    // Validatsiya
    if (!form.firstName.trim()) {
      toast.error("Ism kiriting");
      return;
    }
    if (!form.lastName.trim()) {
      toast.error("Familiya kiriting");
      return;
    }
    if (!form.phoneNumer.trim()) {
      toast.error("Telefon raqam kiriting");
      return;
    }
    if (!editItem && !form.password.trim()) {
      toast.error("Parol kiriting");
      return;
    }
    if (!form.branchId) {
      toast.error("Filialni tanlang");
      return;
    }

    const isWaiterRole = ["AFITSANT", "SUPER_AFITSANT"].includes(form.role);

    if (editItem) {
      // Tahrirlash — role va branchId YUBORILMAYDI
      const updateData: StaffUpdatePayload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumer: form.phoneNumer.trim(),
      };
      if (form.password && form.password.trim().length > 0) {
        updateData.password = form.password.trim();
      }
      if (form.salary && !isNaN(Number(form.salary))) {
        updateData.salary = Number(form.salary);
      }
      updateMutation.mutate({ id: editItem.id, data: updateData });
    } else {
      // Yangi xodim yaratish
      const payload: StaffPayload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumer: form.phoneNumer.trim(),
        password: form.password.trim(),
        role: form.role as "MANAGER" | "AFITSANT" | "CHEF" | "KASSA" | "SUPER_AFITSANT",
        branchId: form.branchId,
        salary: Number(form.salary) || 0,
      };
      // Afitsantlar uchun parol PIN sifatida ham saqlanadi
      if (isWaiterRole) {
        payload.pinCode = form.password.trim();
      }
      createMutation.mutate(payload);
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  const handleToggleStatus = (id: string) => {
    toggleStatusMutation.mutate(id);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (usersLoading) {
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
          <p className="text-sm text-muted-foreground mb-4">
            {error?.toString() || "Ma'lumotlarni yuklashda xatolik"}
          </p>
          <Button
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["users"] })
            }
          >
            Qayta urinish
          </Button>
        </div>
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    const map: Record<string, string> = {
      MANAGER: "bg-purple-100 text-purple-700 border-purple-200",
      AFITSANT: "bg-emerald-100 text-emerald-700 border-emerald-200",
      CHEF: "bg-orange-100 text-orange-700 border-orange-200",
      KASSA: "bg-green-100 text-green-700 border-green-200",
      SUPER_AFITSANT: "bg-emerald-100 text-emerald-700 border-emerald-200",
    };
    return map[role] || "bg-slate-100 text-slate-600 border-slate-200";
  };

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground leading-tight">Xodimlar</h2>
            <p className="text-xs text-muted-foreground">Xodimlarni boshqaring</p>
          </div>
        </div>
        <Button onClick={openAdd} size="sm" disabled={!activeBranchId} className="gap-1.5">
          <Plus className="h-4 w-4" /> Qo'shish
        </Button>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────────── */}
      <div className="bg-muted/40 rounded-2xl p-3 mb-4 flex flex-wrap items-center gap-3">
        <Select value={activeBranchId} onValueChange={setSelectedBranchId}>
          <SelectTrigger className="w-48 bg-background">
            <SelectValue placeholder="Filialni tanlang" />
          </SelectTrigger>
          <SelectContent>
            {branchList.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs bg-background"
        />

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-44 bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Hammasi</SelectItem>
            {STAFF_ROLES.map((r) => (
              <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filtered.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {filtered.length} ta xodim
          </span>
        )}
      </div>

      {/* ═══ MOBILE CARDS ═══ */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <Card className="shadow-sm border border-border/60 rounded-2xl overflow-hidden">
            <div className="py-16 flex flex-col items-center gap-3 text-center px-6">
              <Users className="h-12 w-12 text-muted-foreground opacity-20" />
              <p className="font-medium text-foreground">
                {!activeBranchId ? "Filialni tanlang" : search || roleFilter !== "ALL" ? "Xodim topilmadi" : "Hozircha xodimlar yo'q"}
              </p>
              <p className="text-sm text-muted-foreground">
                {!activeBranchId ? "Davom etish uchun filial tanlang" : "Mezonni o'zgartirib ko'ring"}
              </p>
            </div>
          </Card>
        ) : (
          filtered.map((u) => {
            const isActive = u.status === "ACTIVE";
            return (
              <Card key={u.id} className="p-4 shadow-sm border border-border/60 rounded-2xl">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{u.firstName} {u.lastName}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getRoleBadge(u.role)}`}>
                        {roleLabels[u.role as keyof typeof roleLabels] || u.role}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${isActive ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                        {statusLabels[u.status as keyof typeof statusLabels] || u.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={isActive}
                      onCheckedChange={() => handleToggleStatus(u.id)}
                      disabled={toggleStatusMutation.isPending}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setDetailItem(u)}>
                          <Eye className="h-4 w-4 mr-2" /> Batafsil
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(u)}>
                          <Pencil className="h-4 w-4 mr-2" /> Tahrirlash
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteId(u.id)}>
                          <Trash2 className="h-4 w-4 mr-2" /> O'chirish
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* ═══ DESKTOP TABLE ═══ */}
      <div className="hidden md:block">
        <Card className="shadow-sm border border-border/60 rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/50">
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ism familiya</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Telefon</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lavozim</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <span className="flex items-center gap-1"><KeyRound className="h-3.5 w-3.5 text-violet-500" />PIN</span>
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Holat</TableHead>
                <TableHead className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="py-16 flex flex-col items-center gap-3 text-center">
                      <Users className="h-12 w-12 text-muted-foreground opacity-20" />
                      <p className="font-medium text-foreground">
                        {!activeBranchId ? "Filialni tanlang" : search || roleFilter !== "ALL" ? "Xodim topilmadi" : "Hozircha xodimlar yo'q"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {!activeBranchId ? "Davom etish uchun filial tanlang" : "Mezonni o'zgartirib ko'ring"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => {
                  const branch = branchList.find((b) => b.id === u.branchId);
                  const isActive = u.status === "ACTIVE";
                  return (
                    <TableRow key={u.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">{u.firstName} {u.lastName}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">{u.phoneNumer || "—"}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getRoleBadge(u.role)}`}>
                          {roleLabels[u.role as keyof typeof roleLabels] || u.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        {["AFITSANT", "SUPER_AFITSANT"].includes(u.role) ? (
                          u.pinCode
                            ? <span className="font-mono font-bold text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-lg tracking-widest text-sm">{u.pinCode}</span>
                            : <span className="text-xs text-muted-foreground italic">—</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={isActive}
                            onCheckedChange={() => handleToggleStatus(u.id)}
                            disabled={toggleStatusMutation.isPending}
                          />
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${isActive ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                            {statusLabels[u.status as keyof typeof statusLabels] || u.status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetailItem(u)}><Eye className="h-4 w-4 mr-2" /> Batafsil</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(u)}><Pencil className="h-4 w-4 mr-2" /> Tahrirlash</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteId(u.id)}><Trash2 className="h-4 w-4 mr-2" /> O'chirish</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* ═══ DETAIL SHEET ═══ */}
      <Sheet open={!!detailItem} onOpenChange={() => setDetailItem(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader><SheetTitle>Xodim ma'lumotlari</SheetTitle></SheetHeader>
          {detailItem && (
            <div className="space-y-3 py-4">
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Ism</span><span className="font-medium">{detailItem.firstName} {detailItem.lastName}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Telefon</span><span className="font-mono text-sm">{detailItem.phoneNumer || "—"}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Lavozim</span><Badge variant="outline">{roleLabels[detailItem.role as keyof typeof roleLabels] || detailItem.role}</Badge></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Filial</span><span className="text-sm">{branchList.find(b => b.id === detailItem.branchId)?.name || "—"}</span></div>
              {detailItem.salary != null && (
                <div className="flex justify-between"><span className="text-sm text-muted-foreground flex items-center gap-1"><Banknote className="h-3.5 w-3.5 text-emerald-500" />Oylik maosh</span><span className="font-medium text-emerald-600">{Number(detailItem.salary).toLocaleString()} so'm</span></div>
              )}
              {["AFITSANT", "SUPER_AFITSANT"].includes(detailItem.role) && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center gap-1"><KeyRound className="h-3.5 w-3.5 text-violet-500" />PIN kod</span>
                  {detailItem.pinCode
                    ? <span className="font-mono font-bold text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-lg tracking-widest">{detailItem.pinCode}</span>
                    : <span className="text-xs text-muted-foreground italic">Belgilanmagan</span>
                  }
                </div>
              )}
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Holat</span><Badge variant={detailItem.status === "ACTIVE" ? "default" : "secondary"}>{statusLabels[detailItem.status as keyof typeof statusLabels] || detailItem.status}</Badge></div>
              <div className="flex gap-2 pt-2">
                <Button size="icon" variant="outline" onClick={() => { const item = detailItem; setDetailItem(null); openEdit(item); }}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="destructive" onClick={() => { const id = detailItem.id; setDetailItem(null); setDeleteId(id); }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Qo'shish/Tahrirlash Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Xodimni tahrirlash" : "Yangi xodim"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ism *</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
                  }
                  placeholder="Ism"
                />
              </div>
              <div className="space-y-2">
                <Label>Familiya *</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({ ...form, lastName: e.target.value })
                  }
                  placeholder="Familiya"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Telefon *</Label>
              <Input
                value={form.phoneNumer}
                onChange={(e) =>
                  setForm({ ...form, phoneNumer: e.target.value })
                }
                placeholder="+998 XX XXX XX XX"
              />
            </div>
            <div className="space-y-2">
              <Label>Parol {!editItem && "*"}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editItem ? "Yangi parol (o'zgartirish uchun)" : "Parol"}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Banknote className="h-3.5 w-3.5 text-emerald-500" />
                Oylik maosh (so'm)
              </Label>
              <Input
                type="number"
                min={0}
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                placeholder="Masalan: 3000000"
              />
            </div>
            <div className="space-y-2">
              <Label>Lavozim *</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v as UserRole })}
                disabled={!!editItem}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAFF_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {roleLabels[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editItem && (
                <p className="text-xs text-muted-foreground">
                  Lavozimni o'zgartirish uchun yangi xodim yarating
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Filial *</Label>
              <Select
                value={form.branchId}
                onValueChange={(v) => setForm({ ...form, branchId: v })}
                disabled={!!editItem}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filialni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {branchList.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editItem && (
                <p className="text-xs text-muted-foreground">
                  Filialni o'zgartirish uchun yangi xodim yarating
                </p>
              )}
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
            <AlertDialogTitle>Xodimni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Bu amalni ortga qaytarib bo'lmaydi. Aniq o'chirmoqchimisiz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Bekor qilish
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
