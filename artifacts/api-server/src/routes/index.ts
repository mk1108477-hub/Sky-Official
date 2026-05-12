import { Router, type IRouter } from "express";
import healthRouter from "./health";
import adminRouter from "./admin";
import ordersRouter from "./orders";
import walletRouter from "./wallet";
import profileRouter from "./profile";
import verifyRouter from "./verify";
import pushRouter from "./push";
import pool from "../lib/db";

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
  } catch (err) {
    res.status(500).json({ error: "DB error" });
  }
});

export default router;
