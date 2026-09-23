import {
  HUMOUR_TONES,
  SUPPORTED_LOCALES,
  type VettedJoke
} from "../core/types.js";

const BLOCKED_TERMS = [
  "abuse", "assault", "blood", "cannabis", "crime", "dead", "death", "drug", "gun", "hate",
  "kill", "murder", "naked", "penis", "porn", "rape", "racis", "sex", "shoot", "suicid",
  "violence", "vagin", "viol", "arme", "cadavre", "drogue", "mort", "porno", "sexe", "suicide",
  "tuer"
] as const;

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length >= 3;
}

export function isSafeText(value: string): boolean {
  const normalized = normalizeText(value);
  return !BLOCKED_TERMS.some((term) => normalized.includes(term));
}

export function isVettedJoke(value: unknown): value is VettedJoke {
  if (!value || typeof value !== "object") {
    return false;
  }

  const joke = value as Partial<VettedJoke>;
  if (!isNonEmptyString(joke.id)
    || !isNonEmptyString(joke.conceptId)
    || !isNonEmptyString(joke.setup)
    || !isNonEmptyString(joke.delivery)
    || !SUPPORTED_LOCALES.includes(joke.locale as (typeof SUPPORTED_LOCALES)[number])
    || !HUMOUR_TONES.includes(joke.tone as (typeof HUMOUR_TONES)[number])) {
    return false;
  }

  return joke.safety?.status === "approved"
    && joke.safety.policyVersion === 1
    && isNonEmptyString(joke.safety.reviewedAt)
    && isSafeText(`${joke.setup} ${joke.delivery}`);
}
