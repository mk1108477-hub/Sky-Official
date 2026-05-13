import { Router, type IRouter } from "express";
import healthRouter from "./health";
import adminRouter from "./admin";
import ordersRouter from "./orders";
import walletRouter from "./wallet";
import profileRouter from "./profile";
import verifyRouter from "./verify";
import pushRouter from "./push";
import pool from "../lib/db";
import nodemailer from "nodemailer";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/admin", adminRouter);
router.use("/orders", ordersRouter);
router.use("/wallet", walletRouter);
router.use("/profile", profileRouter);
router.use("/verify", verifyRouter);
router.use("/push", pushRouter);

router.get("/settings/category_popular", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT value FROM settings WHERE key='category_popular'");
    res.json(JSON.parse(rows[0]?.value || "{}"));
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.get("/settings/qr", async (_req, res) => {
  try {
    // Return active staff QR if any staff is available, else owner QR
    const { rows: staffRows } = await pool.query(
      "SELECT qr_image FROM recharge_staff WHERE status='available' AND qr_image IS NOT NULL ORDER BY sort_order, id LIMIT 1"
    );
    if (staffRows[0]?.qr_image) {
      res.json({ qr: staffRows[0].qr_image });
      return;
    }
    const { rows } = await pool.query("SELECT value FROM settings WHERE key='qr_code'");
    res.json({ qr: rows[0]?.value || null });
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.get("/settings/trustpilot", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT key, value FROM settings WHERE key IN ('trustpilot_url','trustpilot_enabled')");
    const m: Record<string, string> = {};
    rows.forEach((r: any) => { m[r.key] = r.value; });
    res.json({ url: m["trustpilot_url"] || "", enabled: m["trustpilot_enabled"] === "true" });
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.get("/settings/offer_banners", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT value FROM settings WHERE key='offer_banners'");
    res.json(JSON.parse(rows[0]?.value || "[]"));
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.get("/settings/pack_images", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT value FROM settings WHERE key='pack_images'");
    res.json(rows[0] ? JSON.parse(rows[0].value) : null);
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.get("/settings/pass_images", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT value FROM settings WHERE key='pass_images'");
    res.json(rows[0] ? JSON.parse(rows[0].value) : null);
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.get("/settings/starlight_images", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT value FROM settings WHERE key='starlight_images'");
    res.json(rows[0] ? JSON.parse(rows[0].value) : {});
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.get("/settings/category_availability", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT value FROM settings WHERE key='category_availability'");
    res.json(rows[0] ? JSON.parse(rows[0].value) : {});
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.get("/packages", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM packages ORDER BY sort_order ASC, diamonds ASC"
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: "DB error" });
  }
});

// ── Public stats (real DB counts) ────────────────────────────────────────────
router.get("/stats", async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(DISTINCT id)::int AS total_orders,
        COALESCE(SUM(diamonds), 0)::bigint AS total_diamonds,
        COUNT(DISTINCT clerk_user_id)::int AS total_users
      FROM orders
    `);
    res.json(rows[0]);
  } catch { res.status(500).json({ error: "DB error" }); }
});

// ── Public recent completed orders (masked for live ticker) ──────────────────
router.get("/orders/recent", async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT mlbb_ign, diamonds, created_at
      FROM orders
      WHERE status = 'completed' AND diamonds > 0
      ORDER BY created_at DESC
      LIMIT 12
    `);
    res.json(rows);
  } catch { res.status(500).json({ error: "DB error" }); }
});

// ── Promo events (active only) ────────────────────────────────────────────────
router.get("/promo-events", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT value FROM settings WHERE key='promo_events'");
    const events = JSON.parse(rows[0]?.value || "[]");
    res.json(events.filter((e: any) => e.active !== false));
  } catch { res.status(500).json({ error: "DB error" }); }
});

// ── Support inquiry submission ────────────────────────────────────────────────
router.post("/support", async (req, res) => {
  const { userEmail, userName, inquiryType, description } = req.body;
  if (!inquiryType || !description?.trim()) {
    res.status(400).json({ error: "Inquiry type and description are required." });
    return;
  }
  try {
    await pool.query(
      `INSERT INTO support_inquiries (user_email, user_name, inquiry_type, description) VALUES ($1, $2, $3, $4)`,
      [userEmail || null, userName || null, inquiryType, description.trim()]
    );

    // Send email notification
    const notifyEmail = process.env.NOTIFY_EMAIL;
    const notifyPass = process.env.NOTIFY_EMAIL_APP_PASSWORD;
    if (notifyEmail && notifyPass) {
      try {
        const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: notifyEmail, pass: notifyPass } });
        const typeLabels: Record<string, string> = {
          order: "Order Related",
          payment: "Payment Related",
          bug: "Bug / Technical Issue",
          other: "Other",
        };
        await transporter.sendMail({
          from: `"Sky Official Support" <${notifyEmail}>`,
          to: "sky2026offical@gmail.com",
          subject: `📩 Support Inquiry — ${typeLabels[inquiryType] || inquiryType}`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0a0a0a;border-radius:16px;overflow:hidden;border:1px solid rgba(245,158,11,0.3);padding:28px;">
              <h2 style="color:#f59e0b;margin:0 0 16px;">📩 New Support Inquiry</h2>
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="color:rgba(255,255,255,0.4);padding:8px 0;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.07);">Type</td><td style="color:#fff;font-weight:700;font-size:13px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.07);">${typeLabels[inquiryType] || inquiryType}</td></tr>
                ${userEmail ? `<tr><td style="color:rgba(255,255,255,0.4);padding:8px 0;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.07);">From</td><td style="color:#fff;font-weight:700;font-size:13px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.07);">${userEmail}</td></tr>` : ""}
                ${userName ? `<tr><td style="color:rgba(255,255,255,0.4);padding:8px 0;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.07);">Name</td><td style="color:#fff;font-weight:700;font-size:13px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.07);">${userName}</td></tr>` : ""}
              </table>
              <div style="margin-top:16px;background:rgba(255,255,255,0.04);border-radius:10px;padding:14px;color:rgba(255,255,255,0.8);font-size:14px;line-height:1.7;white-space:pre-wrap;">${description}</div>
            </div>
          `,
        });
      } catch {}
    }

    res.json({ ok: true });
  } catch { res.status(500).json({ error: "DB error" }); }
});

export default router;
