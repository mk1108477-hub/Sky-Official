import { useEffect, useState } from "react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "").replace(/^\/[^/]+/, "") + "/api";

interface Package {
  id: number;
  diamonds: number;
  bonus_diamonds: number;
  price: string;
  label: string | null;
  is_popular: boolean;
  sort_order: number;
}

type CategoryId = "small" | "normal" | "double" | "passes" | "starlight" | "rank";

interface Category {
  id: CategoryId;
  title: string;
  subtitle: string;
  color: string;
  glow: string;
  image: string;
  available: boolean;
  badge?: string;
}

const CATEGORIES: Category[] = [
  {
    id: "small",
    title: "Small Pack",
    subtitle: "Quick top-ups for daily players",
    color: "#38bdf8",
    glow: "rgba(56,189,248,0.28)",
    image: "/pack1.jpg",
    available: true,
  },
  {
    id: "normal",
    title: "Normal Pack",
    subtitle: "Best value with bonus diamonds",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.28)",
    image: "/pack5.jpg",
    available: true,
    badge: "Most Popular",
  },
  {
    id: "double",
    title: "Double Diamond",
    subtitle: "2× bonus diamonds every purchase",
    color: "#00e5ff",
    glow: "rgba(0,229,255,0.2)",
    image: "/pack7.jpg",
    available: false,
  },
  {
    id: "passes",
    title: "Passes & Bundles",
    subtitle: "Weekly & monthly passes with perks",
    color: "#a855f7",
    glow: "rgba(168,85,247,0.22)",
    image: "/pack4.jpg",
    available: false,
  },
  {
    id: "starlight",
    title: "Starlight Cards",
    subtitle: "Exclusive skins & limited rewards",
    color: "#f5c842",
    glow: "rgba(245,200,66,0.22)",
    image: "/pack6.jpg",
    available: false,
  },
  {
    id: "rank",
    title: "Rank Boosting",
    subtitle: "Rise to Mythical Glory with experts",
    color: "#ec4899",
    glow: "rgba(236,72,153,0.22)",
    image: "/pack3.jpg",
    available: false,
  },
];

function getPackImage(diamonds: number): string {
  if (diamonds <= 10) return "/pack1.jpg";
  if (diamonds <= 49) return "/pack2.jpg";
  if (diamonds <= 99) return "/pack3.jpg";
  if (diamonds <= 499) return "/pack4.jpg";
  if (diamonds <= 999) return "/pack5.jpg";
  if (diamonds <= 1500) return "/pack6.jpg";
  return "/pack7.jpg";
}

function ImagePane({ src, height = 90 }: { src: string; height?: number }) {
  return (
    <div style={{ position: "relative", height, overflow: "hidden", flexShrink: 0, borderRadius: "14px 14px 0 0" }}>
      <img
        src={src}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 45%", display: "block" }}
      />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 36,
        background: "linear-gradient(to bottom, #111 0%, rgba(17,17,17,0.7) 55%, transparent 100%)",
        zIndex: 1, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 32,
        background: "linear-gradient(to top, #111 0%, rgba(17,17,17,0.7) 55%, transparent 100%)",
        zIndex: 1, pointerEvents: "none" }} />
    </div>
  );
}

