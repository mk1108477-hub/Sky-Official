import { useEffect, useRef, useState } from "react";

const WA_NUMBER = "919362003788";

const RANK_ORDER = ["warrior","elite","master","epic","legend","mythic","mythic_honor","mythic_glory","mythic_immortal"] as const;
type RankKey = typeof RANK_ORDER[number];

const RANK_BASE: Record<RankKey, number> = {
  warrior:0, elite:26, master:52, epic:78, legend:104,
  mythic:130, mythic_honor:155, mythic_glory:180, mythic_immortal:230,
};

const RANK_LABELS: Record<RankKey, string> = {
  warrior:"Warrior", elite:"Elite", master:"Master", epic:"Epic", legend:"Legend",
  mythic:"Mythic", mythic_honor:"Mythic Honor", mythic_glory:"Mythic Glory", mythic_immortal:"Mythic Immortal",
};

function starsIntoRank(level: number, stars: number) { return (5 - level) * 5 + stars; }
function getTotalStars(rank: string, subValue: string) { return (RANK_BASE[rank as RankKey] ?? 0) + parseInt(subValue || "0"); }

interface SubOption { value: string; label: string; }

function buildSubOptions(rank: string): SubOption[] {
  if (!rank) return [];
  if (["mythic","mythic_honor","mythic_glory","mythic_immortal"].includes(rank)) {
    const max = rank === "mythic_immortal" ? 100 : 24;
    const label = RANK_LABELS[rank as RankKey];
    return Array.from({ length: max + 1 }, (_, s) => ({ value: String(s), label: `${label} — ${s} ★` }));
  }
  const rName = RANK_LABELS[rank as RankKey] ?? rank;
  const opts: SubOption[] = [];
  for (let lvl = 5; lvl >= 1; lvl--) {
    for (let s = 0; s <= 4; s++) {
      opts.push({ value: String(starsIntoRank(lvl, s)), label: `${rName} ${lvl} — ${"★".repeat(s)}${"☆".repeat(5-s)} (${s}/5)` });
    }
  }
  opts.push({ value: "25", label: `${rName} 1 — ★★★★★ (promotion ready)` });
  return opts;
}

function calcPrice(curRank: string, curSub: string, tarRank: string, tarSub: string, service: "solo"|"duo"): { stars: number; price: number; note: string } | null {
  if (!curRank || !tarRank) return null;
  const curT = getTotalStars(curRank, curSub);
  const tarT = getTotalStars(tarRank, tarSub);
  if (tarT <= curT) return null;
  const stars = tarT - curT;
  let price = stars * 10;
  if (service === "duo") price = Math.round(price * 1.2);
  const note = service === "duo" ? `${stars} stars × ₹10 + 20% duo premium` : `${stars} stars × ₹10`;
  return { stars, price, note };
}

const S = {
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(245,158,11,0.15)",
    borderRadius: 16,
    padding: "22px 20px",
    marginBottom: 14,
  } as React.CSSProperties,
  label: {
    fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
    textTransform: "uppercase" as const, color: "rgba(255,255,255,0.4)",
    display: "block", marginBottom: 7,
  } as React.CSSProperties,
  input: {
    width: "100%", background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
    color: "#fff", fontSize: 14, padding: "12px 14px",
    outline: "none", boxSizing: "border-box" as const,
    fontFamily: "inherit", appearance: "none" as const,
    WebkitAppearance: "none" as const,
  } as React.CSSProperties,
};

