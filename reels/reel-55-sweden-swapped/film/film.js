// Reel 55, The Morning Sweden Swapped (Curiosity desk). Paper cut-out characters and cars in a lit 3D street, one travelling
// camera, one hard cut (on the twist, to two years later). The light turns from blue pre-dawn to sunrise on the switch.
// Our own story and cast; from the references we take only the grammar (a strange first line, a travelling camera,
// light that turns with the story, one feeling per face per line, figures still once they land, one-word captions).
// Every frame is a pure function of t (seek(t)): no state carries from one frame to the next.
import { makeStage } from './stage55.js';
import { buildSet, ROAD, WALK } from './set.js';
import { ingrid, officer, driver, carBody, wheel, watcher, windowBust, CAR } from './chars.js';

const { W, H } = window.C;
C.fonts = ['700 118px Fredoka'];
const DUR = C.bt('end');
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = (k) => k * k * (3 - 2 * k);
const lerp = (a, b, k) => a + (b - a) * k;

// ------------------------------------------------------------------ the narration's clock (EST until the voice is placed)
const VO = window.VO || [], WORDS = window.WORDS || [];
const EST = { n01: [0.12, 4.9], n02: [5.15, 8.6], n03: [8.9, 14.2], n04: [18.4, 21.8], n05: [23.0, 28.4], n06: [28.7, 31.9], n07: [32.6, 40.6], n08: [40.9, 43.9], n09: [44.3, 50.8] };
const ln = (id) => VO.find((v) => v.id === id) || { t0: EST[id][0], t1: EST[id][1] };
const T0 = (id) => ln(id).t0, T1 = (id) => ln(id).t1;
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9']/g, '');
const word = (id, w, frac, nth = 0) => { const xs = WORDS.filter((q) => q.p === id && norm(q.w) === w); const x = xs[nth]; return x ? x.t0 : T0(id) + (T1(id) - T0(id)) * frac; };

// story beats (seconds)
const SW0 = T1('n03') + 0.5;                            // the last minute: the stopwatch
const FIVE = T0('n04') - 1.3;                           // 05:00: the whistle, and they creep across as the sun comes up
const SW1 = FIVE + 1.0;                                 // (the cars cross between FIVE - 0.6 and SW1 + 1.4)
const CUT = T0('n07') - 0.04;                           // the hard cut: two years later
const DAWN0 = FIVE - 0.5, DAWN1 = FIVE + 1.6;           // the sun comes up on the switch
const MORN1 = T1('n06');                                // the Monday: full morning by the end of its line

let st, THREE, SET, sun, hemi, fill, skyMat, capG, blobTex, glowTex;
const CARDS = [], CARS = [], GLOWS = [], CAST = {};

// ------------------------------------------------------------------ cards
function card(canvases, h, o = {}) {
  const texs = canvases.map((c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; });
  const asp = canvases[0].width / canvases[0].height;
  const geo = new THREE.PlaneGeometry(h * asp, h); geo.translate(o.ax ?? 0, h / 2 - (o.sink ?? 0), 0);
  const mat = new THREE.MeshStandardMaterial({ map: texs[0], alphaTest: 0.5, alphaToCoverage: true, side: THREE.DoubleSide, roughness: 0.9, emissive: '#ffffff', emissiveMap: texs[0], emissiveIntensity: o.glow ?? 0.14 });
  const m = new THREE.Mesh(geo, mat); m.castShadow = o.shadow ?? true; m.receiveShadow = true;
  m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: texs[0], alphaTest: 0.5 });
  return { m, mat, texs, show(i) { if (mat.map !== texs[i]) { mat.map = mat.emissiveMap = texs[i]; m.customDepthMaterial.map = texs[i]; } } };
}
const radial = (c0, c1) => { const c = document.createElement('canvas'); c.width = c.height = 128; const q = c.getContext('2d'); const r = q.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, c0); r.addColorStop(1, c1); q.fillStyle = r; q.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); };
function contact(w, d, op = 0.5) {
  const b = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex, color: '#000000', transparent: true, opacity: op, depthWrite: false }));
  b.rotation.x = -Math.PI / 2; b.scale.set(w, d, 1); return b;
}
function stand(c, x, z, y = 0, turn = 0.75, shadow = [0.8, 0.4]) {
  c.m.position.set(x, y, z); st.scene.add(c.m); CARDS.push({ c, turn });
  const b = contact(shadow[0], shadow[1], 0.45); b.position.set(x, y + 0.006, z); st.scene.add(b); c.blob = b; return c;
}

