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
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1a2744 40%, #0d2618 100%)',
      padding: '20px',
      fontFamily: "'Inter', system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decorative circles */}
      <div style={{ position: 'absolute', top: -120, right: -120, width: 400, height: 400, borderRadius: '50%', background: 'rgba(16,185,129,0.06)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(14,165,233,0.05)', pointerEvents: 'none' }} />

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'rgba(255,255,255,0.97)',
        borderRadius: 24,
        boxShadow: '0 32px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
        padding: '40px 36px 36px',
        position: 'relative',
        zIndex: 1,
      }}>

        {/* Logo + Title */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <img src="/LOGO.PNJ.png" alt="Sohil Choyxonasi" style={{ width: 84, height: 84, objectFit: 'contain', filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.18))' }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Sohil Choyxonasi
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Boshqaruv tizimiga kirish
          </p>
        </div>

        {/* Form */}
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('Telefon raqam', language)}
            </label>
            <input type="tel" placeholder="+998 90 123 45 67" value={phone} required
              onChange={e => setPhone(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: 12, fontSize: 14, color: '#0f172a', background: '#fafafa', outline: 'none', transition: 'all 0.15s', boxSizing: 'border-box' }}
              onFocus={e => { e.target.style.borderColor = '#10b981'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#fafafa'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('Parol', language)}
            </label>
            <div style={{ position: 'relative' }}>
              <input type={show ? 'text' : 'password'} placeholder="••••••••" value={pass} required
                onChange={e => setPass(e.target.value)}
                style={{ width: '100%', padding: '12px 44px 12px 14px', border: '1.5px solid #e5e7eb', borderRadius: 12, fontSize: 14, color: '#0f172a', background: '#fafafa', outline: 'none', transition: 'all 0.15s', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = '#10b981'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#fafafa'; e.target.style.boxShadow = 'none'; }}
              />
              <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13 }}>
              ⚠ {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '13px', borderRadius: 12, border: 'none', marginTop: 4,
            background: loading ? '#d1fae5' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: loading ? '#6b7280' : '#fff',
            fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 6px 20px rgba(16,185,129,0.4)',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(16,185,129,0.5)'; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = loading ? 'none' : '0 6px 20px rgba(16,185,129,0.4)'; }}
          >
            {loading ? 'Kirmoqda...' : <>{t('Kirish', language)} <ArrowRight size={17} /></>}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '24px 0 16px' }}>
          <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.1em' }}>DEMO</span>
          <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
        </div>

        {/* Demo accounts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DEMO_ACCOUNTS.map(d => (
            <button key={d.phone} type="button"
              onClick={() => { setPhone(d.phone); setPass(d.password); setError(''); }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, border: '1.5px solid #f1f5f9', background: '#f8fafc', cursor: 'pointer', transition: 'all 0.14s', textAlign: 'left', width: '100%' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#a7f3d0'; e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.transform = 'translateX(2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: d.icon === 'star' ? '#fef3c7' : '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {d.icon === 'star' ? <Star size={17} color="#f59e0b" fill="#f59e0b" /> : <User size={17} color="#10b981" />}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0 }}>{t(d.label, language)}</p>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, fontFamily: 'monospace' }}>{d.phone}</p>
              </div>
              <ArrowRight size={14} style={{ color: '#cbd5e1', flexShrink: 0 }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
