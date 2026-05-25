import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQuery } from '@tanstack/react-query';
import { companyService } from '@/services/companyService';
import { companies as mockCompanies, roleLabels, Company } from '@/lib/mock-data';
import { Pencil, X, Check, Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SuperAdminProfile() {
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
                return (d as any)?.data || d || null;
            } catch {
                return mockCompanies.find(c => c.id === user?.companyId) || null;
            }
        },
        enabled: !!user,
    });

    const updateCompanyMutation = useMutation({
        mutationFn: (data: { id: string; payload: any }) => companyService.update(data.id, data.payload),
        onSuccess: () => { toast.success('Kompaniya yangilandi'); setEditingCompany(false); },
        onError: () => toast.error('Xatolik yuz berdi'),
    });

    if (!user) return null;

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
        <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Profil</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-lg font-semibold text-foreground">Shaxsiy ma'lumotlar</h3>
                        <Button variant="ghost" size="icon" onClick={editingProfile ? () => setEditingProfile(false) : startEditProfile} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            {editingProfile ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                        </Button>
                    </div>

                    {editingProfile ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div><Label>Ism</Label><Input value={profileForm.firstName} onChange={e => setProfileForm({ ...profileForm, firstName: e.target.value })} className="mt-1" /></div>
                                <div><Label>Familiya</Label><Input value={profileForm.lastName} onChange={e => setProfileForm({ ...profileForm, lastName: e.target.value })} className="mt-1" /></div>
                            </div>
                            <div><Label>Telefon raqam</Label><Input value={profileForm.phoneNumber} onChange={e => setProfileForm({ ...profileForm, phoneNumber: e.target.value })} className="mt-1" /></div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="outline" size="sm" onClick={() => setEditingProfile(false)}>Bekor qilish</Button>
                                <Button size="sm" onClick={() => setEditingProfile(false)}><Check className="h-3.5 w-3.5 mr-1" />Saqlash</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div><p className="text-sm text-muted-foreground">Ism familiya</p><p className="font-medium text-foreground">{user.firstName} {user.lastName}</p></div>
                            <div><p className="text-sm text-muted-foreground">Lavozim</p><p className="font-medium text-foreground">{roleLabels[user.role]}</p></div>
                            <div><p className="text-sm text-muted-foreground">Telefon</p><p className="font-medium text-foreground">{user.phone || '—'}</p></div>
                            <div><p className="text-sm text-muted-foreground">ID</p><p className="font-mono text-sm text-muted-foreground">{user.id}</p></div>
                        </div>
                    )}
                </Card>

                {company && (
                    <Card className="p-5 sm:p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-semibold text-foreground">Kompaniya</h3>
                            <Button variant="ghost" size="icon" onClick={editingCompany ? () => setEditingCompany(false) : startEditCompany} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                {editingCompany ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                            </Button>
                        </div>

                        <div className="flex items-center gap-4 mb-5">
                            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                                {company.logo ? <img src={company.logo} alt={company.name} className="h-full w-full object-cover" /> : <Building2 className="h-8 w-8 text-muted-foreground" />}
                            </div>
                            {editingCompany && <div><Label className="text-sm">Logo yuklash</Label><Input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] || null)} className="mt-1 text-sm" /></div>}
                        </div>

                        {editingCompany ? (
                            <div className="space-y-4">
                                <div><Label>Nomi</Label><Input value={companyForm.name} onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })} className="mt-1" /></div>
                                <div><Label>Asoschisi</Label><Input value={companyForm.founderName} onChange={e => setCompanyForm({ ...companyForm, founderName: e.target.value })} className="mt-1" /></div>
                                <div><Label>Telefon</Label><Input value={companyForm.phone} onChange={e => setCompanyForm({ ...companyForm, phone: e.target.value })} className="mt-1" /></div>
                                <div><Label>Tavsif</Label><Textarea value={companyForm.bio} onChange={e => setCompanyForm({ ...companyForm, bio: e.target.value })} className="mt-1" rows={3} /></div>
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
                                <div><p className="text-sm text-muted-foreground">Nomi</p><p className="font-medium text-foreground">{company.name}</p></div>
                                <div><p className="text-sm text-muted-foreground">Asoschisi</p><p className="font-medium text-foreground">{company.founderName}</p></div>
                                <div><p className="text-sm text-muted-foreground">Telefon</p><p className="font-medium text-foreground">{company.phone}</p></div>
                                {company.bio && <div><p className="text-sm text-muted-foreground">Tavsif</p><p className="text-foreground">{company.bio}</p></div>}
                            </div>
                        )}
                    </Card>
                )}
            </div>
        </div>
    );
}
