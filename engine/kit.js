// kit.js — illustration + layout helpers for the AI171 short. Every function is a pure function of its arguments:
// nothing here keeps state between frames (render contract). Canvas drawings take explicit camera transforms.
(() => {
  const C = window.C, M = window.Motion;
  const COL = {
    bg: '#07090c', bg2: '#0e1217', ink: '#ece8e1', ink2: '#8d949c', ink3: '#3b434c', line: '#1c232b',
    acc: '#ff3b1f', accD: '#a8230f', accL: '#ff8f78', paper: '#ebe6dc',
  };
  const DEG = Math.PI / 180;
  const clamp = C.clamp, lerp = C.lerp;
  // springs on absolute seconds (VO words are in seconds)
  const st = (t, t0, p = 'snappy') => M.step(t - t0, p);
  const hit = (t, t0, p = 'snappy') => M.step(t - (t0 - C.leadFor(p)), p);   // reads ON t0
  const tb = (b) => C.bt(b);                                                   // beat/mark → seconds

  // ------------------------------------------------------------------ VO words
  const WBY = {};
  for (const w of window.WORDS || []) (WBY[w.p] = WBY[w.p] || []).push(w);
  const words = (pid) => WBY[pid] || [];
  const pStart = (pid) => words(pid)[0].t0;
  const pEnd = (pid) => words(pid)[words(pid).length - 1].t1;
  const wordT = (pid, i) => words(pid)[i].t0;

  // ------------------------------------------------------------------ canvas camera
  // screen = O + s·(p − O) + (x, y): the same mapping C.put gives a .cam div (transform-origin O)
  function cam(g, c = {}) {
    const s = c.s ?? 1, ox = c.ox ?? 540, oy = c.oy ?? 960, x = c.x || 0, y = c.y || 0;
    g.setTransform(s, 0, 0, s, ox - s * ox + x, oy - s * oy + y);
  }
  // every frame starts from a fresh context state: line caps, dashes, filters, fonts must not leak from the frame painted before
  function clear(g) {
    if (g.reset) g.reset();
    else {
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none';
      g.lineCap = 'butt'; g.lineJoin = 'miter'; g.setLineDash([]); g.textAlign = 'start'; g.shadowBlur = 0; g.shadowColor = 'rgba(0,0,0,0)';
    }
    g.clearRect(0, 0, C.W, C.H);
  }
  function rrect(g, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function font(g, size, weight = 700, stretch = 'condensed', fam = 'Bahn') {
    g.font = `${weight} ${size}px ${fam}`; g.fontStretch = stretch; g.textBaseline = 'alphabetic';
  }
  // camera drift: seeded, smooth, small (every held shot keeps moving)
  const NX = C.noise1(11), NY = C.noise1(23), NR = C.noise1(37);
  const drift = (t, amp = 6, speed = 0.35) => ({ x: NX(t * speed) * amp, y: NY(t * speed + 9) * amp, r: NR(t * speed * 0.7) * 0.25 });
  // impulse kick (camera shake on an impact), decays in ~0.35 s
  function kick(t, t0, amp = 10) {
    if (t < t0 || t > t0 + 0.6) return { x: 0, y: 0 };
    const u = t - t0, e = Math.exp(-u * 11);
    return { x: Math.sin(u * 63) * amp * 0.45 * e, y: Math.sin(u * 47 + 1) * amp * e };
  }

  // ------------------------------------------------------------------ fuel control switch panel (front, macro)
  // P: { a:[a1,a2] 0 RUN → 1 CUTOFF, lift:[l1,l2] 0..1, hot:[h1,h2] 0..1, dim 0..1, blur px }
  // Drawn in panel units around (0,0); the caller sets the transform (cam + translate + scale).
  const METAL = [[0, '#2a2e33'], [0.18, '#6d737a'], [0.36, '#d9dde1'], [0.46, '#f6f7f8'], [0.6, '#a3a9b0'], [0.82, '#4a5057'], [1, '#202327']];
  function metalGrad(g, x0, x1, y, stops = METAL) {
    const gr = g.createLinearGradient(x0, y, x1, y);
    for (const [o, c] of stops) gr.addColorStop(o, c);
    return gr;
  }
  function screw(g, x, y, r, rot) {
    const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    gr.addColorStop(0, '#b9bec4'); gr.addColorStop(0.6, '#5d636a'); gr.addColorStop(1, '#23272b');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.75)'; g.lineWidth = r * 0.22; g.lineCap = 'round';
    for (const a of [rot, rot + Math.PI / 2]) {
      g.beginPath(); g.moveTo(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6); g.lineTo(x - Math.cos(a) * r * 0.6, y - Math.sin(a) * r * 0.6); g.stroke();
    }
  }
  function lever(g, a, lift, hot) {
    // tilt from the camera axis: RUN +52° (handle up), CUTOFF −52° (handle down)
    const phi = lerp(52, -52, a) * DEG, F = 1150, L = 238 + 22 * lift;
    const P = (d) => { const z = d * Math.cos(phi), p = F / (F - z); return { y: -d * Math.sin(phi) * p, p }; };
    const s0 = P(0), s1 = P(L * 0.52), g0 = P(L * 0.47), g1 = P(L);
    const R = 15, RG = 36;
    // contact shadow on the plate (offset down-right, soft)
    g.save(); g.filter = 'blur(14px)'; g.fillStyle = 'rgba(0,0,0,0.62)';
    const sh = 0.42 + 0.25 * Math.abs(Math.sin(phi));
    g.beginPath(); g.ellipse(18 * sh, g1.y * 0.86 + 30, RG * g1.p * 1.05, Math.abs(g1.y - s0.y) * 0.42 + 26, 0, 0, Math.PI * 2); g.fill();
    g.restore();
    // shaft
    g.fillStyle = metalGrad(g, -R * 1.2, R * 1.2, 0);
    g.beginPath(); g.moveTo(-R * s0.p, s0.y); g.lineTo(-R * s1.p, s1.y); g.lineTo(R * s1.p, s1.y); g.lineTo(R * s0.p, s0.y); g.closePath(); g.fill();
    // grip: a knurled cylinder along the lever, foreshortened
    const gx0 = RG * g0.p, gx1 = RG * g1.p;
    g.fillStyle = metalGrad(g, -gx1 * 1.05, gx1 * 1.05, 0, [[0, '#191c20'], [0.2, '#50565d'], [0.4, '#c3c8cd'], [0.5, '#e9ecef'], [0.66, '#7a8087'], [1, '#14171a']]);
    g.beginPath(); g.moveTo(-gx0, g0.y); g.lineTo(-gx1, g1.y); g.lineTo(gx1, g1.y); g.lineTo(gx0, g0.y); g.closePath(); g.fill();
    // knurl rings
    g.strokeStyle = 'rgba(0,0,0,0.28)'; g.lineWidth = 2;
    for (let i = 1; i < 9; i++) {
      const q = P(L * (0.47 + 0.53 * i / 9)), rx = RG * q.p, ry = rx * Math.abs(Math.cos(phi)) * 0.98;
      g.beginPath(); g.ellipse(0, q.y, rx, Math.max(0.5, ry), 0, a < 0.5 ? 0 : Math.PI, a < 0.5 ? Math.PI : Math.PI * 2); g.stroke();
    }
    // end cap facing the camera
    const rx = gx1, ry = Math.max(2, rx * Math.abs(Math.cos(phi)));
    const cg = g.createRadialGradient(-rx * 0.3, g1.y - ry * 0.3, 2, 0, g1.y, rx * 1.05);
    cg.addColorStop(0, '#fbfcfd'); cg.addColorStop(0.55, '#b4bac0'); cg.addColorStop(1, '#4b5157');
    g.fillStyle = cg; g.beginPath(); g.ellipse(0, g1.y, rx, ry, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 2.5; g.stroke();
    g.fillStyle = 'rgba(20,22,25,0.85)'; g.beginPath(); g.ellipse(0, g1.y, rx * 0.22, ry * 0.22, 0, 0, Math.PI * 2); g.fill();
    return g1;
  }
  function drawPanel(g, P = {}) {
    const a = P.a || [0, 0], lift = P.lift || [0, 0], hot = P.hot || [0, 0];
    // plate
    const pg = g.createLinearGradient(0, -480, 0, 480);
    pg.addColorStop(0, '#2a2f35'); pg.addColorStop(0.5, '#1d2125'); pg.addColorStop(1, '#131619');
    rrect(g, -440, -480, 880, 960, 36); g.fillStyle = pg; g.fill();
    g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,0.07)'; g.stroke();
    rrect(g, -428, -468, 856, 936, 28); g.lineWidth = 2; g.strokeStyle = 'rgba(0,0,0,0.55)'; g.stroke();
    // brushed texture: faint horizontal strokes (seeded, static)
    const r = C.mulberry32(5);
    g.save(); rrect(g, -440, -480, 880, 960, 36); g.clip(); g.globalAlpha = 0.05; g.strokeStyle = '#fff'; g.lineWidth = 1;
    for (let i = 0; i < 70; i++) { const y = -480 + r() * 960, x = -440 + r() * 600; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 120 + r() * 260, y); g.stroke(); }
    g.restore();
    for (const [x, y] of [[-398, -438], [398, -438], [-398, 438], [398, 438]]) screw(g, x, y, 15, 0.6 + x * 0.001 + y * 0.0007);
    // engraved labels (centre column): RUN · FUEL CONTROL · CUTOFF
    const anyHot = Math.max(hot[0], hot[1]);
    g.textAlign = 'center';
    font(g, 46, 700, 'semi-condensed');
    g.fillStyle = `rgba(236,232,225,${0.92 - 0.45 * anyHot})`; g.fillText('RUN', 0, -232);
    font(g, 30, 600, 'semi-condensed'); g.fillStyle = 'rgba(236,232,225,0.62)';
    g.fillText('FUEL', 0, -8); g.fillText('CONTROL', 0, 28);
    font(g, 46, 700, 'semi-condensed');
    if (anyHot > 0.01) { g.save(); g.shadowColor = 'rgba(255,59,31,0.9)'; g.shadowBlur = 28 * anyHot; g.fillStyle = mixHex('#8d949c', COL.acc, anyHot); g.fillText('CUTOFF', 0, 268); g.restore(); }
    else { g.fillStyle = 'rgba(236,232,225,0.5)'; g.fillText('CUTOFF', 0, 268); }
    // arrows between labels
    g.strokeStyle = 'rgba(236,232,225,0.35)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, -205); g.lineTo(0, -62); g.moveTo(0, 62); g.lineTo(0, 216); g.stroke();
    // each switch
    [-210, 210].forEach((sx, i) => {
      g.save(); g.translate(sx, -10);
      // bezel + slot
      const bg = g.createLinearGradient(0, -250, 0, 250); bg.addColorStop(0, '#0f1114'); bg.addColorStop(1, '#07080a');
      rrect(g, -70, -250, 140, 500, 30); g.fillStyle = bg; g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 2; g.stroke();
      rrect(g, -17, -212, 34, 424, 17); g.fillStyle = '#000'; g.fill();
      if (hot[i] > 0.01) {   // red underglow inside the slot when that engine is cut
        const rg = g.createRadialGradient(0, 150, 4, 0, 150, 190);
        rg.addColorStop(0, `rgba(255,59,31,${0.75 * hot[i]})`); rg.addColorStop(1, 'rgba(255,59,31,0)');
        g.fillStyle = rg; rrect(g, -70, -250, 140, 500, 30); g.fill();
      }
      // guard brackets either side
      for (const gx of [-104, 104]) {
        g.fillStyle = metalGrad(g, gx - 17, gx + 17, 0, [[0, '#1e2125'], [0.3, '#80868d'], [0.5, '#d4d8dc'], [0.75, '#5a6067'], [1, '#191b1f']]);
        rrect(g, gx - 16, -268, 32, 536, 16); g.fill();
        g.fillStyle = 'rgba(0,0,0,0.5)'; rrect(g, gx - 16, -268, 32, 536, 16); g.globalAlpha = 0.0; g.fill(); g.globalAlpha = 1;
      }
      lever(g, a[i], lift[i], hot[i]);
      g.restore();
      // ENG n label under each switch
      g.textAlign = 'center'; font(g, 40, 700, 'semi-condensed');
      g.fillStyle = hot[i] > 0.5 ? mixHex(COL.ink, COL.accL, hot[i]) : 'rgba(236,232,225,0.85)';
      g.fillText(`ENG ${i + 1}`, sx, 330);
    });
    g.textAlign = 'left';
    if (P.dim) { g.fillStyle = `rgba(7,9,12,${P.dim})`; g.fillRect(-600, -700, 1200, 1400); }
  }
  function mixHex(a, b, k) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = (p, s) => (p >> s) & 255, m = (s) => Math.round(lerp(ch(pa, s), ch(pb, s), clamp(k)));
    return `rgb(${m(16)},${m(8)},${m(0)})`;
  }
  // lever position for a flip released at t0 (seconds): lift, swing with a hard mechanical seat, tiny rebound
  function flip(t, t0, from = 0, to = 1) {
    const u = t - (t0 - 0.045);                        // a 45 ms swing on a stiff spring: the handle LANDS on the cue
    const sw = M.step(u, { response: 0.11, damping: 0.6 });
    const a = from + (to - from) * clamp(sw, 0, 1.06);
    const lift = Math.exp(-Math.pow((t - (t0 - 0.05)) / 0.05, 2));
    return { a: clamp(a, Math.min(from, to) - 0.04, Math.max(from, to) + 0.04), lift, hot: to > from ? clamp(sw * 1.4) : clamp(1 - sw * 1.4) };
  }
  // the room behind the macro: dark, a pool of light on the plate, out-of-focus shapes for depth
  function macroBG(g, cx, cy, k = 1, warm = 0) {
    g.fillStyle = COL.bg; g.fillRect(-400, -400, C.W + 800, C.H + 800);
    const rg = g.createRadialGradient(cx, cy - 120 * k, 40, cx, cy, 900 * k);
    rg.addColorStop(0, warm ? 'rgba(70,28,22,0.55)' : 'rgba(44,54,66,0.55)'); rg.addColorStop(1, 'rgba(7,9,12,0)');
    g.fillStyle = rg; g.fillRect(-400, -400, C.W + 800, C.H + 800);
  }

  // ------------------------------------------------------------------ Boeing 787-8, side view (nose RIGHT)
  // local units: length 1000 (nose at x=0 before the mirror), fuselage height ~104. o: { gear 0..1, rat 0..1, rot (rad, RAT blades) }
  function plane(g, o = {}) {
    g.save(); g.scale(-1, 1); g.translate(-1000, 0);   // nose to the right
    const body = g.createLinearGradient(0, -60, 0, 60);
    body.addColorStop(0, '#f6f3ee'); body.addColorStop(0.55, '#e3ded6'); body.addColorStop(1, '#b8b2a8');
    // far wing + far engine (hint of depth, darker)
    g.fillStyle = '#6d6a66';
    g.beginPath(); g.moveTo(430, 20); g.bezierCurveTo(470, 6, 540, -16, 610, -30); g.lineTo(624, -30); g.bezierCurveTo(590, -10, 560, 8, 560, 26); g.closePath(); g.fill();
    // horizontal stabiliser (far side)
    g.beginPath(); g.moveTo(905, -36); g.bezierCurveTo(930, -44, 955, -60, 975, -74); g.lineTo(988, -72); g.lineTo(980, -38); g.closePath(); g.fill();
    // fin
    const fin = g.createLinearGradient(800, -230, 990, -40); fin.addColorStop(0, '#d93a22'); fin.addColorStop(1, '#8e1e0e');
    g.fillStyle = fin;
    g.beginPath(); g.moveTo(785, -50); g.bezierCurveTo(840, -100, 900, -190, 935, -228); g.lineTo(994, -228); g.bezierCurveTo(992, -170, 988, -95, 984, -40); g.closePath(); g.fill();
    // fuselage
    g.fillStyle = body;
    g.beginPath();
    g.moveTo(0, 12);
    g.bezierCurveTo(2, -12, 18, -36, 50, -46);
    g.bezierCurveTo(68, -52, 84, -53, 112, -53);
    g.lineTo(770, -53);
    g.bezierCurveTo(845, -53, 930, -46, 1000, -36);
    g.lineTo(1004, -27); g.lineTo(996, -21);
    g.bezierCurveTo(930, -12, 830, 18, 720, 45);
    g.bezierCurveTo(690, 51, 660, 53, 620, 53);
    g.lineTo(140, 53);
    g.bezierCurveTo(80, 53, 32, 45, 12, 31);
    g.bezierCurveTo(3, 24, 0, 18, 0, 12);
    g.closePath(); g.fill();
    // belly fairing
    g.fillStyle = '#d2ccc3'; g.beginPath(); g.moveTo(350, 50); g.bezierCurveTo(420, 68, 590, 68, 650, 48); g.closePath(); g.fill();
    // cheat line + windows + doors
    g.fillStyle = '#11151a';
    for (let x = 128; x < 760; x += 10.5) { if ([0, 1, 2].some((k) => Math.abs(x - [262, 545, 700][k]) < 12)) continue; g.beginPath(); g.ellipse(x, -17, 2.6, 3.6, 0, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = 'rgba(17,21,26,0.45)'; g.lineWidth = 1.6;
    for (const x of [96, 262, 545, 700]) { rrect(g, x - 8, -38, 16, 54, 4); g.stroke(); }
    // cockpit windows
    g.fillStyle = '#0d1014';
    g.beginPath(); g.moveTo(26, -28); g.lineTo(54, -41); g.lineTo(76, -42); g.lineTo(60, -27); g.closePath(); g.fill();
    // near wing (seen slightly from below: a long thin sweep, raked tip)
    const wg = g.createLinearGradient(400, 40, 720, 0); wg.addColorStop(0, '#d8d3ca'); wg.addColorStop(1, '#a7a198');
    g.fillStyle = wg;
    g.beginPath(); g.moveTo(388, 40); g.bezierCurveTo(470, 34, 600, 18, 720, 6); g.bezierCurveTo(740, 3, 752, -6, 760, -16);
    g.bezierCurveTo(752, 2, 732, 14, 700, 22); g.bezierCurveTo(660, 32, 620, 40, 590, 46); g.closePath(); g.fill();
    // pylon + engine (GEnx: big intake, chevron trailing edge)
    g.fillStyle = '#c9c3b9'; g.beginPath(); g.moveTo(380, 44); g.lineTo(455, 40); g.lineTo(470, 58); g.lineTo(392, 62); g.closePath(); g.fill();
    const ng = g.createLinearGradient(0, 46, 0, 114); ng.addColorStop(0, '#e8e3db'); ng.addColorStop(0.6, '#c6c0b6'); ng.addColorStop(1, '#8e887f');
    g.fillStyle = ng;
    g.beginPath(); g.moveTo(312, 60); g.bezierCurveTo(312, 50, 322, 46, 338, 46); g.lineTo(445, 49);
    g.bezierCurveTo(460, 50, 470, 56, 472, 62); g.lineTo(474, 98); g.bezierCurveTo(470, 108, 458, 112, 445, 113);
    g.lineTo(338, 115); g.bezierCurveTo(322, 115, 312, 108, 312, 100); g.closePath(); g.fill();
    g.fillStyle = '#1a1d21'; g.beginPath(); g.ellipse(313, 80, 7, 33, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(40,40,40,0.55)'; g.lineWidth = 1.5; g.beginPath();
    for (let i = 0; i <= 8; i++) { const y = 58 + i * 6.2; g.lineTo(i % 2 ? 466 : 476, y); } g.stroke();
    g.fillStyle = '#5b5852'; g.beginPath(); g.moveTo(474, 70); g.lineTo(500, 80); g.lineTo(474, 92); g.closePath(); g.fill();
    // near horizontal stabiliser
    g.fillStyle = '#ddd8cf';
    g.beginPath(); g.moveTo(872, -28); g.bezierCurveTo(915, -32, 955, -44, 984, -60); g.lineTo(1000, -58); g.bezierCurveTo(996, -45, 990, -32, 984, -21); g.closePath(); g.fill();
    // landing gear (down on AI171: the lever never came up)
    const gd = o.gear ?? 1;
    if (gd > 0.01) {
      g.strokeStyle = '#2c3136'; g.lineWidth = 7; g.lineCap = 'round';
      g.beginPath(); g.moveTo(108, 50); g.lineTo(108, 50 + 42 * gd); g.moveTo(505, 60); g.lineTo(505, 60 + 46 * gd); g.stroke();
      g.fillStyle = '#16191c';
      g.beginPath(); g.arc(108, 54 + 42 * gd, 12, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(488, 64 + 46 * gd, 17, 0, Math.PI * 2); g.arc(522, 64 + 46 * gd, 17, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#4b5056'; for (const [x, y, rr] of [[108, 54 + 42 * gd, 5], [488, 64 + 46 * gd, 7], [522, 64 + 46 * gd, 7]]) { g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill(); }
    }
    // RAT: swings out of the wing-body fairing, aft of the wing
    const ra = o.rat || 0;
    if (ra > 0.01) {
      const px = 640, py = 54, ang = (1 - ra) * 1.25, lx = px - Math.sin(ang) * 46, ly = py + Math.cos(ang) * 46;
      g.strokeStyle = '#3a3f45'; g.lineWidth = 6; g.beginPath(); g.moveTo(px, py); g.lineTo(lx, ly); g.stroke();
      const bl = 22, rot = o.rot || 0;
      g.strokeStyle = o.ratHot ? '#ff3b1f' : '#2a2e33'; g.lineWidth = 5;
      g.beginPath(); g.moveTo(lx, ly - Math.cos(rot) * bl); g.lineTo(lx, ly + Math.cos(rot) * bl); g.stroke();
      g.fillStyle = '#16191c'; g.beginPath(); g.arc(lx, ly, 5, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  }
  // where a point in plane-local coords (before the mirror) lands, given the plane transform below
  function planeXY(px, py, X, Y, k, pitch) {
    const lx = 1000 - px - 500, ly = py;              // mirrored, centred on x=500
    const c = Math.cos(pitch), s = Math.sin(pitch);
    return { x: X + (lx * c - ly * s) * k, y: Y + (lx * s + ly * c) * k };
  }
  function drawPlane(g, X, Y, k, pitch, o) {          // X,Y = fuselage mid-point; pitch in radians (nose up < 0)
    g.save(); g.translate(X, Y); g.rotate(pitch); g.scale(k, k); g.translate(-500, 0); plane(g, o); g.restore();
  }

  // ------------------------------------------------------------------ EICAS-style dial
  function drawGauge(g, cx, cy, R, v, o = {}) {
    const a0 = 135 * DEG, span = 270 * DEG, a = a0 + span * clamp(v);
    g.lineCap = 'butt';
    g.strokeStyle = 'rgba(141,148,156,0.28)'; g.lineWidth = 16; g.beginPath(); g.arc(cx, cy, R, a0, a0 + span); g.stroke();
    for (let i = 0; i <= 10; i++) {
      const q = a0 + span * i / 10, r0 = R - 30, r1 = R - (i % 5 ? 42 : 52);
      g.strokeStyle = 'rgba(236,232,225,0.55)'; g.lineWidth = i % 5 ? 2 : 4;
      g.beginPath(); g.moveTo(cx + Math.cos(q) * r0, cy + Math.sin(q) * r0); g.lineTo(cx + Math.cos(q) * r1, cy + Math.sin(q) * r1); g.stroke();
    }
    const col = o.col || COL.ink;
    g.strokeStyle = col; g.lineWidth = 16; g.beginPath(); g.arc(cx, cy, R, a0, a); g.stroke();
    g.strokeStyle = col; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * (R - 12), cy + Math.sin(a) * (R - 12)); g.stroke();
    g.fillStyle = '#0b0e12'; g.strokeStyle = col; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, 16, 0, Math.PI * 2); g.fill(); g.stroke();
  }

  // ------------------------------------------------------------------ the 32 seconds: altitude profile (illustrative)
  const ALT = (s) => { const u = Math.pow(clamp(s / 32), 0.78); return Math.sin(Math.PI * u); };   // 0 at liftoff, 0 at T+32
  function drawProfile(g, R, p, o = {}) {
    const X = (s) => R.x + (s / 32) * R.w, Y = (v) => R.y + R.h - v * R.h * 0.92;
    // grid + axis
    g.strokeStyle = 'rgba(141,148,156,0.18)'; g.lineWidth = 2;
    for (const s of [0, 8, 16, 24, 32]) { g.beginPath(); g.moveTo(X(s), R.y); g.lineTo(X(s), R.y + R.h); g.stroke(); }
    g.strokeStyle = 'rgba(236,232,225,0.55)'; g.lineWidth = 3; g.beginPath(); g.moveTo(R.x - 10, R.y + R.h); g.lineTo(R.x + R.w + 10, R.y + R.h); g.stroke();
    font(g, 30, 400, 'normal', 'Mono'); g.fillStyle = 'rgba(141,148,156,0.95)'; g.textAlign = 'center';
    for (const s of [0, 8, 16, 24, 32]) g.fillText(s === 0 ? 'T+0' : `+${s}s`, X(s), R.y + R.h + 46);
    g.textAlign = 'left';
    // the trace up to p (0..1 of the 32 s), then flat along the ground after impact
    const end = 32 * clamp(p);
    g.strokeStyle = o.col || COL.ink; g.lineWidth = 7; g.lineJoin = 'round'; g.lineCap = 'round';
    g.beginPath(); for (let s = 0; s <= end + 1e-6; s += 0.25) { const q = Math.min(s, end); s === 0 ? g.moveTo(X(q), Y(ALT(q))) : g.lineTo(X(q), Y(ALT(q))); } g.stroke();
    // the cut: red from T+3 onward (no engine power)
    if (end > 3) {
      g.strokeStyle = COL.acc; g.lineWidth = 7;
      g.beginPath(); for (let s = 3; s <= end + 1e-6; s += 0.25) { const q = Math.min(s, end); s === 3 ? g.moveTo(X(q), Y(ALT(q))) : g.lineTo(X(q), Y(ALT(q))); } g.stroke();
    }
    // head of the trace
    if (p > 0 && p < 1) { g.fillStyle = '#fff'; g.beginPath(); g.arc(X(end), Y(ALT(end)), 10, 0, Math.PI * 2); g.fill(); }
    return { X, Y, end, at: (s) => ({ x: X(s), y: Y(ALT(s)) }) };
  }

  // ------------------------------------------------------------------ waveform strip (stylised CVR track)
  function drawWave(g, x, y, w, h, t, env, seed = 3) {
    const n1 = C.noise1(seed), n2 = C.noise1(seed + 7), step = 9;
    for (let i = 0; i * step < w; i++) {
      const tt = t - (w - i * step) / w * 2.2;           // the strip shows the last 2.2 s, newest at the right
      const e = env(tt), v = Math.abs(n1(tt * 18) * 0.7 + n2(tt * 41) * 0.5) * e + 0.025;
      const hh = Math.max(2, v * h);
      g.fillStyle = e > 0.35 ? COL.ink : COL.ink3;
      g.fillRect(x + i * step, y + h / 2 - hh / 2, 5, hh);
    }
  }

  // ------------------------------------------------------------------ grain (pre-baked tiles, cycled by frame)
  const TILES = [];
  function grainTiles() {
    if (TILES.length) return TILES;
    const r = C.mulberry32(99);
    for (let k = 0; k < 4; k++) {
      const c = document.createElement('canvas'); c.width = c.height = 256;
      const x = c.getContext('2d'), im = x.createImageData(256, 256);
      for (let i = 0; i < im.data.length; i += 4) { const v = r() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
      x.putImageData(im, 0, 0); TILES.push(c);
    }
    return TILES;
  }

  window.KIT = {
    COL, DEG, st, hit, tb, words, pStart, pEnd, wordT, cam, clear, rrect, font, drift, kick,
    drawPanel, flip, macroBG, mixHex, drawPlane, planeXY, drawGauge, drawProfile, ALT, drawWave, grainTiles,
  };
})();
