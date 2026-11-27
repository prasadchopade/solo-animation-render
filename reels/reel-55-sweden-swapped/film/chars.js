// Reel 55's cast and cars, drawn in code as paper cut-outs: flat colour, no outlines, a white die-cut border, a thin
// paper edge and faint grain (paper() is copied from the Style Lab's clip 16, lab/clips/16-lit3d-linden/film/chars.js).
// Everyone here is invented; the cars are generic 1960s shapes with no make, badge or logo.
// Each drawing is painted once onto a canvas; the film stands it in the lit street as a card. Faces change by swapping
// the whole canvas (one feeling per face per line), never by animating inside it.

const TAU = Math.PI * 2;
function rng(seed) { let a = seed | 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const ell = (g, x, y, rx, ry, col, rot = 0, a0 = 0, a1 = TAU) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, rot, a0, a1); g.fill(); };
const poly = (g, pts, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.closePath(); g.fill(); };
const rr = (g, x, y, w, h, r, col) => { g.fillStyle = col; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); };
const line = (g, pts, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.stroke(); };
const curve = (g, p0, c, p1, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(p0[0], p0[1]); g.quadraticCurveTo(c[0], c[1], p1[0], p1[1]); g.stroke(); };
const blob = (g, pts, col) => {   // a smooth closed shape through the points (quadratic midpoints)
  g.fillStyle = col; g.beginPath(); const n = pts.length, m = (i) => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2];
  let s = m(n - 1); g.moveTo(s[0], s[1]); for (let i = 0; i < n; i++) { const e = m(i); g.quadraticCurveTo(pts[i][0], pts[i][1], e[0], e[1]); } g.closePath(); g.fill();
};
// an arm as one smooth tapered shape from shoulder to wrist through an elbow (no sausage segments)
function arm(g, s, e, w, ws, we, ww, col) {
  const pts = [], n = 18;
  const at = (u) => { const a = 1 - u; return [a * a * s[0] + 2 * a * u * e[0] + u * u * w[0], a * a * s[1] + 2 * a * u * e[1] + u * u * w[1]]; };
  const L = [], Rr = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, p = at(u), q = at(Math.min(1, u + 0.01)), r0 = at(Math.max(0, u - 0.01));
    let dx = q[0] - r0[0], dy = q[1] - r0[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const r = (u < 0.5 ? ws + (we - ws) * u * 2 : we + (ww - we) * (u - 0.5) * 2) / 2;
    L.push([p[0] - dy * r, p[1] + dx * r]); Rr.push([p[0] + dy * r, p[1] - dx * r]);
  }
  g.fillStyle = col; g.beginPath(); g.moveTo(L[0][0], L[0][1]);
  for (const p of L.slice(1)) g.lineTo(p[0], p[1]);
  for (const p of Rr.reverse()) g.lineTo(p[0], p[1]);
  g.closePath(); g.fill();
  ell(g, s[0], s[1], ws / 2, ws / 2, col); ell(g, w[0], w[1], ww / 2, ww / 2, col);
}

// the paper: the figure, a white die-cut border grown round its silhouette, and a thin darker edge just below it
export function paper(w, h, draw, seed = 1, border = 13) {
  const a = cv(w, h); draw(a.getContext('2d'), w, h);
  const grow = (col, r, dy) => {
    const s = cv(w, h), gs = s.getContext('2d');
    for (let k = 0; k < 28; k++) { const an = k / 28 * TAU; gs.drawImage(a, Math.cos(an) * r, Math.sin(an) * r + dy); }
    gs.globalCompositeOperation = 'source-in'; gs.fillStyle = col; gs.fillRect(0, 0, w, h);
    return s;
  };
  const out = cv(w, h), g = out.getContext('2d');
  g.drawImage(grow('rgb(150,138,122)', border, 3), 0, 0);
  g.drawImage(grow('#fbf6ea', border, 0), 0, 0);
  g.drawImage(a, 0, 0);
  const r = rng(seed); g.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 2600 * (w * h) / (512 * 1024); i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(60,40,20,0.05)'; g.fillRect(r() * w, r() * h, 2 + r() * 3, 2 + r() * 3); }
  return out;
}

// eyes that look (look: [-1..1, -1..1]); open: 1 open, 0.45 narrowed; r = eye radius
function eyes(g, pts, r, look, open = 1, pupil = 0.8, col = '#231a16') {
  for (const [x, y, s] of pts) {
    const rx = r * 1.15 * s, ry = r * 1.35 * open;
    ell(g, x, y, rx, ry, '#fbf6ea');
    g.save(); g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.clip();
    ell(g, x + look[0] * r * 0.5 * s, y + look[1] * r * 0.45, r * pupil * 0.78 * s, r * pupil * 0.9, col);
    ell(g, x + look[0] * r * 0.5 * s - r * 0.22, y + look[1] * r * 0.45 - r * 0.3, r * 0.16, r * 0.16, 'rgba(255,255,255,0.85)');
    g.restore();
  }
}
const sweat = (g, x, y, s = 1) => { g.fillStyle = '#bfe3f2'; g.beginPath(); g.moveTo(x, y - 22 * s); g.quadraticCurveTo(x + 13 * s, y + 2 * s, x, y + 10 * s); g.quadraticCurveTo(x - 13 * s, y + 2 * s, x, y - 22 * s); g.fill(); ell(g, x - 3 * s, y + 1 * s, 3 * s, 4 * s, 'rgba(255,255,255,0.8)'); };

