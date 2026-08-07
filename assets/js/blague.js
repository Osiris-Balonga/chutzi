"use strict";

const API_URL = "https://v2.jokeapi.dev/joke/Any?lang=fr&type=twopart&safe-mode&amount=10";
const TERMES_EXCLUS = [
  "sodom",
  "sexe",
  "penis",
  "vagin",
  "porno",
  "bite",
  "couille",
  "pute",
  "drogue",
  "cannabis",
  "alcool",
  "biere",
  "viol"
];

const MUSIC_STORAGE_KEY = "chutzi-music-enabled";
const EFFECTS_STORAGE_KEY = "chutzi-effects-enabled";
const LEGACY_AUDIO_STORAGE_KEY = "chutzi-audio-muted";
const MUSIC_VOLUME = 0.14;
const DUCKED_MUSIC_VOLUME = 0.065;

const app = document.querySelector("#app");
const welcomePanel = document.querySelector("#welcome-panel");
const gamePanel = document.querySelector("#game-panel");
const loadingView = document.querySelector("#loading-view");
const jokeView = document.querySelector("#joke-view");
const errorView = document.querySelector("#error-view");
const jokeQuestion = document.querySelector("#joke-question");
const jokeAnswer = document.querySelector("#joke-answer");
const jokeDelivery = document.querySelector("#joke-delivery");
const revealButton = document.querySelector("#reveal-button");
const jokeActions = document.querySelector("#joke-actions");
const mascot = document.querySelector("#mascot");
const audioMenuButton = document.querySelector("#audio-menu-button");
const audioDialog = document.querySelector("#audio-dialog");
const audioCloseButton = document.querySelector("#audio-close-button");
const musicToggle = document.querySelector("#music-toggle");
const effectsToggle = document.querySelector("#effects-toggle");

const backgroundMusic = new Audio("assets/audio/background-music.mp3");
const sounds = {
  click: new Audio("assets/audio/click.wav"),
  laugh: new Audio("assets/audio/people-laughing.mp3"),
  mischievousLaugh: new Audio("assets/audio/mischievous-laugh.mp3"),
  jump: new Audio("assets/audio/jump.mp3"),
  joking: new Audio("assets/audio/joking.mp3"),
  whoosh: new Audio("assets/audio/whoosh.mp3"),
  hmm: new Audio("assets/audio/hmm.mp3"),
  snoring: new Audio("assets/audio/snoring.mp3"),
  fail: new Audio("assets/audio/fail.mp3"),
  talking: new Audio("assets/audio/talking.mp3"),
  singing: new Audio("assets/audio/singing.mp3")
};

backgroundMusic.preload = "metadata";
backgroundMusic.loop = true;
backgroundMusic.volume = MUSIC_VOLUME;

Object.values(sounds).forEach((sound) => {
  sound.preload = "auto";
});

sounds.click.volume = 0.3;
sounds.laugh.volume = 0.42;
sounds.mischievousLaugh.volume = 0.34;
sounds.jump.volume = 0.4;
sounds.joking.volume = 0.32;
sounds.whoosh.volume = 0.28;
sounds.hmm.volume = 0.28;
sounds.snoring.volume = 0.26;
sounds.fail.volume = 0.28;
sounds.talking.volume = 0.27;
sounds.singing.volume = 0.24;

const soundStopTimers = new WeakMap();
const idleAnimations = [
  { name: "look", className: "is-idle-looking", duration: 1900 },
  { name: "look", className: "is-idle-looking", duration: 1900 },
  { name: "hop", className: "is-idle-hopping", duration: 900, sound: sounds.jump, soundChance: 0.45 },
  { name: "hmm", className: "is-idle-thinking", duration: 2400, sound: sounds.hmm, soundChance: 0.7 },
  { name: "chat", className: "is-idle-chatting", duration: 1700, sound: sounds.talking, soundChance: 0.55 },
  { name: "doze", className: "is-idle-dozing", duration: 3200, sound: sounds.snoring, soundChance: 0.55 },
  { name: "sing", className: "is-idle-singing", duration: 3900, sound: sounds.singing, soundChance: 0.35 },
  { name: "mischief", className: "is-idle-mischievous", duration: 2300, sound: sounds.mischievousLaugh, soundChance: 0.35 }
];
const idleClassNames = [...new Set(idleAnimations.map((animation) => animation.className))];

