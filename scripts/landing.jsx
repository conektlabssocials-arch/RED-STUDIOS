// Red Studios — landing v2 · conversion + 3D
//
// Local portfolio video assets are hosted in assets/videos/optimized-web/
const BRIEF_WHATSAPP_E164 = "919731865049";
// Hero copy: conversion/strike-through lane (brief → quote). Moodboard masthead alt: "BUILT / IN" + "RENDER." — swap in Hero if brand wants literal moodboard headline.
const { useState, useEffect, useRef, useMemo, useCallback } = React;

function driveThumbnailUrl(fileId) {
  return "https://drive.google.com/thumbnail?id=" + encodeURIComponent(fileId) + "&sz=w1200";
}

// ---------- Scramble text ----------
const SCRAMBLE_CHARS = "▓░ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$%&*";
function Scramble({ text, className = "", duration = 600 }) {
  const [out, setOut] = useState(text);
  const raf = useRef(null);
  function run() {
    const start = performance.now();
    function step(t) {
      const k = Math.min(1, (t - start) / duration);
      const reveal = Math.floor(text.length * k);
      let s = "";
      for (let i = 0; i < text.length; i++) {
        s += (i < reveal || text[i] === " ") ? text[i] : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }
      setOut(s);
      if (k < 1) raf.current = requestAnimationFrame(step); else setOut(text);
    }
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(step);
  }
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  return <span className={"scramble " + className} onMouseEnter={run}>{out}</span>;
}

// ---------- HUD ----------
function HUD() {
  const [tc, setTc] = useState("00:00:00:00");
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const ms = Date.now() - start;
      const f = Math.floor((ms % 1000) / (1000 / 24));
      const s = Math.floor(ms / 1000) % 60;
      const m = Math.floor(ms / 60000) % 60;
      const h = Math.floor(ms / 3600000);
      const pad = n => String(n).padStart(2, "0");
      setTc(`${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`);
    }, 42);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="hud">
      <div className="corner tl"><span className="rec"></span> REC · LIVE</div>
      <div className="corner bl">{tc}</div>
    </div>
  );
}

// ---------- Nav ----------
function Nav() {
  return (
    <nav className="top">
      <div className="brand">
        <span className="logo-glitch-wrap">
          <img className="brand-logo logo-glitch-img" src="assets/logo.png" alt="Red Studios" />
        </span>
      </div>
      <div className="links">
        <a href="#value">Why Us</a>
        <a href="#work">Work</a>
        <a href="#services">Services</a>
        <a href="#process">Process</a>
        <a href="#contact">Contact</a>
      </div>
      <a className="cta" href="#contact"><span className="dot"></span>Start a Brief →</a>
    </nav>
  );
}

