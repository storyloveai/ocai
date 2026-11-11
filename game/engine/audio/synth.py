#!/usr/bin/env python3
"""StoryDate 环境音与音效库：全部用代码合成，不用任何外部录音，所以没有版权和授权问题。
用法：python3 game/engine/audio/synth.py [名字 ...]      # 不带名字就全部重新生成
输出：game/engine/audio/lib/<名字>.mp3（环境音是可无缝循环的立体声；音效是单次）
每本书在自己的 audio/cues.json 里按名字引用这些声音（见 game/engine/audio/README.md）。
随机数种子固定，同一份代码每次生成的结果一样。"""
import pathlib, subprocess, sys, tempfile, wave
import numpy as np
from scipy import signal

SR = 44100
OUT = pathlib.Path(__file__).resolve().parent / "lib"
LOOP = 40.0          # 环境音循环长度（秒）
XF = 3.0             # 首尾交叉淡化（秒），保证循环处听不出接缝

# ---------- 基本零件 ----------
def rng(name): return np.random.default_rng(sum(ord(c) * (i + 1) for i, c in enumerate(name)))
def T(sec): return int(sec * SR)
def white(r, n): return r.standard_normal(n)
def pink(r, n):
    f = np.fft.rfft(r.standard_normal(n)); k = np.arange(len(f)); k[0] = 1
    return np.fft.irfft(f / np.sqrt(k), n) * 30
def brown(r, n):
    x = np.cumsum(r.standard_normal(n)); x = sosf(x, "hp", 20); return x / (np.abs(x).max() + 1e-9)
def sos(kind, f, order=2):
    if kind == "bp": return signal.butter(order, [f[0], f[1]], "bandpass", fs=SR, output="sos")
    return signal.butter(order, f, {"lp": "lowpass", "hp": "highpass"}[kind], fs=SR, output="sos")
def sosf(x, kind, f, order=2): return signal.sosfilt(sos(kind, f, order), x)
def lfo(r, n, rate, depth=1.0, base=1.0):
    """平滑的随机起伏（多个慢正弦叠加），取值约在 base±depth"""
    t = np.arange(n) / SR; y = np.zeros(n)
    for _ in range(3): y += np.sin(2 * np.pi * rate * r.uniform(.5, 1.6) * t + r.uniform(0, 6.28))
    return base + depth * y / 3
def decay(n, tau): return np.exp(-np.arange(n) / (tau * SR))
def env(n, a, d):
    """a 秒起音、之后按 d 秒指数衰减"""
    e = decay(n, d); k = max(1, T(a)); e[:k] *= np.linspace(0, 1, k); return e
def sine(f, n, ph=0.0):
    f = np.broadcast_to(np.asarray(f, float), (n,)); return np.sin(2 * np.pi * np.cumsum(f) / SR + ph)
def partials(n, f0, ratios, decays, amps, r=None):
    y = np.zeros(n)
    for k, (q, d, a) in enumerate(zip(ratios, decays, amps)):
        y += a * sine(f0 * q * (1 + (r.uniform(-.002, .002) if r is not None else 0)), n, k) * decay(n, d)
    return y
def burst(r, n, lo, hi, tau, order=2):
    return sosf(white(r, n), "bp", (lo, min(hi, SR / 2 - 100)), order) * decay(n, tau)
def stereo(x, pan=0.0):
    """单声道放到立体声里，pan -1 左 … 1 右（等功率）"""
    a = (pan + 1) * np.pi / 4; return np.stack([x * np.cos(a), x * np.sin(a)])
def mix(dst, src, at, gain=1.0, pan=0.0):
    """把 src（单声道或立体声）叠到 dst（立体声）里的 at 秒处；超出末尾的部分绕回开头（给循环用）"""
    s = stereo(src, pan) if src.ndim == 1 else src
    i = T(at) % dst.shape[1]; n = s.shape[1]; L = dst.shape[1]
    while n > 0:
        m = min(n, L - i); dst[:, i:i + m] += gain * s[:, :m]; s = s[:, m:]; n -= m; i = 0
    return dst
def reverb(x, t60=1.5, wet=.3, lp=6000, seed=1, pre=.01):
    """合成的混响（指数衰减的噪声做冲激响应），左右声道用不同的噪声，听起来更宽"""
    r = np.random.default_rng(seed); n = T(t60 * 1.2)
    st = x if x.ndim == 2 else np.stack([x, x])
    out = []
    for ch in range(2):
        ir = sosf(r.standard_normal(n), "lp", lp) * np.exp(-6.9 * np.arange(n) / (t60 * SR))
        ir = np.concatenate([np.zeros(T(pre)), ir]); ir /= np.sqrt((ir ** 2).sum())
        out.append(signal.fftconvolve(st[ch], ir)[: st.shape[1]])
    return (1 - wet) * st + wet * np.stack(out) * .6
