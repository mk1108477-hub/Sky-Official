import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@clerk/react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "").replace(/^\/[^/]+/, "") + "/api";
const UPI_ID = "8974666701@ptyes";
const UPI_NAME = "Mantoshkumar Sarangthem";

export interface SelectedPackage {
  id: number;
  diamonds: number;
  bonus_diamonds: number;
  price: string;
  name: string | null;
  category: string | null;
}

let _selectedPackage: SelectedPackage | null = null;
export function setSelectedPackage(pkg: SelectedPackage | null) { _selectedPackage = pkg; }
export function getSelectedPackage() { return _selectedPackage; }

export default function PaymentPage() {
  const [, setLocation] = useLocation();
  const { getToken, isSignedIn } = useAuth();
  const [txnInput, setTxnInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const pkg = _selectedPackage;

  if (!pkg) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    setTimeout(() => setLocation("/packages"), 0);
    return null;
  }

  const safePkg = pkg;

  const amount = Number(pkg.price);
  const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`MLBB ${pkg.diamonds} Diamonds - Sky Official`)}`;

  function copyUpiId() {
    navigator.clipboard.writeText(UPI_ID).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function submitOrder() {
    if (!txnInput.trim()) {
      setError("Please enter your UPI Transaction ID / UTR number before submitting.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const token = isSignedIn ? await getToken() : null;
      const r = await fetch(`${API}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ packageId: safePkg.id, txnId: txnInput.trim() }),
      });
      const data = await r.json();
      if (data.ok || data.id) {
        setOrderId(data.id ?? null);
        setSubmitted(true);
      } else {
        setError(data.error ?? "Could not submit order. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    }
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div style={{ background: "#0a0a0a", minHeight: "100vh", paddingBottom: 48 }}>
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 40, background: "rgba(10,10,10,0.93)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px" }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>Order Submitted</div>
        </div>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "88px 16px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(34,197,94,0.12)", border: "2px solid rgba(34,197,94,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 22, marginBottom: 8 }}>Order Placed!</div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 1.6 }}>
              Your order for <strong style={{ color: "#f59e0b" }}>♦ {pkg.diamonds.toLocaleString()} Diamonds</strong> has been submitted.
              We'll deliver to your MLBB account within minutes after payment is confirmed.
            </div>
          </div>

          <div style={{ width: "100%", background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
            {orderId && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Order ID</span>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>#{orderId}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Diamonds</span>
              <span style={{ color: "#38bdf8", fontWeight: 700, fontSize: 13 }}>♦ {pkg.diamonds.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Amount Paid</span>
              <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 13 }}>₹{amount.toLocaleString("en-IN")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Status</span>
              <span style={{ color: "#fbbf24", fontWeight: 700, fontSize: 13 }}>Pending Verification</span>
            </div>
          </div>

          <div style={{ width: "100%", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 14, padding: "12px 16px", fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
            💬 Need help? Chat with us on WhatsApp for instant support.
          </div>

          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
            <button onClick={() => setLocation("/orders")} style={{ width: "100%", padding: "14px 0", borderRadius: 14, background: "linear-gradient(135deg,#fcd34d,#f59e0b)", color: "#000", fontWeight: 800, fontSize: 15, border: "none", cursor: "pointer" }}>
              View My Orders
            </button>
            <button onClick={() => { setSelectedPackage(null); setLocation("/packages"); }} style={{ width: "100%", padding: "14px 0", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Buy More Diamonds
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", paddingBottom: 60 }}>
      <style>{`@keyframes payIn { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }`}</style>

      {/* Header */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 40, background: "rgba(10,10,10,0.93)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px" }}>
        <button
          onClick={() => setLocation("/packages")}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 5l-7 7 7 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>Complete Payment</span>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "72px 16px 0", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Package Summary */}
        <div style={{ background: "linear-gradient(135deg,#1a1200,#0f0d00)", border: "1.5px solid rgba(245,158,11,0.3)", borderRadius: 20, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", animation: "payIn 0.4s ease both" }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>You're buying</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ color: "#38bdf8", fontSize: 20, fontWeight: 900 }}>♦</span>
              <span style={{ color: "#fff", fontWeight: 900, fontSize: 28 }}>{pkg.diamonds.toLocaleString()}</span>
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Diamonds</span>
            </div>
            {pkg.bonus_diamonds > 0 && (
              <div style={{ color: "#4ade80", fontSize: 12, fontWeight: 600, marginTop: 3 }}>
                +{pkg.bonus_diamonds} bonus included
              </div>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginBottom: 4 }}>Total</div>
            <div style={{ color: "#f59e0b", fontWeight: 900, fontSize: 30 }}>₹{amount.toLocaleString("en-IN")}</div>
          </div>
        </div>

        {/* QR Section */}
        <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, overflow: "hidden", animation: "payIn 0.4s ease 0.08s both" }}>
          <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Scan to Pay</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Use any UPI app — PhonePe, GPay, Paytm, BHIM, or any bank app</div>
          </div>

          {/* QR Image */}
          <div style={{ display: "flex", justifyContent: "center", padding: "20px 20px 12px" }}>
            <img
              src="/upi-qr.png"
              alt="UPI QR Code"
              style={{ width: 220, height: "auto", borderRadius: 12, display: "block" }}
            />
          </div>

          {/* UPI ID row */}
          <div style={{ margin: "0 20px 16px", background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3 }}>UPI ID</div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{UPI_ID}</div>
            </div>
            <button
              onClick={copyUpiId}
              style={{ background: copied ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.12)", border: `1px solid ${copied ? "rgba(34,197,94,0.35)" : "rgba(245,158,11,0.3)"}`, borderRadius: 8, padding: "7px 14px", color: copied ? "#22c55e" : "#f59e0b", fontWeight: 700, fontSize: 12, cursor: "pointer", flexShrink: 0, transition: "all 0.2s" }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Pay Now Button */}
        <a
          href={upiLink}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            padding: "16px 0", borderRadius: 16,
            background: "linear-gradient(135deg,#fcd34d,#f59e0b)",
            color: "#000", fontWeight: 900, fontSize: 17,
            textDecoration: "none", boxShadow: "0 0 32px rgba(245,158,11,0.45)",
            animation: "payIn 0.4s ease 0.14s both",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14l-4-4 1.41-1.41L11 13.17l6.59-6.59L19 8l-8 8z" fill="#000"/>
          </svg>
          Pay ₹{amount.toLocaleString("en-IN")} via UPI
        </a>
        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: -8 }}>
          Opens your preferred UPI app automatically
        </div>

        {/* Transaction ID Input */}
        <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "18px 20px", animation: "payIn 0.4s ease 0.2s both" }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginBottom: 6 }}>After Paying</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 14, lineHeight: 1.5 }}>
            Enter your UPI Transaction ID or UTR number from the payment confirmation screen.
          </div>
          <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
            UPI Transaction ID / UTR
          </label>
          <input
            type="text"
            placeholder="e.g. T2506081234567890"
            value={txnInput}
            onChange={e => { setTxnInput(e.target.value); setError(""); }}
            style={{ width: "100%", background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "13px 16px", color: "#fff", fontSize: 15, fontWeight: 600, boxSizing: "border-box", outline: "none" }}
          />

          {error && (
            <div style={{ marginTop: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "9px 13px", color: "#ef4444", fontSize: 13 }}>
              {error}
            </div>
          )}

          <button
            onClick={submitOrder}
            disabled={submitting}
            style={{ width: "100%", padding: "14px 0", borderRadius: 12, marginTop: 14, background: submitting ? "rgba(245,158,11,0.3)" : "linear-gradient(135deg,#fcd34d,#f59e0b)", color: submitting ? "rgba(0,0,0,0.5)" : "#000", fontWeight: 800, fontSize: 15, border: "none", cursor: submitting ? "default" : "pointer", transition: "all 0.2s" }}
          >
            {submitting ? "Submitting…" : "I Have Paid — Submit Order →"}
          </button>
        </div>

        {/* Safety note */}
        <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 14, padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start", animation: "payIn 0.4s ease 0.26s both" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, lineHeight: 1.5, margin: 0 }}>
            Only pay to UPI ID <strong style={{ color: "rgba(255,255,255,0.65)" }}>{UPI_ID}</strong>. Do not pay to any other account. Always verify the QR code before paying.
          </p>
        </div>

      </div>
    </div>
  );
}
