import React, { useState, useEffect } from 'react';
import type { Order, OrderStatus } from '../types.js';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { CheckCircle2, Clock, ChefHat, Bike, PackageCheck, RefreshCw } from 'lucide-react';

interface OrderStatusTrackerProps {
  onSelectOrderToPay?: (order: Order) => void;
}

const STATUS_STEPS: { status: OrderStatus; label: string; icon: any; description: string }[] = [
  {
    status: 'Order Received',
    label: 'Order Received',
    icon: CheckCircle2,
    description: 'Ticket created, ingredients verified & queued for the hearth oven.',
  },
  {
    status: 'In Kitchen',
    label: 'In Kitchen',
    icon: ChefHat,
    description: 'Dough hand-stretched, sauce ladled, and baked at 900°F.',
  },
  {
    status: 'Sent to Delivery',
    label: 'Sent to Delivery',
    icon: Bike,
    description: 'Packed in insulated thermal carrier, courier dispatched to your address.',
  },
  {
    status: 'Delivered',
    label: 'Delivered',
    icon: PackageCheck,
    description: 'Handed over warm and aromatic. Buon appetito!',
  },
];

export const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({ onSelectOrderToPay }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await api.getMyOrders();
      setOrders(res.orders);
      if (!selectedOrderId && res.orders.length > 0) {
        setSelectedOrderId(res.orders[0].id);
      }
    } catch (err) {
      console.error('Failed to poll orders:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Real-time polling every 3.5 seconds
  useEffect(() => {
    if (!user) return;
    fetchOrders(false);

    const interval = setInterval(() => {
      fetchOrders(true);
    }, 3500);

    return () => clearInterval(interval);
  }, [user]);

  if (!user) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', textAlign: 'center', padding: '60px 20px' }}>
        <Clock size={40} color="#c92722" style={{ margin: '0 auto 12px' }} />
        <h2 style={{ margin: '0 0 8px' }}>Live Order Tracker</h2>
        <p style={{ color: '#736d68', fontSize: 14 }}>
          Please sign in to your customer account to track your pizzas live from our oven to your door.
        </p>
      </div>
    );
  }

  if (loading && orders.length === 0) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', textAlign: 'center', padding: '60px 20px' }}>
        <RefreshCw size={32} className="animate-spin" color="#c92722" style={{ margin: '0 auto 12px' }} />
        <p>Connecting to kitchen dispatch channel...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', textAlign: 'center', padding: '60px 20px' }}>
        <Clock size={40} color="#a8a29e" style={{ margin: '0 auto 12px' }} />
        <h2 style={{ margin: '0 0 8px' }}>No Orders Found</h2>
        <p style={{ color: '#736d68', fontSize: 14 }}>
          You haven't placed an order yet. Select from our artisan menu or craft a custom pie!
        </p>
      </div>
    );
  }

  const currentOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];

  const getStepIndex = (status: OrderStatus) => {
    if (status === 'Cancelled') return -1;
    return STATUS_STEPS.findIndex((s) => s.status === status);
  };

  const currentStepIdx = getStepIndex(currentOrder.status);

  return (
    <section className="page tracker" id="order-tracker-page" style={{ maxWidth: 1080, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <span className="eyebrow">REAL-TIME KITCHEN &bull; LEVEL 3 FEATURE</span>
          <h1 style={{ margin: '6px 0 0', fontSize: 26 }}>Live Hearth &amp; Delivery Tracker</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontSize: 11,
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#f0fdf4',
              padding: '6px 12px',
              borderRadius: 999,
              border: '1px solid #bbf7d0',
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#16a34a',
                animation: 'pulse 1.5s infinite',
              }}
            />
            {isRefreshing ? 'Syncing with Kitchen...' : 'Live Synced (Auto-updating)'}
          </span>

          <button
            onClick={() => fetchOrders(true)}
            id="tracker-refresh-btn"
            style={{
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            title="Refresh immediately"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: 24 }}>
        {/* Left: Orders history selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 14, color: '#574f4b' }}>Your Orders ({orders.length})</h3>

          {orders.map((o) => {
            const isSelected = o.id === currentOrder.id;
            return (
              <div
                key={o.id}
                id={`tracker-order-card-${o.id}`}
                onClick={() => setSelectedOrderId(o.id)}
                style={{
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: isSelected ? '#ffffff' : '#faf8f6',
                  border: isSelected ? '2px solid #c92722' : '1px solid #e7e1dc',
                  boxShadow: isSelected ? '0 4px 14px rgba(201,39,34,0.1)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <b style={{ fontSize: 13, color: '#2b2725' }}>Order #{o.id}</b>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background:
                        o.status === 'Delivered'
                          ? '#dcfce7'
                          : o.status === 'Sent to Delivery'
                          ? '#e0f2fe'
                          : o.status === 'In Kitchen'
                          ? '#fef3c7'
                          : '#fee2e2',
                      color:
                        o.status === 'Delivered'
                          ? '#166534'
                          : o.status === 'Sent to Delivery'
                          ? '#0369a1'
                          : o.status === 'In Kitchen'
                          ? '#92400e'
                          : '#b91c1c',
                    }}
                  >
                    {o.status}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#78716c' }}>
                  <span>{new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <b style={{ color: '#2b2725' }}>${o.total.toFixed(2)}</b>
                </div>

                <div style={{ marginTop: 6, fontSize: 11, color: '#574f4b' }}>
                  {o.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Live Real-time Status Timeline & Details */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 16,
            border: '1px solid #e5dfda',
            padding: 28,
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>Order #{currentOrder.id}</h2>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    background: currentOrder.paymentStatus === 'PAID' ? '#dcfce7' : '#fee2e2',
                    color: currentOrder.paymentStatus === 'PAID' ? '#166534' : '#b91c1c',
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}
                >
                  Payment: {currentOrder.paymentStatus}
                </span>
              </div>
              <span style={{ fontSize: 12, color: '#78716c' }}>
                Placed on {new Date(currentOrder.createdAt).toLocaleDateString()} at{' '}
                {new Date(currentOrder.createdAt).toLocaleTimeString()}
              </span>
            </div>

            {currentOrder.paymentStatus === 'PENDING' && onSelectOrderToPay && (
              <button
                onClick={() => onSelectOrderToPay(currentOrder)}
                className="primary"
                style={{ fontSize: 12, padding: '8px 16px' }}
              >
                Complete Payment &rarr;
              </button>
            )}
          </div>

          {/* STEP PROGRESS BAR: Order Received -> In Kitchen -> Sent to Delivery -> Delivered */}
          <div style={{ marginBottom: 36, position: 'relative' }}>
            {/* Connecting Track Line */}
            <div
              style={{
                position: 'absolute',
                top: 24,
                left: 36,
                right: 36,
                height: 4,
                background: '#e5e7eb',
                zIndex: 1,
              }}
            >
              <div
                style={{
                  height: '100%',
                  background: '#c92722',
                  transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  width: `${(Math.max(0, currentStepIdx) / (STATUS_STEPS.length - 1)) * 100}%`,
                }}
              />
            </div>

            {/* Stepper Nodes */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                position: 'relative',
                zIndex: 2,
              }}
            >
              {STATUS_STEPS.map((s, idx) => {
                const IconComponent = s.icon;
                const isPassed = currentStepIdx >= idx;
                const isCurrent = currentStepIdx === idx;

                return (
                  <div
                    key={s.status}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      width: 100,
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: isPassed ? '#c92722' : '#ffffff',
                        border: isPassed ? '3px solid #c92722' : '3px solid #d1d5db',
                        color: isPassed ? '#ffffff' : '#9ca3af',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isCurrent ? '0 0 0 6px rgba(201,39,34,0.18)' : 'none',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <IconComponent size={22} />
                    </div>

                    <b
                      style={{
                        marginTop: 10,
                        fontSize: 12,
                        color: isPassed ? '#1f2937' : '#9ca3af',
                        fontWeight: isCurrent ? 800 : 600,
                      }}
                    >
                      {s.label}
                    </b>

                    {isCurrent && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: '#c92722',
                          background: '#fee2e2',
                          padding: '2px 6px',
                          borderRadius: 4,
                          marginTop: 4,
                        }}
                      >
                        IN PROGRESS
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-Time Live Status Banner */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 12,
              background: '#faf8f6',
              border: '1px solid #e7e2de',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#c92722',
              }}
            >
              <ChefHat size={22} />
            </div>
            <div>
              <b style={{ fontSize: 14, color: '#2b2725' }}>
                {STATUS_STEPS[currentStepIdx]?.label || currentOrder.status}
              </b>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#736d68' }}>
                {STATUS_STEPS[currentStepIdx]?.description ||
                  'The restaurant is processing your pizza order.'}
              </p>
            </div>
          </div>

          {/* Delivery & Destination Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div style={{ background: '#faf9f7', padding: 14, borderRadius: 10, border: '1px solid #e8e3df' }}>
              <span style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>
                Delivery Address
              </span>
              <b style={{ fontSize: 12, color: '#2b2725', lineHeight: 1.4, display: 'block' }}>
                {currentOrder.deliveryAddress}
              </b>
              <span style={{ fontSize: 11, color: '#666', marginTop: 4, display: 'block' }}>
                Contact: {currentOrder.customerPhone}
              </span>
            </div>

            <div style={{ background: '#faf9f7', padding: 14, borderRadius: 10, border: '1px solid #e8e3df' }}>
              <span style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>
                Items Ordered
              </span>
              <div style={{ fontSize: 12, color: '#2b2725' }}>
                {currentOrder.items.map((i) => (
                  <div key={i.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      {i.imageUrl ? (
                        <img
                          src={i.imageUrl}
                          alt={i.name}
                          referrerPolicy="no-referrer"
                          style={{ width: 26, height: 26, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
                        />
                      ) : (
                        <span style={{ fontSize: 13 }}>🍕</span>
                      )}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {i.quantity} &times; {i.name}
                      </span>
                    </div>
                    <b style={{ flexShrink: 0 }}>${(i.price * i.quantity).toFixed(2)}</b>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Real-time Status Transition History */}
          <div>
            <h4 style={{ margin: '0 0 10px', fontSize: 13, color: '#444' }}>Status Log &amp; Kitchen Notes</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {currentOrder.statusHistory.map((h, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: '#ffffff',
                    border: '1px solid #ebe6e1',
                    fontSize: 11,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#c92722' }} />
                    <b style={{ color: '#2b2725' }}>{h.status}</b>
                    {h.note && <span style={{ color: '#666' }}>&mdash; {h.note}</span>}
                  </div>
                  <span style={{ color: '#888' }}>
                    {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