def loopify(x, xf=XF):
    """长度 LOOP+XF 的立体声 → 长度 LOOP 的可无缝循环片段（尾巴等功率淡入到开头）"""
    k = T(xf); L = x.shape[1] - k; y = x[:, :L].copy()
    t = np.linspace(0, np.pi / 2, k)
    y[:, :k] = x[:, :k] * np.sin(t) + x[:, L:L + k] * np.cos(t)
    return y
def fade(x, a=.005, b=.05):
    x = x.copy(); n = x.shape[-1]; ka, kb = max(1, T(a)), max(1, T(b))
    x[..., :ka] *= np.linspace(0, 1, ka); x[..., n - kb:] *= np.linspace(1, 0, kb); return x
def scatter(r, dst, rate, make, gain=(0.3, 1.0), pan=(-1, 1)):
    """按平均每秒 rate 次随机撒事件（make(r) 返回单声道片段）"""
    t = 0.0; L = dst.shape[1] / SR
    while True:
        t += r.exponential(1 / rate)
        if t >= L: return dst
        mix(dst, make(r), t, r.uniform(*gain), r.uniform(*pan))

# ---------- 声音零件 ----------
def drop(r):            # 雨点打在地上
    n = T(.012); return burst(r, n, r.uniform(1500, 3000), r.uniform(6000, 12000), r.uniform(.001, .004))
def plip(r, f=None):    # 水滴落进水里：短促、音高往下滑
    n = T(.12); f0 = f or r.uniform(900, 2400)
    return sine(f0 * (1 + 1.2 * decay(n, .01)), n) * env(n, .001, .025) * .7
def crackle(r):         # 柴火噼啪
    n = T(.03); return burst(r, n, r.uniform(800, 2000), r.uniform(5000, 11000), r.uniform(.002, .008)) * min(r.pareto(2.5) + .3, 2.5)
def hoof(r, soft=1.0):  # 马蹄踩在石板路上
    n = T(.12); thud = sine(r.uniform(110, 170) * (1 + decay(n, .01)), n) * decay(n, .03)
    clack = burst(r, n, 600, 3500, .012)
    return (thud * .6 + clack * soft) * r.uniform(.7, 1)
def tick(r, f0=2400, lo=1.0):
    n = T(.08); return (partials(n, f0, [1, 1.47, 2.3, 3.4], [.012, .009, .006, .004], [1, .6, .4, .25], r) + burst(r, n, 3000, 9000, .002) * .5) * lo
def creak(r, dur=None):  # 金属或木头吱呀：频率慢慢变的脉冲串
    dur = dur or r.uniform(.5, 1.3); n = T(dur); t = np.arange(n) / SR
    rate = r.uniform(25, 60) * (1 + .5 * np.sin(2 * np.pi * r.uniform(.4, 1.2) * t + r.uniform(0, 6)))
    ph = np.cumsum(rate) / SR; pulses = (np.diff(np.floor(ph), prepend=0) > 0).astype(float)
    y = sosf(pulses + .02 * white(r, n), "bp", (r.uniform(500, 900), r.uniform(1800, 3000)), 3)
    return y * np.sin(np.pi * t / dur) ** .7 * 4
def bubble(r):
    n = T(.05); f0 = r.uniform(350, 900)
    return sine(f0 * (1 + 2.5 * (np.arange(n) / n)), n) * env(n, .002, .012) * .5
def clink(r, f0=None):  # 玻璃轻碰
    n = T(.6); f0 = f0 or r.uniform(2200, 3400)
    return partials(n, f0, [1, 1.62, 2.71, 3.9], [.25, .16, .09, .05], [1, .5, .3, .2], r) * .4
def bell(r, f0, n=None, strike=1.0):  # 教堂钟：hum/prime/tierce/quint/nominal 等泛音
    n = n or T(7)
    y = partials(n, f0, [.5, 1, 1.19, 1.5, 2, 2.52, 3, 4.15, 5.4], [4, 2.8, 2.2, 1.6, 1.4, .9, .7, .45, .3], [.5, .9, .5, .35, .7, .25, .2, .12, .08], r)
    return y + burst(r, n, 1500, 8000, .006) * .3 * strike
