// Render the film: drives window.seek(t) in headless Chromium, pipes frames to ffmpeg. Run from the project root.
//
//   node scripts/render.mjs --sheet [--fmt 9x16] [--phase 0.25]  one frame per beat → review/sheets/sheet_<fmt>.jpg (+ _phone.jpg at 360 px)
//   node scripts/render.mjs --at 1.2,3.4 [--fmt 1x1]              stills → review/stills/<fmt>/t<sec>.png
//   node scripts/render.mjs --draft [--all]                       30 fps, no blur, CRF 22 → renders/draft_<fmt>.mp4 (for review rounds)
//   node scripts/render.mjs [--fmt 16x9 | --all]                  final: 60 fps, H.264 yuv420p CRF 16 → renders/<fmt>.mp4 (add --blur 1 for adaptive 180° motion blur)
//   node scripts/render.mjs --range 3,5 [--blur 1]                a clip of seconds 3–5 → renders/clip_<fmt>_3-5.mp4 (motion checks)
//   node scripts/render.mjs --mux [--all]                         re-mux the current audio/mix.wav into existing renders without re-rendering
//   node scripts/render.mjs --verify [--all]                      determinism check: 12 probes, cold vs after seeking elsewhere
//   options: --fps N  --blur 0|1 (default 0: blur is off since 2026-10-16; it cost ~40 % of a cloud final)  --crf N  --audio path (default audio/mix.wav if present)
//            --workers N  render the video in N browsers at once: 1-s chunks (--chunk S), each encoded as a part, joined without
//                         re-encoding (--keep-parts keeps renders/.parts_<fmt>/ for inspection)
//            --hashes     SHA-256 of every raw frame, before encoding → <out>.sha256 (a parallel render must match a serial one)
//            --blurlog    each frame's blur decision (whole-frame change, the worst 64-px window and where, sub-frames) → <out>.blur.tsv
//   the mix is copied when a render starts (renders/.mix_<pid>.wav, deleted at the end) and the copy is muxed, so rewriting
//   audio/mix.wav during a render can't kill it or put a newer mix into it
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { spawn, spawnSync, fork } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Run from a reel folder (reels/<name>): it holds timeline.json, film/, audio/ and receives renders/ + review/.
// The page is served from the studio root (this script's parent folder) so the reel can load the shared engine/ and assets/.
const ROOT = process.cwd();
const HOME = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REEL_URL = '/' + path.relative(HOME, ROOT).split(path.sep).map(encodeURIComponent).join('/');
if (path.relative(HOME, ROOT).startsWith('..') || !fs.existsSync(path.join(ROOT, 'film/index.html'))) {
  console.error(`run this from a reel folder inside ${HOME} (one with film/index.html), e.g.  cd reels/<name> && node ../../scripts/render.mjs`); process.exit(1);
}
const require = createRequire(path.join(ROOT, 'package.json'));
let chromium;
try { ({ chromium } = require('playwright')); } catch {
  console.error('playwright not found from this project. Run: npm i -D playwright && npx playwright install chromium'); process.exit(1);
}

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true); };
const has = (k) => argv.includes(`--${k}`);
// no flags = a full 60 fps final, so a typo or --help must never fall through to one: print the usage and stop
const FLAGS = ['all', 'at', 'audio', 'blur', 'blurlog', 'chunk', 'crf', 'draft', 'fmt', 'fps', 'hashes', 'keep-parts', 'mux', 'phase', 'range', 'sheet', 'verify', 'worker', 'workers'];
const bad = argv.filter((a) => a.startsWith('-') && !FLAGS.includes(a.replace(/^--/, '')) && !/^-?\d/.test(a));
if (bad.length) {
  const usage = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).slice(0, 16).join('\n');
  console.error(`${bad.join(' ')}: not a render.mjs flag\n\n${usage}`); process.exit(2);
}
const TL = JSON.parse(fs.readFileSync(path.join(ROOT, 'timeline.json'), 'utf8'));
const SIZES = { '16x9': [1920, 1080], '1x1': [1080, 1080], '4x5': [1080, 1350], '9x16': [1080, 1920] };
const FORMATS = has('all') ? TL.formats : [opt('fmt', TL.formats[0])];
const DRAFT = has('draft');
const WORKERS = Math.max(1, Math.round(+opt('workers', 1)) || 1), WORKER = has('worker');   // --worker: a child of a --workers render
if (WORKER) process.on('disconnect', () => process.exit(1));                                // the parent is gone: stop
const AUDIO = path.resolve(ROOT, opt('audio', 'audio/mix.wav'));
const hasAudio = fs.existsSync(AUDIO);
// The mix as it was when the render started: copied once, muxed from the copy, deleted on exit. A mix rewritten mid-render
// then can't kill the encoder (it did once: "write EOF" at frame ~1,020) or slip into a parallel render's join. Workers
// encode silent parts; sheets, stills, checks and clips use no audio.
let MIX = AUDIO;
if (hasAudio && !WORKER && !['sheet', 'at', 'verify', 'range'].some(has)) {
  const dir = path.join(ROOT, 'renders');
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) {                    // a copy left by a render that was killed: its process is gone
    const m = /^\.mix_(\d+)\./.exec(f);
    if (m && +m[1] !== process.pid) try { process.kill(+m[1], 0); } catch (e) { if (e.code === 'ESRCH') try { fs.unlinkSync(path.join(dir, f)); } catch {} }
  }
  MIX = path.join(dir, `.mix_${process.pid}${path.extname(AUDIO) || '.wav'}`);
  fs.copyFileSync(AUDIO, MIX);
  process.on('exit', () => { try { fs.unlinkSync(MIX); } catch {} });
}
const mkdir = (d) => fs.mkdirSync(d, { recursive: true });
const run = (cmd, a) => { const r = spawnSync(cmd, a, { stdio: ['ignore', 'inherit', 'pipe'] }); if (r.status) throw new Error(`${cmd} failed: ${r.stderr}`); return r; };

