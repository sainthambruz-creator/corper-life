import { useState, useEffect } from "react";
import { setDoc, getDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { db, auth } from "./firebase";
import Scene from "./Scene";
import { sfx, isMuted, setMuted } from "./sound";

const STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT Abuja","Gombe",
  "Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos",
  "Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto",
  "Taraba","Yobe","Zamfara",
];

const COLORS = [
  { name: "Green", hex: "#008751" },
  { name: "Blue", hex: "#1565c0" },
  { name: "Orange", hex: "#e65100" },
  { name: "Purple", hex: "#6a1b9a" },
];

const ALLOWANCE = 77000; // paid every 30 days, change anytime
const TOTAL_DAYS = 365;
const START = { cash: 20000, health: 100, energy: 100, day: 1 };

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

function friendly(code) {
  const map = {
    "auth/email-already-in-use": "That email already has an account. Try signing in.",
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/weak-password": "Use a password with at least 6 characters.",
    "auth/invalid-credential": "Wrong email or password.",
    "auth/user-not-found": "No account with that email.",
    "auth/wrong-password": "Wrong email or password.",
    "auth/too-many-requests": "Too many tries. Wait a few minutes and try again.",
    "auth/network-request-failed": "Network problem. Check your internet and try again.",
    "auth/operation-not-allowed": "Email sign-in isn't switched on in Firebase yet.",
  };
  return map[code] || "Something went wrong. Try again.";
}

