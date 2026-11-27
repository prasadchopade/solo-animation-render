// stage3d.js — a three.js stage for a scene: WebGL canvas (kept for the frame grab), filmic tone mapping, bloom.
// ES module (film.js must be type="module" with the import map in film/index.html). Pure: render(t) draws frame t from
// scratch; nothing is simulated across frames, so any frame can be rendered alone (seek(t) contract).
//   import { stage, canvasTex, seeded, Snow, Beam } from '../../../engine/stage3d.js';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';

const { W, H } = window.C;

export function seeded(seed) {
  let a = seed | 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// a stage inside a scene root: o {bg, fog:{color, density}, fov, exposure, bloom:{strength, radius, threshold}, dof:{focus, aperture, maxblur}}
export function stage(root, o = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  canvas.style.cssText = `position:absolute;left:0;top:0;width:${W}px;height:${H}px`;
  root.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = o.exposure ?? 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(o.bg ?? 0x000000);
  if (o.fog) scene.fog = new THREE.FogExp2(o.fog.color, o.fog.density);
  const camera = new THREE.PerspectiveCamera(o.fov ?? 35, W / H, 0.05, 20000);
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(1); composer.setSize(W, H);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  let dof = null;
  if (o.dof) {
    dof = new BokehPass(scene, camera, { focus: o.dof.focus ?? 10, aperture: o.dof.aperture ?? 0.0005, maxblur: o.dof.maxblur ?? 0.01 });
    // for the depth render: a Color background would be cleared INTO the depth target (it reads as "near" and blurs), and
    // Points drawn with the depth material get an undefined point size (pixels then depend on the frame painted before:
    // render --verify caught it). Hide both for this pass; the colour image already has them.
    const pass = dof.render.bind(dof);
    dof.render = (...a) => {
      const sc = dof.scene, bg = sc.background, hidden = [];
      sc.background = null;
      sc.traverse((o) => { if (o.isPoints && o.visible) { o.visible = false; hidden.push(o); } });
      pass(...a);
      for (const o of hidden) o.visible = true;
      sc.background = bg;
    };
    composer.addPass(dof);
  }
  const b = o.bloom || {};
  const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), b.strength ?? 0.9, b.radius ?? 0.55, b.threshold ?? 0.8);
  composer.addPass(bloom);
  // o.finish: film grain, vignette, a flash, a fade to black and a colour wash, computed INSIDE the output pass (after tone
  // mapping and the sRGB transfer, i.e. in display space, like the 2D CINE helpers they replace). One full-screen pass:
  // under SwiftShader a CSS mix-blend-mode grain layer cost ~0.5 s a frame and a separate pass ~0.45 s. Set
  // finish.uniforms each frame (pure functions of t): uFrame (grain seed: the frame clock), uGrain, uVig, uFlash +
  // uFlashCol, uBlack, uTint (rgb) + uTintA.
  const output = new OutputPass();
  let finish = null;
  if (o.finish) {
    Object.assign(output.uniforms, { uFrame: { value: 0 }, uGrain: { value: 0.06 }, uVig: { value: 0.5 }, uFlash: { value: 0 },
      uFlashCol: { value: new THREE.Color(1, 0.97, 0.9) }, uBlack: { value: 0 }, uTint: { value: new THREE.Color(0, 0, 0) }, uTintA: { value: 0 },
      uRes: { value: new THREE.Vector2(W, H) } });
    const fx = `
      uniform float uFrame, uGrain, uVig, uFlash, uBlack, uTintA; uniform vec2 uRes; uniform vec3 uFlashCol, uTint;
      float fxHash(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
      vec3 finishFx(vec3 c, vec2 uv) {
        c = mix(c, c * uTint, uTintA);                                                  // CINE.grade: a multiply wash
        vec2 px = vec2(uv.x, 1.0 - uv.y) * uRes;                                         // CINE.vignette: radial, centred at 45 % height
        float r0 = 0.35 * min(uRes.x, uRes.y), r1 = 0.75 * max(uRes.x, uRes.y);
        c *= 1.0 - uVig * clamp((length(px - uRes * vec2(0.5, 0.45)) - r0) / (r1 - r0), 0.0, 1.0);
        c = mix(c, uFlashCol, clamp(uFlash, 0.0, 1.0));                                 // CINE.flash
        float n = fxHash(floor(uv * uRes / 1.5) + uFrame * 17.0) - 0.5, l = dot(c, vec3(0.299, 0.587, 0.114));
        c += n * uGrain * (0.35 + 1.3 * l * (1.0 - l)) * 2.0;                            // grain, strongest in the mid-tones (like overlay)
        return c * (1.0 - clamp(uBlack, 0.0, 1.0));                                      // fade to black
      }
`;
    let fs = output.material.fragmentShader.replace('varying vec2 vUv;', 'varying vec2 vUv;' + fx);
    const end = fs.lastIndexOf('}');
    fs = fs.slice(0, end) + '\n\t\t\tgl_FragColor.rgb = finishFx(gl_FragColor.rgb, vUv);\n\t\t}' + fs.slice(end + 1);
    output.material.fragmentShader = fs; output.material.needsUpdate = true;
    finish = output;
  }
  composer.addPass(output);
  // one renderer, many shots: show(shot) points the passes at that shot's scene + camera and sets its look
  function show(shot) {
    renderPass.scene = shot.scene; renderPass.camera = shot.camera;
    if (dof) { dof.scene = shot.scene; dof.camera = shot.camera; const d = shot.dof || {}; dof.enabled = !!shot.dof;
      dof.uniforms.focus.value = d.focus ?? 10; dof.uniforms.aperture.value = d.aperture ?? 0.0005; dof.uniforms.maxblur.value = d.maxblur ?? 0.01; }
    const bl = shot.bloom || {}; bloom.strength = bl.strength ?? 0.9; bloom.radius = bl.radius ?? 0.55; bloom.threshold = bl.threshold ?? 0.8;
    renderer.toneMappingExposure = shot.exposure ?? 1.0;
  }
  return { THREE, renderer, scene, camera, composer, bloom, dof, finish, canvas, renderPass, show, render() { composer.render(); } };
}

