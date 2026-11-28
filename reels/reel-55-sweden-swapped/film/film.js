// Reel 55, The Morning Sweden Swapped (Curiosity desk). Paper cut-out characters and cars in a lit 3D street, one travelling
// camera, one hard cut (on the twist, to November). The light turns from blue pre-dawn to sunrise on the switch at 05:00.
// Our own story and cast; from the references we take only the grammar (a strange first line, a travelling camera,
// light that turns with the story, one feeling per face per line, figures still once they land, one-word captions).
// The street at 04:50 holds only what the law let out that night (prop. 1966:133): taxis, a scheduled bus, a milk van
// and a newspaper van with permits, bicycles; private cars were banned from 01:00 to 06:00. Crowds came out to watch.
// Every frame is a pure function of t (seek(t)): no state carries from one frame to the next.
import { makeStage } from './stage55.js';
import { buildSet, ROAD, WALK } from './set.js';
import { ingrid, officer, driver, cyclist, carBody, wheel, watcher, windowBust, CAR } from './chars.js';

const { W, H } = window.C;
C.fonts = ['700 118px Fredoka'];
const DUR = C.bt('end');
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = (k) => k * k * (3 - 2 * k);
const lerp = (a, b, k) => a + (b - a) * k;

// ------------------------------------------------------------------ the narration's clock (EST until the voice is placed)
const VO = window.VO || [], WORDS = window.WORDS || [];
const EST = { n01: [0.12, 6.9], n02: [7.12, 12.3], n03: [12.75, 16.3], n04: [17.3, 24.0], n05: [28.4, 31.6], n06: [31.72, 37.3], n07: [37.85, 44.6], n08: [45.0, 49.4] };
const ln = (id) => VO.find((v) => v.id === id) || { t0: EST[id][0], t1: EST[id][1] };
const T0 = (id) => ln(id).t0, T1 = (id) => ln(id).t1;
const norm = (s) => s.toLowerCase().replace(/_/g, ' ').replace(/[^a-z0-9' ]/g, '');
const word = (id, w, frac, nth = 0) => { const xs = WORDS.filter((q) => q.p === id && norm(q.w) === w); const x = xs[nth]; return x ? x.t0 : T0(id) + (T1(id) - T0(id)) * frac; };

// story beats (seconds). The procedure (prop. 1966:133): stop on the left at 04:50, cross carefully to the right, stop
// again and wait; at 05:00, drive on the right. So the street crosses while n02 says "switch to driving on the right",
// and five o'clock is the moment they drive off.
const XA = word('n02', 'switch', 0.45) - 0.2;           // about 04:51: the officer waves the street across
const FIVE = T1('n04') + 1.5;                           // 05:00: the whistle; the street creeps across; the sun is up (n05 starts ~2.9 s later)
const SW0 = FIVE - 1.6;                                  // the last second on the stopwatch
const CUT = T0('n07') - 0.04;                           // the hard cut: November
const DAWN0 = FIVE - 0.4, DAWN1 = FIVE + 1.8;           // the sun comes up on the switch
const MORN1 = T1('n06');                                // full morning by the end of the fake relief
const RIDE67 = T0('n06') + 0.85;                        // the camera has caught up with Ingrid's taxi: riding beside her
const PARK = { ingrid: 2.6, bus: 22.5, news: 14.2, van: 6.6, taxi: -9.6 };  // where each stops on the right, waiting for five
// the crossing (fresh review, 28 Nov: the milk van and Ingrid swapped lanes toward each other at the same moment and passed
// through each other): the westbound go first, then the eastbound, each crossing in 2.2 s, parked so that no two overlap
// in the lane they move into
const LANE = 1.8;

// a vehicle's place at t from keys [[t, x, z], ...]: lane changes ease in and out, straight runs are linear
function keyAt(keys, t) {
  let i = 0; while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
  const [ta, xa, za] = keys[i], [tb, xb, zb] = keys[Math.min(i + 1, keys.length - 1)];
  const u = tb > ta ? clamp((t - ta) / (tb - ta)) : 1, k = ss(u), lane = Math.abs(zb - za) > 0.5;
  return { x: lane ? lerp(xa, xb, k) : lerp(xa, xb, u), z: lerp(za, zb, k), u, lane, s: Math.sign(zb - za) };
}
// 1967: stopped on the left; across to the right in turn at about 04:51; stopped again; at 05:00 off on the right, slowly
const XDUR = 2.2;
const across = (k, x0, z0, z1, d, delay, v, go = FIVE + 0.25 + delay * 0.4) => {
  const x1 = PARK[k];
  return [[0, x0, z0], [XA + delay, x0, z0], [XA + delay + XDUR, x1, z1], [go, x1, z1], [go + 1.6, x1 + d * v * 0.8, z1], [CUT, x1 + d * (v * 0.8 + v * (CUT - go - 1.6)), z1]];
};
const ING67 = across('ingrid', 0, -LANE, LANE, 1, 1.2, 1.25, FIVE + 1.7);   // at the whistle she sits frozen while the street drives off, then creeps
const fx67 = (t) => keyAt(ING67, t).x + 0.43;                                // her face, 1967
// November: she cruises in at ease, slows beside the bump and stops there (eased: no step in her speed)
const N1 = T0('n08') - 1.4, NSTOP = word('n08', 'crash', 0.95) + 0.3, NV = 5.0, NX = 18.6, BUMP = 20.2;
function ingX69(t) {
  const T = NSTOP - N1, x1 = NX - 0.5 * NV * T;
  if (t <= N1) return x1 - NV * (N1 - t);
  if (t >= NSTOP) return NX;
  const u = (t - N1) / T; return x1 + NV * T * (u - u * u * u + u * u * u * u / 2);
}
const fx69 = (t) => ingX69(t) + 0.43;
const MEET69 = 15.0, LEFT69 = 0.28, LEFT67 = 0.17, END69 = 0.5;                                         // where the camera waits for her, side-on at eye level; she's framed this far left
const tFace69 = (fx) => { let a = CUT, b = NSTOP; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (fx69(m) < fx) a = m; else b = m; } return (a + b) / 2; };

let st, THREE, SET, sun, hemi, fill, skyMat, capG, blobTex, glowTex;
const CARDS = [], CARS = [], GLOWS = [], CAST = {}, STEAM = [], LEAVES = [];

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

// a vehicle: its body card, its wheels, its driver (and passenger) inside, its lamps. dir 1 faces east, -1 west
function makeCar(kind, dir, who, o = {}) {
  const S = CAR[kind], g = new THREE.Group();
  const body = carBody(kind, dir, o), PXM = 240, hgt = body.height / PXM;
  const bc = card([body], hgt, { sink: 30 / PXM - 0.02 }); g.add(bc.m);
  const wc = wheel(S.wr), wheels = [];
  for (const u of S.wheels) {
    const w = card([wc], wc.height / PXM, { sink: wc.height / PXM / 2, shadow: false }); const x = (dir > 0 ? u - 0.5 : 0.5 - u) * S.len;
    w.m.position.set(x, S.wr, 0.03); g.add(w.m); wheels.push(w);
  }
  const seat = (c, x, y, z) => { c.mat.emissiveIntensity = 0.32; c.m.receiveShadow = false; c.m.position.set(x, y, z); g.add(c.m); };
  if (who) seat(who, dir * S.len * (kind === 'bus' ? 0.36 : 0.1), kind === 'bus' ? 1.25 : (kind === 'van' || kind === 'news' ? 0.62 : 0.4), -0.25);
  if (o.rider) seat(o.rider, dir * -0.52, 0.6, -0.36);                    // the back seat
  let inner = null;                                                        // the car's dark inside, behind the driver, cut to the windows
  if (body.interior && kind !== 'bus') {
    const it = new THREE.CanvasTexture(body.interior); it.colorSpace = THREE.SRGBColorSpace;
    inner = new THREE.Mesh(bc.m.geometry.clone(), new THREE.MeshBasicMaterial({ map: it, alphaTest: 0.5, fog: true }));
    inner.position.z = -INNER; g.add(inner);
  }
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffe6b8', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
  glow.position.set(dir * S.len * 0.5, S.h * (kind === 'bus' ? 0.25 : 0.4), 0.15); glow.scale.set(0.75, 0.75, 1); g.add(glow); GLOWS.push(glow);
  const sh = contact(S.len * 1.08, 2.2, 0.55); sh.position.y = 0.006; g.add(sh);
  st.scene.add(g);
  const car = { kind, dir, g, body: bc, wheels, drv: who, rider: o.rider, len: S.len, wr: S.wr, glow, inner };
  CARS.push(car); return car;
}
// each car's dark inside hangs INNER behind its body card. Seen from above or below, a card that far back would slide out
// past the windows (over the roof, or leaving a gap), so every frame it is scaled about the camera onto the windows' outline
const INNER = 0.3; let tmpL = null;
function alignInteriors(camera) {
  tmpL = tmpL || new THREE.Vector3();
  for (const car of CARS) {
    const n = car.inner; if (!n) continue;
    car.g.updateMatrixWorld(); tmpL.copy(camera.position); car.g.worldToLocal(tmpL);
    const D = tmpL.z; n.visible = D > 0.2; if (!n.visible) continue;
    const s = (D + INNER) / D; n.position.set(tmpL.x * (1 - s), tmpL.y * (1 - s), -INNER); n.scale.set(s, s, 1);
  }
}
// a vehicle's place at time t from keys [[t, x, z], ...]: lane changes ease in and out and turn the card a little toward
// the new lane (paper cars only turn a little); straight runs are linear
function drive(car, t, keys) {
  const q = keyAt(keys, t);
  put(car, q.x, q.z, q.lane ? Math.sin(Math.PI * q.u) * 0.28 * q.s * -car.dir : 0);
}
function put(car, x, z, rot = 0) {
  car.g.position.set(x, 0, z); car.g.rotation.y = rot;
  for (const w of car.wheels) w.m.rotation.z = -x / car.wr;
}
// a cyclist (a standing card) along the same keys
function ride(c, t, keys) {
  const q = keyAt(keys, t);
  c.m.position.set(q.x, 0, q.z); c.blob.position.set(q.x, 0.006, q.z);
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

  // Ingrid's taxi. Her faces: 0 scared, 1 terror (the peak, at 05:00), 2 focus, 3 relief, 4 easy (sunglasses, the bun: November),
  // and on the ride as the care wears off: 5 relief with one hand, 6 sunglasses with one hand
  const ing = card([ingrid('scared', 'grip'), ingrid('terror', 'grip'), ingrid('focus', 'grip'), ingrid('relief', 'grip'), ingrid('easy', 'easy'),
    ingrid('relief', 'one'), ingrid('easy', 'one')], 1.32);
  CAST.ingrid = makeCar('saloon', 1, ing, { sign: 'TAXI' }); CAST.ingrid.face = ing;
  // the rest of what was allowed out at 04:50
  CAST.bus = makeCar('bus', 1, card([driver('bus', 'tense', 1), driver('bus', 'careful', 1), driver('bus', 'easy', 1)], 0.9));
  CAST.news = makeCar('news', 1, card([driver('young', 'tense', 1), driver('young', 'careful', 1), driver('young', 'easy', 1)], 0.95));
  CAST.van = makeCar('van', -1, card([driver('milk', 'tense', -1), driver('milk', 'careful', -1), driver('milk', 'easy', -1)], 0.95));
  CAST.taxi = makeCar('taxi', -1, card([driver('taxi', 'tense', -1), driver('taxi', 'careful', -1), driver('taxi', 'easy', -1)], 0.95));
  // November only: private cars again
  CAST.estate = makeCar('estate', -1, card([driver('gran', 'easy', -1)], 0.95));
  CAST.young = makeCar('estate', -1, card([driver('young', 'easy', -1)], 0.95));
  CAST.cycA = stand(card([cyclist('a')], 1.75), -9, -3.0, 0, 0, [1.6, 0.5]);
  CAST.cycB = stand(card([cyclist('b')], 1.75), 13, 3.0, 0, 0, [1.6, 0.5]);
  CAST.cycB.m.scale.x = -1;                                                // facing west
  CAST.officer = stand(card([officer('watch'), officer('whistle'), officer('idle'), officer('notes')], 1.86), 6.4, 4.1, 0.15);
  CAST.watchers = [
    ['pyjamas', -3.4, -WALK + 1.0], ['coat', -2.5, -WALK + 1.4], ['hat', -1.4, -WALK + 1.2], ['girl', 6.2, -WALK + 1.3], ['gran', 7.1, -WALK + 1.0],
    ['boy', 11.8, -WALK + 1.5], ['hat', -6.2, WALK - 1.2], ['coat', 8.5, WALK - 1.1],
  ].map(([k, x, z], i) => Object.assign(stand(card([watcher(k)], k === 'boy' ? 1.3 : 1.72 + (i % 3) * 0.04), x, z, 0.15), { home: [x, z] }));
  CAST.mole = stand(card([watcher('mole')], 1.78), 17, -WALK + 1.1, 0.15);              // Season 1's thief, a passer-by at 05:00
  const busts = ['old', 'kid', 'lady', 'old', 'lady'];
  const slots = SET.windows.filter((w) => w.side < 0 && w.f <= 1 && w.x > -8 && w.x < 16).filter((_, i) => i % 3 === 1).slice(0, busts.length);
  CAST.busts = slots.map((w, i) => { const c = card([windowBust(busts[i])], 0.95, { shadow: false }); c.m.position.set(w.x, w.y - 0.55, -WALK + 0.04); sc.add(c.m); return c; });
  // the ride's last seconds: paper leaves coming down (the two months passing in one shot)
  const leafCols = ['#e08a2e', '#e9b53c', '#b5532a', '#d46d2b'];
  for (let i = 0; i < 9; i++) {
    const c = document.createElement('canvas'); c.width = c.height = 96; const q = c.getContext('2d');
    q.fillStyle = leafCols[i % 4]; q.beginPath(); q.moveTo(48, 6); q.quadraticCurveTo(92, 44, 48, 90); q.quadraticCurveTo(4, 44, 48, 6); q.fill();
    q.strokeStyle = 'rgba(90,40,10,0.55)'; q.lineWidth = 4; q.beginPath(); q.moveTo(48, 12); q.lineTo(48, 88); q.stroke();
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.32), new THREE.MeshStandardMaterial({ map: tx, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9, emissive: '#ffffff', emissiveMap: tx, emissiveIntensity: 0.2 }));
    sc.add(m); LEAVES.push(m);
  }
  // November's bump: steam from the estate's radiator, a hubcap and glass on the road
  const steamTex = radial('rgba(255,255,255,0.9)', 'rgba(255,255,255,0)');
  for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTex, color: '#f3efe6', transparent: true, depthWrite: false, opacity: 0 })); sc.add(s); STEAM.push(s); }
  const bits = new THREE.Group(); bits.position.set(BUMP, 0.012, -LANE + 0.9); sc.add(bits); CAST.bits = bits;
  const cap = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24), new THREE.MeshStandardMaterial({ color: '#c9ccd1', metalness: 0.6, roughness: 0.3 })); cap.rotation.x = -Math.PI / 2; cap.position.set(-1.3, 0.002, 0.5); bits.add(cap);
  for (let i = 0; i < 9; i++) {
    const s = new THREE.Mesh(new THREE.CircleGeometry(0.05 + (i % 3) * 0.025, 3), new THREE.MeshStandardMaterial({ color: '#dfeaf2', roughness: 0.15, metalness: 0.2 }));
    s.rotation.set(-Math.PI / 2, 0, i * 1.7); s.position.set(-0.6 + (i * 0.37) % 1.4, 0, (i * 0.53) % 0.9 - 0.3); bits.add(s);
  }
  capG = C.canvas(root);
}