// a car: its body card, its wheels, its driver inside, its lamps. dir 1 faces east, -1 west
function makeCar(kind, dir, who) {
  const S = CAR[kind], g = new THREE.Group();
  const body = carBody(kind, dir), PXM = 240, hgt = body.height / PXM;
  const bc = card([body], hgt, { sink: 30 / PXM - 0.02 }); g.add(bc.m);
  const wc = wheel(S.wr), wheels = [];
  for (const u of S.wheels) {
    const w = card([wc], wc.height / PXM, { sink: wc.height / PXM / 2, shadow: false }); const x = (dir > 0 ? u - 0.5 : 0.5 - u) * S.len;
    w.m.position.set(x, S.wr, 0.03); g.add(w.m); wheels.push(w);
  }
  if (who) {
    who.mat.emissiveIntensity = 0.32; who.m.receiveShadow = false;
    who.m.position.set(dir * S.len * (kind === 'bus' ? 0.36 : 0.1), kind === 'bus' ? 1.25 : (kind === 'van' ? 0.62 : 0.28), -0.25); g.add(who.m);
  }
  if (kind !== 'bus') {                                                    // the car's inside: the far door, dark, behind the driver
    const inner = new THREE.Mesh(new THREE.PlaneGeometry(S.len * 0.52, S.h * 0.42), new THREE.MeshBasicMaterial({ color: '#1e2530', fog: true }));
    inner.position.set(dir * S.len * 0.06, S.h * 0.74, -0.5); g.add(inner);
  }
  // headlamps: a glow at the front corner (night only)
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffe6b8', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
  glow.position.set(dir * S.len * 0.5, S.h * (kind === 'bus' ? 0.25 : 0.4), 0.15); glow.scale.set(0.75, 0.75, 1); g.add(glow); GLOWS.push(glow);
  const sh = contact(S.len * 1.08, 2.2, 0.55); sh.position.y = 0.006; g.add(sh);
  st.scene.add(g);
  const car = { kind, dir, g, body: bc, wheels, drv: who, len: S.len, wr: S.wr, glow };
  CARS.push(car); return car;
}
// a car's place at time t from keys [[t, x, z], ...]; it turns a little toward a lane change (paper cars only turn a little)
function drive(car, t, keys) {
  let i = 0; while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
  const [ta, xa, za] = keys[i], [tb, xb, zb] = keys[Math.min(i + 1, keys.length - 1)];
  const u = tb > ta ? clamp((t - ta) / (tb - ta)) : 1, k = ss(u);
  const lane = Math.abs(zb - za) > 0.5;
  const x = lane ? lerp(xa, xb, k) : lerp(xa, xb, u), z = lerp(za, zb, k);
  car.g.position.set(x, 0, z);
  const turn = lane ? Math.sin(Math.PI * u) * 0.28 * Math.sign(zb - za) * -car.dir : 0;   // toward the new lane, then straight
  car.g.rotation.y = turn;
  for (const w of car.wheels) w.m.rotation.z = -x / car.wr;
}

