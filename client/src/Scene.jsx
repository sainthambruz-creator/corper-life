import { useState } from "react";
import Hero from "./Hero";

// h = the corper's height in pixels in each scene.
// If he looks too big or small somewhere, change that scene's h number.
const PLACES = {
  start: {
    name: "Orientation Camp", h: 110, fx: ["clouds", "dust"], dust: "255,255,255",
    tint: "", sky: "linear-gradient(#87ceeb, #e0f4ff)", emoji: "⛺",
  },
  cds: {
    name: "CDS Meeting", h: 105, fx: ["people", "dust"], dust: "255,235,170",
    tint: "rgba(255,200,120,0.10)", sky: "linear-gradient(#ffd89b, #fff3d6)", emoji: "🏫",
  },
  hustle: {
    name: "Side Hustle", h: 90, fx: ["clouds", "people", "dust"], dust: "255,255,255",
    tint: "rgba(255,120,80,0.08)", sky: "linear-gradient(#ff9a8b, #ffe0d6)", emoji: "🏪",
  },
  rest: {
    name: "Corper Lodge", h: 120, fx: ["glow", "dust"], dust: "255,220,150", dim: true,
    tint: "rgba(10,20,70,0.30)", sky: "linear-gradient(#1b2a49, #3d4f7a)", emoji: "🏠",
  },
  food: {
    name: "Mama Put Joint", h: 100, fx: ["steam", "dust"], dust: "255,240,200",
    tint: "rgba(255,170,60,0.12)", sky: "linear-gradient(#ffe29a, #fff6d6)", emoji: "🍛",
  },
};

const CSS = `
@keyframes walkIn { from { transform: translateX(-170px); } to { transform: translateX(0); } }
@keyframes stepbounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
@keyframes idle { 0%,100% { transform: translateY(0) scaleY(1); } 50% { transform: translateY(-2px) scaleY(1.015); } }
@keyframes hop { 0% { transform: translateY(0); } 40% { transform: translateY(-28px); } 100% { transform: translateY(0); } }
@keyframes swing { from { transform: rotate(-22deg); } to { transform: rotate(22deg); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes kenburns { from { transform: scale(1); } to { transform: scale(1.09) translateX(-8px); } }
@keyframes drift { 0% { transform: translate(0,0); opacity: 0; } 20% { opacity: 0.8; } 100% { transform: translate(24px,-110px); opacity: 0; } }
@keyframes cloudmove { from { transform: translateX(-160px); } to { transform: translateX(520px); } }
@keyframes passR { from { transform: translateX(-60px); } to { transform: translateX(460px); } }
@keyframes passL { from { transform: translateX(460px); } to { transform: translateX(-60px); } }
@keyframes rise { 0% { transform: translateY(0) scale(0.6); opacity: 0; } 25% { opacity: 0.6; } 100% { transform: translateY(-80px) scale(1.7); opacity: 0; } }
@keyframes flicker { 0% { opacity: 0.9; } 8% { opacity: 0.55; } 15% { opacity: 0.95; } 30% { opacity: 0.7; } 45% { opacity: 1; } 60% { opacity: 0.6; } 75% { opacity: 0.95; } 100% { opacity: 0.85; } }
@keyframes shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }
@keyframes pop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes flash { 0% { opacity: 1; } 100% { opacity: 0; } }

.bg { animation: fadeIn 0.5s ease-out, kenburns 22s ease-in-out infinite alternate; }
.walker { position: absolute; bottom: 10px; left: 30px; animation: walkIn 0.9s ease-out; }
.walker.react { animation: walkIn 0.9s ease-out, hop 0.5s ease-out 0.9s; }
.walker-inner { transform-origin: bottom center; animation: stepbounce 0.35s ease-in-out 3, idle 2.4s ease-in-out 0.9s infinite; }
.leg { transform-box: fill-box; transform-origin: top center; animation: swing 0.3s ease-in-out 3 alternate; }
.legR { animation-direction: alternate-reverse; }
.mote { position: absolute; border-radius: 50%; pointer-events: none; animation: drift 8s linear infinite; }
.cloud { position: absolute; left: 0; background: rgba(255,255,255,0.5); border-radius: 50%; filter: blur(6px); pointer-events: none; animation: cloudmove 60s linear infinite; }
.pp { position: absolute; left: 0; opacity: 0.3; pointer-events: none; }
.steam { position: absolute; bottom: 22%; border-radius: 50%; background: rgba(255,255,255,0.55); filter: blur(6px); pointer-events: none; animation: rise 3s ease-out infinite; }
.glow { position: absolute; right: 12%; bottom: 25%; width: 170px; height: 170px; border-radius: 50%; background: radial-gradient(circle, rgba(255,190,90,0.6), rgba(255,190,90,0) 70%); mix-blend-mode: screen; pointer-events: none; animation: flicker 2.6s linear infinite; }
.flash { position: absolute; inset: 0; pointer-events: none; animation: flash 0.6s ease-out forwards; }
.evt { position: absolute; top: 10px; right: 10px; color: #fff; font-weight: 800; padding: 6px 12px; border-radius: 20px; animation: pop 0.3s ease-out, shake 0.6s ease-in-out 0.3s; }
`;

