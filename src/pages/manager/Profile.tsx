import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation } from '@tanstack/react-query';
import { companyService } from '@/services/companyService';
import { userService, StaffUpdatePayload } from '@/services/userService';
import { useBranch } from '@/contexts/BranchContext';
import { companies as mockCompanies, roleLabels, Company } from '@/lib/mock-data';
import { Pencil, X, Check, Building2, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';

export default function ManagerProfile() {
  const { user } = useAuth();
  const { branches } = useBranch();
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingCompany, setEditingCompany] = useState(false);
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', phoneNumber: '' });
  const [companyForm, setCompanyForm] = useState({ name: '', founderName: '', phone: '', bio: '' });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const { data: company } = useQuery<Company | null>({
    queryKey: ['my-company'],
    queryFn: async () => {
      try {
        const res = await companyService.getMy();
        const d = res.data ?? res;
        return (d as Record<string, unknown>)?.data || d || null;
      } catch {
        return mockCompanies.find(c => c.id === user?.companyId) || null;
      }
    },
    enabled: !!user,
  });

  const updateCompanyMutation = useMutation({
    mutationFn: (data: { id: string; payload: Record<string, unknown> }) => companyService.update(data.id, data.payload),
    onSuccess: () => { toast.success('Kompaniya yangilandi'); setEditingCompany(false); },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: StaffUpdatePayload) => userService.update(user!.id, data),
    onSuccess: () => { toast.success("Profil yangilandi"); setEditingProfile(false); },
    onError: () => toast.error('Profilni saqlashda xatolik yuz berdi'),
  });

  if (!user) return null;

  const branch = branches.find(b => b.id === user.branchId);

  const startEditProfile = () => {
    setProfileForm({ firstName: user.firstName, lastName: user.lastName, phoneNumber: user.phone || '' });
    setEditingProfile(true);
  };

  const saveProfile = () => {
    if (!profileForm.firstName.trim()) { toast.error('Ism kiriting'); return; }
    if (!profileForm.lastName.trim()) { toast.error('Familiya kiriting'); return; }
    const payload: StaffUpdatePayload = {
      firstName: profileForm.firstName.trim(),
      lastName: profileForm.lastName.trim(),
    };
    if (profileForm.phoneNumber.trim()) {
      payload.phoneNumer = profileForm.phoneNumber.trim();
    }
    updateProfileMutation.mutate(payload);
  };

  const startEditCompany = () => {
    if (company) {
      setCompanyForm({ name: company.name, founderName: company.founderName, phone: company.phone, bio: company.bio || '' });
      setLogoFile(null);
    }
    setEditingCompany(true);
  };

  const saveCompany = () => {
    if (company) {
      updateCompanyMutation.mutate({ id: company.id, payload: { ...companyForm, logo: logoFile || undefined } });
    }
  };

  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();

  return (
    <div className="max-w-4xl">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground leading-tight">Profil</h2>
            <p className="text-xs text-muted-foreground">Shaxsiy ma'lumotlaringiz</p>
          </div>
        </div>
      </div>

      {/* ── Avatar block ────────────────────────────────────────────────────── */}
      <Card className="shadow-sm border border-border/60 rounded-2xl overflow-hidden mb-6">
        <div className="px-6 py-8 flex flex-col sm:flex-row items-center sm:items-end gap-5 bg-muted/40">
          <div className="w-20 h-20 rounded-2xl bg-emerald-600 flex items-center justify-center shrink-0 shadow-lg">
            <span className="text-2xl font-bold text-white">{initials || <User className="h-8 w-8 text-white" />}</span>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-xl font-bold text-foreground">{user.firstName} {user.lastName}</p>
            <span className="inline-block mt-1 text-xs font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
              {roleLabels[user.role]}
            </span>
            {branch && (
              <p className="text-sm text-muted-foreground mt-1">{branch.name}</p>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Profile Card ──────────────────────────────────────────────────── */}
        <Card className="shadow-sm border border-border/60 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Shaxsiy ma'lumotlar</h3>
            <Button variant="ghost" size="icon" onClick={editingProfile ? () => setEditingProfile(false) : startEditProfile} className="h-8 w-8 text-muted-foreground hover:text-foreground">
              {editingProfile ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            </Button>
          </div>

          <div className="p-5">
            {editingProfile ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label className="text-xs text-muted-foreground uppercase tracking-wide">Ism</Label><Input value={profileForm.firstName} onChange={e => setProfileForm({ ...profileForm, firstName: e.target.value })} className="mt-1.5" /></div>
                  <div><Label className="text-xs text-muted-foreground uppercase tracking-wide">Familiya</Label><Input value={profileForm.lastName} onChange={e => setProfileForm({ ...profileForm, lastName: e.target.value })} className="mt-1.5" /></div>
                </div>
                <div><Label className="text-xs text-muted-foreground uppercase tracking-wide">Telefon raqam</Label><Input value={profileForm.phoneNumber} onChange={e => setProfileForm({ ...profileForm, phoneNumber: e.target.value })} className="mt-1.5" /></div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingProfile(false)} disabled={updateProfileMutation.isPending}>Bekor qilish</Button>
                  <Button size="sm" onClick={saveProfile} disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                    Saqlash
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-muted/40">
                  <p className="text-xs text-muted-foreground mb-0.5">Ism familiya</p>
                  <p className="font-medium text-foreground">{user.firstName} {user.lastName}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/40">
                  <p className="text-xs text-muted-foreground mb-0.5">Lavozim</p>
                  <p className="font-medium text-foreground">{roleLabels[user.role]}</p>
                </div>
                {branch && (
                  <div className="p-3 rounded-xl bg-muted/40">
                    <p className="text-xs text-muted-foreground mb-0.5">Filial</p>
                    <p className="font-medium text-foreground">{branch.name}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* ── Company Card ──────────────────────────────────────────────────── */}
        {company && (
          <Card className="shadow-sm border border-border/60 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Kompaniya</h3>
              <Button variant="ghost" size="icon" onClick={editingCompany ? () => setEditingCompany(false) : startEditCompany} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                {editingCompany ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              </Button>
            </div>

            <div className="p-5">
              <div className="flex items-center gap-4 mb-5">
                <div className="h-14 w-14 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 border border-border/60">
                  {company.logo ? <img src={company.logo} alt={company.name} className="h-full w-full object-cover" /> : <Building2 className="h-7 w-7 text-muted-foreground" />}
                </div>
                {editingCompany && (
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Logo yuklash</Label>
                    <Input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] || null)} className="mt-1.5 text-sm" />
                  </div>
                )}
              </div>

              {editingCompany ? (
                <div className="space-y-4">
                  <div><Label className="text-xs text-muted-foreground uppercase tracking-wide">Nomi</Label><Input value={companyForm.name} onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })} className="mt-1.5" /></div>
                  <div><Label className="text-xs text-muted-foreground uppercase tracking-wide">Asoschisi</Label><Input value={companyForm.founderName} onChange={e => setCompanyForm({ ...companyForm, founderName: e.target.value })} className="mt-1.5" /></div>
                  <div><Label className="text-xs text-muted-foreground uppercase tracking-wide">Telefon</Label><Input value={companyForm.phone} onChange={e => setCompanyForm({ ...companyForm, phone: e.target.value })} className="mt-1.5" /></div>
                  <div><Label className="text-xs text-muted-foreground uppercase tracking-wide">Tavsif</Label><Textarea value={companyForm.bio} onChange={e => setCompanyForm({ ...companyForm, bio: e.target.value })} className="mt-1.5" rows={3} /></div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingCompany(false)}>Bekor qilish</Button>
                    <Button size="sm" onClick={saveCompany} disabled={updateCompanyMutation.isPending}>
                      {updateCompanyMutation.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                      Saqlash
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-muted/40">
                    <p className="text-xs text-muted-foreground mb-0.5">Nomi</p>
                    <p className="font-medium text-foreground">{company.name}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40">
                    <p className="text-xs text-muted-foreground mb-0.5">Asoschisi</p>
                    <p className="font-medium text-foreground">{company.founderName}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40">
                    <p className="text-xs text-muted-foreground mb-0.5">Telefon</p>
                    <p className="font-medium text-foreground">{company.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
