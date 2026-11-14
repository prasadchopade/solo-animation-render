// Reel 38 · Draw Him: the paper, the pencil and the drawing. All new for this reel.
// The sheet lies in a plane (x right, y down the page, z up off it; the units are the face rig's, so a drawn face is the size of a
// rig face). A camera can sit anywhere over it: straight down, at the artist's shoulder, or a finger's height behind the pencil's
// tip. The drawing is a list of strokes, each a polyline with a start and an end time; a frame draws each stroke as far as it has
// got, so any frame can be painted in any order. The pencil's tip is wherever the stroke being drawn has reached.
window.PEN = (() => {
  const { clamp, lerp, mulberry32 } = C;
  const { lg, rg, ell, R, sstep } = window.R36;
  const TAU = Math.PI * 2, NEAR = 24;

  // ------------------------------------------------------------------ the camera over the paper
  // o: { tx, ty (the point on the sheet it looks at), d (how far away), az (which way round: 0 looks up the page), el (how high: π/2 is
  // straight down), roll, f (px), cx, cy (where that point lands on screen) }
  function cam(o) {
    const { tx = 0, ty = 0, d = 2600, az = 0, el = Math.PI / 2, roll = 0, f = 1500, cx = 540, cy = 960 } = o;
    const ce = Math.cos(el), se = Math.sin(el), sa = Math.sin(az), ca = Math.cos(az);
    const E = [tx + d * ce * sa, ty + d * ce * ca, d * se], F = [-ce * sa, -ce * ca, -se], Rv = [ca, -sa, 0];
    const D = [Rv[1] * F[2] - Rv[2] * F[1], Rv[2] * F[0] - Rv[0] * F[2], Rv[0] * F[1] - Rv[1] * F[0]];
    const cr = Math.cos(roll), sr = Math.sin(roll);
    const toCam = (x, y, z = 0) => { const qx = x - E[0], qy = y - E[1], qz = z - E[2]; return [qx * Rv[0] + qy * Rv[1] + qz * Rv[2], qx * D[0] + qy * D[1] + qz * D[2], qx * F[0] + qy * F[1] + qz * F[2]]; };
    const scr = (q) => { const s = f / q[2], xc = q[0] * s, yc = q[1] * s; return [cx + xc * cr - yc * sr, cy + xc * sr + yc * cr, s, q[2]]; };
    const P = (x, y, z = 0) => { const q = toCam(x, y, z); return q[2] < NEAR ? null : scr(q); };
    return { P, toCam, scr, eye: E, o };
  }
  const mixCam = (a, b, u) => { const o = {}; for (const k of ['tx', 'ty', 'd', 'az', 'el', 'roll', 'f', 'cx', 'cy']) o[k] = lerp(a[k] ?? CAM0[k], b[k] ?? CAM0[k], u); return o; };
  const CAM0 = { tx: 0, ty: 0, d: 2600, az: 0, el: Math.PI / 2, roll: 0, f: 1500, cx: 540, cy: 960 };
  // draw in sheet coordinates near (x, y): the camera's view there, flattened to an affine map (exact when it looks straight down)
  function affine(g, c, x, y, fn) {
    const p0 = c.P(x, y), px = c.P(x + 40, y), py = c.P(x, y + 40); if (!p0 || !px || !py) return;
    g.save(); g.transform((px[0] - p0[0]) / 40, (px[1] - p0[1]) / 40, (py[0] - p0[0]) / 40, (py[1] - p0[1]) / 40, p0[0], p0[1]); fn(p0[2]); g.restore();
  }
  function poly(g, c, pts, z = 0) {
    const cs = pts.map((p) => c.toCam(p[0], p[1], p[2] ?? z)), out = [];
    for (let i = 0; i < cs.length; i++) { const a = cs[i], b = cs[(i + 1) % cs.length], ia = a[2] >= NEAR, ib = b[2] >= NEAR; if (ia) out.push(a); if (ia !== ib) { const u = (NEAR - a[2]) / (b[2] - a[2]); out.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u), NEAR]); } }
    if (out.length < 3) return false;
    g.beginPath(); out.forEach((q, i) => { const p = c.scr(q); if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.closePath(); return true;
  }

  // ------------------------------------------------------------------ polylines
  const bez = (p0, c1, c2, p3, n = 14) => { const out = []; for (let i = 0; i <= n; i++) { const u = i / n, v = 1 - u; out.push([v * v * v * p0[0] + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u * u * u * p3[0], v * v * v * p0[1] + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u * u * u * p3[1]]); } return out; };
  const quad = (p0, c, p1, n = 12) => { const out = []; for (let i = 0; i <= n; i++) { const u = i / n, v = 1 - u; out.push([v * v * p0[0] + 2 * v * u * c[0] + u * u * p1[0], v * v * p0[1] + 2 * v * u * c[1] + u * u * p1[1]]); } return out; };
  const arc = (cx, cy, rx, ry, a0, a1, n = 20, rot = 0) => { const out = [], cr = Math.cos(rot), sr = Math.sin(rot); for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n), x = rx * Math.cos(a), y = ry * Math.sin(a); out.push([cx + x * cr - y * sr, cy + x * sr + y * cr]); } return out; };
  const join = (...parts) => { const out = []; for (const p of parts) for (let i = 0; i < p.length; i++) { if (out.length && i === 0 && Math.hypot(p[0][0] - out[out.length - 1][0], p[0][1] - out[out.length - 1][1]) < 0.01) continue; out.push(p[i]); } return out; };
  const inside = (pt, pg) => { let c = false; for (let i = 0, j = pg.length - 1; i < pg.length; j = i++) { const a = pg[i], b = pg[j]; if ((a[1] > pt[1]) !== (b[1] > pt[1]) && pt[0] < (b[0] - a[0]) * (pt[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  // hatching: parallel lines at `ang`, `gap` apart, kept where they run inside the polygon; each line bows a little, like a wrist's
  function hatch(pg, ang, gap, seed = 1, inset = 0) {
    const r = mulberry32(seed), ca = Math.cos(ang), sa = Math.sin(ang), out = [];
    let lo = 1e9, hi = -1e9, u0 = 1e9, u1 = -1e9;
    for (const p of pg) { const v = -p[0] * sa + p[1] * ca, u = p[0] * ca + p[1] * sa; lo = Math.min(lo, v); hi = Math.max(hi, v); u0 = Math.min(u0, u); u1 = Math.max(u1, u); }
    for (let v = lo + gap * 0.5; v < hi; v += gap * (0.8 + 0.4 * r())) {
      let a = null, b = null;
      for (let u = u0; u <= u1; u += 4) { const p = [u * ca - v * sa, u * sa + v * ca]; if (inside(p, pg)) { if (a === null) a = u; b = u; } }
      if (a === null || b - a < 12) continue;
      a += inset + 6 * r(); b -= inset + 6 * r(); if (b - a < 8) continue;
      const bow = (r() - 0.5) * 8, n = Math.max(3, Math.round((b - a) / 16)), pts = [];
      for (let i = 0; i <= n; i++) { const w = i / n, u = lerp(a, b, w), vv = v + bow * Math.sin(w * Math.PI); pts.push([u * ca - vv * sa, u * sa + vv * ca]); }
      out.push(out.length % 2 ? pts.reverse() : pts);        // back and forth, as a hand hatches
    }
    return out;
  }

  // ------------------------------------------------------------------ a face as pencil lines: the rig's own shapes (head() at yaw 0), so a
  // drawing made from a look lies exactly over the man drawn from the same look
  function faceLines(L) {
    const hw = 186 * L.jaw, ck = L.chinK || 1, chin = 232 * ck, hh = hw + 6, ey = -28, ex = 80, ek = L.earK || 1, nw = L.noseW || 1, my = 118;
    const S = {};
    S.jaw = join([[-hw + 1, -112], [-hw, -40]], bez([-hw, -40], [-hw - 4, 58], [-152, 150 * ck], [-88, 205 * ck], 16), bez([-88, 205 * ck], [-60, chin - 4], [-28, chin], [0, chin], 8),
      bez([0, chin], [28, chin], [60, chin - 4], [88, 205 * ck], 8), bez([88, 205 * ck], [152, 150 * ck], [hw + 4, 58], [hw, -40], 16), [[hw, -40], [hw - 1, -112]]);
    S.outline = join(S.jaw, bez([hw, -40], [hw + 4, -216], [100, -266], [0, -266], 14), bez([0, -266], [-100, -266], [-hw - 4, -216], [-hw, -40], 14));
    S.ears = [-1, 1].map((k) => arc(k * (hw + 1), -18, 25 * ek, 42 * ek, k > 0 ? -1.35 : Math.PI + 1.35, k > 0 ? 1.35 : Math.PI - 1.35, 12, k * 0.08));
    const tilt = L.browTilt;
    S.brows = [-1, 1].map((k) => quad([k * ex - k * 48, ey - 40 + tilt], [k * ex + k * 6, ey - 60], [k * ex + k * 54, ey - 40 - tilt * 0.3], 10));
    const w = L.ew, h = L.eh, up = h * 1.75, dn = h * 1.05;
    S.lidsUp = [-1, 1].map((k) => quad([k * ex - w, ey + 3], [k * ex - k * 6, ey - up], [k * ex + w, ey + 3], 12));
    S.lidsDn = [-1, 1].map((k) => quad([k * ex + w * 0.82, ey + 4], [k * ex + k * 6, ey + dn], [k * ex - w * 0.82, ey + 4], 10));
    S.iris = [-1, 1].map((k) => arc(k * ex, ey - 3, 17, 17, -0.4, TAU - 0.2, 18));
    S.pupil = [-1, 1].map((k) => { const out = []; for (let i = 0; i <= 26; i++) { const a = i * 0.85, r = 9 * (1 - i / 30); out.push([k * ex + r * Math.cos(a), ey - 3 + r * Math.sin(a)]); } return out; });
    S.nose = [quad([-22 * nw, 26], [-31 * nw, 44], [-25 * nw, 54], 6), quad([22 * nw, 26], [31 * nw, 44], [25 * nw, 54], 6), arc(-13 * nw, 53, 8 * nw, 4.6, 0, TAU, 8, -0.25), arc(13 * nw, 53, 8 * nw, 4.6, 0, TAU, 8, 0.25),
      quad([-25 * nw, 56], [0, 66], [25 * nw, 56], 6), quad([-9, -6], [-15, 16], [-12, 34], 5)];
    S.mouth = [quad([-44, my], [0, my + 3], [44, my], 8), quad([-22, my + 20], [0, my + 26], [22, my + 20], 5)];
    if (L.must) {
      const big = L.must === 'thick', mid = L.must === 'mid', th = big ? 24 : mid ? 18 : 13, mw = big ? 64 : mid ? 58 : 52, e = my - 10 + (big ? 4 : 0);
      S.must = join(bez([0, 74], [-18, 66], [-mw * 0.72, 70], [-mw, e], 8), bez([-mw, e], [-mw * 0.7, 74 + th], [-24, 76 + th], [0, 84 + th * 0.3], 8), bez([0, 84 + th * 0.3], [24, 76 + th], [mw * 0.7, 74 + th], [mw, e], 8), bez([mw, e], [mw * 0.72, 70], [18, 66], [0, 74], 8));
      S.mustFill = hatch(S.must, 1.25, 5.5, 31, 1);
    }
    if (L.mole) { const out = []; for (let i = 0; i <= 44; i++) { const a = i * 0.7, r = (L.moleR ?? 9.5) * (1 - 0.92 * i / 44); out.push([L.mole[0] + r * Math.cos(a), L.mole[1] + r * 0.95 * Math.sin(a)]); } S.mole = out; }
    S.crown = join(bez([-hh - 2, -122], [-hh - 8, -280], [-90, -318], [0, -318], 16), bez([0, -318], [90, -318], [hh + 8, -280], [hh + 2, -122], 16));
    S.crownPg = join(S.crown, quad([hh + 2, -122], [0, -158], [-hh - 2, -122], 12));
    S.brim = join(quad([-hh + 6, -128], [0, -170], [hh - 6, -128], 12), quad([hh - 6, -128], [hh + 6, -108], [hh - 40, -92], 5), quad([hh - 40, -92], [0, -116], [-hh + 40, -92], 12), quad([-hh + 40, -92], [-hh - 6, -108], [-hh + 6, -128], 5));
    S.seam = quad([0, -318], [-12, -220], [0, -150], 8);
    S.capFill = hatch(S.crownPg, -0.9, 13, 77, 3);
    S.brimFill = hatch(S.brim, 0.2, 6, 78, 2);
    S.neck = [[[-70, chin - 30], [-74, 268], [-80, 300]], [[70, chin - 30], [74, 268], [80, 300]]];
    S.shoulders = [bez([-84, 262], [-200, 290], [-300, 330], [-330, 440], 10), bez([84, 262], [200, 290], [300, 330], [330, 440], 10), quad([-80, 300], [0, 372], [80, 300], 8)];
    // the shadow side (the light is at the upper left): the right cheek and jaw, under the nose and the brim
    const shadePg = join(bez([hw - 4, -60], [hw, 58], [150, 150 * ck], [88, 203 * ck], 10), [[60, 190 * ck], [96, 120], [112, 20], [118, -60]]);
    S.shade = hatch(shadePg, -1.05, 11, 53, 2);
    S.shade2 = hatch([[-hw + 14, -92], [hw - 14, -92], [hw - 10, -74], [-hw + 10, -74]], -1.0, 9, 54, 2);
    S.neckShade = hatch([[-62, chin - 4], [62, chin - 4], [70, 250], [20, 262], [-30, chin + 30]], -1.0, 12, 55, 2);
    return S;
  }

  // ------------------------------------------------------------------ strokes
  // { p: [[x, y]…], t0, t1, w (width, sheet units), a (darkness), col: 'g' graphite | 'm' maroon | 'r' red, out: [t, t] (rubbed out), seed }
  const COL = { g: [38, 38, 44], m: [128, 30, 48], r: [214, 40, 30] };
  function prep(s) {
    let L = 0; const len = [0]; for (let i = 1; i < s.p.length; i++) { L += Math.hypot(s.p[i][0] - s.p[i - 1][0], s.p[i][1] - s.p[i - 1][1]); len.push(L); }
    s.len = len; s.L = L || 1; const r = mulberry32(s.seed || 7);
    s.jit = s.p.map(() => [(r() - 0.5) * 2.6, (r() - 0.5) * 2.6]);
    return s;
  }
  const ease = (u) => u * u * (3 - 2 * u) * 0.6 + u * 0.4;
  const drawn = (s, t) => (t <= s.t0 ? 0 : t >= s.t1 ? 1 : ease((t - s.t0) / (s.t1 - s.t0)));
  function pointAt(s, u) {
    const d = u * s.L; let i = 1; while (i < s.len.length - 1 && s.len[i] < d) i++;
    const a = s.p[i - 1], b = s.p[i], k = clamp((d - s.len[i - 1]) / Math.max(1e-6, s.len[i] - s.len[i - 1]));
    return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), i, k];
  }
  function strokes(g, c, list, t, o = {}) {
    const mir = o.mirror ? -1 : 1, kA = o.a ?? 1;
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    for (const s of list) {
      if (t <= s.t0) continue;
      const u = drawn(s, t), gone = s.out ? sstep(s.out[0], s.out[1], t) : 0; if (gone > 0.995) continue;
      const end = pointAt(s, u), rgb = o.col || COL[s.col || 'g'], al = (s.a ?? 0.8) * (1 - gone) * kA;
      const run = (jk, wk, ak) => {
        g.beginPath(); let sc = 1, n = 0;
        for (let i = 0; i < end[2]; i++) { const p = c.P(mir * (s.p[i][0] + s.jit[i][0] * jk), s.p[i][1] + s.jit[i][1] * jk); if (!p) continue; if (n++) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); sc = p[2]; }
        const q = c.P(mir * end[0], end[1]); if (q) { if (n++) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); sc = q[2]; }
        if (n < 2) return;
        g.lineWidth = Math.max(0.7, (s.w || 5) * wk * sc); g.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${al * ak})`; g.stroke();
      };
      run(0, 1, 0.62); run(1, 0.5, 0.75);
    }
    g.restore();
  }
  // where the tip is: on the stroke being drawn; between strokes it lifts and travels. moves: extra keys [t, x, y, z] (a hover, a wait)
  function tipAt(list, t, moves = []) {
    const keys = [];
    for (const s of list) { if (s.noTip) continue; keys.push([s.t0, s.p[0][0], s.p[0][1], 0, s]); keys.push([s.t1, s.p[s.p.length - 1][0], s.p[s.p.length - 1][1], 0, null]); }
    for (const m of moves) keys.push([m[0], m[1], m[2], m[3] ?? 30, null]);
    keys.sort((a, b) => a[0] - b[0]);
    if (!keys.length) return [0, 0, 60, false];
    if (t <= keys[0][0]) return [keys[0][1], keys[0][2], 40, false];
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i], b = keys[i + 1]; if (t > b[0]) continue;
      if (a[4] && t <= a[4].t1) { const p = pointAt(a[4], drawn(a[4], t)); return [p[0], p[1], 0, true]; }
      const u = sstep(a[0], b[0], t), dist = Math.hypot(b[1] - a[1], b[2] - a[2]), hop = Math.min(46, 8 + dist * 0.16) * Math.sin(Math.PI * u);
      return [lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u) + hop, false];
    }
    const k = keys[keys.length - 1]; return [k[1], k[2], k[3], false];
  }

  // ------------------------------------------------------------------ the sheet
  const SHEET = { x0: -390, x1: 390, y0: -520, y1: 540 };
  const FLECK = (() => { const r = mulberry32(3811), out = []; for (let i = 0; i < 260; i++) out.push([lerp(SHEET.x0, SHEET.x1, r()), lerp(SHEET.y0, SHEET.y1, r()), r() * TAU, 3 + r() * 8, r()]); return out; })();
  function sheet(g, c, o = {}) {
    const S = SHEET, cs = [[S.x0, S.y0], [S.x1, S.y0], [S.x1, S.y1], [S.x0, S.y1]], lift = o.lift ?? 0;
    if (o.shadow !== false && poly(g, c, cs.map((p) => [p[0] + 14 + lift * 0.5, p[1] + 18 + lift * 0.4]))) { g.fillStyle = `rgba(40,28,18,${0.26 / (1 + lift * 0.01)})`; g.fill(); }
    if (!poly(g, c, cs, lift)) return;
    const a = c.P(S.x0, S.y0, lift) || [0, 0], b = c.P(S.x1, S.y1, lift) || [1080, 1920];
    g.fillStyle = lg(g, a[0], a[1], b[0], b[1], [0, '#fffaf0'], [0.6, '#f8f1e2'], [1, '#efe5d2']); g.fill();
    if (o.flecks !== false) {
      g.save(); poly(g, c, cs, lift); g.clip(); g.lineCap = 'round';
      for (const f of FLECK) { const p = c.P(f[0], f[1], lift), q = c.P(f[0] + Math.cos(f[2]) * f[3], f[1] + Math.sin(f[2]) * f[3], lift); if (!p || !q) continue; g.strokeStyle = f[4] > 0.5 ? 'rgba(150,130,100,0.20)' : 'rgba(255,255,255,0.55)'; g.lineWidth = Math.max(0.6, 1.5 * p[2]); g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); }
      g.restore();
    }
  }

  // ------------------------------------------------------------------ the pencil: a hexagonal barrel, a sharpened cone, a brass ferrule and a rubber
  // tip: [x, y, z] where it touches (or hangs over) the sheet; dir: a unit vector from there up the barrel. o.flip: rubber end down.
  const LIGHT = [0.5, 0.34];                                   // where a shadow falls, per unit of height
  const BODY = { g: ['#f6cf45', '#e0aa1e', '#b9820c'], m: ['#b23a4f', '#8d2338', '#681526'], r: ['#f0584a', '#d2382c', '#a8261c'] };
  function pencil(g, c, tip, dir, o = {}) {
    const Lb = o.len || 800, r = o.r || 17, flip = !!o.flip, cols = BODY[o.col || 'g'], lead = o.col === 'm' ? '#7a1c30' : o.col === 'r' ? '#c22a1e' : '#2b2b30';
    const at = (d, sh) => { const x = tip[0] + dir[0] * d, y = tip[1] + dir[1] * d, z = tip[2] + dir[2] * d; return sh ? c.P(x + z * LIGHT[0], y + z * LIGHT[1], 0) : c.P(x, y, z); };
    const m = (d) => (flip ? Lb - d : d);                     // distance from the sharp end → from the end that's down
    const seg = (d0, d1, k0, k1, fill, sh, wk = 1) => {
      const A = at(m(d0), sh), B = at(m(d1), sh); if (!A || !B) return;
      const dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, ra = r * A[2] * wk, rb = r * B[2] * wk;
      g.beginPath(); g.moveTo(A[0] + nx * ra * k0[0], A[1] + ny * ra * k0[0]); g.lineTo(A[0] + nx * ra * k0[1], A[1] + ny * ra * k0[1]); g.lineTo(B[0] + nx * rb * k1[1], B[1] + ny * rb * k1[1]); g.lineTo(B[0] + nx * rb * k1[0], B[1] + ny * rb * k1[0]); g.closePath(); g.fillStyle = fill; g.fill();
    };
    if (o.shadow !== false) { seg(0, Lb, [-1, 1], [-1, 1], 'rgba(46,32,20,0.20)', true, 1.5); seg(0, Lb, [-1, 1], [-1, 1], 'rgba(46,32,20,0.16)', true, 0.9); }
    const full = [-1, 1], cone = 78;
    seg(cone, Lb * 0.9, [-1, -0.34], [-1, -0.34], cols[0]); seg(cone, Lb * 0.9, [-0.34, 0.4], [-0.34, 0.4], cols[1]); seg(cone, Lb * 0.9, [0.4, 1], [0.4, 1], cols[2]);
    seg(Lb * 0.9, Lb * 0.955, full, full, '#c9b27a'); seg(Lb * 0.9, Lb * 0.955, [-1, -0.3], [-1, -0.3], '#efe0ae'); seg(Lb * 0.925, Lb * 0.934, full, full, 'rgba(60,40,10,0.35)');
    seg(Lb * 0.955, Lb, full, [-0.82, 0.82], '#e9879a'); seg(Lb * 0.955, Lb, [-1, -0.3], [-0.82, -0.25], '#f6aebc');
    seg(22, cone, [-0.3, 0.3], full, '#e8c79a'); seg(22, cone, [-0.3, -0.05], [-1, -0.34], '#f6dfba');
    seg(0, 24, [-0.02, 0.02], [-0.32, 0.32], lead);
  }
  // the hand that holds it, in two layers: 'back' goes under the pencil (the forearm, the palm, the fingers behind), 'front' over it (the
  // index finger and the thumb). G: the grip on screen, ang: the barrel's angle on screen, s: px per unit, elbow: where the forearm comes from
  function hand(g, layer, G, ang, s, elbow, o = {}) {
    const skin = o.skin || ['#d2a17c', '#bd8a64', '#946243'], sleeve = o.sleeve || ['#c2ab72', '#94804e'], side = o.side ?? 1, k = s * (o.k ?? 1.45);
    g.save(); g.translate(G[0], G[1]); g.rotate(ang); g.scale(k, k * side);
    const cap = (x0, y0, x1, y1, w, fill) => { g.strokeStyle = fill; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
    const sk = lg(g, -60, -40, 120, 160, [0, skin[0]], [0.5, skin[1]], [1, skin[2]]);
    if (layer === 'back') {
      // the forearm, towards the elbow (given on screen): bring it into this frame
      const ex = elbow[0] - G[0], ey = elbow[1] - G[1], ca = Math.cos(-ang), sa = Math.sin(-ang), lx = (ex * ca - ey * sa) / k, ly = (ex * sa + ey * ca) / (k * side);
      const wx = 150, wy = 96, dl = Math.hypot(lx - wx, ly - wy) || 1, ux = (lx - wx) / dl, uy = (ly - wy) / dl;
      cap(wx, wy, lx, ly, 118, skin[1]); cap(wx + ux * 40, wy + uy * 40 - 20, lx, ly - 20, 44, 'rgba(255,236,214,0.18)');
      if (o.cuff !== false && dl > 300) { const cl = Math.max(250, dl * 0.72); cap(wx + ux * cl, wy + uy * cl, lx, ly, 132, sleeve[0]); cap(wx + ux * cl, wy + uy * cl, wx + ux * (cl + 20), wy + uy * (cl + 20), 138, sleeve[1]); }
      g.fillStyle = sk; ell(g, 92, 74, 112, 80, 0.5); g.fill();
      cap(96, 58, -26, 34, 40, skin[2]); cap(112, 88, -4, 62, 38, skin[2]);          // the fingers curled under
      g.fillStyle = 'rgba(80,40,20,0.14)'; ell(g, 60, 70, 70, 26, 0.3); g.fill();
    } else {
      cap(108, -6, -36, 8, 40, skin[1]); cap(96, -14, -30, 0, 14, 'rgba(255,236,214,0.30)');      // the index finger along the barrel
      g.fillStyle = 'rgba(255,240,226,0.5)'; ell(g, -40, 6, 11, 13, 0.1); g.fill();
      cap(78, 66, -18, 30, 42, skin[1]); cap(70, 58, -10, 26, 12, 'rgba(255,236,214,0.24)');      // the thumb across it
      g.fillStyle = 'rgba(255,240,226,0.45)'; ell(g, -20, 30, 12, 13, 0.4); g.fill();
      g.strokeStyle = 'rgba(90,45,25,0.25)'; g.lineWidth = 4; g.beginPath(); g.moveTo(40, -24); g.quadraticCurveTo(52, -8, 46, 10); g.stroke();
    }
    g.restore();
  }
  // the pencil in a hand, in one call. Returns the grip on screen.
  function held(g, c, tip, dir, elbow, o = {}) {
    const gd = o.grip ?? 215, A = c.P(tip[0], tip[1], tip[2]), Gp = c.P(tip[0] + dir[0] * gd, tip[1] + dir[1] * gd, tip[2] + dir[2] * gd), E = c.P(tip[0] + dir[0] * 700, tip[1] + dir[1] * 700, tip[2] + dir[2] * 700);
    if (!A || !Gp || !E) return null;
    const ang = Math.atan2(E[1] - A[1], E[0] - A[0]), s = Gp[2];
    g.save(); g.globalAlpha *= o.a ?? 1;
    if (o.hand !== false) hand(g, 'back', Gp, ang, s, elbow, o);
    pencil(g, c, tip, dir, o);
    if (o.hand !== false) hand(g, 'front', Gp, ang, s, elbow, o);
    g.restore();
    return Gp;
  }
  // graphite dust and rubber crumbs: specks that lie on the sheet
  function specks(g, c, list, col) { for (const [x, y, r, a, z] of list) { const p = c.P(x, y, z || 0); if (!p || a <= 0.01) continue; g.fillStyle = col(a); ell(g, p[0], p[1], Math.max(0.6, r * p[2]), Math.max(0.5, r * p[2] * 0.7)); g.fill(); } }

  return { cam, mixCam, CAM0, affine, poly, bez, quad, arc, join, hatch, faceLines, prep, strokes, tipAt, pointAt, drawn, SHEET, sheet, pencil, hand, held, specks, COL, LIGHT, inside };
})();
