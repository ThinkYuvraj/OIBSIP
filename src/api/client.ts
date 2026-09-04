import type {
  User,
  ArtisanPizza,
  InventoryItem,
  Order,
  AdminEmailLog,
  CronStats,
  RbacAuditLog,
  PortStatusResponse,
  RbacMatrixResponse,
} from '../types.js';

const API_BASE = (import.meta.env.VITE_API_URL
  ? `${String(import.meta.env.VITE_API_URL).replace(/\/$/, '')}/api`
  : '/api');

export function getStoredToken(): string | null {
  return localStorage.getItem('slice_fire_token');
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem('slice_fire_token', token);
  } else {
    localStorage.removeItem('slice_fire_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg) as any;
    err.data = data;
    err.status = response.status;
    throw err;
  }

  return data as T;
}

export const api = {
  // Auth
  register: (payload: { name: string; email: string; password: string }) =>
    request<{ message: string; userId: string; email: string; verificationCode: string; verificationLink: string }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify(payload) }
    ),

  verifyEmail: (payload: { email: string; code: string }) =>
    request<{ message: string; token: string; user: User }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  resendVerification: (email: string) =>
    request<{ message: string; verificationCode: string }>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  login: (payload: { email: string; password: string }) =>
    request<{ message: string; token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  googleLogin: (payload: { idToken: string }) =>
    request<{ message?: string; token: string; user: User }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  adminLogin: (payload: { email: string; password: string }) =>
    request<{ message: string; token: string; user: User }>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  forgotPassword: (email: string) =>
    request<{ message: string; resetToken?: string; resetLink?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (payload: { token: string; newPassword: string }) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () => request<User>('/auth/me'),

  updateTheme: (theme: 'light' | 'dark') =>
    request<{ message: string; theme: 'light' | 'dark'; user?: User }>('/auth/theme', {
      method: 'PATCH',
      body: JSON.stringify({ theme }),
    }),

  // Menu & Builder

  getPizzas: () => request<{ pizzas: ArtisanPizza[] }>('/pizzas'),

  getBuilderOptions: () =>
    request<{
      bases: InventoryItem[];
      sauces: InventoryItem[];
      cheeses: InventoryItem[];
      vegetables: InventoryItem[];
      rules: any;
    }>('/pizzas/builder-options'),

  // Orders
  createOrder: (payload: {
    items: any[];
    deliveryAddress: string;
    customerPhone?: string;
    couponCode?: string;
  }) => request<{ message: string; order: Order }>('/orders', { method: 'POST', body: JSON.stringify(payload) }),

  getMyOrders: () => request<{ orders: Order[] }>('/orders/my-orders'),

  getOrderById: (orderId: string) => request<{ order: Order }>(`/orders/${orderId}`),

  // Payments (Razorpay)
  createRazorpayOrder: (orderId: string) =>
    request<{
      razorpayOrderId: string;
      amount: number;
      currency: string;
      displayAmount: number;
      keyId: string;
      customer: { name: string; email: string; phone: string };
    }>('/payments/create-order', { method: 'POST', body: JSON.stringify({ orderId }) }),

  verifyPayment: (payload: {
    orderId: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    isTestSuccess?: boolean;
  }) => request<{ success: boolean; message: string; order: Order }>('/payments/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Admin
  getAdminStats: () =>
    request<{
      totalOrders: number;
      activeOrders: number;
      totalRevenue: number;
      lowStockCount: number;
      totalInventoryItems: number;
      alertsSentCount: number;
      cronStats: CronStats;
    }>('/admin/stats'),

  getAdminInventory: () => request<{ inventory: InventoryItem[] }>('/admin/inventory'),

  updateInventoryItem: (id: string, updates: { stock?: number; threshold?: number; price?: number }) =>
    request<{ message: string; item: InventoryItem }>(`/admin/inventory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  triggerStockCheckNow: () =>
    request<{ message: string; result: any; stats: CronStats }>('/admin/inventory/check-now', {
      method: 'POST',
    }),

  restockAllInventory: () =>
    request<{ message: string; inventory: InventoryItem[] }>('/admin/inventory/restock', {
      method: 'POST',
    }),

  getAdminAlerts: () => request<{ logs: AdminEmailLog[]; cronStats: CronStats }>('/admin/inventory/alerts'),

  getAdminOrders: () => request<{ orders: Order[] }>('/admin/orders'),

  updateOrderStatus: (id: string, status: string, note?: string) =>
    request<{ message: string; order: Order }>(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    }),

  // Dual-Port & RBAC Diagnostics
  getPortsStatus: () => request<PortStatusResponse>('/ports-status'),

  getDbStatus: () => request<{ status: string; db: any; timestamp: string }>('/db-status'),

  getRbacMatrix: () => request<RbacMatrixResponse>('/admin/rbac/matrix'),

  getRbacLogs: () => request<{ port: number; roleRequired: string; logs: RbacAuditLog[] }>('/admin/rbac/logs'),

  simulateCrossPortTest: (email?: string) =>
    request<{
      error: string;
      simulated: boolean;
      message: string;
      port: number;
      userRole: string;
      requiredRole: string;
      status: number;
      timestamp: string;
    }>('/admin/rbac/simulate-cross-port-test', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};
