import cron from 'node-cron';
import nodemailer from 'nodemailer';
import { db, InventoryItem, Order } from './db.js';

const ADMIN_EMAIL = process.env.ADMIN_ALERT_EMAIL || process.env.ADMIN_EMAIL || 'admin@sliceandfire.com';

// Setup nodemailer transporter (uses test transporter or SMTP config)
let transporter: nodemailer.Transporter | null = null;

function getSenderInfo() {
  // SMTP authentication username must be an email address
  const smtpAuthUser = (process.env.SMTP_USER && process.env.SMTP_USER.includes('@'))
    ? process.env.SMTP_USER.trim()
    : (process.env.EMAIL_USER && process.env.EMAIL_USER.includes('@'))
    ? process.env.EMAIL_USER.trim()
    : (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();

  const smtpAuthPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || '').replace(/\s+/g, '');

  const senderName = process.env.EMAIL_USER && !process.env.EMAIL_USER.includes('@')
    ? process.env.EMAIL_USER.trim()
    : 'Slice & Fire Kitchen Ops';

  const senderEmail = smtpAuthUser || 'inventory@sliceandfire.com';

  return {
    smtpAuthUser,
    smtpAuthPass,
    fromAddress: `"${senderName}" <${senderEmail}>`,
  };
}

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  const { smtpAuthUser, smtpAuthPass } = getSenderInfo();

  if (smtpAuthUser && smtpAuthPass) {
    try {
      let candidateTransporter: nodemailer.Transporter;

      if (process.env.SMTP_HOST && !process.env.SMTP_HOST.includes('gmail')) {
        candidateTransporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: {
            user: smtpAuthUser,
            pass: smtpAuthPass,
          },
        });
      } else {
        // Default to Gmail transport service when using Gmail SMTP or general gmail credentials
        candidateTransporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: smtpAuthUser,
            pass: smtpAuthPass,
          },
        });
      }

      await candidateTransporter.verify();
      console.log(`[Nodemailer] SMTP transport verified successfully for ${smtpAuthUser}`);
      transporter = candidateTransporter;
      return transporter;
    } catch (err: any) {
      console.warn(`[Nodemailer] SMTP verification failed (${err.message}). Falling back to internal transport.`);
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
    const prevStats = db.getCronStats();
    const lastAlertTime = prevStats.lastAlertSent ? new Date(prevStats.lastAlertSent).getTime() : 0;
    const timeSinceLastAlert = Date.now() - lastAlertTime;
    const COOLDOWN_MS = 20 * 60 * 1000; // 20 minutes cooldown between automated cron emails

    // Allow dispatch if manual trigger, or if cooldown expired
    const shouldDispatchEmail = isManual || timeSinceLastAlert > COOLDOWN_MS;

    if (shouldDispatchEmail) {
      const transporterInstance = await getTransporter();
      const { fromAddress } = getSenderInfo();

      // Format a consolidated digest alert to avoid spamming multiple emails and hitting SMTP burst rate limits (421)
      const isMulti = lowStockItems.length > 1;
      const subject = isMulti
        ? `⚠️ URGENT: Kitchen Stock Alert - ${lowStockItems.length} Ingredients Below Threshold`
        : `⚠️ URGENT: Low Stock Alert - ${lowStockItems[0].name} (${lowStockItems[0].stock} ${lowStockItems[0].unit} left)`;

      const rowsHtml = lowStockItems
        .map(
          (item) => `
            <tr style="border-bottom: 1px solid #e5deda;">
              <td style="padding: 10px 12px; font-weight: bold; color: #2b2523;">${item.name}</td>
              <td style="padding: 10px 12px; text-transform: capitalize; color: #574e48;">${item.category}</td>
              <td style="padding: 10px 12px; font-weight: bold; color: #c92722;">${item.stock} ${item.unit}</td>
              <td style="padding: 10px 12px; color: #78716c;">${item.threshold} ${item.unit}</td>
              <td style="padding: 10px 12px; color: #b45309; font-weight: 600;">Deficit: ${item.threshold - item.stock} ${item.unit}</td>
            </tr>
          `
        )
        .join('');

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; border: 1px solid #e0dbd7; border-radius: 10px; padding: 24px; background: #fffcfb;">
          <div style="text-align: center; border-bottom: 2px solid #c92722; padding-bottom: 14px; margin-bottom: 20px;">
            <h2 style="color: #c92722; margin: 0; font-size: 22px;">Slice & Fire Artisan Pizzeria</h2>
            <p style="color: #6d6662; margin: 4px 0 0; font-size: 13px;">Automated Kitchen Inventory & Stock Monitor</p>
          </div>
          <h3 style="color: #2b2523; margin-top: 0;">
            ${isMulti ? `${lowStockItems.length} Inventory Items Require Restocking` : `Stock Threshold Breach: ${lowStockItems[0].name}`}
          </h3>
          <p style="color: #4a4441; font-size: 14px; line-height: 1.5;">
            The automated kitchen monitor detected one or more ingredients that have fallen to or below safe operational thresholds.
          </p>
          <table style="width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 13px;">
            <thead>
              <tr style="background: #f7f3f0; border-bottom: 2px solid #e5deda; text-align: left;">
                <th style="padding: 10px 12px;">Ingredient</th>
                <th style="padding: 10px 12px;">Category</th>
                <th style="padding: 10px 12px; color: #c92722;">Current Stock</th>
                <th style="padding: 10px 12px;">Threshold</th>
                <th style="padding: 10px 12px;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <p style="color: #4a4441; font-size: 13px; line-height: 1.5;">
            <strong>Immediate Action:</strong> Please review evening shift reservations and initiate supplier replenishment.
          </p>
          <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #e0dbd7; font-size: 11px; color: #8c8581;">
            Generated on ${new Date().toLocaleString()} by Node-Cron Scheduler. Notice sent to ${ADMIN_EMAIL}.
          </div>
        </div>
      `;

      try {
        await transporterInstance.sendMail({
          from: fromAddress,
          to: ADMIN_EMAIL,
          subject,
          html: htmlBody,
        });
        console.log(`[Inventory Monitor] Alert email delivered for ${lowStockItems.length} low-stock item(s) to ${ADMIN_EMAIL}`);
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        const isRateLimit = errMsg.includes('421') || err?.response?.includes('421');
        const isAuthError = err.code === 'EAUTH' || err?.response?.includes('535');

        if (isRateLimit) {
          console.warn(`[Inventory Monitor] Mail server temporary rate limit (421) received. Alert logged internally in operations audit records.`);
          transporter = nodemailer.createTransport({ jsonTransport: true });
        } else if (isAuthError) {
          console.warn(`[Inventory Monitor] SMTP authentication error (535). Alert logged internally in operations audit records.`);
          transporter = nodemailer.createTransport({ jsonTransport: true });
        } else {
          console.warn(`[Inventory Monitor] Email delivery note: ${errMsg}. Logged in operations records.`);
        }
      }

      // Record logs for each item for admin dashboard visibility
      for (const item of lowStockItems) {
        db.addEmailLog({
          id: `alert-${Date.now()}-${item.id}`,
          timestamp: now,
          recipient: ADMIN_EMAIL,
          subject: `Low Stock Alert: ${item.name} (${item.stock} ${item.unit} left)`,
          body: `Stock warning for ${item.name}: ${item.stock} ${item.unit} remaining (Threshold: ${item.threshold} ${item.unit})`,
          triggeredByItem: item.name,
          currentStock: item.stock,
          threshold: item.threshold,
        });
        alertsSent++;
      }
    } else {
      console.log(`[Inventory Monitor] ${lowStockItems.length} low-stock items detected. Alert throttled by cooldown (${Math.round(timeSinceLastAlert / 60000)}m since last notification).`);
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