// ------------------------------------------------------------------ where everything is, when
function placeCast(t) {
  const nov = t >= CUT, A = CAST;
  A.estate.g.visible = nov; A.young.g.visible = false; A.news.g.visible = !nov;
  A.cycA.m.visible = A.cycA.blob.visible = !nov;                     // November's near lane is too close to the camera for a bicycle
  A.taxi.drv.m.visible = !nov; A.estate.drv.m.visible = false;      // in November the bumped cars' drivers are out on the road
  A.bits.visible = nov;
  A.ingrid.face.m.position.y = nov ? 0.35 : 0.4;
  // her glow: the 1967 level, and in November's close shot a little less (its gold light is stronger); it rises only as the
  // camera pulls back to the pavement, where the window's shade would otherwise dim her (HQ, 28 Nov: 47-48 s blew out)
  A.ingrid.face.mat.emissiveIntensity = !nov ? lerp(0.32, 0.18, ss(seg(t, RIDE67 + 0.3, CUT))) : lerp(0.2, 0.3, ss(seg(t, word('n08', 'sure', 0.5) + 0.1, NSTOP)));
  if (!nov) {
    // 04:50: stopped on the left (eastbound in the far lane, westbound in the near one). At about 04:51 each creeps across
    // to the right in turn and stops again; at 05:00 they drive off on the right, slowly: everyone driving like a learner
    drive(A.ingrid, t, ING67);
    drive(A.bus, t, across('bus', 20, -LANE, LANE, 1, 1.5, 1.3));                                   // ahead of Ingrid: it drives off into the sunrise
    drive(A.news, t, across('news', 11.6, -LANE, LANE, 1, 1.2, 1.3));            // the bus's speed: it never closes on it
    drive(A.van, t, across('van', 9.2, LANE, -LANE, -1, -0.5, 1.6));
    drive(A.taxi, t, across('taxi', -7, LANE, -LANE, -1, -0.3, 1.6));
    ride(A.cycA, t, [[0, -9, -3.0], [XA + 0.4, -9, -3.0], [XA + 3.2, -7.2, 3.0], [FIVE + 0.4, -7.2, 3.0], [CUT, -7.2 + 0.9 * (CUT - FIVE - 0.4), 3.0]]);   // slow: it stays behind the shot that rides with Ingrid
    ride(A.cycB, t, [[0, 13, 3.0], [XA + 0.9, 13, 3.0], [XA + 3.6, 11.0, -3.0], [FIVE + 0.3, 11.0, -3.0], [CUT, 11.0 - 2.0 * (CUT - FIVE - 0.3), -3.0]]);
  } else {
    // November 1967: everyone at ease and quicker. In the far lane a car has run into the back of a taxi, the westbound
    // traffic queues behind it and the officer writes it up; Ingrid (eastbound, near lane) cruises in and slows beside it
    put(A.ingrid, ingX69(t), LANE);
    put(A.taxi, BUMP - 2.3, -LANE, 0.16);                                  // the taxi, shunted
    put(A.estate, BUMP + 2.3, -LANE + 0.35, -0.3);                         // the car that ran into its back
    put(A.van, BUMP + 7.6, -LANE);                                         // queuing behind the bump
    drive(A.bus, t, [[CUT, -60, LANE], [CUT + 30, -60 + 4.5 * 30, LANE]]);
    ride(A.cycB, t, [[CUT, 60, -3.0], [CUT + 30, 60, -3.0]]);                // parked out of shot (its head read as a second head by the officer)
  }
  // the people: the officer at the kerb (in November, in the road by the bump), the crowd (1967; two onlookers in
  // November), the mole guy (once, at 05:00)
  const o = A.officer; o.m.position.set(nov ? BUMP - 0.6 : 6.4, nov ? 0 : 0.15, nov ? -0.35 : 4.1); o.blob.position.set(o.m.position.x, o.m.position.y + 0.006, o.m.position.z);
  const mole = A.mole; mole.m.visible = mole.blob.visible = t >= FIVE - 1.5 && t < CUT;     // on the near pavement, watching them drive into the sun
  mole.m.position.set(15.5, 0.15, 4.4); mole.blob.position.set(15.5, 0.156, 4.4);
  A.watchers.forEach((w, i) => {
    const look = nov && i === 1; w.m.visible = w.blob.visible = !nov || look;          // one onlooker in November (a second sat on the officer's helmet)
    const [x, z] = !nov ? w.home : i === 1 ? [BUMP - 1.7, -WALK + 1.2] : [BUMP + 3.2, -WALK + 1.0];
    w.m.position.x = w.blob.position.x = x; w.m.position.z = w.blob.position.z = z;
  });
  for (const b of A.busts) b.m.visible = !nov;
  // the leaves: each falls for 3.2 s from its own moment, swaying and turning, placed where the ride's camera will be looking
  const L0 = word('n06', 'dagen h', 0.45);
  LEAVES.forEach((m, i) => {
    const t0 = L0 - 0.6 + i * 0.38, u = (t - t0) / 3.2;
    m.visible = !nov && u >= 0 && u <= 1; if (!m.visible) return;
    const behind = i % 2 === 0;                                            // some come down beyond her taxi, some between us and it
    const x = fx67(t0 + 1.6) + (behind ? -1.2 + ((i * 0.53) % 1) * 2.4 : (i % 2 ? -0.55 : 0.6));
    const z = behind ? -0.6 - ((i * 0.37) % 1) * 2.6 : 2.9 + ((i * 0.29) % 1) * 0.4;
    m.position.set(x + 0.35 * Math.sin(u * 7 + i), 3.9 - 3.6 * u, z);
    m.rotation.set(0.6 * Math.sin(u * 9 + i), 1.2 * Math.sin(u * 5 + i * 2), i + u * 6);
  });
  // the bump's steam: puffs rising and spreading from the estate's radiator (a pure function of t)
  STEAM.forEach((s, i) => {
    s.visible = nov; if (!nov) return;
    const p = ((t - CUT) * 0.42 + i / STEAM.length) % 1;
    s.position.set(BUMP + 0.3 + 0.14 * Math.sin(i * 2.3 + p * 2.5), 1.0 + p * 1.5, -LANE + 0.25 + 0.1 * Math.cos(i * 1.7));
    const k = 0.3 + p * 1.0; s.scale.set(k, k, 1); s.material.opacity = 0.5 * Math.sin(Math.PI * p);
  });
}

