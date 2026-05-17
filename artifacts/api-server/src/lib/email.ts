import nodemailer from "nodemailer";

function createTransporter() {
  const user = process.env.NOTIFY_EMAIL;
  const pass = process.env.NOTIFY_EMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user, pass },
    family: 4,
    connectionTimeout: 10000,
    socketTimeout: 10000,
    greetingTimeout: 10000,
  });
}

async function verifyTransporter(transporter: ReturnType<typeof nodemailer.createTransport>, label: string) {
  console.log(`[notify] SMTP_VERIFY_STARTED — ${label}`);
  try {
    await transporter.verify();
    console.log(`[notify] SMTP_VERIFY_SUCCESS — ${label}`);
  } catch (err: any) {
    console.error(`[notify] SMTP_VERIFY_FAILED — ${label}: ${err?.message}`);
    throw err;
  }
}

export async function sendOrderEmail(order: {
  orderId: number;
  diamonds: number;
  price: string;
  mlbbId: string | null;
  remark: string | null;
}) {
  const user = process.env.NOTIFY_EMAIL;
  const pass = process.env.NOTIFY_EMAIL_APP_PASSWORD;

  console.log(`[notify] EMAIL_ATTEMPT_STARTED — order #${order.orderId} to owner`);

  if (!user || !pass) {
    console.error("[notify] EMAIL_FAILED — NOTIFY_EMAIL or NOTIFY_EMAIL_APP_PASSWORD not set");
    return;
  }

  const transporter = createTransporter()!;
  try {
    await verifyTransporter(transporter, `order #${order.orderId} to owner`);
  } catch {
    console.error(`[notify] EMAIL_FAILED — order #${order.orderId} to owner: SMTP verification failed, aborting send`);
    return;
  }

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

  try {
    const info = await transporter.sendMail({
      from: `"Sky Official" <${user}>`,
      to: user,
      subject: `💎 New Order #${order.orderId} — ♦${diamonds} Diamonds · ₹${price}`,
      html,
    });
    console.log(`[notify] EMAIL_SENT_SUCCESS — order #${order.orderId} to owner, messageId: ${info.messageId}`);
  } catch (err: any) {
    console.error(`[notify] EMAIL_FAILED — order #${order.orderId} to owner: ${err?.message}`);
    throw err;
  }
}

export async function notifyAvailableStaff(orderId: string, assignedStaffId: number | null, orderData: {
  diamonds: number;
  price: string;
  mlbbId: string | null;
}, db: any) {
  const notifyEmail = process.env.NOTIFY_EMAIL;
  const notifyPass = process.env.NOTIFY_EMAIL_APP_PASSWORD;

  if (!notifyEmail || !notifyPass) {
    console.error("[notify] STAFF_EMAIL_SKIPPED — NOTIFY_EMAIL or NOTIFY_EMAIL_APP_PASSWORD not set");
    return;
  }

  let staffList: any[];
  try {
    const { rows } = await db.query(
      `SELECT id, name, email FROM recharge_staff WHERE notify_orders = TRUE AND status = 'available' AND email IS NOT NULL AND email != ''`
    );
    staffList = rows;
  } catch (err: any) {
    console.error(`[notify] STAFF_EMAIL_FAILED — DB query error: ${err?.message}`);
    return;
  }

  if (staffList.length === 0) {
    console.log("[notify] STAFF_EMAIL_SKIPPED — no available staff with notify_orders=true and email");
    return;
  }

  console.log(`[notify] NOTIFICATION_TRIGGERED — notifying ${staffList.length} available staff for order ${orderId}`);

  const transporter = createTransporter()!;
  try {
    await verifyTransporter(transporter, `staff notifications for order ${orderId}`);
  } catch {
    console.error(`[notify] STAFF_EMAIL_FAILED — SMTP verification failed for order ${orderId}, aborting`);
    return;
  }

  const diamonds = Number(orderData.diamonds).toLocaleString("en-IN");
  const price = parseFloat(orderData.price).toFixed(0);

  for (const staff of staffList) {
    const isAssigned = assignedStaffId === staff.id;
    console.log(`[notify] EMAIL_ATTEMPT_STARTED — order ${orderId} to staff ${staff.name} <${staff.email}>`);
    try {
      const info = await transporter.sendMail({
        from: `"Sky Official" <${notifyEmail}>`,
        to: staff.email,
        subject: `💎 New Order ${orderId}${isAssigned ? " — Assigned to You" : ""}`,
        html: `<div style="font-family:sans-serif;background:#0a0a0a;color:#f9fafb;padding:24px;max-width:440px;border-radius:14px;border:1px solid rgba(245,158,11,0.25);">
          <h2 style="color:#f59e0b;margin:0 0 8px;">💎 New Order — Sky Official</h2>
          <p style="color:rgba(255,255,255,0.6);margin:0 0 16px;font-size:13px;">Hi ${staff.name}${isAssigned ? ", this order has been assigned to you" : ", a new order just came in"}.</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="color:rgba(255,255,255,0.4);padding:8px 0;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.07);">Order ID</td><td style="color:#f59e0b;font-weight:800;text-align:right;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.07);">${orderId}</td></tr>
            <tr><td style="color:rgba(255,255,255,0.4);padding:8px 0;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.07);">Diamonds</td><td style="color:#fff;font-weight:700;text-align:right;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.07);">♦ ${diamonds}</td></tr>
            <tr><td style="color:rgba(255,255,255,0.4);padding:8px 0;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.07);">Amount</td><td style="color:#fff;font-weight:700;text-align:right;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.07);">₹${price}</td></tr>
            ${orderData.mlbbId ? `<tr><td style="color:rgba(255,255,255,0.4);padding:8px 0;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.07);">MLBB ID</td><td style="color:#38bdf8;font-weight:700;text-align:right;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.07);">${orderData.mlbbId}</td></tr>` : ""}
            ${isAssigned ? `<tr><td colspan="2" style="padding:8px 0;font-size:12px;"><span style="background:rgba(245,158,11,0.15);color:#f59e0b;font-weight:700;border-radius:20px;padding:3px 10px;border:1px solid rgba(245,158,11,0.3);">Assigned to You</span></td></tr>` : ""}
          </table>
          <p style="color:rgba(255,255,255,0.3);font-size:11px;margin-top:20px;">Log in to the admin panel to process this order.</p>
        </div>`,
      });
      console.log(`[notify] EMAIL_SENT_SUCCESS — order ${orderId} to staff ${staff.name}, messageId: ${info.messageId}`);
    } catch (err: any) {
      console.error(`[notify] EMAIL_FAILED — order ${orderId} to staff ${staff.name} <${staff.email}>: ${err?.message}`);
    }
  }
}