// ---------- 3D Hero Stage (Three.js) ----------
function Hero3D() {
  const mountRef = useRef(null);
  useEffect(() => {
    if (!window.THREE) return;
    const THREE = window.THREE;
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a0a0a, 6, 14);

    const w = mount.clientWidth, h = mount.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    const camBase = { x: 0.38, y: 0, z: 6.35 };
    const lookTarget = new THREE.Vector3(-0.55, 0, 0);
    camera.position.set(camBase.x, camBase.y, camBase.z);
    camera.lookAt(lookTarget);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // --- Film-strip torus knot (the "reel of AI") ---
    const knotGeo = new THREE.TorusKnotGeometry(1.4, 0.42, 220, 20, 2, 5);
    const knotMat = new THREE.MeshStandardMaterial({
      color: 0xff0000, roughness: 0.4, metalness: 0.5,
      emissive: 0x440000, emissiveIntensity: 0.32, flatShading: true,
      transparent: true, opacity: 0.78,
    });
    const knot = new THREE.Mesh(knotGeo, knotMat);
    knot.position.set(1.12, 0, 0);
    scene.add(knot);

    const wireGeo = new THREE.TorusKnotGeometry(1.42, 0.44, 80, 8, 2, 5);
    const wireMat = new THREE.MeshBasicMaterial({ color: 0xff3b1f, wireframe: true, transparent: true, opacity: 0.16 });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    wire.position.copy(knot.position);
    scene.add(wire);

    const cubes = [];
    for (let i = 0; i < 28; i++) {
      const g = new THREE.BoxGeometry(0.08, 0.08, 0.08);
      const m = new THREE.MeshBasicMaterial({
        color: i % 4 === 0 ? 0xff0000 : 0xffffff,
        transparent: true,
        opacity: i % 4 === 0 ? 0.55 : 0.12,
      });
      const c = new THREE.Mesh(g, m);
      c.position.set((Math.random() - .5) * 5.5 + 0.85, (Math.random() - .5) * 4, (Math.random() - .5) * 4);
      c.userData = { s: 0.4 + Math.random() * 0.8, a: Math.random() * Math.PI * 2 };
      scene.add(c); cubes.push(c);
    }

    const key = new THREE.DirectionalLight(0xff1a00, 2.4);
    key.position.set(3, 2, 4); scene.add(key);
    const rim = new THREE.DirectionalLight(0x00e0ff, 0.8);
    rim.position.set(-3, -1, -2); scene.add(rim);
    scene.add(new THREE.AmbientLight(0x222222, 1));

    // mouse parallax
    let mx = 0, my = 0, tx = 0, ty = 0;
    function onMove(e) {
      const r = mount.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - .5) * 2;
      my = ((e.clientY - r.top) / r.height - .5) * 2;
    }
    window.addEventListener("mousemove", onMove);

    function onResize() {
      const w2 = mount.clientWidth, h2 = mount.clientHeight;
      if (w2 < 2 || h2 < 2) return;
      renderer.setSize(w2, h2);
      camera.aspect = w2 / h2; camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);
    setTimeout(onResize, 50);
    setTimeout(onResize, 300);

    let raf, t0 = performance.now();
    function tick() {
      const t = (performance.now() - t0) / 1000;
      tx += (mx - tx) * 0.06; ty += (my - ty) * 0.06;
      knot.rotation.x = t * 0.22 + ty * 0.4;
      knot.rotation.y = t * 0.34 + tx * 0.6;
      wire.rotation.copy(knot.rotation);
      wire.scale.setScalar(1 + Math.sin(t * 1.2) * 0.02);
      cubes.forEach((c) => {
        c.position.y += Math.sin(t * c.userData.s + c.userData.a) * 0.002;
        c.rotation.x += 0.01; c.rotation.y += 0.012;
      });
      camera.position.x = camBase.x + tx * 0.42;
      camera.position.y = camBase.y - ty * 0.26;
      camera.position.z = camBase.z;
      camera.lookAt(lookTarget);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      renderer.dispose();
      knotGeo.dispose(); knotMat.dispose();
      wireGeo.dispose(); wireMat.dispose();
      cubes.forEach(c => { c.geometry.dispose(); c.material.dispose(); });
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);
  return (
    <div className="canvas-wrap" ref={mountRef}>
      <div className="overlay">
        <span className="tag"><span className="d"></span>LIVE · STAGE</span>
      </div>
    </div>
  );
}

// ---------- Hero ----------
function Hero() {
  return (
    <section className="hero">
      <div className="bg">
        <div className="frame" />
        <div className="pixels" />
        <div className="stripes" />
      </div>
      <div className="stage3d" aria-hidden="true">
        <Hero3D />
      </div>
      <div className="hero-veil" aria-hidden="true" />
      <div className="content">
        <div className="meta-top">
          <span className="pill"><span className="d"></span>INDIA&apos;S AI FILM HOUSE</span>
        </div>
        <h1>
          <span className="strike">WEEKS.</span><br />
          <span className="strike">CREWS.</span><br />
          <span className="strike">MILLIONS.</span><br />
          <em className="glitch" data-t="NOW DAYS.">NOW DAYS.</em>
        </h1>
        <p className="sub">
          What used to take a <b>60-person crew</b>, months of prep, shoot, and finishing, and a <b>seven-figure</b> budget — <b>we deliver in days</b> with four people. Ad films. Brand films. Social. Titles. <b>No cameras required.</b>
        </p>
        <div className="cta-row">
          <a className="primary" href="#contact">GET A QUOTE IN 24H <span className="arr">→</span></a>
          <a className="secondary" href="#work">SEE OUR WORK</a>
        </div>
        <div className="metrics">
          <div className="m"><div className="v"><em>10×</em> faster</div><div className="k">avg. turnaround vs. traditional</div></div>
          <div className="m"><div className="v"><em>1/100</em> cost</div><div className="k">of a comparable shoot</div></div>
          <div className="m"><div className="v"><em>4</em> people</div><div className="k">one studio · zero crew</div></div>
        </div>
      </div>
      <div className="hero-hint">◉ MOVE YOUR CURSOR</div>
    </section>
  );
}

