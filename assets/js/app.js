import { createAudioController } from "./audio.js";
import { createDeveloperController } from "./developer.js";
import { fetchJoke, resetJokeHistory } from "./jokes.js";
import { createMascotController } from "./mascot.js";

const elements = {
  app: document.querySelector("#app"),
  welcomePanel: document.querySelector("#welcome-panel"),
  gamePanel: document.querySelector("#game-panel"),
  loadingView: document.querySelector("#loading-view"),
  jokeView: document.querySelector("#joke-view"),
  errorView: document.querySelector("#error-view"),
  jokeQuestion: document.querySelector("#joke-question"),
  jokeAnswer: document.querySelector("#joke-answer"),
  jokeDelivery: document.querySelector("#joke-delivery"),
  revealButton: document.querySelector("#reveal-button"),
  jokeActions: document.querySelector("#joke-actions"),
  mascot: document.querySelector("#mascot"),
  audioMenuButton: document.querySelector("#audio-menu-button"),
  audioDialog: document.querySelector("#audio-dialog"),
  audioCloseButton: document.querySelector("#audio-close-button"),
  musicToggle: document.querySelector("#music-toggle"),
  effectsToggle: document.querySelector("#effects-toggle"),
  developerPanel: document.querySelector("#developer-panel"),
  developerClose: document.querySelector("#developer-close"),
  developerHint: document.querySelector("#developer-hint"),
  developerStart: document.querySelector("#developer-start"),
  developerReactionButtons: [...document.querySelectorAll(".developer-reaction")]
};

const audio = createAudioController({
  app: elements.app,
  menuButton: elements.audioMenuButton,
  musicToggle: elements.musicToggle,
  effectsToggle: elements.effectsToggle
});

const mascot = createMascotController({
  app: elements.app,
  mascot: elements.mascot,
  audioDialog: elements.audioDialog,
  audio
});

let loadedJokeCount = 0;
let dialogCloseTimer = null;
let musicPausedByVisibility = false;
let developer;

function closeAudioDialog({ restoreFocus = true } = {}) {
  if (!elements.audioDialog.open || elements.audioDialog.classList.contains("is-closing")) {
    return;
  }

  elements.audioDialog.classList.add("is-closing");
  dialogCloseTimer = window.setTimeout(() => {
    elements.audioDialog.close();
    elements.audioDialog.classList.remove("is-closing");

    if (!restoreFocus) {
      return;
    }

    if (developer.isEnabled()) {
      elements.developerClose.focus();
    } else {
      elements.audioMenuButton.focus();
      mascot.scheduleIdle();
    }
  }, 160);
}

function openAudioDialog() {
  window.clearTimeout(dialogCloseTimer);
  developer.stopReaction();
  elements.audioDialog.classList.remove("is-closing");
  elements.audioDialog.showModal();
  elements.audioCloseButton.focus();
}

function showView(name) {
  developer.stopReaction();
  elements.loadingView.hidden = name !== "loading";
  elements.jokeView.hidden = name !== "question" && name !== "revealed";
  elements.errorView.hidden = name !== "error";
  elements.jokeAnswer.hidden = name !== "revealed";
  elements.revealButton.hidden = name !== "question";
  elements.jokeActions.hidden = name !== "revealed";
  elements.app.dataset.state = name;
  developer.sync();

  if (name === "question" || name === "revealed") {
    mascot.scheduleIdle();
  }
}

async function loadJoke({ withTransitionSound = false } = {}) {
  audio.stopEffect("laugh");
  audio.stopEffect("mischievousLaugh");

  if (withTransitionSound) {
    audio.playEffect("whoosh", { maxDuration: 900 });
  }

  showView("loading");

  try {
    const joke = await fetchJoke();
    loadedJokeCount += 1;
    elements.jokeQuestion.textContent = joke.setup;
    elements.jokeDelivery.textContent = joke.delivery;
    showView("question");

    if (loadedJokeCount > 1 && Math.random() < 0.55) {
      audio.playEffect("joking", { maxDuration: 1200, duckDuration: 1100 });
    }

    elements.revealButton.focus();
  } catch (error) {
    console.error("Impossible de charger la blague :", error);
    showView("error");
    audio.playEffect("fail", { maxDuration: 2600, duckDuration: 2600 });
    document.querySelector("#retry-button").focus();
  }
}