// ------------------------------------------------------------------ build
function build(root) {
  st = makeStage(root, { bg: 0x1a2f63, fog: { color: 0x1a2f63, density: 0.012 }, fov: 46, exposure: 1.3, bloom: { strength: 0.35, radius: 0.5, threshold: 0.85 } });
  THREE = st.THREE;
  blobTex = radial('rgba(255,255,255,1)', 'rgba(255,255,255,0)'); glowTex = radial('rgba(255,240,210,1)', 'rgba(255,200,120,0)');
  SET = buildSet(st, THREE);
  const sc = st.scene;
  hemi = new THREE.HemisphereLight('#3d6cc8', '#0d1530', 1.5); sc.add(hemi);
  fill = new THREE.DirectionalLight('#ffc89a', 0); fill.position.set(-20, 6, -30); sc.add(fill); sc.add(fill.target);   // the warm bounce off the sunlit side
  sun = new THREE.DirectionalLight('#8fb0ff', 0.55); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 300 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.05;
  sc.add(sun); sc.add(sun.target);
  skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uTop: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uDir: { value: new THREE.Vector3() }, uCol: { value: new THREE.Color() }, uAmt: { value: 0 }, uDisc: { value: 0 } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
    fragmentShader: `uniform vec3 uTop, uHor, uDir, uCol; uniform float uAmt, uDisc; varying vec3 vD;
      void main(){ float h = clamp(vD.y, 0.0, 1.0); vec3 c = mix(uHor, uTop, pow(h, 0.5)); float s = max(dot(normalize(vD), normalize(uDir)), 0.0);
        c += uCol * (smoothstep(0.9990, 0.99955, s) * uDisc + pow(s, 18.0) * 0.55 * uAmt + pow(s, 4.0) * 0.12 * uAmt); gl_FragColor = vec4(c, 1.0); }` });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(800, 32, 16), skyMat); sky.frustumCulled = false; sky.renderOrder = -1; sc.add(sky); st.sky = sky;

  // the cast. Ingrid's faces: 0 scared, 1 terror, 2 focus, 3 relief, 4 easy (1969)
  const ing = card([ingrid('scared', 'grip'), ingrid('terror', 'grip'), ingrid('focus', 'grip'), ingrid('relief', 'grip'), ingrid('easy', 'easy')], 1.32);
  CAST.ingrid = makeCar('saloon', 1, ing); CAST.ingrid.face = ing;
  CAST.bus = makeCar('bus', 1, card([driver('bus', 'tense', 1), driver('bus', 'careful', 1), driver('bus', 'easy', 1)], 0.9));
  CAST.estate = makeCar('estate', 1, card([driver('gran', 'tense', 1), driver('gran', 'careful', 1), driver('gran', 'easy', 1)], 0.95));
  CAST.van = makeCar('van', -1, card([driver('milk', 'tense', -1), driver('milk', 'careful', -1), driver('milk', 'easy', -1)], 0.95));
  CAST.taxi = makeCar('taxi', -1, card([driver('taxi', 'tense', -1), driver('taxi', 'careful', -1), driver('taxi', 'easy', -1)], 0.95));
  CAST.young = makeCar('estate', -1, card([driver('young', 'easy', -1)], 0.95));          // 1969 only
  CAST.officer = stand(card([officer('watch'), officer('whistle'), officer('idle'), officer('notes')], 1.86), 3.0, 4.05, 0.15);
  CAST.watchers = [
    stand(card([watcher('pyjamas')], 1.75), -3.4, -WALK + 1.0, 0.15),
    stand(card([watcher('coat')], 1.72), -2.5, -WALK + 1.4, 0.15),
    stand(card([watcher('boy')], 1.3), 11.8, -WALK + 1.5, 0.15),
  ];
  CAST.mole = stand(card([watcher('mole')], 1.78), 17, -WALK + 1.1, 0.15);              // Season 1's thief, a passer-by at 05:00
  // people at their windows, over the street
  const busts = ['old', 'kid', 'lady', 'old', 'lady'];
  const slots = SET.windows.filter((w) => w.side < 0 && w.f <= 1 && w.x > -8 && w.x < 16).filter((_, i) => i % 3 === 1).slice(0, busts.length);
  CAST.busts = slots.map((w, i) => { const c = card([windowBust(busts[i])], 0.95, { shadow: false }); c.m.position.set(w.x, w.y - 0.55, -WALK + 0.04); sc.add(c.m); return c; });
  capG = C.canvas(root);
}

