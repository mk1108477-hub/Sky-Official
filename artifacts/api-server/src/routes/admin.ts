import { Router } from "express";
import pool from "../lib/db";

const router = Router();

function requireAdmin(req: any, res: any, next: any) {
  const auth = req.headers["authorization"] || "";
  const password = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
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
  const { diamonds, bonus_diamonds, price, label, is_popular, sort_order, name, category } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO packages (diamonds, bonus_diamonds, price, label, is_popular, sort_order, name, category, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *`,
      [diamonds, bonus_diamonds || 0, price, label || null, is_popular || false, sort_order || 0, name || null, category || null]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "DB error" });
  }
});

router.put("/packages/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { diamonds, bonus_diamonds, price, label, is_popular, sort_order, name, category } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE packages SET diamonds=$1, bonus_diamonds=$2, price=$3, label=$4, is_popular=$5, sort_order=$6, name=$7, category=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [diamonds, bonus_diamonds || 0, price, label || null, is_popular || false, sort_order || 0, name || null, category || null, id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Not found" });
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

router.put("/orders/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE orders SET status=$1, note=$2 WHERE id=$3 RETURNING *`,
      [status, note || null, id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
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

router.post("/wallet-requests/:id/approve", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const txRes = await pool.query(
      "SELECT * FROM wallet_transactions WHERE id=$1 AND status='pending'",
      [id]
    );
    if (!txRes.rows[0]) return res.status(404).json({ error: "Not found or already processed" });
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

router.post("/wallet-requests/:id/reject", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query(
      "UPDATE wallet_transactions SET status='rejected' WHERE id=$1 AND status='pending'",
      [id]
    );
    if (!rowCount) return res.status(404).json({ error: "Not found or already processed" });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "DB error" });
  }
});

export default router;
