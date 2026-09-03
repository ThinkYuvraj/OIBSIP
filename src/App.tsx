import React, { useState, useEffect } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { PizzaCatalog } from './components/PizzaCatalog.js';
import { CustomPizzaBuilder } from './components/CustomPizzaBuilder.js';
import { OrderStatusTracker } from './components/OrderStatusTracker.js';
import { AdminDashboard } from './components/AdminDashboard.js';
import { CartDrawer } from './components/CartDrawer.js';
import { AuthModal } from './components/AuthModal.js';
import { AdminLoginModal } from './components/AdminLoginModal.js';
import { OrderSummaryModal } from './components/OrderSummaryModal.js';
import { RazorpayModal } from './components/RazorpayModal.js';
import type { ArtisanPizza, CartItem, Order } from './types.js';
import { api } from './api/client.js';
import { Flame, Pizza, ShieldCheck, Clock, RefreshCw } from 'lucide-react';

function MainApp() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('home');

  // Menu pizzas from API
  const [pizzas, setPizzas] = useState<ArtisanPizza[]>([]);
  const [menuLoading, setMenuLoading] = useState<boolean>(true);

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('slice_fire_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active customer orders count for badge
  const [activeOrdersCount, setActiveOrdersCount] = useState<number>(0);

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
  const [pendingPaymentOrder, setPendingPaymentOrder] = useState<Order | null>(null);

  // Save cart to local storage
  useEffect(() => {
    localStorage.setItem('slice_fire_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Load menu from backend
  const loadMenu = async () => {
    try {
      setMenuLoading(true);
      const res = await api.getPizzas();
      setPizzas(res.pizzas);
    } catch (err) {
      console.error('Failed to load menu pizzas:', err);
    } finally {
      setMenuLoading(false);
    }
  };

  // Poll user orders count when logged in
  const checkUserOrders = async () => {
    if (!user) {
      setActiveOrdersCount(0);
      return;
    }
    try {
      const res = await api.getMyOrders();
      const active = res.orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled').length;
      setActiveOrdersCount(active);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  useEffect(() => {
    checkUserOrders();
    const interval = setInterval(checkUserOrders, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Cart actions
  const handleAddToCart = (item: CartItem) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.name === item.name && JSON.stringify(i.customDetails) === JSON.stringify(item.customDetails)
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].quantity += item.quantity;
        return updated;
      }
      return [...prev, item];
    });
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Checkout flow transitions
  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsSummaryOpen(true);
  };

  const handleOrderCreated = (order: Order) => {
    setPendingPaymentOrder(order);
    setIsSummaryOpen(false);
    setIsRazorpayOpen(true);
  };

  const handlePaymentSuccess = (_confirmedOrder: Order) => {
    // Clear cart on payment success
    setCartItems([]);
    setPendingPaymentOrder(null);
    checkUserOrders();
    loadMenu(); // refresh inventory availability
    // Switch view to real-time tracker
    setActiveTab('tracker');
  };

  const totalCartCount = cartItems.reduce((a, b) => a + b.quantity, 0);

  return (
    <main className="app-shell" id="app-root">
      <section className="site-frame">
        {/* Navigation Bar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          cartCount={totalCartCount}
          openCart={() => setIsCartOpen(true)}
          openAuth={() => setIsAuthOpen(true)}
          openAdminAuth={() => setIsAdminAuthOpen(true)}
          activeOrderCount={activeOrdersCount}
        />

        {/* 1. HOME VIEW */}
        {activeTab === 'home' && (
          <div id="home-view">
            {/* Hero Section */}
            <section className="hero">
              <div>
                <span className="eyebrow">LEVEL 3 PRODUCTION STACK</span>
                <h1>Charred Perfection,<br />Baked to Order.</h1>
                <p>
                  Artisan Neapolitan pizzas hand-stretched and baked at 900°F in our volcanic stone hearth.
                  Craft your bespoke pie with our 4-step custom builder, pay securely with Razorpay test mode,
                  and watch your order bake and travel live on your screen.
                </p>

                <p className="actions">
                  <button
                    id="hero-order-now-btn"
                    className="primary"
                    onClick={() => setActiveTab('builder')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Pizza size={15} /> Build Custom Pie
                  </button>
                  <button
                    id="hero-view-menu-btn"
                    className="outline"
                    onClick={() => setActiveTab('menu')}
                  >
                    Artisan Varieties &rarr;
                  </button>
                </p>
              </div>

              {/* Visual Hero Showcase */}
              <div
                className="hero-art"
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  background: '#2b110a',
                  minHeight: 320,
                  borderRadius: 16,
                }}
              >
                {/* Hero Pizza Background Image */}
                <img
                  src="/images/artisan-hero.jpg"
                  alt="Artisan Neapolitan Pizza from 900F Oven"
                  referrerPolicy="no-referrer"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: 0,
                  }}
                />

                {/* Dark Vignette Gradient Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(20,10,8,0.2) 0%, rgba(20,10,8,0.4) 40%, rgba(15,8,6,0.92) 100%)',
                    zIndex: 1,
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    background: 'rgba(20,10,8,0.75)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(254,240,138,0.3)',
                    padding: '6px 14px',
                    borderRadius: 999,
                    color: '#fef08a',
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    zIndex: 2,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}
                >
                  <Flame size={14} color="#facc15" /> 900°F Volcanic Stone Hearth
                </div>

                <div style={{ position: 'relative', zIndex: 2, padding: '20px 24px' }}>
                  <span
                    style={{
                      background: '#c92722',
                      color: '#fff',
                      padding: '3px 10px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 800,
                      display: 'inline-block',
                      marginBottom: 6,
                      letterSpacing: '0.05em',
                    }}
                  >
                    SIGNATURE CRAFT
                  </span>
                  <h3 style={{ margin: 0, fontSize: 20, color: '#fff', fontWeight: 800 }}>Artisan Wood-Fired Neapolitan</h3>
                  <p style={{ margin: '4px 0 0', color: '#fed7aa', fontSize: 12, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                    Blistered sourdough cornicione, San Marzano marinara, fior di latte mozzarella, and cold-pressed olive oil.
                  </p>
                </div>
              </div>
            </section>

            {/* Level 3 Architecture & Capabilities Highlight */}
            <section
              style={{
                padding: '24px 78px',
                background: '#faf7f4',
                borderTop: '1px solid #eee8e4',
                borderBottom: '1px solid #eee8e4',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                  gap: 20,
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      background: '#fee2e2',
                      color: '#c92722',
                      padding: 10,
                      borderRadius: 10,
                    }}
                  >
                    <Pizza size={20} />
                  </div>
                  <div>
                    <b style={{ fontSize: 13, color: '#2b2725' }}>4-Step Custom Pie Builder</b>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#736d68', lineHeight: 1.4 }}>
                      Choose 5 bases, 5 sauces, 5 cheeses, and 10 farm-fresh vegetables with real-time stock validation.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      background: '#e0f2fe',
                      color: '#0284c7',
                      padding: 10,
                      borderRadius: 10,
                    }}
                  >
                    <Clock size={20} />
                  </div>
                  <div>
                    <b style={{ fontSize: 13, color: '#2b2725' }}>Real-Time Kitchen Tracker</b>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#736d68', lineHeight: 1.4 }}>
                      Live auto-syncing step progression: Order Received &rarr; In Kitchen &rarr; Sent to Delivery &rarr; Delivered.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      background: '#fef3c7',
                      color: '#ca8a04',
                      padding: 10,
                      borderRadius: 10,
                    }}
                  >
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <b style={{ fontSize: 13, color: '#2b2725' }}>Admin Inventory &amp; Cron Alerts</b>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#736d68', lineHeight: 1.4 }}>
                      Separate Admin login, automatic inventory decrements, and scheduled node-cron low-stock email notifications.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Featured Artisan Menu Row */}
            <section className="favorites">
              <div className="section-title">
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#c92722', textTransform: 'uppercase' }}>
                    Fresh from the Oven
                  </span>
                  <h2>Artisan Neapolitan Varieties</h2>
                </div>
                <button id="home-see-all-menu-btn" onClick={() => setActiveTab('menu')}>
                  Explore Full Menu &rarr;
                </button>
              </div>

              {menuLoading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                  <p>Loading fresh pizza varieties...</p>
                </div>
              ) : (
                <div className="grid home-grid">
                  {pizzas.slice(0, 4).map((pizza) => (
                    <article className="card" key={pizza.id}>
                      <div
                        className="pizza-art"
                        style={{
                          background: `linear-gradient(135deg, ${pizza.color}25 0%, ${pizza.color}50 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 42,
                        }}
                      >
                        🍕
                      </div>
                      <div className="card-copy">
                        <div>
                          <h3>{pizza.name}</h3>
                          <p>{pizza.description}</p>
                          <small>★ {pizza.rating}</small>
                          <strong>${pizza.price.toFixed(2)}</strong>
                        </div>
                        <button
                          id={`quick-add-${pizza.id}`}
                          className="add"
                          onClick={() =>
                            handleAddToCart({
                              id: pizza.id,
                              name: pizza.name,
                              price: pizza.price,
                              quantity: 1,
                              isCustom: false,
                              color: pizza.color,
                              description: pizza.description,
                            })
                          }
                        >
                          + Add
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* 2. ARTISAN MENU VIEW */}
        {activeTab === 'menu' && (
          <PizzaCatalog
            pizzas={pizzas}
            onAddToCart={handleAddToCart}
            onOpenBuilder={() => setActiveTab('builder')}
          />
        )}

        {/* 3. CUSTOM PIZZA BUILDER VIEW */}
        {activeTab === 'builder' && (
          <CustomPizzaBuilder
            onAddToCart={handleAddToCart}
            onGoToCart={() => setIsCartOpen(true)}
          />
        )}

        {/* 4. REAL-TIME ORDER TRACKER VIEW */}
        {activeTab === 'tracker' && (
          <OrderStatusTracker
            onSelectOrderToPay={(order) => {
              setPendingPaymentOrder(order);
              setIsRazorpayOpen(true);
            }}
          />
        )}

        {/* 5. ADMIN CONSOLE VIEW */}
        {activeTab === 'admin' && (
          isAdmin ? (
            <AdminDashboard />
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 20px', maxWidth: 500, margin: '0 auto' }}>
              <ShieldCheck size={48} color="#ca8a04" style={{ margin: '0 auto 12px' }} />
              <h2 style={{ margin: '0 0 8px' }}>Restricted Administrative Access</h2>
              <p style={{ color: '#736d68', fontSize: 13, marginBottom: 20 }}>
                This operational console requires administrator authorization. Please authenticate via the separate admin portal.
              </p>
              <button
                id="admin-auth-open-btn"
                className="primary"
                onClick={() => setIsAdminAuthOpen(true)}
                style={{ padding: '12px 24px', fontSize: 13 }}
              >
                Open Admin Sign In Portal
              </button>
            </div>
          )
        )}

        {/* Global Slide-In Cart Drawer */}
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onProceedToCheckout={handleProceedToCheckout}
        />

        {/* Customer Auth Modal (Register, Email Verification, Login, Forgot Password) */}
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
        />

        {/* Separate Isolated Admin Login Modal */}
        <AdminLoginModal
          isOpen={isAdminAuthOpen}
          onClose={() => setIsAdminAuthOpen(false)}
          onSuccess={() => setActiveTab('admin')}
        />

        {/* Order Summary & Delivery Address Modal */}
        <OrderSummaryModal
          isOpen={isSummaryOpen}
          onClose={() => setIsSummaryOpen(false)}
          cartItems={cartItems}
          onOrderCreated={handleOrderCreated}
          openAuthModal={() => {
            setIsSummaryOpen(false);
            setIsAuthOpen(true);
          }}
        />

        {/* Razorpay Test Mode Payment Gateway Modal */}
        <RazorpayModal
          isOpen={isRazorpayOpen}
          order={pendingPaymentOrder}
          onClose={() => setIsRazorpayOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />

        {/* Footer */}
        <footer>
          <div>
            <h3>Slice &amp; Fire Pizzeria</h3>
            <p>
              Wood-fired artisan pizza,<br />
              baked in volcanic stone hearth at 900°F.
            </p>
            <div style={{ marginTop: 10, fontSize: 9, color: '#a8a29e' }}>
              Level 3 Task 1 &bull; Full-Stack Node.js, Express, React, Razorpay, Node-Cron
            </div>
          </div>

          <div>
            <b>Pizzeria Experience</b>
            <button onClick={() => setActiveTab('menu')}>Artisan Menu</button>
            <button onClick={() => setActiveTab('builder')}>Custom Pie Builder</button>
            <button onClick={() => setActiveTab('tracker')}>Live Order Tracker</button>
          </div>

          <div>
            <b>Staff &amp; Operations</b>
            <button onClick={() => setIsAdminAuthOpen(true)}>Admin Portal Login</button>
            {isAdmin && <button onClick={() => setActiveTab('admin')}>Kitchen Dashboard</button>}
            <button onClick={() => setIsAuthOpen(true)}>Customer Sign In / Register</button>
          </div>

          <div>
            <b>Trattoria &amp; Kitchen</b>
            <p>
              742 Hearthway Blvd, New York, NY<br />
              Phone: (212) 555-0194<br />
              Admin Alert: admin@sliceandfire.com
            </p>
          </div>

          <small>
            &copy; 2026 Slice &amp; Fire Pizzeria &bull; Level 3 Full-Stack Application &bull; All rights reserved.
          </small>
        </footer>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
