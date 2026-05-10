import { useEffect, useRef, useState } from "react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "").replace(/^\/[^/]+/, "") + "/api";

interface Package {
  id: number;
  diamonds: number;
  bonus_diamonds: number;
  price: string;
  label: string | null;
  name: string | null;
  category: string | null;
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
  available: boolean;
  badge?: string;
}

const CATEGORIES: Category[] = [
  { id: "small",     title: "Small Pack",       subtitle: "Quick top-ups for daily players",        color: "#38bdf8", glow: "rgba(56,189,248,0.30)",   available: true },
  { id: "normal",    title: "Normal Pack",       subtitle: "Best value with bonus diamonds",         color: "#f59e0b", glow: "rgba(245,158,11,0.30)",   available: true, badge: "Most Popular" },
  { id: "double",    title: "Double Diamond",    subtitle: "2× diamonds on your 1st recharge (resets yearly)",  color: "#00e5ff", glow: "rgba(0,229,255,0.22)",    available: true },
  { id: "passes",    title: "Passes & Bundles",  subtitle: "Weekly & monthly passes with perks",     color: "#a855f7", glow: "rgba(168,85,247,0.25)",   available: true },
  { id: "starlight", title: "Starlight Cards",   subtitle: "Exclusive skins & limited rewards",      color: "#f5c842", glow: "rgba(245,200,66,0.25)",   available: false },
  { id: "rank",      title: "Rank Boosting",     subtitle: "Rise to Mythical Glory with experts",    color: "#ec4899", glow: "rgba(236,72,153,0.25)",   available: false },
];

// ── Animated Panels ─────────────────────────────────────────────────────────

// MLBB-style 💎 diamond: flat-top crown + pointed pavilion
function MLBBDiamond({ cx, cy, hw, gradId, opacity = 1, style }: {
  cx: number; cy: number; hw: number; gradId: string; opacity?: number; style?: React.CSSProperties;
}) {
  // Outer shape (5 pts): table-left, table-right, belt-right, bottom, belt-left
  const tl = `${cx - hw * 0.62},${cy - hw}`;
  const tr = `${cx + hw * 0.62},${cy - hw}`;
  const br = `${cx + hw},${cy - hw * 0.28}`;
  const bl = `${cx - hw},${cy - hw * 0.28}`;
  const bot = `${cx},${cy + hw}`;
  // Belt y (for internal facet lines)
  const by = cy - hw * 0.28;
  // Inner crown highlight (bright trapezoid centred on table)
  const hl = `${cx - hw * 0.32},${cy - hw} ${cx + hw * 0.32},${cy - hw} ${cx + hw * 0.2},${cy - hw * 0.55} ${cx - hw * 0.2},${cy - hw * 0.55}`;
  return (
    <g style={style} opacity={opacity}>
      {/* Main body */}
      <polygon points={`${tl} ${tr} ${br} ${bot} ${bl}`} fill={`url(#${gradId})`} />
      {/* Crown face (slightly lighter overlay) */}
      <polygon points={`${tl} ${tr} ${br} ${bl}`} fill="rgba(180,230,255,0.18)" />
      {/* Crown table highlight */}
      <polygon points={hl} fill="rgba(255,255,255,0.5)" />
      {/* Left pavilion face */}
      <polygon points={`${bl} ${cx},${by} ${bot}`} fill="rgba(0,55,150,0.38)" />
      {/* Right pavilion face */}
      <polygon points={`${br} ${cx},${by} ${bot}`} fill="rgba(0,30,120,0.5)" />
      {/* Belt edge highlight line */}
      <line x1={cx - hw} y1={by} x2={cx + hw} y2={by} stroke="rgba(255,255,255,0.28)" strokeWidth="0.6" />
      {/* Centre pavilion ridge */}
      <line x1={cx} y1={by} x2={cx} y2={cy + hw} stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" />
    </g>
  );
}

