export function createDeveloperController({
  app,
  panel,
  closeButton,
  hint,
  startButton,
  reactionButtons,
  mascot,
  onOpen,
  onClose,
  onStart
}) {
  let enabled = false;

  function reactionsAreAvailable() {
    return app.dataset.state === "question" || app.dataset.state === "revealed";
  }

  function resetPressedButtons() {
    reactionButtons.forEach((button) => button.setAttribute("aria-pressed", "false"));
  }

  function sync() {
    const reactionsAvailable = reactionsAreAvailable();
    reactionButtons.forEach((button) => {
      button.disabled = !reactionsAvailable;
    });
    startButton.hidden = reactionsAvailable;
    hint.textContent = reactionsAvailable
      ? "Choisis une réaction : elle se joue immédiatement."
      : "Démarre le jeu pour débloquer les réactions.";
  }

  function stopReaction() {
    mascot.stopAll();
    resetPressedButtons();
  }

  function setEnabled(nextEnabled, focusPanel = false) {
    enabled = nextEnabled;
    panel.hidden = !enabled;

    if (enabled) {
      mascot.cancelIdle(true);
      sync();
      onOpen();

      if (focusPanel) {
        closeButton.focus();
      }

      return;
    }

    stopReaction();
    mascot.scheduleIdle();

    if (focusPanel) {
      onClose();
    }
  }

  function handleShortcut(event) {
    if (event.altKey && event.shiftKey && event.key.toLowerCase() === "d") {
      event.preventDefault();
      setEnabled(!enabled, true);
    }
  }

  reactionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!reactionsAreAvailable()) {
        return;
      }

      resetPressedButtons();
      button.setAttribute("aria-pressed", "true");
      mascot.trigger(button.dataset.reaction, { onEnd: resetPressedButtons });
    });
  });
  closeButton.addEventListener("click", () => setEnabled(false, true));
  startButton.addEventListener("click", onStart);

  return {
    handleShortcut,
    isEnabled: () => enabled,
    setEnabled,
    stopReaction,
    sync
  };
}
