import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/contexts/SettingsContext';
import { useBranch } from '@/contexts/BranchContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { branchService, BranchPayload } from '@/services/branchService';
import { t } from '@/lib/i18n';
import {
  Sun, Moon, Building2, MapPin, Star,
  Loader2, Plus, Pencil, Trash2,
  ToggleLeft, ToggleRight, Check, Eye, TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

interface BranchForm { name: string; addres: string; kpi: string; }
const emptyForm: BranchForm = { name: '', addres: '', kpi: '0' };

const R = {
  bg:      'hsl(var(--sidebar-background))',
  card:    'hsl(var(--card))',
  cardHdr: 'hsl(var(--muted))',
  border:  'hsl(var(--border))',
  green:   'hsl(var(--accent))',
  greenHi: 'hsl(161 84% 55%)',
  greenBg: 'hsl(var(--accent) / 0.08)',
  cream:   'hsl(var(--secondary))',
  text:    'hsl(var(--foreground))',
  muted:   'hsl(var(--muted-foreground))',
  font:    "'Inter', system-ui, sans-serif",
};

const RetroCard = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    background: 'hsl(var(--card))',
    border: '2px solid hsl(var(--border))',
    boxShadow: '4px 4px 0 hsl(var(--border))',
    borderRadius: 2, overflow: 'hidden', ...style,
  }}>
    {children}
  </div>
);

const RetroSectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div style={{ marginBottom: 10 }}>
    <h3 style={{ fontSize: 22, fontWeight: 700, color: R.text, margin: 0, fontFamily: R.font }}>{children}</h3>
    <div style={{ height: 2, background: R.green, marginTop: 4, width: '100%' }} />
  </div>
);

const RetroChip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '8px 18px', cursor: 'pointer',
      fontFamily: R.font, fontSize: 15, fontWeight: 700,
      border: '2px solid hsl(var(--border))',
      background: active ? 'hsl(var(--accent))' : 'hsl(var(--card))',
      color: active ? '#fff' : 'hsl(var(--foreground))',
      boxShadow: active ? 'none' : '2px 2px 0 hsl(var(--border))',
      transform: active ? 'translate(2px,2px)' : 'none',
      borderRadius: 2, transition: 'all 0.08s ease',
      outline: 'none',
    }}
  >
    {active && <Check size={12} />}
    {children}
  </button>
);

