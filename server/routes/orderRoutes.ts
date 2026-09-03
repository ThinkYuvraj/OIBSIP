import { Router, Response } from 'express';
import { db, Order, OrderItem } from '../db.js';
import { authenticateToken, AuthRequest } from '../auth.js';

const router = Router();

// Create new order (Pending Payment)
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { items, deliveryAddress, customerPhone, couponCode } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Order must contain at least one item' });
      return;
    }

    if (!deliveryAddress || deliveryAddress.trim().length < 5) {
      res.status(400).json({ error: 'A valid delivery address is required' });
      return;
    }

    const user = req.user!;
    const dbUser = db.findUserById(user.id);
    const customerName = dbUser ? dbUser.name : user.name;
    const customerEmail = dbUser ? dbUser.email : user.email;

    // Calculate subtotal accurately from items
    let subtotal = 0;
    const sanitizedItems: OrderItem[] = items.map((item: any, idx: number) => {
      const price = Number(item.price) || 0;
      const quantity = Math.max(1, Number(item.quantity) || 1);
      subtotal += price * quantity;
      return {
        id: item.id || `item-${Date.now()}-${idx}`,
        name: item.name || 'Artisan Pie',
        isCustom: !!item.isCustom,
        price,
        quantity,
        customDetails: item.customDetails,
      };
    });

    // Discount coupon check
    let discount = 0;
    if (couponCode) {
      const code = couponCode.trim().toUpperCase();
      if (code === 'PIZZA20') {
        discount = subtotal * 0.20; // 20% discount
      } else if (code === 'FIRE10') {
        discount = subtotal * 0.10; // 10% discount
      }
    }

    const deliveryFee = (subtotal - discount) >= 45 ? 0 : 3.50;
    const tax = (subtotal - discount) * 0.08;
    const total = Number(((subtotal - discount) + deliveryFee + tax).toFixed(2));

    const orderId = `ord-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      id: orderId,
      userId: user.id,
      customerName,
      customerEmail,
      customerPhone: customerPhone || '(555) 019-4821',
      deliveryAddress: deliveryAddress.trim(),
      items: sanitizedItems,
      subtotal: Number(subtotal.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      deliveryFee: Number(deliveryFee.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      total,
      paymentStatus: 'PENDING',
      status: 'Order Received',
      statusHistory: [
        {
          status: 'Order Received',
          timestamp: new Date().toISOString(),
          note: 'Order created, awaiting payment verification.',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.addOrder(newOrder);

    res.status(201).json({
      message: 'Order created successfully',
      order: newOrder,
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Server error while creating order' });
  }
});

// Get user orders
router.get('/my-orders', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const orders = db.getOrdersByUser(userId);
  res.json({ orders });
});

// Get single order details (for real-time order tracking)
router.get('/:id', (req: AuthRequest, res: Response) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  res.json({ order });
});

export default router;