export default function App() {
  const [stage, setStage] = useState("loading");
  const [tab, setTab] = useState("play");
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [gender, setGender] = useState("male");
  const [color, setColor] = useState(COLORS[0].hex);
  const [player, setPlayer] = useState(null);
  const [stats, setStats] = useState(START);
  const [status, setStatus] = useState("playing");
  const [log, setLog] = useState("Day 1 of your Service Year. What will you do?");
  const [scene, setScene] = useState({ loc: "start", n: 1, event: null });
  const [soundOff, setSoundOff] = useState(isMuted());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setPlayer(null);
        setStage("auth");
        return;
      }
      setUser(u);
      try {
        const snap = await getDoc(doc(db, "players", u.uid));
        if (snap.exists()) {
          const d = snap.data();
          setPlayer({
            id: u.uid,
            name: d.name,
            state: d.state,
            gender: d.gender || "male",
            color: d.color || COLORS[0].hex,
          });
          setStats({ cash: d.cash, health: d.health, energy: d.energy, day: d.day });
          setStatus(d.health <= 0 ? "over" : d.day > TOTAL_DAYS ? "done" : "playing");
          setLog("Welcome back, Corper " + d.name + ". Day " + d.day + " is waiting.");
          setScene({ loc: "start", n: Date.now(), event: null });
          setTab("play");
          setStage("game");
        } else {
          setStage("create");
        }
      } catch (e) {
        setError("Could not load your game: " + e.message);
        setStage("auth");
      }
    });
    return unsub;
  }, []);

  function toggleSound() {
    const next = !soundOff;
    setMuted(next);
    setSoundOff(next);
    if (!next) sfx.click();
  }

  async function handleAuth(mode) {
    if (!email.trim() || password.length < 6) {
      setError("Enter your email and a password of at least 6 characters.");
      return;
    }
    setError("");
    setInfo("");
    setBusy(true);
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      setPassword("");
    } catch (e) {
      setError(friendly(e.code));
    }
    setBusy(false);
  }

  async function resetPassword() {
    if (!email.trim()) {
      setError("Type your email first, then tap Forgot password.");
      return;
    }
    setError("");
    setInfo("");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo("Reset link sent. Check your inbox and spam folder.");
    } catch (e) {
      setError(friendly(e.code));
    }
  }

  async function logout() {
    await signOut(auth);
    setEmail("");
    setPassword("");
    setName("");
    setState("");
    setError("");
    setInfo("");
  }

  async function createCharacter() {
    sfx.click();
    if (!name.trim() || !state) {
      setError("Enter your corper name and pick a state.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await setDoc(doc(db, "players", user.uid), {
        name: name.trim(),
        state,
        gender,
        color,
        ...START,
        createdAt: serverTimestamp(),
      });
      setPlayer({ id: user.uid, name: name.trim(), state, gender, color });
      setStats(START);
      setStatus("playing");
      setLog("Day 1 of your Service Year. What will you do?");
      setScene({ loc: "start", n: Date.now(), event: null });
      setTab("play");
      setStage("game");
    } catch (e) {
      setError("Could not save: " + e.message);
    }
    setBusy(false);
  }

  async function saveLook(nextGender, nextColor) {
    setPlayer((p) => ({ ...p, gender: nextGender, color: nextColor }));
    try {
      await updateDoc(doc(db, "players", player.id), { gender: nextGender, color: nextColor });
    } catch (e) {
      setError("Could not save: " + e.message);
    }
  }

  async function restart() {
    try {
      await updateDoc(doc(db, "players", player.id), START);
    } catch (e) {
      setError("Could not restart: " + e.message);
      return;
    }
    setStats(START);
    setStatus("playing");
    setLog("A fresh Service Year begins. Day 1. What will you do?");
    setScene({ loc: "start", n: Date.now(), event: null });
    setError("");
  }

  async function doAction(action) {
    if (status !== "playing") return;
    const r = action.run();
    if (stats.cash + r.cash < 0) {
      sfx.denied();
      setLog("You don't have enough cash for that.");
      return;
    }

    sfx.click();
    sfx.steps();

    let cash = stats.cash + r.cash;
    let health = stats.health + r.health;
    let energy = stats.energy + r.energy;
    let message = r.msg;
    let eventType = null;
    const day = stats.day + 1;

    sfx[action.id]();

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
      eventType = ev.cash > 0 ? "good" : "bad";
      if (eventType === "good") sfx.eventGood();
      else sfx.eventBad();
    }

    if (day % 30 === 0) {
      cash += ALLOWANCE;
      message += " Allowance day! +N" + ALLOWANCE.toLocaleString() + ".";
      sfx.allowance();
    }

    health = clamp(health);
    energy = clamp(energy);

    const next = { cash, health, energy, day };
    setStats(next);
    setLog(message);
    setScene({ loc: action.id, n: day, event: eventType });

    if (health <= 0) {
      setStatus("over");
      setLog(message + " Your health hit zero. Game over.");
      sfx.gameOver();
    } else if (day > TOTAL_DAYS) {
      setStatus("done");
      setLog("You completed your Service Year! Time to collect your discharge certificate.");
      sfx.win();
    }

    try {
      await updateDoc(doc(db, "players", player.id), next);
    } catch (e) {
      setError("Could not save progress: " + e.message);
    }
  }

  const accent =
    stage === "game" && player ? player.color : stage === "create" ? color : COLORS[0].hex;

  const box = {
    maxWidth: 420, margin: "0 auto", padding: 24,
    fontFamily: "system-ui, sans-serif", textAlign: "left",
  };
  const field = {
    width: "100%", padding: 12, marginBottom: 14, fontSize: 16,
    borderRadius: 8, border: "1px solid #999", boxSizing: "border-box",
  };
  const button = {
    width: "100%", padding: 14, fontSize: 18, fontWeight: 700, marginBottom: 10,
    borderRadius: 8, border: "none", background: accent, color: "#fff", cursor: "pointer",
  };
  const outline = {
    width: "100%", padding: 12, fontSize: 16, fontWeight: 700, marginBottom: 10,
    borderRadius: 8, border: "2px solid " + accent, background: "#fff",
    color: accent, cursor: "pointer",
  };
  const actionBtn = {
    width: "100%", padding: 12, marginBottom: 10, fontSize: 16,
    borderRadius: 8, border: "2px solid " + accent, background: "#fff",
    color: accent, fontWeight: 700, textAlign: "left", cursor: "pointer",
  };
  const statBox = {
    display: "flex", justifyContent: "space-between", background: "#f2f2f2",
    color: "#111", padding: 12, borderRadius: 8, marginBottom: 14, fontWeight: 600,
  };
  const soundBtn = {
    border: "none", background: "#eee", borderRadius: 20, fontSize: 20,
    padding: "4px 12px", cursor: "pointer",
  };
  const linkBtn = {
    border: "none", background: "none", color: accent, fontSize: 15,
    textDecoration: "underline", cursor: "pointer", padding: 4,
  };
  const tabBtn = (active) => ({
    flex: 1, padding: 10, fontSize: 16, fontWeight: 700, cursor: "pointer",
    borderRadius: 8, border: "2px solid " + accent,
    background: active ? accent : "#fff", color: active ? "#fff" : accent,
  });
  const pill = (active) => ({
    flex: 1, padding: 10, fontSize: 16, fontWeight: 700, cursor: "pointer",
    borderRadius: 8, border: "2px solid " + accent,
    background: active ? accent : "#fff", color: active ? "#fff" : accent,
  });
  const swatch = (hex, active) => ({
    width: 44, height: 44, borderRadius: "50%", cursor: "pointer", background: hex,
    border: active ? "4px solid #111" : "4px solid #fff",
    boxShadow: "0 0 0 1px #999",
  });

  function LookPicker({ g, c, onG, onC }) {
    return (
      <>
        <p style={{ margin: "0 0 6px", fontWeight: 700 }}>Character</p>
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <button style={pill(g === "male")} onClick={() => onG("male")}>Male</button>
          <button style={pill(g === "female")} onClick={() => onG("female")}>Female</button>
        </div>
        <p style={{ margin: "0 0 6px", fontWeight: 700 }}>Theme colour</p>
        <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
          {COLORS.map((o) => (
            <button
              key={o.hex}
              aria-label={o.name}
              style={swatch(o.hex, c === o.hex)}
              onClick={() => onC(o.hex)}
            />
          ))}
        </div>
      </>
    );
  }

  if (stage === "loading") {
    return (
      <div style={box}>
        <h1>Corper Life</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (stage === "auth") {
    return (
      <div style={box}>
        <h1>Corper Life</h1>
        <p>Sign in to continue your Service Year, or create an account to start one.</p>

        <input
          style={field}
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          style={field}
          type="password"
          autoComplete="current-password"
          placeholder="Password (at least 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p style={{ color: "crimson" }}>{error}</p>}
        {info && <p style={{ color: "#2e7d32" }}>{info}</p>}

        <button style={button} onClick={() => handleAuth("signin")} disabled={busy}>
          {busy ? "Please wait..." : "Sign in"}
        </button>
        <button style={outline} onClick={() => handleAuth("signup")} disabled={busy}>
          Create account
        </button>
        <div style={{ textAlign: "center" }}>
          <button style={linkBtn} onClick={resetPassword}>Forgot password?</button>
        </div>
      </div>
    );
  }

  if (stage === "create") {
    return (
      <div style={box}>
        <h1>Create your corper</h1>
        <p>Pick how your Service Year begins.</p>

        <input
          style={field}
          placeholder="Your corper name"
          maxLength={30}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <select style={field} value={state} onChange={(e) => setState(e.target.value)}>
          <option value="">Pick your state of deployment</option>
          {STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <LookPicker g={gender} c={color} onG={setGender} onC={setColor} />

        {error && <p style={{ color: "crimson" }}>{error}</p>}

        <button style={button} onClick={createCharacter} disabled={busy}>
          {busy ? "Saving..." : "Start Service Year"}
        </button>
        <div style={{ textAlign: "center" }}>
          <button style={linkBtn} onClick={logout}>Sign out</button>
        </div>
      </div>
    );
  }

  return (
    <div style={box}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: "0 0 6px" }}>Corper {player.name}</h2>
        <button style={soundBtn} onClick={toggleSound} aria-label="Toggle sound">
          {soundOff ? "🔇" : "🔊"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, margin: "8px 0 14px" }}>
        <button style={tabBtn(tab === "play")} onClick={() => setTab("play")}>Play</button>
        <button style={tabBtn(tab === "profile")} onClick={() => setTab("profile")}>Profile</button>
      </div>

      {tab === "play" && (
        <>
          <p style={{ margin: "0 0 10px" }}>
            {player.state} State | Day {stats.day} of {TOTAL_DAYS}
          </p>

          <Scene
            loc={scene.loc}
            n={scene.n}
            event={scene.event}
            avatar={player.gender === "female" ? "corper-f" : "corper"}
          />

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
            <button style={button} onClick={restart}>Start a new Service Year</button>
          )}
        </>
      )}

      {tab === "profile" && (
        <>
          <div style={statBox}>
            <span>{player.name}</span>
            <span>{player.state} State</span>
          </div>

          <LookPicker
            g={player.gender}
            c={player.color}
            onG={(g) => saveLook(g, player.color)}
            onC={(c) => saveLook(player.gender, c)}
          />

          <p style={{ color: "#555" }}>Signed in as {user.email}</p>
          {error && <p style={{ color: "crimson" }}>{error}</p>}
          <button style={outline} onClick={logout}>Sign out</button>
        </>
      )}
    </div>
  );
}