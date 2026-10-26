// Root Cause · the shared end card. Built once in Ep. 09 (2026-10-13); every reel ends with it, unchanged.
// The mark (a sprout above a ground line, roots below, the main root ending in the orange dot: the root cause), the wordmark "Root
// Cause" and "Follow for the next root cause.", in the brand colours (navy #0a0e15, white #eef2f6, grey #7f8a9a, the orange dot
// #ff8a1f) and Geist, for 3.0 s. Its sound is endcard.wav (3.0 s), placed at the card's first frame.
//
// Use in a solo-animation reel (engine/endcard/README.md has the steps): load it from the reel's film/index.html after core.js
//   <script src="../../../engine/endcard/endcard.js"></script>
// give the timeline ENDCARD.DUR seconds from the 'end' mark to 'done', and add the scene with UI.endcard() (engine/ui.js), i.e.
//   C.scene({ name: 'endcard', from: 'end', to: 'done', build(root, S) { ENDCARD.build(root, S); },
//             run(t, b, S) { ENDCARD.run(t - C.bt('end'), S); } });
// A pure function of time (no timers, no randomness): any frame can be painted in any order.
(() => {
  const C = window.C;
  const NAVY = '#0a0e15', INK = '#eef2f6', INK2 = '#7f8a9a', DOT = '#ff8a1f';
  const DUR = 3.0, W = C.W, H = C.H;
  const FAMILY = 'RC Geist';
  // the font sits next to this script (engine/endcard/), so its URL is taken from the script's own address
  const HERE = document.currentScript && document.currentScript.src ? document.currentScript.src.replace(/[^/]*$/, '') : 'endcard/';
  const css = document.createElement('style');
  css.textContent = `@font-face { font-family: '${FAMILY}'; src: url(${HERE}geist.woff2) format('woff2'); font-weight: 100 900; }`;
  document.head.appendChild(css);
  // the mark, from brand/art.html (a 236 × 360 box), scaled and centred
  const MS = 1.62, MX = W / 2 - 118 * MS, MY = 470;
  const GROUND = 'M0,96 L236,96';
  const SPROUT = 'M118,96 L118,40 M118,62 C96,52 82,34 84,14 C104,18 118,34 118,58 M118,48 C134,30 152,22 170,26 C166,46 146,58 118,60';
  const MAIN = 'M118,96 L118,170 C118,215 168,212 196,252 C214,278 216,306 214,328';
  const SIDES = [['M118,150 C118,190 86,208 60,232 C44,248 38,268 36,290', 5.5], ['M163,214 C150,232 146,252 148,274', 4.5], ['M70,222 C88,236 94,252 96,268', 4]];
  const DOTP = [214, 336];
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const step = (t, p) => window.Motion.step(t, p);
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

  function build(root, S) {
    if (!C.fonts.includes(`700 100px "${FAMILY}"`)) C.fonts.push(`700 100px "${FAMILY}"`, `500 60px "${FAMILY}"`);
    const el = C.el, reg = C.reg;
    S.ec = {};
    const E = S.ec;
    E.bg = reg(el('div', { class: 'abs', style: `width:${W}px;height:${H}px;background:${NAVY}` }, root));
    // the mark: one unscaled SVG, the mark's paths in a group scaled by an SVG transform (no SVG inside a CSS-scaled box: RC Ep. 08)
    E.svg = el('div', { class: 'abs', style: `width:${W}px;height:${H}px` }, root,
      `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><g class="m">` +
      `<path class="ground" d="${GROUND}" pathLength="1" style="fill:none;stroke:${INK};stroke-width:7;stroke-linecap:round"/>` +
      `<path class="sprout" d="${SPROUT}" pathLength="1" style="fill:none;stroke:${INK};stroke-width:7;stroke-linecap:round;stroke-linejoin:round"/>` +
      `<path class="main" d="${MAIN}" pathLength="1" style="fill:none;stroke:${INK};stroke-width:7;stroke-linecap:round"/>` +
      SIDES.map(([d, w], i) => `<path class="side${i}" d="${d}" pathLength="1" style="fill:none;stroke:${INK2};stroke-width:${w};stroke-linecap:round"/>`).join('') +
      `<circle class="ring" cx="${DOTP[0]}" cy="${DOTP[1]}" r="34" style="fill:none;stroke:${DOT};stroke-width:3"/>` +
      `<circle class="dot" cx="${DOTP[0]}" cy="${DOTP[1]}" r="20" style="fill:${DOT}"/></g></svg>`);
    const q = (c) => E.svg.querySelector('.' + c);
    E.g = q('m'); E.ground = q('ground'); E.sprout = q('sprout'); E.main = q('main'); E.sides = [0, 1, 2].map((i) => q('side' + i)); E.ring = q('ring'); E.dot = q('dot');
    // the words: masked rises (each line's box clips it)
    const mk = (y, size, weight, txt, color, track) => {
      const box = reg(el('div', { class: 'abs', style: `left:0;top:${y}px;width:${W}px;height:${Math.round(size * 1.3)}px;overflow:hidden` }, root));
      const inner = reg(el('div', { class: 'abs', style: `width:${W}px;text-align:center;font-family:'${FAMILY}';font-weight:${weight};font-size:${size}px;line-height:1.3;letter-spacing:${track};color:${color};white-space:nowrap` }, box, txt));
      return { box, inner, h: Math.round(size * 1.3) };
    };
    E.word = mk(1112, 148, 700, 'Root Cause', INK, '-0.035em');
    E.tag1 = mk(1316, 64, 500, 'Follow for the next', INK, '-0.01em');
    E.tag2 = mk(1400, 64, 500, 'root cause.', INK, '-0.01em');
  }

  const set = (e, k, v) => { if (e.__ec === undefined) e.__ec = {}; const s = String(v); if (e.__ec[k] !== s) { e.setAttribute(k, s); e.__ec[k] = s; } };
  function run(t, S) {
    const E = S.ec, put = C.put;
    const u = clamp(t, 0, DUR);
    // a slow push on the mark over the whole card
    const push = 1 + 0.025 * ease(clamp(u / DUR));
    set(E.g, 'transform', `translate(${(W / 2 + (MX - W / 2) * push).toFixed(2)},${(H / 2 + (MY - H / 2) * push).toFixed(2)}) scale(${(MS * push).toFixed(5)})`);
    // the ground line draws out from the centre (half drawn on the first frame), the sprout rises, the roots grow, the dot lands
    // (a path whose dash is still empty is hidden: a round cap would draw a dot at its start)
    const draw = (e, k, off = null) => { set(e, 'stroke-dasharray', `${k.toFixed(4)} 2`); if (off !== null) set(e, 'stroke-dashoffset', off.toFixed(4)); set(e, 'opacity', k > 0.004 ? '1' : '0'); };
    const gl = 0.5 + 0.5 * clamp(step(u, 'default'));
    draw(E.ground, gl, -(1 - gl) / 2);
    draw(E.sprout, clamp(step(u - 0.06, 'default')));
    draw(E.main, ease(clamp((u - 0.12) / 0.68)));
    E.sides.forEach((p, i) => draw(p, ease(clamp((u - 0.22 - 0.08 * i) / 0.5))));
    const DOT_T = 0.82;
    const dk = step(u - (DOT_T - 0.04), 'snappy');
    set(E.dot, 'r', (20 * clamp(dk, 0, 1.2)).toFixed(2)); set(E.dot, 'opacity', dk > 0.01 ? '1' : '0');
    const rk = clamp((u - DOT_T) / 0.9);
    set(E.ring, 'r', (20 + 30 * Math.sqrt(rk)).toFixed(2)); set(E.ring, 'opacity', u >= DOT_T ? (0.9 * (1 - rk) + 0.35 * rk).toFixed(3) : '0');
    // the words rise through their masks: the wordmark half up on the first frame, the line after it
    const rise = (L, t0, from = 1) => { const k = step(u - t0, 'heavy'); put(L.inner, { y: L.h * from * (1 - k) }); };
    rise(E.word, -0.18);
    rise(E.tag1, 0.62); rise(E.tag2, 0.72);
  }
  // DOT_T: when the dot lands (s after the card's start; the sound's ping is there); DOT_BOX: its region on screen, for the sync check
  window.ENDCARD = { DUR, build, run, DOT_T: 0.82, DOT_BOX: () => [MX + (DOTP[0] - 30) * MS, MY + (DOTP[1] - 30) * MS, MX + (DOTP[0] + 30) * MS, MY + (DOTP[1] + 30) * MS] };
})();