// ================================================================================== INGRID, the driver
// Seen from her car's passenger side, facing right (east), in three-quarter view so both eyes show. A yellow headscarf
// over an auburn bob, a teal coat. Her canvas is the bust and the steering wheel; it stands inside her car, behind the
// car's side, and shows through the windows.
// face: 'scared' | 'terror' | 'focus' | 'relief' | 'easy'.  hands: 'grip' (both on the wheel) | 'easy' (one hand)
export function ingrid(face = 'scared', hands = 'grip') {
  return paper(640, 640, (g) => {
    const skin = '#f1c8a8', skinD = '#e2ad8c', coat = '#2f7f86', coatD = '#246970', scarf = '#f2c14e', scarfD = '#d9a535', hair = '#9c4a2a';
    const tense = hands === 'grip' && face !== 'relief';
    const sh = tense ? -14 : 0;                                              // shoulders up when she's frightened
    // the seat back behind her
    rr(g, 150, 250, 120, 330, 40, '#6d4a3a');
    // coat: shoulders and chest
    blob(g, [[170, 400 + sh], [250, 360 + sh], [360, 372 + sh], [420, 430], [440, 640], [160, 640], [150, 470]], coat);
    poly(g, [[300, 372 + sh], [330, 372 + sh], [352, 470], [318, 640], [300, 640]], coatD);         // the coat's front edge
    // the far arm (her left), reaching up to the wheel's rim
    if (hands === 'grip') arm(g, [250, 410 + sh], [392, 392], [486, 250], 70, 54, 40, coatD);
    else arm(g, [250, 410], [372, 380], [470, 236], 70, 54, 40, coatD);
    // neck and head (three-quarter, facing right)
    rr(g, 286, 300 + sh, 56, 80, 18, skinD);
    const hx = 318, hy = 230 + sh;
    blob(g, [[hx - 70, hy - 40], [hx - 20, hy - 108], [hx + 66, hy - 96], [hx + 96, hy - 20], [hx + 84, hy + 60], [hx + 30, hy + 96], [hx - 40, hy + 80], [hx - 78, hy + 20]], skin);
    ell(g, hx + 92, hy + 6, 14, 20, skinD, 0.2);                                                    // the nose, pointing right
    // the bob under the scarf, and the scarf tied under her chin
    blob(g, [[hx - 96, hy - 10], [hx - 70, hy - 120], [hx + 40, hy - 140], [hx + 100, hy - 80], [hx + 70, hy - 76], [hx - 10, hy - 70], [hx - 52, hy + 10], [hx - 60, hy + 74], [hx - 100, hy + 60]], hair);
    blob(g, [[hx - 108, hy - 30], [hx - 86, hy - 136], [hx + 30, hy - 160], [hx + 112, hy - 100], [hx + 98, hy - 70], [hx + 30, hy - 104], [hx - 40, hy - 96], [hx - 82, hy - 20], [hx - 92, hy + 50]], scarf);
    poly(g, [[hx - 96, hy + 30], [hx - 70, hy + 44], [hx - 20, hy + 104], [hx - 40, hy + 114]], scarfD);   // its tie
    ell(g, hx - 34, hy + 112, 18, 14, scarf);
    ell(g, hx + 46, hy + 40, 18, 12, 'rgba(232,120,110,0.35)');                                     // a cheek
    // the face
    const E = [[hx + 2, hy - 8, 1], [hx + 58, hy - 6, 0.78]];
    if (face === 'scared') {
      eyes(g, E, 17, [0.7, -0.1], 1.1, 0.55);
      line(g, [[hx - 18, hy - 48], [hx + 18, hy - 54]], 7, hair); line(g, [[hx + 44, hy - 54], [hx + 72, hy - 46]], 6, hair);   // brows up and in
      ell(g, hx + 52, hy + 56, 11, 13, '#7a2f2f');                                                  // a small o
      sweat(g, hx - 52, hy - 30, 0.9);
    } else if (face === 'terror') {
      eyes(g, E.map(([x, y, s]) => [x, y, s * 1.12]), 19, [0.9, 0], 1.25, 0.4);
      line(g, [[hx - 22, hy - 62], [hx + 18, hy - 70]], 8, hair); line(g, [[hx + 42, hy - 70], [hx + 76, hy - 58]], 7, hair);
      rr(g, hx + 18, hy + 42, 72, 30, 9, '#fbf6ea');                                                // clenched teeth
      for (const x of [hx + 36, hx + 54, hx + 72]) line(g, [[x, hy + 44], [x, hy + 70]], 3, '#c9c0b4');
      line(g, [[hx + 20, hy + 57], [hx + 88, hy + 57]], 3, '#c9c0b4');
      sweat(g, hx - 52, hy - 34, 1.1); sweat(g, hx + 100, hy - 66, 0.8);
    } else if (face === 'focus') {
      eyes(g, E, 17, [1, 0.15], 0.5, 0.85);
      line(g, [[hx - 16, hy - 30], [hx + 20, hy - 22]], 8, hair); line(g, [[hx + 44, hy - 24], [hx + 74, hy - 30]], 7, hair);     // brows down
      line(g, [[hx + 30, hy + 58], [hx + 70, hy + 56]], 6, '#7a2f2f');
      ell(g, hx + 74, hy + 62, 9, 7, '#e2747a');                                                    // the tip of her tongue
    } else if (face === 'relief') {                                                                // eyes on the road, the fear gone: a small smile
      eyes(g, E, 17, [0.85, 0.05], 0.8, 0.8);
      line(g, [[hx - 18, hy - 40], [hx + 18, hy - 42]], 6, hair); line(g, [[hx + 44, hy - 42], [hx + 72, hy - 40]], 6, hair);
      curve(g, [hx + 26, hy + 50], [hx + 52, hy + 66], [hx + 78, hy + 48], 6, '#7a2f2f');
      ell(g, hx - 6, hy + 30, 16, 10, 'rgba(232,120,110,0.3)');
    } else {                                                                                       // 'easy': sunglasses, a lazy smile
      rr(g, hx - 22, hy - 26, 48, 34, 12, '#1d1b22'); rr(g, hx + 40, hy - 24, 36, 30, 10, '#1d1b22'); line(g, [[hx + 26, hy - 12], [hx + 40, hy - 12]], 5, '#1d1b22');
      line(g, [[hx - 22, hy - 14], [hx - 70, hy - 20]], 5, '#1d1b22');
      ell(g, hx - 10, hy - 18, 8, 5, 'rgba(255,255,255,0.35)', -0.3);
      curve(g, [hx + 22, hy + 52], [hx + 52, hy + 70], [hx + 82, hy + 44], 6, '#7a2f2f');
    }
    // the steering wheel, side on: a thin dark ring leaning back toward her, its rim up at her chin
    g.save(); g.translate(512, 360); g.rotate(-0.32); ell(g, 0, 0, 22, 128, '#262229'); g.globalCompositeOperation = 'destination-out'; ell(g, 3, 0, 10, 110, '#000'); g.restore();
    line(g, [[512, 360], [600, 470]], 14, '#262229');                                              // the column
    if (hands === 'grip') {
      arm(g, [380, 420 + sh], [432, 470], [520, 318], 76, 60, 44, coat);                           // her right arm, up to the rim
      ell(g, 484, 250, 27, 23, skin, -0.3); ell(g, 524, 318, 27, 23, skin, -0.3);                  // both fists on the rim
      line(g, [[472, 242], [498, 256]], 4, skinD); line(g, [[512, 310], [538, 324]], 4, skinD);    // white knuckles
    } else {
      ell(g, 470, 236, 26, 22, skin, -0.2);                                                         // her left hand alone on the rim
      arm(g, [380, 430], [420, 470], [404, 330], 76, 60, 44, coat);                                // her right hand up, a bun at her mouth
      ell(g, 404, 326, 26, 22, skin);
      ell(g, 420, 300, 40, 28, '#c98a4b'); g.strokeStyle = '#8f5528'; g.lineWidth = 5; g.beginPath(); g.ellipse(420, 298, 25, 15, 0, 0.3, 5.6); g.stroke(); ell(g, 420, 292, 8, 5, '#f4e7c9');
    }
  }, face.length * 7 + (hands === 'grip' ? 1 : 2), 11);
}