function CategoryCard({ cat, onClick, index }: { cat: Category; onClick: () => void; index: number }) {
  const col = index % 2;
  const row = Math.floor(index / 2);
  const delay = (col + row) * 0.1;

  return (
    <div
      onClick={() => cat.available && onClick()}
      style={{
        background: "#111",
        borderRadius: 18,
        border: `1px solid ${cat.available ? cat.color + "40" : "rgba(255,255,255,0.07)"}`,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        cursor: cat.available ? "pointer" : "default",
        boxShadow: cat.available ? `0 0 20px ${cat.glow}` : "none",
        opacity: cat.available ? 1 : 0.55,
        animation: `pkg-diagIn 0.65s cubic-bezier(0.25,0.46,0.45,0.94) ${delay}s both`,
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
        position: "relative",
      }}
      onMouseEnter={e => {
        if (!cat.available) return;
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(-3px) scale(1.02)";
        el.style.boxShadow = `0 8px 36px ${cat.glow}`;
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "";
        el.style.boxShadow = cat.available ? `0 0 20px ${cat.glow}` : "none";
      }}
    >
      {cat.badge && cat.available && (
        <div style={{
          position: "absolute", top: 10, right: 10, zIndex: 3,
          background: "linear-gradient(135deg,#fbbf24,#f59e0b)",
          color: "#000", fontSize: 8, fontWeight: 800,
          letterSpacing: "0.08em", padding: "3px 7px",
          borderRadius: 999, textTransform: "uppercase",
        }}>
          {cat.badge}
        </div>
      )}

      {!cat.available && (
        <div style={{
          position: "absolute", top: 10, right: 10, zIndex: 3,
          background: "rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.35)", fontSize: 8, fontWeight: 700,
          padding: "3px 7px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.08em",
        }}>
          Soon
        </div>
      )}

      <ImagePane src={cat.image} height={90} />

      <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ color: cat.available ? "#fff" : "rgba(255,255,255,0.4)", fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>
          {cat.title}
        </div>
        <div style={{ color: "rgba(255,255,255,0.32)", fontSize: 11, lineHeight: 1.4 }}>
          {cat.subtitle}
        </div>
        {cat.available && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: 2 }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%",
              background: cat.color + "18", border: `1px solid ${cat.color}40`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M2 6h8M7 3l3 3-3 3" stroke={cat.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PackCard({ pack }: { pack: Package }) {
  const img = getPackImage(pack.diamonds);
  const baseDiamonds = pack.diamonds - pack.bonus_diamonds;
  const hasBonus = pack.bonus_diamonds > 0;

  return (
    <div
      style={{
        background: "#111",
        borderRadius: 18,
        border: pack.is_popular ? "1.5px solid rgba(245,158,11,0.6)" : "1px solid rgba(255,255,255,0.08)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: pack.is_popular ? "0 0 24px rgba(245,158,11,0.25)" : "0 2px 12px rgba(0,0,0,0.4)",
        position: "relative",
        cursor: "pointer",
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(-3px) scale(1.02)";
        el.style.boxShadow = pack.is_popular ? "0 8px 36px rgba(245,158,11,0.4)" : "0 8px 28px rgba(0,0,0,0.6)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "";
        el.style.boxShadow = pack.is_popular ? "0 0 24px rgba(245,158,11,0.25)" : "0 2px 12px rgba(0,0,0,0.4)";
      }}
    >
      {pack.is_popular && (
        <div style={{
          position: "absolute", top: 10, right: 10, zIndex: 3,
          background: "linear-gradient(135deg,#fbbf24,#f59e0b)",
          color: "#000", fontSize: 9, fontWeight: 800,
          letterSpacing: "0.1em", padding: "3px 8px", borderRadius: 999, textTransform: "uppercase",
        }}>Popular</div>
      )}

      <ImagePane src={img} height={100} />

      <div style={{ padding: "11px 13px 13px", display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ color: "#38bdf8", fontSize: 12 }}>♦</span>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>{pack.diamonds.toLocaleString()}</span>
          <span style={{ color: "rgba(255,255,255,0.38)", fontSize: 10 }}>Diamonds</span>
        </div>
        {hasBonus ? (
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
            <span style={{ color: "rgba(255,255,255,0.5)" }}>{baseDiamonds.toLocaleString()}</span>
            {" + "}
            <span style={{ color: "#4ade80", fontWeight: 700 }}>{pack.bonus_diamonds} bonus</span>
          </div>
        ) : (
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>No bonus</div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 3 }}>
          <div style={{ color: "#f59e0b", fontWeight: 800, fontSize: 16 }}>
            ₹{Number(pack.price).toLocaleString("en-IN")}
          </div>
          <div style={{
            background: "linear-gradient(135deg,#fbbf24,#f59e0b)",
            color: "#000", fontSize: 11, fontWeight: 800,
            padding: "5px 14px", borderRadius: 999, cursor: "pointer",
          }}>Buy</div>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: "#111", borderRadius: 18, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
      <div style={{ height: 100, background: "rgba(255,255,255,0.04)" }} />
      <div style={{ padding: "11px 13px 13px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ height: 15, width: "60%", background: "rgba(255,255,255,0.07)", borderRadius: 6 }} />
        <div style={{ height: 10, width: "45%", background: "rgba(255,255,255,0.05)", borderRadius: 6 }} />
        <div style={{ height: 20, width: "40%", background: "rgba(255,255,255,0.07)", borderRadius: 6 }} />
      </div>
    </div>
  );
}

function filterByCategory(packages: Package[], id: CategoryId): Package[] {
  if (id === "small") return packages.filter(p => p.label === "Small Pack");
  if (id === "normal") return packages.filter(p => p.label !== "Small Pack");
  return [];
}

export default function PackagesSection({ onPackageSelect: _onPackageSelect }: { onPackageSelect: (id: string) => void }) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);

  useEffect(() => {
    fetch(`${API}/packages`)
      .then(r => r.json())
      .then(data => { setPackages(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const activePacks = activeCategory ? filterByCategory(packages, activeCategory.id) : [];

  return (
    <section style={{ background: "#0a0a0a", minHeight: "60vh", paddingBottom: 48 }}>
      <style>{`
        @keyframes pkg-diagIn {
          from { opacity: 0; transform: translate(-20px, -20px); }
          to   { opacity: 1; transform: translate(0, 0); }
        }
      `}</style>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            display: "inline-block", padding: "5px 16px", borderRadius: 999,
            background: "rgba(245,200,40,0.1)", border: "1px solid rgba(245,200,40,0.3)",
            color: "#f5c842", fontSize: 11, fontWeight: 700,
            letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 12,
          }}>
            Our Packages
          </div>
          <h2 style={{ color: "#fff", fontSize: "clamp(1.6rem,6vw,2.2rem)", fontWeight: 800, lineHeight: 1.2, margin: 0 }}>
            {activeCategory ? activeCategory.title : "Choose Your Pack"}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 8 }}>
            {activeCategory ? "Tap a pack to purchase" : "Tap a category to view available packs"}
          </p>
        </div>

        {/* Back button when inside a category */}
        {activeCategory && (
          <button
            onClick={() => setActiveCategory(null)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 999, padding: "7px 16px 7px 12px",
              color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600,
              cursor: "pointer", marginBottom: 20,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            All Categories
          </button>
        )}

        {/* Category grid */}
        {!activeCategory && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {CATEGORIES.map((cat, i) => (
              <CategoryCard
                key={cat.id}
                cat={cat}
                index={i}
                onClick={() => setActiveCategory(cat)}
              />
            ))}
          </div>
        )}

        {/* Individual packs inside a category */}
        {activeCategory && (
          <>
            {loading && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}
            {!loading && activePacks.length === 0 && (
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.35)", padding: "40px 0", fontSize: 14 }}>
                No packs available in this category yet.
              </div>
            )}
            {!loading && activePacks.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {activePacks.map(pack => (
                  <PackCard key={pack.id} pack={pack} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
