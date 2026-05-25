// import { useState } from "react";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Badge } from "@/components/ui/badge";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import {
//   AlertDialog,
//   AlertDialogContent,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogCancel,
//   AlertDialogAction,
// } from "@/components/ui/alert-dialog";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { companyService, CompanyPayload } from "@/services/companyService";
// import {
//   companies as mockCompanies,
//   branches,
//   users,
//   Company,
// } from "@/lib/mock-data";
// import { Plus, Loader2 } from "lucide-react";
// import { toast } from "sonner";

// export default function Companies() {
//   const queryClient = useQueryClient();
//   const [search, setSearch] = useState("");
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [deleteId, setDeleteId] = useState<string | null>(null);
//   const [editItem, setEditItem] = useState<Company | null>(null);
//   const [form, setForm] = useState({
//     name: "",
//     phone: "",
//     founderName: "",
//     bio: "",
//   });
//   const [logoFile, setLogoFile] = useState<File | null>(null);

//   // Fetch companies with fallback to mock data
//   const { data: companiesList = mockCompanies, isLoading } = useQuery({
//     queryKey: ["companies"],
//     queryFn: async () => {
//       try {
//         const res = await companyService.getAll();
//         return res.data?.data || res.data || mockCompanies;
//       } catch {
//         return mockCompanies;
//       }
//     },
//   });

//   // Create company mutation
//   const createMutation = useMutation({
//     mutationFn: async (data: CompanyPayload) => {
//       const res = await companyService.create(data);
//       return res.data;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["companies"] });
//       toast.success("Kompaniya yaratildi");
//     },
//     onError: () => toast.error("Xatolik yuz berdi"),
//   });

//   // Update company mutation
//   const updateMutation = useMutation({
//     mutationFn: async ({
//       id,
//       data,
//     }: {
//       id: string;
//       data: Partial<CompanyPayload>;
//     }) => {
//       const res = await companyService.update(id, data);
//       return res.data;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["companies"] });
//       toast.success("Kompaniya yangilandi");
//     },
//     onError: () => toast.error("Xatolik yuz berdi"),
//   });

//   // Delete company mutation
//   const deleteMutation = useMutation({
//     mutationFn: async (id: string) => {
//       const res = await companyService.delete(id);
//       return res.data;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["companies"] });
//       toast.success("Kompaniya o'chirildi");
//     },
//     onError: () => toast.error("Xatolik yuz berdi"),
//   });

//   const filtered = (companiesList as Company[]).filter(
//     (c) =>
//       c.name.toLowerCase().includes(search.toLowerCase()) ||
//       c.founderName.toLowerCase().includes(search.toLowerCase())
//   );

//   const openAdd = () => {
//     setEditItem(null);
//     setForm({ name: "", phone: "", founderName: "", bio: "" });
//     setLogoFile(null);
//     setDialogOpen(true);
//   };

//   const openEdit = (c: Company) => {
//     setEditItem(c);
//     setForm({
//       name: c.name,
//       phone: c.phone,
//       founderName: c.founderName,
//       bio: c.bio || "",
//     });
//     setLogoFile(null);
//     setDialogOpen(true);
//   };

//   const handleSave = () => {
//     const payload: CompanyPayload = { ...form, logo: logoFile || undefined };
//     if (editItem) {
//       updateMutation.mutate({ id: editItem.id, data: payload });
//     } else {
//       createMutation.mutate(payload);
//     }
//     setDialogOpen(false);
//   };

//   const handleDelete = () => {
//     if (deleteId) {
//       deleteMutation.mutate(deleteId);
//       setDeleteId(null);
//     }
//   };

//   return (
//     <div>
//       <div className="flex items-center justify-between mb-6">
//         <h2 className="text-2xl font-bold text-foreground">Kompaniyalar</h2>
//         <Button onClick={openAdd} size="sm">
//           <Plus className="h-4 w-4 mr-1" /> Qo'shish
//         </Button>
//       </div>

//       <Input
//         placeholder="Qidirish..."
//         value={search}
//         onChange={(e) => setSearch(e.target.value)}
//         className="max-w-xs mb-4"
//       />

