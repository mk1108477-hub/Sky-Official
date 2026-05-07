import React from "react";

type CSP = React.CSSProperties;
const cv = (p: Record<string, string>): CSP => p as unknown as CSP;

// ── Keyframes injected once ──────────────────────────────────────────────────
const KEYFRAMES = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');
@keyframes pkg-backdropPulse { 0%,100%{opacity:.6} 50%{opacity:1} }
@keyframes pkg-hexSpin { from{transform:translate(-50%,-54%) rotate(0deg)} to{transform:translate(-50%,-54%) rotate(360deg)} }
@keyframes pkg-floatBob { 0%,100%{transform:translateX(-50%) translateY(0px)} 50%{transform:translateX(-50%) translateY(-16px)} }
@keyframes pkg-lidOpen { 0%,100%{transform:rotateX(0deg)} 50%{transform:rotateX(-22deg)} }
@keyframes pkg-lidShine { 0%,100%{opacity:.4} 50%{opacity:1} }
@keyframes pkg-poolPulse { 0%,100%{opacity:.5;transform:translateX(-50%) scaleX(.85)} 50%{opacity:1;transform:translateX(-50%) scaleX(1)} }
@keyframes pkg-raysAppear { 0%,30%{opacity:0;transform:translateX(-50%) scaleY(.2)} 50%{opacity:.7;transform:translateX(-50%) scaleY(1)} 80%,100%{opacity:0;transform:translateX(-50%) scaleY(.3)} }
@keyframes pkg-burstDiamond {
  0%{opacity:0;transform:translate(0,0) scale(.2) rotate(0deg)}
  15%{opacity:1;transform:translate(calc(var(--bx)*.3),calc(var(--by)*.3)) scale(1) rotate(40deg)}
  60%{opacity:.9;transform:translate(var(--bx),var(--by)) scale(1.05) rotate(var(--br))}
  85%{opacity:.5;transform:translate(calc(var(--bx)*1.15),calc(var(--by)*1.15 + 10px)) scale(.8) rotate(calc(var(--br) + 20deg))}
  100%{opacity:0;transform:translate(calc(var(--bx)*1.3),calc(var(--by)*1.3 + 25px)) scale(.3) rotate(calc(var(--br) + 40deg))}
}
@keyframes pkg-ambFloat {
  0%{opacity:0;transform:translateY(20px) rotate(var(--r0)) scale(.6)}
  20%,80%{opacity:var(--op);transform:translateY(0px) rotate(var(--r1)) scale(1)}
  100%{opacity:0;transform:translateY(-30px) rotate(var(--r2)) scale(.5)}
}
@keyframes pkg-sparkPop { 0%,100%{opacity:0;transform:scale(0) rotate(0deg)} 40%,60%{opacity:1;transform:scale(1) rotate(45deg)} }
@keyframes pkg-platformPulse {
  0%,100%{opacity:.5;filter:drop-shadow(0 0 8px rgba(100,160,255,.3))}
  50%{opacity:.8;filter:drop-shadow(0 0 18px rgba(100,160,255,.6))}
}
@keyframes pkg-bookFloat { 0%,100%{transform:translateX(-50%) translateY(0px)} 50%{transform:translateX(-50%) translateY(-14px)} }
@keyframes pkg-shineSweep { 0%{left:-60%} 40%,100%{left:160%} }
@keyframes pkg-diamondGlow {
  0%,100%{filter:drop-shadow(0 0 10px #60a8ff) drop-shadow(0 0 30px #3070e0) drop-shadow(0 0 60px rgba(50,100,220,.4))}
  50%{filter:drop-shadow(0 0 20px #90ccff) drop-shadow(0 0 50px #5090f0) drop-shadow(0 0 90px rgba(70,130,240,.6))}
}
@keyframes pkg-gemSpark {
  0%{opacity:0;transform:translate(0,0) scale(.5) rotate(var(--r0))}
  20%{opacity:1;transform:translate(var(--tx1),var(--ty1)) scale(1) rotate(var(--r1))}
  50%{opacity:.9;transform:translate(var(--tx2),var(--ty2)) scale(1.1) rotate(var(--r2))}
  80%{opacity:.6;transform:translate(var(--tx3),var(--ty3)) scale(.8) rotate(var(--r3))}
  100%{opacity:0;transform:translate(var(--tx4),var(--ty4)) scale(.3) rotate(var(--r4))}
}
@keyframes pkg-sparkleFade { 0%,100%{opacity:0;transform:scale(0) rotate(0deg)} 30%,70%{opacity:1;transform:scale(1) rotate(45deg)} }
@keyframes pkg-placeholderGlow { 0%,100%{opacity:.5} 50%{opacity:1} }
@keyframes pkg-rankPulse { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.08);opacity:1} }
@keyframes pkg-starlightTwinkle { 0%,100%{opacity:0;transform:scale(0)} 50%{opacity:1;transform:scale(1)} }
`;

// ── Diamond Chest Scene (Small Pack & Normal Pack) ───────────────────────────
function DiamondChestScene({ spineLabel }: { spineLabel: string }) {
  const bd = (dur: string, del: string, bx: string, by: string, br: string, w: number, color: string, facet?: boolean) => (
    <div className="pkg-bd" style={{ position: "absolute", animation: `pkg-burstDiamond ${dur} ease-out ${del} infinite`, opacity: 0, transformOrigin: "center", ...cv({ "--dur": dur, "--del": del, "--bx": bx, "--by": by, "--br": br }) }}>
      <svg width={w} height={w} viewBox="0 0 20 20">
        <defs><linearGradient id={`bd-${del}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: "#d0f4ff" }} /><stop offset="100%" style={{ stopColor: color }} /></linearGradient></defs>
        <polygon points="10,1 18,8 10,19 2,8" fill={`url(#bd-${del})`} />
        {facet && <polygon points="10,1 14,6 10,8 6,6" fill="rgba(255,255,255,0.55)" />}
      </svg>
    </div>
  );

  const amb = (top: string, side: "left" | "right", sideVal: string, dur: string, del: string, op: string, r0: string, r1: string, r2: string, w: number, fill: string) => (
    <div style={{ position: "absolute", top, [side]: sideVal, animation: `pkg-ambFloat ${dur} ease-in-out ${del} infinite`, opacity: 0, ...cv({ "--dur": dur, "--del": del, "--op": op, "--r0": r0, "--r1": r1, "--r2": r2 }) }}>
      <svg width={w} height={w} viewBox="0 0 20 20"><polygon points="10,1 18,8 10,19 2,8" fill={fill} /></svg>
    </div>
  );

  const spark = (top: string, side: "left" | "right", sideVal: string, dur: string, del: string, w: number, fill: string) => (
    <div style={{ position: "absolute", top, [side]: sideVal, animation: `pkg-sparkPop ${dur} ease-in-out ${del} infinite`, opacity: 0, ...cv({ "--dur": dur, "--del": del }) }}>
      <svg width={w} height={w} viewBox="0 0 20 20"><path d="M10,1 L11.5,8.5 L19,10 L11.5,11.5 L10,19 L8.5,11.5 L1,10 L8.5,8.5 Z" fill={fill} /></svg>
    </div>
  );

  return (
    <div style={{ width: 300, height: 480, position: "relative", display: "flex", justifyContent: "center", alignItems: "center", background: "#06080f" }}>
      {/* Backdrop */}
      <div style={{ position: "absolute", inset: -30, background: "radial-gradient(ellipse 60% 50% at 50% 60%, rgba(0,180,220,.1) 0%, transparent 70%), radial-gradient(ellipse 80% 40% at 50% 90%, rgba(245,200,40,.08) 0%, transparent 60%)", zIndex: 0, animation: "pkg-backdropPulse 3s ease-in-out infinite" }} />

      {/* Spinning hex ring */}
      <div style={{ position: "absolute", width: 270, height: 270, top: "50%", left: "50%", transform: "translate(-50%,-54%)", zIndex: 1, animation: "pkg-hexSpin 20s linear infinite" }}>
        <svg viewBox="0 0 270 270" xmlns="http://www.w3.org/2000/svg">
          <defs><linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: "#f5c842", stopOpacity: 0.6 }} /><stop offset="50%" style={{ stopColor: "#00e5ff", stopOpacity: 0.4 }} /><stop offset="100%" style={{ stopColor: "#f5c842", stopOpacity: 0.1 }} /></linearGradient></defs>
          <polygon points="135,8 247,72 247,198 135,262 23,198 23,72" fill="none" stroke="url(#hexGrad)" strokeWidth="1" strokeDasharray="6,8" />
          <polygon points="135,35 222,83 222,187 135,235 48,187 48,83" fill="none" stroke="rgba(0,229,255,0.15)" strokeWidth="1" />
          <circle cx="135" cy="8" r="3" fill="#f5c842" opacity="0.8" />
          <circle cx="247" cy="72" r="3" fill="#f5c842" opacity="0.8" />
          <circle cx="247" cy="198" r="3" fill="#00e5ff" opacity="0.8" />
          <circle cx="135" cy="262" r="3" fill="#f5c842" opacity="0.8" />
          <circle cx="23" cy="198" r="3" fill="#f5c842" opacity="0.8" />
          <circle cx="23" cy="72" r="3" fill="#00e5ff" opacity="0.8" />
        </svg>
      </div>

      {/* Glow pool */}
      <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", width: 200, height: 30, background: "radial-gradient(ellipse, rgba(245,200,40,.35) 0%, transparent 70%)", borderRadius: "50%", zIndex: 2, animation: "pkg-poolPulse 3.2s ease-in-out infinite" }} />

      {/* Float group */}
      <div style={{ position: "absolute", width: 220, height: 300, top: 60, left: "50%", transform: "translateX(-50%)", zIndex: 5, animation: "pkg-floatBob 3.2s ease-in-out infinite" }}>
        {/* Spine label */}
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 32, background: "linear-gradient(180deg,#b8860b 0%,#f5c842 50%,#b8860b 100%)", display: "flex", alignItems: "center", justifyContent: "center", borderLeft: "1px solid rgba(255,240,150,.4)", borderRadius: "0 6px 6px 0", zIndex: 20 }}>
          <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 7, fontWeight: 900, letterSpacing: 3, color: "#06080f", writingMode: "vertical-rl", transform: "rotate(180deg)", textTransform: "uppercase" }}>{spineLabel}</span>
        </div>

        {/* Light rays */}
        <div style={{ position: "absolute", bottom: 103, left: "50%", transform: "translateX(-50%)", width: 160, height: 160, zIndex: 6, animation: "pkg-raysAppear 3.2s ease-in-out infinite", pointerEvents: "none" }}>
          <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
            <defs><radialGradient id="rayGrad" cx="50%" cy="100%" r="100%"><stop offset="0%" style={{ stopColor: "#00e5ff", stopOpacity: 0.6 }} /><stop offset="100%" style={{ stopColor: "#00e5ff", stopOpacity: 0 }} /></radialGradient></defs>
            <polygon points="80,160 40,0 80,20 120,0" fill="url(#rayGrad)" opacity="0.5" />
            <polygon points="80,160 10,30 50,60 80,20" fill="url(#rayGrad)" opacity="0.3" />
            <polygon points="80,160 150,30 110,60 80,20" fill="url(#rayGrad)" opacity="0.3" />
          </svg>
        </div>

        {/* Chest */}
        <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", width: 170, height: 150 }}>
          {/* Lid */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 62, background: "linear-gradient(160deg,#221500 0%,#150e00 60%,#0d0900 100%)", border: "2px solid #b8860b", borderRadius: "60px 60px 4px 4px / 30px 30px 4px 4px", boxShadow: "0 -4px 20px rgba(245,200,40,.15), inset 0 -1px 0 rgba(245,200,40,.1)", transformOrigin: "center bottom", animation: "pkg-lidOpen 3.2s ease-in-out infinite", overflow: "hidden" }}>
            <div style={{ position: "absolute", bottom: 0, left: -2, right: -2, height: 12, background: "linear-gradient(180deg,#b8860b,#f5c842,#8b6400)" }} />
          </div>
          {/* Base */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 90, background: "linear-gradient(170deg,#1a1000 0%,#0d0800 100%)", border: "2px solid #b8860b", borderRadius: "6px 6px 10px 10px", boxShadow: "0 8px 30px rgba(0,0,0,.8), inset 0 1px 0 rgba(245,200,40,.15), 0 0 30px rgba(245,180,30,.2)", overflow: "hidden" }}>
            <div style={{ position: "absolute", bottom: 36, left: -2, right: -2, height: 20, background: "linear-gradient(180deg,#b8860b 0%,#f5c842 40%,#f5c842 60%,#8b6400 100%)", borderTop: "1px solid #ffe97a", borderBottom: "1px solid #b8860b", zIndex: 2 }} />
          </div>
          {/* Lock */}
          <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", width: 24, height: 28, zIndex: 3 }}>
            <svg viewBox="0 0 24 28" xmlns="http://www.w3.org/2000/svg">
              <defs><linearGradient id="lockG" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: "#ffe97a" }} /><stop offset="100%" style={{ stopColor: "#b8860b" }} /></linearGradient></defs>
              <path d="M6,14 L6,9 C6,5 18,5 18,9 L18,14" fill="none" stroke="url(#lockG)" strokeWidth="3" strokeLinecap="round" />
              <rect x="3" y="13" width="18" height="13" rx="3" fill="url(#lockG)" />
              <circle cx="12" cy="19" r="3" fill="#06080f" />
              <rect x="10.5" y="19" width="3" height="4" rx="1" fill="#06080f" />
            </svg>
          </div>
        </div>

        {/* Diamond burst */}
        <div style={{ position: "absolute", bottom: 105, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, zIndex: 10 }}>
          {bd("3.2s","0s","-60px","-90px","120deg",28,"#0080cc",true)}
          {bd("3.2s","0.15s","65px","-85px","-100deg",32,"#00a0dd",true)}
          {bd("3.2s","0.05s","0px","-110px","80deg",36,"#0070bb",true)}
          {bd("3.2s","0.1s","-90px","-50px","150deg",20,"#70c8ff")}
          {bd("3.2s","0.2s","88px","-48px","-140deg",18,"#90d8ff")}
          {bd("3.2s","0.08s","-45px","-115px","60deg",16,"#a0e0ff")}
          {bd("3.2s","0.18s","42px","-112px","-55deg",14,"#80d0ff")}
        </div>
      </div>

      {/* Ambient diamonds */}
      <div style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none" }}>
        {amb("10px","left","5px","4s","0.3s","0.7","10deg","30deg","60deg",14,"#f5c842")}
        {amb("30px","right","10px","3.5s","1s","0.65","-5deg","-20deg","-45deg",12,"#ffe97a")}
        {amb("140px","left","2px","5s","0.7s","0.6","15deg","40deg","70deg",16,"#00e5ff")}
        {amb("160px","right","8px","4.2s","1.5s","0.55","-10deg","-30deg","-55deg",13,"#f5c842")}
      </div>

      {/* Sparkles */}
      {spark("15px","left","55px","2s","0.1s",14,"#f5c842")}
      {spark("15px","right","55px","1.8s","0.7s",10,"#00e5ff")}
      {spark("80px","left","8px","2.2s","0.4s",12,"#ffe97a")}
      {spark("80px","right","5px","1.9s","1.2s",11,"#00e5ff")}
    </div>
  );
}

