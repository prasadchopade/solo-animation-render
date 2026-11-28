// stage55.js: reel 55's own 3D stage (three.js r170 through SwiftShader). The lab's clip 16 look (filmic tone mapping,
// soft shadows, bloom, fog, grain and vignette) plus the four things its README listed as missing, in one hand-built
// post chain that reads the scene's depth once instead of rendering the scene twice:
//   1. anti-aliasing: the scene renders into a 4-sample MSAA target, and the paper cut-outs use alpha-to-coverage, so
//      their die-cut edges are smooth (alpha-test edges stair-step even under MSAA);
//   2. ambient occlusion: half resolution, depth only (a SAO-style spiral), then a depth-aware blur;
//   3. light shafts: quarter resolution, sky pixels near the sun blurred toward the sun's place on screen;
//   4. depth of field: a half-resolution gather (scatter-as-gather, so a sharp face never bleeds into a soft street),
//      mixed in only where a pixel's blur is bigger than a pixel; skipped entirely when the aperture is 0.
// Then bloom (UnrealBloomPass, additive) and the output pass: ACES, sRGB, and stage3d's finish (grain, vignette, flash,
// fade to black, tint) inside the same shader.
// Pure: render() draws the frame from scratch from the uniforms set for it; the AO noise is a fixed pattern hashed from
// the pixel's position, nothing accumulates across frames, so any frame renders alone (the seek(t) contract).
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const { W, H } = window.C;
const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const COMMON = `
  #include <packing>
  varying vec2 vUv;
  uniform sampler2D tDepth; uniform float cNear, cFar; uniform mat4 projInv;
  vec3 viewPos(vec2 uv) { float d = texture2D(tDepth, uv).x; vec4 c = projInv * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); return c.xyz / c.w; }
  float linZ(vec2 uv) { return -perspectiveDepthToViewZ(texture2D(tDepth, uv).x, cNear, cFar); }
  float hash12(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
`;
const mat = (frag, uniforms) => new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false });
const rt = (w, h, o = {}) => new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, ...o });

