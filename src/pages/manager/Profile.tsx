import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation } from '@tanstack/react-query';
import { companyService } from '@/services/companyService';
import { companies as mockCompanies, branches, roleLabels, Company } from '@/lib/mock-data';
import { Pencil, X, Check, Building2, Loader2, User, Phone, MapPin, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

export default function ManagerProfile() {
  const { user } = useAuth();
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
    mutationFn: (data: { id: string; payload: Record<string, unknown> }) =>
      companyService.update(data.id, data.payload),
    onSuccess: () => { toast.success('Kompaniya yangilandi'); setEditingCompany(false); },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  if (!user) return null;

  const branch = branches.find(b => b.id === user.branchId);
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

  const startEditProfile = () => {
    setProfileForm({ firstName: user.firstName, lastName: user.lastName, phoneNumber: user.phone || '' });
    setEditingProfile(true);
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

  return (
    <div style={{ maxWidth: 860 }}>

      {/* ── Hero banner ── */}
      <div style={{
        borderRadius: 16, overflow: 'hidden', marginBottom: 24,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f2a1a 100%)',
        padding: '32px 32px 28px',
        position: 'relative',
      }}>
        {/* decorative blobs */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(16,185,129,0.07)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, right: 120, width: 100, height: 100, borderRadius: '50%', background: 'rgba(16,185,129,0.05)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, position: 'relative', zIndex: 1 }}>
          {/* Avatar */}
          <div style={{
            width: 72, height: 72, borderRadius: 18, flexShrink: 0,
            background: 'linear-gradient(135deg, #059669, #10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 3px rgba(16,185,129,0.3)',
            fontSize: 26, fontWeight: 800, color: '#fff',
          }}>
            {initials || <User size={28} color="#fff" />}
          </div>

          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
              {user.firstName} {user.lastName}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '3px 10px', borderRadius: 6,
                background: 'rgba(16,185,129,0.2)', color: '#34d399',
                border: '1px solid rgba(16,185,129,0.3)',
              }}>
                {roleLabels[user.role]}
              </span>
              {branch && (
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={12} /> {branch.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Cards grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="grid-cols-1 lg:grid-cols-2">

        {/* Shaxsiy ma'lumotlar */}
        <div style={{
          background: '#fff', borderRadius: 14,
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', borderBottom: '1px solid #f3f4f6',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={15} style={{ color: '#059669' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Shaxsiy ma'lumotlar</span>
            </div>
            <button
              onClick={editingProfile ? () => setEditingProfile(false) : startEditProfile}
              style={{
                width: 30, height: 30, borderRadius: 7, border: '1px solid #e5e7eb',
                background: '#f9fafb', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#6b7280',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#059669'; e.currentTarget.style.color = '#059669'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280'; }}
            >
              {editingProfile ? <X size={13} /> : <Pencil size={13} />}
            </button>
          </div>

          <div style={{ padding: '16px 20px' }}>
            {editingProfile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <Label style={{ fontSize: 12, color: '#6b7280' }}>Ism</Label>
                    <Input value={profileForm.firstName} onChange={e => setProfileForm({ ...profileForm, firstName: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label style={{ fontSize: 12, color: '#6b7280' }}>Familiya</Label>
                    <Input value={profileForm.lastName} onChange={e => setProfileForm({ ...profileForm, lastName: e.target.value })} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label style={{ fontSize: 12, color: '#6b7280' }}>Telefon</Label>
                  <Input value={profileForm.phoneNumber} onChange={e => setProfileForm({ ...profileForm, phoneNumber: e.target.value })} className="mt-1" />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setEditingProfile(false)} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#374151' }}>Bekor</button>
                  <button onClick={() => setEditingProfile(false)} style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: '#059669', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Check size={13} /> Saqlash
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Ism familiya', value: `${user.firstName} ${user.lastName}`, icon: User },
                  { label: 'Lavozim', value: roleLabels[user.role], icon: Briefcase },
                  ...(branch ? [{ label: 'Filial', value: branch.name, icon: MapPin }] : []),
                  ...(user.phone ? [{ label: 'Telefon', value: user.phone, icon: Phone }] : []),
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} style={{
                    padding: '12px 14px', borderRadius: 9,
                    background: '#f9fafb', border: '1px solid #f3f4f6',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={14} style={{ color: '#059669' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{label}</p>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Kompaniya */}
        {company && (
          <div style={{
            background: '#fff', borderRadius: 14,
            border: '1px solid #e5e7eb',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: '1px solid #f3f4f6',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={15} style={{ color: '#059669' }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Kompaniya</span>
              </div>
              <button
                onClick={editingCompany ? () => setEditingCompany(false) : startEditCompany}
                style={{
                  width: 30, height: 30, borderRadius: 7, border: '1px solid #e5e7eb',
                  background: '#f9fafb', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: '#6b7280',
                  transition: 'all 0.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#059669'; e.currentTarget.style.color = '#059669'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280'; }}
              >
                {editingCompany ? <X size={13} /> : <Pencil size={13} />}
              </button>
            </div>

            <div style={{ padding: '16px 20px' }}>
              {/* Logo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                  background: '#f1f5f9', border: '1px solid #e5e7eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                }}>
                  {company.logo
                    ? <img src={company.logo} alt={company.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <Building2 size={22} style={{ color: '#9ca3af' }} />
                  }
                </div>
                {editingCompany && (
                  <div style={{ flex: 1 }}>
                    <Label style={{ fontSize: 12, color: '#6b7280' }}>Logo yuklash</Label>
                    <Input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] || null)} className="mt-1 text-sm" />
                  </div>
                )}
              </div>

              {editingCompany ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div><Label style={{ fontSize: 12, color: '#6b7280' }}>Nomi</Label><Input value={companyForm.name} onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })} className="mt-1" /></div>
                  <div><Label style={{ fontSize: 12, color: '#6b7280' }}>Asoschisi</Label><Input value={companyForm.founderName} onChange={e => setCompanyForm({ ...companyForm, founderName: e.target.value })} className="mt-1" /></div>
                  <div><Label style={{ fontSize: 12, color: '#6b7280' }}>Telefon</Label><Input value={companyForm.phone} onChange={e => setCompanyForm({ ...companyForm, phone: e.target.value })} className="mt-1" /></div>
                  <div><Label style={{ fontSize: 12, color: '#6b7280' }}>Tavsif</Label><Textarea value={companyForm.bio} onChange={e => setCompanyForm({ ...companyForm, bio: e.target.value })} className="mt-1" rows={3} /></div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => setEditingCompany(false)} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#374151' }}>Bekor</button>
                    <button onClick={saveCompany} disabled={updateCompanyMutation.isPending} style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: '#059669', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                      {updateCompanyMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Saqlash
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Nomi', value: company.name },
                    { label: 'Asoschisi', value: company.founderName },
                    { label: 'Telefon', value: company.phone },
                  ].filter(i => i.value).map(({ label, value }) => (
                    <div key={label} style={{ padding: '12px 14px', borderRadius: 9, background: '#f9fafb', border: '1px solid #f3f4f6' }}>
                      <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{label}</p>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