// ================================================================================== THE TRAFFIC OFFICER
// A tall, thin constable in navy with a white cap cover, white gloves and a white cross-belt; a silver stopwatch.
// pose: 'watch' (stopwatch up, eyes on it) | 'whistle' (whistle in, arm sweeping right) | 'idle' (the Monday: a blank page) | 'notes' (1969: writing up a crash)
export function officer(pose = 'watch') {
  return paper(512, 1100, (g) => {
    const skin = '#e9c3a4', skinD = '#d6a684', navy = '#22304f', navyD = '#1a2540', white = '#f4f2ee';
    rr(g, 196, 1010, 58, 64, 14, '#16161a'); rr(g, 262, 1010, 58, 64, 14, '#16161a');             // boots
    poly(g, [[190, 640], [252, 640], [250, 1020], [196, 1020]], navyD); poly(g, [[262, 640], [324, 640], [318, 1020], [264, 1020]], navyD);   // trousers
    blob(g, [[176, 330], [256, 300], [336, 330], [352, 470], [344, 680], [168, 680], [160, 470]], navy);   // tunic
    line(g, [[190, 336], [320, 640]], 14, white);                                                   // cross-belt
    rr(g, 166, 600, 180, 22, 6, white);                                                             // belt
    for (const y of [400, 470, 540]) ell(g, 262, y, 7, 7, '#c9b26a');                              // buttons
    rr(g, 230, 250, 54, 66, 16, skinD);                                                             // neck
    const hx = 257, hy = 200;
    blob(g, [[hx - 66, hy - 30], [hx - 40, hy - 86], [hx + 42, hy - 86], [hx + 68, hy - 30], [hx + 62, hy + 50], [hx + 24, hy + 86], [hx - 24, hy + 86], [hx - 62, hy + 50]], skin);
    ell(g, hx - 66, hy + 4, 12, 20, skinD); ell(g, hx + 66, hy + 4, 12, 20, skinD);                // ears
    // a white helmet with a short peak and a strap
    blob(g, [[hx - 80, hy - 40], [hx - 74, hy - 104], [hx - 30, hy - 132], [hx + 30, hy - 132], [hx + 74, hy - 104], [hx + 80, hy - 40], [hx + 40, hy - 56], [hx - 40, hy - 56]], white);
    ell(g, hx, hy - 46, 84, 14, '#d9d6cf', 0, 0, Math.PI);
    rr(g, hx - 58, hy - 92, 116, 12, 5, '#d9d6cf');
    line(g, [[hx - 66, hy - 40], [hx - 54, hy + 40]], 4, '#3a3a40'); line(g, [[hx + 66, hy - 40], [hx + 54, hy + 40]], 4, '#3a3a40');
    ell(g, hx, hy + 18, 10, 14, skinD);                                                             // nose
    line(g, [[hx - 34, hy + 52], [hx + 34, hy + 52]], 10, '#6b4a3a');                                // a moustache
    if (pose === 'watch') {
      eyes(g, [[hx - 26, hy - 14, 1], [hx + 26, hy - 14, 1]], 11, [0.75, -0.8], 0.9, 0.85);
      line(g, [[hx - 42, hy - 40], [hx - 12, hy - 36]], 6, '#6b4a3a'); line(g, [[hx + 12, hy - 36], [hx + 42, hy - 40]], 6, '#6b4a3a');
      line(g, [[hx - 12, hy + 66], [hx + 12, hy + 66]], 5, '#7a3f35');
      arm(g, [180, 350], [150, 500], [196, 610], 60, 48, 36, navy); ell(g, 200, 612, 22, 20, white);   // left arm down
      arm(g, [334, 350], [400, 330], [356, 196], 60, 48, 36, navy);                                     // right arm up: the stopwatch at eye level
      ell(g, 356, 196, 24, 22, white);
      ell(g, 372, 150, 42, 42, '#c9ccd1'); ell(g, 372, 150, 34, 34, '#f7f5ef'); rr(g, 364, 96, 16, 16, 4, '#c9ccd1');
      line(g, [[372, 150], [372, 124]], 4, '#1b1b1b'); line(g, [[372, 150], [392, 158]], 3, '#c0392b');
    } else if (pose === 'whistle') {
      eyes(g, [[hx - 26, hy - 14, 1], [hx + 26, hy - 14, 1]], 11, [0.6, 0], 0.75, 0.85);
      line(g, [[hx - 42, hy - 34], [hx - 12, hy - 40]], 6, '#6b4a3a'); line(g, [[hx + 12, hy - 40], [hx + 42, hy - 34]], 6, '#6b4a3a');
      ell(g, hx - 22, hy + 52, 16, 12, '#f0b9a0'); ell(g, hx + 22, hy + 52, 16, 12, '#f0b9a0');      // puffed cheeks
      rr(g, hx + 4, hy + 56, 46, 18, 7, '#c9ccd1');                                                   // the whistle
      arm(g, [180, 350], [200, 470], [250, 420], 60, 48, 36, navy); ell(g, 254, 412, 22, 20, white);   // left hand at his chest
      arm(g, [334, 350], [420, 360], [490, 330], 60, 48, 36, navy); ell(g, 488, 328, 24, 22, white);   // right arm out: go across
    } else if (pose === 'idle') {                                                                     // the Monday: an empty page, nothing to write
      for (const sx of [-26, 26]) curve(g, [hx + sx - 12, hy - 8], [hx + sx, hy - 2], [hx + sx + 12, hy - 8], 5, '#231a16');   // eyes half shut, pleased
      line(g, [[hx - 42, hy - 32], [hx - 12, hy - 32]], 6, '#6b4a3a'); line(g, [[hx + 12, hy - 32], [hx + 42, hy - 32]], 6, '#6b4a3a');
      curve(g, [hx - 16, hy + 64], [hx, hy + 74], [hx + 18, hy + 62], 5, '#7a3f35');
      arm(g, [180, 350], [170, 470], [230, 470], 60, 48, 36, navy);
      arm(g, [334, 350], [400, 420], [330, 300], 60, 48, 36, navy);                                   // pencil up to his ear: nothing to note
      rr(g, 214, 430, 104, 76, 6, '#f7f3e8');                                                          // the page, blank
      ell(g, 232, 476, 22, 20, white); ell(g, 330, 296, 22, 20, white);
      line(g, [[336, 290], [316, 236]], 6, '#c0392b');
    } else {                                                                                         // 1969: writing it up, harried
      eyes(g, [[hx - 26, hy - 6, 1], [hx + 26, hy - 6, 1]], 11, [0, 0.95], 0.55, 0.85);
      line(g, [[hx - 42, hy - 26], [hx - 12, hy - 20]], 7, '#6b4a3a'); line(g, [[hx + 12, hy - 20], [hx + 42, hy - 26]], 7, '#6b4a3a');
      line(g, [[hx - 14, hy + 70], [hx + 14, hy + 66]], 5, '#7a3f35');
      sweat(g, hx + 60, hy - 30, 0.8);
      arm(g, [180, 350], [170, 470], [230, 470], 60, 48, 36, navy);
      arm(g, [334, 350], [360, 470], [300, 470], 60, 48, 36, navy);
      rr(g, 214, 430, 104, 76, 6, '#efe9da'); for (let k = 0; k < 4; k++) line(g, [[226, 448 + k * 14], [306, 448 + k * 14]], 3, '#5a554c');
      ell(g, 232, 476, 22, 20, white); ell(g, 300, 470, 22, 20, white);
      line(g, [[300, 470], [270, 440]], 6, '#c0392b');                                                   // the pencil
    }
  }, 31 + pose.length);
}