def chirp(r, f0=4600):  # 一声蟋蟀
    n = T(.18); t = np.arange(n) / SR
    am = (np.sin(2 * np.pi * 3 / .18 * t) > 0.2) * 1.0
    return sine(f0, n) * sosf(am, "lp", 300) * .3
def babble(r, n):       # 隔着墙的人声嘈杂：带共振峰的噪声，按音节节奏起伏，再滤得很闷
    y = np.zeros(n)
    for _ in range(6):
        src = sosf(white(r, n), "bp", (r.uniform(250, 450), r.uniform(700, 1200)), 2)
        syl = np.clip(lfo(r, n, r.uniform(3, 5), 1, .3), 0, None) * np.clip(lfo(r, n, .15, 1, .2), 0, None)
        y += src * syl
    return sosf(y, "lp", 900, 3)
def whoosh(r, dur, lo=300, hi=3000):
    n = T(dur); t = np.linspace(0, 1, n)
    y = np.zeros(n); seg = 512
    x = white(r, n)
    for i in range(0, n, seg):   # 分段改变带通中心频率，做出扫频
        c = lo * (hi / lo) ** np.sin(np.pi * t[i]) ** 2
        y[i:i + seg] = sosf(x[max(0, i - 2048):i + seg], "bp", (c * .7, min(c * 1.4, SR / 2 - 100)))[-(min(seg, n - i)):]
    return y * np.sin(np.pi * t) ** 1.5

# ---------- 环境音（可循环） ----------
AMB = {}
def amb(f): AMB[f.__name__] = f; return f
def base(): return np.zeros((2, T(LOOP + XF)))
def bed(r, n, kind, f, gain=1.0, mod=(.07, .25)):
    """两声道互不相关的底噪"""
    return np.stack([sosf(pink(r, n), kind, f, 2) * lfo(r, n, mod[0], mod[1]) for _ in range(2)]) * gain

@amb
def rain(r, x=None):
    x = base(); n = x.shape[1]
    x += bed(r, n, "bp", (400, 9000), .25)
    scatter(r, x, 400, drop, (.05, .25))
    scatter(r, x, 4, plip, (.05, .15))
    return reverb(x, .8, .2)
@amb
def rain_in(r):          # 屋里听雨：窗外的雨很闷，偶尔有雨点敲窗
    x = rain(r); x = np.stack([sosf(c, "lp", 1400, 3) for c in x]) * .8
    scatter(r, x, 6, lambda r: burst(r, T(.03), 900, 3000, .004), (.03, .1))
    return reverb(x, .5, .25)
@amb
def sea(r):
    x = base(); n = x.shape[1]; t = 0.0
    x += bed(r, n, "lp", 300, .15)
    while t < LOOP + XF:
        per = r.uniform(6, 10); m = T(per); tt = np.linspace(0, 1, m)
        swell = np.where(tt < .35, (tt / .35) ** 2, np.exp(-(tt - .35) * 6))
        wave_ = sosf(pink(r, m), "bp", (150, 3500)) * swell + sosf(white(r, m), "hp", 3000) * np.clip(np.where(tt > .35, np.exp(-(tt - .35) * 4), 0), 0, 1) * .08
        mix(x, wave_, t, r.uniform(.5, .8), r.uniform(-.5, .5)); t += per * r.uniform(.6, .9)
    return reverb(x, 1.2, .2)
@amb
def harbor(r):           # 港口：海浪轻拍、缆绳吱呀、远处浮标的钟
    x = sea(r) * .6; n = x.shape[1]
    scatter(r, x, .25, creak, (.08, .18))
    for t in (5, 21, 33): mix(x, sosf(bell(r, 520, T(5), .3), "lp", 2500), t, .05, r.uniform(-.6, .6))
    return reverb(x, 2, .2)
@amb
def wind(r):
    x = base(); n = x.shape[1]
    for _ in range(5):
        c = r.uniform(250, 1500); band = sosf(pink(r, n), "bp", (c * .8, c * 1.25), 2) * np.clip(lfo(r, n, .08, 1, .3), 0, None) ** 2
        mix(x, band, 0, .35, r.uniform(-.8, .8))
    x += bed(r, n, "lp", 250, .3)
    return x
@amb
def fire(r):             # 壁炉
    x = base(); n = x.shape[1]
    x += bed(r, n, "lp", 280, .5, (.3, .4)) + bed(r, n, "hp", 3500, .02)
    rate = 18; t = 0.0
    while t < LOOP + XF:   # 噼啪是一阵一阵的
        t += r.exponential(1 / rate) * (3 if r.random() < .1 else 1)
        mix(x, crackle(r), t, r.uniform(.03, .12), r.uniform(-.4, .4))
    for t in r.uniform(0, LOOP, 5): mix(x, burst(r, T(.08), 400, 6000, .02), t, .5, r.uniform(-.3, .3))
    return reverb(x, .4, .15)
