import { useEffect, useState } from "react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "").replace(/^\/[^/]+/, "") + "/api";

interface Package {
  id: number;
  diamonds: number;
  price: string;
  label: string | null;
  is_popular: boolean;
  sort_order: number;
}

function getPackImage(diamonds: number): string {
  if (diamonds <= 10) return "/pack1.jpg";
  if (diamonds <= 49) return "/pack2.jpg";
  if (diamonds <= 99) return "/pack3.jpg";
  if (diamonds <= 499) return "/pack4.jpg";
  if (diamonds <= 999) return "/pack5.jpg";
  if (diamonds <= 1500) return "/pack6.jpg";
  return "/pack7.jpg";
}

function PackCard({ pack }: { pack: Package }) {
  const img = getPackImage(pack.diamonds);

  return (
    <div
      style={{
        background: "#111",
        borderRadius: 18,
        border: pack.is_popular
          ? "1.5px solid rgba(245,158,11,0.6)"
          : "1px solid rgba(255,255,255,0.08)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: pack.is_popular
          ? "0 0 24px rgba(245,158,11,0.25)"
          : "0 2px 12px rgba(0,0,0,0.4)",
        position: "relative",
        cursor: "pointer",
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(-3px) scale(1.02)";
        el.style.boxShadow = pack.is_popular
          ? "0 8px 36px rgba(245,158,11,0.4)"
          : "0 8px 28px rgba(0,0,0,0.6)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "";
        el.style.boxShadow = pack.is_popular
          ? "0 0 24px rgba(245,158,11,0.25)"
          : "0 2px 12px rgba(0,0,0,0.4)";
      }}
    >
      {pack.is_popular && (
        <div style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 3,
          background: "linear-gradient(135deg,#fbbf24,#f59e0b)",
          color: "#000",
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: "0.1em",
          padding: "3px 8px",
          borderRadius: 999,
          textTransform: "uppercase",
        }}>
          Popular
        </div>
      )}

      {pack.label && (
        <div style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 3,
          background: "rgba(0,0,0,0.65)",
          color: "#fbbf24",
          fontSize: 9,
          fontWeight: 700,
          padding: "3px 8px",
          borderRadius: 999,
          backdropFilter: "blur(4px)",
        }}>
          {pack.label}
        </div>
      )}

      {/* Image area with gradient overlays to crop out text and banners */}
      <div style={{ position: "relative", height: 110, overflow: "hidden", flexShrink: 0 }}>
        <img
          src={img}
          alt={`${pack.diamonds} diamonds`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 45%",
            display: "block",
          }}
        />
        {/* Top gradient: hides diamond count text */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: 38,
          background: "linear-gradient(to bottom, #111 0%, rgba(17,17,17,0.7) 60%, transparent 100%)",
          zIndex: 1,
          pointerEvents: "none",
        }} />
        {/* Bottom gradient: hides blue bonus banner */}
        <div style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: 34,
          background: "linear-gradient(to top, #111 0%, rgba(17,17,17,0.7) 60%, transparent 100%)",
          zIndex: 1,
          pointerEvents: "none",
        }} />
      </div>

      {/* Info area */}
      <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ color: "#38bdf8", fontSize: 13 }}>♦</span>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>
            {pack.diamonds.toLocaleString()}
          </span>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 500 }}>Diamonds</span>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 2,
        }}>
          <div style={{
            color: "#f59e0b",
            fontWeight: 800,
            fontSize: 17,
            letterSpacing: "-0.01em",
          }}>
            ₹{Number(pack.price).toLocaleString("en-IN")}
          </div>
          <div style={{
            background: "linear-gradient(135deg,#fbbf24,#f59e0b)",
            color: "#000",
            fontSize: 11,
            fontWeight: 800,
            padding: "5px 14px",
            borderRadius: 999,
            cursor: "pointer",
            flexShrink: 0,
          }}>
            Buy
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{
      background: "#111",
      borderRadius: 18,
      border: "1px solid rgba(255,255,255,0.07)",
      overflow: "hidden",
    }}>
      <div style={{ height: 110, background: "rgba(255,255,255,0.04)" }} />
      <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ height: 16, width: "60%", background: "rgba(255,255,255,0.07)", borderRadius: 6 }} />
        <div style={{ height: 20, width: "40%", background: "rgba(255,255,255,0.07)", borderRadius: 6 }} />
      </div>
    </div>
  );
}

export default function PackagesSection({ onPackageSelect }: { onPackageSelect: (id: string) => void }) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${API}/packages`)
      .then(r => r.json())
      .then(data => { setPackages(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  return (
    <section style={{ background: "#0a0a0a", minHeight: "60vh", paddingBottom: 48 }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            display: "inline-block",
            padding: "5px 16px",
            borderRadius: 999,
            background: "rgba(245,200,40,0.1)",
            border: "1px solid rgba(245,200,40,0.3)",
            color: "#f5c842",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}>
            Our Packages
          </div>
          <h2 style={{ color: "#fff", fontSize: "clamp(1.6rem,6vw,2.2rem)", fontWeight: 800, lineHeight: 1.2, margin: 0 }}>
            Choose Your Pack
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 8 }}>
            Instant delivery · Best prices · Secure payment
          </p>
        </div>

        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {error && (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.35)", padding: "40px 0", fontSize: 14 }}>
            Could not load packages. Please try again later.
          </div>
        )}

        {!loading && !error && packages.length === 0 && (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.35)", padding: "40px 0", fontSize: 14 }}>
            No packages available yet. Check back soon!
          </div>
        )}

        {!loading && !error && packages.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {packages.map(pack => (
              <PackCard key={pack.id} pack={pack} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
