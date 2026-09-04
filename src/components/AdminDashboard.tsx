import React, { useState, useEffect } from 'react';
import type {
  InventoryItem,
  Order,
  AdminEmailLog,
  CronStats,
  OrderStatus,
  RbacAuditLog,
  PortStatusResponse,
  RbacMatrixResponse,
} from '../types.js';
import { api } from '../api/client.js';
import {
  Package,
  ShoppingBag,
  BellRing,
  RotateCcw,
  Plus,
  Minus,
  ChefHat,
  Bike,
  CheckCircle,
  Clock,
  Flame,
  AlertTriangle,
  Play,
  Mail,
  Search,
  ShieldCheck,
  ShieldAlert,
  Server,
  Terminal,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Database,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'alerts' | 'rbac'>('orders');
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [emailLogs, setEmailLogs] = useState<AdminEmailLog[]>([]);
  const [cronStats, setCronStats] = useState<CronStats | null>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);


  // RBAC & Ports state
  const [rbacLogs, setRbacLogs] = useState<RbacAuditLog[]>([]);
  const [portsStatus, setPortsStatus] = useState<PortStatusResponse | null>(null);
  const [rbacMatrix, setRbacMatrix] = useState<RbacMatrixResponse | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [actionMsg, setActionMsg] = useState<string>('');
  const [customNote, setCustomNote] = useState<Record<string, string>>({});

  useEffect(() => {
    loadAllData();
    // Poll orders, stats, and rbac logs every 4 seconds in admin view
    const interval = setInterval(() => {
      refreshOrdersAndStats();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [statsRes, invRes, ordersRes, alertsRes, portsRes, matrixRes, logsRes, dbRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminInventory(),
        api.getAdminOrders(),
        api.getAdminAlerts(),
        api.getPortsStatus(),
        api.getRbacMatrix(),
        api.getRbacLogs(),
        api.getDbStatus().catch(() => null),
      ]);

      setStats(statsRes);
      setInventory(invRes.inventory);
      setOrders(ordersRes.orders);
      setEmailLogs(alertsRes.logs);
      setCronStats(alertsRes.cronStats);
      setPortsStatus(portsRes);
      setRbacMatrix(matrixRes);
      setRbacLogs(logsRes.logs);
      if (dbRes?.db) {
        setDbStatus(dbRes.db);
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshOrdersAndStats = async () => {
    try {
      const [statsRes, ordersRes, logsRes, dbRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminOrders(),
        api.getRbacLogs().catch(() => ({ logs: [] })),
        api.getDbStatus().catch(() => null),
      ]);
      setStats(statsRes);
      setOrders(ordersRes.orders);
      if (logsRes && logsRes.logs) {
        setRbacLogs(logsRes.logs);
      }
      if (dbRes?.db) {
        setDbStatus(dbRes.db);
      }
    } catch (err) {
      console.error('Silent admin refresh failed:', err);
    }
  };


  const handleUpdateStock = async (id: string, newStock: number) => {
    try {
      const res = await api.updateInventoryItem(id, { stock: Math.max(0, newStock) });
      setInventory((prev) => prev.map((item) => (item.id === id ? res.item : item)));
      setActionMsg(`Updated ${res.item.name} stock to ${res.item.stock} ${res.item.unit}`);
      setTimeout(() => setActionMsg(''), 3000);

      // Refresh stats in case low stock count changed
      const updatedStats = await api.getAdminStats();
      setStats(updatedStats);
    } catch (err: any) {
      alert(err.message || 'Failed to update stock');
    }
  };

  const handleUpdateThreshold = async (id: string, newThreshold: number) => {
    try {
      const res = await api.updateInventoryItem(id, { threshold: Math.max(1, newThreshold) });
      setInventory((prev) => prev.map((item) => (item.id === id ? res.item : item)));
      setActionMsg(`Updated alert threshold for ${res.item.name} to ${res.item.threshold}`);
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update threshold');
    }
  };

  const handleTriggerCheckNow = async () => {
    try {
      setActionMsg('Running automated stock threshold check...');
      const res = await api.triggerStockCheckNow();
      setActionMsg(`Scan complete: ${res.result.alertsSent} alert(s) dispatched to admin.`);
      setTimeout(() => setActionMsg(''), 4000);

      // Refresh alerts and stats
      const alertsRes = await api.getAdminAlerts();
      setEmailLogs(alertsRes.logs);
      setCronStats(alertsRes.cronStats);
      const statsRes = await api.getAdminStats();
      setStats(statsRes);
    } catch (err: any) {
      alert(err.message || 'Check failed');
    }
  };

  const handleRestockAll = async () => {
    if (!confirm('Reset all inventory items back to full factory levels?')) return;
    try {
      const res = await api.restockAllInventory();
      setInventory(res.inventory);
      setActionMsg('All inventory restocked to factory levels.');
      setTimeout(() => setActionMsg(''), 3500);

      const statsRes = await api.getAdminStats();
      setStats(statsRes);
    } catch (err: any) {
      alert(err.message || 'Restock failed');
    }
  };

  const handleSimulateCrossPort = async () => {
    try {
      setSimulating(true);
      setSimulationResult(null);
      const res = await api.simulateCrossPortTest('customer@sliceandfire.com');
      setSimulationResult(res);
      // Refresh audit logs
      const updatedLogs = await api.getRbacLogs();
      setRbacLogs(updatedLogs.logs);
      setActionMsg('Simulated RBAC breach attempt logged to audit trail.');
      setTimeout(() => setActionMsg(''), 4000);
    } catch (err: any) {
      setSimulationResult({
        error: err.message || 'Simulation test failed',
        status: 403,
        simulated: true,
      });
    } finally {
      setSimulating(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const note = customNote[orderId] || undefined;
    try {
      const res = await api.updateOrderStatus(orderId, status, note);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? res.order : o)));
      setActionMsg(`Order #${orderId} moved to '${status}'. User tracker updated!`);
      setTimeout(() => setActionMsg(''), 3500);

      const statsRes = await api.getAdminStats();
      setStats(statsRes);
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  // Filtered inventories
  const filteredInventory = inventory.filter((item) => {
    const matchesCat = filterCategory === 'all' || item.category === filterCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === 'all') return true;
    return o.status === orderStatusFilter;
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#736d68' }}>
        <Flame size={36} color="#c92722" style={{ margin: '0 auto 12px' }} />
        <p>Opening Kitchen Command Console...</p>
      </div>
    );
  }

  return (
    <div id="admin-dashboard" style={{ maxWidth: 1240, margin: '0 auto', padding: '20px 0' }}>
      {/* Top Bar / Role Indicator */}
      <div
        style={{
          background: '#1f1b19',
          color: '#fff',
          borderRadius: 16,
          padding: '24px 28px',
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
            <span
              style={{
                background: '#ca8a04',
                color: '#000',
                fontSize: 10,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 4,
              }}
            >
              ADMINISTRATOR &bull; KITCHEN DISPATCH
            </span>
            <span style={{ fontSize: 11, color: '#a8a29e' }}>Automated Cron: Active (*/10 min)</span>
            <span
              id="admin-supabase-db-badge"
              style={{
                background: dbStatus?.isConnected ? '#14532d' : '#3f2214',
                color: dbStatus?.isConnected ? '#86efac' : '#fdba74',
                border: `1px solid ${dbStatus?.isConnected ? '#22c55e' : '#ea580c'}`,
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
              title={dbStatus?.message || 'Supabase PostgreSQL Config'}
            >
              <Database size={10} />
              {dbStatus?.isConnected
                ? 'Supabase: Connected'
                : `Supabase: ${dbStatus?.host || 'db.hblppudxqlpggwwyypld.supabase.co'} (Configured)`}
            </span>
          </div>
          <h1 style={{ margin: '4px 0', fontSize: 24, color: '#fef08a' }}>Pizzeria Operations &amp; Inventory Hub</h1>

          <p style={{ margin: 0, fontSize: 12, color: '#d6d3d1' }}>
            Real-time control for ingredient stock thresholds, kitchen status progression, and notification logs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            id="admin-check-now-btn"
            onClick={handleTriggerCheckNow}
            style={{
              background: '#332c28',
              color: '#fef08a',
              border: '1px solid #574b45',
              padding: '10px 16px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <Play size={13} fill="#fef08a" /> Run Stock Check Now
          </button>

          <button
            id="admin-restock-all-btn"
            onClick={handleRestockAll}
            style={{
              background: '#c92722',
              color: '#fff',
              border: 'none',
              padding: '10px 16px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={13} /> Factory Restock All
          </button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionMsg && (
        <div
          style={{
            background: '#fef3c7',
            border: '1px solid #fde047',
            color: '#854d0e',
            padding: '12px 18px',
            borderRadius: 8,
            marginBottom: 20,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {actionMsg}
        </div>
      )}

      {/* KPI Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e7e2de' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#736d68', fontSize: 11, fontWeight: 700 }}>
            <span>ACTIVE KITCHEN ORDERS</span>
            <ShoppingBag size={16} color="#c92722" />
          </div>
          <h2 style={{ margin: '8px 0 2px', fontSize: 28, color: '#2b2725' }}>{stats?.activeOrders ?? 0}</h2>
          <span style={{ fontSize: 11, color: '#888' }}>{stats?.totalOrders ?? 0} total lifetime orders</span>
        </div>

        <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e7e2de' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#736d68', fontSize: 11, fontWeight: 700 }}>
            <span>TOTAL REVENUE (PAID)</span>
            <Flame size={16} color="#16a34a" />
          </div>
          <h2 style={{ margin: '8px 0 2px', fontSize: 28, color: '#16a34a' }}>
            ${stats?.totalRevenue ? stats.totalRevenue.toFixed(2) : '0.00'}
          </h2>
          <span style={{ fontSize: 11, color: '#888' }}>Verified Razorpay transactions</span>
        </div>

        <div
          style={{
            background: stats?.lowStockCount > 0 ? '#fffdf7' : '#fff',
            padding: 20,
            borderRadius: 12,
            border: stats?.lowStockCount > 0 ? '2px solid #eab308' : '1px solid #e7e2de',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#736d68', fontSize: 11, fontWeight: 700 }}>
            <span>LOW STOCK ITEMS</span>
            <AlertTriangle size={16} color={stats?.lowStockCount > 0 ? '#eab308' : '#6b7280'} />
          </div>
          <h2 style={{ margin: '8px 0 2px', fontSize: 28, color: stats?.lowStockCount > 0 ? '#ca8a04' : '#2b2725' }}>
            {stats?.lowStockCount ?? 0}
          </h2>
          <span style={{ fontSize: 11, color: '#888' }}>Items at or below notification threshold</span>
        </div>

        <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e7e2de' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#736d68', fontSize: 11, fontWeight: 700 }}>
            <span>AUTOMATED CRON ALERTS</span>
            <BellRing size={16} color="#0284c7" />
          </div>
          <h2 style={{ margin: '8px 0 2px', fontSize: 28, color: '#0284c7' }}>{stats?.alertsSentCount ?? 0}</h2>
          <span style={{ fontSize: 11, color: '#888' }}>
            Cron runs: {cronStats?.totalRuns ?? 0} &bull; Check: */10m
          </span>
        </div>

        <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e7e2de' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#736d68', fontSize: 11, fontWeight: 700 }}>
            <span>SUPABASE POSTGRESQL</span>
            <Database size={16} color={dbStatus?.isConnected ? '#16a34a' : '#d97706'} />
          </div>
          <h2 style={{ margin: '8px 0 2px', fontSize: 20, color: dbStatus?.isConnected ? '#16a34a' : '#b45309' }}>
            {dbStatus?.isConnected ? 'Live & Synced' : 'Configured'}
          </h2>
          <span style={{ fontSize: 11, color: '#888' }} title={dbStatus?.host}>
            Port: {dbStatus?.port || 5432} &bull; DB: {dbStatus?.database || 'postgres'}
          </span>
        </div>
      </div>


      {/* Main Tab Controller */}
      <div style={{ display: 'flex', gap: 10, borderBottom: '2px solid #e8e3df', marginBottom: 20, paddingBottom: 6 }}>
        <button
          id="admin-tab-orders"
          onClick={() => setActiveTab('orders')}
          style={{
            background: 'none',
            border: 'none',
            padding: '8px 16px',
            fontSize: 14,
            fontWeight: activeTab === 'orders' ? 800 : 500,
            color: activeTab === 'orders' ? '#c92722' : '#736d68',
            borderBottom: activeTab === 'orders' ? '3px solid #c92722' : 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <ShoppingBag size={16} /> Order Management Panel ({orders.length})
        </button>

        <button
          id="admin-tab-inventory"
          onClick={() => setActiveTab('inventory')}
          style={{
            background: 'none',
            border: 'none',
            padding: '8px 16px',
            fontSize: 14,
            fontWeight: activeTab === 'inventory' ? 800 : 500,
            color: activeTab === 'inventory' ? '#c92722' : '#736d68',
            borderBottom: activeTab === 'inventory' ? '3px solid #c92722' : 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Package size={16} /> Inventory Dashboard &amp; Stock Controls ({inventory.length})
        </button>

        <button
          id="admin-tab-alerts"
          onClick={() => setActiveTab('alerts')}
          style={{
            background: 'none',
            border: 'none',
            padding: '8px 16px',
            fontSize: 14,
            fontWeight: activeTab === 'alerts' ? 800 : 500,
            color: activeTab === 'alerts' ? '#c92722' : '#736d68',
            borderBottom: activeTab === 'alerts' ? '3px solid #c92722' : 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Mail size={16} /> Automated Email Outbox ({emailLogs.length})
        </button>

        <button
          id="admin-tab-rbac"
          onClick={() => setActiveTab('rbac')}
          style={{
            background: 'none',
            border: 'none',
            padding: '8px 16px',
            fontSize: 14,
            fontWeight: activeTab === 'rbac' ? 800 : 500,
            color: activeTab === 'rbac' ? '#ca8a04' : '#736d68',
            borderBottom: activeTab === 'rbac' ? '3px solid #ca8a04' : 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <ShieldAlert size={16} color={activeTab === 'rbac' ? '#ca8a04' : '#736d68'} /> Multi-Port &amp; RBAC Monitor ({rbacLogs.length})
        </button>
      </div>

      {/* TAB 1: ORDER MANAGEMENT PANEL */}
      {activeTab === 'orders' && (
        <div id="admin-orders-panel">
          {/* Filters */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['all', 'Order Received', 'In Kitchen', 'Sent to Delivery', 'Delivered'].map((status) => (
                <button
                  key={status}
                  id={`admin-order-filter-${status.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => setOrderStatusFilter(status)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 999,
                    fontSize: 12,
                    border: orderStatusFilter === status ? '1px solid #c92722' : '1px solid #ddd',
                    background: orderStatusFilter === status ? '#c92722' : '#fff',
                    color: orderStatusFilter === status ? '#fff' : '#444',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {status === 'all' ? 'All Orders' : status}
                </button>
              ))}
            </div>

            <span style={{ fontSize: 12, color: '#888' }}>
              Showing {filteredOrders.length} order{filteredOrders.length === 1 ? '' : 's'}
            </span>
          </div>

          {filteredOrders.length === 0 ? (
            <div style={{ background: '#fff', padding: 40, borderRadius: 12, textAlign: 'center', color: '#888' }}>
              No orders found matching this status filter.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  id={`admin-order-row-${order.id}`}
                  style={{
                    background: '#fff',
                    borderRadius: 14,
                    border: '1px solid #e5dfda',
                    padding: 22,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      borderBottom: '1px solid #f0ebe6',
                      paddingBottom: 14,
                      marginBottom: 14,
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <h3 style={{ margin: 0, fontSize: 17 }}>Order #{order.id}</h3>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: 999,
                            background:
                              order.status === 'Delivered'
                                ? '#dcfce7'
                                : order.status === 'Sent to Delivery'
                                ? '#e0f2fe'
                                : order.status === 'In Kitchen'
                                ? '#fef3c7'
                                : '#fee2e2',
                            color:
                              order.status === 'Delivered'
                                ? '#166534'
                                : order.status === 'Sent to Delivery'
                                ? '#0369a1'
                                : order.status === 'In Kitchen'
                                ? '#92400e'
                                : '#b91c1c',
                          }}
                        >
                          {order.status}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: order.paymentStatus === 'PAID' ? '#dcfce7' : '#fee2e2',
                            color: order.paymentStatus === 'PAID' ? '#166534' : '#b91c1c',
                          }}
                        >
                          {order.paymentStatus}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: '#888' }}>
                        Customer: <b>{order.customerName}</b> ({order.customerEmail}) &bull; Phone:{' '}
                        {order.customerPhone} &bull; Placed at {new Date(order.createdAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 11, color: '#888' }}>Total Bill</span>
                      <b style={{ display: 'block', fontSize: 18, color: '#c92722' }}>
                        ${order.total.toFixed(2)}
                      </b>
                    </div>
                  </div>

                  {/* Destination & Items breakdown */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 320px) 1fr', gap: 16, marginBottom: 16 }}>
                    <div style={{ background: '#faf8f6', padding: 12, borderRadius: 8, fontSize: 12 }}>
                      <span style={{ color: '#888', display: 'block', marginBottom: 2 }}>Destination Address:</span>
                      <b style={{ color: '#333' }}>{order.deliveryAddress}</b>
                    </div>

                    <div style={{ background: '#faf8f6', padding: 12, borderRadius: 8, fontSize: 12 }}>
                      <span style={{ color: '#888', display: 'block', marginBottom: 4 }}>Pies in Ticket:</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {order.items.map((it) => (
                          <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {it.imageUrl ? (
                                <img
                                  src={it.imageUrl}
                                  alt={it.name}
                                  referrerPolicy="no-referrer"
                                  style={{ width: 22, height: 22, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
                                />
                              ) : (
                                <span style={{ fontSize: 11 }}>🍕</span>
                              )}
                              <span>
                                <b>{it.quantity}x</b> {it.name}{' '}
                                {it.description && <small style={{ color: '#777' }}>({it.description})</small>}
                              </span>
                            </div>
                            <span style={{ color: '#555', flexShrink: 0 }}>${(it.price * it.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Prompt requirement: Order management panel: Update status for each order: In Kitchen, Sent to Delivery, Delivered */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid #f0ebe6',
                      paddingTop: 14,
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 260 }}>
                      <input
                        type="text"
                        placeholder="Optional kitchen note (e.g. 'Extra basil added, leaving hearth')"
                        value={customNote[order.id] || ''}
                        onChange={(e) => setCustomNote({ ...customNote, [order.id]: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: 6,
                          border: '1px solid #dcd5cf',
                          fontSize: 11,
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        id={`status-btn-kitchen-${order.id}`}
                        onClick={() => handleUpdateOrderStatus(order.id, 'In Kitchen')}
                        disabled={order.status === 'In Kitchen'}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 8,
                          background: order.status === 'In Kitchen' ? '#fef3c7' : '#f5f3f0',
                          color: order.status === 'In Kitchen' ? '#92400e' : '#444',
                          border: '1px solid #ded8d3',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        <ChefHat size={14} /> Move to Kitchen
                      </button>

                      <button
                        id={`status-btn-delivery-${order.id}`}
                        onClick={() => handleUpdateOrderStatus(order.id, 'Sent to Delivery')}
                        disabled={order.status === 'Sent to Delivery'}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 8,
                          background: order.status === 'Sent to Delivery' ? '#e0f2fe' : '#f5f3f0',
                          color: order.status === 'Sent to Delivery' ? '#0369a1' : '#444',
                          border: '1px solid #ded8d3',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        <Bike size={14} /> Send to Delivery
                      </button>

                      <button
                        id={`status-btn-delivered-${order.id}`}
                        onClick={() => handleUpdateOrderStatus(order.id, 'Delivered')}
                        disabled={order.status === 'Delivered'}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 8,
                          background: order.status === 'Delivered' ? '#dcfce7' : '#16a34a',
                          color: order.status === 'Delivered' ? '#166534' : '#fff',
                          border: 'none',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        <CheckCircle size={14} /> Mark Delivered
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INVENTORY DASHBOARD & STOCK CONTROLLER */}
      {activeTab === 'inventory' && (
        <div id="admin-inventory-panel">
          {/* Controls & Search */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 18,
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All Ingredients' },
                { id: 'base', label: 'Pizza Bases (5)' },
                { id: 'sauce', label: 'Sauces (5)' },
                { id: 'cheese', label: 'Cheeses (5)' },
                { id: 'vegetable', label: 'Vegetables (10)' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  id={`admin-inv-cat-${cat.id}`}
                  onClick={() => setFilterCategory(cat.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 999,
                    fontSize: 12,
                    border: filterCategory === cat.id ? '1px solid #c92722' : '1px solid #ddd',
                    background: filterCategory === cat.id ? '#c92722' : '#fff',
                    color: filterCategory === cat.id ? '#fff' : '#444',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: 240 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#999' }} />
              <input
                type="text"
                placeholder="Search inventory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px 8px 30px',
                  borderRadius: 8,
                  border: '1px solid #dcd5cf',
                  fontSize: 12,
                }}
              />
            </div>
          </div>

          {/* Inventory Table / Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: 16,
            }}
          >
            {filteredInventory.map((item) => {
              const isLow = item.stock <= item.threshold;
              const isOut = item.stock <= 0;
              const maxScale = Math.max(item.threshold * 3, item.stock + 10);
              const percentage = Math.min(100, Math.round((item.stock / maxScale) * 100));

              return (
                <div
                  key={item.id}
                  id={`admin-inv-item-${item.id}`}
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    border: isLow ? '2px solid #eab308' : '1px solid #e7e2de',
                    padding: 18,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <b style={{ fontSize: 14, color: '#2b2725' }}>{item.name}</b>
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              background: '#f3f4f6',
                              color: '#4b5563',
                              padding: '2px 6px',
                              borderRadius: 4,
                              textTransform: 'uppercase',
                            }}
                          >
                            {item.category}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, color: '#78716c' }}>{item.description}</span>
                      </div>

                      {isLow && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            background: isOut ? '#fee2e2' : '#fef3c7',
                            color: isOut ? '#b91c1c' : '#92400e',
                            padding: '3px 8px',
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <AlertTriangle size={11} /> {isOut ? 'DEPLETED' : 'LOW STOCK'}
                        </span>
                      )}
                    </div>

                    {/* Stock Meter */}
                    <div style={{ margin: '14px 0 10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                        <span>
                          Current Stock: <b style={{ color: isLow ? '#ca8a04' : '#16a34a' }}>{item.stock} {item.unit}</b>
                        </span>
                        <span style={{ color: '#888' }}>Threshold: {item.threshold} {item.unit}</span>
                      </div>

                      <div style={{ height: 8, background: '#f0edea', borderRadius: 999, overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${percentage}%`,
                            background: isOut ? '#ef4444' : isLow ? '#eab308' : '#16a34a',
                            borderRadius: 999,
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Manual Stock Adjusters */}
                  <div
                    style={{
                      borderTop: '1px solid #f2eee9',
                      paddingTop: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button
                        onClick={() => handleUpdateStock(item.id, item.stock - 1)}
                        title="Reduce stock by 1"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          border: '1px solid #dcd5cf',
                          background: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <Minus size={13} />
                      </button>

                      <input
                        type="number"
                        value={item.stock}
                        onChange={(e) => handleUpdateStock(item.id, parseInt(e.target.value) || 0)}
                        style={{
                          width: 52,
                          padding: '4px 6px',
                          borderRadius: 6,
                          border: '1px solid #dcd5cf',
                          fontSize: 12,
                          textAlign: 'center',
                          fontWeight: 700,
                        }}
                      />

                      <button
                        onClick={() => handleUpdateStock(item.id, item.stock + 5)}
                        title="Add 5 units"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          border: '1px solid #dcd5cf',
                          background: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                      <span style={{ color: '#888' }}>Alert at:</span>
                      <input
                        type="number"
                        value={item.threshold}
                        onChange={(e) => handleUpdateThreshold(item.id, parseInt(e.target.value) || 1)}
                        style={{
                          width: 44,
                          padding: '4px 4px',
                          borderRadius: 6,
                          border: '1px solid #dcd5cf',
                          fontSize: 11,
                          textAlign: 'center',
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: AUTOMATED EMAIL NOTIFICATION OUTBOX */}
      {activeTab === 'alerts' && (
        <div id="admin-alerts-panel">
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '16px 20px',
              marginBottom: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <Clock size={16} color="#0284c7" />
                <b style={{ fontSize: 13, color: '#0f172a' }}>Background Node-Cron Monitor Specification</b>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                Schedule: <code>*/10 * * * *</code> (Every 10 minutes). Checks all 25 ingredients against their configurable threshold.
                Sends HTML alert via Nodemailer to <code>admin@sliceandfire.com</code> when depleted.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ textAlign: 'right', fontSize: 11, color: '#64748b' }}>
                <div>Total automated scans: <b>{cronStats?.totalRuns ?? 0}</b></div>
                <div>Last alert dispatched: <b>{cronStats?.lastAlertSent ? new Date(cronStats.lastAlertSent).toLocaleTimeString() : 'None yet'}</b></div>
              </div>

              <button
                onClick={handleTriggerCheckNow}
                className="primary"
                style={{ fontSize: 12, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Play size={13} /> Trigger Check Now
              </button>
            </div>
          </div>

          {emailLogs.length === 0 ? (
            <div style={{ background: '#fff', padding: 40, borderRadius: 12, textAlign: 'center', color: '#888' }}>
              <Mail size={32} color="#cbd5e1" style={{ margin: '0 auto 8px' }} />
              <p style={{ margin: 0 }}>No automated email alerts dispatched yet.</p>
              <small>Alerts are generated when ingredients fall below their configured threshold.</small>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {emailLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: 18,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            background: '#fee2e2',
                            color: '#b91c1c',
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 4,
                          }}
                        >
                          DISPATCHED BY CRON
                        </span>
                        <b style={{ fontSize: 14, color: '#0f172a' }}>{log.subject}</b>
                      </div>
                      <span style={{ fontSize: 11, color: '#64748b' }}>
                        To: {log.recipient} &bull; Triggered by: <b>{log.triggeredByItem}</b> (Stock: {log.currentStock} &le; {log.threshold})
                      </span>
                    </div>

                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div
                    style={{
                      background: '#f8fafc',
                      padding: 12,
                      borderRadius: 8,
                      border: '1px solid #f1f5f9',
                      fontSize: 11,
                      fontFamily: 'monospace',
                      color: '#334155',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.5,
                    }}
                  >
                    {log.body}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MULTI-PORT ARCHITECTURE & RBAC MONITOR */}
      {activeTab === 'rbac' && (
        <div id="admin-rbac-panel" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Section Header */}
          <div
            style={{
              background: '#fff',
              padding: 20,
              borderRadius: 12,
              border: '1px solid #e2ddd8',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span
                  style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}
                >
                  ZERO-TRUST RBAC SECURITY
                </span>
                <span style={{ fontSize: 11, color: '#78716c' }}>Enforcement: Strict Port &amp; Role Isolation</span>
              </div>
              <h2 style={{ margin: 0, fontSize: 20, color: '#1c1917' }}>
                {portsStatus?.architecture || 'Dual-Port Architecture with RBAC'}
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#78716c' }}>
                Separation of concerns enforced by listening on two independent network ports (Port {portsStatus?.clientService.port || 3000} &amp; Port {portsStatus?.adminService.port || 3001}) across roles: {rbacMatrix ? rbacMatrix.roles.join(', ') : 'CUSTOMER, ADMIN'}.
              </p>
            </div>

            <button
              id="admin-rbac-refresh-btn"
              onClick={loadAllData}
              style={{
                background: '#f5f3f0',
                border: '1px solid #dcd5d0',
                color: '#2b2725',
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={13} /> Refresh RBAC Status
            </button>
          </div>

          {/* Dual Port Service Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {/* Port 3000 Card */}
            <div
              id="card-port-3000"
              style={{
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #d1fae5',
                padding: 20,
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: '#dcfce7',
                      color: '#15803d',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Server size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <b style={{ fontSize: 16, color: '#166534' }}>Port 3000 &bull; Client Service</b>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#22c55e',
                          boxShadow: '0 0 8px #22c55e',
                        }}
                      />
                    </div>
                    <small style={{ color: '#15803d', fontWeight: 600 }}>STATUS: ONLINE (0.0.0.0:3000)</small>
                  </div>
                </div>
                <span
                  style={{
                    background: '#f0fdf4',
                    color: '#166534',
                    border: '1px solid #bbf7d0',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 999,
                  }}
                >
                  ROLE: CUSTOMER
                </span>
              </div>

              <p style={{ fontSize: 12, color: '#4b5563', margin: '0 0 12px', lineHeight: 1.5 }}>
                Public-facing eCommerce storefront. Serves artisan pizza menu, pizza builder flow, cart, Razorpay payment processing, and live order tracking.
              </p>

              <div style={{ background: '#f9fafb', padding: 12, borderRadius: 8, fontSize: 11, color: '#374151' }}>
                <b style={{ display: 'block', marginBottom: 4, color: '#111827' }}>🔒 RBAC Enforcement:</b>
                <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.6 }}>
                  <li>Primary Role: <code>CUSTOMER</code></li>
                  <li>Login Endpoint: <code>POST /api/auth/login</code></li>
                  <li>Admin accounts attempting login are blocked and routed to Port 3001</li>
                </ul>
              </div>
            </div>

            {/* Port 3001 Card */}
            <div
              id="card-port-3001"
              style={{
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #fed7aa',
                padding: 20,
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: '#ffedd5',
                      color: '#c2410c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <b style={{ fontSize: 16, color: '#9a3412' }}>Port 3001 &bull; Admin Operations</b>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#f97316',
                          boxShadow: '0 0 8px #f97316',
                        }}
                      />
                    </div>
                    <small style={{ color: '#c2410c', fontWeight: 600 }}>STATUS: ONLINE (0.0.0.0:3001)</small>
                  </div>
                </div>
                <span
                  style={{
                    background: '#fff7ed',
                    color: '#c2410c',
                    border: '1px solid #fed7aa',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 999,
                  }}
                >
                  ROLE: ADMIN ONLY
                </span>
              </div>

              <p style={{ fontSize: 12, color: '#4b5563', margin: '0 0 12px', lineHeight: 1.5 }}>
                Restricted kitchen operations console. Controls real-time pizza inventory stocks, manual/automated restock triggers, kitchen dispatch, and cron alerts.
              </p>

              <div style={{ background: '#f9fafb', padding: 12, borderRadius: 8, fontSize: 11, color: '#374151' }}>
                <b style={{ display: 'block', marginBottom: 4, color: '#111827' }}>🔒 RBAC Enforcement:</b>
                <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.6 }}>
                  <li>Strict Role Required: <code>ADMIN</code></li>
                  <li>Login Endpoint: <code>POST /api/admin/auth/login</code></li>
                  <li>Non-admin tokens or roles are blocked with HTTP 403 Forbidden</li>
                </ul>
              </div>
            </div>
          </div>

          {/* RBAC Permission Matrix */}
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #e2ddd8',
              padding: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            }}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#1c1917' }}>Role-Based Access Control Matrix</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f8f6f4', textAlign: 'left', borderBottom: '1px solid #e2ddd8' }}>
                    <th style={{ padding: '10px 14px' }}>Action / Resource Capability</th>
                    <th style={{ padding: '10px 14px' }}>Target Port</th>
                    <th style={{ padding: '10px 14px' }}>CUSTOMER Role</th>
                    <th style={{ padding: '10px 14px' }}>ADMIN Role</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f0ece9' }}>
                    <td style={{ padding: '10px 14px' }}>Browse Artisan Menu &amp; Ingredients</td>
                    <td style={{ padding: '10px 14px' }}>Port 3000</td>
                    <td style={{ padding: '10px 14px', color: '#16a34a', fontWeight: 700 }}>✅ Allowed</td>
                    <td style={{ padding: '10px 14px', color: '#16a34a', fontWeight: 700 }}>✅ Allowed</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f0ece9' }}>
                    <td style={{ padding: '10px 14px' }}>Custom Pizza Builder Flow (5 Bases, Sauces, Cheeses, Veggies)</td>
                    <td style={{ padding: '10px 14px' }}>Port 3000</td>
                    <td style={{ padding: '10px 14px', color: '#16a34a', fontWeight: 700 }}>✅ Allowed</td>
                    <td style={{ padding: '10px 14px', color: '#16a34a', fontWeight: 700 }}>✅ Allowed</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f0ece9' }}>
                    <td style={{ padding: '10px 14px' }}>Order Placement &amp; Razorpay Checkout</td>
                    <td style={{ padding: '10px 14px' }}>Port 3000</td>
                    <td style={{ padding: '10px 14px', color: '#16a34a', fontWeight: 700 }}>✅ Allowed</td>
                    <td style={{ padding: '10px 14px', color: '#16a34a', fontWeight: 700 }}>✅ Allowed</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f0ece9' }}>
                    <td style={{ padding: '10px 14px' }}>Access Admin Operations Server</td>
                    <td style={{ padding: '10px 14px' }}>Port 3001</td>
                    <td style={{ padding: '10px 14px', color: '#dc2626', fontWeight: 700 }}>🚫 Denied (403 Forbidden)</td>
                    <td style={{ padding: '10px 14px', color: '#16a34a', fontWeight: 700 }}>✅ Allowed</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f0ece9' }}>
                    <td style={{ padding: '10px 14px' }}>Update Ingredient Stocks &amp; Alert Thresholds</td>
                    <td style={{ padding: '10px 14px' }}>Port 3001</td>
                    <td style={{ padding: '10px 14px', color: '#dc2626', fontWeight: 700 }}>🚫 Denied (403 Forbidden)</td>
                    <td style={{ padding: '10px 14px', color: '#16a34a', fontWeight: 700 }}>✅ Allowed</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f0ece9' }}>
                    <td style={{ padding: '10px 14px' }}>Advance Kitchen Order Status (Received &rarr; Delivered)</td>
                    <td style={{ padding: '10px 14px' }}>Port 3001</td>
                    <td style={{ padding: '10px 14px', color: '#dc2626', fontWeight: 700 }}>🚫 Denied (403 Forbidden)</td>
                    <td style={{ padding: '10px 14px', color: '#16a34a', fontWeight: 700 }}>✅ Allowed</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 14px' }}>Trigger Factory Inventory Restock &amp; Run Stock Cron</td>
                    <td style={{ padding: '10px 14px' }}>Port 3001</td>
                    <td style={{ padding: '10px 14px', color: '#dc2626', fontWeight: 700 }}>🚫 Denied (403 Forbidden)</td>
                    <td style={{ padding: '10px 14px', color: '#16a34a', fontWeight: 700 }}>✅ Allowed</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Cross-Port Simulation Tester */}
          <div
            style={{
              background: '#1f1b19',
              color: '#fff',
              borderRadius: 12,
              border: '1px solid #3d3532',
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <b style={{ fontSize: 15, color: '#fef08a' }}>Interactive Cross-Port RBAC Breach Simulation</b>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#a8a29e' }}>
                  Simulate a CUSTOMER attempting to execute restricted administrative commands on Port 3001.
                </p>
              </div>

              <button
                id="simulate-rbac-breach-btn"
                onClick={handleSimulateCrossPort}
                disabled={simulating}
                style={{
                  background: '#ca8a04',
                  color: '#000',
                  border: 'none',
                  padding: '9px 16px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <Terminal size={14} />
                {simulating ? 'Sending Request to Port 3001...' : 'Simulate Customer Request to Port 3001'}
              </button>
            </div>

            {simulationResult && (
              <div
                style={{
                  background: '#292524',
                  borderRadius: 8,
                  border: '1px solid #44403c',
                  padding: 14,
                  fontSize: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <XCircle size={16} color="#ef4444" />
                  <b style={{ color: '#fca5a5' }}>
                    HTTP {simulationResult.status} Forbidden - RBAC Policy Enforced!
                  </b>
                </div>
                <div
                  style={{
                    background: '#141210',
                    padding: 10,
                    borderRadius: 6,
                    fontFamily: 'monospace',
                    fontSize: 11,
                    color: '#fed7aa',
                  }}
                >
                  {JSON.stringify(simulationResult, null, 2)}
                </div>
              </div>
            )}
          </div>

          {/* Live RBAC Audit Log */}
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #e2ddd8',
              padding: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, color: '#1c1917' }}>Live RBAC Security Audit Trail</h3>
                <small style={{ color: '#78716c' }}>
                  Logging authorization events, role checks, and cross-port violations in real-time.
                </small>
              </div>
              <span
                style={{
                  background: '#f5f3f0',
                  color: '#44403c',
                  padding: '4px 10px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {rbacLogs.length} Events Recorded
              </span>
            </div>

            {rbacLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: '#78716c', fontSize: 12 }}>
                No security audit events recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
                {rbacLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      background: log.outcome === 'DENIED' ? '#fff1f2' : '#f0fdf4',
                      border: log.outcome === 'DENIED' ? '1px solid #fecdd3' : '1px solid #bbf7d0',
                      borderRadius: 8,
                      padding: 12,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {log.outcome === 'DENIED' ? (
                        <XCircle size={18} color="#dc2626" />
                      ) : (
                        <CheckCircle2 size={18} color="#16a34a" />
                      )}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span
                            style={{
                              background: log.outcome === 'DENIED' ? '#fee2e2' : '#dcfce7',
                              color: log.outcome === 'DENIED' ? '#991b1b' : '#166534',
                              fontSize: 10,
                              fontWeight: 800,
                              padding: '1px 6px',
                              borderRadius: 4,
                            }}
                          >
                            {log.outcome}
                          </span>
                          <span
                            style={{
                              background: log.port === 3001 ? '#fed7aa' : '#e0e7ff',
                              color: log.port === 3001 ? '#9a3412' : '#3730a3',
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: 4,
                            }}
                          >
                            PORT :{log.port}
                          </span>
                          <b style={{ fontSize: 12, color: '#1c1917' }}>Role: {log.role}</b>
                          {log.userEmail && (
                            <span style={{ fontSize: 11, color: '#64748b' }}>({log.userEmail})</span>
                          )}
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#334155' }}>
                          <b>Action:</b> <code>{log.action}</code> &bull; {log.reason}
                        </p>
                      </div>
                    </div>

                    <span style={{ fontSize: 10, color: '#94a3b8' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
