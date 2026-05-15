import { Router } from "express";
import pool from "../lib/db";
import nodemailer from "nodemailer";
import { createClerkClient } from "@clerk/express";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";

const publicUploadsDir = path.resolve(process.cwd(), "artifacts/sky-official/public/uploads");

mkdirSync(publicUploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, publicUploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    cb(null, `upload_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });

const router = Router();

function requireAdmin(req: any, res: any, next: any) {
  const auth = req.headers["authorization"] || "";
  const password = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

async function getClerkUserEmail(userId: string): Promise<string | null> {
  if (!process.env.CLERK_SECRET_KEY || !userId) return null;
  try {
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    const user = await clerk.users.getUser(userId);
    return user.emailAddresses[0]?.emailAddress ?? null;
  } catch {
    return null;
  }
}

async function sendOrderCompletedEmail(to: string, order: any): Promise<void> {
  if (!process.env.NOTIFY_EMAIL || !process.env.NOTIFY_EMAIL_APP_PASSWORD) {
    console.error("[email] sendOrderCompletedEmail skipped — NOTIFY_EMAIL or NOTIFY_EMAIL_APP_PASSWORD not set");
    return;
  }
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.NOTIFY_EMAIL,
        pass: process.env.NOTIFY_EMAIL_APP_PASSWORD,
      },
    });
    await transporter.sendMail({
      from: `"Sky Official" <${process.env.NOTIFY_EMAIL}>`,
      to,
      subject: `Your ♦ ${Number(order.diamonds).toLocaleString()} Diamonds are delivered! — Sky Official`,
      html: `
        <div style="font-family:Inter,sans-serif;background:#0a0a0a;color:#f9fafb;padding:32px;max-width:480px;margin:0 auto;border-radius:16px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="width:56px;height:56px;border-radius:50%;border:2px solid #f59e0b;margin:0 auto;background:#111;display:flex;align-items:center;justify-content:center;">
              <span style="font-size:28px;">💎</span>
            </div>
            <h1 style="color:#f59e0b;margin:12px 0 4px;font-size:22px;font-weight:800;">Sky Official</h1>
            <p style="color:rgba(255,255,255,0.4);margin:0;font-size:13px;letter-spacing:0.1em;">MLBB DIAMOND TOP-UP</p>
          </div>
          <div style="background:#111;border:1px solid rgba(34,197,94,0.25);border-radius:12px;padding:20px;margin-bottom:16px;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
              <div style="width:36px;height:36px;border-radius:10px;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <span style="font-size:18px;">✅</span>
              </div>
              <div>
                <div style="color:#4ade80;font-weight:700;font-size:16px;">Order Completed!</div>
                <div style="color:rgba(255,255,255,0.4);font-size:12px;margin-top:2px;">Your diamonds have been delivered</div>
              </div>
            </div>
            <p style="color:rgba(255,255,255,0.6);margin:0 0 16px;font-size:14px;line-height:1.7;">
              Your Mobile Legends diamonds have been successfully delivered to your account. Thank you for choosing Sky Official — your trusted MLBB top-up partner!
            </p>
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="color:rgba(255,255,255,0.4);padding:9px 0;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.06);">Order ID</td>
                <td style="color:#fff;text-align:right;font-size:13px;font-weight:600;border-bottom:1px solid rgba(255,255,255,0.06);">#${order.id}</td>
              </tr>
              <tr>
                <td style="color:rgba(255,255,255,0.4);padding:9px 0;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.06);">Diamonds</td>
                <td style="color:#f59e0b;text-align:right;font-size:14px;font-weight:800;border-bottom:1px solid rgba(255,255,255,0.06);">♦ ${Number(order.diamonds).toLocaleString()}</td>
              </tr>
              <tr>
                <td style="color:rgba(255,255,255,0.4);padding:9px 0;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.06);">Amount Paid</td>
                <td style="color:#fff;text-align:right;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.06);">₹${Number(order.price).toLocaleString("en-IN")}</td>
              </tr>
              ${order.mlbb_id ? `<tr><td style="color:rgba(255,255,255,0.4);padding:9px 0;font-size:13px;">MLBB ID</td><td style="color:#fff;text-align:right;font-size:13px;">${order.mlbb_id}</td></tr>` : ""}
            </table>
          </div>
          <div style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.15);border-radius:10px;padding:12px 16px;font-size:13px;color:rgba(255,255,255,0.5);line-height:1.6;margin-bottom:16px;">
            💬 Need help or have questions? Contact us on <strong style="color:#25d366;">WhatsApp</strong> for instant support.
          </div>
          <p style="color:rgba(255,255,255,0.2);font-size:11px;text-align:center;margin:0;">
            © 2026 Sky Official. All rights reserved.
          </p>
        </div>
      `,
    });
  } catch {
    // Email send failure is non-fatal
  }
}

router.post("/login", (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Wrong password" });
  }
});

router.get("/packages", requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM packages ORDER BY sort_order ASC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "DB error" });
  }
});

router.post("/packages", requireAdmin, async (req, res) => {
  const { diamonds, bonus_diamonds, price, label, is_popular, sort_order, name, category, status } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO packages (diamonds, bonus_diamonds, price, label, is_popular, sort_order, name, category, status, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING *`,
      [diamonds, bonus_diamonds || 0, price, label || null, is_popular || false, sort_order || 0, name || null, category || null, status || "available"]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "DB error" });
  }
});

