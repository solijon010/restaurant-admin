import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { t } from '@/lib/i18n';
import { getRoleBasePath } from '@/lib/auth';
import { Eye, EyeOff, ArrowRight, Star, User } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { label: 'Super Admin', phone: '+998335242981', password: 'password', icon: 'star' },
  { label: 'Menejer',     phone: '+998991234569', password: '12345678', icon: 'user' },
];

export default function Login() {
  const [phone, setPhone]     = useState('');
  const [pass, setPass]       = useState('');
  const [show, setShow]       = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const { language } = useSettings();
  const navigate = useNavigate();

  if (isAuthenticated && user) {
    navigate(getRoleBasePath(user.role), { replace: true });
    return null;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const r = await login(phone, pass);
    setLoading(false);
    if (r.success) {
      const a = JSON.parse(localStorage.getItem('rms_auth') || '{}');
      navigate(getRoleBasePath(a.user?.role), { replace: true });
    } else setError(r.error || 'Xatolik');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f2a1a 100%)',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Left — branding */}
      <div style={{ flex: 1, display: 'none', padding: '48px', flexDirection: 'column', justifyContent: 'space-between' }} className="lg:flex flex-col">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>SC</span>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Sohil Choyxonasi</span>
        </div>

        <div>
          <h2 style={{ fontSize: 40, fontWeight: 800, color: '#fff', margin: '0 0 16px', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            Restoran<br />boshqaruvi
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, maxWidth: 320 }}>
            Xodimlar, buyurtmalar va savdoni bir platformada boshqaring.
          </p>
          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {['Real vaqtda buyurtmalarni kuzating', 'Xodimlar samaradorligini tahlil qiling', 'Savdo statistikasini ko\'ring'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>© 2024 Sohil Choyxonasi</p>
      </div>

      {/* Right — form */}
      <div style={{ width: '100%', maxWidth: 460, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', background: '#fff' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>

          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>SC</span>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Sohil Choyxonasi</span>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Xush kelibsiz
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 28px' }}>
            Davom etish uchun tizimga kiring
          </p>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                {t('Telefon raqam', language)}
              </label>
              <input type="tel" placeholder="+998 90 123 45 67" value={phone} required
                onChange={e => setPhone(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, color: '#0f172a', background: '#fff', outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#10b981'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                {t('Parol', language)}
              </label>
              <div style={{ position: 'relative' }}>
                <input type={show ? 'text' : 'password'} placeholder="••••••••" value={pass} required
                  onChange={e => setPass(e.target.value)}
                  style={{ width: '100%', padding: '11px 44px 11px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, color: '#0f172a', background: '#fff', outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#10b981'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
                <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px', borderRadius: 10, border: 'none', marginTop: 4,
              background: loading ? '#d1fae5' : 'linear-gradient(135deg, #10b981, #059669)',
              color: loading ? '#6b7280' : '#fff',
              fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.15s', boxShadow: loading ? 'none' : '0 4px 14px rgba(16,185,129,0.35)',
            }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              {loading ? 'Kirmoqda...' : <>{t('Kirish', language)} <ArrowRight size={16} /></>}
            </button>
          </form>

          {/* Demo */}
          <div style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.08em' }}>DEMO KIRISH</span>
              <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DEMO_ACCOUNTS.map(d => (
                <button key={d.phone} type="button"
                  onClick={() => { setPhone(d.phone); setPass(d.password); setError(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, border: '1.5px solid #f1f5f9', background: '#fafafa', cursor: 'pointer', transition: 'all 0.12s', textAlign: 'left' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#a7f3d0'; e.currentTarget.style.background = '#f0fdf4'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.background = '#fafafa'; }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: d.icon === 'star' ? '#fef3c7' : '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {d.icon === 'star' ? <Star size={16} color="#f59e0b" fill="#f59e0b" /> : <User size={16} color="#10b981" />}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0 }}>{t(d.label, language)}</p>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, fontFamily: 'monospace' }}>{d.phone}</p>
                  </div>
                  <ArrowRight size={14} style={{ marginLeft: 'auto', color: '#cbd5e1' }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
