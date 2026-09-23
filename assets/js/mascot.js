import { IDLE_REACTIONS, REACTIONS } from "./config.js";

const REACTION_CLASSES = [...new Set(Object.values(REACTIONS).map(({ className }) => className))];

function randomIdleDelay() {
  return 7500 + Math.floor(Math.random() * 6500);
}

function chooseWeightedReaction(reactions) {
  const totalWeight = reactions.reduce((sum, reaction) => sum + reaction.weight, 0);
  let cursor = Math.random() * totalWeight;

  for (const reaction of reactions) {
    cursor -= reaction.weight;

    if (cursor <= 0) {
      return reaction;
    }
  }

  return reactions.at(-1);
}

export function createMascotController({ app, mascot, audioDialog, audio, isMischievousProfile = () => false }) {
  let idleTimer = null;
  let reactionTimer = null;
  let activeSound = null;
  let activeReaction = null;
  let onReactionEnd = null;
  let lastIdleReaction = null;

  function canIdle() {
    return !document.hidden
      && !audioDialog.open
      && (app.dataset.state === "question" || app.dataset.state === "revealed");
  }

  function finishReaction({ stopSound = false, resumeIdle = false } = {}) {
    window.clearTimeout(reactionTimer);
    REACTION_CLASSES.forEach((className) => mascot.classList.remove(className));

    if (stopSound && activeSound) {
      audio.stopEffect(activeSound);
      audio.restoreMusicVolume();
    }

    const callback = onReactionEnd;
    activeReaction = null;
    activeSound = null;
    onReactionEnd = null;
    callback?.();

    if (resumeIdle) {
      scheduleIdle();
    }
  }

  function cancelIdle(stopSound = false) {
    window.clearTimeout(idleTimer);

    if (activeReaction) {
      finishReaction({ stopSound });
    }
  }

  function trigger(name, { playSound = true, sound = null, onEnd = null } = {}) {
    const reaction = REACTIONS[name];

    if (!reaction) {
      return false;
    }

    cancelIdle(true);
    activeReaction = name;
    onReactionEnd = onEnd;
    mascot.classList.add(reaction.className);

    const soundName = sound || reaction.sound;
    if (playSound && soundName) {
      activeSound = soundName;
      audio.playEffect(soundName, {
        maxDuration: reaction.duration,
        duckDuration: reaction.duration
      });
    }

    reactionTimer = window.setTimeout(() => {
      finishReaction({ resumeIdle: true });
    }, reaction.duration);

    return true;
  }

  function runIdleReaction() {
    if (!canIdle()) {
      return;
    }

    const alternatives = IDLE_REACTIONS.filter(({ name }) => name !== lastIdleReaction);
    if (isMischievousProfile() && lastIdleReaction !== "devil" && Math.random() < 0.38) {
      lastIdleReaction = "devil";
      trigger("devil", { playSound: Math.random() < 0.45 });
      return;
    }
    const selection = chooseWeightedReaction(alternatives);
    lastIdleReaction = selection.name;
    trigger(selection.name, { playSound: Math.random() <= selection.soundChance });
  }

  function scheduleIdle(delay = randomIdleDelay()) {
    window.clearTimeout(idleTimer);

    if (canIdle()) {
      idleTimer = window.setTimeout(runIdleReaction, delay);
    }
  }

  function registerActivity() {
    if (canIdle()) {
      cancelIdle(true);
      scheduleIdle();
    }
  }

  return {
    cancelIdle,
    registerActivity,
    scheduleIdle,
    stopAll: () => {
      window.clearTimeout(idleTimer);
      finishReaction({ stopSound: true });
    },
    trigger
  };
}