export default function Settings() {
  const { theme, setTheme, language, setLanguage, fontSize, setFontSize } = useSettings();
  const { branches, branchesLoading, selectedBranchId } = useBranch();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isManagerCtx = branches.length > 0 || branchesLoading;

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
  const openEdit = (b: typeof branches[0]) => {
    setEditingId(b.id); setForm({ name: b.name, addres: b.addres ?? '', kpi: String(b.kpi ?? 0) }); setFormOpen(true);
  };
  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error('Nomi kiritilsin'); return; }
    const p: BranchPayload = { name: form.name.trim(), addres: form.addres.trim(), kpi: Number(form.kpi) || 0, companyId: user?.companyId ?? undefined };
    if (editingId) updateMutation.mutate({ id: editingId, data: p });
    else createMutation.mutate(p);
  };
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div style={{ fontFamily: R.font, position: 'relative' }}>

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: R.text, margin: 0, fontFamily: R.font }}>
          {t('Sozlamalar', language)}
        </h1>
        <p style={{ fontSize: 16, color: R.muted, marginTop: 4 }}>Ilova parametrlari va filiallar</p>
      </div>

      <div className="flex flex-col lg:flex-row" style={{ gap: 24, alignItems: 'flex-start' }}>

        {/* ── LEFT ── */}
        <div style={{ flex: '1 1 0', minWidth: 0 }}>

          {/* Appearance */}
          <RetroSectionTitle>Appearance</RetroSectionTitle>
          <RetroCard style={{ marginBottom: 28 }}>

            {/* Mavzu */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
              <div>
                <p style={{ fontSize: 18, fontWeight: 700, color: R.text, margin: 0 }}>{t('Mavzu', language)}</p>
                <p style={{ fontSize: 15, color: R.muted, marginTop: 3 }}>Yorug' yoki qorong'u rejim</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <RetroChip active={theme === 'light'} onClick={() => setTheme('light')}><Sun size={13} /> {t("Yorug'", language)}</RetroChip>
                <RetroChip active={theme === 'dark'} onClick={() => setTheme('dark')}><Moon size={13} /> {t("Qorong'u", language)}</RetroChip>
              </div>
            </div>
            <hr className="retro-divider" />

            {/* Til */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
              <div>
                <p style={{ fontSize: 18, fontWeight: 700, color: R.text, margin: 0 }}>{t('Til', language)}</p>
                <p style={{ fontSize: 15, color: R.muted, marginTop: 3 }}>Interfeys tili</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <RetroChip active={language === 'latin'} onClick={() => setLanguage('latin')}>{t('Lotin', language)}</RetroChip>
                <RetroChip active={language === 'cyrillic'} onClick={() => setLanguage('cyrillic')}>{t('Kiril', language)}</RetroChip>
              </div>
            </div>
            <hr className="retro-divider" />

            {/* Yozuv o'lchami */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
              <div>
                <p style={{ fontSize: 18, fontWeight: 700, color: R.text, margin: 0 }}>{t("Yozuv o'lchami", language)}</p>
                <p style={{ fontSize: 15, color: R.muted, marginTop: 3 }}>Kichik, o'rta yoki katta</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <RetroChip active={fontSize === 'sm'} onClick={() => setFontSize('sm')}>{t('Kichik', language)}</RetroChip>
                <RetroChip active={fontSize === 'md'} onClick={() => setFontSize('md')}>{t("O'rta", language)}</RetroChip>
                <RetroChip active={fontSize === 'lg'} onClick={() => setFontSize('lg')}>{t('Katta', language)}</RetroChip>
              </div>
            </div>

          </RetroCard>

          {/* Branches */}
          {isManagerCtx && (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <RetroSectionTitle>Branches</RetroSectionTitle>
                  <p style={{ fontSize: 15, color: R.muted, marginTop: -4 }}>Kompaniyangizga tegishli barcha filiallar</p>
                </div>
                <button onClick={openCreate} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', marginTop: 2,
                  background: R.green, color: '#fff',
                  border: `2px solid ${R.border}`,
                  boxShadow: `3px 3px 0 ${R.border}`,
                  fontFamily: R.font, fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', borderRadius: 2, transition: 'all 0.08s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translate(3px,3px)'; e.currentTarget.style.boxShadow = 'none'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `3px 3px 0 ${R.border}`; }}
                >
                  <Plus size={14} /> + {t("Filial qo'shish", language)}
                </button>
              </div>

              <RetroCard>
                {branchesLoading ? (
                  <div style={{ padding: 20, display: 'flex', gap: 8, alignItems: 'center', color: R.muted }}>
                    <Loader2 size={14} className="animate-spin" /><span style={{ fontSize: 14 }}>Yuklanmoqda...</span>
                  </div>
                ) : branches.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: R.muted }}>
                    <Building2 size={24} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                    <p style={{ fontSize: 14 }}>Hali filial yo'q</p>
                  </div>
                ) : branches.map((b, i) => {
                  const isActive = b.status === 'ACTIVE';
                  const isCurrent = b.id === selectedBranchId;
                  return (
                    <div key={b.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
                        {/* Icon */}
                        <div style={{
                          width: 44, height: 44, flexShrink: 0,
                          background: R.cardHdr, border: `2px solid ${R.border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {i === 0 ? <Star size={18} style={{ color: '#D4A020', fill: '#D4A020' }} /> : <Building2 size={16} style={{ color: R.muted }} />}
                        </div>
                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 17, fontWeight: 700, color: R.text }}>{b.name}</span>
                            <span style={{
                              fontSize: 12, fontWeight: 700, padding: '2px 6px',
                              border: `1.5px solid ${R.green}`, background: R.greenBg,
                              color: R.green, letterSpacing: '0.06em', textTransform: 'uppercase',
                              borderRadius: 2,
                            }}>
                              {isActive ? 'AKTIV' : 'NOFAOL'}
                            </span>
                          </div>
                          {b.addres && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                              <MapPin size={11} style={{ color: R.muted }} />
                              <span style={{ fontSize: 15, color: R.muted }}>{b.addres}</span>
                            </div>
                          )}
                        </div>
                        {/* Status dot */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px',
                          border: `1.5px solid ${R.border}`, background: R.cream,
                          fontSize: 14, fontWeight: 700, color: isActive ? R.green : R.muted,
                          borderRadius: 2,
                        }}>
                          <span style={{ width: 7, height: 7, borderRadius: 1, background: isActive ? R.greenHi : R.muted }} />
                          {isCurrent ? 'Bosh' : isActive ? 'Faol' : 'Nofaol'}
                        </div>
                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 6 }}>
                          {[
                            { icon: Pencil, onClick: () => openEdit(b), danger: false },
                            { icon: Eye, onClick: () => {}, danger: false },
                            { icon: Trash2, onClick: () => setDeleteId(b.id), danger: true },
                          ].map(({ icon: Icon, onClick, danger }, idx) => (
                            <button key={idx} onClick={onClick} style={{
                              width: 32, height: 32, border: `2px solid ${R.border}`,
                              background: R.cream, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: danger ? '#c0392b' : R.muted, borderRadius: 2,
                              boxShadow: `2px 2px 0 ${R.border}`, transition: 'all 0.08s',
                            }}
                              onMouseEnter={e => { e.currentTarget.style.transform = 'translate(2px,2px)'; e.currentTarget.style.boxShadow = 'none'; }}
                              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `2px 2px 0 ${R.border}`; }}
                            >
                              <Icon size={13} />
                            </button>
                          ))}
                        </div>
                      </div>
                      {i < branches.length - 1 && <hr className="retro-divider" />}
                    </div>
                  );
                })}
              </RetroCard>
            </>
          )}
        </div>

        {/* ── RIGHT ── */}
        <div className="w-full lg:w-64 lg:flex-shrink-0">
          <p style={{ fontSize: 18, fontWeight: 700, color: R.text, marginBottom: 10, fontFamily: R.font }}>Metric cards</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            {[
              { label: 'Filiallar', value: branches.length, sub: 'ta jami', icon: Building2, prog: 65, col: R.green },
              { label: 'Faollar', value: branches.filter(b => b.status === 'ACTIVE').length, sub: 'ta faol', icon: TrendingUp, prog: 45, col: '#5B6ABF' },
            ].map(({ label, value, sub, icon: Icon, prog, col }) => (
              <RetroCard key={label} style={{ padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, color: R.muted, fontWeight: 700 }}>{label}</span>
                  <Icon size={14} style={{ color: col }} />
                </div>
                <p style={{ fontSize: 30, fontWeight: 700, color: R.text, margin: '4px 0 2px' }}>{value}</p>
                <p style={{ fontSize: 13, color: R.muted, margin: '0 0 8px' }}>{sub}</p>
                <div style={{ height: 4, background: '#D8D0A8', borderRadius: 0, border: `1px solid ${R.border}` }}>
                  <div style={{ width: `${prog}%`, height: '100%', background: col }} />
                </div>
              </RetroCard>
            ))}
          </div>

          {/* Branch panel */}
          <RetroCard>
            <div style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: R.text, margin: '0 0 6px', fontFamily: R.font }}>Branch management panel</p>
              <p style={{ fontSize: 14, color: R.muted, margin: '0 0 14px', lineHeight: 1.5 }}>Filiallaringizni kuzatish va boshqarish.</p>
              <button onClick={openCreate} style={{
                width: '100%', padding: '9px', cursor: 'pointer',
                background: R.green, color: '#fff', fontFamily: R.font,
                border: `2px solid ${R.border}`, boxShadow: `3px 3px 0 ${R.border}`,
                fontSize: 15, fontWeight: 700, borderRadius: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                transition: 'all 0.08s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translate(3px,3px)'; e.currentTarget.style.boxShadow = 'none'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `3px 3px 0 ${R.border}`; }}
              >
                <Plus size={14} /> + Add branch
              </button>
            </div>
          </RetroCard>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle style={{ fontFamily: R.font }}>{editingId ? 'Tahrirlash' : "Yangi filial"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Nomi *</Label><Input placeholder="Filial nomi" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Manzil</Label><Input placeholder="Shahar, ko'cha" value={form.addres} onChange={e => setForm(f => ({ ...f, addres: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>KPI (%)</Label><Input type="number" min="0" max="100" value={form.kpi} onChange={e => setForm(f => ({ ...f, kpi: e.target.value }))} /></div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={isSaving}>Bekor</Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingId ? 'Saqlash' : "Qo'shish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Filialni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>Bu amalni ortga qaytarib bo'lmaydi.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
