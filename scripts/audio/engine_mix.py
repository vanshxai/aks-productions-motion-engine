"""
Motion Engine audio mixer: synthesized score + real SFX, placed on exact frames.
Import from a project cue file (see src/projects/abwab/soundtrack.py).

  from engine_mix import Mix
  m = Mix(seconds=60, fps=30, sfx_dir="public/sfx")
  m.music(drums_on=[(322, 1292), (1326, 1672)], soft=[(100, 322)], arp_on=[(150, 1672)])
  m.sfx("boom", 322, 0.8)          # peak of the sample lands on frame 322
  m.save("public/projects/acme/soundtrack.wav")

Free-audio rule: only copyright-free / commercial-use SFX and music. To use a downloaded music track
instead of the synth score: m.track("public/music/track.wav", gain=0.6) and skip m.music().
"""
import numpy as np, wave, os
from scipy.signal import lfilter

# where each bundled SFX peaks (seconds) — used so the hit lands on the cue frame
PEAK = {"click": .05, "boom": .54, "whoosh": .83, "swoosh1": .43, "swoosh2": .62, "tap": .15, "notif": .13, "pop": .13}

def note(m): return 440 * 2 ** ((m - 69) / 12)

class Mix:
    def __init__(self, seconds=60, fps=30, sr=48000, sfx_dir="public/sfx", seed=11):
        self.SR, self.FPS, self.N = sr, fps, int(sr * seconds)
        self.L = np.zeros(self.N); self.R = np.zeros(self.N)
        self.rng = np.random.default_rng(seed)
        self.S, self.peak = {}, {}
        for f in os.listdir(sfx_dir):
            if f.endswith(".wav"):
                a = self._load(os.path.join(sfx_dir, f)); self.S[f[:-4]] = a
                env = np.abs(a[:, 0]); w = 480
                blocks = [env[i:i + w].max() for i in range(0, min(len(env), sr * 3), w)]
                self.peak[f[:-4]] = PEAK.get(f[:-4], float(np.argmax(blocks)) * w / sr)

    # ── helpers ──
    def T(self, fr): return int(round(fr / self.FPS * self.SR))
    def _load(self, p):
        w = wave.open(p); ch = w.getnchannels()
        a = np.frombuffer(w.readframes(w.getnframes()), "<i2").reshape(-1, ch).astype(float) / 32768
        if ch == 1: a = np.repeat(a, 2, 1)
        return a / max(1e-9, np.abs(a).max()) * 0.9
    def lp(self, x, c): return lfilter([c], [1, -(1 - c)], x)
    def hp(self, x, c): return x - self.lp(x, c)
    def _put(self, st, fr, g, peak=0.0):
        s = max(0, self.T(fr) - int(peak * self.SR)); e = min(self.N, s + len(st))
        self.L[s:e] += st[: e - s, 0] * g; self.R[s:e] += st[: e - s, 1] * g
    def mono(self, sig, fr, g, pan=0.0):
        s = self.T(fr); e = min(self.N, s + len(sig))
        self.L[s:e] += sig[: e - s] * g * (1 - pan * .5); self.R[s:e] += sig[: e - s] * g * (1 + pan * .5)

    # ── SFX ──
    def sfx(self, name, fr, g=0.3, max_s=None):
        """Place an SFX so its peak (auto-detected for new files) hits frame `fr`. max_s trims long files."""
        a = self.S[name]
        if max_s: a = a[: int(max_s * self.SR)].copy(); k = min(2400, len(a)); a[-k:] *= np.linspace(1, 0, k)[:, None]
        self._put(a, fr, g, self.peak.get(name, 0))
    def typing(self, fr, dur_frames, src_s=1.0, g=0.45):
        a = self.S["typing"][int(src_s * self.SR): int(src_s * self.SR) + self.T(dur_frames)].copy()
        f = np.linspace(1, 0, min(2400, len(a))); a[-len(f):] *= f[:, None]; self._put(a, fr, g)
    def riser(self, sec):
        n = int(sec * self.SR); tt = np.arange(n) / self.SR; x = self.lp(self.rng.standard_normal(n), .08)
        return (np.sin(2 * np.pi * np.cumsum(200 + 900 * (tt / sec) ** 2) / self.SR) * .3 + x * 1.5) * (tt / sec) ** 2
    def chime(self, ms, sec=1.6):
        n = int(sec * self.SR); tt = np.arange(n) / self.SR; y = np.zeros(n)
        for j, m in enumerate(ms):
            d = int(j * .06 * self.SR); tj = tt[: n - d]
            y[d:] += (np.sin(2 * np.pi * note(m) * tj) + .25 * np.sin(2 * np.pi * note(m) * 3 * tj)) * np.exp(-tj * 4)
        return y
    def sweep(self, sec, f0, f1):
        n = int(sec * self.SR); tt = np.arange(n) / self.SR
        return np.sin(2 * np.pi * np.cumsum(f0 + (f1 - f0) * tt / sec) / self.SR) * np.sin(np.pi * tt / sec)

    # ── music ──
    def music(self, drums_on, soft=(), arp_on=None, bpm=120, prog=None, final_chord=None, level=0.045):
        """Synth score: pad chords every 2 bars, kick+hat inside drums_on ranges, soft hats in `soft`, pluck arp."""
        FPS, SR, N = self.FPS, self.SR, self.N
        beat = FPS * 60 / bpm
        prog = prog or [[57, 60, 64], [53, 57, 60], [48, 52, 55, 60], [55, 59, 62]]
        chord_f = int(beat * 4)
        inr = lambda fr, rs: any(a <= fr < b for a, b in rs)
        pad = np.zeros(N); tt2 = np.arange(int(SR * chord_f / FPS * 1.3)) / SR
        nch = int(N / SR * FPS / chord_f) + 1
        for ci in range(nch):
            ch = (final_chord if (final_chord and ci == nch - 1) else prog[ci % len(prog)])
            s = self.T(ci * chord_f); n = min(N - s, len(tt2))
            if n <= 0: continue
            tt = tt2[:n]; seg = np.zeros(n); L = tt2[-1]
            for m in ch:
                for det in (-.1, .1):
                    fq = note(m) * 2 ** (det / 12)
                    for h in range(1, 6): seg += np.sin(2 * np.pi * fq * h * tt + h) * (.5 / h)
            seg *= np.minimum(1, tt / .35) * np.minimum(1, np.maximum(0, (L - tt) / .6)); pad[s:s + n] += seg
        pad = self.lp(pad, .04) * level
        kt = np.arange(int(.35 * SR)) / SR; kick = np.sin(2 * np.pi * np.cumsum(45 + 90 * np.exp(-kt * 28)) / SR) * np.exp(-kt * 9)
        hat = self.hp(self.rng.standard_normal(int(.05 * SR)), .5) * np.exp(-np.arange(int(.05 * SR)) / 500)
        duck = np.ones(N)
        fr = 0.0
        while fr < N / SR * FPS:
            if inr(fr, drums_on):
                self.mono(kick, fr, .5); s = self.T(fr); d = np.minimum(1, .35 + np.arange(int(.3 * SR)) / (.3 * SR)); e = min(N, s + len(d)); duck[s:e] = np.minimum(duck[s:e], d[: e - s])
                self.mono(hat, fr + beat / 2, .11, .3)
            elif inr(fr, soft): self.mono(hat, fr + beat / 2, .07, .3)
            fr += beat
        arp = [[69, 72, 76, 72], [65, 69, 72, 69], [60, 64, 67, 72], [67, 71, 74, 71]]
        k = 0; fr = 0.0
        while fr < N / SR * FPS:
            if inr(fr, arp_on or drums_on):
                m = arp[int(fr // chord_f) % 4][k % 4] + 12; n = int(.22 * SR); tt = np.arange(n) / SR
                self.mono((np.sin(2 * np.pi * note(m) * tt) + .3 * np.sin(2 * np.pi * note(m) * 2 * tt)) * np.exp(-tt * 16), fr, .065 if inr(fr, drums_on) else .04, .6 if k % 2 else -.6)
            k += 1; fr += beat / 2
        self.L += pad * duck; self.R += pad * duck

    def track(self, path, gain=0.6, fade_out_s=2.0):
        """Use a downloaded free-licence music file (wav) instead of the synth score."""
        a = self._load(path)[: self.N]; f = np.ones(len(a)); k = int(fade_out_s * self.SR)
        f[-k:] = np.linspace(1, 0, k); self._put(a * f[:, None], 0, gain)

    def track_edit(self, path, segments, gain=0.6, xfade_s=0.12):
        """Place a music file as edited segments: [(video_start_s, track_start_s, duration_s), ...].
        track_start_s may be negative (leading silence). Segments crossfade by xfade_s."""
        a = self._load(path); SR = self.SR
        for vs, ts, d in segments:
            n = int(d * SR); seg = np.zeros((n, 2))
            src0 = int(ts * SR)
            lo, hi = max(0, src0), min(len(a), src0 + n)
            if hi > lo: seg[lo - src0: hi - src0] = a[lo:hi]
            k = int(xfade_s * SR)
            if vs > 0: seg[:k] *= np.linspace(0, 1, k)[:, None]
            seg[-k:] *= np.linspace(1, 0, k)[:, None]
            s0 = int(vs * SR); e = min(self.N, s0 + n)
            self.L[s0:e] += seg[: e - s0, 0] * gain; self.R[s0:e] += seg[: e - s0, 1] * gain

    def save(self, out, fade_from_frame=None):
        if fade_from_frame is not None:
            s = self.T(fade_from_frame); f = np.ones(self.N); f[s:] = np.linspace(1, 0, self.N - s); self.L *= f; self.R *= f
        st = np.stack([self.L, self.R], 1); st = np.tanh(st * 1.3) / np.tanh(1.3); st /= np.abs(st).max() / .89
        os.makedirs(os.path.dirname(out), exist_ok=True)
        with wave.open(out, "wb") as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(self.SR); w.writeframes((st * 32767).astype("<i2").tobytes())
        print("wrote", out)
