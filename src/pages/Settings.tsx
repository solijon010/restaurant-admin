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
  Sun, Moon, Languages, Type, Building2, MapPin, Star,
  Loader2, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  Check, Eye, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface BranchForm { name: string; addres: string; kpi: string; }
const emptyForm: BranchForm = { name: '', addres: '', kpi: '0' };

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
    <div style={{ maxWidth: 680 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
          {t('Sozlamalar', language)}
        </h1>
        <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 5 }}>
          Ilova parametrlari va filiallarni boshqaring
        </p>
      </div>

      {/* ── Appearance ── */}
      <SectionTitle>{t("Ko'rinish", language)}</SectionTitle>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>

        {/* Theme */}
        <SettingCard
          icon={<Sun size={16} color="#059669" />}
          title={t('Mavzu', language)}
          desc="Yorug' yoki qorong'u rejim"
        >
          <div style={{ display: 'flex', gap: 6 }}>
            <Chip active={theme === 'light'} onClick={() => setTheme('light')}>
              <Sun size={12} /> {t("Yorug'", language)}
            </Chip>
            <Chip active={theme === 'dark'} onClick={() => setTheme('dark')}>
              <Moon size={12} /> {t("Qorong'u", language)}
            </Chip>
          </div>
        </SettingCard>

        {/* Language */}
        <SettingCard
          icon={<Languages size={16} color="#059669" />}
          title={t('Til', language)}
          desc="Interfeys tili"
        >
          <div style={{ display: 'flex', gap: 6 }}>
            <Chip active={language === 'latin'} onClick={() => setLanguage('latin')}>
              {t('Lotin', language)}
            </Chip>
            <Chip active={language === 'cyrillic'} onClick={() => setLanguage('cyrillic')}>
              {t('Kiril', language)}
            </Chip>
          </div>
        </SettingCard>

        {/* Font size */}
        <SettingCard
          icon={<Type size={16} color="#059669" />}
          title={t("Yozuv o'lchami", language)}
          desc="Kichik, o'rta yoki katta"
        >
          <div style={{ display: 'flex', gap: 6 }}>
            <Chip active={fontSize === 'sm'} onClick={() => setFontSize('sm')}>{t('Kichik', language)}</Chip>
            <Chip active={fontSize === 'md'} onClick={() => setFontSize('md')}>{t("O'rta", language)}</Chip>
            <Chip active={fontSize === 'lg'} onClick={() => setFontSize('lg')}>{t('Katta', language)}</Chip>
          </div>
        </SettingCard>
      </div>

      {/* ── Branches ── */}
      {isManagerCtx && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <SectionTitle>Filiallar</SectionTitle>
            <button onClick={openCreate} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 9,
              background: '#059669', color: '#fff', border: 'none',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#047857'}
              onMouseLeave={e => e.currentTarget.style.background = '#059669'}
            >
              <Plus size={14} /> {t("Filial qo'shish", language)}
            </button>
          </div>

          {branchesLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '20px 0', color: '#94a3b8' }}>
              <Loader2 size={15} className="animate-spin" />
              <span style={{ fontSize: 14 }}>Yuklanmoqda...</span>
            </div>
          ) : branches.length === 0 ? (
            <div style={{
              padding: '40px 24px', textAlign: 'center',
              border: '2px dashed #e5e7eb', borderRadius: 14, color: '#94a3b8',
            }}>
              <Building2 size={28} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
              <p style={{ fontSize: 14, fontWeight: 600 }}>Hali filial yo'q</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {branches.map((b, i) => {
                const isActive = b.status === 'ACTIVE';
                const isCurrent = b.id === selectedBranchId;
                return (
                  <div key={b.id} style={{
                    background: '#fff',
                    border: `1.5px solid ${isCurrent ? '#6ee7b7' : '#e5e7eb'}`,
                    borderRadius: 14,
                    padding: '16px 18px',
                    boxShadow: isCurrent ? '0 0 0 3px rgba(16,185,129,0.08)' : '0 1px 4px rgba(0,0,0,0.04)',
                    display: 'flex', alignItems: 'center', gap: 14,
                    transition: 'all 0.15s',
                  }}>
                    {/* Icon */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: isCurrent ? '#ecfdf5' : '#f8fafc',
                      border: `1.5px solid ${isCurrent ? '#a7f3d0' : '#e5e7eb'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {i === 0
                        ? <Star size={18} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                        : <Building2 size={16} style={{ color: '#94a3b8' }} />
                      }
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{b.name}</span>
                        {isCurrent && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: '#dcfce7', color: '#15803d', letterSpacing: '0.04em' }}>
                            JORIY
                          </span>
                        )}
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                          background: isActive ? '#f0fdf4' : '#f8fafc',
                          color: isActive ? '#16a34a' : '#94a3b8',
                          border: `1px solid ${isActive ? '#bbf7d0' : '#e2e8f0'}`,
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: isActive ? '#22c55e' : '#cbd5e1', display: 'inline-block' }} />
                          {isActive ? 'Faol' : 'Nofaol'}
                        </span>
                      </div>
                      {b.addres && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5 }}>
                          <MapPin size={11} style={{ color: '#94a3b8', flexShrink: 0 }} />
                          <span style={{ fontSize: 13, color: '#64748b' }}>{b.addres}</span>
                        </div>
                      )}
                      {b.kpi > 0 && (
                        <span style={{ fontSize: 12, color: '#94a3b8', marginTop: 3, display: 'block' }}>
                          KPI: <strong style={{ color: '#0f172a' }}>{b.kpi}%</strong>
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <ActionBtn onClick={() => openEdit(b)} title="Tahrirlash"><Pencil size={13} /></ActionBtn>
                      <ActionBtn onClick={() => toggleMutation.mutate(b.id)} title="Holat" disabled={toggleMutation.isPending}>
                        {isActive
                          ? <ToggleRight size={15} style={{ color: '#059669' }} />
                          : <ToggleLeft size={15} />}
                      </ActionBtn>
                      <ActionBtn onClick={() => setDeleteId(b.id)} title="O'chirish" danger>
                        <Trash2 size={13} />
                      </ActionBtn>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Dialogs */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Filialni tahrirlash' : "Yangi filial"}</DialogTitle>
          </DialogHeader>
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

/* ── Sub-components ── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>{children}</h3>
      <div style={{ width: 32, height: 2, background: '#059669', borderRadius: 99, marginTop: 5 }} />
    </div>
  );
}

function SettingCard({ icon, title, desc, children }: {
  icon: React.ReactNode; title: string; desc: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      padding: '16px 20px',
      background: '#fff',
      border: '1.5px solid #f1f5f9',
      borderRadius: 12,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#d1fae5')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#f1f5f9')}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
          background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>{title}</p>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, marginTop: 2 }}>{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
      fontSize: 13, fontWeight: active ? 600 : 400,
      border: `1.5px solid ${active ? '#059669' : '#e5e7eb'}`,
      background: active ? '#059669' : '#fff',
      color: active ? '#fff' : '#374151',
      transition: 'all 0.12s',
      outline: 'none',
    }}>
      {active && <Check size={11} />}
      {children}
    </button>
  );
}

function ActionBtn({ children, onClick, title, danger, disabled }: {
  children: React.ReactNode; onClick: () => void; title?: string;
  danger?: boolean; disabled?: boolean;
}) {
  return (
    <button onClick={onClick} title={title} disabled={disabled} style={{
      width: 32, height: 32, borderRadius: 8,
      border: '1.5px solid #e5e7eb', background: '#f9fafb',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: disabled ? 'not-allowed' : 'pointer',
      color: '#94a3b8', opacity: disabled ? 0.5 : 1,
      transition: 'all 0.12s',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.background = danger ? '#fef2f2' : '#f0fdf4';
        e.currentTarget.style.borderColor = danger ? '#fecaca' : '#a7f3d0';
        e.currentTarget.style.color = danger ? '#ef4444' : '#059669';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = '#f9fafb';
        e.currentTarget.style.borderColor = '#e5e7eb';
        e.currentTarget.style.color = '#94a3b8';
      }}
    >
      {children}
    </button>
  );
}
