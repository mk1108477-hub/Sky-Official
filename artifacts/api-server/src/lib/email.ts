import nodemailer from "nodemailer";

export async function sendOrderEmail(order: {
  orderId: number;
  diamonds: number;
  price: string;
  mlbbId: string | null;
  remark: string | null;
}) {
  const user = process.env.NOTIFY_EMAIL;
  const pass = process.env.NOTIFY_EMAIL_APP_PASSWORD;
  if (!user || !pass) return;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  const diamonds = Number(order.diamonds).toLocaleString("en-IN");
  const price = parseFloat(order.price).toFixed(0);

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0a0a0a;border-radius:16px;overflow:hidden;border:1px solid rgba(245,158,11,0.3)">
      <div style="background:linear-gradient(135deg,#1a1300,#0f0d00);padding:24px;text-align:center;border-bottom:1px solid rgba(245,158,11,0.2)">
        <div style="color:#f59e0b;font-size:28px;margin-bottom:4px">💎</div>
        <div style="color:#fff;font-weight:800;font-size:20px">New Order — Sky Official</div>
        <div style="color:rgba(255,255,255,0.4);font-size:13px;margin-top:4px">Order #${order.orderId}</div>
      </div>
      <div style="padding:20px 24px">
        <table style="width:100%;border-collapse:collapse">
          <tr style="border-bottom:1px solid rgba(255,255,255,0.07)">
            <td style="color:rgba(255,255,255,0.4);font-size:13px;padding:10px 0">Package</td>
            <td style="color:#38bdf8;font-weight:700;font-size:13px;text-align:right">♦ ${diamonds} Diamonds</td>
          </tr>
          <tr style="border-bottom:1px solid rgba(255,255,255,0.07)">
            <td style="color:rgba(255,255,255,0.4);font-size:13px;padding:10px 0">Amount</td>
            <td style="color:#f59e0b;font-weight:700;font-size:13px;text-align:right">₹${price}</td>
          </tr>
          ${order.mlbbId ? `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.07)">
            <td style="color:rgba(255,255,255,0.4);font-size:13px;padding:10px 0">MLBB ID</td>
            <td style="color:#fff;font-weight:700;font-size:13px;text-align:right">${order.mlbbId}</td>
          </tr>` : ""}
          ${order.remark ? `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.07)">
            <td style="color:rgba(255,255,255,0.4);font-size:13px;padding:10px 0">Remark</td>
            <td style="color:#fff;font-weight:700;font-size:13px;text-align:right;font-family:monospace">${order.remark}</td>
          </tr>` : ""}
          <tr>
            <td style="color:rgba(255,255,255,0.4);font-size:13px;padding:10px 0">Status</td>
            <td style="text-align:right"><span style="background:rgba(245,158,11,0.15);color:#f59e0b;font-weight:700;font-size:12px;border-radius:20px;padding:3px 10px;border:1px solid rgba(245,158,11,0.3)">Pending</span></td>
          </tr>
        </table>
      </div>
      <div style="padding:0 24px 24px">
        <div style="background:rgba(245,158,11,0.07);border:1px solid rgba(245,158,11,0.2);border-radius:12px;padding:12px 16px;color:rgba(255,255,255,0.5);font-size:12px;line-height:1.6">
          Log in to your admin panel to mark this order as fulfilled once payment is verified.
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Sky Official" <${user}>`,
    to: user,
    subject: `💎 New Order #${order.orderId} — ♦${diamonds} Diamonds · ₹${price}`,
    html,
  });
}
