import { Router } from "express";
import pool from "../lib/db";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/my", requireAuth, async (req: any, res) => {
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

export default router;