function SmallPackAnim() {
  return (
    <svg viewBox="0 0 120 80" width="100%" height="100%" style={{ display: "block" }}>
      <defs>
        <radialGradient id="sp-glow" cx="50%" cy="55%" r="52%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sp-d1" x1="0%" y1="0%" x2="60%" y2="100%">
          <stop offset="0%" stopColor="#93e8ff" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
        <linearGradient id="sp-d2" x1="0%" y1="0%" x2="60%" y2="100%">
          <stop offset="0%" stopColor="#e0f9ff" />
          <stop offset="45%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="56" rx="40" ry="12" fill="url(#sp-glow)" />
      {/* Left small diamond */}
      <MLBBDiamond cx={30} cy={44} hw={10} gradId="sp-d1" opacity={0.9}
        style={{ animation: "sp-bob1 2.4s ease-in-out infinite", transformOrigin: "30px 44px" }} />
      {/* Centre large diamond */}
      <MLBBDiamond cx={60} cy={37} hw={15} gradId="sp-d2" opacity={1}
        style={{ animation: "sp-bob2 2.0s ease-in-out infinite", transformOrigin: "60px 37px" }} />
      {/* Right small diamond */}
      <MLBBDiamond cx={90} cy={44} hw={10} gradId="sp-d1" opacity={0.88}
        style={{ animation: "sp-bob3 2.7s ease-in-out infinite", transformOrigin: "90px 44px" }} />
      {/* Sparkles */}
      <circle cx="18" cy="20" r="1.5" fill="#bae6fd" style={{ animation: "sp-twinkle 1.8s ease-in-out infinite 0.2s" }} />
      <circle cx="104" cy="18" r="2"   fill="#7dd3fc" style={{ animation: "sp-twinkle 2.1s ease-in-out infinite 0.6s" }} />
      <circle cx="112" cy="56" r="1.2" fill="#e0f2fe" style={{ animation: "sp-twinkle 1.6s ease-in-out infinite 0.9s" }} />
      <circle cx="8"   cy="58" r="1.8" fill="#7dd3fc" style={{ animation: "sp-twinkle 2.4s ease-in-out infinite 0.3s" }} />
      <circle cx="60"  cy="9"  r="1.3" fill="#bae6fd" style={{ animation: "sp-twinkle 1.9s ease-in-out infinite 1.1s" }} />
    </svg>
  );
}

function NormalPackAnim() {
  return (
    <svg viewBox="0 0 120 80" width="100%" height="100%" style={{ display: "block" }}>
      <defs>
        <radialGradient id="np-glow" cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="np-d1" x1="0%" y1="0%" x2="60%" y2="100%">
          <stop offset="0%" stopColor="#93e8ff" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
        <linearGradient id="np-d2" x1="0%" y1="0%" x2="60%" y2="100%">
          <stop offset="0%" stopColor="#e0f9ff" />
          <stop offset="45%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="62" rx="46" ry="12" fill="url(#np-glow)" />
      {/* Rotating gold ring */}
      <circle cx="60" cy="40" r="30" fill="none" stroke="#f59e0b" strokeWidth="0.6" strokeOpacity="0.25"
        strokeDasharray="6 4" style={{ animation: "np-ring 6s linear infinite", transformOrigin: "60px 40px" }} />
      {/* Back-left diamond */}
      <MLBBDiamond cx={35} cy={48} hw={10} gradId="np-d1" opacity={0.68}
        style={{ animation: "sp-bob3 2.6s ease-in-out infinite 0.4s", transformOrigin: "35px 48px" }} />
      {/* Back-right diamond */}
      <MLBBDiamond cx={85} cy={47} hw={10} gradId="np-d1" opacity={0.68}
        style={{ animation: "sp-bob1 2.9s ease-in-out infinite 0.7s", transformOrigin: "85px 47px" }} />
      {/* Front large diamond */}
      <MLBBDiamond cx={60} cy={36} hw={18} gradId="np-d2" opacity={1}
        style={{ animation: "sp-bob2 2.1s ease-in-out infinite", transformOrigin: "60px 36px" }} />
      {/* Sparkles — gold to match the category colour */}
      {[[16,16,1.8,0],[104,20,1.4,0.5],[112,58,1.6,1],[8,62,1.3,0.8],[60,7,1.5,1.4],[96,60,1.2,0.3]].map(([x,y,r,d],i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#fde68a" style={{ animation: `sp-twinkle ${1.6+Number(d)}s ease-in-out infinite ${d}s` }} />
      ))}
    </svg>
  );
}

function DoubleDiamondAnim() {
  return (
    <svg viewBox="0 0 120 80" width="100%" height="100%" style={{ display: "block" }}>
      <defs>
        <linearGradient id="dd-d1" x1="0%" y1="0%" x2="60%" y2="100%">
          <stop offset="0%" stopColor="#a5f3fc" />
          <stop offset="50%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
        <linearGradient id="dd-d2" x1="0%" y1="0%" x2="60%" y2="100%">
          <stop offset="0%" stopColor="#e0f9ff" />
          <stop offset="45%" stopColor="#67e8f9" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <filter id="dd-blur"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>
      {/* Glow blobs */}
      <ellipse cx="36" cy="44" rx="18" ry="18" fill="#0ea5e9" fillOpacity="0.15" filter="url(#dd-blur)"
        style={{ animation: "dd-pulse1 2s ease-in-out infinite", transformOrigin: "36px 44px" }} />
      <ellipse cx="84" cy="44" rx="18" ry="18" fill="#00e5ff" fillOpacity="0.15" filter="url(#dd-blur)"
        style={{ animation: "dd-pulse2 2s ease-in-out infinite", transformOrigin: "84px 44px" }} />
      {/* Left MLBB diamond */}
      <MLBBDiamond cx={36} cy={40} hw={17} gradId="dd-d1" opacity={1}
        style={{ animation: "dd-pulse1 2s ease-in-out infinite", transformOrigin: "36px 40px" }} />
      {/* Right MLBB diamond */}
      <MLBBDiamond cx={84} cy={40} hw={17} gradId="dd-d2" opacity={1}
        style={{ animation: "dd-pulse2 2s ease-in-out infinite", transformOrigin: "84px 40px" }} />
      {/* ×2 label */}
      <text x="60" y="46" textAnchor="middle" fontSize="10" fontWeight="900" fill="#00e5ff" opacity="0.92"
        style={{ animation: "sp-twinkle 2s ease-in-out infinite" }}>×2</text>
      {/* Sparkles */}
      {[[12,12,1.5,0],[60,8,1.8,0.6],[108,14,1.4,0.3],[6,70,1.3,1],[114,68,1.6,0.9]].map(([x,y,r,d],i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#a5f3fc" style={{ animation: `sp-twinkle ${1.7+Number(d)}s ease-in-out infinite ${d}s` }} />
      ))}
    </svg>
  );
}

function PassesAnim() {
  return (
    <svg viewBox="0 0 120 80" width="100%" height="100%" style={{ display: "block" }}>
      <defs>
        <linearGradient id="pa-card" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" /><stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
        <linearGradient id="pa-shine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.28)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <clipPath id="pa-clip"><rect x="18" y="22" width="84" height="42" rx="7" /></clipPath>
      </defs>
      {/* Card body */}
      <rect x="18" y="22" width="84" height="42" rx="7" fill="url(#pa-card)" />
      <rect x="18" y="22" width="84" height="42" rx="7" fill="none" stroke="#a78bfa" strokeWidth="1.2" strokeOpacity="0.6" />
      {/* Decorative dots on left */}
      <circle cx="30" cy="43" r="7" fill="rgba(255,255,255,0.08)" />
      <circle cx="30" cy="43" r="4" fill="rgba(255,255,255,0.12)" />
      {/* Dashed separator */}
      <line x1="44" y1="28" x2="44" y2="58" stroke="#a78bfa" strokeWidth="0.8" strokeDasharray="3 2" strokeOpacity="0.5" />
      {/* "WEEKLY PASS" text */}
      <text x="55" y="38" fontSize="6" fontWeight="700" fill="#c4b5fd" letterSpacing="1">WEEKLY</text>
      <text x="55" y="47" fontSize="8" fontWeight="900" fill="#fff">PASS</text>
      {/* Gold star */}
      <text x="93" y="40" fontSize="10" fill="#fbbf24" style={{ animation: "sp-twinkle 2s ease-in-out infinite" }}>★</text>
      {/* Shimmer sweep */}
      <rect x="18" y="22" width="84" height="42" rx="7" fill="url(#pa-shine)" clipPath="url(#pa-clip)"
        style={{ animation: "pa-shimmer 2.4s ease-in-out infinite", transformOrigin: "60px 43px" }} />
      {/* Orbiting stars */}
      {[0,1,2,3].map(i => (
        <circle key={i} r="2" fill="#fbbf24" opacity="0.85"
          style={{ animation: `pa-orbit 3s linear infinite ${i*0.75}s`, transformOrigin: "60px 43px" }} />
      ))}
      {/* Sparkles */}
      {[[10,10,1.4,0],[110,12,1.6,0.5],[12,72,1.3,1],[110,70,1.5,0.8]].map(([x,y,r,d],i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#c4b5fd" style={{ animation: `sp-twinkle ${1.8+Number(d)}s ease-in-out infinite ${d}s` }} />
      ))}
    </svg>
  );
}

function StarlightAnim() {
  return (
    <svg viewBox="0 0 120 80" width="100%" height="100%" style={{ display: "block" }}>
      <defs>
        <radialGradient id="sl-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sl-star" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff" /><stop offset="100%" stopColor="#fde68a" />
        </radialGradient>
      </defs>
      {/* Glow */}
      <ellipse cx="60" cy="40" rx="38" ry="38" fill="url(#sl-glow)" />
      {/* Outer rotating ring */}
      <circle cx="60" cy="40" r="30" fill="none" stroke="#fde68a" strokeWidth="0.7" strokeOpacity="0.35"
        strokeDasharray="5 3" style={{ animation: "np-ring 5s linear infinite", transformOrigin: "60px 40px" }} />
      {/* Inner counter-ring */}
      <circle cx="60" cy="40" r="22" fill="none" stroke="#f59e0b" strokeWidth="0.5" strokeOpacity="0.25"
        strokeDasharray="3 4" style={{ animation: "np-ring 4s linear infinite reverse", transformOrigin: "60px 40px" }} />
      {/* Orbiting stars */}
      {[0,1,2,3,4].map(i => (
        <g key={i} style={{ animation: `sl-orbit${i%2===0?'':'2'} ${3.2+i*0.3}s linear infinite ${i*0.6}s`, transformOrigin: "60px 40px" }}>
          <text x="60" y="14" textAnchor="middle" fontSize={i===0?8:6} fill="#fde68a" opacity="0.9">★</text>
        </g>
      ))}
      {/* Center star */}
      <g style={{ animation: "sl-pulse 2s ease-in-out infinite", transformOrigin: "60px 40px" }}>
        {/* 8-point star */}
        {[0,45,90,135].map(a => (
          <rect key={a} x="57.5" y="26" width="5" height="28" rx="2.5" fill="url(#sl-star)" opacity="0.95"
            style={{ transformOrigin: "60px 40px", transform: `rotate(${a}deg)` }} />
        ))}
        <circle cx="60" cy="40" r="5" fill="url(#sl-star)" />
        <circle cx="60" cy="40" r="3" fill="#fff" opacity="0.8" />
      </g>
      {/* Sparkles */}
      {[[8,8,1.6,0],[112,10,1.4,0.5],[10,72,1.5,1],[112,72,1.3,0.7],[60,72,1.2,1.2]].map(([x,y,r,d],i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#fde68a" style={{ animation: `sp-twinkle ${1.6+Number(d)}s ease-in-out infinite ${d}s` }} />
      ))}
    </svg>
  );
}

function RankBoostAnim() {
  return (
    <svg viewBox="0 0 120 80" width="100%" height="100%" style={{ display: "block" }}>
      <defs>
        <linearGradient id="rb-shield" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f43f5e" /><stop offset="100%" stopColor="#9f1239" />
        </linearGradient>
        <linearGradient id="rb-accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" /><stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <filter id="rb-glow"><feGaussianBlur stdDeviation="2.5" /></filter>
      </defs>
      {/* Speed lines going up */}
      {[-20,-8,4,16,28].map((x,i) => (
        <line key={i} x1={60+x} y1="70" x2={60+x} y2={40+i*3}
          stroke="#ec4899" strokeWidth="1" strokeOpacity="0.18"
          style={{ animation: `rb-line 1.2s ease-in infinite ${i*0.18}s`, transformOrigin: `${60+x}px 55px` }} />
      ))}
      {/* Shield glow */}
      <ellipse cx="60" cy="38" rx="20" ry="20" fill="#ec4899" fillOpacity="0.12" filter="url(#rb-glow)"
        style={{ animation: "sl-pulse 2.2s ease-in-out infinite", transformOrigin: "60px 38px" }} />
      {/* Shield body */}
      <g style={{ animation: "sp-bob2 2.4s ease-in-out infinite", transformOrigin: "60px 40px" }}>
        <path d="M60 14 L78 22 L78 42 Q78 56 60 64 Q42 56 42 42 L42 22 Z" fill="url(#rb-shield)" />
        <path d="M60 14 L78 22 L78 42 Q78 56 60 64 Q42 56 42 42 L42 22 Z" fill="none" stroke="#fbbf24" strokeWidth="1.2" strokeOpacity="0.6" />
        {/* M letter (mythic) */}
        <text x="60" y="43" textAnchor="middle" fontSize="14" fontWeight="900" fill="url(#rb-accent)" letterSpacing="-1">M</text>
        {/* Arrow up */}
        <path d="M60 26 L55 32 L57.5 32 L57.5 38 L62.5 38 L62.5 32 L65 32 Z" fill="#fbbf24" opacity="0.9" />
      </g>
      {/* Gold stars bottom */}
      {[-18,-6,6,18].map((dx,i) => (
        <text key={i} x={60+dx} y="74" textAnchor="middle" fontSize="8" fill="#fbbf24"
          style={{ animation: `sp-twinkle ${1.8+i*0.3}s ease-in-out infinite ${i*0.3}s`, opacity: 0.85 }}>★</text>
      ))}
      {/* Sparkles */}
      {[[10,10,1.5,0],[110,8,1.4,0.6],[8,65,1.3,1.1],[112,62,1.6,0.4]].map(([x,y,r,d],i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#fda4af" style={{ animation: `sp-twinkle ${1.7+Number(d)}s ease-in-out infinite ${d}s` }} />
      ))}
    </svg>
  );
}

const PANEL_ANIMS: Record<CategoryId, React.ReactNode> = {
  small: <SmallPackAnim />,
  normal: <NormalPackAnim />,
  double: <DoubleDiamondAnim />,
  passes: <PassesAnim />,
  starlight: <StarlightAnim />,
  rank: <RankBoostAnim />,
};

// ── Image helpers ────────────────────────────────────────────────────────────
function getPackImage(diamonds: number): string {
  if (diamonds <= 10) return "/pack1.png";
  if (diamonds <= 49) return "/pack2.png";
  if (diamonds <= 99) return "/pack3.png";
  if (diamonds <= 499) return "/pack4.png";
  if (diamonds <= 999) return "/pack5.png";
  if (diamonds <= 1500) return "/pack6.png";
  return "/pack7.png";
}

const PASS_IMAGES: Record<string, string> = {
  "Weekly Pass":          "/pass1.jpg",
  "Twilight Pass":        "/pass2.jpg",
  "Weekly Elite Bundle":  "/pass3.jpg",
  "Monthly Epic Bundle":  "/pass4.jpg",
};

function getPassImage(name: string | null): string {
  return (name && PASS_IMAGES[name]) || "/pass1.jpg";
}

function ImagePane({ src }: { src: string }) {
  return (
    <div style={{ position: "relative", height: 130, overflow: "hidden", flexShrink: 0, background: "#0a0a0a" }}>
      <img
        src={src}
        alt=""
        style={{
          width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "center 45%",
          display: "block",
          imageRendering: "high-quality" as React.CSSProperties["imageRendering"],
          transform: "translateZ(0)",
          filter: "contrast(1.08) saturate(1.18) brightness(1.04)",
          WebkitBackfaceVisibility: "hidden",
        }}
      />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 18,
        background: "linear-gradient(to bottom, #111 0%, rgba(17,17,17,0.5) 60%, transparent 100%)",
        zIndex: 1, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 32,
        background: "linear-gradient(to top, #111 0%, rgba(17,17,17,0.7) 55%, transparent 100%)",
        zIndex: 1, pointerEvents: "none" }} />
    </div>
  );
}