@amb
def clock_room(r):       # 安静的房间，座钟滴答（一秒两下，tick/tock 音高略不同）
    x = base(); n = x.shape[1]
    x += bed(r, n, "lp", 400, .03)
    for k in range(int((LOOP + XF) * 2)): mix(x, tick(r, 2300 if k % 2 else 2000, .6), k * .5, .25, .15)
    return reverb(x, .6, .3, 4000)
@amb
def parlour(r):          # 221B：炉火 + 座钟 + 窗外偶尔有马车走过
    x = fire(r) * .9 + clock_room(np.random.default_rng(5)) * .6
    mix(x, cab_pass(r, 9, far=True), 14, .35)
    return x
def cab_pass(r, dur=8, far=False):
    """一辆马车从一边走到另一边：小跑的马蹄 + 车轮在石子路上的隆隆声"""
    x = np.zeros((2, T(dur))); n = x.shape[1]; t = 0.0; tt = np.linspace(0, 1, n)
    loud = np.sin(np.pi * tt) ** 2; pan = np.linspace(-.9, .9, n)
    beat = 1 / r.uniform(2.4, 2.9)
    while t < dur - .2:
        for off in (0, .09):
            h = hoof(r); i = T(t + off); m = min(len(h), n - i)
            if m > 0: x[:, i:i + m] += stereo(h[:m] * loud[i], pan[i])
        t += beat
    wheels = sosf(brown(r, n), "bp", (60, 500)) * (1 + .5 * sosf(white(r, n), "lp", 30)) * loud * 2
    x += np.stack([wheels * (1 - pan) / 2, wheels * (1 + pan) / 2])
    if far: x = np.stack([sosf(c, "lp", 1800) for c in x])
    return x
@amb
def street_victorian(r):  # 维多利亚时代的伦敦街道：远处的嘈杂、马车来来往往
    x = base(); n = x.shape[1]
    x += bed(r, n, "lp", 600, .12) + np.stack([babble(r, n), babble(r, n)]) * .02
    for t, far in ((1, True), (12, False), (24, True), (31, True)): mix(x, cab_pass(r, r.uniform(7, 10), far), t, .5 if far else .9)
    return reverb(x, 1.5, .25)
def foghorn_(r, dur=3.2, f0=98):
    n = T(dur); t = np.arange(n) / SR
    f = f0 * (1 + .004 * np.sin(2 * np.pi * 5 * t))
    saw = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR) + .5 * signal.sawtooth(2 * np.pi * np.cumsum(f * 1.005) / SR)
    e = np.clip(np.minimum(t / .5, (dur - t) / .8), 0, 1)
    return sosf(saw, "lp", 500, 3) * e * .6
@amb
def fog(r):              # 雾夜：低低的风、滴水、远处泰晤士河上的汽笛
    x = wind(r) * .45; n = x.shape[1]
    x += bed(r, n, "lp", 900, .04)
    scatter(r, x, 1.2, plip, (.02, .06))
    mix(x, foghorn_(r), 6, .25, -.4); mix(x, foghorn_(r, 2.6, 92), 27, .2, .5)
    return reverb(x, 3, .35, 2500)
@amb
def lab(r):              # 化学实验室：煤气灯嘶嘶、试管里冒泡、偶尔玻璃轻碰
    x = base(); n = x.shape[1]
    x += bed(r, n, "bp", (2500, 9000), .02, (.05, .05)) + bed(r, n, "lp", 300, .04)
    t = 0.0
    while t < LOOP + XF:
        t += r.exponential(.7)
        for k in range(r.integers(3, 9)): mix(x, bubble(r), t + k * r.uniform(.04, .12), r.uniform(.1, .3), .3)
    scatter(r, x, .12, clink, (.05, .12))
    return reverb(x, 1.1, .3)
@amb
def cellar(r):           # 地下室：低沉的空腔声、滴水、偶尔木头响
    x = base(); n = x.shape[1]
    x += bed(r, n, "lp", 160, .35) + bed(r, n, "bp", (200, 700), .03)
    scatter(r, x, .7, lambda r: plip(r, r.uniform(700, 1400)), (.08, .2))
    scatter(r, x, .08, creak, (.03, .06))
    return reverb(x, 2.5, .45, 3000)
