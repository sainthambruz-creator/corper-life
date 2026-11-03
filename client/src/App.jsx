import { useState } from "react";
import {
  addDoc, updateDoc, doc, collection, serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

const STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT Abuja","Gombe",
  "Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos",
  "Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto",
  "Taraba","Yobe","Zamfara",
];

const ALLOWANCE = 77000; // paid every 30 days, change anytime
const TOTAL_DAYS = 365;

const ACTIONS = [
  {
    id: "cds",
    label: "Attend CDS",
    note: "Energy -15, Cash -N500 (transport)",
    run: () => ({ cash: -500, energy: -15, health: 0, msg: "You attended CDS. The meeting started 2 hours late." }),
  },
  {
    id: "hustle",
    label: "Side hustle",
    note: "Energy -30, Cash +N3,000 to N8,000",
    run: () => {
      const earned = 3000 + Math.floor(Math.random() * 5001);
      return { cash: earned, energy: -30, health: 0, msg: "Your side hustle paid N" + earned.toLocaleString() + "." };
    },
  },
  {
    id: "rest",
    label: "Rest at the lodge",
    note: "Energy +40, Health +5",
    run: () => ({ cash: 0, energy: 40, health: 5, msg: "You rested well. NEPA even left the light on." }),
  },
  {
    id: "food",
    label: "Buy proper food",
    note: "Cash -N1,500, Health +10, Energy +10",
    run: () => ({ cash: -1500, energy: 10, health: 10, msg: "Jollof and chicken. You feel like a new person." }),
  },
];

const EVENTS = [
  { msg: "Light was taken. You sweated all night.", cash: 0, health: -5, energy: -10 },
  { msg: "A neighbour owed you money and finally paid: +N2,000.", cash: 2000, health: 0, energy: 0 },
  { msg: "Danfo conductor drama. You lost N1,000 on the way.", cash: -1000, health: 0, energy: -5 },
  { msg: "Your PPA gave you a small bonus: +N5,000.", cash: 5000, health: 0, energy: 0 },
  { msg: "You caught malaria. Hospital bill: N3,000.", cash: -3000, health: -15, energy: -10 },
];

const clamp = (n) => Math.max(0, Math.min(100, n));

export default function App() {
  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [player, setPlayer] = useState(null);
  const [stats, setStats] = useState({ cash: 20000, health: 100, energy: 100, day: 1 });
  const [status, setStatus] = useState("playing");
  const [log, setLog] = useState("Day 1 of your Service Year. What will you do?");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function startGame() {
    if (!name.trim() || !state) {
      setError("Enter your corper name and pick a state.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const ref = await addDoc(collection(db, "players"), {
        name: name.trim(),
        state,
        cash: 20000,
        health: 100,
        energy: 100,
        day: 1,
        createdAt: serverTimestamp(),
      });
      setPlayer({ id: ref.id, name: name.trim(), state });
    } catch (e) {
      setError("Could not save: " + e.message);
    }
    setSaving(false);
  }

  async function doAction(action) {
    if (status !== "playing") return;
    const r = action.run();
    if (stats.cash + r.cash < 0) {
      setLog("You don't have enough cash for that.");
      return;
    }

    let cash = stats.cash + r.cash;
    let health = stats.health + r.health;
    let energy = stats.energy + r.energy;
    let message = r.msg;
    const day = stats.day + 1;

    if (energy < 20) {
      health -= 2;
      message += " You are exhausted and your health dropped.";
    }

    if (Math.random() < 0.25) {
      const ev = EVENTS[Math.floor(Math.random() * EVENTS.length)];
      cash = Math.max(0, cash + ev.cash);
      health += ev.health;
      energy += ev.energy;
      message += " EVENT: " + ev.msg;
    }

    if (day % 30 === 0) {
      cash += ALLOWANCE;
      message += " Allowance day! +N" + ALLOWANCE.toLocaleString() + ".";
    }

    health = clamp(health);
    energy = clamp(energy);

    const next = { cash, health, energy, day };
    setStats(next);
    setLog(message);

    if (health <= 0) {
      setStatus("over");
      setLog(message + " Your health hit zero. Game over.");
    } else if (day > TOTAL_DAYS) {
      setStatus("done");
      setLog("You completed your Service Year! Time to collect your discharge certificate.");
    }

    try {
      await updateDoc(doc(db, "players", player.id), next);
    } catch (e) {
      setError("Could not save progress: " + e.message);
    }
  }

  const box = {
    maxWidth: 420, margin: "0 auto", padding: 24,
    fontFamily: "system-ui, sans-serif", textAlign: "left",
  };
  const field = {
    width: "100%", padding: 12, marginBottom: 14, fontSize: 16,
    borderRadius: 8, border: "1px solid #999", boxSizing: "border-box",
  };
  const button = {
    width: "100%", padding: 14, fontSize: 18, fontWeight: 700,
    borderRadius: 8, border: "none", background: "#008751", color: "#fff",
  };
  const actionBtn = {
    width: "100%", padding: 12, marginBottom: 10, fontSize: 16,
    borderRadius: 8, border: "2px solid #008751", background: "#fff",
    color: "#008751", fontWeight: 700, textAlign: "left", cursor: "pointer",
  };
  const statBox = {
    display: "flex", justifyContent: "space-between", background: "#f2f2f2",
    color: "#111", padding: 12, borderRadius: 8, marginBottom: 14, fontWeight: 600,
  };

  if (player) {
    return (
      <div style={box}>
        <h2>Corper {player.name} - {player.state} State</h2>
        <p style={{ margin: "0 0 10px" }}>Day {stats.day} of {TOTAL_DAYS}</p>

        <div style={statBox}>
          <span>Cash: N{stats.cash.toLocaleString()}</span>
          <span>Health: {stats.health}</span>
          <span>Energy: {stats.energy}</span>
        </div>

        <p style={{ minHeight: 60 }}>{log}</p>
        {error && <p style={{ color: "crimson" }}>{error}</p>}

        {status === "playing" ? (
          ACTIONS.map((a) => (
            <button key={a.id} style={actionBtn} onClick={() => doAction(a)}>
              {a.label}
              <div style={{ fontSize: 13, fontWeight: 400 }}>{a.note}</div>
            </button>
          ))
        ) : (
          <button style={button} onClick={() => window.location.reload()}>
            Play again
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={box}>
      <h1>Corper Life</h1>
      <p>Your Service Year starts here.</p>

      <input
        style={field}
        placeholder="Your corper name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <select style={field} value={state} onChange={(e) => setState(e.target.value)}>
        <option value="">Pick your state of deployment</option>
        {STATES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <button style={button} onClick={startGame} disabled={saving}>
        {saving ? "Saving..." : "Start Service Year"}
      </button>
    </div>
  );
}