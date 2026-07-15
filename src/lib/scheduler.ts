import type { Flashcard, Rating, ReviewState, Strength } from '../types';

const DAY = 86400000;
export function initialState(card: Flashcard, now = new Date()): ReviewState {
  const weak = /weak|new/i.test(card.sheetStatus || '') || /high/i.test(card.reviewPriority || '');
  return { cardId: card.id, dueAt: weak ? now.toISOString() : new Date(now.getTime() + DAY).toISOString(), intervalDays: 0, ease: 2.3, repetitions: 0, lapses: 0 };
}
export function rateCard(state: ReviewState, rating: Rating, now = new Date()): ReviewState {
  let interval = state.intervalDays; let ease = state.ease; let reps = state.repetitions; let lapses = state.lapses;
  if (rating === 'again') { interval = 0.007; ease = Math.max(1.3, ease - 0.2); reps = 0; lapses += 1; }
  if (rating === 'hard') { interval = Math.max(0.25, interval ? interval * 1.2 : 0.25); ease = Math.max(1.3, ease - 0.08); reps += 1; }
  if (rating === 'good') { interval = interval <= 0.25 ? 1 : Math.max(1, interval * ease); reps += 1; }
  if (rating === 'easy') { interval = interval <= 1 ? 4 : interval * ease * 1.45; ease += 0.12; reps += 1; }
  return { ...state, intervalDays: interval, ease, repetitions: reps, lapses, lastRating: rating, lastReviewedAt: now.toISOString(), dueAt: new Date(now.getTime() + interval * DAY).toISOString() };
}
export function strengthFor(card: Flashcard, state?: ReviewState): Strength {
  if (!state || !state.lastReviewedAt) {
    if (/weak/i.test(card.sheetStatus || '')) return 'weak';
    if (/familiar|mastered/i.test(card.sheetStatus || '')) return 'familiar';
    return 'new';
  }
  if (state.lastRating === 'again' || state.lapses >= 2) return 'weak';
  if (state.intervalDays < 1) return 'learning';
  if (state.intervalDays < 7) return 'familiar';
  return 'steady';
}
export function cardScore(card: Flashcard, state: ReviewState | undefined, now = new Date()) {
  const s = state || initialState(card, now);
  const overdueHours = (now.getTime() - new Date(s.dueAt).getTime()) / 3600000;
  const priority = /high/i.test(card.reviewPriority || '') ? 120 : /medium/i.test(card.reviewPriority || '') ? 60 : 0;
  const status = /weak/i.test(card.sheetStatus || '') ? 90 : /new/i.test(card.sheetStatus || '') ? 50 : 0;
  const due = overdueHours >= 0 ? 200 + Math.min(200, overdueHours) : -Math.abs(overdueHours) / 24;
  return due + priority + status + s.lapses * 25 - s.intervalDays;
}
export function sortForReview(cards: Flashcard[], progress: Record<string, ReviewState>, now = new Date()) {
  return [...cards].sort((a, b) => cardScore(b, progress[b.id], now) - cardScore(a, progress[a.id], now));
}
