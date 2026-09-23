import { getEligibleJokes, getSafeFallback } from "./catalog/catalog.js";

function chooseJoke(jokes) {
  return jokes[Math.floor(Math.random() * jokes.length)];
}

export async function fetchJoke(locale, tone) {
  const candidates = getEligibleJokes(locale, tone);
  return chooseJoke(candidates.length > 0 ? candidates : [getSafeFallback(locale)]);
}

export function resetJokeHistory() {
  // Selection history is added by the adaptive-selection feature.
}
