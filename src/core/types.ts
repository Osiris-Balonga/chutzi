export const SUPPORTED_LOCALES = ["en", "fr"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const HUMOUR_TONES = ["safe", "playful", "mischievous"] as const;

export type HumourTone = (typeof HUMOUR_TONES)[number];

export const JOKE_TAGS = [
  "wordplay",
  "absurd",
  "everyday",
  "geek",
  "gentle-spooky"
] as const;

export type JokeTag = (typeof JOKE_TAGS)[number];

export type Rating = "love" | "like" | "neutral" | "skip";

export interface LocalizedJoke {
  readonly id: string;
  readonly conceptId: string;
  readonly locale: Locale;
  readonly tone: HumourTone;
  readonly tags: readonly JokeTag[];
  readonly setup: string;
  readonly delivery: string;
}

export interface VettedJoke extends LocalizedJoke {
  readonly safety: {
    readonly status: "approved";
    readonly policyVersion: 1;
    readonly reviewedAt: string;
  };
}

export interface UserPreferences {
  readonly locale: Locale;
  readonly humourTone: HumourTone;
  readonly onboardingCompleted: boolean;
}

export interface JokeFeedback {
  readonly conceptId: string;
  readonly rating: Rating;
  readonly tags: readonly JokeTag[];
  readonly createdAt: number;
}

export interface HumourProfile {
  readonly version: 1;
  readonly feedback: readonly JokeFeedback[];
}