let musicEnabled = readStoredPreference(MUSIC_STORAGE_KEY, !readLegacyMutedPreference());
let effectsEnabled = readStoredPreference(EFFECTS_STORAGE_KEY, !readLegacyMutedPreference());
let lastJokeId = null;
let loadedJokeCount = 0;
let idleTimer = null;
let idleEndTimer = null;
let activeIdleSound = null;
let lastIdleAnimationName = null;
let dialogCloseTimer = null;
let musicPausedByVisibility = false;
let musicDuckTimer = null;
let reactionTimer = null;

function normalizeText(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isFamilyFriendly(joke) {
  const text = normalizeText(`${joke.setup} ${joke.delivery}`);
  const hasFlag = Object.values(joke.flags || {}).some(Boolean);

  return joke.type === "twopart"
    && joke.safe !== false
    && !hasFlag
    && !TERMES_EXCLUS.some((term) => text.includes(term));
}

function chooseJoke(data) {
  const list = Array.isArray(data.jokes) ? data.jokes : [data];
  const candidates = list.filter(isFamilyFriendly);
  const newCandidates = candidates.filter((joke) => joke.id !== lastJokeId);
  const selection = newCandidates.length > 0 ? newCandidates : candidates;

  if (selection.length === 0) {
    throw new Error("Aucune blague tout public disponible");
  }

  return selection[Math.floor(Math.random() * selection.length)];
}

function readLegacyMutedPreference() {
  try {
    return localStorage.getItem(LEGACY_AUDIO_STORAGE_KEY) === "true";
  } catch (_error) {
    return false;
  }
}

function readStoredPreference(key, fallback) {
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
    // La préférence reste active pour la session si le stockage est indisponible.
  }
}

function stopSound(sound, reset = true) {
  window.clearTimeout(soundStopTimers.get(sound));
  soundStopTimers.delete(sound);
  sound.pause();

  if (reset) {
    sound.currentTime = 0;
  }
}

function stopAllEffects() {
  Object.values(sounds).forEach((sound) => stopSound(sound));
  window.clearTimeout(musicDuckTimer);
  backgroundMusic.volume = MUSIC_VOLUME;
}

function duckMusic(duration) {
  if (backgroundMusic.paused) {
    return;
  }

  window.clearTimeout(musicDuckTimer);
  backgroundMusic.volume = DUCKED_MUSIC_VOLUME;
  musicDuckTimer = window.setTimeout(() => {
    backgroundMusic.volume = MUSIC_VOLUME;
  }, duration);
}

function playEffect(sound, options = {}) {
  if (!effectsEnabled || document.hidden) {
    return false;
  }

  const { maxDuration = 0, duckDuration = 0 } = options;
  stopSound(sound);
  void sound.play().catch(() => {});

  if (duckDuration > 0) {
    duckMusic(duckDuration);
  }

  if (maxDuration > 0) {
    soundStopTimers.set(sound, window.setTimeout(() => stopSound(sound), maxDuration));
  }

  return true;
}

function shouldPlayMusic() {
  return musicEnabled && app.dataset.state !== "welcome" && !document.hidden;
}

function playMusic() {
  if (!shouldPlayMusic()) {
    return;
  }

  void backgroundMusic.play().catch(() => {});
}

function pauseMusic(reset = false) {
  backgroundMusic.pause();
  window.clearTimeout(musicDuckTimer);
  backgroundMusic.volume = MUSIC_VOLUME;

  if (reset) {
    backgroundMusic.currentTime = 0;
  }
}

function stopMascotReaction() {
  window.clearTimeout(reactionTimer);
  mascot.classList.remove("is-reacting-laugh");
}

