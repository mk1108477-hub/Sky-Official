import { Router } from "express";
import pool from "../lib/db";
import { requireAuth } from "../middlewares/requireAuth";
import { sendPushToAll } from "./push";
import { sendOrderEmail } from "../lib/email";

const router = Router();

const ADMIN_WHATSAPP_CHAT_ID = "919362003788@c.us";

async function sendWhatsApp(message: string) {
  const instanceId = process.env.GREENAPI_INSTANCE_ID;
  const token = process.env.GREENAPI_TOKEN;
  if (!instanceId || !token) return;
  try {
    await fetch(
      `https://api.green-api.com/waInstance${instanceId}/sendMessage/${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: ADMIN_WHATSAPP_CHAT_ID, message }),
      }
    );
  } catch {}
}

async function getNextDisplayId(): Promise<string> {
  const year = new Date().getFullYear();
  const key = `order_seq_${year}`;
  await pool.query(
    `INSERT INTO settings (key, value) VALUES ($1, '0') ON CONFLICT (key) DO NOTHING`,
    [key]
  );
  const { rows } = await pool.query(
    `UPDATE settings SET value = (value::int + 1)::text WHERE key = $1 RETURNING value`,
    [key]
  );
  const seq = parseInt(rows[0]?.value ?? "1");
  return `SKY-${year}-${seq.toString().padStart(6, "0")}`;
}

async function assignAvailableStaff(): Promise<number | null> {
  const { rows: staffList } = await pool.query(
    `SELECT id FROM recharge_staff WHERE status = 'available' ORDER BY sort_order ASC, id ASC`
  );
  if (staffList.length === 0) return null;

  await pool.query(
    `INSERT INTO settings (key, value) VALUES ('staff_rr_idx', '0') ON CONFLICT (key) DO NOTHING`
  );
  const { rows: idxRows } = await pool.query(
    `SELECT value FROM settings WHERE key = 'staff_rr_idx'`
  );
  const currentIdx = parseInt(idxRows[0]?.value ?? "0");
  const assignedIdx = currentIdx % staffList.length;
  const nextIdx = assignedIdx + 1;

  await pool.query(
    `UPDATE settings SET value = $1 WHERE key = 'staff_rr_idx'`,
    [nextIdx.toString()]
  );
  return staffList[assignedIdx].id;
}

async function sendStaffNotification(staffId: number, orderId: string, orderData: any) {
  try {
    const { rows } = await pool.query(
      `SELECT name, email FROM recharge_staff WHERE id = $1`,
      [staffId]
    );
    const staff = rows[0];
    if (!staff?.email) return;

    const notifyEmail = process.env.NOTIFY_EMAIL;
    const notifyPass = process.env.NOTIFY_EMAIL_APP_PASSWORD;
    if (!notifyEmail || !notifyPass) return;

    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: notifyEmail, pass: notifyPass } });
    const diamonds = Number(orderData.diamonds).toLocaleString("en-IN");

    await transporter.sendMail({
      from: `"Sky Official" <${notifyEmail}>`,
      to: staff.email,
      subject: `🎯 New Order Assigned — ${orderId}`,
      html: `<div style="font-family:sans-serif;background:#0a0a0a;color:#f9fafb;padding:24px;max-width:440px;border-radius:14px;border:1px solid rgba(245,158,11,0.25);">
        <h2 style="color:#f59e0b;margin:0 0 16px;">Order Assigned to You</h2>
        <p style="color:rgba(255,255,255,0.6);margin:0 0 16px;">Hi ${staff.name}, a new order has been assigned to you.</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:rgba(255,255,255,0.4);padding:8px 0;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.07);">Order ID</td><td style="color:#f59e0b;font-weight:800;text-align:right;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.07);">${orderId}</td></tr>
          <tr><td style="color:rgba(255,255,255,0.4);padding:8px 0;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.07);">Diamonds</td><td style="color:#fff;font-weight:700;text-align:right;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.07);">♦ ${diamonds}</td></tr>
          <tr><td style="color:rgba(255,255,255,0.4);padding:8px 0;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.07);">Amount</td><td style="color:#fff;font-weight:700;text-align:right;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.07);">₹${parseFloat(orderData.price).toFixed(0)}</td></tr>
          ${orderData.mlbbId ? `<tr><td style="color:rgba(255,255,255,0.4);padding:8px 0;font-size:13px;">MLBB ID</td><td style="color:#38bdf8;font-weight:700;text-align:right;font-size:13px;">${orderData.mlbbId}</td></tr>` : ""}
        </table>
        <p style="color:rgba(255,255,255,0.3);font-size:11px;margin-top:20px;">Log in to the admin panel to process this order.</p>
      </div>`,
    });
  } catch {}
}

router.get("/my", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.clerkUserId as string;
  try {
    const { rows } = await pool.query(
      "SELECT * FROM orders WHERE clerk_user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: "DB error" });
  }
});

router.post("/", requireAuth, async (req: any, res): Promise<void> => {
  const clerkUserId = req.clerkUserId as string;
  const { packageId, refId, remark, mlbbUserId, mlbbServerId, mlbbIgn, isForFriend } = req.body;

  if (!packageId) {
    res.status(400).json({ ok: false, error: "packageId is required." });
    return;
  }

  try {
    const { rows: pkgs } = await pool.query(
      "SELECT id, diamonds, price FROM packages WHERE id = $1",
      [packageId]
    );
    if (pkgs.length === 0) {
      res.status(404).json({ ok: false, error: "Package not found." });
      return;
    }
    const pkg = pkgs[0];

    let mlbbId = mlbbUserId || null;
    let serverId = mlbbServerId || null;
    let ign = mlbbIgn || null;
    if (!mlbbId) {
      const { rows: accounts } = await pool.query(
        "SELECT mlbb_user_id, mlbb_server_id, mlbb_ign FROM mlbb_accounts WHERE clerk_user_id = $1",
        [clerkUserId]
      );
      if (accounts.length > 0) {
        mlbbId = accounts[0].mlbb_user_id;
        serverId = accounts[0].mlbb_server_id;
        ign = accounts[0].mlbb_ign;
      }
    }

    const noteBase = remark ? `Ref: ${remark}` : refId ? `Ref: ${refId}` : null;
    const friendNote = isForFriend ? " [For Friend]" : "";
    const note = noteBase ? noteBase + friendNote : friendNote || null;

    const displayId = await getNextDisplayId();
    const staffId = await assignAvailableStaff();

    const { rows: inserted } = await pool.query(
      `INSERT INTO orders (clerk_user_id, package_id, diamonds, price, mlbb_id, mlbb_server_id, mlbb_ign, is_for_friend, status, note, display_id, assigned_staff_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, $11)
       RETURNING id`,
      [clerkUserId, pkg.id, pkg.diamonds, pkg.price, mlbbId, serverId, ign, isForFriend || false, note, displayId, staffId]
    );

    const orderId = inserted[0].id;
    const diamonds = Number(pkg.diamonds).toLocaleString("en-IN");
    const price = parseFloat(pkg.price).toFixed(0);

    sendPushToAll({
      title: "💎 New Order!",
      body: `${displayId} · ${diamonds} diamonds · ₹${price}`,
      tag: "new-order",
      url: "/admin",
    });

    const lines = [
      "🛒 *New Order — Sky Official*",
      "",
      `🆔 *Order:* ${displayId}`,
      `📦 *Package:* ♦ ${diamonds} Diamonds`,
      `💰 *Amount:* ₹${price}`,
      mlbbId ? `🎮 *MLBB ID:* ${mlbbId}` : null,
      serverId ? `🌐 *Server:* ${serverId}` : null,
      ign ? `👤 *IGN:* ${ign}` : null,
      isForFriend ? "👥 *Recharge:* For a Friend" : null,
      remark ? `🔑 *Remark:* ${remark}` : null,
      "",
      "Open admin panel to fulfill →",
    ];
    sendWhatsApp(lines.filter(Boolean).join("\n"));

    sendOrderEmail({ orderId, diamonds: pkg.diamonds, price: pkg.price, mlbbId, remark: remark ?? null }).catch(() => {});

    if (staffId) {
      sendStaffNotification(staffId, displayId, { diamonds: pkg.diamonds, price: pkg.price, mlbbId });
    }

    res.json({ ok: true, id: orderId, displayId });
  } catch {
    res.status(500).json({ ok: false, error: "DB error. Please try again." });
  }
});

router.post("/cart", requireAuth, async (req: any, res): Promise<void> => {
  const clerkUserId = req.clerkUserId as string;
  const { items, refId, remark, mlbbUserId, mlbbServerId, mlbbIgn, isForFriend } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ ok: false, error: "items array is required." });
    return;
  }

  try {
    let mlbbId = mlbbUserId || null;
    let serverId = mlbbServerId || null;
    let ign = mlbbIgn || null;
    if (!mlbbId) {
      const { rows: accounts } = await pool.query(
        "SELECT mlbb_user_id, mlbb_server_id, mlbb_ign FROM mlbb_accounts WHERE clerk_user_id = $1",
        [clerkUserId]
      );
      if (accounts.length > 0) {
        mlbbId = accounts[0].mlbb_user_id;
        serverId = accounts[0].mlbb_server_id;
        ign = accounts[0].mlbb_ign;
      }
    }

    const noteBase = remark ? `Ref: ${remark}` : refId ? `Ref: ${refId}` : null;
    const friendNote = isForFriend ? " [For Friend]" : "";
    const orderIds: number[] = [];
    const displayIds: string[] = [];
    const staffId = await assignAvailableStaff();

    for (const item of items) {
      const { packageId, quantity = 1 } = item;
      const { rows: pkgs } = await pool.query(
        "SELECT id, diamonds, price FROM packages WHERE id = $1", [packageId]
      );
      if (!pkgs[0]) continue;
      const pkg = pkgs[0];
      for (let q = 0; q < quantity; q++) {
        const note = noteBase ? noteBase + friendNote : friendNote || null;
        const displayId = await getNextDisplayId();
        const { rows: inserted } = await pool.query(
          `INSERT INTO orders (clerk_user_id, package_id, diamonds, price, mlbb_id, mlbb_server_id, mlbb_ign, is_for_friend, status, note, display_id, assigned_staff_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, $11) RETURNING id`,
          [clerkUserId, pkg.id, pkg.diamonds, pkg.price, mlbbId, serverId, ign, isForFriend || false, note, displayId, staffId]
        );
        orderIds.push(inserted[0].id);
        displayIds.push(displayId);
      }
    }

    const totalDiamonds = items.reduce((s: number, i: any) => s + (i.diamonds || 0) * (i.quantity || 1), 0);
    const totalPrice = items.reduce((s: number, i: any) => s + parseFloat(i.price || "0") * (i.quantity || 1), 0);
    sendPushToAll({ title: "🛒 Cart Order!", body: `${orderIds.length} items · ₹${totalPrice.toFixed(0)}`, tag: "new-order", url: "/admin" });
    sendWhatsApp(`🛒 *Cart Order*\n${orderIds.length} items · ♦${totalDiamonds} diamonds · ₹${totalPrice.toFixed(0)}\n${mlbbId ? `🎮 ID: ${mlbbId}` : ""}\nIDs: ${displayIds.join(", ")}`);

    res.json({ ok: true, ids: orderIds, displayIds });
  } catch {
    res.status(500).json({ ok: false, error: "DB error. Please try again." });
  }
});

export default router;
