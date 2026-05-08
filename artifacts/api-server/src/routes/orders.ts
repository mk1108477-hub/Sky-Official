import { Router } from "express";
import pool from "../lib/db";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

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
  const { packageId, txnId } = req.body;

  if (!packageId) {
    res.status(400).json({ ok: false, error: "packageId is required." });
    return;
  }
  if (!txnId || !String(txnId).trim()) {
    res.status(400).json({ ok: false, error: "UPI Transaction ID is required." });
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

    const { rows: accounts } = await pool.query(
      "SELECT mlbb_user_id FROM mlbb_accounts WHERE clerk_user_id = $1",
      [clerkUserId]
    );
    const mlbbId = accounts.length > 0 ? accounts[0].mlbb_user_id : null;

    const { rows: inserted } = await pool.query(
      `INSERT INTO orders (clerk_user_id, package_id, diamonds, price, mlbb_id, status, note)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6)
       RETURNING id`,
      [clerkUserId, pkg.id, pkg.diamonds, pkg.price, mlbbId, `UPI Ref: ${String(txnId).trim()}`]
    );

    res.json({ ok: true, id: inserted[0].id });
  } catch {
    res.status(500).json({ ok: false, error: "DB error. Please try again." });
  }
});

export default router;