// ================================================================================== OTHER DRIVERS (busts, facing left or right)
// dir: 1 faces right, -1 faces left (the canvas is mirrored). kind: 'milk' | 'taxi' | 'bus' | 'young' | 'gran'
export function driver(kind, mood = 'tense', dir = 1) {
  const c = paper(400, 400, (g) => {
    const P = { milk: ['#f0c7a6', '#f4f2ee', '#5c7fa3', '#3b2a22'], taxi: ['#c99b72', '#2b2b30', '#1d1d22', '#2b201c'], bus: ['#e8bfa0', '#3d5a80', '#2f4766', '#bfbab0'],
      young: ['#f2d0b4', '#c0392b', '#8f2a20', '#e2c07a'], gran: ['#efcdb8', '#8e6fa8', '#6e5288', '#e8e4dc'] }[kind];
    const [skin, top, topD, hair] = P;
    rr(g, 70, 150, 90, 230, 30, '#5b4636');                                                          // seat back
    blob(g, [[90, 300], [160, 250], [250, 262], [300, 320], [310, 400], [80, 400]], top);
    rr(g, 180, 210, 44, 56, 14, skin);
    const hx = 206, hy = 160;
    blob(g, [[hx - 58, hy - 30], [hx - 20, hy - 80], [hx + 50, hy - 72], [hx + 70, hy - 10], [hx + 58, hy + 50], [hx + 10, hy + 70], [hx - 50, hy + 50]], skin);
    ell(g, hx + 68, hy + 6, 11, 15, 'rgba(0,0,0,0.08)');
    if (kind === 'milk') { rr(g, hx - 64, hy - 96, 130, 40, 10, '#f4f2ee'); rr(g, hx - 10, hy - 66, 90, 14, 6, '#5c7fa3'); }
    else if (kind === 'taxi') { blob(g, [[hx - 66, hy - 30], [hx - 40, hy - 92], [hx + 60, hy - 80], [hx + 40, hy - 56], [hx - 30, hy - 50]], '#2b201c'); line(g, [[hx + 20, hy + 34], [hx + 66, hy + 30]], 9, '#2b201c'); }
    else if (kind === 'bus') { rr(g, hx - 66, hy - 96, 132, 44, 10, '#2f4766'); ell(g, hx + 30, hy - 56, 56, 10, '#141418', 0, 0, Math.PI); }
    else if (kind === 'young') blob(g, [[hx - 70, hy + 10], [hx - 60, hy - 80], [hx + 20, hy - 100], [hx + 70, hy - 60], [hx + 30, hy - 50], [hx - 30, hy - 40], [hx - 40, hy + 30]], hair);
    else { ell(g, hx - 10, hy - 62, 70, 40, hair); ell(g, hx - 40, hy - 92, 26, 22, hair); }
    const E = [[hx + 4, hy - 6, 1], [hx + 44, hy - 4, 0.78]];
    if (mood === 'tense') { eyes(g, E, 12, [0.8, 0], 1.1, 0.55); line(g, [[hx - 10, hy - 34], [hx + 16, hy - 40]], 5, '#3b2a22'); line(g, [[hx + 34, hy - 40], [hx + 56, hy - 32]], 5, '#3b2a22'); line(g, [[hx + 26, hy + 40], [hx + 52, hy + 40]], 5, '#6b3a32'); }
    else if (mood === 'careful') { eyes(g, E, 12, [1, 0.1], 0.55, 0.85); line(g, [[hx - 8, hy - 22], [hx + 16, hy - 16]], 6, '#3b2a22'); line(g, [[hx + 34, hy - 16], [hx + 56, hy - 22]], 5, '#3b2a22'); line(g, [[hx + 26, hy + 40], [hx + 52, hy + 40]], 5, '#6b3a32'); }
    else { eyes(g, E, 12, [0.5, 0], 0.8, 0.85); curve(g, [hx + 20, hy + 34], [hx + 40, hy + 48], [hx + 60, hy + 32], 5, '#6b3a32'); }
    // hands on the wheel (tense/careful: both; easy: one, the other arm on the door)
    g.save(); g.translate(300, 300); g.rotate(-0.38); ell(g, 0, 0, 15, 84, '#262229'); g.globalCompositeOperation = 'destination-out'; ell(g, 2, 0, 7, 72, '#000'); g.restore();
    if (mood === 'easy') { ell(g, 290, 220, 18, 15, skin); arm(g, [240, 290], [200, 360], [150, 330], 50, 40, 30, topD); }
    else { arm(g, [250, 290], [270, 350], [312, 310], 50, 40, 30, topD); ell(g, 290, 232, 18, 15, skin); ell(g, 314, 312, 18, 15, skin); }
  }, kind.length * 5 + mood.length, 9);
  if (dir > 0) return c;
  const m = cv(c.width, c.height), g = m.getContext('2d'); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); return m;
}

