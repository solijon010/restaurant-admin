import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSettings } from '@/contexts/SettingsContext';
import { useBranch } from '@/contexts/BranchContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { branchService, BranchPayload } from '@/services/branchService';
import { t } from '@/lib/i18n';
import {
  Sun, Moon, Type, Languages, GitBranch, MapPin,
  Star, Loader2, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface BranchForm {
  name: string;
  addres: string;
  kpi: string;
}

const emptyForm: BranchForm = { name: '', addres: '', kpi: '0' };

export default function Settings() {
  const { theme, setTheme, language, setLanguage, fontSize, setFontSize } = useSettings();
  const { branches, branchesLoading, selectedBranchId } = useBranch();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isManagerCtx = branches.length > 0 || branchesLoading;

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BranchForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['branches-my'] });

  // Create
  const createMutation = useMutation({
    mutationFn: (data: BranchPayload) => branchService.create(data),
    onSuccess: () => { toast.success("Filial qo'shildi"); invalidate(); setFormOpen(false); },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  // Update
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: BranchPayload }) => branchService.update(id, data),
    onSuccess: () => { toast.success('Filial yangilandi'); invalidate(); setFormOpen(false); },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: (id: string) => branchService.delete(id),
    onSuccess: () => { toast.success("Filial o'chirildi"); invalidate(); setDeleteId(null); },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  // Toggle status
  const toggleMutation = useMutation({
    mutationFn: (id: string) => branchService.toggleStatus(id),
    onSuccess: () => { invalidate(); },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (b: typeof branches[0]) => {
    setEditingId(b.id);
    setForm({ name: b.name, addres: b.addres ?? '', kpi: String(b.kpi ?? 0) });
    setFormOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error('Filial nomi kiritilishi shart'); return; }
    const payload: BranchPayload = {
      name: form.name.trim(),
      addres: form.addres.trim(),
      kpi: Number(form.kpi) || 0,
      companyId: user?.companyId ?? undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">{t('Sozlamalar', language)}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Theme */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <Sun className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-base font-semibold text-foreground">{t('Mavzu', language)}</h3>
          </div>
          <div className="flex gap-2">
            <Button variant={theme === 'light' ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => setTheme('light')}>
              <Sun className="h-3.5 w-3.5 mr-1.5" />{t("Yorug'", language)}
            </Button>
            <Button variant={theme === 'dark' ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => setTheme('dark')}>
              <Moon className="h-3.5 w-3.5 mr-1.5" />{t("Qorong'u", language)}
            </Button>
          </div>
        </Card>

        {/* Language */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <Languages className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-base font-semibold text-foreground">{t('Til', language)}</h3>
          </div>
          <div className="flex gap-2">
            <Button variant={language === 'latin' ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => setLanguage('latin')}>
              {t('Lotin', language)}
            </Button>
            <Button variant={language === 'cyrillic' ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => setLanguage('cyrillic')}>
              {t('Kiril', language)}
            </Button>
          </div>
        </Card>

        {/* Font size */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <Type className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-base font-semibold text-foreground">{t("Yozuv o'lchami", language)}</h3>
          </div>
          <div className="flex gap-2">
            {([{ key: 'sm', label: 'Kichik' }, { key: 'md', label: "O'rta" }, { key: 'lg', label: 'Katta' }] as const).map(s => (
              <Button key={s.key} variant={fontSize === s.key ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => setFontSize(s.key)}>
                {t(s.label, language)}
              </Button>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Filiallar ────────────────────────────────────────────────── */}
      {isManagerCtx && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">Filiallar</h3>
              {!branchesLoading && (
                <Badge variant="secondary" className="ml-1">{branches.length} ta</Badge>
              )}
            </div>
            <Button size="sm" onClick={openCreate} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Filial qo'shish
            </Button>
          </div>

          {branchesLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-6">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Yuklanmoqda...</span>
            </div>
          ) : branches.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground text-sm">
              Hali filial yo'q. Birinchi filialni qo'shing.
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {branches.map((b, i) => {
                const isActive = b.status === 'ACTIVE';
                const isCurrent = b.id === selectedBranchId;
                return (
                  <Card key={b.id} className={`p-4 ${isCurrent ? 'ring-2 ring-primary' : ''}`}>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {i === 0 && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                        <span className="font-medium text-foreground truncate">{b.name}</span>
                      </div>
                      <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs shrink-0">
                        {isActive ? 'Faol' : 'Nofaol'}
                      </Badge>
                    </div>

                    {/* Address */}
                    {b.addres && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{b.addres}</span>
                      </div>
                    )}

                    {/* KPI */}
                    {b.kpi > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">KPI: {b.kpi}%</p>
                    )}

                    {isCurrent && (
                      <p className="mt-1 text-xs text-primary font-medium">Joriy filial</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs gap-1 flex-1"
                        onClick={() => openEdit(b)}
                      >
                        <Pencil className="h-3 w-3" />
                        Tahrirlash
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs gap-1 flex-1"
                        disabled={toggleMutation.isPending}
                        onClick={() => toggleMutation.mutate(b.id)}
                      >
                        {isActive
                          ? <ToggleRight className="h-3.5 w-3.5 text-green-600" />
                          : <ToggleLeft className="h-3.5 w-3.5 text-muted-foreground" />
                        }
                        {isActive ? 'Faol' : 'Nofaol'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteId(b.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Create / Edit Dialog ─────────────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Filialni tahrirlash' : "Yangi filial qo'shish"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="br-name">Filial nomi <span className="text-destructive">*</span></Label>
              <Input
                id="br-name"
                placeholder="Masalan: Asosiy filial"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="br-addr">Manzil</Label>
              <Input
                id="br-addr"
                placeholder="Shahar, ko'cha, uy"
                value={form.addres}
                onChange={e => setForm(f => ({ ...f, addres: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="br-kpi">KPI foizi (%)</Label>
              <Input
                id="br-kpi"
                type="number"
                min="0"
                max="100"
                placeholder="0"
                value={form.kpi}
                onChange={e => setForm(f => ({ ...f, kpi: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={isSaving}>
              Bekor qilish
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingId ? 'Saqlash' : "Qo'shish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ───────────────────────────────────────────── */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Filialni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Bu amalni ortga qaytarib bo'lmaydi. Filial va unga tegishli barcha ma'lumotlar o'chib ketadi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
