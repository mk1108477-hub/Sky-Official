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

    // Use provided target MLBB info; fallback to verified account
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

    const { rows: inserted } = await pool.query(
      `INSERT INTO orders (clerk_user_id, package_id, diamonds, price, mlbb_id, mlbb_server_id, mlbb_ign, is_for_friend, status, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9)
       RETURNING id`,
      [clerkUserId, pkg.id, pkg.diamonds, pkg.price, mlbbId, serverId, ign, isForFriend || false, note]
    );

    const orderId = inserted[0].id;
    const diamonds = Number(pkg.diamonds).toLocaleString("en-IN");
    const price = parseFloat(pkg.price).toFixed(0);

    sendPushToAll({
      title: "💎 New Order!",
      body: `${diamonds} diamonds · ₹${price}${mlbbId ? ` · ID: ${mlbbId}` : ""}${isForFriend ? " (Friend)" : ""}`,
      tag: "new-order",
      url: "/admin",
    });

    const lines = [
      "🛒 *New Order — Sky Official*",
      "",
      `📦 *Package:* ♦ ${diamonds} Diamonds`,
      `💰 *Amount:* ₹${price}`,
      mlbbId ? `🎮 *MLBB ID:* ${mlbbId}` : null,
      serverId ? `🌐 *Server:* ${serverId}` : null,
      ign ? `👤 *IGN:* ${ign}` : null,
      isForFriend ? "👥 *Recharge:* For a Friend" : null,
      remark ? `🔑 *Remark:* ${remark}` : null,
      `🆔 *Order #:* ${orderId}`,
      "",
      "Open admin panel to fulfill →",
    ];
    sendWhatsApp(lines.filter(Boolean).join("\n"));

    sendOrderEmail({
      orderId,
      diamonds: pkg.diamonds,
      price: pkg.price,
      mlbbId,
      remark: remark ?? null,
    }).catch(() => {});

    res.json({ ok: true, id: orderId });
  } catch {
    res.status(500).json({ ok: false, error: "DB error. Please try again." });
  }
});

// Cart checkout — creates multiple orders at once
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

    for (const item of items) {
      const { packageId, quantity = 1 } = item;
      const { rows: pkgs } = await pool.query(
        "SELECT id, diamonds, price FROM packages WHERE id = $1", [packageId]
      );
      if (!pkgs[0]) continue;
      const pkg = pkgs[0];
      for (let q = 0; q < quantity; q++) {
        const note = noteBase ? noteBase + friendNote : friendNote || null;
        const { rows: inserted } = await pool.query(
          `INSERT INTO orders (clerk_user_id, package_id, diamonds, price, mlbb_id, mlbb_server_id, mlbb_ign, is_for_friend, status, note)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9) RETURNING id`,
          [clerkUserId, pkg.id, pkg.diamonds, pkg.price, mlbbId, serverId, ign, isForFriend || false, note]
        );
        orderIds.push(inserted[0].id);
      }
    }

    const totalDiamonds = items.reduce((s: number, i: any) => s + (i.diamonds || 0) * (i.quantity || 1), 0);
    const totalPrice = items.reduce((s: number, i: any) => s + parseFloat(i.price || "0") * (i.quantity || 1), 0);
    sendPushToAll({ title: "🛒 Cart Order!", body: `${orderIds.length} items · ₹${totalPrice.toFixed(0)}`, tag: "new-order", url: "/admin" });
    sendWhatsApp(`🛒 *Cart Order*\n${orderIds.length} items · ♦${totalDiamonds} diamonds · ₹${totalPrice.toFixed(0)}\n${mlbbId ? `🎮 ID: ${mlbbId}` : ""}`);

    res.json({ ok: true, ids: orderIds });
  } catch {
    res.status(500).json({ ok: false, error: "DB error. Please try again." });
  }
});

export default router;
