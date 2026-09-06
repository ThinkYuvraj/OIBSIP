export type UserRole = 'CUSTOMER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  theme?: 'light' | 'dark';
  createdAt?: string;
}


export type InventoryCategory = 'base' | 'sauce' | 'cheese' | 'vegetable';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  stock: number;
  unit: string;
  threshold: number;
  price: number;
  description: string;
  badge?: string;
}

export interface ArtisanPizza {
  id: string;
  name: string;
  description: string;
  price: number;
  color: string;
  rating: string;
  category: string;
  imageUrl?: string;
  recipe: {
    baseId: string;
    sauceId: string;
    cheeseId: string;
    vegetableIds: string[];
  };
  isAvailable?: boolean;
  missingIngredients?: string[];
}

export interface CustomPizzaSelection {
  base: InventoryItem | null;
  sauce: InventoryItem | null;
  cheese: InventoryItem | null;
  vegetables: InventoryItem[];
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  isCustom: boolean;
  color?: string;
  imageUrl?: string;
  description?: string;
  customDetails?: {
    baseName: string;
    sauceName: string;
    cheeseName: string;
    vegetableNames: string[];
  };
}

export type OrderStatus = 'Order Received' | 'In Kitchen' | 'Sent to Delivery' | 'Delivered' | 'Cancelled';

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  total: number;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  status: OrderStatus;
  statusHistory: { status: OrderStatus; timestamp: string; note?: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminEmailLog {
  id: string;
  timestamp: string;
  recipient: string;
  subject: string;
  body: string;
  triggeredByItem: string;
  currentStock: number;
  threshold: number;
}

export interface CronStats {
  lastRun: string | null;
  totalRuns: number;
  lastAlertSent: string | null;
}

export interface RbacAuditLog {
  id: string;
  timestamp: string;
  port: number;
  role: UserRole | 'ANONYMOUS' | 'INVALID';
  userEmail?: string;
  action: string;
  outcome: 'ALLOWED' | 'DENIED';
  reason: string;
}

export interface PortServiceInfo {
  port: number;
  status: 'ONLINE' | 'OFFLINE';
  allowedRole?: string;
  primaryRole?: string;
  service?: string;
  description: string;
}

export interface PortStatusResponse {
  architecture: string;
  clientService: PortServiceInfo;
  adminService: PortServiceInfo;
  rbac: {
    enforced: boolean;
    roles: UserRole[];
    permissions?: Record<string, string[]>;
  };
}

export interface RbacMatrixResponse {
  ports: {
    CLIENT_PORT: number;
    ADMIN_PORT: number;
  };
  roles: UserRole[];
  permissions: Record<UserRole, string[]>;
  portAllocation: {
    client: PortServiceInfo;
    admin: PortServiceInfo;
  };
}

