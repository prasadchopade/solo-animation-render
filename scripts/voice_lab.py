"""Voice lab: audition voices and generate narration takes, then score them. Built to run on GitHub's machines
(.github/workflows/voice.yml) so the laptop never loads a speech model. Run from a reel folder.

  python ../../scripts/voice_lab.py gen   --engine kokoro|chatterbox --task cast|takes [--takes 3] [--shard k/n]
  python ../../scripts/voice_lab.py score --task cast|takes

Reads the reel's vo_script.json:
  lines       [{id, text}]                      the narration, one breath per line
  ref_text    a neutral paragraph: each Kokoro voice reads it, and Chatterbox can clone that read ("ref": "<cast id>")
  cast_lines  the lines every cast entry reads
  cast        [{id, engine, voice?, speed?, ref?, exaggeration?, cfg_weight?, temperature?}]   voices to audition
  take        one cast-style entry (or a list of them): the voice(s) for every line (task 'takes')
  lang        'en' (default) or another language code, e.g. 'hi': picks the Whisper model and language for scoring, and
              how words are matched (Devanagari is kept whole). Kokoro's Hindi voices (hf_*, hm_*) give no word timings:
              their words.json is filled from Whisper's.
  lines may carry their own direction for Chatterbox: {"id", "text", "exaggeration"?, "cfg_weight"?}, and a Kokoro-only
  spelling with inline phonemes: "text_kokoro": "And one woman... [ran](/ɹˈæn/)." (Chatterbox would read the brackets)

Writes audio/vo_lab/:
  refs/<cast id>.wav                     Kokoro reads of ref_text (clone sources)
  cast/<cast id>/<line>.wav              one read per cast entry and cast line
  takes/<voice>/<line>/t<k>.wav (+ .words.json)  several takes per line (Chatterbox: seeds; Kokoro: speed steps)
  <task>/report.md + report.json         naturalness (UTMOS 1–5), word errors vs the script (Whisper), pace, pitch range,
                                         and cracking: creak % (vocal fry) and pitch breaks — the best take must be clean
  cast/casting_<line>.wav                every cast entry reading the same line, in report order, 0.8 s apart
  takes/best.json                        per voice, the best take per line: fewest word errors, then least damage, then UTMOS
"""
import argparse, json, os, re, sys
from pathlib import Path

import numpy as np
import soundfile as sf

SR = 24000
LAB = Path('audio/vo_lab')
spec = json.loads(Path('vo_script.json').read_text(encoding='utf-8'))
LINES = {ln['id']: ln['text'] for ln in spec['lines']}
LANG = spec.get('lang', 'en')
DIRECT = {ln['id']: ln for ln in spec['lines']}
KTEXT = lambda lid: DIRECT[lid].get('text_kokoro', LINES[lid])


def entries(task):
    """(entry, [line ids]) pairs for a task."""
    if task == 'cast':
        return [(c, spec['cast_lines']) for c in spec['cast']]
    take = spec.get('take')
    if not take: raise SystemExit("vo_script.json has no 'take' yet: pick a voice from the cast report first")
    return [(e, [ln['id'] for ln in spec['lines']]) for e in (take if isinstance(take, list) else [take])]


def shard_of(items, shard):
    if not shard: return items
    k, n = map(int, shard.split('/'))
    return [x for i, x in enumerate(items) if i % n == k]


