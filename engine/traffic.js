// traffic.js — car-following simulation for reels: real traffic physics, precomputed at load and sampled by t, so every
// frame is a pure function of time (render contract). Built for reel 14 (phantom jams).
//
// The model: the Intelligent Driver Model (Treiber, Hennecke & Helbing 2000), each driver acting on what they saw a
// reaction time ago (a delay is what makes human traffic "string unstable": every follower overreacts a little), with
// per-driver variety (desired speed, time gap, reaction). Vehicles stay in order on a closed loop (a ring track, or one
// lane of a long road with periodic ends), so the gap to the one ahead is always defined.
// Events: a driver touching the brakes for a while ({ i, t0, t1, decel }: "slowed down, just a little"), or a desired
// speed dropped ({ v0 }: the IDM then brakes hard, like a driver who suddenly wants to go slower). A controlled vehicle (Stern et
// al. 2018): from a time on it holds a steady speed and only brakes for safety; the waves behind it fade.
//
//   const sim = TRAFFIC.ring({ length: 230, n: 22, seed: 7, T: 120, dt: 0.05, ... })
//   sim.state(t)  → { x: Float64Array (m along the loop), v (m/s), a (m/s²) } at sim time t (linear between steps)
//   sim.len[i], sim.kind[i]   per vehicle;   sim.minV(i, t0, t1)  the slowest vehicle i went in [t0, t1]
// Works in a page (window.TRAFFIC) and in Node (module.exports), so scenarios can be tuned offline.
(() => {
  const mulberry32 = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const KINDS = { car: 4.4, auto: 2.9, bike: 2.0, bus: 11.5, suv: 4.8 };

  function ring(o) {
    const L = o.length, n = o.n, dt = o.dt ?? 0.05, steps = Math.ceil((o.T ?? 120) / dt) + 1, r = mulberry32(o.seed ?? 1);
    const kind = Array.from({ length: n }, (_, i) => (o.kinds ? o.kinds(i, r) : 'car'));
    const len = Float64Array.from(kind, (k) => KINDS[k] ?? 4.4);
    const jit = (s) => 1 + (r() - 0.5) * 2 * s;
    const P = Array.from({ length: n }, (_, i) => ({
      v0: (o.v0 ?? 11) * jit(o.v0Jitter ?? 0.04), a: (o.a ?? 1.0) * jit(0.08), b: o.b ?? 1.6,
      T: (o.Tgap ?? 0.6) * jit(o.TJitter ?? 0.1), s0: o.s0 ?? 1.2, tau: Math.max(1, Math.round(((o.tau ?? 0.7) * jit(o.tauJitter ?? 0.15)) / dt)),
      ...(o.driver ? o.driver(i, kind[i], r) : {}),
    }));
    const X = new Float64Array(steps * n), V = new Float64Array(steps * n), A = new Float64Array(steps * n);
    // the start: evenly spaced (or as o.place says), all at the speed o.vStart
    const pos = o.place ? o.place(len, L) : (() => { const p = []; let acc = 0; const gap = (L - len.reduce((s, x) => s + x, 0)) / n; for (let i = 0; i < n; i++) { p.push(acc); acc += len[i] + gap; } return p; })();
    for (let i = 0; i < n; i++) { X[i] = pos[i]; V[i] = o.vStart ? o.vStart(i) : (o.v0Start ?? 0); }
    const events = o.events || [];               // [{ i, t0, t1, v0 | decel }]
    // { i, t0, t1?, u } vehicle i holds a steady speed from t0 (until t1), braking only for safety (Stern et al. 2018's FollowerStopper
    // idea). u in m/s, or 'mean': the flow's average speed over the 20 s before t0 (driving at the average, it stops
    // catching up with each wave and lets a gap open ahead: the waves behind it fade)
    const ctl = o.control ? { ...o.control } : null;
    const gapOf = (k, i, j) => { let d = X[k * n + j] - X[k * n + i]; d -= Math.floor(d / L) * L; if (n === 1) d = L; return d - len[j]; };
    for (let k = 0; k < steps - 1; k++) {
      const t = k * dt;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n, p = P[i], kd = Math.max(0, k - p.tau);             // the driver reacts to what they saw tau ago
        const s = Math.max(0.1, gapOf(kd, i, j)), v = V[kd * n + i], dv = v - V[kd * n + j];
        let v0 = p.v0, brake = 0;
        for (const e of events) if (e.i === i && t >= e.t0 && t < e.t1) { if (e.v0 != null) v0 = e.v0; if (e.decel) brake = e.decel; }
        const sStar = p.s0 + Math.max(0, v * p.T + (v * dv) / (2 * Math.sqrt(p.a * p.b)));
        let acc = p.a * (1 - Math.pow(Math.max(0, V[k * n + i]) / v0, 4) - Math.pow(sStar / s, 2));
        if (brake) acc = Math.min(acc, -brake);                                    // a gentle touch of the brakes: { decel } m/s²
        if (ctl && ctl.i === i && t >= ctl.t0 && t < (ctl.t1 ?? Infinity)) {      // the controlled car: a steady speed, no overreaction
          if (typeof ctl.u !== 'number') {                                          // 'mean': the flow's average over the last 20 s
            let sum = 0, c = 0; for (let q = Math.max(0, k - Math.round(20 / dt)); q <= k; q++) for (let m = 0; m < n; m++) { sum += V[q * n + m]; c++; }
            ctl.u = sum / c * (ctl.f ?? 1);
          }
          // a soft envelope: the speed it allows itself falls smoothly as the gap closes (a long time gap Tav), and it
          // changes speed gently, so it never has to brake hard; the gap ahead becomes the buffer that swallows the waves
          const sNow = Math.max(0.1, gapOf(k, i, j)), vNow = V[k * n + i];
          const vCmd = Math.min(ctl.u, Math.max(0, (sNow - p.s0 - 1) / (ctl.Tav ?? 2.5)));
          acc = Math.max(-(ctl.dec ?? 0.7), Math.min(ctl.acc ?? 0.4, (ctl.k ?? 0.6) * (vCmd - vNow)));
          const sMin = p.s0 + vNow * 0.5;                                           // the last resort: a real brake when too close
          if (sNow < sMin) acc = Math.min(acc, p.a * (1 - Math.pow(sMin / sNow, 2)));
        }
        acc = Math.max(-8, Math.min(p.a, acc));
        A[k * n + i] = acc;
      }
      for (let i = 0; i < n; i++) {
        const v = V[k * n + i], acc = A[k * n + i];
        let v1 = v + acc * dt; if (v1 < 0) v1 = 0;
        X[(k + 1) * n + i] = X[k * n + i] + (v + v1) * 0.5 * dt; V[(k + 1) * n + i] = v1;
      }
      for (let i = 0; i < n; i++) {                                                 // no vehicle may enter the one ahead
        const j = (i + 1) % n, g = gapOf(k + 1, i, j);
        if (g < 0.3) { X[(k + 1) * n + i] -= 0.3 - g; V[(k + 1) * n + i] = Math.min(V[(k + 1) * n + i], V[(k + 1) * n + j]); }
      }
    }
    for (let i = 0; i < n; i++) A[(steps - 1) * n + i] = A[(steps - 2) * n + i];
    const state = (t) => {
      const u = Math.max(0, Math.min(steps - 1.000001, t / dt)), k = Math.floor(u), f = u - k;
      const x = new Float64Array(n), v = new Float64Array(n), a = new Float64Array(n);
      for (let i = 0; i < n; i++) {
        x[i] = X[k * n + i] + (X[(k + 1) * n + i] - X[k * n + i]) * f;
        v[i] = V[k * n + i] + (V[(k + 1) * n + i] - V[k * n + i]) * f;
        a[i] = A[k * n + i] + (A[(k + 1) * n + i] - A[k * n + i]) * f;
      }
      return { x, v, a };
    };
    const minV = (i, t0, t1) => { let m = Infinity; for (let k = Math.max(0, Math.floor(t0 / dt)); k <= Math.min(steps - 1, Math.ceil(t1 / dt)); k++) m = Math.min(m, V[k * n + i]); return m; };
    return { L, n, dt, steps, T: (steps - 1) * dt, len, kind, P, X, V, A, state, minV };
  }

  const api = { ring, KINDS, mulberry32 };
  if (typeof window !== 'undefined') window.TRAFFIC = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