// ------------------------------------------------------------------ where the cars are, when
const LANE = 1.8;
function placeCars(t) {
  const y69 = t >= CUT, C1 = CAST;
  C1.young.g.visible = y69;
  if (!y69) {
    // 04:50: stopped, eastbound in the far lane (z < 0), westbound in the near lane. Each creeps across in turn, and after
    // 05:00 the street crawls on (the Monday: everyone driving like a learner)
    const cross = (x0, z0, z1, d, delay, crawl) => [[0, x0, z0], [FIVE - 0.6 + delay, x0, z0], [SW1 + 0.6 + delay, x0 + d * 3.2, z1], [SW1 + 1.4 + delay, x0 + d * 3.6, z1], [CUT, x0 + d * (3.6 + crawl * (CUT - SW1 - 1.4 - delay)), z1]];
    drive(C1.ingrid, t, cross(0, -LANE, LANE, 1, 0.75, 0.9));
    drive(C1.bus, t, cross(-16, -LANE, LANE, 1, 0.9, 0.7));
    drive(C1.estate, t, cross(10, -LANE, LANE, 1, 0.0, 0.9));
    drive(C1.van, t, cross(5.5, LANE, -LANE, -1, 0.5, 0.9));
    drive(C1.taxi, t, cross(-7, LANE, -LANE, -1, 0.1, 0.9));
  } else {
    // 1969, summer: right-hand traffic, everyone at ease and quicker. Ingrid (near lane, eastbound) passes a fender-bender
    const v = 5.5;
    drive(C1.ingrid, t, [[CUT, -26, LANE], [CUT + 30, -26 + v * 30, LANE]]);
    drive(C1.taxi, t, [[CUT, 14, -LANE], [CUT + 30, 14, -LANE]]); C1.taxi.g.rotation.y = 0.12;       // stopped: the bump
    drive(C1.estate, t, [[CUT, 18.6, -LANE + 0.3], [CUT + 30, 18.6, -LANE + 0.3]]); C1.estate.g.rotation.y = -0.2;
    drive(C1.van, t, [[CUT, 40, -LANE], [CUT + 30, 40 - 7 * 30, -LANE]]);
    drive(C1.young, t, [[CUT, 60, -LANE], [CUT + 30, 60 - 8 * 30, -LANE]]);
    drive(C1.bus, t, [[CUT, -60, LANE], [CUT + 30, -60 + 4.5 * 30, LANE]]);
  }
}

// ------------------------------------------------------------------ the light
const LOOK = {
  night: { top: '#08143a', hor: '#2c4c8c', fog: '#1a2f63', dens: 0.012, hs: '#3d6cc8', hg: '#0d1530', hi: 1.5, sc: '#8fb0ff', si: 0.55, dir: [-0.35, 0.75, 0.55], exp: 1.35, fill: 0, lamps: 1, shafts: 0, day: 0 },
  dawn: { top: '#4f7fca', hor: '#ffbe80', fog: '#e2b996', dens: 0.011, hs: '#9fbbe6', hg: '#9a7258', hi: 1.2, sc: '#ffc27e', si: 3.6, dir: [1, 0.06, -0.1], exp: 1.2, fill: 0.6, lamps: 0, shafts: 1, day: 1 },
  morning: { top: '#5f97e0', hor: '#ffd7a6', fog: '#efd3b0', dens: 0.009, hs: '#b4d0f2', hg: '#b08c6c', hi: 1.35, sc: '#ffd6a0', si: 3.8, dir: [1, 0.16, -0.2], exp: 1.15, fill: 0.7, lamps: 0, shafts: 0.7, day: 1 },
  summer: { top: '#3f86e6', hor: '#cfe4f7', fog: '#d9e6ef', dens: 0.006, hs: '#bcd8f6', hg: '#b9a07c', hi: 1.3, sc: '#fff0d6', si: 4.2, dir: [0.45, 0.75, 0.5], exp: 1.05, fill: 0.5, lamps: 0, shafts: 0, day: 1 },
};
function lightAt(t) {
  if (t >= CUT) return [LOOK.summer, LOOK.summer, 0];
  if (t < DAWN1) return [LOOK.night, LOOK.dawn, ss(seg(t, DAWN0, DAWN1))];
  return [LOOK.dawn, LOOK.morning, ss(seg(t, DAWN1 + 1, MORN1))];
}

