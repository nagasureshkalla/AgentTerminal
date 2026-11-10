(() => {
  "use strict";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none)").matches;

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- Particle network background ---------- */
  const canvas = document.getElementById("bg");
  const ctx = canvas.getContext("2d");
  let w, h, particles = [];
  const mouse = { x: -9999, y: -9999 };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + "px"; canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(110, Math.floor((w * h) / 14000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.8 + 0.6,
    }));
  }

  function drawParticles() {
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 120 && dist > 0) { p.x += (dx / dist) * 1.5; p.y += (dy / dist) * 1.5; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(200,200,255,0.7)";
      ctx.fill();
    }
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 120) {
          ctx.strokeStyle = `rgba(120,115,245,${(1 - d / 120) * 0.35})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    if (!reduceMotion) requestAnimationFrame(drawParticles);
  }
  resize();
  window.addEventListener("resize", resize);
  drawParticles();

  /* ---------- Cursor glow ---------- */
  const glow = document.querySelector(".cursor-glow");
  let gx = 0, gy = 0, tx = 0, ty = 0;
  window.addEventListener("pointermove", (e) => {
    tx = e.clientX; ty = e.clientY; mouse.x = e.clientX; mouse.y = e.clientY;
  });
  window.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });
  (function moveGlow() {
    gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
    glow.style.transform = `translate(${gx - 210}px, ${gy - 210}px)`;
    requestAnimationFrame(moveGlow);
  })();

  /* ---------- Nav + scroll progress ---------- */
  const nav = document.querySelector(".nav");
  const progress = document.querySelector(".progress");
  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    nav.classList.toggle("scrolled", window.scrollY > 30);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Typing word rotator ---------- */
  const typed = document.getElementById("typed");
  const words = ["motion", "magic", "delight", "experiences", "the future"];
  let wi = 0, ci = words[0].length, deleting = true;
  function type() {
    const word = words[wi];
    typed.textContent = word.slice(0, ci);
    let delay = deleting ? 60 : 110;
    if (deleting) {
      ci--;
      if (ci < 0) { deleting = false; wi = (wi + 1) % words.length; ci = 0; delay = 300; }
    } else {
      ci++;
      if (ci > words[wi].length) { deleting = true; ci = words[wi].length; delay = 1800; }
    }
    setTimeout(type, delay);
  }
  if (!reduceMotion) setTimeout(type, 2200);

  /* ---------- Reveal on scroll + counters ---------- */
  function animateCount(el) {
    const target = +el.dataset.target;
    const suffix = el.dataset.suffix || "";
    const duration = 1600;
    const start = performance.now();
    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(step);
    }
    if (reduceMotion) el.textContent = target + suffix;
    else requestAnimationFrame(step);
  }

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("visible");
      entry.target.querySelectorAll(".count").forEach(animateCount);
      io.unobserve(entry.target);
    }
  }, { threshold: 0.15 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  /* ---------- 3D tilt cards with spotlight ---------- */
  if (!isTouch && !reduceMotion) {
    document.querySelectorAll(".tilt").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.transform = `perspective(800px) rotateX(${(0.5 - y) * 14}deg) rotateY(${(x - 0.5) * 14}deg) translateY(-4px)`;
        card.style.setProperty("--mx", `${x * 100}%`);
        card.style.setProperty("--my", `${y * 100}%`);
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });

    /* ---------- Magnetic buttons ---------- */
    document.querySelectorAll(".magnetic").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
      });
      btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
    });
  }

  /* ---------- Contact form (demo only, nothing is sent) ---------- */
  const form = document.getElementById("contact-form");
  const note = document.getElementById("form-note");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.elements.name.value.trim();
    note.textContent = `Thanks${name ? ", " + name : ""}! ✨ (Demo form — nothing was sent.)`;
    form.reset();
  });
})();
