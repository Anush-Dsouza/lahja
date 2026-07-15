export type Strength = 'new' | 'learning' | 'weak' | 'familiar' | 'steady';
export type Rating = 'again' | 'hard' | 'good' | 'easy';

export interface Flashcard {
  id: string;
  arabic: string;
  pronunciation: string;
  meaning?: string;
  example?: string;
  /** A recording by a Bahraini speaker. This takes priority over browser TTS. */
  audioUrl?: string;
  exampleAudioUrl?: string;
  examplePronunciation?: string;
  firstLearned?: string;
  lastReviewed?: string;
  sheetStatus?: string;
  pronunciationNote?: string;
  lesson: string;
  breakdown?: string;
  front?: string;
  category: string;
  reviewPriority?: string;
  reviewReason?: string;
  sheetNextReview?: string;
}

export interface ReviewState {
  cardId: string;
  dueAt: string;
  intervalDays: number;
  ease: number;
  repetitions: number;
  lapses: number;
  lastRating?: Rating;
  lastReviewedAt?: string;
}

export interface AppSettings {
  adapter: 'apps-script' | 'csv' | 'fallback';
  appsScriptUrl: string;
  vocabCsvUrl: string;
  reviewCsvUrl: string;
}

export interface SyncResult {
  cards: Flashcard[];
  source: string;
}
