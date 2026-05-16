import { Router, type IRouter } from "express";
import healthRouter from "./health";
import adminRouter from "./admin";
import ordersRouter from "./orders";
import walletRouter from "./wallet";
import profileRouter from "./profile";
import verifyRouter from "./verify";
import pushRouter from "./push";
import pool from "../lib/db";
import { sendInquiryEmail } from "../lib/email";

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

    console.log(`[notify] INQUIRY_SAVED — type: ${inquiryType}, from: ${userEmail || "anonymous"}`);

    // Respond immediately — fire email in background
    res.json({ ok: true });

    console.log(`[notify] NOTIFICATION_TRIGGERED — inquiry from ${userEmail || "anonymous"}`);
    sendInquiryEmail({ userEmail: userEmail || null, userName: userName || null, inquiryType, description }).catch((err: any) => {
      console.error("[notify] EMAIL_FAILED — inquiry:", err?.message);
    });
  } catch (err: any) {
    console.error("[support] POST /support failed:", err?.message);
    res.status(500).json({ error: "DB error" });
  }
});

export default router;
