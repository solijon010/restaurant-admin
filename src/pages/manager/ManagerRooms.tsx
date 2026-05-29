import { useState, useEffect } from "react";
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
import { roomService } from "@/services/roomService";
import { roomCategoryService } from "@/services/roomCategoryService";
import { useBranch } from "@/contexts/BranchContext";
import { formatPrice, statusLabels } from "@/lib/mock-data";
import {
  Plus,
  Loader2,
  Store,
  RefreshCw,
  MapPin,
  BedDouble,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
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

// ─── Types ────────────────────────────────────────────────────────────────────
type StatusType = "ACTIVE" | "INACTIVE";

interface RoomCategory {
  id: string;
  name: string;
  branchId: string;
  status: StatusType;
}

interface Room {
  id: string;
  name: string;
  price: number;
  branchId: string;
  roomCategoryId: string;
  status: StatusType;
}

// API har xil struktura qaytarishi mumkin — doim arrayga normallash
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

// ─── Component ────────────────────────────────────────────────────────────────
export default function ManagerRooms() {
  const queryClient = useQueryClient();
  const { branches, branchesLoading, selectedBranchId, setSelectedBranchId } = useBranch();

  const [activeTab, setActiveTab] = useState("rooms");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [detailRoom, setDetailRoom] = useState<Room | null>(null);
  const [detailCat, setDetailCat] = useState<RoomCategory | null>(null);
  // Room dialog
  const [roomDialog, setRoomDialog] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [roomForm, setRoomForm] = useState({
    name: "",
    price: "",
    roomCategoryId: "",
  });
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);

  // Category dialog
  const [catDialog, setCatDialog] = useState(false);
  const [editCat, setEditCat] = useState<RoomCategory | null>(null);
  const [catName, setCatName] = useState("");
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedBranchId) {
      setCatFilter("ALL");
      setSearch("");
    }
  }, [selectedBranchId]);


  // ─── Room Categories ───────────────────────────────────────────────────────
  const {
    data: catsRaw,
    isLoading: catsLoading,
    refetch: refetchCats,
  } = useQuery({
    queryKey: ["room-categories", selectedBranchId],
    queryFn: () =>
      roomCategoryService.getByBranch(selectedBranchId).then((r) => r.data),
    enabled: !!selectedBranchId,
  });
  const categories = toArray<RoomCategory>(catsRaw);
  const activeCats = categories.filter((c) => c.status === "ACTIVE");

  // ─── Rooms ────────────────────────────────────────────────────────────────
  const {
    data: roomsRaw,
    isLoading: roomsLoading,
    refetch: refetchRooms,
  } = useQuery({
    queryKey: ["rooms", selectedBranchId],
    queryFn: () =>
      roomService.getByBranch(selectedBranchId).then((r) => r.data),
    enabled: !!selectedBranchId,
  });
  const roomsList = toArray<Room>(roomsRaw);

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);

  // ─── Room mutations ───────────────────────────────────────────────────────
  const createRoomMutation = useMutation({
    mutationFn: (data: Parameters<typeof roomService.create>[0]) =>
      roomService.create(data),
    onSuccess: () => {
      toast.success("Xona yaratildi");
      queryClient.invalidateQueries({ queryKey: ["rooms", selectedBranchId] });
      setRoomDialog(false);
    },
    onError: () => toast.error("Xona yaratishda xatolik"),
  });

  const updateRoomMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof roomService.update>[1];
    }) => roomService.update(id, data),
    onSuccess: () => {
      toast.success("Xona yangilandi");
      queryClient.invalidateQueries({ queryKey: ["rooms", selectedBranchId] });
      setRoomDialog(false);
    },
    onError: () => toast.error("Xona yangilashda xatolik"),
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (id: string) => roomService.delete(id),
    onSuccess: () => {
      toast.success("Xona o'chirildi");
      queryClient.invalidateQueries({ queryKey: ["rooms", selectedBranchId] });
      setDeleteRoomId(null);
    },
    onError: () => toast.error("O'chirishda xatolik"),
  });

  const toggleRoomMutation = useMutation({
    mutationFn: (id: string) => roomService.toggleStatus(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["rooms", selectedBranchId] }),
    onError: () => {
      toast.error("Holat o'zgartirishda xatolik");
      queryClient.invalidateQueries({ queryKey: ["rooms", selectedBranchId] });
    },
  });

  // ─── Category mutations ───────────────────────────────────────────────────
  const createCategoryMutation = useMutation({
    mutationFn: (data: Parameters<typeof roomCategoryService.create>[0]) =>
      roomCategoryService.create(data),
    onSuccess: () => {
      toast.success("Kategoriya yaratildi");
      queryClient.invalidateQueries({
        queryKey: ["room-categories", selectedBranchId],
      });
      setCatDialog(false);
    },
    onError: () => toast.error("Kategoriya yaratishda xatolik"),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof roomCategoryService.update>[1];
    }) => roomCategoryService.update(id, data),
    onSuccess: () => {
      toast.success("Kategoriya yangilandi");
      queryClient.invalidateQueries({
        queryKey: ["room-categories", selectedBranchId],
      });
      setCatDialog(false);
    },
    onError: () => toast.error("Kategoriya yangilashda xatolik"),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => roomCategoryService.delete(id),
    onSuccess: () => {
      toast.success("Kategoriya o'chirildi");
      queryClient.invalidateQueries({
        queryKey: ["room-categories", selectedBranchId],
      });
      queryClient.invalidateQueries({ queryKey: ["rooms", selectedBranchId] });
      setDeleteCatId(null);
    },
    onError: () => toast.error("O'chirishda xatolik"),
  });

  const toggleCategoryMutation = useMutation({
    mutationFn: (id: string) => roomCategoryService.toggleStatus(id),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["room-categories", selectedBranchId],
      }),
    onError: () => {
      toast.error("Holat o'zgartirishda xatolik");
      queryClient.invalidateQueries({
        queryKey: ["room-categories", selectedBranchId],
      });
    },
  });

  // ─── Filtered ─────────────────────────────────────────────────────────────
  const filteredRooms = roomsList.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "ALL" || r.roomCategoryId === catFilter;
    return matchSearch && matchCat;
  });

  // ─── Room handlers ────────────────────────────────────────────────────────
  const openAddRoom = () => {
    setEditRoom(null);
    setRoomForm({ name: "", price: "", roomCategoryId: activeCats[0]?.id || "" });
    setRoomDialog(true);
  };

  const openEditRoom = (r: Room) => {
    setEditRoom(r);
    setRoomForm({ name: r.name, price: String(r.price), roomCategoryId: r.roomCategoryId });
    setRoomDialog(true);
  };

  const saveRoom = () => {
    if (!roomForm.name.trim()) return toast.error("Xona nomini kiriting");
    if (!roomForm.roomCategoryId) return toast.error("Kategoriyani tanlang");

    if (editRoom) {
      updateRoomMutation.mutate({
        id: editRoom.id,
        data: {
          name: roomForm.name,
          price: 0,
          roomCategoryId: roomForm.roomCategoryId,
        },
      });
    } else {
      createRoomMutation.mutate({
        name: roomForm.name,
        price: 0,
        branchId: selectedBranchId,
        roomCategoryId: roomForm.roomCategoryId,
      });
    }
  };

  const [deleteAllDialog, setDeleteAllDialog] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const deleteAllRooms = async () => {
    setDeletingAll(true);
    let deleted = 0;
    for (const r of roomsList) {
      try {
        await roomService.delete(r.id);
        deleted++;
      } catch {}
    }
    setDeletingAll(false);
    setDeleteAllDialog(false);
    toast.success(`${deleted} ta xona o'chirildi`);
    queryClient.invalidateQueries({ queryKey: ["rooms", selectedBranchId] });
  };

  const [bulkCreating, setBulkCreating] = useState(false);
  const bulkCreateSoris = async () => {
    if (!activeCats[0]) return toast.error("Avval kategoriya yarating");
    setBulkCreating(true);
    let created = 0;
    for (let i = 1; i <= 12; i++) {
      try {
        await roomService.create({
          name: `Sori ${i}`,
          price: 0,
          branchId: selectedBranchId,
          roomCategoryId: activeCats[0].id,
        });
        created++;
      } catch {}
    }
    setBulkCreating(false);
    toast.success(`${created} ta Sori yaratildi`);
    queryClient.invalidateQueries({ queryKey: ["rooms", selectedBranchId] });
  };

  // ─── Category handlers ────────────────────────────────────────────────────
  const openAddCat = () => {
    setEditCat(null);
    setCatName("");
    setCatDialog(true);
  };

  const openEditCat = (c: RoomCategory) => {
    setEditCat(c);
    setCatName(c.name);
    setCatDialog(true);
  };

  const saveCat = () => {
    if (!catName.trim()) return toast.error("Kategoriya nomini kiriting");
    if (editCat) {
      updateCategoryMutation.mutate({
        id: editCat.id,
        data: { name: catName },
      });
    } else {
      createCategoryMutation.mutate({
        name: catName,
        branchId: selectedBranchId,
      });
    }
  };

  const isRoomSaving =
    createRoomMutation.isPending || updateRoomMutation.isPending;
  const isCatSaving =
    createCategoryMutation.isPending || updateCategoryMutation.isPending;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <BedDouble className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground leading-tight">Xonalar</h2>
            <p className="text-xs text-muted-foreground">Filial bo'yicha xona va kategoriyalarni boshqaring</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { refetchCats(); refetchRooms(); }}
          className="gap-1.5"
          disabled={!selectedBranchId}
        >
          <RefreshCw className="h-3.5 w-3.5" /> Yangilash
        </Button>
      </div>

      {/* ── Branch selector card ─────────────────────────────────────────────── */}
      <Card className="shadow-sm border border-border/60 rounded-2xl overflow-hidden">
        <div className="p-4">
          {branchesLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Filiallar yuklanmoqda...
            </div>
          ) : branches.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center">Hech qanday filial topilmadi</p>
          ) : (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-50 shrink-0">
                  <Store className="h-4 w-4 text-indigo-600" />
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
                <div className="flex gap-4 shrink-0">
                  <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-center min-w-[60px]">
                    <p className="text-lg font-bold text-indigo-700">{roomsList.length}</p>
                    <p className="text-xs text-muted-foreground">Xona</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center min-w-[60px]">
                    <p className="text-lg font-bold text-slate-700">{categories.length}</p>
                    <p className="text-xs text-muted-foreground">Kategoriya</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center min-w-[60px]">
                    <p className="text-lg font-bold text-emerald-700">{roomsList.filter((r) => r.status === "ACTIVE").length}</p>
                    <p className="text-xs text-muted-foreground">Faol</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {!selectedBranchId ? (
        <Card className="shadow-sm border border-border/60 rounded-2xl overflow-hidden">
          <div className="py-16 flex flex-col items-center gap-3 text-center px-6">
            <BedDouble className="h-12 w-12 text-muted-foreground opacity-20" />
            <p className="font-medium text-foreground">Filialni tanlang</p>
            <p className="text-sm text-muted-foreground">Davom etish uchun yuqoridan filial tanlang</p>
          </div>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* ── Tab triggers ─────────────────────────────────────────────── */}
          <TabsList className="mb-4 bg-muted/40 rounded-xl p-1 h-auto gap-1">
            <TabsTrigger
              value="rooms"
              className="rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              <BedDouble className="h-3.5 w-3.5 mr-1.5" />
              Xonalar
              {roomsList.length > 0 && (
                <span className="ml-1.5 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-white/20 data-[state=inactive]:bg-muted">
                  {roomsList.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="categories"
              className="rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-slate-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              <Store className="h-3.5 w-3.5 mr-1.5" />
              Kategoriyalar
              {categories.length > 0 && (
                <span className="ml-1.5 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-white/20">
                  {categories.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ══ Rooms ══════════════════════════════════════════════════════ */}
          <TabsContent value="rooms">
            {/* Filter bar */}
            <div className="bg-muted/40 rounded-2xl p-3 mb-4 flex flex-wrap items-center gap-3">
              <Input
                placeholder="Xona qidirish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs bg-background"
              />
              <Select value={catFilter} onValueChange={setCatFilter}>
                <SelectTrigger className="w-52 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Barcha kategoriyalar</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        {c.name}
                        {c.status === "INACTIVE" && (
                          <Badge variant="outline" className="text-xs py-0 px-1">Nofaol</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={openAddRoom} size="sm" disabled={activeCats.length === 0} className="ml-auto gap-1.5">
                <Plus className="h-4 w-4" /> Xona qo'shish
              </Button>
            </div>

            {activeCats.length === 0 && !catsLoading && (
              <div className="text-center py-3 text-sm text-amber-700 bg-amber-50 rounded-xl border border-amber-200 mb-4">
                Xona qo'shish uchun avval faol kategoriya yarating
              </div>
            )}

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {roomsLoading ? (
                <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></div>
              ) : filteredRooms.length === 0 ? (
                <Card className="shadow-sm border border-border/60 rounded-2xl overflow-hidden">
                  <div className="py-14 flex flex-col items-center gap-3 text-center px-6">
                    <BedDouble className="h-10 w-10 text-muted-foreground opacity-20" />
                    <p className="text-sm text-muted-foreground">{search || catFilter !== "ALL" ? "Qidiruv natijasi topilmadi" : "Xonalar mavjud emas"}</p>
                  </div>
                </Card>
              ) : (
                filteredRooms.map((r) => {
                  const cat = categories.find((c) => c.id === r.roomCategoryId);
                  return (
                    <Card key={r.id} className="p-4 shadow-sm border border-border/60 rounded-2xl">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <BedDouble className="h-4 w-4 text-indigo-500 shrink-0" />
                            <p className="font-medium truncate">{r.name}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            {cat && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">{cat.name}</span>}
                            <span className="text-sm font-semibold text-foreground">{formatPrice(r.price)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Switch checked={r.status === "ACTIVE"} onCheckedChange={() => toggleRoomMutation.mutate(r.id)} disabled={toggleRoomMutation.isPending} />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDetailRoom(r)}><Eye className="h-4 w-4 mr-2" /> Batafsil</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditRoom(r)}><Pencil className="h-4 w-4 mr-2" /> Tahrirlash</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteRoomId(r.id)}><Trash2 className="h-4 w-4 mr-2" /> O'chirish</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block">
              <Card className="shadow-sm border border-border/60 rounded-2xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-slate-50 to-indigo-50/30 hover:from-slate-50 hover:to-indigo-50/30">
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nomi</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kategoriya</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Narx</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Holat</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roomsLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                    ) : filteredRooms.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <div className="py-14 flex flex-col items-center gap-3 text-center">
                            <BedDouble className="h-10 w-10 text-muted-foreground opacity-20" />
                            <p className="text-sm text-muted-foreground">{search || catFilter !== "ALL" ? "Qidiruv natijasi topilmadi" : "Xonalar mavjud emas"}</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRooms.map((r) => {
                        const cat = categories.find((c) => c.id === r.roomCategoryId);
                        return (
                          <TableRow key={r.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <BedDouble className="h-4 w-4 text-indigo-400" />{r.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              {cat ? (
                                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">{cat.name}</span>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell className="font-semibold">{formatPrice(r.price)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch checked={r.status === "ACTIVE"} onCheckedChange={() => toggleRoomMutation.mutate(r.id)} disabled={toggleRoomMutation.isPending} />
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${r.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                                  {statusLabels[r.status]}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditRoom(r)}><Pencil className="h-4 w-4 mr-2" /> Tahrirlash</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteRoomId(r.id)}><Trash2 className="h-4 w-4 mr-2" /> O'chirish</DropdownMenuItem>
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
          </TabsContent>

          {/* ══ Categories ════════════════════════════════════════════════════ */}
          <TabsContent value="categories">
            <div className="bg-muted/40 rounded-2xl p-3 mb-4 flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{selectedBranch?.name}</span>{" "}
                filialining xona kategoriyalari
              </p>
              <Button onClick={openAddCat} size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" /> Kategoriya qo'shish
              </Button>
            </div>

            {/* Mobile categories */}
            <div className="md:hidden space-y-3">
              {catsLoading ? (
                <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></div>
              ) : categories.length === 0 ? (
                <Card className="shadow-sm border border-border/60 rounded-2xl overflow-hidden">
                  <div className="py-14 flex flex-col items-center gap-3 text-center px-6">
                    <Store className="h-10 w-10 text-muted-foreground opacity-20" />
                    <p className="text-sm text-muted-foreground">Kategoriyalar mavjud emas</p>
                  </div>
                </Card>
              ) : (
                categories.map((c) => {
                  const roomCount = roomsList.filter((r) => r.roomCategoryId === c.id).length;
                  return (
                    <Card key={c.id} className="p-4 shadow-sm border border-border/60 rounded-2xl">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{c.name}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">{roomCount} ta xona</span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${c.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>{statusLabels[c.status]}</span>
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
                    </Card>
                  );
                })
              )}
            </div>

            {/* Desktop categories table */}
            <div className="hidden md:block">
              <Card className="shadow-sm border border-border/60 rounded-2xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-slate-50 to-indigo-50/30 hover:from-slate-50 hover:to-indigo-50/30">
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nomi</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Xonalar</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Holat</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {catsLoading ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                    ) : categories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4}>
                          <div className="py-14 flex flex-col items-center gap-3 text-center">
                            <Store className="h-10 w-10 text-muted-foreground opacity-20" />
                            <p className="text-sm text-muted-foreground">Kategoriyalar mavjud emas</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      categories.map((c) => {
                        const roomCount = roomsList.filter((r) => r.roomCategoryId === c.id).length;
                        return (
                          <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell>
                              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">{roomCount} ta</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch checked={c.status === "ACTIVE"} onCheckedChange={() => toggleCategoryMutation.mutate(c.id)} disabled={toggleCategoryMutation.isPending} />
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${c.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                                  {statusLabels[c.status]}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
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
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* ══ Room Dialog ═══════════════════════════════════════════════════════ */}
      <Dialog open={roomDialog} onOpenChange={setRoomDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editRoom ? "Xonani tahrirlash" : "Yangi xona qo'shish"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nomi <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Xona nomi"
                value={roomForm.name}
                onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Kategoriya <span className="text-destructive">*</span></Label>
              <div className="flex flex-wrap gap-2">
                {activeCats.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setRoomForm({ ...roomForm, roomCategoryId: c.id })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                      roomForm.roomCategoryId === c.id
                        ? "bg-indigo-500 text-white border-indigo-500 shadow-sm"
                        : "bg-muted/40 text-foreground border-border hover:border-indigo-300 hover:bg-indigo-50"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 flex items-center gap-1.5">
              <MapPin className="h-3 w-3 shrink-0" />
              Filial:{" "}
              <span className="font-medium text-foreground ml-1">
                {selectedBranch?.name}
              </span>
              {selectedBranch?.addres && (
                <span className="ml-1">— {selectedBranch.addres}</span>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoomDialog(false)}
              disabled={isRoomSaving}
            >
              Bekor qilish
            </Button>
            <Button onClick={saveRoom} disabled={isRoomSaving}>
              {isRoomSaving && (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              )}
              {editRoom ? "Saqlash" : "Qo'shish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Category Dialog ═══════════════════════════════════════════════════ */}
      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editCat ? "Kategoriyani tahrirlash" : "Yangi kategoriya"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>
                Nomi <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Kategoriya nomini kiriting"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
              />
            </div>

            <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 flex items-center gap-1.5">
              <MapPin className="h-3 w-3 shrink-0" />
              Filial:{" "}
              <span className="font-medium text-foreground ml-1">
                {selectedBranch?.name}
              </span>
              {selectedBranch?.addres && (
                <span className="ml-1">— {selectedBranch.addres}</span>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCatDialog(false)}
              disabled={isCatSaving}
            >
              Bekor qilish
            </Button>
            <Button onClick={saveCat} disabled={isCatSaving}>
              {isCatSaving && (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              )}
              {editCat ? "Saqlash" : "Qo'shish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Delete Room ═══════════════════════════════════════════════════════ */}
      <AlertDialog
        open={!!deleteRoomId}
        onOpenChange={() => setDeleteRoomId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xonani o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Bu xona butunlay o'chiriladi. Qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteRoomId && deleteRoomMutation.mutate(deleteRoomId)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteRoomMutation.isPending}
            >
              {deleteRoomMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              )}
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ══ Delete All Rooms ══════════════════════════════════════════════════ */}
      <AlertDialog open={deleteAllDialog} onOpenChange={setDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Barcha xonalarni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{roomsList.length} ta xona</strong> butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingAll}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteAllRooms}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingAll}
            >
              {deletingAll && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Hammasini o'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ══ Delete Category ═══════════════════════════════════════════════════ */}
      <AlertDialog
        open={!!deleteCatId}
        onOpenChange={() => setDeleteCatId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kategoriyani o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Unga bog'liq{" "}
              <strong>
                {deleteCatId
                  ? roomsList.filter((r) => r.roomCategoryId === deleteCatId)
                      .length
                  : 0}{" "}
                ta xona
              </strong>{" "}
              ham o'chishi mumkin. Davom etasizmi?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteCatId && deleteCategoryMutation.mutate(deleteCatId)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteCategoryMutation.isPending}
            >
              {deleteCategoryMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              )}
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