// ================================================================================== THE PASSENGER (Ingrid's back seat)
// A man in a hat who booked her taxi months ago to be on the road at five: thrilled, a camera up. Faces right.
export function passenger(mood = 'thrilled') {
  return paper(400, 400, (g) => {
    const skin = '#e6bf9f', coat = '#7a6a58', hat = '#4a3f36';
    blob(g, [[80, 300], [150, 250], [250, 262], [300, 320], [310, 400], [70, 400]], coat);
    rr(g, 176, 210, 44, 56, 14, skin);
    const hx = 200, hy = 160;
    blob(g, [[hx - 56, hy - 30], [hx - 20, hy - 78], [hx + 50, hy - 70], [hx + 68, hy - 10], [hx + 56, hy + 50], [hx + 10, hy + 70], [hx - 48, hy + 50]], skin);
    rr(g, hx - 74, hy - 70, 150, 16, 7, hat); blob(g, [[hx - 52, hy - 66], [hx - 44, hy - 120], [hx + 44, hy - 120], [hx + 52, hy - 66]], hat);
    rr(g, hx - 48, hy - 80, 98, 10, 3, '#2b241f');
    if (mood === 'thrilled') {
      for (const [x, y] of [[hx + 4, hy - 4], [hx + 42, hy - 2]]) curve(g, [x - 12, y + 4], [x, y - 8], [x + 12, y + 4], 5, '#231a16');
      blob(g, [[hx + 14, hy + 34], [hx + 62, hy + 32], [hx + 52, hy + 56], [hx + 24, hy + 56]], '#7a2f2f'); rr(g, hx + 20, hy + 34, 38, 8, 3, '#fbf6ea');
      rr(g, 250, 210, 74, 50, 8, '#2b2d31'); ell(g, 300, 236, 17, 17, '#8fa3b8'); ell(g, 300, 236, 9, 9, '#1b1d22'); rr(g, 262, 202, 16, 10, 3, '#c9ccd1');
      ell(g, 244, 250, 18, 16, skin); ell(g, 330, 254, 18, 16, skin);
    } else {
      eyes(g, [[hx + 4, hy - 4, 1], [hx + 42, hy - 2, 0.78]], 11, [0.6, 0], 0.85, 0.8);
      curve(g, [hx + 20, hy + 40], [hx + 38, hy + 48], [hx + 56, hy + 38], 5, '#7a2f2f');
    }
  }, mood.length * 3 + 5, 9);
}

// ================================================================================== A CYCLIST, stopped (bicycles had to stop at 04:50 too)
export function cyclist(kind = 'a') {
  return paper(640, 640, (g) => {
    const skin = kind === 'a' ? '#e9c3a4' : '#b98a68', top = kind === 'a' ? '#c65b3a' : '#4f6e8e', legs = '#2f3440';
    const wheelAt = (x) => { g.strokeStyle = '#26262b'; g.lineWidth = 12; g.beginPath(); g.arc(x, 520, 92, 0, TAU); g.stroke(); line(g, [[x, 520], [x, 440]], 3, '#8a8f96'); line(g, [[x - 60, 560], [x + 60, 480]], 3, '#8a8f96'); };
    wheelAt(150); wheelAt(490);
    line(g, [[150, 520], [300, 400], [470, 400], [490, 520]], 10, '#3f6f8f'); line(g, [[300, 400], [330, 520], [150, 520]], 10, '#3f6f8f'); line(g, [[330, 520], [470, 400]], 10, '#3f6f8f');
    line(g, [[300, 400], [286, 360]], 8, '#3f6f8f'); rr(g, 250, 348, 70, 16, 7, '#2b2b30');
    line(g, [[470, 400], [462, 340], [500, 330]], 8, '#3f6f8f');
    arm(g, [300, 380], [330, 470], [280, 600], 38, 30, 26, legs); rr(g, 252, 592, 52, 22, 8, '#1d1d21');
    arm(g, [300, 380], [370, 420], [340, 512], 38, 30, 26, legs);
    blob(g, [[262, 380], [282, 250], [360, 236], [380, 300], [330, 390]], top);
    arm(g, [350, 262], [420, 300], [492, 330], 30, 24, 20, top); ell(g, 494, 330, 14, 13, skin);
    rr(g, 318, 196, 34, 42, 12, skin);
    const hx = 340, hy = 150;
    blob(g, [[hx - 46, hy - 20], [hx - 26, hy - 60], [hx + 30, hy - 56], [hx + 50, hy - 10], [hx + 40, hy + 40], [hx, hy + 54], [hx - 40, hy + 36]], skin);
    if (kind === 'a') blob(g, [[hx - 52, hy - 10], [hx - 40, hy - 70], [hx + 30, hy - 78], [hx + 54, hy - 40], [hx + 10, hy - 50], [hx - 30, hy - 30]], '#e0b04a');
    else { rr(g, hx - 50, hy - 58, 104, 18, 8, '#2b2b30'); blob(g, [[hx - 40, hy - 54], [hx - 30, hy - 92], [hx + 34, hy - 92], [hx + 44, hy - 54]], '#2b2b30'); }
    eyes(g, [[hx + 6, hy - 4, 1], [hx + 34, hy - 2, 0.78]], 9, [0.7, 0], 1.05, 0.6);
    ell(g, hx + 26, hy + 30, 7, 8, '#7a3a32');
  }, kind.charCodeAt(0), 10);
}