router.put("/packages/:id", requireAdmin, async (req, res): Promise<void> => {
  const { id } = req.params;
  const { diamonds, bonus_diamonds, price, label, is_popular, sort_order, name, category, status } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE packages SET diamonds=$1, bonus_diamonds=$2, price=$3, label=$4, is_popular=$5, sort_order=$6, name=$7, category=$8, status=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [diamonds, bonus_diamonds || 0, price, label || null, is_popular || false, sort_order || 0, name || null, category || null, status || "available", id]
    );
    if (!rows[0]) { res.status(404).json({ error: "Not found" }); return; }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "DB error" });
  }
});

router.delete("/packages/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM packages WHERE id=$1", [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "DB error" });
  }
});

router.get("/orders", requireAdmin, async (_req, res) => {
  try {
    const { rows: orders } = await pool.query(
      "SELECT * FROM orders ORDER BY created_at DESC LIMIT 100"
    );
    const { rows: stats } = await pool.query(`
      SELECT
        COUNT(*) AS total_orders,
        COALESCE(SUM(price), 0) AS total_revenue,
        COALESCE(SUM(diamonds), 0) AS total_diamonds
      FROM orders
    `);
    res.json({ orders, stats: stats[0] });
  } catch (err) {
    res.status(500).json({ error: "DB error" });
  }
});

router.post("/orders", requireAdmin, async (req, res) => {
  const { package_id, diamonds, price, mlbb_id, status, note } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO orders (package_id, diamonds, price, mlbb_id, status, note)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [package_id || null, diamonds, price, mlbb_id || null, status || "pending", note || null]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "DB error" });
  }
});

