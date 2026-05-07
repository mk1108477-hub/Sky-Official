import React, { useEffect, useState, useRef, useCallback } from "react";
import AdminPanel from "./components/AdminPanel";
import PackagesSection from "./components/PackagesSection";
import {
  ClerkProvider,
  SignIn,
  SignUp,
  Show,
  useUser,
  useClerk,
} from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { dark } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";

const WHATSAPP_GROUP = "https://chat.whatsapp.com/DB3FwXqNUi649KT18VjVu9";
const WHATSAPP_NUMBER = "https://wa.me/919362003788";

const NAV_SUBTITLES = [
  "⚡ Instant Delivery",
  "💰 Affordable Prices",
  "💬 24/7 Chat Support",
  "✦ Shop Smart, Play Hard",
];

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  baseTheme: dark,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.jpg`,
  },
  variables: {
    colorPrimary: "#f59e0b",
    colorForeground: "#ffffff",
    colorMutedForeground: "#9ca3af",
    colorDanger: "#ef4444",
    colorBackground: "#111111",
    colorInput: "#1f1f1f",
    colorInputForeground: "#ffffff",
    colorNeutral: "#374151",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "rounded-2xl w-[400px] max-w-full overflow-hidden shadow-2xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-white font-bold",
    headerSubtitle: "text-gray-400",
    socialButtonsBlockButtonText: "text-white font-medium",
    formFieldLabel: "text-gray-300 font-medium",
    footerActionLink: "text-amber-400 font-semibold hover:text-amber-300",
    footerActionText: "text-gray-400",
    dividerText: "text-gray-500",
    identityPreviewEditButton: "text-amber-400",
    formFieldSuccessText: "text-green-400",
    alertText: "text-red-300",
    logoBox: "flex justify-center mb-2",
    logoImage: "w-12 h-12 rounded-full object-cover",
    socialButtonsBlockButton: "border border-gray-700 hover:border-amber-500 transition-colors",
    formButtonPrimary: "bg-amber-500 hover:bg-amber-400 text-black font-bold transition-colors",
    formFieldInput: "bg-gray-800 border-gray-700 text-white focus:border-amber-500 focus:ring-amber-500",
    footerAction: "border-t border-gray-800",
    dividerLine: "bg-gray-700",
    alert: "border border-red-800 bg-red-900/20",
    otpCodeFieldInput: "bg-gray-800 border-gray-700 text-white",
    formFieldRow: "gap-2",
    main: "gap-4",
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
      <div className="relative flex flex-col items-center gap-5 z-10">
        <AnimatedDiamonds size={80} />
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-white font-bold uppercase" style={{ fontSize: 28, letterSpacing: "0.3em" }}>SKY OFFICIAL</h1>
          <p className="uppercase text-xs font-bold" style={{ letterSpacing: "0.38em", background: "linear-gradient(90deg, transparent 0%, #f59e0b 20%, #fcd34d 50%, #f59e0b 80%, transparent 100%)", backgroundSize: "200% 100%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "shimmerLR 2.8s ease-in-out infinite" }}>
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
    <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-2.5" style={{ background: "rgba(10,10,10,0.93)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0" style={{ background: "#000", border: "2px solid #f59e0b", boxShadow: "0 0 10px 2px rgba(245,158,11,0.55)" }}>
          <img src="/logo.jpg" alt="Sky Official" className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-tight">Sky Official</div>
          <div className="text-xs leading-tight" style={{ color: "#f59e0b", opacity: visible ? 1 : 0, transition: "opacity 0.4s ease" }}>{NAV_SUBTITLES[subtitleIdx]}</div>
        </div>
      </div>
      {isLoaded && (
        user ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 flex-shrink-0" style={{ borderColor: "#f59e0b" }}>
              <img src={user.imageUrl} alt={user.firstName ?? "User"} className="w-full h-full object-cover" />
            </div>
            <button
              onClick={() => signOut(() => setLocation("/"))}
              className="px-3 py-1.5 rounded-full text-xs font-bold text-black"
              style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)" }}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={() => setLocation("/sign-in")}
            className="px-5 py-2 rounded-full font-bold text-sm text-black"
            style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)", boxShadow: "0 2px 12px rgba(245,158,11,0.4)" }}
          >
            Sign In
          </button>
        )
      )}
    </nav>
  );
}

// ── Hero ───────────────────────────────────────────────────────────────────
function HeroSection({ animate = false }: { animate?: boolean }) {
  const featureTexts = ["Instant delivery", "Affordable prices", "P2P chat support", "Safe and secure transaction"];
  const [activeFeature, setActiveFeature] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loopFading, setLoopFading] = useState(false);
  const nearEndRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => setActiveFeature((i) => (i + 1) % featureTexts.length), 2200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    const tryPlay = () => video.play().catch(() => setTimeout(tryPlay, 300));
    tryPlay();

    const onTimeUpdate = () => {
      if (!video.duration) return;
      const remaining = video.duration - video.currentTime;
      // Start fading to black 0.6s before end
      if (remaining <= 0.6 && !nearEndRef.current) {
        nearEndRef.current = true;
        setLoopFading(true);
      }
      // Detect restart: currentTime jumped back to near 0
      if (video.currentTime < 0.25 && nearEndRef.current) {
        nearEndRef.current = false;
        // Brief pause at black, then fade back in
        setTimeout(() => setLoopFading(false), 250);
      }
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, []);

  useEffect(() => {
    if (!animate) return;
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.play().catch(() => {});
  }, [animate]);

  const diag = (delay: number): React.CSSProperties =>
    animate
      ? { animation: `fadeInDiag 0.75s cubic-bezier(0.25,0.46,0.45,0.94) ${delay}s both` }
      : { opacity: 0 };

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-16" style={{ background: "#0d0d0d" }}>
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.25, zIndex: 0 }}
      >
        <source src="/hero.mp4" type="video/mp4" />
      </video>
      {/* Black crossfade overlay at loop point */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "#000", zIndex: 1, opacity: loopFading ? 1 : 0, transition: loopFading ? "opacity 0.5s ease" : "opacity 0.5s ease 0.1s" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 55% at 50% 55%, rgba(100,60,0,0.45) 0%, transparent 70%)", zIndex: 2 }} />
      <div className="relative z-10 flex flex-col gap-5 px-6 pt-10 pb-16 max-w-lg mx-auto w-full">
        <div className="flex justify-center" style={diag(0)}>
          <span className="px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest" style={{ border: "1.5px solid rgba(245,158,11,0.55)", color: "#f59e0b", background: "rgba(245,158,11,0.07)", letterSpacing: "0.18em" }}>MLBB Diamond Top Up</span>
        </div>
        <div className="text-center">
          <h1 className="font-extrabold leading-tight" style={{ fontSize: "clamp(2rem,9vw,2.8rem)" }}>
            <span className="text-white block" style={diag(0.13)}>Recharge Fast.</span>
            <span className="block" style={{ color: "#f59e0b", ...diag(0.26) }}>Dominate the</span>
            <span className="block" style={{ color: "#f59e0b", ...diag(0.39) }}>Game.</span>
          </h1>
        </div>
        <p className="text-center text-gray-400 text-sm leading-relaxed px-2" style={{ maxWidth: 320, margin: "0 auto", ...diag(0.52) }}>
          Instant delivery, secure payments, and the best prices for Mobile Legends Bang Bang. Shop smart, play hard.
        </p>
        <div className="relative h-6 flex items-center justify-center overflow-hidden" style={diag(0.65)}>
          {featureTexts.map((text, i) => (
            <span key={i} className="absolute text-xs font-semibold text-center" style={{ color: "#fbbf24", opacity: activeFeature === i ? 1 : 0, transform: activeFeature === i ? "translateY(0)" : "translateY(8px)", transition: "opacity 0.55s ease, transform 0.55s ease", pointerEvents: "none", letterSpacing: "0.05em" }}>✦ {text}</span>
          ))}
        </div>
        <div className="flex justify-center mt-2" style={diag(0.78)}>
          <a href="#packages" className="inline-flex items-center gap-2 px-10 py-4 rounded-full font-bold text-base text-black" style={{ background: "linear-gradient(135deg,#fcd34d,#f59e0b)", boxShadow: "0 0 32px rgba(245,158,11,0.55), 0 4px 20px rgba(0,0,0,0.5)", textDecoration: "none", fontSize: 17 }}>
            View Packages <span style={{ fontSize: 18 }}>→</span>
          </a>
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
    { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#6366f1" /></svg>, bg: "#ede9fe", title: "Instant Delivery", sub: "Within minutes" },
    { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 12l2 2 4-4" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>, bg: "#dcfce7", title: "100% Secure", sub: "Safe payments" },
    { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#f59e0b" strokeWidth="2" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" /></svg>, bg: "#fef9c3", title: "Verified Seller", sub: "Trusted by gamers" },
    { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="1" fill="#a855f7" /><rect x="13" y="3" width="8" height="8" rx="1" fill="#a855f7" /><rect x="3" y="13" width="8" height="8" rx="1" fill="#a855f7" /><rect x="13" y="13" width="8" height="8" rx="1" fill="#a855f7" /></svg>, bg: "#f3e8ff", title: "5 Categories", sub: "All pack types" },
  ];
  return (
    <section className="py-10 px-4" style={{ background: "#f5f5f5" }} id="packages">
      <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
        {features.map((f, i) => (
          <div key={i} className="rounded-2xl p-4 flex flex-row items-start gap-3" style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <div className="rounded-xl p-2 flex-shrink-0" style={{ background: f.bg }}>{f.icon}</div>
            <div><div className="font-bold text-sm text-gray-900 leading-tight">{f.title}</div><div className="text-xs text-gray-400 mt-0.5">{f.sub}</div></div>
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
    <section className="py-6 px-4" style={{ background: "#f5f5f5" }}>
      <div className="flex flex-col gap-3 max-w-lg mx-auto">
        {stats.map((s, i) => (
          <div key={i} className="rounded-2xl p-5 text-center" style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <div className="font-extrabold text-4xl" style={{ color: s.color }}>{s.value}</div>
            <div className="text-sm text-gray-400 mt-1">{s.icon && <span style={{ color: s.color }} className="mr-1">{s.icon}</span>}{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── How It Works ───────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { num: "1", title: "Pick a Pack", desc: "Browse 5 categories and select your diamond pack." },
    { num: "2", title: "Verify & Pay", desc: "Enter your MLBB ID, verify your account, then scan our UPI QR to pay." },
    { num: "3", title: "Get Diamonds", desc: "Diamonds are credited instantly to your account." },
  ];
  return (
    <section className="py-12 px-6" style={{ background: "#0a0a0a" }}>
      <div className="max-w-lg mx-auto text-center">
        <div className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4" style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>Simple Process</div>
        <h2 className="text-white font-extrabold text-3xl mb-2">How It Works</h2>
        <p className="text-gray-400 text-sm mb-8">Three simple steps to recharge your account</p>
        <div className="flex flex-col items-center gap-0">
          {steps.map((s, i) => (
            <div key={i} className="flex flex-col items-center w-full">
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-2xl" style={{ background: "linear-gradient(135deg,#1e2d4a,#0f1a2e)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>{s.num}</div>
                <div className="text-center"><div className="text-white font-bold text-base">{s.title}</div><div className="text-gray-400 text-sm mt-1 max-w-xs">{s.desc}</div></div>
              </div>
              {i < steps.length - 1 && <div className="w-0.5 h-8 my-2" style={{ background: "rgba(245,158,11,0.25)" }} />}
            </div>
          ))}
        </div>
        <a href={WHATSAPP_GROUP} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-base text-black mt-10" style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)", boxShadow: "0 0 30px rgba(245,158,11,0.5)", textDecoration: "none" }}>
          Start Now <span>→</span>
        </a>
      </div>
    </section>
  );
}

// ── Live Ticker ────────────────────────────────────────────────────────────
function LiveTicker() {
  const purchases = ["Hunter99 bought 514 Diamonds", "Shadow_X bought 1,048 Diamonds", "RajaGaming bought 257 Diamonds", "NightWolf bought 2,000 Diamonds", "StarPlayer bought 514 Diamonds", "GoldRush99 bought 1,048 Diamonds"];
  const doubled = [...purchases, ...purchases];
  return (
    <div className="py-3 overflow-hidden" style={{ background: "#fff", borderTop: "1px solid #eee", borderBottom: "1px solid #eee" }}>
      <div className="flex items-center gap-0">
        <div className="flex-shrink-0 px-3 py-1 flex items-center gap-1 text-xs font-bold" style={{ color: "#f59e0b" }}>⚡ Live Purchases</div>
        <div className="flex overflow-hidden">
          <div className="flex gap-8 whitespace-nowrap" style={{ animation: "scrollTicker 20s linear infinite", willChange: "transform" }}>
            {doubled.map((p, i) => (
              <span key={i} className="text-xs text-gray-700 flex-shrink-0">
                <span className="font-bold text-amber-600">{p.split(" bought ")[0]}</span>{" bought "}<span className="font-bold">{p.split(" bought ")[1]}</span>
                <span className="ml-6 text-gray-300">|</span>
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
    <section className="py-14 px-6 text-center" style={{ background: "#1a5c38" }}>
      <div className="max-w-sm mx-auto flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg>
        </div>
        <h2 className="text-white font-extrabold text-2xl leading-tight">Join Our WhatsApp Store</h2>
        <p className="text-green-100 text-sm leading-relaxed">Get exclusive offers, faster support, and be the first to know about new packs and discounts — all on WhatsApp.</p>
        <a href={WHATSAPP_GROUP} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm text-white mt-2" style={{ background: "#25d366", boxShadow: "0 4px 16px rgba(0,0,0,0.25)", textDecoration: "none" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
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
    if (tapCount.current >= 5) {
      tapCount.current = 0;
      onAdminOpen();
      return;
    }
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 2000);
  };

  return (
    <footer className="py-10 px-6 text-center" style={{ background: "#fff", borderTop: "1px solid #eee" }}>
      <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
        <div className="w-14 h-14 rounded-full overflow-hidden" style={{ background: "#000", border: "2px solid #f59e0b", boxShadow: "0 0 10px 2px rgba(245,158,11,0.45)" }}>
          <img src="/logo.jpg" alt="Sky Official" className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="font-bold text-gray-900 text-base">Sky Official</div>
          <p className="text-gray-400 text-xs mt-1 leading-relaxed max-w-xs">The trusted diamond top-up shop for Mobile Legends Bang Bang. Fast, safe, and secure.</p>
        </div>
        <div className="flex items-center gap-6 mt-2">
          {["Packages", "How It Works", "Contact"].map((link) => (
            <a key={link} href="#" className="text-gray-400 text-sm hover:text-gray-700 transition-colors" style={{ textDecoration: "none" }}>{link}</a>
          ))}
        </div>
        <p
          className="text-gray-300 text-xs mt-3 select-none"
          style={{ cursor: "default" }}
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
    <a href={WHATSAPP_NUMBER} target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-4 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg" style={{ background: "#25d366", boxShadow: "0 4px 20px rgba(37,211,102,0.5)", textDecoration: "none" }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
    </a>
  );
}

// ── Main Site Page ─────────────────────────────────────────────────────────
function MainSite() {
  const [introDone, setIntroDone] = useState(false);
  const [introMounted, setIntroMounted] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);

  const handleIntroDone = () => {
    setIntroDone(true);
    setTimeout(() => setIntroMounted(false), 1000);
  };

  return (
    <>
      {/* Main content always rendered so video starts immediately */}
      <div style={{ pointerEvents: introDone ? "auto" : "none" }}>
        <Navbar />
        <HeroSection animate={introDone} />
        <PackagesSection onPackageSelect={(_id) => {}} />
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

// ── Sign In Page ───────────────────────────────────────────────────────────
function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: "#0a0a0a", backgroundImage: "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(100,60,0,0.3) 0%, transparent 70%)" }}>
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={basePath || "/"}
        appearance={clerkAppearance}
      />
    </div>
  );
}

// ── Sign Up Page ───────────────────────────────────────────────────────────
function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: "#0a0a0a", backgroundImage: "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(100,60,0,0.3) 0%, transparent 70%)" }}>
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        fallbackRedirectUrl={basePath || "/"}
        appearance={clerkAppearance}
      />
    </div>
  );
}

// ── Router ─────────────────────────────────────────────────────────────────
function AppRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey!}
      proxyUrl={clerkProxyUrl}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <Switch>
        <Route path="/" component={MainSite} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
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
