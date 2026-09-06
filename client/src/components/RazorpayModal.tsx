import React, { useState, useMemo } from 'react';
import { X, ShieldCheck, CreditCard, Smartphone, Building2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../api/client.js';
import type { Order } from '../types.js';
import { useTheme } from '../context/ThemeContext.js';

interface RazorpayModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onPaymentSuccess: (confirmedOrder: Order) => void;
}

export const RazorpayModal: React.FC<RazorpayModalProps> = ({
  isOpen,
  order,
  onClose,
  onPaymentSuccess,
}) => {
  const { isDark } = useTheme();
  const [method, setMethod] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const razorpayOrderId = useMemo(() => {
    if (!order) return '';
    return order.razorpayOrderId || `order_test_${order.id}`;
  }, [order]);

  if (!isOpen || !order) return null;

  const inrAmount = Math.round(order.total * 83);

  const handleSimulatePayment = async (isSuccess: boolean) => {
    setLoading(true);
    setStatusMsg(null);

    try {
      if (!isSuccess) {
        setStatusMsg({
          type: 'error',
          text: 'Payment was cancelled or failed in test mode.',
        });
        setLoading(false);
        return;
      }

      // Simulate official Razorpay callback payload
      const testPaymentId = `pay_test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const verificationResponse = await api.verifyPayment({
        orderId: order.id,
        razorpayOrderId,
        razorpayPaymentId: testPaymentId,
        isTestSuccess: true,
      });

      if (verificationResponse.success) {
        setStatusMsg({
          type: 'success',
          text: 'Payment verified! Order confirmed & kitchen notified.',
        });
        setTimeout(() => {
          onPaymentSuccess(verificationResponse.order);
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'Payment verification failed on server.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        background: 'rgba(10, 20, 35, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        id="razorpay-checkout-modal"
        style={{
          width: '100%',
          maxWidth: 460,
          background: isDark ? '#191513' : '#ffffff',
          color: isDark ? '#f5f2ee' : '#1e293b',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          border: isDark ? '1px solid #332822' : '1px solid #c7d2fe',
        }}
      >
        {/* Razorpay Brand Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0c2340 0%, #173860 100%)',
            color: '#ffffff',
            padding: '20px 24px',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span
                  style={{
                    background: '#38bdf8',
                    color: '#082f49',
                    fontSize: 9,
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 4,
                    letterSpacing: 0.5,
                  }}
                >
                  RAZORPAY TEST MODE
                </span>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>Order #{order.id}</span>
              </div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Slice &amp; Fire Artisan Pizzeria</h2>
              <span style={{ fontSize: 11, color: '#cbd5e1' }}>Wood-fired Neapolitan Kitchen &bull; Order Checkout</span>
            </div>

            <button
              onClick={onClose}
              id="razorpay-close-btn"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                width: 28,
                height: 28,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </div>

          <div
            style={{
              marginTop: 16,
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block' }}>Total Payable Amount</span>
              <b style={{ fontSize: 20, color: '#38bdf8' }}>₹{inrAmount.toLocaleString()}</b>
              <small style={{ marginLeft: 6, color: '#cbd5e1', fontSize: 11 }}>(${order.total.toFixed(2)} USD)</small>
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, color: '#94a3b8' }}>
              <div>{order.customerName}</div>
              <div>{order.customerPhone}</div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div style={{ padding: '20px 24px' }}>
          {statusMsg && (
            <div
              style={{
                marginBottom: 16,
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: statusMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
                color: statusMsg.type === 'success' ? '#166534' : '#991b1b',
                border: `1px solid ${statusMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
              }}
            >
              {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 18 }}>
            <button
              onClick={() => setMethod('card')}
              style={{
                padding: '10px 8px',
                borderRadius: 8,
                border: method === 'card' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                background: method === 'card' ? '#f0f9ff' : '#fff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
              }}
            >
              <CreditCard size={18} color={method === 'card' ? '#0284c7' : '#64748b'} />
              <span style={{ fontSize: 11, fontWeight: 600, color: method === 'card' ? '#0369a1' : '#475569' }}>
                Cards
              </span>
            </button>

            <button
              onClick={() => setMethod('upi')}
              style={{
                padding: '10px 8px',
                borderRadius: 8,
                border: method === 'upi' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                background: method === 'upi' ? '#f0f9ff' : '#fff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
              }}
            >
              <Smartphone size={18} color={method === 'upi' ? '#0284c7' : '#64748b'} />
              <span style={{ fontSize: 11, fontWeight: 600, color: method === 'upi' ? '#0369a1' : '#475569' }}>
                UPI / QR
              </span>
            </button>

            <button
              onClick={() => setMethod('netbanking')}
              style={{
                padding: '10px 8px',
                borderRadius: 8,
                border: method === 'netbanking' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                background: method === 'netbanking' ? '#f0f9ff' : '#fff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
              }}
            >
              <Building2 size={18} color={method === 'netbanking' ? '#0284c7' : '#64748b'} />
              <span style={{ fontSize: 11, fontWeight: 600, color: method === 'netbanking' ? '#0369a1' : '#475569' }}>
                NetBanking
              </span>
            </button>
          </div>

          {/* Test Card Simulation View */}
          {method === 'card' && (
            <div
              style={{
                background: '#f8fafc',
                borderRadius: 10,
                padding: 14,
                border: '1px solid #e2e8f0',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 11 }}>
                <span style={{ color: '#64748b' }}>Test Card Number</span>
                <span style={{ color: '#0369a1', fontWeight: 600 }}>Visa Sandbox</span>
              </div>
              <div
                style={{
                  background: '#ffffff',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontFamily: 'monospace',
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: 2,
                  color: '#1e293b',
                  marginBottom: 8,
                }}
              >
                4111 1111 1111 1111
              </div>
              <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#64748b' }}>
                <span>Exp: <b>12/28</b></span>
                <span>CVV: <b>999</b></span>
                <span>Name: <b>{order.customerName}</b></span>
              </div>
            </div>
          )}

          {method === 'upi' && (
            <div
              style={{
                background: '#f8fafc',
                borderRadius: 10,
                padding: 14,
                border: '1px solid #e2e8f0',
                marginBottom: 16,
                textAlign: 'center',
              }}
            >
              <p style={{ margin: '0 0 6px', fontSize: 12, color: '#334155' }}>
                UPI ID: <b>slicefire@razorpay</b>
              </p>
              <span style={{ fontSize: 11, color: '#64748b' }}>
                Instant auto-approval ready in test mode.
              </span>
            </div>
          )}

          {method === 'netbanking' && (
            <div
              style={{
                background: '#f8fafc',
                borderRadius: 10,
                padding: 14,
                border: '1px solid #e2e8f0',
                marginBottom: 16,
              }}
            >
              <p style={{ margin: '0 0 6px', fontSize: 12, color: '#334155' }}>
                Simulating HDFC / ICICI / SBI Sandbox Bank
              </p>
              <span style={{ fontSize: 11, color: '#64748b' }}>Click Success to authorize sandbox mock OTP.</span>
            </div>
          )}

          {/* Prompt requirement: Razorpay checkout integration (test mode — clicking "Success" confirms the order) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              id="razorpay-success-btn"
              onClick={() => handleSimulatePayment(true)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: 8,
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
              }}
            >
              {loading ? (
                'Confirming with Razorpay...'
              ) : (
                <>
                  <CheckCircle2 size={16} /> Pay ₹{inrAmount.toLocaleString()} (Success &bull; Confirm Order)
                </>
              )}
            </button>

            <button
              id="razorpay-failure-btn"
              onClick={() => handleSimulatePayment(false)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '9px',
                borderRadius: 8,
                background: 'transparent',
                color: '#64748b',
                border: '1px solid #cbd5e1',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              Simulate Failure / Cancel
            </button>
          </div>

          <div
            style={{
              marginTop: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              color: '#64748b',
              fontSize: 11,
            }}
          >
            <ShieldCheck size={14} color="#0284c7" />
            <span>256-bit SSL Encrypted &bull; Razorpay Sandbox</span>
          </div>
        </div>
      </div>
    </div>
  );
};