// a texture painted once on a 2D canvas: paint(g, w, h)
export function canvasTex(w, h, paint, o = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  paint(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = o.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = o.repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  t.anisotropy = 4;
  return t;
}

// drifting particles (marine snow, dust, embers): positions are a pure function of time (each point drifts and wraps).
// Lit by up to two "lamps" (position + direction + cone): a point inside a beam glows, outside it stays faint.
export class Snow {
  constructor(o = {}) {
    const n = o.n ?? 3000, r = seeded(o.seed ?? 1), box = o.box ?? [40, 40, 40];
    const pos = new Float32Array(n * 3), seed = new Float32Array(n);
    for (let i = 0; i < n; i++) { pos[i * 3] = (r() - 0.5) * box[0]; pos[i * 3 + 1] = (r() - 0.5) * box[1]; pos[i * 3 + 2] = (r() - 0.5) * box[2]; seed[i] = r(); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
    this.uniforms = {
      uTime: { value: 0 }, uBox: { value: new THREE.Vector3(...box) }, uCenter: { value: new THREE.Vector3(0, 0, 0) },
      uVel: { value: new THREE.Vector3(...(o.vel ?? [0, 0.6, 0])) }, uSize: { value: o.size ?? 60 }, uColor: { value: new THREE.Color(o.color ?? 0xcfe3ef) },
      uBase: { value: o.base ?? 0.05 },
      uL0: { value: new THREE.Vector3(0, 0, 0) }, uD0: { value: new THREE.Vector3(1, 0, 0) }, uL1: { value: new THREE.Vector3(0, 0, 0) }, uD1: { value: new THREE.Vector3(1, 0, 0) },
      uCos: { value: Math.cos(o.cone ?? 0.35) }, uLamp: { value: 1 },
      fogColor: { value: new THREE.Color(0x000000) }, fogDensity: { value: 0.05 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true,
      vertexShader: `
        attribute float seed; uniform float uTime, uSize, uCos, uLamp, uBase; uniform vec3 uBox, uCenter, uVel, uL0, uD0, uL1, uD1;
        varying float vA; varying float vFog;
        float beam(vec3 p, vec3 L, vec3 D) { vec3 v = p - L; float d = length(v); float c = dot(normalize(v), D);
          return smoothstep(uCos, uCos + 0.12, c) / (1.0 + 0.04 * d * d); }
        void main() {
          vec3 p = position + uVel * uTime + vec3(sin(uTime * 0.6 + seed * 40.0), cos(uTime * 0.5 + seed * 30.0), 0.0) * 0.25;
          p = mod(p - uCenter + uBox * 0.5, uBox) - uBox * 0.5 + uCenter;            // wrap around the camera's neighbourhood
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          float lit = uLamp * (beam(p, uL0, uD0) + beam(p, uL1, uD1));
          vA = (uBase + 2.2 * lit) * (0.5 + 0.5 * fract(seed * 7.13));
          vFog = length(mv.xyz);
          gl_PointSize = uSize * (0.4 + seed) / -mv.z;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 uColor, fogColor; uniform float fogDensity; varying float vA; varying float vFog;
        void main() { vec2 q = gl_PointCoord - 0.5; float d = dot(q, q); if (d > 0.25) discard;
          float f = exp(-fogDensity * fogDensity * vFog * vFog);
          gl_FragColor = vec4(uColor * vA * (1.0 - d * 4.0) * f, 1.0); }`,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
  }
  update(t, scene) {
    this.uniforms.uTime.value = t;
    if (scene && scene.fog) { this.uniforms.fogColor.value.copy(scene.fog.color); this.uniforms.fogDensity.value = scene.fog.density; }
  }
}

// a visible light beam in water / haze: an open cone, brightest along its axis and near the lamp, additive
export class Beam {
  constructor(o = {}) {
    const len = o.len ?? 18, rad = o.radius ?? 5;
    const geo = new THREE.ConeGeometry(rad, len, 48, 1, true);
    geo.translate(0, -len / 2, 0); geo.rotateX(-Math.PI / 2);                                  // apex at the origin, opening along +z (aim with lookAt)
    this.uniforms = { uColor: { value: new THREE.Color(o.color ?? 0xfff2dc) }, uI: { value: o.intensity ?? 0.35 }, uLen: { value: len } };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: `varying vec3 vP; varying vec3 vN; varying vec3 vV;
        void main() { vP = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform vec3 uColor; uniform float uI, uLen; varying vec3 vP; varying vec3 vN; varying vec3 vV;
        void main() { float along = clamp(vP.z / uLen, 0.0, 1.0); float edge = pow(abs(dot(vN, vV)), 1.6);
          float a = uI * edge * pow(1.0 - along, 1.8); gl_FragColor = vec4(uColor * a, 1.0); }`,
    });
    this.mesh = new THREE.Mesh(geo, mat);
  }
}

// an environment for metals to reflect (deep water, space, a hall): a vertical gradient with soft bright patches
export function envGradient(renderer, top, bottom, spots = []) {
  const tex = canvasTex(512, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (const [x, y, r, c] of spots) { const rg = g.createRadialGradient(x * w, y * h, 0, x * w, y * h, r * w); rg.addColorStop(0, c); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(0, 0, w, h); }
  });
  tex.mapping = THREE.EquirectangularReflectionMapping;
  const pm = new THREE.PMREMGenerator(renderer); const env = pm.fromEquirectangular(tex).texture; pm.dispose();
  return env;
}

export { THREE };
