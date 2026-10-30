// STARTER REEL — replace the hook with your scenes (everything before the 'end' mark). It renders as-is so a fresh reel
// works end to end, and it ends with the shared Root Cause end card like every reel.
// House style (see reels/reel-1-ai171-short for a full film): graphics in y 290–1180, words in the text zone y 1200–1520,
// x ≥ 80, key content x ≤ 940 (YouTube's buttons sit on the right, its title on the bottom 20 %).
// Every scene is a pure function of t: no timers, no Math.random, nothing mutated in run().
(() => {
  const { put, scene, canvas, seg } = C;
  const K = window.KIT, U = window.UI;
  const { tb, cam, clear, drift } = K;
  C.fonts = ['700 condensed 100px Bahn', '600 semi-condensed 64px Bahn', '700 semi-condensed 46px Bahn', '400 30px Bahn', '400 30px Mono', '700 30px Mono'];
  const X0 = 80;

  // 1 · hook: frame 0 already reads; the second line lands on a beat
  scene({
    name: 'hook', from: 'hook', to: 'end',
    build(root, S) {
      S.g = canvas(root); U.under(root);
      S.eye = U.mono(root, 'YOUR SERIES · EPISODE 1', X0, 296, 30);
      S.l1 = U.line(root, 'Your hook', { x: X0, y: 560, size: 200 });
      S.l2 = U.line(root, 'goes here.', { x: X0, y: 750, size: 200, color: 'var(--accent)' });
    },
    run(t, b, S) {
      const g = S.g; clear(g);
      const d = drift(t, 6);
      cam(g, { s: 1 + 0.04 * seg(t, 'hook', 'end'), x: d.x, y: d.y });
      U.grid(g, 0.06);
      put(S.eye, { o: 1 });
      U.rise(t, S.l1, [-0.4, -0.35]);                 // released before t = 0, so frame 0 reads
      U.rise(t, S.l2, [tb('w2'), tb('w2') + 0.08]);
    },
  });

  // every reel ends with the Root Cause end card ('end' → 'done', 3.0 s, engine/endcard): keep these three lines
  U.endcard();
  U.captions('all');   // every narration phrase in the caption band, until 'end' (none until vo_schedule.json has phrases)
  U.grain();           // film grain until 'end' (the end card stays clean)
  C.start();
})();
