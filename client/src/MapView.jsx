import { useState, useRef, useEffect } from "react";
import { sfx } from "./sound";
import Hero from "./Hero";

// x and y are percentages across the map. Move a pin by changing them.
const PINS = [
  { id: "cds", label: "CDS Hall", emoji: "🏫", x: 22, y: 28 },
  { id: "hustle", label: "Market", emoji: "🏪", x: 78, y: 26 },
  { id: "rest", label: "Lodge", emoji: "🏠", x: 22, y: 66 },
  { id: "food", label: "Mama Put", emoji: "🍛", x: 78, y: 64 },
];
const HOME = { x: 50, y: 44 };

const CSS = `
@keyframes mbob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@keyframes mbreathe { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
@keyframes pinpulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
.mchar { position: absolute; z-index: 3; pointer-events: none; transform: translate(-50%, -100%); transition: left 1.3s ease-in-out, top 1.3s ease-in-out; }
.mwalk { animation: mbob 0.35s ease-in-out infinite; transform-origin: bottom center; }
.midle { animation: mbreathe 2.4s ease-in-out infinite; }
.pin { position: absolute; z-index: 2; transform: translate(-50%, -50%); background: none; border: none; cursor: pointer; display: flex; flex-direction: column; align-items: center; padding: 0; }
.pin-e { width: 52px; height: 52px; border-radius: 50%; background: rgba(255,255,255,0.92); display: flex; align-items: center; justify-content: center; font-size: 30px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); animation: pinpulse 2.2s ease-in-out infinite; }
.pin-l { margin-top: 3px; background: rgba(255,255,255,0.92); color: #222; font-size: 12px; font-weight: 700; padding: 1px 8px; border-radius: 10px; }
`;

export default function MapView({ avatar, actions, cash, locked, onGo }) {
  const [pos, setPos] = useState(HOME);
  const [target, setTarget] = useState(null);
  const [flip, setFlip] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [msg, setMsg] = useState("Tap a place to walk there.");
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  function go(pin) {
    if (locked || target) return;
    const a = actions.find((x) => x.id === pin.id);
    if (!a) return;
    if (cash < (a.need || 0)) {
      sfx.denied();
      setMsg("Not enough cash for " + pin.label + ". Try a side hustle first.");
      return;
    }
    setFlip(pin.x < pos.x);
    setTarget(pin.id);
    setPos({ x: pin.x, y: pin.y });
    setMsg("Walking to " + pin.label + "...");
    sfx.click();
    sfx.steps();
    timer.current = setTimeout(() => {
      setTarget(null);
      setMsg("Tap a place to walk there.");
      onGo(a);
    }, 1300);
  }

  return (
    <div>
      <style>{CSS}</style>

      <div
        style={{
          position: "relative", height: 270, borderRadius: 12, overflow: "hidden",
          background: "#9ccc65", marginBottom: 8,
        }}
      >
        {mapFailed ? (
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          >
            <rect width="100" height="100" fill="#9ccc65" />
            <g stroke="#e0d6cc" strokeWidth="4" strokeLinecap="round" fill="none">
              <path d="M0 44 L100 44" />
              <path d="M50 0 L50 100" />
              <path d="M50 44 L22 28" />
              <path d="M50 44 L78 26" />
              <path d="M50 44 L22 66" />
              <path d="M50 44 L78 64" />
            </g>
            <g fill="#7cb342">
              <circle cx="8" cy="12" r="5" />
              <circle cx="92" cy="10" r="6" />
              <circle cx="10" cy="88" r="6" />
              <circle cx="90" cy="90" r="5" />
              <circle cx="40" cy="90" r="4" />
              <circle cx="62" cy="10" r="4" />
            </g>
          </svg>
        ) : (
          <img
            src="/art/map.png"
            alt=""
            onError={() => setMapFailed(true)}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}

        {PINS.map((p) => {
          const a = actions.find((x) => x.id === p.id);
          const poor = a ? cash < (a.need || 0) : false;
          return (
            <button
              key={p.id}
              className="pin"
              onClick={() => go(p)}
              style={{ left: p.x + "%", top: p.y + "%", opacity: locked || poor ? 0.55 : 1 }}
            >
              <span className="pin-e">{p.emoji}</span>
              <span className="pin-l">{p.label}</span>
            </button>
          );
        })}

        <div
          className="mchar"
          style={{ left: pos.x + "%", top: "calc(" + pos.y + "% + 34px)" }}
        >
          <div className={target ? "mwalk" : "midle"}>
            <Hero h={54} avatar={avatar} flip={flip} walking={!!target} />
          </div>
          <div
            style={{
              width: 28, height: 6, borderRadius: "50%",
              background: "rgba(0,0,0,0.3)", margin: "0 auto",
            }}
          />
        </div>
      </div>

      <p style={{ margin: "0 0 12px", color: "#555" }}>
        {locked ? "No more moves this Service Year." : msg}
      </p>
    </div>
  );
}