const effectsState = {
  audioContext: null,
  masterGain: null,
  filter: null,
  timer: null,
  isPlaying: false,
  trackIndex: 0,
  tracks: [],
  lastSparkleAt: 0
};

const defaultTracks = [
  {
    title: "Sakura Lo-Fi Pad",
    subtitle: "原创合成器环境音 · 无外部音频文件",
    tempo: 92,
    notes: [261.63, 329.63, 392.0, 493.88]
  }
];

async function loadTracks() {
  try {
    const response = await fetch("./data/music.json", { cache: "no-store" });
    if (!response.ok) throw new Error("music data not found");
    const tracks = await response.json();
    effectsState.tracks = Array.isArray(tracks) && tracks.length > 0 ? tracks : defaultTracks;
  } catch (error) {
    console.warn(error);
    effectsState.tracks = defaultTracks;
  }
}

function createUi() {
  const progress = document.createElement("div");
  progress.className = "progress-line";
  progress.setAttribute("aria-hidden", "true");
  document.body.appendChild(progress);

  const tools = document.createElement("div");
  tools.className = "site-tools";
  tools.innerHTML = `
    <section class="music-widget" aria-label="环境音乐播放器">
      <button class="music-toggle" type="button" aria-label="播放或暂停环境音乐">♪</button>
      <div class="music-meta">
        <div class="music-title">Sakura Lo-Fi Pad</div>
        <div class="music-subtitle">点击播放原创环境音</div>
      </div>
      <button class="track-next" type="button" aria-label="切换下一首">↬</button>
      <input class="music-volume" type="range" min="0" max="100" value="28" aria-label="环境音乐音量" />
    </section>
    <button class="back-top" type="button" aria-label="返回顶部">↑</button>
  `;
  document.body.appendChild(tools);
}

function updateProgress() {
  const progress = document.querySelector(".progress-line");
  const backTop = document.querySelector(".back-top");
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const percent = scrollable > 0 ? Math.min(100, (scrollTop / scrollable) * 100) : 0;

  progress.style.width = `${percent}%`;
  backTop.classList.toggle("is-visible", scrollTop > 360);
}

function setupProgressAndTop() {
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  document.querySelector(".back-top").addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  updateProgress();
}

function getCurrentTrack() {
  return effectsState.tracks[effectsState.trackIndex] || defaultTracks[0];
}

function updateTrackLabel() {
  const track = getCurrentTrack();
  document.querySelector(".music-title").textContent = track.title || "Untitled Track";
  document.querySelector(".music-subtitle").textContent = track.subtitle || "原创环境音";
}

function ensureAudio() {
  if (effectsState.audioContext) return;

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    document.querySelector(".music-subtitle").textContent = "当前浏览器不支持 Web Audio";
    return;
  }

  const context = new AudioContext();
  const masterGain = context.createGain();
  const filter = context.createBiquadFilter();

  filter.type = "lowpass";
  filter.frequency.value = 1200;
  masterGain.gain.value = Number(document.querySelector(".music-volume").value) / 100;

  filter.connect(masterGain);
  masterGain.connect(context.destination);

  effectsState.audioContext = context;
  effectsState.masterGain = masterGain;
  effectsState.filter = filter;
}

function playTone(frequency, startTime, duration) {
  const context = effectsState.audioContext;
  if (!context || !effectsState.filter) return;

  const osc = context.createOscillator();
  const gain = context.createGain();
  const detune = context.createOscillator();
  const detuneGain = context.createGain();

  osc.type = "sine";
  osc.frequency.value = frequency;
  detune.type = "triangle";
  detune.frequency.value = 0.18;
  detuneGain.gain.value = 2.5;

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.18, startTime + 0.36);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  detune.connect(detuneGain);
  detuneGain.connect(osc.detune);
  osc.connect(gain);
  gain.connect(effectsState.filter);

  osc.start(startTime);
  detune.start(startTime);
  osc.stop(startTime + duration + 0.1);
  detune.stop(startTime + duration + 0.1);
}

