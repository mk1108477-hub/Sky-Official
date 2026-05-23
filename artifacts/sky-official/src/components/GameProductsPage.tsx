import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useCart } from "../context/CartContext";
import type { CartPackage } from "../context/CartContext";

const API = import.meta.env.BASE_URL.replace(/\/$/, "").replace(/^\/[^/]+/, "") + "/api";

interface GamePackage {
  id: number;
  name: string | null;
  diamonds: number;
  bonus_diamonds: number;
  price: string;
  label: string | null;
  is_popular: boolean;
  category: string | null;
  status?: string;
  image?: string | null;
  game_id?: number | null;
}

interface GameInfo {
  id: number;
  name: string;
  image: string | null;
}

function getCurrencyLabel(name: string) {
  const n = name.toLowerCase();
  if (n.includes("bgmi") || n.includes("pubg")) return "UC";
  if (n.includes("genshin")) return "Crystals";
  if (n.includes("honor of kings") || n.includes("hok")) return "Tokens";
  if (n.includes("free fire") || n.includes("freefire")) return "Diamonds";
  if (n.includes("clash") || n.includes("brawl")) return "Gems";
  if (n.includes("valorant")) return "VP";
  if (n.includes("apex")) return "Coins";
  return "Credits";
}

function PackageCard({ pkg, currencyLabel, added, onAdd }: {
  pkg: GamePackage;
  currencyLabel: string;
  added: boolean;
  onAdd: (pkg: GamePackage) => void;
}) {
  const total = pkg.diamonds + (pkg.bonus_diamonds || 0);
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, animation: "gpFadeIn 0.25s ease" }}>
      {pkg.image ? (
        <img src={pkg.image} alt={pkg.name || ""} style={{ width: 52, height: 52, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
      ) : (
        <div style={{ width: 52, height: 52, borderRadius: 12, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" stroke="#f59e0b" strokeWidth="1.5" fill="rgba(245,158,11,0.15)" />
            <polygon points="12,2 22,8.5 12,15 2,8.5" fill="rgba(245,158,11,0.22)" />
          </svg>
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
            {pkg.name || `${total.toLocaleString()} ${currencyLabel}`}
          </span>
          {pkg.label && (
            <span style={{
              background: pkg.label === "MOST POPULAR" ? "linear-gradient(135deg,#fbbf24,#f59e0b)"
                : pkg.label.toLowerCase().includes("2x") || pkg.label.toLowerCase().includes("first") ? "linear-gradient(135deg,#ef4444,#dc2626)"
                : "rgba(99,102,241,0.9)",
              color: pkg.label.toLowerCase().includes("2x") || pkg.label.toLowerCase().includes("first") ? "#fff" : "#000",
              fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 6, letterSpacing: "0.04em", flexShrink: 0,
            }}>{pkg.label}</span>
          )}
          {pkg.is_popular && !pkg.label && (
            <span style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#000", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 6 }}>POPULAR</span>
          )}
        </div>
        <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 12 }}>
          {total.toLocaleString()} {currencyLabel}
          {pkg.bonus_diamonds > 0 && (
            <span style={{ color: "#22c55e", marginLeft: 5 }}>+{pkg.bonus_diamonds.toLocaleString()} bonus</span>
          )}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 7, flexShrink: 0 }}>
        <span style={{ color: "#f59e0b", fontWeight: 800, fontSize: 15 }}>₹{pkg.price}</span>
        <button
          onClick={() => onAdd(pkg)}
          style={{
            padding: "7px 14px", borderRadius: 10,
            background: added ? "rgba(34,197,94,0.18)" : "linear-gradient(135deg,#fcd34d,#f59e0b)",
            color: added ? "#22c55e" : "#000",
            fontWeight: 700, fontSize: 12,
            border: added ? "1px solid rgba(34,197,94,0.35)" : "none",
            cursor: "pointer", transition: "all 0.2s", minWidth: 78, textAlign: "center",
          }}
        >
          {added ? "✓ Added" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

export default function GameProductsPage() {
  const [location, setLocation] = useLocation();
  const gameId = location.split("/").filter(Boolean).pop();
  const [game, setGame] = useState<GameInfo | null>(null);
  const [packages, setPackages] = useState<GamePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState<number | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    if (!gameId) return;
    setLoading(true);
    setGame(null);
    setPackages([]);
    Promise.all([
      fetch(`${API}/games/${gameId}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API}/packages?game_id=${gameId}`).then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([gameData, pkgs]) => {
      setGame(gameData);
      const active = Array.isArray(pkgs) ? pkgs.filter((p: GamePackage) => p.status !== "out_of_stock") : [];
      setPackages(active);
    }).finally(() => setLoading(false));
  }, [gameId]);

  const handleAddToCart = useCallback((pkg: GamePackage) => {
    const cartPkg: CartPackage = { id: pkg.id, diamonds: pkg.diamonds, bonus_diamonds: pkg.bonus_diamonds, price: pkg.price, name: pkg.name, category: pkg.category };
    addToCart(cartPkg);
    setAdded(pkg.id);
    setTimeout(() => setAdded(null), 1400);
  }, [addToCart]);

  const currencyLabel = game ? getCurrencyLabel(game.name) : "Currency";

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", paddingBottom: 56 }}>
      <style>{`
        @keyframes gpFadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes gpPulse { 0%,100%{opacity:0.4} 50%{opacity:0.7} }
      `}</style>

      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(10,10,10,0.88)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "13px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => setLocation("/")}
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "7px 11px", color: "rgba(255,255,255,0.8)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, WebkitTapHighlightColor: "transparent" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Home
        </button>
        {game && (
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {game.name}
          </span>
        )}
      </div>

      {/* Game banner */}
      {game?.image ? (
        <div style={{ height: 150, overflow: "hidden", position: "relative" }}>
          <img src={game.image} alt={game.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10,10,10,0.1) 30%, #0a0a0a 100%)" }} />
          <div style={{ position: "absolute", bottom: 16, left: 16 }}>
            <div style={{ color: "#fff", fontSize: 22, fontWeight: 800, textShadow: "0 2px 16px rgba(0,0,0,0.9)" }}>{game.name}</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 3 }}>Instant {currencyLabel} top-up · Best rates</div>
          </div>
        </div>
      ) : game ? (
        <div style={{ padding: "22px 16px 0" }}>
          <div style={{ color: "#fff", fontSize: 22, fontWeight: 800 }}>{game.name}</div>
          <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 12, marginTop: 4 }}>Instant {currencyLabel} top-up · Best rates</div>
        </div>
      ) : null}

      {/* Packages */}
      <div style={{ padding: "18px 16px 0" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ height: 82, borderRadius: 16, background: "rgba(255,255,255,0.04)", animation: "gpPulse 1.4s infinite" }} />
            ))}
          </div>
        ) : packages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16, lineHeight: 1 }}>🎮</div>
            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Coming Soon</div>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Packages for {game?.name ?? "this game"} are being set up.</div>
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, marginTop: 4 }}>Check back soon or contact support.</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 13 }}>
              {packages.length} package{packages.length !== 1 ? "s" : ""} available
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {packages.map(pkg => (
                <PackageCard key={pkg.id} pkg={pkg} currencyLabel={currencyLabel} added={added === pkg.id} onAdd={handleAddToCart} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
