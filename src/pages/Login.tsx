import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { t } from '@/lib/i18n';
import { getRoleBasePath } from '@/lib/auth';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { label: 'Super Admin', phone: '+998335242981', password: 'password' },
  { label: 'Menejer',     phone: '+998991234569', password: '12345678' },
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

  const fillDemo = (d: typeof DEMO_ACCOUNTS[0]) => {
    setPhone(d.phone); setPassword(d.password); setError('');
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    border: '1px solid #e5e7eb', borderRadius: 8,
    fontSize: 15, color: '#111827',
    background: '#fff', outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f9fafb',
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: 20,
    }}>
      <div style={{
        width: '100%', maxWidth: 380,
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)',
        padding: '36px 32px 32px',
      }}>
        <div style={{ width: '100%' }}>

          {/* Logo */}
          <div style={{ marginBottom: 32 }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>Sohil Choyxonasi</span>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Xush kelibsiz
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 32px' }}>
            Davom etish uchun tizimga kiring
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                {t('Telefon raqam', language)}
              </label>
              <input
                type="tel" placeholder="+998 90 123 45 67"
                value={phone} required
                onChange={e => setPhone(e.target.value)}
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#059669'; e.target.style.boxShadow = '0 0 0 3px rgba(5,150,105,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                {t('Parol', language)}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password} required
                  onChange={e => setPassword(e.target.value)}
                  style={{ ...inputStyle, paddingRight: 44 }}
                  onFocus={e => { e.target.style.borderColor = '#059669'; e.target.style.boxShadow = '0 0 0 3px rgba(5,150,105,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0,
                }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                padding: '10px 12px', borderRadius: 8,
                background: '#fef2f2', border: '1px solid #fecaca',
                color: '#dc2626', fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px', borderRadius: 8, border: 'none',
              background: loading ? '#d1fae5' : '#059669',
              color: loading ? '#6b7280' : '#fff',
              fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              marginTop: 4,
            }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#047857'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#059669'; }}
            >
              {loading ? 'Kirmoqda...' : <>{t('Kirish', language)} <ArrowRight size={16} /></>}
            </button>
          </form>

          {/* Demo */}
          <div style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
              <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>Demo hisoblar</span>
              <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DEMO_ACCOUNTS.map(demo => (
                <button key={demo.phone} type="button" onClick={() => fillDemo(demo)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 14px', borderRadius: 8,
                  border: '1px solid #f3f4f6', background: '#f9fafb',
                  cursor: 'pointer', transition: 'all 0.12s',
                  textAlign: 'left',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#d1fae5'; e.currentTarget.style.background = '#f0fdf4'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#f3f4f6'; e.currentTarget.style.background = '#f9fafb'; }}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>{t(demo.label, language)}</p>
                    <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, fontFamily: 'monospace', marginTop: 2 }}>{demo.phone}</p>
                  </div>
                  <ArrowRight size={14} color="#9ca3af" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

