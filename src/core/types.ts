export const SUPPORTED_LOCALES = ["en", "fr"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const HUMOUR_TONES = ["safe", "playful", "mischievous"] as const;

export type HumourTone = (typeof HUMOUR_TONES)[number];

export interface LocalizedJoke {
  readonly id: string;
  readonly conceptId: string;
  readonly locale: Locale;
  readonly tone: HumourTone;
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