export async function sendInquiryEmail(inquiry: {
  userEmail: string | null;
  userName: string | null;
  inquiryType: string;
  description: string;
}) {
  const notifyEmail = process.env.NOTIFY_EMAIL;
  const notifyPass = process.env.NOTIFY_EMAIL_APP_PASSWORD;

  console.log(`[notify] EMAIL_ATTEMPT_STARTED — inquiry notification from ${inquiry.userEmail || "anonymous"}`);

  if (!notifyEmail || !notifyPass) {
    console.error("[notify] EMAIL_FAILED — NOTIFY_EMAIL or NOTIFY_EMAIL_APP_PASSWORD not set");
    return;
  }

  const transporter = createTransporter()!;
  try {
    await verifyTransporter(transporter, `inquiry notification from ${inquiry.userEmail || "anonymous"}`);
  } catch {
    console.error(`[notify] EMAIL_FAILED — inquiry notification: SMTP verification failed, aborting send`);
    return;
  }

  const typeLabels: Record<string, string> = {
    order: "Order Related",
    payment: "Payment Related",
    bug: "Bug / Technical Issue",
    other: "Other",
  };

  try {
    const info = await transporter.sendMail({
      from: `"Sky Official Support" <${notifyEmail}>`,
      to: notifyEmail,
      subject: `📩 Support Inquiry — ${typeLabels[inquiry.inquiryType] || inquiry.inquiryType}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0a0a0a;border-radius:16px;overflow:hidden;border:1px solid rgba(245,158,11,0.3);padding:28px;">
          <h2 style="color:#f59e0b;margin:0 0 16px;">📩 New Support Inquiry</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="color:rgba(255,255,255,0.4);padding:8px 0;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.07);">Type</td><td style="color:#fff;font-weight:700;font-size:13px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.07);">${typeLabels[inquiry.inquiryType] || inquiry.inquiryType}</td></tr>
            ${inquiry.userEmail ? `<tr><td style="color:rgba(255,255,255,0.4);padding:8px 0;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.07);">From</td><td style="color:#fff;font-weight:700;font-size:13px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.07);">${inquiry.userEmail}</td></tr>` : ""}
            ${inquiry.userName ? `<tr><td style="color:rgba(255,255,255,0.4);padding:8px 0;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.07);">Name</td><td style="color:#fff;font-weight:700;font-size:13px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.07);">${inquiry.userName}</td></tr>` : ""}
          </table>
          <div style="margin-top:16px;background:rgba(255,255,255,0.04);border-radius:10px;padding:14px;color:rgba(255,255,255,0.8);font-size:14px;line-height:1.7;white-space:pre-wrap;">${inquiry.description}</div>
        </div>
      `,
    });
    console.log(`[notify] EMAIL_SENT_SUCCESS — inquiry notification to owner, messageId: ${info.messageId}`);
  } catch (err: any) {
    console.error(`[notify] EMAIL_FAILED — inquiry notification: ${err?.message}`);
  }
}
