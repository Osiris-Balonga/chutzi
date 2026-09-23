import type { HumourTone, Locale, VettedJoke } from "../core/types.js";
import { JOKE_CATALOG } from "./jokes.js";
import { isVettedJoke } from "./safety.js";

const TONE_RANK: Record<HumourTone, number> = {
  safe: 0,
  playful: 1,
  mischievous: 2
};

export function filterEligibleJokes(
  catalog: readonly VettedJoke[],
  locale: Locale,
  tone: HumourTone
): readonly VettedJoke[] {
  return catalog.filter((joke) => isVettedJoke(joke)
    && joke.locale === locale
    && TONE_RANK[joke.tone] <= TONE_RANK[tone]);
}

export function getEligibleJokes(locale: Locale, tone: HumourTone): readonly VettedJoke[] {
  return filterEligibleJokes(JOKE_CATALOG, locale, tone);
}

export function getSafeFallback(locale: Locale): VettedJoke {
  const fallback = JOKE_CATALOG.find((joke) => isVettedJoke(joke)
    && joke.locale === locale
    && joke.tone === "safe");

  if (!fallback) {
    throw new Error(`No safe fallback exists for locale ${locale}`);
  }

  return fallback;
}
