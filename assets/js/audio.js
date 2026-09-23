import { AUDIO_CONFIG } from "./config.js";

const MUSIC_STORAGE_KEY = "chutzi-music-enabled";
const EFFECTS_STORAGE_KEY = "chutzi-effects-enabled";

function readPreference(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value === "true";
  } catch (_error) {
    return fallback;
  }
}

function storePreference(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch (_error) {
    // Keep the preference for the current session when storage is unavailable.
  }
}

export function createAudioController({ app, menuButton, musicToggle, effectsToggle }) {
  const music = new Audio(AUDIO_CONFIG.music.path);
  const effects = Object.fromEntries(
    Object.entries(AUDIO_CONFIG.effects).map(([name, config]) => {
      const sound = new Audio(config.path);
      sound.preload = "auto";
      sound.volume = config.volume;
      return [name, sound];
    })
  );
  const stopTimers = new WeakMap();
  let duckTimer = null;
  let musicEnabled = readPreference(MUSIC_STORAGE_KEY, true);
  let effectsEnabled = readPreference(EFFECTS_STORAGE_KEY, true);

  music.preload = "metadata";
  music.loop = true;
  music.volume = AUDIO_CONFIG.music.volume;

  function stopEffect(name, reset = true) {
    const sound = effects[name];

    if (!sound) {
      return;
    }

    window.clearTimeout(stopTimers.get(sound));
    stopTimers.delete(sound);
    sound.pause();

    if (reset) {
      sound.currentTime = 0;
    }
  }

  function restoreMusicVolume() {
    window.clearTimeout(duckTimer);
    music.volume = AUDIO_CONFIG.music.volume;
  }

  function stopAllEffects() {
    Object.keys(effects).forEach((name) => stopEffect(name));
    restoreMusicVolume();
  }

  function duckMusic(duration) {
    if (music.paused) {
      return;
    }

    window.clearTimeout(duckTimer);
    music.volume = AUDIO_CONFIG.music.duckedVolume;
    duckTimer = window.setTimeout(restoreMusicVolume, duration);
  }

  function playEffect(name, { maxDuration = 0, duckDuration = 0 } = {}) {
    const sound = effects[name];

    if (!sound || !effectsEnabled || document.hidden) {
      return false;
    }

    stopEffect(name);
    void sound.play().catch(() => {});

    if (duckDuration > 0) {
      duckMusic(duckDuration);
    }

    if (maxDuration > 0) {
      stopTimers.set(sound, window.setTimeout(() => stopEffect(name), maxDuration));
    }

    return true;
  }

  function shouldPlayMusic() {
    return musicEnabled && app.dataset.state !== "welcome" && !document.hidden;
  }

  function playMusic() {
    if (shouldPlayMusic()) {
      void music.play().catch(() => {});
    }
  }

  function pauseMusic(reset = false) {
    music.pause();
    restoreMusicVolume();

    if (reset) {
      music.currentTime = 0;
    }
  }

  function updateControls() {
    const allDisabled = !musicEnabled && !effectsEnabled;
    const partiallyEnabled = musicEnabled !== effectsEnabled;
    const musicState = musicEnabled ? "activée" : "coupée";
    const effectsState = effectsEnabled ? "activés" : "coupés";

    musicToggle.setAttribute("aria-checked", String(musicEnabled));
    effectsToggle.setAttribute("aria-checked", String(effectsEnabled));
    menuButton.classList.toggle("is-silent", allDisabled);
    menuButton.classList.toggle("has-partial-audio", partiallyEnabled);
    menuButton.setAttribute(
      "aria-label",
      `Ouvrir les réglages audio, musique ${musicState}, effets ${effectsState}`
    );
  }

  function toggleMusic() {
    playEffect("click");
    musicEnabled = !musicEnabled;
    storePreference(MUSIC_STORAGE_KEY, musicEnabled);
    musicEnabled ? playMusic() : pauseMusic();
    updateControls();
  }

  function toggleEffects() {
    if (effectsEnabled) {
      playEffect("click");
      effectsEnabled = false;
      stopAllEffects();
    } else {
      effectsEnabled = true;
      playEffect("click");
    }

    storePreference(EFFECTS_STORAGE_KEY, effectsEnabled);
    updateControls();
  }

  music.addEventListener("ended", () => {
    if (shouldPlayMusic()) {
      music.currentTime = 0;
      playMusic();
    }
  });

  updateControls();

  return {
    isMusicPlaying: () => !music.paused,
    pauseMusic,
    playEffect,
    playMusic,
    restoreMusicVolume,
    stopAllEffects,
    stopEffect,
    toggleEffects,
    toggleMusic
  };
}
