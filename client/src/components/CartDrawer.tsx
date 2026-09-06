import React from 'react';
import type { CartItem } from '../types.js';
import { useTheme } from '../context/ThemeContext.js';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}) => {
  const { isDark } = useTheme();
  if (!isOpen) return null;

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1040,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        id="cart-drawer-panel"
        style={{
          width: '100%',
          maxWidth: 420,
          background: isDark ? '#191513' : '#fffcfb',
          color: isDark ? '#f5f2ee' : '#2b2725',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.3)',
          borderLeft: isDark ? '1px solid #2d241f' : '1px solid #e0d9d4',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: isDark ? '1px solid #2d241f' : '1px solid #eee8e4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingBag size={18} color="#c92722" />
            <h2 style={{ margin: 0, fontSize: 18, color: isDark ? '#f5f2ee' : '#2b2725' }}>
              Your Oven Order ({cartItems.reduce((a, b) => a + b.quantity, 0)})
            </h2>
          </div>
          <button
            onClick={onClose}
            id="cart-close-btn"
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: isDark ? '#a8a09a' : '#888',
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Item List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: isDark ? '#8a827c' : '#888' }}>
              <ShoppingBag size={36} color={isDark ? '#4a3f38' : '#d6d3d1'} style={{ margin: '0 auto 12px' }} />
              <p style={{ margin: 0, fontSize: 14 }}>Your cart is empty.</p>
              <small style={{ color: isDark ? '#6b615a' : '#aaa' }}>Explore our artisan menu or craft a custom pie.</small>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  id={`cart-item-row-${item.id}`}
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    background: isDark ? '#221b18' : '#ffffff',
                    border: isDark ? '1px solid #332822' : '1px solid #ebe5e1',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 8,
                          objectFit: 'cover',
                          flexShrink: 0,
                          border: isDark ? '1px solid #382e28' : '1px solid #ebe5e1',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 8,
                          background: item.color || '#c92722',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 20,
                          flexShrink: 0,
                        }}
                      >
                        🍕
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <b style={{ fontSize: 14, color: isDark ? '#f5f2ee' : '#2b2725', wordBreak: 'break-word' }}>
                          {item.name}
                        </b>
                        <b style={{ fontSize: 14, color: '#c92722', whiteSpace: 'nowrap', marginLeft: 8 }}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </b>
                      </div>
                      {item.description && (
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: isDark ? '#a8a09a' : '#736d68', lineHeight: 1.3 }}>
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          border: isDark ? '1px solid #3d332c' : '1px solid #dcd5cf',
                          background: isDark ? '#2d241f' : '#fff',
                          color: isDark ? '#f5f2ee' : '#2b2725',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: 12, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          border: isDark ? '1px solid #3d332c' : '1px solid #dcd5cf',
                          background: isDark ? '#2d241f' : '#fff',
                          color: isDark ? '#f5f2ee' : '#2b2725',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: isDark ? '#8c837e' : '#a8a29e',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                      }}
                      title="Remove item"
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div
            style={{
              padding: '20px 24px',
              borderTop: isDark ? '1px solid #2d241f' : '1px solid #eee8e4',
              background: isDark ? '#15110f' : '#faf8f6',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 13, color: isDark ? '#a8a09a' : '#736d68' }}>Estimated Subtotal</span>
              <b style={{ fontSize: 20, color: isDark ? '#f5f2ee' : '#2b2725' }}>${total.toFixed(2)}</b>
            </div>

            <button
              id="cart-checkout-btn"
              onClick={() => {
                onClose();
                onProceedToCheckout();
              }}
              className="primary"
              style={{
                width: '100%',
                padding: '13px',
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              Order Summary &amp; Pay <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
