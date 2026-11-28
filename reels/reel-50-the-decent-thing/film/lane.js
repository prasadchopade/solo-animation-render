// Reel 50 · The Decent Thing: this reel's people, props and places (window.LANE), drawn the series' way with film/draw.js
// (reel 49's kit). New here: faces that turn up to three-quarter (head2: reel 49's head with the features slid along the
// turn), the season's thief's cap seen from the front (the brim always shows), the woman, the man who says sorry, the
// constable, the loud man, the bangle seller, the crowd; bodies in their own clothes, legs that walk side-on, the red wallet,
// the phone, the cloth bag, the bench, and the market lane's stalls. Our own drawings, nobody real.
// Every function draws from its arguments alone; backgrounds are painted once into offscreen canvases.
(() => {
  const { W, H, clamp, lerp, mulberry32 } = C;
  const D = window.DRAW;
  const { TAU, PI, sstep, txt, R, ell, lg, rg, mix, rgba, MEN, hand, arm, mouth, eye, glass, LINE } = D;

  // ------------------------------------------------------------------ the people's faces (head2's specs)
  // Skin tones sit close together and in no order of good and bad (the checklist: no ladder; the thief not the darkest).
  const P = {
    thief: { ...MEN.thief, style: 'cap' },                                                       // the season's thief: no stubble (the user, reel 49)
    woman: { skin: '#b98a63', skinD: '#93664a', skinH: '#d6aa84', hair: '#17100c', style: 'long', must: null, stub: 0, brow: 11, browTilt: 4, jaw: 0.9, ew: 46, eh: 25, lips: '#a8505a', ear: 'gold', lash: true },
    lilac: { skin: '#ad7752', skinD: '#87573a', skinH: '#cb966f', hair: '#120d0a', style: 'side', must: null, stub: 0, brow: 12, browTilt: 2, jaw: 0.94, ew: 40, eh: 21, specs: true },
    cop: { skin: '#a8714c', skinD: '#82543a', skinH: '#c48d66', hair: '#0e0a08', style: 'short', must: 'thick', stub: 0, brow: 16, browTilt: 6, jaw: 1.08, ew: 41, eh: 21, beret: true },
    loud: { skin: '#b27c56', skinD: '#8c5b3c', skinH: '#cf9b74', hair: '#1a1410', style: 'recede', must: 'thick', stub: 0, brow: 17, browTilt: -4, jaw: 1.16, ew: 42, eh: 22 },
    bangle: { skin: '#bb8862', skinD: '#946446', skinH: '#d6a680', hair: '#8b8682', style: 'recede', must: 'thick', stub: 0, brow: 14, browTilt: 3, jaw: 1.04, ew: 42, eh: 21, mustC: '#d9d4cc' },
    veg: { skin: '#a9734f', skinD: '#845639', skinH: '#c69069', hair: '#14100c', style: 'buzz', must: 'thin', stub: 0, brow: 13, browTilt: 3, jaw: 1.0, ew: 42, eh: 22 },
  };
  // what each wears: body colour, kind of top, trousers, shoes
  const WEAR = {
    thief: { kind: 'shirt', top: '#2f8f7a', topL: '#46b49b', topD: '#1d6656', sleeve: 'short', legs: '#2a2e36', shoe: '#141414', untucked: true },
    woman: { kind: 'saree', top: '#c2366b', saree: '#2f5fc4', sareeL: '#5b86e0', sareeD: '#1c3c8a', border: '#e8b632', sleeve: 'blouse', shoe: '#7a3b22' },
    lilac: { kind: 'shirt', top: '#a98bd0', topL: '#c6aeea', topD: '#7a5ea6', sleeve: 'rolled', legs: '#5a5f68', shoe: '#5b3420', pen: true },
    cop: { kind: 'uniform', top: '#b9a06a', topL: '#d3bd88', topD: '#8a7444', sleeve: 'half', legs: '#a58c58', shoe: '#1a1410' },
    loud: { kind: 'vest', top: '#f3f1ea', topL: '#ffffff', topD: '#cfcabd', sleeve: 'none', legs: '#2d3f63', shoe: '#2a2018' },
    bangle: { kind: 'kurta', top: '#efe7d4', topL: '#fbf6ea', topD: '#cfc4aa', sleeve: 'long', vest: '#7a5233', legs: '#efe7d4', shoe: '#3b2a1c' },
    veg: { kind: 'tee', top: '#8f969e', topL: '#aab1b8', topD: '#6b7279', sleeve: 'short', legs: '#3a3632', shoe: '#2a2018', towel: true },
  };

  // ------------------------------------------------------------------ head2: reel 49's head(), turned
  // o: op (mouth open 0–1), close (eyelids), look [x, y] (the irises, head units), browUp, browIn, smile, frown, grit, turn (−1…1:
  // + slides the face towards the screen's right; the far ear hides, the far eye narrows), tilt is applied by the caller.
  function fx(x, tu) {                                  // where a frontal feature at x lands when the face turns by tu
    const at = Math.abs(tu), sd = Math.sign(tu);
    const k = x * sd > 0 ? 1 - 0.36 * at : 1 + 0.05 * at;
    return 58 * tu + x * k;
  }
  function head2(g, L, o = {}) {
    const tu = clamp(o.turn || 0, -1, 1), at = Math.abs(tu), sd = Math.sign(tu) || 1;
    const op = o.op ?? 0, close = o.close ?? 0, hw = 186 * L.jaw * (1 - 0.05 * at), drop = 104 * op, chin = 232 + drop, ey = -28, exf = 80;
    const sh = (y) => 24 * tu * clamp((y + 60) / 290);                       // the lower face swings with the turn more than the skull
    if (L.style === 'long') hairLongBack(g, L, tu);
    // ears: the far one goes behind the cheek
    for (const k of [-1, 1]) {
      const far = k === sd && at > 0.02, a2 = far ? 1 - clamp(at * 2.4) : 1;
      if (a2 <= 0.01 || L.style === 'long') continue;
      const x = k * (hw + 1) + (far ? 0 : sd * 16 * at);
      g.save(); g.globalAlpha *= a2; ell(g, x, -18, 25, 42, k * 0.08); g.fillStyle = L.skin; g.fill(); ell(g, x + 2 * k, -16, 12, 24, k * 0.08); g.fillStyle = L.skinD; g.fill(); g.restore();
    }
    const path = () => {
      g.beginPath(); g.moveTo(-hw, -40);
      g.bezierCurveTo(-hw - 4, -216, -100, -266, 0, -266); g.bezierCurveTo(100, -266, hw + 4, -216, hw, -40);
      g.bezierCurveTo(hw + 4 + sh(58), 58, 152 - 16 * op + sh(150), 150 + 44 * op, 88 - 6 * op + sh(205), 205 + 82 * op);
      g.bezierCurveTo(60 + sh(chin), chin - 4, 28 + sh(chin), chin, sh(chin), chin); g.bezierCurveTo(-28 + sh(chin), chin, -60 + sh(chin), chin - 4, -88 + 6 * op + sh(205), 205 + 82 * op);
      g.bezierCurveTo(-152 + 16 * op + sh(150), 150 + 44 * op, -hw - 4 + sh(58), 58, -hw, -40); g.closePath();
    };
    path(); g.fillStyle = lg(g, -hw, -200, hw, 240, [0, L.skinH], [0.45, L.skin], [1, L.skinD]); g.fill();
    g.save(); path(); g.clip();
    g.fillStyle = rg(g, 0, -40, 150, 330, [0, 'rgba(90,45,25,0)'], [1, 'rgba(90,45,25,0.3)']); g.fillRect(-300, -300, 600, 700);
    if (at > 0.05) { g.fillStyle = lg(g, sd * hw, 0, sd * (hw - 120), 0, [0, `rgba(70,35,18,${0.22 * at})`], [1, 'rgba(70,35,18,0)']); g.fillRect(-300, -300, 600, 700); }   // the far cheek in shade
    if (L.lash) { g.fillStyle = 'rgba(200,90,90,0.12)'; for (const k of [-1, 1]) { ell(g, fx(k * 92, tu), 66, 44, 26); g.fill(); } }                 // a little colour on her cheeks
    g.restore();
    const my = 118 + drop * 0.2, mx = fx(0, tu) * 0.9;
    g.save(); g.translate(mx, 0); g.scale(1 - 0.18 * at, 1);
    if ((o.grit || 0) > 0.05) D.grimace ? D.grimace(g, my, Math.min(1, o.grit), op) : mouth(g, my, op, {}); else mouth(g, my, op, { lip: L.lips || '#83503f', w0: L.lips ? 40 : 44, frown: o.frown ?? 0, smile: o.smile ?? 0 });
    if (L.must) {
      const big = L.must === 'thick', th = big ? 24 : 13, w = big ? 62 : 52;
      g.fillStyle = L.mustC || L.hair; g.beginPath(); g.moveTo(0, 74); g.bezierCurveTo(-18, 66, -w * 0.72, 70, -w, my - 10 + (big ? 4 : 0)); g.bezierCurveTo(-w * 0.7, 74 + th, -24, 76 + th, 0, 84 + th * 0.3); g.bezierCurveTo(24, 76 + th, w * 0.7, 74 + th, w, my - 10 + (big ? 4 : 0)); g.bezierCurveTo(w * 0.72, 70, 18, 66, 0, 74); g.closePath(); g.fill();
    }
    g.restore();
    // the nose: nostrils slid with the turn, and its far side drawn as a line once he turns
    const ny = 44, nx = fx(0, tu) * 1.08;
    g.fillStyle = 'rgba(90,45,25,0.22)'; ell(g, nx, ny + 15, 36 * (1 - 0.25 * at), 9); g.fill();
    g.strokeStyle = 'rgba(90,45,25,0.26)'; g.lineWidth = 3.5; g.lineCap = 'round';
    for (const k of [-1, 1]) { if (at > 0.3 && k === -sd) continue; g.beginPath(); g.moveTo(nx + k * 22 * (1 - 0.3 * at), ny - 18); g.quadraticCurveTo(nx + k * 31, ny, nx + k * 25, ny + 10); g.stroke(); }
    if (at > 0.3) { g.strokeStyle = `rgba(90,45,25,${0.4 * at})`; g.lineWidth = 4; g.beginPath(); g.moveTo(fx(0, tu) - sd * 10, ey + 20); g.quadraticCurveTo(nx + sd * 20, ny - 4, nx + sd * 30, ny + 14); g.stroke(); }
    for (const k of [-1, 1]) { ell(g, nx + k * 13 * (1 - 0.3 * at), ny + 9, 8, 4.6, k * 0.25); g.fillStyle = '#4a2416'; g.fill(); }
    g.fillStyle = 'rgba(255,240,226,0.1)'; ell(g, nx - 5, ny - 8, 10, 15); g.fill();
    if (L.mole) { g.fillStyle = '#2a1710'; ell(g, fx(L.mole[0], tu), L.mole[1], 9.5 * (L.mole[0] * sd > 0 ? 1 - 0.3 * at : 1), 9); g.fill(); }
    // the eyes: the far one narrower
    for (const k of [-1, 1]) {
      const far = k === sd && at > 0.02, ew = (L.ew ?? 45) * (far ? 1 - 0.38 * at : 1 + 0.04 * at);
      eye(g, k, fx(k * exf, tu), ey, close, { ew, eh: L.eh, ir: 17 * (far ? 1 - 0.2 * at : 1), look: o.look, lidW: L.lash ? 8 : 6.5 });
      if (L.lash && close < 0.9) { g.strokeStyle = '#120a07'; g.lineWidth = 4; g.lineCap = 'round'; const cx = fx(k * exf, tu), up = (L.eh ?? 25) * 1.75 * (1 - close); g.beginPath(); g.moveTo(cx + k * ew * 0.92, ey - 2); g.lineTo(cx + k * (ew + 12), ey - 12 - up * 0.2); g.stroke(); }
    }
    if (L.specs) {                                      // round spectacles, thin dark frames, over the eyes
      g.strokeStyle = '#2a211c'; g.lineWidth = 6;
      for (const k of [-1, 1]) { const far = k === sd && at > 0.02; ell(g, fx(k * exf, tu), ey + 2, 58 * (far ? 1 - 0.36 * at : 1), 46); g.stroke(); }
      g.beginPath(); g.moveTo(fx(-exf, tu) + 54 * (1 - 0.2 * at), ey - 4); g.quadraticCurveTo(fx(0, tu), ey - 16, fx(exf, tu) - 54 * (1 - 0.2 * at), ey - 4); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.18)'; for (const k of [-1, 1]) { ell(g, fx(k * exf, tu) - 18, ey - 14, 14, 9, -0.5); g.fill(); }
    }
    const bu = o.browUp || 0, bi = o.browIn || 0;
    g.strokeStyle = L.style === 'long' ? '#1c120d' : L.hair; g.lineCap = 'round'; g.lineWidth = L.brow;
    for (const k of [-1, 1]) {
      const far = k === sd && at > 0.02, sq = far ? 1 - 0.34 * at : 1, cx = fx(k * exf, tu);
      g.beginPath(); g.moveTo(cx - k * 48 * sq, ey - 40 + L.browTilt - 22 * bu - 16 * bi); g.quadraticCurveTo(cx + k * 6 * sq, ey - 60 - 26 * bu, cx + k * 54 * sq, ey - 40 - L.browTilt * 0.3 - 18 * bu + 10 * bi); g.stroke();
    }
    hairFront(g, L, hw, tu);
    if (L.style === 'cap') capFront(g, L, hw, tu, o.capUp || 0);
    if (L.beret) beret(g, hw, tu);
    if (L.ear === 'gold') for (const k of [-1, 1]) { const far = k === sd && at > 0.3; if (far) continue; const x = k * (hw - 8) + sd * 14 * at, y = 58; g.fillStyle = '#e8b632'; ell(g, x, y, 9, 9); g.fill(); g.beginPath(); g.moveTo(x - 12, y + 14); g.lineTo(x + 12, y + 14); g.lineTo(x, y + 44); g.closePath(); g.fill(); g.fillStyle = '#c2366b'; ell(g, x, y + 22, 4, 4); g.fill(); }
  }
  function hairFront(g, L, hw, tu) {
    const hh = hw + 6, ox = 26 * tu;
    g.fillStyle = L.hair;
    if (L.style === 'recede') { g.beginPath(); g.moveTo(-hh, -60); g.bezierCurveTo(-hh - 6, -230, -80, -282, 0, -282); g.bezierCurveTo(80, -282, hh + 6, -230, hh, -60); g.bezierCurveTo(hh - 16, -160, 120 + ox, -226, 60 + ox, -214); g.quadraticCurveTo(ox, -250, -60 + ox, -214); g.bezierCurveTo(-120 + ox, -226, -hh + 16, -160, -hh, -60); g.fill(); }
    if (L.style === 'buzz') { g.globalAlpha = 0.82; g.beginPath(); g.moveTo(-hh + 6, -70); g.bezierCurveTo(-hh, -250, -80, -278, 0, -278); g.bezierCurveTo(80, -278, hh, -250, hh - 6, -70); g.bezierCurveTo(hh - 30, -150, 120 + ox, -190, ox, -196); g.bezierCurveTo(-120 + ox, -190, -hh + 30, -150, -hh + 6, -70); g.fill(); g.globalAlpha = 1; }
    if (L.style === 'short') { g.beginPath(); g.moveTo(-hh + 4, -50); g.bezierCurveTo(-hh - 2, -240, -80, -276, 0, -276); g.bezierCurveTo(80, -276, hh + 2, -240, hh - 4, -50); g.bezierCurveTo(hh - 26, -150, 100 + ox, -200, ox, -204); g.bezierCurveTo(-100 + ox, -200, -hh + 26, -150, -hh + 4, -50); g.fill(); }
    if (L.style === 'side') {                         // neat, side-parted, combed over: the clerk
      g.beginPath(); g.moveTo(-hh + 2, -40); g.bezierCurveTo(-hh - 8, -250, -90, -292, 10, -290); g.bezierCurveTo(110, -288, hh + 8, -240, hh - 2, -50);
      g.bezierCurveTo(hh - 20, -150, 120 + ox, -196, 40 + ox, -214); g.bezierCurveTo(-20 + ox, -226, -80 + ox, -222, -96 + ox, -236); g.bezierCurveTo(-120 + ox, -200, -hh + 24, -150, -hh + 2, -40); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 5; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-90 + ox + i * 6, -250 + i * 8); g.quadraticCurveTo(20 + ox, -276 + i * 10, 130 + ox, -230 + i * 12); g.stroke(); }
      g.strokeStyle = mix(L.skin, '#000000', 0.3); g.lineWidth = 4; g.beginPath(); g.moveTo(-96 + ox, -236); g.quadraticCurveTo(-104 + ox, -262, -98 + ox, -282); g.stroke();   // the parting
    }
    if (L.style === 'long') {                         // centre-parted, smooth over the ears, drawn back to the plait
      g.beginPath(); g.moveTo(-hh - 10, 20); g.bezierCurveTo(-hh - 14, -250, -90, -296, ox * 0.6, -292); g.bezierCurveTo(90, -296, hh + 14, -250, hh + 10, 20);
      g.bezierCurveTo(hh - 6, -70, hh - 30, -150, 70 + ox, -196); g.quadraticCurveTo(14 + ox, -222, ox, -250); g.quadraticCurveTo(-14 + ox, -222, -70 + ox, -196); g.bezierCurveTo(-hh + 30, -150, -hh + 6, -70, -hh - 10, 20); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.1)'; g.lineWidth = 6; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(ox + k * 20, -246); g.quadraticCurveTo(k * 120 + ox, -240, k * (hh - 4), -110); g.stroke(); }
      g.strokeStyle = mix(L.skin, '#000000', 0.25); g.lineWidth = 4; g.beginPath(); g.moveTo(ox, -250); g.lineTo(ox * 0.7, -290); g.stroke();
    }
  }
  function hairLongBack(g, L, tu) {                   // her plait, falling over her left shoulder (the screen's right)
    g.fillStyle = L.hair;
    g.beginPath(); g.moveTo(-200, -120); g.bezierCurveTo(-230, 60, -200, 200, -120, 230); g.lineTo(120, 230); g.bezierCurveTo(200, 200, 230, 60, 200, -120); g.closePath(); g.fill();
  }
  // the season's thief's cap from the front: the crown, its seams and button, and the brim towards us (its underside shading his brow)
  function capFront(g, L, hw, tu, up = 0) {
    const ox = 30 * tu, at = Math.abs(tu);
    g.save(); g.translate(0, -40 * up);
    g.fillStyle = 'rgba(40,10,6,0.3)'; g.beginPath(); g.moveTo(-hw + 10, -150); g.quadraticCurveTo(ox, -120, hw - 10, -150); g.lineTo(hw - 20, -110); g.quadraticCurveTo(ox, -78, -hw + 20, -110); g.closePath(); g.fill();   // the brim's shadow on his brow
    g.beginPath(); g.moveTo(-hw - 8, -150); g.bezierCurveTo(-hw - 14, -300, -110, -352, ox * 0.4, -352); g.bezierCurveTo(110, -352, hw + 14, -300, hw + 8, -150); g.quadraticCurveTo(ox, -176, -hw - 8, -150); g.closePath();
    g.fillStyle = lg(g, -hw, -352, hw, -150, [0, '#a32a3a'], [0.55, '#8e2433'], [1, '#5c1520']); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 4;
    for (const k of [-0.55, 0, 0.55]) { g.beginPath(); g.moveTo(ox * 0.4, -350); g.quadraticCurveTo(k * hw * 0.7 + ox * 0.6, -300, k * hw * 0.92 + ox, -160); g.stroke(); }
    g.fillStyle = '#5c1520'; ell(g, ox * 0.4, -348, 16, 9); g.fill();
    // the brim: wide and curved, pointing at the camera (a brimless maroon cap reads as a skullcap: season-1.md)
    const bx = ox * 1.6, bw = hw * (1.02 - 0.12 * at);
    g.beginPath(); g.moveTo(bx - bw, -150); g.bezierCurveTo(bx - bw * 0.9, -92, bx + bw * 0.9, -92, bx + bw, -150); g.quadraticCurveTo(bx, -168, bx - bw, -150); g.closePath();
    g.fillStyle = lg(g, 0, -168, 0, -96, [0, '#7a1c2a'], [1, '#4a111b']); g.fill();
    g.strokeStyle = 'rgba(255,190,190,0.28)'; g.lineWidth = 4; g.beginPath(); g.moveTo(bx - bw + 8, -148); g.bezierCurveTo(bx - bw * 0.88, -98, bx + bw * 0.88, -98, bx + bw - 8, -148); g.stroke();
    g.restore();
  }
  function beret(g, hw, tu) {                         // the constable's beret, dark blue, pulled to his right, a brass badge at the front
    const ox = 34 * tu;
    g.fillStyle = lg(g, -hw, -330, hw, -150, [0, '#34467e'], [1, '#1d2a52']);
    g.beginPath(); g.moveTo(-hw - 10, -150); g.bezierCurveTo(-hw - 40, -300, -40, -360, 90 + ox, -340); g.bezierCurveTo(240 + ox, -320, hw + 70, -230, hw + 30, -170); g.quadraticCurveTo(0, -200, -hw - 10, -150); g.closePath(); g.fill();
    g.fillStyle = '#15203f'; g.beginPath(); g.moveTo(-hw - 12, -150); g.quadraticCurveTo(ox, -186, hw + 14, -158); g.lineTo(hw + 10, -132); g.quadraticCurveTo(ox, -160, -hw - 10, -126); g.closePath(); g.fill();
    g.fillStyle = '#e2b84a'; g.beginPath(); g.moveTo(-70 + ox, -230); g.lineTo(-48 + ox, -196); g.lineTo(-70 + ox, -168); g.lineTo(-92 + ox, -196); g.closePath(); g.fill();
    g.fillStyle = '#9b2a2a'; ell(g, -70 + ox, -197, 8, 8); g.fill();
  }

  // ------------------------------------------------------------------ bodies: the torso in its clothes, in head units under head2
  // (the neck at y 150, the shoulders' tips about ±300 at y 440, the waist at y 1130). tu turns it with the head (narrower, slid).
  const SHO = (tu, k) => [k * 272 * (1 - 0.3 * Math.abs(tu)) + 40 * tu, 438 + (k === Math.sign(tu) ? 14 * Math.abs(tu) : 0)];   // inside the shoulder's curve, so the sleeve grows out of it
  function torso(g, L, Wr, tu = 0, o = {}) {
    const at = Math.abs(tu), sq = 1 - 0.3 * at, ox = 40 * tu, by = 195, k = Wr.kind;   // by: the collar's line (230 in reel 49: a long neck)
    g.save(); g.translate(ox, 0); g.scale(sq, 1);
    // the neck
    const nw = 76; g.fillStyle = lg(g, -80, 0, 80, 0, [0, L.skinD], [0.55, L.skin], [1, L.skinD]);
    g.beginPath(); g.moveTo(-nw, 150); g.lineTo(-nw - 10, by + 130); g.quadraticCurveTo(0, by + 210, nw + 10, by + 130); g.lineTo(nw, 150); g.closePath(); g.fill();
    const shape = (w) => { g.beginPath(); g.moveTo(-w + 44, by + 900); g.bezierCurveTo(-w + 50, by + 700, -w + 6, by + 520, -w, by + 330); g.bezierCurveTo(-w + 4, by + 210, -250, by + 150, -96, by + 120); g.lineTo(96, by + 120); g.bezierCurveTo(250, by + 150, w - 4, by + 210, w, by + 330); g.bezierCurveTo(w - 6, by + 520, w - 50, by + 700, w - 44, by + 900); g.closePath(); };
    if (k === 'vest') {                               // a white sleeveless vest: bare shoulders, a deep round neck
      g.fillStyle = lg(g, -330, by, 330, by + 600, [0, L.skinH], [1, L.skinD]); shape(375); g.fill();
      g.fillStyle = lg(g, -300, by, 300, by + 700, [0, Wr.topL], [0.6, Wr.top], [1, Wr.topD]);
      g.beginPath(); g.moveTo(-300, by + 900); g.lineTo(-290, by + 330); g.quadraticCurveTo(-250, by + 180, -200, by + 130); g.quadraticCurveTo(-150, by + 330, 0, by + 340); g.quadraticCurveTo(150, by + 330, 200, by + 130); g.quadraticCurveTo(250, by + 180, 290, by + 330); g.lineTo(300, by + 900); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(120,110,90,0.35)'; g.lineWidth = 6; g.stroke();
      g.strokeStyle = 'rgba(0,0,0,0.06)'; g.lineWidth = 3; for (let x = -270; x < 280; x += 24) { g.beginPath(); g.moveTo(x, by + 380); g.lineTo(x + 6, by + 900); g.stroke(); }   // the ribbing
    } else if (k === 'saree') {                       // a blouse, and the saree's pallu over her left shoulder (the screen's right), across her chest
      g.fillStyle = lg(g, -330, by, 330, by + 600, [0, mix(Wr.top, '#ffffff', 0.15)], [1, mix(Wr.top, '#000000', 0.15)]); shape(330); g.fill();
      g.fillStyle = lg(g, -300, by + 200, 300, by + 900, [0, Wr.sareeL], [0.5, Wr.saree], [1, Wr.sareeD]);
      g.beginPath(); g.moveTo(130, by + 120); g.quadraticCurveTo(330, by + 180, 340, by + 380); g.lineTo(340, by + 900); g.lineTo(-300, by + 900); g.lineTo(-310, by + 760); g.quadraticCurveTo(-60, by + 560, 130, by + 120); g.closePath(); g.fill();
      g.strokeStyle = Wr.border; g.lineWidth = 26; g.beginPath(); g.moveTo(-306, by + 770); g.quadraticCurveTo(-60, by + 570, 120, by + 140); g.stroke();
      g.strokeStyle = '#c2366b'; g.lineWidth = 6; g.beginPath(); g.moveTo(-300, by + 742); g.quadraticCurveTo(-66, by + 548, 104, by + 136); g.stroke();
      g.strokeStyle = 'rgba(10,20,60,0.25)'; g.lineWidth = 8; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(180 + i * 40, by + 200 + i * 30); g.quadraticCurveTo(200 + i * 30, by + 500, 160 + i * 40, by + 880); g.stroke(); }   // folds
    } else {
      g.fillStyle = lg(g, -330, by, 330, by + 600, [0, Wr.topL], [0.5, Wr.top], [1, Wr.topD]); shape(k === 'kurta' ? 360 : 350); g.fill();
      if (k === 'shirt' || k === 'uniform') {         // a collar, the button line, a pocket
        g.fillStyle = Wr.topD; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(0, by + 190); g.lineTo(s * 110, by + 112); g.lineTo(s * 150, by + 160); g.lineTo(s * 40, by + 250); g.closePath(); g.fill(); }
        g.fillStyle = Wr.topL; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(0, by + 196); g.lineTo(s * 104, by + 120); g.lineTo(s * 136, by + 158); g.lineTo(s * 36, by + 240); g.closePath(); g.fill(); }
        g.strokeStyle = 'rgba(0,0,0,0.16)'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, by + 200); g.lineTo(0, by + 900); g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.6)'; for (let i = 0; i < 4; i++) { ell(g, 8, by + 300 + i * 150, 7, 7); g.fill(); }
        const pk = k === 'uniform' ? [-1, 1] : [1];
        for (const s of pk) { g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 5; R(g, s > 0 ? 110 : -230, by + 330, 120, 130, 8); g.stroke(); if (k === 'uniform') { g.fillStyle = Wr.topD; R(g, s > 0 ? 104 : -236, by + 322, 132, 36, 8); g.fill(); } }
        if (Wr.pen) { g.fillStyle = '#1d3f8a'; R(g, 186, by + 280, 16, 90, 6); g.fill(); g.fillStyle = '#c9cdd2'; R(g, 186, by + 280, 16, 22, 4); g.fill(); }
        if (k === 'uniform') {                       // epaulettes, a whistle cord, the belt, a name strip
          g.fillStyle = Wr.topD; for (const s of [-1, 1]) { R(g, s > 0 ? 150 : -290, by + 150, 140, 40, 10); g.fill(); }
          g.strokeStyle = '#a8322e'; g.lineWidth = 8; g.beginPath(); g.moveTo(-200, by + 170); g.quadraticCurveTo(-170, by + 360, -110, by + 420); g.stroke();
          g.fillStyle = '#1f2a3a'; R(g, -150, by + 470, 110, 26, 4); g.fill();
          g.fillStyle = '#3a2a1c'; g.fillRect(-330, by + 860, 660, 50); g.fillStyle = '#d8b04a'; R(g, -40, by + 856, 80, 58, 8); g.fill();
        }
      }
      if (k === 'tee') { g.strokeStyle = 'rgba(0,0,0,0.15)'; g.lineWidth = 8; g.beginPath(); g.moveTo(-100, by + 124); g.quadraticCurveTo(0, by + 220, 100, by + 124); g.stroke(); }
      if (k === 'kurta') {                            // a sleeveless sweater over the kurta
        g.fillStyle = lg(g, -260, by + 200, 260, by + 800, [0, mix(Wr.vest, '#ffffff', 0.15)], [1, Wr.vest]); g.beginPath(); g.moveTo(-250, by + 900); g.lineTo(-260, by + 300); g.quadraticCurveTo(-120, by + 170, -60, by + 150); g.lineTo(0, by + 420); g.lineTo(60, by + 150); g.quadraticCurveTo(120, by + 170, 260, by + 300); g.lineTo(250, by + 900); g.closePath(); g.fill();
      }
      if (Wr.towel) { g.fillStyle = '#e9e2cf'; g.beginPath(); g.moveTo(120, by + 120); g.quadraticCurveTo(300, by + 140, 330, by + 330); g.lineTo(250, by + 600); g.lineTo(190, by + 560); g.quadraticCurveTo(230, by + 300, 100, by + 170); g.closePath(); g.fill(); g.strokeStyle = '#b5443a'; g.lineWidth = 8; g.beginPath(); g.moveTo(256, by + 560); g.lineTo(206, by + 530); g.stroke(); }
    }
    if (L.style === 'long') {                         // her plait over her left shoulder, down her front
      g.fillStyle = L.hair; for (let i = 0; i < 7; i++) { const y = by + 140 + i * 72, x = 200 + Math.sin(i * 0.8) * 8; ell(g, x - 14, y, 34, 42, 0.4); g.fill(); ell(g, x + 14, y + 36, 34, 42, -0.4); g.fill(); }
      g.fillStyle = '#e8b632'; ell(g, 204, by + 660, 22, 12); g.fill();
    }
    g.restore();
  }

  // ------------------------------------------------------------------ legs, side-on (dir +1: walking to the screen's right)
  // hips at the origin, in head units; ph: the stride's phase (one stride per unit); amp: 1 walking, ~1.7 running; s for 'saree'
  function legs(g, Wr, ph, dir, amp = 1, o = {}) {
    // one stride per unit of ph; leg A's thigh swings A·sin, its knee bends while it swings forward (peak just after toe-off)
    const lim = (p, q, w0, w1) => { const an = Math.atan2(q[1] - p[1], q[0] - p[0]); g.beginPath(); g.arc(p[0], p[1], w0, an + PI / 2, an - PI / 2); g.arc(q[0], q[1], w1, an - PI / 2, an + PI / 2); g.closePath(); g.fill(); };
    const run = amp > 1.2, A = (run ? 0.5 : 0.27) * Math.min(1, amp), B = run ? 1.5 : 0.85, lean = o.lean || 0;
    const legAt = (phi) => {
      const th = A * Math.sin(phi) + lean, bend = B * Math.max(0, Math.cos(phi + 0.45)) * Math.min(1, amp) + (run ? 0.15 : 0.04);
      const kn = [Math.sin(th) * 330 * dir, Math.cos(th) * 330], sh = th - bend, an = [kn[0] + Math.sin(sh) * 310 * dir, kn[1] + Math.cos(sh) * 310];
      return { kn, an, toe: -0.6 * Math.max(0, Math.sin(-phi)) * Math.min(1, amp) };
    };
    const a = ph * TAU;
    if (Wr.kind === 'saree') {                        // the saree to her ankles, swinging; her feet show under its hem
      const sw = Math.sin(a) * Math.min(1, amp), sway = sw * 30;
      for (const phi of [a, a + PI]) { const L = legAt(phi); g.fillStyle = Wr.shoe; g.beginPath(); g.ellipse(L.an[0] + 30 * dir, 650, 58, 24, 0, 0, TAU); g.fill(); }
      g.fillStyle = lg(g, -300, 0, 300, 620, [0, Wr.sareeL], [0.5, Wr.saree], [1, Wr.sareeD]);
      g.beginPath(); g.moveTo(-210, -30); g.lineTo(210, -30); g.quadraticCurveTo(250 + sway, 300, 270 + sway * 1.5, 640); g.lineTo(-270 + sway * 1.5, 640); g.quadraticCurveTo(-250 + sway, 300, -210, -30); g.closePath(); g.fill();
      g.strokeStyle = Wr.border; g.lineWidth = 22; g.beginPath(); g.moveTo(-270 + sway * 1.5, 626); g.lineTo(270 + sway * 1.5, 626); g.stroke();
      g.strokeStyle = 'rgba(10,20,60,0.22)'; g.lineWidth = 8; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 60, 0); g.quadraticCurveTo(i * 70 + sway * 0.5, 300, i * 90 + sway * 1.4, 620); g.stroke(); }
      return;
    }
    const legsOf = [a, a + PI].map(legAt), far = Math.sin(a) * dir > 0 ? 1 : 0;   // the leg that's behind (further from us) first
    pelvis(g, Wr, o.tu || 0);
    for (const i of [far, 1 - far]) {
      const L = legsOf[i]; g.fillStyle = i === far ? mix(Wr.legs, '#000000', 0.2) : Wr.legs;
      lim([0, 0], L.kn, 66, 54); lim(L.kn, L.an, 54, 44);
      g.save(); g.translate(L.an[0], L.an[1] + 16); g.rotate(dir * L.toe); g.fillStyle = Wr.shoe; g.beginPath(); g.ellipse(34 * dir, 8, 72, 30, 0, 0, TAU); g.fill(); g.restore();
    }
  }
  const HIP = 1095;                                   // the hips' height under the head's centre (head units)
  // the trousers' seat, from the shirt's hem to the top of the legs (hips at the origin); a belt under a tucked shirt
  function pelvis(g, Wr, tu = 0) {
    const sq = 1 - 0.3 * Math.abs(tu), w = 300 * sq;
    g.fillStyle = lg(g, -w, 0, w, 0, [0, mix(Wr.legs, '#000000', 0.12)], [0.5, Wr.legs], [1, mix(Wr.legs, '#000000', 0.22)]);
    g.beginPath(); g.moveTo(-w, -60); g.lineTo(w, -60); g.bezierCurveTo(w + 6, 60, w * 0.7, 170, 110, 230); g.lineTo(-110, 230); g.bezierCurveTo(-w * 0.7, 170, -w - 6, 60, -w, -60); g.closePath(); g.fill();
    if ((Wr.kind === 'shirt' || Wr.kind === 'vest') && !Wr.untucked) { g.fillStyle = '#2a1e16'; g.fillRect(-w, -6, 2 * w, 30); g.fillStyle = '#b8954a'; R(g, -24, -10, 48, 38, 6); g.fill(); }
  }
  // seated on a stool, knees towards us (hips at the origin): the thighs foreshortened, the shins down, the feet towards us.
  // o.rise (head units): the hips lift off the stool while the knees and feet stay (standing up: the thighs lengthen)
  function seatedLegs(g, Wr, ph, dir, amp, o = {}) {
    const rise = o.rise || 0, sh = (p, q, w0, w1, col) => { const an = Math.atan2(q[1] - p[1], q[0] - p[0]); g.beginPath(); g.arc(p[0], p[1], w0, an + PI / 2, an - PI / 2); g.arc(q[0], q[1], w1, an - PI / 2, an + PI / 2); g.closePath(); g.fillStyle = col; g.fill(); };
    g.save(); g.translate(0, rise);
    // the stool: a round wooden top on three legs
    g.fillStyle = '#5a3a22'; for (const [x0, x1] of [[-170, -230], [170, 230], [0, 0]]) { g.beginPath(); g.moveTo(x0 - 16, 170); g.lineTo(x0 + 16, 170); g.lineTo(x1 + 12, 600); g.lineTo(x1 - 12, 600); g.closePath(); g.fill(); }
    g.fillStyle = lg(g, 0, 120, 0, 190, [0, '#a8743f'], [1, '#6e4626']); ell(g, 0, 160, 250, 46); g.fill();
    g.restore();
    const dk = mix(Wr.legs, '#000000', 0.2);
    for (const k of [-1, 1]) {
      const knee = [k * 165, 215 + rise], ank = [k * 185, 590 + rise], hip = [k * 120, 30];
      sh(knee, ank, 70, 56, dk);                                                    // the shin
      g.fillStyle = Wr.shoe; ell(g, ank[0] + k * 6, ank[1] + 34, 92, 46); g.fill();   // the shoe, toe towards us
      g.fillStyle = 'rgba(255,255,255,0.12)'; ell(g, ank[0] - 14, ank[1] + 22, 40, 14); g.fill();
      sh(hip, knee, 100, 92, Wr.legs);                                              // the thigh, foreshortened
      g.fillStyle = mix(Wr.legs, '#ffffff', 0.1); ell(g, knee[0], knee[1] - 10, 86, 74); g.fill();   // the knee's lit top
    }
    pelvis(g, Wr, o.tu || 0);
  }
  // a glass held in a hand: the glass, the fingers wrapped round its lower half (the knuckles on the side the hand comes
  // from, side −1: from the left), the thumb up its near side. (x, y): the wrist; sc: the glass's scale; the glass's centre sits
  // up and across from the wrist. Returns the glass's centre.
  function glassHeld(g, x, y, sc, skin, side = -1, rot = 0) {
    const line = LINE(skin), cx = x - side * 118 * sc, cy = y - 66 * sc;
    glass(g, cx, cy, sc, rot);
    g.save(); g.translate(cx, cy); g.rotate(rot); g.scale(sc, sc); g.lineJoin = 'round'; g.lineCap = 'round'; g.lineWidth = 5;
    const tone = (u) => mix(skin, u > 0 ? '#ffe6cc' : '#3a1d10', Math.abs(u));
    // the back of the hand, joining the wrist to the knuckles
    g.fillStyle = tone(-0.04); g.beginPath(); g.ellipse(side * 92, 60, 60, 78, side * 0.35, 0, TAU); g.fill(); g.strokeStyle = line; g.stroke();
    // four fingers across the front of the glass, the little finger lowest and shortest
    for (let i = 3; i >= 0; i--) { const y0 = 6 + i * 30, len = 150 - i * 14; g.fillStyle = tone(0.03 - 0.02 * i); R(g, side > 0 ? 100 - len : -100, y0, len, 34, 17); g.fill(); g.strokeStyle = line; g.stroke(); }
    // the thumb, up the near side
    g.fillStyle = tone(0.0); g.save(); g.translate(side * 80, 14); g.rotate(side * -0.75); R(g, -17, -58, 34, 72, 17); g.fill(); g.strokeStyle = line; g.stroke(); g.restore();
    g.restore();
    return [cx, cy];
  }
  // the hip's bob for a stride phase (head units, + is down): lowest as each foot lands
  const bobOf = (ph, amp = 1) => (amp > 1.2 ? 40 : 18) * Math.min(1, amp) * Math.abs(Math.sin(ph * TAU));

  // ------------------------------------------------------------------ an arm: one smooth tapered shape (the rework, 27 Nov)
  // The user on the first final: "the animation is slop". The kit's arm() was two outlined capsules, a seam at the elbow: a
  // wooden mannequin. Here the centreline runs straight from the shoulder, round the elbow on a curve and straight to the wrist;
  // the skin is one shape, shaded like a cylinder, outlined once (never across the shoulder, which grows out of the body); the
  // sleeve is drawn over its top in the shirt's own colour, with a hem. S, Wr in screen px; E optional. Without E the elbow
  // bends out only a little and the rest of a short reach is foreshortened (towards or away from us), never folded sideways.
  // s: the owner's head scale; wear: a WEAR entry; o.pole: which side the elbow goes; o.thin: a slimmer arm (the woman).
  const SLV = { short: 0.55, half: 0.82, rolled: 0.86, blouse: 0.36, long: 1.0, none: 0 };
  const LIGHT = [-0.6, -0.8];                         // towards the light (the bulbs, up and to the left)
  function limb(g, S, Wr, s, wear, skin, o = {}) {
    const L = 385 * s;                                // a segment's nominal length (shoulder to wrist about the shoulder-to-hip)
    let E = o.E;
    if (!E || (o.Eu != null && o.Eu < 1)) {
      const dx = Wr[0] - S[0], dy = Wr[1] - S[1], d = Math.hypot(dx, dy) || 1, pole = o.pole || [0, 1];
      let nx = -dy / d, ny = dx / d; if (nx * pole[0] + ny * pole[1] < 0) { nx = -nx; ny = -ny; }
      const h = Math.min(Math.sqrt(Math.max(0, L * L - d * d / 4)), 0.2 * d + 26 * s);   // a gentle bend; the rest is foreshortening
      const Ec = [(S[0] + Wr[0]) / 2 + nx * h, (S[1] + Wr[1]) / 2 + ny * h];
      E = E ? [lerp(Ec[0], E[0], o.Eu), lerp(Ec[1], E[1], o.Eu)] : Ec;
    }
    for (let k = 0; k < 4; k++) for (const Q of [S, Wr]) { const dx = E[0] - Q[0], dy = E[1] - Q[1], d = Math.hypot(dx, dy); if (d > L) E = [Q[0] + (dx / d) * L, Q[1] + (dy / d) * L]; }
    const k = (s / 0.62) * (o.thin ?? (wear.kind === 'saree' ? 0.84 : 1)), sl = wear.sleeve || 'none';
    const l1 = Math.hypot(E[0] - S[0], E[1] - S[1]) || 1, l2 = Math.hypot(Wr[0] - E[0], Wr[1] - E[1]) || 1;
    // the centreline: straight, round the elbow (a quadratic with E as its control), straight
    const r = Math.min(l1, l2) * 0.42, A = [E[0] + (S[0] - E[0]) * r / l1, E[1] + (S[1] - E[1]) * r / l1], B = [E[0] + (Wr[0] - E[0]) * r / l2, E[1] + (Wr[1] - E[1]) * r / l2];
    const pts = [];
    for (let i = 0; i < 7; i++) pts.push([lerp(S[0], A[0], i / 7), lerp(S[1], A[1], i / 7)]);
    for (let i = 0; i < 9; i++) { const v = i / 9, a = (1 - v) * (1 - v), b = 2 * v * (1 - v), c = v * v; pts.push([a * A[0] + b * E[0] + c * B[0], a * A[1] + b * E[1] + c * B[1]]); }
    for (let i = 0; i <= 7; i++) pts.push([lerp(B[0], Wr[0], i / 7), lerp(B[1], Wr[1], i / 7)]);
    const n = pts.length, cum = [0];
    for (let i = 1; i < n; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const tot = cum[n - 1] || 1, U = cum.map((c) => c / tot), uE = (l1 - r * 0.5) / (l1 + l2 - r);
    const nrm = pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], d = Math.hypot(tx, ty) || 1; return [-ty / d, tx / d]; });
    // the half-width along the arm: the shoulder's round, the upper arm, a slimmer elbow, the forearm's belly, the wrist
    const wAt = (u) => { if (u <= uE) { const v = u / uE; return k * (34 - 3 * v - 6 * v * v); } const v = (u - uE) / (1 - uE); return k * (25 + 9 * v * (1 - v) - 4.5 * v); };
    const wid = U.map(wAt);
    const sideOf = (sg, ws, i0 = 0, i1 = n - 1) => { const out = []; for (let i = i0; i <= i1; i++) out.push([pts[i][0] + nrm[i][0] * ws[i] * sg, pts[i][1] + nrm[i][1] * ws[i] * sg]); return out; };
    const angAt = (i) => Math.atan2(nrm[i][1], nrm[i][0]) - PI / 2;           // the centreline's direction at point i
    const shape = (ws, i1, endCap) => {                                       // one closed outline: left side, the end, right side, the shoulder
      const Lf = sideOf(1, ws, 0, i1), Rt = sideOf(-1, ws, 0, i1);
      g.beginPath(); g.moveTo(Lf[0][0], Lf[0][1]); for (let i = 1; i < Lf.length; i++) g.lineTo(Lf[i][0], Lf[i][1]);
      endCap(Lf[Lf.length - 1], Rt[Rt.length - 1]);
      for (let i = Rt.length - 1; i >= 0; i--) g.lineTo(Rt[i][0], Rt[i][1]);
      const a0 = angAt(0); g.arc(pts[0][0], pts[0][1], ws[0], a0 - PI / 2, a0 + PI / 2, true); g.closePath();
      return [Lf, Rt];
    };
    const roundEnd = (i) => () => { const a = angAt(i); g.arc(pts[i][0], pts[i][1], wid[i], a + PI / 2, a - PI / 2, true); };
    const shadeSide = (() => { const m = Math.floor(n / 2); return nrm[m][0] * LIGHT[0] + nrm[m][1] * LIGHT[1] > 0 ? -1 : 1; })();
    const shade = (ws, i1, col, dark) => {                                    // a cylinder's shadow along the side away from the light, a soft light on the other
      g.lineCap = 'round'; g.lineJoin = 'round';
      for (const [off, wf] of [[0.95, 1.0], [0.85, 0.55]]) {                  // two soft layers towards the shadowed edge
        g.strokeStyle = dark; g.lineWidth = Math.max(2, wf * ws[Math.floor(i1 / 2)]);
        const sh = sideOf(shadeSide * off, ws, 0, i1); g.beginPath(); g.moveTo(sh[0][0], sh[0][1]); for (const q of sh) g.lineTo(q[0], q[1]); g.stroke();
      }
    };
    const line = LINE(skin), lw = Math.max(1.6, 3.2 * k);
    // the skin, one shape
    g.save();
    shape(wid, n - 1, roundEnd(n - 1)); g.fillStyle = skin; g.fill();
    g.save(); g.clip(); shade(wid, n - 1, null, 'rgba(70,32,16,0.13)'); g.restore();
    // its outline, once, from just below the shoulder round the wrist and back (none across the shoulder)
    { const Lf = sideOf(1, wid), Rt = sideOf(-1, wid), i0 = 3; g.beginPath(); g.moveTo(Lf[i0][0], Lf[i0][1]); for (let i = i0 + 1; i < n; i++) g.lineTo(Lf[i][0], Lf[i][1]); roundEnd(n - 1)(); for (let i = n - 1; i >= i0; i--) g.lineTo(Rt[i][0], Rt[i][1]); g.strokeStyle = line; g.lineWidth = lw; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
    // a folded arm (the elbow sharper than a right angle): the forearm again, over the upper arm, with its own outline
    { const ux = S[0] - E[0], uy = S[1] - E[1], vx = Wr[0] - E[0], vy = Wr[1] - E[1], cs = (ux * vx + uy * vy) / (l1 * l2);
      if (cs > -0.05 && !o.noFold) {
        const i0 = 7, Lf = sideOf(1, wid, i0, n - 1), Rt = sideOf(-1, wid, i0, n - 1);
        g.beginPath(); g.moveTo(Lf[0][0], Lf[0][1]); for (const q of Lf) g.lineTo(q[0], q[1]); roundEnd(n - 1)(); for (let i = Rt.length - 1; i >= 0; i--) g.lineTo(Rt[i][0], Rt[i][1]);
        const a0 = angAt(i0); g.arc(pts[i0][0], pts[i0][1], wid[i0], a0 - PI / 2, a0 + PI / 2, true); g.closePath();
        g.fillStyle = mix(skin, '#ffe6cc', 0.04); g.fill(); g.strokeStyle = line; g.lineWidth = lw; g.stroke();
      } }
    // the sleeve, over the top of the arm
    const cut = SLV[sl] ?? 0;
    if (cut > 0) {
      const uc = sl === 'long' ? 0.985 : cut * uE; let ic = 0; while (ic < n - 1 && U[ic] < uc) ic++;
      const ext = (sl === 'long' ? 9 : sl === 'blouse' ? 3.5 : sl === 'rolled' ? 4 : 6.5) * k;
      const ws = wid.map((w, i) => w + ext * clamp(U[i] / (0.35 * uc + 1e-6)) + (sl === 'blouse' ? 0 : 2.5 * k * clamp((U[i] - uc * 0.5) / (uc * 0.5 + 1e-6))));
      const col = sl === 'blouse' ? wear.top : (wear.top || skin), colD = mix(col, '#000000', 0.38);
      const [Lf, Rt] = shape(ws, ic, (p, q) => { const a = angAt(ic), mx = (p[0] + q[0]) / 2 + Math.cos(a) * ws[ic] * 0.28, my = (p[1] + q[1]) / 2 + Math.sin(a) * ws[ic] * 0.28; g.lineTo(p[0], p[1]); g.quadraticCurveTo(mx, my, q[0], q[1]); });
      g.fillStyle = col; g.fill();
      g.save(); g.clip(); shade(ws, ic, null, 'rgba(0,0,0,0.1)');
      if (sl !== 'blouse' && ic > 4) { g.strokeStyle = 'rgba(0,0,0,0.13)'; g.lineWidth = Math.max(1.5, 3 * k); g.lineCap = 'round'; for (const f of [0.45, 0.7]) { const i = Math.round(ic * f), w = ws[i]; g.beginPath(); g.moveTo(pts[i][0] + nrm[i][0] * w * shadeSide * 0.9, pts[i][1] + nrm[i][1] * w * shadeSide * 0.9); g.quadraticCurveTo(pts[i][0], pts[i][1], pts[i + 1][0] + nrm[i + 1][0] * w * shadeSide * 0.2, pts[i + 1][1] + nrm[i + 1][1] * w * shadeSide * 0.2); g.stroke(); } }   // a fold or two
      if (sl === 'rolled' || sl === 'long') { const i0 = Math.max(0, ic - (sl === 'long' ? 2 : 3)); const band = sideOf(1, ws, i0, ic), band2 = sideOf(-1, ws, i0, ic); g.beginPath(); g.moveTo(band[0][0], band[0][1]); for (const q of band) g.lineTo(q[0], q[1]); for (let i = band2.length - 1; i >= 0; i--) g.lineTo(band2[i][0], band2[i][1]); g.closePath(); g.fillStyle = sl === 'rolled' ? (wear.topL || col) : mix(col, '#000000', 0.08); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.16)'; g.lineWidth = Math.max(1.5, 2.5 * k); g.stroke(); }   // the roll, or the cuff
      g.restore();
      // the sleeve's outline: its sides from below the shoulder, and the hem
      g.beginPath(); const i0 = Math.min(3, ic); g.moveTo(Lf[i0][0], Lf[i0][1]); for (let i = i0 + 1; i < Lf.length; i++) g.lineTo(Lf[i][0], Lf[i][1]);
      { const a = angAt(ic), p = Lf[Lf.length - 1], q = Rt[Rt.length - 1]; g.quadraticCurveTo((p[0] + q[0]) / 2 + Math.cos(a) * ws[ic] * 0.28, (p[1] + q[1]) / 2 + Math.sin(a) * ws[ic] * 0.28, q[0], q[1]); }
      for (let i = Rt.length - 2; i >= i0; i--) g.lineTo(Rt[i][0], Rt[i][1]);
      g.strokeStyle = rgba(colD, 0.55); g.lineWidth = lw; g.stroke();
    }
    g.restore();
    return E;
  }
  // a hand's angle: along the forearm, or keyed (A.a), or blended from the forearm's towards the keyed one (A.au, 0…1, the short way round)
  function angOf(A, E) {
    const c = Math.atan2(A.w[1] - E[1], A.w[0] - E[0]) + (A.da || 0);
    if (A.a == null) return c;
    if (A.au == null || A.au >= 1) return A.a;
    const d = ((A.a - c) % TAU + TAU * 1.5) % TAU - PI; return c + A.au * d;
  }
  const handS = (s) => 282 * s;                       // a hand's length (wrist to fingertip) for a head scale s (306 in reel 49)

  // ------------------------------------------------------------------ props
  function wallet(g, x, y, s, rot = 0, o = {}) {      // the red wallet, folded: stitched edges, a flap, a little brass snap
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s * (o.sq ?? 1));
    if (o.shadow) { g.fillStyle = 'rgba(30,15,6,0.3)'; R(g, -88, -48 + 14, 176, 104, 14); g.fill(); }
    R(g, -90, -56, 180, 112, 16); g.fillStyle = lg(g, 0, -56, 0, 56, [0, '#e2453a'], [0.6, '#c3261f'], [1, '#8f1712']); g.fill();
    g.strokeStyle = '#6a0f0b'; g.lineWidth = 4; g.stroke();
    g.setLineDash([9, 7]); g.strokeStyle = 'rgba(255,220,200,0.6)'; g.lineWidth = 3; R(g, -78, -44, 156, 88, 10); g.stroke(); g.setLineDash([]);
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.moveTo(-90, -10); g.lineTo(90, -10); g.lineTo(90, 6); g.lineTo(-90, 6); g.closePath(); g.fill();
    g.fillStyle = '#e8c45a'; ell(g, 60, 0, 11, 11); g.fill();
    g.restore();
  }
  function phone(g, x, y, s, rot = 0) {               // a phone: dark, a lit edge of screen, a camera bump
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    R(g, -52, -100, 104, 200, 16); g.fillStyle = '#23262c'; g.fill(); g.strokeStyle = '#0c0d10'; g.lineWidth = 4; g.stroke();
    R(g, -44, -90, 88, 180, 10); g.fillStyle = lg(g, -44, -90, 44, 90, [0, '#3b8fd6'], [1, '#6a4fc6']); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.25)'; R(g, -40, -86, 22, 170, 8); g.fill();
    g.restore();
  }
  function bag(g, x, y, s, o = {}) {                  // her cloth shoulder bag (a jhola): (x, y) is its mouth's middle; the strap goes up to (o.sx, o.sy)
    g.save();
    if (o.sx != null) { g.strokeStyle = '#a5532a'; g.lineWidth = 18 * s; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 70 * s, y); g.lineTo(o.sx, o.sy); g.stroke(); }
    g.translate(x, y); g.scale(s, s); g.rotate(o.rot || 0);
    if (o.wallet) wallet(g, 16, -30, 0.62, -0.12);    // its top showing at the bag's mouth
    g.beginPath(); g.moveTo(-120, -8); g.quadraticCurveTo(0, 14, 120, -8); g.lineTo(136, 220); g.quadraticCurveTo(0, 250, -136, 220); g.closePath();
    g.fillStyle = lg(g, -130, 0, 130, 240, [0, '#e0a050'], [1, '#b8742c']); g.fill(); g.strokeStyle = '#7a4518'; g.lineWidth = 5; g.stroke();
    g.strokeStyle = '#c2366b'; g.lineWidth = 12; g.beginPath(); g.moveTo(-128, 110); g.quadraticCurveTo(0, 130, 128, 110); g.stroke();
    g.fillStyle = '#2f5fc4'; for (let i = -2; i <= 2; i++) { ell(g, i * 46, 168, 10, 10); g.fill(); }
    g.restore();
  }
  function bangles(g, x, y, s, rot = 0, cols = ['#e8413a', '#f0c32a', '#2fa5d6', '#c2366b', '#e8b632', '#7a4fc6']) {   // a stack of glass bangles held up
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    cols.forEach((c, i) => { g.strokeStyle = c; g.lineWidth = 12; g.beginPath(); g.ellipse(0, (i - cols.length / 2) * 13, 70, 22, 0, 0, TAU); g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 3; g.beginPath(); g.ellipse(0, (i - cols.length / 2) * 13 - 4, 64, 18, 0, PI * 1.1, PI * 1.6); g.stroke(); });
    g.restore();
  }
  function lathi(g, x, y, s, rot) {                   // the constable's cane, brass-tipped
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    g.fillStyle = lg(g, -10, 0, 10, 0, [0, '#a6763e'], [1, '#6e4a22']); R(g, -12, -40, 24, 900, 12); g.fill();
    g.fillStyle = '#d8b04a'; R(g, -14, 840, 28, 70, 8); g.fill(); g.restore();
  }
  function bench(g, x, y, w, s) {                     // a wooden plank bench: (x, y) is its seat's front-left corner
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = '#5e3c22'; for (const lx of [30, w / s - 70]) { g.fillRect(lx, 30, 40, 330); }
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(20, 360, w / s - 40, 18);
    g.fillStyle = lg(g, 0, -40, 0, 40, [0, '#b07a46'], [1, '#8a5a30']); g.beginPath(); g.moveTo(-10, 0); g.lineTo(w / s + 10, 0); g.lineTo(w / s - 20, -46); g.lineTo(20, -46); g.closePath(); g.fill();
    g.fillStyle = '#6e4626'; g.fillRect(-10, 0, w / s + 20, 34);
    g.strokeStyle = 'rgba(60,30,10,0.35)'; g.lineWidth = 3; for (const yy of [-30, -16]) { g.beginPath(); g.moveTo(20, yy); g.lineTo(w / s - 20, yy); g.stroke(); }
    g.restore();
  }

  // ------------------------------------------------------------------ the person: legs, the far arm, the torso, the head, the near arm
  // p: { L, wear, x, y (the head's centre, px), s (head scale), turn, face (head2's options), tilt, lean,
  //      legs: { ph, dir, amp } or null (hidden by something in front), arms: [farArm, nearArm] each { w: [x, y] px, a, pose, hold, E, behind } }
  function person(g, p) {
    const s = p.s, tu = p.turn || 0, sd = Math.sign(tu) || 1;
    const toPx = (q) => [p.x + q[0] * s, p.y + q[1] * s];
    const sh = [SHO(tu, -1), SHO(tu, 1)].map((q) => toPx(q));
    // shoulders: index 0 is the screen-left one. Which is behind: the one away from the turn.
    let back = tu > 0.05 ? 0 : tu < -0.05 ? 1 : -1;
    if (back >= 0 && p.arms && p.arms[back] && p.arms[back].front) back = -1;      // an arm marked front stays in front (the review: a sip went behind him)
    const drawArm = (i) => {
      const A = p.arms && p.arms[i]; if (!A) return;
      const S = sh[i], E = limb(g, S, A.w, s, p.wear, p.L.skin, { E: A.E, Eu: A.Eu, pole: A.pole || [i === 0 ? -0.45 : 0.45, 1] });
      const hs = handS(s) * (A.fs ?? 1), a = angOf(A, E);
      A.ang = a; if (A.holdUnder) A.holdUnder(g, A);
      if (A.pose !== 'none') hand(g, A.w[0], A.w[1], a, hs, A.pose || 'rest', { left: i === 0, skin: p.L.skin });
      if (A.hold) A.hold(g, A, hs);
    };
    g.save();
    if (p.legs) { g.save(); g.translate(p.x + 40 * tu * s, p.y + HIP * s); g.scale(s, s); (p.legs.seated ? seatedLegs : legs)(g, p.wear, p.legs.ph, p.legs.dir, p.legs.amp ?? 1, { lean: p.legs.lean, tu, rise: p.legs.rise || 0 }); g.restore(); }
    if (back >= 0) drawArm(back);
    if (p.arms && p.arms.some((A) => A && A.behind)) p.arms.forEach((A, i) => { if (A && A.behind && i !== back) drawArm(i); });
    g.save(); g.translate(p.x, p.y); g.rotate(p.lean || 0); g.scale(s, s);
    torso(g, p.L, p.wear, tu);
    g.rotate(p.tilt || 0); head2(g, p.L, { ...(p.face || {}), turn: tu });
    g.restore();
    p.arms && p.arms.forEach((A, i) => { if (i !== back && !(A && A.behind)) drawArm(i); });
    g.restore();
    return { sh };
  }

  // ------------------------------------------------------------------ places, painted once (1080 × 1920 unless wider)
  const cache = {};
  const canvasOf = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  function bulbs(g, x0, x1, y, sag, n, glow = 0.7) {
    g.strokeStyle = '#1b1b1b'; g.lineWidth = 3; g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo((x0 + x1) / 2, y + sag * 2, x1, y); g.stroke();
    for (let i = 0; i <= n; i++) { const u = i / n, bx = lerp(x0, x1, u), by = y + sag * 4 * u * (1 - u) * 1.0 + 6; g.fillStyle = rg(g, bx, by + 8, 2, 60 * glow, [0, `rgba(255,214,130,${0.7 * glow})`], [1, 'rgba(255,214,130,0)']); g.fillRect(bx - 80, by - 70, 160, 160); g.fillStyle = '#fff2c4'; ell(g, bx, by + 8, 8, 10); g.fill(); }
  }
  function tarp(g, x0, x1, y, c0, c1) { g.fillStyle = lg(g, 0, y - 120, 0, y, [0, c0], [1, c1]); g.beginPath(); g.moveTo(x0, y - 140); g.lineTo(x1, y - 140); g.lineTo(x1, y - 30); const n = Math.round((x1 - x0) / 60); for (let i = n; i >= 0; i--) g.quadraticCurveTo(x0 + i * 60 + 30, y, x0 + i * 60, y - 26); g.closePath(); g.fill(); }
  // the lane behind everything: the far shops, shutters and signs (invented), wires, the packed-earth ground
  function laneBack(g, w, seed, o = {}) {
    const r = mulberry32(seed);
    g.fillStyle = lg(g, 0, 0, 0, 1100, [0, '#f2b878'], [1, '#e9c79a']); g.fillRect(0, 0, w, 1100);
    const cols = ['#3fa7a0', '#d96f6a', '#e8b84a', '#7c86c6', '#c9845a', '#5aa0b8'];
    for (let x = -30, i = 0; x < w + 40; i++) { const bw = 200 + r() * 140, hh = 600 + r() * 300, y0 = 1000 - hh; g.fillStyle = cols[i % cols.length]; g.fillRect(x, y0, bw, hh + 60); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x + bw - 12, y0, 12, hh + 60);
      for (let fy = y0 + 50; fy < 700; fy += 140) for (let fx2 = x + 30; fx2 < x + bw - 60; fx2 += 90) { g.fillStyle = 'rgba(40,50,60,0.7)'; R(g, fx2, fy, 54, 80, 4); g.fill(); g.fillStyle = `rgba(255,214,140,${r() > 0.5 ? 0.8 : 0})`; R(g, fx2 + 3, fy + 3, 48, 74, 3); g.fill(); }
      x += bw; }
    g.strokeStyle = 'rgba(30,25,20,0.6)'; g.lineWidth = 3; for (const [a, b] of [[300, 250], [360, 320]]) { g.beginPath(); g.moveTo(-20, a); g.quadraticCurveTo(w / 2, b + 120, w + 20, b); g.stroke(); }
    g.fillStyle = lg(g, 0, 1000, 0, H, [0, '#b59a78'], [1, '#8a7254']); g.fillRect(0, 1000, w, H - 1000);
    g.strokeStyle = 'rgba(70,50,30,0.15)'; g.lineWidth = 4; for (let i = 0; i < 40; i++) { const x = r() * w, y = 1100 + r() * 800; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 40 + r() * 60, y + 4); g.stroke(); }
  }
  // the chai stall, from the front: reel 49's stall wall (makeStall), with the counter's front at the bottom
  function chaiStall() {
    if (cache.chai) return cache.chai;
    D.makeStall({}); const wall = D.stallBG();
    const [c, g] = canvasOf(W, H); g.drawImage(wall, 0, 0);
    cache.chai = c; return c;
  }
  // the bangle stall: racks of glass bangles on poles, a mirror, trays on the counter (its front at y 1260)
  function bangleStall() {
    if (cache.bangle) return cache.bangle;
    const [c, g] = canvasOf(W, H), r = mulberry32(21);
    laneBack(g, W, 7);
    g.fillStyle = lg(g, 0, 160, 0, 1260, [0, '#7a3d4a'], [1, '#4a2230']); g.fillRect(0, 160, W, 1100);
    const cols = ['#e8413a', '#f0c32a', '#2fa5d6', '#c2366b', '#e8b632', '#7a4fc6', '#ff8a3a', '#ffffff', '#3b7fd6', '#d94b8c'];
    for (let p = 0; p < 9; p++) { const px = 60 + p * 122; g.fillStyle = '#c9a86a'; g.fillRect(px - 4, 260, 8, 860);
      for (let i = 0; i < 38; i++) { const y = 280 + i * 22; g.strokeStyle = cols[(p * 3 + Math.floor(i / 4)) % cols.length]; g.lineWidth = 10; g.beginPath(); g.ellipse(px, y, 46, 10, 0, 0, TAU); g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2; g.beginPath(); g.ellipse(px, y - 3, 42, 7, 0, PI * 1.1, PI * 1.7); g.stroke(); } }
    tarp(g, 0, W, 300, '#d9582a', '#a83e1c');
    bulbs(g, -10, W + 10, 300, 40, 12, 0.8);
    // the counter: a red cloth over it, trays of bangles
    g.fillStyle = lg(g, 0, 1180, 0, 1300, [0, '#b4302a'], [1, '#7e1f1a']); g.fillRect(0, 1200, W, 120);
    for (let t = 0; t < 4; t++) { const tx = 60 + t * 260; g.fillStyle = '#e6d6b0'; R(g, tx, 1150, 220, 60, 10); g.fill(); for (let i = 0; i < 9; i++) { g.strokeStyle = cols[(t * 2 + i) % cols.length]; g.lineWidth = 9; g.beginPath(); g.ellipse(tx + 26 + i * 21, 1172, 14, 22, 0, 0, TAU); g.stroke(); } }
    g.fillStyle = lg(g, 0, 1320, 0, H, [0, '#9a8064'], [1, '#6e5a44']); g.fillRect(0, 1320, W, H - 1320);
    cache.bangle = c; return c;
  }
  // the vegetable stall: crates of tomatoes, onions and chillies, a hanging scale, a tarp (the counter at y 1220)
  function vegStall() {
    if (cache.veg) return cache.veg;
    const [c, g] = canvasOf(W, H), r = mulberry32(33);
    laneBack(g, W, 11);
    g.fillStyle = lg(g, 0, 200, 0, 1100, [0, '#5c4a3a'], [1, '#3a2e24']); g.fillRect(0, 200, W, 1000);
    tarp(g, 0, W, 330, '#2b6fb3', '#1f4f82');
    bulbs(g, -10, W + 10, 330, 36, 11, 0.75);
    // shelves of produce at the back
    const heap = (x, y, w2, col, rr, n) => { for (let i = 0; i < n; i++) { const a = r() * PI, d = r(); ell(g, x + Math.cos(a) * w2 * d, y - Math.sin(a) * w2 * 0.45 * d, rr, rr * 0.92); g.fillStyle = mix(col, i % 3 ? '#000000' : '#ffffff', 0.12 * r()); g.fill(); } };
    for (const [x, col, rr] of [[150, '#d9342b', 22], [400, '#b07a3a', 20], [660, '#e8b632', 20], [900, '#d9342b', 22]]) { g.fillStyle = '#7a5a3a'; g.fillRect(x - 120, 860, 240, 30); heap(x, 856, 110, col, rr, 60); }
    g.strokeStyle = '#2a2a2a'; g.lineWidth = 4; g.beginPath(); g.moveTo(560, 330); g.lineTo(560, 520); g.stroke();
    g.fillStyle = '#c9ced4'; ell(g, 560, 560, 50, 50); g.fill(); g.strokeStyle = '#6a6e74'; g.lineWidth = 6; g.stroke(); g.fillStyle = '#e04030'; g.save(); g.translate(560, 560); g.rotate(0.6); g.fillRect(-3, -40, 6, 40); g.restore();
    // the counter: crates in front
    g.fillStyle = '#8a5a30'; g.fillRect(0, 1180, W, 40);
    for (let k = 0; k < 4; k++) { const x = 30 + k * 262; g.fillStyle = '#c9944e'; g.fillRect(x, 1220, 240, 130); g.strokeStyle = '#7a5226'; g.lineWidth = 5; for (const yy of [1250, 1290, 1330]) { g.beginPath(); g.moveTo(x, yy); g.lineTo(x + 240, yy); g.stroke(); } heap(x + 120, 1222, 100, ['#d9342b', '#b07a3a', '#e85a2a', '#c9a24a'][k], 19, 46); }
    g.fillStyle = lg(g, 0, 1350, 0, H, [0, '#9a8064'], [1, '#6e5a44']); g.fillRect(0, 1350, W, H - 1350);
    cache.veg = c; return c;
  }
  // the lane by the chai stall, wider than the frame (2200 px): the far shops, the chai stall at the right, the bench
  function laneWide() {
    if (cache.wide) return cache.wide;
    const w = 2200, [c, g] = canvasOf(w, H);
    laneBack(g, w, 3);
    // stalls along the back: shutters, a sweets shop, a cloth shop (invented)
    for (const [x, tx, bgc, fg] of [[80, 'CLOTH HOUSE', '#fff3cf', '#7a1f1f'], [620, 'SWEETS', '#b5341f', '#fff6d6'], [1080, 'HARDWARE', '#2f6f8f', '#ffffff']]) {
      g.fillStyle = bgc; R(g, x, 640, 420, 90, 6); g.fill(); txt(g, tx, x + 210, 708, 64, fg, { align: 'center', fit: 380 });
      g.fillStyle = '#7d8086'; g.fillRect(x + 10, 730, 400, 300); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2; g.beginPath(); for (let yy = 736; yy < 1030; yy += 10) { g.moveTo(x + 10, yy); g.lineTo(x + 410, yy); } g.stroke();
    }
    // the chai stall at the right end (its own wall, tarp and board)
    g.fillStyle = lg(g, 0, 400, 0, 1100, [0, '#6a4a30'], [1, '#2e2016']); g.fillRect(1560, 420, 640, 700);
    tarp(g, 1540, 2200, 520, '#2b6fb3', '#1f4f82');
    R(g, 1760, 640, 220, 120, 8); g.fillStyle = '#23302a'; g.fill(); g.strokeStyle = '#8a6a3f'; g.lineWidth = 7; g.stroke(); txt(g, 'CHAI 10/-', 1870, 722, 56, '#f4efe0', { align: 'center' });
    g.fillStyle = '#8f949b'; R(g, 1620, 800, 120, 100, 24); g.fill(); g.fillStyle = 'rgba(255,255,255,0.3)'; R(g, 1636, 812, 16, 70, 8); g.fill();
    g.fillStyle = '#a86f3e'; g.fillRect(1560, 930, 640, 40); g.fillStyle = '#1f6f8f'; g.fillRect(1560, 970, 640, 160); g.strokeStyle = '#f0c32a'; g.lineWidth = 8; g.strokeRect(1580, 990, 600, 120);
    bulbs(g, 0, w, 470, 50, 22, 0.75);
    cache.wide = c; return c;
  }

  // ------------------------------------------------------------------ a person from behind (the rework, 27 Nov)
  // Backs tell the pocket beats at once: the loud man's back pocket and the phone in it, the hand that finds it empty, the man
  // in lilac walking off. Legs from behind (standing, or walking away: the swinging foot's heel lifts and shows its sole), the
  // trousers' seat and its two back pockets, the shirt's back (collar band, yoke, pleat) or the vest's (straps, a scooped
  // back), the arms (screen-left is their left), the neck, the back of the head (a lost profile when it turns: the cheek, the
  // nose's tip, a moustache's end, the specs' rim). Head units as everywhere (the head's centre at the origin, s its scale).
  // p: { L, wear, x, y, s, turn (−1…1: the cheek on that side shows), tilt, walk (a stride phase, or null to stand),
  //      arms: [left, right] each { w, E, pose, a, hold } or null (hanging), phone: 1 | -1 (in that back pocket), dip: 1 | -1 }
  function personBack(g, p) {
    const s = p.s, tu = clamp(p.turn || 0, -1, 1), at = Math.abs(tu), sd = Math.sign(tu) || 1, Wr = p.wear, Lk = p.L, skin = Lk.skin;
    const walking = p.walk != null, a = (p.walk || 0) * TAU;
    const lift = walking ? [Math.max(0, Math.sin(a)), Math.max(0, Math.sin(a + PI))] : [0, 0];
    const up = walking ? -14 * Math.abs(Math.sin(a)) : 0, sway = walking ? 12 * (lift[0] - lift[1]) : 0;
    const cap = (p0, q, w0, w1) => { const an = Math.atan2(q[1] - p0[1], q[0] - p0[0]); g.beginPath(); g.arc(p0[0], p0[1], w0, an + PI / 2, an - PI / 2); g.arc(q[0], q[1], w1, an - PI / 2, an + PI / 2); g.closePath(); g.fill(); };
    g.save(); g.translate(p.x, p.y + up * s); g.scale(s, s); g.lineJoin = 'round'; g.lineCap = 'round';
    // the shadow, the legs, the shoes
    if (!p.noLegs) {
      g.fillStyle = 'rgba(30,20,12,0.2)'; ell(g, 0, HIP + 690 - up, 300, 40); g.fill();
      for (const i of [0, 1]) {
        const k = i ? 1 : -1, l = lift[i], hip = [k * 118 + sway, HIP + 120], knee = [k * 112 + sway * 0.5, HIP + 380 - 30 * l], ank = [k * 108, HIP + 650 - 120 * l - up];
        g.fillStyle = l > 0.05 ? mix(Wr.legs, '#000000', 0.12) : Wr.legs;
        cap(hip, knee, 92, 78); cap(knee, ank, 78, 62);
        g.fillStyle = Wr.shoe; ell(g, ank[0], ank[1] + 26, 72, 40 - 12 * l); g.fill();                                   // the heel
        if (l > 0.15) { g.fillStyle = mix(Wr.shoe, '#c8b49a', 0.45); ell(g, ank[0], ank[1] + 40, 64, 22 * l); g.fill(); }   // the sole, tipped up
      }
    }
    g.translate(sway, 0); g.rotate(walking ? 0.015 * Math.sin(a) : 0);
    // the trousers' seat, the belt, the back pockets (the phone up out of one, under the pocket's cloth)
    g.save(); g.translate(0, HIP); pelvis(g, Wr, 0);
    g.fillStyle = mix(Wr.legs, '#000000', 0.2); for (const x of [-210, -70, 70, 210]) { R(g, x - 9, -14, 18, 46, 5); g.fill(); }   // belt loops
    const pocketCloth = (k) => {
      const x0 = k * 52, x1 = k * 222, xl = Math.min(x0, x1), xr = Math.max(x0, x1);
      g.fillStyle = mix(Wr.legs, '#ffffff', 0.05); g.beginPath(); g.moveTo(xl, 52); g.lineTo(xr, 52); g.lineTo(xr - k * 8, 168); g.quadraticCurveTo((xl + xr) / 2, 196, xl + k * 8, 168); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 4; g.stroke();
      g.setLineDash([10, 8]); g.strokeStyle = 'rgba(255,240,220,0.28)'; g.lineWidth = 3; g.beginPath(); g.moveTo(xl + 10, 66); g.lineTo(xr - 10, 66); g.stroke(); g.setLineDash([]);
    };
    pocketCloth(-1); pocketCloth(1);
    g.restore();
    if (p.armsIn) { g.restore(); for (const i of [0, 1]) { const A = p.arms[i]; limb(g, [p.x + (sway + (i ? 250 : -250)) * s, p.y + (up + 438) * s], A.w, s, Wr, skin, { E: A.E }); }
      g.save(); g.translate(p.x, p.y + up * s); g.scale(s, s); g.translate(sway, 0); g.rotate(walking ? 0.015 * Math.sin(a) : 0); }
    // the neck, then the back of the shirt or vest
    g.fillStyle = lg(g, -90, 0, 90, 0, [0, Lk.skinD], [0.5, skin], [1, Lk.skinD]); R(g, -84, 90, 168, 250, 60); g.fill();
    const by = 195, shape = (w) => { g.beginPath(); g.moveTo(-w + 44, by + 900); g.bezierCurveTo(-w + 50, by + 700, -w + 6, by + 520, -w, by + 330); g.bezierCurveTo(-w + 4, by + 210, -250, by + 150, -96, by + 120); g.lineTo(96, by + 120); g.bezierCurveTo(250, by + 150, w - 4, by + 210, w, by + 330); g.bezierCurveTo(w - 6, by + 520, w - 50, by + 700, w - 44, by + 900); g.closePath(); };
    if (Wr.kind === 'vest') {
      g.fillStyle = lg(g, -330, by, 330, by + 600, [0, Lk.skinH], [0.6, skin], [1, Lk.skinD]); shape(372); g.fill();
      g.strokeStyle = 'rgba(70,35,18,0.16)'; g.lineWidth = 16; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 60, by + 200); g.quadraticCurveTo(k * 170, by + 260, k * 200, by + 420); g.stroke(); }   // the shoulder blades
      g.fillStyle = lg(g, -300, by, 300, by + 700, [0, Wr.topL], [0.6, Wr.top], [1, Wr.topD]);
      g.beginPath(); g.moveTo(-300, by + 905); g.lineTo(-292, by + 360); g.quadraticCurveTo(-250, by + 200, -205, by + 128); g.lineTo(-128, by + 128); g.quadraticCurveTo(-112, by + 330, 0, by + 352); g.quadraticCurveTo(112, by + 330, 128, by + 128); g.lineTo(205, by + 128); g.quadraticCurveTo(250, by + 200, 292, by + 360); g.lineTo(300, by + 905); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(120,110,90,0.35)'; g.lineWidth = 6; g.stroke();
      g.strokeStyle = 'rgba(0,0,0,0.06)'; g.lineWidth = 3; for (let x = -270; x < 280; x += 24) { g.beginPath(); g.moveTo(x, by + 420); g.lineTo(x + 4, by + 900); g.stroke(); }
    } else {
      g.fillStyle = lg(g, -330, by, 330, by + 700, [0, Wr.topL], [0.55, Wr.top], [1, Wr.topD]); shape(350); g.fill();
      g.fillStyle = Wr.topD; g.beginPath(); g.moveTo(-112, by + 104); g.quadraticCurveTo(0, by + 136, 112, by + 104); g.lineTo(108, by + 162); g.quadraticCurveTo(0, by + 196, -108, by + 162); g.closePath(); g.fill();   // the collar band
      g.strokeStyle = 'rgba(0,0,0,0.13)'; g.lineWidth = 5; g.beginPath(); g.moveTo(-336, by + 300); g.quadraticCurveTo(0, by + 336, 336, by + 300); g.stroke();   // the yoke
      g.beginPath(); g.moveTo(-22, by + 330); g.lineTo(-24, by + 895); g.moveTo(22, by + 330); g.lineTo(24, by + 895); g.stroke();                              // a box pleat
      g.strokeStyle = 'rgba(0,0,0,0.07)'; g.lineWidth = 20; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 90, by + 380); g.quadraticCurveTo(k * 190, by + 430, k * 210, by + 600); g.stroke(); }
      g.strokeStyle = 'rgba(0,0,0,0.1)'; g.lineWidth = 4; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * 84, by + 898); g.lineTo(i * 74 + 6, by + 820); g.stroke(); }   // tucked in
    }
    g.restore();
    // the phone up out of a back pocket, over the hem, the pocket's cloth over its lower half
    if (p.phone) { g.save(); g.translate(p.x + sway * s, p.y + (up + HIP) * s); g.scale(s, s); const k = p.phone; phone(g, k * 140, 20, 0.92, k * 0.1); pocketCloth(k); g.restore(); }
    // the arms (screen-left is their left), drawn over the back (or under it, p.armsIn: working in front of him); a hand in a pocket goes under its cloth
    const sh = [[p.x + (sway - 272) * s, p.y + (up + 438) * s], [p.x + (sway + 272) * s, p.y + (up + 438) * s]];
    for (const i of [0, 1]) {
      if (p.armsIn) break;
      const A = p.arms && p.arms[i] || { w: [p.x + (sway + (i ? 300 : -300) + 0) * s, p.y + (up + 1180) * s], pose: 'rest' };
      const E = limb(g, sh[i], A.w, s, Wr, skin, { E: A.E, Eu: A.Eu, pole: A.pole || [i ? 0.5 : -0.5, 1] });
      const an = angOf(A, E); A.ang = an;
      if (A.pose !== 'none') hand(g, A.w[0], A.w[1], an, handS(s), A.pose || 'rest', { left: i === 1, skin });
      if (A.hold) A.hold(g, A, handS(s));
    }
    if (p.dip) { g.save(); g.translate(p.x + sway * s, p.y + (up + HIP) * s); g.scale(s, s); const k = p.dip, x0 = k * 52, x1 = k * 222, xl = Math.min(x0, x1), xr = Math.max(x0, x1);
      g.fillStyle = mix(Wr.legs, '#ffffff', 0.05); g.beginPath(); g.moveTo(xl, 52); g.lineTo(xr, 52); g.lineTo(xr - k * 8, 168); g.quadraticCurveTo((xl + xr) / 2, 196, xl + k * 8, 168); g.closePath(); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 4; g.stroke(); g.restore(); }
    // the back of the head
    g.save(); g.translate(p.x + sway * s, p.y + up * s); g.scale(s, s); g.rotate(p.tilt || 0);
    headBack(g, Lk, tu);
    g.restore();
  }
  // the back of a head (head units); tu turns it: the cheek on that side shows (a lost profile)
  function headBack(g, L, tu) {
    const at = Math.abs(tu), sd = Math.sign(tu) || 1, hw = 186 * L.jaw, line = LINE(L.skin);
    // the cheek and jaw, the nose's tip, the moustache's end, the brow's end: out past the skull's edge as he turns (the skull and hair go over)
    if (at > 0.05) {
      const e = at * 46, cx = sd * (hw - 34 + e);
      g.fillStyle = L.skin; ell(g, cx, 36, 52 + 0.4 * e, 168, sd * 0.12); g.fill(); g.strokeStyle = line; g.lineWidth = 4; g.stroke();
      g.fillStyle = 'rgba(90,45,25,0.12)'; ell(g, cx - sd * 10, 70, 30, 110, sd * 0.12); g.fill();
      if (at > 0.35) { const tip = sd * (hw + 6 + e + 40 * (at - 0.35)); g.fillStyle = L.skin; g.beginPath(); g.moveTo(sd * (hw - 10 + e), -20); g.quadraticCurveTo(tip + sd * 6, 34, tip - sd * 6, 58); g.quadraticCurveTo(sd * (hw + e * 0.6), 66, sd * (hw - 10 + e), 62); g.closePath(); g.fill(); g.stroke(); }
      if (L.must && at > 0.25) { g.fillStyle = L.mustC || L.hair; g.beginPath(); g.moveTo(sd * (hw - 6 + e * 0.8), 80); g.quadraticCurveTo(sd * (hw + 8 + e), 86, sd * (hw + 2 + e * 0.9), 108); g.lineTo(sd * (hw - 10 + e * 0.7), 104); g.closePath(); g.fill(); }
      g.strokeStyle = L.style === 'long' ? '#1c120d' : L.hair; g.lineWidth = L.brow; g.beginPath(); g.moveTo(sd * (hw - 20 + e * 0.6), -80); g.quadraticCurveTo(sd * (hw - 4 + e), -86, sd * (hw + 4 + e), -72); g.stroke();
      if (L.specs) { g.strokeStyle = '#2a211c'; g.lineWidth = 6; g.beginPath(); g.moveTo(sd * (hw - 20 + e * 0.5), -64); g.quadraticCurveTo(sd * (hw + 10 + e), -40, sd * (hw - 6 + e * 0.6), 6); g.stroke(); }
    }
    // the ears: the one on the turned side slides towards the middle; the other goes behind
    for (const k of [-1, 1]) {
      const near = k === sd && at > 0.02, x = near ? k * (hw - 4 - 60 * at) : k * (hw - 2 + 8 * at), al = near || at < 0.02 ? 1 : 1 - clamp(at * 2.2);
      if (al <= 0.02) continue;
      g.save(); g.globalAlpha *= al; ell(g, x, -16, 26, 44, k * 0.1); g.fillStyle = L.skin; g.fill(); g.strokeStyle = line; g.lineWidth = 3.5; g.stroke(); ell(g, x - k * 4, -14, 12, 24, k * 0.1); g.fillStyle = L.skinD; g.fill(); g.restore();
    }
    // the skull, the nape
    const ox = -sd * 14 * at;
    g.beginPath(); g.moveTo(-hw + ox, -40); g.bezierCurveTo(-hw - 4 + ox, -216, -100 + ox, -266, ox, -266); g.bezierCurveTo(100 + ox, -266, hw + 4 + ox, -216, hw + ox, -40); g.bezierCurveTo(hw - 6 + ox, 60, 120, 120, 84, 160); g.lineTo(-84, 160); g.bezierCurveTo(-120, 120, -hw + 6 + ox, 60, -hw + ox, -40); g.closePath();
    g.fillStyle = lg(g, -hw, -200, hw, 200, [0, L.skinH], [0.5, L.skin], [1, L.skinD]); g.fill();
    // the hair from behind, down to a hairline at the nape
    const top = L.style === 'side' ? -292 : L.style === 'buzz' ? -276 : -284, nape = L.style === 'buzz' ? 70 : 96;
    g.fillStyle = L.hair; g.beginPath(); g.moveTo(-hw - 8 + ox, -20); g.bezierCurveTo(-hw - 12 + ox, -236, -100 + ox, top, ox, top); g.bezierCurveTo(100 + ox, top, hw + 12 + ox, -236, hw + 8 + ox, -20);
    g.bezierCurveTo(hw + ox - 4, 20, hw - 30, 50, 96, nape - 10); g.quadraticCurveTo(0, nape + 22, -96, nape - 10); g.bezierCurveTo(-hw + 30, 50, -hw + ox + 4, 20, -hw - 8 + ox, -20); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 6; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(ox + i * 40, -260 + Math.abs(i) * 8); g.quadraticCurveTo(ox + i * 62, -120, ox + i * 52, nape - 30); g.stroke(); }   // strands
    if (L.style === 'recede') { g.fillStyle = rgba(L.skin, 0.22); ell(g, ox + 10, -232, 54, 30); g.fill(); }                       // thinning at the crown
    if (L.style === 'side') { g.strokeStyle = 'rgba(255,255,255,0.1)'; g.lineWidth = 5; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(70 + ox - i * 30, -276 + i * 4); g.quadraticCurveTo(-40 + ox - i * 20, -230 + i * 26, -hw + 40 + ox, -120 + i * 40); g.stroke(); }
      g.strokeStyle = mix(L.skin, '#000000', 0.3); g.lineWidth = 4; g.beginPath(); g.moveTo(80 + ox, -286); g.quadraticCurveTo(96 + ox, -250, 92 + ox, -210); g.stroke(); }   // combed across, the parting on his right
    if (L.specs) for (const k of [-1, 1]) { if (k === -sd && at > 0.4) continue; const x = k * (hw + 2) + ox; g.strokeStyle = '#2a211c'; g.lineWidth = 6; g.beginPath(); g.moveTo(x, -52); g.quadraticCurveTo(x + k * 10, -40, x + k * 4, -6); g.stroke(); }   // the specs' arms over his ears
    if (L.beret) { g.fillStyle = '#1d2a52'; g.beginPath(); g.moveTo(-hw - 12, -150); g.bezierCurveTo(-hw - 20, -320, hw + 20, -320, hw + 20, -160); g.quadraticCurveTo(0, -190, -hw - 12, -150); g.fill(); }
  }
  // a background, softened (painted once): close-ups and their depth
  function soft(name, src, blur) {
    if (cache[name]) return cache[name];
    const [c, g] = canvasOf(src.width, src.height); g.filter = `blur(${blur}px)`; g.drawImage(src, 0, 0); g.filter = 'none';
    cache[name] = c; return c;
  }
  function vegSoft() {
    if (cache.vegSoftSrc) return soft('vegSoft', cache.vegSoftSrc, 7);
    const [c, g] = canvasOf(W, H); g.drawImage(vegStall(), 0, 0);
    person(g, { L: P.veg, wear: WEAR.veg, x: 190, y: 700, s: 0.32, turn: 0.35, face: { look: [10, 4] } });
    cache.vegSoftSrc = c; return soft('vegSoft', c, 7);
  }
  const laneSoft = () => soft('laneSoft', laneWide(), 6);

  // ------------------------------------------------------------------ the lineup card: a face, numbered
  function card(g, x, y, w, h, n, draw, o = {}) {
    g.save(); g.translate(x, y);
    g.fillStyle = 'rgba(0,0,0,0.35)'; R(g, 8, 12, w, h, 26); g.fill();
    g.fillStyle = lg(g, 0, 0, 0, h, [0, '#f4ead8'], [1, '#e2d3b8']); R(g, 0, 0, w, h, 26); g.fill();
    g.save(); R(g, 12, 12, w - 24, h - 24, 18); g.clip(); g.fillStyle = lg(g, 0, 0, 0, h, [0, '#6c8aa8'], [1, '#3e5470']); g.fillRect(0, 0, w, h); draw(g); g.restore();
    g.strokeStyle = '#1a1612'; g.lineWidth = 6; R(g, 0, 0, w, h, 26); g.stroke();
    g.fillStyle = '#ffd34a'; ell(g, 52, 52, 40, 40); g.fill(); g.strokeStyle = '#1a1612'; g.lineWidth = 5; g.stroke();
    txt(g, String(n), 52, 74, 62, '#1a1612', { align: 'center' });
    g.restore();
  }

  window.LANE = { bobOf, P, WEAR, head2, fx, capFront, torso, legs, seatedLegs, pelvis, glassHeld, HIP, limb, handS, SHO, personBack, headBack, vegSoft, laneSoft, soft, wallet, phone, bag, bangles, lathi, bench, person, chaiStall, bangleStall, vegStall, laneWide, laneBack, card, bulbs, tarp };
})();
