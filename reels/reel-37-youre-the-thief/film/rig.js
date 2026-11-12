// Reel 37 · You're the Thief: the rig (this reel's own; nothing here is shared with other reels).
// A camera that can look anywhere, a body that walks and can be drawn from any side, and a head that turns all the way round.
// The walk is built, not keyed: each foot is planted and stays put while the pelvis rides over it, the swing foot is carried
// to the next plant, the hips sit as high as the legs allow, and the knees solve themselves. A walker's STYLE is a handful of
// numbers (stride, cadence, whether the feet roll or lift, how much the hips, chest and arms join in): the four men in the
// film differ in nothing else. The same joints with the body left out are the lab's point-light walkers.
// Units are metres. Every function is a pure function of its arguments (the render contract): nothing is kept between frames.
(() => {
  const C = window.C, { clamp, lerp } = C;
  const TAU = Math.PI * 2, PI = Math.PI, NEAR = 0.12;
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const frac = (x) => x - Math.floor(x);
  const wrap = (a) => { a = (a + PI) % TAU; if (a < 0) a += TAU; return a - PI; };
  const smin = (a, b, k = 45) => -Math.log(Math.exp(-k * a) + Math.exp(-k * b)) / k;
  const hexRGB = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const MIXC = new Map();
  const mix = (a, b, k) => {                         // two #rrggbb colours, k of the way from a to b (memoised: the same tones are asked for every frame)
    k = Math.round(clamp(k) * 50) / 50; const key = a + b + k; let v = MIXC.get(key);
    if (!v) { const A = hexRGB(a), B = hexRGB(b); v = '#' + A.map((x, i) => Math.round(lerp(x, B[i], k)).toString(16).padStart(2, '0')).join(''); MIXC.set(key, v); }
    return v;
  };
  const rgba = (c, a) => { const [r, g, b] = hexRGB(c); return `rgba(${r},${g},${b},${a.toFixed(3)})`; };
  const ellW = (w, d, psi) => Math.hypot(w * Math.cos(psi), d * Math.sin(psi));   // the half-width of an elliptic cylinder (w across, d deep) turned psi away from you

  // ------------------------------------------------------------------ the camera
  // c: { x, y, z, yaw (0 looks along +Z, + turns towards +X), pitch (+ up), roll, f (px), cx, cy }. P(X,Y,Z) → [sx, sy, px per metre, depth].
  function camera(c) {
    const yaw = c.yaw || 0, pitch = c.pitch || 0, roll = c.roll || 0;
    const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
    const f = c.f, cx = c.cx ?? 540, cy = c.cy ?? 960;
    const dirCam = (dx, dy, dz) => { const x1 = dx * cyw - dz * syw, z1 = dx * syw + dz * cyw; return [x1, dy * cp - z1 * sp, dy * sp + z1 * cp]; };
    const toCam = (X, Y, Z) => dirCam(X - c.x, Y - c.y, Z - c.z);
    const scr = (q) => { const s = f / q[2]; let px = q[0] * s, py = -q[1] * s; if (sr) { const a = px * cr - py * sr; py = px * sr + py * cr; px = a; } return [cx + px, cy + py, s, q[2]]; };
    const P = (X, Y, Z) => { const q = toCam(X, Y, Z); return q[2] < NEAR ? null : scr(q); };
    return { x: c.x, y: c.y, z: c.z, yaw, pitch, roll, f, cx, cy, dirCam, toCam, scr, P };
  }
  function clipNear(pts) {                           // camera-space points → the part in front of the near plane
    const out = [], n = pts.length;
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n], ain = a[2] >= NEAR, bin = b[2] >= NEAR;
      if (ain) out.push(a);
      if (ain !== bin) { const u = (NEAR - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, NEAR]); }
    }
    return out;
  }
  function poly3(g, cam, pts, fill) {                // a flat polygon in the world (points [X, Y, Z]); returns false if none of it is in front of you
    const q = clipNear(pts.map((p) => cam.toCam(p[0], p[1], p[2]))); if (q.length < 3) return false;
    g.beginPath(); for (let i = 0; i < q.length; i++) { const s = cam.scr(q[i]); if (i) g.lineTo(s[0], s[1]); else g.moveTo(s[0], s[1]); } g.closePath();
    if (fill) { g.fillStyle = fill; g.fill(); }
    return true;
  }
  function line3(g, cam, a, b) {                     // a line in the world, clipped at the near plane; the caller strokes
    let p = cam.toCam(a[0], a[1], a[2]), q = cam.toCam(b[0], b[1], b[2]);
    if (p[2] < NEAR && q[2] < NEAR) return false;
    if (p[2] < NEAR) { const u = (NEAR - p[2]) / (q[2] - p[2]); p = [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u, NEAR]; }
    if (q[2] < NEAR) { const u = (NEAR - q[2]) / (p[2] - q[2]); q = [q[0] + (p[0] - q[0]) * u, q[1] + (p[1] - q[1]) * u, NEAR]; }
    const s0 = cam.scr(p), s1 = cam.scr(q); g.moveTo(s0[0], s0[1]); g.lineTo(s1[0], s1[1]);
    return [s0, s1];
  }

  // ------------------------------------------------------------------ the walk
  // A style. stride: metres for two steps; cad: strides a second; duty: the share of a stride each foot spends on the ground;
  // roll: 1 the foot lands on its heel and rolls off its toes ("swung"), 0 it's lifted and put down flat ("lifted");
  // stepH: how high the swing foot is carried; pelYaw/pelRoll/sway/chestYaw: how much the trunk joins in; arm: the swing.
  const STYLE0 = { stride: 1.25, cad: 0.95, duty: 0.62, roll: 1, heelOff: 0.4, toeK: 1, stepH: 0.05, stepW: 0.075, hipMax: 0.852, legExt: 0.992, sink: 0, dip: 0, dipPh: 0.06,
    pelYaw: 0.10, pelRoll: 0.05, sway: 0.022, surge: 0.008, chestYaw: 0.12, lean: 0.05, leanOsc: 0.01, arm: 0.42, armBias: 0.02, armLag: 0.04, ab: 0.10, elbow: 0.22, elbowDyn: 0.38, elbowIn: 0.10,
    headPitch: 0, nod: 0.012, headFwd: 0.015, headStab: 0.8, slump: 0, shrug: 0, ph0: 0, toeOut: 0.02 };
  const style = (o) => ({ ...STYLE0, ...o });
  const BODY = { thigh: 0.415, shin: 0.395, hipW: 0.085, spine: 0.45, shW: 0.168, neck: 0.06, uarm: 0.26, farm: 0.235 };
  const rot2 = (a, b, th) => [a * Math.cos(th) - b * Math.sin(th), a * Math.sin(th) + b * Math.cos(th)];
  // One foot at its own phase q (0 = it lands): the ankle [forward, up] relative to the pelvis' place on the path, and the
  // foot's pitch (+ toes up). On the ground the foot pivots on its heel, lies flat, then pivots on its toes; in the air it's
  // carried from where it left the ground to where it lands, a whole stride further on, so on the ground it never slides.
  function footAt(S, q) {
    const B = S.duty, st = S.stride, hs = S.roll * 0.40, to = lerp(0.2, 1.0, S.roll) * S.toeK;
    const pivot = (xr, th) => (th >= 0 ? [xr - 0.06 + 0.06 * Math.cos(th) - 0.07 * Math.sin(th), 0.06 * Math.sin(th) + 0.07 * Math.cos(th)]
      : [xr + 0.13 - 0.13 * Math.cos(th) - 0.07 * Math.sin(th), -0.13 * Math.sin(th) + 0.07 * Math.cos(th)]);
    if (q < B) {
      const xr = st * (B / 2 - q), q1 = 0.17 * B, q2 = B * (1 - S.heelOff);
      const th = q < q1 ? hs * (1 - sstep(0, q1, q)) : q > q2 ? -to * sstep(q2, B, q) ** 1.3 : 0;
      const a = pivot(xr, th);
      return [a[0], a[1], th];
    }
    const u = (q - B) / (1 - B), a0 = pivot(-st * B / 2, -to), a1 = pivot(st * B / 2, hs);
    const E = u * u * u * (u * (u * 6 - 15) + 10);                      // it leaves and arrives with no speed over the ground
    const lift = Math.sin(PI * Math.pow(u, 0.8)) ** (S.roll > 0.5 ? 1.0 : 0.8);
    return [a0[0] + (st * (1 - B) + a1[0] - a0[0]) * E - st * (1 - B) * u, lerp(a0[1], a1[1], sstep(0, 1, u)) + S.stepH * lift, lerp(-to, hs, sstep(0.08, 0.84, u))];
  }
  // The whole body at gait time tg, in the walker's own frame [forward, up, left], the pelvis' place on the path at the origin.
  // o.walk (0–1) scales the gait down to standing; o.arms: { l|r: { wrist: [f,u,l] from the chest, pole: [f,u,l], w } } overrides an arm.
  function skel(S0, tg, o = {}) {
    const wk = o.walk ?? 1;
    const S = wk >= 0.999 ? S0 : { ...S0, stride: S0.stride * wk, stepH: S0.stepH * wk, roll: S0.roll * wk, pelYaw: S0.pelYaw * wk, pelRoll: S0.pelRoll * wk, sway: S0.sway * wk, chestYaw: S0.chestYaw * wk, arm: S0.arm * wk, dip: S0.dip * wk, surge: S0.surge * wk, leanOsc: S0.leanOsc * wk, nod: S0.nod * wk, lean: lerp(S0.lean * 0.4, S0.lean, wk) };
    const p = S.cad * tg + S.ph0, qL = frac(p), qR = frac(p + 0.5);
    const FL = footAt(S, qL), FR = footAt(S, qR);
    const yawP = S.pelYaw * Math.cos(TAU * (qL - 0.03)), rollP = S.pelRoll * Math.cos(TAU * (qL - 0.30)), sway = S.sway * Math.cos(TAU * (qL - 0.30));
    const hw = BODY.hipW, pf = S.surge * Math.sin(2 * TAU * qL);
    const hL = [pf + hw * Math.sin(yawP), hw * Math.sin(rollP), sway + hw * Math.cos(yawP)], hR = [pf - hw * Math.sin(yawP), -hw * Math.sin(rollP), sway - hw * Math.cos(yawP)];
    const anL = [FL[0], FL[1], S.stepW], anR = [FR[0], FR[1], -S.stepW];
    const Lmax = (BODY.thigh + BODY.shin) * S.legExt;
    const reach = (h, a) => a[1] - h[1] + Math.sqrt(Math.max(0.02, Lmax * Lmax - (a[0] - h[0]) ** 2 - (a[2] - h[2]) ** 2));
    const hipY = smin(smin(reach(hL, anL), reach(hR, anR)), S.hipMax) - S.sink - S.dip * (0.5 + 0.5 * Math.cos(2 * TAU * (qL - S.dipPh)));
    hL[1] += hipY; hR[1] += hipY;
    const knee = (h, a, side) => {                    // the knee, bent forwards (and a touch outwards)
      const d = [a[0] - h[0], a[1] - h[1], a[2] - h[2]], L = Math.hypot(d[0], d[1], d[2]) || 1e-6, l = Math.min(L, BODY.thigh + BODY.shin - 1e-4);
      const a1 = (BODY.thigh ** 2 - BODY.shin ** 2 + l * l) / (2 * l), hh = Math.sqrt(Math.max(0, BODY.thigh ** 2 - a1 * a1));
      const u = [d[0] / L, d[1] / L, d[2] / L];
      let n = [1 - u[0] * u[0], -u[0] * u[1], -u[0] * u[2] + side * 0.06]; const nl = Math.hypot(n[0], n[1], n[2]) || 1; n = [n[0] / nl, n[1] / nl, n[2] / nl];
      return [h[0] + u[0] * a1 + n[0] * hh, h[1] + u[1] * a1 + n[1] * hh, h[2] + u[2] * a1 + n[2] * hh];
    };
    const knL = knee(hL, anL, 1), knR = knee(hR, anR, -1);
    const foot = (a, th, side) => { const h = rot2(-0.06, -0.07, th), t = rot2(0.19, -0.062, th); return [[a[0] + h[0], Math.max(0, a[1] + h[1]), a[2]], [a[0] + t[0], Math.max(0, a[1] + t[1]), a[2] + side * S.toeOut]]; };
    const [heL, toL] = foot(anL, FL[2], 1), [heR, toR] = foot(anR, FR[2], -1);
    // the trunk
    const lean = S.lean + S.leanOsc * Math.cos(2 * TAU * (qL - 0.1)) + (o.lean || 0);
    const pel = [pf, hipY, sway];
    const chest = [pel[0] + Math.sin(lean) * BODY.spine + S.slump * 0.03, pel[1] + Math.cos(lean) * BODY.spine - S.slump * 0.03, sway * 0.45];
    const yawC = -S.chestYaw * Math.cos(TAU * (qL - 0.05)) + (o.twist || 0), rollC = -rollP * 0.6, sw = BODY.shW;
    const shUp = S.shrug + (o.shrug || 0);
    const shL = [chest[0] + sw * Math.sin(yawC) + S.slump * 0.035, chest[1] + sw * Math.sin(rollC) + shUp, chest[2] + sw * Math.cos(yawC)];
    const shR = [chest[0] - sw * Math.sin(yawC) + S.slump * 0.035, chest[1] - sw * Math.sin(rollC) + shUp, chest[2] - sw * Math.cos(yawC)];
    const cy = Math.cos(yawC), sy = Math.sin(yawC), ry = (v) => [v[0] * cy + v[2] * sy, v[1], -v[0] * sy + v[2] * cy];
    const ca = Math.cos(TAU * (qL - S.armLag)), asym = (x) => (x > 0 ? 1.15 * x : 0.85 * x);
    const arm = (sh, side, c, ov) => {                // side +1 left; c is +1 at the arm's forward end
      const a1 = S.armBias + S.arm * asym(c), e = S.elbow + S.elbowDyn * Math.pow(clamp(0.5 + 0.5 * c), 1.5), ab = S.ab;
      const up = ry([Math.sin(a1) * Math.cos(ab), -Math.cos(a1) * Math.cos(ab), side * Math.sin(ab)]);
      let fo = ry([Math.sin(a1 + e), -Math.cos(a1 + e), side * (Math.sin(ab) * 0.4 - S.elbowIn * Math.sin(e))]); const fl = Math.hypot(fo[0], fo[1], fo[2]); fo = fo.map((v) => v / fl);
      let el = [sh[0] + up[0] * BODY.uarm, sh[1] + up[1] * BODY.uarm, sh[2] + up[2] * BODY.uarm];
      let wr = [el[0] + fo[0] * BODY.farm, el[1] + fo[1] * BODY.farm, el[2] + fo[2] * BODY.farm];
      if (ov && ov.w > 0.001) {                        // a posed arm: the wrist goes to a place, the elbow towards a pole
        const tw = [chest[0] + ov.wrist[0], chest[1] + ov.wrist[1], chest[2] + ov.wrist[2]];
        const d = [tw[0] - sh[0], tw[1] - sh[1], tw[2] - sh[2]], L = Math.hypot(d[0], d[1], d[2]) || 1e-6, l = Math.min(L, BODY.uarm + BODY.farm - 1e-3), u = d.map((v) => v / L);
        const a = (BODY.uarm ** 2 - BODY.farm ** 2 + l * l) / (2 * l), hh = Math.sqrt(Math.max(0, BODY.uarm ** 2 - a * a));
        const pl = ov.pole, dt = pl[0] * u[0] + pl[1] * u[1] + pl[2] * u[2]; let n = [pl[0] - dt * u[0], pl[1] - dt * u[1], pl[2] - dt * u[2]]; const nl = Math.hypot(n[0], n[1], n[2]) || 1; n = n.map((v) => v / nl);
        const el2 = [sh[0] + u[0] * a + n[0] * hh, sh[1] + u[1] * a + n[1] * hh, sh[2] + u[2] * a + n[2] * hh], wr2 = [sh[0] + u[0] * l, sh[1] + u[1] * l, sh[2] + u[2] * l];
        el = el.map((v, i) => lerp(v, el2[i], ov.w)); wr = wr.map((v, i) => lerp(v, wr2[i], ov.w));
      }
      return [el, wr];
    };
    const ov = o.arms || {};
    const [elL, wrL] = arm(shL, 1, -ca, ov.l), [elR, wrR] = arm(shR, -1, ca, ov.r);
    const neck = [chest[0] + Math.sin(lean) * BODY.neck + S.headFwd * 0.6, chest[1] + BODY.neck + shUp * 0.3, chest[2]];
    const head = [neck[0] + S.headFwd + (o.headFwd || 0), neck[1] + 0.185, neck[2] * 0.9];
    return { pel, chest, neck, head, shL, shR, elL, elR, wrL, wrR, hL, hR, knL, knR, anL, anR, heL, heR, toL, toR,
      yawP, yawC, yawH: yawC * (1 - S.headStab) + (o.headYaw || 0), pitchH: S.headPitch + S.nod * Math.sin(2 * TAU * (qL - 0.12)) + (o.headPitch || 0), tiltH: (o.headTilt || 0) - rollP * 0.25, qL, hipY };
  }
  const JOINTS = ['pel', 'chest', 'neck', 'head', 'shL', 'shR', 'elL', 'elR', 'wrL', 'wrR', 'hL', 'hR', 'knL', 'knR', 'anL', 'anR', 'heL', 'heR', 'toL', 'toR'];
  // A walker: { S (style), look, track(t) → { x, z, h (heading, 0 = +Z), tg (the gait's own clock), y?, pose? } }.
  // placed(): its joints on screen. Returns null when any of him is behind you.
  function placed(cam, W, t, o = {}) {
    const tr = o.tr || W.track(t), J = skel(W.S, tr.tg, { ...(tr.pose || {}), ...(o.pose || {}) });
    const sh = Math.sin(tr.h), ch = Math.cos(tr.h), y0 = tr.y || 0, sc = tr.scale || 1;
    const w3 = (p) => [tr.x + (sh * p[0] - ch * p[2]) * sc, p[1] * sc + y0, tr.z + (ch * p[0] + sh * p[2]) * sc];
    const P = {};
    for (const k of JOINTS) {                        // o.near: a joint that's level with you or behind is held at the near plane (he's right in front of the lens)
      const w = w3(J[k]); let q = cam.P(w[0], w[1], w[2]);
      if (!q) { if (!o.near) return null; const c = cam.toCam(w[0], w[1], w[2]); q = cam.scr([c[0], c[1], NEAR]); }
      P[k] = q;
    }
    const psi = wrap(Math.atan2(cam.x - tr.x, cam.z - tr.z) - tr.h);      // 0: he faces you; +: he's turned to your right; ±π: his back
    return { P, J, tr, psi, w3, s: P.pel[2] };
  }

  // ------------------------------------------------------------------ drawing the body
  const SUN = (() => { const v = [-0.2, 0.27, 1], l = Math.hypot(...v); return v.map((x) => x / l); })();   // towards the low sun, at the far (+Z) end of the lane
  function lightOf(cam) { const d = cam.dirCam(SUN[0], SUN[1], SUN[2]); return { x: d[0], back: clamp(d[2]), front: clamp(-d[2]) }; }
  const LIT = '#fff0d2', SHD = '#3a2440';
  function figure(g, cam, W, t, o = {}) {
    const F = placed(cam, W, t, o); if (!F) return null;
    const { P, J, psi, s } = F, Lk = W.look, lt = o.light || lightOf(cam);
    const psiP = psi - J.yawP, psiC = psi - J.yawC;
    // tones: the side towards the sun is lit; with the sun behind him he's in shade with a bright rim
    const bl = lt.back, k0 = 0.10 + 0.34 * bl, lx = lt.x >= 0 ? 1 : -1;
    const tone = (c) => [mix(mix(c, LIT, 0.16 * (1 - bl)), SHD, k0 * 0.5), mix(c, SHD, 0.2 + k0 * 0.8)];
    const grad = (a, b, r, c) => {                    // across a limb, lit on the sun's side
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1e-3; let nx = -dy / L, ny = dx / L;
      if (nx * lx - ny * 0.4 < 0) { nx = -nx; ny = -ny; }
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, q = g.createLinearGradient(mx + nx * r, my + ny * r, mx - nx * r, my - ny * r), [c0, c1] = tone(c);
      q.addColorStop(0, c0); q.addColorStop(0.55, mix(c0, c1, 0.55)); q.addColorStop(1, c1); return q;
    };
    const cap = (a, b, ra, rb) => {                   // a tapered capsule between two screen points (radii in metres)
      const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), r0 = ra * a[2], r1 = rb * b[2];
      g.beginPath(); g.arc(a[0], a[1], r0, ang + PI / 2, ang - PI / 2); g.arc(b[0], b[1], r1, ang - PI / 2, ang + PI / 2); g.closePath();
    };
    const limb = (a, b, ra, rb, c) => { cap(a, b, ra, rb); g.fillStyle = grad(a, b, Math.max(ra * a[2], rb * b[2]), c); g.fill(); };
    const mid = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)];
    const rim = (a, b, ra, rb) => {                   // the low sun on one edge
      if (bl < 0.05 && Math.abs(lt.x) < 0.25) return;
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1e-3; let nx = -dy / L, ny = dx / L; if (nx * lx - ny * 0.4 < 0) { nx = -nx; ny = -ny; }
      g.strokeStyle = `rgba(255,226,168,${(0.2 + 0.36 * bl).toFixed(3)})`; g.lineWidth = Math.max(1.2, Math.min(7, 0.011 * s)); g.lineCap = 'round';
      g.beginPath(); g.moveTo(a[0] + nx * ra * a[2] * 0.92, a[1] + ny * ra * a[2] * 0.92); g.lineTo(b[0] + nx * rb * b[2] * 0.92, b[1] + ny * rb * b[2] * 0.92); g.stroke();
    };
    const leg = (hp, kn, an, he, to) => {
      limb(hp, kn, 0.088, 0.070, Lk.leg); limb(kn, an, 0.068, 0.054, Lk.leg); rim(hp, kn, 0.088, 0.07); rim(kn, an, 0.068, 0.054);
      // the shoe: heel to toe, with a pale sole under it
      const ang = Math.atan2(to[1] - he[1], to[0] - he[0]), sx = Math.sin(ang), cxx = Math.cos(ang);
      limb(he, to, 0.047, 0.040, Lk.shoe);
      g.globalAlpha = clamp(Math.abs(Math.sin(psi)) * 1.6 - 0.2); g.strokeStyle = Lk.sole; g.lineWidth = Math.max(1, 0.02 * s); g.lineCap = 'round';
      const dn = (p, r) => [p[0] - sx * r * p[2] * (cxx >= 0 ? 1 : -1), p[1] + Math.abs(cxx) * r * p[2]];
      const h1 = dn(he, 0.040), t1 = dn(to, 0.033); g.beginPath(); g.moveTo(h1[0], h1[1]); g.lineTo(t1[0], t1[1]); g.stroke(); g.globalAlpha = 1;
      g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = Math.max(1, 0.012 * s); const hm = mid(kn, an, 0.93), r = 0.056 * hm[2]; g.beginPath(); g.moveTo(hm[0] - r, hm[1]); g.lineTo(hm[0] + r, hm[1]); g.stroke();
    };
    const hand = (el, wr, c) => {
      const ang = Math.atan2(wr[1] - el[1], wr[0] - el[0]), r = 0.047 * wr[2], x = wr[0] + Math.cos(ang) * r * 0.9, y = wr[1] + Math.sin(ang) * r * 0.9;
      g.save(); g.translate(x, y); g.rotate(ang); g.fillStyle = tone(c)[0]; g.beginPath(); g.ellipse(0, 0, r * 1.25, r * 0.86, 0, 0, TAU); g.fill();
      g.fillStyle = tone(c)[1]; g.beginPath(); g.ellipse(r * 0.1, r * 0.5 * (psi > 0 ? 1 : -1), r * 0.62, r * 0.3, 0.2, 0, TAU); g.fill(); g.restore();
    };
    const arm = (sh, el, wr) => {
      const m = mid(sh, el, 0.5);
      limb(m, el, 0.052, 0.048, Lk.skin); limb(el, wr, 0.048, 0.040, Lk.skin); rim(el, wr, 0.048, 0.040); hand(el, wr, Lk.skin);
      limb(sh, mid(sh, el, 0.62), 0.066, 0.060, Lk.shirt);
      g.strokeStyle = 'rgba(0,0,0,0.16)'; g.lineWidth = Math.max(1, 0.014 * s); const q = mid(sh, el, 0.62), ang = Math.atan2(el[1] - sh[1], el[0] - sh[0]), r = 0.062 * q[2];
      g.beginPath(); g.moveTo(q[0] - Math.sin(ang) * r, q[1] + Math.cos(ang) * r); g.lineTo(q[0] + Math.sin(ang) * r, q[1] - Math.cos(ang) * r); g.stroke();
      rim(sh, mid(sh, el, 0.62), 0.07, 0.062);
    };
    // the trunk's line on screen, and across it
    const A = P.pel, Bc = P.chest, tl = Math.hypot(Bc[0] - A[0], Bc[1] - A[1]) || 1, ux = (Bc[0] - A[0]) / tl, uy = (Bc[1] - A[1]) / tl, nx = -uy, ny = ux;
    const at = (tau, off) => [A[0] + ux * tl * tau + nx * off, A[1] + uy * tl * tau + ny * off];
    const smooth = (pts) => {                         // a closed curve through the points (Catmull-Rom)
      const n = pts.length; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 0; i < n; i++) { const p0 = pts[(i + n - 1) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n]; g.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]); }
      g.closePath();
    };
    const front = Math.cos(psiC), side = Math.sin(psiC);
    const torso = () => {
      const w0 = ellW(0.170, 0.130, psiP) * s, w1 = ellW(0.150, 0.118, (psiP + psiC) / 2) * s, w2 = ellW(0.206, 0.132, psiC) * s, w3 = ellW(0.208, 0.112, psiC) * s, wn = 0.075 * s;
      const hem = Lk.kurta ? -0.92 : -0.14, hw = Lk.kurta ? w0 * 1.1 : w0;
      const pts = [at(hem, -hw), at(0.16, -w0 * 0.98), at(0.44, -w1), at(0.80, -w2), at(0.98, -w3), at(1.085, -wn), at(1.085, wn), at(0.98, w3), at(0.80, w2), at(0.44, w1), at(0.16, w0 * 0.98), at(hem, hw)];
      smooth(pts);
      const q = g.createLinearGradient(...at(0.5, lx * w2), ...at(0.5, -lx * w2)), [c0, c1] = tone(Lk.shirt);
      q.addColorStop(0, c0); q.addColorStop(0.5, mix(c0, c1, 0.5)); q.addColorStop(1, c1); g.fillStyle = q; g.fill();
      g.save(); smooth(pts); g.clip();
      g.fillStyle = 'rgba(30,18,40,0.10)'; const wf = at(0.06, 0); g.beginPath(); g.ellipse(wf[0], wf[1], w0 * 1.2, 0.03 * s, Math.atan2(ny, nx), 0, TAU); g.fill();   // a fold at the waist
      if (front > 0.12) {                              // the front: a placket, buttons, the collar's points
        const a = clamp((front - 0.12) * 4), off = (tau) => side * lerp(0.130, 0.132, tau) * s;
        g.globalAlpha = a; g.strokeStyle = 'rgba(0,0,0,0.16)'; g.lineWidth = Math.max(1, 0.012 * s); g.beginPath(); g.moveTo(...at(-0.14, off(0))); g.lineTo(...at(1.0, off(1))); g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.5)'; for (let i = 0; i < 5; i++) { const p = at(0.08 + i * 0.19, off(0.5)); g.beginPath(); g.arc(p[0], p[1], Math.max(0.8, 0.011 * s), 0, TAU); g.fill(); }
        g.fillStyle = mix(Lk.shirt, LIT, 0.25); for (const k of [-1, 1]) { const c0 = at(1.06, off(1) + k * 0.012 * s), c1 = at(0.86, off(1) + k * 0.02 * s), c2 = at(0.93, off(1) + k * 0.085 * s * Math.max(0.3, front)), c3 = at(1.09, off(1) + k * 0.07 * s * Math.max(0.3, front)); g.beginPath(); g.moveTo(...c0); g.lineTo(...c1); g.lineTo(...c2); g.lineTo(...c3); g.closePath(); g.fill(); }
        g.globalAlpha = 1;
      } else if (front < -0.12) {                      // the back: a yoke seam
        g.globalAlpha = clamp((-front - 0.12) * 4); g.strokeStyle = 'rgba(0,0,0,0.14)'; g.lineWidth = Math.max(1, 0.012 * s);
        const p0 = at(0.84, -w2 * 0.9), p1 = at(0.78, -side * 0.13 * s), p2 = at(0.84, w2 * 0.9); g.beginPath(); g.moveTo(...p0); g.quadraticCurveTo(p1[0], p1[1], p2[0], p2[1]); g.stroke(); g.globalAlpha = 1;
      }
      if (bl > 0.05 || Math.abs(lt.x) > 0.25) { g.strokeStyle = `rgba(255,226,168,${(0.2 + 0.36 * bl).toFixed(3)})`; g.lineWidth = Math.max(2, Math.min(14, 0.022 * s)); g.beginPath(); g.moveTo(...at(-0.14, lx * w0)); g.lineTo(...at(0.44, lx * w1)); g.lineTo(...at(0.8, lx * w2)); g.lineTo(...at(0.98, lx * w3)); g.stroke(); }
      g.restore();
    };
    const pelvis = () => {
      const w = ellW(0.158, 0.122, psiP) * s; g.save(); g.translate(A[0], A[1]); g.rotate(Math.atan2(ny, nx));
      const q = g.createLinearGradient(lx * w, 0, -lx * w, 0), [c0, c1] = tone(Lk.leg); q.addColorStop(0, c0); q.addColorStop(1, c1);
      g.fillStyle = q; g.beginPath(); g.ellipse(0, 0.012 * s, w, 0.115 * s, 0, 0, TAU); g.fill(); g.restore();
    };
    const bag = () => {                               // the grey backpack: the same on all four
      if (!Lk.bag) return;
      const w = ellW(0.158, 0.088, psiC) * s, off = -side * 0.215 * s, lag = (o.bagLag || 0) * s;
      const c = at(0.62, off), ang = Math.atan2(uy, ux) + PI / 2, h = 0.40 * s;
      F.bagC = [c[0], c[1] + lag, w, h * 0.5];
      g.save(); g.translate(c[0], c[1] + lag); g.rotate(ang);
      const q = g.createLinearGradient(lx * w, 0, -lx * w, 0), [c0, c1] = tone(Lk.bag); q.addColorStop(0, c0); q.addColorStop(1, c1); g.fillStyle = q;
      g.beginPath(); g.roundRect(-w, -h * 0.5, w * 2, h, Math.min(w, 0.07 * s)); g.fill();
      if (front < 0.1) {                               // seen from behind: a pocket, a zip, the grab handle
        const a = clamp((0.1 - front) * 3), pw = w * 0.74 * Math.abs(front < 0 ? 1 : 0.6);
        g.globalAlpha = a; g.fillStyle = tone(mix(Lk.bag, '#000000', 0.16))[0]; g.beginPath(); g.roundRect(-pw - side * w * 0.2, h * 0.02, pw * 2, h * 0.36, 0.03 * s); g.fill();
        g.strokeStyle = mix(Lk.bag, '#ffffff', 0.5); g.lineWidth = Math.max(1, 0.012 * s); g.beginPath(); g.moveTo(-pw * 0.8 - side * w * 0.2, -h * 0.16); g.lineTo(pw * 0.8 - side * w * 0.2, -h * 0.16); g.stroke();
        g.strokeStyle = tone(mix(Lk.bag, '#000000', 0.3))[0]; g.lineWidth = Math.max(1.5, 0.022 * s); g.beginPath(); g.arc(-side * w * 0.2, -h * 0.5, 0.035 * s * Math.max(0.3, -front + 0.3), PI, TAU); g.stroke();
        g.globalAlpha = 1;
      }
      g.restore();
    };
    const straps = () => {
      if (!Lk.bag || front < 0.35) return;
      g.globalAlpha = clamp((front - 0.35) * 4); g.strokeStyle = tone(mix(Lk.bag, '#000000', 0.25))[0]; g.lineWidth = Math.max(1.5, 0.036 * s); g.lineCap = 'round';
      for (const k of [-1, 1]) { const o0 = side * 0.13 * s + k * 0.115 * s * front; g.beginPath(); g.moveTo(...at(1.02, o0 * 0.92)); g.quadraticCurveTo(...at(0.6, o0 * 1.25), ...at(0.2, o0 * 1.5)); g.stroke(); }
      g.globalAlpha = 1;
    };
    const phone = () => {                              // the phone in his right back pocket: the same on all four
      if (!Lk.phone) return;
      const fb = Math.cos(psiP); if (fb > 0.3) return;
      const yp = J.yawP, c = Math.cos(yp), sn = Math.sin(yp), lo = [-0.124, 0.0, -0.078];
      const w = F.w3([J.pel[0] + lo[0] * c + lo[2] * sn, J.pel[1] + lo[1], J.pel[2] - lo[0] * sn + lo[2] * c]), q = cam.P(w[0], w[1], w[2]); if (!q) return;
      const k = Math.max(0.24, -Math.cos(psiP - 0.35)), a = clamp((0.3 - fb) * 3), u = q[2];
      F.phoneC = [q[0], q[1] - 0.045 * u, 0.085 * u];
      g.save(); g.globalAlpha = a; g.translate(q[0], q[1]); g.rotate(Math.atan2(uy, ux) + PI / 2);
      g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = Math.max(1, 0.01 * u); g.beginPath(); g.roundRect(-0.056 * u * k, -0.02 * u, 0.112 * u * k, 0.13 * u, 0.014 * u); g.stroke();
      g.fillStyle = Lk.phone; g.beginPath(); g.roundRect(-0.040 * u * k, -0.115 * u, 0.080 * u * k, 0.15 * u, 0.014 * u); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = Math.max(1, 0.008 * u); g.stroke();
      g.fillStyle = '#23262c'; g.beginPath(); g.roundRect(-0.030 * u * k, -0.105 * u, 0.030 * u * k, 0.034 * u, 0.006 * u); g.fill();
      g.fillStyle = mix(Lk.leg, '#000000', 0.12); g.beginPath(); g.roundRect(-0.056 * u * k, -0.02 * u, 0.112 * u * k, 0.13 * u, 0.014 * u); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.14)'; g.lineWidth = Math.max(1, 0.007 * u); g.stroke();
      g.restore();
    };
    // order: what's further from you first
    const dz = (a, b) => (a[3] + b[3]) / 2, tz = P.chest[3];
    const legs = [[P.hL, P.knL, P.anL, P.heL, P.toL], [P.hR, P.knR, P.anR, P.heR, P.toR]].sort((a, b) => dz(b[1], b[2]) - dz(a[1], a[2]));
    const arms = [[P.shL, P.elL, P.wrL], [P.shR, P.elR, P.wrR]];
    const behind = arms.filter((a) => dz(a[1], a[2]) > tz + 0.02), infront = arms.filter((a) => !(dz(a[1], a[2]) > tz + 0.02));
    g.save(); g.lineJoin = 'round';
    for (const a of behind.sort((a, b) => dz(b[1], b[2]) - dz(a[1], a[2]))) arm(...a);
    if (front > 0) bag();
    pelvis();
    for (const l of legs) leg(...l);
    torso();
    phone();
    if (front <= 0) bag();
    straps();
    // the neck, then the head
    const hb = [P.head[0] - 0.02 * P.head[2] * Math.sin(psi), P.head[1] + 0.13 * P.head[2], P.head[2], P.head[3]];
    limb(P.neck, hb, 0.060, 0.058, mix(Lk.skin, Lk.skinD, 0.4));
    for (const a of infront.sort((a, b) => dz(b[1], b[2]) - dz(a[1], a[2]))) arm(...a);
    const psiH = wrap(psi - J.yawH);
    F.psiH = psiH; F.headR = 0.135 * P.head[2];
    if (!o.noHead) head3(g, P.head[0], P.head[1], F.headR, psiH, Lk, { pitch: J.pitchH, tilt: J.tiltH, light: lt, ...(o.face || {}), out: F });
    g.restore();
    return F;
  }
  // his long evening shadow (away from the sun), and each foot's own contact with the ground
  function shadow(g, cam, W, t, o = {}) {
    const F = placed(cam, W, t, o); if (!F) return;
    const { J, w3, tr } = F, a = o.a ?? 0.26, L = o.len ?? 3.4, dir = [-SUN[0], -SUN[2]], dl = Math.hypot(dir[0], dir[1]), dx = dir[0] / dl, dzz = dir[1] / dl, px = -dzz, pz = dx;
    const base = w3([J.pel[0], 0, J.pel[2]]), tip = [base[0] + dx * L, 0, base[2] + dzz * L];
    const q0 = cam.P(base[0], 0, base[2]), q1 = cam.P(tip[0], 0, tip[2]);
    if (q0 && q1) {
      const gr = g.createLinearGradient(q0[0], q0[1], q1[0], q1[1]); gr.addColorStop(0, `rgba(58,30,34,${a})`); gr.addColorStop(1, 'rgba(58,30,34,0)');
      poly3(g, cam, [[base[0] + px * 0.2, 0, base[2] + pz * 0.2], [base[0] - px * 0.2, 0, base[2] - pz * 0.2], [tip[0] - px * 0.13, 0, tip[2] - pz * 0.13], [tip[0] + px * 0.13, 0, tip[2] + pz * 0.13]], gr);
    }
    for (const [he, to, an] of [[J.heL, J.toL, J.anL], [J.heR, J.toR, J.anR]]) {
      const m = w3([(he[0] + to[0]) / 2, 0, (he[2] + to[2]) / 2]), q = cam.P(m[0], 0, m[2]); if (!q) continue;
      const hgt = Math.max(0, (he[1] + to[1]) / 2), k = 1 / (1 + hgt * 14);
      g.fillStyle = `rgba(40,20,24,${(0.34 * k * (o.a != null ? o.a / 0.26 : 1)).toFixed(3)})`; g.beginPath(); g.ellipse(q[0], q[1], 0.17 * q[2] * (1.25 - 0.25 * k), 0.045 * q[2] * (1.25 - 0.25 * k) * Math.max(0.35, Math.abs(Math.sin(cam.pitch)) + 0.5), 0, 0, TAU); g.fill();
    }
  }
  // the lab's version: lights on the joints and nothing else (Johansson 1973; Gunns, Johnston & Hudson 2002)
  const DOTS = ['head', 'shL', 'shR', 'elL', 'elR', 'wrL', 'wrR', 'hL', 'hR', 'knL', 'knR', 'anL', 'anR'];
  function dots(g, cam, W, t, o = {}) {
    const F = placed(cam, W, t, o); if (!F) return null;
    const a = o.alpha ?? 1, col = o.col || '#ffe7a8', r0 = o.r ?? 0.03;
    g.save();
    for (let n = o.trail || 0; n >= 1; n--) {
      const Fp = placed(cam, W, t - n / 30, o); if (!Fp) continue;
      g.fillStyle = rgba(col, a * 0.34 / n);
      for (const k of DOTS) { const p = Fp.P[k]; g.beginPath(); g.arc(p[0], p[1], Math.max(1.8, r0 * p[2] * (1 - 0.18 * n)), 0, TAU); g.fill(); }
    }
    for (const k of DOTS) {
      const p = F.P[k], r = Math.max(2.2, r0 * p[2]);
      const q = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], r * 3.2); q.addColorStop(0, rgba(col, 0.5 * a)); q.addColorStop(1, rgba(col, 0));
      g.fillStyle = q; g.beginPath(); g.arc(p[0], p[1], r * 3.2, 0, TAU); g.fill();
      g.fillStyle = rgba('#fffaf0', a); g.beginPath(); g.arc(p[0], p[1], r, 0, TAU); g.fill();
    }
    g.restore();
    return F;
  }

  // ------------------------------------------------------------------ a head that turns all the way round
  // Head units: 1 = half the skull's width, y up, the origin at the middle of the head. psi: 0 he faces you, + turned to your
  // right, ±π the back of his head. The skull and the jaw are two ellipsoids; the eyes, brows, nose and mouth sit on a face
  // surface and turn with it; the hair is whatever of the skull is above the hairline, which runs all the way round.
  const SK = [0, 0.32, -0.10, 1.0, 0.98, 1.14], JW = [0, -0.50, 0.15, 0.80, 0.80, 0.84], FC = [0, -0.10, 0.02, 0.98, 1.22, 1.03];
  const HAIR = {                                      // the hairline's height (latitude on the skull, degrees) at the front, the temple corner, by the ear, behind the ear, the nape; and the hair's thickness
    short: { line: [44, 16, -8, -14, -44], vol: 0.07 },
    part: { line: [46, 20, -6, -12, -42], vol: 0.10, part: 1 },
    curly: { line: [42, 18, -4, -10, -40], vol: 0.17, curl: 1 },
    buzz: { line: [47, 22, -6, -12, -40], vol: 0.03, thin: 0.3 },
  };
  function hull(pts) {                                // convex hull (monotone chain), counter-clockwise
    const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = []; for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    const up = []; for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    lo.pop(); up.pop(); return lo.concat(up);
  }
  function head3(g, x, y, R, psi, L, o = {}) {
    const cs = Math.cos(psi), sn = Math.sin(psi), pitch = o.pitch || 0, lt = o.light || { x: 0, back: 0 }, lx = lt.x >= 0 ? 1 : -1;
    const rot = (p) => [p[0] * cs + p[2] * sn, p[1], -p[0] * sn + p[2] * cs];
    const sil = (E) => { const c = rot([E[0], E[1], E[2]]); return { x: c[0], y: c[1], rx: Math.hypot(E[3] * cs, E[5] * sn), ry: E[4] }; };
    const sk = sil(SK), jw = sil(JW), dyF = -0.34 * pitch * cs;
    const pts = [];
    for (let i = 0; i < 26; i++) { const a = i / 26 * TAU; pts.push([sk.x + sk.rx * Math.cos(a), sk.y + sk.ry * Math.sin(a)]); pts.push([jw.x + jw.rx * Math.cos(a), jw.y + jw.ry * Math.sin(a) + dyF * 0.4]); }
    const H = hull(pts), outline = () => { g.beginPath(); H.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); };
    const bl = lt.back || 0, skin = mix(L.skin, SHD, 0.16 * bl), skinD = mix(L.skinD, SHD, 0.2 * bl), skinH = mix(L.skinH, L.skin, 0.6 * bl);
    g.save(); g.translate(x, y); g.rotate((o.tilt || 0) - pitch * sn * 0.85); g.scale(R, -R); g.lineJoin = 'round'; g.lineCap = 'round';
    const brimPts = () => {                            // the cap's brim: a curved tongue out from the forehead, worn a little to one side
      const lb = 7 * PI / 180, c = Math.cos(lb), f0 = L.capTurn ?? 0, inn = [], out2 = [];
      for (let i = 0; i <= 14; i++) {
        const u = -1 + i / 7, phi = f0 + u * 1.12, base = [SK[3] * c * Math.sin(phi), SK[1] + SK[4] * Math.sin(lb) - 0.02, SK[2] + SK[5] * c * Math.cos(phi)], len = 0.14 + 0.62 * Math.pow(Math.cos(u * PI / 2), 0.7);
        const pi = rot(base), po = rot([base[0] + Math.sin(f0) * len, base[1] - 0.02 - 0.36 * len, base[2] + Math.cos(f0) * len]);
        inn.push([pi[0], pi[1] + dyF * 0.5]); out2.push([po[0], po[1] + dyF * 0.5]);
      }
      return { inn, out2, zc: rot([Math.sin(f0), 0, Math.cos(f0)])[2] };
    };
    const brim = (B) => {
      g.fillStyle = mix('#7d2130', '#4a111b', clamp(cs)); g.beginPath(); B.inn.forEach((p, j) => (j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); for (let j = B.out2.length - 1; j >= 0; j--) g.lineTo(B.out2[j][0], B.out2[j][1]); g.closePath(); g.fill();
      g.strokeStyle = '#a32b3d'; g.lineWidth = 0.05; g.beginPath(); B.out2.forEach((p, j) => (j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke();
    };
    const BR = L.cap ? brimPts() : null;
    if (BR && BR.zc <= 0.05) brim(BR);                 // from behind it's under the head: only what sticks out past it shows
    const zs = (fx, fy) => FC[2] + FC[5] * Math.sqrt(Math.max(0, 1 - (fx / FC[3]) ** 2 - ((fy - FC[1]) / FC[4]) ** 2));
    const fpt = (fx, fy) => { const z = zs(fx, fy), n = [fx / FC[3] ** 2, (fy - FC[1]) / FC[4] ** 2, (z - FC[2]) / FC[5] ** 2], nl = Math.hypot(n[0], n[1], n[2]) || 1, p = rot([fx, fy, z]); return [p[0], p[1] + dyF, (-n[0] * sn + n[2] * cs) / nl]; };
    // the ears: both peep out from behind the skull; the one on your side comes round onto the head (drawn again, later)
    const ear = (k, a = 1) => { const c = rot([k * 0.97, 0.0, -0.16]), w = 0.11 + 0.19 * Math.abs(sn); g.globalAlpha *= a; g.fillStyle = skin; g.beginPath(); g.ellipse(c[0], c[1] + dyF * 0.5, w, 0.3, 0, 0, TAU); g.fill(); g.fillStyle = skinD; g.beginPath(); g.ellipse(c[0] - sn * 0.03, c[1] + dyF * 0.5 + 0.01, w * 0.5, 0.17, 0, 0, TAU); g.fill(); g.globalAlpha /= a; return c; };
    if (L.long) { g.fillStyle = L.hair; g.beginPath(); g.ellipse(sk.x - sn * 0.22, -0.75, 0.98, 1.55, 0, 0, TAU); g.fill(); }
    if (L.bun) { const b = rot([0, 0.42, -1.3]); if (b[2] < 0.2) { g.fillStyle = L.hair; g.beginPath(); g.arc(b[0], b[1], 0.44, 0, TAU); g.fill(); } }
    for (const k of [-1, 1]) ear(k);
    outline(); const q0 = g.createLinearGradient(lx * 1.0, 1.1, -lx * 0.9, -1.1); q0.addColorStop(0, skinH); q0.addColorStop(0.45, skin); q0.addColorStop(1, skinD); g.fillStyle = q0; g.fill();
    g.save(); outline(); g.clip();
    if (Math.abs(sn) > 0.02 && cs > -0.3) {            // the cheek that has turned away from you falls into shade
      const e = Math.sign(sn) * 1.05, q = g.createLinearGradient(e, 0, e - Math.sign(sn) * 1.05, 0); q.addColorStop(0, `rgba(70,32,18,${(0.3 * Math.abs(sn)).toFixed(3)})`); q.addColorStop(1, 'rgba(70,32,18,0)'); g.fillStyle = q; g.fillRect(-2, -2, 4, 4);
    }
    if (L.stub && cs > -0.3) { const q = g.createLinearGradient(0, -0.3, 0, -1.2); q.addColorStop(0, 'rgba(30,22,18,0)'); q.addColorStop(1, `rgba(30,22,18,${(0.36 * L.stub).toFixed(3)})`); g.fillStyle = q; g.fillRect(-2, -1.5, 4, 1.2); }
    if (L.cap && cs > 0.1) { g.fillStyle = `rgba(40,10,6,${(0.3 * clamp((cs - 0.1) * 2)).toFixed(3)})`; const b = fpt(0, 0.62); g.beginPath(); g.ellipse(b[0], b[1] + 0.05, 1.0, 0.2, 0, 0, TAU); g.fill(); }
    const ex = o.look || [0, 0], close = Math.max(o.close || 0, 0), lid = o.lid || 0;
    // the mouth, wrapped round the face
    if (cs > -0.35) {
      const sm = o.smile || 0, my = -0.74, N = 7; g.strokeStyle = '#3c1d18'; g.lineWidth = 0.034; g.beginPath(); let on = false;
      for (let i = 0; i < N; i++) { const fx = -0.25 + 0.5 * i / (N - 1), p = fpt(fx, my + sm * 0.09 * (fx / 0.25) ** 2 - sm * 0.03 + (o.smirk || 0) * 0.07 * Math.max(0, fx * Math.sign(sn || 1) / 0.25)); if (p[2] < 0.06) { on = false; continue; } if (on) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); on = true; }
      g.stroke();
      if (L.must) { const upp = [], low = []; for (let i = 0; i < 13; i++) { const uu = -1 + i / 6, fx = uu * 0.3, p = fpt(fx, -0.575 - 0.065 * uu * uu); if (p[2] < 0.06) continue; const th = L.must * (1 - 0.72 * Math.pow(Math.abs(uu), 1.4)); upp.push([p[0], p[1] + th * 0.55]); low.push([p[0], p[1] - th * 0.45]); } if (upp.length > 2) { g.fillStyle = L.hair; g.beginPath(); upp.forEach((p, j) => (j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); for (let j = low.length - 1; j >= 0; j--) g.lineTo(low[j][0], low[j][1]); g.closePath(); g.fill(); } }
    }
    // the eyes and the brows
    for (const k of [-1, 1]) {
      const e = fpt(k * 0.43, 0.06); if (e[2] < 0.13) continue;
      if (o.out) { const a = (o.tilt || 0) - pitch * sn * 0.85, ca = Math.cos(a), sa = Math.sin(a), wf0 = clamp(e[2] * 1.12, 0.22, 1), px = e[0] + wf0 * ((o.look || [0, 0])[0] + sn * 0.05), py = e[1] + 0.016 + (o.look || [0, 0])[1]; (o.out.eyes = o.out.eyes || []).push({ k, x: x + R * (px * ca + py * sa), y: y + R * (px * sa - py * ca), r: 0.098 * R, wf: wf0, nz: e[2] }); }
      const wf = clamp(e[2] * 1.12, 0.22, 1), ew = L.ew ?? 0.235, eh = L.eh ?? 0.13, cl = Math.max(close, lid * 0.55), up = eh * 1.75 * (1 - cl), dn = eh * 1.05 * (1 - cl * 0.72);
      g.save(); g.translate(e[0], e[1]); g.scale(wf, 1);
      if (cl < 0.92) {
        const shape = () => { g.beginPath(); g.moveTo(-ew, -0.016); g.quadraticCurveTo(-k * 0.03, up, ew, -0.016); g.quadraticCurveTo(k * 0.03, -dn, -ew, -0.016); g.closePath(); };
        g.save(); shape(); g.fillStyle = '#fbf7ee'; g.fill(); shape(); g.clip();
        const ix = ex[0] + sn * 0.05, iy = 0.016 + ex[1], ir = 0.098;
        const qi = g.createRadialGradient(ix, iy, 0.01, ix, iy, ir); qi.addColorStop(0, '#4f3421'); qi.addColorStop(1, '#26170d'); g.fillStyle = qi; g.beginPath(); g.arc(ix, iy, ir, 0, TAU); g.fill();
        g.fillStyle = '#060404'; g.beginPath(); g.arc(ix, iy, ir * 0.52, 0, TAU); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.92)'; g.beginPath(); g.arc(ix - 0.032, iy + 0.038, 0.025, 0, TAU); g.fill();
        g.fillStyle = 'rgba(40,20,10,0.16)'; g.fillRect(-ew, up * 0.45, ew * 2, up);
        g.restore();
        g.strokeStyle = '#231510'; g.lineWidth = 0.036; g.beginPath(); g.moveTo(-ew, -0.016); g.quadraticCurveTo(-k * 0.03, up, ew, -0.016); g.stroke();
        g.strokeStyle = 'rgba(40,20,10,0.3)'; g.lineWidth = 0.014; g.beginPath(); g.moveTo(-ew * 0.82, -0.022); g.quadraticCurveTo(k * 0.03, -dn, ew * 0.82, -0.022); g.stroke();
      } else { g.strokeStyle = '#231510'; g.lineWidth = 0.04; g.beginPath(); g.moveTo(-ew * 0.92, -0.005); g.quadraticCurveTo(0, -0.07, ew * 0.92, -0.005); g.stroke(); }
      g.restore();
    }
    g.strokeStyle = L.hair; g.lineWidth = L.brow ?? 0.075;
    for (const k of [-1, 1]) {
      const tilt = (o.browTilt ?? L.browTilt ?? 0), by = 0.31 + (o.browY || 0) + (k * Math.sign(sn || 1) > 0 ? (o.browUp || 0) : 0); g.beginPath(); let on = false;
      for (let i = 0; i < 5; i++) { const u = i / 4, fx = k * lerp(0.17, 0.69, u), p = fpt(fx, by - tilt * (1 - u) + 0.04 * Math.sin(PI * u) - tilt * 0.3 * u * 0); if (p[2] < 0.1) { on = false; continue; } if (on) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); on = true; }
      g.stroke();
    }
    if (L.mole) { const m = fpt(L.mole[0], L.mole[1]); if (m[2] > 0.12) { g.fillStyle = '#2a1710'; g.beginPath(); g.ellipse(m[0], m[1], 0.055 * (0.4 + 0.6 * m[2]), 0.052, 0, 0, TAU); g.fill(); } }
    // the nose in front: a shadow and nostrils (they fade as he turns; side-on the nose is its own shape, below)
    if (cs > 0.25) { const a = clamp((cs - 0.25) * 2.2), nb = fpt(0, -0.36); g.fillStyle = `rgba(90,45,25,${(0.2 * a).toFixed(3)})`; g.beginPath(); g.ellipse(nb[0] + sn * 0.22, nb[1] + 0.03, 0.19, 0.05, 0, 0, TAU); g.fill(); g.fillStyle = `rgba(74,36,22,${(0.8 * a).toFixed(3)})`; for (const k of [-1, 1]) { const p = fpt(k * 0.07, -0.335); g.beginPath(); g.ellipse(p[0] + sn * 0.2, p[1], 0.043 * Math.max(0.4, cs), 0.025, 0, 0, TAU); g.fill(); } }
    g.restore();
    // the nose from the side: it stands proud of the face
    if (cs > -0.25 && Math.abs(sn) > 0.12) {
      const a = clamp((Math.abs(sn) - 0.12) * 3) * clamp((cs + 0.25) * 4), b = fpt(0, 0.04), nb = fpt(0, -0.42), tp = rot([0, -0.29, zs(0, -0.29) + 0.25]), sg = Math.sign(sn);
      g.globalAlpha = a; g.fillStyle = mix(skin, skinD, 0.3 + 0.5 * Math.abs(sn) * clamp(cs + 0.3)); g.beginPath(); g.moveTo(b[0] - sg * 0.04, b[1]); g.quadraticCurveTo(tp[0] + sg * 0.02, tp[1] + dyF + 0.17, tp[0], tp[1] + dyF); g.quadraticCurveTo(tp[0] - sg * 0.02, nb[1] + 0.005, nb[0] - sg * 0.05, nb[1]); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(90,45,25,0.35)'; g.lineWidth = 0.022; g.beginPath(); g.moveTo(tp[0] - sg * 0.01, tp[1] + dyF - 0.02); g.quadraticCurveTo(tp[0] - sg * 0.07, nb[1] + 0.01, nb[0] - sg * 0.06, nb[1]); g.stroke(); g.globalAlpha = 1;
    }
    // the hair: the skull above the hairline. The same construction, with a lower line, is the cap's dome.
    const patch = (line, vol, fill, hs2 = {}) => {
      const lat = (phi) => { const a = Math.abs(phi) * 180 / PI, [f, tc, e, be, np] = line; return (a < 38 ? f : a < 66 ? lerp(f, tc, sstep(38, 66, a)) : a < 92 ? lerp(tc, e, sstep(66, 92, a)) : a < 112 ? lerp(e, be, sstep(92, 112, a)) : lerp(be, np, sstep(112, 150, a))) * PI / 180; };
      const N = 96, vis = [], hp = [];
      for (let i = 0; i < N; i++) {
        const phi = -PI + (i + 0.5) / N * TAU, th = lat(phi), c = Math.cos(th);
        const p3 = [SK[3] * c * Math.sin(phi), SK[1] + SK[4] * Math.sin(th), SK[2] + SK[5] * c * Math.cos(phi)], n = [p3[0] / SK[3] ** 2, 0, (p3[2] - SK[2]) / SK[5] ** 2], p = rot(p3);
        vis.push(-n[0] * sn + n[2] * cs > 0); hp.push([p[0], p[1] + dyF * 0.5]);
      }
      let i0 = -1; for (let i = 0; i < N; i++) if (vis[i] && !vis[(i + N - 1) % N]) { i0 = i; break; }
      if (i0 < 0) return null;
      const run = []; for (let j = 0; j < N && vis[(i0 + j) % N]; j++) run.push(hp[(i0 + j) % N]);
      const Aa = run[0], Bb = run[run.length - 1], tau = (p) => Math.atan2((p[1] - sk.y - dyF * 0.5) / sk.ry, (p[0] - sk.x) / sk.rx);
      const t0 = tau(Bb), t1 = tau(Aa), dpos = ((t1 - t0) % TAU + TAU) % TAU, top = ((PI / 2 - t0) % TAU + TAU) % TAU, d = top <= dpos ? dpos : dpos - TAU;
      const v = 1 + vol, arc = []; for (let j = 0; j <= 28; j++) { const a = t0 + d * j / 28, bump = hs2.curl ? 0.05 * Math.sin(j * 1.9 + 0.6) : 0; arc.push([sk.x + sk.rx * (v + bump) * Math.cos(a), sk.y + dyF * 0.5 + sk.ry * (v + bump) * Math.sin(a)]); }
      g.fillStyle = fill; g.beginPath(); run.forEach((p, j) => (j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); arc.forEach((p) => g.lineTo(p[0], p[1])); g.closePath(); g.fill();
      if (hs2.curl) { for (let j = 2; j <= 26; j += 3) { const p = arc[j]; g.beginPath(); g.arc(lerp(p[0], sk.x, 0.1), lerp(p[1], sk.y, 0.1), 0.2, 0, TAU); g.fill(); } }
      return { arc, d, run };
    };
    const hs = HAIR[L.style] || HAIR.short, hc = hs.thin ? mix(L.hair, L.skin, hs.thin) : L.hair;
    const hp0 = patch(hs.line, hs.vol, hc, hs);
    if (hp0 && hs.part && cs > -0.2) { const pp = fpt(0.34, 0.99), pq = rot([0.42, SK[1] + SK[4] * 0.93, SK[2] + 0.2]); g.strokeStyle = mix(L.hair, L.skin, 0.45); g.lineWidth = 0.03; g.globalAlpha = clamp((cs + 0.2) * 3); g.beginPath(); g.moveTo(pp[0], pp[1] + 0.02); g.lineTo(pq[0], pq[1]); g.stroke(); g.globalAlpha = 1; }
    let top = hp0;
    if (L.cap) {
      const q = g.createLinearGradient(-1, 1.4, 1, 0.3); q.addColorStop(0, mix('#a32b3d', SHD, 0.12 * bl)); q.addColorStop(1, mix('#5c1520', SHD, 0.2 * bl));
      top = patch(L.capLine || [17, 13, 3, -5, -9], 0.07, q) || top;
      if (top) {
        const mer = (phi, la0) => { g.beginPath(); let on = false; for (let j = 0; j <= 8; j++) { const th = lerp(86, la0, j / 8) * PI / 180, c = Math.cos(th), p3 = [SK[3] * 1.07 * c * Math.sin(phi), SK[1] + SK[4] * 1.07 * Math.sin(th), SK[2] + SK[5] * 1.07 * c * Math.cos(phi)], p = rot(p3); if (p[2] < SK[2] * cs - 0.05) { on = false; continue; } if (on) g.lineTo(p[0], p[1] + dyF * 0.5); else g.moveTo(p[0], p[1] + dyF * 0.5); on = true; } g.stroke(); };
        g.strokeStyle = 'rgba(40,8,14,0.35)'; g.lineWidth = 0.022; for (const ph of [0.55, 1.6, 2.65, -0.55, -1.6, -2.65]) mer(ph + (L.capTurn ?? 0), Math.abs(ph) > 2 ? -6 : Math.abs(ph) > 1 ? 4 : 16);
        const b0 = rot([0, SK[1] + SK[4] * 1.07, SK[2]]); g.fillStyle = '#4a111b'; g.beginPath(); g.ellipse(b0[0], b0[1] + dyF * 0.5, 0.085, 0.04, 0, 0, TAU); g.fill();
        if (cs < -0.15) {                                // from behind: the gap over the strap, with his hair in it
          const f0 = (L.capTurn ?? 0) + PI, th = -9 * PI / 180, c = Math.cos(th), p = rot([SK[3] * 1.05 * c * Math.sin(f0), SK[1] + SK[4] * Math.sin(th), SK[2] + SK[5] * 1.05 * c * Math.cos(f0)]), k = clamp((-cs - 0.15) * 3);
          g.globalAlpha = k; g.fillStyle = hc; g.beginPath(); g.ellipse(p[0], p[1] + dyF * 0.5 + 0.02, 0.24 * Math.max(0.3, -cs), 0.17, 0, PI, TAU); g.fill();
          g.strokeStyle = '#4a111b'; g.lineWidth = 0.05; g.beginPath(); g.moveTo(p[0] - 0.24 * Math.max(0.3, -cs), p[1] + dyF * 0.5 + 0.02); g.lineTo(p[0] + 0.24 * Math.max(0.3, -cs), p[1] + dyF * 0.5 + 0.02); g.stroke(); g.globalAlpha = 1;
        }
      }
      if (BR.zc > 0.05) brim(BR);
    }
    if (top && (bl > 0.05 || Math.abs(lt.x) > 0.25)) {  // the low sun on the crown
      const { arc, d } = top; g.strokeStyle = `rgba(255,226,168,${(0.28 + 0.45 * bl).toFixed(3)})`; g.lineWidth = 0.05; g.beginPath(); const j0 = lx > 0 ? (d > 0 ? 0 : 14) : (d > 0 ? 14 : 0);
      for (let j = j0; j <= j0 + 14; j++) { const p = arc[j]; if (j === j0) g.moveTo(p[0], p[1]); else g.lineTo(p[0], p[1]); } g.stroke();
    }
    if (L.bun) { const b = rot([0, 0.42, -1.3]); if (b[2] >= 0.2) { g.fillStyle = L.hair; g.beginPath(); g.arc(b[0], b[1], 0.44, 0, TAU); g.fill(); } }
    // the ear on your side, once it has come round
    for (const k of [-1, 1]) { const c = rot([k * 0.97, 0, -0.16]); if (c[2] > 0.2) ear(k, sstep(0.2, 0.55, c[2])); }
    g.restore();
  }

  window.RIG = { camera, poly3, line3, clipNear, style, skel, placed, figure, shadow, dots, head3, lightOf, mix, rgba, sstep, wrap, frac, ellW, SUN, BODY, TAU, PI };
})();