function Background({ loc, p }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <>
        <div style={{ position: "absolute", inset: 0, background: p.sky }} />
        <div style={{ position: "absolute", right: 36, bottom: 30, fontSize: 64 }}>{p.emoji}</div>
      </>
    );
  }
  return (
    <img
      className="bg"
      src={"/art/bg-" + loc + ".png"}
      alt=""
      onError={() => setFailed(true)}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
}

function Dust({ rgb }) {
  return Array.from({ length: 14 }, (_, i) => (
    <span
      key={i}
      className="mote"
      style={{
        left: ((i * 37) % 100) + "%",
        bottom: ((i * 13) % 40) + "%",
        width: 3 + (i % 3) * 2,
        height: 3 + (i % 3) * 2,
        background: "rgba(" + rgb + ",0.7)",
        animationDelay: "-" + ((i * 0.9) % 7) + "s",
        animationDuration: 6 + (i % 5) * 2 + "s",
      }}
    />
  ));
}

function Clouds() {
  return [0, 1, 2].map((i) => (
    <div
      key={i}
      className="cloud"
      style={{
        top: 6 + i * 16 + "%",
        width: 90 + i * 30,
        height: 26 + i * 6,
        animationDuration: 45 + i * 20 + "s",
        animationDelay: "-" + i * 17 + "s",
      }}
    />
  ));
}

function People() {
  const list = [
    { b: 14, s: 0.9, t: 16, d: 0, dir: "passR" },
    { b: 18, s: 0.75, t: 22, d: 8, dir: "passL" },
    { b: 12, s: 1.0, t: 19, d: 4, dir: "passR" },
    { b: 20, s: 0.7, t: 26, d: 14, dir: "passL" },
  ];
  return list.map((q, i) => (
    <div
      key={i}
      className="pp"
      style={{ bottom: q.b, animation: q.dir + " " + q.t + "s linear -" + q.d + "s infinite" }}
    >
      <svg
        viewBox="0 0 24 56"
        width={24 * q.s * 1.3}
        height={56 * q.s * 1.3}
        style={{ transform: q.dir === "passL" ? "scaleX(-1)" : "none" }}
      >
        <circle cx="12" cy="8" r="6" fill="#111" />
        <rect x="6" y="15" width="12" height="24" rx="5" fill="#111" />
        <rect className="leg" x="7" y="36" width="4" height="18" rx="2" fill="#111" />
        <rect className="leg legR" x="13" y="36" width="4" height="18" rx="2" fill="#111" />
      </svg>
    </div>
  ));
}

function Steam() {
  return [0, 1, 2, 3, 4].map((i) => (
    <div
      key={i}
      className="steam"
      style={{
        left: 52 + i * 5 + "%",
        width: 18 + (i % 3) * 6,
        height: 18 + (i % 3) * 6,
        animationDelay: i * 0.6 + "s",
      }}
    />
  ));
}

export default function Scene({ loc, n, event, avatar }) {
  const p = PLACES[loc] || PLACES.start;
  const has = (x) => p.fx.includes(x);
  const good = event === "good";

  return (
    <div
      style={{
        position: "relative", height: 230, borderRadius: 12, overflow: "hidden",
        marginBottom: 14, background: "#ddd",
      }}
    >
      <style>{CSS}</style>

      <Background key={"b" + loc} loc={loc} p={p} />

      {p.tint && (
        <div style={{ position: "absolute", inset: 0, background: p.tint, pointerEvents: "none" }} />
      )}

      {has("clouds") && <Clouds />}
      {has("people") && <People />}
      {has("glow") && <div className="glow" />}

      <div className={"walker" + (event && !good ? " react" : "")} key={"w" + n}>
        <div className="walker-inner">
          <Hero h={p.h} dim={p.dim} avatar={avatar} walkMs={900} />
        </div>
        <div
          style={{
            position: "absolute", bottom: -3, left: "50%", marginLeft: -(p.h * 0.25),
            width: p.h * 0.5, height: 8, borderRadius: "50%",
            background: "rgba(0,0,0,0.28)", zIndex: -1,
          }}
        />
      </div>

      {has("steam") && <Steam />}
      {has("dust") && <Dust rgb={p.dust} />}

      {p.dim && (
        <div
          style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(circle, rgba(0,0,0,0) 40%, rgba(0,0,0,0.5) 100%)",
          }}
        />
      )}

      <div
        style={{
          position: "absolute", top: 10, left: 12, fontWeight: 700,
          background: "rgba(255,255,255,0.8)", color: "#222",
          padding: "2px 10px", borderRadius: 12,
        }}
      >
        {p.name}
      </div>

      {event && (
        <>
          <div
            className="flash"
            key={"f" + n}
            style={{ background: good ? "rgba(46,160,67,0.35)" : "rgba(211,47,47,0.4)" }}
          />
          <div className="evt" key={"e" + n} style={{ background: good ? "#2e7d32" : "#d32f2f" }}>
            {good ? "🎉 LUCKY DAY" : "⚠️ TROUBLE"}
          </div>
        </>
      )}
    </div>
  );
}