// ------------------------------------------------------------------ --mux: new mix into existing renders, video untouched
if (has('mux')) {
  if (!hasAudio) { console.error('no audio at', AUDIO); process.exit(1); }
  for (const fmt of FORMATS) {
    const src = path.join(ROOT, `renders/${fmt}.mp4`), tmp = src + '.tmp.mp4';
    run('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-i', MIX, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-shortest', '-movflags', '+faststart', tmp]);
    fs.renameSync(tmp, src); console.log('muxed', src);
  }
  process.exit(0);
}

// ------------------------------------------------------------------ static server (film fetches nothing; data.js is generated)
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf', '.wav': 'audio/wav', '.mp4': 'video/mp4' };
const server = http.createServer((req, res) => {
  const f = path.join(HOME, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(HOME) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
// timeline.json "gl": true → WebGL (three.js) through SwiftShader: the same software renderer on this PC and on GitHub's
// machines, so 3D frames are identical everywhere. Reels without it render exactly as before.
const GLARGS = TL.gl ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : [];
const browser = await chromium.launch({ args: ['--force-color-profile=srgb', '--disable-lcd-text', '--font-render-hinting=none', '--disable-gpu-vsync', ...GLARGS] });

// minimal PNG decoder (8-bit RGB/RGBA, non-interlaced) → packed RGB
function decodePNG(buf) {
  let p = 8, w = 0, h = 0, ct = 0; const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString('ascii', p + 4, p + 8), data = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]; if (data[8] !== 8 || data[12] !== 0) throw new Error('unsupported PNG'); }
    else if (type === 'IDAT') idat.push(data); else if (type === 'IEND') break;
    p += 12 + len;
  }
  const bpp = ct === 6 ? 4 : ct === 2 ? 3 : (() => { throw new Error('PNG colour type ' + ct); })();
  const raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * bpp, cur = Buffer.alloc(stride), prev = Buffer.alloc(stride);
  const out = new Uint8Array(w * h * 3);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const A = x >= bpp ? cur[x - bpp] : 0, B = prev[x], Cc = x >= bpp ? prev[x - bpp] : 0; let v = row[x];
      if (f === 1) v += A; else if (f === 2) v += B; else if (f === 3) v += (A + B) >> 1;
      else if (f === 4) { const pp = A + B - Cc, pa = Math.abs(pp - A), pb = Math.abs(pp - B), pc = Math.abs(pp - Cc); v += pa <= pb && pa <= pc ? A : pb <= pc ? B : Cc; }
      cur[x] = v & 255;
    }
    for (let x = 0, o = y * w * 3; x < w; x++, o += 3) { const q = x * bpp; out[o] = cur[q]; out[o + 1] = cur[q + 1]; out[o + 2] = cur[q + 2]; }
    cur.copy(prev);
  }
  return out;
}

