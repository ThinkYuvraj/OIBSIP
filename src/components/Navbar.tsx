import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import {
  Pizza,
  ShoppingBag,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  Clock,
  Flame,
  Sun,
  Moon,
  Menu,
} from 'lucide-react';
import { MobileSidebar } from './MobileSidebar.js';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cartCount: number;
  openCart: () => void;
  openAuth: () => void;
  openAdminAuth: () => void;
  activeOrderCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="header" id="main-header">
        <button
          id="brand-home-btn"
          className="brand"
          onClick={() => setActiveTab('home')}
          style={{ cursor: 'pointer', flexShrink: 0 }}
        >
          <div
            style={{
              width: 32,
              height: 32,
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
          <div className="brand-text">
            <b style={{ color: isDark ? '#f5f2ee' : '#282321' }}>Slice &amp; Fire</b>
            <small style={{ color: isDark ? '#a8a09a' : '#6e6966' }}>Artisan Wood-Fired &bull; Level 3</small>
          </div>
        </button>

        {/* Desktop Navigation (hidden on mobile/tablet via CSS) */}
        <nav className="desktop-nav" style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          <button
            id="nav-home-btn"
            className={activeTab === 'home' ? 'active' : ''}
            onClick={() => setActiveTab('home')}
            style={{ color: activeTab === 'home' ? '#c92722' : (isDark ? '#d6cfc7' : '#3d3734') }}
          >
            Home
          </button>

          <button
            id="nav-menu-btn"
            className={activeTab === 'menu' ? 'active' : ''}
            onClick={() => setActiveTab('menu')}
            style={{ color: activeTab === 'menu' ? '#c92722' : (isDark ? '#d6cfc7' : '#3d3734') }}
          >
            Artisan Menu
          </button>

          <button
            id="nav-builder-btn"
            className={activeTab === 'builder' ? 'active' : ''}
            onClick={() => setActiveTab('builder')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: activeTab === 'builder' ? (isDark ? '#3d1c18' : '#fee2e2') : (isDark ? '#261f1c' : '#f5f3f0'),
              color: activeTab === 'builder' ? '#c92722' : (isDark ? '#f5f2ee' : '#2b2725'),
              padding: '5px 12px',
              borderRadius: 999,
              fontWeight: 700,
              border: activeTab === 'builder' ? '1px solid #f87171' : (isDark ? '1px solid #3d342e' : '1px solid #e7e2de'),
              whiteSpace: 'nowrap',
            }}
          >
            <Pizza size={14} /> Custom Pie Builder
          </button>

          <button
            id="nav-tracker-btn"
            className={activeTab === 'tracker' ? 'active' : ''}
            onClick={() => setActiveTab('tracker')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              position: 'relative',
              whiteSpace: 'nowrap',
            }}
          >
            <Clock size={13} /> Order Tracker
            {activeOrderCount > 0 && (
              <span
                style={{
                  background: '#16a34a',
                  color: '#fff',
                  borderRadius: 999,
                  fontSize: 9,
                  padding: '1px 6px',
                  fontWeight: 700,
                }}
              >
                {activeOrderCount} live
              </span>
            )}
          </button>

          {isAdmin ? (
            <button
              id="nav-admin-dashboard-btn"
              className={activeTab === 'admin' ? 'active' : ''}
              onClick={() => setActiveTab('admin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: '#2b2725',
                color: '#fef08a',
                padding: '5px 12px',
                borderRadius: 999,
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              <ShieldCheck size={14} color="#facc15" /> Admin Console
            </button>
          ) : (
            <button
              id="nav-admin-portal-link"
              onClick={openAdminAuth}
              style={{
                color: isDark ? '#a8a09a' : '#8b837e',
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                whiteSpace: 'nowrap',
              }}
            >
              <ShieldCheck size={12} /> Admin Portal
            </button>
          )}
        </nav>

        <div className="header-actions">
          {/* Global Theme Toggle Button */}
          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              background: isDark ? '#261f1c' : '#f5f3f0',
              color: isDark ? '#fef08a' : '#574f4a',
              border: isDark ? '1px solid #443730' : '1px solid #ded9d5',
              borderRadius: 999,
              padding: '6px 11px',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
          >
            {isDark ? (
              <>
                <Sun size={14} color="#facc15" />
                <span className="theme-label" style={{ fontSize: 11, fontWeight: 700 }}>Light</span>
              </>
            ) : (
              <>
                <Moon size={14} color="#3d3734" />
                <span className="theme-label" style={{ fontSize: 11, fontWeight: 700 }}>Dark</span>
              </>
            )}
          </button>

          {/* User Profile / Customer Sign In (Desktop only; on mobile accessible via drawer) */}
          <div className="desktop-auth">
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    fontSize: 12,
                    color: isDark ? '#f5f2ee' : '#2b2725',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <UserIcon size={14} color="#c92722" />
                  {user.name.split(' ')[0]}
                  {user.role === 'ADMIN' && (
                    <span
                      style={{
                        fontSize: 9,
                        background: '#2b2725',
                        color: '#fef08a',
                        padding: '2px 6px',
                        borderRadius: 4,
                      }}
                    >
                      ADMIN
                    </span>
                  )}
                </span>
                <button
                  id="user-logout-btn"
                  onClick={logout}
                  title="Logout"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: isDark ? '#a8a09a' : '#8b837e',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 4,
                    cursor: 'pointer',
                  }}
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button id="header-signin-btn" className="sign-in" onClick={openAuth}>
                Customer Sign In
              </button>
            )}
          </div>

          {/* Cart Pill */}
          <button id="header-cart-pill" className="cart-pill" onClick={openCart} style={{ flexShrink: 0 }}>
            <ShoppingBag size={12} style={{ display: 'inline', marginRight: 4 }} />
            Cart ({cartCount})
          </button>

          {/* Mobile & Tablet Hamburger Menu Toggle Button */}
          <button
            id="mobile-menu-toggle-btn"
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open navigation sidebar"
            title="Menu"
          >
            <Menu size={19} />
            {activeOrderCount > 0 && (
              <span className="mobile-menu-badge">{activeOrderCount}</span>
            )}
          </button>
        </div>
      </header>

      {/* Dedicated Mobile & Tablet Slide-Over Sidebar Drawer */}
      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cartCount}
        openCart={openCart}
        openAuth={openAuth}
        openAdminAuth={openAdminAuth}
        activeOrderCount={activeOrderCount}
      />
    </>
  );
};