// ------------------------------------------------------------------ the camera: one travelling shot, one cut
// keys: [t, position, target, fov, focus distance (m; 0 = no depth of field), aperture]
const P = (x, y, z) => [x, y, z];
function keys67() {
  return [
    [0, P(0.4, 1.02, 0.25), P(0.42, 1.22, -2.0), 44, 2.3, 7],                                       // frame 0: Ingrid, frozen at the wheel
    [word('n01', 'every', 0.3), P(0.1, 1.2, 1.3), P(0.6, 1.45, -2.0), 46, 3.3, 5],                  // easing back
    [word('n01', 'road', 0.55), P(-3.2, 3.0, 4.6), P(3.0, 1.6, -2.2), 48, 0, 0],                   // the reveal: every car stopped
    [T0('n02'), P(-5.6, 5.2, 5.4), P(5.5, 1.3, -1.5), 50, 0, 0],                                    // the whole street, waiting
    [word('n02', 'other', 0.7), P(-4.2, 5.6, 5.2), P(8.5, 1.4, -0.5), 50, 0, 0],                    // ... on the other side
    [T0('n03') + 0.4, P(0.9, 1.1, 0.7), P(0.42, 1.2, -2.0), 44, 2.75, 7],                          // back to Ingrid
    [word('n03', 'habit', 0.6), P(0.6, 1.08, 0.45), P(0.42, 1.2, -2.0), 42, 2.5, 8],               // closer: one slip of habit
    [SW0, P(3.5, 1.66, 5.5), P(2.3, 1.42, -0.4), 40, 1.5, 9],                                      // the last minute: his stopwatch, Ingrid soft behind
    [FIVE - 0.5, P(3.46, 1.66, 5.45), P(2.2, 1.42, -0.5), 40, 1.5, 9],
    [FIVE + 0.1, P(3.42, 1.66, 5.4), P(2.1, 1.4, -0.6), 40, 7.6, 9],                               // 05:00: focus on her face (the peak); the whistle
    [FIVE + 0.7, P(3.3, 1.8, 5.4), P(2.4, 1.4, -0.4), 40, 7.4, 6],
    [FIVE + 2.4, P(-1.5, 4.8, 5.4), P(9.0, 1.2, -1.0), 48, 0, 0],                                  // up and away as the street crosses, the sun up
    [T0('n04') + 0.6, P(-5.5, 6.4, 4.8), P(14, 1.6, 0.0), 50, 0, 0],                               // the pick: the sun up the street, camera still
    [T1('n04') + 1.2, P(-5.4, 6.4, 4.8), P(14.2, 1.6, 0.0), 50, 0, 0],
    [word('n05', 'monday', 0.4), P(3.6, 1.6, 5.85), P(2.85, 1.45, 3.6), 42, 1.9, 6],               // the Monday: his notebook, a blank page
    [T0('n06') - 0.6, P(null, 1.3, 4.6), P(null, 1.15, 1.8), 44, 2.9, 6],                          // riding beside Ingrid, crawling
    [CUT - 0.01, P(null, 1.1, 4.0), P(null, 1.15, 1.8), 42, 2.35, 8],                              // ... and she breathes out
  ];
}
function keys69() {
  return [
    [CUT, P(10, 2.2, 4.8), P(16, 1.2, -1.6), 46, 6.5, 3],                                          // 1969: the bump, the officer's notebook
    [word('n07', 'carefully', 0.6), P(6, 2.6, 5.0), P(15, 1.3, -1.2), 48, 0, 0],
    [T0('n08'), P(3.0, 1.6, 5.0), P(10, 1.2, 1.2), 46, 0, 0],                                      // the traffic, at ease
    [T0('n09') + 0.3, P(0, 1.1, 4.25), P(0, 1.12, 1.55), 46, 2.45, 7],                             // Ingrid, at ease: frame 0 again
    [DUR, P(0, 1.1, 4.1), P(0, 1.12, 1.55), 46, 2.3, 7],
  ];
}
function monotone(xs, ys) {
  const n = xs.length, d = [], m = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / Math.max(1e-6, xs[i + 1] - xs[i]));
  m.push(d[0]); for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2); m.push(0);
  for (let i = 0; i < n - 1; i++) { if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; } const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b; if (s > 9) { const k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; } }
  return (x) => { let i = 0; while (i < n - 2 && x > xs[i + 1]) i++; const h = Math.max(1e-6, xs[i + 1] - xs[i]), u = clamp((x - xs[i]) / h), u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * h * m[i + 1]; };
}
let PATHS = null;
function camAt(t) {
  if (!PATHS) {
    const mk = (K) => {
      const ts = K.map((k) => k[0]), us = K.map((_, i) => i / (K.length - 1));
      const V = (i) => new THREE.CatmullRomCurve3(K.map((k) => new THREE.Vector3(k[i][0] ?? 0, k[i][1], k[i][2])), false, 'centripetal');
      return { u: monotone(ts, us), pos: V(1), tgt: V(2), fov: monotone(ts, K.map((k) => k[3])), foc: monotone(ts, K.map((k) => k[4])), ap: monotone(ts, K.map((k) => k[5])) };
    };
    PATHS = { a: mk(keys67()), b: mk(keys69()) };
  }
  const Pth = t < CUT ? PATHS.a : PATHS.b, u = Pth.u(t);
  const pos = Pth.pos.getPoint(u), tgt = Pth.tgt.getPoint(u);
  // the shots that ride beside Ingrid's car (the Monday crawl; 1969's last shot): x follows her car
  const ride = t < CUT ? [word('n05', 'monday', 0.4), T0('n06') - 0.6] : [T0('n09') - 1.5, T0('n09') + 0.3];
  if (t >= ride[0]) {
    const x = CAST.ingrid.g.position.x + 0.42, k = ss(seg(t, ride[0], ride[1]));
    pos.x = lerp(pos.x, x, k); tgt.x = lerp(tgt.x, x, k);
  }
  return { pos, tgt, fov: Pth.fov(t), focus: Pth.foc(t), ap: Pth.ap(t) };
}

