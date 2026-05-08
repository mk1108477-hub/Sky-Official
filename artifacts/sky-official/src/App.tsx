import React, { useEffect, useState, useRef, useCallback } from "react";
import AdminPanel from "./components/AdminPanel";
import PackagesSection from "./components/PackagesSection";
import OrderHistoryPage from "./components/OrderHistoryPage";
import ProfilePage from "./components/ProfilePage";
import MLBBVerifyPage from "./components/MLBBVerifyPage";
import PaymentPage, { setSelectedPackage } from "./components/PaymentPage";
import type { SelectedPackage } from "./components/PaymentPage";
import {
  ClerkProvider,
  SignIn,
  SignUp,
  Show,
  useUser,
  useClerk,
  useAuth,
} from "@clerk/react";
import { dark } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";

const WHATSAPP_GROUP = "https://chat.whatsapp.com/DB3FwXqNUi649KT18VjVu9";
const WHATSAPP_NUMBER = "https://wa.me/919362003788";

const NAV_SUBTITLES = [
  "Instant Delivery",
  "Affordable Prices",
  "P2P Chat Support",
  "Secure Transaction",
];

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = import.meta.env.BASE_URL.replace(/\/$/, "").replace(/^\/[^/]+/, "") + "/api";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  baseTheme: dark,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "none" as const,
  },
  variables: {
    colorPrimary: "#f59e0b",
    colorForeground: "#f9fafb",
    colorMutedForeground: "#6b7280",
    colorDanger: "#ef4444",
    colorBackground: "#07080a",
    colorInput: "#111318",
    colorInputForeground: "#f9fafb",
    colorNeutral: "#374151",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.65rem",
    fontSize: "0.9rem",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full !shadow-none !bg-transparent",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none !p-0",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none !pt-4",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    header: "hidden",
    socialButtonsBlockButtonArrow: "hidden",
    socialButtonsBlockButton: "!bg-[#1a1c22] !border-2 !border-white/35 hover:!border-amber-500/60 hover:!bg-[#22242c] !transition-all !rounded-lg !h-11 !shadow-none",
    socialButtonsBlockButtonText: "!text-white !font-medium !text-sm",
    formFieldLabel: "!text-gray-400 !font-medium !text-xs !uppercase !tracking-wide",
    footerActionLink: "!text-amber-400 !font-semibold hover:!text-amber-300",
    footerActionText: "!text-gray-600 !text-sm",
    dividerText: "!text-gray-600 !text-xs",
    identityPreviewEditButton: "!text-amber-400",
    formFieldSuccessText: "!text-green-400",
    alertText: "!text-red-400 !text-sm",
    socialButtonsBlockButtonIconBox: "!mr-2",
    formButtonPrimary: "!bg-amber-500 hover:!bg-amber-400 !text-black !font-bold !transition-colors !rounded-lg !h-11 !shadow-none",
    formFieldInput: "!bg-[#111318] !border-[#1f2937] !text-white focus:!border-amber-500/60 !rounded-lg !h-11 !text-sm",
    footerAction: "!border-t !border-white/5 !mt-5",
    dividerLine: "!bg-white/8",
    alert: "!border !border-red-900/50 !bg-red-950/30 !rounded-lg",
    otpCodeFieldInput: "!bg-[#111318] !border-[#1f2937] !text-white",
    formFieldRow: "gap-3",
    main: "gap-5",
    socialButtons: "gap-2.5",
    formHeader: "hidden",
    internal__clerk_components_inner: "gap-5",
  },
};

// ── Animated Diamonds ──────────────────────────────────────────────────────
function AnimatedDiamonds({ size = 80 }: { size?: number }) {
  const s = size * 0.34;
  const lg = size * 0.415;
  const diamonds = [
    { w: s,  h: s,  bg: "linear-gradient(135deg,#f59e0b,#d97706)", shadow: "0 0 10px 3px rgba(245,158,11,0.45)", delay: "0s" },
    { w: lg, h: lg, bg: "linear-gradient(135deg,#fcd34d,#f59e0b)", shadow: "0 0 20px 7px rgba(245,158,11,0.65)", delay: "0.28s" },
    { w: s,  h: s,  bg: "linear-gradient(135deg,#f59e0b,#d97706)", shadow: "0 0 10px 3px rgba(245,158,11,0.45)", delay: "0.56s" },
  ];
  return (
    <div className="flex items-center justify-center" style={{ gap: size * 0.09 }}>
      {diamonds.map((d, i) => (
        <div key={i} style={{ width: d.w, height: d.h, background: d.bg, transform: "rotate(45deg)", borderRadius: 4, boxShadow: d.shadow, flexShrink: 0, animation: "diamondSeq 1.8s ease-in-out infinite", animationDelay: d.delay }} />
      ))}
    </div>
  );
}

