import React, { useState } from 'react';
import { X, MapPin, Phone, Tag, Check, ShoppingBag, ShieldCheck, ArrowRight } from 'lucide-react';
import type { CartItem, Order } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../api/client.js';

interface OrderSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onOrderCreated: (order: Order) => void;
  openAuthModal: () => void;
}

export const OrderSummaryModal: React.FC<OrderSummaryModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  onOrderCreated,
  openAuthModal,
}) => {
  const { user } = useAuth();

  const [address, setAddress] = useState('742 Evergreen Terrace, Apt 4B, New York, NY 10001');
  const [phone, setPhone] = useState('(212) 555-0194');
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = appliedCoupon ? (subtotal * appliedCoupon.percent) / 100 : 0;
  const discountedSubtotal = subtotal - discount;
  const deliveryFee = discountedSubtotal >= 45 ? 0 : 3.5;
  const tax = discountedSubtotal * 0.08;
  const total = discountedSubtotal + deliveryFee + tax;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    const code = coupon.trim().toUpperCase();
    if (code === 'PIZZA20') {
      setAppliedCoupon({ code: 'PIZZA20', percent: 20 });
    } else if (code === 'FIRE10') {
      setAppliedCoupon({ code: 'FIRE10', percent: 10 });
    } else {
      setCouponError('Invalid coupon code. Try PIZZA20 or FIRE10.');
    }
  };

  const handleProceedToPayment = async () => {
    if (!user) {
      openAuthModal();
      return;
    }

    if (!address.trim() || address.trim().length < 6) {
      setErrorMsg('Please provide a complete delivery street address.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        items: cartItems,
        deliveryAddress: address,
        customerPhone: phone,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      };

      const res = await api.createOrder(payload);
      // Trigger Razorpay order creation
      await api.createRazorpayOrder(res.order.id);
      const freshlyFetched = await api.getOrderById(res.order.id);
      onOrderCreated(freshlyFetched.order);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing order creation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1050,
        background: 'rgba(20, 16, 14, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        id="order-summary-modal"
        style={{
          background: '#fffcfb',
          borderRadius: 16,
          width: '100%',
          maxWidth: 620,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
          border: '1px solid #e0d9d4',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #eee8e4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#c92722', textTransform: 'uppercase' }}>
              Final Review
            </span>
            <h2 style={{ margin: '2px 0 0', fontSize: 18, color: '#2b2725' }}>Order Summary &amp; Delivery</h2>
          </div>
          <button
            onClick={onClose}
            id="order-summary-close"
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#888' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {errorMsg && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 12,
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* Delivery Details */}
          <div style={{ background: '#fbf9f7', border: '1px solid #e7e2de', borderRadius: 12, padding: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={15} color="#c92722" /> Delivery Destination &amp; Contact
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#666', marginBottom: 4 }}>
                  Full Street Address
                </label>
                <input
                  id="checkout-address-input"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #d8d1cc',
                    fontSize: 12,
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#666', marginBottom: 4 }}>
                  Recipient Phone Number
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#999' }} />
                  <input
                    id="checkout-phone-input"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 32px',
                      borderRadius: 8,
                      border: '1px solid #d8d1cc',
                      fontSize: 12,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Itemized Order List */}
          <div>
            <h3 style={{ margin: '0 0 8px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShoppingBag size={15} color="#c92722" /> Itemized Pies ({cartItems.reduce((a, b) => a + b.quantity, 0)})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '10px 14px',
                    background: '#ffffff',
                    border: '1px solid #e8e3df',
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 6,
                          objectFit: 'cover',
                          flexShrink: 0,
                          border: '1px solid #e8e3df',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 6,
                          background: item.color || '#c92722',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 16,
                          flexShrink: 0,
                        }}
                      >
                        🍕
                      </div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <b style={{ fontSize: 13, color: '#2b2725' }}>{item.name}</b>
                        {item.isCustom && (
                          <span
                            style={{
                              fontSize: 9,
                              background: '#fee2e2',
                              color: '#b91c1c',
                              padding: '1px 6px',
                              borderRadius: 4,
                              fontWeight: 700,
                            }}
                          >
                            CUSTOM
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p style={{ margin: '2px 0 0', fontSize: 10, color: '#736d68', lineHeight: 1.3 }}>
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: 11, color: '#888' }}>
                      {item.quantity} &times; ${item.price.toFixed(2)}
                    </span>
                    <b style={{ display: 'block', fontSize: 13, color: '#c92722' }}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </b>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coupon Code Section */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: 6 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Tag size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#999' }} />
                  <input
                    id="checkout-coupon-input"
                    type="text"
                    placeholder="Coupon code (Try PIZZA20)"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px 8px 30px',
                      borderRadius: 6,
                      border: '1px solid #d8d1cc',
                      fontSize: 12,
                      textTransform: 'uppercase',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  id="checkout-apply-coupon-btn"
                  style={{
                    padding: '8px 14px',
                    borderRadius: 6,
                    background: '#443f3c',
                    color: '#fff',
                    border: 'none',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Apply
                </button>
              </form>
              {couponError && <p style={{ margin: '4px 0 0', fontSize: 10, color: '#dc2626' }}>{couponError}</p>}
              {appliedCoupon && (
                <p style={{ margin: '4px 0 0', fontSize: 10, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Check size={12} /> Coupon <b>{appliedCoupon.code}</b> applied: {appliedCoupon.percent}% discount!
                </p>
              )}
            </div>
          </div>

          {/* Calculation Breakdown */}
          <div style={{ borderTop: '1px solid #eee8e4', paddingTop: 12, fontSize: 12, color: '#574f4b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span>Subtotal</span>
              <b>${subtotal.toFixed(2)}</b>
            </div>

            {appliedCoupon && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, color: '#16a34a' }}>
                <span>Discount ({appliedCoupon.percent}%)</span>
                <b>-${discount.toFixed(2)}</b>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span>Delivery Fee {discountedSubtotal >= 45 && <small style={{ color: '#16a34a' }}>(Free over $45)</small>}</span>
              <b>{deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}</b>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Estimated Tax (8%)</span>
              <b>${tax.toFixed(2)}</b>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: 8,
                borderTop: '1px solid #e0d9d4',
                fontSize: 16,
                color: '#2b2725',
              }}
            >
              <b>Total Payable</b>
              <b style={{ color: '#c92722' }}>${total.toFixed(2)}</b>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #eee8e4',
            background: '#faf7f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#78716c' }}>
            <ShieldCheck size={16} color="#16a34a" />
            <span>Razorpay Secure Test Gateway</span>
          </div>

          <button
            id="checkout-proceed-btn"
            onClick={handleProceedToPayment}
            disabled={loading || cartItems.length === 0}
            className="primary"
            style={{
              padding: '12px 24px',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {loading ? (
              'Generating Ticket...'
            ) : user ? (
              <>
                Proceed to Razorpay Checkout <ArrowRight size={15} />
              </>
            ) : (
              'Sign In to Place Order'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
