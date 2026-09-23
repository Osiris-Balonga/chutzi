import { HUMOUR_TONES, SUPPORTED_LOCALES } from "./types.js";
import { readStoredValue, writeStoredValue } from "./storage.js";
export const PREFERENCES_STORAGE_KEY = "chutzi-preferences-v1";
const isLocale = (value) => typeof value === "string" && SUPPORTED_LOCALES.includes(value);
const isHumourTone = (value) => typeof value === "string" && HUMOUR_TONES.includes(value);
function isUserPreferences(value) {
    if (!value || typeof value !== "object") {
        return false;
    }
    const candidate = value;
    return isLocale(candidate.locale)
        && isHumourTone(candidate.humourTone)
        && typeof candidate.onboardingCompleted === "boolean";
}
export function resolveBrowserLocale(language) {
    return language?.toLowerCase().startsWith("fr") ? "fr" : "en";
}
export function createDefaultPreferences(locale) {
    return {
        locale,
        humourTone: "safe",
        onboardingCompleted: false
    };
}
export function createPreferencesStore(store, defaultLocale) {
    let currentPreferences = readStoredValue(store, PREFERENCES_STORAGE_KEY, isUserPreferences)
        ?? createDefaultPreferences(defaultLocale);
    function get() {
        return currentPreferences;
    }
    function update(changes) {
        currentPreferences = { ...currentPreferences, ...changes };
        writeStoredValue(store, PREFERENCES_STORAGE_KEY, currentPreferences);
        return currentPreferences;
    }
    return { get, update };
}
