import { useEffect, useState, useRef } from "react";

const WHATSAPP_GROUP = "https://chat.whatsapp.com/DB3FwXqNUi649KT18VjVu9";
const WHATSAPP_NUMBER = "https://wa.me/919362003788";

const FEATURE_TEXTS = [
  "Instant delivery",
  "Affordable prices",
  "P2P chat support",
  "Safe and secure transaction",
];

const NAV_SUBTITLES = [
  "⚡ Instant Delivery",
  "💰 Affordable Prices",
  "💬 24/7 Chat Support",
  "✦ Shop Smart, Play Hard",
];

function DiamondLogo({ size = 60 }: { size?: number }) {
  const s = size * 0.34;
  const gap = size * 0.38;
  return (
    <div className="flex items-center justify-center" style={{ gap: size * 0.08 }}>
      <div
        style={{
          width: s,
          height: s,
          background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          transform: "rotate(45deg)",
          borderRadius: 3,
          boxShadow: "0 0 10px 3px rgba(245,158,11,0.45)",
          flexShrink: 0,
        }}
      />
      <div
        style={{
          width: s * 1.22,
          height: s * 1.22,
          background: "linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)",
          transform: "rotate(45deg)",
          borderRadius: 4,
          boxShadow: "0 0 18px 6px rgba(245,158,11,0.65)",
          flexShrink: 0,
        }}
      />
      <div
        style={{
          width: s,
          height: s,
          background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          transform: "rotate(45deg)",
          borderRadius: 3,
          boxShadow: "0 0 10px 3px rgba(245,158,11,0.45)",
          flexShrink: 0,
        }}
      />
    </div>
  );
}

function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");
  const [textIndex, setTextIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 600);
    const t2 = setTimeout(() => setPhase("out"), 4000);
    const t3 = setTimeout(() => onDone(), 5200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((i) => (i + 1) % FEATURE_TEXTS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "#0a0a0a",
        transition: "opacity 1.2s ease",
        opacity: phase === "out" ? 0 : 1,
        pointerEvents: phase === "out" ? "none" : "auto",
      }}
    >
      {/* Video background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.85 }}
      >
        <source src="/intro.mp4" type="video/mp4" />
      </video>
      {/* Dark overlay so text stays readable */}
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.35)" }} />

      <div className="relative flex flex-col items-center gap-6 z-10">
        <div
          className="animate-diamond-pulse"
          style={{
            filter: "drop-shadow(0 0 28px rgba(245,158,11,0.8))",
            transition: "opacity 0.9s ease",
            opacity: phase === "in" ? 0 : 1,
          }}
        >
          <DiamondLogo size={80} />
        </div>
        <div
          style={{
            transition: "opacity 0.9s ease 0.3s, transform 0.9s ease 0.3s",
            opacity: phase === "in" ? 0 : 1,
            transform: phase === "in" ? "translateY(18px)" : "translateY(0)",
          }}
          className="flex flex-col items-center gap-2"
        >
          <h1
            className="text-white font-bold uppercase"
            style={{ fontSize: 28, letterSpacing: "0.3em" }}
          >
            SKY OFFICIAL
          </h1>
          <p
            className="uppercase text-xs font-semibold"
            style={{ color: "#f59e0b", letterSpacing: "0.35em" }}
          >
            INSTANT TOP UP
          </p>
          {/* Looping feature text */}
          <div className="h-6 mt-2 flex items-center justify-center overflow-hidden" style={{ minWidth: 260 }}>
            <span
              key={textIndex}
              className="text-sm text-gray-200 text-center"
              style={{
                animation: "textFadeLoop 1.8s ease forwards",
                display: "block",
              }}
            >
              {FEATURE_TEXTS[textIndex]}
            </span>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes textFadeLoop {
          0% { opacity: 0; transform: translateY(8px); }
          20% { opacity: 1; transform: translateY(0); }
          75% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}

function Navbar() {
  const [subtitleIdx, setSubtitleIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setSubtitleIdx((i) => (i + 1) % NAV_SUBTITLES.length);
        setVisible(true);
      }, 400);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3"
      style={{ background: "rgba(10,10,10,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-amber-500 flex items-center justify-center" style={{ background: "#111" }}>
          <span className="text-white font-bold text-lg">⚡</span>
        </div>
        <div>
          <div className="text-white font-bold text-base leading-tight">Sky Official</div>
          <div
            className="text-xs leading-tight transition-opacity duration-400"
            style={{ color: "#f59e0b", opacity: visible ? 1 : 0, transition: "opacity 0.4s ease" }}
          >
            {NAV_SUBTITLES[subtitleIdx]}
          </div>
        </div>
      </div>
      <a
        href={WHATSAPP_GROUP}
        target="_blank"
        rel="noopener noreferrer"
        className="px-5 py-2 rounded-full font-bold text-sm text-black"
        style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)", boxShadow: "0 2px 12px rgba(245,158,11,0.4)" }}
      >
        Sign In
      </a>
    </nav>
  );
}

