import React, { useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { X, ShieldAlert, Lock, Mail, ArrowRight, Server, ShieldCheck } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@sliceandfire.com');
  const [password, setPassword] = useState('Admin@12345');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await api.adminLogin({ email, password });
      login(res.token, res.user);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid administrator credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleFillAdmin = () => {
    setEmail('admin@sliceandfire.com');
    setPassword('Admin@12345');
    setErrorMsg('');
  };

  const handleFillCustomerTest = () => {
    setEmail('customer@sliceandfire.com');
    setPassword('Customer@123');
    setErrorMsg('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(20, 16, 14, 0.8)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#1f1b19',
          color: '#fff',
          borderRadius: 16,
          width: '100%',
          maxWidth: 440,
          boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
          border: '1px solid #3d3532',
          overflow: 'hidden',
        }}
      >
        {/* Header with Port 3001 & RBAC Badges */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #332c29',
            background: 'linear-gradient(to bottom, #2a2421, #1f1b19)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#ca8a04',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000',
                }}
              >
                <ShieldAlert size={18} />
              </div>
              <div>
                <b style={{ fontSize: 14, color: '#fef08a' }}>Staff &amp; Admin Operations</b>
                <small style={{ display: 'block', fontSize: 11, color: '#a8a29e' }}>Dedicated Service Portal</small>
              </div>
            </div>
            <button
              id="admin-login-close"
              onClick={onClose}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#a8a29e' }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: '#451a03',
                color: '#fde047',
                border: '1px solid #854d0e',
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 4,
              }}
            >
              <Server size={11} /> TARGET PORT: 3001
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: '#1e293b',
                color: '#38bdf8',
                border: '1px solid #334155',
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 4,
              }}
            >
              <ShieldCheck size={11} /> RBAC ENFORCED: ROLE 'ADMIN' ONLY
            </span>
          </div>
        </div>

        <div style={{ padding: '20px 24px' }}>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: '#d6d3d1', lineHeight: 1.5 }}>
            This service runs on isolated <b>Port 3001</b> for kitchen managers. Under strict <b>Role-Based Access Control (RBAC)</b>, client customer credentials are prohibited from authenticating on this port.
          </p>

          {errorMsg && (
            <div
              style={{
                background: '#451a1a',
                border: '1px solid #b91c1c',
                color: '#fca5a5',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 12,
                marginBottom: 16,
                lineHeight: 1.4,
              }}
            >
              <b>Access Denied:</b> {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 5, color: '#e7e5e4' }}>
                Admin Email (Port 3001)
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#78716c' }} />
                <input
                  id="admin-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: 8,
                    border: '1px solid #44403c',
                    background: '#292524',
                    color: '#fff',
                    fontSize: 13,
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 5, color: '#e7e5e4' }}>
                Admin Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#78716c' }} />
                <input
                  id="admin-password-input"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: 8,
                    border: '1px solid #44403c',
                    background: '#292524',
                    color: '#fff',
                    fontSize: 13,
                  }}
                />
              </div>
            </div>

            {/* Quick-fill testing buttons */}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                type="button"
                onClick={handleFillAdmin}
                style={{
                  flex: 1,
                  background: '#292524',
                  border: '1px solid #44403c',
                  color: '#fde047',
                  padding: '6px 8px',
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Fill Valid Admin (Port 3001)
              </button>
              <button
                type="button"
                onClick={handleFillCustomerTest}
                style={{
                  flex: 1,
                  background: '#292524',
                  border: '1px solid #7f1d1d',
                  color: '#fca5a5',
                  padding: '6px 8px',
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Test Customer on Port 3001 (RBAC Rejection)
              </button>
            </div>

            <button
              id="admin-login-submit-btn"
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                marginTop: 6,
                padding: 12,
                fontSize: 13,
                fontWeight: 700,
                borderRadius: 999,
                background: '#ca8a04',
                color: '#000',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: 'pointer',
              }}
            >
              {loading ? 'Authenticating Admin on Port 3001...' : 'Enter Admin Operations on Port 3001'} <ArrowRight size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
