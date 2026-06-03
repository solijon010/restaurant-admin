import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Phone } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { getRoleBasePath, hasImplementedDashboard } from '@/lib/auth';
import { t } from '@/lib/i18n';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const { language } = useSettings();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user && hasImplementedDashboard(user.role)) {
      navigate(getRoleBasePath(user.role), { replace: true });
    }
  }, [isAuthenticated, navigate, user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(phone, password);

    setLoading(false);

    if (result.success) {
      navigate(getRoleBasePath(result.user!.role), { replace: true });
      return;
    }

    setError(result.error || 'Xatolik yuz berdi');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: "'Georgia', 'Times New Roman', serif",
        position: 'relative',
        background: '#030f06',
        overflow: 'hidden',
      }}
    >
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
          50% { transform: translateY(-12px) rotate(5deg); }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .leaf-float { animation: floatLeaf 4s ease-in-out infinite; }
        .fade-up { animation: fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) both; }
        .glow-pulse { animation: glow 2.5s ease-in-out infinite; }
        .input-field::placeholder { color: rgba(180,220,180,0.35); }
        .input-field:focus { outline: none; }
      `}</style>

      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          backgroundImage: "url('/manzara foto.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          animation: 'kenBurns 20s ease-in-out infinite',
          filter: 'brightness(0.6) saturate(1.3)',
          transform: 'scale(1.02)',
        }}
      />

      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          background: 'rgba(0,0,0,0.38)',
        }}
      />

      <div
        className="glow-pulse"
        style={{
          position: 'fixed',
          top: '-80px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 400,
          height: 300,
          zIndex: 1,
          background: 'radial-gradient(ellipse, rgba(212,160,20,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="fade-up"
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: 400,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          className="leaf-float"
          style={{ marginBottom: 12, filter: 'drop-shadow(0 0 16px rgba(212,160,20,0.5))' }}
        >
          <img
            src="/hisobchim-logo.ico"
            alt="Hisobchim"
            style={{ width: 72, height: 72, objectFit: 'contain' }}
          />
        </div>

        <div style={{ textAlign: 'center', marginBottom: 6 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 38,
              fontWeight: 800,
              color: '#d4a020',
              letterSpacing: 6,
              textTransform: 'uppercase',
              lineHeight: 1.1,
              textShadow: '0 0 30px rgba(212,160,20,0.5), 2px 3px 0 rgba(0,0,0,0.5)',
            }}
          >
            HISOBCHIM
          </h1>
          <h1
            style={{
              margin: 0,
              fontSize: 38,
              fontWeight: 800,
              letterSpacing: 3,
              textTransform: 'uppercase',
              lineHeight: 1.1,
              background: 'linear-gradient(180deg, #f0d060 0%, #d4a020 50%, #b8860b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 2px 8px rgba(212,160,20,0.4))',
            }}
          >
            BOSHQARUVI
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0 20px' }}>
          <div
            style={{
              flex: 1,
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(212,160,20,0.6))',
            }}
          />
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <div
              style={{
                width: 5,
                height: 5,
                background: '#d4a020',
                transform: 'rotate(45deg)',
                opacity: 0.5,
              }}
            />
            <div
              style={{
                width: 7,
                height: 7,
                background: '#d4a020',
                transform: 'rotate(45deg)',
                boxShadow: '0 0 8px rgba(212,160,20,0.8)',
              }}
            />
            <div
              style={{
                width: 5,
                height: 5,
                background: '#d4a020',
                transform: 'rotate(45deg)',
                opacity: 0.5,
              }}
            />
          </div>
          <div
            style={{
              flex: 1,
              height: 1,
              background: 'linear-gradient(90deg, rgba(212,160,20,0.6), transparent)',
            }}
          />
        </div>

        <div
          style={{
            width: '100%',
            background: 'rgba(4,18,7,0.75)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(212,160,20,0.2)',
            borderRadius: 24,
            padding: '28px 28px 24px',
            boxShadow:
              '0 0 0 1px rgba(0,80,20,0.3), 0 24px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(212,160,20,0.1)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 2,
                color: '#d4a020',
                textTransform: 'uppercase',
              }}
            >
              Boshqaruv paneliga kirish
            </p>
            <p
              style={{
                margin: '8px 0 0',
                fontSize: 13,
                lineHeight: 1.6,
                color: 'rgba(232,245,233,0.72)',
              }}
            >
              Telefon raqamingiz va parolingizni kiriting.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            autoComplete="off"
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 2,
                  color: '#7dc87f',
                  marginBottom: 8,
                  textTransform: 'uppercase',
                }}
              >
                {t('Telefon raqam', language)}
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(74,140,63,0.35)',
                  borderRadius: 12,
                  padding: '4px 14px 4px 4px',
                  transition: 'border-color 0.2s',
                }}
                onFocusCapture={(event) => {
                  event.currentTarget.style.borderColor = 'rgba(212,160,20,0.6)';
                }}
                onBlurCapture={(event) => {
                  event.currentTarget.style.borderColor = 'rgba(74,140,63,0.35)';
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    flexShrink: 0,
                    background: 'linear-gradient(135deg, #1e6b20, #2d8c30)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(45,140,48,0.4)',
                  }}
                >
                  <Phone size={17} color="#fff" />
                </div>
                <input
                  className="input-field"
                  type="tel"
                  name="identifier"
                  inputMode="tel"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="+998901234567"
                  value={phone}
                  required
                  onChange={(event) => setPhone(event.target.value)}
                  style={{
                    flex: 1,
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    color: '#e8f5e9',
                    fontSize: 14,
                    fontFamily: 'monospace',
                    letterSpacing: 1,
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 2,
                  color: '#7dc87f',
                  marginBottom: 8,
                  textTransform: 'uppercase',
                }}
              >
                {t('Parol', language)}
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(74,140,63,0.35)',
                  borderRadius: 12,
                  padding: '4px 14px 4px 4px',
                  transition: 'border-color 0.2s',
                }}
                onFocusCapture={(event) => {
                  event.currentTarget.style.borderColor = 'rgba(212,160,20,0.6)';
                }}
                onBlurCapture={(event) => {
                  event.currentTarget.style.borderColor = 'rgba(74,140,63,0.35)';
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    flexShrink: 0,
                    background: 'linear-gradient(135deg, #1e6b20, #2d8c30)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(45,140,48,0.4)',
                  }}
                >
                  <Lock size={17} color="#fff" />
                </div>
                <input
                  className="input-field"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="********"
                  value={password}
                  required
                  onChange={(event) => setPassword(event.target.value)}
                  style={{
                    flex: 1,
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    color: '#e8f5e9',
                    fontSize: 14,
                    fontFamily: 'monospace',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'rgba(125,200,127,0.6)',
                    padding: 0,
                    display: 'flex',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: '#f87171',
                  padding: '8px 12px',
                  background: 'rgba(248,113,113,0.1)',
                  borderRadius: 8,
                  border: '1px solid rgba(248,113,113,0.2)',
                }}
              >
                ! {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 4,
                padding: '14px',
                borderRadius: 12,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: loading
                  ? 'rgba(184,134,11,0.4)'
                  : 'linear-gradient(90deg, #9a7009, #d4a020, #f0c030, #d4a020, #9a7009)',
                backgroundSize: '200% auto',
                color: '#1a0f00',
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: 4,
                textTransform: 'uppercase',
                fontFamily: 'Georgia, serif',
                boxShadow: loading
                  ? 'none'
                  : '0 4px 20px rgba(212,160,20,0.4), 0 2px 0 rgba(0,0,0,0.3)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(event) => {
                if (!loading) {
                  event.currentTarget.style.backgroundPosition = 'right center';
                  event.currentTarget.style.transform = 'translateY(-1px)';
                  event.currentTarget.style.boxShadow =
                    '0 6px 24px rgba(212,160,20,0.55), 0 2px 0 rgba(0,0,0,0.3)';
                }
              }}
              onMouseLeave={(event) => {
                if (!loading) {
                  event.currentTarget.style.backgroundPosition = 'left center';
                  event.currentTarget.style.transform = 'none';
                  event.currentTarget.style.boxShadow =
                    '0 4px 20px rgba(212,160,20,0.4), 0 2px 0 rgba(0,0,0,0.3)';
                }
              }}
              onMouseDown={(event) => {
                if (!loading) event.currentTarget.style.transform = 'translateY(1px)';
              }}
              onMouseUp={(event) => {
                if (!loading) event.currentTarget.style.transform = 'translateY(-1px)';
              }}
            >
              {loading ? 'Kirish...' : 'Kirish'}
            </button>
          </form>
        </div>

        <p
          style={{
            marginTop: 16,
            fontSize: 10,
            letterSpacing: 3,
            color: 'rgba(212,160,20,0.3)',
            textTransform: 'uppercase',
          }}
        >
          Restaurant Admin
        </p>
      </div>
    </div>
  );
}
