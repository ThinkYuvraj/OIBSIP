import fs from 'fs';
import path from 'path';
import { db as pgDb } from '../src/db/index.ts';
import { orders as pgOrders, inventory as pgInventory } from '../src/db/schema.ts';
import { eq } from 'drizzle-orm';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'CUSTOMER' | 'ADMIN';
  isVerified: boolean;
  verificationCode?: string;
  resetToken?: string;
  resetTokenExpiry?: number;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'base' | 'sauce' | 'cheese' | 'vegetable';
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
}

export interface CustomPizzaConfig {
  base: InventoryItem;
  sauce: InventoryItem;
  cheese: InventoryItem;
  vegetables: InventoryItem[];
  calculatedPrice: number;
  quantity: number;
}

export type OrderStatus = 'Order Received' | 'In Kitchen' | 'Sent to Delivery' | 'Delivered' | 'Cancelled';

export interface OrderItem {
  id: string;
  name: string;
  isCustom: boolean;
  price: number;
  quantity: number;
  customDetails?: {
    baseName: string;
    sauceName: string;
    cheeseName: string;
    vegetableNames: string[];
  };
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  items: OrderItem[];
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

export interface DBState {
  users: User[];
  inventory: InventoryItem[];
  pizzas: ArtisanPizza[];
  orders: Order[];
  emailLogs: AdminEmailLog[];
  cronStats: {
    lastRun: string | null;
    totalRuns: number;
    lastAlertSent: string | null;
  };
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

// Initial seed data
const initialInventory: InventoryItem[] = [
  // 5 Pizza Bases
  { id: 'base-1', name: 'Classic Thin Crust', category: 'base', stock: 45, unit: 'crusts', threshold: 20, price: 12.0, description: 'Light, crispy & blistered at 900°F', badge: 'Popular' },
  { id: 'base-2', name: 'Neapolitan Hand-Tossed', category: 'base', stock: 18, unit: 'crusts', threshold: 20, price: 13.5, description: 'Airy cornicione with charred leopard spots', badge: 'Low Stock' },
  { id: 'base-3', name: 'Cheese Burst Double Crust', category: 'base', stock: 30, unit: 'crusts', threshold: 15, price: 15.5, description: 'Stuffed molten artisan mozzarella ring', badge: 'Indulgent' },
  { id: 'base-4', name: 'Pan Style Deep Crust', category: 'base', stock: 25, unit: 'crusts', threshold: 15, price: 14.0, description: 'Golden buttery crust with tender crumb' },
  { id: 'base-5', name: 'Gluten-Free Cauliflower Herb Crust', category: 'base', stock: 16, unit: 'crusts', threshold: 20, price: 16.0, description: 'Grain-free herb crust with rosemary & sea salt', badge: 'Low Stock' },

  // 5 Sauces
  { id: 'sauce-1', name: 'San Marzano Classic Marinara', category: 'sauce', stock: 60, unit: 'ladles', threshold: 20, price: 0.0, description: 'Sun-ripened Italian plum tomatoes & sweet basil', badge: 'Classic' },
  { id: 'sauce-2', name: 'Spicy Calabrian Arrabiata', category: 'sauce', stock: 35, unit: 'ladles', threshold: 15, price: 0.5, description: 'Fiery crushed red chili & garlic tomato sauce', badge: 'Spicy' },
  { id: 'sauce-3', name: 'Truffle Garlic Cream', category: 'sauce', stock: 14, unit: 'ladles', threshold: 20, price: 1.5, description: 'Mascarpone, wild mushroom essence & white truffle', badge: 'Low Stock' },
  { id: 'sauce-4', name: 'Basil Pistachio Pesto', category: 'sauce', stock: 28, unit: 'ladles', threshold: 15, price: 1.25, description: 'Genovese basil, roasted pistachios & cold-pressed EVOO' },
  { id: 'sauce-5', name: 'Smoky Bourbon Chipotle BBQ', category: 'sauce', stock: 32, unit: 'ladles', threshold: 15, price: 0.75, description: 'Hickory smoke, dark molasses & chipotle peppers' },

  // Cheeses
  { id: 'cheese-1', name: 'Fresh Fior di Latte Mozzarella', category: 'cheese', stock: 55, unit: 'portions', threshold: 20, price: 0.0, description: 'Milky, delicate artisanal hand-torn cheese', badge: 'Default' },
  { id: 'cheese-2', name: 'Buffalo Mozzarella DOC', category: 'cheese', stock: 22, unit: 'portions', threshold: 15, price: 2.0, description: 'Rich, creamy water buffalo milk mozzarella' },
  { id: 'cheese-3', name: 'Four Cheese Quattro Blend', category: 'cheese', stock: 26, unit: 'portions', threshold: 15, price: 2.5, description: 'Mozzarella, Gorgonzola, aged Parmesan & Provolone' },
  { id: 'cheese-4', name: 'Aged Sharp Smoked Cheddar', category: 'cheese', stock: 19, unit: 'portions', threshold: 20, price: 1.75, description: 'Aged 12 months with natural applewood smoke', badge: 'Low Stock' },
  { id: 'cheese-5', name: 'Plant-Based Almond Melt', category: 'cheese', stock: 24, unit: 'portions', threshold: 15, price: 2.25, description: '100% vegan dairy-free artisan melt' },

  // Vegetables
  { id: 'veg-1', name: 'Crisp Bell Peppers', category: 'vegetable', stock: 50, unit: 'cups', threshold: 20, price: 1.0, description: 'Tri-color crunchy sweet bell peppers' },
  { id: 'veg-2', name: 'Kalamata Black Olives', category: 'vegetable', stock: 40, unit: 'cups', threshold: 15, price: 1.25, description: 'Brined Mediterranean dark black olives' },
  { id: 'veg-3', name: 'Pickled Jalapeños', category: 'vegetable', stock: 35, unit: 'cups', threshold: 15, price: 1.0, description: 'Zesty fire-pickled chili slices' },
  { id: 'veg-4', name: 'Wild Button Mushrooms', category: 'vegetable', stock: 17, unit: 'cups', threshold: 20, price: 1.5, description: 'Earthy sliced crimini & button mushrooms', badge: 'Low Stock' },
  { id: 'veg-5', name: 'Caramelized Red Onions', category: 'vegetable', stock: 45, unit: 'cups', threshold: 15, price: 1.0, description: 'Slow-braised sweet balsamic red onions' },
  { id: 'veg-6', name: 'Sweet Charred Corn', category: 'vegetable', stock: 38, unit: 'cups', threshold: 15, price: 1.0, description: 'Wood-fired kernel sweetness' },
  { id: 'veg-7', name: 'Sun-Dried Tomatoes', category: 'vegetable', stock: 29, unit: 'cups', threshold: 15, price: 1.5, description: 'Chewy savory herb-marinated tomatoes' },
  { id: 'veg-8', name: 'Fresh Genovese Basil Leaves', category: 'vegetable', stock: 65, unit: 'bunches', threshold: 25, price: 0.75, description: 'Aromatic farm-fresh whole basil leaves' },
  { id: 'veg-9', name: 'Roasted Garlic Cloves', category: 'vegetable', stock: 33, unit: 'cups', threshold: 15, price: 1.0, description: 'Buttery tender caramelized garlic cloves' },
  { id: 'veg-10', name: 'Baby Spinach Leaves', category: 'vegetable', stock: 28, unit: 'cups', threshold: 15, price: 1.0, description: 'Tender baby greens wilted to perfection' },
];

const initialPizzas: ArtisanPizza[] = [
  {
    id: 'pizza-1',
    name: 'Margherita DOC',
    description: 'San Marzano tomatoes, fresh fior di latte mozzarella, aromatic basil & EVOO.',
    price: 14.5,
    color: '#a5261e',
    rating: '4.9 (142)',
    category: 'Classics',
    imageUrl: '/images/pizza-margherita.jpg',
    recipe: { baseId: 'base-2', sauceId: 'sauce-1', cheeseId: 'cheese-1', vegetableIds: ['veg-8'] },
  },
  {
    id: 'pizza-2',
    name: 'Diavola Fire',
    description: 'Fiery Calabrian arrabiata, mozzarella, spicy pickled jalapeños & charred peppers.',
    price: 16.0,
    color: '#a63b1d',
    rating: '4.8 (198)',
    category: 'Spicy',
    imageUrl: '/images/pizza-diavola.jpg',
    recipe: { baseId: 'base-1', sauceId: 'sauce-2', cheeseId: 'cheese-1', vegetableIds: ['veg-1', 'veg-3'] },
  },
  {
    id: 'pizza-3',
    name: 'White Truffle Crema',
    description: 'Truffle garlic cream, mozzarella, wild crimini mushrooms & caramelized onions.',
    price: 18.5,
    color: '#473b22',
    rating: '4.9 (116)',
    category: 'Specialty',
    imageUrl: '/images/pizza-truffle.jpg',
    recipe: { baseId: 'base-1', sauceId: 'sauce-3', cheeseId: 'cheese-1', vegetableIds: ['veg-4', 'veg-5'] },
  },
  {
    id: 'pizza-4',
    name: 'Pistachio Pesto Verde',
    description: 'Pistachio basil pesto, buffalo mozzarella, sun-dried tomatoes & baby spinach.',
    price: 17.5,
    color: '#51684c',
    rating: '4.7 (89)',
    category: 'Vegetarian',
    imageUrl: '/images/pizza-pesto.jpg',
    recipe: { baseId: 'base-2', sauceId: 'sauce-4', cheeseId: 'cheese-2', vegetableIds: ['veg-7', 'veg-10'] },
  },
  {
    id: 'pizza-5',
    name: 'Quattro Formaggi Grand',
    description: 'Four cheese decadence: Fior di latte, Gorgonzola, aged Parmesan & smoked provolone.',
    price: 17.5,
    color: '#ab762b',
    rating: '4.8 (134)',
    category: 'Cheesy',
    imageUrl: '/images/pizza-quattro.jpg',
    recipe: { baseId: 'base-3', sauceId: 'sauce-1', cheeseId: 'cheese-3', vegetableIds: ['veg-8'] },
  },
  {
    id: 'pizza-6',
    name: 'Garden Primavera',
    description: 'Gluten-free herb base, marinara, bell peppers, olives, mushrooms & roasted garlic.',
    price: 18.0,
    color: '#34523e',
    rating: '4.9 (92)',
    category: 'Vegetarian',
    imageUrl: '/images/pizza-primavera.jpg',
    recipe: { baseId: 'base-5', sauceId: 'sauce-1', cheeseId: 'cheese-5', vegetableIds: ['veg-1', 'veg-2', 'veg-4', 'veg-9'] },
  },
];

class Database {
  private state: DBState = {
    users: [],
    inventory: [],
    pizzas: [],
    orders: [],
    emailLogs: [],
    cronStats: {
      lastRun: null,
      totalRuns: 0,
      lastAlertSent: null,
    },
  };

