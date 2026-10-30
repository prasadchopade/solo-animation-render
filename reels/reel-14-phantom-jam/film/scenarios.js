// The reel's four simulations (engine/traffic.js), shared by film.js (in the page) and the tuning scripts (in Node), so the
// film shows exactly what was measured. Drivers: the Intelligent Driver Model with a reaction delay. One setting for every
// human driver, found by search (docs/research.md, "the simulation"): on Sugiyama's ring they cruise at a steady 26 km/h
// until one of them touches the brakes (26 → 22 km/h); the followers dip 20, 18, 12 and the fourth one stops 5.3 s later;
// one jam then circles the ring, moving backwards at ~10 km/h (highway jams: 15 ± 5 km/h).
(() => {
  const TR = typeof window !== 'undefined' ? window.TRAFFIC : require('../../../engine/traffic.js');
  const HUMAN = { v0: 14, Tgap: 0.6, tau: 0.6, a: 1.6, s0: 1.5, b: 1.6 };
  // Stern's drivers, a little calmer (0.4 s): without control their ring still falls into stop-and-go (30 hard brakes in
  // 20 s, 87 stopped car-seconds in 30 s); one car holding the flow's average speed with a soft buffer dissolves it
  // (speed spread 15.7 → 0.4 km/h, no hard brakes, average 20.4 → 22.2 km/h)
  const CALM = { ...HUMAN, tau: 0.4 };
  const AV = { u: 'mean', f: 1.0, Tav: 6, k: 0.3, acc: 0.3, dec: 0.5 };
  const DT = 0.05;
  const steady = (gap, P = HUMAN) => {                       // the IDM's steady speed for a gap (m/s)
    let lo = 0, hi = P.v0 * 0.999;
    for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2, se = (P.s0 + m * P.Tgap) / Math.sqrt(1 - Math.pow(m / P.v0, 4)); if (se < gap) lo = m; else hi = m; }
    return lo;
  };
  const driver = (P = HUMAN) => () => ({ a: P.a, T: P.Tgap, v0: P.v0, s0: P.s0, b: P.b, tau: Math.round(P.tau / DT) });

  // 1 · Sugiyama et al. 2008: 22 cars on a 230 m circle, one rule: keep a steady speed. Car 0 touches the brakes at 10 s.
  function sugiyama() {
    const L = 230, n = 22, gap = L / n - 4.4, v = steady(gap);
    const sim = TR.ring({ length: L, n, T: 140, dt: DT, ...HUMAN, vStart: () => v, driver: driver(), events: [{ i: 0, t0: 10, t1: 11.5, decel: 0.8 }] });
    return Object.assign(sim, { tp: 10, tpEnd: 11.5, slowed: 0, vSteady: v });
  }

  // 2 · Stern et al. 2018: a 260 m ring, 22 vehicles; waves form; from tc, car 11 holds a steady speed (a self-driving car
  // under control) and only brakes for safety; the waves behind it fade.
  function stern() {
    const L = 260, n = 22, gap = L / n - 4.4, v = steady(gap, CALM), tc = 40;
    const sim = TR.ring({ length: L, n, T: 150, dt: DT, ...CALM, vStart: () => v, driver: driver(CALM),
      events: [{ i: 3, t0: 6, t1: 7.5, decel: 0.9 }], control: { i: 11, t0: tc, ...AV } });
    return Object.assign(sim, { tc, av: 11, vSteady: v });
  }

  // 3 · a Bengaluru road at night (the hook): three lanes, each a long loop, mixed vehicles. Each lane starts as one dense
  // queue that has just been released from a standstill nobody caused: the front drives off into empty road, the back keeps
  // growing as free traffic arrives and brakes. (Lanes are separate loops: no lane changes.)
  const MIX = ['car', 'car', 'auto', 'car', 'bike', 'car', 'suv', 'auto', 'car', 'bus', 'car', 'bike', 'car', 'auto', 'car', 'car', 'suv', 'bike'];
  function road(seed, lanes = 3, Lr = 1800, nFree = 30, nQueue = 75) {
    return Array.from({ length: lanes }, (_, l) => {
      const r = TR.mulberry32(seed * 31 + l * 7), n = nFree + nQueue;
      const kinds = (i) => MIX[(i * 7 + l * 5 + Math.floor(r() * 3)) % MIX.length];
      const freeGap = 16, vFree = steady(freeGap);
      const sim = TR.ring({ length: Lr, n, T: 80, dt: DT, ...HUMAN, kinds, driver: driver(),
        place: (len) => { const p = []; let acc = 0; for (let i = 0; i < n; i++) { p.push(acc); acc += len[i] + (i < nFree ? freeGap + (r() - 0.5) * 4 : 2.0 + r() * 0.8); } return p.map((x) => x + l * 23); },
        vStart: (i) => (i < nFree ? vFree : 0) });
      return Object.assign(sim, { nFree, vFree });
    });
  }

  // 4 · the ending, on the same road: three lanes going your way at one density (130 vehicles on a 1.8 km loop each), every
  // vehicle starting at the steady speed with equal bumper gaps. The middle lane holds "you" (a car), keeping a gap of 3.5 s
  // from the start (a FollowerStopper-style controller). At 44 s a driver 8 ahead of you brakes hard (2.5 m/s² for 3 s);
  // the slowdown reaches you at ~51 s; you ease off (38 → 22 km/h) and nobody behind you stops, where without your gap the
  // same slowdown stops the cars behind you by 54 s (docs/research.md). The road ahead clears; at tTap you tap the brakes
  // (3.5 m/s² for 1 s) for no reason and drive on: the car behind brakes harder, the next harder still, and two stop by
  // ~64.5 s, the jam left behind you. The side lanes, perturbed three times each, fall into stop-and-go.
  function laneOf(seed, n, L, o = {}) {
    const r = TR.mulberry32(seed), av = o.av ?? -1;
    const kl = Array.from({ length: n }, (_, i) => (i === av ? 'car' : MIX[(i * 5 + 3 + Math.floor(r() * 3)) % MIX.length]));
    const len = kl.map((k) => TR.KINDS[k]), sum = len.reduce((a, x) => a + x, 0);
    let v = 8, gap = 9, G = 0;                                  // your gap G = s0 + 1 + Tav·v lets you cruise at the others' steady speed v
    for (let k = 0; k < 40; k++) { if (o.Tav) G = CALM.s0 + 1 + o.Tav * v; gap = (L - sum - G) / (n - (o.Tav ? 1 : 0)); v = steady(gap, CALM); }
    let ki = 0;
    const place = (ln) => { const q = []; let acc = 0; for (let i = 0; i < n; i++) { q.push(acc); acc += (i === av ? G : gap) + ln[(i + 1) % n]; } return q; };   // X is a vehicle's front
    const sim = TR.ring({ length: L, n, T: 70, dt: DT, ...CALM, kinds: () => kl[ki++], place, driver: driver(CALM), vStart: () => v,
      events: o.events || [], control: o.control ? { ...o.control, u: v } : null });
    return Object.assign(sim, { av, vSteady: v, G });
  }
  function roadFix(tTap = 61) {
    return [0, 1, 2].map((l) => (l === 1
      ? Object.assign(laneOf(501, 130, 1800, { av: 60, Tav: 3.5, events: [{ i: 68, t0: 44, t1: 47, decel: 2.5 }, { i: 60, t0: tTap, t1: tTap + 1, decel: 3.5 }],
        control: { i: 60, t0: 0, t1: tTap, ...AV, Tav: 3.5 } }), { tTap })
      : laneOf(700 + l, 130, 1800, { events: [{ i: 20 + l * 7, t0: 4 + l * 3, t1: 6 + l * 3, decel: 2.0 }, { i: 70 + l * 9, t0: 18 + l * 2, t1: 20 + l * 2, decel: 2.0 },
        { i: 110 + l * 3, t0: 30 + l, t1: 32 + l, decel: 2.0 }] })));
  }

  // 5 · the other carriageway (India drives on the left: it is on the right of the screen, coming down): free traffic
  function oncoming(seed = 9, T = 90) {
    return Array.from({ length: 3 }, (_, l) => {
      const L = 700, n = 26 - l * 4, r = TR.mulberry32(seed * 13 + l);
      const kinds = (i) => MIX[(i * 3 + l * 7 + Math.floor(r() * 4)) % MIX.length];
      const probe = TR.ring({ length: L, n, T: 0.1, dt: DT, ...CALM, kinds });
      const gap = (L - probe.len.reduce((s, x) => s + x, 0)) / n, v = steady(gap, CALM);
      return TR.ring({ length: L, n, T, dt: DT, ...CALM, kinds, driver: driver(CALM), vStart: () => v,
        place: (len) => { const p = []; let acc = r() * 20; for (let i = 0; i < n; i++) { p.push(acc); acc += len[i] + gap + (r() - 0.5) * gap * 0.3; } return p; } });
    });
  }

  const api = { HUMAN, CALM, AV, DT, steady, sugiyama, stern, road, roadFix, oncoming };
  if (typeof window !== 'undefined') window.SCENARIOS = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
