import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import {
  Flame,
  Pizza,
  Clock,
  ShieldCheck,
  ShoppingBag,
  User as UserIcon,
  LogOut,
  Sun,
  Moon,
  X,
  ChefHat,
  ChevronRight,
  LogIn,
} from 'lucide-react';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cartCount: number;
  openCart: () => void;
  openAuth: () => void;
  openAdminAuth: () => void;
  activeOrderCount: number;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  cartCount,
  openCart,
  openAuth,
  openAdminAuth,
  activeOrderCount,
}) => {
  const { user, logout, isAdmin } = useAuth();
  const { toggleTheme, isDark } = useTheme();

  // Close on Escape key and prevent background scroll when open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    onClose();
  };

  const handleCartClick = () => {
    onClose();
    openCart();
  };

  const handleAuthClick = () => {
    onClose();
    openAuth();
  };

  const handleAdminAuthClick = () => {
    onClose();
    openAdminAuth();
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        id="mobile-sidebar-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          zIndex: 1500,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        aria-hidden={!isOpen}
      />

      {/* Slide-over Drawer */}
      <aside
        id="mobile-sidebar-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 'min(330px, 86vw)',
          backgroundColor: isDark ? '#191412' : '#ffffff',
          color: isDark ? '#f5f2ee' : '#2b2725',
          borderRight: isDark ? '1px solid #332822' : '1px solid #eee8e3',
          zIndex: 1501,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isOpen ? (isDark ? '4px 0 30px rgba(0, 0, 0, 0.6)' : '4px 0 30px rgba(0, 0, 0, 0.15)') : 'none',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 20px',
            borderBottom: isDark ? '1px solid #332822' : '1px solid #eee8e3',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: '#c92722',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                flexShrink: 0,
              }}
            >
              <Flame size={18} />
            </div>
            <div>
              <b style={{ fontSize: 14, color: isDark ? '#f5f2ee' : '#282321', display: 'block' }}>
                Slice &amp; Fire
              </b>
              <small style={{ fontSize: 10, color: isDark ? '#a8a09a' : '#78716c', display: 'block' }}>
                Artisan Wood-Fired &bull; Level 3
              </small>
            </div>
          </div>

          <button
            id="mobile-sidebar-close-btn"
            onClick={onClose}
            aria-label="Close navigation menu"
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: isDark ? '#261f1c' : '#f5f2ee',
              border: isDark ? '1px solid #443730' : '1px solid #e0d8d0',
              color: isDark ? '#f5f2ee' : '#2b2725',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* User Status / Authentication Card */}
        <div
          style={{
            padding: '16px 20px',
            background: isDark ? '#201916' : '#faf8f6',
            borderBottom: isDark ? '1px solid #332822' : '1px solid #eee8e3',
          }}
        >
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: isDark ? '#36241e' : '#fee2e2',
                    color: '#c92722',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        color: isDark ? '#f5f2ee' : '#2b2725',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {user.name}
                    </span>
                    {user.role === 'ADMIN' && (
                      <span
                        style={{
                          fontSize: 9,
                          background: '#c92722',
                          color: '#fff',
                          padding: '1px 6px',
                          borderRadius: 4,
                          fontWeight: 700,
                        }}
                      >
                        ADMIN
                      </span>
                    )}
                  </div>
                  <small
                    style={{
                      display: 'block',
                      fontSize: 10,
                      color: isDark ? '#a8a09a' : '#888',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user.email}
                  </small>
                </div>
              </div>

              <button
                id="mobile-sidebar-logout-btn"
                onClick={handleLogout}
                title="Log Out"
                style={{
                  background: isDark ? '#2b201c' : '#fff',
                  border: isDark ? '1px solid #443730' : '1px solid #ddd6d0',
                  color: isDark ? '#a8a09a' : '#736d68',
                  borderRadius: 8,
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <LogOut size={13} />
                <span>Out</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserIcon size={16} color="#c92722" />
                <span style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#d4cec9' : '#574f4a' }}>
                  Guest Ordering Mode
                </span>
              </div>
              <button
                id="mobile-sidebar-signin-btn"
                onClick={handleAuthClick}
                style={{
                  width: '100%',
                  background: '#c92722',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '9px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(201, 39, 34, 0.25)',
                }}
              >
                <LogIn size={14} />
                <span>Customer Sign In / Register</span>
              </button>
            </div>
          )}
        </div>

        {/* Primary Navigation Links */}
        <nav
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            padding: '16px 14px',
            flex: 1,
          }}
          aria-label="Mobile Navigation Links"
        >
          {/* Home */}
          <button
            id="mobile-nav-home-btn"
            onClick={() => handleNavClick('home')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 10,
              border: activeTab === 'home' ? '1px solid #c92722' : '1px solid transparent',
              background: activeTab === 'home' ? (isDark ? '#2e1916' : '#fff3f2') : 'transparent',
              color: activeTab === 'home' ? '#c92722' : (isDark ? '#e6dfd8' : '#2b2725'),
              fontWeight: activeTab === 'home' ? 700 : 500,
              fontSize: 13,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Flame size={18} color={activeTab === 'home' ? '#c92722' : (isDark ? '#a8a09a' : '#736d68')} />
              <span>Home Showcase</span>
            </div>
            <ChevronRight size={15} color={activeTab === 'home' ? '#c92722' : (isDark ? '#5c4e46' : '#b0a69f')} />
          </button>

          {/* Artisan Menu */}
          <button
            id="mobile-nav-menu-btn"
            onClick={() => handleNavClick('menu')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 10,
              border: activeTab === 'menu' ? '1px solid #c92722' : '1px solid transparent',
              background: activeTab === 'menu' ? (isDark ? '#2e1916' : '#fff3f2') : 'transparent',
              color: activeTab === 'menu' ? '#c92722' : (isDark ? '#e6dfd8' : '#2b2725'),
              fontWeight: activeTab === 'menu' ? 700 : 500,
              fontSize: 13,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Pizza size={18} color={activeTab === 'menu' ? '#c92722' : (isDark ? '#a8a09a' : '#736d68')} />
              <span>Artisan Menu</span>
            </div>
            <ChevronRight size={15} color={activeTab === 'menu' ? '#c92722' : (isDark ? '#5c4e46' : '#b0a69f')} />
          </button>

          {/* Custom Pie Builder */}
          <button
            id="mobile-nav-builder-btn"
            onClick={() => handleNavClick('builder')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 10,
              border: activeTab === 'builder' ? '1px solid #c92722' : (isDark ? '1px solid #3d322b' : '1px solid #ede7e2'),
              background: activeTab === 'builder'
                ? (isDark ? '#3d1c18' : '#fee2e2')
                : (isDark ? '#241c19' : '#f9f6f3'),
              color: activeTab === 'builder' ? '#c92722' : (isDark ? '#f5f2ee' : '#2b2725'),
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ChefHat size={18} color="#c92722" />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Custom Pie Builder</span>
                  <span
                    style={{
                      fontSize: 9,
                      background: '#c92722',
                      color: '#fff',
                      padding: '1px 6px',
                      borderRadius: 4,
                      fontWeight: 700,
                    }}
                  >
                    4-STEP
                  </span>
                </div>
                <small style={{ fontSize: 10, color: isDark ? '#a8a09a' : '#78716c', fontWeight: 400 }}>
                  Crust, Sauce, Cheese &amp; Toppings
                </small>
              </div>
            </div>
            <ChevronRight size={15} color="#c92722" />
          </button>

          {/* Order Tracker */}
          <button
            id="mobile-nav-tracker-btn"
            onClick={() => handleNavClick('tracker')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 10,
              border: activeTab === 'tracker' ? '1px solid #c92722' : '1px solid transparent',
              background: activeTab === 'tracker' ? (isDark ? '#2e1916' : '#fff3f2') : 'transparent',
              color: activeTab === 'tracker' ? '#c92722' : (isDark ? '#e6dfd8' : '#2b2725'),
              fontWeight: activeTab === 'tracker' ? 700 : 500,
              fontSize: 13,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Clock size={18} color={activeTab === 'tracker' ? '#c92722' : (isDark ? '#a8a09a' : '#736d68')} />
              <span>Live Order Tracker</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {activeOrderCount > 0 && (
                <span
                  style={{
                    background: '#16a34a',
                    color: '#fff',
                    borderRadius: 999,
                    fontSize: 10,
                    padding: '2px 8px',
                    fontWeight: 700,
                  }}
                >
                  {activeOrderCount} live
                </span>
              )}
              <ChevronRight size={15} color={activeTab === 'tracker' ? '#c92722' : (isDark ? '#5c4e46' : '#b0a69f')} />
            </div>
          </button>

          <div
            style={{
              margin: '8px 0',
              borderTop: isDark ? '1px solid #332822' : '1px solid #eee8e3',
            }}
          />

          {/* Admin Section */}
          {isAdmin ? (
            <button
              id="mobile-nav-admin-console-btn"
              onClick={() => handleNavClick('admin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 10,
                border: activeTab === 'admin' ? '1px solid #facc15' : '1px solid transparent',
                background: activeTab === 'admin' ? '#2b2416' : (isDark ? '#231d1a' : '#2b2725'),
                color: '#fef08a',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <ShieldCheck size={18} color="#facc15" />
                <span>Admin Operations Console</span>
              </div>
              <ChevronRight size={15} color="#facc15" />
            </button>
          ) : (
            <button
              id="mobile-nav-admin-portal-link"
              onClick={handleAdminAuthClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 10,
                border: 'none',
                background: 'transparent',
                color: isDark ? '#a8a09a' : '#8b837e',
                fontSize: 12,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <ShieldCheck size={16} />
                <span>Admin Operations Portal</span>
              </div>
              <ChevronRight size={14} />
            </button>
          )}
        </nav>

        {/* Drawer Bottom Actions: Cart & Theme Mode */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: isDark ? '1px solid #332822' : '1px solid #eee8e3',
            background: isDark ? '#1e1815' : '#faf8f6',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {/* Quick View Cart Button */}
          <button
            id="mobile-sidebar-cart-btn"
            onClick={handleCartClick}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '11px 16px',
              borderRadius: 10,
              background: '#c92722',
              color: '#ffffff',
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(201, 39, 34, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingBag size={17} />
              <span>Review Order Cart</span>
            </div>
            <span
              style={{
                background: 'rgba(255, 255, 255, 0.25)',
                padding: '2px 8px',
                borderRadius: 999,
                fontSize: 11,
              }}
            >
              {cartCount} {cartCount === 1 ? 'item' : 'items'}
            </span>
          </button>

          {/* Theme Mode Toggle Button */}
          <button
            id="mobile-sidebar-theme-btn"
            onClick={toggleTheme}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: 10,
              background: isDark ? '#261f1c' : '#ffffff',
              border: isDark ? '1px solid #443730' : '1px solid #ded8d2',
              color: isDark ? '#fef08a' : '#574f4a',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isDark ? <Sun size={16} color="#facc15" /> : <Moon size={16} color="#3d3734" />}
              <span>{isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: isDark ? '#facc15' : '#c92722',
              }}
            >
              {isDark ? 'Dark Active' : 'Light Active'}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};