// ------------------------------------------------------------------ faces (one feeling per face per line)
function faces(t) {
  let f = 0;
  if (t >= CUT) f = 4;
  else if (t >= T0('n06')) f = 3;
  else if (t >= T0('n05') - 0.2) f = 2;
  else if (t >= FIVE - 0.4) f = 1;                                       // the peak: the switch itself
  CAST.ingrid.face.show(f);
  const mood = t >= CUT ? 2 : t >= SW1 + 1.5 ? 1 : 0;
  for (const k of ['bus', 'estate', 'van', 'taxi']) CAST[k].drv.show(mood);
  CAST.officer.show(t >= CUT ? 3 : t >= T0('n05') - 0.5 ? 2 : t >= FIVE - 0.1 ? 1 : 0);
}

// ------------------------------------------------------------------ one-word captions: bold, white, outlined, in the safe zone
function captions(g, t) {
  t = Math.round(t * 30) / 30;
  let cur = null;
  for (let i = 0; i < WORDS.length; i++) { const w = WORDS[i], nx = WORDS[i + 1], end = nx ? Math.min(nx.t0, w.t1 + 0.35) : w.t1 + 0.6; if (t >= w.t0 - 0.02 && t < end) cur = w; }
  if (!cur || t >= DUR) return;
  const k = 1 + 0.1 * (1 - ss(seg(t, cur.t0 - 0.02, cur.t0 + 0.08)));
  const txt = cur.w.replace(/[,.?!;:]+$/, '');
  g.save(); g.translate(530, 1405); g.scale(k, k);
  g.font = '700 112px Fredoka'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
  const wdt = g.measureText(txt).width; if (wdt > 760) { const s = 760 / wdt; g.scale(s, s); }
  g.lineWidth = 22; g.strokeStyle = 'rgba(14,18,34,0.92)'; g.strokeText(txt, 0, 0); g.fillStyle = '#fffaf0'; g.fillText(txt, 0, 0);
  g.restore();
}