// ── Passes & Bundles Scene ───────────────────────────────────────────────────
function PassesBundlesScene() {
  const gem = (top: string, side: "left" | "right", sideVal: string, dur: string, del: string, r0: string, tx1: string, ty1: string, tx2: string, ty2: string, tx3: string, ty3: string, tx4: string, ty4: string, r1: string, r2: string, r3: string, r4: string, w: number, c1: string, c2: string) => (
    <div style={{ position: "absolute", top, [side]: sideVal, animation: `pkg-gemSpark ${dur} ease-in-out ${del} infinite`, opacity: 0, ...cv({ "--dur": dur, "--del": del, "--r0": r0, "--tx1": tx1, "--ty1": ty1, "--tx2": tx2, "--ty2": ty2, "--tx3": tx3, "--ty3": ty3, "--tx4": tx4, "--ty4": ty4, "--r1": r1, "--r2": r2, "--r3": r3, "--r4": r4 }) }}>
      <svg width={w} height={w} viewBox="0 0 20 20">
        <defs><linearGradient id={`g-${del}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: c1 }} /><stop offset="100%" style={{ stopColor: c2 }} /></linearGradient></defs>
        <polygon points="10,1 18,8 10,19 2,8" fill={`url(#g-${del})`} />
        <polygon points="10,1 14,6 10,8 6,6" fill="rgba(255,255,255,0.5)" />
      </svg>
    </div>
  );

  const sp = (top: string, side: "left" | "right", sideVal: string, dur: string, del: string, w: number) => (
    <div style={{ position: "absolute", top, [side]: sideVal, animation: `pkg-sparkleFade ${dur} ease-in-out ${del} infinite`, opacity: 0, ...cv({ "--dur": dur, "--del": del }) }}>
      <svg width={w} height={w} viewBox="0 0 20 20"><path d="M10,1 L11.5,8.5 L19,10 L11.5,11.5 L10,19 L8.5,11.5 L1,10 L8.5,8.5 Z" fill="white" opacity="0.9" /></svg>
    </div>
  );

  return (
    <div style={{ width: 300, height: 480, position: "relative", display: "flex", justifyContent: "center", alignItems: "center", background: "#0c0818" }}>
      {/* Diamond platform */}
      <div style={{ position: "absolute", width: 260, height: 260, bottom: 60, left: "50%", transform: "translateX(-50%)", zIndex: 1 }}>
        <svg viewBox="0 0 260 260" style={{ width: "100%", height: "100%", animation: "pkg-platformPulse 3s ease-in-out infinite" }}>
          <defs><linearGradient id="platGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: "#5080c0", stopOpacity: 0.6 }} /><stop offset="100%" style={{ stopColor: "#2040a0", stopOpacity: 0.1 }} /></linearGradient></defs>
          <polygon points="130,8 252,130 130,252 8,130" fill="none" stroke="rgba(100,160,255,0.35)" strokeWidth="1.5" />
          <polygon points="130,40 222,130 130,220 38,130" fill="url(#platGrad)" stroke="rgba(120,180,255,0.2)" strokeWidth="1" />
          <circle cx="130" cy="8" r="3" fill="#70b0ff" opacity="0.7" />
          <circle cx="252" cy="130" r="3" fill="#70b0ff" opacity="0.7" />
          <circle cx="130" cy="252" r="3" fill="#70b0ff" opacity="0.7" />
          <circle cx="8" cy="130" r="3" fill="#70b0ff" opacity="0.7" />
        </svg>
      </div>

      {/* Float group */}
      <div style={{ position: "absolute", width: 220, height: 320, bottom: 80, left: "50%", transform: "translateX(-50%)", zIndex: 5, animation: "pkg-bookFloat 3s ease-in-out infinite" }}>
        {/* Book stack */}
        <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 180, height: 220 }}>
          {[
            { rotate: "-12deg", y: "16px", bg: "linear-gradient(145deg,#1a0840,#120530)", border: "1px solid rgba(80,40,160,.4)", shadow: "-6px 6px 20px rgba(0,0,0,.7)", z: 1 },
            { rotate: "-7deg",  y: "10px", bg: "linear-gradient(145deg,#220a50,#160638)", border: "1px solid rgba(90,50,170,.5)", shadow: "-4px 5px 16px rgba(0,0,0,.6)", z: 2 },
            { rotate: "-3deg",  y: "4px",  bg: "linear-gradient(145deg,#2e1068,#1e0848)", border: "1px solid rgba(110,60,190,.6)", shadow: "-3px 4px 12px rgba(0,0,0,.5)", z: 3 },
          ].map((p, i) => (
            <div key={i} style={{ position: "absolute", width: 150, height: 190, borderRadius: 8, left: "50%", transform: `translateX(-50%) rotate(${p.rotate}) translateY(${p.y})`, background: p.bg, border: p.border, boxShadow: p.shadow, zIndex: p.z }} />
          ))}
          {/* Front page */}
          <div style={{ position: "absolute", width: 150, height: 190, borderRadius: 8, left: "50%", transform: "translateX(-50%) rotate(0deg)", background: "linear-gradient(145deg,#4a1aaa 0%,#30108a 30%,#1e0868 60%,#3a14a0 100%)", border: "1.5px solid rgba(140,90,255,.7)", boxShadow: "0 6px 30px rgba(70,20,180,.7), 0 0 60px rgba(80,30,200,.3), inset 0 0 40px rgba(80,40,180,.2)", zIndex: 4, overflow: "hidden" }}>
            {/* Shine sweep */}
            <div style={{ position: "absolute", top: "-100%", left: "-60%", width: "40%", height: "300%", background: "linear-gradient(105deg,transparent 30%,rgba(255,255,255,.18) 50%,transparent 70%)", animation: "pkg-shineSweep 3s ease-in-out infinite", zIndex: 5 }} />
            {/* Spine */}
            <div style={{ position: "absolute", right: -2, top: 0, bottom: 0, width: 36, background: "linear-gradient(180deg,#5a22bb,#2a0e70)", borderLeft: "1px solid rgba(160,100,255,.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}>
              <span style={{ fontFamily: "Arial Black, sans-serif", fontSize: 9, fontWeight: 900, letterSpacing: 2, color: "rgba(200,170,255,.5)", writingMode: "vertical-rl", transform: "rotate(180deg)" }}>PASSES &amp; BUNDLES</span>
            </div>
          </div>
        </div>

        {/* Center diamond */}
        <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", width: 110, height: 110, zIndex: 10, animation: "pkg-diamondGlow 2s ease-in-out infinite" }}>
          <svg viewBox="0 0 110 110" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="dMain" x1="20%" y1="0%" x2="80%" y2="100%"><stop offset="0%" style={{ stopColor: "#d0eeff" }} /><stop offset="25%" style={{ stopColor: "#90ccff" }} /><stop offset="60%" style={{ stopColor: "#4888e8" }} /><stop offset="100%" style={{ stopColor: "#1a40a0" }} /></linearGradient>
              <linearGradient id="dFacet" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: "#ffffff", stopOpacity: 0.5 }} /><stop offset="100%" style={{ stopColor: "#6090cc", stopOpacity: 0.1 }} /></linearGradient>
              <filter id="dGlow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <polygon points="55,5 103,46 55,105 7,46" fill="url(#dMain)" filter="url(#dGlow)" />
            <polygon points="55,5 103,46 55,50 7,46" fill="url(#dFacet)" />
            <polygon points="55,5 7,46 55,50" fill="rgba(255,255,255,0.2)" />
            <polygon points="55,5 103,46 55,50" fill="rgba(200,230,255,0.15)" />
            <polygon points="7,46 55,50 55,105" fill="rgba(10,30,100,0.4)" />
            <polygon points="103,46 55,50 55,105" fill="rgba(5,20,80,0.5)" />
            <ellipse cx="43" cy="30" rx="14" ry="8" fill="rgba(255,255,255,0.35)" transform="rotate(-20,43,30)" />
            <polygon points="55,8 70,28 55,32 40,28" fill="rgba(255,255,255,0.3)" />
          </svg>
        </div>

        {/* Gem particles */}
        <div style={{ position: "absolute", inset: -40, zIndex: 8, pointerEvents: "none" }}>
          {gem("60px","left","10px","2.8s","0s","10deg","-8px","-15px","-12px","-8px","-6px","5px","0px","10px","30deg","60deg","80deg","100deg",22,"#b0dcff","#4488dd")}
          {gem("40px","right","5px","3.2s","0.6s","-10deg","10px","-12px","14px","-5px","8px","6px","0px","12px","-25deg","-50deg","-70deg","-90deg",20,"#c0e4ff","#5090e0")}
          {gem("130px","left","0px","2.5s","1.1s","5deg","-14px","-6px","-16px","4px","-8px","10px","0px","6px","20deg","40deg","55deg","70deg",26,"#a0d8ff","#3878d8")}
          {gem("120px","right","2px","3.6s","0.3s","-5deg","12px","-8px","15px","2px","9px","12px","0px","8px","-18deg","-35deg","-50deg","-65deg",18,"#b8e0ff","#5088e0")}
          {sp("8px","left","70px","1.8s","0.2s",14)}
          {sp("8px","right","60px","2s","1s",10)}
          {sp("90px","left","4px","2.4s","0.5s",12)}
          {sp("90px","right","2px","2.1s","1.3s",11)}
        </div>
      </div>
    </div>
  );
}

// ── Placeholder Card Scene ───────────────────────────────────────────────────
function PlaceholderScene({ icon, color1, color2, label }: { icon: React.ReactNode; color1: string; color2: string; label: string }) {
  return (
    <div style={{ width: 300, height: 480, position: "relative", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "#09080f" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 60% 50% at 50% 45%, ${color1}22 0%, transparent 70%)`, animation: "pkg-placeholderGlow 3s ease-in-out infinite" }} />
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ width: 90, height: 90, borderRadius: "50%", background: `linear-gradient(135deg, ${color1}33, ${color2}22)`, border: `1.5px solid ${color1}55`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 40px ${color1}44`, animation: "pkg-rankPulse 3s ease-in-out infinite" }}>
          {icon}
        </div>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 3, color: color1, textTransform: "uppercase", textAlign: "center" }}>{label}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 2, textTransform: "uppercase" }}>Coming Soon</div>
        {/* Decorative dots */}
        {[0,1,2,3,4,5].map(i => (
          <div key={i} style={{ position: "absolute", width: 4, height: 4, borderRadius: "50%", background: color1, opacity: 0, animation: `pkg-starlightTwinkle ${1.5 + i * 0.4}s ease-in-out ${i * 0.3}s infinite`, top: `${20 + i * 30}%`, left: i % 2 === 0 ? `${10 + i * 8}%` : undefined, right: i % 2 !== 0 ? `${10 + i * 6}%` : undefined }} />
        ))}
      </div>
    </div>
  );
}

