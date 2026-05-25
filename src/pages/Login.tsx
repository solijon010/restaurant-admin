import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { t } from '@/lib/i18n';
import { getRoleBasePath } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { label: "Super Admin", phone: "+998335242981", password: "password" },
  { label: "Menejer", phone: "+998991234569", password: "12345678" },
];

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const { language } = useSettings();
  const navigate = useNavigate();

  if (isAuthenticated && user) {
    navigate(getRoleBasePath(user.role), { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(phone, password);
    setLoading(false);
    if (result.success) {
      const auth = JSON.parse(localStorage.getItem('rms_auth') || '{}');
      navigate(getRoleBasePath(auth.user?.role), { replace: true });
    } else {
      setError(result.error || 'Xatolik yuz berdi');
    }
  };

  const fillDemo = (demo: typeof DEMO_ACCOUNTS[0]) => {
    setPhone(demo.phone);
    setPassword(demo.password);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm p-6 sm:p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Restourant</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('Tizimga kirish', language)}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">{t('Telefon raqam', language)}</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+998901234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('Parol', language)}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('Kirish...', language) : t('Kirish', language)}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground mb-3 text-center">{t('Demo foydalanuvchilar', language)}</p>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map(demo => (
              <button
                key={demo.phone}
                type="button"
                onClick={() => fillDemo(demo)}
                className="flex justify-between items-center w-full bg-muted hover:bg-muted/70 rounded-md px-3 py-2.5 text-xs transition-colors cursor-pointer"
              >
                <span className="font-medium text-foreground">{t(demo.label, language)}</span>
                <span className="text-muted-foreground">{demo.phone}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
