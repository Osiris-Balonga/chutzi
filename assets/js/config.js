export const JOKE_API_URL = "https://v2.jokeapi.dev/joke/Any?lang=fr&type=twopart&safe-mode&amount=10";

export const EXCLUDED_TERMS = [
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

export const AUDIO_CONFIG = {
  music: {
    path: "assets/audio/background-music.mp3",
    volume: 0.14,
    duckedVolume: 0.065
  },
  effects: {
    click: { path: "assets/audio/click.wav", volume: 0.3 },
    laugh: { path: "assets/audio/people-laughing.mp3", volume: 0.42 },
    mischievousLaugh: { path: "assets/audio/mischievous-laugh.mp3", volume: 0.34 },
    jump: { path: "assets/audio/jump.mp3", volume: 0.4 },
    joking: { path: "assets/audio/joking.mp3", volume: 0.32 },
    whoosh: { path: "assets/audio/whoosh.mp3", volume: 0.28 },
    hmm: { path: "assets/audio/hmm.mp3", volume: 0.28 },
    snoring: { path: "assets/audio/snoring.mp3", volume: 0.26 },
    fail: { path: "assets/audio/fail.mp3", volume: 0.28 },
    talking: { path: "assets/audio/talking.mp3", volume: 0.27 },
    singing: { path: "assets/audio/singing.mp3", volume: 0.24 }
  }
};

export const REACTIONS = {
  look: { className: "is-idle-looking", duration: 1900 },
  hop: { className: "is-idle-hopping", duration: 1120, sound: "jump" },
  think: { className: "is-idle-thinking", duration: 2400, sound: "hmm" },
  chat: { className: "is-idle-chatting", duration: 1700, sound: "talking" },
  sleep: { className: "is-idle-dozing", duration: 3200, sound: "snoring" },
  sing: { className: "is-idle-singing", duration: 3900, sound: "singing" },
  devil: { className: "is-idle-mischievous", duration: 2300, sound: "mischievousLaugh" },
  laugh: { className: "is-reacting-laugh", duration: 1240, sound: "laugh" },
  error: { className: "is-developer-error", duration: 1800, sound: "fail" }
};

export const IDLE_REACTIONS = [
  { name: "look", weight: 2, soundChance: 0 },
  { name: "hop", weight: 1, soundChance: 0.45 },
  { name: "think", weight: 1, soundChance: 0.7 },
  { name: "chat", weight: 1, soundChance: 0.55 },
  { name: "sleep", weight: 1, soundChance: 0.55 },
  { name: "sing", weight: 1, soundChance: 0.35 },
  { name: "devil", weight: 1, soundChance: 0.35 }
];
