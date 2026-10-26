// Reel 11 · Dig Through India. The clean style (engine/clean.js), a cutaway slice of the Earth and the dot globe
// (engine/globe.js). A spade bites into the Thar at night; the camera pulls out to a slice of the whole Earth with a
// tunnel straight down. You'd think it ends in America: it doesn't. On the globe, every Indian city's other side splashes
// into the Pacific (an upside-down India of splashes), except a patch of desert outside Jaisalmer, which lands on Easter
// Island, and its stone heads rise. Then the dig: the deepest hole ever is a scratch; the heat climbs to the core; a small
// explorer jumps, shoots through the centre (the Earth turns over around them) and pops out beside the moai 38 minutes
// later. The root cause: only ~15% of land has land on its other side (the globe lights it). And with no air: back and
// forth, forever, into the hole of frame 0. 30 fps, no motion blur. Pure functions of t.
(() => {
  const { W, H, scene, canvas, clamp, lerp, ease, mulberry32, put } = C;
  const K = window.KIT, U = window.UI, CL = window.CLEAN, GB = window.GLOBE;
  const { hit, tb, words, clear } = K;
  const { txt, measure, chip, pin, shadow } = CL;
  C.fonts = ['700 condensed 100px Bahn', '600 semi-condensed 64px Bahn', '700 semi-condensed 46px Bahn', '600 100px Bahn', '400 30px Bahn', '400 30px Mono', '700 30px Mono'];
  const TAU = Math.PI * 2, PI = Math.PI, eio = ease.inOut, eo = ease.out;
  const COL = {
    ...CL.COL,
    sand: '#c99650', sandL: '#e0b46a', sandD: '#9a6a32', sandDD: '#74491f', dune: '#8a6a4a', duneD: '#6b5139',
    fort: '#efb65c', fortD: '#b97d36', fortDD: '#8a5a26',
    crust: '#6e5038', crustD: '#563d2a', mantleO: '#7c2417', mantleI: '#e2582a', coreO: '#ff8f2e', coreI: '#ffc75a', inner: '#fff1c9', innerD: '#ffd27a',
    sea: '#2b6496', seaD: '#1d4a74', seaL: '#5f9fd0', land: '#7d8a52', grass: '#5f8f4e', grassD: '#4a7a3d', grassL: '#86b36a',
    stone: '#76716b', stoneD: '#57534e', stoneDD: '#3c3935', pukao: '#a5482e',
    suit: '#f0e6d2', suitD: '#c9bba0', helmet: '#ffd23f', helmetD: '#d9a91c', visor: '#1b2436', boot: '#2b2f3a',
    splash: '#e8f4ff', ripple: 'rgba(200,230,255,', steel: '#9aa6b8', steelD: '#5c6879',
  };

  // ------------------------------------------------------------------ timing (the narration's words)
  const FB = { s01: 0.25, s02: 4.15, s03: 10.0, s04: 14.95, s05: 19.25, s06: 23.95, s07: 29.3, s08: 33.2, s09: 37.45, s10: 43.55 };
  const has = (p) => words(p).length > 0;
  const at = (p) => (has(p) ? words(p)[0].t0 : FB[p]);
  const wi = (p, i) => (has(p) && words(p)[i] ? words(p)[i].t0 : at(p) + 0.3 * i);
  const LINES = ['s01', 's02', 's03', 's04', 's05', 's06', 's07', 's08', 's09', 's10'];
  let T = null;
  function times() {
    if (T) return T;
    T = {
      a: Object.fromEntries(LINES.map((p) => [p, at(p)])),
      down: wi('s01', 2), india1: wi('s01', 4), think: wi('s01', 7), america: wi('s01', 10),
      wont: wi('s02', 1), delhi: wi('s02', 2), pacific: wi('s02', 7), sodo: wi('s02', 8), mumbai: wi('s02', 10), bengaluru: wi('s02', 11), chennai: wi('s02', 12), kolkata: wi('s02', 14),
      almost: wi('s03', 0), india3: wi('s03', 3), does: wi('s03', 4), big: wi('s03', 6), exception: wi('s03', 7), patch: wi('s03', 9), desert: wi('s03', 11), jaisalmer: wi('s03', 13),
      easter: wi('s04', 4), giant: wi('s04', 8), stone: wi('s04', 9), heads: wi('s04', 10),
      dig: wi('s05', 1), deepest: wi('s05', 3), twelve: wi('s05', 8), barely: wi('s05', 10), scratch: wi('s05', 12),
      below: wi('s06', 0), hotter: wi('s06', 3), core: wi('s06', 6), surface6: wi('s06', 11), sun: wi('s06', 14),
      jump: wi('s07', 1), shoot: wi('s07', 3), centre: wi('s07', 6), satellite: wi('s07', 10),
      thirty: wi('s08', 0), later: wi('s08', 2), pop: wi('s08', 4), heads8: wi('s08', 10),
      root: wi('s09', 1), splashes: wi('s09', 6), only: wi('s09', 7), fifteen: wi('s09', 8), land9: wi('s09', 11), other9: wi('s09', 16),
      tunnel: wi('s10', 6), fall: wi('s10', 8), back: wi('s10', 9), forth: wi('s10', 11), forever: wi('s10', 12),
      end: tb('end'),
    };
    T.globeIn = T.delhi - 0.35;                       // the Pacific globe covers the slice
    T.islandIn = T.easter - 0.3;                      // the slice returns, close on Easter Island
    T.jumpAt = T.jump + 0.15;                         // the explorer leaves the rim
    T.fallStart = T.jumpAt + 0.35;
    T.arrive = Math.max(T.pop, T.fallStart + 2.6);    // pops out beside the moai
    T.rootIn = T.a.s09 - 0.35; T.rootOut = T.a.s10 - 0.35;
    T.land = T.root - 0.15 + 0.95 * 0.7;              // the root mark's dot lands 70 % into its draw
    return T;
  }

  // ------------------------------------------------------------------ places and the globe
  const anti = ([lon, lat]) => [lon > 0 ? lon - 180 : lon + 180, -lat];
  const CITY5 = [['DELHI', [77.21, 28.61], 0, 52], ['MUMBAI', [72.88, 19.08], -96, 0], ['BENGALURU', [77.59, 12.97], -112, -6], ['CHENNAI', [80.27, 13.08], 92, -6], ['KOLKATA', [88.36, 22.57], 50, 0]];
  const MORE = [[73.86, 18.52], [78.49, 17.39], [72.57, 23.02], [75.79, 26.91], [80.95, 26.85], [85.14, 25.59], [77.41, 23.26], [91.74, 26.14], [76.27, 9.93], [76.78, 30.73],
    [74.80, 34.08], [77.58, 34.15], [91.89, 25.58], [85.82, 20.30], [81.63, 21.25], [85.31, 23.34], [79.09, 21.15], [75.86, 22.72], [72.83, 21.17], [82.97, 25.32],
    [74.87, 31.63], [78.03, 30.32], [73.83, 15.49], [76.94, 8.52], [78.12, 9.93], [83.22, 17.69], [93.94, 24.82], [92.73, 11.62], [88.61, 27.33], [93.61, 27.08],
    [76.96, 11.02], [74.86, 12.91], [73.02, 26.24], [73.31, 28.02], [73.71, 24.59], [78.01, 27.18], [80.33, 26.45], [73.79, 20.00], [73.18, 22.31], [69.67, 23.24], [77.55, 8.08], [77.17, 31.10]];
  const EASTER = [-109.35, -27.12], PATCH = [70.63, 27.12];          // Easter Island · its antipode, in the desert outside Jaisalmer
  const ISLAND = [[-109.23, -27.08], [-109.42, -27.06], [-109.45, -27.20], [-109.30, -27.15]];
  const RNG = mulberry32(11), ORDER = MORE.map((m, i) => [RNG(), i]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  const G = GB.make({
    fine: { at: [82, 22], box: [55, 0, 125, 48] },
    kind: (lon, lat) => (GB.landOf(lon > 0 ? lon - 180 : lon + 180, -lat) ? 'anti' : 0),   // land whose other side is land
  });
  function globeCam(keys, t) {                      // [t0, d, lon, lat, R, cy]: each move eases from the last
    let cur = keys[0].slice(2);
    for (let i = 1; i < keys.length; i++) {
      const [t0, d, ...tg] = keys[i], k = eio(clamp((t - t0) / d));
      if (k <= 0) break;
      cur = cur.map((v, j) => (j === 2 ? Math.exp(lerp(Math.log(v), Math.log(tg[j]), k)) : lerp(v, tg[j], k)));
    }
    return GB.view(cur[0], cur[1], cur[2], 540, cur[3]);
  }
  const camP = (t) => {
    const T = times();
    return globeCam([
      [-1, 0, -101, -24, 2100, 1010],
      [T.sodo - 0.2, 1.4, -99, -19, 2200, 1000],            // the five
      [T.almost - 0.1, 1.0, -98, -21, 1750, 1010],          // out: the whole upside-down India of splashes
      [T.big - 0.1, 1.3, -107, -25.5, 2600, 1040],          // toward Easter Island
      [T.easter - 0.65, 0.75, -109.35, -27.12, 14000, 1050], // dive onto it
    ], t);
  };
  const SEA = ['#2a6fa6', '#1d5486', '#123a63'];
  const WAVES = (() => { const r = mulberry32(17), o = []; for (let i = 0; i < 90; i++) o.push([-125 + r() * 45, -42 + r() * 40, r() * 6]); return o; })();
  const camA = (t) => globeCam([[-1, 0, 86, 23, 980, 1190], [times().rootIn, 6, 92, 24, 1040, 1180]], t);

  // ------------------------------------------------------------------ the slice: a cutaway Earth (units: the radius is 430)
  const SX = 540, SY = 1000, RE = 430, R_CRUST = 423, R_MANTLE = 411, R_OCORE = 235, R_ICORE = 82;
  function zoomAnchored(A, B, u, ay) {              // log-zoom from A to B keeping the point (0, ay) sliding smoothly on screen
    const Z = Math.exp(lerp(Math.log(A.Z), Math.log(B.Z), u));
    const dA = (ay - A.fy) * A.Z, dB = (ay - B.fy) * B.Z;
    return { Z, rot: lerp(A.rot, B.rot, u), fy: ay - lerp(dA, dB, u) / Z };
  }
  const sstep = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
  // the explorer's path along the tunnel (y in slice units; the surface is at ±430, a little beyond is "popped out")
  function legs() {
    const T = times(), A = 437;
    const L = [
      [T.fallStart, T.arrive, -430, A],                                     // the first fall, through the centre
      [T.fall - 0.25, T.back + 0.35, A, -A],                                // back
      [T.forth - 0.5, T.forth + 0.3, -A, A],                                // and forth
      [T.forever - 0.15, T.forever + 0.75, A, -A],                          // forever: faster and faster
      [T.forever + 0.75, T.forever + 1.3, -A, A],
      [T.forever + 1.3, T.forever + 1.75, A, -A],
    ];
    for (let i = 1; i < L.length; i++) {             // a swing never starts before the last one ends (else the explorer jumps)
      L[i][0] = Math.max(L[i][0], L[i - 1][1]); L[i][1] = Math.max(L[i][1], L[i][0] + 0.35);
    }
    return L;
  }
  function figY(t) {
    const T = times(), L = legs();
    if (t < T.fallStart) return -430 - 3 * Math.sin(PI * clamp((t - T.jumpAt) / 0.35));   // the hop off the rim
    let y = -430;
    for (const [t0, t1, a, b] of L) {
      if (t < t0) return y;
      if (t <= t1) { const u = (t - t0) / (t1 - t0); return (a + b) / 2 + (a - b) / 2 * Math.cos(PI * u); }   // simple harmonic: fastest at the centre
      y = b;
    }
    const tEnd = L[L.length - 1][1];
    return lerp(y, -424, eio(clamp((t - tEnd - 0.2) / 0.5)));             // the last drop back into the Jaisalmer hole
  }
  function figX(t) {                                // beside the hole until the jump
    const T = times();
    return lerp(4.2, 0, eio(clamp((t - T.jumpAt) / 0.3)));
  }
  const figAngle = (y) => PI * sstep((y + 60) / 120);   // head away from the centre: 0 in the top half, π in the bottom
  function probeY(t) {                              // the drill head in s06: from the surface to the centre
    const T = times();
    return lerp(-428, 0, eio(clamp((t - (T.below - 0.05)) / Math.max(1.5, T.sun - T.below - 0.1))));
  }
  function sliceCam(t) {
    const T = times();
    const whole = { Z: 1, rot: 0, fy: 0 };
    if (t < T.islandIn - 0.05) {                    // the hook: the desert, pulling out to the whole Earth
      const u = eio(clamp((t - (T.down - 0.2)) / Math.max(1.6, T.america - T.down + 0.35)));
      return zoomAnchored(HOOK, whole, u, -430);
    }
    if (t < T.below - 0.2) {                        // Easter Island close; then "Now dig": pull out, and turn the Earth over
      const isl = { Z: lerp(30, 34, clamp((t - T.islandIn) / Math.max(0.5, T.a.s05 - T.islandIn))), rot: PI, fy: 436.5 };
      const out = zoomAnchored(isl, { Z: 1.25, rot: PI, fy: 0 }, eio(clamp((t - (T.a.s05 - 0.1)) / 0.65)), 430);
      const u = eio(clamp((t - (T.a.s05 + 0.5)) / 0.65));
      return u > 0 ? { Z: 1.25, rot: lerp(PI, 0, u), fy: lerp(0, -110, u) } : out;
    }
    if (t < T.a.s07 - 0.3) {                        // the descent: the camera rides down with the drill head
      const u = eio(clamp((t - (T.below - 0.2)) / 0.8));
      return zoomAnchored({ Z: 1.25, rot: 0, fy: -110 }, { Z: 2.1, rot: 0, fy: probeY(t) + 70 }, u, -430);
    }
    if (t < T.rootIn + 0.2) {                       // the jump (close on the rim), the fall (following the explorer), the arrival
      const s0 = zoomAnchored({ Z: 2.1, rot: 0, fy: 70 }, { Z: 16, rot: 0, fy: -433.5 }, eio(clamp((t - (T.a.s07 - 0.3)) / 0.8)), -430);
      const y = figY(t), fol = { Z: 2.8, rot: PI * sstep((y + 70) / 140), fy: clamp(y, -400, 400) };
      const s1 = t < T.fallStart ? s0 : zoomAnchored(s0, fol, eio(clamp((t - T.fallStart) / 0.6)), fol.fy);
      const u = eio(clamp((t - (T.arrive - 0.55)) / 0.85));
      return u > 0 ? zoomAnchored(s1, { Z: lerp(30, 32, clamp((t - T.arrive) / 3)), rot: PI, fy: 436.5 }, u, 430) : s1;
    }
    const u = eio(clamp((t - (T.end - 1.5)) / 1.4));   // back and forth on the whole Earth, then into the Jaisalmer hole
    return zoomAnchored(whole, HOOK, u, -430);
  }
  const HOOK = { Z: 34, rot: 0, fy: -434.4 };         // frame 0: the desert, its surface at y ≈ 1150, a tall night sky
  const toS = (c, x, y) => { const s = Math.sin(c.rot), co = Math.cos(c.rot), dx = x * c.Z, dy = (y - c.fy) * c.Z; return [SX + dx * co - dy * s, SY + dx * s + dy * co]; };
  const applyCam = (g, c) => { g.translate(SX, SY); g.rotate(c.rot); g.scale(c.Z, c.Z); g.translate(0, -c.fy); };
  const surfY = (x) => RE - Math.sqrt(Math.max(0, RE * RE - x * x));   // how far the ground drops at x from the top/bottom point

  const STARS = (() => { const r = mulberry32(5), o = []; for (let i = 0; i < 140; i++) o.push([r() * W, r() * H, 0.6 + r() * 1.8, r()]); return o; })();
  function space(g, t, a = 1) {
    CL.bg(g, 'rgba(120,150,255,0.05)', 900);
    g.save(); g.globalAlpha = a;
    for (const [x, y, r, ph] of STARS) { g.fillStyle = `rgba(235,240,255,${(0.25 + 0.45 * (0.5 + 0.5 * Math.sin(t * 1.3 + ph * 20))) * 0.8})`; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
    g.restore();
  }
  // the land and sea around the slice's rim (angles from the top, clockwise): India up top, the Pacific round the bottom
  const RIM = [[-0.75, 0.62, 'land'], [0.62, 2.55, 'sea'], [2.55, 2.75, 'land'], [2.75, 3.12, 'sea'], [3.12, 3.17, 'isle'], [3.17, 4.2, 'sea'], [4.2, 4.6, 'land'], [4.6, 5.53, 'sea']];
  function earth(g, c, t) {
    g.save(); applyCam(g, c);
    let gr = g.createRadialGradient(0, 0, R_OCORE, 0, 0, R_MANTLE);
    gr.addColorStop(0, COL.mantleI); gr.addColorStop(0.55, '#b83e1f'); gr.addColorStop(1, COL.mantleO);
    g.fillStyle = COL.crust; g.beginPath(); g.arc(0, 0, R_CRUST, 0, TAU); g.fill();
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R_MANTLE, 0, TAU); g.fill();
    gr = g.createRadialGradient(0, 0, R_ICORE, 0, 0, R_OCORE); gr.addColorStop(0, COL.coreI); gr.addColorStop(1, COL.coreO);
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R_OCORE, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,240,190,0.35)'; g.lineWidth = 3 / Math.max(1, c.Z * 0.6);                  // the liquid outer core turning
    for (let i = 0; i < 7; i++) { const r = R_ICORE + 18 + i * 19, a0 = t * (0.35 + 0.05 * i) * (i % 2 ? 1 : -1) + i; g.beginPath(); g.arc(0, 0, r, a0, a0 + 1.2 + 0.3 * (i % 3)); g.stroke(); }
    gr = g.createRadialGradient(0, 0, 4, 0, 0, R_ICORE); gr.addColorStop(0, '#fffdf3'); gr.addColorStop(0.7, COL.inner); gr.addColorStop(1, COL.innerD);
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R_ICORE, 0, TAU); g.fill();
    gr = g.createRadialGradient(0, 0, R_ICORE * 0.6, 0, 0, R_ICORE * 1.9); gr.addColorStop(0, 'rgba(255,250,220,0.35)'); gr.addColorStop(1, 'rgba(255,250,220,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R_ICORE * 1.9, 0, TAU); g.fill();
    for (const [a0, a1, k] of RIM) {                // the rim: sea and land
      g.strokeStyle = k === 'sea' ? COL.sea : k === 'isle' ? COL.grass : k === 'land' && a0 < 0 ? COL.sand : COL.land;
      g.lineWidth = RE - R_CRUST; g.beginPath(); g.arc(0, 0, (RE + R_CRUST) / 2, a0 - PI / 2, a1 - PI / 2); g.stroke();
    }
    g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 1.2 / Math.max(1, c.Z * 0.5); g.beginPath(); g.arc(0, 0, RE, 0, TAU); g.stroke();
    g.restore();
  }
  function strata(g, c, a, bottom) {               // close up, the ground under the desert (or the island) is sand and rock
    if (a <= 0.01) return;
    g.save(); applyCam(g, c); g.globalAlpha *= a;
    g.beginPath(); g.arc(0, 0, RE, 0, TAU); g.clip();
    const cols = bottom ? ['#4f4a44', '#3f3a35', '#5b544c', '#46403a'] : [COL.sand, '#b88543', '#a87638', '#c1904b', '#9b6c33', '#8a5f2c'];
    const a0 = (bottom ? PI / 2 : -PI / 2) - 0.22, a1 = a0 + 0.44;
    for (let i = 0; i < 14; i++) {
      g.strokeStyle = cols[i % cols.length]; g.lineWidth = 4.2; g.beginPath(); g.arc(0, 0, RE - 2 - i * 4, a0, a1); g.stroke();
    }
    g.restore();
  }
  function tunnel(g, c, y0, y1, dashed, a = 1) {    // the shaft along the axis, from y0 to y1
    if (a <= 0.01 || Math.abs(y1 - y0) < 0.01) return;
    const [x0, sy0] = toS(c, 0, y0), [x1, sy1] = toS(c, 0, y1);
    g.save(); g.globalAlpha *= a; g.lineCap = 'round';
    if (dashed) { g.strokeStyle = 'rgba(255,138,31,0.95)'; g.lineWidth = 8; g.setLineDash([6, 16]); }
    else { g.strokeStyle = '#0a0d16'; g.lineWidth = Math.max(5, 1.25 * c.Z); }
    g.beginPath(); g.moveTo(x0, sy0); g.lineTo(x1, sy1); g.stroke();
    if (!dashed) { g.strokeStyle = 'rgba(255,200,140,0.18)'; g.lineWidth = Math.max(1.5, 0.25 * c.Z); g.setLineDash([]); g.beginPath(); g.moveTo(x0 + 0.5 * c.Z, sy0); g.lineTo(x1 + 0.5 * c.Z, sy1); g.stroke(); }
    g.restore();
  }

  // ------------------------------------------------------------------ the desert outside Jaisalmer (local units: x across, y down from the top point)
  function dune(g, x0, x1, h, col, seed) {
    const r = mulberry32(seed), p = [r() * 6, r() * 6];
    g.beginPath(); g.moveTo(x0, surfY(x0) + 1);
    for (let i = 0; i <= 40; i++) { const x = lerp(x0, x1, i / 40), u = i / 40; g.lineTo(x, surfY(x) - h * Math.pow(Math.sin(PI * u), 1.4) * (0.75 + 0.25 * Math.sin(u * 9 + p[0]))); }
    g.lineTo(x1, surfY(x1) + 1); g.closePath(); g.fillStyle = col; g.fill();
  }
  function fort(g, x, y, s, a = 1) {                // Jaisalmer's golden fort on its hill, floodlit at night
    g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha *= a;
    g.fillStyle = COL.fortDD; g.beginPath(); g.moveTo(-7, 0.6); g.quadraticCurveTo(-5.5, -2.2, -2.5, -2.6); g.lineTo(3.5, -2.8); g.quadraticCurveTo(6.5, -2.2, 7.5, 0.6); g.closePath(); g.fill();   // the hill
    g.fillStyle = COL.fortD; g.fillRect(-5.4, -4.6, 10.6, 2.2);
    g.fillStyle = COL.fort; g.fillRect(-5.4, -4.6, 5.8, 2.2);
    for (let i = 0; i < 6; i++) { const bx = -5 + i * 2; g.fillStyle = i < 3 ? COL.fort : COL.fortD; g.beginPath(); g.ellipse(bx, -3.5, 0.75, 1.5, 0, 0, TAU); g.fill(); }   // round bastions
    g.fillStyle = COL.fortD; g.fillRect(-2.2, -6.6, 4.4, 2.2); g.fillStyle = COL.fort; g.fillRect(-2.2, -6.6, 2.2, 2.2);   // the palace block
    for (let i = 0; i < 12; i++) { g.fillStyle = COL.fortDD; g.fillRect(-5.4 + i * 0.9, -4.9, 0.45, 0.35); }              // crenellations
    g.fillStyle = 'rgba(255,215,140,0.9)'; for (const [wx, wy] of [[-1.6, -5.6], [-0.4, -5.6], [0.8, -5.6], [-3.6, -3.7], [2.4, -3.7]]) g.fillRect(wx, wy, 0.4, 0.55);   // lit windows
    g.fillStyle = COL.fort; g.beginPath(); g.moveTo(-0.6, -6.6); g.lineTo(0, -7.8); g.lineTo(0.6, -6.6); g.closePath(); g.fill();
    g.restore();
  }
  function camelS(g, x, y, s) {                    // a camel's silhouette on a far dune
    g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#4a3a2c';
    g.beginPath(); g.ellipse(0, -1.6, 1.6, 0.7, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(-0.2, -2.2, 0.7, 0.55, 0, PI, 0); g.fill();
    g.beginPath(); g.moveTo(1.2, -1.9); g.quadraticCurveTo(1.8, -2.6, 2.0, -3.1); g.lineTo(2.5, -3.1); g.quadraticCurveTo(2.1, -2.2, 1.6, -1.4); g.closePath(); g.fill();
    g.lineWidth = 0.28; g.strokeStyle = '#4a3a2c'; for (const lx of [-1.1, -0.6, 0.6, 1.0]) { g.beginPath(); g.moveTo(lx, -1.2); g.lineTo(lx, 0); g.stroke(); }
    g.restore();
  }
  function shovel(g, t, a) {                        // the spade: two bites into the sand (frame 0, then "down")
    if (a <= 0.01) return;
    const T = times(), k1 = clamp(t / 0.12), lift = clamp((t - 0.45) / 0.3), k2 = clamp((t - (T.down - 0.2)) / 0.12);
    const dig = Math.max(k1 * (1 - lift), k2), ang = lerp(-0.55, -0.32, dig);
    g.save(); g.globalAlpha *= a; g.translate(-1.6, lerp(-6.5, -1.4, eo(dig))); g.rotate(ang);
    g.strokeStyle = '#7a4f28'; g.lineWidth = 0.55; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -9); g.stroke();
    g.strokeStyle = '#9b6a38'; g.lineWidth = 0.25; g.beginPath(); g.moveTo(0.1, -1); g.lineTo(0.1, -8.6); g.stroke();
    g.fillStyle = '#5a4630'; g.fillRect(-1.0, -9.5, 2.0, 0.55);
    g.fillStyle = COL.steelD; g.beginPath(); g.moveTo(-1.2, 0); g.lineTo(1.2, 0); g.lineTo(1.0, 2.4); g.quadraticCurveTo(0, 3.3, -1.0, 2.4); g.closePath(); g.fill();
    g.fillStyle = COL.steel; g.beginPath(); g.moveTo(-1.2, 0); g.lineTo(0, 0); g.lineTo(0, 3.0); g.quadraticCurveTo(-0.6, 2.9, -1.0, 2.4); g.closePath(); g.fill();
    g.restore();
  }
  function desert(g, c, t) {
    const T = times();
    g.save(); applyCam(g, c); g.translate(0, -RE);
    dune(g, -30, -3, 4.2, COL.duneD, 3); dune(g, 5, 32, 3.4, COL.duneD, 4);
    camelS(g, -11.5, surfY(11.5) - 3.0, 0.75);
    dune(g, -21, 0, 2.4, COL.dune, 5); dune(g, 14, 30, 2.0, COL.dune, 6);
    fort(g, 9, surfY(9) - 0.3, 0.85);
    dune(g, -9, 6, 1.0, COL.sandD, 7);
    g.fillStyle = COL.sand; g.beginPath(); g.moveTo(-50, surfY(50)); for (let i = 0; i <= 50; i++) { const x = -50 + i * 2; g.lineTo(x, surfY(x) - 0.4 * Math.sin(x * 0.6)); } g.lineTo(50, 8); g.lineTo(-50, 8); g.closePath(); g.fill();
    // the hole (the top of the tunnel), a rim of dug sand
    const hk = clamp(t / 0.15);
    if (hk > 0) {
      g.fillStyle = COL.sandL; g.beginPath(); g.ellipse(-2.2, -0.2, 1.8 * hk, 0.5 * hk, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(2.2, -0.15, 1.5 * hk, 0.45 * hk, 0, 0, TAU); g.fill();
      g.fillStyle = '#0a0d16'; g.beginPath(); g.ellipse(0, 0.15, 0.95 * hk, 0.32 * hk, 0, 0, TAU); g.fill();
    }
    shovel(g, t, 1 - clamp((t - (T.america - 0.6)) / 0.4));
    g.restore();
  }

  // ------------------------------------------------------------------ Easter Island (local units, drawn upright in its own frame at the bottom point)
  function moai(g, x, y, s, k, tilt = 0, hat = false) {   // a moai rising out of the ground (k 0 → 1), its back to the sea
    if (k <= 0.01) return;
    g.save(); g.translate(x, y); g.rotate(tilt); g.scale(s, s);
    g.beginPath(); g.rect(-3, -12, 6, 12); g.clip();                 // the ground hides what hasn't risen yet
    g.translate(0, (1 - eo(clamp(k))) * 7.2);
    g.fillStyle = COL.stoneD; g.beginPath(); g.roundRect(-1.35, -6.1, 2.7, 6.1, [0.9, 0.9, 0.1, 0.1]); g.fill();       // the head and body
    g.fillStyle = COL.stone; g.beginPath(); g.roundRect(-1.35, -6.1, 1.35, 6.1, [0.9, 0, 0, 0.1]); g.fill();
    g.fillStyle = COL.stoneDD; g.fillRect(-1.2, -4.6, 2.4, 0.5);                                                        // the heavy brow
    g.fillStyle = 'rgba(20,18,16,0.6)'; g.fillRect(-0.95, -4.15, 0.65, 0.42); g.fillRect(0.3, -4.15, 0.65, 0.42);       // the deep eyes
    g.fillStyle = COL.stoneDD; g.beginPath(); g.moveTo(-0.25, -4.1); g.lineTo(0.25, -4.1); g.lineTo(0.45, -2.75); g.lineTo(-0.45, -2.75); g.closePath(); g.fill();   // the long nose
    g.fillStyle = COL.stoneDD; g.fillRect(-0.55, -2.35, 1.1, 0.25);                                                     // the pressed lips
    g.fillStyle = COL.stoneD; g.fillRect(-1.6, -4.3, 0.3, 2.3); g.fillRect(1.3, -4.3, 0.3, 2.3);                        // the long ears
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(-1.35, -1.6, 2.7, 1.6);
    if (hat) { g.fillStyle = COL.pukao; g.beginPath(); g.roundRect(-1.0, -7.0, 2.0, 1.0, 0.3); g.fill(); }
    g.restore();
  }
  const MOAI = [[3.6, 0.85, 0.0, false], [5.9, 0.9, 0.15, true], [8.2, 0.84, 0.3, false], [10.5, 0.92, 0.45, false], [12.8, 0.86, 0.6, true]];
  function island(g, c, t) {
    const T = times();
    g.save(); applyCam(g, c); g.translate(0, RE); g.rotate(PI);
    g.fillStyle = COL.seaD; g.beginPath(); g.moveTo(-60, surfY(60) + 1.2); for (let i = 0; i <= 60; i++) { const x = -60 + i * 2; g.lineTo(x, surfY(x) + 1.0 + 0.2 * Math.sin(x * 0.9 + t * 2)); } g.lineTo(60, 9); g.lineTo(-60, 9); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(160,210,255,0.45)'; g.lineWidth = 0.18;
    for (let i = 0; i < 9; i++) { const x = -52 + i * 12 + Math.sin(t * 0.7 + i) * 1.5; if (Math.abs(x) < 26) continue; g.beginPath(); g.moveTo(x - 2, surfY(x) + 1.4); g.quadraticCurveTo(x, surfY(x) + 1.0, x + 2, surfY(x) + 1.4); g.stroke(); }
    // the island: Rano Raraku behind, a grassy plain, a beach into the sea
    g.fillStyle = COL.grassD; g.beginPath(); g.moveTo(-13, surfY(13)); g.quadraticCurveTo(-9, -7.5, -4.5, -6.2); g.lineTo(-3.4, -6.8); g.quadraticCurveTo(0, -4.5, 3, surfY(3)); g.closePath(); g.fill();
    g.fillStyle = COL.grass; g.beginPath(); g.moveTo(-13, surfY(13)); g.quadraticCurveTo(-9, -7.5, -4.5, -6.2); g.lineTo(-6.5, surfY(6)); g.closePath(); g.fill();
    g.fillStyle = '#d8c79a'; g.beginPath(); g.moveTo(-27, surfY(27) + 1.2); g.quadraticCurveTo(-25, surfY(25) - 0.2, -22, surfY(22) - 0.3); g.lineTo(22, surfY(22) - 0.3); g.quadraticCurveTo(25, surfY(25) - 0.2, 27, surfY(27) + 1.2); g.closePath(); g.fill();
    g.fillStyle = COL.grass; g.beginPath(); g.moveTo(-23, surfY(23)); for (let i = 0; i <= 46; i++) { const x = -23 + i; g.lineTo(x, surfY(x) - 0.45 - 0.25 * Math.sin(x * 0.8)); } g.lineTo(23, surfY(23) + 0.6); g.lineTo(-23, surfY(23) + 0.6); g.closePath(); g.fill();
    g.fillStyle = COL.grassL; for (let i = 0; i < 18; i++) { const x = -21 + i * 2.4; g.beginPath(); g.ellipse(x, surfY(x) - 0.55, 0.7, 0.18, 0, 0, TAU); g.fill(); }
    // the ahu (the stone platform) and the moai on it, rising one by one
    g.fillStyle = COL.stoneDD; g.fillRect(2.2, surfY(8) - 1.15, 12.3, 1.0); g.fillStyle = COL.stoneD; g.fillRect(2.2, surfY(8) - 1.15, 12.3, 0.35);
    MOAI.forEach(([mx, sc, dt, hat], i) => {
      const k = hit(t, T.giant - 0.1 + dt * 0.55, 'default'), nod = i === 0 ? 0.12 * sstep((t - (T.arrive + 0.4)) / 0.5) : 0;   // the nearest one turns to look
      moai(g, mx, surfY(mx) - 1.1, sc, Math.max(k, t > T.rootIn ? 1 : 0), -nod, hat);
    });
    g.restore();
    if (c.Z > 12) {                                 // name them, once they have risen
      const [mx, my] = toS(c, -8.2, RE + 8.6);
      label(g, mx, my, hit(t, T.giant + 0.5, 'playful') * (1 - clamp((t - (T.a.s05 - 0.2)) / 0.25)) * clamp((c.Z - 12) / 6), 'MOAI', '~900 GIANT STONE HEADS');
    }
    g.save(); applyCam(g, c); g.translate(0, RE); g.rotate(PI);
    // the tunnel's mouth on the island
    g.fillStyle = '#d8c79a'; g.beginPath(); g.ellipse(-2.0, surfY(2) - 0.45, 1.4, 0.4, 0, 0, TAU); g.fill();
    g.fillStyle = '#0a0d16'; g.beginPath(); g.ellipse(0, surfY(0) - 0.3, 0.95, 0.3, 0, 0, TAU); g.fill();
    g.restore();
  }

  // ------------------------------------------------------------------ the explorer (screen space: always readable)
  function explorer(g, x, y, ang, sz, t, pose) {   // (x, y) is where the feet are · pose: 'stand' | 'fall' | 'pop'
    g.save(); g.translate(x, y); g.rotate(ang); g.scale(sz / 70, sz / 70); g.translate(0, -25);
    const fl = pose === 'fall' ? 1 : 0;
    const armA = pose === 'stand' ? 0.3 : pose === 'pop' ? -2.65 : -2.3 + 0.35 * Math.sin(t * 17), armB = pose === 'stand' ? -0.3 : pose === 'pop' ? 2.65 : 2.3 + 0.35 * Math.sin(t * 15 + 1);
    const legA = 0.25 + 0.35 * Math.sin(t * 14) * fl, legB = -0.25 + 0.35 * Math.sin(t * 13 + 2) * fl;
    g.lineCap = 'round';
    for (const [ax, ay, a, len] of [[-9, -12, armA, 16], [9, -12, armB, 16]]) { g.strokeStyle = COL.suitD; g.lineWidth = 7; g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax + Math.sin(a) * len, ay + Math.cos(a) * len); g.stroke(); }
    for (const [lx, a] of [[-5, legA], [5, legB]]) { g.strokeStyle = COL.suitD; g.lineWidth = 8; g.beginPath(); g.moveTo(lx, 6); g.lineTo(lx + Math.sin(a) * 15, 6 + Math.cos(a) * 15); g.stroke(); g.fillStyle = COL.boot; g.beginPath(); g.arc(lx + Math.sin(a) * 15, 6 + Math.cos(a) * 15, 4.5, 0, TAU); g.fill(); }
    g.fillStyle = COL.suitD; g.beginPath(); g.roundRect(-11, -16, 22, 26, 9); g.fill();
    g.fillStyle = COL.suit; g.beginPath(); g.roundRect(-11, -16, 13, 26, [9, 0, 0, 9]); g.fill();
    g.fillStyle = '#e07a2b'; g.fillRect(-11, 1, 22, 3);                                                   // the belt
    g.fillStyle = COL.helmetD; g.beginPath(); g.arc(0, -24, 12, PI, 0); g.lineTo(13, -22); g.lineTo(-13, -22); g.closePath(); g.fill();
    g.fillStyle = COL.helmet; g.beginPath(); g.arc(-1, -24, 11, PI, -0.2); g.lineTo(-1, -22); g.lineTo(-13, -22); g.closePath(); g.fill();
    g.fillStyle = COL.visor; g.beginPath(); g.roundRect(-9, -22, 18, 8, 4); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(-6, -20.5, 5, 1.6);
    g.fillStyle = '#fff6c0'; g.beginPath(); g.arc(0, -31, 2.6, 0, TAU); g.fill();                         // the headlamp
    g.restore();
  }

  // ------------------------------------------------------------------ globe overlays
  function splashFx(g, x, y, k, s = 1, col = COL.splash) {   // a splash seen from above: a burst, a crown of drops, rings
    if (k <= 0 || k > 2.2) return;
    g.save();
    const b = 1 - eo(clamp(k / 0.25));
    if (b > 0) { g.fillStyle = `rgba(232,244,255,${(0.9 * b).toFixed(3)})`; g.beginPath(); g.arc(x, y, s * (6 + 16 * eo(clamp(k / 0.25))), 0, TAU); g.fill(); }
    for (let i = 0; i < 3; i++) {
      const u = clamp((k - i * 0.12) / 1.4); if (u <= 0 || u >= 1) continue;
      g.strokeStyle = COL.ripple + (0.8 * (1 - u)).toFixed(3) + ')'; g.lineWidth = s * 3 * (1 - u) + 1; g.beginPath(); g.ellipse(x, y, s * (8 + 70 * eo(u)), s * (6 + 52 * eo(u)), 0, 0, TAU); g.stroke();
    }
    const du = clamp(k / 0.6);
    if (du < 1) for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + 0.3, d = s * (10 + 46 * eo(du)); g.fillStyle = `rgba(232,244,255,${(1 - du).toFixed(3)})`; g.beginPath(); g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.75, s * 3 * (1 - du * 0.6), 0, TAU); g.fill(); }
    g.restore();
  }
  function islandIcon(g, v, a = 1, glow = 0) {     // Easter Island on the globe: drawn bigger than life until the camera is close
    const P = ISLAND.map(([lo, la]) => GB.prLL(v, lo, la)), cx = P.reduce((s, p) => s + p[0], 0) / P.length, cy = P.reduce((s, p) => s + p[1], 0) / P.length;
    // ~110 px across at least: big enough to read as LAND at phone size when the Jaisalmer point lands on it (26 px was a speck)
    const w = Math.hypot(P[0][0] - P[2][0], P[0][1] - P[2][1]) || 1, ex = Math.max(1, 110 / w), gr0 = 70 + 0.6 * w * ex;
    g.save(); g.globalAlpha *= a;
    if (glow > 0) { const gr = g.createRadialGradient(cx, cy, 2, cx, cy, gr0); gr.addColorStop(0, `rgba(255,138,31,${(0.45 * glow).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,138,31,0)'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, gr0, 0, TAU); g.fill(); }
    const shape = () => { g.beginPath(); P.forEach(([x, y], i) => { const X = cx + (x - cx) * ex, Y = cy + (y - cy) * ex; i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath(); };
    g.lineJoin = 'round';
    shape(); g.strokeStyle = 'rgba(200,230,255,0.35)'; g.lineWidth = 22; g.stroke();     // the surf
    shape(); g.strokeStyle = COL.sandL; g.lineWidth = 9; g.stroke();                     // the beach
    shape(); g.fillStyle = COL.grass; g.fill();
    g.restore();
    return [cx, cy, w * ex];
  }
  function label(g, x, y, k, text, sub, bgc = 'rgba(10,16,30,0.88)', fg = COL.ink, size = 36) {
    if (k <= 0.01) return;
    chip(g, x, y, k, text, bgc, fg, size);
    if (sub) {
      g.save(); g.globalAlpha *= clamp(k * 2 - 0.6); const w = measure(g, sub, 24, { f: 'Mono', w: 700, st: 'normal', ls: '0.14em' }) + 28;
      g.fillStyle = 'rgba(10,16,30,0.8)'; g.beginPath(); g.roundRect(x - w / 2, y + 28, w, 34, 17); g.fill();
      txt(g, sub, x, y + 53, 24, { f: 'Mono', w: 700, st: 'normal', c: COL.ink, ls: '0.14em' }); g.restore();
    }
  }
  const pop = (t, t0) => (t < t0 ? 1 : 1 + 0.2 * Math.exp(-(t - t0) * 9) * Math.sin((t - t0) * 20));
  const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  function tempAt(depthFrac) {                      // °C along the way down (depth as a fraction of the radius)
    const P = [[0, 30], [0.0055, 700], [0.1, 1600], [0.4536, 3800], [0.8085, 5600], [1, 6000]];
    for (let i = 1; i < P.length; i++) if (depthFrac <= P[i][0]) return lerp(P[i - 1][1], P[i][1], (depthFrac - P[i - 1][0]) / (P[i][0] - P[i - 1][0]));
    return 6000;
  }

  // ================================================================ the film
  scene({
    name: 'film', from: 'hook', to: 'end',
    build(root, S) {
      S.sl = canvas(root); S.gb = canvas(root); S.top = canvas(root);
      const head = CL.head;
      S.L = {
        a1: head(root, 'DIG STRAIGHT DOWN', 140, 150, COL.ink), a2: head(root, 'FROM INDIA', 310, 150, COL.ink, { 1: COL.acc }),
        b1: head(root, 'THE PACIFIC OCEAN', 140, 124, COL.ink, { 1: COL.seaL }),
        c1: head(root, 'ALMOST ALL OF INDIA', 140, 120, COL.ink), c2: head(root, 'THE EXCEPTION:', 140, 92, COL.mute), c3: head(root, 'JAISALMER', 240, 190, COL.acc),
        d1: head(root, 'EASTER ISLAND', 140, 160, COL.ink),
        e1: head(root, 'DEEPEST HOLE EVER', 140, 100, COL.mute), e2: head(root, '12 KM', 260, 200, COL.ink), e3: head(root, '0.2% OF THE WAY', 260, 140, COL.ink, { 0: COL.acc }),
        f1: head(root, '30°C', 140, 220, COL.ink), f2: head(root, "THE SUN'S SURFACE: ≈ 5,500°C", 400, 54, COL.mute),
        g1: head(root, '0 KM/H', 140, 170, COL.ink), g2: head(root, 'FASTER THAN A SATELLITE', 340, 84, COL.ink, { 3: COL.acc }),
        h1: head(root, '19 MIN', 140, 220, COL.ink),
        i1: head(root, 'THE ROOT CAUSE', 140, 110, COL.acc), i2: head(root, 'ONLY 15% OF LAND', 280, 124, COL.ink, { 1: COL.acc }), i3: head(root, 'HAS LAND ON ITS OTHER SIDE', 410, 60, COL.mute),
        j1: head(root, 'BACK. AND FORTH. FOREVER.', 150, 100, COL.ink, { 3: COL.acc }),
      };
      for (const k of ['e2', 'f1', 'g1', 'h1']) S.L[k].el.style.fontVariantNumeric = 'tabular-nums';
    },
    run(t, b, S) {
      const T = times(), L = S.L, sl = S.sl, gb = S.gb, top = S.top; clear(sl); clear(gb); clear(top);
      const R = (L1, ins, out) => U.rise(t, L1, ins, out);
      const wP = clamp((t - T.globeIn) / 0.3) * (1 - clamp((t - T.islandIn) / 0.3));       // the Pacific globe
      const wA = clamp((t - T.rootIn) / 0.3) * (1 - clamp((t - T.rootOut) / 0.3));        // the Asia globe (the root cause)
      const wS = 1 - Math.max(wP, wA);
      // a navy scrim behind the headlines where the picture under them is busy and warm: the core (s06–s08: grey and orange
      // type on orange) and the root-cause globe (its dots ran through the three lines)
      const wTop = Math.max(clamp((t - (T.below - 0.3)) / 0.3) * (1 - clamp((t - (T.arrive - 0.35)) / 0.35)), wA);
      if (wTop > 0.005) {
        const sg = top.createLinearGradient(0, 0, 0, 700);
        sg.addColorStop(0, `rgba(12,20,36,${0.9 * wTop})`); sg.addColorStop(0.6, `rgba(12,20,36,${0.85 * wTop})`); sg.addColorStop(1, 'rgba(12,20,36,0)');
        top.fillStyle = sg; top.fillRect(0, 0, W, 700);
      }

      // ---- the slice
      if (wS > 0.005) {
        const c = sliceCam(t);
        space(sl, t);
        const zm = clamp((Math.log(c.Z) - Math.log(6)) / (Math.log(20) - Math.log(6)));
        if (zm > 0 && c.rot < 0.1) {                 // the moon over the Thar (close on the desert only)
          sl.save(); sl.globalAlpha = zm; const mg = sl.createRadialGradient(190, 640, 10, 190, 640, 150); mg.addColorStop(0, 'rgba(255,245,215,0.28)'); mg.addColorStop(1, 'rgba(255,245,215,0)');
          sl.fillStyle = mg; sl.beginPath(); sl.arc(190, 640, 150, 0, TAU); sl.fill();
          sl.fillStyle = '#f6eed8'; sl.beginPath(); sl.arc(190, 640, 46, 0, TAU); sl.fill(); sl.fillStyle = COL.bg1; sl.beginPath(); sl.arc(212, 626, 42, 0, TAU); sl.fill(); sl.restore();
        }
        earth(sl, c, t);
        const zk = (Math.log(c.Z) - Math.log(5)) / (Math.log(16) - Math.log(5));
        strata(sl, c, clamp(zk), false); strata(sl, c, clamp(zk), true);
        desert(sl, c, t); island(sl, c, t);
        // the tunnel: the dashed guess in the hook, then the dug shaft (the drill head digs it in s06)
        if (t < T.islandIn) tunnel(sl, c, -RE, lerp(-RE + 1, RE, eio(clamp((t - (T.down - 0.1)) / Math.max(1.2, T.america - T.down)))), true, 1 - clamp((t - (T.globeIn - 0.3)) / 0.3));
        else tunnel(sl, c, -RE, t < T.below ? -RE : t < T.a.s07 - 0.2 ? probeY(t) : RE, false);
        // the hook's America guess, struck out
        if (t < T.globeIn + 0.1) {
          const [ex, ey] = toS(c, 0, RE + 58 / Math.max(1, c.Z)), k = hit(t, T.america - 0.15, 'playful');
          if (ey < H + 40) { label(sl, ex, ey, k, 'AMERICA?', null, '#2c4a7c', COL.ink, 44);
            const ks = clamp((t - (T.wont + 0.02)) / 0.2); if (ks > 0) { const w = measure(sl, 'AMERICA?', 44) + 40; sl.save(); sl.strokeStyle = COL.acc; sl.lineWidth = 9; sl.lineCap = 'round'; sl.beginPath(); sl.moveTo(ex - w / 2, ey); sl.lineTo(ex - w / 2 + w * ks, ey); sl.stroke(); sl.restore(); } }
        }
        // s05: the deepest hole, under a magnifier; then the scale of it
        if (t > T.deepest - 0.3 && t < T.below) {
          const kL = hit(t, Math.max(T.deepest - 0.15, T.a.s05 + 1.2), 'default') * (1 - clamp((t - (T.barely + 0.1)) / 0.3));   // once the Earth has turned over
          if (kL > 0.01) {
            const [jx, jy] = toS(c, 0, -RE), lx = 770, ly = jy + 230, rr = 170 * clamp(kL, 0, 1.15);
            sl.save(); sl.strokeStyle = 'rgba(242,237,228,0.6)'; sl.lineWidth = 3; sl.beginPath(); sl.moveTo(jx, jy); sl.lineTo(lx - rr * 0.7, ly - rr * 0.7); sl.stroke();
            sl.beginPath(); sl.arc(lx, ly, rr, 0, TAU); sl.save(); sl.clip();
            sl.fillStyle = '#0c1424'; sl.fillRect(lx - rr, ly - rr, rr * 2, rr * 2);
            const gy = ly - rr * 0.62, sc = (rr * 1.45) / 13;                   // ground; 13 km fill the lens
            sl.fillStyle = COL.sand; sl.fillRect(lx - rr, gy, rr * 2, sc * 1.2);
            ['#8a6d55', '#76604e', '#6a5444', '#5d493b', '#6f5a48', '#584538'].forEach((cl, i) => { sl.fillStyle = cl; sl.fillRect(lx - rr, gy + sc * (1.2 + i * 2), rr * 2, sc * 2); });
            const hd = 12 * eio(clamp((t - (T.deepest - 0.05)) / 1.1));
            sl.strokeStyle = '#05070d'; sl.lineWidth = 6; sl.beginPath(); sl.moveTo(lx - 30, gy); sl.lineTo(lx - 30, gy + sc * hd); sl.stroke();
            sl.fillStyle = COL.steel; sl.beginPath(); sl.moveTo(lx - 36, gy + sc * hd - 8); sl.lineTo(lx - 24, gy + sc * hd - 8); sl.lineTo(lx - 30, gy + sc * hd + 6); sl.closePath(); sl.fill();
            if (hd > 11.5) { sl.strokeStyle = COL.acc; sl.lineWidth = 3; sl.beginPath(); sl.moveTo(lx - 50, gy + sc * 12); sl.lineTo(lx + rr, gy + sc * 12); sl.stroke(); txt(sl, '12 KM', lx + 40, gy + sc * 12 - 12, 34, { c: COL.acc }); }
            txt(sl, 'KOLA, 1970–1989', lx + 30, gy + sc * 3, 22, { f: 'Mono', w: 700, st: 'normal', c: COL.ink, ls: '0.1em' });
            sl.restore(); sl.strokeStyle = COL.ink; sl.lineWidth = 5; sl.beginPath(); sl.arc(lx, ly, rr, 0, TAU); sl.stroke(); sl.restore();
          }
          const kB = clamp((t - (T.barely - 0.1)) / 0.4) * (1 - clamp((t - (T.below - 0.3)) / 0.25));
          if (kB > 0) {                              // the bracket: 6,371 km to the centre; the hole a hair at the top
            const [x0, y0] = toS(c, 0, -RE), [x1, y1] = toS(c, 0, 0);
            sl.save(); sl.globalAlpha = kB; sl.strokeStyle = COL.ink; sl.lineWidth = 3; sl.beginPath(); sl.moveTo(x0 + 40, y0); sl.lineTo(x0 + 52, y0); sl.lineTo(x1 + 52, y1); sl.lineTo(x1 + 40, y1); sl.stroke();
            label(sl, x1 + 190, (y0 + y1) / 2, 1, '6,371 KM', 'TO THE CENTRE'); sl.fillStyle = COL.acc; sl.beginPath(); sl.arc(x0, y0 + 2, 6, 0, TAU); sl.fill();
            label(sl, x0 - 150, y0 + 6, 1, '12 KM', null, COL.acc, COL.paperInk, 34); sl.restore();
          }
        }
        // s06: the drill head and the layers it passes
        if (t > T.below - 0.2 && t < T.a.s07 - 0.1) {
          const py = probeY(t), [px, ppy] = toS(c, 0, py), heat = clamp((py + RE) / RE);
          sl.save(); sl.translate(px, ppy);
          const gr = sl.createRadialGradient(0, 22, 4, 0, 22, 60); gr.addColorStop(0, `rgba(255,${Math.round(220 - 120 * heat)},120,${(0.25 + 0.5 * heat).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,120,60,0)'); sl.fillStyle = gr; sl.beginPath(); sl.arc(0, 22, 60, 0, TAU); sl.fill();
          sl.fillStyle = COL.steelD; sl.beginPath(); sl.roundRect(-14, -34, 28, 46, 6); sl.fill(); sl.fillStyle = COL.steel; sl.beginPath(); sl.roundRect(-14, -34, 13, 46, [6, 0, 0, 6]); sl.fill();
          sl.fillStyle = heat > 0.5 ? '#ffd27a' : COL.steel; sl.beginPath(); sl.moveTo(-14, 12); sl.lineTo(14, 12); sl.lineTo(0, 34); sl.closePath(); sl.fill();
          sl.restore();
          const depth = py + RE, LAY = [[0, 12, 'CRUST', null], [12, 195, 'MANTLE', 'HOT, SOLID ROCK'], [195, 348, 'OUTER CORE', 'LIQUID IRON'], [348, 440, 'INNER CORE', 'SOLID IRON']];
          for (const [d0, d1, name, sub] of LAY) {
            const k = clamp((depth - d0 + 2) / 8) * (1 - clamp((depth - d1) / 8));
            if (k > 0) label(sl, px + 230, ppy - 10, eo(k), name, sub);
          }
          if (t > T.sun - 0.1) { const ks = hit(t, T.sun - 0.05, 'playful'), [cx2, cy2] = toS(c, 0, 0); sl.save(); sl.globalAlpha = clamp(ks); const r2 = 46 * clamp(ks, 0, 1.2); const sg = sl.createRadialGradient(cx2 - 250, cy2, 4, cx2 - 250, cy2, r2 * 1.8); sg.addColorStop(0, '#fff6d0'); sg.addColorStop(0.5, '#ffc04f'); sg.addColorStop(1, 'rgba(255,160,40,0)'); sl.fillStyle = sg; sl.beginPath(); sl.arc(cx2 - 250, cy2, r2 * 1.8, 0, TAU); sl.fill(); sl.fillStyle = '#ffd25a'; sl.beginPath(); sl.arc(cx2 - 250, cy2, r2, 0, TAU); sl.fill(); sl.restore(); }
        }
        // the explorer: by the hole, the fall, the pop-out, back and forth
        if (t > T.a.s07 - 0.3) {
          const y = figY(t), x = figX(t), [fx, fy] = toS(c, x, y), sz = clamp(5 * c.Z, 62, 96);
          const pose = t < T.jumpAt ? 'stand' : Math.abs(y) > 432 ? 'pop' : 'fall';
          const fade = t < T.a.s07 ? clamp((t - (T.a.s07 - 0.3)) / 0.3) : 1;
          sl.save(); sl.globalAlpha = fade;
          if (pose === 'fall') { sl.strokeStyle = 'rgba(255,240,200,0.35)'; sl.lineWidth = 4; for (let i = 1; i <= 3; i++) { const yb = figY(t - i * 0.05), [bx, by] = toS(c, x, yb); sl.globalAlpha = fade * 0.25 / i; explorer(sl, bx, by, figAngle(yb) + c.rot, sz, t, pose); } sl.globalAlpha = fade; }
          explorer(sl, fx, fy, figAngle(y) + c.rot, sz, t, pose);
          sl.restore();
        }
      }

      // ---- the Pacific globe: the splashes, the upside-down India, Easter Island
      if (wP > 0.005) {
        const v = camP(t);
        gb.save(); gb.globalAlpha = wP; space(gb, t);
        G.draw(gb, v, 1, null, { sea: SEA });
        const kE = clamp((t - (T.big - 0.2)) / 0.5), [ix, iy, iw] = islandIcon(gb, v, 1, kE);
        gb.save(); gb.strokeStyle = 'rgba(190,225,255,0.16)'; gb.lineWidth = 3; gb.lineCap = 'round';   // the sea moving
        for (const [lo, la, ph] of WAVES) { const q = GB.prLL(v, lo, la); if (q[2] < 0.1 || q[0] < -40 || q[0] > W + 40) continue; const dx = 14 * Math.sin(t * 0.8 + ph); gb.beginPath(); gb.moveTo(q[0] - 22 + dx, q[1]); gb.quadraticCurveTo(q[0] + dx, q[1] - 7, q[0] + 22 + dx, q[1]); gb.stroke(); }
        gb.restore();
        label(gb, 820, 1480, hit(t, T.pacific - 0.1, 'default') * (1 - clamp((t - (T.big - 0.3)) / 0.3)), '→', 'SOUTH AMERICA', 'rgba(10,16,30,0.6)', COL.mute, 36);
        CITY5.forEach(([name, ll, ox, oy], i) => {
          const t0 = [T.delhi, T.mumbai, T.bengaluru, T.chennai, T.kolkata][i] - 0.12, q = GB.prLL(v, ...anti(ll));
          if (t < t0 || q[2] < 0.05) return;
          splashFx(gb, q[0], q[1], t - t0, 1.5);
          gb.fillStyle = COL.splash; gb.beginPath(); gb.arc(q[0], q[1], 8, 0, TAU); gb.fill();
          label(gb, q[0] + ox * 1.15, q[1] + (oy || -50), hit(t, t0 + 0.05, 'playful') * (1 - clamp((t - (T.big - 0.3)) / 0.3)), name, null, 'rgba(10,16,30,0.88)', COL.ink, 38);
        });
        ORDER.forEach((j, n) => {                    // the rest of India, splashing down: an upside-down India in the sea
          const t0 = T.almost - 0.15 + (n / ORDER.length) * Math.max(0.8, T.does - T.almost + 0.5), q = GB.prLL(v, ...anti(MORE[j]));
          if (t < t0 || q[2] < 0.05) return;
          splashFx(gb, q[0], q[1], t - t0, 0.8);
          gb.fillStyle = 'rgba(232,244,255,0.9)'; gb.beginPath(); gb.arc(q[0], q[1], 6, 0, TAU); gb.fill();
        });
        // the exception: a point falls onto the island, not the sea
        const tJ = T.jaisalmer - 0.1;
        if (t > tJ - 0.5) {
          const kf = clamp((t - (tJ - 0.5)) / 0.5), sx2 = ix + 160 * (1 - eo(kf)), sy2 = iy - 420 * (1 - eo(kf));
          if (kf < 1) { gb.strokeStyle = 'rgba(255,138,31,0.6)'; gb.lineWidth = 4; gb.beginPath(); gb.moveTo(sx2, sy2); gb.lineTo(sx2 + 40, sy2 - 105); gb.stroke(); gb.fillStyle = COL.acc; gb.beginPath(); gb.arc(sx2, sy2, 9, 0, TAU); gb.fill(); }
          else {
            const kd = clamp((t - tJ) / 0.8); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, d = 14 + 40 * eo(kd); gb.fillStyle = `rgba(214,170,110,${(0.8 * (1 - kd)).toFixed(3)})`; gb.beginPath(); gb.arc(ix + Math.cos(a) * d, iy + Math.sin(a) * d * 0.7, 5 * (1 - kd * 0.5), 0, TAU); gb.fill(); }
            pin(gb, ix, iy, hit(t, tJ, 'playful'), t, 13);
            label(gb, ix + 10, iy - 74 - iw * 0.1, hit(t, tJ + 0.15, 'playful'), 'DESERT OUTSIDE JAISALMER', null, COL.acc, COL.paperInk, 30);
          }
        }
        label(gb, ix, iy + 70 + iw * 0.05, hit(t, T.easter - 0.4, 'default') * (1 - clamp((t - (T.islandIn - 0.1)) / 0.2)), 'EASTER ISLAND', 'CHILE');
        gb.restore();
      }

      // ---- the Asia globe: only ~15% of land has land on its other side; the root mark on the patch outside Jaisalmer
      if (wA > 0.005) {
        const v = camA(t), kAnti = eo(clamp((t - (T.only - 0.15)) / 0.6));
        gb.save(); gb.globalAlpha = wA; space(gb, t);
        G.draw(gb, v, 1, (d) => (d.k === 'anti' && kAnti > 0 ? [COL.acc, kAnti] : null));
        const q = GB.prLL(v, ...PATCH), mk = clamp((t - (T.root - 0.15)) / 0.95);
        if (q[2] > 0.05) { CL.rootMark(gb, q[0], q[1], 0.75, mk, t); gb.save(); gb.globalAlpha *= clamp((t - T.root - 0.5) / 0.3); txt(gb, 'JAISALMER', q[0], q[1] + 72, 30, { f: 'Mono', w: 700, st: 'normal', c: COL.ink, ls: '0.14em' }); gb.restore(); }
        const qc = GB.prLL(v, 112, 34);
        if (qc[2] > 0.05) label(gb, qc[0] - 60, qc[1] - 40, hit(t, T.land9 - 0.05, 'playful'), 'CHINA ⟷ ARGENTINA', null, 'rgba(10,16,30,0.88)', COL.ink, 30);
        gb.restore();
      }

      // ---- the headlines
      R(L.a1, [-0.4], T.wont - 0.1); R(L.a2, [-0.35], T.wont - 0.1);
      put(L.a2.words[1], { s: pop(t, T.india1 + 0.02) });
      R(L.b1, [T.pacific - 0.2, T.pacific - 0.12, T.pacific - 0.04], T.almost - 0.12);
      R(L.c1, [T.almost - 0.06, T.almost, T.almost + 0.06, T.india3 - 0.04], T.exception - 0.12);
      R(L.c2, [T.exception - 0.1, T.exception - 0.04], T.easter - 0.15); R(L.c3, [T.jaisalmer - 0.06], T.easter - 0.15);
      put(L.c3.words[0], { s: pop(t, T.jaisalmer + 0.05) });
      R(L.d1, [T.easter - 0.06, T.easter + 0.1], T.a.s05 - 0.12);
      R(L.e1, [T.deepest - 0.06, T.deepest, T.deepest + 0.06], T.barely - 0.12); R(L.e2, [T.twelve - 0.06, T.twelve], T.barely - 0.12);
      R(L.e3, [T.barely - 0.06, T.barely, T.barely + 0.06, T.barely + 0.12], T.below - 0.15);
      { const py = probeY(t), tc = tempAt(clamp((py + RE) / RE)), shown = t > T.sun - 0.15 ? '≈ 6,000°C' : fmt(Math.round(tc / 10) * 10) + '°C';
        put(L.f1.words[0], { text: shown, s: pop(t, T.sun) }); R(L.f1, [T.below - 0.05], T.a.s07 - 0.15); R(L.f2, [T.sun - 0.04], T.a.s07 - 0.15); }
      { const L1 = legs()[0], u = clamp((t - L1[0]) / (L1[1] - L1[0])), v = 28400 * Math.sin(PI * u), shown = u > 0.4 && u < 0.6 ? '28,000+ KM/H' : fmt(Math.round(v / 100) * 100) + ' KM/H';
        put(L.g1.words[0], { text: shown.split(' ')[0] }); put(L.g1.words[1], { text: 'KM/H' });
        R(L.g1, [T.shoot - 0.05, T.shoot], T.thirty - 0.15); R(L.g2, [T.satellite - 0.25, T.satellite - 0.18, T.satellite - 0.11, T.satellite - 0.04], T.thirty - 0.15); }
      { const m = Math.round(lerp(19, 38, eio(clamp((t - (T.thirty - 0.05)) / Math.max(0.5, T.arrive - T.thirty)))));
        put(L.h1.words[0], { text: String(m), s: pop(t, T.arrive) }); R(L.h1, [T.thirty - 0.06, T.thirty], T.rootIn + 0.1); }
      R(L.i1, [T.root - 0.06, T.root, T.root + 0.06], T.rootOut + 0.05);
      R(L.i2, [T.only - 0.06, T.fifteen - 0.06, T.fifteen, T.fifteen + 0.06], T.rootOut + 0.05);
      R(L.i3, [T.land9 - 0.04], T.rootOut + 0.05);
      put(L.i2.words[1], { s: pop(t, T.fifteen + 0.05) });
      R(L.j1, [T.back - 0.06, T.forth - 0.3, T.forth - 0.06, T.forever - 0.06], T.end - 0.05);
    },
  });

  U.endcard();
  C.start();
})();
