import { pgTable, serial, text, timestamp, integer, numeric, jsonb } from 'drizzle-orm/pg-core';

// Users table (synced with Firebase Auth)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('CUSTOMER').notNull(),
  theme: text('theme').default('light').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});


// Inventory stock items table
export const inventory = pgTable('inventory', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  stock: integer('stock').notNull().default(0),
  threshold: integer('threshold').notNull().default(5),
  unit: text('unit').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull().default('0.00'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Artisan pizzas catalog table
export const pizzas = pgTable('pizzas', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  description: text('description').notNull(),
  color: text('color').notNull(),
  rating: text('rating').notNull(),
  category: text('category').notNull(),
  imageUrl: text('image_url'),
  recipe: jsonb('recipe').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Orders table
export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  customerPhone: text('customer_phone'),
  deliveryAddress: text('delivery_address').notNull(),
  items: jsonb('items').notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  discount: numeric('discount', { precision: 10, scale: 2 }).default('0.00'),
  deliveryFee: numeric('delivery_fee', { precision: 10, scale: 2 }).default('0.00'),
  tax: numeric('tax', { precision: 10, scale: 2 }).default('0.00'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  paymentStatus: text('payment_status').notNull().default('PENDING'),
  razorpayOrderId: text('razorpay_order_id'),
  razorpayPaymentId: text('razorpay_payment_id'),
  status: text('status').notNull().default('Order Received'),
  statusHistory: jsonb('status_history').notNull(),
  estimatedDeliveryMinutes: integer('estimated_delivery_minutes').default(35),
  createdAt: timestamp('created_at').defaultNow(),
});

// Email dispatch logs table
export const emailLogs = pgTable('email_logs', {
  id: text('id').primaryKey(),
  timestamp: timestamp('timestamp').defaultNow(),
  type: text('type').notNull(),
  recipient: text('recipient').notNull(),
  subject: text('subject').notNull(),
  details: jsonb('details'),
  status: text('status').notNull(),
});