// ── Individual Package Card ──────────────────────────────────────────────────
function PackageCard({ title, subtitle, scene, onClick }: { title: string; subtitle: string; scene: React.ReactNode; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{ flex: "0 0 220px", borderRadius: 20, overflow: "hidden", cursor: "pointer", position: "relative", boxShadow: "0 8px 32px rgba(0,0,0,0.6)", transition: "transform 0.2s ease, box-shadow 0.2s ease" }}
      onTouchStart={e => (e.currentTarget.style.transform = "scale(0.97)")}
      onTouchEnd={e => (e.currentTarget.style.transform = "scale(1)")}
      onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.8)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.6)"; }}
    >
      {/* Scene scaled to fit card width */}
      <div style={{ width: 220, height: 352, overflow: "hidden", position: "relative" }}>
        <div style={{ width: 300, height: 480, transform: "scale(0.733)", transformOrigin: "top left" }}>
          {scene}
        </div>
      </div>
      {/* Label */}
      <div style={{ background: "linear-gradient(180deg,rgba(10,8,20,0.95),rgba(5,4,12,1))", padding: "12px 14px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 11, fontWeight: 700, color: "#f5c842", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", letterSpacing: 1 }}>{subtitle}</div>
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, color: "#f5c842", fontWeight: 600, letterSpacing: 1 }}>View Packs →</span>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(245,200,40,0.12)", border: "1px solid rgba(245,200,40,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5h6M6 3l2 2-2 2" stroke="#f5c842" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Packages Section ─────────────────────────────────────────────────────────
export default function PackagesSection({ onPackageSelect }: { onPackageSelect: (id: string) => void }) {
  const packages = [
    {
      id: "small",
      title: "Small Pack",
      subtitle: "Entry-level diamonds",
      scene: <DiamondChestScene spineLabel="Small Packs" />,
    },
    {
      id: "normal",
      title: "Normal Pack",
      subtitle: "Best value diamonds",
      scene: <DiamondChestScene spineLabel="Diamond Packs" />,
    },
    {
      id: "double",
      title: "Double Diamond",
      subtitle: "2× your diamonds",
      scene: (
        <PlaceholderScene
          label="Double Diamond"
          color1="#00e5ff"
          color2="#0070bb"
          icon={
            <svg width="44" height="44" viewBox="0 0 44 44">
              <defs><linearGradient id="dd1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#d0f4ff" /><stop offset="100%" stopColor="#0080cc" /></linearGradient></defs>
              <polygon points="12,2 22,11 12,24 2,11" fill="url(#dd1)" opacity="0.9" />
              <polygon points="32,2 42,11 32,24 22,11" fill="url(#dd1)" opacity="0.7" />
              <polygon points="12,4 18,10 12,15 6,10" fill="rgba(255,255,255,0.4)" />
              <polygon points="32,4 38,10 32,15 26,10" fill="rgba(255,255,255,0.35)" />
            </svg>
          }
        />
      ),
    },
    {
      id: "passes",
      title: "Passes & Bundles",
      subtitle: "Weekly & monthly passes",
      scene: <PassesBundlesScene />,
    },
    {
      id: "starlight",
      title: "Starlight Cards",
      subtitle: "Exclusive skins & rewards",
      scene: (
        <PlaceholderScene
          label="Starlight"
          color1="#f5c842"
          color2="#ff8c00"
          icon={
            <svg width="48" height="48" viewBox="0 0 48 48">
              <defs><linearGradient id="sl1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#ffe97a" /><stop offset="100%" stopColor="#f59e0b" /></linearGradient></defs>
              <path d="M24,2 L28.5,17.5 L44,22 L28.5,26.5 L24,42 L19.5,26.5 L4,22 L19.5,17.5 Z" fill="url(#sl1)" />
              <path d="M24,8 L27,18 L37,22 L27,26 L24,36 L21,26 L11,22 L21,18 Z" fill="rgba(255,255,255,0.3)" />
            </svg>
          }
        />
      ),
    },
    {
      id: "rank",
      title: "Rank Boosting",
      subtitle: "Rise to Mythical Glory",
      scene: (
        <PlaceholderScene
          label="Rank Boost"
          color1="#a855f7"
          color2="#6d28d9"
          icon={
            <svg width="48" height="48" viewBox="0 0 48 48">
              <defs><linearGradient id="rb1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#d8b4fe" /><stop offset="100%" stopColor="#7c3aed" /></linearGradient></defs>
              <polygon points="24,4 30,18 46,20 35,31 38,46 24,38 10,46 13,31 2,20 18,18" fill="url(#rb1)" />
              <polygon points="24,10 28,20 38,21 31,28 33,38 24,33 15,38 17,28 10,21 20,20" fill="rgba(255,255,255,0.2)" />
            </svg>
          }
        />
      ),
    },
  ];

  return (
    <section id="packages" style={{ background: "linear-gradient(180deg,#0a0a12 0%,#080610 100%)", padding: "48px 0 56px" }}>
      <style>{KEYFRAMES}</style>
      <div style={{ maxWidth: 520, margin: "0 auto", paddingLeft: 20, paddingRight: 20 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-block", padding: "6px 18px", borderRadius: 999, background: "rgba(245,200,40,0.1)", border: "1px solid rgba(245,200,40,0.3)", color: "#f5c842", fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 12 }}>Our Packages</div>
          <h2 style={{ color: "#fff", fontSize: "clamp(1.6rem,6vw,2.2rem)", fontWeight: 800, lineHeight: 1.2, margin: 0 }}>Choose Your Pack</h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 8 }}>Swipe to explore all categories</p>
        </div>

        {/* Horizontal scroll row */}
        <div className="pkg-scroll" style={{ display: "flex", gap: 16, overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", paddingBottom: 12, scrollbarWidth: "none" }}>
          <style>{`.pkg-scroll::-webkit-scrollbar{display:none}`}</style>
          {packages.map(pkg => (
            <div key={pkg.id} style={{ scrollSnapAlign: "start", flexShrink: 0 }}>
              <PackageCard
                title={pkg.title}
                subtitle={pkg.subtitle}
                scene={pkg.scene}
                onClick={() => onPackageSelect(pkg.id)}
              />
            </div>
          ))}
          {/* End padding */}
          <div style={{ flex: "0 0 4px" }} />
        </div>

        {/* Scroll hint dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20 }}>
          {packages.map((_, i) => (
            <div key={i} style={{ width: i === 0 ? 20 : 6, height: 6, borderRadius: 3, background: i === 0 ? "#f5c842" : "rgba(255,255,255,0.15)", transition: "width 0.3s" }} />
          ))}
        </div>
      </div>
    </section>
  );
}
