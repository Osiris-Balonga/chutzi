import { createJokeSelector } from "./selection/selector.js";

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
      // The selector remains available for the current session.
    }
  },
  removeItem(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // There is no persisted selector state to remove.
    }
  }
};

const selector = createJokeSelector({ store: browserStorage });

export async function fetchJoke(locale, tone) {
  return selector.next({ locale, tone });
}

export function resetJokeHistory() {
  selector.clearQueue();
}