# ---------------------------------------------------------------- generation
def gen_kokoro(task, takes, shard):
    from kokoro import KPipeline
    pipes = {}

    def say(text, voice, speed):
        lang = voice[0]                                   # a… American, b… British
        pipe = pipes.get(lang) or pipes.setdefault(lang, KPipeline(lang_code=lang, repo_id='hexgrad/Kokoro-82M'))
        chunks, words, off = [], [], 0.0
        for r in pipe(text, voice=voice, speed=speed):
            a = r.audio.numpy() if hasattr(r.audio, 'numpy') else np.asarray(r.audio)
            for t in (r.tokens or []):
                if t.start_ts is None: continue
                words.append({'w': t.text, 't0': round(off + t.start_ts, 3), 't1': round(off + t.end_ts, 3), 'ws': bool(t.whitespace)})
            chunks.append(a); off += len(a) / SR
        return np.concatenate(chunks), words

    def write(path, text, y, words):
        path.parent.mkdir(parents=True, exist_ok=True)
        sf.write(path, y, SR, subtype='PCM_16')
        path.with_suffix('.words.json').write_text(json.dumps({'text': text, 'dur': round(len(y) / SR, 3), 'words': words}, indent=1), encoding='utf-8')
        print(f'{path}  {len(y) / SR:5.2f}s  {text[:60]}', flush=True)

    cast = {c['id']: c for c in spec['cast']}                 # clone sources: every Kokoro voice in a cast, or the one a take names
    refs = [c for c in spec['cast'] if c['engine'] == 'kokoro'] if task == 'cast' else [cast[e['ref']] for e, _ in entries(task) if e.get('ref')]
    for c in refs:
        y, w = say(spec['ref_text'], c['voice'], c.get('speed', 1.0)); write(LAB / 'refs' / f"{c['id']}.wav", spec['ref_text'], y, w)
    for e, ids in entries(task):
        if e['engine'] != 'kokoro': continue
        if task == 'cast':
            for lid in shard_of(ids, shard):
                y, w = say(KTEXT(lid), e['voice'], e.get('speed', 1.0)); write(LAB / 'cast' / e['id'] / f'{lid}.wav', LINES[lid], y, w)
        else:
            steps = [1.0, 0.96, 1.04, 0.92, 1.08][:takes]       # Kokoro is deterministic: takes differ by pace
            for lid in shard_of(ids, shard):
                for k, m in enumerate(steps, 1):
                    y, w = say(KTEXT(lid), e['voice'], round(e.get('speed', 1.0) * m, 3)); write(LAB / 'takes' / e['id'] / lid / f't{k}.wav', LINES[lid], y, w)


def gen_chatterbox(task, takes, shard):
    import copy, torch
    from chatterbox.tts import ChatterboxTTS
    torch.set_num_threads(os.cpu_count() or 4)
    model = ChatterboxTTS.from_pretrained(device='cpu')
    default = copy.deepcopy(model.conds)
    jobs = []
    for e, ids in entries(task):
        if e['engine'] != 'chatterbox': continue
        for lid in ids:
            for k in (range(1, takes + 1) if task == 'takes' else [1]):
                jobs.append((e, lid, k))
    for e, lid, k in shard_of(jobs, shard):
        ref = str(LAB / 'refs' / f"{e['ref']}.wav") if e.get('ref') else None
        if ref and not Path(ref).exists(): raise SystemExit(f'missing clone source {ref} (run the kokoro cast first)')
        if not ref: model.conds = copy.deepcopy(default)
        torch.manual_seed(1000 * k + 7)
        dl = DIRECT[lid] if task == 'takes' else {}                      # per-line direction overrides the voice's
        wav = model.generate(LINES[lid], audio_prompt_path=ref, exaggeration=dl.get('exaggeration', e.get('exaggeration', 0.5)),
                             cfg_weight=dl.get('cfg_weight', e.get('cfg_weight', 0.5)), temperature=e.get('temperature', 0.8))
        y = wav.squeeze(0).cpu().numpy().astype(np.float32)
        out = LAB / 'cast' / e['id'] / f'{lid}.wav' if task == 'cast' else LAB / 'takes' / e['id'] / lid / f't{k}.wav'
        out.parent.mkdir(parents=True, exist_ok=True)
        sf.write(out, y, model.sr, subtype='PCM_16')
        print(f'{out}  {len(y) / model.sr:5.2f}s  {LINES[lid][:60]}', flush=True)


# ---------------------------------------------------------------- scoring
ONES = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split()
TENS = 'twenty thirty forty fifty sixty seventy eighty ninety'.split()


