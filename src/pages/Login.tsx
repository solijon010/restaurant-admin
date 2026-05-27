import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { t } from '@/lib/i18n';
import { getRoleBasePath } from '@/lib/auth';
import { Eye, EyeOff, Phone, Lock, Star, User } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { label: "Super Admin", phone: "+998335242981", password: "password", icon: 'star' },
  { label: "Menejer", phone: "+998991234569", password: "12345678", icon: 'user' },
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
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
      fontFamily: "'Georgia', 'Times New Roman', serif",
      position: 'relative',
      background: '#030f06',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes kenBurns {
          0%   { transform: scale(1) translateX(0%) translateY(0%); }
          50%  { transform: scale(1.08) translateX(-1%) translateY(-1%); }
          100% { transform: scale(1) translateX(0%) translateY(0%); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatLeaf {
          0%, 100% { transform: translateY(0px) rotate(-5deg); }
          50%       { transform: translateY(-12px) rotate(5deg); }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .leaf-float { animation: floatLeaf 4s ease-in-out infinite; }
        .fade-up    { animation: fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) both; }
        .glow-pulse { animation: glow 2.5s ease-in-out infinite; }
        .input-field::placeholder { color: rgba(180,220,180,0.35); }
        .input-field:focus { outline: none; }
        .demo-btn:hover { transform: translateY(-2px); }
      `}</style>

      {/* Background image */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: `url('/manzara foto.png')`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        animation: 'kenBurns 20s ease-in-out infinite',
        filter: 'brightness(0.6) saturate(1.3)',
        transform: 'scale(1.02)',
      }} />

      {/* Dark overlay only — no color tint */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1,
        background: 'rgba(0,0,0,0.38)',
      }} />

      {/* Golden glow top center */}
      <div className="glow-pulse" style={{
        position: 'fixed', top: '-80px', left: '50%', transform: 'translateX(-50%)',
        width: 400, height: 300, zIndex: 1,
        background: 'radial-gradient(ellipse, rgba(212,160,20,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Main content */}
      <div className="fade-up" style={{
        position: 'relative', zIndex: 2,
        width: '100%', maxWidth: 400,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>

        {/* Leaf icon */}
        <div className="leaf-float" style={{ marginBottom: 12, filter: 'drop-shadow(0 0 12px rgba(80,200,80,0.6))' }}>
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
            <path d="M26 4 C26 4 14 12 14 26 C14 34 20 40 26 42 C32 40 38 34 38 26 C38 12 26 4 26 4Z" fill="#2d8c30" opacity="0.9"/>
            <path d="M26 4 C26 4 20 16 22 28 C23 33 24.5 38 26 42 C26 42 26 20 26 4Z" fill="#1a5c1e" opacity="0.7"/>
            <path d="M18 8 C18 8 8 16 10 28 C11 33 14 37 18 40" stroke="#4caf50" strokeWidth="1.5" fill="none" opacity="0.6" strokeLinecap="round"/>
            <path d="M34 8 C34 8 44 16 42 28 C41 33 38 37 34 40" stroke="#4caf50" strokeWidth="1.5" fill="none" opacity="0.6" strokeLinecap="round"/>
            {/* Vein */}
            <path d="M26 8 L26 40" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round"/>
            <path d="M26 15 L20 22 M26 21 L19 29 M26 27 L21 33" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" strokeLinecap="round"/>
            <path d="M26 15 L32 22 M26 21 L33 29 M26 27 L31 33" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 6 }}>
          <h1 style={{
            margin: 0, fontSize: 38, fontWeight: 800,
            color: '#d4a020', letterSpacing: 6,
            textTransform: 'uppercase', lineHeight: 1.1,
            textShadow: '0 0 30px rgba(212,160,20,0.5), 2px 3px 0 rgba(0,0,0,0.5)',
          }}>SOHIL</h1>
          <h1 style={{
            margin: 0, fontSize: 38, fontWeight: 800,
            letterSpacing: 3, textTransform: 'uppercase', lineHeight: 1.1,
            background: 'linear-gradient(180deg, #f0d060 0%, #d4a020 50%, #b8860b 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 2px 8px rgba(212,160,20,0.4))',
          }}>CHOYXONASI</h1>
        </div>

        {/* Gold diamond ornament */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0 20px' }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,160,20,0.6))' }} />
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <div style={{ width: 5, height: 5, background: '#d4a020', transform: 'rotate(45deg)', opacity: 0.5 }} />
            <div style={{ width: 7, height: 7, background: '#d4a020', transform: 'rotate(45deg)', boxShadow: '0 0 8px rgba(212,160,20,0.8)' }} />
            <div style={{ width: 5, height: 5, background: '#d4a020', transform: 'rotate(45deg)', opacity: 0.5 }} />
          </div>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(212,160,20,0.6), transparent)' }} />
        </div>

        {/* Form card */}
        <div style={{
          width: '100%',
          background: 'rgba(4,18,7,0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(212,160,20,0.2)',
          borderRadius: 24,
          padding: '28px 28px 24px',
          boxShadow: '0 0 0 1px rgba(0,80,20,0.3), 0 24px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(212,160,20,0.1)',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Phone */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#7dc87f', marginBottom: 8, textTransform: 'uppercase' }}>
                {t('Telefon raqam', language)}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12,
                background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(74,140,63,0.35)',
                borderRadius: 12, padding: '4px 14px 4px 4px',
                transition: 'border-color 0.2s',
              }}
                onFocusCapture={e => (e.currentTarget.style.borderColor = 'rgba(212,160,20,0.6)')}
                onBlurCapture={e => (e.currentTarget.style.borderColor = 'rgba(74,140,63,0.35)')}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: 'linear-gradient(135deg, #1e6b20, #2d8c30)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(45,140,48,0.4)',
                }}>
                  <Phone size={17} color="#fff" />
                </div>
                <input className="input-field" type="tel" placeholder="+998901234567" value={phone} required
                  onChange={e => setPhone(e.target.value)}
                  style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none',
                    color: '#e8f5e9', fontSize: 14, fontFamily: 'monospace', letterSpacing: 1,
                  }} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#7dc87f', marginBottom: 8, textTransform: 'uppercase' }}>
                {t('Parol', language)}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12,
                background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(74,140,63,0.35)',
                borderRadius: 12, padding: '4px 14px 4px 4px',
                transition: 'border-color 0.2s',
              }}
                onFocusCapture={e => (e.currentTarget.style.borderColor = 'rgba(212,160,20,0.6)')}
                onBlurCapture={e => (e.currentTarget.style.borderColor = 'rgba(74,140,63,0.35)')}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: 'linear-gradient(135deg, #1e6b20, #2d8c30)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(45,140,48,0.4)',
                }}>
                  <Lock size={17} color="#fff" />
                </div>
                <input className="input-field" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} required
                  onChange={e => setPassword(e.target.value)}
                  style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none',
                    color: '#e8f5e9', fontSize: 14, fontFamily: 'monospace',
                  }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(125,200,127,0.6)', padding: 0, display: 'flex' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p style={{ margin: 0, fontSize: 12, color: '#f87171', padding: '8px 12px', background: 'rgba(248,113,113,0.1)', borderRadius: 8, border: '1px solid rgba(248,113,113,0.2)' }}>
                ⚠ {error}
              </p>
            )}

            {/* Submit button */}
            <button type="submit" disabled={loading} style={{
              marginTop: 4, padding: '14px', borderRadius: 12, border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: loading
                ? 'rgba(184,134,11,0.4)'
                : 'linear-gradient(90deg, #9a7009, #d4a020, #f0c030, #d4a020, #9a7009)',
              backgroundSize: '200% auto',
              color: '#1a0f00', fontSize: 13, fontWeight: 800,
              letterSpacing: 4, textTransform: 'uppercase',
              fontFamily: 'Georgia, serif',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(212,160,20,0.4), 0 2px 0 rgba(0,0,0,0.3)',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.backgroundPosition = 'right center'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(212,160,20,0.55), 0 2px 0 rgba(0,0,0,0.3)'; } }}
              onMouseLeave={e => { if (!loading) { e.currentTarget.style.backgroundPosition = 'left center'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(212,160,20,0.4), 0 2px 0 rgba(0,0,0,0.3)'; } }}
              onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'translateY(1px)'; }}
              onMouseUp={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            >
              {loading ? '⟳ Kirish...' : '→ Kirish'}
            </button>
          </form>

          {/* Demo divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 14px' }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,160,20,0.25))' }} />
            <span style={{ fontSize: 10, letterSpacing: 3, color: 'rgba(212,160,20,0.5)', textTransform: 'uppercase' }}>Demo</span>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(212,160,20,0.25), transparent)' }} />
          </div>

          {/* Demo accounts - 2 column */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {DEMO_ACCOUNTS.map((demo) => (
              <button key={demo.phone} className="demo-btn" type="button" onClick={() => fillDemo(demo)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                padding: '12px 10px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(212,160,20,0.2)',
                borderRadius: 12, cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: 'inset 0 1px 0 rgba(212,160,20,0.05)',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,160,20,0.08)'; e.currentTarget.style.borderColor = 'rgba(212,160,20,0.45)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.3)'; e.currentTarget.style.borderColor = 'rgba(212,160,20,0.2)'; }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: demo.icon === 'star'
                    ? 'linear-gradient(135deg, #9a7009, #d4a020)'
                    : 'linear-gradient(135deg, #1e6b20, #2d8c30)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: demo.icon === 'star' ? '0 2px 8px rgba(212,160,20,0.4)' : '0 2px 8px rgba(45,140,48,0.4)',
                }}>
                  {demo.icon === 'star'
                    ? <Star size={16} color="#fff" fill="#fff" />
                    : <User size={16} color="#fff" />}
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#e8f5e9', fontFamily: 'Georgia, serif' }}>{t(demo.label, language)}</span>
                <span style={{ fontSize: 10, color: 'rgba(212,160,20,0.7)', fontFamily: 'monospace' }}>{demo.phone}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p style={{ marginTop: 16, fontSize: 10, letterSpacing: 3, color: 'rgba(212,160,20,0.3)', textTransform: 'uppercase' }}>
          ✦ Sohil Choyxonasi ✦
        </p>
      </div>
    </div>
  );
}
