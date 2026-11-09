import { useState, useEffect } from "react";

const FRAMES = 8; // how many poses are in your walk sheet
const WALK_SPEED = 0.9; // seconds for one full step cycle (smaller = faster)
const IDLE_FRAME = 3; // which pose (0 to FRAMES-1) he stands in when not walking

const CSS = `
@keyframes heroWalk {
  from { background-position-x: 0%; }
  to { background-position-x: ${(FRAMES / (FRAMES - 1)) * 100}%; }
}
`;

function useSheet(url) {
  const [info, setInfo] = useState({ url: "", ratio: 0, state: "loading" });
  useEffect(() => {
    let live = true;
    const img = new Image();
    img.onload = () => {
      if (live) {
        setInfo({ url, ratio: img.naturalWidth / FRAMES / img.naturalHeight, state: "ok" });
      }
    };
    img.onerror = () => {
      if (live) setInfo({ url, ratio: 0, state: "none" });
    };
    img.src = url;
    return () => {
      live = false;
    };
  }, [url]);
  return info.url === url ? info : { url, ratio: 0, state: "loading" };
}

function Still({ h, avatar, dim, flip }) {
  const [src, setSrc] = useState(avatar === "corper-f" ? "corper-f" : "corper");
  const [failed, setFailed] = useState(false);
  const look = {
    filter: dim ? "brightness(0.78)" : "none",
    transform: flip ? "scaleX(-1)" : "none",
    display: "block",
  };
  if (failed) {
    return <span style={{ fontSize: h * 0.6, display: "block" }}>🚶</span>;
  }
  return (
    <img
      src={"/art/" + src + ".png"}
      alt="Corper"
      onError={() => {
        if (src !== "corper") setSrc("corper");
        else setFailed(true);
      }}
      style={{ ...look, height: h }}
    />
  );
}

export default function Hero({ h, avatar, dim, flip, walkMs, walking }) {
  const [timed, setTimed] = useState(!!walkMs);
  const mine = useSheet("/art/" + avatar + "-walk.png");
  const male = useSheet("/art/corper-walk.png");

  useEffect(() => {
    if (!walkMs) return undefined;
    const t = setTimeout(() => setTimed(false), walkMs);
    return () => clearTimeout(t);
  }, [walkMs]);

  const isWalking = walkMs ? timed : !!walking;

  if (mine.state === "loading" || (mine.state === "none" && male.state === "loading")) {
    return <div style={{ height: h, width: h * 0.5 }} />;
  }

  const sheet = mine.state === "ok" ? mine : male.state === "ok" ? male : null;
  if (!sheet) return <Still h={h} avatar={avatar} dim={dim} flip={flip} />;

  return (
    <>
      <style>{CSS}</style>
      <div
        style={{
          height: h,
          width: h * sheet.ratio,
          backgroundImage: "url(" + sheet.url + ")",
          backgroundSize: FRAMES * 100 + "% 100%",
          backgroundRepeat: "no-repeat",
          backgroundPositionX: (IDLE_FRAME / (FRAMES - 1)) * 100 + "%",
          animation: isWalking ? "heroWalk " + WALK_SPEED + "s steps(" + FRAMES + ") infinite" : "none",
          transform: flip ? "scaleX(-1)" : "none",
          filter: dim ? "brightness(0.78)" : "none",
        }}
      />
    </>
  );
}