//       {isLoading ? (
//         <div className="flex items-center justify-center py-12">
//           <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
//         </div>
//       ) : (
//         <Card>
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Nomi</TableHead>
//                 <TableHead>Asoschisi</TableHead>
//                 <TableHead>Telefon</TableHead>
//                 <TableHead>Filiallar</TableHead>
//                 <TableHead>Menejerlar</TableHead>
//                 <TableHead>Xodimlar</TableHead>
//                 <TableHead className="text-right">Amallar</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {filtered.map((c) => {
//                 const brCount = branches.filter(
//                   (b) => b.companyId === c.id
//                 ).length;
//                 const mgrCount = users.filter(
//                   (u) => u.companyId === c.id && u.role === "MANAGER"
//                 ).length;
//                 const staffCount = users.filter(
//                   (u) => u.companyId === c.id && u.role !== "SUPERADMIN"
//                 ).length;
//                 return (
//                   <TableRow key={c.id}>
//                     <TableCell className="font-medium">{c.name}</TableCell>
//                     <TableCell>{c.founderName}</TableCell>
//                     <TableCell className="text-muted-foreground">
//                       {c.phone}
//                     </TableCell>
//                     <TableCell>
//                       <Badge variant="secondary">{brCount}</Badge>
//                     </TableCell>
//                     <TableCell>
//                       <Badge variant="secondary">{mgrCount}</Badge>
//                     </TableCell>
//                     <TableCell>
//                       <Badge variant="outline">{staffCount}</Badge>
//                     </TableCell>
//                     <TableCell className="text-right space-x-2">
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => openEdit(c)}
//                       >
//                         Tahrirlash
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         className="text-destructive"
//                         onClick={() => setDeleteId(c.id)}
//                       >
//                         O'chirish
//                       </Button>
//                     </TableCell>
//                   </TableRow>
//                 );
//               })}
//               {filtered.length === 0 && (
//                 <TableRow>
//                   <TableCell
//                     colSpan={7}
//                     className="text-center text-muted-foreground py-8"
//                   >
//                     Kompaniya topilmadi
//                   </TableCell>
//                 </TableRow>
//               )}
//             </TableBody>
//           </Table>
//         </Card>
//       )}

//       {/* Add/Edit Dialog */}
//       <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>
//               {editItem ? "Kompaniyani tahrirlash" : "Yangi kompaniya"}
//             </DialogTitle>
//           </DialogHeader>
//           <div className="space-y-4 py-4">
//             <div className="space-y-2">
//               <Label>Nomi</Label>
//               <Input
//                 value={form.name}
//                 onChange={(e) => setForm({ ...form, name: e.target.value })}
//               />
//             </div>
//             <div className="space-y-2">
//               <Label>Telefon</Label>
//               <Input
//                 value={form.phone}
//                 onChange={(e) => setForm({ ...form, phone: e.target.value })}
//               />
//             </div>
//             <div className="space-y-2">
//               <Label>Asoschisi</Label>
//               <Input
//                 value={form.founderName}
//                 onChange={(e) =>
//                   setForm({ ...form, founderName: e.target.value })
//                 }
//               />
//             </div>
//             <div className="space-y-2">
//               <Label>Tavsif</Label>
//               <Input
//                 value={form.bio}
//                 onChange={(e) => setForm({ ...form, bio: e.target.value })}
//               />
//             </div>
//             <div className="space-y-2">
//               <Label>Logo</Label>
//               <Input
//                 type="file"
//                 accept="image/*"
//                 onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
//               />
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setDialogOpen(false)}>
//               Bekor qilish
//             </Button>
//             <Button
//               onClick={handleSave}
//               disabled={createMutation.isPending || updateMutation.isPending} // ✅
//             >
//               {(createMutation.isPending || updateMutation.isPending) && (
//                 <Loader2 className="h-4 w-4 mr-1 animate-spin" />
//               )}
//               Saqlash
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Delete Confirmation */}
//       <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Kompaniyani o'chirish</AlertDialogTitle>
//             <AlertDialogDescription>
//               Bu kompaniyadagi barcha filiallar, xodimlar va ma'lumotlar o'chib
//               ketadi. Aniq o'chirmoqchimisiz?
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
//             <AlertDialogAction
//               onClick={handleDelete}
//               className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
//             >
//               O'chirish
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </div>
//   );
// }

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companyService, CompanyPayload } from "@/services/companyService";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Companies() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    founderName: "",
    bio: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Fetch companies
  const { data: companiesList = [], isLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const res = await companyService.getAll();
      const d = res.data ?? res;
      return Array.isArray(d) ? d : (d as any)?.data || [];
    },
  });

  // Create company mutation
  const createMutation = useMutation({
    mutationFn: async (data: CompanyPayload) => companyService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Kompaniya yaratildi");
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  // Update company mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CompanyPayload>;
    }) => companyService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Kompaniya yangilandi");
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  // Delete company mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => companyService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Kompaniya o'chirildi");
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const filtered = (companiesList || []).filter(
    (c: any) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.founderName.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: "", phone: "", founderName: "", bio: "" });
    setLogoFile(null);
    setDialogOpen(true);
  };

  const openEdit = (c: any) => {
    setEditItem(c);
    setForm({
      name: c.name,
      phone: c.phone,
      founderName: c.founderName,
      bio: c.bio || "",
    });
    setLogoFile(null);
    setDialogOpen(true);
  };

  const handleSave = () => {
    const payload: CompanyPayload = { ...form, logo: logoFile || undefined };
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Kompaniyalar</h2>
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
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.founderName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.phone}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(c)}
                      >
                        Tahrirlash
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setDeleteId(c.id)}
                      >
                        O'chirish
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-8"
                  >
                    Kompaniya topilmadi
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Kompaniyani tahrirlash" : "Yangi kompaniya"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nomi</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Asoschisi</Label>
              <Input
                value={form.founderName}
                onChange={(e) =>
                  setForm({ ...form, founderName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Tavsif</Label>
              <Input
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Logo</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Bekor qilish
            </Button>
             <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending} // ✅
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              )}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kompaniyani o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Bu kompaniyadagi barcha ma'lumotlar o'chib ketadi. Aniq
              o'chirmoqchimisiz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-end space-x-2">
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
