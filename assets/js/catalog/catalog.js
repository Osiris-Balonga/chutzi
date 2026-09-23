import { JOKE_CATALOG } from "./jokes.js";
import { isVettedJoke } from "./safety.js";
const TONE_RANK = {
    safe: 0,
    playful: 1,
    mischievous: 2
};
export function getEligibleJokes(locale, tone) {
    return JOKE_CATALOG.filter((joke) => isVettedJoke(joke)
        && joke.locale === locale
        && TONE_RANK[joke.tone] <= TONE_RANK[tone]);
}
export function getSafeFallback(locale) {
    const fallback = JOKE_CATALOG.find((joke) => isVettedJoke(joke)
        && joke.locale === locale
        && joke.tone === "safe");
    if (!fallback) {
        throw new Error(`No safe fallback exists for locale ${locale}`);
    }
    return fallback;
}