function updateAudioControls() {
  const allDisabled = !musicEnabled && !effectsEnabled;
  const partiallyEnabled = musicEnabled !== effectsEnabled;
  const musicState = musicEnabled ? "activée" : "coupée";
  const effectsState = effectsEnabled ? "activés" : "coupés";

  musicToggle.setAttribute("aria-checked", String(musicEnabled));
  effectsToggle.setAttribute("aria-checked", String(effectsEnabled));
  audioMenuButton.classList.toggle("is-silent", allDisabled);
  audioMenuButton.classList.toggle("has-partial-audio", partiallyEnabled);
  audioMenuButton.setAttribute(
    "aria-label",
    `Ouvrir les réglages audio, musique ${musicState}, effets ${effectsState}`
  );
}

function toggleMusic() {
  playEffect(sounds.click);
  musicEnabled = !musicEnabled;
  storePreference(MUSIC_STORAGE_KEY, musicEnabled);

  if (musicEnabled) {
    playMusic();
  } else {
    pauseMusic();
  }

  updateAudioControls();
}

function toggleEffects() {
  if (effectsEnabled) {
    playEffect(sounds.click);
    effectsEnabled = false;
    stopAllEffects();
  } else {
    effectsEnabled = true;
    playEffect(sounds.click);
  }

  storePreference(EFFECTS_STORAGE_KEY, effectsEnabled);
  updateAudioControls();
}

function openAudioDialog() {
  window.clearTimeout(dialogCloseTimer);
  cancelIdleAnimation(true);
  audioDialog.classList.remove("is-closing");
  audioDialog.showModal();
  audioCloseButton.focus();
}

function closeAudioDialog() {
  if (!audioDialog.open || audioDialog.classList.contains("is-closing")) {
    return;
  }

  audioDialog.classList.add("is-closing");
  dialogCloseTimer = window.setTimeout(() => {
    audioDialog.close();
    audioDialog.classList.remove("is-closing");
    audioMenuButton.focus();
    scheduleIdleAnimation();
  }, 160);
}

function showView(name) {
  if (name !== "revealed") {
    stopMascotReaction();
  }

  loadingView.hidden = name !== "loading";
  jokeView.hidden = name !== "question" && name !== "revealed";
  errorView.hidden = name !== "error";
  jokeAnswer.hidden = name !== "revealed";
  revealButton.hidden = name !== "question";
  jokeActions.hidden = name !== "revealed";
  app.dataset.state = name;

  if (name === "question" || name === "revealed") {
    scheduleIdleAnimation();
  } else {
    cancelIdleAnimation(true);
  }
}

function canRunIdleAnimation() {
  return !document.hidden
    && !audioDialog.open
    && (app.dataset.state === "question" || app.dataset.state === "revealed");
}

function randomIdleDelay() {
  return 7500 + Math.floor(Math.random() * 6500);
}

function scheduleIdleAnimation(delay = randomIdleDelay()) {
  window.clearTimeout(idleTimer);

  if (!canRunIdleAnimation()) {
    return;
  }

  idleTimer = window.setTimeout(runIdleAnimation, delay);
}

function cancelIdleAnimation(stopIdleSound = false) {
  window.clearTimeout(idleTimer);
  window.clearTimeout(idleEndTimer);
  idleClassNames.forEach((className) => mascot.classList.remove(className));

  if (stopIdleSound && activeIdleSound) {
    stopSound(activeIdleSound);
    window.clearTimeout(musicDuckTimer);
    backgroundMusic.volume = MUSIC_VOLUME;
  }

  activeIdleSound = null;
}

function runIdleAnimation() {
  if (!canRunIdleAnimation()) {
    return;
  }

  const availableAnimations = idleAnimations.filter(
    (animation) => animation.name !== lastIdleAnimationName
  );
  const animation = availableAnimations[Math.floor(Math.random() * availableAnimations.length)];

  cancelIdleAnimation(true);
  lastIdleAnimationName = animation.name;
  mascot.classList.add(animation.className);

  if (animation.sound && Math.random() <= animation.soundChance) {
    activeIdleSound = animation.sound;
    playEffect(animation.sound, {
      maxDuration: animation.duration,
      duckDuration: animation.duration
    });
  }

  idleEndTimer = window.setTimeout(() => {
    mascot.classList.remove(animation.className);
    activeIdleSound = null;
    scheduleIdleAnimation();
  }, animation.duration);
}

function registerActivity() {
  if (!canRunIdleAnimation()) {
    return;
  }

  cancelIdleAnimation(true);
  scheduleIdleAnimation();
}

