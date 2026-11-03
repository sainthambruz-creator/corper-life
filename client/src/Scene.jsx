const PLACES = {
  start: { name: "Orientation Camp", emoji: "⛺", sky: "linear-gradient(#87ceeb, #e0f4ff)", ground: "#7a9a4a" },
  cds: { name: "CDS Meeting", emoji: "🏫", sky: "linear-gradient(#ffd89b, #fff3d6)", ground: "#a08b5b" },
  hustle: { name: "Side Hustle", emoji: "🏪", sky: "linear-gradient(#ff9a8b, #ffe0d6)", ground: "#8a8a8a" },
  rest: { name: "Corper Lodge", emoji: "🏠", sky: "linear-gradient(#1b2a49, #3d4f7a)", ground: "#4a4a5a" },
  food: { name: "Mama Put Joint", emoji: "🍛", sky: "linear-gradient(#ffe29a, #fff6d6)", ground: "#9a7b4f" },
};

const CSS = `
@keyframes walkIn { from { transform: translateX(-140px); } to { transform: translateX(0); } }
@keyframes bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
@keyframes swing { from { transform: rotate(-22deg); } to { transform: rotate(22deg); } }
@keyframes floaty { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@keyframes shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }
@keyframes pop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.walker { position: absolute; bottom: 26px; left: 40px; animation: walkIn 0.9s ease-out, bob 1.4s ease-in-out 0.9s infinite; }
.leg { transform-box: fill-box; transform-origin: top center; animation: swing 0.3s ease-in-out 3 alternate; }
.legR { animation-direction: alternate-reverse; }
.prop { position: absolute; right: 36px; bottom: 30px; font-size: 64px; animation: floaty 3s ease-in-out infinite; }
.evt { position: absolute; top: 10px; right: 10px; background: #d32f2f; color: #fff; font-weight: 800; padding: 6px 12px; border-radius: 20px; animation: pop 0.3s ease-out, shake 0.6s ease-in-out 0.3s; }
`;

export default function Scene({ loc, n, event }) {
  const p = PLACES[loc] || PLACES.start;
  return (
    <div
      style={{
        position: "relative", height: 190, borderRadius: 12, overflow: "hidden",
        marginBottom: 14, background: p.sky,
      }}
    >
      <style>{CSS}</style>

      <div
        style={{
          position: "absolute", top: 10, left: 12, fontWeight: 700,
          color: loc === "rest" ? "#fff" : "#222",
        }}
      >
        {p.name}
      </div>

      <div className="prop" key={"p" + loc}>{p.emoji}</div>

      <div
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 26,
          background: p.ground,
        }}
      />

      <div className="walker" key={"w" + n}>
        <svg viewBox="0 0 60 100" width="70" height="116">
          <rect className="leg" x="19" y="64" width="10" height="28" rx="4" fill="#3b3b3b" />
          <rect className="leg legR" x="31" y="64" width="10" height="28" rx="4" fill="#3b3b3b" />
          <rect x="15" y="30" width="30" height="38" rx="7" fill="#c2b280" />
          <rect x="15" y="44" width="30" height="7" fill="#008751" />
          <circle cx="30" cy="19" r="12" fill="#8d5524" />
          <path d="M16 15 Q30 0 44 15 Z" fill="#c2b280" />
          <rect x="14" y="14" width="32" height="3" rx="1.5" fill="#a89968" />
          <circle cx="26" cy="21" r="1.6" fill="#222" />
          <circle cx="34" cy="21" r="1.6" fill="#222" />
          <path d="M26 26 Q30 29 34 26" stroke="#222" strokeWidth="1.5" fill="none" />
        </svg>
      </div>

      {event && <div className="evt" key={"e" + n}>⚠️ EVENT</div>}
    </div>
  );
}