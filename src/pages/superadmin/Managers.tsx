import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useBranch } from "@/contexts/BranchContext";
import { extractPaginated } from "@/lib/api-response";
import { statusLabels } from "@/lib/display";
import { companyService, Company } from "@/services/companyService";
import {
  ManagerPayload,
  ManagerUpdatePayload,
  UserResponse,
  userService,
} from "@/services/userService";

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type ApiError = { response?: { data?: { message?: string | string[] } } };

type FormState = {
  firstName: string;
  lastName: string;
  phoneNumer: string;
  password: string;
  companyId: string;
  branchId: string;
};

async function fetchManagers(statusFilter: StatusFilter, search: string) {
  const params = {
    search: search.trim() || undefined,
    offcet: 0,
    limit: 1000,
  };

  if (statusFilter === "ALL") {
    const [activeResponse, inactiveResponse] = await Promise.all([
      userService.getManagers({ ...params, status: "ACTIVE" }),
      userService.getManagers({ ...params, status: "INACTIVE" }),
    ]);

    const merged = [
      ...extractPaginated<UserResponse>(activeResponse.data).items,
      ...extractPaginated<UserResponse>(inactiveResponse.data).items,
    ];

    return Array.from(new Map(merged.map((item) => [item.id, item])).values());
  }

  const response = await userService.getManagers({ ...params, status: statusFilter });
  return extractPaginated<UserResponse>(response.data).items;
}

const EMPTY_FORM: FormState = {
  firstName: "",
  lastName: "",
  phoneNumer: "",
  password: "",
  companyId: "",
  branchId: "",
};

function getApiErrorMessage(error: unknown, fallback: string) {
  const message = (error as ApiError)?.response?.data?.message;
  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string" && message.trim()) return message;
  return fallback;
}

function normalizePhone(phone: string | null | undefined) {
  return (phone ?? "").replace(/\s+/g, "").trim();
}

export default function Managers() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { branches } = useBranch();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<UserResponse | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const {
    data: managersList = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["managers", statusFilter, search],
    queryFn: () => fetchManagers(statusFilter, search),
  });

  const { data: companiesList = [] } = useQuery({
    queryKey: ["companies", "manager-options"],
    queryFn: async () =>
      extractPaginated<Company>(
        (await companyService.getAll({ offcet: 0, limit: 1000 })).data,
      ).items,
  });

  const createMutation = useMutation({
    mutationFn: (data: ManagerPayload) => userService.createManager(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managers"] });
      toast.success("Menejer yaratildi");
      setDialogOpen(false);
      setForm(EMPTY_FORM);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Menejer yaratishda xatolik yuz berdi")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ManagerUpdatePayload }) =>
      userService.updateManager(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managers"] });
      toast.success("Menejer yangilandi");
      setDialogOpen(false);
      setEditItem(null);
      setForm(EMPTY_FORM);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Menejerni yangilashda xatolik yuz berdi")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userService.deleteManager(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managers"] });
      toast.success("Menejer o'chirildi");
      setDeleteId(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Menejerni o'chirishda xatolik yuz berdi")),
  });

  const filtered = useMemo(() => managersList, [managersList]);

  const companyBranches = useMemo(
    () => branches.filter((branch) => branch.companyId === form.companyId),
    [branches, form.companyId],
  );

  const openAdd = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (manager: UserResponse) => {
    setEditItem(manager);
    setForm({
      firstName: manager.firstName,
      lastName: manager.lastName,
      phoneNumer: manager.phoneNumer ?? "",
      password: "",
      companyId: manager.companyId ?? "",
      branchId: manager.branchId ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.phoneNumer.trim()) {
      toast.error("Ism, familiya va telefon raqami majburiy");
      return;
    }

    const normalizedPhone = normalizePhone(form.phoneNumer);
    const duplicateManager = managersList.find(
      (manager) =>
        manager.id !== editItem?.id && normalizePhone(manager.phoneNumer) === normalizedPhone,
    );

    if (duplicateManager) {
      toast.error("Bu telefon boshqa menejerga biriktirilgan");
      return;
    }

    if (normalizedPhone && normalizePhone(user?.phone) === normalizedPhone) {
      toast.error("Bu telefon superadmin hisobiga biriktirilgan. Menejer uchun boshqa raqam kiriting");
      return;
    }

    if (!editItem) {
      if (!form.password.trim()) {
        toast.error("Parol kiriting");
        return;
      }

      if (!form.companyId) {
        toast.error("Kompaniyani tanlang");
        return;
      }

      createMutation.mutate({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumer: form.phoneNumer.trim(),
        password: form.password.trim(),
        companyId: form.companyId,
        branchId: form.branchId || null,
      });
      return;
    }

    const payload: ManagerUpdatePayload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phoneNumer: form.phoneNumer.trim(),
    };

    if (form.password.trim()) {
      payload.password = form.password.trim();
    }

    updateMutation.mutate({ id: editItem.id, data: payload });
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isError) {
    return (
      <div className="py-12 text-center">
        <p className="font-medium text-destructive">Menejerlarni yuklashda xatolik yuz berdi</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Qayta urinib ko'ring"}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Menejerlar</h2>
        <Button onClick={openAdd} size="sm">
          <Plus className="mr-1 h-4 w-4" /> Qo'shish
        </Button>
      </div>

      <div className="mb-4 flex flex-col gap-4 sm:flex-row">
        <Input
          placeholder="Ism yoki telefon bo'yicha qidirish..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
          <SelectTrigger className="sm:w-[180px]">
            <SelectValue placeholder="Holat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Hammasi</SelectItem>
            <SelectItem value="ACTIVE">Faol</SelectItem>
            <SelectItem value="INACTIVE">Nofaol</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
                <TableHead>Filial</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((manager) => {
                const company = companiesList.find((item) => item.id === manager.companyId);
                const branch = branches.find((item) => item.id === manager.branchId);

                return (
                  <TableRow key={manager.id}>
                    <TableCell className="font-medium">
                      {manager.firstName} {manager.lastName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{manager.phoneNumer || "—"}</TableCell>
                    <TableCell>{company?.name || "—"}</TableCell>
                    <TableCell>{branch?.name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={manager.status === "ACTIVE" ? "default" : "secondary"}>
                        {statusLabels[manager.status] || manager.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(manager)}>
                        Tahrirlash
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setDeleteId(manager.id)}
                      >
                        O'chirish
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Menejer topilmadi
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? "Menejerni tahrirlash" : "Yangi menejer"}</DialogTitle>
            <DialogDescription>
              {editItem
                ? "Menejerning ism, familiya, telefon yoki parolini yangilang."
                : "Yangi menejer yaratish uchun maydonlarni to'ldiring."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ism</Label>
                <Input
                  value={form.firstName}
                  onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Familiya</Label>
                <Input
                  value={form.lastName}
                  onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input
                value={form.phoneNumer}
                onChange={(event) => setForm((current) => ({ ...current, phoneNumer: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Parol {editItem ? "(ixtiyoriy)" : ""}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              />
            </div>

            {!editItem && (
              <div className="space-y-2">
                <Label>Kompaniya</Label>
                <Select
                  value={form.companyId}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, companyId: value, branchId: "" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kompaniyani tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {companiesList.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!editItem && form.companyId && companyBranches.length > 0 && (
              <div className="space-y-2">
                <Label>Filial</Label>
                <Select
                  value={form.branchId}
                  onValueChange={(value) => setForm((current) => ({ ...current, branchId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filialni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {companyBranches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
              Bekor qilish
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Menejerni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Bu amalni ortga qaytarib bo'lmaydi. Menejerni o'chirishni tasdiqlaysizmi?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
