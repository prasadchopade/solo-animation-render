// Reel 41 · Seen Him Before (working title). Tests desk, an episode of "You're the test subject", built round Season 1's thief, in his one
// innocent episode (the user's yes, 17 Nov). You're at the chai stall; the man with the mole sits at the next table with his chai, and his face
// is the first thing you see. "You've got five seconds before this stall gets robbed." While the chaiwala's back is turned, a man in a blue shirt
// slides the cash box into his cloth bag, a boy runs past with a bat, and everyone points at the boy. Five men stand in a line; whoever you
// pick goes to jail. For once, the man with the mole did nothing: the theft plays again, he never left his seat, and number four took it in
// plain view. He spends the night in a cell if you chose him; the thief walks off with the box; and the next morning he walks back to his
// table, sits down and looks at you, which is frame 0. No end card: the film is a loop (the user's trial, 17 Nov).
// Facts: docs/research.md. The script: docs/script.md. The camera is reel 37's free camera (rig.js); the faces, the cap, the figures, the
// chai stall and the thief's drawing are reel 36's (r36.js), as the brief names them. Our own drawings; nobody real. 30 fps. Every frame is a
// pure function of t, sealed in save()/restore().
(() => {
  const { W, H, scene, canvas, clamp, lerp, mulberry32 } = C;
  const RG = window.RIG, A = window.R36, K = window.KIT;
  const { sstep, txt, R, ell, lg, rg, mix, ring, title, blinkAt, figure, glass, armIK, wristOf, chaiStall, steam, poly, PJ, personView, drawPerson, THIEF0, INK, CREAM } = A;
  C.fonts = ['700 condensed 100px Bahn', '700 semi-condensed 46px Bahn', '600 semi-condensed 64px Bahn', '400 30px Mono', '700 30px Mono'];
  const TAU = Math.PI * 2, PI = Math.PI, DUR = C.DUR;
  const ease = (u) => { u = clamp(u); return u * u * u * (u * (u * 6 - 15) + 10); };
  const seg = (a, b, t) => ease((t - a) / (b - a));
  const win = (t, a, b, c, d) => sstep(a, b, t) * (1 - sstep(c, d, t));
  // the stall's goods, in morning colours rather than reel 36's golden-hour ones (chaiStall reads the first six)
  A.GOODS.splice(0, 8, '#b8664f', '#c9a25a', '#6f8fa6', '#b9784f', '#8d7399', '#c4b48e', '#d8d0c0', '#5a6f96');

  // ------------------------------------------------------------------ timing: the narration's placed words set it; until then, the plan
  // Scene time tau: the stall's own clock, 0 on frame 0. The film opens on tau 0 and ends on the stall at tau -7.6 … 0, so its last frame
  // runs into frame 0 by construction (the morning he walks back in is the morning before the theft).
  const S = { turn: 4.0, lift0: 4.2, lift1: 4.85, boy0: 4.6, boy1: 6.2, back: 5.3, shout: 5.5, end: 7.4, walk0: -7.6, sit0: -5.6, sit1: -4.9, push0: -3.6, push1: -0.8, pull0: 0.6, pull1: 3.4 };
  const T = (() => {
    const Wd = (p) => K.words(p), has = (p) => Wd(p).length > 0, at = (p) => Wd(p)[0].t0, en = (p) => Wd(p)[Wd(p).length - 1].t1;
    const T = { line0: 7.6, l2: 7.8, l3: 9.6, l4: 10.8, pick0: 12.7, pick1: 15.2, l5: 15.4, rew0: 18.0, rep0: 19.0, l6: 19.1, l7: 20.8, rew2: 23.2, slow0: 23.6, l8: 23.7,
      slow1: 26.1, cell0: 26.1, l9: 26.3, l10: 29.9, lane0: 33.8, l11: 34.0, morn0: DUR - 7.6, l12: DUR - 4.0, l13: DUR - 2.7, e13: DUR - 1.0 };
    if (has('n02')) {                                   // the placed voice: the picture follows the words
      T.l2 = at('n02'); T.line0 = T.l2 - 0.25; T.l3 = at('n03'); T.l4 = at('n04'); T.pick0 = en('n04') + 0.05; T.pick1 = T.pick0 + 2.5;
      T.l5 = at('n05'); T.rew0 = en('n05') + 0.45; T.rep0 = T.rew0 + 0.95; T.l6 = at('n06'); T.l7 = at('n07');
      T.rew2 = en('n07') + 0.05; T.slow0 = T.rew2 + 0.4; T.l8 = at('n08'); T.slow1 = en('n08') + 0.35; T.cell0 = T.slow1;
      T.l9 = at('n09'); T.l10 = at('n10'); T.lane0 = en('n10') + 0.3; T.l11 = at('n11'); T.morn0 = DUR - 7.6; T.l12 = at('n12'); T.l13 = at('n13'); T.e13 = en('n13');
    }
    return T;
  })();

  // ------------------------------------------------------------------ the camera: reel 37's free camera, in reel 36's millimetres
  function cam(o) {
    const c = RG.camera({ x: o.x / 1000, y: o.y / 1000, z: o.z / 1000, yaw: o.yaw || 0, pitch: o.pitch || 0, roll: o.roll || 0, f: o.f || 1000, cx: 540, cy: o.cy ?? 980 });
    return { rig: c, x: o.x, y: o.y, z: o.z, yaw: o.yaw || 0, pitch: o.pitch || 0, roll: o.roll || 0, f: c.f, cx: c.cx, cy: c.cy };
  }
  const P = (c, X, Y, Z, near = 60) => PJ(c, X, Y, Z, near);
  function cpoly(g, c, pts, fill) {                  // a world polygon (mm), clipped at the camera's near plane
    const q = RG.clipNear(pts.map((p) => c.rig.toCam(p[0] / 1000, p[1] / 1000, p[2] / 1000))); if (q.length < 3) return false;
    g.beginPath(); q.forEach((p, i) => { const s = c.rig.scr(p); if (i) g.lineTo(s[0], s[1]); else g.moveTo(s[0], s[1]); }); g.closePath();
    if (fill) { g.fillStyle = fill; g.fill(); }
    return true;
  }
  function box3(g, c, x0, x1, y0, y1, z0, z1, cols) { // an axis-aligned box: the faces that face you
    const F = [
      [c.y > y1, 'top', [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]]],
      [c.x > x1, 'front', [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]]],
      [c.z < z0, 'left', [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]]],
      [c.z > z1, 'right', [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]],
    ];
    for (const [v, k, p] of F) if (v && cols[k]) cpoly(g, c, p, cols[k]);
  }
  const fresh = (cv) => { const q = cv.getContext('2d'); q.setTransform(1, 0, 0, 1, 0, 0); q.globalAlpha = 1; q.globalCompositeOperation = 'source-over'; q.filter = 'none'; q.clearRect(0, 0, W, H); return q; };

  // ------------------------------------------------------------------ the cast (reel 36's face rig; the season's thief is reel 36's own)
  // The five share one family of skin tones and one age band; they differ in jaw, brows, hair, moustache and clothes, never in colour
  // (the desk). None but him has a mole or a cap. No saffron or green on the fillers (29); his teal shirt is the series'.
  const SK = (i) => [{ skin: '#b27a54', skinD: '#8a583a', skinH: '#cf9a72' }, { skin: '#bd8a64', skinD: '#946243', skinH: '#d8a983' }, { skin: '#a8714d', skinD: '#80522f', skinH: '#c08a64' }, { skin: '#c48a5c', skinD: '#9a6640', skinH: '#d9a47a' }][i];
  const MOLE = THIEF0;                                                     // number three
  const ONE = { L: { ...SK(1), hair: '#d9d4cb', mHair: '#ebe7df', style: 'short', must: 'thick', stub: 0.1, brow: 19, browTilt: 9, jaw: 1.04, chinK: 1.02, ew: 40, eh: 20, noseW: 1.15 },
    D: { a: '#8c6b4c', b: '#6e5238', sweater: '#7b4f36', sleeve: 'long', cuff: '#7b4f36', leg: '#4a4038', shoe: '#2a211b' } };   // the old man: white hair, a big moustache, a brown sweater
  const TWO = { L: { ...SK(3), hair: '#16100c', style: 'spiky', must: 'pencil', stub: 0.05, brow: 13, browTilt: 2, jaw: 0.92, chinK: 1.05, ew: 45, eh: 25 },
    D: { a: '#ee8fb0', b: '#cf6b8e', collar: '#d77898', sleeve: 'short', buttons: 'rgba(255,255,255,0.5)', leg: '#2f3442', shoe: '#1d1a17' } };
  const FOUR = { L: { ...SK(2), hair: '#15100c', style: 'part', stub: 0, brow: 14, browTilt: 3, jaw: 0.95, chinK: 1.0, ew: 44, eh: 24 },
    D: { a: '#5f86c4', b: '#41659f', collar: '#4d72ad', sleeve: 'short', buttons: 'rgba(255,255,255,0.5)', leg: '#3b3f4a', shoe: '#2a221c' } };
  const FIVE = { L: { ...SK(0), hair: '#16110d', style: 'crew', must: 'thick', beard: { c: '#1a130e', k: 'full' }, brow: 18, browTilt: 4, jaw: 1.12, chinK: 0.95, ew: 42, eh: 22 },
    D: { a: '#34343a', b: '#202024', sleeve: 'short', leg: '#4a4f5a', shoe: '#1d1a17', wide: 1.16 } };
  const WALLAH = { L: { ...SK(1), hair: '#2a2420', style: 'short', must: 'thick', stub: 0.3, brow: 17, browTilt: 6, jaw: 1.06, ew: 41, eh: 21 },
    D: { a: '#f1ede4', b: '#d6cfbf', sleeve: 'none', vest: true, gamchha: true, leg: '#6b5a48', shoe: '#2a211b' } };
  const BOY = A.BOY;
  const BAG = '#b49a6a', BAGD = '#8e7650', TIN = '#5f7f9e', TIND = '#46617c';

  // ------------------------------------------------------------------ the stall's world (mm). The lane runs along Z; the stall is on its left
  // side (its back wall at X = -1500), its counter's front at X = -1070. You sit across the lane at X ≈ 1900, looking at it.
  const STALL = { side: -1, z0: -1000, z1: 1100 };
  const BOXP = { X: -1140, Z: -330 };                 // the cash box on the counter's front edge
  const SEAT = { X: 60, Z: 400, Y: 1330 };           // his head, seated at the next table
  const AT4 = { X: -860, Z: 110, a: PI / 4 + 0.1 };   // number four, in front of the counter, turned to the box and to you
  const ATW = { X: -1300, Z: -700 };                  // the chaiwala, behind it
  const AT2 = { X: -700, Z: -1090 }, AT1 = { X: -330, Z: -730 }, AT5 = { X: -1000, Z: 1050 };
  const STOVE = { X: -1420, Z: -620 };
  const CW = { x: 1900, y: 1400, z: 0, yaw: -PI / 2, pitch: -0.12, f: 1000, cy: 980 };
  const CC = { x: SEAT.X + 820, y: 1260, z: SEAT.Z - 20, yaw: -PI / 2, pitch: -0.01, f: 980, cy: 1040 };
  const closeK = (tau) => (tau < S.push0 ? 0 : tau < 0 ? seg(S.push0, S.push1, tau) : 1 - seg(S.pull0, S.pull1, tau));
  function camStall(tau) {
    const k = closeK(tau), o = {};
    for (const n of ['x', 'y', 'z', 'yaw', 'pitch', 'f', 'cy']) o[n] = lerp(CW[n], CC[n], k);
    o.x += 4 * Math.sin(tau * 0.7); o.z += 5 * Math.sin(tau * 0.53 + 1); o.y += 3 * Math.sin(tau * 0.9 + 2);   // a breath of handheld drift
    return cam(o);
  }

  // the lane: the facade over the stall, its neighbours, the floor, the wires
  function laneBack(g, c) {
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#f4c88e'], [0.5, '#f7d9a8'], [1, '#e9c89a']); g.fillRect(0, 0, W, H);
    cpoly(g, c, [[-1500, 2600, -3600], [-1500, 2600, 3600], [-1500, 6400, 3600], [-1500, 6400, -3600]], '#e7b98e');
    cpoly(g, c, [[-1490, 3700, -650], [-1490, 3700, 650], [-1490, 4800, 650], [-1490, 4800, -650]], '#5d4a44');
    for (let i = 0; i < 6; i++) cpoly(g, c, [[-1480, 3700, -600 + i * 230], [-1480, 3700, -570 + i * 230], [-1480, 4800, -570 + i * 230], [-1480, 4800, -600 + i * 230]], '#3a2e2a');
    cpoly(g, c, [[-1495, 3600, -760], [-1495, 3600, 760], [-1495, 3700, 760], [-1495, 3700, -760]], '#d9a87e');
    cpoly(g, c, [[-1500, 0, -3600], [-1500, 0, -1000], [-1500, 3400, -1000], [-1500, 3400, -3600]], '#8fa6b0');
    for (let y = 150; y < 2600; y += 120) cpoly(g, c, [[-1495, y, -3500], [-1495, y, -1080], [-1495, y + 24, -1080], [-1495, y + 24, -3500]], '#7a8f99');
    cpoly(g, c, [[-1500, 0, 1100], [-1500, 0, 3600], [-1500, 3400, 3600], [-1500, 3400, 1100]], '#d98c7a');
    cpoly(g, c, [[-1490, 300, 1450], [-1490, 300, 3400], [-1490, 2500, 3400], [-1490, 2500, 1450]], '#4a3530');
    cpoly(g, c, [[-1500, 0, -4000], [2600, 0, -4000], [2600, 0, 4000], [-1500, 0, 4000]], '#cdb08a');
    g.save(); if (cpoly(g, c, [[-1500, 0, -4000], [2600, 0, -4000], [2600, 0, 4000], [-1500, 0, 4000]], null)) g.clip();
    for (let z = -4000; z < 4000; z += 600) cpoly(g, c, [[-1500, 1, z], [2600, 1, z], [2600, 1, z + 14], [-1500, 1, z + 14]], 'rgba(90,64,40,0.16)');
    g.fillStyle = rg(g, 520, 1100, 80, 1100, [0, 'rgba(255,236,196,0.30)'], [1, 'rgba(255,236,196,0)']); g.fillRect(0, 0, W, H);
    g.restore();
    g.strokeStyle = 'rgba(40,30,26,0.5)'; g.lineWidth = 3;
    for (const [z, y0, sag] of [[-2300, 5300, 500], [200, 5700, 380], [2500, 5200, 620]]) {
      g.beginPath(); let on = false;
      for (let i = 0; i <= 16; i++) { const u = i / 16, X = lerp(-1500, 2600, u), Y = y0 - sag * 4 * u * (1 - u), p = P(c, X, Y, z); if (!p) { on = false; continue; } if (on) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); on = true; }
      g.stroke();
    }
  }
  function stall(g, c, tw) {                          // reel 36's chaiStall, through this camera
    const sd = STALL.side, X0 = sd * 1500;
    const pt = (z, Y, dx = 0) => P(c, X0 - sd * dx, Y, z);
    const quad = (za, zb, ya, yb, fill, dx = 0) => (zb <= za + 1 ? false : poly(g, [pt(za, ya, dx), pt(zb, ya, dx), pt(zb, yb, dx), pt(za, yb, dx)], fill));
    const tone = (col, k = 0) => mix(col, '#fff0d8', 0.04 + k);
    A.setP3((x, y, z) => P(c, x, y, z));
    chaiStall(g, STALL, 0, tw, pt, quad, tone, 0);
  }
  function kettle(g, x, y, s, tilt) {                 // a big aluminium kettle, its base at (x, y)
    g.save(); g.translate(x, y); g.rotate(tilt); g.scale(s, s);
    g.fillStyle = lg(g, -170, 0, 170, 0, [0, '#8d939a'], [0.35, '#d9dde1'], [0.6, '#aab0b7'], [1, '#6c7279']);
    g.beginPath(); g.moveTo(-160, 0); g.bezierCurveTo(-190, -160, -150, -300, -90, -330); g.lineTo(90, -330); g.bezierCurveTo(150, -300, 190, -160, 160, 0); g.closePath(); g.fill();
    g.fillStyle = '#7a8088'; R(g, -100, -360, 200, 40, 14); g.fill();
    g.strokeStyle = '#5f646b'; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath(); g.moveTo(150, -120); g.quadraticCurveTo(260, -170, 300, -290); g.stroke();
    g.strokeStyle = '#4a4f55'; g.lineWidth = 14; g.beginPath(); g.arc(0, -330, 130, PI * 1.05, PI * 1.95); g.stroke();
    g.restore();
  }
  function stove(g, c, lifted) {                      // the stove on the back shelf (behind the chaiwala) and the kettle on it
    box3(g, c, -1490, -1340, 0, 880, STOVE.Z - 280, STOVE.Z + 280, { front: '#6b4a2c', top: '#8a6440', left: '#5a3d24', right: '#5a3d24' });
    const b = P(c, STOVE.X, 880, STOVE.Z); if (!b) return;
    g.fillStyle = '#2a2a2e'; ell(g, b[0], b[1], 150 * b[2], 40 * b[2]); g.fill();
    g.fillStyle = 'rgba(80,140,255,0.55)'; ell(g, b[0], b[1] - 6 * b[2], 110 * b[2], 22 * b[2]); g.fill();
    if (!lifted) kettle(g, b[0], b[1], b[2], 0);
  }
  function tinAt(g, x, y, s, rot = 0) {               // the cash box, drawn on screen (in his hand, going into the bag)
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    g.fillStyle = lg(g, -120, -70, 120, 70, [0, TIN], [1, TIND]); R(g, -120, -70, 240, 140, 14); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.18)'; R(g, -110, -64, 220, 26, 10); g.fill();
    g.fillStyle = '#c9a54a'; R(g, -22, -18, 44, 30, 6); g.fill();
    g.restore();
  }
  function tinOnCounter(g, c) {
    const x0 = BOXP.X - 80, x1 = BOXP.X + 70, z0 = BOXP.Z - 130, z1 = BOXP.Z + 130;
    box3(g, c, x0, x1, 1100, 1230, z0, z1, { top: '#7896b3', front: TIN, left: TIND, right: TIND });
    const l = P(c, x1 + 1, 1185, BOXP.Z); if (l) { g.fillStyle = '#c9a54a'; R(g, l[0] - 18 * l[2], l[1] - 14 * l[2], 36 * l[2], 26 * l[2], 4 * l[2]); g.fill(); }
  }
  function table(g, c, X, Z, w = 620) {               // a café table
    const h = 740, x0 = X - w / 2, x1 = X + w / 2, z0 = Z - w / 2, z1 = Z + w / 2;
    for (const [lx, lz] of [[x0 + 40, z0 + 40], [x1 - 40, z0 + 40], [x0 + 40, z1 - 40], [x1 - 40, z1 - 40]]) box3(g, c, lx - 22, lx + 22, 0, h - 30, lz - 22, lz + 22, { front: '#5a5f66', left: '#4a4f55', right: '#4a4f55' });
    box3(g, c, x0, x1, h - 34, h, z0, z1, { top: '#e7ddc8', front: '#b9ad96', left: '#a99e88', right: '#a99e88' });
  }
  function bench(g, c, X, Z, len = 1300, h = 440) {
    box3(g, c, X - 180, X + 180, h - 50, h, Z - len / 2, Z + len / 2, { top: '#a8743e', front: '#8a5c2e', left: '#7a5028', right: '#7a5028' });
    for (const dz of [-len / 2 + 80, len / 2 - 80]) box3(g, c, X - 150, X + 150, 0, h - 50, Z + dz - 25, Z + dz + 25, { front: '#6e4a26', left: '#5e3f20', right: '#5e3f20' });
  }
  function scooter(g, c, X, Z) {                      // a red scooter, side-on
    const p = P(c, X, 0, Z); if (!p) return; const s = p[2];
    g.save(); g.translate(p[0], p[1]); g.scale(s, s);
    g.fillStyle = '#1f1f22'; ell(g, -520, -170, 170, 170); g.fill(); ell(g, 520, -170, 170, 170); g.fill();
    g.fillStyle = '#9aa0a6'; ell(g, -520, -170, 70, 70); g.fill(); ell(g, 520, -170, 70, 70); g.fill();
    g.fillStyle = lg(g, -700, -800, 700, -200, [0, '#d9493f'], [1, '#a82c25']);
    g.beginPath(); g.moveTo(-720, -260); g.bezierCurveTo(-760, -560, -460, -700, -160, -640); g.lineTo(300, -600); g.lineTo(420, -980); g.lineTo(520, -980); g.lineTo(560, -560); g.bezierCurveTo(700, -480, 720, -330, 680, -260); g.closePath(); g.fill();
    g.fillStyle = '#2a2a2e'; R(g, -620, -760, 560, 90, 40); g.fill();
    g.strokeStyle = '#3a3a3e'; g.lineWidth = 26; g.lineCap = 'round'; g.beginPath(); g.moveTo(440, -980); g.lineTo(300, -1180); g.moveTo(220, -1180); g.lineTo(560, -1180); g.stroke();
    g.restore();
  }
  function newspaper(g, x, y, s) {                     // held open in front of number one's chest
    g.save(); g.translate(x, y); g.scale(s, s); g.rotate(-0.04);
    g.fillStyle = '#efe9dc'; R(g, -260, -40, 520, 330, 6); g.fill();
    g.fillStyle = 'rgba(40,36,30,0.35)'; for (let i = 0; i < 9; i++) g.fillRect(-230, i * 30, i % 3 === 0 ? 200 : 210, 9);
    g.fillRect(20, 0, 6, 270);
    g.restore();
  }
  function phone(g, x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#23262c'; R(g, -34, -64, 68, 128, 12); g.fill(); g.fillStyle = '#7fb0e0'; R(g, -27, -54, 54, 104, 8); g.fill(); g.restore(); }
  function clothBag(g, x, y, s, open = 0, bulge = 0) { // number four's cloth bag at his hip (a jhola): khaki with a stripe
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = lg(g, -170, -20, 170, 300, [0, BAG], [1, BAGD]);
    g.beginPath(); g.moveTo(-160, 0); g.lineTo(160, 0); g.bezierCurveTo(175 + 25 * bulge, 120, 170 + 30 * bulge, 260, 140, 300); g.lineTo(-140, 300); g.bezierCurveTo(-170 - 20 * bulge, 260, -175 - 20 * bulge, 120, -160, 0); g.closePath(); g.fill();
    g.fillStyle = '#8f3f2e'; g.fillRect(-166, 70, 332 + 20 * bulge, 26);
    if (open > 0.01) { g.fillStyle = 'rgba(40,28,16,0.75)'; ell(g, 0, 4, 150, 22 * open); g.fill(); }
    g.restore();
  }
  const strap = (g, x0, y0, x1, y1, s) => { g.strokeStyle = BAGD; g.lineWidth = 22 * s; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };

  // ------------------------------------------------------------------ the people, as functions of the stall's clock (each takes the body's
  // turn first: the arms are solved for the turn they're drawn at)
  function molePose(tau, yaw) {                        // him (number three): seated, his glass in his right hand (the screen's left)
    const walking = 1 - sstep(S.sit0, S.sit1, tau);
    const sipA = win(tau, -3.0, -2.3, 0.9, 1.7);                     // the sip that frame 0 is the middle of
    const sipB = win(tau, 4.0, 4.4, 5.05, 5.4);                      // he's sipping when the box goes
    const sipC = win(tau, 6.4, 6.8, 7.6, 8.0);
    const sip = Math.max(sipA, sipB, sipC);
    const atYou = win(tau, -2.8, -2.2, 0.7, 1.3);                    // his eyes on you, through frame 0
    const down = win(tau, 0.9, 1.5, 5.4, 5.8);                       // his eyes on his chai
    const at4 = sstep(5.75, 6.15, tau);                              // after the shout, his eyes go to number four
    const o = { yaw, headYaw: lerp(lerp(0.0, -0.62 * yaw, atYou), -0.55, at4), look: [lerp(lerp(-4, 3, atYou), -17, at4), lerp(lerp(3, 1, atYou), 11, down) * (1 - at4) - 6 * at4],
      cap: 1, rim: 1, glassK: 0.58, close: blinkAt(tau, 3, 3.1) * (1 - atYou) + 0.35 * sipB, smirk: 0.2 * at4 + 0.1 * atYou, smile: 0.05 * atYou, browUp: 6 * at4,
      tilt: -0.03 * sip, breath: 4 * Math.sin(tau * 1.6), hands: { l: walking > 0.5 ? 'relax' : 'glass' }, walk: 1.0 * walking, phase: tau * 7.5 };
    const gx = lerp(-175, -128, sip), gy = lerp(470, 318, sip);
    o.arms = { l: { ...armIK(o, -1, gx, gy, 60), hand: 'glass', w: 1 - walking }, r: { ...armIK(o, 1, 230, 660, 60), hand: 'relax', w: 1 - walking } };
    return o;
  }
  function fourPose(c, v, tau) {                       // number four: at the counter; the box into his bag; then pointing hardest
    const yaw = clamp(v.yaw * 0.9, -0.95, 0.95);
    const reach = seg(S.lift0, S.lift0 + 0.22, tau), drop = seg(S.lift0 + 0.24, S.lift1, tau), done = sstep(S.lift1, S.lift1 + 0.2, tau);
    const point = sstep(S.shout + 0.05, S.shout + 0.3, tau) * (1 - sstep(7.0, 7.6, tau));
    const o = { yaw, headYaw: lerp(-0.2, -0.6, point) + 0.15 * reach * (1 - done), look: [lerp(lerp(-8, -4, reach), -16, point), lerp(2, 7, reach * (1 - done))], rim: 1,
      op: 0.3 * point * (0.6 + 0.4 * Math.abs(Math.sin(tau * 11))), browUp: 4 * point, close: blinkAt(tau, 1, 3.6), breath: 3 * Math.sin(tau * 1.4 + 1) };
    // his left hand (the screen's left, nearer the box): resting by it; on it; with it down into the bag at his hip; back on the strap
    const box = P(c, BOXP.X + 40, 1180, BOXP.Z), hx = v.x, hy = v.y - 1594 * v.s;
    const bx = box ? (box[0] - hx) / v.s : -500, by = box ? (box[1] - hy) / v.s : 900;
    const rest = [bx + 160, by - 30], bag = [-250, 980], st = [-170, 520];
    let tx = lerp(rest[0], bx, reach), ty = lerp(rest[1], by - 20, reach);
    tx = lerp(tx, bag[0], drop); ty = lerp(ty, bag[1] - 160 * Math.sin(PI * drop), drop);
    tx = lerp(tx, st[0], done); ty = lerp(ty, st[1], done);
    o.arms = { l: { ...armIK(o, -1, tx, ty, 50), hand: reach > 0.4 && done < 0.5 ? 'grip' : 'relax', w: 1 } };
    if (point > 0.01) o.arms.r = { ...armIK(o, 1, -700, 200, 120, 'out'), hand: 'point', w: point };
    return { o, reach, drop, done };
  }
  function wallahPose(tau, yaw) {                      // the chaiwala: wiping the counter; his back to you while he lifts the kettle; then shouting after the boy
    const away = sstep(S.turn, S.turn + 0.3, tau) * (1 - sstep(S.back, S.back + 0.25, tau));
    const shout = sstep(S.shout - 0.05, S.shout + 0.12, tau) * (1 - sstep(7.2, 7.8, tau));
    const o = { yaw: lerp(yaw, -0.95, away), back: false, look: [lerp(lerp(0, -18, away), -16, shout), lerp(lerp(8, 2, away), -4, shout)], op: shout * (0.45 + 0.35 * Math.abs(Math.sin(tau * 9))),
      browUp: 9 * shout, worry: 8 * shout, headYaw: -0.4 * shout - 0.2 * away, rim: 1, breath: 3 * Math.sin(tau * 1.2), legs: false };
    const wipe = (1 - away) * (1 - shout);
    o.arms = { r: { ...armIK(o, 1, 160 + 60 * Math.sin(tau * 3.2) * wipe, 820, 40), hand: 'open', w: wipe } };
    if (shout > 0.01) o.arms.l = { ...armIK(o, -1, -880, 220, 120, 'out'), hand: 'point', w: shout };
    return { o, away };
  }
  const pointAll = (tau, d) => sstep(S.shout + d, S.shout + d + 0.3, tau) * (1 - sstep(7.1 + d, 7.7 + d, tau));
  function twoPose(tau, yaw) {                         // number two: on his phone; he looks up and points with the rest
    const p = pointAll(tau, 0.12), o = { yaw, headYaw: -0.1 - 0.3 * p, tilt: 0.12 * (1 - p), look: [lerp(-3, -15, p), lerp(14, -2, p)], rim: 1, close: blinkAt(tau, 4, 3.3), breath: 3 * Math.sin(tau * 1.3 + 2) };
    o.arms = { r: { ...armIK(o, 1, 60, 560, 40), hand: 'grip', w: 1 - p } };
    if (p > 0.01) o.arms.l = { ...armIK(o, -1, -900, 280, 120, 'out'), hand: 'point', w: p };
    return o;
  }
  function onePose(tau, yaw) {                         // number one: the old man with his newspaper
    const p = pointAll(tau, 0.22), o = { yaw, headYaw: -0.12 - 0.3 * p, look: [lerp(-2, -14, p), lerp(12, 0, p)], rim: 1, close: blinkAt(tau, 5, 3.7), breath: 2 * Math.sin(tau * 1.1), worry: 3 * p };
    o.arms = { l: { ...armIK(o, -1, -150, 640, 40), hand: 'grip', w: 1 }, r: { ...armIK(o, 1, 150, 640, 40), hand: 'grip', w: 1 } };
    if (p > 0.01) o.arms.l = { ...armIK(o, -1, -900, 300, 120, 'out'), hand: 'point', w: p };
    return o;
  }
  function fivePose(tau, yaw) {                        // number five: leaning on the scooter
    const p = pointAll(tau, 0.18), o = { yaw, headYaw: 0.1 - 0.55 * p, look: [lerp(2, -16, p), lerp(3, -2, p)], rim: 1, close: blinkAt(tau, 6, 2.9), lean: -0.05, breath: 3 * Math.sin(tau * 1.0 + 3) };
    if (p > 0.01) o.arms = { l: { ...armIK(o, -1, -900, 300, 120, 'out'), hand: 'point', w: p } };
    return o;
  }
  const yawOf = (v) => clamp(v.yaw * 0.9, -0.95, 0.95);

  // where he walks in from (the morning, tau -7.6 … -5.6), and where he sits
  const moleAt = (tau) => { const u = sstep(S.walk0, S.sit0, tau); return { X: lerp(250, SEAT.X, u), Z: lerp(-2400, SEAT.Z, ease(clamp((tau - S.walk0) / (S.sit0 - S.walk0)))) }; };

  // ------------------------------------------------------------------ the stall scene: everything at scene time tau
  // o.cam overrides the camera; o.spot: { x, y, r, k } darkens all but a circle.
  function stallScene(g, tau, o = {}) {
    const c = o.cam || camStall(tau), tw = tau, blur = o.cam ? 0 : 9 * closeK(tau);
    // the background (soft while the camera is close on him)
    const far = (q) => {
      laneBack(q, c); stall(q, c, tw);
      const lifted = tau > S.turn + 0.2 && tau < S.back + 0.1;
      stove(q, c, lifted);
      const vw = personView(c, ATW.X, 0, ATW.Z, PI / 2);
      if (vw) { const W8 = wallahPose(tau, yawOf(vw)); drawPerson(q, c, WALLAH, ATW.X, 0, ATW.Z, PI / 2, W8.o);
        if (lifted) { const s = vw.s; kettle(q, vw.x - 260 * s, vw.y - 1594 * s + 780 * s, s * 0.8, -0.1); } }
      // the counter's front and top again, over the chaiwala's legs
      const X0 = -1500, pt = (z, Y, dx = 0) => P(c, X0 + dx, Y, z);
      poly(q, [pt(-740, 0, 430), pt(940, 0, 430), pt(940, 1100, 430), pt(-740, 1100, 430)], mix('#7a4a24', '#fff0d8', 0.04));
      for (let i = 1; i < 5; i++) poly(q, [pt(-740, i * 210, 431), pt(940, i * 210, 431), pt(940, i * 210 + 14, 431), pt(-740, i * 210 + 14, 431)], 'rgba(0,0,0,0.18)');
      poly(q, [pt(-740, 1100, 0), pt(940, 1100, 0), pt(940, 1100, 470), pt(-740, 1100, 470)], mix('#c99a5e', '#fff0d8', 0.04));
      for (let i = 0; i < 4; i++) { const g2 = pt(200 + i * 110, 1100, 330); if (g2) glass(q, g2[0], g2[1] - 60 * g2[2], g2[2] * 0.42, 0.8); }
      if (lifted) { const b = P(c, STOVE.X + 40, 1500, STOVE.Z); if (b) steam(q, b[0], b[1], tw, b[2] * 3.4, 0.6 * win(tau, S.turn + 0.1, S.turn + 0.4, S.back - 0.3, S.back + 0.1)); }
      const v4 = personView(c, AT4.X, 0, AT4.Z, AT4.a), F4 = v4 ? fourPose(c, v4, tau) : null;
      if (!F4 || F4.reach < 0.5) tinOnCounter(q, c);
      // the people round the stall, far ones first
      const peeps = [];
      const add = (X, Z, f) => peeps.push({ d: Math.hypot(X - c.x, Z - c.z), f });
      add(AT5.X, AT5.Z, () => { scooter(q, c, AT5.X + 120, AT5.Z + 420); const v = personView(c, AT5.X, 0, AT5.Z, PI / 2 - 0.5); if (v) drawPerson(q, c, FIVE, AT5.X, 0, AT5.Z, PI / 2 - 0.5, fivePose(tau, yawOf(v))); });
      add(AT2.X, AT2.Z, () => { const v = personView(c, AT2.X, 0, AT2.Z, PI / 2 + 0.35); if (!v) return; drawPerson(q, c, TWO, AT2.X, 0, AT2.Z, PI / 2 + 0.35, twoPose(tau, yawOf(v)));
        if (pointAll(tau, 0.12) < 0.6) { const s = v.s, w = wristOf({ ...twoPose(tau, yawOf(v)) }, 1); phone(q, v.x + (w.x) * s, v.y - 1594 * s + (w.y + 40) * s, s); } });
      add(AT4.X, AT4.Z, () => { if (!F4) return; const v = v4, s = v.s, po = F4.o;
        const bagX = v.x - 150 * s, bagY = v.y - 1594 * s + 880 * s, open = win(tau, S.lift0 + 0.1, S.lift0 + 0.3, S.lift1, S.lift1 + 0.25), bulge = sstep(S.lift1 - 0.1, S.lift1 + 0.1, tau);
        drawPerson(q, c, FOUR, AT4.X, 0, AT4.Z, AT4.a, po);
        clothBag(q, bagX, bagY, s, open, bulge); strap(q, bagX + 120 * s, bagY + 10 * s, v.x + 60 * s, v.y - 1594 * s + 330 * s, s);
        if (F4.reach >= 0.5 && F4.drop < 0.97) {                  // the tin in his hand, then into the bag (and it stays there)
          const w = wristOf(po, -1), dir = [-Math.sin(w.ang), Math.cos(w.ang)];
          const fx = v.x + (w.x + dir[0] * 60) * s, fy = v.y - 1594 * s + (w.y + dir[1] * 60) * s, inBag = sstep(0.55, 1, F4.drop);
          q.save(); if (inBag > 0) { q.beginPath(); q.rect(-100, -100, W + 200, bagY + 6 * s + 100); q.clip(); }
          tinAt(q, fx, fy + 20 * s, s * 0.95, 0.15 * F4.drop); q.restore();
        } });
      add(AT1.X, AT1.Z, () => { const v = personView(c, AT1.X, 0, AT1.Z, PI / 2 + 0.25); if (!v) return; const s = v.s;
        bench(q, c, AT1.X - 120, AT1.Z, 900);
        figure(q, ONE, v.x, v.y - 1200 * s, s, onePose(tau, yawOf(v)));
        if (pointAll(tau, 0.22) < 0.5) newspaper(q, v.x, v.y - 1200 * s + 540 * s, s); });
      if (tau > S.boy0 - 0.1 && tau < S.boy1 + 0.1) {          // the boy, running past with his bat, between the counter and the tables
        const u = clamp((tau - S.boy0) / (S.boy1 - S.boy0)), Zb = lerp(2400, -2400, u), Xb = -150;
        add(Xb, Zb, () => { const vb = drawPerson(q, c, BOY, Xb, 0, Zb, 0, { walk: 2.4, phase: tau * 15, legs: true, lean: 0.14, headYaw: -0.1, look: [-10, 0], rim: 1, op: 0.12, scale: 0.74 });
          if (vb) { const s = vb.s * 0.74; q.save(); q.translate(vb.x + 140 * s, vb.y - 1594 * s + 760 * s); q.rotate(-0.9 + 0.3 * Math.sin(tau * 15)); q.fillStyle = '#d9b27a'; R(q, -26 * s, -40 * s, 52 * s, 520 * s, 18 * s); q.fill(); q.restore(); } });
      }
      peeps.sort((a, b) => b.d - a.d).forEach((p) => { q.save(); p.f(); q.restore(); });
    };
    if (blur > 0.3) { const q = fresh(A.buf(3)); far(q); g.save(); g.filter = `blur(${blur.toFixed(1)}px)`; g.drawImage(A.buf(3), 0, 0); g.restore(); }
    else far(g);
    // him, at the next table (or walking in, the morning)
    const at = moleAt(tau), seated = sstep(S.sit0, S.sit1, tau);
    const FACE = PI / 2 + 0.3, v = personView(c, at.X, 0, at.Z, lerp(0, FACE, seated));
    if (v) {
      const s0 = v.s, mo = molePose(tau, yawOf(v));
      bench(g, c, SEAT.X - 380, SEAT.Z, 1100);
      if (seated < 0.999) { g.save(); g.globalAlpha = 1; drawPerson(g, c, MOLE, at.X, -330 * seated, at.Z, lerp(0, FACE, seated), { ...mo, legs: seated < 0.5 }); g.restore(); }
      else { const h = P(c, SEAT.X, SEAT.Y, SEAT.Z); if (h) figure(g, MOLE, h[0], h[1], h[2], mo); }
      table(g, c, SEAT.X + 380, SEAT.Z, 640);
      if (seated < 0.95) { const gp = P(c, SEAT.X + 380, 760, SEAT.Z - 120); if (gp) glass(g, gp[0], gp[1] - 70 * gp[2], gp[2] * 0.5, 0.85); }
    }
    // your own table, at the bottom of the frame, and your glass
    table(g, c, 1350, -40, 760);
    const yg = P(c, 1320, 760, -230); if (yg) glass(g, yg[0], yg[1] - 80 * yg[2], yg[2] * 0.55, 0.7);
    if (o.spot && o.spot.k > 0.001) { const { x, y, r, k } = o.spot; g.fillStyle = rg(g, x, y, r * 0.55, r * 1.5, [0, 'rgba(10,8,14,0)'], [1, `rgba(10,8,14,${(0.66 * k).toFixed(3)})`]); g.fillRect(0, 0, W, H); }
    A.vignette(g, 0.45);
    return c;
  }
  function screenOf(tau, who) {                        // where him (3) or the theft (4) is on screen, for the spotlight
    const c = cam(CW);
    if (who === 3) { const h = P(c, SEAT.X, SEAT.Y, SEAT.Z); return h ? { x: h[0], y: h[1] + 140 * h[2], r: 420 * h[2] } : { x: 760, y: 980, r: 260 }; }
    const v = personView(c, AT4.X, 0, AT4.Z, AT4.a), b = P(c, BOXP.X, 1150, BOXP.Z);
    return v && b ? { x: (v.x + b[0]) / 2, y: (v.y - 1594 * v.s * 0.55 + b[1]) / 2, r: 600 * v.s } : { x: 500, y: 850, r: 240 };
  }
  function tape(g, t, k, back) {                       // the tape: rewinding, or a replay (bands, scan lines, a symbol)
    if (k <= 0.002) return;
    const f = Math.round(t * 30), r = mulberry32(4100 + f);
    g.save(); g.globalAlpha = k;
    g.fillStyle = 'rgba(30,40,60,0.14)'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 5; i++) { const y = ((r() * H + f * (back ? -61 : 23) * (i + 1)) % H + H) % H, h = 6 + r() * 26; g.fillStyle = `rgba(255,255,255,${(0.06 + 0.16 * r()).toFixed(3)})`; g.fillRect(0, y, W, h); }
    g.fillStyle = 'rgba(0,0,0,0.10)'; for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 2);
    txt(g, back ? '◀◀ REWIND' : '▶ REPLAY', 100, 352, 46, '#fff9ea', { kind: 'mono', stroke: 'rgba(0,0,0,0.6)', sw: 0.08 });
    g.restore();
  }

  // ------------------------------------------------------------------ the line: the five men from the stall, in front of it, with cardboard numbers
  const LINE = [ONE, TWO, MOLE, FOUR, FIVE];
  function shotLine(g, t) {
    const push = seg(T.line0, T.rew0, t);
    const cb = cam({ x: 3400, y: 1350, z: 60, yaw: -PI / 2, pitch: -0.02, f: 900, cy: 860 });
    const q = fresh(A.buf(3)); laneBack(q, cb); stall(q, cb, t);
    g.save(); g.filter = 'blur(7px)'; g.drawImage(A.buf(3), 0, 0); g.restore();
    g.fillStyle = 'rgba(255,238,210,0.24)'; g.fillRect(0, 0, W, H);
    const z = 1 + 0.05 * push; g.save(); g.translate(540, 1000); g.scale(z, z); g.translate(-540, -1000);
    for (let i = 0; i < 5; i++) {
      const x = 128 + i * 206, y = 690, s = 0.54, ti = t + i * 1.7;
      g.fillStyle = 'rgba(60,40,20,0.22)'; ell(g, x, y + 1594 * s, 140, 26); g.fill();
      const o = { rim: 1, legs: true, cap: i === 2 ? 1 : undefined, look: [0, 2], close: blinkAt(t, i + 2, 3.2 + i * 0.3), breath: 4 * Math.sin(ti * 1.3), headYaw: 0.04 * Math.sin(ti * 0.6) };
      if (i === 2) { const sp = win(t, T.line0 + 2.4, T.line0 + 2.8, T.line0 + 3.4, T.line0 + 3.8); o.hands = { l: 'glass' }; o.glassK = 0.58; o.arms = { l: { ...armIK(o, -1, lerp(-120, -100, sp), lerp(520, 330, sp), 60), hand: 'glass', w: 1 } }; }
      if (i === 1) o.tilt = 0.08 * win(t, T.line0 + 3.6, T.line0 + 3.9, T.line0 + 5.2, T.line0 + 5.6);
      if (i === 0) o.worry = 3;
      g.save();
      if (i === 3) { clothBag(g, x + 200 * s, y + 880 * s, s, 0, 1); }
      figure(g, LINE[i], x, y, s, o);
      if (i === 3) strap(g, x + 80 * s, y + 890 * s, x - 60 * s, y + 330 * s, s);
      // the cardboard number, held at the chest
      const cy = y + 760 * s, k = sstep(T.line0 + 0.1 + i * 0.12, T.line0 + 0.35 + i * 0.12, t);
      g.globalAlpha = k; g.fillStyle = '#d8b383'; R(g, x - 78, cy - 56, 156, 112, 8); g.fill(); g.strokeStyle = 'rgba(80,50,20,0.45)'; g.lineWidth = 4; g.stroke();
      txt(g, String(i + 1), x, cy + 38, 104, '#17130f', { align: 'center' }); g.globalAlpha = 1;
      g.restore();
    }
    g.restore();
    if (t >= T.l4 - 0.05 && t < T.pick0 + 0.1) { title(g, 'WHOEVER YOU PICK', 330, 92, CREAM, t, T.l4); title(g, 'GOES TO JAIL', 446, 116, '#ff5a3c', t, T.l4 + 0.5); }
    if (t >= T.pick0 && t < T.pick1 + 0.25) { ring(g, 540, 400, 84, 1 - clamp((t - T.pick0) / (T.pick1 - T.pick0)), 16); if (t > T.pick1) { g.fillStyle = `rgba(255,253,244,${(0.5 * (1 - (t - T.pick1) / 0.25)).toFixed(3)})`; g.fillRect(0, 0, W, H); } }
    A.vignette(g, 0.4);
  }

  // ------------------------------------------------------------------ the cell, that night
  function shotCell(g, t) {
    const push = seg(T.cell0, T.lane0, t);
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#27304a'], [1, '#161c2a']); g.fillRect(0, 0, W, H);
    g.fillStyle = '#323b52'; g.fillRect(0, 1380, W, 540);
    g.fillStyle = 'rgba(170,200,255,0.12)'; g.beginPath(); g.moveTo(640, 430); g.lineTo(860, 430); g.lineTo(1080, 1500); g.lineTo(500, 1500); g.closePath(); g.fill();
    g.fillStyle = '#0d1018'; R(g, 640, 330, 220, 170, 6); g.fill(); g.fillStyle = 'rgba(170,200,255,0.6)'; R(g, 652, 342, 196, 146, 4); g.fill();
    g.fillStyle = '#0d1018'; for (let i = 0; i < 4; i++) g.fillRect(676 + i * 48, 342, 10, 146);
    const z = 1 + 0.07 * push; g.save(); g.translate(540, 1000); g.scale(z, z); g.translate(-540, -1000);
    const X0 = 420, Y0 = 720, s = 0.6, hip = Y0 + 1000 * s;
    g.fillStyle = '#4a3f30'; R(g, 60, hip - 30, 880, 70, 8); g.fill(); g.fillStyle = '#382f24'; g.fillRect(100, hip + 40, 40, 1500 - hip); g.fillRect(860, hip + 40, 40, 1500 - hip);
    const look = sstep(T.l10 - 0.4, T.l10 + 0.1, t), sip = win(t, T.cell0 + 0.8, T.cell0 + 1.2, T.cell0 + 2.0, T.cell0 + 2.4);
    // his legs, seated: the thighs coming towards you, the shins down to the floor
    for (const k of [-1, 1]) { const kx = X0 + k * 95 * s * 1.6; g.fillStyle = lg(g, kx - 60, hip, kx + 60, hip, [0, '#262c38'], [1, '#1b2029']); R(g, kx - 72, hip - 20, 144, 170, 60); g.fill(); R(g, kx - 58, hip + 120, 116, 1520 - hip - 120, 40); g.fill(); g.fillStyle = '#111'; R(g, kx - 80, 1500, 170, 60, 26); g.fill(); }
    const o = { rim: 0, cap: 1, yaw: 0.12, headYaw: lerp(0.35, -0.05, look), look: [lerp(14, 2, look), lerp(8, 1, look)], hands: { l: 'glass' }, glassK: 0.58, close: blinkAt(t, 7, 3.0), frown: 0.25 * look, browY: 3 * look, breath: 3 * Math.sin(t * 1.2) };
    o.arms = { l: { ...armIK(o, -1, lerp(-150, -120, sip), lerp(560, 330, sip), 60), hand: 'glass', w: 1 }, r: { ...armIK(o, 1, 230, 820, 40), hand: 'relax', w: 1 } };
    figure(g, MOLE, X0, Y0, s, o);
    g.restore();
    g.fillStyle = 'rgba(20,30,70,0.30)'; g.fillRect(0, 0, W, H);
    for (const x of [40, 270, 590, 820, 1050]) { g.fillStyle = lg(g, x - 20, 0, x + 20, 0, [0, '#1a1c22'], [0.4, '#5a606a'], [1, '#14161b']); g.fillRect(x - 18, 0, 36, H); }
    g.fillStyle = '#23262d'; g.fillRect(0, 300, W, 34); g.fillRect(0, 1560, W, 34);
    A.vignette(g, 0.8);
  }

  // ------------------------------------------------------------------ the lane: number four walks away with the box; the boy's cricket behind
  function shotLane(g, t) {
    const d = t - T.lane0, c = cam({ x: -120, y: 1450, z: -1500 + 1100 * d, yaw: 0.03, pitch: -0.07, f: 950, cy: 900 });
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#f6cf98'], [1, '#f0dcb4']); g.fillRect(0, 0, W, H);
    const cols = ['#e9a597', '#9fcfee', '#f0cf86', '#c5b8ea', '#f3a98f', '#92cfc5'];
    for (const sd of [-1, 1]) for (let i = 7; i >= 0; i--) { const z0 = -2400 + i * 2400, X = sd * 2200, hz = clamp((z0 - c.z) / 18000);
      cpoly(g, c, [[X, 0, z0], [X, 0, z0 + 2400], [X, 4200 + (i % 3) * 600, z0 + 2400], [X, 4200 + (i % 3) * 600, z0]], mix(cols[(i + (sd > 0 ? 3 : 0)) % 6], '#f8d4a2', hz));
      cpoly(g, c, [[X - sd * 2, 0, z0 + 500], [X - sd * 2, 0, z0 + 1400], [X - sd * 2, 2300, z0 + 1400], [X - sd * 2, 2300, z0 + 500]], mix('#4a3530', '#f8d4a2', hz)); }
    cpoly(g, c, [[-2200, 0, c.z + 200], [2200, 0, c.z + 200], [2200, 0, 22000], [-2200, 0, 22000]], '#cdb08a');
    // the boy and two others at their cricket, far down the lane
    for (const [X, Z, a] of [[700, 8200, 0.25], [-600, 10200, PI], [300, 11600, PI]]) drawPerson(g, c, BOY, X, 0, Z, a, { rim: 1, legs: true, walk: 0.3, phase: t * 4 + X, scale: 0.72 });
    const bv = P(c, 700, 640, 8200); if (bv) { g.save(); g.translate(bv[0] + 60 * bv[2], bv[1]); g.rotate(-1.2 + 0.9 * Math.sin(t * 5)); g.fillStyle = '#d9b27a'; R(g, -20 * bv[2], -30 * bv[2], 40 * bv[2], 400 * bv[2], 14 * bv[2]); g.fill(); g.restore(); }
    // number four, from behind, walking away, the bag on his shoulder with a corner of blue at its mouth
    const Z4 = 1000 + 1150 * d, v = drawPerson(g, c, FOUR, 150, 0, Z4, PI, { walk: 1.0, phase: d * 7.5, legs: true, rim: 1 });
    if (v) { const s = v.s, bx = v.x + 170 * s, by = v.y - 1594 * s + 860 * s; tinAt(g, bx, by - 30 * s, s * 0.8, -0.2); clothBag(g, bx, by, s, 0.6, 1); strap(g, bx - 120 * s, by + 10 * s, v.x - 60 * s, v.y - 1594 * s + 330 * s, s); }
    A.vignette(g, 0.45);
  }

  // ------------------------------------------------------------------ the film
  function frame(g, t) {
    if (t < T.line0) return stallScene(g, t);            // frame 0 to the shout
    if (t < T.rew0) return shotLine(g, t);
    const CAMW = cam(CW);
    if (t < T.rep0) {                                    // the tape runs back to the stall before the box went
      const u = (t - T.rew0) / (T.rep0 - T.rew0), tau = lerp(7.4, 2.8, ease(u));
      stallScene(g, tau, { cam: CAMW }); tape(g, t, 1, true); return;
    }
    if (t < T.rew2) {                                    // replay 1: him, the whole time
      const tau = 2.8 + (t - T.rep0), sp = screenOf(tau, 3);
      stallScene(g, tau, { cam: CAMW, spot: { ...sp, k: sstep(T.rep0, T.rep0 + 0.4, t) } }); tape(g, t, 0.5, false); return;
    }
    if (t < T.slow0) {                                   // back again, quickly
      const u = (t - T.rew2) / (T.slow0 - T.rew2), tau = lerp(2.8 + (T.rew2 - T.rep0), 3.9, ease(u));
      stallScene(g, tau, { cam: CAMW }); tape(g, t, 1, true); return;
    }
    if (t < T.cell0) {                                   // the theft, slowed down: the spotlight slides from him to the counter
      const u = clamp((t - T.slow0) / (T.slow1 - T.slow0)), tau = lerp(3.9, 5.0, u), a = screenOf(tau, 3), b = screenOf(tau, 4), k = sstep(0.05, 0.3, u);
      stallScene(g, tau, { cam: CAMW, spot: { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), r: lerp(a.r, b.r, k), k: 1 } }); tape(g, t, 0.5, false);
      if (u > 0.35) { g.save(); g.globalAlpha = sstep(0.35, 0.5, u); g.strokeStyle = '#ffd34a'; g.lineWidth = 10; g.beginPath(); g.arc(b.x, b.y, b.r * 0.62, 0, TAU); g.stroke(); txt(g, '4', b.x + b.r * 0.55, b.y - b.r * 0.45, 96, '#ffd34a', { kind: 'mono', align: 'center', stroke: INK, sw: 0.12 }); g.restore(); }
      return;
    }
    if (t < T.lane0) return shotCell(g, t);
    if (t < T.morn0) return shotLane(g, t);
    stallScene(g, t - DUR);                              // the morning: the stall before frame 0; its last frame runs into the first
  }
  function frameText(g, t) {                           // the words on frame 0, and on the last frames, which run into it
    const a = t < T.line0 ? 1 - sstep(2.4, 2.9, t) : sstep(T.e13 - 0.25, T.e13 + 0.15, t);
    if (a > 0.002) { g.save(); g.globalAlpha = a; txt(g, "YOU'VE GOT", 540, 392, 96, CREAM, { align: 'center', stroke: INK, sw: 0.14 }); txt(g, '5 SECONDS', 540, 530, 150, '#ffd34a', { align: 'center', stroke: INK, sw: 0.13 }); g.restore(); }
  }
  scene({
    name: 'film', from: 'hook', to: 'end',
    build(root, S0) { S0.g = canvas(root); },
    run(t, b, S0) {
      const g = S0.g;
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.setLineDash([]); g.filter = 'none'; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H);
      g.save(); frame(g, t); g.restore();
      g.save(); frameText(g, t); g.restore();
    },
  });
  window.UI.grain();
  C.start();
})();
