// engine/casefile.js: the case file. From reel 47 on, every Tests episode is a numbered case in one running file
// (HQ's spec, 23 Nov 2026). This file holds only the parts that never change from episode to episode: the words, the
// layout, how the next folder lands, and the timing against the end card. Each reel draws the folder in its own look
// (neon, riso, ink...) from the geometry given here, so a viewer who sees two episodes knows the ritual.
//
// THE RITUAL (fixed; don't change it per reel)
//   Frame 0     a folder tab, top left inside the safe zones, stamped "CASE <n>": the word CASE in capitals and the
//               reel's number, no leading zero. On from frame 0; at 2.6–2.8 s it rises 16 px and goes out.
//   Stamps      a folder's stamp lights only once the folder has settled (pose.stamp 0 → 1), so no word crosses a safe
//               edge while a folder rises or falls: folder <n + 1>'s "CASE <n + 1>" lights as it lands.
//   The ending  the story's key object drops into folder <n>; folder <n> closes; folder <n + 1> lands on top of it;
//               the narrator (af_heart) says two words, "Next case.", the same every time; a short hold; the end card.
//   The label   optional, on the NEXT folder only: one to three words naming the next test's subject, under its stamp
//               ("CASE 48 · THE FINGERPRINT"). HQ gives it at the final; without one the next folder shows its number.
//
// TIMING against the 'end' mark (the end card's first frame), in seconds, CASEFILE.T:
//   a0 -3.40     folder <n> rises into place from below the frame (settled by -3.05)
//   drop0 -3.00  the key object leaves where it is (the reel says where: opt.from) on an arc into the folder's mouth
//   drop1 -2.45  it's in; folder <n> closes over it (closed by -2.25)
//   land0 -2.10  folder <n + 1> falls from above the frame
//   land1 -1.76  it hits folder <n> (cue a slap or thud here); it settles by -1.55
//   say -1.35    the narrator starts "Next case." (about 0.75–0.9 s long at Kokoro speed 1.0), so it ends by about
//                -0.45; place_vo.py puts the line's first sound at end + CASEFILE.T.say (Python: the same number, -1.35)
//   0            the end card (engine/endcard), unchanged
//   So the narration before the ritual should end by about end - 3.1 s, and nothing else is said over it.
//
// GEOMETRY (frame pixels, 1080 x 1920; safe zones top >= 269, right <= 950, bottom <= 1536)
//   CASEFILE.TAB              the frame-0 tab's box {x, y, w, h}, and CASEFILE.TAB.stamp, its stamp's box (rot in rad)
//   CASEFILE.FOLDER           {cx, cy, w, h, tabW, tabH}: where folder <n> sits at the end; <n + 1> lands offset by
//                             {dx, dy, rot} = CASEFILE.FOLDER.next
//   CASEFILE.shape(w, h)      the folder's outline with its tab (its back), as [x, y] points centred on 0, 0 (closed)
//   CASEFILE.cover(F)         the front cover {x0, y0, x1, y1}, centre-relative: a solid panel over the lower folder that
//                             the key object drops behind; it's lowered by open * FOLDER.coverDrop while the folder is open
//   CASEFILE.tabShape(w, h)   the frame-0 tab's outline, points from its top-left corner (closed)
//   CASEFILE.stampBox(F)      the stamp's box, on the front cover, centre-relative, with its rot
//   CASEFILE.labelBox(F)      where the optional label sits on the next folder's cover, centre-relative
//   Draw order at the end: folder n's back, the key object, folder n's cover (solid, with its stamp), then folder n + 1
//   whole (solid: it hides folder n where it lies on it).
//
// POSES (pure functions of t: any frame in any order; held on twos, a new pose every 1/15 s, as the house's motion is)
//   CASEFILE.words(n)                 'CASE 47'
//   CASEFILE.label(text)              checks a label (one to three words) and returns it in capitals, or '' for none
//   CASEFILE.tab(t)                   { on, dy, k } for the frame-0 tab: draw it at TAB shifted by dy, at brightness or
//                                     opacity k, while on
//   CASEFILE.ending(t, end, opt)      every pose at time t, with end = C.bt('end') and opt.from = {x, y}, where the
//                                     key object is when it leaves. Returns
//     { a: {on, cx, cy, rot, open, stamp},  folder <n>: open 1 → 0 as it closes; stamp 0 → 1 once it has settled
//       b: {on, cx, cy, rot, stamp},  folder <n + 1>: stamp 0 → 1 as it lands
//       drop: {on, x, y, s, u},       the key object: centre, scale and progress 0..1 (draw it while on, under a's
//                                     front flap once u = 1, or not at all once a is closed)
//       jolt,                         a's small jump when b hits (px, already added to a.cy)
//       say }                         true while "Next case." is being said
//
// A REEL, in its own look (sketch):
//   const E = CASEFILE.ending(t, C.bt('end'), { from: { x: 540, y: 600 } });
//   if (E.a.on) drawFolder(g, E.a, CASEFILE.words(47));          // the reel's own drawing, from CASEFILE.shape
//   if (E.drop.on) drawKeyObject(g, E.drop);
//   if (E.b.on) drawFolder(g, E.b, CASEFILE.words(48), CASEFILE.label('the fingerprint'));
//   and at frame 0: const P = CASEFILE.tab(t); if (P.on) drawTab(g, CASEFILE.TAB, P.dy, CASEFILE.words(47));
// Text the reel draws for the stamp should report its box to the safe-zone check (LAB.textBox, or fillText).
(() => {
  const W = (window.C && window.C.W) || 1080, H = (window.C && window.C.H) || 1920;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, x) => a + (b - a) * x;
  const seg = (t, t0, t1) => clamp((t - t0) / (t1 - t0));
  const inOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const out = (x) => 1 - Math.pow(1 - x, 3);
  const deg = Math.PI / 180;

  const T = { tabOut: 2.6, tabGone: 2.8, a0: -3.4, a1: -3.05, drop0: -3.0, drop1: -2.45, close1: -2.25,
    land0: -2.1, land1: -1.76, settle: -1.55, say: -1.35 };

  // ---- the frame-0 tab: top left, inside the safe zones
  const TAB = { x: 80, y: 292, w: 300, h: 96 };
  TAB.stamp = { x: TAB.x + 26, y: TAB.y + 24, w: 248, h: 54, rot: -3 * deg };
  const tabShape = (w = TAB.w, h = TAB.h) => [[0, h], [0, 14], [14, 0], [w - 40, 0], [w, h * 0.55], [w, h]];

  // ---- the folders at the end
  const FOLDER = { cx: 540, cy: 900, w: 640, h: 460, tabW: 230, tabH: 58, coverTop: 128, coverDrop: 90,
    next: { dx: 34, dy: -46, rot: 4 * deg } };      // 47 shows under 48: the file grows
  function shape(w = FOLDER.w, h = FOLDER.h, tabW = FOLDER.tabW, tabH = FOLDER.tabH) {
    const x0 = -w / 2, x1 = w / 2, y0 = -h / 2, y1 = h / 2;
    return [[x0, y1], [x0, y0 + 12], [x0 + 12, y0], [x0 + tabW, y0], [x0 + tabW + 30, y0 + tabH], [x1 - 12, y0 + tabH],
      [x1, y0 + tabH + 12], [x1, y1]];
  }
  // the front cover: the lower part of the folder, a solid panel the key object drops behind; it carries the stamp.
  // While the folder is open the cover is lowered by open * coverDrop (so its top edge, and the stamp, move with it).
  const cover = (F = FOLDER) => ({ x0: -F.w / 2, y0: -F.h / 2 + F.coverTop, x1: F.w / 2, y1: F.h / 2 });
  const stampBox = (F = FOLDER) => ({ x: -F.w / 2 + 46, y: -F.h / 2 + F.coverTop + 44, w: 330, h: 86, rot: -6 * deg });
  const labelBox = (F = FOLDER) => ({ x: -F.w / 2 + 46, y: -F.h / 2 + F.coverTop + 160, w: F.w - 92, h: 54 });

  const words = (n) => {
    if (!(Number.isInteger(n) && n > 0)) throw new Error(`casefile: a case number is a whole number (got ${n})`);
    return `CASE ${n}`;
  };
  function label(text) {
    if (!text) return '';
    const w = String(text).trim().split(/\s+/);
    if (w.length > 3) throw new Error(`casefile: a label is one to three words (got "${text}")`);
    return w.join(' ').toUpperCase();
  }

  // ---- frame 0's tab: on from 0; at 2.6–2.8 s it rises 16 px and goes out (its words never leave the safe zones)
  const twos = (t) => Math.floor(t * 15 + 1e-6) / 15;              // the house's motion is on twos at 30 fps
  function tab(t) {
    t = twos(t);
    if (t >= T.tabGone) return { on: false, dy: 0, k: 0 };
    const u = seg(t, T.tabOut, T.tabGone);
    return { on: true, dy: -16 * u, k: 1 - u };
  }

  // ---- the ending
  function ending(t, end, opt = {}) {
    t = twos(t);
    const u = t - end, F = FOLDER, from = opt.from || { x: F.cx, y: F.cy - 520 };
    // folder n rises into place, with a small overshoot
    const r = seg(u, T.a0, T.a1);
    const rise = r < 1 ? lerp(H - F.cy + F.h, 0, out(r)) - Math.sin(Math.PI * r) * 14 * r : 0;
    // b falls under gravity (ease-in), hits at land1, then one damped bounce
    const fall = seg(u, T.land0, T.land1), bounce = seg(u, T.land1, T.settle);
    const bY = u < T.land1 ? lerp(-F.cy - F.h, 0, fall * fall) : -Math.sin(Math.PI * bounce) * 24 * (1 - bounce);
    const bRot = u < T.land1 ? lerp(-9 * deg, F.next.rot, out(fall)) : F.next.rot + Math.sin(Math.PI * bounce) * 1.2 * deg * (1 - bounce);
    const jolt = u >= T.land1 && u < T.settle ? Math.sin(Math.PI * bounce) * 10 * (1 - bounce) : 0;
    // each folder's stamp lights once the folder has settled, so its words never cross a safe edge while it moves
    const a = { on: u >= T.a0, cx: F.cx, cy: F.cy + rise + jolt, rot: 0, open: 1 - inOut(seg(u, T.drop1, T.close1)),
      stamp: seg(u, T.a1, T.a1 + 0.15) };
    const b = { on: u >= T.land0, cx: F.cx + F.next.dx, cy: F.cy + F.next.dy + bY, rot: bRot, stamp: seg(u, T.land1, T.land1 + 0.1) };
    // the key object: an arc from where it is into the folder's mouth, shrinking a little as it goes in
    const d = seg(u, T.drop0, T.drop1), dx = inOut(d), to = { x: F.cx, y: F.cy - F.h * 0.08 };
    const apex = Math.min(from.y, to.y) - 150;
    const y = (1 - dx) * (1 - dx) * from.y + 2 * (1 - dx) * dx * apex + dx * dx * to.y;
    const drop = { on: u >= T.drop0 && u < T.close1, u: d, x: lerp(from.x, to.x, dx), y, s: lerp(1, 0.72, d) };
    return { a, b, drop, jolt, say: u >= T.say && u < T.say + 0.95 };
  }

  window.CASEFILE = { T, TAB, FOLDER, words, label, tab, tabShape, shape, cover, stampBox, labelBox, ending, W, H };
})();