// ---------- Ticker ----------
function Ticker() {
  const items = [
    { strike: "MILLIONS", plain: "THOUSANDS" },
    { strike: "MONTHS", plain: "DAYS" },
    { strike: "60 CREW", plain: "4 DIRECTORS" },
    { strike: "3 SHOOT DAYS", plain: "1 RENDER PASS" },
    { strike: "LOCATION VANS", plain: "LATENT STAGE" },
  ];
  const all = [...items, ...items, ...items];
  return (
    <div className="ticker">
      <div className="ticker-track">
        {all.map((it, i) => (
          <span key={i} className="item">
            <span className="dot"></span>
            <span className="strike">{it.strike}</span>
            <span>→</span>
            <span>{it.plain}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Marquee({ items }) {
  const all = [...items, ...items, ...items];
  return (
    <div className="marquee">
      <div className="marquee-track">
        {all.map((t, i) => <span key={i} className="item"><span className="dot"></span>{t}</span>)}
      </div>
    </div>
  );
}

// ---------- Value — old vs new ----------
function Value() {
  return (
    <section className="section" id="value">
      <div className="wrap">
        <div className="hd">
          <span className="n">01 / VALUE</span>
          <h2>The math<br />has <em>changed.</em></h2>
          <span className="sub">Same frame. Same polish. A different century of production.</span>
        </div>
        <div className="vs-grid">
          <div className="vs old">
            <div className="tag"><span className="d"></span>THE OLD WAY</div>
            <h3>FILM SCHOOL<br />BUDGETS.</h3>
            <div className="rows">
              <div className="r"><span className="k">Timeline</span><span className="v">8—16 weeks</span></div>
              <div className="r"><span className="k">Budget</span><span className="v">₹40L — ₹5Cr</span></div>
              <div className="r"><span className="k">Crew</span><span className="v">40—80 people</span></div>
              <div className="r"><span className="k">Locations</span><span className="v">permits, vans, catering</span></div>
              <div className="r"><span className="k">Revisions</span><span className="v">re-shoot or regret</span></div>
              <div className="r"><span className="k">Output</span><span className="v">one hero spot</span></div>
            </div>
          </div>
          <div className="vs new">
            <div className="tag"><span className="d"></span>RED STUDIOS</div>
            <h3>RENDERED.<br />DELIVERED.</h3>
            <div className="rows">
              <div className="r"><span className="k">Timeline</span><span className="v">5—21 days, door to door</span></div>
              <div className="r"><span className="k">Budget</span><span className="v">₹40k — ₹5L</span></div>
              <div className="r"><span className="k">Crew</span><span className="v">4 directors · one studio</span></div>
              <div className="r"><span className="k">Locations</span><span className="v">anywhere you can describe</span></div>
              <div className="r"><span className="k">Revisions</span><span className="v">re-render overnight</span></div>
              <div className="r"><span className="k">Output</span><span className="v">the hero + 12 cut-downs</span></div>
            </div>
          </div>
        </div>
        <div className="big-quote">
          <p>"A ten lakh idea shouldn't need a two crore budget. <span className="hl">We render what you imagined</span> — before your next stand-up."</p>
          <div className="who"><b>— THE STUDIO</b><br />red studios · india</div>
        </div>
      </div>
    </section>
  );
}

// ---------- Services ----------
const SERVICES = [
  { id: "01", t: "AD FILMS", d: "Performance spots that outperform the test group. Scripted, directed, color-graded — ready for broadcast or the feed.", meta: ["15s — 90s"] },
  { id: "02", t: "BRAND FILMS", d: "Manifestos, founder stories, origin reels. The film you pin to the top of your homepage and never take down.", meta: ["60s — 5m"] },
  { id: "03", t: "SOCIAL REELS", d: "Native vertical volume. A month of scroll-stopping content rendered in a single week. Enough for every channel you run.", meta: ["IG · TT · YT"] },
  { id: "04", t: "TITLES & VFX", d: "Opening sequences, logo idents, plate-replacement and impossible shots. Cinema finish on any timeline.", meta: ["PRORES · MP4 · TRANSPARENT"] },
];
function Services() {
  return (
    <section className="section" id="services">
      <div className="wrap">
        <div className="hd">
          <span className="n">02 / SERVICES</span>
          <h2>Four lanes.<br /><em>One studio.</em></h2>
          <span className="sub">Pick your format. We'll render it by Friday.</span>
        </div>
        <div className="services">
          {SERVICES.map(s => (
            <div className="svc" key={s.id}>
              <div>
                <div className="id">SVC · {s.id}</div>
                <h3>{s.t}</h3>
                <p className="desc">{s.d}</p>
              </div>
              <div className="meta"><span>{s.meta[0]}</span></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- Portfolio (Drive previews; ids from share links) ----------
const PORTFOLIO = [
  { id: 21, t: "FLIPKART", c: "AD FILM", client: "Flipkart", dur: "—", cat: "bsc", driveFileId: "1ii4qIy9jQhSbUi397UQcQlk8dcMoQ5cs", videoFile: "filpkart.mp4" },
  { id: 21, t: "FLIPKART", c: "AD FILM", client: "Flipkart", dur: "—", cat: "bsc", driveFileId: "1ii4qIy9jQhSbUi397UQcQlk8dcMoQ5cs", videoFile: "flipkart3.mp4" },
  { id: 21, t: "FLIPKART", c: "AD FILM", client: "Flipkart", dur: "—", cat: "bsc", driveFileId: "1ii4qIy9jQhSbUi397UQcQlk8dcMoQ5cs", videoFile: "flipkart2.mp4" },
  { id: 18, t: "NIKE", c: "AD FILM", client: "Nike", dur: "—", cat: "ad", driveFileId: "1uhugGYg3VAcPGZn_MENusuh09fCr7Gcg", videoFile: "WhatsApp Video 2026-07-01 at 6.34.03 PM.mp4" },
  { id: 19, t: "NIKE", c: "CLIP", client: "BSC", dur: "—", cat: "bsc", driveFileId: "1YFrbeMEiB3iDqvGhVwpzcgN9q1s59gyK", videoFile: "WhatsApp Video 2026-07-01 at 6.34.08 PM.mp4" },
  { id: 20, t: "LAY'S", c: "AD FILM", client: "BSC", dur: "—", cat: "bsc", driveFileId: "1-rvouNYeLnrTrCy94oGUrqQVrFR7UDDN", videoFile: "WhatsApp Video 2026-07-01 at 6.34.09 PM.mp4" },
  { id: 22, t: "MARKI", c: "CLIP", client: "BSC", dur: "—", cat: "bsc", driveFileId: "1fIozwSzlidNFENuOSy6Xx-lmtfvkDZ40", videoFile: "MARKI's (advertisement).mp4" },
  { id: 17, t: "BAAN PHAD THAI ", c: "SOCIAL", client: "BSC", dur: "—", cat: "bsc", driveFileId: "1wlXyi-gwwX_P3cmGiPQeRwJCUgoXgkX-", videoFile: "WhatsApp Video 2026-07-01 at 6.33.30 PM.mp4" },
  { id: 1, t: "AI SMASHGUYS", c: "SOCIAL", client: "Smash Guys", dur: "—", cat: "social", driveFileId: "1yvk4QcxoZ1dLVD2sv5JaGGrEKuJ5fLZJ", videoFile: "ai smashguys_.mp4" },
  { id: 4, t: "BIG MISHRA (ALT)", c: "SOCIAL", client: "Big Mishra", dur: "—", cat: "social", driveFileId: "1ZQFRM1jzP-5AF1eBC1x52NTl7GIT9p4M", videoFile: "Big mishra Ai reel changed.mp4" },
  { id: 5, t: "HF 073652", c: "CLIP", client: "Render", dur: "—", cat: "social", driveFileId: "1jCl8SH-sBMrhl-0ekOEh21vmmCAEDXRz", videoFile: "hf_20260207_073652_de7f4965-6c37-447e-a466-a77726abf560.mp4" },
  { id: 7, t: "IMG 1384", c: "BRAND", client: "Studio", dur: "—", cat: "brand", driveFileId: "1pKb52p-_TgNOUeK4lpGUeda6u-okOTTC", videoFile: "IMG_1384.mp4" },
  { id: 11, t: "LENSKART", c: "AD FILM", client: "Lenskart", dur: "—", cat: "ad", driveFileId: "1AhOYBVAxbTnWC6HwgHcbN7v5SMgNit6S", videoFile: "Lenskart.mp4" },
  { id: 12, t: "MEETHA BHARAT DIWALI", c: "SOCIAL", client: "Campaign", dur: "—", cat: "social", driveFileId: "1xpNOUZWx4xpoWRyxLUR148JxQj_gSdtZ", videoFile: "meetha Bharat Diwali AI reel 2..mp4" },
  { id: 13, t: "PARIS PANINI", c: "AD FILM", client: "Paris Panini", dur: "—", cat: "ad", driveFileId: "1N4y5Xy024WTXRUBLxgUNmmaWyJFc1Sme", videoFile: "paris panini.mp4" },
  { id: 15, t: "KING ICE CREAM", c: "SOCIAL", client: "King Ice Cream", dur: "—", cat: "social", driveFileId: "1LXE7DHiZg-TKuhAiPY-6-cu4wIw_FFYR", videoFile: "Video-680.mp4" },
  { id: 16, t: "KING ICE CREAM 2", c: "SOCIAL", client: "King Ice Cream", dur: "—", cat: "social", driveFileId: "1jNwqzunpkzn6JP3uw6cDZ4-a-pBIwSOb", videoFile: "Video-938.mp4" },
];
const FILTERS = [
  { k: "all", l: "All" },
  { k: "ad", l: "Ad Films" },
  { k: "brand", l: "Brand" },
  { k: "social", l: "Social" },
  { k: "title", l: "Titles · VFX" },
  { k: "bsc", l: "BSC" },
];

// ---------- Lazy loading video component ----------
function LazyVideo({ src, poster, muted, className, onError }) {
  const videoRef = useRef(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting) {
          setHasLoaded(true);
        }
      },
      {
        rootMargin: "200px",
        threshold: 0.05
      }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!videoRef.current || !hasLoaded) return;
    if (isIntersecting) {
      videoRef.current.play().catch(err => {
        console.warn("Autoplay blocked:", err);
      });
    } else {
      videoRef.current.pause();
    }
  }, [isIntersecting, hasLoaded]);

  return (
    <video
      ref={videoRef}
      className={className}
      src={hasLoaded ? src : undefined}
      poster={poster}
      loop
      muted={muted}
      playsInline
      onError={onError}
    />
  );
}

function Portfolio() {
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(null);
  const [failedThumbIds, setFailedThumbIds] = useState(() => new Set());
  const [failedVideoIds, setFailedVideoIds] = useState(() => new Set());
  const [unmutedVideoId, setUnmutedVideoId] = useState(null);
  const list = useMemo(() => filter === "all" ? PORTFOLIO : PORTFOLIO.filter(p => p.cat === filter), [filter]);
  const markThumbFailed = useCallback((id) => {
    setFailedThumbIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setOpen((o) => (o && o.id === id ? null : o));
  }, []);
  const markVideoFailed = useCallback((id) => {
    setFailedVideoIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);
  const toggleMute = useCallback((e, id) => {
    e.stopPropagation();
    setUnmutedVideoId((prev) => (prev === id ? null : id));
  }, []);
  const visible = useMemo(() => list.filter((p) => !p.driveFileId || !failedThumbIds.has(p.id)), [list, failedThumbIds]);
  return (
    <section className="section" id="work">
      <div className="wrap">
        <div className="hd">
          <span className="n">03 / WORK</span>
          <h2>Our <em>work</em>.</h2>
          <span className="sub">Frames from films that don&apos;t exist yet. · click any tile</span>
        </div>
        <div className="pf-controls">
          <div className="pf-tabs">
            {FILTERS.map(f => <button key={f.k} className={filter === f.k ? "on" : ""} onClick={() => setFilter(f.k)}>{f.l}</button>)}
          </div>
        </div>
        <div className="pf-grid">
          {visible.map((p, i) => (
            <div key={p.id} className={"reel-card" + (p.cat === "bsc" ? " reel-card-bsc" : "")} onClick={() => setOpen(p)}>
              {p.videoFile && !failedVideoIds.has(p.id) ? (
                <LazyVideo
                  className="v drive-thumb"
                  src={"assets/videos/optimized-web/" + p.videoFile}
                  poster={p.driveFileId ? driveThumbnailUrl(p.driveFileId) : undefined}
                  muted={unmutedVideoId !== p.id}
                  onError={() => markVideoFailed(p.id)}
                />
              ) : p.driveFileId ? (
                <img
                  className="v drive-thumb"
                  src={driveThumbnailUrl(p.driveFileId)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={() => markThumbFailed(p.id)}
                  onLoad={(e) => {
                    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
                    if (w < 16 && h < 16) markThumbFailed(p.id);
                  }}
                />
              ) : null}
              {p.videoFile && !failedVideoIds.has(p.id) && (
                <button className="mute-btn" onClick={(e) => toggleMute(e, p.id)}>
                  {unmutedVideoId === p.id ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 5L6 9H2v6h4l5 4V5z" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 5L6 9H2v6h4l5 4V5z" />
                      <line x1="23" y1="9" x2="17" y2="15" />
                      <line x1="17" y1="9" x2="23" y2="15" />
                    </svg>
                  )}
                </button>
              )}
              <div className="ph">[ {p.t.replace(/\s+/g, "_")} ]</div>
              <div className="badge"><span className="dot"></span>{p.cat === "bsc" ? "BSC" : "REEL"}</div>
              <div className="num">{String(i + 1).padStart(2, "0")} / {String(visible.length).padStart(2, "0")}</div>
              <div className="meta">
                <div className="ttl">{p.t}</div>
                <div className="row"><span>{p.c}</span><span>{p.dur}</span></div>
                <div className="row row-client"><span>{p.client}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={"lightbox" + (open ? " on" : "")} onClick={() => setOpen(null)}>
        {open && (
          <>
            <button className="close" onClick={() => setOpen(null)}>CLOSE <span className="x">×</span></button>
            <div className="frame frame-drive" onClick={e => e.stopPropagation()}>
              {open.videoFile ? (
                <video
                  className="drive-embed"
                  title={open.t}
                  src={"assets/videos/optimized-web/" + open.videoFile}
                  autoPlay
                  loop
                  muted={false}
                  playsInline
                  controls
                />
              ) : open.driveFileId ? (
                <iframe className="drive-embed" title={open.t} src={"https://drive.google.com/file/d/" + open.driveFileId + "/preview"} allowFullScreen />
              ) : (
                <div className="ph ph-lightbox">
                  <span>VIDEO NOT AVAILABLE</span>
                </div>
              )}
            </div>
            <div className="info">{open.t} · <b>{open.client}</b> · {open.c} · {open.dur}</div>
          </>
        )}
      </div>
    </section>
  );
}

// ---------- Process ----------
const PROCESS = [
  { n: "01", step: "DAY 01", t: "BRIEF", d: "30-minute call. You talk, we listen. We leave with a one-page direction and a locked seed.", term: "$ rs init --brief" },
  { n: "02", step: "DAY 02—04", t: "DIRECTION", d: "Storyboards, look-dev plates, style frames. You approve the film before it's made.", term: "$ rs preview --v1" },
  { n: "03", step: "DAY 05—10", t: "RENDER", d: "Generative pass + studio finish. Color, sound, grain, typography. Overnight revisions, no re-shoots.", term: "$ rs render --final" },
  { n: "04", step: "DAY 11", t: "DELIVERY", d: "ProRes master, 9:16 / 1:1 / 16:9 cut-downs, transparent logos. Every channel, day one.", term: "$ rs ship --all" },
];
function Process() {
  return (
    <section className="section" id="process">
      <div className="wrap">
        <div className="hd">
          <span className="n">04 / PROCESS</span>
          <h2>Brief Monday.<br /><em>Live by Friday.</em></h2>
          <span className="sub">A fortnight, start to finish. Some weeks faster.</span>
        </div>
        <div className="process">
          {PROCESS.map(p => (
            <div key={p.n} className="proc">
              <div className="num">{p.n}</div>
              <div>
                <div className="step">{p.step}</div>
                <h3>{p.t}</h3>
                <p className="desc">{p.d}</p>
              </div>
              <div className="term"><b>&gt;</b> {p.term}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- Clients (logos: assets/clients — replace placeholder SVGs with official brand assets when licensed) ----------
const CLIENTS = [
  { cat: "F&B", logo: "assets/clients/flipkart.png", name: "FLIPKART" },
  { cat: "F&B", logo: "assets/clients/CrepdogCrew.avif", name: "CREP DOG CREW" },
  { cat: "F&B", logo: "assets/clients/marki.png", name: "MARKI'S" },
  { cat: "F&B", logo: "assets/clients/Baan Phad Thai.jpg", name: "BAAN PAD THAI" },
  { cat: "F&B", logo: "assets/clients/mishra-pedha.png", name: "MISHRA PEDHA" },
  { cat: "DAIRY", logo: "assets/clients/adityaa-milk.png", name: "ADITYAA MILK" },
  { cat: "F&B", logo: "assets/clients/smash-guys.png", name: "SMASH GUYS" },
  { cat: "F&B", logo: "assets/clients/paris-panini.png", name: "PARIS PANINI" },
  { cat: "F&B", logo: "assets/clients/pizza-bakery.png", name: "THE PIZZA BAKERY" },
  { cat: "F&B", logo: "assets/clients/king-ice-cream.png", name: "KING ICE CREAM" },

];
function Clients() {
  return (
    <section className="section" id="clients">
      <div className="wrap">
        <div className="hd">
          <span className="n">05 / CLIENTS</span>
          <h2>In <em>the room</em>.</h2>
          <span className="sub">What used to take <em>months</em>, we do in a <em>week</em>. · hover to decode where marked</span>
        </div>
        <div className="clients">
          {CLIENTS.map((c, i) => (
            <div className={"client" + (c.logo ? " client-has-logo" : "")} key={i}>
              <span className="num">{String(i + 1).padStart(3, "0")}</span>
              <span className="badge">{c.cat}</span>
              {c.logo ? (
                <img className="client-logo" src={c.logo} alt={c.name || ""} loading="lazy" />
              ) : (
                <Scramble text={c.scramble} duration={520} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- Big CTA band ----------
function CTABand() {
  return (
    <section className="cta-band">
      <div className="wrap">
        <div>
          <div className="lead">Got a script?<br /><em>Get a film.</em><br />By next week.</div>
          <p className="sub">Reply by midnight IST. First direction inside 48 hours. We only take on what we can deliver.</p>
        </div>
        <div className="cta-col">
          <a className="big-cta" href="#contact">START A BRIEF <span className="arr">→</span></a>
        </div>
      </div>
    </section>
  );
}

// ---------- Contact ----------
function Contact() {
  const [form, setForm] = useState({ name: "", handle: "", company: "", project: "Ad Film", budget: "₹1L — ₹5L", brief: "" });
  const update = k => e => setForm({ ...form, [k]: e.target.value });
  function submit(e) {
    e.preventDefault();
    const lines = [
      "— Red Studios · brief —",
      "NAME: " + form.name.trim(),
      "HANDLE: " + form.handle.trim(),
      "COMPANY: " + (form.company.trim() || "—"),
      "TYPE: " + form.project,
      "BUDGET: " + form.budget,
      "",
      form.brief.trim(),
    ];
    const url = "https://wa.me/" + BRIEF_WHATSAPP_E164 + "?text=" + encodeURIComponent(lines.join("\n"));
    window.open(url, "_blank", "noopener,noreferrer");
  }
  return (
    <section className="section contact-section" id="contact">
      <div className="wrap">
        <div className="hd">
          <span className="n">06 / CONTACT</span>
          <h2>Send the <em>brief</em>.</h2>
          <span className="sub">We reply in under 24 hours. No forms ghosted.</span>
        </div>
        <div className="contact-wrap">
          <div className="contact-side">
            <div className="head"><span className="dot"></span>STUDIO · ONLINE</div>
            <div className="row"><span>PHONE</span><b className="contact-phones"><a href="tel:+919731865049">+91 97318 65049</a><br /><a href="tel:+918861596468">+91 88615 96468</a></b></div>
            <div className="row"><span>INSTAGRAM</span><b><a href="https://www.instagram.com/redstudios.ai/?hl=en" target="_blank" rel="noopener noreferrer">@redstudios.ai</a></b></div>
            <div className="row"><span>RESPONSE</span><b>≤ 24 HOURS</b></div>
          </div>
          <div className="terminal">
            <div className="term-bar">
              <div className="lights"><span></span><span></span><span></span></div>
              <span>BRIEF_INTAKE.TERMINAL</span>
              <span>v1.0</span>
            </div>
            <form className="term-body" onSubmit={submit}>
              <div className="line"><span className="k">&gt; NAME</span><input required value={form.name} onChange={update("name")} placeholder="Your name" /></div>
              <div className="line"><span className="k">&gt; HANDLE</span><input required type="text" value={form.handle} onChange={update("handle")} placeholder="Instagram / WhatsApp / other" /></div>
              <div className="line"><span className="k">&gt; COMPANY</span><input value={form.company} onChange={update("company")} placeholder="Brand or studio" /></div>
              <div className="line"><span className="k">&gt; TYPE</span>
                <select value={form.project} onChange={update("project")}>
                  <option>Ad Film</option><option>Brand Film</option><option>Social Reels</option><option>Title Sequence / VFX</option><option>Other</option>
                </select>
              </div>
              <div className="line"><span className="k">&gt; BUDGET</span>
                <select value={form.budget} onChange={update("budget")}>
                  <option>{"< ₹1L"}</option><option>₹1L — ₹5L</option><option>₹5L — ₹15L</option><option>₹15L+</option><option>To discuss</option>
                </select>
              </div>
              <div className="line" style={{ alignItems: "flex-start" }}>
                <span className="k">&gt; BRIEF</span>
                <textarea required value={form.brief} onChange={update("brief")} placeholder="Tell us what you want to make. References welcome." />
              </div>
              <div className="submit-row">
                <span className="meta">OPENS WHATSAPP · FINISH SEND THERE</span>
                <button className="submit" type="submit">SEND VIA WHATSAPP <span>▶</span></button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Footer ----------
function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="ft-brand">
          <span className="logo-glitch-wrap ft-logo-wrap">
            <img className="ft-logo logo-glitch-img" src="assets/logo.png" alt="Red Studios" />
          </span>
          <div className="tag">India's AI film house.<br />Lights. Camera. Compute.</div>
        </div>
        <div className="col">
          <h4>Studio</h4>
          <a href="#work">Work</a><a href="#services">Services</a><a href="#process">Process</a><a href="#clients">Clients</a>
        </div>
        <div className="col">
          <h4>Contact</h4>
          <a href="https://www.instagram.com/redstudios.ai/?hl=en" target="_blank" rel="noopener noreferrer">@redstudios.ai</a>
          <a href="tel:+919731865049">+91 97318 65049</a>
          <a href="tel:+918861596468">+91 88615 96468</a>
        </div>
        <div className="col">
          <h4>Index</h4>
          <a href="#">Reel 2026</a><a href="#">Press kit</a><a href="#">Careers</a>
        </div>
      </div>
      <div className="ft-bot">
        <span>© 2026 RED STUDIOS · INDIA</span>
        <span>NO FRAMES WERE SHOT IN THE MAKING OF THIS WEBSITE</span>
        <span>END / / /</span>
      </div>
    </footer>
  );
}

// ---------- Sticky mobile CTA ----------
function StickyCTA() {
  return (
    <div className="sticky-cta">
      <div className="t">Get a quote in 24h<small>REPLY WITHIN 24H · IST</small></div>
      <a href="#contact">BRIEF →</a>
    </div>
  );
}

// ---------- App ----------
function App() {
  return (
    <>
      <HUD />
      <Nav />
      <Hero />
      <Ticker />
      <Clients />
      <Portfolio />
      <Value />
      <Services />
      <Marquee items={["OUR WORK ↓", "FRAMES FROM FILMS THAT DON'T EXIST YET", "AD · BRAND · SOCIAL · TITLES", "PRESS ANY TILE TO PLAY"]} />

      <Process />

      <CTABand />
      <Contact />
      <Footer />
      <StickyCTA />
    </>
  );
}

Object.assign(window, { App, HUD, Nav, Hero, Hero3D, Ticker, Marquee, Value, Services, Portfolio, Process, Clients, CTABand, Contact, Footer, StickyCTA, Scramble });
