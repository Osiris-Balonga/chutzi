import { readStoredValue, removeStoredValue, writeStoredValue } from "../core/storage.js";
import { JOKE_TAGS } from "../core/types.js";
const PROFILE_STORAGE_KEY = "chutzi-humour-profile-v1";
const MAX_FEEDBACK_ENTRIES = 80;
const RATING_SCORES = {
    love: 2,
    like: 1,
    neutral: 0,
    skip: -1
};
function isRating(value) {
    return value === "love" || value === "like" || value === "neutral" || value === "skip";
}
function isFeedback(value) {
    if (!value || typeof value !== "object") {
        return false;
    }
    const feedback = value;
    return typeof feedback.conceptId === "string"
        && isRating(feedback.rating)
        && Array.isArray(feedback.tags)
        && feedback.tags.every((tag) => JOKE_TAGS.includes(tag))
        && typeof feedback.createdAt === "number";
}
function isProfile(value) {
    return Boolean(value)
        && typeof value === "object"
        && value.version === 1
        && Array.isArray(value.feedback)
        && value.feedback.every(isFeedback);
}
export function createEmptyProfile() {
    return { version: 1, feedback: [] };
}
export function addFeedback(profile, feedback) {
    return {
        version: 1,
        feedback: [feedback, ...profile.feedback.filter((entry) => entry.conceptId !== feedback.conceptId)]
            .slice(0, MAX_FEEDBACK_ENTRIES)
    };
}
export function getTagWeights(profile) {
    const totals = Object.fromEntries(JOKE_TAGS.map((tag) => [tag, { score: 0, count: 0 }]));
    profile.feedback.forEach((feedback) => {
        feedback.tags.forEach((tag) => {
            totals[tag].score += RATING_SCORES[feedback.rating];
            totals[tag].count += 1;
        });
    });
    return Object.fromEntries(JOKE_TAGS.map((tag) => {
        const total = totals[tag];
        return [tag, total.count === 0 ? 0 : Math.max(-1, Math.min(1, total.score / (total.count * 2)))];
    }));
}
export function getDominantTag(profile) {
    const weights = getTagWeights(profile);
    return JOKE_TAGS.reduce((dominant, tag) => weights[tag] > (dominant ? weights[dominant] : 0) ? tag : dominant, undefined);
}
export function createProfileStore(store) {
    let profile = readStoredValue(store, PROFILE_STORAGE_KEY, isProfile) ?? createEmptyProfile();
    function get() {
        return profile;
    }
    function record(feedback) {
        profile = addFeedback(profile, feedback);
        writeStoredValue(store, PROFILE_STORAGE_KEY, profile);
        return profile;
    }
    function clear() {
        profile = createEmptyProfile();
        removeStoredValue(store, PROFILE_STORAGE_KEY);
        return profile;
    }
    return { clear, get, record };
}
