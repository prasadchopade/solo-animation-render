// Reel 39 · Let Him Through?: the cast (all new, our own drawings). Five men in your queue, each with the look he has
// tonight and the look in his passport photo. One family of skin tones, set round the line rather than in a staircase;
// no saffron or green, no class ladder in the clothes; nobody famous (checklists, "Before animating").
// The ears are the clue: every man's ears are the same in his photo as tonight, except number four's, whose photo is
// his brother's (docs/script.md). Change an ear here and the test changes.
(() => {
  const T = {                                        // the skin tones (one family; the numbers don't run light to dark)
    a: { skin: '#bd8a64', skinD: '#946243', skinH: '#d8a983' },
    b: { skin: '#b7835d', skinD: '#8d5c3e', skinH: '#d3a27c' },
    c: { skin: '#c2906a', skinD: '#986648', skinH: '#dcae88' },
  };
  const EARS = {
    one: { h: 0.95, out: 0.34, lobe: 0.15 },                  // medium, close, attached lobes
    two: { h: 1.12, out: 0.48, lobe: 0.95, fold: 1 },         // large, a folded top rim, free lobes
    three: { h: 0.86, out: 0.40, lobe: 0.55 },                // small and round
    four: { h: 1.0, out: 0.10, lobe: 0.0 },                   // narrow, flat to the head, attached lobes
    brother: { h: 1.0, out: 0.86, lobe: 1.0, lobeL: 0.6 },    // they stand out, with big free lobes
    five: { h: 1.2, out: 0.30, lobe: 1.0, lobeL: 1.0 },       // long, long lobes
  };
  const MEN = [
    { // 1 · late twenties, curly hair, a round face; a rucksack. His photo is this year's.
      now: { ...T.b, hair: '#16100c', style: 'curly', fat: 0.18, jawW: 1.02, ew: 0.24, eh: 0.14, brow: 0.07, browArch: 0.07, noseW: 1.25, lip: 1.3, ear: EARS.one, shirt: '#4f9fd8', collar: 'tee', strap: '#3b3f48' },
      photo: { ...T.b, hair: '#16100c', style: 'curly', fat: 0.18, jawW: 1.02, ew: 0.24, eh: 0.14, brow: 0.07, browArch: 0.07, noseW: 1.25, lip: 1.3, ear: EARS.one, shirt: '#e9e6df', collar: 'shirt' },
      bag: 'rucksack', walk: 0.95,
    },
    { // 2 · about forty, heavier, a full greying beard, his hairline gone back; a big wrapped box. His photo is nine years old.
      now: { ...T.a, hair: '#1a1410', style: 'part', recede: 0.3, grey: 0.38, fat: 0.88, jawW: 1.04, chin: 0.3, vol: 0, beard: 1, beardGrey: 0.42, lines: 0.28, folds: 0.6, bags: 0.45, ew: 0.225, eh: 0.125, brow: 0.095, lid: 0.25, noseW: 1.15, lip: 1.2, ear: EARS.two, shirt: '#cdd8e6', check: '#5f82b2', collar: 'shirt' },
      // nine years younger: thin, clean-shaven, a thick head of hair, a broad jaw, heavy brows and a dark shirt; never number four's neat, narrow photo
      photo: { ...T.a, hair: '#15100c', style: 'part', vol: 0.16, recede: 0, grey: 0, fat: -0.2, jawW: 1.08, chin: 0.3, beard: 0, lines: 0, folds: 0, bags: 0, ew: 0.235, eh: 0.135, brow: 0.11, browArch: 0.05, lid: 0.1, noseW: 1.18, lip: 1.2, ear: EARS.two, shirt: '#2f3a52', collar: 'shirt' },
      bag: 'gift', walk: 0.85,
    },
    { // 3 · mid twenties, a buzz cut; a guitar case. His photo has all his hair.
      now: { ...T.c, hair: '#15100c', style: 'buzz', jawW: 0.94, chin: 0.35, ew: 0.235, eh: 0.13, brow: 0.055, browTilt: -0.03, noseL: 0.03, noseW: 0.85, ear: EARS.three, shirt: '#8b6ac6', collar: 'tee' },
      photo: { ...T.c, hair: '#15100c', style: 'afro', jawW: 0.94, chin: 0.35, ew: 0.235, eh: 0.13, brow: 0.055, browTilt: -0.03, noseL: 0.03, noseW: 0.85, ear: EARS.three, shirt: '#2c2d35', collar: 'tee' },
      bag: 'guitar', walk: 1.05,
    },
    { // 4 · late twenties, neat side-parted hair, a narrow face; a small roller case. His photo is his brother's.
      now: { ...T.c, hair: '#120d0a', style: 'part', jawW: 0.9, chin: 0.25, ew: 0.22, eh: 0.125, brow: 0.072, browTilt: 0.02, browArch: 0.015, noseL: 0.05, noseW: 0.95, lip: 0.7, ear: EARS.four, shirt: '#3e6fae', collar: 'shirt' },
      photo: { ...T.c, hair: '#120d0a', style: 'part', jawW: 0.9, chin: 0.25, ew: 0.22, eh: 0.125, brow: 0.072, browTilt: 0.02, browArch: 0.015, noseL: 0.05, noseW: 0.95, lip: 0.7, ear: EARS.brother, shirt: '#dfe3e8', collar: 'shirt' },
      bag: 'roller', walk: 1.0,
    },
    { // 5 · about sixty, thick white hair swept to one side, a white moustache; a cardigan, a rolled bedding bag. His photo: dyed black.
      now: { ...T.b, hair: '#1a1410', style: 'swept', grey: 0.93, must: 0.12, mustGrey: 0.9, browGrey: 0.8, fat: 0.22, lines: 0.85, folds: 0.55, bags: 0.3, ew: 0.22, eh: 0.12, brow: 0.085, ear: EARS.five, shirt: '#6b5a86', collar: 'cardigan', under: '#efe9dc' },
      photo: { ...T.b, hair: '#120d0a', style: 'swept', grey: 0, must: 0.12, mustGrey: 0, browGrey: 0, fat: 0.18, lines: 0.6, folds: 0.4, bags: 0.2, ew: 0.22, eh: 0.12, brow: 0.085, ear: EARS.five, shirt: '#3b4250', collar: 'shirt' },
      bag: 'bedroll', walk: 0.8,
    },
  ];
  window.CAST = { T, EARS, MEN };
})();