router.put("/orders/:id", requireAdmin, async (req, res): Promise<void> => {
  const { id } = req.params;
  const { status, note } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE orders SET status=$1, note=$2 WHERE id=$3 RETURNING *`,
      [status, note || null, id]
    );
    if (!rows[0]) { res.status(404).json({ error: "Not found" }); return; }
    const order = rows[0];

    // Send completion email when order is marked as completed
    if (status === "completed" && order.clerk_user_id) {
      const email = await getClerkUserEmail(order.clerk_user_id);
      if (email) {
        sendOrderCompletedEmail(email, order).catch(() => {});
      }
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "DB error" });
  }
});

router.delete("/orders/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM orders WHERE id=$1", [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "DB error" });
  }
});

router.get("/settings/qr", requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT value FROM settings WHERE key='qr_code'");
    res.json({ qr: rows[0]?.value || null });
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.put("/settings/qr", requireAdmin, async (req, res) => {
  const { qr } = req.body;
  if (!qr) { res.status(400).json({ error: "qr is required" }); return; }
  try {
    await pool.query(
      `INSERT INTO settings (key, value) VALUES ('qr_code', $1) ON CONFLICT (key) DO UPDATE SET value=$1`,
      [qr]
    );
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.get("/settings/category_popular", requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT value FROM settings WHERE key='category_popular'");
    res.json(JSON.parse(rows[0]?.value || "{}"));
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.put("/settings/category_popular", requireAdmin, async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO settings (key, value) VALUES ('category_popular', $1)
       ON CONFLICT (key) DO UPDATE SET value=$1`,
      [JSON.stringify(req.body)]
    );
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.get("/settings/offer_banners", requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT value FROM settings WHERE key='offer_banners'");
    res.json(JSON.parse(rows[0]?.value || "[]"));
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.put("/settings/offer_banners", requireAdmin, async (req, res) => {
  try {
    await pool.query(`INSERT INTO settings (key,value) VALUES ('offer_banners',$1) ON CONFLICT (key) DO UPDATE SET value=$1`, [JSON.stringify(req.body)]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.get("/settings/trustpilot", requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT key, value FROM settings WHERE key IN ('trustpilot_url','trustpilot_enabled')");
    const m: Record<string, string> = {};
    rows.forEach((r: any) => { m[r.key] = r.value; });
    res.json({ url: m["trustpilot_url"] || "", enabled: m["trustpilot_enabled"] === "true" });
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.put("/settings/trustpilot", requireAdmin, async (req, res) => {
  const { url, enabled } = req.body;
  try {
    await pool.query(`INSERT INTO settings (key,value) VALUES ('trustpilot_url',$1) ON CONFLICT (key) DO UPDATE SET value=$1`, [url || ""]);
    await pool.query(`INSERT INTO settings (key,value) VALUES ('trustpilot_enabled',$1) ON CONFLICT (key) DO UPDATE SET value=$1`, [enabled ? "true" : "false"]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.get("/settings/pack_images", requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT value FROM settings WHERE key='pack_images'");
    res.json(rows[0] ? JSON.parse(rows[0].value) : null);
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.put("/settings/pack_images", requireAdmin, async (req, res) => {
  try {
    await pool.query(`INSERT INTO settings (key,value) VALUES ('pack_images',$1) ON CONFLICT (key) DO UPDATE SET value=$1`, [JSON.stringify(req.body)]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.get("/settings/pass_images", requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT value FROM settings WHERE key='pass_images'");
    res.json(rows[0] ? JSON.parse(rows[0].value) : null);
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.put("/settings/pass_images", requireAdmin, async (req, res) => {
  try {
    await pool.query(`INSERT INTO settings (key,value) VALUES ('pass_images',$1) ON CONFLICT (key) DO UPDATE SET value=$1`, [JSON.stringify(req.body)]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.get("/settings/starlight_images", requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT value FROM settings WHERE key='starlight_images'");
    res.json(rows[0] ? JSON.parse(rows[0].value) : {});
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.put("/settings/starlight_images", requireAdmin, async (req, res) => {
  try {
    await pool.query(`INSERT INTO settings (key,value) VALUES ('starlight_images',$1) ON CONFLICT (key) DO UPDATE SET value=$1`, [JSON.stringify(req.body)]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.post("/upload-image", requireAdmin, upload.single("image"), (req: any, res: any) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.json({ url: `/uploads/${req.file.filename}` });
});

router.get("/settings/category_availability", requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT value FROM settings WHERE key='category_availability'");
    res.json(rows[0] ? JSON.parse(rows[0].value) : {});
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.put("/settings/category_availability", requireAdmin, async (req, res) => {
  try {
    await pool.query(`INSERT INTO settings (key,value) VALUES ('category_availability',$1) ON CONFLICT (key) DO UPDATE SET value=$1`, [JSON.stringify(req.body)]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.get("/wallet-requests", requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM wallet_transactions ORDER BY created_at DESC LIMIT 100`
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: "DB error" });
  }
});

router.post("/wallet-requests/:id/approve", requireAdmin, async (req, res): Promise<void> => {
  const { id } = req.params;
  try {
    const txRes = await pool.query(
      "SELECT * FROM wallet_transactions WHERE id=$1 AND status='pending'",
      [id]
    );
    if (!txRes.rows[0]) { res.status(404).json({ error: "Not found or already processed" }); return; }
    const tx = txRes.rows[0];

    await pool.query(
      `INSERT INTO wallets (clerk_user_id, balance, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (clerk_user_id)
       DO UPDATE SET balance = wallets.balance + $2, updated_at = NOW()`,
      [tx.clerk_user_id, tx.amount]
    );

    await pool.query(
      "UPDATE wallet_transactions SET status='approved' WHERE id=$1",
      [id]
    );

    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "DB error" });
  }
});

router.post("/wallet-requests/:id/reject", requireAdmin, async (req, res): Promise<void> => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query(
      "UPDATE wallet_transactions SET status='rejected' WHERE id=$1 AND status='pending'",
      [id]
    );
    if (!rowCount) { res.status(404).json({ error: "Not found or already processed" }); return; }
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "DB error" });
  }
});

// ── Promo Events ──────────────────────────────────────────────────────────────
router.get("/promo-events", requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT value FROM settings WHERE key='promo_events'");
    res.json(JSON.parse(rows[0]?.value || "[]"));
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.put("/promo-events", requireAdmin, async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO settings (key,value) VALUES ('promo_events',$1) ON CONFLICT (key) DO UPDATE SET value=$1`,
      [JSON.stringify(req.body)]
    );
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "DB error" }); }
});

// ── Recharge Staff ────────────────────────────────────────────────────────────
router.get("/staff", requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM recharge_staff ORDER BY sort_order ASC, id ASC");
    res.json(rows);
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.post("/staff", requireAdmin, upload.single("qr_image"), async (req: any, res: any) => {
  const { name, email, whatsapp, status, shift_hours, sort_order, staff_pin, notify_orders } = req.body;
  if (!name) { res.status(400).json({ error: "name is required" }); return; }
  const qrImage = req.file ? `/uploads/${req.file.filename}` : (req.body.qr_image || null);
  const notifyOrders = notify_orders === "false" || notify_orders === false ? false : true;
  try {
    const { rows } = await pool.query(
      `INSERT INTO recharge_staff (name, email, qr_image, whatsapp, status, shift_hours, sort_order, staff_pin, notify_orders)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, email || null, qrImage, whatsapp || null, status || "offline", shift_hours || null, sort_order || 0, staff_pin || null, notifyOrders]
    );
    res.json(rows[0]);
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.put("/staff/:id", requireAdmin, upload.single("qr_image"), async (req: any, res: any): Promise<void> => {
  const { id } = req.params;
  const { name, email, whatsapp, status, shift_hours, sort_order, qr_image, notify_orders } = req.body;
  const qrImage = req.file ? `/uploads/${req.file.filename}` : (qr_image || null);
  const notifyOrders = notify_orders === "false" || notify_orders === false ? false : true;
  try {
    const { rows } = await pool.query(
      `UPDATE recharge_staff SET name=$1, email=$2, qr_image=COALESCE($3, qr_image), whatsapp=$4, status=$5, shift_hours=$6, sort_order=$7, notify_orders=$8
       WHERE id=$9 RETURNING *`,
      [name, email || null, qrImage, whatsapp || null, status || "offline", shift_hours || null, sort_order || 0, notifyOrders, id]
    );
    if (!rows[0]) { res.status(404).json({ error: "Not found" }); return; }
    res.json(rows[0]);
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.put("/staff/:id/status", requireAdmin, async (req, res): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;
  if (!["available", "offline"].includes(status)) { res.status(400).json({ error: "Invalid status" }); return; }
  try {
    const { rows } = await pool.query(
      `UPDATE recharge_staff SET status=$1 WHERE id=$2 RETURNING *`,
      [status, id]
    );
    if (!rows[0]) { res.status(404).json({ error: "Not found" }); return; }
    res.json(rows[0]);
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.put("/staff/:id/notify", requireAdmin, async (req, res): Promise<void> => {
  const { id } = req.params;
  const { notify_orders } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE recharge_staff SET notify_orders=$1 WHERE id=$2 RETURNING *`,
      [!!notify_orders, id]
    );
    if (!rows[0]) { res.status(404).json({ error: "Not found" }); return; }
    res.json(rows[0]);
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.post("/staff/:id/test-email", requireAdmin, async (req, res): Promise<void> => {
  const { id } = req.params;
  const notifyEmail = process.env.NOTIFY_EMAIL;
  const notifyPass = process.env.NOTIFY_EMAIL_APP_PASSWORD;
  if (!notifyEmail || !notifyPass) {
    res.status(400).json({ error: "NOTIFY_EMAIL or NOTIFY_EMAIL_APP_PASSWORD not configured in secrets." });
    return;
  }
  try {
    const { rows } = await pool.query("SELECT name, email FROM recharge_staff WHERE id=$1", [id]);
    const staff = rows[0];
    if (!staff) { res.status(404).json({ error: "Staff not found" }); return; }
    if (!staff.email) { res.status(400).json({ error: "This staff member has no email address saved." }); return; }

    const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: notifyEmail, pass: notifyPass } });
    await transporter.sendMail({
      from: `"Sky Official" <${notifyEmail}>`,
      to: staff.email,
      subject: `✅ Test Notification — Sky Official`,
      html: `<div style="font-family:sans-serif;background:#0a0a0a;color:#f9fafb;padding:24px;max-width:440px;border-radius:14px;border:1px solid rgba(34,197,94,0.25);">
        <h2 style="color:#22c55e;margin:0 0 12px;">✅ Email Notifications Working!</h2>
        <p style="color:rgba(255,255,255,0.6);margin:0 0 12px;">Hi ${staff.name}, this is a test email from Sky Official.</p>
        <p style="color:rgba(255,255,255,0.4);font-size:13px;margin:0;">You will receive emails like this whenever a new order comes in. You're all set! 🎉</p>
      </div>`,
    });
    console.log("[email] Test email sent to staff", staff.name, "at", staff.email);
    res.json({ ok: true, sentTo: staff.email });
  } catch (err: any) {
    console.error("[email] Test email to staff failed:", err);
    res.status(500).json({ error: err?.message || "Failed to send test email." });
  }
});

router.delete("/staff/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM recharge_staff WHERE id=$1", [id]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "DB error" }); }
});

// ── Support Inquiries ─────────────────────────────────────────────────────────
router.get("/support-inquiries", requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM support_inquiries ORDER BY created_at DESC LIMIT 100"
    );
    res.json(rows);
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.put("/support-inquiries/:id/status", requireAdmin, async (req, res): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await pool.query("UPDATE support_inquiries SET status=$1 WHERE id=$2", [status, id]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "DB error" }); }
});

// ── Enhanced order search ──────────────────────────────────────────────────────
router.get("/orders/search", requireAdmin, async (req, res) => {
  const { q, status: statusFilter } = req.query as Record<string, string>;
  try {
    let query = `SELECT o.*, s.name AS staff_name FROM orders o
      LEFT JOIN recharge_staff s ON o.assigned_staff_id = s.id
      WHERE 1=1`;
    const params: any[] = [];
    if (q) {
      params.push(`%${q}%`);
      query += ` AND (o.display_id ILIKE $${params.length} OR o.mlbb_id ILIKE $${params.length} OR o.mlbb_ign ILIKE $${params.length} OR o.clerk_user_id ILIKE $${params.length})`;
    }
    if (statusFilter) {
      params.push(statusFilter);
      query += ` AND o.status = $${params.length}`;
    }
    query += " ORDER BY o.created_at DESC LIMIT 100";
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch { res.status(500).json({ error: "DB error" }); }
});

// ── Mark order completed with timestamp ───────────────────────────────────────
router.put("/orders/:id/complete", requireAdmin, async (req, res): Promise<void> => {
  const { id } = req.params;
  const { note } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE orders SET status='completed', completed_at=NOW(), note=COALESCE($1, note) WHERE id=$2 RETURNING *`,
      [note || null, id]
    );
    if (!rows[0]) { res.status(404).json({ error: "Not found" }); return; }
    res.json(rows[0]);
  } catch { res.status(500).json({ error: "DB error" }); }
});

// ── Test email notification ────────────────────────────────────────────────────
router.post("/test-email", requireAdmin, async (_req, res) => {
  const user = process.env.NOTIFY_EMAIL;
  const pass = process.env.NOTIFY_EMAIL_APP_PASSWORD;

  if (!user || !pass) {
    res.status(400).json({ ok: false, error: "NOTIFY_EMAIL or NOTIFY_EMAIL_APP_PASSWORD is not configured." });
    return;
  }

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
    await transporter.sendMail({
      from: `"Sky Official" <${user}>`,
      to: user,
      subject: "✅ Email Test — Sky Official",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0a0a0a;border-radius:16px;overflow:hidden;border:1px solid rgba(34,197,94,0.3);padding:28px;">
          <div style="text-align:center;margin-bottom:20px;">
            <div style="font-size:36px;margin-bottom:8px;">✅</div>
            <div style="color:#4ade80;font-weight:800;font-size:20px;">Email Notifications Working!</div>
            <div style="color:rgba(255,255,255,0.4);font-size:13px;margin-top:6px;">This is a test email from your Sky Official admin panel.</div>
          </div>
          <div style="background:rgba(34,197,94,0.07);border:1px solid rgba(34,197,94,0.2);border-radius:12px;padding:14px 16px;color:rgba(255,255,255,0.6);font-size:13px;line-height:1.6;text-align:center;">
            Order and inquiry notifications will be delivered to <strong style="color:#fff;">${user}</strong>
          </div>
        </div>
      `,
    });
    console.log("[email] Test email sent successfully to", user);
    res.json({ ok: true });
  } catch (err: any) {
    console.error("[email] Test email failed:", err);
    res.status(500).json({ ok: false, error: err?.message || "Failed to send test email." });
  }
});

export default router;
