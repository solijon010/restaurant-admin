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
    setRoomForm({
      name: "",
      price: "",
      roomCategoryId: activeCats[0]?.id || "",
    });
    setRoomDialog(true);
  };

  const openEditRoom = (r: Room) => {
    setEditRoom(r);
    setRoomForm({
      name: r.name,
      price: String(r.price),
      roomCategoryId: r.roomCategoryId,
    });
    setRoomDialog(true);
  };

  const saveRoom = () => {
    if (!roomForm.name.trim()) return toast.error("Xona nomini kiriting");
    if (!roomForm.price || isNaN(Number(roomForm.price)))
      return toast.error("Narxni to'g'ri kiriting");
    if (!roomForm.roomCategoryId) return toast.error("Kategoriyani tanlang");

    if (editRoom) {
      updateRoomMutation.mutate({
        id: editRoom.id,
        data: {
          name: roomForm.name,
          price: Number(roomForm.price),
          roomCategoryId: roomForm.roomCategoryId,
        },
      });
    } else {
      createRoomMutation.mutate({
        name: roomForm.name,
        price: Number(roomForm.price),
        branchId: selectedBranchId,
        roomCategoryId: roomForm.roomCategoryId,
      });
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Xonalar</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Filial bo'yicha xona va kategoriyalarni boshqaring
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            refetchCats();
            refetchRooms();
          }}
          className="gap-1.5"
          disabled={!selectedBranchId}
        >
          <RefreshCw className="h-3.5 w-3.5" /> Yangilash
        </Button>
      </div>

      {/* Branch selector */}
      <Card className="p-4">
        {branchesLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Filiallar
            yuklanmoqda...
          </div>
        ) : branches.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center">
            Hech qanday filial topilmadi
          </p>
        ) : (
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0">
                <Store className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">
                  Faol filial
                </p>
                <Select
                  value={selectedBranchId}
                  onValueChange={setSelectedBranchId}
                >
                  <SelectTrigger className="h-8 border-0 p-0 text-sm font-semibold shadow-none focus:ring-0 w-72">
                    <SelectValue placeholder="Filial tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        <div className="flex flex-col py-0.5">
                          <span className="font-medium">{b.name}</span>
                          {/* {b.addres && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {b.addres}
                            </span>
                          )} */}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedBranchId && (
              <div className="flex gap-5 text-center shrink-0">
                <div>
                  <p className="text-lg font-bold">{roomsList.length}</p>
                  <p className="text-xs text-muted-foreground">Xona</p>
                </div>
                <div className="w-px bg-border" />
                <div>
                  <p className="text-lg font-bold">{categories.length}</p>
                  <p className="text-xs text-muted-foreground">Kategoriya</p>
                </div>
                <div className="w-px bg-border" />
                <div>
                  <p className="text-lg font-bold text-green-600">
                    {roomsList.filter((r) => r.status === "ACTIVE").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Faol</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {!selectedBranchId ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Davom etish uchun yuqoridan filial tanlang
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="rooms">
              Xonalar
              {roomsList.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 px-1.5 text-xs">
                  {roomsList.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="categories">
              Kategoriyalar
              {categories.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 px-1.5 text-xs">
                  {categories.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ══ Rooms ══════════════════════════════════════════════════════ */}
          <TabsContent value="rooms">
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <div className="flex gap-2 flex-1 min-w-0">
                <Input
                  placeholder="Xona qidirish..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-xs"
                />
                <Select value={catFilter} onValueChange={setCatFilter}>
                  <SelectTrigger className="w-52">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Barcha kategoriyalar</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          {c.name}
                          {c.status === "INACTIVE" && (
                            <Badge
                              variant="outline"
                              className="text-xs py-0 px-1"
                            >
                              Nofaol
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={openAddRoom}
                size="sm"
                disabled={activeCats.length === 0}
              >
                <Plus className="h-4 w-4 mr-1" /> Xona qo'shish
              </Button>
            </div>

            {activeCats.length === 0 && !catsLoading && (
              <div className="text-center py-3 text-sm text-amber-700 bg-amber-50 rounded-lg border border-amber-200 mb-4">
                ⚠️ Xona qo'shish uchun avval faol kategoriya yarating
              </div>
            )}

            {/* ═══ MOBILE CARDS ═══ */}
            <div className="md:hidden space-y-3">
              {roomsLoading ? (
                <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></div>
              ) : filteredRooms.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground text-sm">
                  {search || catFilter !== "ALL" ? "Qidiruv natijasi topilmadi" : "Xonalar mavjud emas"}
                </Card>
              ) : (
                filteredRooms.map((r) => {
                  const cat = categories.find((c) => c.id === r.roomCategoryId);
                  return (
                    <Card key={r.id} className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <BedDouble className="h-4 w-4 text-muted-foreground shrink-0" />
                            <p className="font-medium truncate">{r.name}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {cat && <Badge variant="secondary" className="text-xs">{cat.name}</Badge>}
                            <span className="text-sm font-semibold">{formatPrice(r.price)}</span>
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

            {/* ═══ DESKTOP TABLE ═══ */}
            <div className="hidden md:block">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomi</TableHead>
                    <TableHead>Kategoriya</TableHead>
                    <TableHead>Narx</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roomsLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                  ) : filteredRooms.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">{search || catFilter !== "ALL" ? "Qidiruv natijasi topilmadi" : "Xonalar mavjud emas"}</TableCell></TableRow>
                  ) : (
                    filteredRooms.map((r) => {
                      const cat = categories.find((c) => c.id === r.roomCategoryId);
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium"><div className="flex items-center gap-2"><BedDouble className="h-4 w-4 text-muted-foreground" />{r.name}</div></TableCell>
                          <TableCell>{cat ? <Badge variant="secondary">{cat.name}</Badge> : <span className="text-muted-foreground text-sm">—</span>}</TableCell>
                          <TableCell className="font-semibold">{formatPrice(r.price)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch checked={r.status === "ACTIVE"} onCheckedChange={() => toggleRoomMutation.mutate(r.id)} disabled={toggleRoomMutation.isPending} />
                              <Badge variant={r.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">{statusLabels[r.status]}</Badge>
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
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {selectedBranch?.name}
                </span>{" "}
                filialining xona kategoriyalari
              </p>
              <Button onClick={openAddCat} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Kategoriya qo'shish
              </Button>
            </div>

            {/* Mobile room categories */}
            <div className="md:hidden space-y-3">
              {catsLoading ? (
                <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></div>
              ) : categories.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground text-sm">Kategoriyalar mavjud emas</Card>
              ) : (
                categories.map((c) => {
                  const roomCount = roomsList.filter((r) => r.roomCategoryId === c.id).length;
                  return (
                    <Card key={c.id} className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{c.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">{roomCount} ta xona</Badge>
                            <Badge variant={c.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">{statusLabels[c.status]}</Badge>
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

            {/* Desktop room categories table */}
            <div className="hidden md:block">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomi</TableHead>
                    <TableHead>Xonalar</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catsLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                  ) : categories.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-10">Kategoriyalar mavjud emas</TableCell></TableRow>
                  ) : (
                    categories.map((c) => {
                      const roomCount = roomsList.filter((r) => r.roomCategoryId === c.id).length;
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell><Badge variant="secondary">{roomCount} ta</Badge></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch checked={c.status === "ACTIVE"} onCheckedChange={() => toggleCategoryMutation.mutate(c.id)} disabled={toggleCategoryMutation.isPending} />
                              <Badge variant={c.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">{statusLabels[c.status]}</Badge>
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
              <Label>
                Nomi <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Xona nomini kiriting"
                value={roomForm.name}
                onChange={(e) =>
                  setRoomForm({ ...roomForm, name: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>
                  Narx (so'm) <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  placeholder="0"
                  min={0}
                  value={roomForm.price}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, price: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Kategoriya <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={roomForm.roomCategoryId}
                  onValueChange={(v) =>
                    setRoomForm({ ...roomForm, roomCategoryId: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeCats.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