function scheduleLoop() {
  const track = getCurrentTrack();
  const notes = Array.isArray(track.notes) && track.notes.length > 0 ? track.notes : defaultTracks[0].notes;
  const beat = 60 / Number(track.tempo || 84);
  const now = effectsState.audioContext.currentTime;

  notes.forEach((note, index) => {
    playTone(note, now + index * beat * 1.8, beat * 3.2);
    if (index % 2 === 0) playTone(note * 2, now + index * beat * 1.8 + beat * 0.5, beat * 1.8);
  });

  effectsState.timer = window.setTimeout(scheduleLoop, beat * notes.length * 1800);
}

async function playMusic() {
  ensureAudio();
  const context = effectsState.audioContext;
  if (!context) return;

  if (context.state === "suspended") await context.resume();
  effectsState.isPlaying = true;
  document.querySelector(".music-toggle").textContent = "Ⅱ";
  document.querySelector(".music-subtitle").textContent = getCurrentTrack().subtitle || "正在播放原创环境音";
  scheduleLoop();
}

function pauseMusic() {
  effectsState.isPlaying = false;
  document.querySelector(".music-toggle").textContent = "♪";
  window.clearTimeout(effectsState.timer);
  effectsState.timer = null;

  if (effectsState.masterGain && effectsState.audioContext) {
    const now = effectsState.audioContext.currentTime;
    effectsState.masterGain.gain.cancelScheduledValues(now);
    effectsState.masterGain.gain.setTargetAtTime(0.0001, now, 0.08);
  }
}

function resumeGain() {
  if (!effectsState.masterGain || !effectsState.audioContext) return;
  const value = Number(document.querySelector(".music-volume").value) / 100;
  const now = effectsState.audioContext.currentTime;
  effectsState.masterGain.gain.cancelScheduledValues(now);
  effectsState.masterGain.gain.setTargetAtTime(value, now, 0.08);
}

function setupMusic() {
  updateTrackLabel();

  document.querySelector(".music-toggle").addEventListener("click", async () => {
    if (effectsState.isPlaying) {
      pauseMusic();
      return;
    }
    await playMusic();
    resumeGain();
  });

  document.querySelector(".track-next").addEventListener("click", async () => {
    effectsState.trackIndex = (effectsState.trackIndex + 1) % effectsState.tracks.length;
    updateTrackLabel();
    if (effectsState.isPlaying) {
      window.clearTimeout(effectsState.timer);
      effectsState.timer = null;
      scheduleLoop();
      resumeGain();
    }
  });

  document.querySelector(".music-volume").addEventListener("input", event => {
    if (!effectsState.masterGain || !effectsState.audioContext) return;
    const now = effectsState.audioContext.currentTime;
    effectsState.masterGain.gain.cancelScheduledValues(now);
    effectsState.masterGain.gain.setTargetAtTime(Number(event.target.value) / 100, now, 0.06);
  });
}

function createSparkle(x, y) {
  const sparkle = document.createElement("span");
  const driftX = `${Math.random() * 42 - 21}px`;
  const driftY = `${Math.random() * -42 - 16}px`;
  sparkle.className = "sparkle";
  sparkle.style.left = `${x}px`;
  sparkle.style.top = `${y}px`;
  sparkle.style.setProperty("--tx", driftX);
  sparkle.style.setProperty("--ty", driftY);
  document.body.appendChild(sparkle);
  window.setTimeout(() => sparkle.remove(), 760);
}

function setupSparkles() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  window.addEventListener("pointermove", event => {
    const now = Date.now();
    if (now - effectsState.lastSparkleAt < 70) return;
    effectsState.lastSparkleAt = now;
    createSparkle(event.clientX, event.clientY);
  }, { passive: true });
}

async function initEffects() {
  createUi();
  await loadTracks();
  setupProgressAndTop();
  setupMusic();
  setupSparkles();
}

initEffects();
