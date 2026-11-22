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

  // ------------------------------------------------------------------ hands: a palm, four fingers, a thumb
  // drawn as one silhouette (a thick outline, then the inside knocked out), so fingers never show lines through the palm
  const FAN = { open: [-0.52, -0.18, 0.13, 0.44], flat: [-0.1, -0.03, 0.03, 0.1], loose: [-0.28, -0.08, 0.08, 0.26], fist: [0, 0, 0, 0], pen: [-0.18, -0.05, 0.05, 0.18], point: [0, -0.05, 0.05, 0.18] };
  const CURL = { open: [0, 0, 0, 0], flat: [0, 0, 0, 0], loose: [0.25, 0.2, 0.22, 0.3], fist: [1, 1, 1, 1], pen: [0.55, 0.65, 0.75, 0.8], point: [0, 1, 1, 1] };
  function handPath(pose) {
    const fan = FAN[pose], curl = CURL[pose], lens = [0.36, 0.43, 0.4, 0.31];
    return (g) => {
      g.beginPath();
      g.roundRect(-0.23, -0.2, 0.46, 0.44, 0.15);
      for (let i = 0; i < 4; i++) {
        const bx = -0.165 + i * 0.11, by = -0.15, a = -Math.PI / 2 + fan[i], L = lens[i] * (1 - 0.66 * curl[i]);
        capsuleTo(g, bx, by, bx + Math.cos(a) * L, by + Math.sin(a) * L, 0.062, 0.054);
      }
      const ta = (pose === 'fist' || pose === 'pen' || pose === 'point') ? -2.15 : -2.6;
      capsuleTo(g, -0.19, 0.07, -0.19 + Math.cos(ta) * 0.3, 0.07 + Math.sin(ta) * 0.3, 0.075, 0.062);
    };
  }
  // names: the ink; x, y: the wrist; ang: the hand's rotation (0 = fingers up); sz: px per hand-unit (a hand ≈ 0.8 sz long)
  function hand(names, x, y, ang, sz, pose = 'open', { flip = 1, t = 0, id = 'h', tone = 0 } = {}) {
    const [bx, by] = boil(t, id, 1.1);
    each(BOTH, (g) => { g.save(); g.translate(x + bx, y + by); g.rotate(ang); g.scale(sz * flip, sz); g.translate(0, -0.24); });
    const prev = CAM; CAM = { ...CAM, s: CAM.s * sz };
    try {
      const P = handPath(pose);
      occlude(P);
      line(names, P, 14);                    // a heavy outline...
      erase(names, P);                       // ...whose inside half is knocked out: one clean silhouette
      line(names, P, 0.01);
      if (tone > 0) dots(names, P, tone, [-0.5, -0.8, 0.5, 0.4]);
      if (CURL[pose][1] > 0.5) line(names, polyOpen([[-0.17, -0.08], [0.17, -0.08]]), 5);   // knuckles
    } finally { CAM = prev; each(BOTH, (g) => g.restore()); }
  }
  function armIK(sx, sy, hx, hy, l1, l2, side = 1) {
    const dx = hx - sx, dy = hy - sy, d = Math.min(Math.hypot(dx, dy), l1 + l2 - 1e-3);
    const a = Math.atan2(dy, dx), cosA = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
    const e = a + side * Math.acos(cosA);
    return [sx + Math.cos(e) * l1, sy + Math.sin(e) * l1];
  }

  // ------------------------------------------------------------------ performances: held poses, snapped with overshoot
  // keys: [[t, pose], ...] where a pose is an array of numbers and strings; numbers ease (overshoot) over `tr` seconds
  // after each key and hold till the next, strings switch halfway. Time is held on twos, like the drawings.
  function keyed(t, keys, tr = 0.17) {
    const th = held(t, N);
    let i = 0; while (i + 1 < keys.length && keys[i + 1][0] <= th) i++;
    const [k0, p0] = keys[i];
    if (i === 0 || th - k0 >= tr) return p0;
    const prev = keys[i - 1][1], u = clamp((th - k0) / tr), e = E.overshoot(u, 1.2);
    return p0.map((v, j) => (typeof v === 'number' ? lerp(prev[j], v, e) : (u < 0.5 ? prev[j] : v)));
  }
  // a talking track for him: a new gesture every 0.5–0.85 s from a seeded shuffle, never the same one twice running
  const HIS = {
    // left hand x, y, angle, pose; right hand x, y, angle, pose; head tilt; brow
    open: [400, 1120, -0.6, 'open', 745, 1130, 0.6, 'open', 0.04, 0.5],
    point: [370, 985, -0.25, 'point', 765, 1220, 0.4, 'loose', -0.05, 0.75],
    wide: [325, 1085, -1.0, 'open', 805, 1085, 1.0, 'open', 0.0, 0.65],
    shrug: [425, 1050, -1.25, 'open', 715, 1050, 1.25, 'open', 0.09, 0.95],
    tap: [440, 1250, -0.1, 'flat', 755, 1170, 0.5, 'loose', -0.03, 0.25],
    right: [420, 1215, -0.4, 'loose', 725, 985, 0.3, 'open', 0.06, 0.6],
  };
  const HIS_KEYS = (() => {
    const names = Object.keys(HIS), out = [[-1, HIS.open]];
    let tt = 0.0, last = 'open';
    for (let i = 0; tt < 70; i++) {
      let nm = names[Math.floor(rnd('gest', i) * names.length)];
      if (nm === last) nm = names[(names.indexOf(nm) + 1) % names.length];
      out.push([tt, HIS[nm]]); last = nm; tt += 0.5 + 0.35 * rnd('gdur', i);
    }
    return out;
  })();

  // ------------------------------------------------------------------ heads on a turning sphere
  // A feature at angle th round the head's vertical axis sits at x = sin(th + turn·0.55)·R; it shows while cos(·) > 0.
  // turn + = facing screen-right. The near eye stays wide, the far one foreshortens; a profile is the same head turned.
  const sx_ = (th, turn) => Math.sin(th + turn * 0.55);
  const sv_ = (th, turn) => Math.cos(th + turn * 0.55);

  // ------------------------------------------------------------------ HIM: your partner in crime (pink)
  // p: x, y (head centre), s (1 = a face 280 px wide), turn, tilt, mouth 'talk'|'grin'|'flat'|'sad'|'o', open 0–1,
  // smile 0–1, brow −1..1, frown 0–1, look [x, y], blink 0–1, arms { l, r: [hx, hy, ang, pose] } or behind: true
  function him(t, p) {
    const s = p.s ?? 1, R = 140 * s, x = p.x, y = p.y, turn = p.turn ?? 0, ink1 = [PK];
    const [bx, by] = boil(t, 'him', 1.3);
    each(BOTH, (g) => { g.save(); g.translate(x + bx, y + by); g.rotate(p.tilt ?? 0); g.translate(-x, -y); });
    try {
      const sy = y + R * 1.18, sw = R * 1.62;                 // shoulders
      const shL = [x - sw * 0.82, sy + R * 0.3], shR = [x + sw * 0.82, sy + R * 0.3];
      if (p.part !== 'arms') {
      if (p.behind) {                                         // hands clasped behind his head: the arms go first
        for (const sg of [-1, 1]) {
          const sh = sg < 0 ? shL : shR, el = [x + sg * R * 1.75, y - R * 0.15], hd = [x + sg * R * 0.55, y - R * 0.85];
          const up = capsule(sh[0], sh[1], el[0], el[1], R * 0.3, R * 0.25);
          shape(ink1, up, { tone: 0 }); stripes(up, bbOf([sh, el], R * 0.4), R);
          shape(ink1, capsule(el[0], el[1], hd[0], hd[1], R * 0.22, R * 0.2), { tone: 0 });
        }
      }
      const torso = blob([[x - sw * 1.05, sy + R * 2.6], [x - sw * 1.02, sy + R * 0.7], [x - sw * 0.82, sy + R * 0.08], [x - R * 0.42, sy - R * 0.12], [x + R * 0.42, sy - R * 0.12], [x + sw * 0.82, sy + R * 0.08], [x + sw * 1.02, sy + R * 0.7], [x + sw * 1.05, sy + R * 2.6]]);
      shape(ink1, torso, { tone: 0 });
      stripes(torso, [x - sw * 1.2, sy - R * 0.3, x + sw * 1.2, sy + R * 2.7], R);
      // the neck, the collar's curve
      const nk = poly([[x - R * 0.36, y + R * 0.7], [x + R * 0.36, y + R * 0.7], [x + R * 0.44, sy + R * 0.06], [x - R * 0.44, sy + R * 0.06]]);
      shape(ink1, nk, { tone: 0.2, bb: [x - R, y, x + R, sy + R * 0.3] });
      shape(ink1, blob([[x - R * 0.62, sy - R * 0.08], [x, sy + R * 0.34], [x + R * 0.62, sy - R * 0.08], [x, sy + R * 0.14]], 0.4), { tone: 0, ol: 8 });
      faceHim(t, x, y, R, turn, p);
      }
      if (p.part !== 'body' && p.arms) for (const side of ['l', 'r']) {
        const a = p.arms[side]; if (!a) continue;
        const sh = side === 'l' ? shL : shR, sg = side === 'l' ? -1 : 1, [hx, hy, ang, pose] = a;
        const el = armIK(sh[0], sh[1], hx, hy, R * 1.15, R * 1.05, sg > 0 ? -1 : 1);
        const up = capsule(sh[0], sh[1], el[0], el[1], R * 0.3, R * 0.25);
        shape(ink1, up, { tone: 0 }); stripes(up, bbOf([sh, el], R * 0.4), R);
        shape(ink1, capsule(el[0], el[1], hx, hy, R * 0.21, R * 0.18), { tone: 0 });
        hand(ink1, hx, hy, ang, R * 0.9, pose, { flip: sg, t, id: 'hh' + side });
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
    // the hair's mass behind: a cloud of curls over the top and down to the ears
    const curls = [];
    for (let i = 0; i <= 16; i++) {
      const a = Math.PI * (0.92 + i * (1.16 / 16)), rr = R * (0.34 + 0.07 * rnd('cu', i));
      curls.push([x + sh * R * 0.18 + Math.cos(a) * R * 1.08, y - R * 0.22 + Math.sin(a) * R * 1.02, rr]);
    }
    const cl = bpts(t, 'curl', curls.map((c) => [c[0], c[1]]), 1.6);
    const hairBack = (g) => {
      g.beginPath();
      g.moveTo(cl[0][0], cl[0][1]); for (const c of cl) g.lineTo(c[0], c[1]); g.lineTo(x + sh * R * 0.18, y - R * 0.2); g.closePath();
      cl.forEach((c, i) => { g.moveTo(c[0] + curls[i][2], c[1]); g.arc(c[0], c[1], curls[i][2], 0, TAU); });
    };
    shape(ink1, hairBack, { tone: 1, ol: 0 });
    // ears, under the hair's edge
    for (const sg of [-1, 1]) {
      const th = sg * 1.48, v = sv_(th, turn); if (v < 0.08) continue;
      const ex = fx(th) + sg * R * 0.08, ey = y + R * 0.22;
      shape(ink1, ell(ex, ey, R * 0.15 * (0.45 + 0.55 * v), R * 0.24), { tone: 0.2, bb: [ex - R * 0.3, ey - R * 0.3, ex + R * 0.3, ey + R * 0.3], ol: 7 });
    }
    // the face: round and soft, the chin a little forward when he turns
    const base = [[-0.97, -0.32], [-1.0, 0.12], [-0.9, 0.55], [-0.62, 0.88], [-0.28, 1.04], [0, 1.07], [0.28, 1.04], [0.62, 0.88], [0.9, 0.55], [1.0, 0.12], [0.97, -0.32], [0.86, -0.72], [0.5, -0.96], [0, -1.02], [-0.5, -0.96], [-0.86, -0.72]];
    const face = blob(bpts(t, 'face', base.map(([u, v]) => [x + (u + sh * 0.16 * clamp(v + 0.2, 0, 1)) * R, y + v * R * (1 + 0.04 * open)]), 1.1));
    shape(ink1, face, { tone: 0, ol: 8 });
    each(ink1, (g) => { g.save(); face(g); g.clip(); });
    dots(ink1, ell(x - Math.sign(turn || 1) * R * 1.05, y + R * 0.2, R * 0.55, R * 1.3), 0.18, [x - R * 1.8, y - R * 1.3, x + R * 1.8, y + R * 1.3]);
    for (const sg of [-1, 1]) { const th = sg * 0.68, v = sv_(th, turn); if (v > 0.15) dots(ink1, circ(fx(th), y + R * 0.48, R * 0.2 * (0.5 + 0.5 * v)), 0.4, [fx(th) - R * 0.3, y + R * 0.15, fx(th) + R * 0.3, y + R * 0.8]); }
    each(ink1, (g) => g.restore());
    // the hair's cap over the crown, down to the fringe (no sliver of forehead above the curls)
    const capPts = []; for (let i = 0; i <= 12; i++) { const a = Math.PI * (1.0 + i / 12); capPts.push([x + sh * R * 0.18 + Math.cos(a) * R * 0.98, y - R * 0.3 + Math.sin(a) * R * 0.78]); }
    shape(ink1, poly([...capPts, [x + sh * R * 0.18 + R * 0.95, y - R * 0.55], [x + sh * R * 0.18 - R * 0.95, y - R * 0.55]]), { tone: 1, ol: 0 });
    // the fringe: curls hanging over the forehead
    const fr = [];
    for (let i = 0; i < 7; i++) { const u = (i - 3) / 3; fr.push([x + sh * R * 0.3 + u * R * 0.8, y - R * 0.72 + Math.abs(u) * R * 0.06 + (i % 2) * R * 0.08, R * (0.25 + 0.05 * rnd('fr', i))]); }
    const fb = bpts(t, 'fringe', fr.map((c) => [c[0], c[1]]), 1.5);
    shape(ink1, (g) => { g.beginPath(); fb.forEach((c, i) => { g.moveTo(c[0] + fr[i][2], c[1]); g.arc(c[0], c[1], fr[i][2], 0, TAU); }); }, { tone: 1, ol: 0 });
    // brows: thick, alive
    const brow = p.brow ?? 0, frown = p.frown ?? 0;
    for (const sg of [-1, 1]) {
      const th = sg * 0.44, v = sv_(th, turn); if (v < 0.05) continue;
      const cx = fx(th), cy = y - R * 0.36 - brow * R * 0.12, half = R * 0.24 * (0.55 + 0.45 * v);
      const inX = cx - sg * half, outX = cx + sg * half;
      const sad = p.sad ?? 0;
      shape(ink1, capsule(inX, cy + frown * R * 0.12 - brow * R * 0.04 - sad * R * 0.16, outX, cy - R * 0.04 + sad * R * 0.08, R * 0.075, R * 0.06), { tone: 1, ol: 0 });
    }
    // eyes: big paper whites, a pink pupil with a paper glint, a heavy upper lid
    const lk = p.look ?? [0, 0];
    for (const sg of [-1, 1]) {
      const th = sg * 0.42, v = sv_(th, turn); if (v < 0.05) continue;
      const cx = fx(th), cy = y + R * 0.02, ew = R * 0.5 * (0.4 + 0.6 * v), eh = Math.max(1, R * 0.42 * (1 - blink));
      const eye = ell(cx, cy, ew / 2, eh / 2);
      shape(ink1, eye, { tone: 0, ol: 7 });
      if (blink < 0.6) {
        const px = cx + clamp(lk[0] * 0.3 + sh * 0.18, -0.34, 0.34) * ew, py = cy + lk[1] * eh * 0.2, pr = R * 0.14 * (0.55 + 0.45 * v);
        each(ink1, (g) => { g.save(); eye(g); g.clip(); g.beginPath(); g.arc(px, py, pr, 0, TAU); g.fill(); g.restore(); });
        erase(ink1, circ(px - pr * 0.35, py - pr * 0.4, pr * 0.3));
      }
      line(ink1, curve([[cx - ew * 0.56, cy - eh * 0.02], [cx, cy - eh * 0.58], [cx + ew * 0.56, cy - eh * 0.02]]), 11);
    }
    // the nose: a soft button, pointing the way he faces
    const nx = fx(0) + sh * R * 0.16;
    line(ink1, curve([[nx - R * 0.03, y + R * 0.18], [nx + R * 0.12 * Math.sign(sh || 1) * 0 + R * 0.1, y + R * 0.36], [nx - R * 0.08, y + R * 0.42]]), 8);
    // freckles
    for (const sg of [-1, 1]) { const th = sg * 0.6, v = sv_(th, turn); if (v < 0.25) continue; for (let i = 0; i < 4; i++) fill(ink1, circ(fx(th) + (rnd('fk', sg, i) - 0.5) * R * 0.3, y + R * 0.3 + (rnd('fy', sg, i) - 0.5) * R * 0.14, R * 0.026)); }
    mouthHim(fx(0) + sh * R * 0.08, y + R * 0.68, R, turn, p.mouth ?? 'flat', open, p.smile ?? 0);
  }
  function mouthHim(mx, my, R, turn, kind, open, smile) {
    const ink1 = [PK], w = R * 0.66 * (0.72 + 0.28 * Math.cos(turn * 0.55));
    if (kind === 'talk' || kind === 'o') {
      const ww = kind === 'o' ? w * 0.4 : w * (0.62 + 0.25 * smile), hh = R * (0.06 + 0.42 * open);
      const lift = smile * R * 0.06;
      const m = blob([[mx - ww / 2, my - lift], [mx - ww * 0.2, my - hh * 0.4], [mx + ww * 0.2, my - hh * 0.4], [mx + ww / 2, my - lift], [mx + ww * 0.24, my + hh * 0.62], [mx - ww * 0.24, my + hh * 0.62]], 0.6);
      shape(ink1, m, { tone: 1, ol: 8 });
      if (open > 0.3 && kind === 'talk') each(ink1, (g) => { g.save(); m(g); g.clip(); g.globalCompositeOperation = 'destination-out'; g.fillRect(mx - ww * 0.34, my - hh * 0.6, ww * 0.68, hh * 0.3); g.restore(); });
    } else if (kind === 'grin') {
      const ww = w * 1.28, hh = R * (0.26 + 0.14 * open);
      const m = blob([[mx - ww / 2, my - R * 0.1], [mx, my - R * 0.03], [mx + ww / 2, my - R * 0.1], [mx + ww * 0.32, my + hh * 0.78], [mx - ww * 0.32, my + hh * 0.78]], 0.55);
      shape(ink1, m, { tone: 1, ol: 8 });
      each(ink1, (g) => {
        g.save(); m(g); g.clip(); g.globalCompositeOperation = 'destination-out'; g.fillRect(mx - ww * 0.5, my - R * 0.12, ww, hh * 0.42); g.restore();
        g.save(); m(g); g.clip(); g.fillRect(mx + ww * 0.02, my - R * 0.12, ww * 0.055, hh * 0.42); g.restore();        // the gap in his teeth
      });
      for (const sg of [-1, 1]) line(ink1, curve([[mx + sg * ww * 0.56, my - R * 0.2], [mx + sg * ww * 0.6, my - R * 0.06]]), 6);
    } else if (kind === 'sad') {
      line(ink1, curve([[mx - w * 0.38, my + R * 0.08], [mx, my - R * 0.05], [mx + w * 0.38, my + R * 0.08]]), 10);
    } else {
      line(ink1, curve([[mx - w * 0.32, my + smile * -R * 0.04], [mx, my + R * 0.03 - smile * R * 0.02], [mx + w * 0.32, my - smile * R * 0.06]]), 10);
    }
  }

  // ------------------------------------------------------------------ YOU, from behind: a hood (teal)
  // p: x, y (the hood's centre), s; look −1..1 (the hood turns; −1 = to screen-left), chair: draw the chair's back
  function you(t, p) {
    const s = p.s ?? 1, R = 130 * s, x = p.x, y = p.y, look = p.look ?? 0, ink1 = [TE];
    const [bx, by] = boil(t, 'you', 1.2);
    each(BOTH, (g) => { g.save(); g.translate(bx, by); });
    try {
      // shoulders and back: dark dots, so the solid hood stands out on them
      const sy = y + R * 0.92;
      const back = blob([[x - R * 2.15, y + R * 4.2], [x - R * 2.0, sy + R * 0.75], [x - R * 1.45, sy + R * 0.05], [x - R * 0.6, sy - R * 0.2], [x + R * 0.6, sy - R * 0.2], [x + R * 1.45, sy + R * 0.05], [x + R * 2.0, sy + R * 0.75], [x + R * 2.15, y + R * 4.2]]);
      shape(ink1, back, { tone: 0.7, bb: [x - R * 2.3, sy - R * 0.4, x + R * 2.3, y + R * 4.3], ol: 8 });
      // the lamp's rim light along the tops of the shoulders
      eraseLine(ink1, curve([[x - R * 1.9, sy + R * 0.6], [x - R * 1.4, sy + R * 0.12], [x - R * 0.7, sy - R * 0.1]]), 9);
      eraseLine(ink1, curve([[x + R * 0.7, sy - R * 0.1], [x + R * 1.4, sy + R * 0.12], [x + R * 1.9, sy + R * 0.6]]), 9);
      // the hood's drape on the back: a soft triangle under the hood
      shape(ink1, blob([[x - R * 0.85, sy - R * 0.1], [x + R * 0.85, sy - R * 0.1], [x + R * 0.3, sy + R * 0.95], [x - R * 0.3, sy + R * 0.95]], 0.45), { tone: 1, ol: 0 });
      // the hood: rounded, a small peak, turned by `look`
      const hx = x + look * R * 0.1;
      const hp = [[hx - R * 0.86, y + R * 0.78], [hx - R * 0.98, y + R * 0.02], [hx - R * 0.74, y - R * 0.7], [hx - R * 0.04 + look * R * 0.1, y - R * 1.1], [hx + R * 0.66, y - R * 0.76], [hx + R * 0.96, y + R * 0.0], [hx + R * 0.84, y + R * 0.8], [hx, y + R * 0.98]];
      const hood = blob(bpts(t, 'hood', hp, 1.1));
      shape(ink1, hood, { tone: 1, ol: 0 });
      // the hood's centre seam and the rim of lamplight on its top (paper lines in the ink)
      eraseLine(ink1, curve([[hx - R * 0.06 + look * R * 0.1, y - R * 0.98], [hx + look * R * 0.32, y - R * 0.2], [hx + look * R * 0.42, y + R * 0.88]]), 7);
      eraseLine(ink1, curve([[hx - R * 0.62, y - R * 0.74], [hx - R * 0.06 + look * R * 0.1, y - R * 0.96], [hx + R * 0.56, y - R * 0.76]]), 6);
      // turning toward the wall: the hood's opening shows as a dark edge on that side (no face: it's you)
      if (Math.abs(look) > 0.2) {
        const sg = Math.sign(look), k = (Math.abs(look) - 0.2) / 0.8;
        eraseLine(ink1, curve([[hx + sg * R * 0.92, y - R * 0.38], [hx + sg * R * (1.0 - 0.1 * k), y + R * 0.12], [hx + sg * R * 0.82, y + R * 0.66]]), 12 + 10 * k);
        line(BOTH, curve([[hx + sg * R * 0.9, y - R * 0.34], [hx + sg * R * (0.97 - 0.1 * k), y + R * 0.12], [hx + sg * R * 0.8, y + R * 0.62]]), 5 + 5 * k);
      }
      if (p.arms) {                                          // your arms going forward to the table: sleeves, elbows out
        for (const sg of [-1, 1]) {
          const s0 = [x + sg * R * 1.55, sy + R * 0.5], el = [x + sg * R * 2.05, sy + R * 1.5], wr = [x + sg * R * 0.85, sy + R * 1.05 + (p.armLift ?? 0) * R * 0.2];
          shape(ink1, capsule(s0[0], s0[1], el[0], el[1], R * 0.42, R * 0.36), { tone: 0.82, bb: bbOf([s0, el], R * 0.6), ol: 7 });
          shape(ink1, capsule(el[0], el[1], wr[0], wr[1], R * 0.34, R * 0.3), { tone: 0.82, bb: bbOf([el, wr], R * 0.5), ol: 7 });
        }
      }
    } finally { each(BOTH, (g) => g.restore()); }
  }
  function yourHand(t, x, y, ang, sz, pose = 'pen', { pen = true } = {}) {
    each(BOTH, (g) => { g.save(); g.translate(x, y); g.rotate(ang); });
    try {
      shape([TE], capsule(sz * 0.05, sz * 0.25, sz * 0.4, sz * 2.6, sz * 0.4, sz * 0.55), { tone: 1, ol: 0 });     // the sleeve
      if (pen) shape(BOTH, capsule(-sz * 0.02, -sz * 1.0, sz * 0.14, sz * 0.1, sz * 0.05, sz * 0.055), { tone: 1, ol: 0 });
      hand([TE], 0, 0, 0, sz, pose, { t, id: 'yh' });
    } finally { each(BOTH, (g) => g.restore()); }
  }

  // ------------------------------------------------------------------ the officers (the dark overprint: both inks)
  // OFFICER A, your room: heavy, balding, a moustache, a tie. p: x, y, s, turn, open, brow, frown, look, arms
  function officerA(t, p) {
    const s = p.s ?? 1, R = 140 * s, x = p.x, y = p.y, turn = p.turn ?? 0, ink2 = BOTH, sh = Math.sin(turn * 0.55);
    const [bx, by] = boil(t, 'offA', 1.2);
    each(BOTH, (g) => { g.save(); g.translate(bx, by); });
    try {
      const sy = y + R * 1.08;
      if (p.part !== 'arms') {
      const body = blob([[x - R * 2.1, sy + R * 2.8], [x - R * 1.95, sy + R * 0.45], [x - R * 1.2, sy - R * 0.08], [x - R * 0.4, sy - R * 0.2], [x + R * 0.4, sy - R * 0.2], [x + R * 1.2, sy - R * 0.08], [x + R * 1.95, sy + R * 0.45], [x + R * 2.1, sy + R * 2.8]]);
      shape(ink2, body, { tone: 0.1, bb: [x - R * 2.2, sy - R * 0.3, x + R * 2.2, sy + R * 2.9] });
      shape(ink2, poly([[x - R * 0.13, sy + R * 0.02], [x + R * 0.13, sy + R * 0.02], [x + R * 0.22, sy + R * 1.4], [x, sy + R * 1.65], [x - R * 0.22, sy + R * 1.4]]), { tone: 1, ol: 0 });
      line(ink2, polyOpen([[x - R * 0.55, sy - R * 0.16], [x - R * 0.1, sy + R * 0.2], [x, sy - R * 0.02], [x + R * 0.1, sy + R * 0.2], [x + R * 0.55, sy - R * 0.16]]), 8);
      shape(ink2, poly([[x - R * 0.42, y + R * 0.72], [x + R * 0.42, y + R * 0.72], [x + R * 0.5, sy], [x - R * 0.5, sy]]), { tone: 0.3, bb: [x - R, y, x + R, sy + R * 0.3] });
      // the head: broad, balding, a shine on the crown
      const base = [[-0.98, -0.25], [-1.02, 0.2], [-0.94, 0.6], [-0.7, 0.92], [-0.32, 1.08], [0, 1.1], [0.32, 1.08], [0.7, 0.92], [0.94, 0.6], [1.02, 0.2], [0.98, -0.25], [0.84, -0.66], [0.48, -0.92], [0, -0.98], [-0.48, -0.92], [-0.84, -0.66]];
      const face = blob(bpts(t, 'faceA', base.map(([u, v]) => [x + (u + sh * 0.14 * clamp(v + 0.2, 0, 1)) * R, y + v * R]), 1.1));
      shape(ink2, face, { tone: 0, ol: 8 });
      each(ink2, (g) => { g.save(); face(g); g.clip(); });
      dots(ink2, ell(x - Math.sign(turn || 1) * R * 1.05, y + R * 0.25, R * 0.6, R * 1.3), 0.2, [x - R * 1.8, y - R * 1.3, x + R * 1.8, y + R * 1.3]);
      dots(ink2, ell(x + sh * R * 0.1, y - R * 0.95, R * 0.95, R * 0.35), 0.22, [x - R * 1.2, y - R * 1.4, x + R * 1.2, y - R * 0.5]);
      each(ink2, (g) => g.restore());
      erase(ink2, ell(x - R * 0.28 + sh * R * 0.2, y - R * 0.72, R * 0.22, R * 0.08, -0.25));      // the shine
      for (const sg of [-1, 1]) {                       // ears, and a thin band of grey hair above each
        const th = sg * 1.42, v = sv_(th, turn); if (v < 0.05) continue;
        const cx = x + sx_(th, turn) * R + sg * R * 0.06;
        shape(ink2, ell(cx, y + R * 0.12, R * 0.13 * (0.45 + 0.55 * v), R * 0.22), { tone: 0, ol: 7 });
        line(ink2, curve([[cx - sg * R * 0.02, y + R * 0.04], [cx + sg * R * 0.04, y + R * 0.14], [cx, y + R * 0.24]]), 5);
        shape(ink2, blob([[cx - R * 0.1, y - R * 0.5], [cx + R * 0.1, y - R * 0.52], [cx + R * 0.09, y - R * 0.1], [cx - R * 0.06, y - R * 0.08]]), { tone: 0.6, bb: [cx - R * 0.2, y - R * 0.6, cx + R * 0.2, y], ol: 5 });
      }
      const fx = (th) => x + sx_(th, turn) * R;
      for (const sg of [-1, 1]) {                       // heavy brows, pulled down
        const th = sg * 0.44, v = sv_(th, turn); if (v < 0.05) continue;
        const cx = fx(th), cy = y - R * 0.3 - (p.brow ?? 0) * R * 0.1, half = R * 0.26 * (0.55 + 0.45 * v);
        shape(ink2, capsule(cx - sg * half, cy + R * 0.1 * (p.frown ?? 0.6), cx + sg * half, cy - R * 0.04, R * 0.085, R * 0.07), { tone: 1, ol: 0 });
      }
      const lk = p.look ?? [0, 0];
      for (const sg of [-1, 1]) {                       // small hard eyes, with bags under them
        const th = sg * 0.42, v = sv_(th, turn); if (v < 0.05) continue;
        const cx = fx(th), cy = y - R * 0.06, ew = R * 0.36 * (0.4 + 0.6 * v);
        shape(ink2, ell(cx, cy, ew / 2, R * 0.1), { tone: 0, ol: 7 });
        fill(ink2, circ(cx + clamp(lk[0] * 0.3 + sh * 0.15, -0.3, 0.3) * ew, cy + lk[1] * R * 0.03, R * 0.075));
        line(ink2, curve([[cx - ew * 0.4, cy + R * 0.2], [cx, cy + R * 0.25], [cx + ew * 0.4, cy + R * 0.2]]), 5);
      }
      const nx = fx(0) + sh * R * 0.18;                 // a big nose
      line(ink2, curve([[nx - R * 0.04, y + R * 0.02], [nx + R * 0.16, y + R * 0.34], [nx + R * 0.04, y + R * 0.46], [nx - R * 0.16, y + R * 0.42]]), 8);
      fill(ink2, circ(nx - R * 0.07, y + R * 0.4, R * 0.035));
      const mo = p.open ?? 0, mx = nx - sh * R * 0.06;
      if (mo > 0.05) shape(ink2, ell(mx, y + R * 0.74, R * 0.18, R * (0.04 + 0.16 * mo)), { tone: 1, ol: 0 });
      else line(ink2, curve([[mx - R * 0.2, y + R * 0.78], [mx, y + R * 0.75], [mx + R * 0.2, y + R * 0.78]]), 8);
      // the moustache, thick, over the mouth
      shape(ink2, blob([[mx - R * 0.5, y + R * 0.7], [mx - R * 0.36, y + R * 0.5], [mx, y + R * 0.55], [mx + R * 0.36, y + R * 0.5], [mx + R * 0.5, y + R * 0.7], [mx + R * 0.24, y + R * 0.66], [mx, y + R * 0.62], [mx - R * 0.24, y + R * 0.66]], 0.5), { tone: 1, ol: 0 });
      line(ink2, curve([[x - R * 0.7, y + R * 0.95], [x, y + R * 1.18], [x + R * 0.7, y + R * 0.95]]), 6);   // the jowl
      }
      if (p.part !== 'body' && p.arms) for (const side of ['l', 'r']) {
        const a = p.arms[side]; if (!a) continue;
        const sg = side === 'l' ? -1 : 1, sh2 = [x + sg * R * 1.6, sy + R * 0.4], [hx, hy, ang, pose] = a;
        const el = armIK(sh2[0], sh2[1], hx, hy, R * 1.2, R * 1.1, sg > 0 ? -1 : 1);
        shape(ink2, capsule(sh2[0], sh2[1], el[0], el[1], R * 0.36, R * 0.3), { tone: 0.1, bb: bbOf([sh2, el], R * 0.5) });
        shape(ink2, capsule(el[0], el[1], hx, hy, R * 0.25, R * 0.22), { tone: 0.3, bb: bbOf([el, [hx, hy]], R * 0.4) });
        hand(ink2, hx, hy, ang, R * 1.0, pose, { flip: sg, t, id: 'ha' + side, tone: 0.22 });
      }
    } finally { each(BOTH, (g) => g.restore()); }
  }
  // OFFICER B, his room: in profile facing right, glasses, a bun. p: x, y, s, laugh 0–1, pad [x, y] (her blank notepad)
  function officerB(t, p) {
    const s = p.s ?? 1, R = 130 * s, x = p.x, y = p.y, lg = p.laugh ?? 0, ink2 = BOTH;
    const [bx, by] = boil(t, 'offB', 1.2);
    each(BOTH, (g) => { g.save(); g.translate(bx, by); });
    try {
      const sy = y + R * 1.05;
      shape(ink2, blob([[x - R * 1.4, sy + R * 2.6], [x - R * 1.3, sy + R * 0.3], [x - R * 0.5, sy - R * 0.25], [x + R * 0.3, sy - R * 0.15], [x + R * 1.0, sy + R * 0.4], [x + R * 1.3, sy + R * 2.6]]), { tone: 0.5, bb: [x - R * 1.5, sy - R * 0.4, x + R * 1.5, sy + R * 2.7] });
      shape(ink2, poly([[x - R * 0.3, y + R * 0.6], [x + R * 0.25, y + R * 0.6], [x + R * 0.3, sy], [x - R * 0.35, sy]]), { tone: 0, ol: 7 });
      const piv = [x, y + R * 0.5], back = -0.3 * lg;
      each(BOTH, (g) => { g.save(); g.translate(piv[0], piv[1]); g.rotate(back); g.translate(-piv[0], -piv[1]); });
      const prof = blob(bpts(t, 'profB', [[x - R * 0.78, y - R * 0.1], [x - R * 0.6, y - R * 0.72], [x - R * 0.05, y - R * 0.98], [x + R * 0.5, y - R * 0.72], [x + R * 0.66, y - R * 0.3], [x + R * 0.68, y - R * 0.12], [x + R * 0.9, y + R * 0.14], [x + R * 0.7, y + R * 0.24], [x + R * 0.74, y + R * 0.42 + lg * R * 0.1], [x + R * 0.6, y + R * 0.56 + lg * R * 0.3], [x + R * 0.66, y + R * 0.7 + lg * R * 0.3], [x + R * 0.4, y + R * 0.9 + lg * R * 0.22], [x - R * 0.1, y + R * 0.82], [x - R * 0.6, y + R * 0.45]], 1.1), 0.45);
      shape(ink2, prof, { tone: 0, ol: 8 });
      each(ink2, (g) => { g.save(); prof(g); g.clip(); });
      dots(ink2, ell(x - R * 0.6, y + R * 0.3, R * 0.5, R * 0.7), 0.18, [x - R * 1.2, y - R * 0.5, x + R * 0.2, y + R * 1.1]);
      each(ink2, (g) => g.restore());
      // hair pulled back to a bun
      shape(ink2, blob([[x - R * 0.82, y + R * 0.3], [x - R * 0.84, y - R * 0.5], [x - R * 0.35, y - R * 1.04], [x + R * 0.3, y - R * 1.0], [x + R * 0.58, y - R * 0.66], [x + R * 0.1, y - R * 0.6], [x - R * 0.22, y - R * 0.2], [x - R * 0.42, y + R * 0.38]], 0.5), { tone: 1, ol: 0 });
      shape(ink2, circ(x - R * 0.98, y - R * 0.56, R * 0.3), { tone: 1, ol: 0 });
      line(ink2, ell(x - R * 0.2, y + R * 0.02, R * 0.09, R * 0.14), 6);                         // her ear
      // glasses: a lens with its arm back to the ear; the eye behind it laughing shut (an arc)
      shape(ink2, (g) => { g.beginPath(); g.roundRect(x + R * 0.26, y - R * 0.3, R * 0.38, R * 0.26, R * 0.08); }, { tone: 0, ol: 7 });
      line(ink2, polyOpen([[x + R * 0.26, y - R * 0.2], [x - R * 0.15, y - R * 0.1]]), 6);
      if (lg > 0.3) line(ink2, curve([[x + R * 0.33, y - R * 0.16], [x + R * 0.45, y - R * 0.24], [x + R * 0.57, y - R * 0.16]]), 7);
      else { shape(ink2, ell(x + R * 0.47, y - R * 0.17, R * 0.07, R * 0.05), { tone: 1, ol: 0 }); }
      line(ink2, curve([[x + R * 0.28, y - R * 0.4 - lg * R * 0.05], [x + R * 0.46, y - R * 0.46 - lg * R * 0.06], [x + R * 0.62, y - R * 0.4]]), 7);   // a brow up
      if (lg > 0.05) shape(ink2, blob([[x + R * 0.56, y + R * 0.38], [x + R * 0.76, y + R * 0.42], [x + R * 0.7, y + R * 0.5 + lg * R * 0.24], [x + R * 0.52, y + R * 0.5 + lg * R * 0.2]], 0.5), { tone: 1, ol: 0 });
      else line(ink2, curve([[x + R * 0.54, y + R * 0.44], [x + R * 0.72, y + R * 0.46]]), 7);
      each(BOTH, (g) => g.restore());
      if (p.pad) {
        const [px, py] = p.pad;
        shape(ink2, poly([[px - R * 0.42, py - R * 0.62], [px + R * 0.42, py - R * 0.68], [px + R * 0.48, py + R * 0.55], [px - R * 0.36, py + R * 0.6]]), { tone: 0, ol: 7 });
        line(ink2, polyOpen([[px - R * 0.38, py - R * 0.5], [px + R * 0.44, py - R * 0.56]]), 12);
        hand(ink2, px - R * 0.2, py + R * 0.62, 0.15, R * 0.8, 'loose', { flip: 1, t, id: 'hb', tone: 0.18 });
      }
    } finally { each(BOTH, (g) => g.restore()); }
  }

  // ------------------------------------------------------------------ the rooms (room space, 1080 × 1920)
  // the back wall in the room's ink, the lamp's pool of light (paper), the floor, a door, the table
  function room(t, nm, { doorX = 640, poster = false, light = 0, open = 0 } = {}) {
    const ink1 = [nm], li = E.inOut(clamp(light));
    dots(ink1, rect(-600, -400, 2300, 2900), lerp(0.34, 0.1, li), [-600, -400, 1700, 2500]);
    const pool = poly([[500, 372], [580, 372], [930, 1250], [150, 1250]]);
    erase(ink1, pool); dots(ink1, pool, 0.07, [140, 360, 940, 1260]);
    dots(ink1, rect(-600, 1500, 2300, 1000), lerp(0.58, 0.25, li), [-600, 1500, 1700, 2500]);
    line(ink1, polyOpen([[-600, 1500], [1700, 1500]]), 8);
    // the door in the back wall
    const dx = doorX, dy = 520, dw = 220, dh = 640;
    shape(ink1, rect(dx - 16, dy - 16, dw + 32, dh + 16), { tone: 1, ol: 0 });
    const op = E.out(clamp(open));
    if (op > 0.01) {
      erase(BOTH, rect(dx, dy, dw, dh));                     // the doorway: daylight (paper), the leaf swung into the room
      shape(ink1, poly([[dx, dy], [dx + dw * (1 - 0.8 * op), dy - 30 * op], [dx + dw * (1 - 0.8 * op), dy + dh + 30 * op], [dx, dy + dh]]), { tone: 0.5, bb: [dx, dy - 40, dx + dw, dy + dh + 40], ol: 7 });
    } else {
      shape(ink1, rect(dx, dy, dw, dh), { tone: 0.12, bb: [dx, dy, dx + dw, dy + dh], ol: 7 });
      shape(ink1, rect(dx + 58, dy + 70, dw - 116, 130), { tone: 0.8, bb: [dx, dy, dx + dw, dy + 240], ol: 6 });
      fill(ink1, circ(dx + 26, dy + 350, 10));
    }
    if (poster) wantedPoster(t, 230, 700);
    // the lamp: a cord and a cone shade
    line(ink1, polyOpen([[540, -400], [540, 300]]), 6);
    shape(ink1, poly([[478, 298], [602, 298], [650, 374], [430, 374]]), { tone: 1, ol: 0 });
    erase(BOTH, ell(540, 374, 108, 13)); line(ink1, ell(540, 374, 108, 13), 6);
  }
  function table(nm, { y = 1250 } = {}) {
    const ink1 = [nm];
    shape(ink1, poly([[140, y], [940, y], [1060, y + 170], [20, y + 170]]), { tone: 0.12, bb: [20, y, 1060, y + 170] });
    shape(ink1, poly([[20, y + 170], [1060, y + 170], [1060, y + 250], [20, y + 250]]), { tone: 1, ol: 0 });
  }
  // the season's thief on a WANTED poster: the cap first (a brim that reads small), the mole on his left cheek (the
  // screen's right, as he faces the camera). Hidden once, in the background of your room.
  function wantedPoster(t, px, py) {
    const ink2 = BOTH;
    LAB.scenery(() => {
      shape(ink2, poly([[px - 72, py - 96], [px + 72, py - 100], [px + 74, py + 98], [px - 70, py + 100]]), { tone: 0, ol: 6 });
      type('WANTED', px, py - 64, 27, { names: ink2 });
      shape([PK], ell(px, py + 22, 34, 40), { tone: 0.2, bb: [px - 40, py - 26, px + 40, py + 64], ol: 5 });
      shape(ink2, poly([[px - 37, py + 4], [px - 30, py - 26], [px + 30, py - 26], [px + 37, py + 4]]), { tone: 1, ol: 0 });
      shape(ink2, poly([[px - 43, py + 4], [px + 46, py + 4], [px + 64, py + 13], [px - 40, py + 13]]), { tone: 1, ol: 0 });
      fill(ink2, circ(px - 12, py + 22, 3.8)); fill(ink2, circ(px + 12, py + 22, 3.8));
      fill(ink2, circ(px + 20, py + 37, 3.6));
      line(ink2, polyOpen([[px - 10, py + 46], [px + 10, py + 46]]), 4);
    });
  }

  // ------------------------------------------------------------------ the deal sheet, the ballot, the doodle, the files
  function dealSheet(t, x, y, s, ang, { doodle = 0, scrawl = 0 } = {}) {
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
      line(ink2, polyOpen([[-140, 170], [140, 170]]), 4);
      if (scrawl > 0) {                                       // his pen going round and round in the corner: the doodle, hidden
        const n = Math.floor(scrawl * 14);
        const pts = []; for (let i = 0; i <= n; i++) pts.push([40 + 48 * Math.cos(i * 1.9) * (0.4 + 0.6 * rnd('sc', i)), 70 + 36 * Math.sin(i * 2.3) * (0.4 + 0.6 * rnd('sd', i))]);
        if (pts.length > 1) line([PK], curve(pts), 4);
      }
      if (doodle > 0) doodleArt(t, 0, 112, 0.74, doodle);
    } finally { CAM = prev; each(BOTH, (g) => g.restore()); }
  }
  // his doodle: the two of you, masks up, high-fiving; where your hands meet, the two inks overprint
  function doodleArt(t, x, y, s, k) {
    const fig = (names, cx, sg) => {
      each(names, (g) => {
        g.save(); g.lineWidth = lw(5.5); g.lineCap = 'round'; g.lineJoin = 'round';
        g.beginPath(); g.arc(cx, y - 66 * s, 21 * s, 0, TAU); g.stroke();
        g.fillRect(cx - 23 * s, y - 75 * s, 46 * s, 10 * s);
        g.beginPath();
        g.moveTo(cx, y - 45 * s); g.lineTo(cx - sg * 3 * s, y + 18 * s);
        g.moveTo(cx - sg * 3 * s, y + 18 * s); g.lineTo(cx - 20 * s, y + 58 * s);
        g.moveTo(cx - sg * 3 * s, y + 18 * s); g.lineTo(cx + 20 * s, y + 58 * s);
        g.moveTo(cx, y - 28 * s); g.lineTo(cx - sg * 32 * s, y - 2 * s);
        g.moveTo(cx, y - 28 * s); g.lineTo(cx + sg * 38 * s, y - 88 * s);
        g.stroke(); g.restore();
      });
    };
    const reveal = clamp(k);
    each(BOTH, (g) => { g.save(); g.beginPath(); g.rect(x - 160, y - 170, 320 * reveal, 300); g.clip(); });
    try {
      fig([TE], x - 50 * s, 1);
      fig([PK], x + 50 * s, -1);
      fill(BOTH, circ(x - 10 * s, y - 92 * s, 10 * s));
      fill(BOTH, circ(x + 10 * s, y - 92 * s, 10 * s));
      for (const [a, b] of [[[-20, -116], [-27, -130]], [[0, -120], [0, -136]], [[20, -116], [27, -130]]]) line(BOTH, polyOpen([[x + a[0] * s, y + a[1] * s], [x + b[0] * s, y + b[1] * s]]), 4);
    } finally { each(BOTH, (g) => g.restore()); }
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
    if (drain != null) fill(BOTH, rect(66, yy + 36, 868 * (1 - clamp(drain)), 10));
  }
  function folder(t, x, y, ang, label, { s = 1, sub: subLabel = '' } = {}) {
    each(BOTH, (g) => { g.save(); g.translate(x, y); g.rotate(ang); g.scale(s, s); });
    const prev = CAM; CAM = { ...CAM, s: CAM.s * s };
    try {
      shape([PK], poly([[-330, -230], [-120, -230], [-92, -264], [62, -264], [90, -230], [330, -230], [330, 230], [-330, 230]]), { tone: 0.08, bb: [-340, -270, 340, 240], ol: 10 });
      line([PK], polyOpen([[-330, -196], [330, -196]]), 5);
      stamp(t, -1, label, 0, subLabel ? -10 : 24, 96, { angle: -0.05 });
      if (subLabel) type(subLabel, 6, 112, 58, { angle: -0.05 });          // the next case's subject (HQ, 23 Nov)
    } finally { CAM = prev; each(BOTH, (g) => g.restore()); }
  }
  // bars over a panel: their count is the sentence in years; they drop one after another and bounce on the floor
  function barsOver(t, r4, count, t0) {
    if (count <= 0 || t < t0) return;
    const [x0, y0, x1, y1] = r4, w = x1 - x0;
    for (let i = 0; i < count; i++) {
      const bx = x0 + w * (i + 0.5) / count, k = clamp((t - t0 - 0.025 * i) / 0.24);
      const drop = (1 - E.bounce(k)) * (y1 - y0);
      shape(BOTH, rect(bx - 10, y0 - 60 - drop, 20, (y1 - y0) + 60), { tone: 1, ol: 0 });
    }
    if (count >= 5) shape(BOTH, rect(x0, y0 - 8, w, 18), { tone: 1, ol: 0 });
  }

  // ------------------------------------------------------------------ the split: two rooms and the wall between them
  const GUT = 48;
  // where the wall stands: his room wide while he talks, yours while your officer deals, even for the stakes, his again
  // for the doubt
  function wallAt(t) {
    const a = S('d01') - 0.75, b = S('d03') + 0.25, c = F('n03') + 0.05;
    let x = 640;
    x = lerp(x, 380, sm(a, a + 0.55, t));
    x = lerp(x, 516, sm(b, b + 0.45, t));
    x = lerp(x, 640, sm(c, c + 0.45, t));
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
  // blinks at set moments only (never on frame 0, never on a key word)
  const blinkAt = (t, list) => (list.some((b) => t >= b && t < b + 0.1) ? 1 : 0);

  function shotSplit(t) {
    const wx = wallAt(t), push = 1 + 0.03 * clamp(t / 16);
    const hisR = [0, 0, wx, H], yourR = [wx + GUT, 0, W, H];
    const th = th_(t);
    const d1 = S('d01'), d2 = S('d02'), d3 = S('d03'), n3 = S('n03'), flip = F('d02') + 0.1;
    const doubt = t > F('n03') + 0.1;
    const hisFree = ramp(flip, flip + 0.35, t) * (t < d3 ? 1 : 0);
    // her laugh comes in bursts: on frame 0, in the gap after the first line, and in the doubt
    const lgh = Math.max(ramp(0.9, 0.5, t) * (t < 0.9 ? 1 : 0), clamp(Math.min(ramp(F('n01') + 0.05, F('n01') + 0.2, t), ramp(S('n02') + 0.1, S('n02') - 0.15, t))), clamp(Math.min(ramp(F('n03') + 0.15, F('n03') + 0.3, t), ramp(S('n04') - 0.1, S('n04') - 0.4, t))));
    // his room: him talking with his hands (a new gesture every half second or so), her laughing; in the doubt, his pen
    view(aim(470, 880, wx / 2 + 30, 900, push), hisR, () => {
      room(t, PK, { doorX: 900, light: hisFree });
      officerB(t, { x: 245, y: 960 + 6 * Math.sin(th * 14) * lgh, s: 0.92, laugh: 0.15 + 0.85 * lgh * (0.75 + 0.25 * Math.sin(th * 17)), pad: [380, 1180] });
      const g = keyed(t, HIS_KEYS);
      const yak = 0.5 + 0.5 * Math.abs(Math.sin(th * 11.5)) * (0.6 + 0.4 * Math.sin(th * 2.7));
      const scr = ramp(F('n03') + 0.15, F('n03') + 1.4, t);
      const P = {
        x: 560, y: 840 + 4 * Math.sin(th * 1.8), s: 1.0, turn: doubt ? -0.1 : -0.42, tilt: doubt ? 0.1 : g[8], mouth: 'talk', open: yak, smile: 0.45,
        brow: doubt ? 0.1 : g[9], look: doubt ? [0.1, 0.8] : [-0.7, 0.05], blink: blinkAt(t, [2.6, 6.4, 11.8]),
        arms: doubt ? { l: [575 + 18 * Math.cos(th * 9), 1300 + 10 * Math.sin(th * 11), -0.5, 'pen'], r: [775, 1215, 0.5, 'loose'] }
          : { l: [g[0], g[1], g[2], g[3]], r: [g[4], g[5], g[6], g[7]] },
      };
      him(t, { ...P, part: 'body' });
      table(PK);
      if (doubt) dealSheet(t, 600, 1320, 0.55, -0.08, { scrawl: scr });
      him(t, { ...P, part: 'arms' });
    });
    // your room: you've just been put in the chair; your officer deals when the wall moves; FREE opens your door
    const yourFree = sm(d1 + 0.3, d1 + 0.75, t) * (t < flip ? 1 : 0);
    view(aim(560, 900, (wx + GUT + W) / 2 + 10, 900, push), yourR, () => {
      room(t, TE, { doorX: 660, poster: true, light: yourFree, open: yourFree });
      const rest = [330, 1290, 0.15, 'flat', 560, 1270, -0.25, 'loose'];
      const A = keyed(t, [
        [-1, [330, 1170, 0.1, 'flat', 560, 1270, -0.25, 'loose']],
        [d1 - 0.32, [330, 1290, 0.15, 'flat', 560, 1270, -0.25, 'loose']],                 // the slap
        [Wt('d01', 2) - 0.1, [330, 1290, 0.15, 'flat', 640, 1110, 0.75, 'point']],         // "walks out" (at the door)
        [d2 - 0.05, [215, 1100, -1.25, 'point', 560, 1270, -0.25, 'loose']],               // "the other one": at the wall
        [F('d02') + 0.25, rest],
        [d3 - 0.05, [270, 1170, -0.95, 'open', 600, 1170, 0.95, 'open']],                  // "you both"
        [F('d03') + 0.2, rest],
      ], 0.15);
      const slapK = sm(d1 - 0.32, d1 - 0.2, t);
      const P = { x: 400, y: 870 + 10 * (1 - slapK) * (t > d1 - 0.6 ? 1 : 0), s: 1.0, turn: 0.35, open: lips(t, ['d01', 'd02', 'd03']), brow: -0.25, frown: 0.85, look: t >= d2 - 0.05 && t < F('d02') + 0.2 ? [-0.8, 0.1] : [0.5, 0.35], arms: { l: [A[0], A[1], A[2], A[3]], r: [A[4], A[5], A[6], A[7]] } };
      officerA(t, { ...P, part: 'body' });
      table(TE);
      if (t > d1 - 0.22) dealSheet(t, 420, 1350, 0.6, 0.06, {});
      officerA(t, { ...P, part: 'arms' });
      const land = clamp(t / 0.3), flinch = Math.exp(-Math.max(0, t - (d1 - 0.2)) * 9) * (t > d1 - 0.2 ? 1 : 0);
      const look = -0.9 * sm(S('n02') - 0.3, S('n02') + 0.25, t) * (1 - sm(d1 - 0.6, d1, t)) + -0.9 * sm(F('n03'), F('n03') + 0.5, t);
      you(t, { x: 640, y: 1240 - (1 - E.bounce(land)) * 40 + Math.sin(th * 1.7) * 3 + 14 * flinch, s: 1.0, arms: true, look });
    });
    wallCut(wx);
    // the stakes: whoever talks walks (their door opens on daylight: FREE); the other does ten (ten bars)
    const hisMid = wx / 2, yourMid = (wx + GUT + W) / 2;
    if (t >= d1 + 0.3 && t < flip) stamp(t, d1 + 0.5, 'FREE', yourMid + 40, 560, 92, { angle: 0.05 });
    if (t >= d2 + 0.2 && t < flip) { barsOver(t, [16, 280, wx - 16, 1250], 10, d2 + 0.25); stamp(t, d2 + 0.45, '10 YEARS', hisMid, 760, 56); }
    if (t >= flip && t < d3) {
      stamp(t, flip + 0.15, 'FREE', hisMid, 560, 76, { angle: -0.05 });
      barsOver(t, [wx + GUT + 16, 280, W - 16, 1250], 10, flip + 0.05); stamp(t, flip + 0.25, '10 YEARS', yourMid, 760, 64);
    }
    if (t >= d3 + 0.5 && t < n3) { barsOver(t, [16, 280, wx - 16, 1250], 5, F('d03') - 0.6); barsOver(t, [wx + GUT + 16, 280, W - 16, 1250], 5, F('d03') - 0.6); stamp(t, F('d03') - 0.5, '5', hisMid, 760, 120); stamp(t, F('d03') - 0.5, '5', yourMid, 760, 120); }
    const one = Wt('n03', 4) - 0.08;                       // "a year": one bar each, its stamp with it
    if (t >= one && t < F('n03') + 0.35) { barsOver(t, [16, 280, wx - 16, 1250], 1, one); barsOver(t, [wx + GUT + 16, 280, W - 16, 1250], 1, one); stamp(t, one + 0.05, '1', hisMid - 80, 760, 120); stamp(t, one + 0.05, '1', yourMid + 80, 760, 120); }
    if (t < d1 - 0.7) { type("HE'S", 56, 400, 70, { align: 'left' }); type('TALKING.', 56, 492, 98, { align: 'left' }); }
    ballot(t, F('n01') + 0.5);
  }
  // over your shoulder: your sheet, your pen hovering between the boxes; the bar under the choices drains (the pick)
  function shotPick(t) {
    const t0 = S('n04') - 0.25, k = sm(t0, t0 + 2.6, t), th = th_(t);
    view(aim(420, 1330, 540, 900, 2.5 + 0.12 * k), null, () => {
      room(t, TE, { doorX: 660, poster: true });
      table(TE);
      dealSheet(t, 420, 1350, 0.6, 0.06, {});
      // the pen drifts between the two boxes and back, undecided (on twos)
      const sway = Math.sin(th * 2.2) * 0.5 + 0.5;
      yourHand(t, 430 + 40 * sway, 1300 + 40 * (1 - sway) + 12 * Math.sin(th * 5.3), -0.55, 46, 'pen');
    });
    ballot(t, -1, { drain: ramp(S('n04'), F('n04') + 1.0, t) });
  }
  // through the wall into his room: he's leaning back, hands behind his head, telling her
  function shotHis(t) {
    const t0 = S('f01') - 0.4, k = sm(t0, t0 + 0.65, t);
    const wx = lerp(-GUT - 10, W + 10, k);
    const th = th_(t);
    const talking = speaking(t, ['f01', 'f02']);
    view(aim(500, 900, 560, 980, 1.3), [0, 0, Math.max(0, wx), H], () => {
      room(t, PK, { doorX: 900 });
      officerB(t, { x: 210, y: 1010, s: 1.0, laugh: 0, pad: [360, 1240] });
      him(t, { x: 600, y: 840, s: 1.0, turn: -0.3, tilt: -0.07 + 0.02 * Math.sin(th * 1.6), mouth: talking ? 'talk' : 'grin', open: talking ? lips(t, ['f01', 'f02']) : 0.25, smile: 0.9, brow: 0.45, look: [-0.7, 0.05], behind: true, blink: blinkAt(t, [S('f01') - 0.25, F('f02') + 0.3]) });
      table(PK);
      dealSheet(t, 672, 1322, 0.5, 0.1, { scrawl: 1 });
    });
    if (k < 1) {
      view(aim(420, 1330, 540, 900, 2.62), [Math.min(W, wx + GUT), 0, W, H], () => { room(t, TE, { doorX: 660, poster: true }); table(TE); dealSheet(t, 420, 1350, 0.6, 0.06, {}); });
      wallCut(wx);
    }
  }
  function shotFace(t) {
    const k = sm(S('n05') - 0.2, F('n05') + 0.3, t);
    view(aim(600, 860, 540, 900, 1.9 + 0.12 * k), null, () => {
      room(t, PK, { doorX: 900 });
      him(t, { x: 600, y: 840, s: 1.0, turn: 0.15 * k, tilt: -0.04, mouth: 'grin', open: 0.1, smile: 1, brow: 0.15, look: [0.8, 0.0], behind: true, blink: blinkAt(t, [F('n05') + 0.05]) });
    });
  }
  // a year later: the gate opens on daylight and the two of you walk out, his arm round your shoulders
  function shotYear(t) {
    const t0 = S('n06') - 0.35, k = ramp(t0, t0 + 3.6, t);
    view({ s: 1, x: 0, y: 0 }, null, () => {
      dots([TE], rect(-100, 0, 1280, 1920), 0.52, [-100, 0, 1180, 1920]);
      const op = E.inOut(clamp(k * 2.4));
      erase(BOTH, rect(300, 420, 480, 1080));
      shape([TE], rect(300 - 240 * op, 420, 240, 1080), { tone: 0.72, bb: [0, 400, 600, 1520], ol: 8 });
      shape([TE], rect(540 + 240 * op, 420, 240, 1080), { tone: 0.72, bb: [480, 400, 1100, 1520], ol: 8 });
      line(BOTH, rect(300, 420, 480, 1080), 10);
      const walk = E.inOut(clamp((k - 0.15) / 0.85)), bob = Math.abs(Math.sin(th_(t) * 6.5)) * 9;
      const ss = 1.0 - walk * 0.35, yy = 1600 - walk * 260;
      const hx = 655 - walk * 40, ux = 435 - walk * 20;
      backHim(t, hx, yy - 330 * ss - bob, ss);
      you(t, { x: ux, y: yy - 300 * ss - bob * 0.7, s: ss, look: 0.35 });
      // his arm across your shoulders (below the hood): pink on teal prints dark, the first overprint since the split
      const ay = yy - 300 * ss - bob * 0.7 + 150 * ss;
      shape(BOTH, capsule(hx - 120 * ss, ay - 8 * ss, ux - 150 * ss, ay + 14 * ss, 30 * ss, 26 * ss), { tone: 1, ol: 0 });
      hand(BOTH, ux - 165 * ss, ay + 22 * ss, -1.45, 78 * ss, 'loose', { t, id: 'arm' });
    });
    stamp(t, S('n06') + 0.9, '1 YEAR', 540, 330, 86, { angle: -0.05 });
  }
  function backHim(t, x, y, s) {
    const R = 140 * s, [bx, by] = boil(t, 'bh', 1.2);
    each(BOTH, (g) => { g.save(); g.translate(bx, by); });
    try {
      const back = blob([[x - R * 1.85, y + R * 4.0], [x - R * 1.7, y + R * 1.4], [x - R * 0.6, y + R * 0.95], [x + R * 0.6, y + R * 0.95], [x + R * 1.7, y + R * 1.4], [x + R * 1.85, y + R * 4.0]]);
      shape([PK], back, { tone: 0, ol: 8 });
      stripes(back, [x - R * 2, y, x + R * 2, y + R * 4.1], R);
      const curls = []; for (let i = 0; i < 13; i++) { const a = TAU * i / 13; curls.push([x + Math.cos(a) * R * 0.62, y + Math.sin(a) * R * 0.66, R * 0.36]); }
      shape([PK], (g) => { g.beginPath(); for (const [cx, cy, rr] of curls) { g.moveTo(cx + rr, cy); g.arc(cx, cy, rr, 0, TAU); } g.moveTo(x + R * 0.7, y); g.arc(x, y, R * 0.7, 0, TAU); }, { tone: 1, ol: 0 });
    } finally { each(BOTH, (g) => g.restore()); }
  }
  // tonight: you walk out of the station alone
  function shotNight(t) {
    const t0 = S('n07') - 0.35, k = ramp(t0, Wt('n07', 7) + 0.1, t);
    view({ s: 1, x: 0, y: 0 }, null, () => {
      dots([TE], rect(-100, 0, 1280, 1920), 0.8, [-100, 0, 1180, 1920]);
      const cone = poly([[700, 400], [740, 400], [1000, 1640], [420, 1640]]);
      erase(BOTH, cone); dots([TE], cone, 0.1, [400, 390, 1010, 1650]);
      line([TE], polyOpen([[720, 0], [720, 380]]), 10);
      shape([TE], poly([[676, 360], [764, 360], [786, 404], [654, 404]]), { tone: 1, ol: 0 });
      shape([TE], rect(110, 640, 300, 880), { tone: 0.25, bb: [100, 630, 420, 1530], ol: 9 });
      erase(BOTH, rect(150, 700, 220, 300)); dots([PK], rect(150, 700, 220, 300), 0.3, [140, 690, 380, 1010]);
      line(BOTH, rect(150, 700, 220, 300), 6);
      const walk = E.inOut(k), bob = Math.abs(Math.sin(th_(t) * 5.8)) * 10;
      you(t, { x: 280 + walk * 360, y: 1210 - walk * 150 - bob, s: 1.0 - walk * 0.28, look: -0.25 });
    });
  }
  // his face behind ten bars, the grin gone
  function shotCell(t) {
    view({ s: 1, x: 0, y: 0 }, null, () => {
      dots([PK], rect(-100, 0, 1280, 1920), 0.6, [-100, 0, 1180, 1920]);
      occlude(rect(150, 470, 780, 860));
      dots([PK], rect(150, 470, 780, 860), 0.1, [150, 470, 930, 1330]);
      const k = sm(Wt('n07', 7), Wt('n07', 7) + 1.0, t);
      him(t, { x: 540, y: 880, s: 1.45, turn: 0, tilt: 0.03 * k, mouth: k > 0.5 ? 'sad' : 'flat', open: 0, brow: -0.1, sad: k, frown: 0, look: [0, 0.35 * k], blink: 0 });
      barsOver(t, [150, 470, 930, 1330], 10, -1);
      line(BOTH, rect(150, 470, 780, 860), 12);
    });
    stamp(t, S('n08') + 0.25, '10 YEARS', 540, 1440, 86, { angle: 0.05 });
  }
  // back in your room: your hand over TALK; then the officer slides your sheet across into his file
  function shotFile(t) {
    const sl = sm(S('n10') - 0.15, S('n10') + 0.5, t);
    view(aim(470, 1260, 540, 960, 1.6), null, () => {
      room(t, TE, { doorX: 660, poster: true });
      const PA = { x: 430, y: 880, s: 1.0, turn: 0.1, open: 0, brow: -0.1, frown: 0.6, look: [0.3, 0.6], arms: { l: [255, 1265, -0.9, 'fist'], r: [lerp(440, 585, sl), lerp(1330, 1292, sl), -0.25, 'flat'] } };
      officerA(t, { ...PA, part: 'body' });
      table(TE);
      // his file, open on the table at his right; your sheet goes in under his hand
      shape(BOTH, poly([[545, 1272], [705, 1265], [715, 1332], [541, 1340]]), { tone: 0.15, bb: [535, 1255, 720, 1345], ol: 6 });
      dealSheet(t, lerp(420, 628, sl), lerp(1350, 1302, sl), lerp(0.6, 0.36, sl), lerp(0.06, 0.02, sl), {});
      officerA(t, { ...PA, part: 'arms' });
      if (sl < 0.04) yourHand(t, 470, 1420, -0.3, 52, 'point', { pen: false });
    });
  }
  // the two rooms again, even: you and him on either side of the wall, both facing it
  function shotWall(t) {
    const k = sm(S('n11') - 0.3, F('n12') + 0.4, t), wx = 516, push = 1 + 0.05 * k, th = th_(t);
    view(aim(470, 880, wx / 2 + 40, 900, push), [0, 0, wx, H], () => {
      room(t, PK, { doorX: 900 });
      table(PK);
      him(t, { x: 560, y: 840 + Math.sin(th * 1.5) * 3, s: 1.0, turn: 1.0, mouth: 'flat', open: 0, brow: -0.05, look: [1, 0.05], blink: blinkAt(t, [S('n12') + 0.6]) });
    });
    view(aim(560, 900, (wx + GUT + W) / 2 - 30, 900, push), [wx + GUT, 0, W, H], () => {
      room(t, TE, { doorX: 660 });
      table(TE);
      you(t, { x: 640, y: 1240 + Math.sin(th * 1.7 + 1) * 3, s: 1.0, arms: true, look: -1 });
    });
    wallCut(wx);
  }
  // through the wall to his table: him sitting back, his deal sheet unsigned; the camera goes down to what he drew
  function shotDoodle(t) {
    const t0 = F('n12') + 0.15, k = sm(t0, t0 + 1.4, t), d = ramp(t0 + 0.6, t0 + 1.7, t);
    view(aim(lerp(560, 604, k), lerp(980, 1392, k), 540, 960, lerp(1.25, 3.7, k)), null, () => {
      room(t, PK, { doorX: 900 });
      him(t, { x: 600, y: 860, s: 1.0, turn: 0.2, tilt: -0.05, mouth: 'flat', smile: 0.6, open: 0, brow: 0.1, look: [0.2, 0.7], behind: true, blink: 0 });
      table(PK);
      dealSheet(t, 600, 1330, 0.6, -0.06, { doodle: d, scrawl: 0 });
    });
  }
  // the case file: the sheet goes into CASE 46; CASE 47 lands on top
  function shotCase(t) {
    const t0 = F('n15') + 0.1, k1 = sm(t0, t0 + 0.4, t), land = Wt('n16', 1) - 0.12, k2 = ramp(land - 0.22, land, t);
    view({ s: 1, x: 0, y: 0 }, null, () => {
      dots([PK], rect(-100, 0, 1280, 1920), 0.42, [-100, 0, 1180, 1920]);
      const cy = 1130, cx = 520;
      if (k1 < 1) { folder(t, cx, cy, -0.03, 'CASE 46', { s: 1.2 }); dealSheet(t, cx, lerp(760, cy - 40, k1), 1.1, -0.04, { doodle: 1 }); }
      folder(t, cx, cy, -0.03, 'CASE 46', { s: 1.2 });
      if (k2 > 0) folder(t, 575 + (1 - E.out(k2)) * 30, 690 - (1 - E.bounce(k2)) * 1100, 0.04, 'CASE 47', { s: 1.2, sub: 'THE VOICE' });
    });
  }

  // ------------------------------------------------------------------ the film: which shot is up
  function draw(t) {
    if (t < S('n04') - 0.25) shotSplit(t);
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
  const misAt = (t) => (t < 0.5 / 30 ? 0 : t < 0.22 ? 2 + 9 * (1 - t / 0.22) : 2);

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
