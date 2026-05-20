import { useUser } from "@clerk/react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

const API = import.meta.env.BASE_URL.replace(/\/$/, "").replace(/^\/[^/]+/, "") + "/api";

interface ProfileStats {
  total_orders: number;
  total_diamonds: number;
  total_spent: number;
  wallet_balance: number;
}

interface WalletTx {
  id: number;
  amount: string;
  type: string;
  status: string;
  upi_ref: string | null;
  description: string | null;
  created_at: string;
}

function DiamondIcon({ size = 18, color = "#f59e0b" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36">
      <defs>
        <linearGradient id="dp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity={0.9} />
          <stop offset="100%" stopColor={color} stopOpacity={1} />
        </linearGradient>
      </defs>
      <polygon points="18,2 34,14 18,34 2,14" fill="url(#dp)" />
      <polygon points="18,2 26,10 18,14 10,10" fill="rgba(255,255,255,0.45)" />
    </svg>
  );
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupMsg, setTopupMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;
    Promise.all([
      fetch(`${API}/profile`, { credentials: "include" }).then(r => r.json()),
      fetch(`${API}/wallet/balance`, { credentials: "include" }).then(r => r.json()),
    ]).then(([prof, wallet]) => {
      setStats(prof);
      setTransactions(wallet.transactions ?? []);
    }).finally(() => setLoading(false));
  }, [isLoaded, user]);

  useEffect(() => {
    if (isLoaded && !user) setLocation("/sign-in");
  }, [isLoaded, user]);


  if (!isLoaded || !user) return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>Loading…</div>
    </div>
  );

  const displayName = user.username || user.firstName || user.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "Player";


  const statusColor: Record<string, string> = {
    pending: "#f59e0b",
    approved: "#22c55e",
    rejected: "#ef4444",
    completed: "#22c55e",
  };

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", paddingBottom: 48 }}>
      <style>{`
        @keyframes profIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* Header bar */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 40, background: "rgba(10,10,10,0.93)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px" }}>
        <button onClick={() => setLocation("/")} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 5l-7 7 7 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>My Profile</span>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "72px 16px 0" }}>

        {/* Avatar + name */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 24, paddingBottom: 28, animation: "profIn 0.5s ease both" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", border: "3px solid #f59e0b", boxShadow: "0 0 20px rgba(245,158,11,0.45)", overflow: "hidden", marginBottom: 12 }}>
            <img src={user.imageUrl} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 20, letterSpacing: "-0.01em" }}>{displayName}</div>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 3 }}>{user.emailAddresses?.[0]?.emailAddress}</div>
        </div>

        {/* Stats strip */}
        {loading ? (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13, padding: "20px 0" }}>Loading…</div>
        ) : stats && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20, animation: "profIn 0.5s ease 0.1s both" }}>
            {[
              { label: "Orders", value: stats.total_orders },
              { label: "Diamonds", value: stats.total_diamonds.toLocaleString() },
              { label: "Spent", value: `₹${stats.total_spent.toFixed(0)}` },
            ].map(s => (
              <div key={s.label} style={{ background: "#111", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", padding: "14px 10px", textAlign: "center" }}>
                <div style={{ color: "#f59e0b", fontWeight: 800, fontSize: 20 }}>{s.value}</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Wallet card */}
        <div style={{ background: "linear-gradient(135deg,#1a1200,#111)", borderRadius: 18, border: "1px solid rgba(245,158,11,0.25)", padding: "20px 18px", marginBottom: 16, animation: "profIn 0.5s ease 0.18s both", boxShadow: "0 0 30px rgba(245,158,11,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Sky Wallet (S Coins)</div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 28, marginTop: 2 }}>
                S {loading ? "—" : (stats?.wallet_balance ?? 0).toFixed(0)}
              </div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 2 }}>1 S coin = ₹1</div>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              <img src="/scoin.png" alt="S Coin" style={{ width: 40, height: 40, objectFit: "contain" }} />
            </div>
          </div>
          <div style={{ background: "rgba(245,158,11,0.08)", borderRadius: 10, padding: "8px 12px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14 }}>🏷️</span>
            <span style={{ color: "#f59e0b", fontSize: 12, fontWeight: 600 }}>0.5% discount on recharges above ₹1000 paid via wallet</span>
          </div>
          <button
            onClick={() => { setShowTopup(v => !v); setTopupMsg(null); }}
            style={{ width: "100%", padding: "12px 0", borderRadius: 12, background: "linear-gradient(135deg,#fcd34d,#f59e0b)", color: "#000", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}
          >
            {showTopup ? "Cancel" : "+ Add Funds"}
          </button>

          {showTopup && (
            <div style={{ marginTop: 16 }}>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginBottom: 14, lineHeight: 1.6 }}>
                Pick an amount — you'll see the payment QR on the next screen.
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                {[100, 300, 500, 1000, 1500].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setTopupAmount(String(amt))}
                    style={{
                      padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 700,
                      background: topupAmount === String(amt) ? "rgba(245,158,11,0.18)" : "rgba(255,255,255,0.06)",
                      border: topupAmount === String(amt) ? "1.5px solid rgba(245,158,11,0.65)" : "1px solid rgba(255,255,255,0.1)",
                      color: topupAmount === String(amt) ? "#f59e0b" : "rgba(255,255,255,0.6)",
                      cursor: "pointer", touchAction: "manipulation",
                    }}
                  >₹{amt}</button>
                ))}
              </div>
              <input
                type="number"
                placeholder="Or enter custom amount"
                value={topupAmount}
                onChange={e => setTopupAmount(e.target.value)}
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, marginBottom: 10, boxSizing: "border-box" }}
              />
              {topupMsg && (
                <div style={{ padding: "8px 12px", borderRadius: 8, background: topupMsg.ok ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: topupMsg.ok ? "#22c55e" : "#ef4444", fontSize: 13, marginBottom: 10 }}>
                  {topupMsg.text}
                </div>
              )}
              <button
                onClick={() => {
                  const amt = parseFloat(topupAmount);
                  if (!amt || amt <= 0) { setTopupMsg({ ok: false, text: "Enter a valid amount." }); return; }
                  setTopupMsg(null);
                  sessionStorage.setItem("walletTopupAmount", String(amt));
                  setLocation("/pay");
                }}
                style={{ width: "100%", padding: "11px 0", borderRadius: 10, background: "#f59e0b", color: "#000", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}
              >Pay Now</button>
            </div>
          )}
        </div>

        {/* Wallet transaction history */}
        {transactions.length > 0 && (
          <div style={{ background: "#111", borderRadius: 18, border: "1px solid rgba(255,255,255,0.07)", padding: "16px 14px", marginBottom: 16, animation: "profIn 0.5s ease 0.24s both" }}>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Wallet Transactions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {transactions.map(tx => (
                <div key={tx.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{tx.description ?? (tx.type === "credit" ? "Top-up" : "Debit")}</div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{new Date(tx.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                    {tx.upi_ref && tx.upi_ref.startsWith("TUP-") && (
                      <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, fontFamily: "monospace" }}>ID: {tx.upi_ref}</div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                    <div style={{ color: tx.type === "credit" ? "#22c55e" : "#ef4444", fontWeight: 700, fontSize: 14 }}>
                      {tx.type === "credit" ? "+" : "-"}S {parseFloat(tx.amount).toFixed(0)}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: statusColor[tx.status] ?? "#aaa", background: (statusColor[tx.status] ?? "#aaa") + "18", padding: "1px 7px", borderRadius: 999 }}>
                      {tx.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "profIn 0.5s ease 0.3s both" }}>
          <button onClick={() => setLocation("/orders")} style={{ background: "#111", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>Order History</span>
            </div>
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M7 3l3 3-3 3" stroke="rgba(255,255,255,0.3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button onClick={() => setLocation("/packages")} style={{ background: "#111", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <img src="/scoin.png" alt="S Coin" style={{ width: 30, height: 30, objectFit: "contain" }} />
              </div>
              <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>Browse Packages</span>
            </div>
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M7 3l3 3-3 3" stroke="rgba(255,255,255,0.3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