async function openFilm(fmt) {
  const [W, H] = SIZES[fmt];
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); });
  page.on('pageerror', (e) => { console.error('[pageerror]', e.message); process.exitCode = 1; });
  await page.goto(`http://127.0.0.1:${server.address().port}${REEL_URL}/film/index.html?fmt=${fmt}`);
  await page.waitForFunction(() => window.READY, null, { timeout: 120000 });
  await page.evaluate(() => window.READY);
  const cdp = await page.context().newCDPSession(page);
  const info = await page.evaluate(() => ({ DUR: window.DURATION, FPS: window.FPS, CUTS: window.CUTS || [], BEATS: window.BEATS || {} }));
  const png = async (t) => {
    await page.evaluate((t) => window.seek(t), t);
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true });
    return Buffer.from(data, 'base64');
  };
  return { page, png, W, H, ...info };
}

function ffmpeg(a) {
  const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...a], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((ok, bad) => p.on('close', (c) => (c ? bad(new Error(`ffmpeg exit ${c}`)) : ok())));
  return { p, done };
}
const write = async (s, buf) => { if (!s.write(buf)) await new Promise((r) => s.once('drain', r)); };

for (const fmt of FORMATS) {
  const F = await openFilm(fmt);
  const t0 = Date.now();

  if (has('sheet')) {
    // one frame per beat, a quarter-beat after the hit so the reaction is visible
    const phase = +opt('phase', 0.25);
    const grid = F.BEATS.beats && F.BEATS.beats.length ? F.BEATS.beats : [];
    const period = F.BEATS.beat || 60 / TL.bpm;
    const beatT = (i) => grid[i] ?? (grid.length ? grid[grid.length - 1] + (i - grid.length + 1) * period : i * period);
    const times = [];
    for (let i = 0; beatT(i) < F.DUR - 0.5 / F.FPS; i++) times.push(Math.min(F.DUR - 1 / F.FPS, beatT(i) + phase * period));
    const dir = path.join(ROOT, 'review/sheets', fmt); mkdir(dir);
    for (const f of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, f));
    for (let i = 0; i < times.length; i++) fs.writeFileSync(path.join(dir, `b${String(i).padStart(3, '0')}.png`), await F.png(times[i]));
    fs.writeFileSync(path.join(dir, 'times.json'), JSON.stringify(times));
    const wide = F.W >= F.H, cols = wide ? 8 : 10, rows = Math.ceil(times.length / cols);
    for (const [tag, tw] of [['', wide ? 480 : 270], ['_phone', 360]]) {
      const th = Math.round(tw * F.H / F.W / 2) * 2, c = tag ? (wide ? 5 : 8) : cols, r = Math.ceil(times.length / c);
      const label = `drawtext=text='b%{frame_num}':x=6:y=6:fontsize=${tag ? 16 : 20}:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=4,`;
      const out = path.join(ROOT, `review/sheets/sheet_${fmt}${tag}.jpg`);
      const argsFor = (lab) => ['-y', '-loglevel', 'error', '-framerate', '1', '-i', path.join(dir, 'b%03d.png'), '-vf', `scale=${tw}:${th}:flags=lanczos,${lab}tile=${c}x${r}:padding=6:color=0x202020`, '-frames:v', '1', '-q:v', '3', out];
      if (spawnSync('ffmpeg', argsFor(label)).status) run('ffmpeg', argsFor(''));   // ffmpeg without drawtext: unlabeled
      console.log('wrote', path.relative(ROOT, out), `(${times.length} beats, ${rows} rows)`);
    }
  } else if (has('verify')) {
    // determinism: every probe time must paint identical pixels cold and after seeking elsewhere (in any order)
    const probes = Array.from({ length: 12 }, (_, i) => +((i + 0.37) * F.DUR / 12).toFixed(3));
    const cold = [];
    for (const t of probes) cold.push(decodePNG(await F.png(t)));
    let bad = 0;
    for (let k = probes.length - 1; k >= 0; k--) {
      await F.png(probes[(k * 7 + 3) % probes.length]);                // disturb: seek somewhere else first
      const again = decodePNG(await F.png(probes[k]));
      let d = 0; for (let q = 0; q < again.length; q += 13) d = Math.max(d, Math.abs(again[q] - cold[k][q]));
      if (d > 2) { bad++; console.log(`NOT DETERMINISTIC at t=${probes[k]}s (max pixel diff ${d})`); }
    }
    console.log(bad ? `${bad}/${probes.length} probes differ — state is leaking between frames` : `deterministic: ${probes.length}/${probes.length} probes identical (${fmt})`);
    if (bad) process.exitCode = 1;
  } else if (has('at')) {
    const dir = path.join(ROOT, 'review/stills', fmt); mkdir(dir);
    for (const t of String(opt('at', '0')).split(',').map(Number)) {
      const f = path.join(dir, `t${t.toFixed(3)}.png`); fs.writeFileSync(f, await F.png(t)); console.log('wrote', path.relative(ROOT, f));
    }
  } else {
    const fps = +opt('fps', DRAFT ? 30 : F.FPS);
    const blur = !DRAFT && ['1', 'true'].includes(String(opt('blur', '0')));
    const [a, b] = has('range') ? String(opt('range')).split(',').map(Number) : [0, F.DUR];
    const out = path.join(ROOT, 'renders', has('range') ? `clip_${fmt}_${a}-${b}.mp4` : `${DRAFT ? 'draft_' : ''}${fmt}.mp4`);
    mkdir(path.dirname(out));
    const withAudio = hasAudio && !has('range');
    const encode = (file, audio) => ffmpeg([
      '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${F.W}x${F.H}`, '-framerate', String(fps), '-probesize', '100M', '-i', '-',
      ...(audio ? ['-i', MIX] : []),
      '-c:v', 'libx264', '-preset', DRAFT ? 'veryfast' : 'slow', '-crf', String(opt('crf', DRAFT ? 22 : 16)), '-pix_fmt', 'yuv420p', '-profile:v', 'high',
      '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
      '-bsf:v', 'h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1',   // ffmpeg itself tags only the matrix
      ...(audio ? ['-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '320k', '-shortest'] : []),
      '-movflags', '+faststart', file,
    ]);
    // Adaptive 180° motion blur: each frame is probed at two shutter points, a quarter-frame apart, and the change between
    // them sets how many sub-frames to average (2 when static → 24 on the fastest moves). Two measures, the larger wins:
    // the mean pixel difference over the whole frame (camera moves), and the worst 64-px window (a fast caption or object in
    // an otherwise still frame, which the whole-frame mean misses: 2 sub-frames would show it as two sharp copies, not a
    // smear). Below a local change of 16, 2 sub-frames look the same as 32 (wipes, fades, slow moves); above it, one
    // sub-frame per 1.6 of change keeps the copies close enough to read as a smear (calibrated by eye against 32-sample
    // renders of Ep. 06, lab 2026-10-12). Sub-frames sit symmetrically around the frame time and never straddle a hard
    // cut (window.CUTS), so a cut is never double-exposed.
    const SHUTTER = 0.5, MIN_SUB = 2, MAX_SUB = 24, LOCAL_MIN = 16, LOCAL_STEP = 1.6;
    const CW = Math.ceil(F.W / 32), CH = Math.ceil(F.H / 32), cells = new Float64Array(CW * CH);
    const local = (x, y) => {   // the biggest mean |difference| (0–255, all channels) in a 64-px window at a 32-px step, and where
      cells.fill(0);
      for (let r = 0; r < F.H; r++) {
        const o = r * F.W * 3, row = (r >> 5) * CW;
        for (let c = 0; c < CW; c++) {
          let s = 0;
          for (let q = o + c * 96, e = o + Math.min(F.W, c * 32 + 32) * 3; q < e; q++) s += Math.abs(x[q] - y[q]);
          cells[row + c] += s;
        }
      }
      let best = [0, 0, 0];
      for (let cy = 0; cy < CH - 1; cy++) for (let cx = 0; cx < CW - 1; cx++) {
        const s = cells[cy * CW + cx] + cells[cy * CW + cx + 1] + cells[(cy + 1) * CW + cx] + cells[(cy + 1) * CW + cx + 1];
        const m = s / ((Math.min(F.W, cx * 32 + 64) - cx * 32) * (Math.min(F.H, cy * 32 + 64) - cy * 32) * 3);
        if (m > best[0]) best = [m, cx * 32, cy * 32];
      }
      return best;
    };
    const clampCut = (tc, ts) => {
      for (const c of F.CUTS) {
        if (tc < c && ts >= c) return c - 1e-4;
        if (ts < c && tc >= c) return c;
      }
      return ts;
    };
    const at = (tc, u) => clampCut(tc, Math.max(0, Math.min(F.DUR - 1e-6, tc + (u - 0.5) * SHUTTER / fps)));
    const N = Math.round((b - a) * fps), acc = new Float32Array(F.W * F.H * 3), buf = Buffer.alloc(F.W * F.H * 3), hist = {};
    const raise = { frames: 0, captures: 0 };   // frames the local measure gave more sub-frames than the whole-frame one
    let info = null;                            // the last frame's decision, for --blurlog
    const frame = async (i) => {   // frame i as packed RGB: a function of i alone, whichever process renders it
      const tc = a + i / fps;
      if (!blur) return Buffer.from(decodePNG(await F.png(tc)));
      const x = decodePNG(await F.png(at(tc, 0.25))), y = decodePNG(await F.png(at(tc, 0.75)));
      let d = 0; for (let q = 0; q < x.length; q += 97) d += Math.abs(x[q] - y[q]); d /= x.length / 97;
      const [L, lx, ly] = local(x, y);
      const whole = d < 0.35 ? MIN_SUB : Math.min(MAX_SUB, Math.max(4, Math.round(4 + d * 1.6)));
      const SUB = Math.max(whole, L < LOCAL_MIN ? MIN_SUB : Math.min(MAX_SUB, Math.max(4, Math.ceil(L / LOCAL_STEP))));
      hist[SUB] = (hist[SUB] || 0) + 1;
      if (SUB > whole) { raise.frames++; raise.captures += SUB - (whole === MIN_SUB ? 0 : whole); }
      info = [d.toFixed(3), L.toFixed(2), lx, ly, whole, SUB];
      acc.fill(0);
      const add = (im) => { for (let q = 0; q < acc.length; q++) acc[q] += im[q]; };
      if (SUB === 2) { add(x); add(y); } else for (let k = 0; k < SUB; k++) add(decodePNG(await F.png(at(tc, (k + 0.5) / SUB))));
      for (let q = 0; q < acc.length; q++) buf[q] = Math.min(255, Math.round(acc[q] / SUB));
      return buf;
    };
    const pump = async (stdin, i0, i1, sums, logs) => {   // frames [i0, i1) into an encoder, each hashed before encoding
      for (let i = i0; i < i1; i++) {
        const fr = await frame(i);
        if (sums) sums.push(crypto.createHash('sha256').update(fr).digest('hex'));
        if (logs) logs.push([i, (a + i / fps).toFixed(4), ...(blur ? info : [])].join('\t'));
        await write(stdin, fr);
        if (WORKERS === 1 && !WORKER && i % 60 === 0) process.stdout.write(`\r${fmt} frame ${i}/${N}  ${((Date.now() - t0) / 1000).toFixed(0)}s   `);
      }
    };
    let sums = has('hashes') ? [] : null, logs = has('blurlog') ? [] : null, note = '';
    if (WORKER) {
      // a child of a --workers render: each chunk the parent sends becomes a video-only part
      const job = () => new Promise((r) => process.once('message', r));
      let next = job(); process.send({});
      for (let m; (m = await next).part; ) {
        const s = sums && [], lg = logs && [], t1 = Date.now(), { p, done } = encode(m.part, false);
        await pump(p.stdin, m.i0, m.i1, s, lg);
        p.stdin.end(); await done;
        next = job(); process.send({ k: m.k, sums: s, logs: lg, hist, raise, ms: Date.now() - t1 });
      }
    } else if (WORKERS > 1) {
      // N browsers at once: 1-s chunks handed out as workers free up, each encoded as a part (starting on a keyframe),
      // then joined without re-encoding and the audio muxed. The film is a pure function of t, so the raw frames match
      // a 1-worker render: check with --hashes.
      await F.page.close();                         // the workers open their own
      const per = Math.max(1, Math.round(+opt('chunk', 1) * fps)), dir = path.join(ROOT, 'renders', `.parts_${fmt}`);
      fs.rmSync(dir, { recursive: true, force: true }); mkdir(dir);
      const jobs = [];
      for (let i0 = 0; i0 < N; i0 += per) jobs.push({ k: jobs.length, i0, i1: Math.min(N, i0 + per), part: path.join(dir, `p${String(jobs.length).padStart(4, '0')}.mp4`) });
      const args = [];                              // the workers get this render's options, for one format
      for (let i = 0; i < argv.length; i++) {
        if (argv[i] === '--fmt' || argv[i] === '--workers') { if (argv[i + 1] && !argv[i + 1].startsWith('--')) i++; continue; }
        if (argv[i] !== '--all') args.push(argv[i]);
      }
      const all = sums && new Array(N), allLogs = logs && new Array(N), kids = [], hists = [], raises = [], busy = [];
      let handed = 0, rendered = 0;
      try {
        await Promise.all(Array.from({ length: Math.min(WORKERS, jobs.length) }, (_, w) => new Promise((ok, bad) => {
          const c = fork(process.argv[1], [...args, '--fmt', fmt, '--worker'], { stdio: 'inherit' });
          kids.push(c); busy[w] = 0;
          c.on('message', (m) => {
            if (m.k !== undefined) {
              const j = jobs[m.k]; rendered += j.i1 - j.i0; busy[w] += m.ms; hists[w] = m.hist; raises[w] = m.raise;
              if (all) m.sums.forEach((s, q) => (all[j.i0 + q] = s));
              if (allLogs) m.logs.forEach((r, q) => (allLogs[j.i0 + q] = r));
              process.stdout.write(`\r${fmt} frame ${rendered}/${N}  ${((Date.now() - t0) / 1000).toFixed(0)}s  (${WORKERS} workers)   `);
            }
            c.send(handed < jobs.length ? jobs[handed++] : {});   // {}: no more chunks, the worker exits
          });
          c.on('error', bad);
          c.on('exit', (code, sig) => (code || sig ? bad(new Error(`worker ${w} exited with ${code ?? sig}`)) : ok()));
        })));
        if (rendered !== N) throw new Error(`workers rendered ${rendered} of ${N} frames`);
      } catch (e) { for (const c of kids) c.kill(); throw e; }
      const list = path.join(dir, 'parts.txt');
      fs.writeFileSync(list, jobs.map((j) => `file '${path.basename(j.part)}'`).join('\n') + '\n');
      run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-i', list, ...(withAudio ? ['-i', MIX, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '320k', '-shortest'] : []),
        '-c:v', 'copy', '-movflags', '+faststart', out]);
      if (!has('keep-parts')) fs.rmSync(dir, { recursive: true, force: true });
      for (const h of hists) for (const k in h) hist[k] = (hist[k] || 0) + h[k];
      for (const r of raises) if (r) { raise.frames += r.frames; raise.captures += r.captures; }
      sums = all; logs = allLogs;
      note = `  (${WORKERS} workers, ${jobs.length} parts; busy ${busy.map((ms) => (ms / 1000).toFixed(0)).join('/')} s)`;
    } else {
      const { p, done } = encode(out, withAudio);
      await pump(p.stdin, 0, N, sums, logs);
      p.stdin.end(); await done;
    }
    if (!WORKER) {
      if (sums) fs.writeFileSync(out + '.sha256', sums.map((s, i) => `${s}  ${i}`).join('\n') + '\n');
      if (logs) fs.writeFileSync(out + '.blur.tsv', `frame\tt${blur ? '\twhole\tlocal\tx\ty\tsub_whole\tsub' : ''}\n` + logs.join('\n') + '\n');
      const raised = raise.frames ? `  (${raise.frames} raised by the local measure, +${raise.captures} captures)` : '';
      console.log(`\nwrote ${path.relative(ROOT, out)}  ${N} frames @ ${fps} fps${blur ? '  sub-frames ' + JSON.stringify(hist) + raised : ''}${withAudio ? '  + ' + path.relative(ROOT, AUDIO) : '  (silent)'}${note}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
  }
  if (!F.page.isClosed()) await F.page.close();
}
await browser.close(); server.close();
if (WORKER) { process.removeAllListeners('disconnect'); process.exit(process.exitCode || 0); }   // a page error fails the render
