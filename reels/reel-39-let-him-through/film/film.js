// Reel 39 · Let Him Through? (working title). Tests desk, an episode of "You're the test subject".
// You're the passport officer at a departures desk, in POV. Five men step up to your glass, one at a time, and you hold
// each one's passport up beside his face. One of them is flying on someone else's passport: pick who to stop. The worst
// match is innocent (his photo is nine years old); one of the two perfect matches is a stranger (his brother's passport),
// and the only thing that gives him away is his ears. Story and timing: docs/script.md. Facts: docs/research.md.
// Our own drawings; nobody real; no real passport, airline or airport. 30 fps. Every frame is sealed in save()/restore(),
// and every scene is a pure function of t (no timers, no Math.random, nothing kept between frames).
(() => {
  const { W, H, scene, canvas, clamp, lerp } = C;
  const RG = window.RIG, F = window.FACE, M = window.CAST.MEN, K = window.KIT;
  const { sstep, mix, rgba, TAU, PI } = RG;
  const { clear, hit } = K;
  C.fonts = ['700 condensed 100px Bahn', '700 semi-condensed 46px Bahn', '600 semi-condensed 64px Bahn', '400 30px Mono', '700 30px Mono'];
  const INK = '#14130f', YEL = '#ffd34a', CREAM = '#fff6e2', RED = '#e2301a', NAVY = '#1d2a44', PLUM = '#4a2f5c';
  const ease = (u) => { u = clamp(u); return u * u * u * (u * (u * 6 - 15) + 10); };
  const sg = (t, a, b) => ease((t - a) / (b - a));
  const T = (m) => C.bt(m);
  const NA = C.noise1(3901), NB = C.noise1(3902), NC = C.noise1(3903);

  // ------------------------------------------------------------------ canvas helpers (the series' own, from reels 20–37)
  const font = (size, kind = 'cond') => (kind === 'cond' ? `700 condensed ${size}px Bahn` : kind === 'semi' ? `700 semi-condensed ${size}px Bahn` : kind === 'mono' ? `700 ${size}px Mono` : `400 ${size}px Mono`);
  function txt(g, s, x, y, size, color = INK, o = {}) {
    g.save();
    g.font = font(size, o.kind || 'cond'); g.fillStyle = color; g.textAlign = o.align || 'left'; g.textBaseline = 'alphabetic';
    g.globalAlpha *= o.a ?? 1;
    if ('letterSpacing' in g) g.letterSpacing = (o.ls ?? 0) + 'px';
    if (o.fit) { const w = g.measureText(s).width; if (w > o.fit) { size *= o.fit / w; g.font = font(size, o.kind || 'cond'); } }
    if (o.rot) { g.translate(x, y); g.rotate(o.rot); x = 0; y = 0; }
    if (o.stroke) { g.lineJoin = 'round'; g.strokeStyle = o.stroke; g.lineWidth = size * (o.sw ?? 0.12); g.strokeText(s, x, y); }
    g.fillText(s, x, y);
    g.restore();
  }
  const RR = (g, x, y, w, h, r = 0) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  const pop = (t, t0) => clamp(hit(t, t0, 'heavy'));
  function title(g, s, y, size, color, t, t0, o = {}) {            // a caption that lands with a small spring
    if (t < t0) return;
    const q = t0 <= 0 ? 1 : pop(t, t0);
    g.save(); g.translate(o.x ?? 540, y); g.scale(lerp(0.86, 1, q), lerp(0.86, 1, q));
    txt(g, s, 0, 0, size, color, { align: 'center', fit: o.fit ?? 880, stroke: o.stroke ?? INK, sw: o.sw ?? 0.14, a: (t0 <= 0 ? 1 : clamp((t - t0) * 14)) * (o.a ?? 1) });
    g.restore();
  }
  function tileNo(g, x, y, n, s = 72, a = 1) { if (a <= 0.003) return; g.save(); g.globalAlpha *= a; RR(g, x - s / 2, y - s / 2, s, s, s * 0.14); g.fillStyle = '#121212'; g.fill(); g.strokeStyle = CREAM; g.lineWidth = Math.max(2, s * 0.07); g.stroke(); txt(g, String(n), x, y + s * 0.3, s * 0.82, '#fff9ea', { kind: 'mono', align: 'center' }); g.restore(); }
  function ring(g, x, y, r, k, lw = 14, col = YEL) {
    if (k <= 0) return;
    g.save(); g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = lw + 9; g.beginPath(); g.arc(x, y, r, -PI / 2, -PI / 2 + TAU * k); g.stroke();
    g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.arc(x, y, r, -PI / 2, -PI / 2 + TAU * k); g.stroke(); g.restore();
  }
  const offscreen = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const BUFS = []; const buf = (i) => BUFS[i] || (BUFS[i] = offscreen(W, H));
  const fresh = (c) => { const q = c.getContext('2d'); q.setTransform(1, 0, 0, 1, 0, 0); q.globalAlpha = 1; q.globalCompositeOperation = 'source-over'; q.filter = 'none'; q.clearRect(0, 0, W, H); return q; };
  // blinks: each man on his own clock; a blink is 4 frames shut-ish
  function blinkAt(t, i, period = 3.6) { const u = ((t + 0.7 + i * 1.37) % period + period) % period; return u < 0.06 ? sstep(0, 0.06, u) : u < 0.15 ? 1 - sstep(0.08, 0.15, u) : 0; }

  // ------------------------------------------------------------------ the hall behind the glass
  const WALL = '#ece3d2', WALL2 = '#ddd0b9', FLOOR = '#d6cdbf';
  function hall(g, t, o = {}) {
    const dx = o.dx || 0;
    g.save(); g.translate(dx, 0);
    const wq = g.createLinearGradient(0, 0, 0, 1180); wq.addColorStop(0, '#f4ecdc'); wq.addColorStop(1, WALL2); g.fillStyle = wq; g.fillRect(-200, 0, W + 400, 1180);
    // a band of windows on the far wall: evening sky, the apron, a tail fin that's nobody's
    const wy0 = 470, wy1 = 900;
    g.save(); g.beginPath(); g.rect(-200, wy0, W + 400, wy1 - wy0); g.clip();
    const sq = g.createLinearGradient(0, wy0, 0, wy1); sq.addColorStop(0, '#7fb2d8'); sq.addColorStop(0.62, '#f2c9a2'); sq.addColorStop(1, '#f7dcb8'); g.fillStyle = sq; g.fillRect(-200, wy0, W + 400, wy1 - wy0);
    g.fillStyle = '#9aa3ad'; g.fillRect(-200, wy1 - 70, W + 400, 70);                          // the apron
    g.fillStyle = '#f6f3ee'; g.beginPath(); g.moveTo(760, wy1 - 70); g.lineTo(830, wy0 + 80); g.lineTo(905, wy0 + 80); g.lineTo(930, wy1 - 70); g.closePath(); g.fill();   // a tail fin
    g.fillStyle = '#3f6fae'; g.beginPath(); g.moveTo(808, wy0 + 170); g.lineTo(835, wy0 + 95); g.lineTo(902, wy0 + 95); g.lineTo(912, wy0 + 170); g.closePath(); g.fill();
    g.fillStyle = '#f6f3ee'; g.beginPath(); g.ellipse(660, wy1 - 105, 330, 46, 0, 0, TAU); g.fill();            // the fuselage, beyond
    g.fillStyle = '#2e3440'; for (let i = 0; i < 9; i++) { g.beginPath(); g.roundRect(390 + i * 52, wy1 - 118, 22, 16, 6); g.fill(); }
    g.restore();
    g.strokeStyle = '#b9ab92'; g.lineWidth = 10; for (let x = -160; x < W + 300; x += 210) { g.beginPath(); g.moveTo(x, wy0); g.lineTo(x, wy1); g.stroke(); }
    g.fillStyle = '#c9bba2'; g.fillRect(-200, wy0 - 12, W + 400, 14); g.fillRect(-200, wy1, W + 400, 16);
    // the floor, and the lane of belts the queue stands in
    const fq = g.createLinearGradient(0, 1000, 0, 1500); fq.addColorStop(0, '#e2dace'); fq.addColorStop(1, FLOOR); g.fillStyle = fq; g.fillRect(-200, 990, W + 400, 700);
    g.strokeStyle = 'rgba(120,110,95,0.18)'; g.lineWidth = 3; for (let i = 0; i < 6; i++) { const y = 1010 + i * i * 14; g.beginPath(); g.moveTo(-200, y); g.lineTo(W + 200, y); g.stroke(); }
    for (const [x, y, s] of [[-40, 1010, 0.62], [140, 1030, 0.72], [330, 1052, 0.84]]) {          // belt posts, receding to the left
      g.fillStyle = '#8d939b'; g.fillRect(x - 5 * s, y - 120 * s, 10 * s, 120 * s); g.fillStyle = '#5b6168'; g.beginPath(); g.ellipse(x, y, 22 * s, 7 * s, 0, 0, TAU); g.fill();
      g.fillStyle = '#c2c7cd'; g.beginPath(); g.arc(x, y - 122 * s, 9 * s, 0, TAU); g.fill();
    }
    g.strokeStyle = '#3d63a8'; g.lineWidth = 9; g.beginPath(); g.moveTo(-40, 1010 - 0.62 * 108); g.quadraticCurveTo(50, 1010 - 0.62 * 92, 140, 1030 - 0.72 * 108); g.quadraticCurveTo(235, 1030 - 0.72 * 92, 330, 1052 - 0.84 * 108); g.stroke();
    // the departures board, top right: a flap display; FINAL CALL blinks (o.board: 0 boarding, 1 final call, 2 closing)
    board(g, t, o.board ?? 1);
    g.restore();
  }
  function board(g, t, mode) {
    const x = 560, y = 482, w = 420, h = 132;
    g.save();
    RR(g, x, y, w, h, 10); g.fillStyle = NAVY; g.fill(); g.strokeStyle = '#0f1626'; g.lineWidth = 6; g.stroke();
    const rows = [['21:40', 'GATE 12', mode === 2 ? 'CLOSING' : mode === 1 ? 'FINAL CALL' : 'BOARDING'], ['21:55', 'GATE 7', 'BOARDING']];
    rows.forEach(([a, b, c], j) => {
      const yy = y + 52 + j * 54, on = j > 0 || mode === 0 || (Math.floor(t * 2.2) % 2 === 0);
      txt(g, a, x + 22, yy, 30, '#f5d36b', { kind: 'mono' }); txt(g, b, x + 128, yy, 30, '#f5d36b', { kind: 'mono' });
      txt(g, c, x + 268, yy, 30, j === 0 && mode ? (on ? '#ffd34a' : '#7a6a3a') : '#f5d36b', { kind: 'mono', fit: 140 });
      g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 16, yy - 13); g.lineTo(x + w - 16, yy - 13); g.stroke();
    });
    g.restore();
  }

  // ------------------------------------------------------------------ the passport (ours: a plain cover, the word PASSPORT, no emblem, no country)
  const PW = 430, PHh = 610, PHOTO = { x: 26, y: 64, w: 330 };
  const MRZ = ['P<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<', '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<'];
  function page(g, look, o = {}) {                  // the data page, in page space (0,0)–(PW,PHh)
    g.save();
    g.fillStyle = PLUM; RR(g, -14, -12, PW + 30, PHh + 26, 16); g.fill();                  // the cover, behind
    const pq = g.createLinearGradient(0, 0, PW, PHh); pq.addColorStop(0, '#f7f2e6'); pq.addColorStop(1, '#ece4d2'); g.fillStyle = pq; RR(g, 0, 0, PW, PHh, 8); g.fill();
    g.save(); RR(g, 0, 0, PW, PHh, 8); g.clip();                                           // a fine guilloche, our own
    g.strokeStyle = 'rgba(150,120,170,0.16)'; g.lineWidth = 1.4;
    for (let k = 0; k < 14; k++) { g.beginPath(); for (let i = 0; i <= 60; i++) { const x = i / 60 * PW, y = 40 + k * 42 + 9 * Math.sin(i * 0.42 + k * 0.9); if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); }
    g.restore();
    txt(g, 'PASSPORT', 26, 44, 30, '#5a4470', { kind: 'semi', ls: 4 });
    F.photo(g, PHOTO.x, PHOTO.y, PHOTO.w, look, { face: o.face });
    // the data, as a reader at arm's length sees it: lines, not words
    g.fillStyle = 'rgba(70,60,80,0.45)';
    for (const [y, w0] of [[520, 220], [546, 300], [572, 180]]) { RR(g, 26, y, w0, 9, 4); g.fill(); }
    txt(g, MRZ[0].slice(0, 30), 26, 600, 17, 'rgba(40,36,48,0.55)', { kind: 'mono' });
    g.restore();
  }
  function heldPassport(g, look, x, y, rot, o = {}) {     // your hand holds it up, its photo beside his face
    g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = 'rgba(30,20,30,0.18)'; RR(g, 10, 18, PW + 20, PHh + 20, 16); g.fill();       // its shadow on the glass
    page(g, look, o);
    // your thumb over the page's right edge, the hand and a navy cuff going off the bottom right
    const sk = '#c9936b', skD = '#9c6a48';
    g.fillStyle = NAVY; g.beginPath(); g.moveTo(PW - 40, PHh + 160); g.lineTo(PW + 260, PHh + 60); g.lineTo(PW + 360, PHh + 420); g.lineTo(PW + 40, PHh + 520); g.closePath(); g.fill();
    g.fillStyle = sk; g.beginPath(); g.moveTo(PW - 60, PHh + 30); g.quadraticCurveTo(PW + 70, PHh - 70, PW + 200, PHh + 40); g.lineTo(PW + 230, PHh + 150); g.quadraticCurveTo(PW + 60, PHh + 210, PW - 50, PHh + 170); g.closePath(); g.fill();
    g.save(); g.translate(PW - 4, PHh - 150); g.rotate(-0.25);
    const tq = g.createLinearGradient(-30, 0, 34, 0); tq.addColorStop(0, sk); tq.addColorStop(1, skD); g.fillStyle = tq; RR(g, -30, 0, 64, 190, 30); g.fill();
    g.fillStyle = 'rgba(255,235,220,0.5)'; RR(g, -18, 10, 30, 40, 14); g.fill();             // the thumbnail
    g.restore();
    g.restore();
  }

  // ------------------------------------------------------------------ the booth: you, in POV, through the glass
  const WIN = { x: 300, y: 905, R: 142 };
  const SLOTS = [[118, 770, 70], [36, 728, 59], [-26, 698, 51], [-78, 676, 45]];
  const steps = () => [T('hook'), T('q2'), T('q3'), T('q4'), T('q5'), T('deal')];
  function manAt(i) { return M[i]; }
  function waiting(g, t, cur, uq) {                  // the rest of the queue, soft, shuffling up a place as each one steps up
    const b = fresh(buf(1));
    for (let j = 4; j > cur; j--) {
      const s0 = j - cur, from = SLOTS[Math.min(3, s0)], to = SLOTS[Math.min(3, s0 - 1)], k = cur === 0 && t < 0.01 ? 0 : sg(uq, 0.05, 0.6);
      const p = s0 - 1 >= 0 && uq < 0.6 && cur > 0 ? [lerp(from[0], to[0], k), lerp(from[1], to[1], k), lerp(from[2], to[2], k)] : (cur > 0 ? to : SLOTS[Math.min(3, s0 - 1)]);
      const bob = cur > 0 && uq < 0.6 ? -6 * Math.sin(PI * clamp(uq / 0.6)) : 0;
      F.bust(b, p[0], p[1] + bob, p[2], manAt(j).now, { light: { x: -0.6, back: 0 }, psi: 0.18, look: [0.03, 0], close: blinkAt(t, j) });
    }
    g.save(); g.filter = 'blur(2.6px)'; g.globalAlpha = 0.92; g.drawImage(buf(1), 0, 0); g.restore();
    g.save(); g.fillStyle = 'rgba(236,227,210,0.18)'; g.fillRect(0, 0, W, H); g.restore();     // the haze of distance
  }
  function boothFront(g, t) {                        // the glass's reflections, its grille, the ledge, your desk
    g.save();
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.06; g.fillStyle = '#ffffff';
    g.beginPath(); g.moveTo(-100, 1200); g.lineTo(380, 300); g.lineTo(520, 300); g.lineTo(40, 1200); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(560, 1500); g.lineTo(1080, 640); g.lineTo(1080, 760); g.lineTo(640, 1500); g.closePath(); g.fill();
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.fillStyle = 'rgba(40,40,46,0.28)'; for (let r = 0; r < 3; r++) for (let i = 0; i < 8 + r * 6; i++) { const a = i / (8 + r * 6) * TAU; g.beginPath(); g.arc(300 + Math.cos(a) * r * 26, 1270 + Math.sin(a) * r * 26, 5, 0, TAU); g.fill(); }
    // the ledge on his side, the glass's frame, your desk
    g.fillStyle = '#cfc8bc'; g.fillRect(0, 1350, W, 54); g.fillStyle = '#b9b1a3'; g.fillRect(0, 1398, W, 10);
    const mq = g.createLinearGradient(0, 1408, 0, 1452); mq.addColorStop(0, '#8e959d'); mq.addColorStop(1, '#4e555d'); g.fillStyle = mq; g.fillRect(0, 1408, W, 44);
    const dq = g.createLinearGradient(0, 1452, 0, H); dq.addColorStop(0, '#5f6f86'); dq.addColorStop(1, '#3c4a5e'); g.fillStyle = dq; g.fillRect(0, 1452, W, H - 1452);
    g.fillStyle = '#23272e'; RR(g, 70, 1530, 300, 120, 14); g.fill(); g.fillStyle = '#e2301a'; g.beginPath(); g.arc(340, 1556, 7, 0, TAU); g.fill();   // the document reader
    g.restore();
  }
  function stampHand(g, t, t0) {                     // your left hand thumps the stamp down (a hit at t0)
    const d = t - t0, down = d < 0 ? 0 : d < 0.08 ? sstep(0, 0.08, d) : 1 - sstep(0.08, 0.3, d);
    g.save(); g.translate(560, 1640 + 60 * down);
    g.fillStyle = '#6b4a2e'; RR(g, -40, -120, 80, 110, 30); g.fill(); g.fillStyle = '#2b2f36'; RR(g, -70, -14, 140, 46, 8); g.fill();
    g.restore();
  }
  function boothScene(g, t) {
    const S = steps(); let cur = 0; while (cur < 4 && t >= S[cur + 1]) cur++;
    const u = t - S[cur];
    hall(g, t, { board: t < T('q3') ? 1 : 1 });
    waiting(g, t, cur, u);
    {
      const k = cur === 0 ? 1 : sg(u, 0.04, 0.46), m = manAt(cur), from = SLOTS[0];
      const x = lerp(from[0], WIN.x, k), y = lerp(from[1], WIN.y, k) - 18 * Math.sin(PI * k) * (1 - k * 0.3), R = lerp(from[2], WIN.R, k);
      const settle = Math.sin(clamp((u - 0.46) / 0.5) * PI) * 4 * (cur === 0 ? 0 : 1);
      F.bust(g, x, y + settle, R, m.now, { light: { x: -0.6, back: 0 }, psi: lerp(0.35, 0.04 * NA(t * 0.4 + cur), k), look: [0.02 * NB(t * 0.6 + cur * 3), 0.01], close: blinkAt(t, cur), smile: 0.1 + 0.06 * cur % 2 });
      if (k > 0.8) tileNo(g, 112, 1205, cur + 1, 92, sg(k, 0.8, 1));
    }
    // the man who has just been seen walks off to the right, in front of the one stepping up from the queue
    if (cur > 0 && u < 0.5) {
      const k = sg(u, 0, 0.5), m = manAt(cur - 1);
      F.bust(g, lerp(WIN.x, 1290, k), WIN.y - 22 * Math.sin(PI * k) + 10 * k, lerp(WIN.R, 150, k), m.now, { light: { x: -0.6, back: 0 }, psi: lerp(0, -0.9, k), smile: 0.1 });
    }
    boothFront(g, t);
    // your hand changes passports: the last one drops away, the next comes up beside his face
    const dropK = cur > 0 ? sg(u, 0, 0.2) : 1, riseK = cur === 0 ? 1 : sg(u, 0.14, 0.42);
    if (cur > 0 && dropK < 1) heldPassport(g, manAt(cur - 1).photo, 575, lerp(612, 1700, dropK), -0.03 - 0.1 * dropK);
    const ov = riseK < 1 ? 0.05 * Math.sin(PI * riseK) : 0;
    heldPassport(g, manAt(cur).photo, 575, lerp(1650, 612, riseK) - ov * 300, -0.03 + 0.12 * (1 - riseK));
    if (cur > 0) stampHand(g, t, S[cur] - 0.02);
  }

  // ------------------------------------------------------------------ the five cards on your desk, and the clock
  const CARD = { w: 430, h: 300, ph: 205 };
  const CARDS = [[75, 312], [520, 312], [75, 650], [520, 650], [75, 988]];
  function liveShot(g, x, y, w, m, t, i, o = {}) {   // the booth camera's still of him, in the hall's light; he blinks
    const h = w * F.PH;
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    const bq = g.createLinearGradient(x, y, x, y + h); bq.addColorStop(0, '#e8dcc6'); bq.addColorStop(1, '#cdbfa6'); g.fillStyle = bq; g.fillRect(x, y, w, h);
    F.bust(g, x + w / 2, y + h * 0.46, w * 0.3, m.now, { light: { x: -0.6, back: 0 }, close: o.still ? 0 : blinkAt(t, i, 3.1), smile: 0.08, look: o.look || [0, 0] });
    g.restore();
    g.save(); g.strokeStyle = 'rgba(30,34,40,0.35)'; g.lineWidth = 2; g.strokeRect(x, y, w, h); g.restore();
  }
  function card(g, i, t, x, y, o = {}) {
    const m = M[i], pw = CARD.ph;
    g.save(); g.translate(x + CARD.w / 2, y + CARD.h / 2); g.rotate(o.rot || 0); g.scale(o.s ?? 1, o.s ?? 1); g.translate(-CARD.w / 2, -CARD.h / 2);
    g.fillStyle = 'rgba(10,14,24,0.28)'; RR(g, 8, 12, CARD.w, CARD.h, 14); g.fill();
    g.fillStyle = '#fbf8f1'; RR(g, 0, 0, CARD.w, CARD.h, 14); g.fill();
    liveShot(g, 8, 18, pw, m, t, i, o);
    F.photo(g, CARD.w - pw - 8, 18, pw, m.photo);
    tileNo(g, 8, 8, i + 1, 62);
    if (o.dim) { g.fillStyle = `rgba(20,24,34,${(0.55 * o.dim).toFixed(3)})`; RR(g, 0, 0, CARD.w, CARD.h, 14); g.fill(); }
    g.restore();
  }
  function desk(g) {
    const q = g.createLinearGradient(0, 0, 0, H); q.addColorStop(0, '#647892'); q.addColorStop(1, '#3d4c62'); g.fillStyle = q; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(255,255,255,0.04)'; g.lineWidth = 2; for (let i = 0; i < 40; i++) { g.beginPath(); g.moveTo(0, i * 52 + 10); g.lineTo(W, i * 52 - 30); g.stroke(); }
  }
  function gridScene(g, t, o = {}) {
    desk(g);
    const t0 = T('deal');
    for (let i = 0; i < 5; i++) {
      const ti = t0 + 0.12 + i * 0.16, k = t < ti ? 0 : clamp(hit(t, ti + 0.18, 'snappy'));
      if (k <= 0) continue;
      const [x, y] = CARDS[i], rot = (i % 2 ? 0.018 : -0.015) * (1 + 0.6 * (1 - k)) + (1 - k) * 0.25 * (i % 2 ? 1 : -1);
      card(g, i, t, lerp(x + (i % 2 ? 300 : -300), x, k), lerp(y + 900, y, k), { rot, dim: o.dim ? o.dim(i) : 0 });
    }
    // the clock: five seconds to pick, then the board shuts the gate
    const c0 = T('pick'), c1 = c0 + 4.5;
    if (t > c0 - 0.4) {
      const a = sg(t, c0 - 0.4, c0), left = Math.max(0, Math.ceil((c1 - t) / 0.9)), k = clamp((t - c0) / (c1 - c0));
      g.save(); g.globalAlpha = a * (1 - sg(t, T('sure') + 0.8, T('seven')));
      g.fillStyle = 'rgba(12,16,26,0.7)'; g.beginPath(); g.arc(735, 1138, 126, 0, TAU); g.fill();
      ring(g, 735, 1138, 108, 1 - k, 16, t > c1 ? '#c9c2b4' : YEL);
      const pk = left > 0 ? clamp(hit(t, c0 + (5 - left) * 0.9, 'snappy')) : 1;
      txt(g, left > 0 ? String(left) : '0', 735, 1180, 120 * lerp(0.8, 1, pk), CREAM, { kind: 'cond', align: 'center' });
      g.restore();
    }
  }

  // ------------------------------------------------------------------ scenes
  scene({
    name: 'booth', from: 'hook', to: 'deal',
    build(root, S) { S.g = canvas(root); },
    run(t, b, S) {
      const g = S.g; clear(g); g.save();
      boothScene(g, t);
      if (t < 4.6) title(g, "ONE OF THEM ISN'T HIM", 400, 104, YEL, t, 0, { a: 1 - sg(t, 4.2, 4.6) });
      g.restore();
    },
  });
  scene({
    name: 'grid', from: 'deal', to: 'seven',
    build(root, S) { S.g = canvas(root); },
    run(t, b, S) {
      const g = S.g; clear(g); g.save();
      const k = sg(t, T('deal'), T('deal') + 0.35);
      g.globalAlpha = 1;
      if (k < 1) { boothScene(g, Math.min(t, T('deal') - 0.001)); g.fillStyle = `rgba(20,26,40,${(0.75 * k).toFixed(3)})`; g.fillRect(0, 0, W, H); }
      g.save(); g.globalAlpha = k; gridScene(g, t); g.restore();
      if (t > T('pick') - 0.6 && t < T('sure')) title(g, 'WHO DO YOU STOP?', 1440, 96, YEL, t, T('pick') - 0.6, { a: 1 - sg(t, T('sure') - 0.3, T('sure')) });
      g.restore();
    },
  });
  // ------------------------------------------------------------------ 1 in 7: the stamp comes down on passport after passport
  const SK3 = window.CAST.T;
  const STRANGERS = [
    { now: { ...SK3.a, hair: '#1a1410', style: 'short', bun: true, long: 0.35, ew: 0.25, eh: 0.15, brow: 0.05, browArch: 0.06, lip: 1.4, jawW: 0.92, ear: { out: 0.3 }, shirt: '#d65a6e', collar: 'kurta' } },
    { now: { ...SK3.c, hair: '#17110d', style: 'part', must: 0.09, jawW: 1.05, ew: 0.23, eh: 0.13, brow: 0.08, ear: { out: 0.45 }, shirt: '#5a8fc4', collar: 'shirt' } },
    { now: { ...SK3.b, hair: '#8f8a84', grey: 0.55, style: 'short', bun: true, long: 0.3, lines: 0.6, ew: 0.23, eh: 0.13, brow: 0.05, lip: 1.1, ear: { out: 0.3 }, shirt: '#7a59b8', collar: 'kurta' } },
    { now: { ...SK3.a, hair: '#15100c', style: 'buzz', fat: 0.4, ew: 0.22, eh: 0.12, brow: 0.08, ear: { out: 0.5 }, shirt: '#e6e2d8', collar: 'tee' } },
    { now: { ...SK3.c, hair: '#1a1410', style: 'short', long: 0.9, ew: 0.25, eh: 0.15, brow: 0.05, browArch: 0.07, lip: 1.3, jawW: 0.9, ear: { out: 0.2 }, shirt: '#3f6fae', collar: 'tee' } },
    { now: { ...SK3.b, hair: '#16100c', style: 'curly', jawW: 0.98, ew: 0.24, eh: 0.14, brow: 0.07, ear: { out: 0.35 }, shirt: '#8a5a3a', collar: 'shirt' } },
    { now: { ...SK3.c, hair: '#120d0a', style: 'part', jawW: 0.95, ew: 0.23, eh: 0.13, brow: 0.07, noseW: 1.0, ear: { out: 0.3 }, shirt: '#4a5568', collar: 'shirt' },   // the lookalike: someone else's photo
      photo: { ...SK3.c, hair: '#120d0a', style: 'part', jawW: 1.02, ew: 0.23, eh: 0.13, brow: 0.085, browTilt: 0.04, noseW: 1.25, ear: { out: 0.3 }, shirt: '#dfe3e8', collar: 'shirt' } },
  ];
  for (const s of STRANGERS) if (!s.photo) s.photo = { ...s.now, shirt: mix(s.now.shirt, '#ffffff', 0.55) };
  function strangerCard(g, j, t, x, y, o = {}) {
    const m = STRANGERS[j], pw = CARD.ph;
    g.save(); g.translate(x, y); g.rotate(o.rot || 0); g.translate(-CARD.w / 2, -CARD.h / 2);
    g.fillStyle = 'rgba(10,14,24,0.28)'; RR(g, 8, 12, CARD.w, CARD.h, 14); g.fill();
    g.fillStyle = '#fbf8f1'; RR(g, 0, 0, CARD.w, CARD.h, 14); g.fill();
    liveShot(g, 8, 18, pw, m, t, 9 + j, { still: true });
    F.photo(g, CARD.w - pw - 8, 18, pw, m.photo);
    if (o.inked > 0) {                                // the stamp's mark, purple ink, a little crooked
      g.save(); g.globalAlpha = o.inked * 0.85; g.translate(CARD.w * 0.62, CARD.h * 0.72); g.rotate(-0.18 + 0.05 * (j % 3)); g.strokeStyle = '#6d3fa8'; g.lineWidth = 7; RR(g, -110, -34, 220, 68, 10); g.stroke();
      txt(g, 'CLEARED', 0, 17, 46, '#6d3fa8', { align: 'center', kind: 'cond' }); g.restore();
    }
    if (o.ring > 0) { g.save(); g.globalAlpha = o.ring; g.strokeStyle = RED; g.lineWidth = 12; RR(g, -10, -10, CARD.w + 20, CARD.h + 20, 20); g.stroke(); g.restore(); }
    g.restore();
  }
  function stampAt(g, t, t0, x, y) {                // your fist round the stamp's handle, from above and in front: it comes down hard
    const d = t - t0, down = d < 0 ? sg(t, t0 - 0.16, t0) : 1 - sg(t, t0 + 0.05, t0 + 0.26);
    g.save(); g.translate(x + 70, lerp(y - 330, y + 30, down));
    g.fillStyle = 'rgba(10,14,24,' + (0.12 + 0.2 * down).toFixed(3) + ')'; g.beginPath(); g.ellipse(0, 270 - 120 * down, 150 * (0.7 + 0.3 * down), 30, 0, 0, TAU); g.fill();
    g.fillStyle = '#2b2f36'; RR(g, -120, 40, 240, 70, 12); g.fill(); g.fillStyle = '#6d3fa8'; RR(g, -112, 100, 224, 14, 4); g.fill();
    const hq = g.createLinearGradient(-40, 0, 40, 0); hq.addColorStop(0, '#9a6a42'); hq.addColorStop(1, '#6a4428'); g.fillStyle = hq; RR(g, -34, -110, 68, 160, 30); g.fill();
    g.fillStyle = '#7a5434'; g.beginPath(); g.ellipse(0, -118, 62, 40, 0, 0, TAU); g.fill();
    g.fillStyle = '#c9936b'; RR(g, -92, -210, 184, 120, 50); g.fill();
    g.strokeStyle = 'rgba(120,70,40,0.45)'; g.lineWidth = 5; for (const fx of [-44, -2, 40]) { g.beginPath(); g.moveTo(fx, -200); g.lineTo(fx + 4, -130); g.stroke(); }
    g.fillStyle = NAVY; RR(g, -96, -620, 192, 430, 30); g.fill(); g.fillStyle = '#2b3a5c'; RR(g, -100, -250, 200, 50, 16); g.fill();
    g.restore();
  }
  function sevenScene(g, t) {
    const t0 = T('seven') + 0.12, cyc = 0.5, sc = 1.55;
    let shake = 0; for (let j = 0; j < 7; j++) { const h0 = t0 + j * cyc + 0.24; if (t > h0 && t < h0 + 0.3) shake += 9 * Math.exp(-(t - h0) * 18) * Math.sin((t - h0) * 70); }
    g.save(); g.translate(0, shake); desk(g);
    for (let j = 6; j >= 0; j--) {
      const e = t0 + j * cyc; if (t < e) continue;
      const inK = sg(t, e, e + 0.2), outK = j < 6 ? sg(t, e + 0.38, e + 0.6) : 0, hitT = e + 0.24;
      const x = lerp(1500, 540, inK) - 1700 * outK, y = 1000;
      g.save(); g.translate(x, y); g.scale(sc, sc); strangerCard(g, j, t, 0, 0, { rot: (j % 2 ? 0.03 : -0.025), inked: t > hitT ? 1 : 0, ring: j === 6 ? sg(t, hitT + 0.3, hitT + 0.55) : 0 }); g.restore();
      if (t > e && t < e + 0.48) stampAt(g, t, hitT, x - 20, y - 60);
    }
    g.restore();
    const tl = t0 + 6 * cyc + 0.24 + 0.5;
    if (t > tl) { title(g, '1 IN 7', 470, 230, YEL, t, tl); txt(g, 'LOOKALIKES GOT THROUGH', 540, 600, 54, CREAM, { align: 'center', kind: 'semi', a: sg(t, tl + 0.25, tl + 0.55), stroke: INK, sw: 0.1 }); }
  }

  // ------------------------------------------------------------------ nine years: his photo becomes him
  function nineScene(g, t) {
    const t0 = T('nine'), m = M[1], k = sg(t, t0 + 0.5, t0 + 4.6), zoom = lerp(1, 1.07, sg(t, t0, T('room')));
    const look = { ...F.blend(m.photo, m.now, k), checkA: sg(k, 0.4, 0.9), shirt: mix(m.photo.shirt, m.now.shirt, sg(k, 0.3, 0.8)) };
    g.fillStyle = mix('#3d4c62', '#e8dcc6', sg(k, 0.6, 1)); g.fillRect(0, 0, W, H);
    g.save(); g.translate(540, 900); g.scale(zoom, zoom); g.translate(-540, -900);
    const pw = lerp(560, 1600, sg(k, 0.55, 1)), ph = pw * F.PH, px = 540 - pw / 2, py = lerp(470, 900 - ph * 0.5, sg(k, 0.55, 1));
    g.save(); g.beginPath(); g.rect(px, py, pw, ph); g.clip();
    const bq = g.createLinearGradient(0, py, 0, py + ph); bq.addColorStop(0, mix('#e9eef1', '#f0e6d4', k)); bq.addColorStop(1, mix('#d5dde2', '#d8c9ae', k)); g.fillStyle = bq; g.fillRect(px, py, pw, ph);
    const R = 168, blink = t > t0 + 5.0 && t < t0 + 5.25 ? sg(t, t0 + 5.0, t0 + 5.08) * (1 - sg(t, t0 + 5.12, t0 + 5.25)) : 0;
    F.bust(g, 540, 470 + 0.46 * 560 * F.PH, R, look, { deep: 7, flat: 1 - k, light: { x: -0.6 * k, back: 0 }, close: blink, smile: 0.12 * sg(t, t0 + 5.1, t0 + 5.6), look: [0, 0] });
    g.restore();
    g.save(); g.globalAlpha = 1 - sg(k, 0.5, 0.9); g.strokeStyle = 'rgba(30,34,40,0.5)'; g.lineWidth = 4; g.strokeRect(px, py, pw, ph); g.restore();
    g.restore();
    const yrs = Math.min(9, Math.floor(k * 9.999)), yk = clamp(hit(t, t0 + 0.5 + yrs / 9 * 4.1, 'snappy'));
    if (t > t0 + 0.3) title(g, `${yrs} ${yrs === 1 ? 'YEAR' : 'YEARS'}`, 400, 150 * lerp(0.9, 1, yk), YEL, t, t0 + 0.3);
  }

  // ------------------------------------------------------------------ the back room: holding his own passport while his plane leaves
  function roomScene(g, t) {
    const t0 = T('room'), m = M[1], u = t - t0, talk = T('old');
    g.fillStyle = '#c4ced6'; g.fillRect(0, 0, W, H);
    const wx0 = 60, wx1 = 1020, wy0 = 330, wy1 = 1020;
    g.save(); g.beginPath(); g.rect(wx0, wy0, wx1 - wx0, wy1 - wy0); g.clip();
    const sq = g.createLinearGradient(0, wy0, 0, wy1); sq.addColorStop(0, '#5e7fb0'); sq.addColorStop(0.55, '#e9a77c'); sq.addColorStop(1, '#f2c296'); g.fillStyle = sq; g.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
    g.fillStyle = '#8e96a0'; g.fillRect(wx0, wy1 - 150, wx1 - wx0, 150); g.fillStyle = '#f2e3a0'; for (let i = 0; i < 9; i++) g.fillRect(wx0 + i * 140 - (u * 60) % 140, wy1 - 80, 70, 6);
    const pxp = lerp(560, -700, sg(t, t0 + 0.6, T('who') + 0.4) ** 1.2), ppy = wy1 - 200;
    g.save(); g.translate(pxp, ppy);
    g.fillStyle = '#f7f4ef'; g.beginPath(); g.ellipse(0, 0, 420, 62, 0, 0, TAU); g.fill();
    g.fillStyle = '#e8e3da'; g.beginPath(); g.moveTo(260, -40); g.lineTo(380, -210); g.lineTo(450, -210); g.lineTo(420, -30); g.closePath(); g.fill();
    g.fillStyle = '#3f6fae'; g.beginPath(); g.moveTo(330, -110); g.lineTo(392, -200); g.lineTo(446, -200); g.lineTo(432, -110); g.closePath(); g.fill();
    g.fillStyle = '#d9d3c8'; g.beginPath(); g.moveTo(-60, 20); g.lineTo(140, 20); g.lineTo(60, 120); g.lineTo(-20, 120); g.closePath(); g.fill();
    g.fillStyle = '#2e3440'; for (let i = 0; i < 12; i++) { g.beginPath(); g.roundRect(-300 + i * 44, -18, 20, 14, 6); g.fill(); }
    g.fillStyle = Math.floor(t * 2) % 2 ? '#ff4a3a' : '#7a2a24'; g.beginPath(); g.arc(-60, -64, 7, 0, TAU); g.fill();
    g.restore();
    g.restore();
    g.strokeStyle = '#9aa6b0'; g.lineWidth = 16; g.strokeRect(wx0, wy0, wx1 - wx0, wy1 - wy0); g.beginPath(); g.moveTo(540, wy0); g.lineTo(540, wy1); g.stroke();
    for (const cx of [130, 320, 760, 950]) { g.fillStyle = '#3f6fae'; RR(g, cx - 80, 1200, 160, 150, 22); g.fill(); g.fillStyle = '#34609a'; RR(g, cx - 86, 1330, 172, 40, 12); g.fill(); g.fillStyle = '#5b6168'; g.fillRect(cx - 70, 1370, 10, 160); g.fillRect(cx + 60, 1370, 10, 160); }
    const lookUp = sg(t, talk - 0.35, talk + 0.1), tap = talk + 0.5, tapK = t > tap && t < tap + 0.5 ? Math.sin((t - tap) / 0.5 * PI * 2) * 0.5 + 0.5 : 0;
    const hx = 540, hy = 960, R = 120;
    g.fillStyle = '#3f6fae'; RR(g, hx - 120, 1180, 240, 180, 26); g.fill();
    F.bust(g, hx, hy, R, m.now, { light: { x: -0.6, back: 0 }, psi: lerp(-0.08, -0.32, lookUp), pitch: lerp(0.18, -0.05, lookUp), look: [lerp(0, -0.05, lookUp), lerp(-0.05, 0.02, lookUp)], smile: 0.18 * lookUp, browUp: 0.04 * lookUp, close: blinkAt(t, 7, 4.1) });
    g.fillStyle = '#c0392b'; RR(g, hx - 210, 1350, 420, 210, 16); g.fill(); g.fillStyle = '#f2c94c'; g.fillRect(hx - 20, 1350, 40, 210); g.fillRect(hx - 210, 1440, 420, 30);
    g.fillStyle = '#f2c94c'; g.beginPath(); g.ellipse(hx - 40, 1345, 46, 22, -0.4, 0, TAU); g.fill(); g.beginPath(); g.ellipse(hx + 40, 1345, 46, 22, 0.4, 0, TAU); g.fill();
    const pp = { x: hx - 135 + 40 * lookUp, y: 1150 - 50 * lookUp - 12 * tapK };
    const sk = m.now.skin, sleeve = mix(m.now.shirt, '#5f82b2', 0.35);
    const arm = (sx, sy, ex, ey, hx2, hy2) => { g.strokeStyle = sleeve; g.lineCap = 'round'; g.lineWidth = 78; g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(ex, ey, hx2, hy2); g.stroke(); g.strokeStyle = 'rgba(30,40,60,0.18)'; g.lineWidth = 6; g.beginPath(); g.moveTo(sx + 30, sy + 10); g.quadraticCurveTo(ex + 30, ey, hx2 + 20, hy2); g.stroke(); };
    arm(hx - 205, 1150, hx - 250, 1360, pp.x + 10, pp.y + 290); arm(hx + 205, 1150, hx + 270, 1360, pp.x + 250, pp.y + 280);
    g.save(); g.translate(pp.x, pp.y); g.rotate(-0.08 - 0.08 * lookUp); g.scale(0.62, 0.62); page(g, m.photo); g.restore();
    g.fillStyle = sk; g.beginPath(); g.ellipse(pp.x - 6, pp.y + 300, 46, 32, 0.3, 0, TAU); g.fill(); g.beginPath(); g.ellipse(pp.x + 262, pp.y + 290, 46, 32, -0.3, 0, TAU); g.fill();
    if (t > tap - 0.1) { g.fillStyle = sk; g.beginPath(); g.ellipse(pp.x + 150, pp.y + 150 + 10 * tapK, 18, 34, 0.5, 0, TAU); g.fill(); }
    if (t > talk) title(g, '“THAT’S ME. I JUST GOT OLD.”', 1640, 62, CREAM, t, talk, { fit: 900 });
  }

  // ------------------------------------------------------------------ so who was it? across the cards to number four, and into his photo
  const C4 = { x: CARDS[3][0] + CARD.w - CARD.ph - 8 + CARD.ph / 2, y: CARDS[3][1] + 18 + CARD.ph * F.PH * 0.5 };
  function staticGrid(g, t) {
    desk(g);
    for (let i = 0; i < 5; i++) { const [x, y] = CARDS[i]; card(g, i, t, x, y, { rot: (i % 2 ? 0.018 : -0.015), dim: i === 1 ? 0.6 : 0 }); }
  }
  function camTo(g, cx, cy, s) { g.translate(540, 900); g.scale(s, s); g.translate(-cx, -cy); }
  function whoScene(g, t) {
    const t0 = T('who'), t1 = T('bro'), k = sg(t, t0 + 0.2, t1);
    const path = [[540, 900, 1], [CARDS[0][0] + 215, CARDS[0][1] + 150, 1.5], [CARDS[2][0] + 215, CARDS[2][1] + 150, 1.5], [CARDS[4][0] + 215, CARDS[4][1] + 150, 1.5], [C4.x, C4.y, 3.1]];
    const f = k * (path.length - 1), i = Math.min(path.length - 2, Math.floor(f)), u = ease(f - i), a = path[i], b = path[i + 1];
    g.save(); camTo(g, lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)); staticGrid(g, t); g.restore();
  }

  // ------------------------------------------------------------------ his brother: the photo opens out into a family picture
  const FAMILY = { bro: { x: 360, y: 905, R: 150 }, him: { x: 720, y: 915, R: 150 } };
  function familyPicture(g, t, a = 1) {             // in its own space: a print on a warm wall, the two of them, arms round each other
    g.save(); g.globalAlpha *= a;
    g.fillStyle = '#fbf8f0'; RR(g, 60, 470, 960, 900, 10); g.fill();
    g.save(); g.beginPath(); g.rect(90, 500, 900, 840); g.clip();
    const wq = g.createLinearGradient(0, 500, 0, 1340); wq.addColorStop(0, '#f3e2c4'); wq.addColorStop(1, '#e2c8a0'); g.fillStyle = wq; g.fillRect(90, 500, 900, 840);
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(760, 520, 200, 300); g.strokeStyle = '#b89a72'; g.lineWidth = 8; g.strokeRect(760, 520, 200, 300);
    g.fillStyle = '#8a6a4a'; RR(g, 150, 560, 130, 100, 6); g.fill(); g.fillStyle = '#d9c3a0'; RR(g, 162, 572, 106, 76, 4); g.fill();
    const bro = { ...M[3].photo, shirt: '#2c3e66', collar: 'shirt' }, him = { ...M[3].now, shirt: '#9aa3ad', collar: 'tee' };
    F.bust(g, FAMILY.him.x, FAMILY.him.y, FAMILY.him.R, him, { light: { x: -0.5, back: 0 }, psi: -0.12, smile: 0.5, look: [-0.02, 0] });
    F.bust(g, FAMILY.bro.x, FAMILY.bro.y, FAMILY.bro.R, bro, { light: { x: -0.5, back: 0 }, psi: 0.1, smile: 0.45, look: [0.02, 0] });
    g.fillStyle = M[3].now.skin; g.beginPath(); g.ellipse(FAMILY.bro.x + 150, FAMILY.bro.y + 205, 44, 30, -0.25, 0, TAU); g.fill();   // his hand on his brother's shoulder
    g.strokeStyle = 'rgba(120,70,40,0.4)'; g.lineWidth = 4; for (const d of [-14, 2, 18]) { g.beginPath(); g.moveTo(FAMILY.bro.x + 130 + d, FAMILY.bro.y + 186); g.lineTo(FAMILY.bro.x + 122 + d, FAMILY.bro.y + 214); g.stroke(); }
    g.restore();
    g.restore();
  }
  function broScene(g, t) {
    const t0 = T('bro'), k = sg(t, t0 + 0.5, t0 + 1.9), s0 = 3.1;
    const pw = CARD.ph * s0, phh = pw * F.PH, cx0 = 540 - pw / 2, cy0 = 900 - phh / 2;
    const headY = cy0 + 0.46 * phh, R0 = pw * 0.30;
    const sA = R0 / FAMILY.bro.R, tx0 = 540 - sA * FAMILY.bro.x, ty0 = headY - sA * FAMILY.bro.y;
    const s = lerp(sA, 1, k), tx = lerp(tx0, 0, k), ty = lerp(ty0, 0, k);
    if (k < 1) { g.save(); camTo(g, C4.x, C4.y, s0); staticGrid(g, t); g.restore(); }
    const x0 = lerp(cx0, -40, k), x1 = lerp(cx0 + pw, W + 40, k), y0 = lerp(cy0, -40, k), y1 = lerp(cy0 + phh, H + 40, k);
    g.save(); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip();
    g.fillStyle = '#3d4c62'; g.fillRect(0, 0, W, H);
    g.save(); g.translate(tx, ty); g.scale(s, s); familyPicture(g, t, sg(t, t0 + 0.1, t0 + 0.6)); g.restore();
    g.restore();
    if (k < 0.999) { g.save(); g.strokeStyle = '#fbf8f1'; g.lineWidth = 14; g.strokeRect(x0, y0, x1 - x0, y1 - y0); g.restore(); }
    if (t > t0 + 1.8) {
      title(g, 'HIS BROTHER', 395, 120, YEL, t, t0 + 1.8, { x: 360 });
      g.save(); g.globalAlpha = sg(t, t0 + 1.9, t0 + 2.2); g.strokeStyle = YEL; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(360, 430); g.lineTo(360, 560); g.moveTo(325, 525); g.lineTo(360, 565); g.lineTo(395, 525); g.stroke(); g.restore();
    }
  }

  // ------------------------------------------------------------------ the jet bridge: unless you stopped him, he's boarding
  const JB = { w: 2.3, h: 2.3, len: 16 };
  const WALK4 = { S: RG.style({ stride: 1.2, cad: 0.95 }), look: { ...M[3].now, leg: '#2b3140', shoe: '#2a2420', sole: '#d8d0c0' } };
  WALK4.track = (t) => ({ x: 0.18, z: 1.6 + 1.14 * Math.max(0, t - T('gate')), h: 0, tg: t - T('gate') });
  const AGENT = { S: RG.style({}), look: { ...SK3.a, hair: '#15100c', style: 'short', bun: true, shirt: '#22325a', leg: '#22325a', shoe: '#121212', sole: '#3a3a3a' }, track: () => ({ x: -0.7, z: JB.len - 0.9, h: PI * 0.92, tg: 0, pose: { walk: 0 } }) };
  function gateScene(g, t) {
    const u = t - T('gate'), cz = -0.2 + 1.0 * u;
    const cam = RG.camera({ x: -0.15, y: 1.45, z: cz, yaw: 0.03, pitch: -0.02, f: 860, cx: 540, cy: 860 });
    g.fillStyle = '#2b2f36'; g.fillRect(0, 0, W, H);
    const L0 = 0, L1 = JB.len, hw = JB.w / 2;
    RG.poly3(g, cam, [[-hw, 0, L0], [hw, 0, L0], [hw, 0, L1], [-hw, 0, L1]], '#4a5568');
    RG.poly3(g, cam, [[-hw, 0, L0], [-hw, JB.h, L0], [-hw, JB.h, L1], [-hw, 0, L1]], '#d8d2c6');
    RG.poly3(g, cam, [[hw, 0, L0], [hw, JB.h, L0], [hw, JB.h, L1], [hw, 0, L1]], '#cfc8bb');
    RG.poly3(g, cam, [[-hw, JB.h, L0], [hw, JB.h, L0], [hw, JB.h, L1], [-hw, JB.h, L1]], '#e9e4da');
    g.strokeStyle = 'rgba(90,80,70,0.35)'; g.lineWidth = 3;
    for (let z = 0.6; z < L1; z += 0.62) for (const sx of [-1, 1]) { g.beginPath(); RG.line3(g, cam, [sx * hw, 0, z], [sx * hw, JB.h, z]); g.stroke(); }
    for (let z = 1; z < L1; z += 2.2) RG.poly3(g, cam, [[-0.22, JB.h - 0.01, z], [0.22, JB.h - 0.01, z], [0.22, JB.h - 0.01, z + 0.5], [-0.22, JB.h - 0.01, z + 0.5]], '#fffaf0');
    RG.poly3(g, cam, [[-hw, 0, L1], [hw, 0, L1], [hw, JB.h, L1], [-hw, JB.h, L1]], '#8d8578');
    RG.poly3(g, cam, [[-0.55, 0, L1 - 0.01], [0.55, 0, L1 - 0.01], [0.55, 1.95, L1 - 0.01], [-0.55, 1.95, L1 - 0.01]], '#fff6e4');   // the open door, the cabin's light
    RG.figure(g, cam, AGENT, t, { noHead: true, rim: 0 });
    const FA = RG.placed(cam, AGENT, t); if (FA) F.head(g, FA.P.head[0], FA.P.head[1], 0.135 * FA.P.head[2], FA.psi, AGENT.look, { smile: 0.3, light: { x: -0.4, back: 0 } });
    const tr = WALK4.track(t), cs = [tr.x + 0.3, 0, tr.z - 0.3];
    const box = (X, Y, Z, w, h, d, col) => { RG.poly3(g, cam, [[X - w, Y, Z - d], [X + w, Y, Z - d], [X + w, Y + h, Z - d], [X - w, Y + h, Z - d]], col); RG.poly3(g, cam, [[X - w, Y + h, Z - d], [X + w, Y + h, Z - d], [X + w, Y + h, Z + d], [X - w, Y + h, Z + d]], mix(col, '#ffffff', 0.2)); };
    box(cs[0], 0.05, cs[2], 0.15, 0.46, 0.09, '#2f3a4e');
    const Fh = RG.figure(g, cam, WALK4, t, { noHead: true, rim: 0 });
    if (Fh) {
      const hp = cam.P(cs[0], 0.51, cs[2] - 0.05), wr = Fh.P.wrR; if (hp && wr) { g.strokeStyle = '#8d939b'; g.lineWidth = 5; g.beginPath(); g.moveTo(wr[0], wr[1]); g.lineTo(hp[0], hp[1]); g.stroke(); }
      F.head(g, Fh.P.head[0], Fh.P.head[1], Fh.headR, Fh.psiH, M[3].now, { light: { x: -0.3, back: 0 } });
    }
  }
  function rewindScene(g, t) {
    const u = t - T('rewind'), tg = T('rewind') - 0.02 - u * 4.2;
    gateScene(g, Math.max(T('gate'), tg));
    g.save(); g.fillStyle = 'rgba(255,255,255,0.05)'; for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 2);
    const band = (u * 2400) % H; g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, band, W, 60);
    txt(g, '◀◀', 110, 400, 110, CREAM, { kind: 'cond', stroke: INK, sw: 0.1 });
    g.fillStyle = `rgba(255,255,255,${(sg(t, T('final') - 0.18, T('final'))).toFixed(3)})`; g.fillRect(0, 0, W, H);
    g.restore();
  }

  // ------------------------------------------------------------------ the last picture: him at your glass, his brother's photo beside him
  function finalScene(g, t) {
    const t0 = T('final'), z = lerp(1, 1.24, sg(t, t0, T('end') - 0.5)), m = M[3];
    g.save(); g.translate(560, 920); g.scale(z, z); g.translate(-560, -920);
    hall(g, t, { board: 2 });
    F.bust(g, WIN.x + 10, WIN.y, WIN.R + 14, m.now, { light: { x: -0.6, back: 0 }, psi: 0.02, look: [0, 0], smile: 0.08 });
    boothFront(g, t);
    heldPassport(g, m.photo, 585, 600, -0.02);
    g.restore();
    g.fillStyle = `rgba(255,255,255,${(1 - sg(t, t0, t0 + 0.25)).toFixed(3)})`; g.fillRect(0, 0, W, H);
    const tq = T('ask') + 1.4;
    if (t > tq) title(g, 'WHAT GAVE HIM AWAY?', 400, 100, YEL, t, tq);
  }

  scene({ name: 'seven', from: 'seven', to: 'nine', build(root, S) { S.g = canvas(root); }, run(t, b, S) { const g = S.g; clear(g); g.save(); sevenScene(g, t); g.restore(); } });
  scene({ name: 'nine', from: 'nine', to: 'room', build(root, S) { S.g = canvas(root); }, run(t, b, S) { const g = S.g; clear(g); g.save(); nineScene(g, t); g.restore(); } });
  scene({ name: 'room', from: 'room', to: 'who', build(root, S) { S.g = canvas(root); }, run(t, b, S) { const g = S.g; clear(g); g.save(); roomScene(g, t); g.restore(); } });
  scene({ name: 'who', from: 'who', to: 'bro', build(root, S) { S.g = canvas(root); }, run(t, b, S) { const g = S.g; clear(g); g.save(); whoScene(g, t); g.restore(); } });
  scene({ name: 'bro', from: 'bro', to: 'gate', build(root, S) { S.g = canvas(root); }, run(t, b, S) { const g = S.g; clear(g); g.save(); broScene(g, t); g.restore(); } });
  scene({ name: 'gate', from: 'gate', to: 'rewind', build(root, S) { S.g = canvas(root); }, run(t, b, S) { const g = S.g; clear(g); g.save(); gateScene(g, t); g.restore(); } });
  scene({ name: 'rewind', from: 'rewind', to: 'final', build(root, S) { S.g = canvas(root); }, run(t, b, S) { const g = S.g; clear(g); g.save(); rewindScene(g, t); g.restore(); } });
  scene({ name: 'final', from: 'final', to: 'end', build(root, S) { S.g = canvas(root); }, run(t, b, S) { const g = S.g; clear(g); g.save(); finalScene(g, t); g.restore(); } });

  // every reel ends with the Root Cause end card ('end' → 'done', 3.0 s, engine/endcard)
  window.UI.endcard();
  C.start();
})();