// ── Category card ───────────────────────────────────────────────────────────
function CategoryCard({ cat, onClick, index, isPopularNow, isExiting }: { cat: Category; onClick: () => void; index: number; isPopularNow?: boolean; isExiting?: boolean }) {
  const enterDelay = index * 0.13;
  const exitDelay  = index * 0.08;
  const anim = isExiting
    ? `catSlideOut 0.35s cubic-bezier(0.55,0,0.9,0.5) ${exitDelay}s both`
    : `catSlideIn 0.45s cubic-bezier(0.25,0.46,0.45,0.94) ${enterDelay}s both`;
  return (
    <div
      onClick={() => cat.available && onClick()}
      style={{
        background: "rgba(14,14,14,0.82)", borderRadius: 18,
        border: `1px solid ${cat.available ? cat.color + "45" : "rgba(255,255,255,0.07)"}`,
        overflow: "hidden", display: "flex", flexDirection: "column",
        cursor: cat.available ? "pointer" : "default",
        boxShadow: cat.available ? `0 0 20px ${cat.glow}` : "none",
        opacity: cat.available ? 1 : 0.55,
        backdropFilter: "blur(6px)",
        animation: anim,
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
      {/* Popular Now badge from admin setting */}
      {isPopularNow && cat.available && (
        <div style={{ position: "absolute", top: 10, left: 10, zIndex: 3,
          background: "linear-gradient(135deg,#ef4444,#dc2626)",
          color: "#fff", fontSize: 8, fontWeight: 800, letterSpacing: "0.08em",
          padding: "3px 7px", borderRadius: 999, textTransform: "uppercase" }}>
          🔥 Popular Now
        </div>
      )}
      {cat.badge && cat.available && (
        <div style={{ position: "absolute", top: 10, right: 10, zIndex: 3,
          background: "linear-gradient(135deg,#fbbf24,#f59e0b)",
          color: "#000", fontSize: 8, fontWeight: 800, letterSpacing: "0.08em",
          padding: "3px 7px", borderRadius: 999, textTransform: "uppercase" }}>
          {cat.badge}
        </div>
      )}
      {!cat.available && (
        <div style={{ position: "absolute", top: 10, right: 10, zIndex: 3,
          background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)",
          fontSize: 8, fontWeight: 700, padding: "3px 7px", borderRadius: 999,
          textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Soon
        </div>
      )}

      {/* Animated panel */}
      <div style={{ height: 90, background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {PANEL_ANIMS[cat.id]}
      </div>

      <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ color: cat.available ? "#fff" : "rgba(255,255,255,0.4)", fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>
          {cat.title}
        </div>
        <div style={{ color: "rgba(255,255,255,0.32)", fontSize: 11, lineHeight: 1.4 }}>
          {cat.subtitle}
        </div>
        {cat.available && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 2 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%",
              background: cat.color + "18", border: `1px solid ${cat.color}40`,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
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

// ── Individual pack card (small / normal / double) ──────────────────────────
function PackCard({ pack, isDouble, index, onBuy, onAddToCart }: { pack: Package; isDouble?: boolean; index: number; onBuy?: (pkg: Package) => void; onAddToCart?: (pkg: Package) => void }) {
  const [cartFlash, setCartFlash] = useState(false);
  const hasBonus = pack.bonus_diamonds > 0;
  const base = pack.diamonds - pack.bonus_diamonds;

  function handleAddToCart(e: React.MouseEvent) {
    e.stopPropagation();
    onAddToCart?.(pack);
    setCartFlash(true);
    setTimeout(() => setCartFlash(false), 900);
  }

  return (
    <div
      style={{
        background: "rgba(14,14,14,0.82)", borderRadius: 18,
        backdropFilter: "blur(6px)",
        border: pack.is_popular ? "1.5px solid rgba(245,158,11,0.6)" : isDouble ? "1.5px solid rgba(0,229,255,0.35)" : "1px solid rgba(255,255,255,0.08)",
        overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: pack.is_popular ? "0 0 24px rgba(245,158,11,0.25)" : isDouble ? "0 0 18px rgba(0,229,255,0.18)" : "0 2px 12px rgba(0,0,0,0.4)",
        position: "relative", cursor: "pointer",
        animation: `catSlideIn 0.45s cubic-bezier(0.25,0.46,0.45,0.94) ${index * 0.13}s both`,
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(-3px) scale(1.02)";
        el.style.boxShadow = pack.is_popular ? "0 8px 36px rgba(245,158,11,0.4)" : isDouble ? "0 8px 28px rgba(0,229,255,0.3)" : "0 8px 28px rgba(0,0,0,0.6)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "";
        el.style.boxShadow = pack.is_popular ? "0 0 24px rgba(245,158,11,0.25)" : isDouble ? "0 0 18px rgba(0,229,255,0.18)" : "0 2px 12px rgba(0,0,0,0.4)";
      }}
    >
      {isDouble && (
        <div style={{ position: "absolute", top: 10, left: 10, zIndex: 3, background: "#dc2626", color: "#fff", fontSize: 9, fontWeight: 900, letterSpacing: "0.05em", padding: "3px 8px", borderRadius: 999 }}>2×</div>
      )}
      {pack.is_popular && (
        <div style={{ position: "absolute", top: 10, right: 10, zIndex: 3, background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#000", fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", padding: "3px 8px", borderRadius: 999, textTransform: "uppercase" }}>Popular</div>
      )}
      <ImagePane src={getPackImage(pack.diamonds)} />
      <div style={{ padding: "11px 13px 13px", display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ color: isDouble ? "#00e5ff" : "#38bdf8", fontSize: 12 }}>♦</span>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>{pack.diamonds.toLocaleString()}</span>
          <span style={{ color: "rgba(255,255,255,0.38)", fontSize: 10 }}>Diamonds</span>
        </div>
        {hasBonus ? (
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
            <span style={{ color: "rgba(255,255,255,0.5)" }}>{base.toLocaleString()}</span>
            {" + "}
            <span style={{ color: isDouble ? "#00e5ff" : "#4ade80", fontWeight: 700 }}>{pack.bonus_diamonds} bonus</span>
          </div>
        ) : (
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>No bonus</div>
        )}
        <div style={{ color: "#f59e0b", fontWeight: 800, fontSize: 16, marginTop: 3 }}>₹{Number(pack.price).toLocaleString("en-IN")}</div>
        <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
          <button
            onClick={handleAddToCart}
            style={{ flex: 1, background: cartFlash ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.07)", border: cartFlash ? "1px solid rgba(34,197,94,0.5)" : "1px solid rgba(255,255,255,0.12)", color: cartFlash ? "#22c55e" : "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: 700, padding: "6px 0", borderRadius: 8, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
          >
            {cartFlash ? "✓" : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
            {cartFlash ? "Added!" : "Cart"}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onBuy?.(pack); }} style={{ flex: 2, background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#000", fontSize: 11, fontWeight: 800, padding: "6px 0", borderRadius: 8, cursor: "pointer", border: "none" }}>Buy Now</button>
        </div>
      </div>
    </div>
  );
}

// ── Pass card (Passes & Bundles) ────────────────────────────────────────────
function PassCard({ pack, index, onBuy, onAddToCart }: { pack: Package; index: number; onBuy?: (pkg: Package) => void; onAddToCart?: (pkg: Package) => void }) {
  const [cartFlash, setCartFlash] = useState(false);

  function handleAddToCart(e: React.MouseEvent) {
    e.stopPropagation();
    onAddToCart?.(pack);
    setCartFlash(true);
    setTimeout(() => setCartFlash(false), 900);
  }

  return (
    <div
      style={{
        background: "rgba(14,14,14,0.82)", borderRadius: 18,
        backdropFilter: "blur(6px)",
        border: "1.5px solid rgba(168,85,247,0.35)",
        overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 0 18px rgba(168,85,247,0.18)",
        position: "relative", cursor: "pointer",
        animation: `catSlideIn 0.45s cubic-bezier(0.25,0.46,0.45,0.94) ${index * 0.13}s both`,
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(-3px) scale(1.02)";
        el.style.boxShadow = "0 8px 28px rgba(168,85,247,0.3)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "";
        el.style.boxShadow = "0 0 18px rgba(168,85,247,0.18)";
      }}
    >
      <ImagePane src={getPassImage(pack.name)} />
      <div style={{ padding: "11px 13px 13px", display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ color: "#fff", fontWeight: 800, fontSize: 13, lineHeight: 1.3 }}>{pack.name}</div>
        <div style={{ color: "#f59e0b", fontWeight: 800, fontSize: 16, marginTop: 4 }}>₹{Number(pack.price).toLocaleString("en-IN")}</div>
        <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
          <button
            onClick={handleAddToCart}
            style={{ flex: 1, background: cartFlash ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.07)", border: cartFlash ? "1px solid rgba(34,197,94,0.5)" : "1px solid rgba(255,255,255,0.12)", color: cartFlash ? "#22c55e" : "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: 700, padding: "6px 0", borderRadius: 8, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
          >
            {cartFlash ? "✓" : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
            {cartFlash ? "Added!" : "Cart"}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onBuy?.(pack); }} style={{ flex: 2, background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#000", fontSize: 11, fontWeight: 800, padding: "6px 0", borderRadius: 8, cursor: "pointer", border: "none" }}>Buy Now</button>
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
  const sort = (arr: Package[]) => [...arr].sort((a, b) => a.sort_order - b.sort_order || a.diamonds - b.diamonds);
  if (id === "small")  return sort(packages.filter(p => (p.category ?? (p.diamonds <= 49 ? "small" : "normal")) === "small"));
  if (id === "normal") return sort(packages.filter(p => (p.category ?? (p.diamonds <= 49 ? "small" : "normal")) === "normal"));
  if (id === "double") return sort(packages.filter(p => p.category === "double"));
  if (id === "passes") return sort(packages.filter(p => p.category === "passes"));
  return [];
}

// ── Main section ────────────────────────────────────────────────────────────
export default function PackagesSection({ onPackageSelect: _p, onBack, onBuy, onAddToCart, isExiting }: { onPackageSelect: (id: string) => void; onBack?: () => void; onBuy?: (pkg: Package) => void; onAddToCart?: (pkg: Package) => void; isExiting?: boolean }) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [categoryPopular, setCategoryPopular] = useState<Record<string, boolean>>({});
  const activeCategoryRef = useRef<Category | null>(null);
  useEffect(() => { activeCategoryRef.current = activeCategory; }, [activeCategory]);
  useEffect(() => {
    fetch(`${API}/packages`)
      .then(r => r.json())
      .then(data => { setPackages(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
    fetch(`${API}/settings/category_popular`)
      .then(r => r.json())
      .then(data => setCategoryPopular(data || {}))
      .catch(() => {});
  }, []);

  // Push browser history state when category is selected so device back button works
  const selectCategory = (cat: Category) => {
    window.history.pushState({ sky_cat: cat.id }, "");
    setActiveCategory(cat);
  };

  useEffect(() => {
    const handler = () => {
      if (activeCategoryRef.current) {
        setActiveCategory(null);
      }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const handleBackBtn = () => {
    if (activeCategory) {
      window.history.back();
    } else {
      onBack?.();
    }
  };

  const activePacks = activeCategory ? filterByCategory(packages, activeCategory.id) : [];

  return (
    <section style={{ position: "relative", background: "transparent", minHeight: "100vh", paddingBottom: 48, overflow: "hidden" }}>
      <style>{`
        @keyframes pkg-diagIn   { from{opacity:0;transform:translate(-20px,-20px)} to{opacity:1;transform:translate(0,0)} }
        @keyframes pkgSlideLeft { from{opacity:0;transform:translateX(-28px)} to{opacity:1;transform:translateX(0)} }
        @keyframes catSlideIn   { from{opacity:0;transform:translateX(110%)} to{opacity:1;transform:translateX(0)} }
        @keyframes catSlideOut  { from{opacity:1;transform:translateX(0)} to{opacity:0;transform:translateX(110%)} }
        @keyframes sp-bob1     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes sp-bob2     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes sp-bob3     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes sp-twinkle  { 0%,100%{opacity:0.15;transform:scale(0.7)} 50%{opacity:1;transform:scale(1.3)} }
        @keyframes np-ring     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes dd-pulse1   { 0%,100%{opacity:0.7;transform:scale(0.96)} 50%{opacity:1;transform:scale(1.04)} }
        @keyframes dd-pulse2   { 0%,100%{opacity:1;transform:scale(1.04)} 50%{opacity:0.7;transform:scale(0.96)} }
        @keyframes pa-shimmer  { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        @keyframes pa-orbit    {
          0%   {transform:rotate(0deg)   translateY(-36px) rotate(0deg)}
          100% {transform:rotate(360deg) translateY(-36px) rotate(-360deg)}
        }
        @keyframes sl-orbit    {
          0%   {transform:rotate(0deg)   translateY(-30px) rotate(0deg)}
          100% {transform:rotate(360deg) translateY(-30px) rotate(-360deg)}
        }
        @keyframes sl-orbit2   {
          0%   {transform:rotate(180deg) translateY(-22px) rotate(-180deg)}
          100% {transform:rotate(540deg) translateY(-22px) rotate(-540deg)}
        }
        @keyframes sl-pulse    { 0%,100%{transform:scale(0.93);opacity:0.85} 50%{transform:scale(1.07);opacity:1} }
        @keyframes rb-line     { 0%{opacity:0;transform:scaleY(0)} 40%{opacity:1} 100%{opacity:0;transform:scaleY(1) translateY(-30px)} }
        @keyframes pkgPageIn   { from{opacity:0;transform:translateX(32px)} to{opacity:1;transform:translateX(0)} }
      `}</style>

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "min(560px, calc(100dvh * 9 / 16))", margin: "0 auto", padding: "0 16px" }}>
        {/* Header */}
        {(() => {
          const exitHeader = isExiting && !activeCategory;
          const hdrAnim = (delay: number) =>
            exitHeader
              ? `catSlideOut 0.38s cubic-bezier(0.55,0,0.9,0.5) ${delay}s both`
              : `catSlideIn 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}s both`;
          return (
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ display: "inline-block", padding: "5px 16px", borderRadius: 999,
                background: "rgba(245,200,40,0.1)", border: "1px solid rgba(245,200,40,0.3)",
                color: "#f5c842", fontSize: 11, fontWeight: 700, letterSpacing: "0.18em",
                textTransform: "uppercase", marginBottom: 12,
                animation: hdrAnim(0) }}>
                Our Packages
              </div>
              <h2 style={{ color: "#fff", fontSize: "clamp(1.6rem,6vw,2.2rem)", fontWeight: 800, lineHeight: 1.2, margin: 0, animation: hdrAnim(exitHeader ? 0.04 : 0.09) }}>
                {activeCategory ? activeCategory.title : "Choose Your Pack"}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 8, animation: hdrAnim(exitHeader ? 0.08 : 0.16) }}>
                {activeCategory ? "Tap a pack to purchase" : "Tap a category to view available packs"}
              </p>
            </div>
          );
        })()}

        {/* Single back button — context-aware */}
        <button
          onClick={handleBackBtn}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 999, padding: "7px 16px 7px 12px",
            color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600,
            cursor: "pointer", marginBottom: 20,
            animation: isExiting && !activeCategory
              ? `catSlideOut 0.38s cubic-bezier(0.55,0,0.9,0.5) 0.12s both`
              : `catSlideIn 0.55s cubic-bezier(0.22,1,0.36,1) 0.22s both`,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {activeCategory ? "All Categories" : "Home"}
        </button>

        {/* Category grid */}
        {!activeCategory && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {CATEGORIES.map((cat, i) => (
              <CategoryCard key={cat.id} cat={cat} index={i} onClick={() => selectCategory(cat)} isPopularNow={!!categoryPopular[cat.id]} isExiting={isExiting && !activeCategory} />
            ))}
          </div>
        )}

        {/* Pack list — individual stagger slide-in from right */}
        {activeCategory && (
          <div key={activeCategory.id}>
            {loading && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}
            {!loading && activePacks.length === 0 && (
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.35)", padding: "40px 0", fontSize: 14 }}>
                No packs in this category yet.
              </div>
            )}
            {!loading && activePacks.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {activePacks.map((pack, i) =>
                  activeCategory?.id === "passes"
                    ? <PassCard key={pack.id} pack={pack} index={i} onBuy={onBuy} onAddToCart={onAddToCart} />
                    : <PackCard key={pack.id} pack={pack} index={i} isDouble={activeCategory?.id === "double"} onBuy={onBuy} onAddToCart={onAddToCart} />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