@amb
def city_night(r):       # 现代城市夜晚：远处车流、偶尔一辆车开过
    x = base(); n = x.shape[1]
    x += bed(r, n, "lp", 220, .4) + bed(r, n, "bp", (300, 1800), .05, (.04, .5))
    for t in (3, 11, 19, 26, 34):
        w = whoosh(r, r.uniform(3, 5), 150, 1800) * .25; mix(x, np.stack([w * np.linspace(1, .2, len(w)), w * np.linspace(.2, 1, len(w))]), t, 1)
    return reverb(x, 1.5, .2)
@amb
def bar_room(r):         # 酒吧：闷闷的人声、杯子碰撞
    x = base(); n = x.shape[1]
    x += np.stack([babble(r, n), babble(r, n)]) * .06 + bed(r, n, "lp", 150, .1)
    scatter(r, x, .5, clink, (.04, .1))
    return reverb(x, .9, .35)
@amb
def tunnel(r):           # 废弃地铁隧道：很低的轰鸣、金属的回响、滴水
    x = base(); n = x.shape[1]
    x += bed(r, n, "lp", 90, .6, (.05, .5))
    comb = np.zeros(n); src = sosf(pink(r, n), "bp", (200, 4000)) * .02
    for f in (175, 315, 490): b, a = signal.iircomb(f, 30, ftype="peak", fs=SR); comb += signal.lfilter(b, a, src)
    x += np.stack([comb, np.roll(comb, T(.3))]) * lfo(r, n, .05, .5, .6)
    scatter(r, x, .5, lambda r: plip(r, r.uniform(1200, 2200)), (.05, .12))
    return reverb(x, 3.5, .5, 2500)
@amb
def hospital(r):         # 急诊观察室：空调低鸣、监护仪的提示音
    x = base(); n = x.shape[1]
    x += bed(r, n, "lp", 1200, .04, (.02, .1)) + np.stack([sine(120, n), sine(120, n, 1)]) * .004
    beep = sine(880, T(.08)) * env(T(.08), .005, .05) * .08
    for k in range(int((LOOP + XF) / 1.25)): mix(x, beep, k * 1.25, 1, .5)
    return reverb(x, .6, .3)
@amb
def park_dusk(r):        # 废弃乐园黄昏：风、生锈的铁架吱呀、偶尔风铃
    x = wind(r) * .5
    scatter(r, x, .18, lambda r: creak(r, r.uniform(1, 2)), (.06, .15))
    for t in r.uniform(0, LOOP, 4):
        for k in range(r.integers(2, 5)): mix(x, clink(r, r.uniform(1800, 3200)), t + k * r.uniform(.1, .3), .05, r.uniform(-.5, .5))
    return reverb(x, 2, .3)
@amb
def prairie(r):          # 北美荒原的夜：辽阔的风、零星的虫鸣
    x = wind(r) * .55
    for f, per in ((4400, 1.1), (4900, .83), (4100, 1.6)):
        t = r.uniform(0, 1); p = r.uniform(-.8, .8)
        while t < LOOP + XF: mix(x, chirp(r, f), t, .05, p); t += per * r.uniform(.95, 1.05)
    return reverb(x, 2.5, .25)
@amb
def ethereal(r):         # 提灯里面：没有来源的长音和细碎的光
    x = base(); n = x.shape[1]
    for f in (110, 164.8, 220, 277.2, 329.6):
        for d in (-.4, .4): mix(x, sine(f + d, n) * lfo(r, n, .05, .4, .6) * .05, 0, 1, d * 1.5)
    scatter(r, x, 1.5, lambda r: clink(r, r.uniform(3000, 6000)) * .5, (.02, .06))
    return reverb(x, 5, .6, 5000)

# ---------- 音效（单次） ----------
SFX = {}
def sfx(f): SFX[f.__name__] = f; return f
def out_len(sec): return T(sec)
@sfx
def bell_tower(r):       # 钟楼大钟敲一下
    return reverb(bell(r, 130, T(7)), 3, .4)
@sfx
def bell_toll(r):        # 钟楼连敲三下
    x = np.zeros((2, T(11)))
    for k in range(3): mix(x, bell(r, 130, T(6)), k * 2.4, .8)
    return reverb(x, 3, .4)
@sfx
def chime(r):            # 座钟报时（威斯敏斯特钟声的头四个音，1793 年的旋律，公版）
    x = np.zeros((2, T(4)))
    for k, m in enumerate((68, 66, 64, 59)): mix(x, bell(r, 440 * 2 ** ((m - 69) / 12), T(2.5), .5) * .5, k * .55, .7, .2)
    return reverb(x, 1, .3)
