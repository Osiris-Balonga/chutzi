import { createAudioController } from "./audio.js";
import { createDeveloperController } from "./developer.js";
import { fetchJoke, resetJokeHistory } from "./jokes.js";
import { createMascotController } from "./mascot.js";
import { createPreferencesStore, resolveBrowserLocale } from "./core/preferences.js";
import { getFeedbackPrompt, translate } from "./core/i18n.js";
import { createProfileStore, getDominantTag, getTagWeights } from "./profile/profile.js";
import { JOKE_TAGS } from "./core/types.js";

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
  feedbackPanel: document.querySelector("#feedback-panel"),
  feedbackPrompt: document.querySelector("#feedback-prompt"),
  feedbackButtons: [...document.querySelectorAll("[data-feedback-rating]")],
  feedbackSkipButton: document.querySelector("#feedback-skip-button"),
  profileButton: document.querySelector("#profile-button"),
  profilePanel: document.querySelector("#profile-panel"),
  profileBackButton: document.querySelector("#profile-back-button"),
  profileCopy: document.querySelector("#profile-copy"),
  profileDonut: document.querySelector("#profile-donut"),
  profileMascotImage: document.querySelector("#profile-mascot-image"),
  profileLegend: document.querySelector("#profile-legend"),
  profileResetButton: document.querySelector("#profile-reset-button"),
  mascot: document.querySelector("#mascot"),
  audioMenuButton: document.querySelector("#audio-menu-button"),
  audioDialog: document.querySelector("#audio-dialog"),
  audioCloseButton: document.querySelector("#audio-close-button"),
  musicToggle: document.querySelector("#music-toggle"),
  effectsToggle: document.querySelector("#effects-toggle"),
  onboardingDialog: document.querySelector("#onboarding-dialog"),
  onboardingContinueButton: document.querySelector("#onboarding-continue-button"),
  developerPanel: document.querySelector("#developer-panel"),
  developerClose: document.querySelector("#developer-close"),
  developerHint: document.querySelector("#developer-hint"),
  developerStart: document.querySelector("#developer-start"),
  developerReactionButtons: [...document.querySelectorAll(".developer-reaction")]
};

const browserStorage = {
  getItem(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // The current session still keeps its in-memory preferences.
    }
  },
  removeItem(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // There is no persisted value to remove when storage is unavailable.
    }
  }
};

const preferenceStore = createPreferencesStore(browserStorage, resolveBrowserLocale(navigator.language));
let preferences = preferenceStore.get();
const profileStore = createProfileStore(browserStorage);
let profile = profileStore.get();

function t(key, values) {
  return translate(preferences.locale, key, values);
}

const audio = createAudioController({
  app: elements.app,
  menuButton: elements.audioMenuButton,
  musicToggle: elements.musicToggle,
  effectsToggle: elements.effectsToggle,
  translate: t
});

const mascot = createMascotController({
  app: elements.app,
  mascot: elements.mascot,
  audioDialog: elements.audioDialog,
  audio,
  isMischievousProfile: () => getDominantTag(profile) === "gentle-spooky"
});

let loadedJokeCount = 0;
let dialogCloseTimer = null;
let musicPausedByVisibility = false;
let jokeRequestId = 0;
let promptIndex = 0;
let currentJoke = null;
let profileReturnView = "welcome";
let profileMascotIndex = 0;
let developer;

function applyTranslations() {
  document.documentElement.lang = preferences.locale;
  document.title = t("document.title");

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
  });
  document.querySelectorAll("[data-i18n-content]").forEach((element) => {
    element.setAttribute("content", t(element.dataset.i18nContent));
  });

  audio.updateControls();
  developer?.sync();
  if (elements.app.dataset.state === "profile") {
    renderProfile();
  }
}

function syncPreferenceControls() {
  document.querySelectorAll("[data-locale-choice]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.localeChoice === preferences.locale));
  });
  document.querySelectorAll("[data-tone-choice]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.toneChoice === preferences.humourTone));
  });
}

function updatePreferences(changes) {
  const previousLocale = preferences.locale;
  preferences = preferenceStore.update(changes);
  applyTranslations();
  syncPreferenceControls();

  if (previousLocale !== preferences.locale && !elements.gamePanel.hidden) {
    void loadJoke({ withTransitionSound: true });
  }
}

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
  elements.feedbackPanel.hidden = true;
  elements.profilePanel.hidden = true;
  elements.app.dataset.state = name;
  developer.sync();

  if (name === "question" || name === "revealed") {
    mascot.scheduleIdle();
  }
}