def num_words(n):
    if n < 20: return ONES[n]
    if n < 100: return TENS[n // 10 - 2] + ('' if n % 10 == 0 else ' ' + ONES[n % 10])
    if n < 1000: return ONES[n // 100] + ' hundred' + ('' if n % 100 == 0 else ' ' + num_words(n % 100))
    return str(n)


def norm(s):
    if LANG != 'en':
        return re.sub(r'[।॥,.!?;:"“”‘’\'()–—-]+', ' ', s.lower()).split()
    s = re.sub(r'\d+', lambda m: ' ' + num_words(int(m.group())) + ' ', s.lower().replace('%', ' percent'))
    s = s.replace('-', ' ').replace("'", '').replace('’', '')
    return re.sub(r'[^a-z ]+', ' ', s).split()


def wer(ref, hyp):
    r, h = norm(ref), norm(hyp)
    d = list(range(len(h) + 1))
    for i in range(1, len(r) + 1):
        prev, d[0] = d[0], i
        for j in range(1, len(h) + 1):
            cur = min(d[j] + 1, d[j - 1] + 1, prev + (r[i - 1] != h[j - 1]))
            prev, d[j] = d[j], cur
    return d[len(h)], len(r)


def damage(y, sr, f0, voiced):
    """what a listener hears as the voice cracking: creak (vocal fry: voiced frames far below the line's own median
    pitch, % — calibrated on reel-2-38-witnesses takes: a 31 % take sounded broken, clean takes sit under 3 %) and pitch
    breaks (raw YIN pitch leaping > 6 semitones between two loud voiced frames). UTMOS does not catch either."""
    v = np.asarray(voiced, bool)
    med = np.nanmedian(f0[v]) if v.any() else 0
    creak = float(np.mean(f0[v] < 0.62 * med) * 100) if v.any() and med > 0 else 0.0
    import librosa
    yf = librosa.yin(y, fmin=55, fmax=420, sr=sr, frame_length=2048, hop_length=256)
    rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=256)[0]
    n = min(len(yf), len(v), len(rms)); ok = v[:n] & (rms[:n] > rms.max() * 0.25)
    st = 12 * np.log2(yf[:n] / 100.0)
    # a leap of one octave (12 ± 1 st) is YIN picking half/double the period at a word edge, not the voice breaking
    # (every reel-3 c03 take was flagged for "the | edge" this way, 2026-10-16)
    leap = lambda d: d > 6 and abs(d - 12) > 1.0
    jumps = int(sum(1 for i in range(1, n) if ok[i] and ok[i - 1] and leap(abs(st[i] - st[i - 1]))))
    return creak, jumps, 0


def score(task):
    import librosa, torch
    from faster_whisper import WhisperModel
    torch.set_num_threads(os.cpu_count() or 4)
    mos = torch.hub.load('tarepan/SpeechMOS:v1.2.0', 'utmos22_strong', trust_repo=True).eval()
    asr = WhisperModel('small.en' if LANG == 'en' else 'small', device='cpu', compute_type='int8')
    root = LAB / task
    files = sorted(p for p in root.rglob('*.wav') if not p.name.startswith('casting_'))
    rows = []
    for p in files:
        lid, who = (p.stem, p.parent.name) if task == 'cast' else (p.parent.name, f'{p.parent.parent.name}/{p.stem}')
        y, sr = sf.read(p, dtype='float32')
        if y.ndim > 1: y = y.mean(1)
        y16 = librosa.resample(y, orig_sr=sr, target_sr=16000)
        with torch.no_grad():
            m = float(mos(torch.from_numpy(y16).unsqueeze(0), 16000).item())
        segs, _ = asr.transcribe(str(p), beam_size=5, language=LANG, word_timestamps=True)   # no prompt: hear it cold
        segs = list(segs)
        ws = [w for s in segs for w in (s.words or [])]
        hyp = ' '.join(s.text.strip() for s in segs)
        errs, n = wer(LINES[lid], hyp)
        span = (ws[-1].end - ws[0].start) if ws else len(y) / sr
        f0a, vflag, _ = librosa.pyin(y, fmin=55, fmax=420, sr=sr, frame_length=2048, hop_length=256)
        f0 = f0a[~np.isnan(f0a)]
        p10, p50, p90 = (np.percentile(f0, [10, 50, 90]) if len(f0) > 5 else (0, 0, 0))
        rng = 12 * np.log2(p90 / p10) if p10 > 0 else 0.0
        creak, jumps, _ = damage(y, sr, f0a, vflag)
        rows.append({'who': who, 'line': lid, 'file': str(p), 'mos': round(m, 3), 'errors': errs, 'words': n, 'heard': hyp,
                     'dur': round(len(y) / sr, 2), 'wps': round(len(norm(LINES[lid])) / max(span, 0.3), 2),
                     'f0_hz': round(float(p50), 1), 'f0_range_st': round(float(rng), 1),
                     'creak': round(creak, 1), 'jumps': jumps, 'damage': round(creak + 5 * jumps, 1)})
        print(f"{who:16s} {lid:5s} MOS {m:4.2f}  err {errs}/{n}  creak {creak:4.1f}% jumps {jumps}  {rows[-1]['wps']:4.2f} w/s  | {hyp}", flush=True)
        wj = p.with_suffix('.words.json')                                          # Chatterbox, and Kokoro outside English,
        if task == 'takes' and (not wj.exists() or not json.loads(wj.read_text(encoding='utf-8')).get('words')):   # give no timings: use Whisper's
            words = [{'w': w.word.strip(), 't0': round(w.start, 3), 't1': round(w.end, 3), 'ws': True} for w in ws]
            p.with_suffix('.words.json').write_text(json.dumps({'text': LINES[lid], 'dur': round(len(y) / sr, 3), 'words': words}, indent=1), encoding='utf-8')

    (root / 'report.json').write_text(json.dumps(rows, indent=1), encoding='utf-8')
    md = [f'# Voice lab — {task}', '', f"MOS = UTMOS22 predicted naturalness (1–5, higher is better; trained on English). err = word errors vs the script (Whisper {'small.en' if LANG == 'en' else 'small, ' + LANG}).",
          'w/s = words per second while speaking. F0 = median pitch; ± = pitch range p10–p90 in semitones (more = more expressive).', '']
    key = 'who' if task == 'cast' else 'line'
    groups = {}
    for r in rows: groups.setdefault(r[key], []).append(r)
    if task == 'cast':
        md += ['| voice | MOS | errors | w/s | F0 Hz | range st |', '|---|---|---|---|---|---|']
        agg = sorted(((k, np.mean([r['mos'] for r in v]), sum(r['errors'] for r in v), np.mean([r['wps'] for r in v]),
                       np.median([r['f0_hz'] for r in v]), np.mean([r['f0_range_st'] for r in v])) for k, v in groups.items()), key=lambda a: -a[1])
        md += [f'| {k} | {a:.2f} | {e} | {w:.2f} | {f:.0f} | {s:.1f} |' for k, a, e, w, f, s in agg]
        order = [a[0] for a in agg]
        for lid in spec['cast_lines']:                                         # one casting reel per line
            parts = []
            for who in order:
                f = root / who / f'{lid}.wav'
                if f.exists():
                    y, sr = sf.read(f, dtype='float32')
                    y = librosa.resample(y if y.ndim == 1 else y.mean(1), orig_sr=sr, target_sr=SR) if sr != SR else (y if y.ndim == 1 else y.mean(1))
                    parts += [y / (np.abs(y).max() + 1e-9) * 0.7, np.zeros(int(0.8 * SR), np.float32)]
            if parts: sf.write(root / f'casting_{lid}.wav', np.concatenate(parts), SR, subtype='PCM_16')
        md += ['', 'Casting reels (casting_<line>.wav) play the voices in the table order, 0.8 s apart.']
    else:
        best = {}
        voices = sorted({r['who'].split('/')[0] for r in rows})
        md += ['| voice | mean MOS of best takes | lines with errors | cracked lines (creak > 3 % or a pitch break) | speaking time s |', '|---|---|---|---|---|']
        for vc in voices:
            bl = {}
            for lid in LINES:
                v = sorted([r for r in rows if r['line'] == lid and r['who'].startswith(vc + '/')], key=lambda r: (r['errors'], r['damage'] > 3, r['damage'], -r['mos']))
                if v: bl[lid] = v[0]
            best[vc] = {lid: r['who'].split('/')[1] for lid, r in bl.items()}
            md += [f"| {vc} | {np.mean([r['mos'] for r in bl.values()]):.2f} | {sum(1 for r in bl.values() if r['errors'])} | {sum(1 for r in bl.values() if r['damage'] > 3)} | {sum(r['dur'] for r in bl.values()):.1f} |"]
        md += ['', '| line | take | MOS | errors | creak % | pitch breaks | w/s | heard |', '|---|---|---|---|---|---|---|---|']
        for lid in LINES:
            v = sorted([r for r in rows if r['line'] == lid], key=lambda r: (r['who'].split('/')[0], r['errors'], -r['mos']))
            md += [f"| {lid} | {r['who']}{' ★' if best.get(r['who'].split('/')[0], {}).get(lid) == r['who'].split('/')[1] else ''} | {r['mos']:.2f} | {r['errors']}/{r['words']} | {r['creak']} | {r['jumps']} | {r['wps']:.2f} | {r['heard']} |" for r in v]
        (root / 'best.json').write_text(json.dumps(best, indent=1), encoding='utf-8')
    (root / 'report.md').write_text('\n'.join(md) + '\n', encoding='utf-8')
    print('\n'.join(md))


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('cmd', choices=['gen', 'score'])
    ap.add_argument('--engine', choices=['kokoro', 'chatterbox'])
    ap.add_argument('--task', choices=['cast', 'takes'], required=True)
    ap.add_argument('--takes', type=int, default=3)
    ap.add_argument('--shard', default='')
    a = ap.parse_args()
    if a.cmd == 'score': score(a.task)
    elif a.engine == 'kokoro': gen_kokoro(a.task, a.takes, a.shard)
    elif a.engine == 'chatterbox': gen_chatterbox(a.task, a.takes, a.shard)
    else: sys.exit('gen needs --engine')