// ── Loading Screen ─────────────────────────────────────────────────────────
function LoadingScreen({ onDone }: { onDone: () => void }) {
  const doneRef = useRef(false);

  const triggerDone = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden" style={{ background: "#0a0a0a" }}>
      <video autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.45 }} onEnded={triggerDone} onError={triggerDone}>
        <source src="/intro.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.32)" }} />
      <div className="relative flex flex-col items-center gap-3 z-10">
        <AnimatedDiamonds size={72} />
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-white font-bold uppercase" style={{ fontSize: 16, letterSpacing: "0.3em" }}>SKY OFFICIAL</h1>
          <p className="uppercase font-bold" style={{ fontSize: 9, letterSpacing: "0.38em", background: "linear-gradient(90deg, transparent 0%, #f59e0b 20%, #fcd34d 50%, #f59e0b 80%, transparent 100%)", backgroundSize: "200% 100%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "shimmerLR 2.8s ease-in-out infinite" }}>
            INSTANT TOP UP
          </p>
        </div>
      </div>
      <style>{`
        @keyframes diamondSeq {
          0%   { opacity: 0.25; transform: rotate(45deg) scale(0.85); }
          30%  { opacity: 1;    transform: rotate(45deg) scale(1.08); }
          60%  { opacity: 0.25; transform: rotate(45deg) scale(0.85); }
          100% { opacity: 0.25; transform: rotate(45deg) scale(0.85); }
        }
        @keyframes shimmerLR {
          0%   { background-position: 150% 0; }
          100% { background-position: -150% 0; }
        }
        @keyframes smokeMove {
          0% { transform: scale(1) translateX(0) translateY(0); }
          25% { transform: scale(1.05) translateX(-2%) translateY(1%); }
          50% { transform: scale(1.1) translateX(2%) translateY(-1%); }
          75% { transform: scale(1.05) translateX(-1%) translateY(2%); }
          100% { transform: scale(1) translateX(0) translateY(0); }
        }
        @keyframes scrollTicker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

// ── Navbar ─────────────────────────────────────────────────────────────────
function Navbar() {
  const [subtitleIdx, setSubtitleIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const [, setLocation] = useLocation();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setSubtitleIdx((i) => (i + 1) % NAV_SUBTITLES.length); setVisible(true); }, 400);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-3 py-2"
      style={{
        background: "rgba(7,8,10,0.88)",
        backdropFilter: "blur(18px)",
        borderBottom: "1px solid rgba(245,158,11,0.1)",
        boxShadow: "0 1px 24px rgba(0,0,0,0.4)",
        animation: "navSlideDown 0.5s cubic-bezier(0.22,1,0.36,1) both",
      }}
    >
      <style>{`
        @keyframes navSlideDown {
          from { opacity: 0; transform: translateY(-100%); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes glitch {
          0%,86%,100% { text-shadow: none; transform: none; clip-path: none; }
          87% { text-shadow: -2px 0 #f43f5e, 2px 0 #38bdf8; transform: translateX(-1.5px) skewX(-4deg); }
          88% { text-shadow: 2px 0 #f43f5e, -2px 0 #a78bfa; transform: translateX(1.5px) skewX(3deg); }
          89% { text-shadow: none; transform: translateX(-1px); }
          90% { text-shadow: -1px 0 #38bdf8, 1px 0 #f59e0b; transform: translateX(1px) skewX(-2deg); }
          91% { text-shadow: none; transform: none; }
          92% { text-shadow: 2px 0 #f43f5e, -1px 0 #38bdf8; transform: translateX(-0.5px); }
          93%,100% { text-shadow: none; transform: none; }
        }
        .sky-glitch {
          animation: glitch 6s ease-in-out infinite;
          display: inline-block;
        }
      `}</style>
      <button
        onClick={() => setLocation("/")}
        className="flex items-center gap-2"
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ background: "#000", border: "1.5px solid #f59e0b", boxShadow: "0 0 8px 1.5px rgba(245,158,11,0.5)" }}>
          <img src="/logo.jpg" alt="Sky Official" className="w-full h-full object-cover" />
        </div>
        <div className="flex items-center gap-1.5">
          <div>
            <span className="sky-glitch font-bold leading-tight block" style={{ color: "#fff", fontSize: 12 }}>Sky Official</span>
            <div style={{ fontSize: 8, lineHeight: 1, color: "#f59e0b", opacity: visible ? 1 : 0, transition: "opacity 0.4s ease", marginTop: 1.5, textAlign: "left" }}>{NAV_SUBTITLES[subtitleIdx]}</div>
          </div>
        </div>
      </button>
      {isLoaded && (
        user ? (
          <div className="flex items-center gap-1.5">
            <button onClick={() => setLocation("/profile")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", borderRadius: "50%" }}>
              <div className="w-7 h-7 rounded-full overflow-hidden border flex-shrink-0" style={{ borderColor: "#f59e0b" }}>
                <img src={user.imageUrl} alt={user.firstName ?? "User"} className="w-full h-full object-cover" />
              </div>
            </button>
            <button
              onClick={() => signOut(() => setLocation("/"))}
              className="px-2.5 py-1 rounded-full font-bold text-black"
              style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)", fontSize: 11 }}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={() => setLocation("/sign-in")}
            className="px-4 py-1.5 rounded-full font-bold text-black"
            style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)", boxShadow: "0 2px 12px rgba(245,158,11,0.4)", fontSize: 12 }}
          >
            Sign In
          </button>
        )
      )}
    </nav>
  );
}

// ── Hero ───────────────────────────────────────────────────────────────────
const HERO_VIDEOS = ["/hero.mp4", "/bg-video.mp4"];

function HeroSection({ animate = false }: { animate?: boolean }) {
  const [, setLocation] = useLocation();
  const featureTexts = ["Instant delivery", "Affordable prices", "P2P chat support", "Safe and secure transaction"];
  const [activeFeature, setActiveFeature] = useState(0);

  // Randomly pick play order once per mount (50/50)
  const orderRef = useRef<[number, number]>(
    Math.random() < 0.5 ? [0, 1] : [1, 0]
  );

  const video0Ref = useRef<HTMLVideoElement>(null);
  const video1Ref = useRef<HTMLVideoElement>(null);
  const [activeSlot, setActiveSlot] = useState(0);
  const activeSlotRef = useRef(0);
  const [crossfade, setCrossfade] = useState<"none" | "in" | "out">("none");
  const isSwitchingRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => setActiveFeature((i) => (i + 1) % featureTexts.length), 2200);
    return () => clearInterval(interval);
  }, []);

  // Initial autoplay of slot 0
  useEffect(() => {
    const v = video0Ref.current;
    if (!v) return;
    v.muted = true;
    const tryPlay = () => v.play().catch(() => setTimeout(tryPlay, 300));
    tryPlay();
  }, []);

  // After intro animation, ensure active video is playing
  useEffect(() => {
    if (!animate) return;
    const v = activeSlotRef.current === 0 ? video0Ref.current : video1Ref.current;
    if (!v) return;
    v.muted = true;
    v.play().catch(() => {});
  }, [animate]);

  // Watch the active video and handle crossfade switch when near end
  useEffect(() => {
    activeSlotRef.current = activeSlot;
    const v = activeSlot === 0 ? video0Ref.current : video1Ref.current;
    if (!v) return;

    const onTimeUpdate = () => {
      if (!v.duration || isSwitchingRef.current) return;
      const remaining = v.duration - v.currentTime;
      if (remaining <= 1.6) {
        isSwitchingRef.current = true;
        // Pause immediately so the last frame never flashes
        v.pause();
        // Fade overlay in
        setCrossfade("in");
        setTimeout(() => {
          // Switch to the other slot under the fully-darkened overlay
          const nextSlot = 1 - activeSlotRef.current;
          const nextV = nextSlot === 0 ? video0Ref.current : video1Ref.current;
          if (nextV) {
            nextV.muted = true;
            nextV.currentTime = 0;
            nextV.play().catch(() => {});
          }
          setActiveSlot(nextSlot);
          activeSlotRef.current = nextSlot;
          // Fade overlay back out
          setCrossfade("out");
          setTimeout(() => {
            setCrossfade("none");
            isSwitchingRef.current = false;
          }, 750);
        }, 750);
      }
    };

    v.addEventListener("timeupdate", onTimeUpdate);
    return () => v.removeEventListener("timeupdate", onTimeUpdate);
  }, [activeSlot]);

  const diag = (delay: number): React.CSSProperties =>
    animate
      ? { animation: `fadeInDiag 0.75s cubic-bezier(0.25,0.46,0.45,0.94) ${delay}s both` }
      : { opacity: 0 };

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-16" style={{ background: "#0d0d0d" }}>
      {/* Video slot 0 */}
      <video
        ref={video0Ref}
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: activeSlot === 0 ? 0.32 : 0, zIndex: 0, transition: "none" }}
      >
        <source src={HERO_VIDEOS[orderRef.current[0]]} type="video/mp4" />
      </video>
      {/* Video slot 1 */}
      <video
        ref={video1Ref}
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: activeSlot === 1 ? 0.32 : 0, zIndex: 0, transition: "none" }}
      >
        <source src={HERO_VIDEOS[orderRef.current[1]]} type="video/mp4" />
      </video>
      {/* Black crossfade overlay — max opacity 0.7 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "#000",
          zIndex: 1,
          opacity: crossfade === "in" ? 0.7 : 0,
          transition: crossfade === "none" ? "none" : "opacity 0.75s ease",
        }}
      />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 55% at 50% 55%, rgba(100,60,0,0.45) 0%, transparent 70%)", zIndex: 2 }} />
      <div className="relative z-10 flex flex-col gap-2.5 px-5 pt-5 pb-9 max-w-lg mx-auto w-full">
        <div className="flex justify-center" style={diag(0)}>
          <span className="px-3 py-0.5 rounded-full font-bold uppercase" style={{ border: "1.5px solid rgba(245,158,11,0.55)", color: "#f59e0b", background: "rgba(245,158,11,0.07)", letterSpacing: "0.14em", fontSize: 8 }}>MLBB Diamond Top Up</span>
        </div>
        <div className="text-center">
          <h1 className="font-extrabold leading-tight" style={{ fontSize: "clamp(1.15rem,5.5vw,1.65rem)" }}>
            <span className="text-white block" style={diag(0.13)}>Recharge Fast.</span>
            <span className="block" style={{ color: "#f59e0b", ...diag(0.26) }}>Dominate the</span>
            <span className="block" style={{ color: "#f59e0b", ...diag(0.39) }}>Game.</span>
          </h1>
        </div>
        <p className="text-center text-gray-400 leading-relaxed px-2" style={{ maxWidth: 260, margin: "0 auto", fontSize: 11, ...diag(0.52) }}>
          Instant delivery, secure payments, and the best prices for Mobile Legends Bang Bang. Shop smart, play hard.
        </p>
        <div className="relative h-4 flex items-center justify-center overflow-hidden" style={diag(0.65)}>
          {featureTexts.map((text, i) => (
            <span key={i} className="absolute font-semibold text-center" style={{ fontSize: 9.5, color: "#fbbf24", opacity: activeFeature === i ? 1 : 0, transform: activeFeature === i ? "translateY(0)" : "translateY(6px)", transition: "opacity 0.55s ease, transform 0.55s ease", pointerEvents: "none", letterSpacing: "0.05em" }}>✦ {text}</span>
          ))}
        </div>
        <div className="flex justify-center mt-1" style={diag(0.78)}>
          <button onClick={() => setLocation("/packages")} className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full font-bold text-black" style={{ background: "linear-gradient(135deg,#fcd34d,#f59e0b)", boxShadow: "0 0 22px rgba(245,158,11,0.5), 0 3px 12px rgba(0,0,0,0.5)", fontSize: 12, border: "none", cursor: "pointer" }}>
            View Packages <span style={{ fontSize: 13 }}>→</span>
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeInDiag {
          from { opacity: 0; transform: translate(-24px, -24px); }
          to   { opacity: 1; transform: translate(0, 0); }
        }
      `}</style>
    </section>
  );
}

// ── Features ───────────────────────────────────────────────────────────────
function FeaturesSection() {
  const features = [
    { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#6366f1" /></svg>, bg: "#ede9fe", title: "Instant Delivery", sub: "Within minutes" },
    { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 12l2 2 4-4" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>, bg: "#dcfce7", title: "100% Secure", sub: "Safe payments" },
    { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#f59e0b" strokeWidth="2" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" /></svg>, bg: "#fef9c3", title: "Verified Seller", sub: "Trusted by gamers" },
    { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="1" fill="#a855f7" /><rect x="13" y="3" width="8" height="8" rx="1" fill="#a855f7" /><rect x="3" y="13" width="8" height="8" rx="1" fill="#a855f7" /><rect x="13" y="13" width="8" height="8" rx="1" fill="#a855f7" /></svg>, bg: "#f3e8ff", title: "5 Categories", sub: "All pack types" },
  ];
  return (
    <section className="py-6 px-3" style={{ background: "#f5f5f5" }} id="packages">
      <div className="grid grid-cols-2 gap-2 max-w-lg mx-auto">
        {features.map((f, i) => (
          <div key={i} className="rounded-xl p-2.5 flex flex-row items-start gap-2" style={{ background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,0.07)" }}>
            <div className="rounded-lg p-1.5 flex-shrink-0" style={{ background: f.bg }}>{f.icon}</div>
            <div><div className="font-bold text-gray-900 leading-tight" style={{ fontSize: 11 }}>{f.title}</div><div className="text-gray-400 mt-0.5" style={{ fontSize: 9.5 }}>{f.sub}</div></div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Stats ──────────────────────────────────────────────────────────────────
function StatsSection() {
  const stats = [
    { value: "1,248+", label: "Total Orders", color: "#111", icon: null },
    { value: "98,423", label: "Diamonds Sold", color: "#f59e0b", icon: "♦" },
    { value: "833+", label: "Happy Gamers", color: "#111", icon: "★" },
  ];
  return (
    <section className="py-4 px-3" style={{ background: "#f5f5f5" }}>
      <div className="flex flex-col gap-2 max-w-lg mx-auto">
        {stats.map((s, i) => (
          <div key={i} className="rounded-xl p-3.5 text-center" style={{ background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,0.07)" }}>
            <div className="font-extrabold" style={{ fontSize: 26, color: s.color }}>{s.value}</div>
            <div className="text-gray-400 mt-0.5" style={{ fontSize: 11 }}>{s.icon && <span style={{ color: s.color }} className="mr-1">{s.icon}</span>}{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── How It Works ───────────────────────────────────────────────────────────
function HowItWorks() {
  const [, setLocation] = useLocation();
  const steps = [
    { num: "1", title: "Pick a Pack", desc: "Browse 5 categories and select your diamond pack." },
    { num: "2", title: "Verify & Pay", desc: "Enter your MLBB ID, verify your account, then scan our UPI QR to pay." },
    { num: "3", title: "Get Diamonds", desc: "Diamonds are credited instantly to your account." },
  ];
  return (
    <section className="py-8 px-5" style={{ background: "#0a0a0a" }}>
      <div className="max-w-lg mx-auto text-center">
        <div className="inline-block px-3 py-0.5 rounded-full font-bold uppercase tracking-widest mb-2.5" style={{ fontSize: 8, background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>Simple Process</div>
        <h2 className="text-white font-extrabold text-xl mb-1">How It Works</h2>
        <p className="text-gray-400 mb-5" style={{ fontSize: 11 }}>Three simple steps to recharge your account</p>
        <div className="flex flex-col items-center gap-0">
          {steps.map((s, i) => (
            <div key={i} className="flex flex-col items-center w-full">
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-lg" style={{ background: "linear-gradient(135deg,#1e2d4a,#0f1a2e)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)", boxShadow: "0 3px 14px rgba(0,0,0,0.4)" }}>{s.num}</div>
                <div className="text-center"><div className="text-white font-bold text-sm">{s.title}</div><div className="text-gray-400 mt-0.5 max-w-xs" style={{ fontSize: 11 }}>{s.desc}</div></div>
              </div>
              {i < steps.length - 1 && <div className="w-0.5 h-6 my-1.5" style={{ background: "rgba(245,158,11,0.25)" }} />}
            </div>
          ))}
        </div>
        <button onClick={() => setLocation("/packages")} className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full font-bold text-black mt-6" style={{ fontSize: 12, background: "linear-gradient(135deg,#fbbf24,#f59e0b)", boxShadow: "0 0 18px rgba(245,158,11,0.4)", border: "none", cursor: "pointer" }}>
          Start Now <span>→</span>
        </button>
      </div>
    </section>
  );
}

// ── Live Ticker ────────────────────────────────────────────────────────────
function LiveTicker() {
  const purchases = ["Hunter99 bought 514 Diamonds", "Shadow_X bought 1,048 Diamonds", "RajaGaming bought 257 Diamonds", "NightWolf bought 2,000 Diamonds", "StarPlayer bought 514 Diamonds", "GoldRush99 bought 1,048 Diamonds"];
  const doubled = [...purchases, ...purchases];
  return (
    <div className="py-2 overflow-hidden" style={{ background: "#fff", borderTop: "1px solid #eee", borderBottom: "1px solid #eee" }}>
      <div className="flex items-center gap-0">
        <div className="flex-shrink-0 px-2 py-0.5 flex items-center gap-1 font-bold" style={{ color: "#f59e0b", fontSize: 10 }}>⚡ Live Purchases</div>
        <div className="flex overflow-hidden">
          <div className="flex gap-6 whitespace-nowrap" style={{ animation: "scrollTicker 20s linear infinite", willChange: "transform" }}>
            {doubled.map((p, i) => (
              <span key={i} className="text-gray-700 flex-shrink-0" style={{ fontSize: 10 }}>
                <span className="font-bold text-amber-600">{p.split(" bought ")[0]}</span>{" bought "}<span className="font-bold">{p.split(" bought ")[1]}</span>
                <span className="ml-5 text-gray-300">|</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── WhatsApp Section ───────────────────────────────────────────────────────
function WhatsAppSection() {
  return (
    <section className="py-9 px-5 text-center" style={{ background: "#1a5c38" }}>
      <div className="max-w-sm mx-auto flex flex-col items-center gap-3">
        <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg>
        </div>
        <h2 className="text-white font-extrabold text-lg leading-tight">Join Our WhatsApp Store</h2>
        <p className="text-green-100 leading-relaxed" style={{ fontSize: 12 }}>Get exclusive offers, faster support, and be the first to know about new packs and discounts — all on WhatsApp.</p>
        <a href={WHATSAPP_GROUP} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-5 py-2.5 rounded-full font-bold text-white mt-1" style={{ fontSize: 12, background: "#25d366", boxShadow: "0 4px 14px rgba(0,0,0,0.25)", textDecoration: "none" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
          Join Our WhatsApp Group
        </a>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────
function Footer({ onAdminOpen }: { onAdminOpen: () => void }) {
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopyrightTap = () => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (tapCount.current >= 3) {
      tapCount.current = 0;
      onAdminOpen();
      return;
    }
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 2000);
  };

  return (
    <footer className="py-7 px-5 text-center" style={{ background: "#fff", borderTop: "1px solid #eee" }}>
      <div className="flex flex-col items-center gap-2.5 max-w-sm mx-auto">
        <div className="w-10 h-10 rounded-full overflow-hidden" style={{ background: "#000", border: "1.5px solid #f59e0b", boxShadow: "0 0 8px 1.5px rgba(245,158,11,0.4)" }}>
          <img src="/logo.jpg" alt="Sky Official" className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="font-bold text-gray-900 text-sm">Sky Official</div>
          <p className="text-gray-400 mt-0.5 leading-relaxed max-w-xs" style={{ fontSize: 10 }}>The trusted diamond top-up shop for Mobile Legends Bang Bang. Fast, safe, and secure.</p>
        </div>
        <div className="flex items-center gap-4 mt-1">
          {["Packages", "How It Works", "Contact"].map((link) => (
            <a key={link} href="#" className="text-gray-400 hover:text-gray-700 transition-colors" style={{ textDecoration: "none", fontSize: 11 }}>{link}</a>
          ))}
        </div>
        <p
          className="text-gray-300 mt-2 select-none"
          style={{ fontSize: 9.5, cursor: "default" }}
          onClick={handleCopyrightTap}
        >
          © 2026 Sky Official. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

// ── WhatsApp FAB ───────────────────────────────────────────────────────────
function WhatsAppFAB() {
  return (
    <a href={WHATSAPP_NUMBER} target="_blank" rel="noopener noreferrer" className="fixed bottom-5 right-3.5 z-50 w-11 h-11 rounded-full flex items-center justify-center shadow-lg" style={{ background: "#25d366", boxShadow: "0 3px 16px rgba(37,211,102,0.5)", textDecoration: "none" }}>
      <svg width="21" height="21" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
    </a>
  );
}

// Module-level flag — resets on every hard refresh, survives in-page navigation
let introPlayedThisSession = false;

// ── Main Site Page ─────────────────────────────────────────────────────────
function MainSite() {
  const [introDone, setIntroDone] = useState(introPlayedThisSession);
  const [introMounted, setIntroMounted] = useState(!introPlayedThisSession);
  const [showAdmin, setShowAdmin] = useState(false);

  const handleIntroDone = () => {
    introPlayedThisSession = true;
    setIntroDone(true);
    setTimeout(() => setIntroMounted(false), 1000);
  };

  return (
    <>
      {/* Main content always rendered so video starts immediately */}
      <div style={{ pointerEvents: introDone ? "auto" : "none" }}>
        <Navbar />
        <HeroSection animate={introDone} />
        <StatsSection />
        <HowItWorks />
        <LiveTicker />
        <WhatsAppSection />
        <Footer onAdminOpen={() => setShowAdmin(true)} />
        <WhatsAppFAB />
      </div>
      {/* Intro overlays on top and fades out — content plays underneath */}
      {introMounted && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, opacity: introDone ? 0 : 1, transition: "opacity 0.9s ease", pointerEvents: introDone ? "none" : "auto" }}>
          <LoadingScreen onDone={handleIntroDone} />
        </div>
      )}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </>
  );
}

// ── Packages Page ──────────────────────────────────────────────────────────
function PackagesPage() {
  const [, setLocation] = useLocation();
  const { getToken, isSignedIn } = useAuth();
  const [mlbbVerified, setMlbbVerified] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setMlbbVerified(false);
      return;
    }
    getToken().then(token => {
      fetch(`${API}/verify/mlbb`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      })
        .then(r => r.json())
        .then(data => setMlbbVerified(!!(data.ok && data.account)))
        .catch(() => setMlbbVerified(false));
    });
  }, [isSignedIn]);

  function handleBuy(pkg: SelectedPackage) {
    setSelectedPackage(pkg);
    setLocation("/pay");
  }

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh" }}>
      <Navbar />
      {mlbbVerified === false && (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "72px 16px 0" }}>
          <div
            style={{ background: "linear-gradient(135deg,#111a00,#0f1500)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 18, padding: "16px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14, boxShadow: "0 0 24px rgba(34,197,94,0.06)" }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M9 12l2 2 4-4" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="10" stroke="#22c55e" strokeWidth="1.8"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>Verify your MLBB account first</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 3 }}>Confirm your IGN so diamonds go to the right account.</div>
            </div>
            <button
              onClick={() => setLocation("/verify")}
              style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.35)", borderRadius: 10, padding: "8px 14px", color: "#22c55e", fontWeight: 700, fontSize: 12, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" }}
            >
              Verify →
            </button>
          </div>
        </div>
      )}
      {mlbbVerified === true && <div style={{ paddingTop: 72 }} />}
      <PackagesSection onPackageSelect={(_id) => {}} onBack={() => setLocation("/")} onBuy={handleBuy} />
    </div>
  );
}

// ── Auth Page Shell ─────────────────────────────────────────────────────────
function AuthPageShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  const [, setLocation] = useLocation();

  const diag = (delay: number): React.CSSProperties => ({
    animation: `authFadeIn 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}s both`,
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#07080a" }}>
      <style>{`
        @keyframes authFadeIn {
          from { opacity: 0; transform: translate(-18px, -18px); }
          to   { opacity: 1; transform: translate(0, 0); }
        }
        /* Force Clerk social buttons to have visible outline */
        .cl-socialButtonsBlockButton {
          background: #13151c !important;
          border: 2px solid rgba(255,255,255,0.38) !important;
          border-radius: 10px !important;
          height: 44px !important;
          transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease !important;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05) !important;
        }
        .cl-socialButtonsBlockButton:hover {
          border-color: rgba(245,158,11,0.7) !important;
          background: #1b1d26 !important;
          box-shadow: 0 0 0 1px rgba(245,158,11,0.15), 0 0 12px rgba(245,158,11,0.1) !important;
        }
        .cl-socialButtonsBlockButtonText {
          color: #f3f4f6 !important;
          font-weight: 500 !important;
          font-size: 0.875rem !important;
        }
        .cl-socialButtonsBlockButtonIconBox img,
        .cl-socialButtonsBlockButtonIconBox svg {
          width: 18px !important;
          height: 18px !important;
        }
      `}</style>

      {/* Subtle background grain / gradient */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: "linear-gradient(135deg, rgba(245,158,11,0.05) 0%, transparent 50%, rgba(245,158,11,0.03) 100%)",
      }} />
      <div className="fixed top-0 left-0 w-96 h-96 pointer-events-none" style={{
        background: "radial-gradient(ellipse at top left, rgba(245,158,11,0.08) 0%, transparent 70%)",
      }} />

      {/* Back link */}
      <div className="relative z-10 px-6 pt-6" style={diag(0)}>
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-1.5 text-sm font-medium"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#6b7280" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back to store
        </button>
      </div>

      {/* Centered content */}
      <div className="relative z-10 flex flex-1 flex-col justify-center px-6 py-8">
        <div className="w-full max-w-[380px] mx-auto">

          {/* Logo + wordmark */}
          <div className="flex items-center gap-3 mb-8" style={diag(0.07)}>
            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0" style={{ border: "1.5px solid rgba(245,158,11,0.5)" }}>
              <img src="/logo.jpg" alt="Sky Official" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-white font-bold text-base leading-tight">Sky Official</div>
              <div className="text-xs" style={{ color: "#f59e0b", letterSpacing: "0.12em", fontSize: 9, fontWeight: 600, textTransform: "uppercase" }}>Diamond Top‑Up Store</div>
            </div>
          </div>

          {/* Title */}
          <div style={diag(0.14)}>
            <h1 className="font-bold text-white leading-tight" style={{ fontSize: "clamp(1.5rem,6vw,1.85rem)", letterSpacing: "-0.02em" }}>{title}</h1>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "#6b7280" }}>{subtitle}</p>
          </div>

          {/* Divider */}
          <div className="mt-7 mb-6" style={{ height: 1, background: "linear-gradient(90deg, rgba(245,158,11,0.25) 0%, rgba(255,255,255,0.05) 100%)", ...diag(0.21) }} />

          {/* Clerk form */}
          <div style={diag(0.28)}>
            {children}
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Sign In Page ───────────────────────────────────────────────────────────
function SignInPage() {
  return (
    <AuthPageShell
      title="Welcome back"
      subtitle="Log in to your Sky Official account."
    >
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={basePath || "/"}
        appearance={clerkAppearance}
      />
    </AuthPageShell>
  );
}

// ── Sign Up Page ───────────────────────────────────────────────────────────
function SignUpPage() {
  return (
    <AuthPageShell
      title="Create an account"
      subtitle="Join Sky Official and start topping up in seconds."
    >
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        fallbackRedirectUrl={basePath || "/"}
        appearance={clerkAppearance}
      />
    </AuthPageShell>
  );
}

// ── Router ─────────────────────────────────────────────────────────────────
function AppRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
      localization={{
        socialButtonsBlockButton: "Continue with {{provider}}",
        signIn: {
          start: {
            title: "Sign in to Sky Official",
            subtitle: "Welcome back! Please sign in to continue.",
          },
        },
        signUp: {
          start: {
            title: "Join Sky Official",
            subtitle: "Create your account to get started.",
          },
        },
      }}
    >
      <Switch>
        <Route path="/" component={MainSite} />
        <Route path="/packages" component={PackagesPage} />
        <Route path="/pay" component={PaymentPage} />
        <Route path="/verify" component={MLBBVerifyPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route path="/orders" component={OrderHistoryPage} />
        <Route component={MainSite} />
      </Switch>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <AppRoutes />
    </WouterRouter>
  );
}