function renderProfile() {
  const weights = getTagWeights(profile);
  const segments = JOKE_TAGS.map((tag) => Math.max(1, 1 + weights[tag]));
  const colors = ["#b2eb06", "#899dfe", "#ffd36e", "#f7a7d6", "#ff8b93"];
  const total = segments.reduce((sum, value) => sum + value, 0);
  let cursor = 0;
  const gradient = segments.map((segment, index) => {
    const start = cursor;
    cursor += segment / total * 100;
    return `${colors[index]} ${start}% ${cursor}%`;
  }).join(", ");
  const dominant = getDominantTag(profile);
  const mascotImages = dominant === "gentle-spooky"
    ? ["devil.png", "laugh.png"]
    : dominant ? ["laugh.png", "chat.png"] : ["look.png", "think.png"];

  elements.profileDonut.style.background = `conic-gradient(${gradient})`;
  elements.profileMascotImage.src = `assets/images/reactions/${mascotImages[profileMascotIndex % mascotImages.length]}`;
  elements.profileCopy.textContent = profile.feedback.length === 0
    ? t("profile.empty")
    : profile.feedback.length < 4 ? t("profile.early") : t("profile.established");
  elements.profileLegend.replaceChildren(...JOKE_TAGS.map((tag) => {
    const item = document.createElement("li");
    item.textContent = t(`tag.${tag}`);
    return item;
  }));
}

function openProfile() {
  profileReturnView = elements.gamePanel.hidden ? "welcome" : elements.app.dataset.state;
  developer.stopReaction();
  elements.welcomePanel.hidden = true;
  elements.gamePanel.hidden = true;
  elements.profilePanel.hidden = false;
  elements.app.dataset.state = "profile";
  renderProfile();
  elements.profileBackButton.focus();
}

function closeProfile() {
  elements.profilePanel.hidden = true;
  if (profileReturnView === "welcome") {
    elements.welcomePanel.hidden = false;
    elements.app.dataset.state = "welcome";
    elements.profileButton.focus();
    return;
  }

  elements.gamePanel.hidden = false;
  showView(profileReturnView);
  elements.profileButton.focus();
}

async function loadJoke({ withTransitionSound = false } = {}) {
  const requestId = ++jokeRequestId;
  audio.stopEffect("laugh");
  audio.stopEffect("mischievousLaugh");

  if (withTransitionSound) {
    audio.playEffect("whoosh", { maxDuration: 900 });
  }

  showView("loading");

  try {
    const joke = await fetchJoke(preferences.locale, preferences.humourTone, getTagWeights(profile));

    if (requestId !== jokeRequestId) {
      return;
    }

    loadedJokeCount += 1;
    currentJoke = joke;
    elements.jokeQuestion.textContent = joke.setup;
    elements.jokeDelivery.textContent = joke.delivery;
    showView("question");

    if (loadedJokeCount > 1 && Math.random() < 0.55) {
      audio.playEffect("joking", { maxDuration: 1200, duckDuration: 1100 });
    }

    elements.revealButton.focus();
  } catch (error) {
    if (requestId !== jokeRequestId) {
      return;
    }
    console.error("Unable to load joke:", error);
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
  elements.jokeActions.hidden = true;
  elements.feedbackPanel.hidden = false;
  elements.feedbackPrompt.textContent = getFeedbackPrompt(preferences.locale, promptIndex);
  promptIndex += 1;
  const laugh = Math.random() < 0.24 ? "mischievousLaugh" : "laugh";
  mascot.trigger("laugh", { sound: laugh });
  elements.feedbackButtons[0].focus();
}

function finishFeedback() {
  elements.feedbackPanel.hidden = true;
  elements.jokeActions.hidden = false;
  document.querySelector("#another-button").focus();
}

function submitFeedback(rating) {
  if (!currentJoke) {
    finishFeedback();
    return;
  }

  profile = profileStore.record({
    conceptId: currentJoke.conceptId,
    rating,
    tags: currentJoke.tags,
    createdAt: Date.now()
  });

  mascot.trigger(rating === "love" ? "laugh" : rating === "skip" ? "think" : "chat");
  finishFeedback();
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
  translate: t,
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
elements.feedbackButtons.forEach((button) => {
  button.addEventListener("click", () => submitFeedback(button.dataset.feedbackRating));
});
elements.feedbackSkipButton.addEventListener("click", finishFeedback);
elements.profileButton.addEventListener("click", openProfile);
elements.profileBackButton.addEventListener("click", closeProfile);
elements.profileDonut.addEventListener("click", () => {
  profileMascotIndex += 1;
  renderProfile();
});
elements.profileResetButton.addEventListener("click", () => {
  if (window.confirm(t("profile.resetConfirm"))) {
    profile = profileStore.clear();
    profileMascotIndex = 0;
    renderProfile();
  }
});

document.querySelectorAll("[data-locale-choice]").forEach((button) => {
  button.addEventListener("click", () => updatePreferences({ locale: button.dataset.localeChoice }));
});
document.querySelectorAll("[data-tone-choice]").forEach((button) => {
  button.addEventListener("click", () => updatePreferences({ humourTone: button.dataset.toneChoice }));
});

elements.onboardingContinueButton.addEventListener("click", () => {
  updatePreferences({ onboardingCompleted: true });
  elements.onboardingDialog.close();
  document.querySelector("#start-button").focus();
});
elements.onboardingDialog.addEventListener("cancel", (event) => event.preventDefault());

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

applyTranslations();
syncPreferenceControls();
developer.sync();
developer.setEnabled(developerModeFromQuery);

if (!preferences.onboardingCompleted) {
  elements.onboardingDialog.showModal();
}
