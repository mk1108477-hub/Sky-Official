const PACKS = [
  {
    id: "small",
    title: "Small Pack",
    subtitle: "Entry-level diamonds for quick top-ups",
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.3)",
    diamonds: "56 – 257",
    available: true,
  },
  {
    id: "normal",
    title: "Normal Pack",
    subtitle: "Best value diamonds for regular players",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.3)",
    diamonds: "514 – 1,048",
    available: true,
  },
  {
    id: "double",
    title: "Double Diamond",
    subtitle: "2× bonus diamonds on every purchase",
    color: "#00e5ff",
    glow: "rgba(0,229,255,0.25)",
    diamonds: "Coming Soon",
    available: false,
  },
  {
    id: "passes",
    title: "Passes & Bundles",
    subtitle: "Weekly & monthly passes with extra perks",
    color: "#a855f7",
    glow: "rgba(168,85,247,0.25)",
    diamonds: "Weekly / Monthly",
    available: true,
  },
  {
    id: "starlight",
    title: "Starlight Cards",
    subtitle: "Exclusive skins & limited rewards",
    color: "#f5c842",
    glow: "rgba(245,200,66,0.25)",
    diamonds: "Coming Soon",
    available: false,
  },
  {
    id: "rank",
    title: "Rank Boosting",
    subtitle: "Rise to Mythical Glory with expert boosters",
    color: "#ec4899",
    glow: "rgba(236,72,153,0.25)",
    diamonds: "Coming Soon",
    available: false,
  },
];

function DiamondSVG({ color, size = 42 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36">
      <defs>
        <linearGradient id={`dg-${color.replace("#", "")}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity={0.9} />
          <stop offset="100%" stopColor={color} stopOpacity={1} />
        </linearGradient>
      </defs>
      <polygon points="18,2 34,14 18,34 2,14" fill={`url(#dg-${color.replace("#", "")})`} />
      <polygon points="18,2 26,10 18,14 10,10" fill="rgba(255,255,255,0.45)" />
    </svg>
  );
}

export default function PackagesSection({ onPackageSelect }: { onPackageSelect: (id: string) => void }) {
  return (
    <section style={{ background: "#0a0a0a", minHeight: "60vh", paddingBottom: 48 }}>
      <style>{`
        @keyframes pkg-diagIn {
          from { opacity: 0; transform: translate(-20px, -20px); }
          to   { opacity: 1; transform: translate(0, 0); }
        }
        @keyframes pkg-diagInDim {
          from { opacity: 0; transform: translate(-20px, -20px); }
          to   { opacity: 0.5; transform: translate(0, 0); }
        }
      `}</style>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
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

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
        }}>
          {PACKS.map((pack, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const delay = (col + row) * 0.1;
            return (
              <div
                key={pack.id}
                onClick={() => pack.available && onPackageSelect(pack.id)}
                style={{
                  background: "#111",
                  borderRadius: 18,
                  border: `1px solid ${pack.available ? pack.color + "45" : "rgba(255,255,255,0.07)"}`,
                  padding: "20px 16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 10,
                  cursor: pack.available ? "pointer" : "default",
                  boxShadow: pack.available ? `0 0 24px ${pack.glow}` : "none",
                  animation: `${pack.available ? "pkg-diagIn" : "pkg-diagInDim"} 0.65s cubic-bezier(0.25,0.46,0.45,0.94) ${delay}s both`,
                  transition: "transform 0.18s ease, box-shadow 0.18s ease",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={e => {
                  if (!pack.available) return;
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transform = "translateY(-3px) scale(1.02)";
                  el.style.boxShadow = `0 8px 36px ${pack.glow}`;
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transform = "";
                  el.style.boxShadow = pack.available ? `0 0 24px ${pack.glow}` : "none";
                }}
              >
                {/* subtle corner glow */}
                {pack.available && (
                  <div style={{
                    position: "absolute",
                    top: -30,
                    right: -30,
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: pack.color + "18",
                    pointerEvents: "none",
                  }} />
                )}

                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: pack.color + "15",
                  border: `1px solid ${pack.color}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <DiamondSVG color={pack.color} size={30} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, lineHeight: 1.25 }}>{pack.title}</div>
                  <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 11, marginTop: 4, lineHeight: 1.4 }}>{pack.subtitle}</div>
                </div>

                <div style={{
                  padding: "3px 10px",
                  borderRadius: 7,
                  background: pack.available ? pack.color + "18" : "rgba(255,255,255,0.05)",
                  color: pack.available ? pack.color : "rgba(255,255,255,0.25)",
                  fontSize: 11,
                  fontWeight: 600,
                }}>
                  {pack.available ? pack.diamonds : "Coming Soon"}
                </div>

                {pack.available && (
                  <div style={{
                    position: "absolute",
                    bottom: 14,
                    right: 14,
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: pack.color + "18",
                    border: `1px solid ${pack.color}40`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6h8M7 3l3 3-3 3" stroke={pack.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