// ------------------------------------------------------------------ the light
const LOOK = {
  night: { top: '#08143a', hor: '#2c4c8c', fog: '#1a2f63', dens: 0.012, hs: '#3d6cc8', hg: '#0d1530', hi: 1.5, sc: '#8fb0ff', si: 0.55, dir: [-0.35, 0.75, 0.55], exp: 1.35, fill: 0, lamps: 1, shafts: 0, day: 0 },
  // the dawn light comes in a little from the south so the facades catch it; the disc you see (vis) sits at the end of the street
  dawn: { top: '#4f7fca', hor: '#ffbe80', fog: '#e2b996', dens: 0.011, hs: '#9fbbe6', hg: '#9a7258', hi: 1.2, sc: '#ffc27e', si: 3.8, dir: [1, 0.07, 0.34], vis: [1, 0.05, 0.012], exp: 1.2, fill: 0.6, lamps: 0, shafts: 1, day: 1 },
  morning: { top: '#5f97e0', hor: '#ffd7a6', fog: '#efd3b0', dens: 0.009, hs: '#b4d0f2', hg: '#b08c6c', hi: 1.35, sc: '#ffd6a0', si: 3.9, dir: [1, 0.15, 0.36], vis: [1, 0.11, 0.03], exp: 1.15, fill: 0.7, lamps: 0, shafts: 0.7, day: 1 },
  // the ride slides from September towards autumn: the sun lower, warmer, from further round (HQ's note, 28 Nov)
  autumn: { top: '#5a8fd8', hor: '#ffc98a', fog: '#f0c99a', dens: 0.010, hs: '#b6cbe8', hg: '#c08e60', hi: 1.3, sc: '#ffb86a', si: 4.2, dir: [-0.2, 0.12, 0.9], vis: [-0.2, 0.12, 0.9], exp: 1.22, fill: 0.7, lamps: 0, shafts: 0.4, day: 1 },
  // November: warm gold, bright (the bookend to frame 0's cold blue)
  november: { top: '#5f97e6', hor: '#ffd08e', fog: '#f2d2a4', dens: 0.009, hs: '#c3d6f0', hg: '#c99a68', hi: 1.45, sc: '#ffbe70', si: 4.6, dir: [-0.45, 0.14, 0.88], exp: 1.3, fill: 0.75, lamps: 0, shafts: 0.4, day: 1 },
};
function lightAt(t) {
  if (t >= CUT) return [LOOK.november, LOOK.november, 0];
  if (t < DAWN1) return [LOOK.night, LOOK.dawn, ss(seg(t, DAWN0, DAWN1))];
  if (t < RIDE67) return [LOOK.dawn, LOOK.morning, ss(seg(t, DAWN1 + 1, RIDE67))];
  return [LOOK.morning, LOOK.autumn, 0.75 * ss(seg(t, RIDE67 + 0.3, CUT))];
}