// ================================================================================== CARS (side views, facing right; mirrored for left)
// Each car is two canvases: the body (with its windows cut out, so the driver card inside shows through) and one wheel
// (a separate card, so the wheels can turn as they creep). Generic shapes; no makes, badges or logos.
// kind: 'saloon' (Ingrid's two-tone humpback) | 'taxi' | 'van' | 'estate' | 'bus'
export const CAR = {
  saloon: { len: 4.3, h: 1.55, wheels: [0.2, 0.78], wr: 0.3, body: '#d9573f', roof: '#f3e6cc' },
  taxi: { len: 4.6, h: 1.55, wheels: [0.2, 0.78], wr: 0.32, body: '#26262b', roof: '#26262b' },
  van: { len: 4.4, h: 2.05, wheels: [0.2, 0.8], wr: 0.32, body: '#f1ede3', roof: '#f1ede3' },
  estate: { len: 4.6, h: 1.55, wheels: [0.19, 0.79], wr: 0.31, body: '#6f9a7a', roof: '#e9e3d2' },
  bus: { len: 10.5, h: 3.1, wheels: [0.16, 0.76], wr: 0.5, body: '#c8432f', roof: '#efe6d2' },
  news: { len: 4.4, h: 2.05, wheels: [0.2, 0.8], wr: 0.32, body: '#2f5d4a', roof: '#2f5d4a' },
};
export function carBody(kind, dir = 1, o = {}) {
  const S = CAR[kind], PX = 240;                                   // pixels per metre
  const top = o.sign ? 0.32 : 0;                                   // room above the roof for a taxi sign
  const w = Math.round(S.len * PX + 60), h = Math.round((S.h + top) * PX + 60), ox = 30, oy = 30 + top * PX, L = S.len * PX, Hh = S.h * PX;
  return paper(w, h, (g) => {
    if (dir < 0) { g.translate(w, 0); g.scale(-1, 1); }            // facing left: mirror the drawing, never the words
    const T = (s, x, y, size, col) => { g.save(); g.translate(x, y); g.scale(dir < 0 ? -1 : 1, 1); g.fillStyle = col; g.font = `700 ${size}px Fredoka, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, 0, 0); g.restore(); };
    const X = (u) => ox + u * L, Y = (v) => oy + Hh - v * PX;      // u along the car (0 back .. 1 front), v metres up
    const glass = (pts) => { g.save(); g.globalCompositeOperation = 'destination-out'; poly(g, pts, '#000'); g.restore(); };
    const chrome = (pts, wdt = 7) => { g.strokeStyle = '#d7dbe0'; g.lineWidth = wdt; g.lineJoin = 'round'; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.closePath(); g.stroke(); };
    const wheelArch = (u) => ell(g, X(u), Y(S.wr), S.wr * PX * 1.18, S.wr * PX * 1.12, '#1c1c20');
    if (kind === 'saloon') {
      blob(g, [[X(0.0), Y(0.42)], [X(0.0), Y(0.74)], [X(0.12), Y(0.86)], [X(0.27), Y(1.4)], [X(0.5), Y(1.52)], [X(0.68), Y(1.38)], [X(0.8), Y(0.92)], [X(1.0), Y(0.84)], [X(1.02), Y(0.5)], [X(0.96), Y(0.3)], [X(0.04), Y(0.3)]], S.body);
      blob(g, [[X(0.23), Y(0.9)], [X(0.29), Y(1.42)], [X(0.5), Y(1.53)], [X(0.68), Y(1.4)], [X(0.78), Y(0.9)]], S.roof);
      line(g, [[X(0.02), Y(0.62)], [X(1.0), Y(0.62)]], 6, '#f3e6cc');                                   // a cream waist line
      const rw = [[X(0.29), Y(0.92)], [X(0.33), Y(1.34)], [X(0.48), Y(1.45)], [X(0.48), Y(0.92)]];
      const fw = [[X(0.51), Y(0.92)], [X(0.51), Y(1.45)], [X(0.65), Y(1.36)], [X(0.75), Y(0.92)]];
      glass(rw); glass(fw); chrome(rw); chrome(fw);
      line(g, [[X(0.5), Y(0.36)], [X(0.5), Y(0.9)]], 4, 'rgba(0,0,0,0.25)'); line(g, [[X(0.75), Y(0.36)], [X(0.75), Y(0.9)]], 4, 'rgba(0,0,0,0.25)');   // door
      rr(g, X(0.6), Y(0.8), 30, 8, 3, '#d7dbe0');                                                      // handle
      rr(g, X(0.97), Y(0.58), 22, 34, 6, '#fff3c4'); rr(g, X(-0.005), Y(0.66), 14, 26, 4, '#b8271b');   // lamps
      rr(g, X(-0.01), Y(0.36), L * 0.1, 14, 6, '#d7dbe0'); rr(g, X(0.93), Y(0.36), L * 0.1, 14, 6, '#d7dbe0');   // bumpers
    } else if (kind === 'taxi' || kind === 'estate') {
      const est = kind === 'estate';
      blob(g, [[X(0.0), Y(0.42)], [X(0.0), Y(0.86)], [X(0.12), Y(0.98)], [X(est ? 0.04 : 0.22), Y(1.0)], [X(est ? 0.06 : 0.28), Y(1.46)], [X(0.62), Y(1.48)], [X(0.74), Y(1.02)], [X(1.0), Y(0.92)], [X(1.02), Y(0.48)], [X(0.96), Y(0.3)], [X(0.04), Y(0.3)]], S.body);
      if (est) rr(g, X(0.05), Y(1.5), L * 0.6, 10, 4, S.roof);
      glass([[X(est ? 0.08 : 0.3), Y(1.06)], [X(est ? 0.09 : 0.32), Y(1.38)], [X(0.44), Y(1.4)], [X(0.44), Y(1.06)]]);
      glass([[X(0.47), Y(1.06)], [X(0.47), Y(1.4)], [X(0.6), Y(1.4)], [X(0.69), Y(1.06)]]);
      line(g, [[X(0.46), Y(0.4)], [X(0.46), Y(1.02)]], 4, 'rgba(255,255,255,0.18)'); line(g, [[X(0.7), Y(0.4)], [X(0.7), Y(1.0)]], 4, 'rgba(255,255,255,0.18)');
      line(g, [[X(0.02), Y(0.7)], [X(1.0), Y(0.7)]], 6, '#d7dbe0');
      rr(g, X(0.97), Y(0.62), 22, 32, 6, '#fff3c4'); rr(g, X(-0.005), Y(0.72), 14, 26, 4, '#b8271b');
      rr(g, X(-0.01), Y(0.36), L * 0.1, 14, 6, '#d7dbe0'); rr(g, X(0.93), Y(0.36), L * 0.1, 14, 6, '#d7dbe0');
      if (!est) { rr(g, X(0.42), Y(1.66), 150, 46, 8, '#f6d24a'); T('TAXI', X(0.42) + 75, Y(1.66) + 25, 34, '#1d1d22'); }
    } else if (kind === 'van' || kind === 'news') {
      const news = kind === 'news';
      blob(g, [[X(0.0), Y(0.4)], [X(0.0), Y(1.92)], [X(0.62), Y(1.98)], [X(0.7), Y(1.9)], [X(0.8), Y(1.2)], [X(1.0), Y(1.0)], [X(1.02), Y(0.46)], [X(0.96), Y(0.3)], [X(0.04), Y(0.3)]], S.body);
      rr(g, X(0.04), Y(1.34), L * 0.58, 60, 8, news ? '#f3e9c9' : '#3f6fa0');                           // a band
      T(news ? 'TIDNINGAR' : 'MJÖLK', X(0.33), Y(1.34) + 32, news ? 42 : 50, news ? '#2f5d4a' : '#f1ede3');   // "newspapers" / "milk"   // "milk"
      glass([[X(0.66), Y(1.2)], [X(0.66), Y(1.78)], [X(0.69), Y(1.84)], [X(0.78), Y(1.2)]]);
      line(g, [[X(0.64), Y(0.4)], [X(0.64), Y(1.86)]], 4, 'rgba(0,0,0,0.2)');
      rr(g, X(0.97), Y(0.66), 22, 32, 6, '#fff3c4'); rr(g, X(-0.005), Y(0.7), 14, 30, 4, '#b8271b');
      rr(g, X(-0.01), Y(0.36), L * 0.08, 14, 6, '#9aa0a8'); rr(g, X(0.93), Y(0.36), L * 0.1, 14, 6, '#d7dbe0');
    } else if (kind === 'bus') {
      blob(g, [[X(0.0), Y(0.4)], [X(0.0), Y(2.9)], [X(0.04), Y(3.05)], [X(0.96), Y(3.05)], [X(1.0), Y(2.9)], [X(1.01), Y(0.46)], [X(0.98), Y(0.3)], [X(0.02), Y(0.3)]], S.body);
      rr(g, X(0.0), Y(3.05), L, 0.55 * PX, 20, S.roof);
      rr(g, X(0.0), Y(1.0), L, 22, 0, S.roof);
      for (let k = 0; k < 7; k++) glass([[X(0.06 + k * 0.122), Y(1.6)], [X(0.06 + k * 0.122), Y(2.62)], [X(0.16 + k * 0.122), Y(2.62)], [X(0.16 + k * 0.122), Y(1.6)]]);
      rr(g, X(0.9), Y(2.5), 0.08 * L, 1.95 * PX, 8, '#2d2a2e');                                         // a door
    }
    for (const u of S.wheels) wheelArch(u);
    if (o.sign) { rr(g, X(0.42), Y(1.5) - 50, 132, 52, 9, '#f6d24a'); T(o.sign, X(0.42) + 66, Y(1.5) - 23, 32, '#1d1d22'); }   // a taxi sign on the roof
  }, kind.length * 13, 12);
}
export function wheel(r = 0.3) {
  const PX = 240, s = Math.round(r * PX * 2 + 24);
  return paper(s, s, (g) => {
    const c = s / 2, R = r * PX;
    ell(g, c, c, R, R, '#1d1d21'); ell(g, c, c, R * 0.56, R * 0.56, '#c9ccd1'); ell(g, c, c, R * 0.42, R * 0.42, '#e6e8eb');
    for (let k = 0; k < 4; k++) { const a = k / 4 * TAU; line(g, [[c + Math.cos(a) * R * 0.12, c + Math.sin(a) * R * 0.12], [c + Math.cos(a) * R * 0.4, c + Math.sin(a) * R * 0.4]], 5, '#9aa0a8'); }
    ell(g, c, c, R * 0.1, R * 0.1, '#9aa0a8');
  }, 77, 5);
}

// ================================================================================== PEOPLE WATCHING (full figures and window busts)
// kind: 'pyjamas' (a man with a coffee cup) | 'coat' (a woman with a scarf) | 'boy' (with a cap) | 'mole' (Season 1's thief,
// copied in spirit from the lab: maroon cap with a brim, bald under it, the mole on his LEFT cheek, our right when he
// faces us; here with a paper cup, a passer-by at 05:00)
export function watcher(kind) {
  return paper(320, 900, (g) => {
    const P = { pyjamas: ['#efcdb5', '#8fb3d9', '#6d8fb3', '#4a3a30'], coat: ['#d9a988', '#b5473a', '#8f3328', '#e8d9a0'], boy: ['#f2d3b5', '#e0a03a', '#b57d22', '#3b2a22'], mole: ['#8f5f42', '#3d4149', '#2d3036', '#1d1a18'],
      hat: ['#e8c3a2', '#5d6b52', '#48553f', '#3a2f26'], girl: ['#f0cdb2', '#6f8fc4', '#56729f', '#7a4a2a'], gran: ['#efcfbd', '#9a5a7a', '#7c4560', '#e6e2dc'] }[kind];
    const [skin, top, topD, hair] = P;
    const hx = 160, hy = 150;
    rr(g, 112, 820, 44, 60, 14, '#2a2a2e'); rr(g, 164, 820, 44, 60, 14, '#2a2a2e');
    rr(g, 116, 520, 40, 310, 14, kind === 'pyjamas' ? top : '#3d4a5e'); rr(g, 164, 520, 40, 310, 14, kind === 'pyjamas' ? top : '#3d4a5e');
    blob(g, [[100, 270], [160, 246], [220, 270], [234, 420], [228, 560], [92, 560], [86, 420]], top);
    if (kind === 'pyjamas') for (let k = 0; k < 6; k++) line(g, [[104 + k * 22, 270], [104 + k * 22, 556]], 5, topD);
    rr(g, 140, 208, 40, 50, 12, skin);
    blob(g, [[hx - 56, hy - 20], [hx - 36, hy - 70], [hx + 36, hy - 70], [hx + 56, hy - 20], [hx + 50, hy + 40], [hx + 18, hy + 66], [hx - 18, hy + 66], [hx - 50, hy + 40]], skin);
    if (kind === 'mole') {
      ell(g, hx - 56, hy + 2, 10, 18, hair); ell(g, hx + 56, hy + 2, 10, 18, hair);
      g.fillStyle = '#7b1e21'; g.beginPath(); g.ellipse(hx, hy - 50, 60, 46, 0, Math.PI, TAU); g.fill(); rr(g, hx - 62, hy - 58, 124, 16, 6, '#7b1e21');
      ell(g, hx, hy - 42, 70, 15, '#5e1518'); ell(g, hx, hy - 96, 7, 6, '#5e1518');
      eyes(g, [[hx - 22, hy - 4, 1], [hx + 22, hy - 4, 1]], 8, [0, 0], 0.9, 0.85);
      line(g, [[hx - 14, hy + 40], [hx + 14, hy + 40]], 5, '#3d241b');
      ell(g, hx + 32, hy + 22, 6, 6, '#2a1712');                                                   // the mole: his left cheek, our right
    } else {
      if (kind === 'boy') { g.fillStyle = '#3f6fa0'; g.beginPath(); g.ellipse(hx, hy - 44, 58, 42, 0, Math.PI, TAU); g.fill(); ell(g, hx + 30, hy - 42, 46, 10, '#2f5580'); }
      else if (kind === 'hat') { rr(g, hx - 74, hy - 50, 148, 14, 6, hair); blob(g, [[hx - 50, hy - 46], [hx - 42, hy - 104], [hx + 42, hy - 104], [hx + 50, hy - 46]], hair); }
      else if (kind === 'girl') { blob(g, [[hx - 66, hy + 50], [hx - 60, hy - 64], [hx, hy - 86], [hx + 60, hy - 64], [hx + 66, hy + 50], [hx + 44, hy - 24], [hx - 44, hy - 24]], hair); }
      else if (kind === 'gran') { ell(g, hx, hy - 56, 56, 30, hair); ell(g, hx, hy - 88, 26, 20, hair); }
      else if (kind === 'coat') { blob(g, [[hx - 62, hy + 30], [hx - 56, hy - 70], [hx, hy - 92], [hx + 56, hy - 70], [hx + 62, hy + 30], [hx + 44, hy - 30], [hx - 44, hy - 30]], hair); }
      else { ell(g, hx, hy - 54, 52, 26, hair); }
      eyes(g, [[hx - 22, hy - 4, 1], [hx + 22, hy - 4, 1]], 9, [0, 0], 1.05, 0.6);
      ell(g, hx, hy + 38, 9, 10, '#7a3a32');
    }
    // arms: one hand holding a cup
    arm(g, [104, 290], [86, 420], [110, 520], 44, 36, 28, topD); ell(g, 112, 524, 16, 15, skin);
    arm(g, [216, 290], [250, 400], [190, 420], 44, 36, 28, topD); ell(g, 188, 420, 16, 15, skin);
    if (kind !== 'boy') { rr(g, 176, 380, 34, 44, 6, kind === 'mole' ? '#f3efe6' : '#e9e4da'); }
  }, kind.length * 17, 10);
}

// a bust in a lit window (window frame drawn by the set): kind 'old' (a man with a pipe) | 'kid' | 'lady'
export function windowBust(kind) {
  return paper(260, 260, (g) => {
    const P = { old: ['#e9c7ad', '#8a8f96', '#d9d6d0'], kid: ['#f2d3b5', '#e86a5a', '#5b3a26'], lady: ['#e8bfa0', '#5f7fa8', '#2b201c'] }[kind];
    const [skin, top, hair] = P;
    blob(g, [[40, 260], [60, 190], [130, 170], [200, 190], [220, 260]], top);
    const hx = 130, hy = 110;
    blob(g, [[hx - 48, hy - 20], [hx - 30, hy - 60], [hx + 30, hy - 60], [hx + 48, hy - 20], [hx + 42, hy + 34], [hx, hy + 56], [hx - 42, hy + 34]], skin);
    if (kind === 'old') { ell(g, hx, hy - 50, 40, 16, hair); line(g, [[hx + 6, hy + 30], [hx + 50, hy + 40]], 7, '#6b4a3a'); ell(g, hx + 54, hy + 36, 10, 12, '#6b4a3a'); }
    else if (kind === 'kid') { blob(g, [[hx - 52, hy], [hx - 40, hy - 64], [hx + 40, hy - 64], [hx + 52, hy], [hx + 30, hy - 40], [hx - 30, hy - 40]], hair); }
    else { blob(g, [[hx - 56, hy + 20], [hx - 50, hy - 64], [hx + 50, hy - 64], [hx + 56, hy + 20], [hx + 40, hy - 30], [hx - 40, hy - 30]], hair); }
    eyes(g, [[hx - 18, hy - 4, 1], [hx + 18, hy - 4, 1]], 8, [0, 0.2], 1.05, 0.6);
    ell(g, hx, hy + 30, 7, 8, '#7a3a32');
  }, kind.length * 23, 9);
}
