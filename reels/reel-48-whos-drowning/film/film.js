// Reel 48 Who's Drowning?: a crowded beach in cut paper, seen from straight above. Sixteen numbered people; one of
// them, number nine, is drowning, and she makes no sound. (Pose test build: frame 0 and the search, for stills.)
// Every scene is a pure function of t: no timers, no Math.random, nothing mutated in run().
(() => {
  const { put, scene, canvas, clamp, lerp, W, H } = C;
  const K = window.KIT, U = window.UI, P = window.PAPER, B = window.BEACH;
  C.fonts = ['700 condensed 100px Bahn', '600 semi-condensed 64px Bahn', '700 semi-condensed 46px Bahn'];

  // ------------------------------------------------------------------ story timing (seconds)
  const T = { ringStart: 1.9, ringEnd: 16.9, help: 3.6, wave: 7.8, dunk: 22.6, boatBack: 25.0 };
  P.usePieceTexture(true);

  // the story's callbacks into the world (all pure functions of t)
  const ctx = {
    // No. 6 yells "HELP!" and flails, then bobs and splashes about. He's only shown laughing after "Time." (T.dunk),
    // when his brother dunks him: nothing during the search says he's fine.
    boy(t) {
      const flail = clamp((t - (T.help - 0.25)) / 0.2) * clamp((T.help + 1.3 - t) / 0.3);
      const laugh = clamp((t - (T.dunk + 0.6)) / 0.2) * clamp((T.dunk + 4.0 - t) / 0.5);
      const reach = clamp((t - T.dunk) / 0.35) * clamp((T.dunk + 1.0 - t) / 0.3);
      const dunk = clamp((t - (T.dunk + 0.3)) / 0.12) * clamp((T.dunk + 1.1 - t) / 0.12);
      return { flail, laugh, dunk, reach };
    },
    waving(t) { return clamp((t - (T.wave - 0.3)) / 0.25) * clamp((T.wave + 3.2 - t) / 0.4); },
    boatWave(t) { return clamp((t - (T.boatBack + 0.3)) / 0.2) * clamp((T.boatBack + 2.6 - t) / 0.3); },
    lifeguard(t) { return { onChair: 1, point: 0 }; },
  };

  // ------------------------------------------------------------------ the frame-0 line and the ring
  function label(g, t) {
    const x0 = 64, y0 = 290, w = 684, h = 86;
    const tile = label.tile || (label.tile = P.fibreTile(256, 77, 0.8));
    g.save();
    P.strip(g, [[x0, y0 + h / 2], [x0 + w * 0.5, y0 + h / 2 + 2], [x0 + w, y0 + h / 2 - 1]].flatMap((p, i, a) => {
      if (i === a.length - 1) return [p];
      const q = a[i + 1], out = [];
      for (let k = 0; k < 12; k++) out.push([lerp(p[0], q[0], k / 12), lerp(p[1], q[1], k / 12)]);
      return out;
    }), h, 61, 0.05);
    P.fill(g, '#fffdf7', { lift: 6 });
    P.strip(g, [[x0, y0 + h / 2], [x0 + w, y0 + h / 2]], h, 61, 0.05);
    P.grain(g, tile, 0.5, true);
    g.fillStyle = B.COL.navy; g.font = '700 condensed 66px Bahn'; g.fontStretch = 'condensed';
    g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText('ONE OF THEM IS DROWNING.', x0 + 24, y0 + h / 2 + 4);
    g.restore();
  }
  function ring(g, t) {
    const cx = 858, cy = 334, R = 58, r = 37;
    const k = clamp((P.twos(t) - T.ringStart) / (T.ringEnd - T.ringStart));    // 0 full .. 1 gone
    g.save();
    P.blob(g, cx, cy, R + 8, R + 8, 0, 71, 0.02); P.fill(g, '#fffdf7', { lift: 6 });
    // the track left behind
    g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.arc(cx, cy, r, 0, Math.PI * 2, true); g.fillStyle = 'rgba(27,42,68,0.12)'; g.fill();
    // what's left of the ring, tearing away clockwise from the top
    if (k < 1) {
      const a0 = -Math.PI / 2 + k * Math.PI * 2, a1 = Math.PI * 1.5;
      g.beginPath(); g.arc(cx, cy, R, a0, a1); g.arc(cx, cy, r, a1, a0, true); g.closePath();
      P.fill(g, B.COL.coral, { lift: 3 });
    }
    g.restore();
  }

  // ------------------------------------------------------------------ the beach
  scene({
    name: 'beach', from: 'hook', to: 'end',
    build(root, S) { S.g = canvas(root); },
    run(t, b, S) {
      const g = S.g;
      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
      B.paint(g, t, { ctx });
      label(g, t);
      ring(g, t);
      g.restore();
    },
  });

  // every reel ends with the Root Cause end card ('end' → 'done', 3.0 s, engine/endcard)
  U.endcard();
  C.start();
})();
