import { readStoredValue, writeStoredValue, type KeyValueStore } from "../core/storage.js";
import { JOKE_TAGS, type HumourProfile, type JokeFeedback, type JokeTag, type Rating } from "../core/types.js";

const PROFILE_STORAGE_KEY = "chutzi-humour-profile-v1";
const MAX_FEEDBACK_ENTRIES = 80;

const RATING_SCORES: Record<Rating, number> = {
  love: 2,
  like: 1,
  neutral: 0,
  skip: -1
};

function isRating(value: unknown): value is Rating {
  return value === "love" || value === "like" || value === "neutral" || value === "skip";
}

function isFeedback(value: unknown): value is JokeFeedback {
  if (!value || typeof value !== "object") {
    return false;
  }

  const feedback = value as Partial<JokeFeedback>;
  return typeof feedback.conceptId === "string"
    && isRating(feedback.rating)
    && Array.isArray(feedback.tags)
    && feedback.tags.every((tag) => JOKE_TAGS.includes(tag))
    && typeof feedback.createdAt === "number";
}

function isProfile(value: unknown): value is HumourProfile {
  return Boolean(value)
    && typeof value === "object"
    && (value as Partial<HumourProfile>).version === 1
    && Array.isArray((value as Partial<HumourProfile>).feedback)
    && (value as HumourProfile).feedback.every(isFeedback);
}

export function createEmptyProfile(): HumourProfile {
  return { version: 1, feedback: [] };
}

export function addFeedback(profile: HumourProfile, feedback: JokeFeedback): HumourProfile {
  return {
    version: 1,
    feedback: [feedback, ...profile.feedback.filter((entry) => entry.conceptId !== feedback.conceptId)]
      .slice(0, MAX_FEEDBACK_ENTRIES)
  };
}

export function getTagWeights(profile: HumourProfile): Record<JokeTag, number> {
  const totals = Object.fromEntries(JOKE_TAGS.map((tag) => [tag, { score: 0, count: 0 }])) as Record<JokeTag, { score: number; count: number }>;
  profile.feedback.forEach((feedback) => {
    feedback.tags.forEach((tag) => {
      totals[tag].score += RATING_SCORES[feedback.rating];
      totals[tag].count += 1;
    });
  });

  return Object.fromEntries(JOKE_TAGS.map((tag) => {
    const total = totals[tag];
    return [tag, total.count === 0 ? 0 : Math.max(-1, Math.min(1, total.score / (total.count * 2)))];
  })) as Record<JokeTag, number>;
}

export function getDominantTag(profile: HumourProfile): JokeTag | undefined {
  const weights = getTagWeights(profile);
  return JOKE_TAGS.reduce((dominant, tag) => weights[tag] > (dominant ? weights[dominant] : 0) ? tag : dominant, undefined as JokeTag | undefined);
}

export function createProfileStore(store: KeyValueStore) {
  let profile = readStoredValue(store, PROFILE_STORAGE_KEY, isProfile) ?? createEmptyProfile();

  function get(): HumourProfile {
    return profile;
  }

  function record(feedback: JokeFeedback): HumourProfile {
    profile = addFeedback(profile, feedback);
    writeStoredValue(store, PROFILE_STORAGE_KEY, profile);
    return profile;
  }

  return { get, record };
}
