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
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  userService,
  StaffPayload,
  UserResponse,
} from "@/services/userService";
import { useBranch } from "@/contexts/BranchContext";
import { roleLabels, statusLabels, UserRole } from "@/lib/mock-data";
import { Plus, Loader2, MoreVertical, Eye, Pencil, Trash2 } from "lucide-react";
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
import { useIsMobile } from "@/hooks/use-mobile";

// ✅ Xodim rollari (SUPER_AFITSANT ham qo'shilgan)
const STAFF_ROLES: UserRole[] = [
  "MANAGER",
  "AFITSANT",
  "SUPER_AFITSANT", // ← Bu yerda mavjud
  "CHEF",
  "KASSA",
];

export default function ManagerStaff() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

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
        console.log("🔍 Full API Response:", response);

        // Axios response: response.data.data (double wrapped)
        if (response?.data?.data && Array.isArray(response.data.data)) {
          console.log(
            "✅ Found data in response.data.data (Axios + Backend pagination)"
          );
          console.log(
            "📊 Total:",
            response.data.total,
            "Offset:",
            response.data.offcet,
            "Limit:",
            response.data.limit
          );
          return response.data.data;
        }

        // Backend paginated: response.data
        if (response?.data && Array.isArray(response.data)) {
          console.log("✅ Found data in response.data");
          return response.data;
        }

        // Direct array
        if (Array.isArray(response)) {
          console.log("✅ Response is direct array");
          return response;
        }

        console.log("⚠️ Unexpected response structure");
        return [];
      } catch (err: any) {
        if (err?.response?.status === 404) return [];
        console.error("❌ API Error:", err);
        throw err;
      }
    },
    enabled: !!activeBranchId,
  });

  const staffList: UserResponse[] = Array.isArray(userData) ? userData : [];

  console.log("👥 Staff list:", staffList);
  console.log("👥 Staff count:", staffList.length);

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

  console.log("🔎 Filtered count:", filtered.length);

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
      });
    },
    onError: (error: any) => {
      console.error("Create error:", error);
      toast.error(error?.response?.data?.message || "Xatolik yuz berdi");
    },
  });

  // ✅ Xodim tahrirlash
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StaffPayload> }) =>
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
      });
    },
    onError: (error: any) => {
      console.error("Update error:", error);
      toast.error(error?.response?.data?.message || "Xatolik yuz berdi");
    },
  });

  // ✅ Status o'zgartirish (PATCH /user/status/{id})
  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => userService.toggleStatus(id),
    onSuccess: (response, id) => {
      // Yangi statusni aniqlash
      const user = staffList.find((u) => u.id === id);
      const newStatus = user?.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

      toast.success(
        `Status ${newStatus === "ACTIVE" ? "faollashtirildi" : "o'chirildi"}`
      );
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: any) => {
      console.error("Toggle status error:", error);
      toast.error(
        error?.response?.data?.message || "Status o'zgartirishda xatolik"
      );
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
    onError: (error: any) => {
      console.error("Delete error:", error);
      toast.error(error?.response?.data?.message || "Xatolik yuz berdi");
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

    if (editItem) {
      // ✅ Tahrirlash - faqat shaxsiy ma'lumotlar (role va branchId YUBORILMAYDI)
      const updateData: any = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumer: form.phoneNumer.trim(),
      };

      // Agar parol kiritilgan bo'lsa (va bo'sh emas), uni ham qo'shamiz
      if (form.password && form.password.trim().length > 0) {
        updateData.password = form.password.trim();
      }

      console.log("📝 Update payload:", updateData);
      updateMutation.mutate({ id: editItem.id, data: updateData });
    } else {
      // ✅ Yangi xodim yaratish - barcha maydonlar kerak
      const payload: StaffPayload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumer: form.phoneNumer.trim(),
        password: form.password.trim(),
        role: form.role as
          | "MANAGER"
          | "AFITSANT"
          | "CHEF"
          | "KASSA"
          | "SUPER_AFITSANT",
        branchId: form.branchId,
      };
      console.log("➕ Create payload:", payload);
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Xodimlar</h2>
        <Button onClick={openAdd} size="sm" disabled={!activeBranchId}>
          <Plus className="h-4 w-4 mr-1" /> Qo'shish
        </Button>
      </div>

      <div className="flex gap-3 mb-4">
        {/* Filial tanlash */}
        <Select value={activeBranchId} onValueChange={setSelectedBranchId}>
          <SelectTrigger className="w-48">
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

        {/* Qidiruv */}
        <Input
          placeholder="Qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />

        {/* Rol filtri */}
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Hammasi</SelectItem>
            {STAFF_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {roleLabels[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ═══ MOBILE CARDS ═══ */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground text-sm">
            {!activeBranchId ? "Filialni tanlang" : search || roleFilter !== "ALL" ? "Xodim topilmadi" : "Hozircha xodimlar yo'q"}
          </Card>
        ) : (
          filtered.map((u) => {
            const isActive = u.status === "ACTIVE";
            return (
              <Card key={u.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{u.firstName} {u.lastName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {roleLabels[u.role as keyof typeof roleLabels] || u.role}
                      </Badge>
                      <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
                        {statusLabels[u.status as keyof typeof statusLabels] || u.status}
                      </Badge>
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
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ism familiya</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Lavozim</TableHead>
                <TableHead>Filial</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => {
                const branch = branchList.find((b) => b.id === u.branchId);
                const isActive = u.status === "ACTIVE";
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.firstName} {u.lastName}</TableCell>
                    <TableCell className="text-muted-foreground">{u.phoneNumer || "—"}</TableCell>
                    <TableCell><Badge variant="outline">{roleLabels[u.role as keyof typeof roleLabels] || u.role}</Badge></TableCell>
                    <TableCell>{branch?.name || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={isActive}
                          onCheckedChange={() => handleToggleStatus(u.id)}
                          disabled={toggleStatusMutation.isPending}
                        />
                        <Badge variant={isActive ? "default" : "secondary"}>
                          {statusLabels[u.status as keyof typeof statusLabels] || u.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
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
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {!activeBranchId ? "Filialni tanlang" : search || roleFilter !== "ALL" ? "Xodim topilmadi" : "Hozircha xodimlar yo'q"}
                  </TableCell>
                </TableRow>
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
                placeholder={
                  editItem ? "Yangi parol (o'zgartirish uchun)" : "Parol"
                }
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
