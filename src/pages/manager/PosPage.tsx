import { useEffect, useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { t } from '@/lib/i18n';
import { branchService } from '@/services/branchService';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Monitor, Plus, Pencil, Trash2, Power, PowerOff, Wifi, WifiOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CreatePosDto, posService, PosTerminal, UpdatePosDto } from '@/services/posService';

interface Branch {
    id: string;
    name: string;
}

export default function PosPage() {
    const { language } = useSettings();
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'SUPERADMIN';

    const [terminals, setTerminals] = useState<PosTerminal[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedPos, setSelectedPos] = useState<PosTerminal | null>(null);

    // Form state
    const [form, setForm] = useState<CreatePosDto>({
        name: '',
        branchId: '',
        ipAddress: '',
        port: '9100',
    });
    const [formLoading, setFormLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [posData, branchData] = await Promise.all([
                posService.getAll(),
                branchService.getAll(),
            ]);
            setTerminals(posData);
            setBranches(branchData);
        } catch {
            toast({ title: 'Xatolik', description: "Ma'lumotlar yuklanmadi", variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const resetForm = () => {
        setForm({ name: '', branchId: '', ipAddress: '', port: '9100' });
    };

    const handleCreate = async () => {
        if (!form.name || !form.branchId || !form.ipAddress) return;
        setFormLoading(true);
        try {
            await posService.create(form);
            toast({ title: "Muvaffaqiyatli", description: "POS terminal qo'shildi" });
            setCreateOpen(false);
            resetForm();
            fetchData();
        } catch (e: any) {
            toast({
                title: 'Xatolik',
                description: e?.response?.data?.message || 'Xatolik yuz berdi',
                variant: 'destructive',
            });
        } finally {
            setFormLoading(false);
        }
    };

    const handleEdit = async () => {
        if (!selectedPos) return;
        setFormLoading(true);
        try {
            const payload: UpdatePosDto = {
                name: form.name,
                ipAddress: form.ipAddress,
                port: form.port,
            };
            await posService.update(selectedPos.id, payload);
            toast({ title: "Muvaffaqiyatli", description: 'POS terminal yangilandi' });
            setEditOpen(false);
            fetchData();
        } catch (e: any) {
            toast({
                title: 'Xatolik',
                description: e?.response?.data?.message || 'Xatolik yuz berdi',
                variant: 'destructive',
            });
        } finally {
            setFormLoading(false);
        }
    };

    const handleToggleStatus = async (pos: PosTerminal) => {
        try {
            await posService.toggleStatus(pos.id);
            toast({
                title: "Muvaffaqiyatli",
                description: `Status ${pos.status === 'ACTIVE' ? "o'chirildi" : 'yoqildi'}`,
            });
            fetchData();
        } catch {
            toast({ title: 'Xatolik', description: 'Status o\'zgartirish xato', variant: 'destructive' });
        }
    };

    const handleDelete = async () => {
        if (!selectedPos) return;
        try {
            await posService.remove(selectedPos.id);
            toast({ title: "Muvaffaqiyatli", description: "POS terminal o'chirildi" });
            setDeleteOpen(false);
            fetchData();
        } catch {
            toast({ title: 'Xatolik', description: "O'chirishda xato", variant: 'destructive' });
        }
    };

    const openEdit = (pos: PosTerminal) => {
        setSelectedPos(pos);
        setForm({
            name: pos.name,
            branchId: pos.branchId,
            ipAddress: pos.ipAddress,
            port: pos.port,
        });
        setEditOpen(true);
    };

    const openDelete = (pos: PosTerminal) => {
        setSelectedPos(pos);
        setDeleteOpen(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">POS Terminallar</h2>
                    <p className="text-sm text-muted-foreground mt-1">Har bir filial uchun kassa terminali</p>
                </div>
                <Button
                    onClick={() => { resetForm(); setCreateOpen(true); }}
                    className="gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Terminal qo'shish
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                <Card className="p-4">
                    <p className="text-sm text-muted-foreground">Jami terminallar</p>
                    <p className="text-2xl font-bold mt-1">{terminals.length}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-muted-foreground">Faol</p>
                    <p className="text-2xl font-bold mt-1 text-green-500">
                        {terminals.filter(t => t.status === 'ACTIVE').length}
                    </p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-muted-foreground">Arxiv</p>
                    <p className="text-2xl font-bold mt-1 text-muted-foreground">
                        {terminals.filter(t => t.status === 'INACTIVE').length}
                    </p>
                </Card>
            </div>

            {/* Terminals Grid */}
            {terminals.length === 0 ? (
                <Card className="p-12 text-center">
                    <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Hali POS terminal qo'shilmagan</p>
                    <Button
                        variant="outline"
                        className="mt-4 gap-2"
                        onClick={() => { resetForm(); setCreateOpen(true); }}
                    >
                        <Plus className="h-4 w-4" />
                        Terminal qo'shish
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {terminals.map((pos) => (
                        <Card key={pos.id} className="p-5 flex flex-col gap-4">
                            {/* Top: icon + status */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${pos.status === 'ACTIVE' ? 'bg-green-500/10' : 'bg-muted'}`}>
                                        <Monitor className={`h-5 w-5 ${pos.status === 'ACTIVE' ? 'text-green-500' : 'text-muted-foreground'}`} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm text-foreground leading-tight">{pos.name}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {pos.branch?.name || branches.find(b => b.id === pos.branchId)?.name || pos.branchId}
                                        </p>
                                    </div>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pos.status === 'ACTIVE'
                                    ? 'bg-green-500/10 text-green-600'
                                    : 'bg-muted text-muted-foreground'
                                    }`}>
                                    {pos.status === 'ACTIVE' ? 'Faol' : 'Arxiv'}
                                </span>
                            </div>

                            {/* Connection info */}
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    {pos.status === 'ACTIVE'
                                        ? <Wifi className="h-3.5 w-3.5 text-green-500" />
                                        : <WifiOff className="h-3.5 w-3.5" />
                                    }
                                    <span className="font-mono">{pos.ipAddress}:{pos.port}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-1 border-t border-border">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => openEdit(pos)}
                                    title="Tahrirlash"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`h-8 w-8 ${pos.status === 'ACTIVE' ? 'text-orange-500 hover:text-orange-600' : 'text-green-500 hover:text-green-600'}`}
                                    onClick={() => handleToggleStatus(pos)}
                                    title={pos.status === 'ACTIVE' ? "O'chirish" : 'Yoqish'}
                                >
                                    {pos.status === 'ACTIVE'
                                        ? <PowerOff className="h-3.5 w-3.5" />
                                        : <Power className="h-3.5 w-3.5" />
                                    }
                                </Button>
                                {isSuperAdmin && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive ml-auto"
                                        onClick={() => openDelete(pos)}
                                        title="O'chirish"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Yangi POS Terminal</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Terminal nomi</Label>
                            <Input
                                placeholder="Masalan: Kassa 1"
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Filial</Label>
                            <Select value={form.branchId} onValueChange={v => setForm(f => ({ ...f, branchId: v }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filialni tanlang" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map(b => (
                                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>IP Manzil</Label>
                            <Input
                                placeholder="192.168.1.100"
                                value={form.ipAddress}
                                onChange={e => setForm(f => ({ ...f, ipAddress: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Port</Label>
                            <Input
                                placeholder="9100"
                                value={form.port}
                                onChange={e => setForm(f => ({ ...f, port: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>Bekor qilish</Button>
                        <Button onClick={handleCreate} disabled={formLoading || !form.name || !form.branchId || !form.ipAddress}>
                            {formLoading ? 'Saqlanmoqda...' : "Qo'shish"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Terminalni tahrirlash</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Terminal nomi</Label>
                            <Input
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>IP Manzil</Label>
                            <Input
                                value={form.ipAddress}
                                onChange={e => setForm(f => ({ ...f, ipAddress: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Port</Label>
                            <Input
                                value={form.port}
                                onChange={e => setForm(f => ({ ...f, port: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>Bekor qilish</Button>
                        <Button onClick={handleEdit} disabled={formLoading}>
                            {formLoading ? 'Saqlanmoqda...' : 'Saqlash'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete AlertDialog */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Terminalni o'chirish</AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>{selectedPos?.name}</strong> terminalini o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            O'chirish
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
