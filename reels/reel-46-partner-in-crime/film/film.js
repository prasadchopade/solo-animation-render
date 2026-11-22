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
    // a finger to the lips is a point; a hand flat on a wall is a back with the fingers up
  };
  function hand(names, x, y, ang, sz, pose = 'mitt', { flip = 1, t = 0, id = 'h', tone = 0 } = {}) {
    const HP = HANDS[pose === 'pen' ? 'fist' : pose];
    const [bx, by] = boil(t, id, 1.0);
    each(BOTH, (g) => { g.save(); g.translate(x + bx, y + by); g.rotate(ang); g.scale(sz * flip, sz); });
    const prev = CAM; CAM = { ...CAM, s: CAM.s * sz };
    try {
      if (pose === 'pen') shape(BOTH, capsule(0.02, -1.05, -0.03, 0.12, 0.045, 0.05), { tone: 1, ol: 0 });   // the pen, through the fist
      const P = blob(HP.pts, 0.42);
      occlude(P);
      if (tone > 0) dots(names, P, tone, [-0.6, -1.1, 0.6, 0.2]);
      line(names, P, 8);
      for (const L of HP.lines) line(names, polyOpen(L), 5);
    } finally { CAM = prev; each(BOTH, (g) => g.restore()); }
  }
  // a seated arm: the upper arm from the shoulder down to the elbow on the table, the forearm from the elbow at angle a
  // (0 = straight up, + = toward screen-right); the elbow never moves, so the arm can't fold through the body
  function seatedArm(names, sh, el, a, len, w, { pose = 'mitt', handAng = 0, flip = 1, hs = 1, t = 0, id = 'arm', sleeve = null, tone = 0, handTone = 0 } = {}) {
    const wr = [el[0] + Math.sin(a) * len, el[1] - Math.cos(a) * len];
    const up = capsule(sh[0], sh[1], el[0], el[1], w * 1.12, w);
    shape(names, up, { tone, bb: bbOf([sh, el], w * 1.5) }); if (sleeve) sleeve(up, bbOf([sh, el], w * 1.5));
    const fo = capsule(el[0], el[1], wr[0], wr[1], w, w * 0.78);
    shape(names, fo, { tone, bb: bbOf([el, wr], w * 1.5) }); if (sleeve) sleeve(fo, bbOf([el, wr], w * 1.5));
    hand(names, wr[0], wr[1], a + handAng, hs, pose, { flip, t, id, tone: handTone });
    return wr;
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
    rest: [1.45, 'mitt', 0.1, -1.45, 'mitt', -0.1, 0.0, 0.3, -0.42],
    chop: [-0.12, 'mitt', -0.25, -1.45, 'mitt', -0.1, 0.05, 0.6, -0.5],
    both: [-0.38, 'mitt', -0.3, 0.38, 'mitt', 0.3, -0.03, 0.75, -0.42],
    point: [1.45, 'mitt', 0.1, 0.1, 'point', 0.15, 0.06, 0.8, -0.55],
    wave: [-0.55, 'mitt', -0.4, -1.45, 'mitt', -0.1, -0.06, 0.5, -0.38],
    shrug: [-0.75, 'mitt', -0.9, 0.75, 'mitt', 0.9, 0.08, 0.95, -0.42],
  };
  const HIS_KEYS = (() => {
    const names = Object.keys(HIS), out = [[-1, HIS.chop]];
    let tt = 0.0, last = 'chop';
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
            shape(ink1, up, { tone: 0 }); stripe(up, bbOf([sh, el], R * 0.4));
            const fo = capsule(el[0], el[1], hd[0], hd[1], R * 0.25, R * 0.22);
            shape(ink1, fo, { tone: 0 }); stripe(fo, bbOf([el, hd], R * 0.4));
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
          seatedArm(ink1, sh, el, a[0], R * 1.3, R * 0.27, { pose: a[1], handAng: a[2], flip: sg, hs: R * 0.78, t, id: 'him' + side, sleeve: stripe });
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
  function backHim(t, x, y, s, sway = 0) {
    const R = 140 * s, [bx, by] = boil(t, 'bh', 1.2);
    each(BOTH, (g) => { g.save(); g.translate(bx + sway, by); });
    try {
      const back = blob([[x - R * 1.85, y + R * 4.2], [x - R * 1.72, y + R * 1.45], [x - R * 0.62, y + R * 0.98], [x + R * 0.62, y + R * 0.98], [x + R * 1.72, y + R * 1.45], [x + R * 1.85, y + R * 4.2]]);
      shape([PK], back, { tone: 0, ol: 8 });
      stripes(back, [x - R * 2, y, x + R * 2, y + R * 4.3], R);
      shape([PK], ell(x, y + R * 0.1, R * 0.82, R * 0.9), { tone: 0.15, bb: [x - R, y - R, x + R, y + R * 1.1], ol: 8 });
      shape([PK], blob([[x - R * 0.9, y + R * 0.05], [x - R * 0.85, y - R * 0.55], [x, y - R * 0.95], [x + R * 0.85, y - R * 0.55], [x + R * 0.9, y + R * 0.05]], 0.45), { tone: 1, ol: 0 });
      shape([PK], rect(x - R * 0.93, y - R * 0.12, R * 1.86, R * 0.3), { tone: 1, ol: 0 });
    } finally { each(BOTH, (g) => g.restore()); }
  }

  // ------------------------------------------------------------------ YOU (teal): your cuffed hands, seen from your own eyes
  // l and r: [wrist x, wrist y, angle, pose]; the sleeves come up from below the frame; the cuffs are bands on the wrists
  // with three links between (drawn as bands, never as two rings: two rings and a line read as spectacles, reel 38)
  function yourHands(t, p) {
    const sz = p.sz ?? 120, [bx, by] = boil(t, 'yh', 1.1);
    each(BOTH, (g) => { g.save(); g.translate(bx, by); });
    try {
      const wr = { l: p.l, r: p.r };
      for (const side of ['l', 'r']) {
        const [x, y, a] = wr[side], sg = side === 'l' ? -1 : 1, base = [x + sg * sz * 0.5 - Math.sin(a) * sz * 2.6, y + Math.cos(a) * sz * 2.6];
        shape([TE], capsule(base[0], base[1], x - Math.sin(a) * sz * 0.1, y + Math.cos(a) * sz * 0.1, sz * 0.42, sz * 0.3), { tone: 1, ol: 0 });
      }
      for (const side of ['l', 'r']) {
        const [x, y, a, pose] = wr[side], sg = side === 'l' ? -1 : 1;
        hand([TE], x, y, a, sz, pose, { flip: sg, t, id: 'you' + side });
      }
      // the cuffs: dark bands round the wrists, and the chain between them
      for (const side of ['l', 'r']) {
        const [x, y, a] = wr[side];
        each(BOTH, (g) => { g.save(); g.translate(x - Math.sin(a) * sz * 0.08, y + Math.cos(a) * sz * 0.08); g.rotate(a); });
        try { shape(BOTH, (g) => { g.beginPath(); g.roundRect(-sz * 0.3, -sz * 0.08, sz * 0.6, sz * 0.18, sz * 0.06); }, { tone: 1, ol: 0 }); erase(BOTH, rect(-sz * 0.22, -sz * 0.02, sz * 0.44, sz * 0.04)); }
        finally { each(BOTH, (g) => g.restore()); }
      }
      const a0 = [p.l[0] + sz * 0.22, p.l[1] + sz * 0.12], a1 = [p.r[0] - sz * 0.22, p.r[1] + sz * 0.12], mid = [(a0[0] + a1[0]) / 2, Math.max(a0[1], a1[1]) + sz * 0.16];
      for (let i = 1; i <= 3; i++) {
        const u = i / 4, px = lerp(lerp(a0[0], mid[0], u), lerp(mid[0], a1[0], u), u), py = lerp(lerp(a0[1], mid[1], u), lerp(mid[1], a1[1], u), u);
        line(BOTH, ell(px, py, sz * 0.09, sz * 0.055, i % 2 ? 0.3 : -0.3), 6);
      }
    } finally { each(BOTH, (g) => g.restore()); }
  }
  // YOU from behind (the gate, the street, the wall): the hood up
  function you(t, p) {
    const s = p.s ?? 1, R = 130 * s, x = p.x + (p.sway ?? 0), y = p.y, look = p.look ?? 0, ink1 = [TE];
    const [bx, by] = boil(t, 'you', 1.2);
    each(BOTH, (g) => { g.save(); g.translate(bx, by); });
    try {
      const sy = y + R * 0.92;
      const back = blob([[x - R * 2.1, y + R * 4.4], [x - R * 1.98, sy + R * 0.75], [x - R * 1.45, sy + R * 0.05], [x - R * 0.6, sy - R * 0.2], [x + R * 0.6, sy - R * 0.2], [x + R * 1.45, sy + R * 0.05], [x + R * 1.98, sy + R * 0.75], [x + R * 2.1, y + R * 4.4]]);
      shape(ink1, back, { tone: 0.72, bb: [x - R * 2.3, sy - R * 0.4, x + R * 2.3, y + R * 4.5], ol: 8 });
      eraseLine(ink1, curve([[x - R * 1.9, sy + R * 0.6], [x - R * 1.4, sy + R * 0.12], [x - R * 0.7, sy - R * 0.1]]), 9);
      eraseLine(ink1, curve([[x + R * 0.7, sy - R * 0.1], [x + R * 1.4, sy + R * 0.12], [x + R * 1.9, sy + R * 0.6]]), 9);
      shape(ink1, blob([[x - R * 0.85, sy - R * 0.1], [x + R * 0.85, sy - R * 0.1], [x + R * 0.3, sy + R * 0.95], [x - R * 0.3, sy + R * 0.95]], 0.45), { tone: 1, ol: 0 });
      const hx = x + look * R * 0.1;
      const hp = [[hx - R * 0.86, y + R * 0.78], [hx - R * 0.98, y + R * 0.02], [hx - R * 0.74, y - R * 0.7], [hx - R * 0.04 + look * R * 0.1, y - R * 1.1], [hx + R * 0.66, y - R * 0.76], [hx + R * 0.96, y + R * 0.0], [hx + R * 0.84, y + R * 0.8], [hx, y + R * 0.98]];
      const hood = blob(bpts(t, 'hood', hp, 1.1));
      shape(ink1, hood, { tone: 1, ol: 0 });
      eraseLine(ink1, curve([[hx - R * 0.04 + look * R * 0.1, y - R * 1.05], [hx + look * R * 0.32, y - R * 0.2], [hx + look * R * 0.42, y + R * 0.88]]), 7);
      eraseLine(ink1, curve([[hx - R * 0.62, y - R * 0.74], [hx - R * 0.04 + look * R * 0.1, y - R * 1.02], [hx + R * 0.56, y - R * 0.76]]), 6);
      if (Math.abs(look) > 0.2) {
        const sg = Math.sign(look), k = (Math.abs(look) - 0.2) / 0.8;
        eraseLine(ink1, curve([[hx + sg * R * 0.92, y - R * 0.38], [hx + sg * R * (1.0 - 0.1 * k), y + R * 0.12], [hx + sg * R * 0.82, y + R * 0.66]]), 12 + 10 * k);
        line(BOTH, curve([[hx + sg * R * 0.9, y - R * 0.34], [hx + sg * R * (0.97 - 0.1 * k), y + R * 0.12], [hx + sg * R * 0.8, y + R * 0.62]]), 5 + 5 * k);
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
          const mh = R * (0.05 + 0.2 * mo);
          const m = blob([[mx - R * 0.24, y + R * 0.68], [mx + R * 0.24, y + R * 0.68], [mx + R * 0.16, y + R * 0.7 + mh], [mx - R * 0.16, y + R * 0.7 + mh]], 0.5);
          shape(ink2, m, { tone: 1, ol: 0 });
          each(ink2, (g) => { g.save(); m(g); g.clip(); g.globalCompositeOperation = 'destination-out'; g.fillRect(mx - R * 0.2, y + R * 0.66, R * 0.4, mh * 0.32); g.restore(); });
        }
        shape(ink2, blob([[mx - R * 0.5, y + R * 0.7], [mx - R * 0.36, y + R * 0.5], [mx, y + R * 0.55], [mx + R * 0.36, y + R * 0.5], [mx + R * 0.5, y + R * 0.7], [mx + R * 0.24, y + R * 0.66], [mx, y + R * 0.62], [mx - R * 0.24, y + R * 0.66]], 0.5), { tone: 1, ol: 0 });
        line(ink2, curve([[x - R * 0.7, y + R * 0.98 + mo * R * 0.08], [x, y + R * 1.2 + mo * R * 0.12], [x + R * 0.7, y + R * 0.98 + mo * R * 0.08]]), 6);
      }
      if (p.part !== 'body' && p.arms) {
        const sleeve = null;
        for (const side of ['l', 'r']) {
          const a = p.arms[side]; if (!a) continue;
          const sg = side === 'l' ? -1 : 1, sh2 = sg < 0 ? shL : shR, el = [x + sg * R * (p.elbowX ?? 1.25), y + R * 3.05];
          seatedArm(ink2, sh2, el, a[0], R * 1.25, R * 0.32, { pose: a[1], handAng: a[2], flip: sg, hs: R * 0.85, t, id: 'oa' + side, tone: 0.12, handTone: 0.18 });
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
      if (dl > 0) doodleArt(t, 0, 112, 0.74, dl, life);
    } finally { CAM = prev; each(BOTH, (g) => g.restore()); }
  }
  // his doodle: the two of you, masks up, high-fiving; where your hands meet, the two inks overprint. Drawn stroke by
  // stroke (dl), and at the end it comes alive: the high-five slaps again, he says shh, you glance at him.
  function doodleArt(t, x, y, s, dl, life) {
    const L = life || {}, five = L.five ?? 0, shh = L.shh ?? 0, peek = L.peek ?? 0;
    const slap = Math.sin(clamp(five) * Math.PI * 2) * 0.5 + 0.5;          // 0 apart → 1 together, twice
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
    const freeArm = (cx, sg, up) => (g) => { g.beginPath(); g.moveTo(cx, y - 28 * s); g.lineTo(cx - sg * 32 * s * (1 - up * 0.4), lerp(y - 2 * s, y - 62 * s, up)); g.stroke(); };
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
      if (shh > 0.5) line([PK], polyOpen([[x + 50 * s, y - 52 * s], [x + 50 * s, y - 68 * s]]), 4);
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
    let x = 640;
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
  // her laugh comes in the gaps (when the muffled voice and the laugh are heard), never over the narrator's words
  const laughAt = (t) => {
    const gaps = [[F('n01') + 0.05, S('n02') - 0.05], [F('n03') + 0.05, S('n04') - 0.05]];
    let v = 0; for (const [a, b] of gaps) v = Math.max(v, Math.min(ramp(a, a + 0.12, t), ramp(b, b - 0.15, t)));
    return v;
  };
  // his room's set-up, used by the split, the reveal and the doodle. doubt: he's drawing on his sheet
  function hisRoom(t, { gab = 1, doubt = 0, behind = false, look = null, mouth = null, laugh = 0, free = 0, dl = 0, sheet = true } = {}) {
    room(t, PK, { doorX: 1000, light: free });
    officerB(t, { x: 250, y: 950 + 5 * Math.sin(th_(t) * 15) * laugh, s: 0.95, laugh });
    const g = keyed(t, HIS_KEYS);
    const [ms, mo, msm] = mouth || chatter(t);
    const P = {
      x: 560, y: 830 + 4 * Math.sin(th_(t) * 1.8), s: 1.0, turn: doubt ? -0.05 : g[8], tilt: doubt ? 0.12 : g[6],
      mouth: ms, open: mo * gab, smile: msm, brow: doubt ? 0.1 : g[7], look: look || (doubt ? [0.05, 0.85] : [-0.75, 0.05]),
      blink: blinkAt(t, [2.6, 6.4, 11.8, 21.9]), behind,
      arms: behind ? null : doubt ? { l: [1.45, 'mitt', 0.1], r: [-1.32 + 0.06 * Math.sin(th_(t) * 9), 'pen', 4.6 + 0.1 * Math.cos(th_(t) * 11)] } : { l: [g[0], g[1], g[2]], r: [g[3], g[4], g[5]] },
    };
    him(t, { ...P, part: 'body' });
    table(PK);
    if (sheet) dealSheet(t, 585, 1262, 0.46, -0.06, { dl });
    him(t, { ...P, part: 'arms' });
    // her hand and pen on her notepad, at the table's end
    shape(BOTH, poly([[205, 1290], [345, 1283], [352, 1350], [200, 1358]]), { tone: 0.06, bb: [195, 1280, 360, 1360], ol: 6 });
    hand(BOTH, 300, 1338, -0.5, 95, 'pen', { flip: 1, t, id: 'bpen', tone: 0.18 });
  }

  function shotSplit(t) {
    const wx = wallAt(t), push = 1 + 0.03 * clamp(t / 16);
    const hisR = [0, 0, wx, H], yourR = [wx + GUT, 0, W, H];
    const th = th_(t);
    const d1 = S('d01'), d2 = S('d02'), d3 = S('d03'), n3 = S('n03');
    const doubt = sm(F('n03') + 0.05, F('n03') + 0.3, t);
    const lg = laughAt(t);
    // he never stops talking (we never hear him clearly); in the doubt he leans over his sheet and draws
    view(aim(470, 900, wx / 2 + 30, 900, push), hisR, () => {
      hisRoom(t, { doubt: doubt > 0.5, laugh: lg, dl: ramp(F('n03') + 0.25, S('n04') - 0.1, t) * 0.92 });
    });
    // your room, from your own eyes: your cuffed hands on the table; the door slams on frame 0; your officer, revealed
    // when the wall slides, deals
    const yourFree = sm(Wt('d01', 2) - 0.2, Wt('d01', 2) + 0.2, t) * (1 - sm(F('d01') + 0.2, F('d01') + 0.5, t));
    view(aim(560, 1150, (wx + GUT + W) / 2, 1080, push), yourR, () => {
      room(t, TE, { doorX: 660, poster: true, light: yourFree, open: yourFree, ajar: t < 0.12 ? (1 - t / 0.12) * 0.18 : 0 });
      const rest = [1.45, 'mitt', 0.1, -1.45, 'mitt', -0.1];
      const A = keyed(t, [
        [-1, rest],
        [d1 - 0.55, [1.45, 'mitt', 0.1, 0.15, 'mitt', 0.2]],                         // the hand goes up
        [d1 - 0.3, [1.45, 'mitt', 0.1, -1.5, 'mitt', -0.05]],                        // and slaps the sheet down
        [Wt('d01', 2) - 0.1, [1.45, 'mitt', 0.1, 0.35, 'point', 0.25]],             // "walks out": at the door
        [d2 - 0.05, [-0.35, 'point', -0.75, -1.45, 'mitt', -0.1]],                  // "the other one": at the wall
        [F('d02') + 0.2, rest],
        [d3 - 0.05, [-0.5, 'mitt', -0.6, 0.5, 'mitt', 0.6]],                        // "you both"
        [F('d03') + 0.2, rest],
      ], 0.14);
      const P = {
        x: 545, y: 840, s: 1.0, turn: 0.2, open: lips(t, ['d01', 'd02', 'd03']), brow: -0.25, frown: 0.85,
        look: t >= d2 - 0.05 && t < F('d02') + 0.2 ? [-0.9, 0.1] : [0.1, 0.55],
        arms: { l: [A[0], A[1], A[2]], r: [A[3], A[4], A[5]] },
      };
      officerA(t, { ...P, part: 'body' });
      table(TE);
      if (t > d1 - 0.18) dealSheet(t, 538, 1300, 0.46, 0.03, {});
      officerA(t, { ...P, part: 'arms' });
      // your hands: they jump at the slap, and grip at the doubt
      const jolt = Math.exp(-Math.max(0, t - (d1 - 0.18)) * 8) * (t > d1 - 0.18 ? 1 : 0), land = clamp(t / 0.25);
      const grip = doubt;
      yourHands(t, {
        sz: 175,
        l: [455 + 8 * Math.sin(th * 1.3), 1452 - 34 * jolt - (1 - E.bounce(land)) * 30, 0.3 - 0.2 * grip, grip > 0.5 ? 'fist' : 'back'],
        r: [665 + 6 * Math.sin(th * 1.1 + 1), 1452 - 34 * jolt - (1 - E.bounce(land)) * 30, -0.3 + 0.2 * grip, grip > 0.5 ? 'fist' : 'back'],
      });
    });
    wallCut(wx);
    // the stakes: FREE opens your door; ten bars cage him; five each; one each. Each lands on its word and lifts away
    const hisMid = wx / 2, yourMid = (wx + GUT + W) / 2;
    if (t < F('d01') + 0.5) stampIn(t, Wt('d01', 2), 'FREE', yourMid + 70, 640, 92, { angle: 0.05 });
    barsOver(t, [16, 280, wx - 16, 1250], 10, Wt('d02', 4) - 0.1, F('d02') + 0.45);
    if (t < F('d02') + 0.5) stampIn(t, Wt('d02', 4), '10 YEARS', hisMid, 1100, 54);
    const five = Wt('d03', 3) - 0.08;
    barsOver(t, [16, 280, wx - 16, 1250], 5, five, F('d03') + 0.3); barsOver(t, [wx + GUT + 16, 280, W - 16, 1560], 5, five, F('d03') + 0.3);
    if (t < F('d03') + 0.35) { stampIn(t, five + 0.04, '5', hisMid, 1100, 120); stampIn(t, five + 0.04, '5', yourMid, 1240, 120); }
    const one = Wt('n03', 4) - 0.08;
    barsOver(t, [16, 280, wx - 16, 1250], 1, one, F('n03') + 0.05); barsOver(t, [wx + GUT + 16, 280, W - 16, 1560], 1, one, F('n03') + 0.05);
    if (t < F('n03') + 0.1) { stampIn(t, one + 0.04, '1', hisMid - 90, 1100, 120); stampIn(t, one + 0.04, '1', yourMid + 90, 1240, 120); }
    if (t < d1 - 0.7) { type("HE'S", 46, 405, 96, { align: 'left' }); type('TALKING.', 46, 528, 118, { align: 'left' }); }
    ballot(t, F('n01') + 0.5);
  }
  // your sheet, from your eyes: the pen goes to STAY SILENT on "Stay silent", to TALK on "or talk", then can't decide
  function shotPick(t) {
    const t0 = S('n04') - 0.3, k = sm(t0, t0 + 2.6, t), th = th_(t);
    const boxS = [430 - 60, 1350 - 50], boxT = [430 - 60, 1350 - 12];
    const P = keyed(t, [[-1, [boxS[0] + 90, boxS[1] + 80]], [Wt('n04', 0) - 0.1, boxS], [Wt('n04', 2) - 0.1, boxT], [F('n04') + 0.15, [boxS[0] + 4, (boxS[1] + boxT[1]) / 2]]], 0.22);
    const wob = F('n04') + 0.15 < t ? Math.sin(th * 5.5) * 6 : 0;
    view(aim(410, 1350, 540, 900, 3.3 + 0.15 * k), null, () => {
      room(t, TE, { doorX: 660, poster: true });
      table(TE);
      dealSheet(t, 430, 1350, 0.5, 0.03, {});
      yourHands(t, { sz: 40, l: [345, 1446, 0.45, 'back'], r: [P[0] + 38, P[1] + 52 + wob, -0.4, 'pen'] });
    });
    ballot(t, -1, { drain: ramp(S('n04'), F('n04') + 1.05, t) });
  }
  // through the wall into his room: he's leaning back, hands behind his head, telling her
  function shotHis(t) {
    const t0 = S('f01') - 0.4, k = sm(t0, t0 + 0.65, t);
    const wx = lerp(-GUT - 10, W + 10, k);
    const talking = speaking(t, ['f01', 'f02']);
    view(aim(500, 920, 540, 980, 1.3), [0, 0, Math.max(0, wx), H], () => {
      hisRoom(t, { behind: true, mouth: talking ? ['talk', lips(t, ['f01', 'f02']), 0.8] : ['grin', 0.25, 0.9], look: [-0.75, 0.05], dl: 1 });
    });
    if (k < 1) {
      view(aim(410, 1350, 540, 900, 3.45), [Math.min(W, wx + GUT), 0, W, H], () => { room(t, TE, { doorX: 660, poster: true }); table(TE); dealSheet(t, 430, 1350, 0.5, 0.03, {}); yourHands(t, { sz: 40, l: [345, 1446, 0.45, 'back'], r: [374, 1350 - 31 + 52, -0.4, 'pen'] }); });
      wallCut(wx);
    }
  }
  function shotFace(t) {
    const k = sm(S('n05') - 0.2, F('n05') + 0.3, t);
    view(aim(600, 860, 540, 900, 1.9 + 0.12 * k), null, () => {
      room(t, PK, { doorX: 1000 });
      him(t, { x: 600, y: 840, s: 1.0, turn: 0.15 * k, tilt: -0.04, mouth: 'grin', open: 0.1, smile: 1, brow: 0.15, look: [0.8, 0.0], behind: true, blink: blinkAt(t, [F('n05') + 0.05]) });
    });
  }
  // the gate: a year later in daylight with him, or tonight alone (the same door, mirrored story)
  function gate(t, { night = false, k = 0, open = 1 } = {}) {
    dots([TE], rect(-100, 0, 1280, 1920), night ? 0.82 : 0.52, [-100, 0, 1180, 1920]);
    const op = E.inOut(clamp(open));
    erase(BOTH, rect(300, 420, 480, 1080));
    if (night) dots([TE], rect(300, 420, 480, 1080), 0.55, [300, 420, 780, 1500]);
    shape([TE], rect(300 - 240 * op, 420, 240, 1080), { tone: night ? 0.85 : 0.72, bb: [0, 400, 600, 1520], ol: 8 });
    shape([TE], rect(540 + 240 * op, 420, 240, 1080), { tone: night ? 0.85 : 0.72, bb: [480, 400, 1100, 1520], ol: 8 });
    line(BOTH, rect(300, 420, 480, 1080), 10);
    if (night) {                                                 // a streetlight beyond the gate: a cone of paper
      const cone = poly([[520, 470], [560, 470], [700, 1500], [380, 1500]]);
      erase(BOTH, cone); dots([TE], cone, 0.12, [370, 460, 710, 1510]);
    }
  }
  function walkers(t, k, alone) {
    const walk = E.inOut(clamp((k - 0.12) / 0.88)), th = th_(t);
    const step = Math.sin(th * 6.2), bob = Math.abs(step) * 10, sway = step * 7;
    const ss = 1.0 - walk * 0.35, yy = 1600 - walk * 260;
    const hx = 655 - walk * 40, ux = 435 - walk * 20;
    if (!alone) backHim(t, hx, yy - 330 * ss - bob, ss, -sway);
    you(t, { x: ux, y: yy - 300 * ss - bob * 0.7, s: ss, look: alone ? -0.1 : 0.35, sway });
    if (!alone) {
      const ay = yy - 300 * ss - bob * 0.7 + 150 * ss;
      shape(BOTH, capsule(hx - 120 * ss - sway, ay - 8 * ss, ux - 120 * ss + sway, ay + 4 * ss, 30 * ss, 26 * ss), { tone: 1, ol: 0 });
      hand(BOTH, ux - 128 * ss + sway, ay - 6 * ss, -1.9, 82 * ss, 'back', { flip: -1, t, id: 'arm' });
    }
  }
  function shotYear(t) {
    const t0 = S('n06') - 0.35, k = ramp(t0, t0 + 3.6, t);
    view({ s: 1, x: 0, y: 0 }, null, () => { gate(t, { open: k * 2.4 }); walkers(t, k, false); });
    stampIn(t, Wt('n06', 8) - 0.05, '1 YEAR', 540, 330, 86, { angle: -0.05 });
  }
  function shotNight(t) {
    const t0 = S('n07') - 0.35, k = ramp(t0, Wt('n07', 7) + 0.1, t);
    view({ s: 1, x: 0, y: 0 }, null, () => { gate(t, { night: true, open: k * 2.4 }); walkers(t, k, true); });
    stampIn(t, Wt('n07', 4) - 0.05, 'FREE', 540, 330, 86, { angle: 0.04 });
  }
  // his face behind ten bars, the grin gone: a slow blink, the head drops
  function shotCell(t) {
    const k = sm(Wt('n07', 7), Wt('n07', 7) + 1.0, t), drop = sm(S('n08'), F('n08') + 0.6, t);
    view({ s: 1, x: 0, y: 0 }, null, () => {
      dots([PK], rect(-100, 0, 1280, 1920), 0.55, [-100, 0, 1180, 1920]);
      him(t, { x: 540, y: 880 + 30 * drop, s: 1.45, turn: 0, tilt: 0.04 * k, mouth: k > 0.5 ? 'sad' : 'flat', open: 0, brow: -0.1, sad: k, look: [0, 0.35 * k + 0.3 * drop], blink: blinkAt(t, [F('n08') - 0.1]) });
      barsOver(t, [40, 300, 1040, 1700], 10, -1);
    });
    stampIn(t, Wt('n07', 10) - 0.05, '10 YEARS', 540, 1440, 86, { angle: 0.05 });
  }
  // from your eyes again: your finger over TALK ("the safe move"), and the officer takes the sheet into his file
  function shotFile(t) {
    const sl = sm(S('n10') - 0.15, S('n10') + 0.5, t);
    view(aim(480, 1220, 540, 1060, 1.5), null, () => {
      room(t, TE, { doorX: 660 });
      const PA = { x: 470, y: 900, s: 1.0, turn: 0.05, open: 0, brow: -0.1, frown: 0.6, look: [0.3, 0.6], arms: { l: [1.45, 'mitt', 0.1], r: [lerp(-1.45, -1.62, sl), 'mitt', -0.1] }, elbowX: lerp(1.25, 0.6, sl) };
      officerA(t, { ...PA, part: 'body' });
      table(TE);
      shape(BOTH, poly([[600, 1272], [790, 1265], [800, 1332], [596, 1340]]), { tone: 0.15, bb: [590, 1255, 810, 1345], ol: 6 });
      dealSheet(t, lerp(480, 690, sl), lerp(1360, 1300, sl), lerp(0.5, 0.34, sl), 0.03, {});
      officerA(t, { ...PA, part: 'arms' });
      const fy = lerp(1400, 1500, sl);
      yourHands(t, { sz: 70, l: [420, 1520, 0.4, 'back'], r: [lerp(470, 560, sl), fy, -0.25, 'point'] });
    });
  }
  // the two rooms, even: him in profile, you from behind, both turning to the wall; both hands come up flat against it
  function shotWall(t) {
    const k = sm(S('n11') - 0.3, F('n12') + 0.4, t), wx = 516, push = 1 + 0.05 * k, th = th_(t);
    const reach = sm(S('n11'), Wt('n12', 5), t);
    view(aim(470, 880, wx / 2 + 40, 900, push), [0, 0, wx, H], () => {
      room(t, PK, { doorX: 1000 });
      him(t, { x: 440, y: 840 + Math.sin(th * 1.5) * 3, s: 1.0, turn: 1.0, mouth: 'flat', open: 0, brow: -0.05, look: [1, 0.05], blink: blinkAt(t, [S('n12') + 0.6]), part: 'body' });
      table(PK);
      // his hand rises flat to the wall (screen-right)
      const hxw = lerp(600, 720, reach), hyw = lerp(1260, 870, reach);
      shape([PK], capsule(590, 1010, hxw - 30, hyw + 60, 38, 32), { tone: 0 }); stripes(capsule(590, 1010, hxw - 30, hyw + 60, 38, 32), [500, 800, 800, 1100], 140);
      hand([PK], hxw, hyw, 0.3 + 0.2 * reach, 108, 'back', { flip: 1, t, id: 'hw' });
    });
    view(aim(560, 900, (wx + GUT + W) / 2 - 30, 900, push), [wx + GUT, 0, W, H], () => {
      room(t, TE, { doorX: 660 });
      table(TE);
      you(t, { x: 690, y: 1240 + Math.sin(th * 1.7 + 1) * 3, s: 1.0, look: -1, wallHand: reach });
    });
    wallCut(wx);
  }
  // his sheet, close: the doodle he drew while you doubted him; it comes alive under the dare
  function shotDoodle(t) {
    const t0 = F('n12') + 0.15, k = sm(t0, t0 + 1.3, t);
    const life = { five: ramp(S('n13'), F('n13'), t), shh: sm(S('n14'), S('n14') + 0.25, t) * (1 - sm(F('n14') + 0.3, F('n14') + 0.5, t)), peek: sm(S('n15'), S('n15') + 0.3, t) };
    const k2 = sm(t0 + 1.3, F('n15'), t);
    view(aim(lerp(600, 604, k), lerp(1300, 1400, k), 540, 980, lerp(1.6, 3.7, k) + 1.6 * k2), null, () => {
      room(t, PK, { doorX: 1000 });
      table(PK);
      LAB.scenery(() => dealSheet(t, 600, 1335, 0.55, -0.06, { dl: 1, life }));   // the camera crops the sheet's header as it goes in
    });
  }
  // the case file: the sheet goes into CASE 46; CASE 47 lands on top, on "case"
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
    else if (t < F('n12') + 0.15) shotWall(t);
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