export default function RankBoostPage({ onBack }: { onBack?: () => void }) {
  const [service, setService] = useState<"solo"|"duo">("solo");
  const [curRank, setCurRank] = useState("");
  const [curSub,  setCurSub]  = useState("0");
  const [tarRank, setTarRank] = useState("");
  const [tarSub,  setTarSub]  = useState("0");
  const [playerName, setPlayerName] = useState("");
  const [contact,    setContact]    = useState("");
  const [accountId,  setAccountId]  = useState("");
  const [notes,      setNotes]      = useState("");
  const [payment,    setPayment]    = useState("");
  const [agreed,     setAgreed]     = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [error,      setError]      = useState("");

  const curSubOpts = buildSubOptions(curRank);
  const tarSubOpts = buildSubOptions(tarRank);
  const priceResult = calcPrice(curRank, curSub, tarRank, tarSub, service);

  useEffect(() => { setCurSub(curSubOpts[0]?.value ?? "0"); }, [curRank]);
  useEffect(() => { setTarSub(tarSubOpts[0]?.value ?? "0"); }, [tarRank]);

  const curSubRef = useRef<HTMLSelectElement>(null);
  const tarSubRef = useRef<HTMLSelectElement>(null);

  const buildWaMsg = () => {
    const curLabel = curSubOpts.find(o => o.value === curSub)?.label ?? curSub;
    const tarLabel = tarSubOpts.find(o => o.value === tarSub)?.label ?? tarSub;
    const payLabels: Record<string,string> = { upi:"UPI", bank:"Bank Transfer", crypto:"Crypto (USDT)" };
    const p = priceResult;
    return `🎮 *New MLBB Boost Order*
━━━━━━━━━━━━━━
👤 *Name/IGN:* ${playerName}
📱 *Contact:* ${contact}
⚔️ *Service:* ${service === "duo" ? "Duo Boost" : "Solo Boost"}
📊 *Current:* ${curLabel}
🎯 *Target:* ${tarLabel}
⭐ *Stars to boost:* ${p?.stars ?? "?"}
💰 *Price:* ₹${p?.price ?? "?"}
💳 *Payment:* ${payLabels[payment] ?? payment}
${accountId ? `🆔 *Account ID:* ${accountId}` : ""}
${notes     ? `📝 *Notes:* ${notes}` : ""}
━━━━━━━━━━━━━━
✅ Ready to boost!`;
  };

  const handleSubmit = () => {
    setError("");
    if (!playerName) { setError("Please enter your name or IGN."); return; }
    if (!contact)    { setError("Please enter your contact info."); return; }
    if (!curRank || !tarRank) { setError("Please select your current and target rank."); return; }
    if (!priceResult) { setError("Target rank must be higher than current rank."); return; }
    if (!payment)    { setError("Please select a payment method."); return; }
    if (!agreed)     { setError("Please agree to the terms before submitting."); return; }
    setSubmitted(true);
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(buildWaMsg())}`;
    window.location.href = url;
  };

  const inputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = "rgba(245,158,11,0.6)";
    e.currentTarget.style.background  = "rgba(245,158,11,0.04)";
    e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(245,158,11,0.08)";
  };
  const inputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
    e.currentTarget.style.background  = "rgba(255,255,255,0.04)";
    e.currentTarget.style.boxShadow   = "none";
  };

  const selectStyle: React.CSSProperties = {
    ...S.input,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='7'%3E%3Cpath d='M1 1l4.5 4.5L10 1' stroke='%23f59e0b' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 13px center",
    paddingRight: 36,
    cursor: "pointer",
    color: "#fff",
  };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", paddingBottom: 60 }}>
      <style>{`
        @keyframes rbCardIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .rb-card { animation: rbCardIn 0.38s cubic-bezier(0.22,1,0.36,1) both; }
        .rb-card:nth-child(1) { animation-delay: 0.04s; }
        .rb-card:nth-child(2) { animation-delay: 0.09s; }
        .rb-card:nth-child(3) { animation-delay: 0.14s; }
        .rb-card:nth-child(4) { animation-delay: 0.19s; }
        .rb-svc:hover { border-color: rgba(245,158,11,0.4) !important; }
        select option { background: #111; color: #fff; }
      `}</style>

      {/* ── Step 1: Service type ─────────────────────────────────────── */}
      <div className="rb-card" style={S.card}>
        <StepHead n={1} title="Choose Service Type" sub="Solo: we play your account · Duo: we queue together" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {(["solo","duo"] as const).map(type => (
            <button
              key={type}
              className="rb-svc"
              onClick={() => setService(type)}
              style={{
                background: service === type ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.03)",
                border: service === type ? "1.5px solid rgba(245,158,11,0.65)" : "1.5px solid rgba(255,255,255,0.1)",
                borderRadius: 12, padding: "16px 14px", cursor: "pointer",
                textAlign: "left", fontFamily: "inherit",
                transition: "border-color 0.15s, background 0.15s",
              }}
            >
              <span style={{ fontSize: 22, display: "block", marginBottom: 8 }}>
                {type === "solo" ? "🗡️" : "🤝"}
              </span>
              <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: service === type ? "#f59e0b" : "#fff" }}>
                {type === "solo" ? "Solo Boost" : "Duo Boost"}
              </span>
              <span style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>
                {type === "solo" ? "We play on your account" : "Play together with us (+20%)"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Step 2: Rank selection ───────────────────────────────────── */}
      <div className="rb-card" style={S.card}>
        <StepHead n={2} title="Select Your Rank" sub="Where are you now, and where do you want to reach?" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={S.label}>Current Rank</label>
            <select
              value={curRank}
              onChange={e => setCurRank(e.target.value)}
              style={selectStyle}
              onFocus={inputFocus} onBlur={inputBlur}
            >
              <option value="">Select rank...</option>
              {RANK_ORDER.map(r => <option key={r} value={r}>{RANK_LABELS[r]}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Current Level / Stars</label>
            <select
              ref={curSubRef}
              value={curSub}
              onChange={e => setCurSub(e.target.value)}
              disabled={!curRank}
              style={{ ...selectStyle, opacity: curRank ? 1 : 0.35, cursor: curRank ? "pointer" : "not-allowed" }}
              onFocus={inputFocus} onBlur={inputBlur}
            >
              {curRank ? curSubOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)
                       : <option value="0">— select rank first —</option>}
            </select>
          </div>
          <div>
            <label style={S.label}>Target Rank</label>
            <select
              value={tarRank}
              onChange={e => setTarRank(e.target.value)}
              style={selectStyle}
              onFocus={inputFocus} onBlur={inputBlur}
            >
              <option value="">Select rank...</option>
              {RANK_ORDER.filter(r => r !== "warrior").map(r => (
                <option key={r} value={r}>{RANK_LABELS[r]}{r === "mythic_honor" ? " (25★)" : r === "mythic_glory" ? " (50★)" : r === "mythic_immortal" ? " (100★)" : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={S.label}>Target Level / Stars</label>
            <select
              ref={tarSubRef}
              value={tarSub}
              onChange={e => setTarSub(e.target.value)}
              disabled={!tarRank}
              style={{ ...selectStyle, opacity: tarRank ? 1 : 0.35, cursor: tarRank ? "pointer" : "not-allowed" }}
              onFocus={inputFocus} onBlur={inputBlur}
            >
              {tarRank ? tarSubOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)
                       : <option value="0">— select rank first —</option>}
            </select>
          </div>
        </div>

        {/* Price strip */}
        <div style={{
          background: "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.04) 100%)",
          border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: 12, padding: "16px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 5 }}>Estimated Price</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>
              {priceResult ? priceResult.note : (curRank && tarRank && !priceResult ? "⚠ Target must be higher" : "Select your ranks above")}
            </div>
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 32, fontWeight: 700, color: priceResult ? "#f59e0b" : "rgba(255,255,255,0.2)", letterSpacing: "-1px", whiteSpace: "nowrap" }}>
            {priceResult ? `₹${priceResult.price}` : "—"}
          </div>
        </div>
      </div>

      {/* ── Step 3: Your details ─────────────────────────────────────── */}
      <div className="rb-card" style={S.card}>
        <StepHead n={3} title="Your Details" sub="We'll contact you on WhatsApp to confirm" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={S.label}>Name / IGN</label>
            <input
              type="text" value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="Your in-game name"
              style={S.input} onFocus={inputFocus} onBlur={inputBlur}
            />
          </div>
          <div>
            <label style={S.label}>Contact (FB / TG / WA)</label>
            <input
              type="text" value={contact}
              onChange={e => setContact(e.target.value)}
              placeholder="e.g. @yourname"
              style={S.input} onFocus={inputFocus} onBlur={inputBlur}
            />
          </div>
        </div>
        {service === "solo" && (
          <div style={{ marginBottom: 12 }}>
            <label style={S.label}>Account ID (Solo Boost only)</label>
            <input
              type="text" value={accountId}
              onChange={e => setAccountId(e.target.value)}
              placeholder="Your MLBB User ID — no password needed yet"
              style={S.input} onFocus={inputFocus} onBlur={inputBlur}
            />
          </div>
        )}
        <div>
          <label style={S.label}>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Preferred heroes, schedule, special requests..."
            style={{ ...S.input, resize: "vertical", minHeight: 80, lineHeight: 1.55 }}
            onFocus={inputFocus as any} onBlur={inputBlur as any}
          />
        </div>
      </div>

      {/* ── Step 4: Payment ──────────────────────────────────────────── */}
      <div className="rb-card" style={S.card}>
        <StepHead n={4} title="Payment Method" sub="50% to start · 50% after your rank is boosted" />
        <div style={{ marginBottom: 14 }}>
          <label style={S.label}>How will you pay?</label>
          <select
            value={payment}
            onChange={e => setPayment(e.target.value)}
            style={selectStyle}
            onFocus={inputFocus} onBlur={inputBlur}
          >
            <option value="">Select payment method...</option>
            <option value="upi">UPI</option>
            <option value="bank">Bank Transfer</option>
            <option value="crypto">Crypto (USDT)</option>
          </select>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)",
          borderRadius: 10, padding: "12px 16px",
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>🔒</span>
          <div>
            <div style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>Safe Payment Policy</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>Pay 50% upfront to start · Remaining 50% only after boost is complete</div>
          </div>
        </div>
      </div>

      {/* ── Terms & submit ───────────────────────────────────────────── */}
      <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", marginBottom: 18, padding: "0 2px" }}>
        <div
          onClick={() => setAgreed(v => !v)}
          style={{
            width: 20, height: 20, minWidth: 20, borderRadius: 6, marginTop: 1,
            background: agreed ? "#f59e0b" : "rgba(255,255,255,0.05)",
            border: agreed ? "none" : "1.5px solid rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0, transition: "background 0.15s",
          }}
        >
          {agreed && <svg width="11" height="8" viewBox="0 0 11 8" fill="none"><path d="M1 4l3 3 6-6" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </div>
        <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, lineHeight: 1.6 }}>
          I understand that boosting carries a minor risk and agree to the 50% upfront payment policy. My account password will only be requested after payment is confirmed.
        </span>
      </label>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, color: "#ef4444", fontSize: 13 }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        style={{
          width: "100%",
          background: submitted ? "rgba(34,197,94,0.2)" : "linear-gradient(135deg, #fcd34d, #f59e0b)",
          color: submitted ? "#22c55e" : "#000",
          border: submitted ? "1px solid rgba(34,197,94,0.3)" : "none",
          borderRadius: 14, padding: "16px 0",
          fontSize: 15, fontWeight: 800, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          fontFamily: "inherit", transition: "filter 0.15s, transform 0.15s",
          boxShadow: submitted ? "none" : "0 0 24px rgba(245,158,11,0.3)",
        }}
      >
        {submitted ? "✅ Order Sent — Redirecting…" : "Send Order on WhatsApp 🚀"}
      </button>

      <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 16, lineHeight: 1.6 }}>
        Your order details go directly to our WhatsApp.<br />We confirm within 1 hour. ✅
      </p>
    </div>
  );
}

function StepHead({ n, title, sub }: { n: number; title: string; sub: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 20 }}>
      <div style={{
        width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
        background: "linear-gradient(135deg, #fcd34d, #f59e0b)",
        color: "#000", fontSize: 13, fontWeight: 800,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>{n}</div>
      <div>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{title}</div>
        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 2 }}>{sub}</div>
      </div>
    </div>
  );
}