function HeroSection() {
  const features = [
    { icon: "⚡", text: "Instant delivery" },
    { icon: "💰", text: "Affordable prices" },
    { icon: "💬", text: "P2P chat support" },
    { icon: "🔒", text: "Safe and secure transaction" },
  ];
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((i) => (i + 1) % features.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20"
      style={{ background: "#0a0a0a" }}
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `radial-gradient(ellipse 80% 60% at 50% 50%, rgba(120,40,10,0.5) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 20% 30%, rgba(80,20,5,0.35) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 70%, rgba(100,30,5,0.3) 0%, transparent 60%)`,
          animation: "smokeMove 14s ease-in-out infinite",
        }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center max-w-lg mx-auto">
        <div className="animate-diamond-pulse" style={{ filter: "drop-shadow(0 0 30px rgba(245,158,11,0.7))" }}>
          <DiamondLogo size={90} />
        </div>

        <div className="flex flex-col items-center gap-1">
          <h1 className="text-white font-extrabold tracking-widest uppercase" style={{ fontSize: 30, letterSpacing: "0.28em", fontFamily: "inherit" }}>
            SKY OFFICIAL
          </h1>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#f59e0b", letterSpacing: "0.35em" }}>
            INSTANT TOP UP
          </p>

          {/* Looping feature animation */}
          <div className="mt-3 h-7 flex items-center justify-center overflow-hidden" style={{ minWidth: 280 }}>
            {features.map((f, i) => (
              <span
                key={i}
                className="absolute text-sm font-medium text-gray-300"
                style={{
                  opacity: activeFeature === i ? 1 : 0,
                  transform: activeFeature === i ? "translateY(0)" : "translateY(10px)",
                  transition: "opacity 0.6s ease, transform 0.6s ease",
                  pointerEvents: "none",
                }}
              >
                {f.icon} {f.text}
              </span>
            ))}
          </div>
        </div>

        <p className="text-gray-300 font-semibold text-lg mt-2" style={{ textShadow: "0 0 20px rgba(0,0,0,0.8)" }}>
          Shop smart, play hard.
        </p>

        <a
          href="#packages"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-base text-black cursor-pointer"
          style={{
            background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
            boxShadow: "0 0 30px rgba(245,158,11,0.5), 0 4px 20px rgba(0,0,0,0.4)",
            textDecoration: "none",
          }}
        >
          View Packages <span>→</span>
        </a>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#6366f1" stroke="#6366f1" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      bg: "#ede9fe",
      title: "Instant Delivery",
      sub: "Within minutes",
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M9 12l2 2 4-4" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      bg: "#dcfce7",
      title: "100% Secure",
      sub: "Safe payments",
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke="#f59e0b" strokeWidth="2" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      bg: "#fef9c3",
      title: "Verified Seller",
      sub: "Trusted by gamers",
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="8" height="8" rx="1" fill="#a855f7" />
          <rect x="13" y="3" width="8" height="8" rx="1" fill="#a855f7" />
          <rect x="3" y="13" width="8" height="8" rx="1" fill="#a855f7" />
          <rect x="13" y="13" width="8" height="8" rx="1" fill="#a855f7" />
        </svg>
      ),
      bg: "#f3e8ff",
      title: "5 Categories",
      sub: "All pack types",
    },
  ];

  return (
    <section className="py-10 px-4" style={{ background: "#f5f5f5" }} id="packages">
      <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
        {features.map((f, i) => (
          <div
            key={i}
            className="rounded-2xl p-4 flex flex-row items-start gap-3"
            style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}
          >
            <div className="rounded-xl p-2 flex-shrink-0" style={{ background: f.bg }}>
              {f.icon}
            </div>
            <div>
              <div className="font-bold text-sm text-gray-900 leading-tight">{f.title}</div>
              <div className="text-xs text-gray-400 mt-0.5">{f.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

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
          <div
            key={i}
            className="rounded-2xl p-5 text-center"
            style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}
          >
            <div className="font-extrabold text-4xl" style={{ color: s.color, fontVariantNumeric: "tabular-nums" }}>
              {s.value}
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {s.icon && <span style={{ color: s.color }} className="mr-1">{s.icon}</span>}
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      num: "1",
      title: "Pick a Pack",
      desc: "Browse 5 categories and select your diamond pack.",
    },
    {
      num: "2",
      title: "Verify & Pay",
      desc: "Enter your MLBB ID, verify your account, then scan our UPI QR to pay.",
    },
    {
      num: "3",
      title: "Get Diamonds",
      desc: "Diamonds are credited instantly to your account.",
    },
  ];

  return (
    <section className="py-12 px-6" style={{ background: "#0a0a0a" }}>
      <div className="max-w-lg mx-auto text-center">
        <div
          className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
          style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}
        >
          Simple Process
        </div>
        <h2 className="text-white font-extrabold text-3xl mb-2">How It Works</h2>
        <p className="text-gray-400 text-sm mb-8">Three simple steps to recharge your account</p>

        <div className="flex flex-col items-center gap-0">
          {steps.map((s, i) => (
            <div key={i} className="flex flex-col items-center w-full">
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-2xl"
                  style={{
                    background: "linear-gradient(135deg, #1e2d4a, #0f1a2e)",
                    color: "#f59e0b",
                    border: "1px solid rgba(245,158,11,0.25)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                  }}
                >
                  {s.num}
                </div>
                <div className="text-center">
                  <div className="text-white font-bold text-base">{s.title}</div>
                  <div className="text-gray-400 text-sm mt-1 max-w-xs">{s.desc}</div>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className="w-0.5 h-8 my-2" style={{ background: "rgba(245,158,11,0.25)" }} />
              )}
            </div>
          ))}
        </div>

        <a
          href={WHATSAPP_GROUP}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-base text-black mt-10"
          style={{
            background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
            boxShadow: "0 0 30px rgba(245,158,11,0.5)",
            textDecoration: "none",
          }}
        >
          Start Now <span>→</span>
        </a>
      </div>
    </section>
  );
}

