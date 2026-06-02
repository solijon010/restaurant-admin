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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBranch } from "@/contexts/BranchContext";
import { extractPaginated } from "@/lib/api-response";
import { Company, CompanyPayload, companyService } from "@/services/companyService";
import { UserResponse, userService } from "@/services/userService";

async function fetchAllManagers() {
  const [activeResponse, inactiveResponse] = await Promise.all([
    userService.getManagers({ status: "ACTIVE", offcet: 0, limit: 1000 }),
    userService.getManagers({ status: "INACTIVE", offcet: 0, limit: 1000 }),
  ]);

  const merged = [
    ...extractPaginated<UserResponse>(activeResponse.data).items,
    ...extractPaginated<UserResponse>(inactiveResponse.data).items,
  ];

  return Array.from(new Map(merged.map((item) => [item.id, item])).values());
}

export default function Companies() {
  const queryClient = useQueryClient();
  const { branches } = useBranch();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Company | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    founderName: "",
    bio: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const {
    data: companiesList = [],
    isLoading: companiesLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["companies", search],
    queryFn: async () =>
      extractPaginated<Company>(
        (await companyService.getAll({ offcet: 0, limit: 1000, search: search.trim() || undefined })).data,
      ).items,
  });

  const { data: managersList = [], isLoading: managersLoading } = useQuery({
    queryKey: ["managers", "company-counts"],
    queryFn: fetchAllManagers,
  });

  const createMutation = useMutation({
    mutationFn: async (data: CompanyPayload) => companyService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Kompaniya yaratildi");
      setDialogOpen(false);
      setForm({ name: "", phone: "", founderName: "", bio: "" });
      setLogoFile(null);
    },
    onError: () => toast.error("Kompaniya yaratishda xatolik yuz berdi"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CompanyPayload> }) =>
      companyService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Kompaniya yangilandi");
      setDialogOpen(false);
      setEditItem(null);
      setForm({ name: "", phone: "", founderName: "", bio: "" });
      setLogoFile(null);
    },
    onError: () => toast.error("Kompaniyani yangilashda xatolik yuz berdi"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => companyService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Kompaniya o'chirildi");
      setDeleteId(null);
    },
    onError: () => toast.error("Kompaniyani o'chirishda xatolik yuz berdi"),
  });

  const managersByCompany = useMemo(() => {
    const counts = new Map<string, number>();
    managersList.forEach((manager) => {
      counts.set(manager.companyId, (counts.get(manager.companyId) ?? 0) + 1);
    });
    return counts;
  }, [managersList]);

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: "", phone: "", founderName: "", bio: "" });
    setLogoFile(null);
    setDialogOpen(true);
  };

  const openEdit = (company: Company) => {
    setEditItem(company);
    setForm({
      name: company.name,
      phone: company.phone,
      founderName: company.founderName,
      bio: company.bio || "",
    });
    setLogoFile(null);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.phone.trim() || !form.founderName.trim()) {
      toast.error("Nomi, telefon va asoschi maydonlari majburiy");
      return;
    }

    const payload: CompanyPayload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      founderName: form.founderName.trim(),
      bio: form.bio.trim(),
      logo: logoFile || undefined,
    };

    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: payload });
      return;
    }

    createMutation.mutate(payload);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  const isLoading = companiesLoading || managersLoading;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isError) {
    return (
      <div className="py-12 text-center">
        <p className="font-medium text-destructive">Kompaniyalarni yuklashda xatolik yuz berdi</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Qayta urinib ko'ring"}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Kompaniyalar</h2>
        <Button onClick={openAdd} size="sm">
          <Plus className="mr-1 h-4 w-4" /> Qo'shish
        </Button>
      </div>

      <Input
        placeholder="Nomi yoki asoschi bo'yicha qidirish..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="mb-4 max-w-xs"
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomi</TableHead>
                <TableHead>Asoschisi</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Filiallar</TableHead>
                <TableHead>Menejerlar</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companiesList.map((company) => {
                const branchCount = branches.filter((branch) => branch.companyId === company.id).length;
                const managerCount = managersByCompany.get(company.id) ?? 0;

                return (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.founderName}</TableCell>
                    <TableCell className="text-muted-foreground">{company.phone}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{branchCount}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{managerCount}</Badge>
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(company)}>
                        Tahrirlash
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setDeleteId(company.id)}
                      >
                        O'chirish
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {companiesList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Kompaniya topilmadi
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
            <DialogTitle>{editItem ? "Kompaniyani tahrirlash" : "Yangi kompaniya"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nomi</Label>
              <Input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Asoschisi</Label>
              <Input
                value={form.founderName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, founderName: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Tavsif</Label>
              <Input
                value={form.bio}
                onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Logo</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(event) => setLogoFile(event.target.files?.[0] || null)}
              />
            </div>
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
            <AlertDialogTitle>Kompaniyani o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Bu kompaniyadagi bog'liq ma'lumotlar ham ta'sirlanishi mumkin. Amalni tasdiqlaysizmi?
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