function startGame() {
  elements.app.classList.add("is-entering");
  elements.welcomePanel.hidden = true;
  elements.gamePanel.hidden = false;
  void loadJoke();
  audio.playMusic();
  audio.playEffect("jump", { maxDuration: 1200, duckDuration: 1000 });
  window.setTimeout(() => elements.app.classList.remove("is-entering"), 940);
}

function revealAnswer() {
  showView("revealed");
  const laugh = Math.random() < 0.24 ? "mischievousLaugh" : "laugh";
  mascot.trigger("laugh", { sound: laugh });
  document.querySelector("#another-button").focus();
}

function quitGame() {
  developer.stopReaction();
  audio.pauseMusic(true);
  audio.stopAllEffects();
  resetJokeHistory();
  loadedJokeCount = 0;
  elements.gamePanel.hidden = true;
  elements.welcomePanel.hidden = false;
  elements.app.classList.remove("is-entering");
  elements.app.dataset.state = "welcome";
  developer.sync();
  elements.welcomePanel.classList.remove("is-returning");
  void elements.welcomePanel.offsetWidth;
  elements.welcomePanel.classList.add("is-returning");
  document.querySelector("#start-button").focus();
}

developer = createDeveloperController({
  app: elements.app,
  panel: elements.developerPanel,
  closeButton: elements.developerClose,
  hint: elements.developerHint,
  startButton: elements.developerStart,
  reactionButtons: elements.developerReactionButtons,
  mascot,
  onOpen: () => {
    if (elements.audioDialog.open) {
      closeAudioDialog({ restoreFocus: false });
    }
  },
  onClose: () => elements.audioMenuButton.focus(),
  onStart: startGame
});

document.querySelectorAll(".button").forEach((button) => {
  button.addEventListener("click", () => audio.playEffect("click"));
});
document.querySelector("#start-button").addEventListener("click", startGame);
elements.revealButton.addEventListener("click", revealAnswer);
document.querySelector("#another-button").addEventListener("click", () => loadJoke({ withTransitionSound: true }));
document.querySelector("#retry-button").addEventListener("click", () => loadJoke({ withTransitionSound: true }));
document.querySelector("#quit-button").addEventListener("click", quitGame);
document.querySelector("#error-quit-button").addEventListener("click", quitGame);

elements.audioMenuButton.addEventListener("click", () => {
  audio.playEffect("click");
  openAudioDialog();
});
elements.audioCloseButton.addEventListener("click", () => closeAudioDialog());
elements.musicToggle.addEventListener("click", audio.toggleMusic);
elements.effectsToggle.addEventListener("click", audio.toggleEffects);
elements.audioDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeAudioDialog();
});
elements.audioDialog.addEventListener("click", (event) => {
  if (event.target === elements.audioDialog) {
    closeAudioDialog();
  }
});

document.addEventListener("pointerdown", mascot.registerActivity, { passive: true });
document.addEventListener("keydown", mascot.registerActivity);
document.addEventListener("keydown", developer.handleShortcut);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    musicPausedByVisibility = audio.isMusicPlaying();
    audio.pauseMusic();
    audio.stopAllEffects();
    developer.stopReaction();
    return;
  }

  if (musicPausedByVisibility) {
    audio.playMusic();
  }

  musicPausedByVisibility = false;
  mascot.scheduleIdle();
});

const developerQueryValue = new URLSearchParams(window.location.search).get("dev");
const developerModeFromQuery = ["1", "true", "chutzi"].includes(
  (developerQueryValue || "").toLowerCase()
);

developer.sync();
developer.setEnabled(developerModeFromQuery);