function LiveTicker() {
  const purchases = [
    "Hunter99 bought 514 Diamonds",
    "Shadow_X bought 1,048 Diamonds",
    "RajaGaming bought 257 Diamonds",
    "NightWolf bought 2,000 Diamonds",
    "StarPlayer bought 514 Diamonds",
    "GoldRush99 bought 1,048 Diamonds",
  ];

  const doubled = [...purchases, ...purchases];

  return (
    <div
      className="py-3 overflow-hidden"
      style={{ background: "#fff", borderTop: "1px solid #eee", borderBottom: "1px solid #eee" }}
    >
      <div className="flex items-center gap-0">
        <div className="flex-shrink-0 px-3 py-1 flex items-center gap-1 text-xs font-bold" style={{ color: "#f59e0b" }}>
          ⚡ Live Purchases
        </div>
        <div className="flex overflow-hidden">
          <div className="flex gap-8 animate-ticker whitespace-nowrap" style={{ willChange: "transform" }}>
            {doubled.map((p, i) => (
              <span key={i} className="text-xs text-gray-700 flex-shrink-0">
                <span className="font-bold text-amber-600">{p.split(" bought ")[0]}</span>
                {" bought "}
                <span className="font-bold">{p.split(" bought ")[1]}</span>
                <span className="ml-6 text-gray-300">|</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function WhatsAppSection() {
  return (
    <section className="py-14 px-6 text-center" style={{ background: "#1a5c38" }}>
      <div className="max-w-sm mx-auto flex flex-col items-center gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
        </div>
        <h2 className="text-white font-extrabold text-2xl leading-tight">Join Our WhatsApp Store</h2>
        <p className="text-green-100 text-sm leading-relaxed">
          Get exclusive offers, faster support, and be the first to know about new packs and discounts — all on WhatsApp.
        </p>
        <a
          href={WHATSAPP_GROUP}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm text-white mt-2"
          style={{ background: "#25d366", boxShadow: "0 4px 16px rgba(0,0,0,0.25)", textDecoration: "none" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Join Our WhatsApp Group
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-10 px-6 text-center" style={{ background: "#fff", borderTop: "1px solid #eee" }}>
      <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
        <div className="w-14 h-14 rounded-full border-2 border-gray-200 flex items-center justify-center overflow-hidden" style={{ background: "#111" }}>
          <span className="text-white font-bold text-xl">⚡</span>
        </div>
        <div>
          <div className="font-bold text-gray-900 text-base">Sky Official</div>
          <p className="text-gray-400 text-xs mt-1 leading-relaxed max-w-xs">
            The trusted diamond top-up shop for Mobile Legends Bang Bang. Fast, safe, and secure.
          </p>
        </div>
        <div className="flex items-center gap-6 mt-2">
          {["Packages", "How It Works", "Contact"].map((link) => (
            <a
              key={link}
              href="#"
              className="text-gray-400 text-sm hover:text-gray-700 transition-colors"
              style={{ textDecoration: "none" }}
            >
              {link}
            </a>
          ))}
        </div>
        <p className="text-gray-300 text-xs mt-3">© 2026 Sky Official. All rights reserved.</p>
      </div>
    </footer>
  );
}

function WhatsAppFAB() {
  return (
    <a
      href={WHATSAPP_NUMBER}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-4 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
      style={{
        background: "#25d366",
        boxShadow: "0 4px 20px rgba(37,211,102,0.5)",
        textDecoration: "none",
      }}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    </a>
  );
}

export default function App() {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && <LoadingScreen onDone={() => setLoaded(true)} />}
      <div
        style={{
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.8s ease 0.2s",
          pointerEvents: loaded ? "auto" : "none",
        }}
      >
        <Navbar />
        <HeroSection />
        <FeaturesSection />
        <StatsSection />
        <HowItWorks />
        <LiveTicker />
        <WhatsAppSection />
        <Footer />
        <WhatsAppFAB />
      </div>
      <style>{`
        @keyframes smokeMove {
          0% { transform: scale(1) translateX(0) translateY(0); }
          25% { transform: scale(1.05) translateX(-2%) translateY(1%); }
          50% { transform: scale(1.1) translateX(2%) translateY(-1%); }
          75% { transform: scale(1.05) translateX(-1%) translateY(2%); }
          100% { transform: scale(1) translateX(0) translateY(0); }
        }
      `}</style>
    </>
  );
}
