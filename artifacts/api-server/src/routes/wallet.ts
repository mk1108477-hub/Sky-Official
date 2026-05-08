import { Router } from "express";
import pool from "../lib/db";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/balance", requireAuth, async (req: any, res) => {
  const userId = req.clerkUserId as string;
  try {
    const walletRes = await pool.query(
      "SELECT balance FROM wallets WHERE clerk_user_id = $1",
      [userId]
    );
    const balance = walletRes.rows[0]?.balance ?? "0";

    const txRes = await pool.query(
      "SELECT * FROM wallet_transactions WHERE clerk_user_id = $1 ORDER BY created_at DESC LIMIT 20",
      [userId]
    );

    res.json({ balance: parseFloat(balance), transactions: txRes.rows });
  } catch {
    res.status(500).json({ error: "DB error" });
  }
});

router.post("/topup", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.clerkUserId as string;
  const { amount, upi_ref } = req.body;

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    res.status(400).json({ error: "Invalid amount" });
    return;
  }
  if (!upi_ref || String(upi_ref).trim() === "") {
    res.status(400).json({ error: "UPI reference is required" });
    return;
  }

  try {
    await pool.query(
      `INSERT INTO wallet_transactions (clerk_user_id, amount, type, status, upi_ref, description)
       VALUES ($1, $2, 'credit', 'pending', $3, 'Wallet top-up request')`,
      [userId, Number(amount).toFixed(2), String(upi_ref).trim()]
    );
    res.json({ ok: true, message: "Top-up request submitted. Admin will credit your wallet shortly." });
  } catch {
    res.status(500).json({ error: "DB error" });
  }
});

export default router;
