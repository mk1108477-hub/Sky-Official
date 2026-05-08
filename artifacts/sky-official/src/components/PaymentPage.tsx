import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@clerk/react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "").replace(/^\/[^/]+/, "") + "/api";
const UPI_ID = "8974666701@ptyes";
const UPI_NAME = "Mantoshkumar Sarangthem";
const QR_PATH = "/upi-qr.jpg";

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

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>{label}</span>
      <span style={{ color: accent ? "#f59e0b" : "#fff", fontWeight: 700, fontSize: 13 }}>{value}</span>
    </div>
  );
}

export default function PaymentPage() {
  const [, setLocation] = useLocation();
  const { getToken, isSignedIn } = useAuth();
  const [txnInput, setTxnInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLImageElement>(null);

  const pkg = _selectedPackage;

  if (!pkg) {
    setTimeout(() => setLocation("/packages"), 0);
    return null;
  }

  const amount = Number(pkg.price);
  const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`MLBB ${pkg.diamonds} Diamonds - Sky Official`)}`;

  function copyUpiId() {
    navigator.clipboard.writeText(UPI_ID).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function downloadQR() {
    const a = document.createElement("a");
    a.href = QR_PATH;
    a.download = "SkyOfficial-UPI-QR.jpg";
    a.click();
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
        body: JSON.stringify({ packageId: pkg.id, txnId: txnInput.trim() }),
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

  // ── Success screen ──────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={{ background: "#0a0a0a", minHeight: "100vh", paddingBottom: 48 }}>
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 40, background: "rgba(10,10,10,0.95)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px" }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>Order Submitted</div>
        </div>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "88px 16px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(34,197,94,0.12)", border: "2px solid rgba(34,197,94,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 22, marginBottom: 8 }}>Order Placed!</div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 1.6 }}>
              Your order for <strong style={{ color: "#f59e0b" }}>♦ {pkg.diamonds.toLocaleString()} Diamonds</strong> has been submitted.
              We'll deliver to your MLBB account within minutes after payment is confirmed.
            </div>
          </div>
          <div style={{ width: "100%", background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
            {orderId && <Row label="Order ID" value={`#${orderId}`} />}
            <Row label="Diamonds" value={`♦ ${pkg.diamonds.toLocaleString()}`} accent />
            <Row label="Amount Paid" value={`₹${amount.toLocaleString("en-IN")}`} accent />
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 11 }}>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Status</span>
              <span style={{ color: "#fbbf24", fontWeight: 700, fontSize: 13 }}>Pending Verification</span>
            </div>
          </div>
          <div style={{ width: "100%", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 14, padding: "12px 16px", fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
            💬 Need help? Chat with us on WhatsApp for instant support.
          </div>
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
            <button onClick={() => setLocation("/orders")} style={{ width: "100%", padding: "14px 0", borderRadius: 14, background: "linear-gradient(135deg,#fcd34d,#f59e0b)", color: "#000", fontWeight: 800, fontSize: 15, border: "none", cursor: "pointer" }}>View My Orders</button>
            <button onClick={() => { setSelectedPackage(null); setLocation("/packages"); }} style={{ width: "100%", padding: "14px 0", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Buy More Diamonds</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Payment screen ──────────────────────────────────────────────────────
  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", paddingBottom: 60 }}>
      <style>{`
        @keyframes payIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes qrGlow { 0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,0)} 50%{box-shadow:0 0 0 6px rgba(245,158,11,0.12)} }
      `}</style>

      {/* Header */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 40, background: "rgba(10,10,10,0.95)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(245,158,11,0.12)", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px" }}>
        <button onClick={() => setLocation("/packages")} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 5l-7 7 7 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, overflow: "hidden", border: "1.5px solid rgba(245,158,11,0.5)", flexShrink: 0 }}>
            <img src="/logo.jpg" alt="Sky Official" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>Sky Official</div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>Secure UPI Payment</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 20, padding: "4px 10px" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
          <span style={{ color: "#22c55e", fontSize: 11, fontWeight: 700 }}>Secure</span>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "72px 14px 0", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* ── Amount Card ── */}
        <div style={{ background: "linear-gradient(135deg,#1a1300,#120e00)", border: "1.5px solid rgba(245,158,11,0.28)", borderRadius: 20, padding: "20px 20px 18px", animation: "payIn 0.4s ease both" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>Amount to be paid</div>
            <div style={{ color: "#f59e0b", fontWeight: 900, fontSize: 42, letterSpacing: "-1px", lineHeight: 1 }}>₹{amount.toLocaleString("en-IN")}</div>
            {pkg.bonus_diamonds > 0 && (
              <div style={{ color: "#4ade80", fontSize: 12, fontWeight: 600, marginTop: 6 }}>+{pkg.bonus_diamonds.toLocaleString()} bonus diamonds included</div>
            )}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 20, padding: "4px 14px" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#f59e0b" }} />
              <span style={{ color: "#f59e0b", fontSize: 12, fontWeight: 700 }}>Status: Pending</span>
            </div>
          </div>
        </div>

        {/* ── Order Details Card ── */}
        <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "4px 20px 4px", animation: "payIn 0.4s ease 0.06s both" }}>
          <Row label="Diamonds" value={`♦ ${pkg.diamonds.toLocaleString()}`} accent />
          <Row label="Package" value={pkg.name || `${pkg.diamonds.toLocaleString()} Diamonds`} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0" }}>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Payee UPI</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{UPI_ID}</span>
              <button onClick={copyUpiId} style={{ background: copied ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.12)", border: `1px solid ${copied ? "rgba(34,197,94,0.4)" : "rgba(245,158,11,0.3)"}`, borderRadius: 6, padding: "3px 10px", color: copied ? "#22c55e" : "#f59e0b", fontWeight: 700, fontSize: 11, cursor: "pointer", transition: "all 0.2s", flexShrink: 0 }}>
                {copied ? "✓" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        {/* ── QR Card ── */}
        <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, overflow: "hidden", animation: "payIn 0.4s ease 0.12s both" }}>
          <div style={{ padding: "14px 20px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Scan to Pay</div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 2 }}>PhonePe · GPay · Paytm · BHIM · Any UPI app</div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {["P", "G", "B"].map((l, i) => (
                <div key={i} style={{ width: 26, height: 26, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 10, background: i === 0 ? "#5f259f" : i === 1 ? "#1a73e8" : "#00b9f1", color: "#fff" }}>{l}</div>
              ))}
            </div>
          </div>

          {/* QR Image */}
          <div style={{ display: "flex", justifyContent: "center", padding: "20px 24px 16px" }}>
            <div style={{ background: "#fff", borderRadius: 16, padding: 14, animation: "qrGlow 3s ease-in-out infinite" }}>
              <img
                ref={qrRef}
                src={QR_PATH}
                alt="UPI QR Code"
                style={{ width: 200, height: 200, display: "block", borderRadius: 6, objectFit: "contain" }}
              />
            </div>
          </div>

          {/* QR action buttons */}
          <div style={{ display: "flex", gap: 10, padding: "0 20px 20px" }}>
            <button
              onClick={downloadQR}
              style={{ flex: 1, padding: "11px 0", borderRadius: 12, background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.15)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "all 0.2s" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 3v14m-7-7l7 7 7-7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="19" width="18" height="2" rx="1" fill="#fff"/></svg>
              Download QR
            </button>
            <a
              href={upiLink}
              style={{ flex: 1, padding: "11px 0", borderRadius: 12, background: "linear-gradient(135deg,#fcd34d,#f59e0b)", color: "#000", fontWeight: 800, fontSize: 13, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, boxShadow: "0 4px 18px rgba(245,158,11,0.35)", transition: "all 0.2s" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 22V12m0 0l-4 4m4-4l4 4" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 16.7A9 9 0 1 0 3.5 10" stroke="#000" strokeWidth="2" strokeLinecap="round"/></svg>
              Pay with UPI
            </a>
          </div>
        </div>

        {/* ── After Paying ── */}
        <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "18px 20px", animation: "payIn 0.4s ease 0.18s both" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="1.8"/></svg>
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>After Paying</div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 1 }}>Enter your UPI Transaction ID or UTR number</div>
            </div>
          </div>

          <label style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>UPI Transaction ID / UTR</label>
          <input
            type="text"
            placeholder="e.g. T2506081234567890"
            value={txnInput}
            onChange={e => { setTxnInput(e.target.value); setError(""); }}
            style={{ width: "100%", background: "#0a0a0a", border: `1px solid ${txnInput ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: 12, padding: "13px 16px", color: "#fff", fontSize: 15, fontWeight: 600, boxSizing: "border-box", outline: "none", transition: "border-color 0.2s" }}
          />

          {error && (
            <div style={{ marginTop: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "9px 13px", color: "#ef4444", fontSize: 13 }}>
              {error}
            </div>
          )}

          <button
            onClick={submitOrder}
            disabled={submitting}
            style={{ width: "100%", padding: "14px 0", borderRadius: 12, marginTop: 14, background: submitting ? "rgba(245,158,11,0.25)" : "linear-gradient(135deg,#fcd34d,#f59e0b)", color: submitting ? "rgba(0,0,0,0.4)" : "#000", fontWeight: 800, fontSize: 15, border: "none", cursor: submitting ? "default" : "pointer", transition: "all 0.2s", boxShadow: submitting ? "none" : "0 4px 20px rgba(245,158,11,0.3)" }}
          >
            {submitting ? "Submitting…" : "I Have Paid — Submit Order →"}
          </button>
        </div>

        {/* ── Safety Note ── */}
        <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 14, padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start", animation: "payIn 0.4s ease 0.24s both" }}>
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
