import { HUMOUR_TONES, SUPPORTED_LOCALES } from "../core/types.js";
const BLOCKED_TERMS = [
    "abuse", "assault", "blood", "cannabis", "crime", "dead", "death", "drug", "gun", "hate",
    "kill", "murder", "naked", "penis", "porn", "rape", "racis", "sex", "shoot", "suicid",
    "violence", "vagin", "viol", "arme", "cadavre", "drogue", "mort", "porno", "sexe", "suicide",
    "tuer"
];
function normalizeText(value) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}
function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length >= 3;
}
export function isSafeText(value) {
    const normalized = normalizeText(value);
    return !BLOCKED_TERMS.some((term) => normalized.includes(term));
}
export function isVettedJoke(value) {
    if (!value || typeof value !== "object") {
        return false;
    }
    const joke = value;
    if (!isNonEmptyString(joke.id)
        || !isNonEmptyString(joke.conceptId)
        || !isNonEmptyString(joke.setup)
        || !isNonEmptyString(joke.delivery)
        || !SUPPORTED_LOCALES.includes(joke.locale)
        || !HUMOUR_TONES.includes(joke.tone)) {
        return false;
    }
    return joke.safety?.status === "approved"
        && joke.safety.policyVersion === 1
        && isNonEmptyString(joke.safety.reviewedAt)
        && isSafeText(`${joke.setup} ${joke.delivery}`);
}
