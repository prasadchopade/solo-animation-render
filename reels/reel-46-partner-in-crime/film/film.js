// Reel 46 Partner in Crime: a two-ink risograph print (engine/riso46). You in teal, your partner in crime in pink, the
// officers in the dark overprint, the only people who belong to both rooms. Characters are drawn on twos and every
// drawing is a new pass through the machine (the inks land a few pixels off). Tones are halftone dots fixed to the
// paper, so a camera move never scales the screen. Light is paper: FREE is a room washed to paper, ten years is ten bars.
// The clock comes from the placed words (film/words.js). A pure function of t: any frame paints the same in any order.
(() => {
  const { W, H, clamp, lerp, E, rnd, rs, drawing, held, smoothPath } = LAB;
  const { ink, begin, print } = RISO;
  C.fonts = ['800 100px Bricolage', '700 60px Bricolage'];
  const N = 2;                                    // drawings on twos
  const TE = 'teal', PK = 'pink', BOTH = [TE, PK];
  const LY = (n) => ink(n).g;
  const each = (names, fn) => { for (const n of names) fn(LY(n), n); };
  const TAU = Math.PI * 2;
  const sm = (a, b, t) => E.inOut(clamp((t - a) / (b - a)));      // 0 → 1 between a and b, eased
  const ramp = (a, b, t) => clamp((t - a) / (b - a));

  // ------------------------------------------------------------------ the clock: placed words, or estimates
  const WD = window.WORDS || [];
  const LINE = {};
  for (const w of WD) (LINE[w.p] = LINE[w.p] || []).push(w);
  const EST = {
    n01: [0.04, 2.27], n02: [3.32, 4.40], d01: [4.90, 7.40], d02: [7.70, 9.97], d03: [10.72, 12.87], n03: [13.22, 15.04],
    n04: [16.50, 17.91], f01: [19.21, 20.74], f02: [21.04, 22.56], n05: [23.11, 24.43], n06: [24.93, 27.18], n07: [27.63, 30.39],
    n08: [30.74, 31.75], n09: [32.80, 34.29], n10: [34.59, 35.53], n11: [36.18, 37.70], n12: [38.00, 39.84], n13: [41.54, 43.50],
    n14: [43.80, 44.90], n15: [45.50, 47.09], n16: [47.79, 48.72],
  };
  const S = (id) => (LINE[id] ? LINE[id][0].t0 : EST[id][0]);
  const F = (id) => (LINE[id] ? LINE[id][LINE[id].length - 1].t1 : EST[id][1]);
  const Wt = (id, i) => (LINE[id] ? LINE[id][Math.min(i, LINE[id].length - 1)].t0 : lerp(EST[id][0], EST[id][1], i / 8));
  const END = () => C.bt('end');
  // is someone speaking at t (for mouths): within a line of theirs
  const speaking = (t, ids) => ids.some((id) => t >= S(id) - 0.02 && t <= F(id));
  // a mouth that opens on syllables: driven by the line's own word times, on twos
  function lips(t, ids) {
    for (const id of ids) {
      const ws = LINE[id]; if (!ws) { if (t >= S(id) && t <= F(id)) return 0.35 + 0.35 * Math.abs(Math.sin(held(t, N) * 14)); continue; }
      for (const w of ws) if (t >= w.t0 && t <= w.t1) { const u = (held(t, N) - w.t0) / Math.max(0.08, w.t1 - w.t0); return 0.25 + 0.6 * Math.abs(Math.sin(u * Math.PI * Math.max(1, Math.round((w.t1 - w.t0) / 0.16)))); }
    }
    return 0;
  }

  // ------------------------------------------------------------------ the camera: room space → screen
  let CAM = { s: 1, x: 0, y: 0 };
  function view(v, rect, fn) {
    each(BOTH, (g) => {
      g.save();
      if (rect) { g.beginPath(); g.rect(rect[0], rect[1], rect[2] - rect[0], rect[3] - rect[1]); g.clip(); }
      g.setTransform(v.s, 0, 0, v.s, v.x, v.y);
    });
    const prev = CAM; CAM = v;
    try { fn(); } finally { CAM = prev; each(BOTH, (g) => g.restore()); }
  }
  // a view that puts room point (fx, fy) at screen point (sx, sy), at scale s
  const aim = (fx, fy, sx, sy, s) => ({ s, x: sx - fx * s, y: sy - fy * s });
  const lw = (px) => px / CAM.s;                 // a line px wide on the paper, whatever the camera

  // ------------------------------------------------------------------ marks: occlusion, fills, lines, dots
  function occlude(path) { each(BOTH, (g) => { g.save(); g.globalCompositeOperation = 'destination-out'; path(g); g.fill(); g.restore(); }); }
  function erase(names, path) { each(names, (g) => { g.save(); g.globalCompositeOperation = 'destination-out'; path(g); g.fill(); g.restore(); }); }
  function fill(names, path) { each(names, (g) => { path(g); g.fill(); }); }
  function line(names, path, px = 8) { each(names, (g) => { g.save(); g.lineWidth = lw(px); g.lineJoin = 'round'; g.lineCap = 'round'; path(g); g.stroke(); g.restore(); }); }
  function eraseLine(names, path, px = 8) { each(names, (g) => { g.save(); g.globalCompositeOperation = 'destination-out'; g.lineWidth = lw(px); g.lineJoin = 'round'; g.lineCap = 'round'; path(g); g.stroke(); g.restore(); }); }
  // halftone dots on a screen fixed to the paper: the clip follows the camera, the dots don't
  function dots(names, path, tone, bb, cell = 11) {
    if (tone <= 0.01) return;
    each(names, (g, n) => {
      const m = g.getTransform();
      g.save(); path(g); g.clip(); g.setTransform(1, 0, 0, 1, 0, 0);
      if (tone >= 0.99) { g.fillRect(0, 0, W, H); g.restore(); return; }
      const P = [[bb[0], bb[1]], [bb[2], bb[1]], [bb[0], bb[3]], [bb[2], bb[3]]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
      const x0 = Math.max(0, Math.min(...P.map((p) => p[0])) - cell), x1 = Math.min(W, Math.max(...P.map((p) => p[0])) + cell);
      const y0 = Math.max(0, Math.min(...P.map((p) => p[1])) - cell), y1 = Math.min(H, Math.max(...P.map((p) => p[1])) + cell);
      if (x1 <= x0 || y1 <= y0) { g.restore(); return; }
      const a = (n === TE ? 75 : 15) * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), r = Math.sqrt(tone) * cell * 0.62;
      const C4 = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]];
      const us = C4.map(([x, y]) => x * ca + y * sa), vs = C4.map(([x, y]) => -x * sa + y * ca);
      const u0 = Math.floor(Math.min(...us) / cell), u1 = Math.ceil(Math.max(...us) / cell), v0 = Math.floor(Math.min(...vs) / cell), v1 = Math.ceil(Math.max(...vs) / cell);
      g.beginPath();
      for (let i = u0; i <= u1; i++) for (let j = v0; j <= v1; j++) {
        const px = i * cell * ca - j * cell * sa, py = i * cell * sa + j * cell * ca;
        if (px < x0 - cell || px > x1 + cell || py < y0 - cell || py > y1 + cell) continue;
        g.moveTo(px + r, py); g.arc(px, py, r, 0, TAU);
      }
      g.fill(); g.restore();
    });
  }
  const poly = (pts) => (g) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); };
  const polyOpen = (pts) => (g) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); };
  const blob = (pts, k = 0.5) => (g) => smoothPath(g, pts, true, k);
  const curve = (pts) => (g) => smoothPath(g, pts, false);
  const rect = (x, y, w, h) => (g) => { g.beginPath(); g.rect(x, y, w, h); };
  const circ = (x, y, r) => (g) => { g.beginPath(); g.arc(x, y, Math.max(0.01, r), 0, TAU); };
  const ell = (x, y, rx, ry, a = 0) => (g) => { g.beginPath(); g.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), a, 0, TAU); };
  function capsuleTo(g, ax, ay, bx, by, ra, rb = ra) {
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1e-3, nx = -dy / len, ny = dx / len, an = Math.atan2(dy, dx);
    g.moveTo(ax + nx * ra, ay + ny * ra); g.lineTo(bx + nx * rb, by + ny * rb);
    g.arc(bx, by, rb, an + Math.PI / 2, an - Math.PI / 2, true);
    g.lineTo(ax - nx * ra, ay - ny * ra);
    g.arc(ax, ay, ra, an - Math.PI / 2, an + Math.PI / 2, true);
    g.closePath();
  }
  const capsule = (ax, ay, bx, by, ra, rb = ra) => (g) => { g.beginPath(); capsuleTo(g, ax, ay, bx, by, ra, rb); };
  const boil = (t, id, amp = 1.4) => { const p = drawing(t, N); return [rs('bx', id, p) * amp, rs('by', id, p) * amp]; };
  const bpts = (t, id, pts, amp = 1.3) => { const p = drawing(t, N); return pts.map(([x, y], i) => [x + rs(id, i, 'x', p) * amp, y + rs(id, i, 'y', p) * amp]); };
  // a shape: knock out what's behind it in both inks, then its own ink (solid, dots, or paper) and its outline
  function shape(names, path, { tone = 0, ol = 8, bb = null, olNames = null } = {}) {
    occlude(path);
    if (tone >= 0.99) fill(names, path); else if (tone > 0 && bb) dots(names, path, tone, bb);
    if (ol) line(olNames || names, path, ol);
  }
  const bbOf = (pts, pad = 0) => [Math.min(...pts.map((p) => p[0])) - pad, Math.min(...pts.map((p) => p[1])) - pad, Math.max(...pts.map((p) => p[0])) + pad, Math.max(...pts.map((p) => p[1])) + pad];
  // type, printed in both inks so it reads dark (HQ: text at 4.5:1 or more on the paper)
  function type(txt, x, y, size, { align = 'center', weight = 800, names = BOTH, angle = 0 } = {}) {
    each(names, (g) => {
      g.save(); g.translate(x, y); if (angle) g.rotate(angle);
      g.font = `${weight} ${size}px Bricolage`; g.textAlign = align; g.textBaseline = 'alphabetic';
      g.fillStyle = '#000'; g.fillText(txt, 0, 0); g.restore();
    });
  }
  // a rubber stamp: a boxed word that lands big and settles over three frames
  function stamp(t, t0, txt, x, y, size, { angle = -0.08, names = BOTH, box = true } = {}) {
    if (t < t0) return;
    const k = clamp((t - t0) / 0.1), sc = 1 + 0.45 * (1 - E.out(k));
    each(names, (g) => {
      g.save(); g.translate(x, y); g.rotate(angle); g.scale(sc, sc);
      g.font = `800 ${size}px Bricolage`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#000';
      const w = g.measureText(txt).width;
      g.save(); g.globalCompositeOperation = 'destination-out'; g.fillRect(-w / 2 - size * 0.3, -size * 0.6, w + size * 0.6, size * 1.2); g.restore();
      if (box) { g.lineWidth = size * 0.085; g.strokeRect(-w / 2 - size * 0.22, -size * 0.52, w + size * 0.44, size * 1.04); }
      g.fillText(txt, 0, size * 0.05); g.restore();
    });
  }

  // ------------------------------------------------------------------ hands: one clean outline per pose, drawn not rigged
  // In hand units: the wrist at (0, 0), the fingertips near y −1. Each pose is a single smooth silhouette with a few
  // inner lines, so no finger ever shows a line through the palm.
  const HANDS = {
    // side view, fingers together, the thumb up on the left (the palm faces +x)
    mitt: { pts: [[-0.18, 0.02], [-0.2, -0.2], [-0.3, -0.34], [-0.35, -0.49], [-0.28, -0.57], [-0.17, -0.51], [-0.16, -0.72], [-0.11, -0.9], [0, -0.97], [0.11, -0.91], [0.16, -0.72], [0.18, -0.42], [0.18, 0.02]], lines: [[[-0.17, -0.49], [-0.13, -0.33]]] },
    // the back of a hand lying flat, fingers away from the viewer, the thumb inside (a right hand; flip for the left)
    back: { pts: [[-0.21, 0.03], [-0.24, -0.24], [-0.39, -0.35], [-0.45, -0.45], [-0.37, -0.51], [-0.25, -0.49], [-0.24, -0.63], [-0.17, -0.71], [-0.1, -0.67], [-0.07, -0.76], [0.01, -0.78], [0.05, -0.73], [0.09, -0.77], [0.17, -0.73], [0.2, -0.65], [0.25, -0.63], [0.3, -0.55], [0.27, -0.3], [0.21, 0.03]], lines: [[[-0.1, -0.67], [-0.09, -0.56]], [[0.05, -0.73], [0.05, -0.6]], [[0.2, -0.65], [0.19, -0.55]]] },
    point: { pts: [[-0.2, 0.02], [-0.24, -0.2], [-0.33, -0.31], [-0.3, -0.42], [-0.19, -0.44], [-0.11, -0.5], [-0.07, -0.53], [-0.08, -0.93], [0, -1.0], [0.07, -0.94], [0.07, -0.55], [0.15, -0.52], [0.22, -0.4], [0.21, 0.02]], lines: [[[-0.07, -0.53], [0.12, -0.48]]] },
    fist: { pts: [[-0.2, 0.02], [-0.25, -0.2], [-0.33, -0.32], [-0.27, -0.43], [-0.14, -0.5], [0.04, -0.55], [0.18, -0.5], [0.24, -0.36], [0.21, 0.02]], lines: [[[-0.12, -0.46], [0.17, -0.46]], [[-0.02, -0.52], [-0.01, -0.42]], [[0.09, -0.51], [0.09, -0.41]]] },
    // a writing grip from above: thumb and index pinch the pen, the other fingers curl under (a right hand)
    grip: { pts: [[-0.22, 0.04], [-0.26, -0.16], [-0.34, -0.28], [-0.39, -0.41], [-0.37, -0.53], [-0.31, -0.63], [-0.23, -0.62], [-0.2, -0.54], [-0.17, -0.64], [-0.16, -0.8], [-0.11, -0.9], [-0.05, -0.88], [-0.03, -0.74], [0.03, -0.67], [0.11, -0.65], [0.17, -0.58], [0.23, -0.52], [0.27, -0.42], [0.27, -0.27], [0.23, -0.08], [0.21, 0.04]],
      lines: [[[-0.04, -0.63], [0.05, -0.57], [0.13, -0.53], [0.2, -0.45]], [[-0.15, -0.73], [-0.05, -0.75]], [[-0.34, -0.47], [-0.26, -0.52]]] },
    // a finger to the lips is a point; a hand flat on a wall is a back with the fingers up
  };
  function hand(names, x, y, ang, sz, pose = 'mitt', { flip = 1, t = 0, id = 'h', tone = 0 } = {}) {
    const HP = HANDS[pose === 'pen' ? 'fist' : pose];
    const [bx, by] = boil(t, id, 1.0);
    each(BOTH, (g) => { g.save(); g.translate(x + bx, y + by); g.rotate(ang); g.scale(sz * flip, sz); });
    const prev = CAM; CAM = { ...CAM, s: CAM.s * sz };
    try {
      if (pose === 'pen') shape(BOTH, capsule(0.02, -1.05, -0.03, 0.12, 0.045, 0.05), { tone: 1, ol: 0 });   // the pen, through the fist
      if (pose === 'grip') shape(BOTH, capsule(-0.07, -1.14, -0.19, -0.55, 0.013, 0.034), { tone: 1, ol: 0 });  // the nib end, under the fingers
      const P = blob(HP.pts, 0.42);
      occlude(P);
      if (tone > 0) dots(names, P, tone, [-0.6, -1.1, 0.6, 0.2]);
      line(names, P, 8);
      for (const L of HP.lines) line(names, polyOpen(L), 5);
      if (pose === 'grip') shape(BOTH, capsule(-0.21, -0.57, -0.05, -0.27, 0.036, 0.04), { tone: 1, ol: 0 });   // the pen's back, over the hand
    } finally { CAM = prev; each(BOTH, (g) => g.restore()); }
  }
  // a seated arm: the upper arm from the shoulder down to the elbow on the table, the forearm from the elbow at angle a
  // (0 = straight up, + = toward screen-right, π = toward you along the table), ls its length (short = foreshortened)
  function seatedArm(names, sh, el, a, len, w, { pose = 'mitt', handAng = 0, flip = 1, hs = 1, t = 0, id = 'arm', sleeve = null, tone = 0, handTone = 0, ls = 1 } = {}) {
    const L = len * ls, wr = [el[0] + Math.sin(a) * L, el[1] - Math.cos(a) * L];
    const up = capsule(sh[0], sh[1], el[0], el[1], w * 1.12, w);
    shape(names, up, { tone, bb: bbOf([sh, el], w * 1.5) }); if (sleeve) sleeve(up, sh, el, w);
    const fo = capsule(el[0], el[1], wr[0], wr[1], w, w * 0.78);
    shape(names, fo, { tone, bb: bbOf([el, wr], w * 1.5) }); if (sleeve) sleeve(fo, el, wr, w);
    hand(names, wr[0], wr[1], a + handAng, hs * (0.75 + 0.25 * ls), pose, { flip, t, id, tone: handTone });
    return wr;
  }
  // a forearm on the table shortens smoothly as it turns toward you (no length pop as an arm swings round)
  const lsOf = (a) => lerp(1, 0.42, clamp((Math.abs(a) - 1.7) / 0.8));
  // an arm to a given elbow and wrist (the elbow may slide along the table)
  function armTo(names, sh, el, wr, w, { pose = 'back', ang = 0, hs = 100, flip = 1, t = 0, id = 'at', tone = 0, handTone = 0, sleeve = null } = {}) {
    const up = capsule(sh[0], sh[1], el[0], el[1], w * 1.12, w);
    shape(names, up, { tone, bb: bbOf([sh, el], w * 1.5) }); if (sleeve) sleeve(up, sh, el, w);
    const fo = capsule(el[0], el[1], wr[0], wr[1], w, w * 0.78);
    shape(names, fo, { tone, bb: bbOf([el, wr], w * 1.5) }); if (sleeve) sleeve(fo, el, wr, w);
    hand(names, wr[0], wr[1], ang, hs, pose, { flip, t, id, tone: handTone });
  }
  // a limb from shoulder to wrist with a real elbow (two bones, a and b long); side picks the way the elbow bends
  function limb(names, sh, wr, a, b, w, side, { tone = 0, sleeve = null } = {}) {
    const dx = wr[0] - sh[0], dy = wr[1] - sh[1], d = Math.max(1e-3, Math.min(Math.hypot(dx, dy), a + b - 1e-3));
    const base = Math.atan2(dy, dx), al = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1)) * side;
    const el = [sh[0] + Math.cos(base + al) * a, sh[1] + Math.sin(base + al) * a];
    for (const [p, q, w0, w1] of [[sh, el, w * 1.08, w], [el, wr, w, w * 0.82]]) {
      const c = capsule(p[0], p[1], q[0], q[1], w0, w1);
      shape(names, c, { tone, bb: bbOf([p, q], w * 1.5), ol: 8 }); if (sleeve) sleeve(c, p, q, w);
    }
    return el;
  }
  // a striped sleeve: the stripes go round the arm, across its length, so an arm in front of his chest reads as an arm
  function sleeveStripes(path, a0, a1, w) {
    const ang = Math.atan2(a1[1] - a0[1], a1[0] - a0[0]), len = Math.hypot(a1[0] - a0[0], a1[1] - a0[1]) + w * 2;
    each([PK], (g) => {
      g.save(); path(g); g.clip(); g.translate(a0[0], a0[1]); g.rotate(ang);
      const st = w * 0.62;
      for (let u = -w; u < len; u += st) g.fillRect(u, -w * 1.6, st * 0.46, w * 3.2);
      g.restore();
    });
  }

  // ------------------------------------------------------------------ performances: held poses, snapped with overshoot
  function keyed(t, keys, tr = 0.17) {
    const th = held(t, N);
    let i = 0; while (i + 1 < keys.length && keys[i + 1][0] <= th) i++;
    const [k0, p0] = keys[i];
    if (i === 0 || th - k0 >= tr) return p0;
    const prev = keys[i - 1][1], u = clamp((th - k0) / tr), e = E.overshoot(u, 1.2);
    return p0.map((v, j) => (typeof v === 'number' ? lerp(prev[j], v, e) : (u < 0.5 ? prev[j] : v)));
  }
  // his talking at the table: elbows down, the forearms and hands doing the talking (a new beat every 0.45–0.8 s)
  //   [left forearm angle, left pose, left hand angle, right forearm angle, right pose, right hand angle, head tilt, brow, turn]
  const HIS = {
    rest: [2.95, 'fist', 0, -2.95, 'fist', 0, 0.0, 0.3, -0.42],
    chop: [0.25, 'mitt', 0.1, -2.95, 'fist', 0, 0.05, 0.6, -0.5],
    both: [0.08, 'mitt', -0.1, 0.4, 'mitt', 0.3, -0.03, 0.75, -0.42],
    point: [2.95, 'fist', 0, 0.1, 'point', 0.15, 0.06, 0.8, -0.55],
    wave: [0.12, 'mitt', -0.2, -2.95, 'fist', 0, -0.06, 0.5, -0.38],
    shrug: [0.05, 'mitt', -0.3, 0.75, 'mitt', 0.9, 0.08, 0.95, -0.42],
  };
  const HIS_KEYS = (() => {
    const names = Object.keys(HIS), out = [[-1, HIS.chop], [0, HIS.chop]];
    let tt = 0.62, last = 'chop';
    for (let i = 0; tt < 80; i++) {
      let nm = names[Math.floor(rnd('gest', i) * names.length)];
      if (nm === last) nm = names[(names.indexOf(nm) + 1) % names.length];
      out.push([tt, HIS[nm]]); last = nm; tt += 0.45 + 0.35 * rnd('gdur', i);
    }
    return out;
  })();
  // mouth shapes for talk we don't hear clearly: a new shape on every syllable-ish beat
  function chatter(t, seed = 'chat') {
    const th = held(t, N), beat = Math.floor(th / 0.13), r = rnd(seed, beat);
    if (r < 0.16) return ['flat', 0, 0.3];
    if (r < 0.34) return ['o', 0.55, 0];
    return ['talk', 0.3 + 0.65 * rnd(seed, beat, 'o'), 0.3 + 0.4 * rnd(seed, beat, 's')];
  }

  // ------------------------------------------------------------------ heads on a turning sphere
  const sx_ = (th, turn) => Math.sin(th + turn * 0.55);
  const sv_ = (th, turn) => Math.cos(th + turn * 0.55);

  // ------------------------------------------------------------------ HIM: your partner in crime (pink), the classic burglar
  // a knit beanie over short curls, a striped long-sleeve shirt, a square jaw, thick brows. p: x, y (head centre), s, turn,
  // tilt, mouth, open, smile, brow, frown, sad, look, blink, part ('body' | 'arms'), arms {l, r: [angle, pose, handAng]},
  // behind (hands clasped behind his head)
  function him(t, p) {
    const s = p.s ?? 1, R = 140 * s, x = p.x, y = p.y, turn = p.turn ?? 0, ink1 = [PK];
    const [bx, by] = boil(t, 'him', 1.2);
    each(BOTH, (g) => { g.save(); g.translate(x + bx, y + by); g.rotate(p.tilt ?? 0); g.translate(-x, -y); });
    try {
      const sy = y + R * 1.12, sw = R * 1.55;
      const shL = [x - sw * 0.86, sy + R * 0.32], shR = [x + sw * 0.86, sy + R * 0.32];
      const stripe = (path, bb) => stripes(path, bb, R);
      if (p.part !== 'arms') {
        if (p.behind) {
          for (const sg of [-1, 1]) {
            const sh = sg < 0 ? shL : shR, el = [x + sg * R * 1.8, y - R * 0.1], hd = [x + sg * R * 0.6, y - R * 0.8];
            const up = capsule(sh[0], sh[1], el[0], el[1], R * 0.3, R * 0.26);
            shape(ink1, up, { tone: 0 }); sleeveStripes(up, sh, el, R * 0.3);
            const fo = capsule(el[0], el[1], hd[0], hd[1], R * 0.25, R * 0.22);
            shape(ink1, fo, { tone: 0 }); sleeveStripes(fo, el, hd, R * 0.25);
          }
        }
        const torso = blob([[x - sw * 1.08, sy + R * 2.8], [x - sw * 1.06, sy + R * 0.75], [x - sw * 0.86, sy + R * 0.1], [x - R * 0.45, sy - R * 0.1], [x + R * 0.45, sy - R * 0.1], [x + sw * 0.86, sy + R * 0.1], [x + sw * 1.06, sy + R * 0.75], [x + sw * 1.08, sy + R * 2.8]]);
        shape(ink1, torso, { tone: 0 });
        stripe(torso, [x - sw * 1.2, sy - R * 0.3, x + sw * 1.2, sy + R * 2.9]);
        shape(ink1, poly([[x - R * 0.38, y + R * 0.7], [x + R * 0.38, y + R * 0.7], [x + R * 0.46, sy + R * 0.04], [x - R * 0.46, sy + R * 0.04]]), { tone: 0.22, bb: [x - R, y, x + R, sy + R * 0.3] });
        shape(ink1, blob([[x - R * 0.64, sy - R * 0.08], [x, sy + R * 0.3], [x + R * 0.64, sy - R * 0.08], [x, sy + R * 0.12]], 0.4), { tone: 0, ol: 8 });
        faceHim(t, x, y, R, turn, p);
      }
      if (p.part !== 'body' && p.arms) {
        for (const side of ['l', 'r']) {
          const a = p.arms[side]; if (!a) continue;
          const sg = side === 'l' ? -1 : 1, sh = sg < 0 ? shL : shR, el = [x + sg * R * 1.2, y + R * 3.3];
          seatedArm(ink1, sh, el, a[0], R * 1.3, R * 0.27, { pose: a[1], handAng: a[2], flip: sg, hs: R * 0.78, t, id: 'him' + side, sleeve: sleeveStripes, ls: lsOf(a[0]) });
        }
      }
    } finally { each(BOTH, (g) => g.restore()); }
  }
  function stripes(path, bb, R) {
    each([PK], (g) => {
      g.save(); path(g); g.clip();
      const st = R * 0.24;
      for (let yy = Math.floor(bb[1] / st) * st; yy < bb[3]; yy += st) g.fillRect(bb[0], yy, bb[2] - bb[0], st * 0.46);
      g.restore();
    });
  }
  function faceHim(t, x, y, R, turn, p) {
    const ink1 = [PK], fx = (th) => x + sx_(th, turn) * R, open = p.open ?? 0, blink = p.blink ?? 0, sh = Math.sin(turn * 0.55);
    // ears first, under the beanie's edge
    for (const sg of [-1, 1]) {
      const th = sg * 1.5, v = sv_(th, turn); if (v < 0.08) continue;
      const ex = fx(th) + sg * R * 0.08, ey = y + R * 0.08;
      shape(ink1, ell(ex, ey, R * 0.15 * (0.45 + 0.55 * v), R * 0.24), { tone: 0.2, bb: [ex - R * 0.3, ey - R * 0.3, ex + R * 0.3, ey + R * 0.3], ol: 7 });
    }
    // a square jaw
    const base = [[-0.97, -0.4], [-1.0, 0.12], [-0.94, 0.56], [-0.8, 0.86], [-0.42, 1.06], [0, 1.1], [0.42, 1.06], [0.8, 0.86], [0.94, 0.56], [1.0, 0.12], [0.97, -0.4], [0.86, -0.78], [0.45, -1.0], [0, -1.04], [-0.45, -1.0], [-0.86, -0.78]];
    const face = blob(bpts(t, 'face', base.map(([u, v]) => [x + (u + sh * 0.15 * clamp(v + 0.2, 0, 1)) * R, y + v * R + (v > 0.5 ? open * R * 0.06 : 0)]), 1.0), 0.42);
    shape(ink1, face, { tone: 0, ol: 8 });
    each(ink1, (g) => { g.save(); face(g); g.clip(); });
    dots(ink1, ell(x - Math.sign(turn || 1) * R * 1.05, y + R * 0.2, R * 0.55, R * 1.3), 0.18, [x - R * 1.8, y - R * 1.3, x + R * 1.8, y + R * 1.3]);
    each(ink1, (g) => g.restore());
    // short curls escaping under the beanie at the sides and over the brow
    const curls = [[-0.95, -0.2, 0.2], [-0.88, 0.05, 0.16], [0.95, -0.2, 0.2], [0.88, 0.05, 0.16], [-0.35, -0.5, 0.17], [-0.08, -0.52, 0.16], [0.22, -0.5, 0.17]];
    const cb = bpts(t, 'curls', curls.map(([u, v]) => [x + (u + sh * 0.2) * R, y + v * R]), 1.2);
    shape(ink1, (g) => { g.beginPath(); cb.forEach((c, i) => { const r = curls[i][2] * R; g.moveTo(c[0] + r, c[1]); g.arc(c[0], c[1], r, 0, TAU); }); }, { tone: 1, ol: 0 });
    // the beanie: a knit dome with a folded cuff, solid ink, the cuff's ribs knocked out
    const bxs = x + sh * R * 0.12;
    const dome = blob(bpts(t, 'beanie', [[bxs - R * 1.06, y - R * 0.5], [bxs - R * 1.02, y - R * 0.95], [bxs - R * 0.62, y - R * 1.34], [bxs, y - R * 1.46], [bxs + R * 0.62, y - R * 1.34], [bxs + R * 1.02, y - R * 0.95], [bxs + R * 1.06, y - R * 0.5]], 1.2), 0.45);
    shape(ink1, dome, { tone: 1, ol: 0 });
    const cuff = poly([[bxs - R * 1.1, y - R * 0.74], [bxs + R * 1.1, y - R * 0.74], [bxs + R * 1.08, y - R * 0.42], [bxs - R * 1.08, y - R * 0.42]]);
    shape(ink1, cuff, { tone: 1, ol: 0 });
    each(ink1, (g) => { g.save(); cuff(g); g.clip(); g.globalCompositeOperation = 'destination-out'; g.lineWidth = lw(5); for (let i = -9; i <= 9; i++) { g.beginPath(); g.moveTo(bxs + i * R * 0.12, y - R * 0.7); g.lineTo(bxs + i * R * 0.12, y - R * 0.46); g.stroke(); } g.restore(); });
    eraseLine(ink1, polyOpen([[bxs - R * 1.1, y - R * 0.75], [bxs + R * 1.1, y - R * 0.75]]), 6);
    // brows: thick, low and alive
    const brow = p.brow ?? 0, frown = p.frown ?? 0, sad = p.sad ?? 0;
    for (const sg of [-1, 1]) {
      const th = sg * 0.44, v = sv_(th, turn); if (v < 0.05) continue;
      const cx = fx(th), cy = y - R * 0.27 - brow * R * 0.1, half = R * 0.25 * (0.55 + 0.45 * v);
      shape(ink1, capsule(cx - sg * half, cy + frown * R * 0.12 - brow * R * 0.04 - sad * R * 0.16, cx + sg * half, cy - R * 0.03 + sad * R * 0.08, R * 0.085, R * 0.07), { tone: 1, ol: 0 });
    }
    // eyes: paper whites, pink pupils with a glint, a heavy upper lid
    const lk = p.look ?? [0, 0];
    for (const sg of [-1, 1]) {
      const th = sg * 0.42, v = sv_(th, turn); if (v < 0.05) continue;
      const cx = fx(th), cy = y + R * 0.06, ew = R * 0.42 * (0.4 + 0.6 * v), eh = Math.max(1, R * 0.32 * (1 - blink));
      const eye = ell(cx, cy, ew / 2, eh / 2);
      shape(ink1, eye, { tone: 0, ol: 7 });
      if (blink < 0.6) {
        const px = cx + clamp(lk[0] * 0.3 + sh * 0.18, -0.32, 0.32) * ew, py = cy + lk[1] * eh * 0.22, pr = R * 0.12 * (0.55 + 0.45 * v);
        each(ink1, (g) => { g.save(); eye(g); g.clip(); g.beginPath(); g.arc(px, py, pr, 0, TAU); g.fill(); g.restore(); });
        erase(ink1, circ(px - pr * 0.35, py - pr * 0.4, pr * 0.3));
      }
      line(ink1, curve([[cx - ew * 0.58, cy], [cx, cy - eh * 0.62], [cx + ew * 0.58, cy]]), 12);
    }
    // a strong nose, pointing the way he faces
    const nx = fx(0) + sh * R * 0.2;
    line(ink1, curve([[nx - R * 0.05, y + R * 0.1], [nx + R * 0.14, y + R * 0.4], [nx + R * 0.02, y + R * 0.5], [nx - R * 0.12, y + R * 0.47]]), 8);
    for (const sg of [-1, 1]) { const th = sg * 0.62, v = sv_(th, turn); if (v < 0.25) continue; for (let i = 0; i < 3; i++) fill(ink1, circ(fx(th) + (rnd('fk', sg, i) - 0.5) * R * 0.26, y + R * 0.4 + (rnd('fy', sg, i) - 0.5) * R * 0.12, R * 0.025)); }
    mouthHim(fx(0) + sh * R * 0.08, y + R * 0.74, R, turn, p.mouth ?? 'flat', open, p.smile ?? 0);
  }
  function mouthHim(mx, my, R, turn, kind, open, smile) {
    const ink1 = [PK], w = R * 0.62 * (0.72 + 0.28 * Math.cos(turn * 0.55));
    if (kind === 'talk' || kind === 'o') {
      const ww = kind === 'o' ? w * 0.38 : w * (0.6 + 0.25 * smile), hh = R * (0.06 + 0.36 * open);
      const lift = smile * R * 0.06;
      const m = blob([[mx - ww / 2, my - lift], [mx - ww * 0.2, my - hh * 0.4], [mx + ww * 0.2, my - hh * 0.4], [mx + ww / 2, my - lift], [mx + ww * 0.24, my + hh * 0.62], [mx - ww * 0.24, my + hh * 0.62]], 0.6);
      shape(ink1, m, { tone: 1, ol: 8 });
      if (open > 0.3 && kind === 'talk') each(ink1, (g) => { g.save(); m(g); g.clip(); g.globalCompositeOperation = 'destination-out'; g.fillRect(mx - ww * 0.34, my - hh * 0.6, ww * 0.68, hh * 0.3); g.restore(); });
    } else if (kind === 'grin') {
      const ww = w * 1.25, hh = R * (0.24 + 0.12 * open);
      const m = blob([[mx - ww / 2, my - R * 0.1], [mx, my - R * 0.03], [mx + ww / 2, my - R * 0.1], [mx + ww * 0.32, my + hh * 0.78], [mx - ww * 0.32, my + hh * 0.78]], 0.55);
      shape(ink1, m, { tone: 1, ol: 8 });
      each(ink1, (g) => {
        g.save(); m(g); g.clip(); g.globalCompositeOperation = 'destination-out'; g.fillRect(mx - ww * 0.5, my - R * 0.12, ww, hh * 0.42); g.restore();
        g.save(); m(g); g.clip(); g.fillRect(mx + ww * 0.02, my - R * 0.12, ww * 0.055, hh * 0.42); g.restore();
      });
      for (const sg of [-1, 1]) line(ink1, curve([[mx + sg * ww * 0.56, my - R * 0.2], [mx + sg * ww * 0.6, my - R * 0.06]]), 6);
    } else if (kind === 'sad') {
      line(ink1, curve([[mx - w * 0.36, my + R * 0.08], [mx, my - R * 0.05], [mx + w * 0.36, my + R * 0.08]]), 10);
    } else {
      line(ink1, curve([[mx - w * 0.3, my - smile * R * 0.04], [mx, my + R * 0.02 - smile * R * 0.02], [mx + w * 0.3, my - smile * R * 0.06]]), 10);
    }
  }
  // him from behind (the gate): the beanie, the stripes
  function backHim(t, x, y, s, sway = 0, tall = 4.2) {
    const R = 140 * s, [bx, by] = boil(t, 'bh', 1.2);
    each(BOTH, (g) => { g.save(); g.translate(bx + sway, by); });
    try {
      const foot = y + R * tall;
      const back = poly([[x - R * 1.88, foot], [x - R * 1.8, y + R * 2.0], [x - R * 1.68, y + R * 1.4], [x - R * 0.62, y + R * 0.98], [x + R * 0.62, y + R * 0.98], [x + R * 1.68, y + R * 1.4], [x + R * 1.8, y + R * 2.0], [x + R * 1.88, foot]]);
      shape([PK], back, { tone: 0, ol: 8 });
      stripes(back, [x - R * 2, y, x + R * 2, foot + 10], R);
      shape([PK], ell(x, y + R * 0.1, R * 0.82, R * 0.9), { tone: 0.15, bb: [x - R, y - R, x + R, y + R * 1.1], ol: 8 });
      shape([PK], blob([[x - R * 0.9, y + R * 0.05], [x - R * 0.85, y - R * 0.55], [x, y - R * 0.95], [x + R * 0.85, y - R * 0.55], [x + R * 0.9, y + R * 0.05]], 0.45), { tone: 1, ol: 0 });
      shape([PK], rect(x - R * 0.93, y - R * 0.12, R * 1.86, R * 0.3), { tone: 1, ol: 0 });
    } finally { each(BOTH, (g) => g.restore()); }
  }

  // ------------------------------------------------------------------ YOU (teal): your cuffed hands, seen from your own eyes
  // YOU (teal): your cuffed hands, seen from your own eyes. l and r: [wrist x, wrist y, angle, pose]; sleeves (dots, an
  // outline: not the table's solid colour) run from far below the frame up to the wrists; the cuffs are dark bands with
  // three links between (bands, never two rings: two rings and a line read as spectacles, reel 38). open: 0–1, FREE
  function yourHands(t, p) {
    const sz = p.sz ?? 120, [bx, by] = boil(t, 'yh', 1.1), open = clamp(p.open ?? 0);
    each(BOTH, (g) => { g.save(); g.translate(bx, by); });
    try {
      if (p.hover) { const [hx, hy] = p.hover.tip, h = p.hover.h; shape([TE], ell(hx + 5 * h, hy + 9 * h, 4.2, 2.6), { tone: 0.55, bb: [hx - 10, hy - 10, hx + 40, hy + 50], ol: 0 }); }
      const wr = { l: p.l, r: p.r };
      for (const side of ['l', 'r']) {
        const [x, y, a] = wr[side], sg = side === 'l' ? -1 : 1, far = [x + sg * sz * 1.4 - Math.sin(a) * sz * 9, y + Math.cos(a) * sz * 9];
        const sl = capsule(far[0], far[1], x - Math.sin(a) * sz * 0.08, y + Math.cos(a) * sz * 0.08, sz * 0.5, sz * 0.31);
        shape([TE], sl, { tone: 0.45, bb: bbOf([far, [x, y]], sz * 0.6), ol: 8 });
      }
      for (const side of ['l', 'r']) {
        const [x, y, a, pose] = wr[side], sg = side === 'l' ? -1 : 1;
        hand([TE], x, y, a, sz, pose, { flip: sg, t, id: 'you' + side });
      }
      // the cuffs: dark bands round the wrists; open, each band splits and swings apart and the chain drops away
      for (const side of ['l', 'r']) {
        const [x, y, a] = wr[side], sg = side === 'l' ? -1 : 1;
        each(BOTH, (g) => { g.save(); g.translate(x - Math.sin(a) * sz * 0.08, y + Math.cos(a) * sz * 0.08); g.rotate(a); });
        try {
          if (open < 0.02) { shape(BOTH, (g) => { g.beginPath(); g.roundRect(-sz * 0.3, -sz * 0.08, sz * 0.6, sz * 0.18, sz * 0.06); }, { tone: 1, ol: 0 }); erase(BOTH, rect(-sz * 0.22, -sz * 0.02, sz * 0.44, sz * 0.04)); }
          else for (const h of [-1, 1]) {
            const sw = E.out(open) * 0.9 * h, dropC = E.in(open) * sz * 0.45;
            each(BOTH, (g) => { g.save(); g.translate(h * sz * 0.3, dropC); g.rotate(sw); });
            try { shape(BOTH, (g) => { g.beginPath(); g.roundRect(h > 0 ? -sz * 0.3 : 0, -sz * 0.08, sz * 0.3, sz * 0.18, sz * 0.06); }, { tone: 1, ol: 0 }); }
            finally { each(BOTH, (g) => g.restore()); }
          }
        } finally { each(BOTH, (g) => g.restore()); }
      }
      const a0 = [p.l[0] + sz * 0.22, p.l[1] + sz * 0.12], a1 = [p.r[0] - sz * 0.22, p.r[1] + sz * 0.12];
      const dist = Math.hypot(a1[0] - a0[0], a1[1] - a0[1]), dir = Math.atan2(a1[1] - a0[1], a1[0] - a0[0]);
      const mid = [(a0[0] + a1[0]) / 2, Math.max(a0[1], a1[1]) + Math.max(sz * 0.04, (sz - dist) * 0.45)];
      const fall = E.in(open) * sz * 0.7, nL = Math.max(3, Math.round(dist / (sz * 0.15)));
      for (let i = 1; i <= nL; i++) {
        const u = i / (nL + 1), px = lerp(lerp(a0[0], mid[0], u), lerp(mid[0], a1[0], u), u), py = lerp(lerp(a0[1], mid[1], u), lerp(mid[1], a1[1], u), u) + fall;
        line(BOTH, ell(px, py, sz * 0.09, sz * 0.055, dir + (i % 2 ? 0.25 : -0.25)), 6);
      }
    } finally { each(BOTH, (g) => g.restore()); }
  }

  function you(t, p) {
    const s = p.s ?? 1, R = 130 * s, x = p.x + (p.sway ?? 0), y = p.y, look = p.look ?? 0, ink1 = [TE];
    const [bx, by] = boil(t, 'you', 1.2);
    each(BOTH, (g) => { g.save(); g.translate(bx, by); });
    try {
      const sy = y + R * 0.92;
      const foot = y + R * (p.tall ?? 4.4);
      const back = poly([[x - R * 2.12, foot], [x - R * 2.05, sy + R * 1.2], [x - R * 1.9, sy + R * 0.55], [x - R * 1.45, sy + R * 0.05], [x - R * 0.6, sy - R * 0.2], [x + R * 0.6, sy - R * 0.2], [x + R * 1.45, sy + R * 0.05], [x + R * 1.9, sy + R * 0.55], [x + R * 2.05, sy + R * 1.2], [x + R * 2.12, foot]]);
      shape(ink1, back, { tone: p.dark ? 1 : 0.72, bb: [x - R * 2.3, sy - R * 0.4, x + R * 2.3, foot + 10], ol: 8 });
      if (p.dark) eraseLine(BOTH, back, 6);
      eraseLine(ink1, curve([[x - R * 1.9, sy + R * 0.6], [x - R * 1.4, sy + R * 0.12], [x - R * 0.7, sy - R * 0.1]]), 9);
      eraseLine(ink1, curve([[x + R * 0.7, sy - R * 0.1], [x + R * 1.4, sy + R * 0.12], [x + R * 1.9, sy + R * 0.6]]), 9);
      // the hood down, bunched on your shoulders
      const dk = p.dark ? 1 : 0, hx = x + look * R * 0.06;
      const collar = blob([[x - R * 0.95, sy + R * 0.02], [x - R * 0.62, sy - R * 0.34], [x, sy - R * 0.42], [x + R * 0.62, sy - R * 0.34], [x + R * 0.95, sy + R * 0.02], [x + R * 0.5, sy + R * 0.42], [x, sy + R * 0.5], [x - R * 0.5, sy + R * 0.42]], 0.5);
      shape(ink1, collar, { tone: dk ? 1 : 0.9, bb: [x - R, sy - R * 0.5, x + R, sy + R * 0.6], ol: 8 });
      if (dk) eraseLine(BOTH, collar, 6);
      eraseLine(ink1, curve([[x - R * 0.55, sy - R * 0.05], [x, sy + R * 0.12], [x + R * 0.55, sy - R * 0.05]]), 5);
      // ears, the back of the head, and short hair, tufted at the crown and ragged at the nape; turning, the hair goes
      // the other way and the line of a cheek shows
      for (const sg of [-1, 1]) {
        const ex = hx + sg * R * (Math.sign(look) === sg ? 0.8 - 0.12 * Math.abs(look) : 0.8);
        shape(ink1, ell(ex, y + R * 0.1, R * 0.15, R * 0.23), { tone: dk, ol: 7 });
      }
      const head = ell(hx, y, R * 0.8, R * 0.95);
      shape(ink1, head, { tone: dk, ol: 8 });
      const hs = hx - look * R * 0.12;
      const hairPts = [[hs - R * 0.82, y - R * 0.02], [hs - R * 0.84, y - R * 0.5], [hs - R * 0.66, y - R * 0.92], [hs - R * 0.42, y - R * 0.88], [hs - R * 0.26, y - R * 1.14], [hs - R * 0.04, y - R * 0.96], [hs + R * 0.18, y - R * 1.16], [hs + R * 0.36, y - R * 0.92], [hs + R * 0.62, y - R * 0.98], [hs + R * 0.84, y - R * 0.5], [hs + R * 0.82, y - R * 0.02], [hs + R * 0.7, y + R * 0.5], [hs + R * 0.4, y + R * 0.66], [hs + R * 0.2, y + R * 0.58], [hs, y + R * 0.7], [hs - R * 0.2, y + R * 0.58], [hs - R * 0.4, y + R * 0.66], [hs - R * 0.7, y + R * 0.5]];
      const hair = blob(bpts(t, 'hair', hairPts, 1.2), 0.5);
      shape(ink1, hair, { tone: 1, ol: 0 });
      if (dk) { eraseLine(BOTH, head, 6); eraseLine(BOTH, hair, 6); }
      for (const [a0, a1, a2] of [[[-0.1, -0.7], [0.12, -0.4], [0.05, 0.1]], [[0.3, -0.62], [0.42, -0.2], [0.3, 0.3]], [[-0.45, -0.55], [-0.38, -0.1], [-0.48, 0.3]]]) {
        eraseLine(ink1, curve([[hs + R * a0[0], y + R * a0[1]], [hs + R * a1[0], y + R * a1[1]], [hs + R * a2[0], y + R * a2[1]]]), 4);
      }
      if (Math.abs(look) > 0.4) {
        const sg = Math.sign(look);
        line(BOTH, curve([[hx + sg * R * 0.78, y + R * 0.05], [hx + sg * R * 0.86, y + R * 0.4], [hx + sg * R * 0.66, y + R * 0.8]]), 6);
      }
      if (p.wallHand != null) {                             // a hand raised flat against the wall (screen-left)
        const k = p.wallHand, hxw = lerp(x - R * 1.6, x - R * 2.35, k), hyw = lerp(sy + R * 1.6, y - R * 0.2, k);
        shape(ink1, capsule(x - R * 1.4, sy + R * 0.6, hxw + R * 0.25, hyw + R * 0.35, R * 0.36, R * 0.3), { tone: 0.72, bb: bbOf([[x - R * 1.4, sy + R * 0.6], [hxw, hyw]], R), ol: 7 });
        hand([TE], hxw, hyw, -0.35 - 0.2 * k, R * 0.75, 'back', { flip: -1, t, id: 'ywh' });
      }
    } finally { each(BOTH, (g) => g.restore()); }
  }

  // ------------------------------------------------------------------ the officers (the dark overprint: both inks)
  // OFFICER A, your room: heavy, balding, a moustache, a tie; elbows on the table. p: x, y, s, turn, open, brow, frown,
  // look, part, arms {l, r: [angle, pose, handAng]}
  function officerA(t, p) {
    const s = p.s ?? 1, R = 140 * s, x = p.x, y = p.y, turn = p.turn ?? 0, ink2 = BOTH, sh = Math.sin(turn * 0.55);
    const [bx, by] = boil(t, 'offA', 1.1);
    each(BOTH, (g) => { g.save(); g.translate(bx, by); });
    try {
      const sy = y + R * 1.08, shL = [x - R * 1.55, sy + R * 0.42], shR = [x + R * 1.55, sy + R * 0.42];
      if (p.part !== 'arms') {
        const body = blob([[x - R * 2.1, sy + R * 2.8], [x - R * 1.95, sy + R * 0.45], [x - R * 1.2, sy - R * 0.08], [x - R * 0.4, sy - R * 0.2], [x + R * 0.4, sy - R * 0.2], [x + R * 1.2, sy - R * 0.08], [x + R * 1.95, sy + R * 0.45], [x + R * 2.1, sy + R * 2.8]]);
        shape(ink2, body, { tone: 0.1, bb: [x - R * 2.2, sy - R * 0.3, x + R * 2.2, sy + R * 2.9] });
        shape(ink2, poly([[x - R * 0.13, sy + R * 0.02], [x + R * 0.13, sy + R * 0.02], [x + R * 0.22, sy + R * 1.4], [x, sy + R * 1.65], [x - R * 0.22, sy + R * 1.4]]), { tone: 1, ol: 0 });
        line(ink2, polyOpen([[x - R * 0.55, sy - R * 0.16], [x - R * 0.1, sy + R * 0.2], [x, sy - R * 0.02], [x + R * 0.1, sy + R * 0.2], [x + R * 0.55, sy - R * 0.16]]), 8);
        shape(ink2, poly([[x - R * 0.42, y + R * 0.72], [x + R * 0.42, y + R * 0.72], [x + R * 0.5, sy], [x - R * 0.5, sy]]), { tone: 0.3, bb: [x - R, y, x + R, sy + R * 0.3] });
        const mo = p.open ?? 0;
        const base = [[-0.98, -0.25], [-1.02, 0.2], [-0.94, 0.6], [-0.7, 0.92 + mo * 0.06], [-0.32, 1.08 + mo * 0.1], [0, 1.1 + mo * 0.12], [0.32, 1.08 + mo * 0.1], [0.7, 0.92 + mo * 0.06], [0.94, 0.6], [1.02, 0.2], [0.98, -0.25], [0.84, -0.66], [0.48, -0.92], [0, -0.98], [-0.48, -0.92], [-0.84, -0.66]];
        const face = blob(bpts(t, 'faceA', base.map(([u, v]) => [x + (u + sh * 0.14 * clamp(v + 0.2, 0, 1)) * R, y + v * R]), 1.0));
        shape(ink2, face, { tone: 0, ol: 8 });
        each(ink2, (g) => { g.save(); face(g); g.clip(); });
        dots(ink2, ell(x - Math.sign(turn || 1) * R * 1.05, y + R * 0.25, R * 0.6, R * 1.3), 0.2, [x - R * 1.8, y - R * 1.3, x + R * 1.8, y + R * 1.4]);
        dots(ink2, ell(x + sh * R * 0.1, y - R * 0.95, R * 0.95, R * 0.35), 0.22, [x - R * 1.2, y - R * 1.4, x + R * 1.2, y - R * 0.5]);
        each(ink2, (g) => g.restore());
        erase(ink2, ell(x - R * 0.28 + sh * R * 0.2, y - R * 0.72, R * 0.22, R * 0.08, -0.25));
        const fx = (th) => x + sx_(th, turn) * R;
        for (const sg of [-1, 1]) {
          const th = sg * 1.42, v = sv_(th, turn); if (v < 0.05) continue;
          const cx = x + sx_(th, turn) * R + sg * R * 0.06;
          shape(ink2, ell(cx, y + R * 0.12, R * 0.13 * (0.45 + 0.55 * v), R * 0.22), { tone: 0, ol: 7 });
          line(ink2, curve([[cx - sg * R * 0.02, y + R * 0.04], [cx + sg * R * 0.04, y + R * 0.14], [cx, y + R * 0.24]]), 5);
          shape(ink2, blob([[cx - R * 0.1, y - R * 0.5], [cx + R * 0.1, y - R * 0.52], [cx + R * 0.09, y - R * 0.1], [cx - R * 0.06, y - R * 0.08]]), { tone: 0.6, bb: [cx - R * 0.2, y - R * 0.6, cx + R * 0.2, y], ol: 5 });
        }
        for (const sg of [-1, 1]) {
          const th = sg * 0.44, v = sv_(th, turn); if (v < 0.05) continue;
          const cx = fx(th), cy = y - R * 0.3 - (p.brow ?? 0) * R * 0.1, half = R * 0.26 * (0.55 + 0.45 * v);
          shape(ink2, capsule(cx - sg * half, cy + R * 0.1 * (p.frown ?? 0.6), cx + sg * half, cy - R * 0.04, R * 0.085, R * 0.07), { tone: 1, ol: 0 });
        }
        const lk = p.look ?? [0, 0];
        for (const sg of [-1, 1]) {
          const th = sg * 0.42, v = sv_(th, turn); if (v < 0.05) continue;
          const cx = fx(th), cy = y - R * 0.06, ew = R * 0.36 * (0.4 + 0.6 * v);
          shape(ink2, ell(cx, cy, ew / 2, R * 0.1), { tone: 0, ol: 7 });
          fill(ink2, circ(cx + clamp(lk[0] * 0.3 + sh * 0.15, -0.3, 0.3) * ew, cy + lk[1] * R * 0.03, R * 0.075));
          line(ink2, curve([[cx - ew * 0.4, cy + R * 0.2], [cx, cy + R * 0.25], [cx + ew * 0.4, cy + R * 0.2]]), 5);
        }
        const nx = fx(0) + sh * R * 0.18;
        line(ink2, curve([[nx - R * 0.04, y + R * 0.02], [nx + R * 0.16, y + R * 0.34], [nx + R * 0.04, y + R * 0.46], [nx - R * 0.16, y + R * 0.42]]), 8);
        fill(ink2, circ(nx - R * 0.07, y + R * 0.4, R * 0.035));
        const mx = nx - sh * R * 0.06;
        // the mouth opens under the moustache: a dark opening with a band of teeth, the chin dropping with it
        if (mo > 0.05) {
          const mh = R * (0.06 + 0.16 * mo), m = ell(mx, y + R * 0.72 + mh * 0.5, R * (0.1 + 0.03 * mo), mh * 0.62);
          shape(ink2, m, { tone: 1, ol: 0 });
          each(ink2, (g) => { g.save(); m(g); g.clip(); g.globalCompositeOperation = 'destination-out'; g.fillRect(mx - R * 0.14, y + R * 0.66, R * 0.28, mh * 0.34); g.restore(); });
          line(ink2, curve([[mx - R * 0.12, y + R * 0.78 + mh], [mx, y + R * 0.82 + mh], [mx + R * 0.12, y + R * 0.78 + mh]]), 6);   // the lower lip
        }
        shape(ink2, blob([[mx - R * 0.5, y + R * 0.7], [mx - R * 0.36, y + R * 0.5], [mx, y + R * 0.55], [mx + R * 0.36, y + R * 0.5], [mx + R * 0.5, y + R * 0.7], [mx + R * 0.24, y + R * 0.66], [mx, y + R * 0.62], [mx - R * 0.24, y + R * 0.66]], 0.5), { tone: 1, ol: 0 });
        line(ink2, curve([[x - R * 0.7, y + R * 0.98 + mo * R * 0.08], [x, y + R * 1.2 + mo * R * 0.12], [x + R * 0.7, y + R * 0.98 + mo * R * 0.08]]), 6);
      }
      if (p.part !== 'body' && p.arms) {
        const sleeve = null;
        for (const side of ['l', 'r']) {
          const a = p.arms[side]; if (!a) continue;
          const sg = side === 'l' ? -1 : 1, sh2 = sg < 0 ? shL : shR;
          const ex = Array.isArray(p.elbowX) ? p.elbowX[sg < 0 ? 0 : 1] : (p.elbowX ?? 1.25), el = [x + sg * R * ex, y + R * 3.05];
          seatedArm(ink2, sh2, el, a[0], R * 1.25, R * 0.32, { pose: a[1], handAng: a[2], flip: sg, hs: R * 0.85, t, id: 'oa' + side, tone: 0.12, handTone: 0.18, ls: lsOf(a[0]) });
        }
      }
    } finally { each(BOTH, (g) => g.restore()); }
  }
  // OFFICER B, his room: in profile facing right, glasses, a bun. p: x, y, s, laugh 0–1 (head back, mouth open), pen
  function officerB(t, p) {
    const s = p.s ?? 1, R = 130 * s, x = p.x, y = p.y, lg = p.laugh ?? 0, ink2 = BOTH;
    const [bx, by] = boil(t, 'offB', 1.1);
    each(BOTH, (g) => { g.save(); g.translate(bx, by - lg * R * 0.06); });
    try {
      const sy = y + R * 1.05;
      shape(ink2, blob([[x - R * 1.4, sy + R * 2.6], [x - R * 1.3, sy + R * 0.3], [x - R * 0.5, sy - R * 0.25 - lg * R * 0.1], [x + R * 0.3, sy - R * 0.15 - lg * R * 0.1], [x + R * 1.0, sy + R * 0.4], [x + R * 1.3, sy + R * 2.6]]), { tone: 0.5, bb: [x - R * 1.5, sy - R * 0.5, x + R * 1.5, sy + R * 2.7] });
      shape(ink2, poly([[x - R * 0.3, y + R * 0.6], [x + R * 0.25, y + R * 0.6], [x + R * 0.3, sy], [x - R * 0.35, sy]]), { tone: 0, ol: 7 });
      const piv = [x, y + R * 0.5], back = -0.32 * lg;
      each(BOTH, (g) => { g.save(); g.translate(piv[0], piv[1]); g.rotate(back); g.translate(-piv[0], -piv[1]); });
      const prof = blob(bpts(t, 'profB', [[x - R * 0.78, y - R * 0.1], [x - R * 0.6, y - R * 0.72], [x - R * 0.05, y - R * 0.98], [x + R * 0.5, y - R * 0.72], [x + R * 0.66, y - R * 0.3], [x + R * 0.68, y - R * 0.12], [x + R * 0.9, y + R * 0.14], [x + R * 0.7, y + R * 0.24], [x + R * 0.74, y + R * 0.42 + lg * R * 0.1], [x + R * 0.6, y + R * 0.56 + lg * R * 0.3], [x + R * 0.66, y + R * 0.7 + lg * R * 0.3], [x + R * 0.4, y + R * 0.9 + lg * R * 0.22], [x - R * 0.1, y + R * 0.82], [x - R * 0.6, y + R * 0.45]], 1.0), 0.45);
      shape(ink2, prof, { tone: 0, ol: 8 });
      each(ink2, (g) => { g.save(); prof(g); g.clip(); });
      dots(ink2, ell(x - R * 0.6, y + R * 0.3, R * 0.5, R * 0.7), 0.18, [x - R * 1.2, y - R * 0.5, x + R * 0.2, y + R * 1.1]);
      each(ink2, (g) => g.restore());
      shape(ink2, blob([[x - R * 0.82, y + R * 0.3], [x - R * 0.84, y - R * 0.5], [x - R * 0.35, y - R * 1.04], [x + R * 0.3, y - R * 1.0], [x + R * 0.58, y - R * 0.66], [x + R * 0.1, y - R * 0.6], [x - R * 0.22, y - R * 0.2], [x - R * 0.42, y + R * 0.38]], 0.5), { tone: 1, ol: 0 });
      shape(ink2, circ(x - R * 0.98, y - R * 0.56, R * 0.3), { tone: 1, ol: 0 });
      line(ink2, ell(x - R * 0.2, y + R * 0.02, R * 0.09, R * 0.14), 6);
      shape(ink2, (g) => { g.beginPath(); g.roundRect(x + R * 0.26, y - R * 0.3, R * 0.38, R * 0.26, R * 0.08); }, { tone: 0, ol: 7 });
      line(ink2, polyOpen([[x + R * 0.26, y - R * 0.2], [x - R * 0.15, y - R * 0.1]]), 6);
      if (lg > 0.3) line(ink2, curve([[x + R * 0.33, y - R * 0.16], [x + R * 0.45, y - R * 0.24], [x + R * 0.57, y - R * 0.16]]), 7);
      else shape(ink2, ell(x + R * 0.47, y - R * 0.17, R * 0.07, R * 0.05), { tone: 1, ol: 0 });
      line(ink2, curve([[x + R * 0.28, y - R * 0.4 - lg * R * 0.05], [x + R * 0.46, y - R * 0.46 - lg * R * 0.06], [x + R * 0.62, y - R * 0.4]]), 7);
      if (lg > 0.08) shape(ink2, blob([[x + R * 0.56, y + R * 0.38], [x + R * 0.78, y + R * 0.42], [x + R * 0.72, y + R * 0.5 + lg * R * 0.26], [x + R * 0.52, y + R * 0.5 + lg * R * 0.22]], 0.5), { tone: 1, ol: 0 });
      else line(ink2, curve([[x + R * 0.54, y + R * 0.46], [x + R * 0.72, y + R * 0.44]]), 7);
      each(BOTH, (g) => g.restore());
    } finally { each(BOTH, (g) => g.restore()); }
  }

  // ------------------------------------------------------------------ the rooms (room space, 1080 × 1920)
  function room(t, nm, { doorX = 640, poster = false, light = 0, open = 0, ajar = 0 } = {}) {
    const ink1 = [nm], li = E.inOut(clamp(light));
    dots(ink1, rect(-600, -400, 2300, 2900), lerp(0.34, 0.1, li), [-600, -400, 1700, 2500]);
    const pool = poly([[500, 372], [580, 372], [930, 1250], [150, 1250]]);
    erase(ink1, pool); dots(ink1, pool, 0.07, [140, 360, 940, 1260]);
    dots(ink1, rect(-600, 1500, 2300, 1000), lerp(0.58, 0.25, li), [-600, 1500, 1700, 2500]);
    line(ink1, polyOpen([[-600, 1500], [1700, 1500]]), 8);
    const dx = doorX, dy = 520, dw = 220, dh = 640;
    shape(ink1, rect(dx - 16, dy - 16, dw + 32, dh + 16), { tone: 1, ol: 0 });
    const op = Math.max(E.out(clamp(open)), ajar);
    if (op > 0.01) {
      erase(BOTH, rect(dx, dy, dw, dh));
      shape(ink1, poly([[dx, dy], [dx + dw * (1 - 0.8 * op), dy - 30 * op], [dx + dw * (1 - 0.8 * op), dy + dh + 30 * op], [dx, dy + dh]]), { tone: 0.5, bb: [dx, dy - 40, dx + dw, dy + dh + 40], ol: 7 });
    } else {
      shape(ink1, rect(dx, dy, dw, dh), { tone: 0.12, bb: [dx, dy, dx + dw, dy + dh], ol: 7 });
      shape(ink1, rect(dx + 58, dy + 70, dw - 116, 130), { tone: 0.8, bb: [dx, dy, dx + dw, dy + 240], ol: 6 });
      fill(ink1, circ(dx + 26, dy + 350, 10));
    }
    if (poster) wantedPoster(t, 245, 690);
    line(ink1, polyOpen([[540, -400], [540, 300]]), 6);
    shape(ink1, poly([[478, 298], [602, 298], [650, 374], [430, 374]]), { tone: 1, ol: 0 });
    erase(BOTH, ell(540, 374, 108, 13)); line(ink1, ell(540, 374, 108, 13), 6);
  }
  function table(nm, { y = 1250 } = {}) {
    const ink1 = [nm];
    shape(ink1, poly([[140, y], [940, y], [1060, y + 170], [20, y + 170]]), { tone: 0.12, bb: [20, y, 1060, y + 170] });
    shape(ink1, poly([[20, y + 170], [1060, y + 170], [1060, y + 250], [20, y + 250]]), { tone: 1, ol: 0 });
  }
  // the season's thief on a WANTED poster: a cap with a domed crown and a bill (the cap first), the deepest ink we have for
  // its maroon, a clean face so the mole reads: on his left cheek, the screen's right as he faces you. Hidden once.
  function wantedPoster(t, px, py) {
    const ink2 = BOTH;
    LAB.scenery(() => {
      shape(ink2, poly([[px - 66, py - 90], [px + 66, py - 93], [px + 68, py + 90], [px - 64, py + 92]]), { tone: 0, ol: 6 });
      type('WANTED', px, py - 60, 25, { names: ink2 });
      shape([PK], ell(px, py + 26, 32, 38), { tone: 0, ol: 5 });
      shape([PK], blob([[px - 36, py + 8], [px - 30, py - 20], [px, py - 30], [px + 30, py - 20], [px + 36, py + 8]], 0.5), { tone: 1, ol: 0 });
      shape([PK], poly([[px - 4, py + 4], [px + 60, py + 2], [px + 62, py + 13], [px - 6, py + 14]]), { tone: 1, ol: 0 });
      fill(ink2, circ(px - 11, py + 26, 3.6)); fill(ink2, circ(px + 11, py + 26, 3.6));
      fill(ink2, circ(px + 18, py + 42, 4.2));
      line(ink2, polyOpen([[px - 9, py + 50], [px + 9, py + 50]]), 4);
    });
  }

  // ------------------------------------------------------------------ the deal sheet, the ballot, the doodle, the files
  // dl: the doodle drawn so far (0–1); life: the doodle's own animation at the end ({ five, shh, peek })
  function dealSheet(t, x, y, s, ang, { dl = 0, life = null } = {}) {
    const ink2 = BOTH;
    each(BOTH, (g) => { g.save(); g.translate(x, y); g.rotate(ang); g.scale(s, s); });
    const prev = CAM; CAM = { ...CAM, s: CAM.s * s };
    try {
      shape(ink2, poly([[-170, -230], [170, -230], [172, 230], [-168, 232]]), { tone: 0, ol: 6 });
      type('CASE 46', -140, -180, 32, { align: 'left', names: ink2 });
      line(ink2, polyOpen([[-140, -160], [140, -160]]), 4);
      for (const [i, lab] of [[0, 'STAY SILENT'], [1, 'TALK']]) {
        const yy = -100 + i * 78;
        line(ink2, rect(-140, yy - 30, 40, 40), 5);
        type(lab, -84, yy + 4, 34, { align: 'left', names: ink2 });
      }
      line(ink2, polyOpen([[-140, 190], [140, 190]]), 4);
      if (dl > 0) doodleArt(t, 0, 106, 0.95, dl, life);
    } finally { CAM = prev; each(BOTH, (g) => g.restore()); }
  }
  // his doodle: the two of you, masks up, high-fiving; where your hands meet, the two inks overprint. Drawn stroke by
  // stroke (dl), and at the end it comes alive: the high-five slaps again, he says shh, you glance at him.
  function doodleArt(t, x, y, s, dl, life) {
    const L = life || {}, five = L.five ?? 0, shh = L.shh ?? 0, peek = L.peek ?? 0;
    const slap = five >= 1 ? 1 : 0.5 + 0.5 * Math.cos(clamp(five) * Math.PI * 4);   // together → apart → together, twice
    const reach = five > 0 ? lerp(0.82, 1.0, slap) : 1;
    const strokes = (cx, sg, inkN, extra) => {
      const S_ = [];
      S_.push((g) => { g.beginPath(); g.arc(cx, y - 66 * s, 21 * s, 0, TAU); g.stroke(); });
      S_.push((g) => { g.beginPath(); g.moveTo(cx - 23 * s, y - 70 * s); g.lineTo(cx + 23 * s, y - 70 * s); g.lineWidth = lw(10); g.stroke(); });
      S_.push((g) => { g.beginPath(); g.moveTo(cx, y - 45 * s); g.lineTo(cx - sg * 3 * s, y + 18 * s); g.stroke(); });
      S_.push((g) => { g.beginPath(); g.moveTo(cx - sg * 3 * s, y + 18 * s); g.lineTo(cx - 20 * s, y + 58 * s); g.moveTo(cx - sg * 3 * s, y + 18 * s); g.lineTo(cx + 20 * s, y + 58 * s); g.stroke(); });
      S_.push(extra);
      return S_;
    };
    const fiveArm = (cx, sg) => (g) => { g.beginPath(); g.moveTo(cx, y - 28 * s); g.lineTo(cx + sg * 38 * s * reach, y - 88 * s); g.stroke(); };
    const freeArm = (cx, sg, up) => (g) => {
      g.beginPath(); g.moveTo(cx, y - 28 * s);
      if (up > 0.01) g.lineTo(cx - sg * lerp(32, 27, up) * s, lerp(y - 2 * s, y - 16 * s, up));
      g.lineTo(cx - sg * lerp(32, -2, up) * s, lerp(y - 2 * s, y - 45 * s, up)); g.stroke();
    };
    const you_ = strokes(x - 50 * s, 1, TE, fiveArm(x - 50 * s, 1)), him_ = strokes(x + 50 * s, -1, PK, fiveArm(x + 50 * s, -1));
    you_.push(freeArm(x - 50 * s, 1, 0)); him_.push(freeArm(x + 50 * s, -1, clamp(shh * 1.6)));
    const all = [];
    for (let i = 0; i < 6; i++) { all.push([TE, you_[i]]); all.push([PK, him_[i]]); }
    const n = Math.floor(clamp(dl) * all.length + 1e-6);
    for (let i = 0; i < n; i++) {
      const [nm, f] = all[i];
      each([nm], (g) => { g.save(); g.lineWidth = lw(5.5); g.lineCap = 'round'; g.lineJoin = 'round'; f(g); g.restore(); });
    }
    if (dl >= 1) {
      // the hands meeting: both inks
      const hx = x - 50 * s + 38 * s * reach, hy = y - 88 * s;
      fill(BOTH, circ(hx, hy, 9 * s)); fill(BOTH, circ(x + 50 * s - 38 * s * reach, hy, 9 * s));
      if (slap > 0.9 || five <= 0) for (const [a, b] of [[[-20, -24], [-27, -38]], [[0, -28], [0, -44]], [[20, -24], [27, -38]]]) line(BOTH, polyOpen([[x + a[0] * s, hy + a[1] * s + 24 * s], [x + b[0] * s, hy + b[1] * s + 24 * s]]), 4);
      // his eyes over the mask; on "shh", a finger at his lips; on the last line, your eyes slide to him
      const ey = y - 70 * s;
      fill([PK], circ(x + 50 * s - 6 * s, ey + 4 * s, 2.6 * s)); fill([PK], circ(x + 50 * s + 6 * s, ey + 4 * s, 2.6 * s));
      const pe = clamp(peek) * 6 * s;
      fill([TE], circ(x - 50 * s - 6 * s + pe, ey + 4 * s, 2.6 * s)); fill([TE], circ(x - 50 * s + 6 * s + pe, ey + 4 * s, 2.6 * s));
      if (shh > 0.5) line([PK], polyOpen([[x + 52 * s, y - 43 * s], [x + 52 * s, y - 59 * s]]), 4);
    }
  }
  // the ballot under the rooms: two empty boxes, the viewer's to tick; a bar along its foot drains at the pick
  function ballot(t, t0, { drain = null } = {}) {
    if (t < t0) return;
    const k = clamp((t - t0) / 0.18), yy = 1478 + (1 - E.out(k)) * 36;
    occlude(rect(60, yy - 78, 880, 130));
    line(BOTH, rect(60, yy - 78, 880, 130), 6);
    line(BOTH, rect(96, yy - 44, 58, 58), 7);
    type('STAY SILENT', 176, yy + 9, 64, { align: 'left' });
    line(BOTH, rect(640, yy - 44, 58, 58), 7);
    type('TALK', 720, yy + 9, 64, { align: 'left' });
    if (drain != null) fill(BOTH, rect(66, yy + 30, 868 * (1 - clamp(drain)), 16));
  }
  function folder(t, x, y, ang, label, { s = 1, sub: subLabel = '' } = {}) {
    each(BOTH, (g) => { g.save(); g.translate(x, y); g.rotate(ang); g.scale(s, s); });
    const prev = CAM; CAM = { ...CAM, s: CAM.s * s };
    try {
      shape([PK], poly([[-330, -230], [-120, -230], [-92, -264], [62, -264], [90, -230], [330, -230], [330, 230], [-330, 230]]), { tone: 0.08, bb: [-340, -270, 340, 240], ol: 10 });
      line([PK], polyOpen([[-330, -196], [330, -196]]), 5);
      stamp(t, -1, label, 0, subLabel ? -10 : 24, 96, { angle: -0.05 });
      if (subLabel) type(subLabel, 6, 112, 58, { angle: -0.05 });
    } finally { CAM = prev; each(BOTH, (g) => g.restore()); }
  }
  // bars: their count is the sentence in years; they drop one after another and bounce on the floor, and lift away
  function barsOver(t, r4, count, t0, t1 = 1e9) {
    if (count <= 0 || t < t0) return;
    const [x0, y0, x1, y1] = r4, w = x1 - x0, lift = E.in(clamp((t - t1) / 0.3));
    if (lift >= 1) return;
    for (let i = 0; i < count; i++) {
      const bx = x0 + w * (i + 0.5) / count, k = clamp((t - t0 - 0.025 * i) / 0.24);
      const drop = (1 - E.bounce(k)) * (y1 - y0) + lift * (y1 - y0 + 200);
      shape(BOTH, rect(bx - 10, y0 - 60 - drop, 20, (y1 - y0) + 60), { tone: 1, ol: 0 });
    }
    if (count >= 5) shape(BOTH, rect(x0, y0 - 8 - lift * (y1 - y0 + 200), w, 18), { tone: 1, ol: 0 });
  }
  // a stamp kept inside the right safe edge (950) even at the size it lands from
  function stampIn(t, t0, txt, x, y, size, o = {}) {
    if (t < t0) return;
    const g = LY(TE); g.save(); g.font = `800 ${size}px Bricolage`; const w = g.measureText(txt).width; g.restore();
    const half = (w / 2 + size * 0.3) * 1.45;
    stamp(t, t0, txt, Math.min(x, 950 - half), y, size, o);
  }

  // ------------------------------------------------------------------ the split: two rooms and the wall between them
  const GUT = 48;
  // the wall stands where the story is: his room wide while he talks, yours while your officer deals, even for the
  // stakes, his again for the doubt
  function wallAt(t) {
    const a = S('d01') - 0.75, b = S('d03') - 0.1, c = F('n03') + 0.05;
    let x = 600;
    x = lerp(x, 400, sm(a, a + 0.55, t));
    x = lerp(x, 516, sm(b, b + 0.45, t));
    x = lerp(x, 660, sm(c, c + 0.45, t));
    return x;
  }
  function wallCut(x0) {
    const x1 = x0 + GUT;
    occlude(rect(x0, 0, GUT, H));
    each(BOTH, (g) => {
      g.save(); g.beginPath(); g.rect(x0, 0, GUT, H); g.clip(); g.lineWidth = 4;
      for (let yy = -80; yy < H + 80; yy += 26) { g.beginPath(); g.moveTo(x0 - 10, yy + 42); g.lineTo(x1 + 10, yy); g.stroke(); }
      g.restore();
    });
    line(BOTH, polyOpen([[x0, 0], [x0, H]]), 6); line(BOTH, polyOpen([[x1, 0], [x1, H]]), 6);
  }
  const th_ = (t) => held(t, N);
  const blinkAt = (t, list) => (list.some((b) => t >= b && t < b + 0.1) ? 1 : 0);
  // her laugh comes in the gaps (when the muffled voice and the laugh are heard), never over anyone's words
  const laughAt = (t) => {
    const gaps = [[F('n01') + 0.05, S('n02') - 0.05], [F('n03') + 0.05, S('n04') - 0.05]];
    let v = 0; for (const [a, b] of gaps) v = Math.max(v, Math.min(ramp(a, a + 0.12, t), ramp(b, b - 0.15, t)));
    return v;
  };
  // his room (the split, the reveal). He talks to her the whole time, but while your officer speaks he only listens and
  // nods (one moving mouth per voice we hear); in the doubt he draws on his sheet. arms / lean: a performance from outside
  function hisRoom(t, { doubt = 0, behind = false, look = null, mouth = null, laugh = 0, dl = 0, arms = null, lean = 0 } = {}) {
    room(t, PK, { doorX: 1000 });
    officerB(t, { x: 205, y: 950 + 5 * Math.sin(th_(t) * 15) * laugh, s: 0.95, laugh });
    const g = keyed(t, HIS_KEYS), th = th_(t);
    const listening = !behind && !arms && t >= S('d01') - 0.1 && t <= F('d03') + 0.3;
    const [ms, mo, msm] = mouth || (listening ? ['flat', 0, 0.35] : chatter(t));
    const nod = listening ? 0.05 * Math.sin(th * 5) : 0;
    const P = {
      x: 560, y: 830 + 4 * Math.sin(th * 1.8) + 24 * lean, s: 1.0, turn: doubt ? -0.05 : arms ? -0.35 : g[8],
      tilt: (doubt ? 0.12 : arms ? 0.02 + 0.08 * lean : g[6]) + nod,
      mouth: ms, open: mo, smile: msm, brow: doubt ? 0.1 : arms ? 0.6 : g[7], look: look || (doubt ? [0.05, 0.85] : [-0.75, 0.05]),
      blink: blinkAt(t, [2.6, 6.4, 11.8, 21.9]), behind,
      // drawing: the forearm on the table, the fist at the sheet's corner, the pen in the doodle
      arms: behind ? null : arms ? arms : doubt ? { l: [2.95, 'fist', 0], r: [-2.55 + 0.05 * Math.sin(th * 9), 'pen', 1.4 + 0.12 * Math.cos(th * 11)] }
        : listening ? { l: [2.95, 'fist', 0], r: [-2.95, 'fist', 0] } : { l: [g[0], g[1], g[2]], r: [g[3], g[4], g[5]] },
    };
    him(t, { ...P, part: 'body' });
    table(PK);
    dealSheet(t, 585, 1262, 0.46, -0.06, { dl });
    him(t, { ...P, part: 'arms' });
    // her notepad and pen at the table's end
    shape(BOTH, poly([[160, 1290], [300, 1283], [307, 1350], [155, 1358]]), { tone: 0.06, bb: [150, 1280, 315, 1360], ol: 6 });
    hand(BOTH, 255, 1338, -0.5, 95, 'pen', { flip: 1, t, id: 'bpen', tone: 0.18 });
  }
  // your cuffed hands, from your eyes, in your room: centred on room x cx; they drop onto the table on frame 0's slam,
  // jump at the officer's slap, grip in the doubt, and lift and spread when the cuffs spring open
  function handsAt(t, cx, { open = 0, grip = 0 } = {}) {
    const th = th_(t), d1 = S('d01');
    const jolt = t > d1 - 0.18 ? Math.exp(-(t - (d1 - 0.18)) * 8) : 0, land = clamp(t / 0.25);
    const y = 1400 - (1 - E.bounce(land)) * 30 - 34 * jolt - 16 * E.out(open), spread = 40 * E.out(open);
    return {
      sz: 185, open,
      l: [cx - 92 - spread + 8 * Math.sin(th * 1.3), y, 0.3 - 0.2 * grip - 0.25 * open, grip > 0.5 ? 'fist' : 'back'],
      r: [cx + 92 + spread + 6 * Math.sin(th * 1.1 + 1), y, -0.3 + 0.2 * grip + 0.25 * open, grip > 0.5 ? 'fist' : 'back'],
    };
  }
  // bars in front of you: they rise from the bottom edge in the foreground, thick, and sink away after
  function barsUp(t, x0, x1, top, count, t0, t1 = 1e9) {
    if (count <= 0 || t < t0) return;
    const sink = E.in(clamp((t - t1) / 0.3)); if (sink >= 1) return;
    const w = x1 - x0, bw = 40, span = H + 60 - top;
    const at = (k) => top + (1 - E.overshoot(k, 1.2)) * span + sink * span;
    for (let i = 0; i < count; i++) {
      const bx = x0 + w * (i + 0.5) / count, y = at(clamp((t - t0 - 0.03 * i) / 0.22));
      shape(BOTH, rect(bx - bw / 2, y, bw, H + 80 - y), { tone: 1, ol: 0 });
    }
    if (count >= 3) shape(BOTH, rect(x0, at(clamp((t - t0 - 0.03 * count) / 0.22)) + 34, w, 26), { tone: 1, ol: 0 });
  }

  function shotSplit(t) {
    const wx = wallAt(t), push = 1 + 0.03 * clamp(t / 16);
    const hisR = [0, 0, wx, H], yourR = [wx + GUT, 0, W, H];
    const d1 = S('d01'), d2 = S('d02'), d3 = S('d03');
    const doubt = sm(F('n03') + 0.05, F('n03') + 0.3, t);
    const lg = laughAt(t);
    view(aim(470, 900, wx / 2 + 30, 900, push), hisR, () => {
      hisRoom(t, { doubt: doubt > 0.5, laugh: lg, dl: ramp(F('n03') + 0.25, S('n04') - 0.1, t) * 0.92 });
    });
    // your room, from your eyes: the cuffs spring open on "walks" (FREE) and snap shut again after "ten years"
    const walks = Wt('d01', 2), free = sm(walks - 0.08, walks + 0.12, t) * (1 - sm(F('d02') + 0.25, F('d02') + 0.4, t));
    const yourMid = (wx + GUT + W) / 2, fx = 560 + (wx - 400) * 0.25, cx = fx - 50 / push;
    view(aim(fx, 1150, yourMid, 1080, push), yourR, () => {
      room(t, TE, { doorX: 660, ajar: t < 0.12 ? (1 - t / 0.12) * 0.18 : 0 });
      //        [left fore, pose, hand, right fore, pose, hand, left elbow, right elbow]
      const rest = [2.9, 'fist', 0, -2.9, 'fist', 0, 1.75, 1.75];
      const A = keyed(t, [
        [-1, rest],
        [d1 - 0.55, [2.9, 'fist', 0, -0.3, 'mitt', 0.2, 1.75, 1.0]],             // his hand comes up with the sheet, in front of him
        [d1 - 0.3, [2.9, 'fist', 0, -1.3, 'back', 0, 1.75, 1.6]],                // and slaps it down
        [d2 - 0.05, [-0.2, 'point', -0.55, -1.3, 'back', 0, 1.2, 1.6]],          // "the other one": a finger up at the wall
        [F('d02') + 0.2, rest],
        [d3 - 0.05, [-0.1, 'mitt', -0.3, 0.1, 'mitt', 0.3, 1.0, 1.0]],           // "you both"
        [F('d03') + 0.2, rest],
      ], 0.14);
      const P = {
        x: 545, y: 840, s: 1.0, turn: 0.2, open: lips(t, ['d01', 'd02', 'd03']), brow: -0.25, frown: 0.85,
        look: t >= d2 - 0.05 && t < F('d02') + 0.2 ? [-0.9, 0.1] : [0.1, 0.55],
        arms: { l: [A[0], A[1], A[2]], r: [A[3], A[4], A[5]] }, elbowX: [A[6], A[7]],
      };
      officerA(t, { ...P, part: 'body' });
      table(TE);
      // the sheet: it comes up in his hand, he slaps it down, it stays on the table
      const sk = keyed(t, [[-1, [0]], [d1 - 0.55, [1]], [d1 - 0.3, [2]]], 0.14)[0];
      if (sk > 0.5) {
        const R = 140, landed = th_(t) >= d1 - 0.3 + 0.14;
        const el = [545 + R * A[7], 840 + R * 3.05], L = R * 1.25 * lsOf(A[3]), wr = [el[0] + Math.sin(A[3]) * L, el[1] - Math.cos(A[3]) * L];
        const ha = A[3] + A[5], hs = R * 0.85 * (0.75 + 0.25 * lsOf(A[3])), palm = [wr[0] + Math.sin(ha) * hs * 0.4, wr[1] - Math.cos(ha) * hs * 0.4];
        const pos = landed ? [544, 1240] : [palm[0] - 10, palm[1] + 33];
        dealSheet(t, pos[0], pos[1], 0.4, landed ? 0.03 : 0.03 + 0.4 * clamp(2 - sk), {});
      }
      officerA(t, { ...P, part: 'arms' });
      yourHands(t, handsAt(t, cx, { open: free, grip: doubt }));
    });
    wallCut(wx);
    // the stakes, each on its word: FREE above your opened cuffs; ten bars on him; five each; one each. His bars drop over
    // him; yours rise in front of you from the bottom edge; no officer is ever caged; they all go away again
    const hisX = wx / 2 + 120, handsX = yourMid - 50;
    if (t < F('d02') + 0.3) stampIn(t, walks - 0.03, 'FREE', handsX, 1120, 96, { angle: 0.05 });
    const hisBars = [Math.max(16, wx / 2 - 60), 280, wx - 16, 1250];
    barsOver(t, hisBars, 10, Wt('d02', 4) - 0.1, F('d02') + 0.45);
    if (t < F('d02') + 0.5) stampIn(t, Wt('d02', 4), '10 YEARS', hisX, 1150, 52);
    const five = Wt('d03', 3) - 0.08;
    barsOver(t, hisBars, 5, five, F('d03') + 0.3); barsUp(t, wx + GUT + 40, W - 30, 1110, 5, five, F('d03') + 0.3);
    if (t < F('d03') + 0.35) { stampIn(t, five + 0.04, '5', hisX, 1150, 120); stampIn(t, five + 0.04, '5', handsX, 1200, 120); }
    const one = Wt('n03', 4) - 0.08;
    barsOver(t, hisBars, 1, one, F('n03') + 0.05); barsUp(t, handsX - 60, handsX + 60, 1110, 1, one, F('n03') + 0.05);
    if (t < F('n03') + 0.1) { stampIn(t, one + 0.04, '1', hisX - 70, 1150, 120); stampIn(t, one + 0.04, '1', handsX + 80, 1200, 120); }
    // frame 0's words, over his room: the wall slides over them, and the officer's slap takes them off
    if (t < d1 - 0.18) {
      each(BOTH, (g) => { g.save(); g.beginPath(); g.rect(0, 0, wx, H); g.clip(); });
      try { type("HE'S", 46, 405, 96, { align: 'left' }); type('TALKING.', 46, 528, 112, { align: 'left' }); } finally { each(BOTH, (g) => g.restore()); }
    }
    ballot(t, F('n01') + 0.5);
  }
  // your sheet, close, from your eyes. Your hands are as big here as the sheet is close: the left holds the pen in a
  // writing grip, the right lies flat on the sheet, the chain between them taut. The pen hovers over STAY SILENT on
  // "Stay silent", lifts and hesitates, slides to TALK on "talk", then shakes between them; its shadow shows it never
  // touches the paper. Under the sheet, the time to choose drains away.
  function pickTip(t) {   // [x, y, lift]
    return keyed(t, [
      [-1, [250, 1720, 2]], [S('n04') - 0.3, [352, 1338, 1.4]],
      [Wt('n04', 0) - 0.12, [372, 1294, 0]], [Wt('n04', 1) + 0.18, [382, 1306, 1.6]],
      [Wt('n04', 3) - 0.1, [371, 1332, 0]], [F('n04') + 0.2, [376, 1314, 0.7]],
    ], 0.16);
  }
  function pickHands(t, P) {
    const th = th_(t), lift = P[2], sz = 160 * (1 + 0.05 * lift), a = 0.6 + 0.03 * Math.sin(th * 2.3);
    const tr = F('n04') + 0.2 < t ? [2.5 * Math.sin(th * 9.3), 2.5 * Math.cos(th * 7.1)] : [0, 0];
    const lx = 0.07 * sz, ly = -1.14 * sz, ox = lx * Math.cos(a) - ly * Math.sin(a), oy = lx * Math.sin(a) + ly * Math.cos(a);
    const tip = [P[0] + tr[0], P[1] + tr[1]], wl = [tip[0] - ox, tip[1] - oy];
    return { sz, l: [wl[0], wl[1], a, 'grip'], r: [397 + (wl[0] - 260) * 0.3, Math.max(1510, wl[1] + 70), 0.25, 'back'], hover: { tip, h: 0.6 + lift } };
  }
  function countdown(drain) {
    occlude(rect(140, 1478, 800, 30)); line(BOTH, rect(140, 1478, 800, 30), 5);
    if (drain < 1) fill(BOTH, rect(146, 1484, 788 * (1 - clamp(drain)), 18));
  }
  function pickRoom(t, s) {
    view(aim(410, 1350, 540, 900, s), null, () => {
      room(t, TE, { doorX: 660 });
      table(TE);
      dealSheet(t, 430, 1350, 0.5, 0.03, {});
      yourHands(t, pickHands(t, pickTip(t)));
    });
  }
  function shotPick(t) {
    const t0 = S('n04') - 0.3, k = sm(t0, t0 + 2.6, t);
    pickRoom(t, 3.0 + 0.12 * k);
    countdown(ramp(S('n04'), F('n04') + 1.05, t));
  }
  // through the wall into his room: he's at the table, forearms down, telling her; then he acts it out: waves her off
  // on "Nah", points at your wall on "my partner", hands behind his head on "won't talk", leans in and taps his doodle
  // on "I'd bet ten years on it" (which plants the ending), then leans back, hands behind his head again
  function shotHis(t) {
    const t0 = S('f01') - 0.4, k = sm(t0, t0 + 0.65, t);
    const wx = lerp(-GUT - 10, W + 10, k);
    const talking = speaking(t, ['f01', 'f02']);
    const R = keyed(t, [
      [-1, ['a', 2.95, 'fist', 0, -2.95, 'fist', 0, 0]],
      [S('f01') - 0.1, ['a', 2.95, 'fist', 0, 0.9, 'mitt', 0.6, 0]],
      [Wt('f01', 1) - 0.08, ['a', 2.95, 'fist', 0, 0.25, 'point', 1.15, 0]],
      [Wt('f01', 3) - 0.06, ['b', 2.95, 'fist', 0, -2.95, 'fist', 0, 0]],
      [S('f02') - 0.12, ['a', 2.95, 'fist', 0, -2.54, 'point', 0.64, 1]],
      [F('f02') + 0.08, ['b', 2.95, 'fist', 0, -2.95, 'fist', 0, 0]],
    ], 0.14);
    const tap = [Wt('f02', 2), Wt('f02', 3)].some((w) => t >= w - 0.04 && t < w + 0.1) ? 1 : 0;
    const behind = R[0] === 'b', lean = R[7];
    const look = lean > 0.5 ? (t < Wt('f02', 5) - 0.05 ? [0.1, 0.85] : [-0.6, 0.1]) : R[5] === 'point' ? [0.8, 0.0] : [-0.75, 0.05];
    view(aim(500, 920, 540, 980, 1.3), [0, 0, Math.max(0, wx), H], () => {
      hisRoom(t, {
        behind, lean, look, dl: 1,
        arms: behind ? null : { l: [R[1], R[2], R[3]], r: [R[4] + 0.1 * tap, R[5], R[6]] },
        mouth: talking ? ['talk', lips(t, ['f01', 'f02']), 0.8] : ['grin', 0.25, 0.9],
      });
    });
    if (k < 1) {
      each(BOTH, (g) => { g.save(); g.beginPath(); g.rect(Math.min(W, wx + GUT), 0, W, H); g.clip(); });
      try { pickRoom(t, 3.12); countdown(ramp(S('n04'), F('n04') + 1.05, t)); } finally { each(BOTH, (g) => g.restore()); }
      wallCut(wx);
    }
  }
  // his face, close: a warm, closed smile; on "you" his eyes come round to you
  function shotFace(t) {
    const k = sm(S('n05') - 0.2, F('n05') + 0.3, t);
    const lk = keyed(t, [[-1, [0.8, 0.0]], [Wt('n05', 4) - 0.1, [0, 0.08]]], 0.12);
    view(aim(600, 860, 540, 900, 1.9 + 0.12 * k), null, () => {
      room(t, PK, { doorX: 1000 });
      him(t, { x: 600, y: 840, s: 1.0, turn: 0.15 * k, tilt: -0.04, mouth: 'flat', open: 0, smile: 1, brow: 0.15, look: lk, behind: true, blink: blinkAt(t, [F('n05') + 0.05]) });
    });
  }
  // the gate: a year later in daylight with him, or tonight alone (the same door, the mirrored story). The camera walks
  // with you: the gate grows, you stay framed from the chest up
  function gate(t, { night = false, open = 1, walk = 0 } = {}) {
    const s = 1 + 0.28 * walk;
    view({ s, x: 540 - 540 * s, y: 940 - 940 * s }, null, () => {
      dots([TE], rect(-300, -300, 1700, 2600), night ? 0.82 : 0.52, [-300, -300, 1400, 2300]);
      const op = E.inOut(clamp(open));
      erase(BOTH, rect(300, 420, 480, 1080));
      if (night) dots([TE], rect(300, 420, 480, 1080), 0.62, [300, 420, 780, 1500]);
      if (night) { const cone = poly([[520, 430], [560, 430], [720, 1500], [360, 1500]]); erase(BOTH, cone); dots([TE], cone, 0.1, [350, 420, 730, 1510]); }
      shape([TE], rect(300 - 240 * op, 420, 240, 1080), { tone: night ? 0.88 : 0.72, bb: [0, 400, 600, 1520], ol: 8 });
      shape([TE], rect(540 + 240 * op, 420, 240, 1080), { tone: night ? 0.88 : 0.72, bb: [480, 400, 1100, 1520], ol: 8 });
      line(BOTH, rect(300, 420, 480, 1080), 10);
      dots([TE], rect(-300, 1500, 1700, 900), night ? 0.9 : 0.62, [-300, 1500, 1400, 2400]);
    });
  }
  // walking away from us: two drawings a step (up and down, the shoulders rocking), the two of you out of step
  function walkers(t, k, alone) {
    const th = th_(t), up = Math.floor(th / 0.28) % 2;
    const yy = 1330 - 40 * E.inOut(clamp(k)), R = 140 * 1.12, hx = 720, ux = alone ? 520 : 400;
    const hb = up ? -14 : 0, ub = up ? 0 : -14, hs = up ? 8 : -8, us = up ? -8 : 8;
    const rock = (x, y, a, fn) => { each(BOTH, (g) => { g.save(); g.translate(x, y); g.rotate(a); g.translate(-x, -y); }); try { fn(); } finally { each(BOTH, (g) => g.restore()); } };
    if (!alone) rock(hx, yy + 600, hs * 0.004, () => backHim(t, hx, yy + hb, 1.12, hs, 6.5));
    rock(ux, yy + 600, us * 0.004, () => you(t, { x: ux, y: yy + 10 + ub, s: 1.12, look: alone ? -0.1 : 0.35, sway: us, tall: 6.8, dark: alone }));
    if (!alone) {
      // his striped arm across your shoulders, from his side to your far shoulder
      const sh = [hx + hs - R * 0.1, yy + hb + R * 1.12], fh = [ux + us - R * 1.05, yy + 10 + ub + R * 1.05];
      const arm = capsule(sh[0], sh[1], fh[0], fh[1], R * 0.27, R * 0.23);
      shape([PK], arm, { tone: 0 }); sleeveStripes(arm, sh, fh, R * 0.27);
      hand([PK], fh[0] - R * 0.05, fh[1] + R * 0.12, -1.75, R * 0.62, 'back', { flip: -1, t, id: 'arm' });
    }
  }
  function shotYear(t) {
    const t0 = S('n06') - 0.35, k = ramp(t0, t0 + 3.6, t);
    gate(t, { open: k * 2.4, walk: E.inOut(k) });
    walkers(t, k, false);
    stampIn(t, Wt('n06', 8) - 0.05, '1 YEAR', 540, 330, 86, { angle: -0.05 });
  }
  function shotNight(t) {
    const t0 = S('n07') - 0.35, k = ramp(t0, Wt('n07', 7) + 0.1, t);
    gate(t, { night: true, open: k * 2.4, walk: E.inOut(k) });
    walkers(t, k, true);
    stampIn(t, Wt('n07', 4) - 0.05, 'FREE', 540, 330, 86, { angle: 0.04 });
  }
  // his face behind ten bars, the grin gone: a slow blink, the head drops; the stamp lands on "ten"
  function shotCell(t) {
    const k = sm(Wt('n07', 7), Wt('n07', 7) + 1.0, t), drop = sm(S('n08'), F('n08') + 0.6, t);
    view({ s: 1, x: 0, y: 0 }, null, () => {
      dots([PK], rect(-100, 0, 1280, 1920), 0.55, [-100, 0, 1180, 1920]);
      him(t, { x: 540, y: 880 + 30 * drop, s: 1.45, turn: 0, tilt: 0.04 * k, mouth: k > 0.5 ? 'sad' : 'flat', open: 0, brow: -0.1, sad: k, look: [0, 0.35 * k + 0.3 * drop], blink: blinkAt(t, [F('n08') - 0.1]) });
      barsOver(t, [40, 300, 1040, 1700], 10, -1);
    });
    stampIn(t, Wt('n07', 11) - 0.04, '10 YEARS', 540, 1440, 86, { angle: 0.05 });
  }
  // from your eyes again (your hands as at the pick): your pen over TALK ("the safe move"); on "That's
  // the deal" the officer's hand comes down on the sheet and pulls it into his file. On the wall behind him, the season's
  // thief, WANTED, hidden in plain sight
  function shotFile(t) {
    const sl = sm(S('n10') - 0.15, S('n10') + 0.5, t), th = th_(t), R = 140;
    const reach = keyed(t, [[-1, [0]], [S('n10') - 0.5, [1]]], 0.2)[0];
    view(aim(480, 1220, 540, 1060, 1.5), null, () => {
      room(t, TE, { doorX: 660 });
      wantedPoster(t, 230, 860);
      const PA = { x: 470, y: 900, s: 1.0, turn: 0.05, open: 0, brow: -0.1 - 0.1 * sl, frown: 0.6, look: [0.25 + 0.3 * clamp(reach), 0.6], arms: { l: [2.9, 'fist', 0], r: null }, elbowX: 1.45 };
      officerA(t, { ...PA, part: 'body' });
      table(TE);
      shape(BOTH, poly([[600, 1272], [790, 1265], [800, 1332], [596, 1340]]), { tone: 0.15, bb: [590, 1255, 810, 1345], ol: 6 });
      const sx = lerp(480, 690, sl), sy = lerp(1360, 1300, sl), ss = lerp(0.5, 0.34, sl);
      dealSheet(t, sx, sy, ss, 0.03, {});
      officerA(t, { ...PA, part: 'arms' });
      // his right arm: the fist at rest, then the hand flat on the sheet's edge, turning as it pulls the sheet away
      const sh = [470 + R * 1.55, 900 + R * 1.5];
      const fa = lerp(-1.62, -2.3, sl), fl = lerp(150, 110, sl);
      const onW = [sx + 170 * ss + 34, sy + 6], onE = [onW[0] - Math.sin(fa) * fl, onW[1] + Math.cos(fa) * fl];
      const wr = [lerp(655, onW[0], reach), lerp(1398, onW[1], reach)], el = [lerp(673, onE[0], reach), lerp(1327, onE[1], reach)];
      armTo(BOTH, sh, el, wr, R * 0.32, { pose: reach > 0.5 ? 'back' : 'fist', ang: lerp(-2.9, fa, clamp(reach)), hs: 102, flip: 1, t, id: 'oar', tone: 0.12, handTone: 0.18 });
      // your hands as at the pick: the pen in your left hovers over TALK, the right flat by it; both pull back as it goes
      const sz = 170, a = 0.6 + 0.03 * Math.sin(th * 2.1), lx = 0.07 * sz, ly = -1.14 * sz;
      const ox = lx * Math.cos(a) - ly * Math.sin(a), oy = lx * Math.sin(a) + ly * Math.cos(a);
      const tip = [420 + 40 * sl, 1340 + 150 * sl], wl = [tip[0] - ox, tip[1] - oy];
      yourHands(t, { sz, l: [wl[0], wl[1], a, 'grip'], r: [wl[0] + 150, wl[1] + 40, 0.25, 'back'], hover: { tip, h: 0.6 + 2 * sl } });
    });
  }
  // the two rooms, even: him in profile, you from behind, both turning to the wall; your hands rise, palms flat against
  // it, level with each other, one each side. They stay there through the silence after the line, heads dropping a little
  function shotWall(t) {
    const k = sm(S('n11') - 0.3, S('n13') - 0.15, t), wx = 516, push = 1 + 0.07 * k, th = th_(t);
    const reach = sm(S('n11'), Wt('n12', 5), t), meetY = 1100, HS = 104, after = sm(F('n12') + 0.2, F('n12') + 1.2, t);
    const cH = wx / 2 + 40, cY = (wx + GUT + W) / 2 - 30;
    view(aim(470, 880, cH, 900, push), [0, 0, wx, H], () => {
      room(t, PK, { doorX: 1000 });
      const hx = 380, hy = 840 + Math.sin(th * 1.5) * 3 + 10 * after, R = 140;
      him(t, { x: hx, y: hy, s: 1.0, turn: 1.0, tilt: 0.05 * after, mouth: 'flat', open: 0, brow: -0.05 - 0.15 * after, sad: 0.5 * after, look: [1, 0.05 + 0.5 * after], blink: blinkAt(t, [S('n12') + 0.6, F('n12') + 0.9]), part: 'body' });
      table(PK);
      const sh = [hx + R * 1.33, hy + R * 1.44], tgt = [470 + (wx - 22 - cH) / push, 880 + (meetY - 900) / push];
      const wr = [lerp(sh[0] + 40, tgt[0], reach), lerp(1262, tgt[1], reach)];
      limb([PK], sh, wr, 130, 120, 36, 1, { sleeve: sleeveStripes });
      hand([PK], wr[0], wr[1], lerp(1.45, 0, reach), HS, 'mitt', { flip: 1, t, id: 'hw' });
    });
    view(aim(560, 900, cY, 900, push), [wx + GUT, 0, W, H], () => {
      room(t, TE, { doorX: 660 });
      table(TE);
      const ux = 660, uy = 1170 + Math.sin(th * 1.7 + 1) * 3 + 8 * after, R = 130;
      you(t, { x: ux, y: uy, s: 1.0, look: -1, tall: 6 });
      const sh = [ux - R * 1.3, uy + R * 1.15], tgt = [560 + (wx + GUT + 23 - cY) / push, 900 + (meetY - 900) / push];
      const wr = [lerp(sh[0] - 40, tgt[0], reach), lerp(sh[1] + 268, tgt[1], reach)];
      limb([TE], sh, wr, 140, 135, 42, -1, { tone: 0.72 });
      hand([TE], wr[0], wr[1], lerp(-3.0, 0, reach), HS, 'mitt', { flip: -1, t, id: 'yw' });
    });
    wallCut(wx);
  }
  // the dare: his doodle, alive, drawn big on its paper (the figures ~800 px tall). A high-five that slaps twice and
  // holds; on "And don't warn them" he turns out to you, finger on his lips, "shh"; on "tried it on you" the camera
  // punches in and both lean in and stare straight into the lens, pupils big and dead centre, the high-five frozen
  function doodleBig(t, ox, oy, k, L) {
    const five = L.five ?? 0, shh = L.shh ?? 0, stare = L.stare ?? 0;
    const slap = five >= 1 || five <= 0 ? 1 : 0.5 + 0.5 * Math.cos(five * Math.PI * 4);
    const reach = lerp(0.78, 1.0, slap);
    const P = (u, v) => [ox + u * k, oy + v * k];
    const pen = (names, pts, id, w = 12) => line(names, polyOpen(bpts(t, id, pts.map(([u, v]) => P(u, v)), 1.6)), w);
    const hands = [];
    for (const [cx, sg, nm, id] of [[-50, 1, TE, 'dy'], [50, -1, PK, 'dh']]) {
      const ink1 = [nm], [bx, by] = boil(t, id + 'h', 1.6), hx = cx + sg * 15 * stare;
      const hc = P(hx, -66);
      line(ink1, circ(hc[0] + bx, hc[1] + by, 21 * k), 12);
      // the bandit mask: a band with two eye holes; the pupils look at each other, then out at you
      const band = P(hx - 24, -74), bw = 48 * k, bh = 10 * k;
      shape(ink1, (g) => { g.beginPath(); g.roundRect(band[0] + bx, band[1] + by, bw, bh, bh * 0.45); }, { tone: 1, ol: 0 });
      const out = sg > 0 ? stare : Math.max(shh, stare), er = (3.4 + 1.2 * stare) * k, pr = (1.8 + 0.9 * stare) * k;
      for (const ex of [-9, 9]) {
        const e = P(hx + ex, -69);
        erase(BOTH, circ(e[0] + bx, e[1] + by, er));
        fill(ink1, circ(e[0] + bx + lerp(sg * 1.5, 0, out) * k, e[1] + by + lerp(0, 0.3, out) * k, pr));
      }
      pen(ink1, [[hx, -45], [cx - sg * 3, 18]], id + 'b');
      pen(ink1, [[cx - 20, 58], [cx - sg * 3, 18], [cx + 20, 58]], id + 'l');
      const hd = [cx + sg * 38 * reach, -88];
      pen(ink1, [[cx, -28], hd], id + 'a');
      hands.push(P(hd[0], hd[1]));
      if (sg > 0 || shh < 0.02) pen(ink1, [[cx, -28], [cx - sg * 28, -2]], id + 'f');
      else {
        // his free arm bends up to his mouth; the finger stands on his lips; "shh" goes out in two little waves
        pen(ink1, [[cx, -28], [cx - sg * lerp(28, 27, shh), lerp(-2, -16, shh)], [lerp(cx - sg * 28, hx + 2, shh), lerp(-2, -45, shh)]], id + 'f');
        if (shh > 0.5) pen(ink1, [[hx + 2, -44], [hx + 2, -60]], id + 's', 11);
        if (shh > 0.5 && stare < 0.5) for (const dy of [-63, -54]) pen(ink1, [[hx + 24, dy], [hx + 27, dy - 2.5], [hx + 30, dy + 1.5], [hx + 33, dy - 2.5], [hx + 36, dy + 0.5]], id + 'w' + dy, 7);
      }
    }
    // where the hands meet the two inks overprint; on a slap, three impact lines
    for (const h of hands) fill(BOTH, circ(h[0], h[1], 5.2 * k));
    if (slap > 0.9) for (const [a, b] of [[[-20, -24], [-27, -38]], [[0, -28], [0, -44]], [[20, -24], [27, -38]]]) pen(BOTH, [[a[0], -88 + a[1] + 14], [b[0], -88 + b[1] + 14]], 'imp' + a[0], 8);
  }
  function shotDoodle(t) {
    const life = { five: ramp(S('n13'), Wt('n13', 7), t), shh: sm(S('n14') - 0.1, S('n14') + 0.12, t), stare: sm(Wt('n15', 3) - 0.1, Wt('n15', 3) + 0.08, t) };
    const k = sm(S('n13') - 0.15, F('n15'), t), k0 = 5.5 + 0.12 * k, ox = 450, oy = 1060 - 8 * k;
    // on "tried it on you": a snap punch-in on the two masks
    const punch = keyed(t, [[-1, [0]], [Wt('n15', 3) - 0.1, [1]]], 0.12)[0], s = 1 + 0.5 * punch;
    const c = [ox, oy - 66 * k0], d = [530 - c[0], 860 - c[1]];
    view({ s, x: c[0] - c[0] * s + d[0] * punch, y: c[1] - c[1] * s + d[1] * punch }, null, () => {
      line(BOTH, polyOpen([[-20, 1652], [W + 20, 1640]]), 6);           // the foot rule of his sheet
      doodleBig(t, ox, oy, k0, life);
    });
  }
  // the case file: the sheet goes into CASE 46; CASE 47 slaps down on the pile on "case"
  function shotCase(t) {
    const t0 = F('n15') + 0.1, k1 = sm(t0, t0 + 0.4, t), land = Wt('n16', 1) - 0.12, k2 = ramp(land - 0.22, land, t);
    const settle = sm(land, END(), t);
    view({ s: 1 + 0.03 * settle, x: -16 * settle, y: -30 * settle }, null, () => {
      dots([PK], rect(-100, 0, 1280, 1920), 0.42, [-100, 0, 1180, 1920]);
      const cy = 1130, cx = 520;
      if (k1 < 1) { folder(t, cx, cy, -0.03, 'CASE 46', { s: 1.2 }); dealSheet(t, cx, lerp(760, cy - 40, k1), 1.0, -0.04, { dl: 1 }); }
      folder(t, cx, cy, -0.03, 'CASE 46', { s: 1.2 });
      // CASE 47 slaps down onto the pile from just above it (it shrinks as it falls toward the table), on "case"
      if (k2 > 0) folder(t, 575 + (1 - E.out(k2)) * 20, 690 - (1 - E.out(k2)) * 60, 0.04 + 0.06 * (1 - k2), 'CASE 47', { s: 1.2 + 0.35 * (1 - E.in2(k2)), sub: 'THE VOICE' });
    });
  }

  // ------------------------------------------------------------------ the film: which shot is up
  function draw(t) {
    if (t < S('n04') - 0.3) shotSplit(t);
    else if (t < S('f01') - 0.4) shotPick(t);
    else if (t < S('n05') - 0.15) shotHis(t);
    else if (t < S('n06') - 0.35) shotFace(t);
    else if (t < S('n07') - 0.35) shotYear(t);
    else if (t < Wt('n07', 7)) shotNight(t);
    else if (t < S('n09') - 0.3) shotCell(t);
    else if (t < S('n11') - 0.3) shotFile(t);
    else if (t < S('n13') - 0.15) shotWall(t);
    else if (t < F('n15') + 0.1) shotDoodle(t);
    else shotCase(t);
  }
  // frame 0 prints in register; the slam knocks the inks off for a few frames, and they settle
  const misAt = (t) => (t < 0.5 / 30 ? 0 : t < 0.22 ? 2 + 7 * (1 - t / 0.22) : 2);

  LAB.film({
    to: 'end', start: false,
    draw(g, t) {
      begin();
      draw(t);
      print(g, t, [TE, PK], { n: N, mis: misAt(t) });
      LAB.safeOverlay(g);
    },
  });
  UI.endcard();
  C.start();
})();
