import { Router } from "express";
import pool from "../lib/db";
import { requireAuth } from "../middlewares/requireAuth";
import { sendPushToAll } from "./push";

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
        body: JSON.stringify({
          chatId: ADMIN_WHATSAPP_CHAT_ID,
          message,
        }),
      }
    );
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
  const { packageId, refId, remark } = req.body;

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

    const { rows: accounts } = await pool.query(
      "SELECT mlbb_user_id FROM mlbb_accounts WHERE clerk_user_id = $1",
      [clerkUserId]
    );
    const mlbbId = accounts.length > 0 ? accounts[0].mlbb_user_id : null;

    const note = remark ? `Ref: ${remark}` : refId ? `Ref: ${refId}` : null;

    const { rows: inserted } = await pool.query(
      `INSERT INTO orders (clerk_user_id, package_id, diamonds, price, mlbb_id, status, note)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6)
       RETURNING id`,
      [clerkUserId, pkg.id, pkg.diamonds, pkg.price, mlbbId, note]
    );

    const orderId = inserted[0].id;
    const diamonds = Number(pkg.diamonds).toLocaleString("en-IN");
    const price = parseFloat(pkg.price).toFixed(0);

    // Browser push notification
    sendPushToAll({
      title: "💎 New Order!",
      body: `${diamonds} diamonds · ₹${price}${mlbbId ? ` · ID: ${mlbbId}` : ""}`,
      tag: "new-order",
      url: "/admin",
    });

    // WhatsApp notification via Green API
    const lines = [
      "🛒 *New Order — Sky Official*",
      "",
      `📦 *Package:* ♦ ${diamonds} Diamonds`,
      `💰 *Amount:* ₹${price}`,
      mlbbId ? `🎮 *MLBB ID:* ${mlbbId}` : null,
      remark ? `🔑 *Remark:* ${remark}` : null,
      `🆔 *Order #:* ${orderId}`,
      "",
      "Open admin panel to fulfill →",
    ];
    sendWhatsApp(lines.filter(Boolean).join("\n"));

    res.json({ ok: true, id: orderId });
  } catch {
    res.status(500).json({ ok: false, error: "DB error. Please try again." });
  }
});

export default router;
