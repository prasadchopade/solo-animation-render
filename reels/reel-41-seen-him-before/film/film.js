// Reel 41 · Seen Him Before (working title). Tests desk, an episode of "You're the test subject", built round Season 1's thief, in his one
// innocent episode (the user's yes, 17 Nov). You're at the chai stall; the man with the mole sits at the next table with his chai, and his face
// is the first thing you see. "You've got five seconds before this stall gets robbed." While the chaiwala's back is turned, a man in a blue shirt
// slides the cash box into his cloth bag, a boy runs past with a bat, and everyone points at the boy. Five men stand in a line; whoever you
// pick goes to jail. For once, the man with the mole did nothing: the theft plays again, he never left his seat, and number four took it in
// plain view. He spends the night in a cell if you chose him; the thief walks off with the box; and the next morning he walks back to his
// table, sits down and looks at you, which is frame 0. No end card: the film is a loop (the user's trial, 17 Nov).
// Facts: docs/research.md. The script: docs/script.md. The camera is reel 37's free camera (rig.js); the faces, the cap, the bodies, the
// chai stall and the thief's drawing are reel 36's (r36.js), as the brief names them; the arms and hands are this reel's own (r36.js, the
// block marked reel 41, on the user's note of 18 Nov). Our own drawings; nobody real. 30 fps. Every frame is a
// pure function of t, sealed in save()/restore().
(() => {
  const { W, H, scene, canvas, clamp, lerp, mulberry32 } = C;
  const RG = window.RIG, A = window.R36, K = window.KIT;
  const { sstep, txt, R, ell, lg, rg, mix, ring, title, blinkAt, figure, glass, armIK, wristOf, chaiStall, steam, poly, PJ, personView, drawPerson, THIEF0, INK, CREAM } = A;
  C.fonts = ['700 condensed 100px Bahn', '700 semi-condensed 46px Bahn', '600 semi-condensed 64px Bahn', '400 30px Mono', '700 30px Mono'];
  const TAU = Math.PI * 2, PI = Math.PI, DUR = C.TL.marks && C.TL.marks.done !== undefined ? C.bt('end') : C.DUR;   // the film's own end (with the card, 3 s before the timeline's)
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
    const word = (p, re, d) => { const w = Wd(p).find((x) => re.test(x.w)); return w ? w.t0 : d; };
    const T = { line0: 7.6, l2: 7.8, l3: 9.6, l4: 10.8, pick0: 12.7, pick1: 15.2, l5: 15.4, rew0: 18.0, rep0: 19.0, l6: 19.1, l7: 20.8, rew2: 23.2, slow0: 23.6, l8: 23.7,
      slow1: 26.1, cell0: 26.1, l9: 26.4, mem0: 30.0, e1: 30.3, e2: 31.4, e3: 33.2, e3p: 33.9, e3c: 35.4, e4: 36.6, e4u: 37.6, lane0: 39.6, l11: 39.9,
      morn0: DUR - 7.6, l12: DUR - 4.0, l13: DUR - 2.7, e13: DUR - 1.0 };
    if (has('n02')) {                                   // the placed voice: the picture follows the words
      T.l2 = at('n02'); T.line0 = T.l2 - 0.25; T.l3 = at('n03'); T.l4 = at('n04'); T.pick0 = en('n04') + 0.05; T.pick1 = T.pick0 + 2.5;
      T.l5 = at('n05'); T.rew0 = en('n05') + 0.45; T.rep0 = T.rew0 + 0.95; T.l6 = at('n06'); T.l7 = at('n07');
      T.rew2 = en('n07') + 0.05; T.slow0 = T.rew2 + 0.4; T.l8 = at('n08'); T.slow1 = en('n08') + 0.35; T.cell0 = T.slow1;
      T.l9 = at('n09'); T.morn0 = DUR - 7.6; T.l12 = at('n12'); T.l13 = at('n13'); T.e13 = en('n13');
    }
    if (has('e1')) {                                    // the explanation (draft 4)
      T.mem0 = en('n09') + 0.45; T.e1 = at('e1'); T.e2 = at('e2'); T.e3 = at('e3'); T.e3p = word('e3', /paste/i, T.e3 + 0.6); T.e3c = word('e3', /crime/i, T.e3 + 2.0);
      T.e4 = at('e4'); T.e4u = word('e4', /unconscious/i, T.e4 + 1.0); T.lane0 = en('e4') + 0.5; T.l11 = at('n11');
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
  const KETTLE = 0.72;                                // the kettle's size (a 33 cm aluminium kettle)
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
    if (!lifted) kettle(g, b[0], b[1], b[2] * KETTLE, 0);
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
  function clothBag(g, x, y, s, open = 0, bulge = 0) { // number four's cloth bag at his hip (a jhola): khaki with a stripe
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = lg(g, -170, -20, 170, 300, [0, BAG], [1, BAGD]);
    g.beginPath(); g.moveTo(-160, 0); g.lineTo(160, 0); g.bezierCurveTo(175 + 25 * bulge, 120, 170 + 30 * bulge, 260, 140, 300); g.lineTo(-140, 300); g.bezierCurveTo(-170 - 20 * bulge, 260, -175 - 20 * bulge, 120, -160, 0); g.closePath(); g.fill();
    g.fillStyle = '#8f3f2e'; g.fillRect(-166, 70, 332 + 20 * bulge, 26);
    if (open > 0.01) { g.fillStyle = 'rgba(40,28,16,0.75)'; ell(g, 0, 4, 150, 22 * open); g.fill(); }
    g.restore();
  }
  const strap = (g, x0, y0, x1, y1, s) => { g.strokeStyle = BAGD; g.lineWidth = 22 * s; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };

  // ------------------------------------------------------------------ how hands move (reel 41's own, on the user's note of 18 Nov: "create
  // natural hands"). A hand travels on an arc, eased in and out; a point is flung past its mark and settles, and pumps with a shout; one pose
  // blends into the next through the joints' angles, so nothing snaps. Every hand does something: a glass, a phone, a newspaper, a kettle.
  const along = (A0, B0, h, u) => { const k = ease(u); return [lerp(A0[0], B0[0], k), lerp(A0[1], B0[1], k) - h * Math.sin(PI * k)]; };
  const mixP = (A0, B0, k) => [lerp(A0[0], B0[0], k), lerp(A0[1], B0[1], k)];
  const ik = (o, k, p, hand, ex = {}) => ({ ...armIK(o, k, p[0], p[1], 0, ex.pole), hand, w: 1, ...ex });
  const blendArm = (A0, B0, w) => (w <= 0.001 ? A0 : w >= 0.999 ? B0 : { ...(w > 0.5 ? B0 : A0), a1: lerp(A0.a1, B0.a1, w), a2: lerp(A0.a2, B0.a2, w), w: lerp(A0.w ?? 1, B0.w ?? 1, w) });
  function pointing(tau, t0, t1, aim, pump = 0) {     // a point at the boy: how far into it, and where its wrist goes
    const u = tau - t0, w = sstep(-0.05, 0.22, u) * (1 - sstep(t1 - t0, t1 - t0 + 0.45, u));
    const fling = u > 0 ? Math.exp(-6 * u) * Math.sin(9 * u) * 0.1 : 0;
    const jab = pump * Math.max(0, Math.sin(TAU * 2.2 * (u - 0.4))) * sstep(0.4, 0.55, u) * (1 - sstep(1.3, 1.7, u));
    return { w, p: [aim[0] * (1 + fling) - 50 * jab, aim[1] - 26 * jab] };
  }
  const AIM = [-700, 420];                            // out to the screen's left (the stall scene aims each point at the boy himself)
  const REST3 = [-62, 505], LIPS3 = [-58, 236];        // his glass hand's wrist: the glass at his chest, and at his lips

  // ------------------------------------------------------------------ the people, as functions of the stall's clock (each takes the body's
  // turn first: the arms are solved for the turn they're drawn at)
  function molePose(tau, yaw, tbl = [-60, 860]) {      // him (number three), at the next table: his glass in his right hand (the screen's left)
    const walking = 1 - sstep(S.sit0, S.sit1, tau), seated = 1 - walking;
    const reachT = seg(-4.75, -4.3, tau), lift = seg(-4.15, -3.55, tau), held = tau >= -4.3;           // the morning: he picks his glass up
    const sipM = win(tau, -2.75, -2.3, -1.6, -1.15), sipT = win(tau, 3.85, 4.3, 5.05, 5.45), sip = Math.max(sipM, sipT);   // sipping, eyes shut, when the box goes
    const swirl = win(tau, 1.0, 1.4, 3.3, 3.7);                                                        // he looks into his chai and swirls it
    const atYou = win(tau, -1.0, -0.6, 0.7, 1.1), down = win(tau, 1.0, 1.4, 3.6, 3.95), at4 = sstep(5.75, 6.15, tau);   // after the shout, his eyes go to number four
    const o = { yaw, headYaw: lerp(lerp(0.0, -0.62 * yaw, atYou), -0.55, at4), look: [lerp(lerp(-4, 3, atYou), -17, at4), lerp(lerp(3, 1, atYou), 12, down) * (1 - at4) - 6 * at4],
      cap: 1, rim: 1, glassK: 0.56, close: Math.max(blinkAt(tau, 3, 3.1) * (1 - atYou), 0.92 * sstep(0.55, 0.95, sipT), 0.5 * sstep(0.6, 1, sipM)),
      smirk: 0.2 * at4 + 0.1 * atYou, smile: 0.05 * atYou, browUp: 6 * at4, tilt: -0.05 * sstep(0.5, 1, sip), breath: 4 * Math.sin(tau * 1.6), walk: walking, phase: tau * 7.5 };
    let wp = held ? (tau < -3.55 ? along(tbl, REST3, 60, lift) : REST3) : tbl;
    if (sip > 0) wp = along(wp, LIPS3, 24, sip);
    if (swirl > 0) wp = [wp[0] + 10 * Math.sin(tau * 5.5) * swirl, wp[1] + 6 * Math.cos(tau * 5.5) * swirl];
    o.glassTilt = 0.5 * sstep(0.55, 1, sip) + 0.07 * Math.sin(tau * 5.5 + 1) * swirl;
    o.arms = { l: ik(o, -1, wp, held ? 'glass' : 'relax', { w: held ? seated : seated * reachT, over: sip > 0.3, pole: [-0.12, 1] }), r: ik(o, 1, [205, 770], 'relax', { w: seated, pole: 'down' }) };
    return o;
  }
  function fourPose(c, v, tau, aim = AIM) {                       // number four, at the counter: his hand by the box; the box into his bag; then he points hardest
    const yaw = clamp(v.yaw * 0.9, -0.95, 0.95);
    const glance = win(tau, 3.9, 4.05, 4.15, 4.3);                                                     // a look at the chaiwala's back first
    const reachT = seg(S.lift0, S.lift0 + 0.2, tau), carryT = seg(S.lift0 + 0.22, S.lift1, tau), outT = seg(S.lift1, S.lift1 + 0.3, tau);
    const held = tau >= S.lift0 + 0.2 && carryT < 0.97;
    const pt = pointing(tau, S.shout + 0.08, 7.0, aim, 1);
    const o = { yaw, headYaw: lerp(-0.2, -0.6, pt.w) + 0.35 * glance + 0.12 * reachT * (1 - outT), look: [lerp(lerp(-8, -4, reachT), -16, pt.w) - 10 * glance, lerp(2, 7, reachT * (1 - outT))], rim: 1,
      op: 0.32 * pt.w * (0.6 + 0.4 * Math.abs(Math.sin(tau * 11))), browUp: 4 * pt.w, close: blinkAt(tau, 1, 3.6), breath: 3 * Math.sin(tau * 1.4 + 1) };
    const box = P(c, BOXP.X + 40, 1180, BOXP.Z), hx = v.x, hy = v.y - 1594 * v.s;
    const bx = box ? (box[0] - hx) / v.s : -500, by = box ? (box[1] - hy) / v.s : 900;
    const rest = [bx + 160, by + 70], onBox = [bx + 10, by - 85], bag = [-260, 900], pat = [-250, 860];
    let wp = mixP(rest, onBox, reachT);
    if (carryT > 0) wp = along(onBox, bag, 80, carryT);
    if (outT > 0) wp = mixP(wp, pat, ease(outT));
    const L0 = held ? ik(o, -1, wp, 'fist', { abs: 0.25 * carryT, carry: (g) => tinAt(g, 0, 92, 0.95, 0.12 * carryT) })
      : ik(o, -1, wp, reachT > 0.6 && outT < 0.5 ? 'fist' : 'flat', { abs: lerp(1.05, 0.2, reachT) + 0.6 * outT });   // the fingers lead to the box; flat on the counter, flat on the bag
    o.arms = { l: blendArm(L0, ik(o, -1, pt.p, 'point', { thumbUp: true }), pt.w), r: ik(o, 1, [150, 820], 'relax', { w: 0.6 }) };
    return { o, reachT, carryT, held };
  }
  function wallahPose(tau, yaw, kh, aim = AIM) {                  // the chaiwala: wiping the counter; turned to the stove, the kettle up off it; back with it in his hand, shouting
    const away = sstep(S.turn, S.turn + 0.3, tau) * (1 - sstep(S.back, S.back + 0.25, tau));
    const reachK = seg(4.25, 4.45, tau), held = tau >= 4.45, up = seg(4.45, 4.75, tau), down = seg(S.back, S.back + 0.3, tau);
    const pt = pointing(tau, S.shout - 0.02, 7.2, aim, 1.2);
    const o = { yaw: lerp(yaw, -0.95, away), look: [lerp(lerp(0, -18, away), -16, pt.w), lerp(lerp(8, 2, away), -4, pt.w)], op: pt.w * (0.45 + 0.35 * Math.abs(Math.sin(tau * 9))),
      browUp: 9 * pt.w, worry: 8 * pt.w, headYaw: -0.4 * pt.w - 0.2 * away, rim: 1, breath: 3 * Math.sin(tau * 1.2), legs: false };
    const wipe = 1 - sstep(S.turn - 0.15, S.turn + 0.1, tau);
    const W1 = [150 + 70 * Math.cos(tau * 3.4) * wipe, 700 + 20 * Math.sin(tau * 3.4) * wipe];
    const handle = [kh.x, kh.y], lifted = [kh.x + 25, kh.y - 45], side = [240, 640];
    let kp = mixP(W1, handle, reachK); if (held) kp = mixP(along(handle, lifted, 20, up), side, ease(down));
    const kettleIn = (g) => { kettle(g, 0, 460 * kh.k + 24, kh.k, -0.06 * Math.sin(tau * 3)); if (tau < S.back + 0.4) steam(g, 0, 24 - 40 * kh.k, tau, kh.k * 3.4, 0.55 * (1 - sstep(S.back, S.back + 0.4, tau))); };
    const R0 = held ? ik(o, 1, kp, 'fist', { carry: kettleIn, pole: 'down' }) : ik(o, 1, kp, wipe > 0.5 ? 'flat' : 'relax', { pole: 'down' });
    o.arms = { r: R0, l: blendArm(ik(o, -1, [-150, 700], 'flat', { w: wipe }), ik(o, -1, pt.p, 'point', { thumbUp: true }), pt.w) };
    return { o, away, held };
  }
  function twoPose(tau, yaw, aim = AIM) {                         // number two: on his phone; he looks up and points with the rest, the phone still in his hand
    const pt = pointing(tau, S.shout + 0.14, 7.2, aim, 0.4);
    const o = { yaw, headYaw: -0.1 - 0.3 * pt.w, tilt: 0.12 * (1 - pt.w), look: [lerp(-3, -15, pt.w), lerp(14, -2, pt.w)], rim: 1, close: blinkAt(tau, 4, 3.3), breath: 3 * Math.sin(tau * 1.3 + 2) };
    o.arms = { r: ik(o, 1, mixP([40 + 4 * Math.sin(tau * 0.7), 500], [190, 700], pt.w), 'phone', { front: true }),
      l: blendArm(ik(o, -1, [-200, 840], 'relax', { w: 0.5 }), ik(o, -1, pt.p, 'point', { thumbUp: true }), pt.w) };
    return o;
  }
  function newspaperHeld(g, J, droop) {                // his newspaper, its right edge in his right hand (the screen's right); the left hand lets go
    const w = J[1].Wr; g.translate(w[0] - 24, w[1]); g.rotate(-0.5 * droop);
    g.fillStyle = '#efe9dc'; R(g, -420, -175, 420, 320, 6); g.fill();
    g.fillStyle = 'rgba(40,36,30,0.33)'; for (let i = 0; i < 9; i++) g.fillRect(-396, -150 + i * 30, i % 3 === 0 ? 170 : 180, 9);
    for (let i = 0; i < 9; i++) g.fillRect(-196, -150 + i * 30, i % 4 === 0 ? 150 : 172, 9);
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(-212, -175, 5, 320);
  }
  function onePose(tau, yaw, aim = AIM) {                         // number one: the old man with his newspaper; he lowers it and points
    const low = seg(S.shout + 0.2, S.shout + 0.5, tau) * (1 - seg(7.2, 7.7, tau)), pt = pointing(tau, S.shout + 0.42, 7.1, aim, 0.2);
    const o = { yaw, headYaw: -0.12 - 0.3 * pt.w, look: [lerp(-2, -14, pt.w), lerp(12, 0, pt.w)], rim: 1, close: blinkAt(tau, 5, 3.7), breath: 2 * Math.sin(tau * 1.1), worry: 3 * pt.w };
    const y0 = lerp(600, 820, low), droop = sstep(0.3, 0.8, pt.w);
    o.arms = { l: blendArm(ik(o, -1, [215 - 468, y0], 'card', {}), ik(o, -1, pt.p, 'point', { thumbUp: true }), pt.w), r: ik(o, 1, [215, y0], 'card', { tilt: 0.5 * droop }) };
    o.held = (g, J) => newspaperHeld(g, J, droop);
    return o;
  }
  function fivePose(tau, yaw, aim = AIM) {                        // number five: leaning on the scooter, a fist on his hip; he points too
    const pt = pointing(tau, S.shout + 0.2, 7.1, aim, 0.3);
    const o = { yaw, headYaw: 0.1 - 0.55 * pt.w, look: [lerp(2, -16, pt.w), lerp(3, -2, pt.w)], rim: 1, close: blinkAt(tau, 6, 2.9), lean: -0.05, breath: 3 * Math.sin(tau * 1.0 + 3) };
    o.arms = { r: ik(o, 1, [215, 880], 'fist', { pole: 'out' }), l: blendArm(ik(o, -1, [-215, 860], 'relax', { w: 0.4 }), ik(o, -1, pt.p, 'point', { thumbUp: true }), pt.w) };
    return o;
  }
  const bat = (g) => { g.rotate(-2.55); g.fillStyle = '#d9b27a'; R(g, -21, 40, 42, 470, 16); g.fill(); g.fillStyle = '#7a4a24'; R(g, -13, -10, 26, 110, 10); g.fill(); };
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
      const vw = personView(c, ATW.X, 0, ATW.Z, PI / 2), kb = P(c, STOVE.X, 880, STOVE.Z);
      const kh = vw && kb ? { x: (kb[0] - vw.x) / vw.s, y: (kb[1] - 460 * KETTLE * kb[2] - (vw.y - 1594 * vw.s)) / vw.s, k: KETTLE * kb[2] / vw.s } : { x: -200, y: 300, k: 0.6 };
      const boyZ = lerp(2400, -2400, (tau - S.boy0) / (S.boy1 - S.boy0)), boy = P(c, -150, 950, boyZ);   // where the boy is (he runs on, off the frame)
      const aimAt = (hx, hy, s) => { if (!boy) return AIM; const d = [(boy[0] - hx) / s + 250, (boy[1] - hy) / s - 340], n = Math.hypot(d[0], d[1]) || 1; return [-250 + 540 * d[0] / n, 340 + 540 * d[1] / n]; };
      const W8 = vw ? wallahPose(tau, yawOf(vw), kh, aimAt(vw.x, vw.y - 1594 * vw.s, vw.s)) : null;
      stove(q, c, W8 && W8.held);
      if (vw) drawPerson(q, c, WALLAH, ATW.X, 0, ATW.Z, PI / 2, W8.o);
      // the counter's front and top again, over the chaiwala's legs
      const X0 = -1500, pt = (z, Y, dx = 0) => P(c, X0 + dx, Y, z);
      poly(q, [pt(-740, 0, 430), pt(940, 0, 430), pt(940, 1100, 430), pt(-740, 1100, 430)], mix('#7a4a24', '#fff0d8', 0.04));
      for (let i = 1; i < 5; i++) poly(q, [pt(-740, i * 210, 431), pt(940, i * 210, 431), pt(940, i * 210 + 14, 431), pt(-740, i * 210 + 14, 431)], 'rgba(0,0,0,0.18)');
      poly(q, [pt(-740, 1100, 0), pt(940, 1100, 0), pt(940, 1100, 470), pt(-740, 1100, 470)], mix('#c99a5e', '#fff0d8', 0.04));
      for (let i = 0; i < 4; i++) { const g2 = pt(200 + i * 110, 1100, 330); if (g2) glass(q, g2[0], g2[1] - 60 * g2[2], g2[2] * 0.42, 0.8); }
      const v4 = personView(c, AT4.X, 0, AT4.Z, AT4.a), F4 = v4 ? fourPose(c, v4, tau, aimAt(v4.x, v4.y - 1594 * v4.s, v4.s)) : null;
      if (!F4 || tau < S.lift0 + 0.2) tinOnCounter(q, c);
      // the people round the stall, far ones first
      const peeps = [];
      const add = (X, Z, f) => peeps.push({ d: Math.hypot(X - c.x, Z - c.z), f });
      add(AT5.X, AT5.Z, () => { scooter(q, c, AT5.X + 120, AT5.Z + 420); const v = personView(c, AT5.X, 0, AT5.Z, PI / 2 - 0.5); if (v) drawPerson(q, c, FIVE, AT5.X, 0, AT5.Z, PI / 2 - 0.5, fivePose(tau, yawOf(v), aimAt(v.x, v.y - 1594 * v.s, v.s))); });
      add(AT2.X, AT2.Z, () => { const v = personView(c, AT2.X, 0, AT2.Z, PI / 2 + 0.35); if (v) drawPerson(q, c, TWO, AT2.X, 0, AT2.Z, PI / 2 + 0.35, twoPose(tau, yawOf(v), aimAt(v.x, v.y - 1594 * v.s, v.s))); });
      add(AT4.X, AT4.Z, () => { if (!F4) return; const v = v4, s = v.s;
        const bagX = v.x - 150 * s, bagY = v.y - 1594 * s + 880 * s, open = win(tau, S.lift0 + 0.1, S.lift0 + 0.3, S.lift1, S.lift1 + 0.25), bulge = sstep(S.lift1 - 0.1, S.lift1 + 0.1, tau);
        drawPerson(q, c, FOUR, AT4.X, 0, AT4.Z, AT4.a, F4.o);
        clothBag(q, bagX, bagY, s, open, bulge); strap(q, bagX + 120 * s, bagY + 10 * s, v.x + 60 * s, v.y - 1594 * s + 330 * s, s); });
      add(AT1.X, AT1.Z, () => { const v = personView(c, AT1.X, 0, AT1.Z, PI / 2 + 0.25); if (!v) return; const s = v.s;
        bench(q, c, AT1.X - 120, AT1.Z, 900);
        figure(q, ONE, v.x, v.y - 1200 * s, s, onePose(tau, yawOf(v), aimAt(v.x, v.y - 1200 * s, s))); });
      if (tau > S.boy0 - 0.1 && tau < S.boy1 + 0.1) {          // the boy, running past with his bat, between the counter and the tables
        const u = clamp((tau - S.boy0) / (S.boy1 - S.boy0)), Zb = lerp(2400, -2400, u), Xb = -150;
        add(Xb, Zb, () => drawPerson(q, c, BOY, Xb, 0, Zb, 0, { walk: 2.4, run: 1, phase: tau * 15, legs: true, lean: 0.14, headYaw: -0.1, look: [-10, 0], rim: 1, op: 0.12, scale: 0.74, carry: { r: bat } }));
      }
      peeps.sort((a, b) => b.d - a.d).forEach((p) => { q.save(); p.f(); q.restore(); });
    };
    if (blur > 0.3) { const q = fresh(A.buf(3)); far(q); g.save(); g.filter = `blur(${blur.toFixed(1)}px)`; g.drawImage(A.buf(3), 0, 0); g.restore(); }
    else far(g);
    // him, at the next table (or walking in, the morning)
    const at = moleAt(tau), seated = sstep(S.sit0, S.sit1, tau);
    const FACE = PI / 2 + 0.3, v = personView(c, at.X, 0, at.Z, lerp(0, FACE, seated));
    const h0 = P(c, SEAT.X, SEAT.Y, SEAT.Z), gp = P(c, SEAT.X + 380, 760, SEAT.Z - 120);
    if (v) {
      const tbl = h0 && gp ? [(gp[0] - h0[0]) / h0[2] - 44 * 1.12, (gp[1] - 70 * gp[2] - h0[1]) / h0[2] + 58 * 1.12] : undefined;
      const mo = molePose(tau, yawOf(v), tbl);
      bench(g, c, SEAT.X - 380, SEAT.Z, 1100);
      if (seated < 0.999) { g.save(); g.globalAlpha = 1; drawPerson(g, c, MOLE, at.X, -330 * seated, at.Z, lerp(0, FACE, seated), { ...mo, legs: seated < 0.5 }); g.restore(); }
      const onTable = seated >= 0.999 && tau > -4.85 && tau < -3.85;                  // his hand on the table, for his glass: drawn over it
      if (seated >= 0.999 && h0) figure(g, MOLE, h0[0], h0[1], h0[2], onTable ? { ...mo, skipLower: -1 } : mo);
      table(g, c, SEAT.X + 380, SEAT.Z, 640);
      if (tau < -4.3 && gp) glass(g, gp[0], gp[1] - 70 * gp[2], gp[2] * 0.5, 0.85);   // his glass on the table, until he picks it up
      if (onTable && h0) figure(g, MOLE, h0[0], h0[1], h0[2], { ...mo, only: -1 });
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

  // ------------------------------------------------------------------ the line: the five men from the stall, in front of it, each holding his
  // number: two hands on its sides, or one (number two keeps his phone, number three his chai)
  const LINE = [ONE, TWO, MOLE, FOUR, FIVE], CARDW = 290, CARDH = 208;
  function numberCard(g, J, n, two, side) {
    let cx, cy, rot = 0;
    if (two) { cx = (J[-1].Wr[0] + J[1].Wr[0]) / 2; cy = (J[-1].Wr[1] + J[1].Wr[1]) / 2 - 4; }
    else { const w = J[side].Wr; cx = w[0] - side * (24 + CARDW / 2); cy = w[1] + 8; rot = side * 0.035; }   // hanging from one hand
    g.translate(cx, cy); g.rotate(rot);
    g.fillStyle = 'rgba(0,0,0,0.16)'; R(g, -CARDW / 2 + 8, -CARDH / 2 + 12, CARDW, CARDH, 14); g.fill();
    g.fillStyle = '#d8b383'; R(g, -CARDW / 2, -CARDH / 2, CARDW, CARDH, 14); g.fill(); g.strokeStyle = 'rgba(80,50,20,0.45)'; g.lineWidth = 7; g.stroke();
    txt(g, String(n), 0, 68, 190, '#17130f', { align: 'center' });
  }
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
      const up = seg(T.line0 + 0.05 + i * 0.1, T.line0 + 0.45 + i * 0.1, t), cy = lerp(880, 770, up) + 6 * Math.sin(ti * 1.3);   // each raises his number
      const two = i === 0 || i === 3 || i === 4, side = i === 1 ? -1 : 1, gx = CARDW / 2 + 24;
      const gx1 = two ? gx : gx - 40;                                                   // one hand: the card nearer his middle
      o.arms = two ? { l: ik(o, -1, [-gx, cy], 'card', { pole: 'down' }), r: ik(o, 1, [gx, cy], 'card', { pole: 'down' }) } : { [side < 0 ? 'l' : 'r']: ik(o, side, [side * gx1, cy], 'card', { pole: 'down' }) };
      if (i === 2) { const sp = win(t, T.line0 + 2.4, T.line0 + 2.85, T.line0 + 3.4, T.line0 + 3.85);   // a sip, as if none of this were his business
        o.glassK = 0.56; o.glassTilt = 0.5 * sstep(0.55, 1, sp); o.tilt = -0.05 * sstep(0.5, 1, sp); o.close = Math.max(o.close, 0.5 * sstep(0.6, 1, sp));
        o.arms.l = ik(o, -1, along(REST3, LIPS3, 24, sp), 'glass', { over: sp > 0.3, pole: 'down' }); }
      if (i === 1) { const look = win(t, T.line0 + 3.6, T.line0 + 3.9, T.line0 + 5.2, T.line0 + 5.6); o.tilt = 0.1 * look; o.look = [lerp(0, 4, look), lerp(2, 14, look)];
        o.arms.r = ik(o, 1, [70, 540], 'phone'); }
      if (i === 0) o.worry = 3;
      o.held = (q2, J) => numberCard(q2, J, i + 1, two, side);
      g.save();
      if (i === 3) clothBag(g, x + 200 * s, y + 880 * s, s, 0, 1);
      figure(g, LINE[i], x, y, s, o);
      if (i === 3) strap(g, x + 214 * s, y + 890 * s, x + 236 * s, y + 360 * s, s);   // up his own side, clear of the card
      g.restore();
    }
    g.restore();
    if (t >= T.l4 - 0.05 && t < T.pick0 + 0.1) { title(g, 'WHOEVER YOU PICK', 330, 92, CREAM, t, T.l4); title(g, 'GOES TO JAIL', 446, 116, '#ff5a3c', t, T.l4 + 0.5); }
    if (t >= T.pick0 && t < T.pick1 + 0.25) { ring(g, 540, 400, 84, 1 - clamp((t - T.pick0) / (T.pick1 - T.pick0)), 16); if (t > T.pick1) { g.fillStyle = `rgba(255,253,244,${(0.5 * (1 - (t - T.pick1) / 0.25)).toFixed(3)})`; g.fillRect(0, 0, W, H); } }
    A.vignette(g, 0.4);
  }

  // ------------------------------------------------------------------ the cell, that night
  function shotCell(g, t) {
    const push = seg(T.cell0, T.mem0, t);
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#27304a'], [1, '#161c2a']); g.fillRect(0, 0, W, H);
    g.fillStyle = '#323b52'; g.fillRect(0, 1380, W, 540);
    g.fillStyle = 'rgba(170,200,255,0.12)'; g.beginPath(); g.moveTo(640, 430); g.lineTo(860, 430); g.lineTo(1080, 1500); g.lineTo(500, 1500); g.closePath(); g.fill();
    g.fillStyle = '#0d1018'; R(g, 640, 330, 220, 170, 6); g.fill(); g.fillStyle = 'rgba(170,200,255,0.6)'; R(g, 652, 342, 196, 146, 4); g.fill();
    g.fillStyle = '#0d1018'; for (let i = 0; i < 4; i++) g.fillRect(676 + i * 48, 342, 10, 146);
    const z = 1 + 0.07 * push; g.save(); g.translate(540, 1000); g.scale(z, z); g.translate(-540, -1000);
    const X0 = 420, Y0 = 720, s = 0.6, hip = Y0 + 1000 * s;
    g.fillStyle = '#4a3f30'; R(g, 60, hip - 30, 880, 70, 8); g.fill(); g.fillStyle = '#382f24'; g.fillRect(100, hip + 40, 40, 1500 - hip); g.fillRect(860, hip + 40, 40, 1500 - hip);
    const look = sstep(T.l9 + 1.5, T.l9 + 2.0, t), sip = win(t, T.cell0 + 0.5, T.cell0 + 0.95, T.cell0 + 1.6, T.cell0 + 2.05);
    // his legs, seated: the thighs coming towards you, the shins down to the floor
    for (const k of [-1, 1]) { const kx = X0 + k * 95 * s * 1.6; g.fillStyle = lg(g, kx - 60, hip, kx + 60, hip, [0, '#262c38'], [1, '#1b2029']); R(g, kx - 72, hip - 20, 144, 170, 60); g.fill(); R(g, kx - 58, hip + 120, 116, 1520 - hip - 120, 40); g.fill(); g.fillStyle = '#111'; R(g, kx - 80, 1500, 170, 60, 26); g.fill(); }
    const o = { rim: 0, cap: 1, yaw: 0.12, headYaw: lerp(0.35, -0.05, look), look: [lerp(14, 2, look), lerp(8, 1, look)], glassK: 0.56, glassTilt: 0.5 * sstep(0.55, 1, sip),
      close: Math.max(blinkAt(t, 7, 3.0), 0.6 * sstep(0.6, 1, sip)), frown: 0.25 * look, browY: 3 * look, breath: 3 * Math.sin(t * 1.2), tilt: -0.04 * sstep(0.5, 1, sip) };
    o.arms = { l: ik(o, -1, along([-170, 640], LIPS3, 24, sip), 'glass', { over: sip > 0.3, pole: 'down' }), r: ik(o, 1, [175, 900], 'relax', { pole: 'down' }) };
    figure(g, MOLE, X0, Y0, s, o);
    g.restore();
    g.fillStyle = 'rgba(20,30,70,0.30)'; g.fillRect(0, 0, W, H);
    for (const x of [40, 270, 590, 820, 1050]) { g.fillStyle = lg(g, x - 20, 0, x + 20, 0, [0, '#1a1c22'], [0.4, '#5a606a'], [1, '#14161b']); g.fillRect(x - 18, 0, 36, H); }
    g.fillStyle = '#23262d'; g.fillRect(0, 300, W, 34); g.fillRect(0, 1560, W, 34);
    A.vignette(g, 0.8);
  }

  // ------------------------------------------------------------------ the explanation (the user's note of 18 Nov; the desk's step 5): two
  // photos from your own memory of the film, the first face you saw (0:00) and the theft (0:04). On "paste" his face lifts out of the first
  // and lands on the thief in the second; then the effect's name. Built from the film's own frames, rendered once.
  const MEM = { ready: false }, PW = 460, PB = 22, PBB = 88;
  function memPhotos() {
    if (MEM.ready) return MEM;
    const c1 = camStall(0), h = P(c1, SEAT.X, SEAT.Y, SEAT.Z);
    stallScene(fresh(A.buf(5)), 0);                                       // frame 0
    const cw = cam(CW), v4 = personView(cw, AT4.X, 0, AT4.Z, AT4.a);
    stallScene(fresh(A.buf(6)), 4.62, { cam: cw });                       // the box going into the bag
    MEM.c1 = { cx: h[0] + 10 * h[2], cy: h[1] + 210 * h[2], side: 1000 * h[2] };
    MEM.face = { x: h[0] + 4 * h[2], y: h[1] - 36 * h[2], rx: 232 * h[2], ry: 292 * h[2] };
    MEM.c2 = { cx: 560, cy: 930, side: 760 };
    const y4 = v4.y - 1594 * v4.s, sp4 = Math.sin(clamp(v4.yaw * 0.9, -0.95, 0.95));
    MEM.thief = { x: v4.x + 150 * sp4 * 0.42 * v4.s, y: y4 - 36 * v4.s, rx: 232 * v4.s };
    MEM.ready = true; return MEM;
  }
  const photoPt = (x, y, rot, sc, crop, fx, fy) => { // a point of the frame → the screen, through a print at (x, y), turned rot, scaled sc
    const px = ((fx - (crop.cx - crop.side / 2)) / crop.side - 0.5) * PW * sc, py = ((fy - (crop.cy - crop.side / 2)) / crop.side - 0.5) * PW * sc;
    return [x + px * Math.cos(rot) - py * Math.sin(rot), y + px * Math.sin(rot) + py * Math.cos(rot)];
  };
  function print(g, x, y, rot, sc, src, crop, label, after) {   // a print: a square crop of a frame, its white border, a label on it
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc, sc);
    g.save(); g.filter = 'blur(16px)'; g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(-PW / 2 - PB + 14, -PW / 2 - PB + 22, PW + 2 * PB, PW + PB + PBB); g.restore();
    g.fillStyle = '#f3eee2'; g.fillRect(-PW / 2 - PB, -PW / 2 - PB, PW + 2 * PB, PW + PB + PBB);
    g.save(); g.beginPath(); g.rect(-PW / 2, -PW / 2, PW, PW); g.clip();
    g.drawImage(src, crop.cx - crop.side / 2, crop.cy - crop.side / 2, crop.side, crop.side, -PW / 2, -PW / 2, PW, PW);
    if (after) after(g);
    g.restore();
    txt(g, label, -PW / 2 + 4, PW / 2 + 64, 54, '#2a2622', { kind: 'mono' });
    g.restore();
  }
  function sticker(g, x, y, sc, rot, lift) {          // his face, cut out of the first print: a white edge, a shadow when it's lifted
    const F = MEM.face;
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc, sc);
    if (lift > 0.01) { g.save(); g.filter = `blur(${(14 / sc).toFixed(1)}px)`; g.fillStyle = `rgba(0,0,0,${(0.42 * lift).toFixed(3)})`; ell(g, 18 / sc * lift, 34 / sc * lift, F.rx + 16 / sc, F.ry + 16 / sc); g.fill(); g.restore(); }
    g.fillStyle = '#f7f3ea'; ell(g, 0, 0, F.rx + 12 / sc, F.ry + 12 / sc); g.fill();
    g.save(); ell(g, 0, 0, F.rx, F.ry); g.clip(); g.drawImage(A.buf(5), -F.x, -F.y); g.restore();
    g.restore();
  }
  function shotMemory(g, t) {
    const M = memPhotos(), d = t - T.mem0;
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#1b1f2b'], [1, '#11131a']); g.fillRect(0, 0, W, H);
    g.fillStyle = rg(g, 540, 900, 80, 900, [0, 'rgba(255,214,150,0.10)'], [1, 'rgba(255,214,150,0)']); g.fillRect(0, 0, W, H);
    const zb = 1 + 0.035 * seg(T.mem0, T.lane0, t); g.save(); g.translate(540, 960); g.scale(zb, zb); g.translate(-540, -960);   // a slow push in
    // the first print drops in, big; it makes room for the second (the theft); on the last line it slides away, and the second takes the middle
    const k2 = seg(T.e3 - 0.05, T.e3 + 0.45, t), gone = seg(T.e4 - 0.1, T.e4 + 0.55, t);
    const drop = sstep(0, 0.28, d), bump = 30 * Math.exp(-7 * Math.max(0, d - 0.26)) * Math.sin(10 * Math.max(0, d - 0.26));   // it lands just before "Why him?" (the hit, then the word)
    const x1 = lerp(540, 470, k2) - 820 * gone, y1 = lerp(860, 610, k2) - 900 * (1 - drop) + bump, r1 = -0.04 - 0.01 * k2 - 0.25 * gone, sc1 = lerp(1.22, 1.0, k2);
    const x2 = lerp(lerp(600 + 820, 600, k2), 540, gone), y2 = lerp(1185, 1010, gone), r2 = lerp(0.045, 0.02, gone), sc2 = lerp(1.0, 1.18, gone);
    const fly = seg(T.e3p - 0.05, T.e3c + 0.05, t), lifted = t >= T.e3p - 0.05;
    const f1 = photoPt(x1, y1, r1, sc1, M.c1, M.face.x, M.face.y), s1 = sc1 * PW / M.c1.side;
    const f2 = photoPt(x2, y2, r2, sc2, M.c2, M.thief.x, M.thief.y), s2 = sc2 * (M.thief.rx / M.face.rx) * PW / M.c2.side;
    const ringK = seg(T.e2 + 0.1, T.e2 + 0.6, t) * (1 - sstep(T.e3p - 0.2, T.e3p, t));
    if (k2 > 0.001) print(g, x2, y2, r2, sc2, A.buf(6), M.c2, '0:04');
    if (gone < 0.999) print(g, x1, y1, r1, sc1, A.buf(5), M.c1, '0:00', (q) => {
      const p = [((M.face.x - (M.c1.cx - M.c1.side / 2)) / M.c1.side - 0.5) * PW, ((M.face.y - (M.c1.cy - M.c1.side / 2)) / M.c1.side - 0.5) * PW], s0 = PW / M.c1.side;
      if (lifted) { q.fillStyle = '#15161b'; ell(q, p[0], p[1], M.face.rx * s0 + 6, M.face.ry * s0 + 6); q.fill(); q.strokeStyle = '#f7f3ea'; q.lineWidth = 5; q.stroke(); }   // the hole it leaves
      else if (ringK > 0) { q.strokeStyle = '#ffd34a'; q.lineWidth = 10; q.beginPath(); q.ellipse(p[0], p[1], M.face.rx * s0 + 18, M.face.ry * s0 + 18, 0, -PI / 2, -PI / 2 + TAU * ringK); q.stroke(); }
    });
    if (lifted) {                                       // the face, in flight: up off the first print, over, and down onto the thief
      const k = ease(fly), hop = Math.sin(PI * k);
      const x = lerp(f1[0], f2[0], k) + 60 * hop, y = lerp(f1[1], f2[1], k) - 170 * hop, sc = lerp(s1, s2, k) * (1 + 0.12 * hop), rot = lerp(r1, r2, k) + 0.25 * hop;
      const u = t - T.e3c - 0.05, land = u > 0 ? Math.exp(-9 * u) * Math.sin(16 * u) * 0.06 : 0;
      sticker(g, x, y, sc * (1 + land), rot, 1 - sstep(0.85, 1, k));
    }
    g.restore();
    if (t >= T.e4u - 0.1) { title(g, 'UNCONSCIOUS', 372, 92, CREAM, t, T.e4u - 0.1); title(g, 'TRANSFERENCE', 492, 112, '#ffd34a', t, T.e4u + 0.25); }
    A.vignette(g, 0.6);
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
    if (t < T.mem0) return shotCell(g, t);
    if (t < T.lane0) return shotMemory(g, t);           // why him: the explanation
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
  if (C.TL.marks && C.TL.marks.done !== undefined) window.UI.endcard();   // the second final (the brief): the end card after the last frame
  C.start();
})();