// ------------------------------------------------------------------ one frame
const cTmp = [];
function frame(t) {
  const { camera, look } = st, sc = st.scene;
  if (!cTmp.length) for (let i = 0; i < 2; i++) cTmp.push(new THREE.Color());
  const mixC = (target, a, b, k) => target.copy(cTmp[0].set(a)).lerp(cTmp[1].set(b), k);
  placeCars(t); faces(t);
  const cam = camAt(t);
  camera.fov = cam.fov; camera.position.copy(cam.pos); camera.lookAt(cam.tgt); camera.updateProjectionMatrix();
  st.sky.position.copy(camera.position);
  // the light
  const [A, B, k] = lightAt(t);
  mixC(sc.fog.color, A.fog, B.fog, k); sc.fog.density = lerp(A.dens, B.dens, k); sc.background.copy(sc.fog.color);
  mixC(hemi.color, A.hs, B.hs, k); mixC(hemi.groundColor, A.hg, B.hg, k); hemi.intensity = lerp(A.hi, B.hi, k);
  mixC(sun.color, A.sc, B.sc, k); sun.intensity = lerp(A.si, B.si, k);
  const L = new THREE.Vector3(...A.dir).normalize().lerp(new THREE.Vector3(...B.dir).normalize(), k).normalize();
  const centre = new THREE.Vector3().copy(cam.tgt).setY(0);
  sun.target.position.copy(centre); sun.position.copy(centre).addScaledVector(L, 150); sun.target.updateMatrixWorld();
  mixC(skyMat.uniforms.uTop.value, A.top, B.top, k); mixC(skyMat.uniforms.uHor.value, A.hor, B.hor, k);
  const day = lerp(A.day, B.day, k);
  skyMat.uniforms.uDir.value.copy(L); mixC(skyMat.uniforms.uCol.value, '#c8d6ff', '#ffe2b0', day);
  skyMat.uniforms.uAmt.value = 0.2 + 0.8 * day; skyMat.uniforms.uDisc.value = 0.4 + 5 * day;
  fill.intensity = lerp(A.fill, B.fill, k);
  const lampK = lerp(A.lamps, B.lamps, k);
  for (const p of SET.lamps) p.intensity = 30 * lampK;
  for (const m of SET.bulbs) m.emissiveIntensity = 0.3 + 4.7 * lampK;
  for (const m of SET.panesLit) m.emissiveIntensity = 0.85 * lampK + 0.02;
  SET.clockFace.emissiveIntensity = 0.6 * lampK + 0.05;
  for (const gl of GLOWS) gl.material.opacity = 0.6 * lampK;
  for (const b of SET.bags) b.visible = t < FIVE;                         // the new signs are unwrapped at 05:00
  SET.setClock(t >= CUT ? 14 * 60 + 25 - 240 : t < SW0 ? 50 + 8.9 * seg(t, 0, SW0) : t < FIVE ? 58.9 + 1.1 * seg(t, SW0, FIVE) : 60 + 20 * seg(t, FIVE, CUT));
  st.renderer.toneMappingExposure = lerp(A.exp, B.exp, k);
  // where the people stand this frame (set before they turn: a turn computed from last frame's place leaks state)
  const mole = CAST.mole; mole.m.visible = mole.blob.visible = t >= FIVE - 1.5 && t < CUT;      // he walks by at 05:00, once
  { const x = 18 - 1.1 * Math.max(0, t - FIVE + 1.5); mole.m.position.x = x; mole.blob.position.x = x; }
  const o = CAST.officer; o.m.position.set(t >= CUT ? 16.3 : 3.0, 0.15, t >= CUT ? -4.3 : 4.05); o.blob.position.set(o.m.position.x, 0.156, o.m.position.z);
  // people turn most of the way to the camera
  for (const { c, turn } of CARDS) { const p = c.m.position, dx = camera.position.x - p.x, dz = camera.position.z - p.z; c.m.rotation.y = turn * Math.atan2(dx, dz); }
  for (const w of CAST.watchers) w.m.visible = w.blob.visible = t < CUT;
  for (const b of CAST.busts) b.m.visible = t < CUT;
  // the look
  look.ao.radius = 0.65; look.ao.intensity = 1.1; look.ao.amount = 1;
  const sh = lerp(A.shafts, B.shafts, k);
  look.shafts.color.setRGB(1.0 * sh, 0.72 * sh, 0.42 * sh); look.shafts.sun.copy(L).multiplyScalar(700).add(camera.position); look.shafts.radius = 0.45;
  look.dof.focus = Math.max(0.5, cam.focus); look.dof.aperture = cam.focus > 0.2 ? cam.ap : 0; look.dof.max = 10;
  look.finish.uFrame.value = Math.round(t * 30); look.finish.uGrain.value = 0.025; look.finish.uVig.value = 0.3;
  st.render();
  capG.clearRect(0, 0, W, H); captions(capG, t);
}

C.scene({ name: 'street', from: 0, to: 'end', build(root, S) { S.el = root; }, run(t, b, S) { if (!st) build(S.el); frame(t); } });
UI.endcard();
C.start();
