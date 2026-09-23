import { HUMOUR_TONES, SUPPORTED_LOCALES, type HumourTone, type Locale, type UserPreferences } from "./types.js";
import { readStoredValue, writeStoredValue, type KeyValueStore } from "./storage.js";

export const PREFERENCES_STORAGE_KEY = "chutzi-preferences-v1";

const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && SUPPORTED_LOCALES.includes(value as Locale);

const isHumourTone = (value: unknown): value is HumourTone =>
  typeof value === "string" && HUMOUR_TONES.includes(value as HumourTone);

function isUserPreferences(value: unknown): value is UserPreferences {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<UserPreferences>;
  return isLocale(candidate.locale)
    && isHumourTone(candidate.humourTone)
    && typeof candidate.onboardingCompleted === "boolean";
}

export function resolveBrowserLocale(language: string | undefined): Locale {
  return language?.toLowerCase().startsWith("fr") ? "fr" : "en";
}

export function createDefaultPreferences(locale: Locale): UserPreferences {
  return {
    locale,
    humourTone: "safe",
    onboardingCompleted: false
  };
}

export function createPreferencesStore(store: KeyValueStore, defaultLocale: Locale) {
  let currentPreferences = readStoredValue(store, PREFERENCES_STORAGE_KEY, isUserPreferences)
    ?? createDefaultPreferences(defaultLocale);

  function get(): UserPreferences {
    return currentPreferences;
  }

  function update(changes: Partial<UserPreferences>): UserPreferences {
    currentPreferences = { ...currentPreferences, ...changes };
    writeStoredValue(store, PREFERENCES_STORAGE_KEY, currentPreferences);
    return currentPreferences;
  }

  return { get, update };
}
