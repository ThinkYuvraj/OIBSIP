import cron from 'node-cron';
import nodemailer from 'nodemailer';
import { db, InventoryItem, Order } from './db.js';

const ADMIN_EMAIL = process.env.ADMIN_ALERT_EMAIL || 'admin@sliceandfire.com';

// Setup nodemailer transporter (uses test transporter or SMTP config)
let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
  const emailPass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || '').replace(/\s+/g, '');

  if (emailUser && emailPass) {
    try {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });
      return transporter;
    } catch (err) {
      console.warn('[Nodemailer] Failed to init Gmail transporter, falling back:', err);
    }
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      return transporter;
    } catch {
      // fallback to jsonTransport below
    }
  }

  // Instant built-in JSON transport: never hangs, logs output accurately
  transporter = nodemailer.createTransport({
    jsonTransport: true,
  });

  return transporter;
}

// Check inventory levels against threshold and dispatch notifications
export async function checkInventoryThresholds(isManual = false): Promise<{
  checkedCount: number;
  lowStockItems: InventoryItem[];
  alertsSent: number;
}> {
  const inventory = db.getInventory();
  const lowStockItems = inventory.filter((item) => item.stock <= item.threshold);

  let alertsSent = 0;
  const now = new Date().toISOString();

  if (lowStockItems.length > 0) {
    const transporterInstance = await getTransporter();

    for (const item of lowStockItems) {
      const subject = `⚠️ URGENT: Low Stock Alert - ${item.name} (${item.stock} ${item.unit} remaining)`;
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0dbd7; border-radius: 8px; padding: 24px; background: #fffcfb;">
          <div style="text-align: center; border-bottom: 2px solid #c92722; padding-bottom: 12px; margin-bottom: 20px;">
            <h2 style="color: #c92722; margin: 0;">Slice & Fire Artisan Pizzeria</h2>
            <p style="color: #6d6662; margin: 4px 0 0; font-size: 13px;">Automated Inventory Alert System</p>
          </div>
          <h3 style="color: #2b2523;">Stock Threshold Breach Detected</h3>
          <p>This is an automated notification from the kitchen inventory monitor.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="background: #f7f3f0; border-bottom: 1px solid #e5deda;">
              <td style="padding: 10px; font-weight: bold;">Inventory Item</td>
              <td style="padding: 10px;">${item.name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5deda;">
              <td style="padding: 10px; font-weight: bold;">Category</td>
              <td style="padding: 10px; text-transform: capitalize;">${item.category}</td>
            </tr>
            <tr style="background: #f7f3f0; border-bottom: 1px solid #e5deda;">
              <td style="padding: 10px; font-weight: bold; color: #c92722;">Current Stock</td>
              <td style="padding: 10px; font-weight: bold; color: #c92722;">${item.stock} ${item.unit}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5deda;">
              <td style="padding: 10px; font-weight: bold;">Configured Threshold</td>
              <td style="padding: 10px;">${item.threshold} ${item.unit}</td>
            </tr>
          </table>
          <p style="color: #4a4441; font-size: 13px;">
            Action required: Please review upcoming shift requirements and place a supplier restock order immediately.
          </p>
          <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #e0dbd7; font-size: 11px; color: #8c8581;">
            Generated on ${new Date().toLocaleString()} by Node-Cron Scheduler.
          </div>
        </div>
      `;

      try {
        await transporterInstance.sendMail({
          from: '"Slice & Fire Kitchen Ops" <inventory@sliceandfire.com>',
          to: ADMIN_EMAIL,
          subject,
          html: htmlBody,
        });
      } catch (err) {
        console.error(`[Inventory Cron] Failed to send email for ${item.name}:`, err);
      }

      // Log in DB for admin dashboard visibility
      db.addEmailLog({
        id: `alert-${Date.now()}-${item.id}`,
        timestamp: now,
        recipient: ADMIN_EMAIL,
        subject,
        body: `Low stock warning for ${item.name}: ${item.stock} ${item.unit} remaining (Threshold: ${item.threshold} ${item.unit})`,
        triggeredByItem: item.name,
        currentStock: item.stock,
        threshold: item.threshold,
      });

      alertsSent++;
    }
  }

  const prevStats = db.getCronStats();
  db.updateCronStats({
    lastRun: now,
    totalRuns: (prevStats.totalRuns || 0) + 1,
    lastAlertSent: alertsSent > 0 ? now : prevStats.lastAlertSent,
  });

  console.log(`[Inventory Check] Executed ${isManual ? '(Manual)' : '(Cron)'}. Low stock items: ${lowStockItems.length}, Alerts dispatched: ${alertsSent}`);

  return {
    checkedCount: inventory.length,
    lowStockItems,
    alertsSent,
  };
}

// Deduct inventory items when an order is confirmed
export function deductInventoryForOrder(order: Order) {
  const inventory = db.getInventory();
  const artisanPizzas = db.getPizzas();

  for (const item of order.items) {
    const qty = item.quantity;

    if (item.isCustom && item.customDetails) {
      const details = item.customDetails as any;
      const baseLookup = details.base?.name || details.base?.id || details.baseName || details.baseId;
      const sauceLookup = details.sauce?.name || details.sauce?.id || details.sauceName || details.sauceId;
      const cheeseLookup = details.cheese?.name || details.cheese?.id || details.cheeseName || details.cheeseId;

      const baseItem = inventory.find((i) => i.name === baseLookup || i.id === baseLookup);
      if (baseItem) {
        db.updateInventoryItem(baseItem.id, { stock: Math.max(0, baseItem.stock - qty) });
      }

      const sauceItem = inventory.find((i) => i.name === sauceLookup || i.id === sauceLookup);
      if (sauceItem) {
        db.updateInventoryItem(sauceItem.id, { stock: Math.max(0, sauceItem.stock - qty) });
      }

      const cheeseItem = inventory.find((i) => i.name === cheeseLookup || i.id === cheeseLookup);
      if (cheeseItem) {
        db.updateInventoryItem(cheeseItem.id, { stock: Math.max(0, cheeseItem.stock - qty) });
      }

      const rawVeggies = details.vegetableNames || details.vegetables || [];
      if (Array.isArray(rawVeggies)) {
        for (const v of rawVeggies) {
          const vLookup = typeof v === 'string' ? v : (v.name || v.id);
          const vegItem = inventory.find((i) => i.name === vLookup || i.id === vLookup);
          if (vegItem) {
            db.updateInventoryItem(vegItem.id, { stock: Math.max(0, vegItem.stock - qty) });
          }
        }
      }
    } else {
      // Artisan pizza recipe deduction
      const pizza = artisanPizzas.find((p) => p.name === item.name || p.id === item.id);
      if (pizza && pizza.recipe) {
        const { baseId, sauceId, cheeseId, vegetableIds } = pizza.recipe;
        const b = db.getInventoryItem(baseId);
        if (b) db.updateInventoryItem(b.id, { stock: Math.max(0, b.stock - qty) });

        const s = db.getInventoryItem(sauceId);
        if (s) db.updateInventoryItem(s.id, { stock: Math.max(0, s.stock - qty) });

        const c = db.getInventoryItem(cheeseId);
        if (c) db.updateInventoryItem(c.id, { stock: Math.max(0, c.stock - qty) });

        for (const vId of vegetableIds) {
          const v = db.getInventoryItem(vId);
          if (v) db.updateInventoryItem(v.id, { stock: Math.max(0, v.stock - qty) });
        }
      } else {
        // Fallback default: deduct 1 base, 1 sauce, 1 cheese
        const defaultBase = inventory.find((i) => i.category === 'base');
        if (defaultBase) db.updateInventoryItem(defaultBase.id, { stock: Math.max(0, defaultBase.stock - qty) });
        const defaultSauce = inventory.find((i) => i.category === 'sauce');
        if (defaultSauce) db.updateInventoryItem(defaultSauce.id, { stock: Math.max(0, defaultSauce.stock - qty) });
        const defaultCheese = inventory.find((i) => i.category === 'cheese');
        if (defaultCheese) db.updateInventoryItem(defaultCheese.id, { stock: Math.max(0, defaultCheese.stock - qty) });
      }
    }
  }

  // Check thresholds right after deduction
  checkInventoryThresholds(false).catch((err) => {
    console.error('[Inventory] Error checking thresholds after order deduction:', err);
  });
}

// Start scheduled cron runner (runs every 10 minutes in background, or on boot)
export function startInventoryCron() {
  console.log('[Inventory Cron] Initializing scheduled inventory monitor (every 10 minutes)');

  // Run initial check on server startup (with small delay)
  setTimeout(() => {
    checkInventoryThresholds(false).catch(console.error);
  }, 4000);

  // Scheduled job: runs every 10 minutes ('*/10 * * * *')
  cron.schedule('*/10 * * * *', () => {
    console.log('[Inventory Cron] Scheduled 10-minute threshold verification firing...');
    checkInventoryThresholds(false).catch(console.error);
  });
}
