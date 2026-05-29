import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useSettings } from '@/contexts/SettingsContext';
import { useBranch } from '@/contexts/BranchContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { branchService, BranchPayload } from '@/services/branchService';
import { t } from '@/lib/i18n';
import { Sun, Moon, Type, Languages, Building2, MapPin, Star, Loader2, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Check } from 'lucide-react';
import { toast } from 'sonner';

interface BranchForm { name: string; addres: string; kpi: string; }
const emptyForm: BranchForm = { name: '', addres: '', kpi: '0' };

export default function Settings() {
  const { theme, setTheme, language, setLanguage, fontSize, setFontSize } = useSettings();
  const { branches, branchesLoading, selectedBranchId } = useBranch();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BranchForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['branches-my'] });

  const createMutation = useMutation({
    mutationFn: (d: BranchPayload) => branchService.create(d),
    onSuccess: () => { toast.success("Filial qo'shildi"); invalidate(); setFormOpen(false); },
    onError: () => toast.error('Xatolik'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: BranchPayload }) => branchService.update(id, data),
    onSuccess: () => { toast.success('Yangilandi'); invalidate(); setFormOpen(false); },
    onError: () => toast.error('Xatolik'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => branchService.delete(id),
    onSuccess: () => { toast.success("O'chirildi"); invalidate(); setDeleteId(null); },
    onError: () => toast.error('Xatolik'),
  });
  const toggleMutation = useMutation({
    mutationFn: (id: string) => branchService.toggleStatus(id),
    onSuccess: () => invalidate(),
    onError: () => toast.error('Xatolik'),
  });

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setFormOpen(true); };
  const openEdit = (b: typeof branches[0]) => { setEditingId(b.id); setForm({ name: b.name, addres: b.addres ?? '', kpi: String(b.kpi ?? 0) }); setFormOpen(true); };
  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error('Nomi kiritilsin'); return; }
    const p: BranchPayload = { name: form.name.trim(), addres: form.addres.trim(), kpi: Number(form.kpi) || 0, companyId: user?.companyId ?? undefined };
    if (editingId) updateMutation.mutate({ id: editingId, data: p });
    else createMutation.mutate(p);
  };
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const Chip = ({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon?: React.ElementType; children: React.ReactNode }) => (
    <button type="button" onClick={onClick} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border transition-all ${active ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'}`}>
      {active && <Check className="h-3 w-3" />}
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </button>
  );

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('Sozlamalar', language)}</h1>
        <p className="text-sm text-muted-foreground mt-1">Ilova parametrlari va filiallarni boshqaring</p>
      </div>

      {/* Appearance Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("Ko'rinish", language)}</CardTitle>
          <CardDescription>Mavzu, til va matn o'lchamini sozlang</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Row icon={Sun} label={t('Mavzu', language)} desc="Yorug' yoki qorong'u rejim">
            <div className="flex gap-2">
              <Chip active={theme === 'light'} onClick={() => setTheme('light')} icon={Sun}>{t("Yorug'", language)}</Chip>
              <Chip active={theme === 'dark'} onClick={() => setTheme('dark')} icon={Moon}>{t("Qorong'u", language)}</Chip>
            </div>
          </Row>
          <Separator />
          <Row icon={Languages} label={t('Til', language)} desc="Interfeys tili">
            <div className="flex gap-2">
              <Chip active={language === 'latin'} onClick={() => setLanguage('latin')}>{t('Lotin', language)}</Chip>
              <Chip active={language === 'cyrillic'} onClick={() => setLanguage('cyrillic')}>{t('Kiril', language)}</Chip>
            </div>
          </Row>
          <Separator />
          <Row icon={Type} label={t("Yozuv o'lchami", language)} desc="Kichik, o'rta yoki katta">
            <div className="flex gap-2">
              <Chip active={fontSize === 'sm'} onClick={() => setFontSize('sm')}>{t('Kichik', language)}</Chip>
              <Chip active={fontSize === 'md'} onClick={() => setFontSize('md')}>{t("O'rta", language)}</Chip>
              <Chip active={fontSize === 'lg'} onClick={() => setFontSize('lg')}>{t('Katta', language)}</Chip>
            </div>
          </Row>
        </CardContent>
      </Card>

      {/* Branches */}
      {(branches.length > 0 || branchesLoading) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Filiallar</h2>
              <p className="text-xs text-muted-foreground">Kompaniyangizga tegishli filiallar</p>
            </div>
            <Button size="sm" onClick={openCreate} className="gap-1.5 h-8">
              <Plus className="h-3.5 w-3.5" /> {t("Filial qo'shish", language)}
            </Button>
          </div>

          {branchesLoading ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm">Yuklanmoqda...</span>
            </div>
          ) : branches.length === 0 ? (
            <Card className="border-dashed"><CardContent className="py-10 text-center text-muted-foreground text-sm">Hali filial yo'q</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {branches.map((b, i) => {
                const isActive = b.status === 'ACTIVE';
                const isCurrent = b.id === selectedBranchId;
                return (
                  <Card key={b.id} className={isCurrent ? 'ring-1 ring-ring' : ''}>
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${isCurrent ? 'bg-emerald-50' : 'bg-muted'}`}>
                        {i === 0 ? <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> : <Building2 className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">{b.name}</span>
                          {isCurrent && <Badge variant="outline" className="text-[10px] py-0 h-4 px-1.5 text-emerald-600 border-emerald-300">Joriy</Badge>}
                          <Badge variant={isActive ? 'default' : 'secondary'} className="text-[10px] py-0 h-4 px-1.5">{isActive ? 'Faol' : 'Nofaol'}</Badge>
                        </div>
                        {b.addres && <div className="flex items-center gap-1 mt-1"><MapPin className="h-3 w-3 text-muted-foreground/50" /><span className="text-xs text-muted-foreground truncate">{b.addres}</span></div>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(b)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={toggleMutation.isPending} onClick={() => toggleMutation.mutate(b.id)}>
                          {isActive ? <ToggleRight className="h-4 w-4 text-emerald-600" /> : <ToggleLeft className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(b.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingId ? 'Filialni tahrirlash' : "Yangi filial"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Nomi *</Label><Input placeholder="Filial nomi" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Manzil</Label><Input placeholder="Shahar, ko'cha" value={form.addres} onChange={e => setForm(f => ({ ...f, addres: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>KPI (%)</Label><Input type="number" min="0" max="100" value={form.kpi} onChange={e => setForm(f => ({ ...f, kpi: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={isSaving}>Bekor</Button>
            <Button onClick={handleSubmit} disabled={isSaving}>{isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingId ? 'Saqlash' : "Qo'shish"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Filialni o'chirish</AlertDialogTitle><AlertDialogDescription>Bu amalni ortga qaytarib bo'lmaydi.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Row({ icon: Icon, label, desc, children }: { icon: React.ElementType; label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