// ------------------------------------------------------------------ the camera: one travelling shot, one cut
// keys: [t, position, target, fov, focus distance (m; 0 = no depth of field), aperture, stop]; in the shots that ride with
// Ingrid's taxi the keys sit where she will be, and camAt locks x to her car
const P = (x, y, z) => [x, y, z];
function keys67() {
  const xi = PARK.ingrid + 0.45, ride = RIDE67;                                                    // her face, once she's waiting on the right
  return [
    [0, P(0.42, 1.14, 0.3), P(0.42, 1.25, -2.0), 44, 2.3, 7],                                       // frame 0: Ingrid, frozen at the wheel
    [word('n01', 'every', 0.25), P(0.1, 1.3, 1.3), P(0.6, 1.62, -2.0), 46, 3.3, 5],                  // easing back...
    [word('n01', 'dead', 0.4) + 0.25, P(-3.2, 3.2, 4.5), P(3.0, 1.5, -2.0), 48, 0, 0],              // ... to the frozen street by "stop dead"
    [T0('n02'), P(-5.4, 5.0, 4.5), P(5.5, 1.3, -1.0), 50, 0, 0],                                    // the whole street, the crowds, the clock (still rising)
    [XA + 2.0, P(-6.2, 6.0, 4.4), P(6.5, 1.2, 0.0), 50, 0, 0],                                      // it creeps across to the right, and stops again
    [T0('n03') + 0.4, P(-5.8, 6.4, 4.4), P(10.5, 1.3, -0.5), 50, 0, 0],                             // the pick: over the waiting street...
    [T1('n03') + 0.6, P(-3.9, 5.7, 4.3), P(11.0, 1.3, -0.4), 48, 0, 0],                             // ... pushing in slowly while you choose
    [T0('n04') + 0.6, P(xi + 0.05, 1.15, 4.1), P(xi, 1.25, 1.55), 44, 2.55, 7],                    // Ingrid, waiting on the right side...
    [word('n04', 'habit', 0.6), P(xi + 0.14, 1.12, 3.45), P(xi, 1.25, 1.55), 40, 1.9, 8],          // ... pushing in as the danger is spelled out
    [word('n04', 'someone', 0.5), P(7.0, 1.76, 5.6), P(6.5, 1.58, 4.07), 40, 1.62, 9],             // the last seconds: his eyes on the stopwatch
    [FIVE - 1.0, P(6.96, 1.76, 5.55), P(6.5, 1.58, 4.07), 40, 1.58, 9],
    [FIVE - 0.2, P(xi + 0.1, 1.15, 3.95), P(xi, 1.25, 1.55), 42, 2.4, 8],                          // 05:00: her face, the peak; the whistle
    [FIVE + 0.7, P(xi + 0.15, 1.17, 3.8), P(xi + 0.05, 1.25, 1.55), 42, 2.25, 8],                  // ... frozen, while the street drives off
    [FIVE + 1.4, P(2.3, 2.9, 4.4), P(7.5, 1.0, 1.0), 46, 0, 0],                                   // the camera rises over her taxi...
    [FIVE + 1.95, P(0.7, 4.2, 4.5), P(8.09, 2.98, 3.6), 50, 0, 0],                                 // (aim points kept near: a far one makes the next tilt overshoot)                                    // ... to the sun coming up at the end of the street
    [word('n05', 'went', 0.1), P(0.9, 4.3, 4.5), P(8.27, 3.04, 3.52), 50, 0, 0],                       // "Deaths went down"
    [word('n05', 'went', 0.1) + 0.45, P(2.2, 3.7, 4.7), P(6.6, 1.45, 4.0), 46, 0, 0],             // tilting down onto him, then in
    [word('n05', 'half', 0.45) + 0.2, P(5.2, 1.55, 5.2), P(6.42, 1.3, 4.1), 44, 1.64, 7, 1],      // down to his notebook: a blank page
    [word('n05', 'cut', 0.95) + 0.2, P(5.26, 1.54, 5.18), P(6.5, 1.3, 4.1), 44, 1.64, 7, 1],
    [ride, P(fx67(ride) + LEFT67, 1.3, 4.4), P(fx67(ride) + LEFT67, 1.2, 1.6), 44, 2.8, 6],        // riding beside Ingrid as she crawls
    [CUT - 0.01, P(fx67(CUT) + LEFT67, 1.15, 3.85), P(fx67(CUT) + LEFT67, 1.22, 1.55), 42, 2.3, 8], // ... and the care wears off
  ];
}
function keys69() {
  const meet = tFace69(MEET69 - LEFT69), up0 = word('n08', 'was', 0.5), up1 = NSTOP, o = END69;
  return [
    [CUT, P(19.9, 1.7, 4.4), P(19.85, 1.2, -1.0), 44, 4.75, 3],                                    // November: the bump, the officer writing it up
    [word('n07', 'down', 0.4) + 0.1, P(19.8, 1.62, 4.2), P(19.8, 1.2, -1.0), 42, 4.55, 3],
    [word('n07', 'once', 0.6), P(18.3, 2.5, 4.45), P(20.4, 1.0, -1.2), 48, 0, 0],                  // the street, at ease again
    [T0('n08') - 0.5, P(MEET69, 1.18, 3.9), P(MEET69 + 1.4, 1.22, 1.55), 44, 2.6, 5, 1],          // eye level, the bumped taxi behind...
    [meet, P(MEET69, 1.16, 3.88), P(MEET69, 1.24, 1.55), 44, 2.33, 7, 1],                          // ... Ingrid drives in: frame 0 again
    [up0, P(fx69(up0) + LEFT69, 1.16, 3.86), P(fx69(up0) + LEFT69, 1.24, 1.55), 44, 2.31, 7],
    [up1, P(fx69(up1) + o, 2.05, 6.0), P(fx69(up1) + o, 1.2, 0.5), 38, 4.6, 1.6],                  // pulling back and up: the bump right behind her
    [DUR, P(fx69(DUR) + o, 2.07, 6.02), P(fx69(DUR) + o, 1.2, 0.5), 38, 4.6, 1.6, 1],
  ];
}
// the time map: monotone (Fritsch-Carlson), so the camera never runs back; a key marked 1 at index 6 is a stop, where
// the camera eases to rest (a hold between two stops is still)
function monotone(xs, ys, stops = []) {
  const n = xs.length, d = [], m = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / Math.max(1e-6, xs[i + 1] - xs[i]));
  m.push(d[0]); for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2); m.push(0);
  for (const i of stops) m[i] = 0;
  for (let i = 0; i < n - 1; i++) { if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; } const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b; if (s > 9) { const k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; } }
  return (x) => { let i = 0; while (i < n - 2 && x > xs[i + 1]) i++; const h = Math.max(1e-6, xs[i + 1] - xs[i]), u = clamp((x - xs[i]) / h), u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * h * m[i + 1]; };
}
let PATHS = null;
function camAt(t) {
  if (!PATHS) {
    const mk = (K) => {
      const ts = K.map((k) => k[0]), us = K.map((_, i) => i / (K.length - 1)), stops = K.map((k, i) => (k[6] ? i : -1)).filter((i) => i >= 0);
      const V = (i) => new THREE.CatmullRomCurve3(K.map((k) => new THREE.Vector3(k[i][0], k[i][1], k[i][2])), false, 'centripetal');
      return { u: monotone(ts, us, stops), pos: V(1), tgt: V(2), fov: monotone(ts, K.map((k) => k[3]), stops), foc: monotone(ts, K.map((k) => k[4]), stops), ap: monotone(ts, K.map((k) => k[5]), stops) };
    };
    PATHS = { a: mk(keys67()), b: mk(keys69()) };
  }
  const Pth = t < CUT ? PATHS.a : PATHS.b, u = Pth.u(t);
  const pos = Pth.pos.getPoint(u), tgt = Pth.tgt.getPoint(u);
  // the shots that ride beside Ingrid's taxi (the crawl after the switch; November's last shot): x locks to her car. The
  // keys already put the camera where she'll be, so this only takes up what the curve between keys leaves over
  const span = t < CUT ? [word('n05', 'cut', 0.95) + 0.2, RIDE67] : [tFace69(MEET69 - LEFT69), tFace69(MEET69 - LEFT69) + 0.45];
  if (t >= span[0]) {
    const off = t < CUT ? LEFT67 : LEFT69 + (END69 - LEFT69) * ss(seg(t, word('n08', 'was', 0.5), NSTOP));     // framed left of centre: her nose and the bun point right
    const x = CAST.ingrid.g.position.x + 0.42 + off, k = ss(seg(t, span[0], span[1]));
    pos.x = lerp(pos.x, x, k); tgt.x = lerp(tgt.x, x, k);
  }
  return { pos, tgt, fov: Pth.fov(t), focus: Pth.foc(t), ap: Pth.ap(t) };
}

