import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { t } from '@/lib/i18n';
import { getRoleBasePath } from '@/lib/auth';
import { Eye, EyeOff, ArrowRight, Star, User } from 'lucide-react';

const DEMO = [
  { label: 'Super Admin', phone: '+998335242981', password: 'password', icon: 'star' },
  { label: 'Menejer',     phone: '+998991234569', password: '12345678', icon: 'user' },
];

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
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
    setError(''); setLoading(true);
    const res = await login(phone, password);
    setLoading(false);
    if (res.success) {
      const auth = JSON.parse(localStorage.getItem('rms_auth') || '{}');
      navigate(getRoleBasePath(auth.user?.role), { replace: true });
    } else {
      setError(res.error || 'Xatolik yuz berdi');
    }
  };

  const inputCls: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 6,
    border: '1px solid hsl(240 6% 90%)', background: '#fff',
    fontSize: 14, color: 'hsl(240 10% 4%)', outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'hsl(240 5% 96%)' }}>

      {/* Left — branding */}
      <div style={{ flex: 1, display: 'none', background: 'hsl(240 6% 10%)', padding: '48px', flexDirection: 'column', justifyContent: 'space-between' }} className="lg:flex flex-col">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'hsl(142 71% 35%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>SC</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Sohil Choyxonasi</span>
        </div>

        <blockquote style={{ margin: 0 }}>
          <p style={{ fontSize: 16, color: 'hsl(240 5% 75%)', lineHeight: 1.7, marginBottom: 16 }}>
            "Sohil Choyxonasi boshqaruv tizimi orqali restoran operatsiyalarini to'liq nazorat qiling — xodimlar, buyurtmalar va savdo tahlilini bir platformada."
          </p>
          <footer style={{ fontSize: 13, color: 'hsl(240 5% 50%)' }}>Sohil Choyxonasi — Boshqaruv tizimi</footer>
        </blockquote>
      </div>

      {/* Right — form */}
      <div style={{ width: '100%', maxWidth: 440, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', background: '#fff', boxShadow: '-1px 0 0 hsl(240 6% 90%)' }}>
        <div style={{ width: '100%', maxWidth: 360 }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(240 10% 4%)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
              Xush kelibsiz
            </h1>
            <p style={{ fontSize: 13, color: 'hsl(240 4% 46%)', margin: 0 }}>
              Davom etish uchun hisobingizga kiring
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'hsl(240 10% 4%)', marginBottom: 6 }}>
                {t('Telefon raqam', language)}
              </label>
              <input type="tel" placeholder="+998 90 123 45 67" value={phone} required
                onChange={e => setPhone(e.target.value)} style={inputCls}
                onFocus={e => { e.target.style.borderColor = 'hsl(142 71% 45%)'; e.target.style.boxShadow = '0 0 0 3px hsl(142 71% 45% / 0.1)'; }}
                onBlur={e => { e.target.style.borderColor = 'hsl(240 6% 90%)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'hsl(240 10% 4%)', marginBottom: 6 }}>
                {t('Parol', language)}
              </label>
              <div style={{ position: 'relative' }}>
                <input type={show ? 'text' : 'password'} placeholder="••••••••" value={password} required
                  onChange={e => setPassword(e.target.value)}
                  style={{ ...inputCls, paddingRight: 40 }}
                  onFocus={e => { e.target.style.borderColor = 'hsl(142 71% 45%)'; e.target.style.boxShadow = '0 0 0 3px hsl(142 71% 45% / 0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'hsl(240 6% 90%)'; e.target.style.boxShadow = 'none'; }}
                />
                <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 4% 55%)', padding: 2 }}>
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ padding: '9px 12px', borderRadius: 6, background: 'hsl(0 84% 60% / 0.08)', border: '1px solid hsl(0 84% 60% / 0.2)', color: 'hsl(0 72% 50%)', fontSize: 13 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px', borderRadius: 6, border: 'none', marginTop: 2,
              background: loading ? 'hsl(240 6% 90%)' : 'hsl(240 6% 10%)',
              color: loading ? 'hsl(240 4% 46%)' : '#fff',
              fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'hsl(240 6% 18%)'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'hsl(240 6% 10%)'; }}
            >
              {loading ? 'Kirmoqda...' : <>{t('Kirish', language)} <ArrowRight size={15} /></>}
            </button>
          </form>

          {/* Demo */}
          <div style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, height: 1, background: 'hsl(240 6% 90%)' }} />
              <span style={{ fontSize: 11, color: 'hsl(240 4% 55%)', fontWeight: 500, letterSpacing: '0.04em' }}>DEMO</span>
              <div style={{ flex: 1, height: 1, background: 'hsl(240 6% 90%)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {DEMO.map(d => (
                <button key={d.phone} type="button" onClick={() => { setPhone(d.phone); setPassword(d.password); setError(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 6, border: '1px solid hsl(240 6% 90%)', background: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'hsl(240 5% 97%)'; e.currentTarget.style.borderColor = 'hsl(142 71% 45% / 0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'hsl(240 6% 90%)'; }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: 6, background: d.icon === 'star' ? 'hsl(48 96% 95%)' : 'hsl(142 71% 95%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {d.icon === 'star' ? <Star size={14} color="hsl(48 96% 45%)" fill="hsl(48 96% 45%)" /> : <User size={14} color="hsl(142 71% 35%)" />}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'hsl(240 10% 4%)', margin: 0 }}>{t(d.label, language)}</p>
                    <p style={{ fontSize: 11, color: 'hsl(240 4% 55%)', margin: 0, fontFamily: 'monospace' }}>{d.phone}</p>
                  </div>
                  <ArrowRight size={13} style={{ marginLeft: 'auto', color: 'hsl(240 4% 65%)' }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
