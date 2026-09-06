import React, { useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { X, Mail, Lock, User, KeyRound, CheckCircle, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultTab = 'login' }) => {
  const { login } = useAuth();
  const { isDark } = useTheme();
  const [tab, setTab] = useState<'login' | 'register' | 'verify' | 'forgot' | 'reset'>(defaultTab);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // UI status
  const [infoMsg, setInfoMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);

    try {
      const res = await api.register({ name, email, password });
      setInfoMsg(`Verification code generated: ${res.verificationCode}`);
      setVerificationCode(res.verificationCode);
      setTab('verify');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);

    try {
      const res = await api.verifyEmail({ email, code: verificationCode });
      login(res.token, res.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);

    try {
      const res = await api.login({ email, password });
      login(res.token, res.user);
      onClose();
    } catch (err: any) {
      if (err.data?.needsVerification) {
        setInfoMsg(`Please verify your email. Code: ${err.data.verificationCode || ''}`);
        if (err.data.verificationCode) setVerificationCode(err.data.verificationCode);
        setTab('verify');
      } else {
        setErrorMsg(err.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);

    try {
      const res = await api.forgotPassword(email);
      setInfoMsg(res.message);
      if (res.resetToken) {
        setResetToken(res.resetToken);
        setTab('reset');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error requesting reset');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);

    try {
      const res = await api.resetPassword({ token: resetToken, newPassword });
      setInfoMsg(res.message);
      setTab('login');
      setPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        background: 'rgba(25, 20, 18, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        id="auth-modal-card"
        style={{
          background: isDark ? '#1a1614' : '#fffcfb',
          color: isDark ? '#f5f2ee' : '#2b2725',
          borderRadius: 16,
          width: '100%',
          maxWidth: 440,
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          border: isDark ? '1px solid #332822' : '1px solid #e2ddd8',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: isDark ? '1px solid #2d241f' : '1px solid #eee8e4',
          }}
        >
          <div style={{ display: 'flex', gap: 16 }}>
            <button
              id="auth-tab-login"
              onClick={() => {
                setTab('login');
                setErrorMsg('');
                setInfoMsg('');
              }}
              style={{
                border: 'none',
                background: 'none',
                fontWeight: tab === 'login' ? 700 : 500,
                color: tab === 'login' ? '#c92722' : '#736d68',
                borderBottom: tab === 'login' ? '2px solid #c92722' : 'none',
                paddingBottom: 4,
                fontSize: 14,
              }}
            >
              Sign In
            </button>
            <button
              id="auth-tab-register"
              onClick={() => {
                setTab('register');
                setErrorMsg('');
                setInfoMsg('');
              }}
              style={{
                border: 'none',
                background: 'none',
                fontWeight: tab === 'register' ? 700 : 500,
                color: tab === 'register' ? '#c92722' : '#736d68',
                borderBottom: tab === 'register' ? '2px solid #c92722' : 'none',
                paddingBottom: 4,
                fontSize: 14,
              }}
            >
              Register &amp; Verify
            </button>
          </div>
          <button
            id="auth-modal-close"
            onClick={onClose}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#888' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '24px 28px' }}>
          {errorMsg && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 12,
                marginBottom: 16,
              }}
            >
              {errorMsg}
            </div>
          )}

          {infoMsg && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#15803d',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 12,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <CheckCircle size={15} />
              <span>{infoMsg}</span>
            </div>
          )}

          {/* 1. LOGIN VIEW */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 5, color: '#4a4441' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#999' }} />
                  <input
                    id="login-email-input"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      borderRadius: 8,
                      border: '1px solid #dcd5d0',
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#4a4441' }}>Password</label>
                  <button
                    type="button"
                    id="forgot-password-link"
                    onClick={() => {
                      setTab('forgot');
                      setErrorMsg('');
                    }}
                    style={{ border: 'none', background: 'none', fontSize: 11, color: '#c92722', cursor: 'pointer' }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#999' }} />
                  <input
                    id="login-password-input"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      borderRadius: 8,
                      border: '1px solid #dcd5d0',
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="primary"
                style={{
                  width: '100%',
                  marginTop: 6,
                  padding: 12,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {loading ? 'Authenticating on Port 3000...' : 'Sign In to Client Storefront'} <ArrowRight size={15} />
              </button>

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('customer@sliceandfire.com');
                    setPassword('Customer@123');
                    setErrorMsg('');
                  }}
                  style={{
                    flex: 1,
                    background: '#f5f3f0',
                    border: '1px solid #dcd5d0',
                    color: '#2b2725',
                    padding: '6px 8px',
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Fill Customer (Port 3000)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@sliceandfire.com');
                    setPassword('Admin@12345');
                    setErrorMsg('');
                  }}
                  style={{
                    flex: 1,
                    background: '#fff1f2',
                    border: '1px solid #fecdd3',
                    color: '#be123c',
                    padding: '6px 8px',
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Test Admin Account (RBAC Block)
                </button>
              </div>

              <div style={{ marginTop: 6, padding: '8px 12px', background: '#f8f6f4', borderRadius: 8, fontSize: 11, color: '#6d6560' }}>
                🛡️ <b>Port 3000 (Client) &bull; RBAC:</b> Restricted to Customer accounts. Admin accounts are directed to <b>Admin Port 3001</b>.
              </div>
            </form>
          )}

          {/* 2. REGISTER VIEW */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 5, color: '#4a4441' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#999' }} />
                  <input
                    id="register-name-input"
                    type="text"
                    required
                    placeholder="Gianna Rossi"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      borderRadius: 8,
                      border: '1px solid #dcd5d0',
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 5, color: '#4a4441' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#999' }} />
                  <input
                    id="register-email-input"
                    type="email"
                    required
                    placeholder="gianna@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      borderRadius: 8,
                      border: '1px solid #dcd5d0',
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 5, color: '#4a4441' }}>
                  Create Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#999' }} />
                  <input
                    id="register-password-input"
                    type="password"
                    required
                    minLength={6}
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      borderRadius: 8,
                      border: '1px solid #dcd5d0',
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>

              <button
                id="register-submit-btn"
                type="submit"
                disabled={loading}
                className="primary"
                style={{
                  width: '100%',
                  marginTop: 6,
                  padding: 12,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {loading ? 'Creating Account...' : 'Continue to Email Verification'} <ArrowRight size={15} />
              </button>
            </form>
          )}

          {/* 3. EMAIL VERIFICATION STEP */}
          {tab === 'verify' && (
            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <KeyRound size={32} color="#c92722" style={{ margin: '0 auto 8px' }} />
                <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>Verify Your Email</h3>
                <p style={{ margin: 0, fontSize: 12, color: '#736d68' }}>
                  We sent a 6-digit confirmation code to <b>{email}</b>
                </p>
              </div>

              <div>
                <input
                  id="verification-code-input"
                  type="text"
                  required
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 8,
                    border: '2px solid #c92722',
                    fontSize: 20,
                    textAlign: 'center',
                    letterSpacing: 4,
                    fontWeight: 700,
                  }}
                />
              </div>

              <button
                id="verify-code-submit-btn"
                type="submit"
                disabled={loading}
                className="primary"
                style={{
                  width: '100%',
                  padding: 12,
                  fontSize: 13,
                }}
              >
                {loading ? 'Verifying...' : 'Confirm & Log In'}
              </button>

              <button
                type="button"
                onClick={() => setTab('login')}
                style={{ border: 'none', background: 'none', fontSize: 11, color: '#888', cursor: 'pointer' }}
              >
                Back to Sign In
              </button>
            </form>
          )}

          {/* 4. FORGOT PASSWORD STEP */}
          {tab === 'forgot' && (
            <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ marginBottom: 4 }}>
                <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>Password Recovery</h3>
                <p style={{ margin: 0, fontSize: 12, color: '#736d68' }}>
                  Enter your registered email address and we'll generate an encrypted password reset token.
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 5, color: '#4a4441' }}>
                  Registered Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#999' }} />
                  <input
                    id="forgot-email-input"
                    type="email"
                    required
                    placeholder="your-email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      borderRadius: 8,
                      border: '1px solid #dcd5d0',
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>

              <button
                id="forgot-submit-btn"
                type="submit"
                disabled={loading}
                className="primary"
                style={{ width: '100%', padding: 12, fontSize: 13 }}
              >
                {loading ? 'Dispatching...' : 'Send Password Reset Link'}
              </button>

              <button
                type="button"
                onClick={() => setTab('login')}
                style={{ border: 'none', background: 'none', fontSize: 11, color: '#888', cursor: 'pointer' }}
              >
                Remembered your password? Back to Login
              </button>
            </form>
          )}

          {/* 5. RESET PASSWORD STEP */}
          {tab === 'reset' && (
            <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>Set New Password</h3>
                <p style={{ margin: 0, fontSize: 12, color: '#736d68' }}>
                  Token validated for <b>{email}</b>
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 5, color: '#4a4441' }}>
                  Reset Token
                </label>
                <input
                  id="reset-token-input"
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #dcd5d0',
                    fontSize: 12,
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 5, color: '#4a4441' }}>
                  New Password (min 6 characters)
                </label>
                <input
                  id="reset-new-password-input"
                  type="password"
                  required
                  minLength={6}
                  placeholder="New strong password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #dcd5d0',
                    fontSize: 13,
                  }}
                />
              </div>

              <button
                id="reset-submit-btn"
                type="submit"
                disabled={loading}
                className="primary"
                style={{ width: '100%', padding: 12, fontSize: 13 }}
              >
                {loading ? 'Updating Password...' : 'Save New Password & Sign In'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
