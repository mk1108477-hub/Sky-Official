import { Router } from "express";

const router = Router();

router.post("/mlbb", async (req, res) => {
  const { userId, serverId } = req.body;

  if (!userId || !serverId) {
    return res.status(400).json({ ok: false, error: "User ID and Server ID are required." });
  }

  const uid = String(userId).trim();
  const sid = String(serverId).trim();

  if (!/^\d+$/.test(uid) || !/^\d+$/.test(sid)) {
    return res.status(400).json({ ok: false, error: "User ID and Server ID must be numbers only." });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch("https://order.moonton.com/api/user-id/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        "Origin": "https://shop.mobilelegends.com",
        "Referer": "https://shop.mobilelegends.com/",
      },
      body: JSON.stringify({ userId: uid, serverId: sid }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const text = await response.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = {}; }

    const username =
      data?.username ||
      data?.data?.username ||
      data?.data?.nickName ||
      data?.nickName ||
      data?.player?.username ||
      null;

    if (username) {
      return res.json({ ok: true, username });
    }

    return res.json({ ok: false, error: "Could not find account. Please double-check your User ID and Server ID." });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return res.status(504).json({ ok: false, error: "Verification timed out. Please try again." });
    }
    return res.status(502).json({ ok: false, error: "Verification service is unavailable right now. Please try again later." });
  }
});

export default router;