// ------------------------------------------------------------------ faces (one feeling per face per line)
function faces(t) {
  let f = 0;
  if (t >= CUT) f = 4;                                                   // November: at ease
  else if (t >= word('n06', "sweden's", 0.65)) f = 4;                     // ... the bun: the care has worn off before November names it
  else if (t >= word('n06', 'dagen h', 0.45)) f = 6;                       // ... sunglasses on
  else if (t >= word('n06', 'as', 0.25)) f = 5;                            // ... one hand off the wheel
  else if (t >= T0('n06')) f = 3;                                        // it looked safe: relief, both hands
  else if (t >= T0('n05')) f = 2;                                        // crawling like a learner
  else if (t >= FIVE - 0.6) f = 1;                                       // the peak: 05:00, driving off on the right for the first time
  CAST.ingrid.face.show(f);
  const mood = t >= CUT ? 2 : t >= FIVE + 1.0 ? 1 : 0;
  for (const k of ['bus', 'news', 'van', 'taxi']) CAST[k].drv.show(mood);
  const notebook = word('n05', 'down', 0.15) + 0.15;                     // the blank page comes out while the camera drops to him
  CAST.officer.show(t >= CUT ? 3 : t >= notebook ? 2 : t >= FIVE - 0.1 ? 1 : t >= XA - 0.3 && t < XA + 3.2 ? 1 : 0);   // waves them across; the stopwatch; the whistle; a blank page
}

