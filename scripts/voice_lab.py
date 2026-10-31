"""Voice lab: audition voices and generate narration takes, then score them. Built to run on GitHub's machines
(.github/workflows/voice.yml) so the laptop never loads a speech model. Run from a reel folder.

  python ../../scripts/voice_lab.py gen   --engine kokoro|chatterbox --task cast|takes [--takes 3] [--shard k/n]
  python ../../scripts/voice_lab.py score --task cast|takes
  python ../../scripts/voice_lab.py check [--audio audio/mix.wav]     the words in the finished mix (below)

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
  takes/phonemes.md                      what Kokoro was told to say: every word's phonemes (misaki), to read before listening
  check/report.md + report.json          `check`: every word of the placed narration (film/words.js) in the finished mix

Three ears, each independent of the others (2026-10-29, the user: "please check the sound effects and pronunciation
multiple times so that the audio is very clear"):
  1. Whisper small.en          the quick ear (word errors, as before)
  2. Whisper large-v3          a second, much larger model: it must hear the same words (VOICE_ASR2 to change it)
  3. a phoneme recogniser      wav2vec2 trained on espeak phonemes, CTC with no language model (VOICE_PHONES): it
                               hears sounds, not words, so it can't guess its way past a slurred or wrong sound the way
                               Whisper can. Its phonemes are compared word by word with espeak-ng's for the script.
`check` runs ears 1 and 2 on the whole mix three ways (as mixed; through a phone speaker: mono, 300 Hz–7 kHz, a little
drive; in a noisy room: pink noise 12 dB under the mix), and ear 3 on each line of the mix.
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
                words.append({'w': t.text, 't0': round(off + t.start_ts, 3), 't1': round(off + t.end_ts, 3), 'ws': bool(t.whitespace),
                              'ph': getattr(t, 'phonemes', None) or ''})          # what misaki told the voice to say
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
                for k, m in enumerate(steps, 1):                # a line may set its own pace: {"speed": 0.88}
                    y, w = say(KTEXT(lid), e['voice'], round(e.get('speed', 1.0) * DIRECT[lid].get('speed', 1.0) * m, 3)); write(LAB / 'takes' / e['id'] / lid / f't{k}.wav', LINES[lid], y, w)


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
    if n < 1_000_000: return num_words(n // 1000) + ' thousand' + ('' if n % 1000 == 0 else ' ' + num_words(n % 1000))
    return str(n)


def spoken_number(s):                    # as said: years as years ("1977" → nineteen seventy seven)
    n = int(s)
    if len(s) == 4 and (1100 <= n <= 1999 or 2010 <= n <= 2099):
        hi, lo = divmod(n, 100)
        return num_words(hi) + ' ' + ('hundred' if lo == 0 else ('oh ' + ONES[lo] if lo < 10 else num_words(lo)))
    return num_words(n)


def ordinal(n):
    w = num_words(n).split(); last = w[-1]
    w[-1] = {'one': 'first', 'two': 'second', 'three': 'third', 'five': 'fifth', 'eight': 'eighth', 'nine': 'ninth', 'twelve': 'twelfth'}.get(last) \
        or (last[:-1] + 'ieth' if last.endswith('y') else last + 'th')
    return ' '.join(w)


def norm(s):
    if LANG != 'en':
        return re.sub(r'[।॥,.!?;:"“”‘’\'()–—-]+', ' ', s.lower()).split()
    s = re.sub(r'(?<=\d),(?=\d{3}\b)', '', s.lower().replace('%', ' percent'))                 # 10,000 → 10000
    s = re.sub(r'\$\s*(\d+(?:\.\d+)?)\s*(trillion|billion|million|thousand)?', lambda m: f" {m.group(1)} {m.group(2) or ''} dollars ", s)   # $51 billion → 51 billion dollars
    s = re.sub(r'(\d+)(st|nd|rd|th)\b', lambda m: ' ' + ordinal(int(m.group(1))) + ' ', s)      # 28th → twenty eighth
    s = re.sub(r'\d+', lambda m: ' ' + spoken_number(m.group()) + ' ', s)
    s = s.replace('-', ' ').replace("'", '').replace('’', '')
    w = re.sub(r'[^a-z ]+', ' ', s).split()
    for i in range(len(w) - 2):                    # a year read two ways: "two thousand eighteen" = "twenty eighteen" (2018)
        if w[i] == 'two' and w[i + 1] == 'thousand' and (w[i + 2] in ONES[10:] or w[i + 2] in TENS): w[i:i + 2] = ['twenty', '']
    w = [x for i, x in enumerate(w) if not (x == 'and' and i and w[i - 1] == 'hundred')]   # "four hundred and seventy" = "four hundred seventy"
    return [x for x in w if x]


def wer(ref, hyp):
    r, h = norm(ref), norm(hyp)
    d = list(range(len(h) + 1))
    for i in range(1, len(r) + 1):
        prev, d[0] = d[0], i
        for j in range(1, len(h) + 1):
            cur = min(d[j] + 1, d[j - 1] + 1, prev + (r[i - 1] != h[j - 1] and frozenset((r[i - 1], h[j - 1])) not in SAME_WORD))
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


# ---------------------------------------------------------------- ears 2 and 3
ASR2 = os.environ.get('VOICE_ASR2', 'large-v3') if LANG == 'en' else ''
PHONES = os.environ.get('VOICE_PHONES', 'facebook/wav2vec2-lv-60-espeak-cv-ft') if LANG == 'en' else ''
SAY = spec.get('say', {})            # word → the phonemes ear 3 should expect (espeak style, space-separated), for names


class Phones:
    """Ear 3: the sounds, phoneme by phoneme, against espeak-ng's phonemes for the script (or vo_script.json "say").
    Variants a listener would accept count as the same sound (flapped t/d, reduced vowels, length marks, r/ɹ);
    dropping or adding a reduced vowel, a glottal stop or an h costs 0.4. A word of 3+ phonemes is flagged when half
    its phonemes or more are wrong."""
    SAME = [set(s.split()) for s in ('t d ɾ ʔ', 'ə ɐ ɪ ᵻ ʌ ɨ', 'ɚ ɜː ɝ ɜ', 'i iː', 'u uː ʊ', 'ɑ ɑː ɒ a', 'ɔ ɔː',
                                     'oʊ əʊ o oː', 'eɪ e', 'l ɫ', 'ɹ r', 'n̩ n', 'l̩ l')]
    SOFT = set('ə ɐ ɪ ᵻ ʌ ɨ ʔ ɾ h'.split())

    @classmethod
    def load(cls):
        if not PHONES: return None
        try: return cls()
        except Exception as e:                    # the report says so; ears 1 and 2 still run
            print(f'::warning::ear 3 (phonemes) unavailable: {e!r}', flush=True); return None

    def __init__(self):
        import torch
        from transformers import Wav2Vec2FeatureExtractor, Wav2Vec2ForCTC, Wav2Vec2PhonemeCTCTokenizer
        from phonemizer.backend import EspeakBackend
        from phonemizer.separator import Separator
        self.torch = torch
        self.tok = Wav2Vec2PhonemeCTCTokenizer.from_pretrained(PHONES, do_phonemize=False)
        self.fe = Wav2Vec2FeatureExtractor.from_pretrained(PHONES)
        self.net = Wav2Vec2ForCTC.from_pretrained(PHONES).eval()
        self.esp = EspeakBackend('en-us', language_switch='remove-flags')
        self.sep = Separator(phone=' ', word='', syllable='')
        self.cls = {p: i for i, s in enumerate(self.SAME) for p in s}

    def sub(self, a, b): return 0.0 if a == b or (a in self.cls and self.cls.get(a) == self.cls.get(b)) else 1.0
    def gap(self, p): return 0.4 if p in self.SOFT else 1.0

    def heard(self, y16):
        x = self.fe(y16, sampling_rate=16000, return_tensors='pt').input_values
        with self.torch.no_grad(): ids = self.net(x).logits.argmax(-1)[0]
        return [p for p in self.tok.decode(ids).split() if p != '|' and not p.startswith('<')]

    def expected(self, text):
        words = re.findall(r"[A-Za-z][A-Za-z'’-]*|\d+", text)
        spoken = [re.sub(r'\d+', lambda m: num_words(int(m.group())), w).replace('-', ' ') for w in words]
        ph = self.esp.phonemize(spoken, separator=self.sep, strip=True, njobs=1)
        return words, [(SAY.get(w.lower().strip("'’")) or p).split() for w, p in zip(words, ph)]

    def check(self, y16, text):
        """(flagged words 'word: /expected/ → /heard/', phoneme error rate % of the line, heard phonemes)"""
        words, exp = self.expected(text)
        E = [(p, k) for k, ps in enumerate(exp) for p in ps]
        H = self.heard(y16)
        n, m = len(E), len(H)
        D = np.zeros((n + 1, m + 1)); B = np.zeros((n + 1, m + 1), np.int8)
        for i in range(1, n + 1): D[i, 0] = D[i - 1, 0] + self.gap(E[i - 1][0]); B[i, 0] = 1
        for j in range(1, m + 1): D[0, j] = D[0, j - 1] + self.gap(H[j - 1]); B[0, j] = 2
        for i in range(1, n + 1):
            for j in range(1, m + 1):
                c = (D[i - 1, j - 1] + self.sub(E[i - 1][0], H[j - 1]), D[i - 1, j] + self.gap(E[i - 1][0]), D[i, j - 1] + self.gap(H[j - 1]))
                k = int(np.argmin(c)); D[i, j] = c[k]; B[i, j] = k
        cost, got = [0.0] * len(words), [[] for _ in words]
        i, j = n, m
        while i > 0 or j > 0:                     # walk back: each sound's cost goes to the word it belongs to
            k = B[i, j] if i > 0 and j > 0 else (1 if i > 0 else 2)
            if k == 0: w = E[i - 1][1]; cost[w] += self.sub(E[i - 1][0], H[j - 1]); got[w].append(H[j - 1]); i -= 1; j -= 1
            elif k == 1: w = E[i - 1][1]; cost[w] += self.gap(E[i - 1][0]); i -= 1
            else: w = E[i - 1][1] if i > 0 else 0; cost[w] += self.gap(H[j - 1]); got[w].append(H[j - 1]); j -= 1
        flags = [f"{words[k]}: /{' '.join(ps)}/ → /{' '.join(reversed(got[k]))}/" for k, ps in enumerate(exp)
                 if len(ps) >= 3 and cost[k] / len(ps) >= 0.5]
        return flags, round(100 * sum(cost) / max(1, len(E)), 1), ' '.join(H)


def whisper2():
    if not ASR2: return None
    from faster_whisper import WhisperModel
    return WhisperModel(ASR2, device='cpu', compute_type='int8')


# the same word written another way: "a hundred" is written "100" (one hundred); British and American spellings;
# homophones no ear can tell apart (braking / breaking)
SAME_WORD = {frozenset(p) for p in (('a', 'one'), ('braking', 'breaking'), ('metre', 'meter'), ('metres', 'meters'), ('favourite', 'favorite'),
                                    ('favourites', 'favorites'), ('colour', 'color'), ('centre', 'center'), ('centres', 'centers'), ('neighbour', 'neighbor'))}


def align_words(exp, hyp):
    """exp: [(token, display word index)], hyp: [(token, probability)] → ({missed display word index: what was heard
    there}, [indices of words heard right but with probability < 0.5]). Two tokens may match one written together
    ("north west" / "northwest", "up surges" / "upsurges")."""
    n, m = len(exp), len(hyp)
    eq = lambda a, b: a == b or frozenset((a, b)) in SAME_WORD
    D = np.zeros((n + 1, m + 1)); D[:, 0] = np.arange(n + 1); D[0, :] = np.arange(m + 1)
    B = np.zeros((n + 1, m + 1), np.int8); B[1:, 0] = 1; B[0, 1:] = 2
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            c = [D[i - 1, j - 1] + (0 if eq(exp[i - 1][0], hyp[j - 1][0]) else 1), D[i - 1, j] + 1, D[i, j - 1] + 1, 1e9, 1e9]
            if i > 1 and exp[i - 2][0] + exp[i - 1][0] == hyp[j - 1][0]: c[3] = D[i - 2, j - 1]
            if j > 1 and hyp[j - 2][0] + hyp[j - 1][0] == exp[i - 1][0]: c[4] = D[i - 1, j - 2]
            k = int(np.argmin(c)); D[i, j] = c[k]; B[i, j] = k
    bad, heard, low = set(), {}, set()
    i, j = n, m
    while i > 0 or j > 0:
        k = B[i, j]
        if k == 0:
            w = exp[i - 1][1]
            if not eq(exp[i - 1][0], hyp[j - 1][0]): bad.add(w); heard.setdefault(w, []).append(hyp[j - 1][0])
            elif hyp[j - 1][1] < 0.5: low.add(w)
            i -= 1; j -= 1
        elif k == 1: bad.add(exp[i - 1][1]); i -= 1
        elif k == 2:
            w = exp[i - 1][1] if i > 0 else 0; heard.setdefault(w, []).append(hyp[j - 1][0]); j -= 1
            if i > 0: bad.add(w)
        elif k == 3: i -= 2; j -= 1
        else: i -= 1; j -= 2
    return {k: ' '.join(reversed(heard.get(k, []))) or '∅' for k in sorted(bad)}, sorted(low - bad)


def merge_money(hw):
    """[(word, probability)] with "$475" + "billion" joined into one word, so norm reads it as 475 billion dollars"""
    out = []
    for word, pr in hw:
        if out and out[-1][0].strip().startswith('$') and word.strip().lower().strip('.,!?;:') in ('trillion', 'billion', 'million', 'thousand'):
            out[-1] = (out[-1][0].strip() + ' ' + word.strip(), min(out[-1][1], pr))
        else:
            out.append((word, pr))
    return out


def pink(n, seed=13):
    r = np.random.default_rng(seed); X = np.fft.rfft(r.standard_normal(n)); f = np.arange(len(X)); f[0] = 1
    return np.fft.irfft(X / np.sqrt(f), n).astype(np.float32)


def check(audio):
    """The words in the finished mix: each word of film/words.js must be heard by ears 1 and 2 as mixed, through a
    phone speaker and in a noisy room; ear 3 checks the sounds line by line. A word the takes' report heard right but
    the mix loses is masked: change the sound under it, not the voice."""
    import librosa, torch
    from faster_whisper import WhisperModel
    from scipy import signal
    torch.set_num_threads(os.cpu_count() or 4)
    W = json.loads(re.search(r'window\.WORDS\s*=\s*(\[.*\]);', Path('film/words.js').read_text(encoding='utf-8'), re.S).group(1))
    y, sr = sf.read(audio, dtype='float32')
    x = librosa.resample(y.mean(1) if y.ndim > 1 else y, orig_sr=sr, target_sr=16000).astype(np.float32)
    hop = 320; rms = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) for i in range(0, len(x) - hop, hop)])
    act = float(np.sqrt(np.mean(rms[rms > rms.max() * 0.03] ** 2)))
    ph_ = signal.sosfilt(signal.butter(4, [300, 7000], 'band', fs=16000, output='sos'), x)
    ph_ = (np.tanh(ph_ / (np.abs(ph_).max() + 1e-9) * 2.0) * 0.5).astype(np.float32)          # a small speaker, driven
    pn = pink(len(x)); pn *= act * 10 ** (-12 / 20) / (np.sqrt(np.mean(pn ** 2)) + 1e-12)
    conds = {'as mixed': x, 'phone speaker': ph_, 'noisy room': (x + pn).astype(np.float32)}
    ears = [('whisper small.en', WhisperModel('small.en', device='cpu', compute_type='int8'))]
    if ASR2: ears.append((f'whisper {ASR2}', whisper2()))
    exp = [(tok, k) for k, w in enumerate(W) for tok in norm(w['w'])]
    for i in range(len(exp) - 2):                 # the year rule across placed words too: "two thousand eighteen" = "twenty eighteen"
        if exp[i][0] == 'two' and exp[i + 1][0] == 'thousand' and (exp[i + 2][0] in ONES[10:] or exp[i + 2][0] in TENS): exp[i], exp[i + 1] = ('twenty', exp[i][1]), ('', exp[i + 1][1])
    exp = [e for i, e in enumerate(exp) if e[0] and not (e[0] == 'and' and i and exp[i - 1][0] == 'hundred')]   # "hundred and" read either way
    end = max(w['t1'] for w in W) + 1.0          # past the last placed word: the end card's music, where Whisper signs off
    out = LAB / 'check'; out.mkdir(parents=True, exist_ok=True)   # ("thanks for watching"); aligned, it would blame the last word
    rows = []
    for cname, sig in conds.items():
        for ename, m in ears:
            segs = list(m.transcribe(sig, beam_size=5, language='en', word_timestamps=True, condition_on_previous_text=False)[0])
            hw = [(w.word, w.probability) for s in segs for w in (s.words or []) if w.start <= end]
            after = ' '.join(w.word.strip() for s in segs for w in (s.words or []) if w.start > end)
            hw = merge_money(hw)
            hyp = [(tok, pr) for word, pr in hw for tok in norm(word)]
            hyp = [h for i, h in enumerate(hyp) if not (i and h[0] == hyp[i - 1][0] and h[1] < 0.3)]   # Whisper's unsure echo of the word before ("stopped. stopped." in a silence)
            miss, low = align_words(exp, hyp)
            rows.append({'condition': cname, 'ear': ename, 'words': len(W), 'missed': [{'line': W[k]['p'], 't': W[k]['t0'], 'word': W[k]['w'], 'heard': h} for k, h in miss.items()],
                         'unsure': [{'line': W[k]['p'], 't': W[k]['t0'], 'word': W[k]['w']} for k in low], 'after': after,
                         'text': [{'t0': round(w.start, 2), 'w': w.word.strip(), 'p': round(w.probability, 2)} for s in segs for w in (s.words or [])]})   # what the ear wrote, word by word
            print(f"{cname:14s} {ename:22s} {len(W) - len(miss)}/{len(W)} words heard; missed: " + (', '.join(f"{W[k]['w']}@{W[k]['t0']:.1f}→{h}" for k, h in miss.items()) or 'none'), flush=True)
    ph = Phones.load(); lines = []
    if ph:
        for lid in dict.fromkeys(w['p'] for w in W):
            ws = [w for w in W if w['p'] == lid]
            a, b = int(max(0, ws[0]['t0'] - 0.12) * 16000), int((ws[-1]['t1'] + 0.12) * 16000)
            flags, per, heard = ph.check(x[a:b], ' '.join(w['w'] for w in ws))
            lines.append({'line': lid, 'per': per, 'flags': flags, 'heard': heard})
            print(f'{lid} phonemes {per:4.1f}% off  ' + ('; '.join(flags) or 'clean'), flush=True)
    (out / 'report.json').write_text(json.dumps({'audio': audio, 'rows': rows, 'phonemes': lines}, indent=1, ensure_ascii=False), encoding='utf-8')
    md = [f'# Voice check: {audio}', '', f'{len(W)} words placed (film/words.js). Ears 1 and 2 on the whole mix, three ways; ear 3 (phonemes) per line, as mixed.', '',
          '| condition | ear | heard | missed (word @ s → heard) | unsure (p < 0.5) |', '|---|---|---|---|---|']
    md += [f"| {r['condition']} | {r['ear']} | {r['words'] - len(r['missed'])}/{r['words']} | " + (', '.join(f"{x['word']} @{x['t']:.1f} → {x['heard']}" for x in r['missed']) or '—') +
           ' | ' + (', '.join(f"{x['word']} @{x['t']:.1f}" for x in r['unsure']) or '—') + ' |' for r in rows]
    if any(r['after'] for r in rows):
        md += ['', f'Written after the narration (from {end:.1f} s; no voice there, not scored): ' + '; '.join(f"{r['condition']}, {r['ear']}: \"{r['after']}\"" for r in rows if r['after'])]
    if lines:
        md += ['', '| line | phonemes off % | flagged words (/expected/ → /heard/) |', '|---|---|---|']
        md += [f"| {l['line']} | {l['per']} | {'; '.join(l['flags']) or '—'} |" for l in lines]
    elif PHONES: md += ['', 'Ear 3 could not load (see the log).']
    (out / 'report.md').write_text('\n'.join(md) + '\n', encoding='utf-8')
    print('\n'.join(md))


def score(task):
    import librosa, torch
    from faster_whisper import WhisperModel
    torch.set_num_threads(os.cpu_count() or 4)
    mos = torch.hub.load('tarepan/SpeechMOS:v1.2.0', 'utmos22_strong', trust_repo=True).eval()
    asr = WhisperModel('small.en' if LANG == 'en' else 'small', device='cpu', compute_type='int8')
    asr2, ph = whisper2(), Phones.load()
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
        extra = {'errors2': 0, 'heard2': '', 'unsure': [], 'phones': [], 'per': None, 'heard_ph': ''}
        if asr2:                                                                   # ear 2: a second, bigger Whisper
            s2 = list(asr2.transcribe(str(p), beam_size=5, language=LANG, word_timestamps=True, condition_on_previous_text=False)[0])
            extra['heard2'] = ' '.join(s.text.strip() for s in s2); extra['errors2'] = wer(LINES[lid], extra['heard2'])[0]
            extra['unsure'] = [w.word.strip() for s in s2 for w in (s.words or []) if w.probability < 0.5]
        if ph:                                                                     # ear 3: the sounds
            extra['phones'], extra['per'], extra['heard_ph'] = ph.check(y16.astype(np.float32), LINES[lid])
        rows.append({'who': who, 'line': lid, 'file': str(p), 'mos': round(m, 3), 'errors': errs, 'words': n, 'heard': hyp,
                     'dur': round(len(y) / sr, 2), 'wps': round(len(norm(LINES[lid])) / max(span, 0.3), 2),
                     'f0_hz': round(float(p50), 1), 'f0_range_st': round(float(rng), 1),
                     'creak': round(creak, 1), 'jumps': jumps, 'damage': round(creak + 5 * jumps, 1), **extra})
        print(f"{who:16s} {lid:5s} MOS {m:4.2f}  err {errs}+{extra['errors2']}/{n}  sounds {len(extra['phones'])} ({extra['per']}%)  creak {creak:4.1f}% jumps {jumps}  {rows[-1]['wps']:4.2f} w/s  | {hyp}"
              + (f"  | {ASR2}: {extra['heard2']}" if asr2 and norm(extra['heard2']) != norm(hyp) else '') + (f"  | {'; '.join(extra['phones'])}" if extra['phones'] else ''), flush=True)
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
        # the best take: no word errors by either Whisper, then not cracked, then the fewest wrong sounds, then the least
        # damage, then MOS
        rank = lambda r: (r['errors'] + r.get('errors2', 0), r['damage'] > 3, len(r.get('phones') or []), r['damage'], -r['mos'])
        md[2:2] = [f"err = word errors by ear 1 (Whisper small.en) + ear 2 (Whisper {ASR2 or 'off'}); sounds = words ear 3 (phonemes) flagged, "
                   f"and its phoneme error rate for the line (lower is cleaner). {'Ear 3 could not load (see the log).' if PHONES and not ph else ''}"]
        md += ['| voice | mean MOS of best takes | lines with errors | cracked lines (creak > 3 % or a pitch break) | lines with a flagged sound | speaking time s |', '|---|---|---|---|---|---|']
        for vc in voices:
            bl = {}
            for lid in LINES:
                v = sorted([r for r in rows if r['line'] == lid and r['who'].startswith(vc + '/')], key=rank)
                if v: bl[lid] = v[0]
            best[vc] = {lid: r['who'].split('/')[1] for lid, r in bl.items()}
            md += [f"| {vc} | {np.mean([r['mos'] for r in bl.values()]):.2f} | {sum(1 for r in bl.values() if r['errors'] + r.get('errors2', 0))} | {sum(1 for r in bl.values() if r['damage'] > 3)} | "
                   f"{sum(1 for r in bl.values() if r.get('phones'))} | {sum(r['dur'] for r in bl.values()):.1f} |"]
        md += ['', '| line | take | MOS | err | sounds | creak % | pitch breaks | w/s | heard |', '|---|---|---|---|---|---|---|---|---|']
        for lid in LINES:
            v = sorted([r for r in rows if r['line'] == lid], key=lambda r: (r['who'].split('/')[0], rank(r)))
            md += [f"| {lid} | {r['who']}{' ★' if best.get(r['who'].split('/')[0], {}).get(lid) == r['who'].split('/')[1] else ''} | {r['mos']:.2f} | {r['errors']}+{r.get('errors2', 0)}/{r['words']} | "
                   f"{len(r.get('phones') or [])} ({r.get('per')}%) | {r['creak']} | {r['jumps']} | {r['wps']:.2f} | {r['heard']}"
                   + (f" · *{ASR2}:* {r['heard2']}" if r.get('heard2') and norm(r['heard2']) != norm(r['heard']) else '')
                   + (f" · **sounds:** {'; '.join(r['phones'])}" if r.get('phones') else '') + (f" · unsure: {', '.join(r['unsure'])}" if r.get('unsure') else '') + ' |' for r in v]
        (root / 'best.json').write_text(json.dumps(best, indent=1), encoding='utf-8')
        pm = ['# What Kokoro was told to say', '', "Every word's phonemes from misaki (Kokoro's G2P), per line, from the first take. Read them before listening: a wrong phoneme here is said wrong in every take.", '']
        for lid in LINES:
            f = next((q for q in sorted(root.rglob(f'{lid}/t1.words.json'))), None)
            if not f: continue
            ws = json.loads(f.read_text(encoding='utf-8')).get('words', [])
            if any(w.get('ph') for w in ws): pm += [f"- **{lid}** " + ' '.join(f"{w['w']} /{w['ph']}/" for w in ws if w.get('ph'))]
        if len(pm) > 4: (root / 'phonemes.md').write_text('\n'.join(pm) + '\n', encoding='utf-8')
    (root / 'report.md').write_text('\n'.join(md) + '\n', encoding='utf-8')
    print('\n'.join(md))


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'): sys.stdout.reconfigure(encoding='utf-8', errors='replace')   # Windows consoles
    ap = argparse.ArgumentParser()
    ap.add_argument('cmd', choices=['gen', 'score', 'check'])
    ap.add_argument('--engine', choices=['kokoro', 'chatterbox'])
    ap.add_argument('--task', choices=['cast', 'takes'])
    ap.add_argument('--takes', type=int, default=3)
    ap.add_argument('--shard', default='')
    ap.add_argument('--audio', default='audio/mix.wav')
    a = ap.parse_args()
    if a.cmd == 'check': check(a.audio)
    elif not a.task: sys.exit('gen and score need --task')
    elif a.cmd == 'score': score(a.task)
    elif a.engine == 'kokoro': gen_kokoro(a.task, a.takes, a.shard)
    elif a.engine == 'chatterbox': gen_chatterbox(a.task, a.takes, a.shard)
    else: sys.exit('gen needs --engine')