async function loadJoke(options = {}) {
  const { withTransitionSound = false } = options;

  cancelIdleAnimation(true);
  stopSound(sounds.laugh);
  stopSound(sounds.mischievousLaugh);

  if (withTransitionSound) {
    playEffect(sounds.whoosh, { maxDuration: 900 });
  }

  showView("loading");

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.message || "Réponse inattendue de l'API");
    }

    const joke = chooseJoke(data);
    lastJokeId = joke.id;
    loadedJokeCount += 1;

    jokeQuestion.textContent = joke.setup;
    jokeDelivery.textContent = joke.delivery;
    showView("question");

    if (loadedJokeCount > 1 && Math.random() < 0.55) {
      playEffect(sounds.joking, { maxDuration: 1200, duckDuration: 1100 });
    }

    revealButton.focus();
  } catch (error) {
    console.error("Impossible de charger la blague :", error);
    showView("error");
    playEffect(sounds.fail, { maxDuration: 2600, duckDuration: 2600 });
    document.querySelector("#retry-button").focus();
  }
}

function startGame() {
  cancelIdleAnimation(true);
  app.classList.add("is-entering");
  welcomePanel.hidden = true;
  gamePanel.hidden = false;
  void loadJoke();
  playMusic();
  playEffect(sounds.jump, { maxDuration: 1200, duckDuration: 1000 });
  window.setTimeout(() => app.classList.remove("is-entering"), 820);
}

function revealAnswer() {
  cancelIdleAnimation(true);
  showView("revealed");
  stopMascotReaction();
  mascot.classList.add("is-reacting-laugh");
  reactionTimer = window.setTimeout(stopMascotReaction, 1240);

  const laugh = Math.random() < 0.24 ? sounds.mischievousLaugh : sounds.laugh;
  playEffect(laugh, { maxDuration: 4200, duckDuration: 3800 });
  document.querySelector("#another-button").focus();
}

function loadAnotherJoke() {
  void loadJoke({ withTransitionSound: true });
}

function quitGame() {
  cancelIdleAnimation(true);
  stopMascotReaction();
  pauseMusic(true);
  stopAllEffects();
  loadedJokeCount = 0;
  gamePanel.hidden = true;
  welcomePanel.hidden = false;
  app.classList.remove("is-entering");
  app.dataset.state = "welcome";
  welcomePanel.classList.remove("is-returning");
  void welcomePanel.offsetWidth;
  welcomePanel.classList.add("is-returning");
  document.querySelector("#start-button").focus();
}

document.querySelectorAll(".button").forEach((button) => {
  button.addEventListener("click", () => playEffect(sounds.click));
});

document.querySelector("#start-button").addEventListener("click", startGame);
revealButton.addEventListener("click", revealAnswer);
document.querySelector("#another-button").addEventListener("click", loadAnotherJoke);
document.querySelector("#retry-button").addEventListener("click", loadAnotherJoke);
document.querySelector("#quit-button").addEventListener("click", quitGame);
document.querySelector("#error-quit-button").addEventListener("click", quitGame);

audioMenuButton.addEventListener("click", () => {
  playEffect(sounds.click);
  openAudioDialog();
});
audioCloseButton.addEventListener("click", closeAudioDialog);
musicToggle.addEventListener("click", toggleMusic);
effectsToggle.addEventListener("click", toggleEffects);

audioDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeAudioDialog();
});

audioDialog.addEventListener("click", (event) => {
  if (event.target === audioDialog) {
    closeAudioDialog();
  }
});

document.addEventListener("pointerdown", registerActivity, { passive: true });
document.addEventListener("keydown", registerActivity);

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    musicPausedByVisibility = !backgroundMusic.paused;
    pauseMusic();
    stopAllEffects();
    cancelIdleAnimation(true);
    return;
  }

  if (musicPausedByVisibility) {
    playMusic();
  }

  musicPausedByVisibility = false;
  scheduleIdleAnimation();
});

backgroundMusic.addEventListener("ended", () => {
  if (!shouldPlayMusic()) {
    return;
  }

  backgroundMusic.currentTime = 0;
  playMusic();
});

updateAudioControls();