// ------------------------------------------------------------------ one-word captions: bold, white, outlined, in the safe zone
function captions(g, t) {
  t = Math.round(t * 30) / 30;
  let cur = null;
  for (let i = 0; i < WORDS.length; i++) { const w = WORDS[i], nx = WORDS[i + 1], end = nx ? Math.min(nx.t0, w.t1 + 0.35) : w.t1 + 0.6; if ((i === 0 || t >= w.t0 - 0.02) && t < end) cur = w; }   // the first word is up on frame 0
  if (!cur || t >= DUR) return;
  const k = cur === WORDS[0] ? 1 : 1 + 0.1 * (1 - ss(seg(t, cur.t0 - 0.02, cur.t0 + 0.08)));
  const txt = cur.w.replace(/[,.?!;:]+$/, '').replace(/_/g, ' ');
  const capY = t >= word('n02', 'neighbours', 0.95) - 0.05 && t < T0('n04') - 0.05 ? 1180 : 1405;   // during the pick her taxi sits in the usual band
  g.save(); g.translate(530, capY); g.scale(k, k);
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
  placeCast(t); faces(t);
  const cam = camAt(t);
  camera.fov = cam.fov; camera.position.copy(cam.pos); camera.lookAt(cam.tgt); camera.updateProjectionMatrix();
  st.sky.position.copy(camera.position);
  alignInteriors(camera);
  // the light
  const [A, B, k] = lightAt(t);
  mixC(sc.fog.color, A.fog, B.fog, k); sc.fog.density = lerp(A.dens, B.dens, k); sc.background.copy(sc.fog.color);
  mixC(hemi.color, A.hs, B.hs, k); mixC(hemi.groundColor, A.hg, B.hg, k); hemi.intensity = lerp(A.hi, B.hi, k);
  mixC(sun.color, A.sc, B.sc, k); sun.intensity = lerp(A.si, B.si, k);
  const L = new THREE.Vector3(...A.dir).normalize().lerp(new THREE.Vector3(...B.dir).normalize(), k).normalize();
  const Lv = new THREE.Vector3(...(A.vis || A.dir)).normalize().lerp(new THREE.Vector3(...(B.vis || B.dir)).normalize(), k).normalize();
  const centre = new THREE.Vector3().copy(cam.tgt).setY(0);
  sun.target.position.copy(centre); sun.position.copy(centre).addScaledVector(L, 150); sun.target.updateMatrixWorld();
  mixC(skyMat.uniforms.uTop.value, A.top, B.top, k); mixC(skyMat.uniforms.uHor.value, A.hor, B.hor, k);
  const day = lerp(A.day, B.day, k);
  skyMat.uniforms.uDir.value.copy(Lv); mixC(skyMat.uniforms.uCol.value, '#c8d6ff', '#ffe2b0', day);
  skyMat.uniforms.uAmt.value = 0.2 + 0.8 * day; skyMat.uniforms.uDisc.value = 0.4 + 5 * day;
  fill.intensity = lerp(A.fill, B.fill, k);
  const lampK = lerp(A.lamps, B.lamps, k);
  for (const p of SET.lamps) p.intensity = 30 * lampK;
  for (const m of SET.bulbs) m.emissiveIntensity = 0.3 + 4.7 * lampK;
  for (const m of SET.panesLit) m.emissiveIntensity = 0.85 * lampK + 0.02;
  SET.clockFace.emissiveIntensity = 0.6 * lampK + 0.05;
  for (const gl of GLOWS) gl.material.opacity = 0.6 * lampK;
  for (const b of SET.bags) b.visible = t < FIVE;                         // the new signs are unwrapped at 05:00
  // the clock: 04:50 on frame 0, five o'clock on the whistle (the last minute runs with the stopwatch); 3:20 pm in November
  SET.setClock(t >= CUT ? 11 * 60 + 20 : t < SW0 ? 50 + 9 * seg(t, 0, SW0) : t < FIVE ? 59 + seg(t, SW0, FIVE) : 60 + 25 * seg(t, FIVE, CUT));
  st.renderer.toneMappingExposure = lerp(A.exp, B.exp, k);
  // people turn most of the way to the camera (after everyone has been placed for this frame)
  for (const { c, turn } of CARDS) { if (!turn) continue; const p = c.m.position, dx = camera.position.x - p.x, dz = camera.position.z - p.z; c.m.rotation.y = turn * Math.atan2(dx, dz); }
  // the look
  look.ao.radius = 0.65; look.ao.intensity = 1.1; look.ao.amount = 1;
  const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd);
  const sh = lerp(A.shafts, B.shafts, k) * ss(seg(fwd.dot(Lv), 0.05, 0.35));      // no shafts from a sun behind the camera
  look.shafts.color.setRGB(1.0 * sh, 0.72 * sh, 0.42 * sh); look.shafts.sun.copy(Lv).multiplyScalar(700).add(camera.position); look.shafts.radius = 0.45;
  look.dof.focus = Math.max(0.5, cam.focus); look.dof.aperture = cam.focus > 0.2 ? cam.ap : 0; look.dof.max = 10;
  look.finish.uFrame.value = Math.round(t * 30); look.finish.uGrain.value = 0.025; look.finish.uVig.value = 0.3;
  st.render();
  capG.clearRect(0, 0, W, H); captions(capG, t);
}

C.scene({ name: 'street', from: 0, to: 'end', build(root, S) { S.el = root; }, run(t, b, S) { if (!st) build(S.el); frame(t); } });
UI.endcard();
C.start();
window.CUTS = [...(window.CUTS || []), CUT, word('n06', 'as', 0.25), word('n06', 'dagen h', 0.45), word('n06', "sweden's", 0.65), word('n05', 'down', 0.15) + 0.15].sort((a, b) => a - b);
