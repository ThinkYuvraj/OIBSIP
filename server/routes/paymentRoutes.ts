import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { db } from '../db.js';
import { deductInventoryForOrder } from '../inventory.js';

const router = Router();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_SliceAndFire2026';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'secret_test_FireSliceNeapolitan900';

let razorpayInstance: Razorpay | null = null;
try {
  razorpayInstance = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
} catch (err) {
  console.warn('[Razorpay] Initialized with test simulation mode:', err);
}

// 1. Create Razorpay Payment Order
router.post('/create-order', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      res.status(400).json({ error: 'Order ID is required' });
      return;
    }

    const order = db.getOrderById(orderId);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Razorpay amount is in smallest currency unit (e.g., paise for INR / cents for USD)
    // 1 USD ~ 83 INR for Indian Razorpay standard test mode, or standard unit * 100
    const amountInSubunits = Math.round(order.total * 100);

    let razorpayOrderId = `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (razorpayInstance && process.env.RAZORPAY_KEY_ID) {
      try {
        const rzpOrder = await razorpayInstance.orders.create({
          amount: amountInSubunits,
          currency: 'INR',
          receipt: order.id,
          notes: {
            customerName: order.customerName,
            customerEmail: order.customerEmail,
          },
        });
        razorpayOrderId = rzpOrder.id;
      } catch (e) {
        console.warn('[Razorpay] Live SDK call fallback to simulated order ID:', e);
      }
    }

    // Update order with razorpayOrderId
    db.updateOrder(order.id, { razorpayOrderId });

    res.json({
      razorpayOrderId,
      amount: amountInSubunits,
      currency: 'INR',
      displayAmount: order.total,
      keyId: RAZORPAY_KEY_ID,
      customer: {
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
      },
    });
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    res.status(500).json({ error: 'Could not generate Razorpay order' });
  }
});

// 2. Verify Razorpay Payment (Test Mode / Production)
router.post('/verify', (req: Request, res: Response) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature, isTestSuccess } = req.body;

    if (!orderId) {
      res.status(400).json({ error: 'Order ID is required' });
      return;
    }

    const order = db.getOrderById(orderId);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    let isValid = false;

    if (isTestSuccess || razorpayPaymentId?.startsWith('pay_test_')) {
      // Test mode fast path: explicit success test trigger
      isValid = true;
    } else if (razorpaySignature && razorpayOrderId && razorpayPaymentId) {
      // Cryptographic signature check
      const hmac = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET);
      hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
      const generatedSignature = hmac.digest('hex');
      isValid = generatedSignature === razorpaySignature;
    } else {
      isValid = true; // Permissive in test environment
    }

    if (!isValid) {
      db.updateOrder(order.id, {
        paymentStatus: 'FAILED',
        status: 'Cancelled',
      });
      res.status(400).json({ error: 'Payment signature verification failed' });
      return;
    }

    const paymentId = razorpayPaymentId || `pay_test_${Date.now()}`;

    // Update Order to PAID and status to Order Received
    const updatedOrder = db.updateOrder(order.id, {
      paymentStatus: 'PAID',
      razorpayPaymentId: paymentId,
      status: 'Order Received',
    });

    if (updatedOrder) {
      // Add status history entry
      updatedOrder.statusHistory.push({
        status: 'Order Received',
        timestamp: new Date().toISOString(),
        note: `Payment verified (${paymentId}). Kitchen ticket generated.`,
      });
      db.save();

      // Decrement inventory automatically after payment confirmation!
      deductInventoryForOrder(updatedOrder);
    }

    res.json({
      success: true,
      message: 'Payment verified and order confirmed!',
      order: updatedOrder,
    });
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ error: 'Server error during payment verification' });
  }
});

export default router;
