// Reel 55's set: one Swedish city street in 1967, built in three.js. Our own design, with no real place, shop or brand.
// Axes (metres): x runs along the street (east is +x, where the sun comes up over the water at the street's end);
// z runs across it (north is -z, the far side from the camera's usual place); y is up.
// The road is |z| < 3.6 (two lanes: the far lane z < 0, the near lane z > 0); pavements to |z| = 6.6, facades beyond.
// Before the switch (left-hand traffic), eastbound cars use the far lane and westbound the near lane; after it, the reverse.
import { canvasTex, seeded, envGradient } from 'stage3d';

export const ROAD = 3.6, WALK = 6.6;

export function buildSet(st, THREE) {
  const { scene, renderer } = st;
  const S = { lamps: [], bulbs: [], panesLit: [], glows: [], signs: [], windows: [] };
  const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0, ...o });
  const add = (m, cast = true, recv = true) => { m.castShadow = cast; m.receiveShadow = recv; scene.add(m); return m; };
  const box = (w, h, d, m, x, y, z, cast = true) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); return add(o, cast); };
  const R = seeded(55);
  S.env = envGradient(renderer, '#9cc3f2', '#f2c79a', [[0.5, 0.5, 0.08, '#fff3d6']]);

  // ------------------------------------------------------------------ ground
  const tar = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#5d6068'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 9000; k++) { const v = R() < 0.5 ? 255 : 0; g.fillStyle = `rgba(${v},${v},${v},${0.025 + 0.035 * R()})`; g.fillRect(R() * w, R() * h, 1 + R() * 2.5, 1 + R() * 2.5); }
    g.fillStyle = 'rgba(0,0,0,0.07)'; for (let k = 0; k < 14; k++) { g.beginPath(); g.ellipse(R() * w, R() * h, 20 + R() * 60, 8 + R() * 20, R() * 3, 0, Math.PI * 2); g.fill(); }   // patches
  }, { repeat: true }); tar.repeat.set(40, 2.4);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(240, ROAD * 2), std('#ffffff', { map: tar, roughness: 0.9 })); road.rotation.x = -Math.PI / 2; road.position.x = 20; add(road, false);
  // the centre line: white dashes
  const dash = std('#efece4', { roughness: 0.7 });
  for (let x = -100; x < 140; x += 6) { const d = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.14), dash); d.rotation.x = -Math.PI / 2; d.position.set(x, 0.004, 0); add(d, false); }
  const slab = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#dcd6cb'; g.fillRect(0, 0, w, h); g.fillStyle = '#b9b2a6'; g.fillRect(0, 0, w, 3); g.fillRect(0, 0, 3, h); g.fillRect(0, 128, w, 2); g.fillRect(128, 0, 2, h); for (let k = 0; k < 600; k++) { g.fillStyle = `rgba(0,0,0,${0.02 + 0.03 * R()})`; g.fillRect(R() * w, R() * h, 2, 2); } }, { repeat: true });
  slab.repeat.set(120, 1.5);
  for (const s of [-1, 1]) {
    box(240, 0.15, WALK - ROAD, std('#ffffff', { map: slab }), 20, 0.075, s * (ROAD + WALK) / 2, false);
    box(240, 0.16, 0.22, std('#c9c3b7'), 20, 0.08, s * (ROAD + 0.11), false);                       // kerbs
  }

  // ------------------------------------------------------------------ the facades: 5-storey blocks, each its own colour
  const PAL = ['#ecd29a', '#e0a07a', '#f1e2c2', '#c3cfae', '#e8b48c', '#d9cfc0', '#f3e8d2', '#b7cad3', '#e2bd86', '#d9ab92'];
  const SHOPS = ['BAGERI', 'KAFÉ', 'URMAKARE', 'TOBAK', 'BLOMMOR', 'SKOR', 'BOKHANDEL', 'FÄRG', 'KONDITORI', 'CYKLAR'];
  const AWN = ['#c0392b', '#2f6b8a', '#3f7f4f', '#b5822a', '#7a3f6d'];
  const facade = (col, seed, w, hgt, lit, slots) => {
    const r = seeded(seed), PX = 48, W2 = Math.round(w * PX), H2 = Math.round(hgt * PX);
    const pane = (g, x, y, ww, hh, on) => { g.fillStyle = on ? '#ffd39a' : '#1d2433'; g.fillRect(x, y, ww, hh); };
    const paint = (g, emis) => {
      g.fillStyle = emis ? '#000' : col; g.fillRect(0, 0, W2, H2);
      if (!emis) { for (let k = 0; k < 700; k++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '60,40,20'},${0.03 + 0.03 * r()})`; g.fillRect(r() * W2, r() * H2, 3, 2); }
        g.fillStyle = 'rgba(0,0,0,0.10)'; for (let y = 4.2 * PX; y < H2; y += 3.1 * PX) g.fillRect(0, H2 - y - 6, W2, 6);        // string courses
        g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, H2 - 4.0 * PX, W2, 8); }
      const cols = Math.max(2, Math.round(w / 2.6)), gap = W2 / cols;
      for (let f = 0; f < 4; f++) for (let c = 0; c < cols; c++) {
        if (!emis && slots) slots.push({ x: (c * gap + gap * 0.5) / PX, y: 4.6 + f * 3.1 + 0.8, f, c });
        const x = c * gap + gap * 0.28, y = H2 - (4.6 + f * 3.1) * PX - 1.6 * PX, ww = gap * 0.44, hh = 1.6 * PX;
        const on = lit && r() < 0.45;
        if (!emis) { g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(x - 5, y - 5, ww + 10, hh + 10); }
        if (emis) { if (on) pane(g, x, y, ww, hh, true); else { g.fillStyle = '#000'; g.fillRect(x, y, ww, hh); } }
        else { pane(g, x, y, ww, hh, false); g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(x + ww / 2 - 2, y, 4, hh); g.fillRect(x, y + hh * 0.38, ww, 4); }
      }
      // the shopfront: a wide window and a door at street level
      if (!emis) { g.fillStyle = '#2a2420'; g.fillRect(gap * 0.2, H2 - 3.2 * PX, W2 - gap * 0.9, 2.6 * PX); g.fillStyle = '#3a3f4a'; g.fillRect(gap * 0.26, H2 - 3.1 * PX, W2 - gap * 1.02, 2.4 * PX);
        g.fillStyle = '#5a3a2a'; g.fillRect(W2 - gap * 0.55, H2 - 2.9 * PX, gap * 0.4, 2.9 * PX); }
      else { g.fillStyle = lit ? '#f6c27e' : '#000'; g.fillRect(gap * 0.26, H2 - 3.1 * PX, W2 - gap * 1.02, 2.4 * PX); }
    };
    const map = canvasTex(W2, H2, (g) => paint(g, false)), emi = canvasTex(W2, H2, (g) => paint(g, true));
    return { map, emi };
  };
  const block = (x0, w, side, i) => {
    const hgt = 16.5 + (i % 3) * 1.2, col = PAL[(i * 7 + (side > 0 ? 3 : 0)) % PAL.length], lit = true;
    const slots = [];
    const { map, emi } = facade(col, 100 + i * 13 + (side > 0 ? 50 : 0), w, hgt, lit, slots);
    for (const q of slots) S.windows.push({ x: side < 0 ? x0 + q.x : x0 + w - q.x, y: q.y, side, f: q.f });
    const front = std('#ffffff', { map, emissive: '#ffffff', emissiveMap: emi, emissiveIntensity: 0.9 });
    const plain = std(col);
    const mats = side < 0 ? [plain, plain, plain, plain, front, plain] : [plain, plain, plain, plain, plain, front];   // +z face (north row) / -z face (south row)
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, hgt, 12), mats); m.position.set(x0 + w / 2, hgt / 2, side * (WALK + 6)); add(m);
    S.panesLit.push(front);
    const zf = side * WALK;                                                                          // the facade's face
    box(w + 0.3, 0.45, 0.5, std('#f3ede2'), x0 + w / 2, hgt - 0.3, zf - side * 0.18);             // cornice
    box(w, 0.25, 0.35, std('#f3ede2'), x0 + w / 2, 4.0, zf - side * 0.12);                          // the shop's lintel
    // the awning and the sign over the shop
    const name = SHOPS[(i * 3 + (side > 0 ? 5 : 0)) % SHOPS.length];
    const signTex = canvasTex(512, 96, (g, sw, sh) => { g.fillStyle = '#f6efe0'; g.fillRect(0, 0, sw, sh); g.fillStyle = '#23211f'; g.font = '700 64px Fredoka, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(name, sw / 2, sh / 2 + 4); });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w * 0.6, 4.2), 0.72), std('#ffffff', { map: signTex, roughness: 0.6 }));
    sign.position.set(x0 + w * 0.42, 3.55, zf - side * 0.31); sign.rotation.y = side < 0 ? 0 : Math.PI; add(sign, false);
    S.signs.push({ name, mesh: sign, x: x0 + w * 0.42, side });
    const stripes = canvasTex(64, 64, (g, sw, sh) => { const a = AWN[i % AWN.length]; for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? '#f4efe4' : a; g.fillRect(k * 8, 0, 8, sh); } }, { repeat: true }); stripes.repeat.set(w * 0.9, 1);
    const awn = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.78, 1.5), std('#ffffff', { map: stripes, side: THREE.DoubleSide, roughness: 0.8 }));
    awn.position.set(x0 + w * 0.42, 2.9, zf - side * 0.72); awn.rotation.x = side < 0 ? -1.05 : 1.05; if (side > 0) awn.rotation.y = Math.PI; add(awn);
    return { x0, w, hgt, zf, name };
  };
  S.blocks = [];
  for (const side of [-1, 1]) { let x = -70, i = side > 0 ? 3 : 0; while (x < 78) { const w = 11 + ((i * 5) % 4) * 1.5; S.blocks.push({ side, ...block(x, w, side, i) }); x += w; i++; } }

  // ------------------------------------------------------------------ the end of the street: a quay and the water, where the sun comes up
  box(2, 1.0, 2 * WALK + 30, std('#bdb6aa'), 79, 0.5, 0);
  for (let z = -WALK; z <= WALK; z += 1.6) box(0.12, 1.1, 0.12, std('#2a2e33'), 78.4, 1.55, z);
  box(0.08, 0.08, 2 * WALK, std('#2a2e33'), 78.4, 2.05, 0);
  S.water = new THREE.Mesh(new THREE.PlaneGeometry(600, 400), new THREE.MeshStandardMaterial({ color: '#33465e', roughness: 0.12, metalness: 0.4, envMap: S.env, envMapIntensity: 1.0 }));
  S.water.rotation.x = -Math.PI / 2; S.water.position.set(380, -0.6, 0); scene.add(S.water);
  // far shore: low hills and a church spire, cut from paper, silhouetted against the sunrise
  const shore = canvasTex(1024, 256, (g, w, h) => { g.fillStyle = '#41506b'; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 16) g.lineTo(x, h - 70 - 40 * Math.sin(x / w * 7) - 20 * Math.sin(x / w * 23)); g.lineTo(w, h); g.fill(); g.fillRect(610, h - 190, 22, 120); g.beginPath(); g.moveTo(604, h - 190); g.lineTo(621, h - 250); g.lineTo(638, h - 190); g.fill(); });
  S.shore = new THREE.Mesh(new THREE.PlaneGeometry(520, 130), new THREE.MeshBasicMaterial({ map: shore, transparent: true, fog: false, color: '#ffffff' }));
  S.shore.position.set(470, 20, 30); S.shore.rotation.y = -Math.PI / 2; scene.add(S.shore);

  // ------------------------------------------------------------------ lamps hung on wires across the street
  const wireM = std('#1f2226', { roughness: 0.6 });
  for (const x of [-30, -12, 6, 24, 42, 60]) {
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 2 * WALK, 6), wireM); wire.rotation.x = Math.PI / 2; wire.position.set(x, 8.6, 0); add(wire, false);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.34, 18, 1, true), std('#2b3a33', { side: THREE.DoubleSide })); shade.position.set(x, 8.25, 0); add(shade);
    const bm = new THREE.MeshStandardMaterial({ color: '#fff1d6', emissive: '#ffc982', emissiveIntensity: 5 }); S.bulbs.push(bm);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), bm); bulb.position.set(x, 8.1, 0); add(bulb, false, false);
    const pl = new THREE.PointLight('#ffb870', 0, 0, 2); pl.position.set(x, 7.9, 0); scene.add(pl); S.lamps.push(pl);
  }

  // ------------------------------------------------------------------ the street clock, on a bracket over the watchmaker's
  S.clockAt = new THREE.Vector3(2.5, 3.45, -WALK + 1.25);              // low enough to sit below Instagram's header in the shots that show it
  {
    const face = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#f7f3e8'; g.beginPath(); g.arc(128, 128, 124, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#1b1b1b'; for (let k = 0; k < 60; k++) { const a = k / 60 * Math.PI * 2, r0 = k % 5 ? 108 : 96; g.save(); g.translate(128 + Math.sin(a) * 110, 128 - Math.cos(a) * 110); g.rotate(a); g.fillRect(-(k % 5 ? 1.5 : 4), -(k % 5 ? 5 : 11), k % 5 ? 3 : 8, k % 5 ? 10 : 22); g.restore(); }
    });
    const g = new THREE.Group(); g.position.copy(S.clockAt);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.2, 32), std('#2b2f35', { roughness: 0.5, metalness: 0.3 })); body.rotation.x = Math.PI / 2; body.castShadow = true; g.add(body);
    const fm = new THREE.MeshStandardMaterial({ map: face, roughness: 0.5, emissive: '#ffffff', emissiveMap: face, emissiveIntensity: 0.6 }); S.clockFace = fm;
    for (const s of [1, -1]) { const f = new THREE.Mesh(new THREE.CircleGeometry(0.56, 32), fm); f.position.z = s * 0.105; if (s < 0) f.rotation.y = Math.PI; g.add(f); }
    const hand = (len, wdt, col) => { const h = new THREE.Group(); const m = new THREE.Mesh(new THREE.BoxGeometry(wdt, len, 0.02), std(col)); m.position.y = len / 2 - 0.05; h.add(m); return h; };
    S.hands = [];
    for (const s of [1, -1]) { const hh = hand(0.32, 0.06, '#1b1b1b'), mh = hand(0.48, 0.035, '#1b1b1b'); hh.position.z = mh.position.z = s * 0.12; g.add(hh); g.add(mh); S.hands.push({ s, hh, mh }); }
    box(0.08, 0.08, 1.3, std('#2b2f35'), S.clockAt.x, S.clockAt.y + 0.72, -WALK + 0.65);           // the bracket (over the watchmaker's)
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.62, 8), std('#2b2f35')); rod.position.set(0, 0.62 + 0.31 - 0.3, 0); g.add(rod);
    scene.add(g); S.clock = g;
  }
  S.setClock = (minutes) => {                                                                        // minutes after 4:00
    const m = minutes % 60, hr = 4 + minutes / 60;
    for (const { s, hh, mh } of S.hands) { mh.rotation.z = -s * (m / 60) * Math.PI * 2; hh.rotation.z = -s * ((hr % 12) / 12) * Math.PI * 2; }
  };

  // ------------------------------------------------------------------ road signs for right-hand traffic, bagged until the switch
  S.bags = [];
  for (const [x, side] of [[-8, 1], [14, -1], [33, 1]]) {
    const z = side * (ROAD + 0.55);
    box(0.08, 2.6, 0.08, std('#9aa0a8', { metalness: 0.5, roughness: 0.4 }), x, 1.3, z);
    const st2 = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#ffffff'; g.beginPath(); g.arc(128, 128, 124, 0, Math.PI * 2); g.fill(); g.fillStyle = '#2b62b8'; g.beginPath(); g.arc(128, 128, 112, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#ffffff'; g.lineWidth = 26; g.lineCap = 'round'; g.beginPath(); g.moveTo(80, 180); g.lineTo(170, 90); g.stroke(); g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(186, 74); g.lineTo(186, 136); g.lineTo(124, 74); g.fill(); });   // a "keep right" arrow
    const sg = new THREE.Mesh(new THREE.CircleGeometry(0.4, 28), std('#ffffff', { map: st2, roughness: 0.5 })); sg.position.set(x, 2.45, z); sg.rotation.y = side > 0 ? 0 : Math.PI;   // faces the oncoming lane
    add(sg, true, false);
    const bag = new THREE.Mesh(new THREE.SphereGeometry(0.52, 12, 10), std('#1b1d22', { roughness: 0.45 })); bag.scale.set(1, 1.05, 0.38); bag.position.set(x, 2.45, z); add(bag);
    S.bags.push(bag);
  }

  // ------------------------------------------------------------------ trees on the south pavement: paper canopies on trunks
  S.trees = [];
  const crown = canvasTex(512, 512, (g, w, h) => { const r = seeded(9); for (let k = 0; k < 9; k++) { g.fillStyle = k % 2 ? '#5f8a4a' : '#6e9a55'; g.beginPath(); g.arc(256 + (r() - 0.5) * 220, 250 + (r() - 0.5) * 200, 90 + r() * 70, 0, Math.PI * 2); g.fill(); } });
  for (const x of [-26, -9, 30, 52]) {
    box(0.22, 3.2, 0.22, std('#5a4636'), x, 1.6, WALK - 1.3);
    const cm = new THREE.MeshStandardMaterial({ map: crown, alphaTest: 0.5, alphaToCoverage: true, side: THREE.DoubleSide, roughness: 0.9 });
    const c = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), cm); c.position.set(x, 4.6, WALK - 1.3); c.castShadow = true;
    c.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: crown, alphaTest: 0.5 });
    scene.add(c); S.trees.push(c);
    const c2 = c.clone(); c2.rotation.y = Math.PI / 2; scene.add(c2); S.trees.push(c2);
  }
  return S;
}
