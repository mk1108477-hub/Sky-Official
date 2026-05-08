import { useState } from "react";
import { useLocation } from "wouter";

type Step = "input" | "verifying" | "confirmed" | "error";

async function lookupMlbbIGN(userId: string, serverId: string): Promise<string | null> {
  const endpoints = [
    () => fetch(`https://api.isan.eu.org/nickname/ml?id=${userId}&server_id=${serverId}`, { headers: { "Accept": "application/json" } }),
    () => fetch(`https://oploverz.pro/api/check-id/ml?userId=${userId}&zoneId=${serverId}`, { headers: { "Accept": "application/json" } }),
  ];

  for (const call of endpoints) {
    try {
      const r = await Promise.race([
        call(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 7000)),
      ]) as Response;
      if (!r.ok) continue;
      const data = await r.json();
      const name =
        data?.name ||
        data?.nickname ||
        data?.username ||
        data?.data?.name ||
        data?.data?.username ||
        null;
      if (name && typeof name === "string" && name.trim()) return name.trim();
    } catch {
      continue;
    }
  }
  return null;
}

export default function MLBBVerifyPage() {
  const [, setLocation] = useLocation();
  const [userId, setUserId] = useState("");
  const [serverId, setServerId] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [username, setUsername] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showGuide, setShowGuide] = useState(false);

  async function verify() {
    if (!userId.trim() || !serverId.trim()) {
      setErrorMsg("Please fill in both fields.");
      setStep("error");
      return;
    }
    setStep("verifying");
    setErrorMsg("");
    try {
      const name = await lookupMlbbIGN(userId.trim(), serverId.trim());
      if (name) {
        setUsername(name);
        setStep("confirmed");
      } else {
        setErrorMsg("Could not find account. Please double-check your User ID and Server ID.");
        setStep("error");
      }
    } catch {
      setErrorMsg("Could not reach the verification service. Please check your connection and try again.");
      setStep("error");
    }
  }

  function reset() {
    setStep("input");
    setErrorMsg("");
    setUsername("");
  }

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", paddingBottom: 48 }}>
      <style>{`
        @keyframes verIn { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
        @keyframes checkPop { 0%{transform:scale(0);} 70%{transform:scale(1.15);} 100%{transform:scale(1);} }
      `}</style>

      {/* Header */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 40, background: "rgba(10,10,10,0.93)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px" }}>
        <button onClick={() => setLocation("/packages")} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 5l-7 7 7 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>Verify MLBB Account</span>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "72px 16px 0" }}>

        {/* Hero text */}
        <div style={{ textAlign: "center", paddingTop: 28, paddingBottom: 24, animation: "verIn 0.5s ease both" }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="#f59e0b" strokeWidth="1.8"/>
            </svg>
          </div>
          <h1 style={{ color: "#fff", fontWeight: 800, fontSize: 22, margin: "0 0 8px" }}>Enter Your MLBB Details</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            We'll verify your in-game name so diamonds go to the right account.
          </p>
        </div>

        {/* How to find IDs guide */}
        <div style={{ marginBottom: 20, animation: "verIn 0.5s ease 0.08s both" }}>
          <button
            onClick={() => setShowGuide(v => !v)}
            style={{ width: "100%", background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
          >
            <span style={{ color: "#f59e0b", fontWeight: 600, fontSize: 13 }}>How to find my User ID & Server ID?</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ transform: showGuide ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
              <path d="M6 9l6 6 6-6" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {showGuide && (
            <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "16px", marginTop: 8 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { step: "1", text: "Open Mobile Legends: Bang Bang on your phone." },
                  { step: "2", text: "Tap your profile picture in the top-left corner of the main screen." },
                  { step: "3", text: "Your User ID (numbers) and Server ID (in brackets) are shown below your username — e.g. 123456789  (1234)." },
                  { step: "4", text: "Enter the User ID and the number inside the brackets as your Server ID below." },
                ].map(s => (
                  <div key={s.step} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#f59e0b", fontWeight: 800, fontSize: 12 }}>{s.step}</div>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.55, margin: 0 }}>{s.text}</p>
                  </div>
                ))}
                {/* Visual example */}
                <div style={{ background: "#0d0d0d", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", padding: "14px 16px", marginTop: 4 }}>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Example</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#1e3a5f,#0f2540)", border: "2px solid rgba(245,158,11,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🧙</div>
                    <div>
                      <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>DragonSlayer</div>
                      <div style={{ color: "#f59e0b", fontSize: 13, fontWeight: 600 }}>
                        123456789 <span style={{ color: "rgba(255,255,255,0.4)" }}>(</span><span style={{ color: "#60a5fa" }}>7211</span><span style={{ color: "rgba(255,255,255,0.4)" }}>)</span>
                      </div>
                      <div style={{ display: "flex", gap: 12, marginTop: 5 }}>
                        <div style={{ fontSize: 11 }}>
                          <span style={{ color: "rgba(255,255,255,0.35)" }}>User ID: </span>
                          <span style={{ color: "#f59e0b", fontWeight: 700 }}>123456789</span>
                        </div>
                        <div style={{ fontSize: 11 }}>
                          <span style={{ color: "rgba(255,255,255,0.35)" }}>Server ID: </span>
                          <span style={{ color: "#60a5fa", fontWeight: 700 }}>7211</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input form */}
        {(step === "input" || step === "error") && (
          <div style={{ animation: "verIn 0.5s ease 0.14s both" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>User ID</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="e.g. 123456789"
                  value={userId}
                  onChange={e => { setUserId(e.target.value.replace(/\D/g, "")); setStep("input"); }}
                  style={{ width: "100%", background: "#111", border: `1px solid ${step === "error" && !userId ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`, borderRadius: 14, padding: "14px 16px", color: "#fff", fontSize: 16, fontWeight: 600, boxSizing: "border-box", outline: "none" }}
                />
              </div>
              <div>
                <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Server ID <span style={{ color: "rgba(255,255,255,0.25)", fontWeight: 400, textTransform: "none", fontSize: 10 }}>(number in brackets next to your ID)</span></label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="e.g. 7211"
                  value={serverId}
                  onChange={e => { setServerId(e.target.value.replace(/\D/g, "")); setStep("input"); }}
                  style={{ width: "100%", background: "#111", border: `1px solid ${step === "error" && !serverId ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`, borderRadius: 14, padding: "14px 16px", color: "#fff", fontSize: 16, fontWeight: 600, boxSizing: "border-box", outline: "none" }}
                />
              </div>
            </div>

            {step === "error" && errorMsg && (
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "10px 14px", marginBottom: 14, color: "#ef4444", fontSize: 13 }}>
                {errorMsg}
              </div>
            )}

            <button
              onClick={verify}
              disabled={!userId || !serverId}
              style={{ width: "100%", padding: "15px 0", borderRadius: 14, background: userId && serverId ? "linear-gradient(135deg,#fcd34d,#f59e0b)" : "rgba(245,158,11,0.2)", color: userId && serverId ? "#000" : "rgba(255,255,255,0.3)", fontWeight: 800, fontSize: 15, border: "none", cursor: userId && serverId ? "pointer" : "default", transition: "all 0.2s" }}
            >
              Verify My Account
            </button>
          </div>
        )}

        {/* Verifying state */}
        {step === "verifying" && (
          <div style={{ textAlign: "center", padding: "40px 0", animation: "verIn 0.3s ease both" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 16 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b", animation: `pulse 1.2s ease ${i * 0.2}s infinite` }} />
              ))}
            </div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Verifying your account…</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 6 }}>This takes a few seconds</div>
          </div>
        )}

        {/* Confirmed state */}
        {step === "confirmed" && (
          <div style={{ animation: "verIn 0.4s ease both" }}>
            <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 20, padding: "24px 20px", textAlign: "center", marginBottom: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(34,197,94,0.15)", border: "2px solid rgba(34,197,94,0.4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", animation: "checkPop 0.4s ease both" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Account Verified</div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 24, marginBottom: 6 }}>{username}</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 10 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>User ID</div>
                  <div style={{ color: "#f59e0b", fontWeight: 700, fontSize: 14 }}>{userId}</div>
                </div>
                <div style={{ width: 1, background: "rgba(255,255,255,0.1)" }} />
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>Server ID</div>
                  <div style={{ color: "#60a5fa", fontWeight: 700, fontSize: 14 }}>{serverId}</div>
                </div>
              </div>
            </div>

            <div style={{ background: "rgba(34,197,94,0.05)", borderRadius: 12, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M13 16h-1v-4h-1m1-4h.01" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="10" stroke="#22c55e" strokeWidth="1.8"/>
              </svg>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, lineHeight: 1.5, margin: 0 }}>
                Please confirm this is your account before proceeding. Diamonds sent to a wrong account cannot be recovered.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={reset} style={{ flex: 1, padding: "13px 0", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Wrong Account
              </button>
              <button onClick={() => setLocation("/packages")} style={{ flex: 2, padding: "13px 0", borderRadius: 14, background: "linear-gradient(135deg,#fcd34d,#f59e0b)", color: "#000", fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer" }}>
                Yes, This is Me →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