@sfx
def knock(r):            # 敲门三下
    x = np.zeros((2, T(1.6)))
    for k, t in enumerate((0, .28, .56)):
        n = T(.2); y = sine(r.uniform(150, 180), n) * decay(n, .035) + burst(r, n, 200, 1500, .015) * .8
        mix(x, y, t, 1 if k < 2 else .9)
    return reverb(x, .6, .3)
@sfx
def door_open(r):
    x = np.zeros((2, T(2)))
    mix(x, tick(r, 1600) * 1.5, 0, .6); mix(x, creak(r, 1.1), .1, .5)
    return reverb(x, .7, .3)
@sfx
def door_close(r):
    x = np.zeros((2, T(1.5))); n = T(.4)
    mix(x, sine(70, n) * decay(n, .08) + burst(r, n, 100, 1200, .04), 0, 1); mix(x, tick(r, 1500), .05, .5)
    return reverb(x, .8, .35)
@sfx
def steps(r):            # 木地板上的脚步，六步
    x = np.zeros((2, T(3.4)))
    for k in range(6):
        n = T(.15); h = sine(r.uniform(90, 120), n) * decay(n, .02) + burst(r, n, 300, 2500, .01) * .5
        mix(x, h, k * .52, r.uniform(.6, .9), -.3 + k * .12); mix(x, burst(r, n, 500, 4000, .008) * .3, k * .52 + .07, .5)
    return reverb(x, .7, .3)
@sfx
def cab_arrive(r):       # 马车驶来停下
    x = np.zeros((2, T(6))); t = 0.0; beat = .38; k = 0
    while t < 4.8:
        for off in (0, .09):
            mix(x, hoof(r), t + off, min(1, .25 + t / 3), -.6 + t / 8)
        t += beat * (1 + max(0, t - 3) * .3); k += 1
    n = T(4.8); wheels = sosf(brown(r, n), "bp", (60, 500)) * np.linspace(.6, 1, n) * np.clip((4.8 - np.arange(n) / SR) / 1.2, 0, 1) * 1.5
    mix(x, wheels, 0, 1, 0)
    return reverb(x, 1.2, .25)
@sfx
def foghorn(r): return reverb(foghorn_(r, 3.2), 3, .45, 2000)
@sfx
def whistle(r):          # 警哨：两长声（里面的小球让声音打颤）
    x = np.zeros((2, T(2.4)))
    for t, d in ((0, .7), (1.0, 1.0)):
        n = T(d); tt = np.arange(n) / SR
        trill = 1 + .35 * np.sin(2 * np.pi * 28 * tt); f = 2900 * (1 + .01 * np.sin(2 * np.pi * 28 * tt))
        y = (sine(f, n) + .2 * sosf(white(r, n), "bp", (2500, 3500))) * trill * np.clip(np.minimum(tt / .03, (d - tt) / .05), 0, 1) * .3
        mix(x, y, t, 1)
    return reverb(x, 1.5, .3)
@sfx
def match(r):            # 划火柴
    x = np.zeros((2, T(1.4))); n = T(.18)
    mix(x, sosf(white(r, n), "bp", (1800, 7000)) * np.hanning(n) * .5, 0, 1)
    m = T(1.1); tt = np.linspace(0, 1, m)
    flare = sosf(white(r, m), "lp", 1200) * np.clip(np.minimum(tt / .08, np.exp(-(tt - .08) * 3)), 0, 1) * .5
    mix(x, flare, .15, 1); scatter(r, x, 8, crackle, (.05, .15), (-.2, .2))
    return x
@sfx
def gunshot(r):          # 左轮手枪
    x = np.zeros((2, T(3))); n = T(.3)
    y = white(r, n) * decay(n, .025) + sine(55 * (1 + 2 * decay(n, .01)), n) * decay(n, .06) * 1.5
    mix(x, sosf(y, "lp", 9000), 0, 1)
    return reverb(x, 2.2, .5, 3500, pre=.03)
@sfx
def paper(r):            # 翻纸、展开信
    x = np.zeros((2, T(1))); scatter(r, x, 60, lambda r: burst(r, T(.02), 1500, 9000, .004), (.1, .4), (-.3, .3))
    return x * np.sin(np.pi * np.linspace(0, 1, x.shape[1]))
@sfx
def page(r):             # 翻一页
    w = whoosh(r, .4, 1500, 7000) * .6; return np.stack([w, np.roll(w, 40)])