export function makeStage(root, o = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  canvas.style.cssText = `position:absolute;left:0;top:0;width:${W}px;height:${H}px`;
  root.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = o.exposure ?? 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(o.bg ?? 0x000000);
  if (o.fog) scene.fog = new THREE.FogExp2(o.fog.color, o.fog.density);
  const camera = new THREE.PerspectiveCamera(o.fov ?? 35, W / H, o.near ?? 0.1, o.far ?? 900);

  // the scene: MSAA colour (HDR) + a resolved depth texture
  const depthTex = new THREE.DepthTexture(W, H); depthTex.type = THREE.UnsignedIntType;
  const rtScene = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: o.samples ?? 4, depthTexture: depthTex, depthBuffer: true });
  const hw = W >> 1, hh = H >> 1, qw = W >> 2, qh = H >> 2;
  const rtAO = rt(hw, hh), rtAO2 = rt(hw, hh), rtMask = rt(qw, qh), rtShaft = rt(qw, qh), rtComp = rt(W, H), rtDof = rt(hw, hh), rtFinal = rt(W, H);
  const quad = new FullScreenQuad(null);
  const camU = { tDepth: { value: depthTex }, cNear: { value: camera.near }, cFar: { value: camera.far }, projInv: { value: new THREE.Matrix4() } };

  // 2. ambient occlusion (half res): McGuire's SAO estimator over a 12-tap spiral; r = linear AO, g = linear depth (for the blur)
  const aoMat = mat(COMMON + `
    uniform vec2 uRes; uniform float uRadius, uProj, uBias, uIntensity;
    void main() {
      float d = texture2D(tDepth, vUv).x;
      if (d >= 0.99999) { gl_FragColor = vec4(1.0, 1e4, 0.0, 1.0); return; }
      vec3 P = viewPos(vUv);
      vec2 tx = vec2(1.0 / uRes.x, 0.0), ty = vec2(0.0, 1.0 / uRes.y);
      vec3 px1 = viewPos(vUv + tx), px0 = viewPos(vUv - tx), py1 = viewPos(vUv + ty), py0 = viewPos(vUv - ty);
      vec3 dx = abs(px1.z - P.z) < abs(P.z - px0.z) ? px1 - P : P - px0;
      vec3 dy = abs(py1.z - P.z) < abs(P.z - py0.z) ? py1 - P : P - py0;
      vec3 n = normalize(cross(dx, dy));
      float rPx = min(uRadius * uProj / -P.z, 48.0);
      float rot = hash12(gl_FragCoord.xy) * 6.2831853, r2 = uRadius * uRadius, ao = 0.0;
      for (int i = 0; i < 12; i++) {
        float a = (float(i) + 0.5) / 12.0, ang = a * 7.0 * 6.2831853 + rot;
        vec3 v = viewPos(vUv + vec2(cos(ang), sin(ang)) * (a * rPx) / uRes) - P;
        float vv = dot(v, v), f = max(r2 - vv, 0.0);
        ao += f * f * f * max((dot(v, n) - uBias) / (0.01 + vv), 0.0);
      }
      ao = max(0.0, 1.0 - ao * uIntensity * 5.0 / (r2 * r2 * r2 * 12.0));
      gl_FragColor = vec4(ao, -P.z, 0.0, 1.0);
    }`, { ...camU, uRes: { value: new THREE.Vector2(hw, hh) }, uRadius: { value: 0.6 }, uProj: { value: 1 }, uBias: { value: 0.02 }, uIntensity: { value: 1.0 } });
  const blurMat = mat(`varying vec2 vUv; uniform sampler2D tAO; uniform vec2 uDir;
    void main() {
      vec4 c = texture2D(tAO, vUv); float z = c.g, s = c.r, ws = 1.0;
      for (int i = -4; i <= 4; i++) { if (i == 0) continue;
        vec4 q = texture2D(tAO, vUv + uDir * float(i));
        float w = exp(-float(i * i) / 9.0) * max(0.0, 1.0 - abs(q.g - z) / (0.04 * z + 0.02));
        s += q.r * w; ws += w; }
      gl_FragColor = vec4(s / ws, z, 0.0, 1.0);
    }`, { tAO: { value: null }, uDir: { value: new THREE.Vector2() } });

  // 3. light shafts (quarter res): sky near the sun, then a radial blur toward it (GPU Gems 3, ch. 13)
  const maskMat = mat(COMMON + `
    uniform sampler2D tColor; uniform vec2 uSun; uniform float uSunR, uAspect;
    void main() {
      float sky = step(0.99999, texture2D(tDepth, vUv).x);
      vec2 dv = (vUv - uSun) * vec2(uAspect, 1.0);
      float g = 1.0 - smoothstep(0.0, uSunR, length(dv));
      gl_FragColor = vec4(texture2D(tColor, vUv).rgb * sky * g, 1.0);
    }`, { ...camU, tColor: { value: rtScene.texture }, uSun: { value: new THREE.Vector2(0.5, 0.5) }, uSunR: { value: 0.35 }, uAspect: { value: W / H } });
  const rayMat = mat(`varying vec2 vUv; uniform sampler2D tMask; uniform vec2 uSun; uniform float uDensity, uDecay, uWeight;
    void main() {
      vec2 uv = vUv, dt = (vUv - uSun) * uDensity / 48.0; float il = 1.0; vec3 acc = vec3(0.0);
      for (int i = 0; i < 48; i++) { uv -= dt; acc += texture2D(tMask, clamp(uv, 0.0, 1.0)).rgb * il * uWeight; il *= uDecay; }
      gl_FragColor = vec4(acc, 1.0);
    }`, { tMask: { value: rtMask.texture }, uSun: { value: new THREE.Vector2(0.5, 0.5) }, uDensity: { value: 0.9 }, uDecay: { value: 0.965 }, uWeight: { value: 0.06 } });

  // composite: colour x AO (fading out with distance, where fog owns the look) + the shafts
  const compMat = mat(`varying vec2 vUv; uniform sampler2D tColor, tAO, tShaft; uniform float uAO; uniform vec3 uShaftCol; uniform float uAOFar;
    void main() {
      vec4 c = texture2D(tColor, vUv); vec2 a = texture2D(tAO, vUv).rg;
      float ao = mix(a.r, 1.0, smoothstep(uAOFar * 0.6, uAOFar, a.g));
      c.rgb *= mix(1.0, ao, uAO);
      c.rgb += texture2D(tShaft, vUv).rgb * uShaftCol;
      gl_FragColor = vec4(c.rgb, 1.0);
    }`, { tColor: { value: rtScene.texture }, tAO: { value: rtAO.texture }, tShaft: { value: rtShaft.texture }, uAO: { value: 1 }, uShaftCol: { value: new THREE.Color(0, 0, 0) }, uAOFar: { value: 60 } });

  // 4. depth of field (half res): Gustafsson's single-pass scatter-as-gather; a = how blurred this pixel ends up
  const dofMat = mat(`varying vec2 vUv; uniform sampler2D tComp, tZ; uniform vec2 uTexel; uniform float uFocus, uAperture, uMax;
    float coc(float z) { return clamp(uAperture * abs(z - uFocus) / max(z, 0.05), 0.0, uMax); }
    void main() {
      float z0 = texture2D(tZ, vUv).g, c0 = coc(z0);
      vec3 col = texture2D(tComp, vUv).rgb; float tot = 1.0, amt = c0, r = 0.5, ang = 0.0;
      for (int i = 0; i < 64; i++) {
        if (r >= uMax) break;
        vec2 uv = vUv + vec2(cos(ang), sin(ang)) * uTexel * r;
        float zs = texture2D(tZ, uv).g, cs = coc(zs);
        if (zs > z0) cs = min(cs, c0 * 2.0);
        float m = smoothstep(r - 0.5, r + 0.5, cs);
        col += mix(col / tot, texture2D(tComp, uv).rgb, m); tot += 1.0;
        if (zs < z0) amt = max(amt, m * cs);
        ang += 2.39996323; r += 1.0 / r;
      }
      gl_FragColor = vec4(col / tot, clamp((amt - 0.6) / 1.2, 0.0, 1.0));
    }`, { tComp: { value: rtComp.texture }, tZ: { value: rtAO2.texture }, uTexel: { value: new THREE.Vector2(1 / hw, 1 / hh) }, uFocus: { value: 5 }, uAperture: { value: 0 }, uMax: { value: 10 } });
  const mixMat = mat(`varying vec2 vUv; uniform sampler2D tComp, tDof;
    void main() { vec4 d = texture2D(tDof, vUv); gl_FragColor = vec4(mix(texture2D(tComp, vUv).rgb, d.rgb, d.a), 1.0); }`,
  { tComp: { value: rtComp.texture }, tDof: { value: rtDof.texture } });

  const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), o.bloom?.strength ?? 0.4, o.bloom?.radius ?? 0.5, o.bloom?.threshold ?? 0.9);
  const output = new OutputPass(); output.renderToScreen = true;
  // stage3d's finish, inside the output pass (display space): grain, vignette, flash, fade to black, tint
  Object.assign(output.uniforms, { uFrame: { value: 0 }, uGrain: { value: 0.03 }, uVig: { value: 0.3 }, uFlash: { value: 0 },
    uFlashCol: { value: new THREE.Color(1, 0.97, 0.9) }, uBlack: { value: 0 }, uTint: { value: new THREE.Color(1, 1, 1) }, uTintA: { value: 0 },
    uRes: { value: new THREE.Vector2(W, H) } });
  {
    const fx = `
      uniform float uFrame, uGrain, uVig, uFlash, uBlack, uTintA; uniform vec2 uRes; uniform vec3 uFlashCol, uTint;
      float fxHash(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
      vec3 finishFx(vec3 c, vec2 uv) {
        c = mix(c, c * uTint, uTintA);
        vec2 px = vec2(uv.x, 1.0 - uv.y) * uRes;
        float r0 = 0.35 * min(uRes.x, uRes.y), r1 = 0.75 * max(uRes.x, uRes.y);
        c *= 1.0 - uVig * clamp((length(px - uRes * vec2(0.5, 0.45)) - r0) / (r1 - r0), 0.0, 1.0);
        c = mix(c, uFlashCol, clamp(uFlash, 0.0, 1.0));
        float n = fxHash(floor(uv * uRes / 1.5) + uFrame * 17.0) - 0.5, l = dot(c, vec3(0.299, 0.587, 0.114));
        c += n * uGrain * (0.35 + 1.3 * l * (1.0 - l)) * 2.0;
        return c * (1.0 - clamp(uBlack, 0.0, 1.0));
      }
`;
    let fs = output.material.fragmentShader.replace('varying vec2 vUv;', 'varying vec2 vUv;' + fx);
    const end = fs.lastIndexOf('}');
    fs = fs.slice(0, end) + '\n\t\t\tgl_FragColor.rgb = finishFx(gl_FragColor.rgb, vUv);\n\t\t}' + fs.slice(end + 1);
    output.material.fragmentShader = fs; output.material.needsUpdate = true;
  }

  // the per-frame look (film.js sets these from t, every frame)
  const look = {
    ao: { amount: 1, radius: 0.6, intensity: 1.0, bias: 0.02, far: 60 },
    shafts: { color: new THREE.Color(0, 0, 0), sun: new THREE.Vector3(0, 10, -100), radius: 0.35, density: 0.9, decay: 0.965, weight: 0.06 },
    dof: { focus: 5, aperture: 0, max: 10 },
    bloom: { strength: o.bloom?.strength ?? 0.4, radius: o.bloom?.radius ?? 0.5, threshold: o.bloom?.threshold ?? 0.9 },
    finish: output.uniforms,
  };
  const tmpV = new THREE.Vector3();
  const pass = (m, target) => { quad.material = m; renderer.setRenderTarget(target); quad.render(renderer); };

  function render() {
    camera.updateMatrixWorld(); camera.updateProjectionMatrix();
    camU.projInv.value.copy(camera.projectionMatrixInverse); camU.cNear.value = camera.near; camU.cFar.value = camera.far;
    // 1. the scene, anti-aliased, with depth
    renderer.setRenderTarget(rtScene); renderer.clear(); renderer.render(scene, camera);
    // 2. AO, then its depth-aware blur (two passes)
    const A = look.ao;
    aoMat.uniforms.uRadius.value = A.radius; aoMat.uniforms.uBias.value = A.bias; aoMat.uniforms.uIntensity.value = A.intensity;
    aoMat.uniforms.uProj.value = hh / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    pass(aoMat, rtAO);
    blurMat.uniforms.tAO.value = rtAO.texture; blurMat.uniforms.uDir.value.set(1 / hw, 0); pass(blurMat, rtAO2);
    blurMat.uniforms.tAO.value = rtAO2.texture; blurMat.uniforms.uDir.value.set(0, 1 / hh); pass(blurMat, rtAO);
    // keep the unblurred depth for the depth of field: the blur passes carry z through in .g, so rtAO.g is linear depth
    // 3. shafts, only while they're lit
    const S = look.shafts, lit = S.color.r + S.color.g + S.color.b > 0.001;
    if (lit) {
      tmpV.copy(S.sun).project(camera);
      const su = (tmpV.x + 1) / 2, sv = (tmpV.y + 1) / 2;
      maskMat.uniforms.uSun.value.set(su, sv); maskMat.uniforms.uSunR.value = S.radius; pass(maskMat, rtMask);
      rayMat.uniforms.uSun.value.set(su, sv);
      rayMat.uniforms.uDensity.value = S.density; rayMat.uniforms.uDecay.value = S.decay; rayMat.uniforms.uWeight.value = S.weight;
      pass(rayMat, rtShaft);
    }
    compMat.uniforms.uAO.value = A.amount; compMat.uniforms.uAOFar.value = A.far;
    compMat.uniforms.uShaftCol.value.copy(lit ? S.color : new THREE.Color(0, 0, 0));
    compMat.uniforms.tAO.value = rtAO.texture;
    // 4. depth of field, only when there's an aperture
    const D = look.dof;
    if (D.aperture > 0.001) {
      pass(compMat, rtComp);
      dofMat.uniforms.tZ.value = rtAO.texture;
      dofMat.uniforms.uFocus.value = D.focus; dofMat.uniforms.uAperture.value = D.aperture; dofMat.uniforms.uMax.value = D.max;
      pass(dofMat, rtDof);
      pass(mixMat, rtFinal);
    } else pass(compMat, rtFinal);
    // bloom onto rtFinal, then out to the canvas
    bloom.strength = look.bloom.strength; bloom.radius = look.bloom.radius; bloom.threshold = look.bloom.threshold;
    bloom.render(renderer, null, rtFinal, 0, false);
    output.render(renderer, null, rtFinal);
  }
  return { THREE, renderer, scene, camera, canvas, look, render };
}