  constructor() {
    this.load();
  }

  private ensureDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  public load() {
    this.ensureDir();
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        const loadedPizzas: ArtisanPizza[] = (parsed.pizzas || initialPizzas).map((p: ArtisanPizza) => {
          const defaultRef = initialPizzas.find((initP) => initP.id === p.id);
          return {
            ...p,
            imageUrl: p.imageUrl || defaultRef?.imageUrl || '/images/pizza-margherita.jpg',
          };
        });

        this.state = {
          users: parsed.users || [],
          inventory: parsed.inventory || initialInventory,
          pizzas: loadedPizzas,
          orders: parsed.orders || [],
          emailLogs: parsed.emailLogs || [],
          cronStats: parsed.cronStats || { lastRun: null, totalRuns: 0, lastAlertSent: null },
        };
        this.save();
        return;
      } catch (err) {
        console.error('Failed to parse existing store.json, re-initializing seed data', err);
      }
    }

    // Default initialization
    this.state = {
      users: [],
      inventory: initialInventory,
      pizzas: initialPizzas,
      orders: [],
      emailLogs: [],
      cronStats: {
        lastRun: null,
        totalRuns: 0,
        lastAlertSent: null,
      },
    };
    this.save();
  }

  public save() {
    this.ensureDir();
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing to database store file:', err);
    }
  }

  // Users
  public getUsers(): User[] {
    return this.state.users;
  }

  public findUserByEmail(email: string): User | undefined {
    return this.state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): User | undefined {
    return this.state.users.find((u) => u.id === id);
  }

  public addUser(user: User): User {
    this.state.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.state.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    this.state.users[idx] = { ...this.state.users[idx], ...updates };
    this.save();
    return this.state.users[idx];
  }

  // Inventory
  public getInventory(): InventoryItem[] {
    return this.state.inventory;
  }

  public getInventoryItem(id: string): InventoryItem | undefined {
    return this.state.inventory.find((item) => item.id === id);
  }

  public updateInventoryItem(id: string, updates: Partial<InventoryItem>): InventoryItem | undefined {
    const idx = this.state.inventory.findIndex((item) => item.id === id);
    if (idx === -1) return undefined;
    this.state.inventory[idx] = { ...this.state.inventory[idx], ...updates };
    this.save();

    // Async sync to Cloud SQL PostgreSQL
    try {
      const current = this.state.inventory[idx];
      pgDb.update(pgInventory)
        .set({
          stock: current.stock,
          threshold: current.threshold,
          price: (Number(current.price) || 0).toFixed(2),
        })
        .where(eq(pgInventory.id, id))
        .catch((e) => console.warn('[CloudSQL Inventory Sync]', e.message));
    } catch {
      // Non-blocking
    }

    return this.state.inventory[idx];
  }

  public resetInventory() {
    this.state.inventory = JSON.parse(JSON.stringify(initialInventory));
    this.save();
  }

  // Pizzas
  public getPizzas(): ArtisanPizza[] {
    return this.state.pizzas;
  }

  // Orders
  public getOrders(): Order[] {
    return this.state.orders;
  }

  public getOrdersByUser(userId: string): Order[] {
    return this.state.orders.filter((o) => o.userId === userId);
  }

  public getOrderById(id: string): Order | undefined {
    return this.state.orders.find((o) => o.id === id);
  }

  public addOrder(order: Order): Order {
    this.state.orders.unshift(order);
    this.save();

    // Async sync to Cloud SQL PostgreSQL
    try {
      pgDb.insert(pgOrders)
        .values({
          id: order.id,
          userId: order.userId,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone || '',
          deliveryAddress: order.deliveryAddress,
          items: order.items,
          subtotal: (Number(order.subtotal) || 0).toFixed(2),
          discount: (Number(order.discount) || 0).toFixed(2),
          deliveryFee: (Number(order.deliveryFee) || 0).toFixed(2),
          tax: (Number(order.tax) || 0).toFixed(2),
          total: (Number(order.total) || 0).toFixed(2),
          paymentStatus: order.paymentStatus || 'PENDING',
          razorpayOrderId: order.razorpayOrderId || null,
          razorpayPaymentId: order.razorpayPaymentId || null,
          status: order.status || 'Order Received',
          statusHistory: order.statusHistory || [],
          estimatedDeliveryMinutes: 35,
        })
        .onConflictDoUpdate({
          target: pgOrders.id,
          set: {
            status: order.status,
            paymentStatus: order.paymentStatus,
            statusHistory: order.statusHistory,
          },
        })
        .catch((e) => console.warn('[CloudSQL Order Sync]', e.message));
    } catch {
      // Non-blocking
    }

    return order;
  }

  public updateOrderStatus(id: string, status: OrderStatus, note?: string): Order | undefined {
    const order = this.getOrderById(id);
    if (!order) return undefined;
    order.status = status;
    order.updatedAt = new Date().toISOString();
    order.statusHistory.push({
      status,
      timestamp: new Date().toISOString(),
      note: note || `Order marked as ${status}`,
    });
    this.save();

    try {
      pgDb.update(pgOrders)
        .set({
          status: order.status,
          statusHistory: order.statusHistory,
        })
        .where(eq(pgOrders.id, id))
        .catch((e) => console.warn('[CloudSQL Status Sync]', e.message));
    } catch {
      // Non-blocking
    }

    return order;
  }

  public updateOrder(id: string, updates: Partial<Order>): Order | undefined {
    const idx = this.state.orders.findIndex((o) => o.id === id);
    if (idx === -1) return undefined;
    this.state.orders[idx] = { ...this.state.orders[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();

    const order = this.state.orders[idx];
    try {
      pgDb.update(pgOrders)
        .set({
          status: order.status,
          paymentStatus: order.paymentStatus,
          statusHistory: order.statusHistory,
          razorpayPaymentId: order.razorpayPaymentId || null,
          razorpayOrderId: order.razorpayOrderId || null,
        })
        .where(eq(pgOrders.id, id))
        .catch((e) => console.warn('[CloudSQL Order Update Sync]', e.message));
    } catch {
      // Non-blocking
    }

    return this.state.orders[idx];
  }

  // Email Logs
  public getEmailLogs(): AdminEmailLog[] {
    return this.state.emailLogs;
  }

  public addEmailLog(log: AdminEmailLog) {
    this.state.emailLogs.unshift(log);
    if (this.state.emailLogs.length > 100) {
      this.state.emailLogs = this.state.emailLogs.slice(0, 100);
    }
    this.save();
  }

  // Cron stats
  public getCronStats() {
    return this.state.cronStats;
  }

  public updateCronStats(updates: Partial<DBState['cronStats']>) {
    this.state.cronStats = { ...this.state.cronStats, ...updates };
    this.save();
  }
}

export const db = new Database();