@sfx
def pen(r):              # 钢笔在纸上写字
    x = np.zeros((2, T(2.2))); t = 0.0
    while t < 2:
        d = r.uniform(.08, .25); n = T(d)
        mix(x, sosf(white(r, n), "bp", (2500, 7000)) * np.hanning(n) * .15, t, 1, .1); t += d + r.uniform(.02, .12)
    return x
@sfx
def glass(r): return reverb(clink(r, 2900), .8, .3)
@sfx
def heartbeat(r):        # 心跳（每分钟 70 下，四下）
    x = np.zeros((2, T(3.6)))
    for k in range(4):
        for off, g in ((0, 1), (.24, .7)):
            n = T(.2); mix(x, sine(52 * (1 + .5 * decay(n, .02)), n) * env(n, .004, .05) * g, k * .86 + off, 1)
    return x
@sfx
def thunder(r):          # 远处的雷
    x = np.zeros((2, T(7))); n = x.shape[1]
    rumble = sosf(brown(r, n), "lp", 500, 3) * np.clip(lfo(r, n, 1.5, 1, .5), 0, None) * decay(n, 1.8)
    x += np.stack([rumble, np.roll(rumble, 300)]) * 1.4
    mix(x, burst(r, T(.4), 200, 5000, .08), .05, .5)
    return reverb(fade(x, .3, 1), 3, .3, 2000)
@sfx
def train_brake(r):      # 列车刹车：尖啸 + 放气
    x = np.zeros((2, T(3.4))); n = T(2.2); tt = np.arange(n) / SR
    f = 2600 + 120 * sosf(white(r, n), "lp", 6) * 40
    sq = sum(sine(f * k, n) / k for k in (1, 2, 3)) * np.clip(lfo(r, n, 4, .5, .7), 0, None) * np.clip(np.minimum(tt / .2, (2.2 - tt) / .4), 0, 1) * .12
    mix(x, sq, 0, 1, .2)
    mix(x, sosf(white(r, T(1.2)), "hp", 2500) * env(T(1.2), .02, .4) * .2, 2.0, 1, -.2)
    mix(x, sosf(brown(r, T(2.6)), "lp", 200) * np.linspace(1, 0, T(2.6)), 0, .8)
    return reverb(x, 2.5, .4, 3000)
@sfx
def train_pass(r):       # 隧道里列车驶过：铁轨接缝的咔哒声越来越快，然后远去
    x = np.zeros((2, T(7))); n = x.shape[1]; tt = np.linspace(0, 1, n)
    loud = np.sin(np.pi * tt) ** 2
    x += np.stack([sosf(brown(r, n), "lp", 300) * loud] * 2) * 1.2
    t = .3
    while t < 6.6:
        for off in (0, .12): mix(x, (sine(90, T(.1)) * decay(T(.1), .02) + burst(r, T(.1), 400, 3000, .01)) * loud[T(t)], t + off, .9, -.8 + t / 4)
        t += .55
    return reverb(x, 2.5, .4, 3000)
@sfx
def reveal(r):           # 真相揭开的一下：倒放的钟声吸上来，然后低沉的一击
    x = np.zeros((2, T(4.5))); n = T(1.5)
    rev = (bell(r, 660, T(2.2), .2) * .3)[::-1]
    mix(x, rev * np.linspace(0, 1, len(rev)), 0, .5)
    mix(x, sine(48 * (1 + decay(n, .05)), n) * decay(n, .35) + burst(r, n, 60, 600, .08), 2.2, 1)
    return reverb(x, 2, .35)
@sfx
def magic(r):            # 魔术发动：向上滑的光点 + 一阵风
    x = np.zeros((2, T(2.6))); n = T(2.2); tt = np.linspace(0, 1, n)
    for k in range(7):
        f0 = r.uniform(400, 900) * (k % 3 + 1)
        mix(x, sine(f0 * (1 + 1.5 * tt ** 2), n) * np.sin(np.pi * tt) ** 2 * .05, 0, 1, r.uniform(-.7, .7))
    mix(x, whoosh(r, 2.2, 400, 5000) * .3, 0, 1)
    scatter(r, x, 12, lambda r: clink(r, r.uniform(3500, 7000)) * .4, (.05, .15))
    return reverb(x, 2.5, .45, 7000)
