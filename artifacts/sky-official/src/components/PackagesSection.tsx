const PACKS = [
  {
    id: "small",
    title: "Small Pack",
    subtitle: "Entry-level diamonds for quick top-ups",
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.25)",
    diamonds: "56 – 257",
    available: true,
  },
  {
    id: "normal",
    title: "Normal Pack",
    subtitle: "Best value diamonds for regular players",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.25)",
    diamonds: "514 – 1,048",
    available: true,
  },
  {
    id: "double",
    title: "Double Diamond",
    subtitle: "2× bonus diamonds on every purchase",
    color: "#00e5ff",
    glow: "rgba(0,229,255,0.2)",
    diamonds: "Coming Soon",
    available: false,
  },
  {
    id: "passes",
    title: "Passes & Bundles",
    subtitle: "Weekly & monthly passes with extra perks",
    color: "#a855f7",
    glow: "rgba(168,85,247,0.2)",
    diamonds: "Weekly / Monthly",
    available: true,
  },
  {
    id: "starlight",
    title: "Starlight Cards",
    subtitle: "Exclusive skins & limited rewards",
    color: "#f5c842",
    glow: "rgba(245,200,66,0.2)",
    diamonds: "Coming Soon",
    available: false,
  },
  {
    id: "rank",
    title: "Rank Boosting",
    subtitle: "Rise to Mythical Glory with expert boosters",
    color: "#ec4899",
    glow: "rgba(236,72,153,0.2)",
    diamonds: "Coming Soon",
    available: false,
  },
];

function DiamondSVG({ color, size = 36 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36">
      <defs>
        <linearGradient id={`dg-${color.replace("#","")}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity={0.9} />
          <stop offset="100%" stopColor={color} stopOpacity={1} />
        </linearGradient>
      </defs>
      <polygon
        points="18,2 34,14 18,34 2,14"
        fill={`url(#dg-${color.replace("#","")})`}
      />
      <polygon points="18,2 26,10 18,14 10,10" fill="rgba(255,255,255,0.45)" />
    </svg>
  );
}

export default function PackagesSection({ onPackageSelect }: { onPackageSelect: (id: string) => void }) {
  return (
    <section style={{ background: "#0a0a0a", minHeight: "100vh", paddingTop: 80, paddingBottom: 48 }}>
      <style>{`
        @keyframes pkg-cardIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 16px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-block", padding: "5px 16px", borderRadius: 999, background: "rgba(245,200,40,0.1)", border: "1px solid rgba(245,200,40,0.3)", color: "#f5c842", fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 12 }}>
            Our Packages
          </div>
          <h2 style={{ color: "#fff", fontSize: "clamp(1.6rem,6vw,2.2rem)", fontWeight: 800, lineHeight: 1.2, margin: 0 }}>
            Choose Your Pack
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 8 }}>
            Tap a category to view available diamond packs
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {PACKS.map((pack, i) => (
            <div
              key={pack.id}
              onClick={() => pack.available && onPackageSelect(pack.id)}
              style={{
                background: "#141414",
                borderRadius: 16,
                border: `1px solid ${pack.available ? pack.color + "40" : "rgba(255,255,255,0.07)"}`,
                padding: "16px 18px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                cursor: pack.available ? "pointer" : "default",
                boxShadow: pack.available ? `0 0 20px ${pack.glow}` : "none",
                animation: `pkg-cardIn 0.4s ease ${i * 0.07}s both`,
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
                opacity: pack.available ? 1 : 0.55,
              }}
              onMouseEnter={e => { if (pack.available) { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 6px 30px ${pack.glow}`; } }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = pack.available ? `0 0 20px ${pack.glow}` : "none"; }}
            >
              <div style={{ width: 52, height: 52, borderRadius: 14, background: pack.color + "15", border: `1px solid ${pack.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <DiamondSVG color={pack.color} size={28} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>{pack.title}</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pack.subtitle}</div>
                <div style={{ marginTop: 5, display: "inline-block", padding: "2px 8px", borderRadius: 6, background: pack.color + "18", color: pack.color, fontSize: 11, fontWeight: 600 }}>{pack.diamonds}</div>
              </div>
              {pack.available ? (
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: pack.color + "18", border: `1px solid ${pack.color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6h8M7 3l3 3-3 3" stroke={pack.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              ) : (
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontWeight: 600, flexShrink: 0 }}>SOON</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