@sfx
def memory_take(r):      # 提灯拿走一段记忆：倒放的钟声吸进去，然后一记闷响，剩下一点碎光
    x = np.zeros((2, T(5)))
    rv = reverb(bell(r, 440, T(3), .3) * .4, 2.5, .6)[:, ::-1]
    mix(x, rv * np.linspace(0, 1, rv.shape[1]), 0, 1)
    n = T(1.5); mix(x, sine(42 * (1 + .6 * decay(n, .05)), n) * decay(n, .4) * .9, rv.shape[1] / SR, 1)
    for k in range(5): mix(x, clink(r, r.uniform(2500, 5000)) * .3, rv.shape[1] / SR + .2 + k * .25, .2 * (1 - k / 6), r.uniform(-.6, .6))
    return reverb(x, 2, .3)
@sfx
def blade(r):            # 断剑出鞘 / 挥砍：风声 + 金属余音
    x = np.zeros((2, T(2.4)))
    mix(x, whoosh(r, .35, 800, 6000) * .7, 0, 1, -.3)
    n = T(2); ring = partials(n, 1130, [1, 2.57, 4.13, 6.4], [1.1, .7, .45, .3], [.6, .4, .25, .15], r)
    mix(x, ring * (1 + .2 * np.sin(2 * np.pi * 5 * np.arange(n) / SR)) * .5, .15, 1, .2)
    return reverb(x, 1.6, .35, 7000)
@sfx
def lamp_light(r):       # 提灯点亮：轻轻的“噗”，然后一个往上走的暖音
    x = np.zeros((2, T(3))); n = T(.5)
    mix(x, sosf(white(r, n), "lp", 900) * env(n, .02, .12) * .8, 0, 1)
    m = T(2.4); tt = np.linspace(0, 1, m)
    mix(x, (sine(220 * (1 + .5 * tt), m) + .5 * sine(330 * (1 + .5 * tt), m)) * np.sin(np.pi * tt) * .12, .1, 1)
    return reverb(x, 2, .4)
@sfx
def ink_fire(r):         # 墨水写出的火：呼地烧起来，噼啪作响
    x = np.zeros((2, T(3))); mix(x, whoosh(r, 1.2, 150, 2500) * .8, 0, 1)
    m = T(2.6); mix(x, sosf(brown(r, m), "lp", 400) * decay(m, 1) * .8, .2, 1)
    scatter(r, x, 25, crackle, (.05, .2), (-.5, .5))
    return reverb(x, 1, .25)

@sfx
def doorbell(r):         # 拉铃：楼下的小铃铛摇了几下
    x = np.zeros((2, T(2.2)))
    for k in range(6): mix(x, bell(r, 1180, T(1.4), .2) * .35, k * .09 + r.uniform(0, .02), 1 - k * .1, .3)
    return reverb(x, 1, .35)
@sfx
def cuffs(r):            # 手铐“咔嗒”锁上
    x = np.zeros((2, T(1.2)))
    for k in range(5): mix(x, tick(r, 3100 + 200 * k, .7), k * .035, .6)
    mix(x, tick(r, 2200) * 1.4, .25, 1)
    mix(x, clink(r, 3600) * .4, .26, .5)
    return reverb(x, .5, .25)

# ---------- 输出 ----------
def write_mp3(path, x, kbps):
    x = np.atleast_2d(x); x = np.clip(x, -1, 1)
    with tempfile.TemporaryDirectory() as d:
        w = pathlib.Path(d) / "a.wav"
        with wave.open(str(w), "wb") as f:
            f.setnchannels(x.shape[0]); f.setsampwidth(2); f.setframerate(SR)
            f.writeframes((x.T * 32767).astype("<i2").tobytes())
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(w), "-codec:a", "libmp3lame", "-b:a", f"{kbps}k", str(path)], check=True)

def render(name):
    r = rng(name)
    if name in AMB:
        x = loopify(AMB[name](r)); rms = np.sqrt((x ** 2).mean()) + 1e-9
        x *= 10 ** (-24 / 20) / rms                      # 环境音统一到 -24 dBFS（RMS），播放时再按场景调
        x *= min(1, .89 / np.abs(x).max()); write_mp3(OUT / f"{name}.mp3", x, 96)
    else:
        x = SFX[name](r); x = x if x.ndim == 2 else stereo(x)
        x = fade(x, .002, .08); x *= .7 / (np.abs(x).max() + 1e-9)   # 音效峰值统一到 -3 dB
        write_mp3(OUT / f"{name}.mp3", x, 112)

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    names = sys.argv[1:] or [*AMB, *SFX]
    bad = [n for n in names if n not in AMB and n not in SFX]
    if bad: sys.exit(f"不认识的名字：{bad}")
    for n in names: render(n); print(n, f"{(OUT / f'{n}.mp3').stat().st_size // 1024} KB")
