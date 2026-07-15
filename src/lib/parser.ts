import Papa from 'papaparse';
import type { Flashcard } from '../types';

const REQUIRED = ['Arabic', 'English Pronunciation', 'Lesson #'];
export const normalize = (value: unknown) => String(value ?? '').trim();
export const cardId = (arabic: string, lesson: string) => `${normalize(arabic)}::${normalize(lesson) || 'unknown'}`;

export function parseCsv(text: string): Record<string, string>[] {
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: 'greedy', transformHeader: h => h.trim() });
  if (parsed.errors.length) throw new Error(`CSV parse error: ${parsed.errors[0].message}`);
  return parsed.data;
}

export function validateVocabularyRows(rows: Record<string, unknown>[]) {
  const headers = new Set(Object.keys(rows[0] || {}));
  const missing = REQUIRED.filter(h => !headers.has(h));
  if (missing.length) throw new Error(`Missing required columns: ${missing.join(', ')}`);
}

export function mergeRows(vocabRows: Record<string, unknown>[], reviewRows: Record<string, unknown>[] = []): Flashcard[] {
  validateVocabularyRows(vocabRows);
  const reviewMap = new Map<string, Record<string, unknown>>();
  for (const row of reviewRows) {
    const arabic = normalize(row['Arabic']); const lesson = normalize(row['Lesson #']);
    if (arabic) reviewMap.set(cardId(arabic, lesson), row);
  }
  const cards = new Map<string, Flashcard>();
  for (const row of vocabRows) {
    const arabic = normalize(row['Arabic']);
    const lesson = normalize(row['Lesson #']);
    if (!arabic && Object.values(row).every(v => !normalize(v))) continue;
    if (!arabic) continue;
    const id = cardId(arabic, lesson);
    const review = reviewMap.get(id);
    cards.set(id, {
      id, arabic, lesson: lesson || 'Unassigned', pronunciation: normalize(row['English Pronunciation']),
      meaning: normalize(row['English Meaning']) || undefined,
      example: normalize(row['Bahrain Example']) || undefined,
      examplePronunciation: normalize(row['Bahrain Example — English Pronunciation']) || undefined,
      firstLearned: normalize(row['First Learned']) || undefined,
      lastReviewed: normalize(row['Last Reviewed']) || undefined,
      sheetStatus: normalize(row['Status']) || undefined,
      pronunciationNote: normalize(row['Pronunciation Note']) || undefined,
      breakdown: normalize(row['Word Breakdown']) || undefined,
      front: normalize(row['Flashcard Front']) || undefined,
      category: normalize(row['Category']) || 'Uncategorised',
      reviewPriority: normalize(review?.['Priority']) || undefined,
      reviewReason: normalize(review?.['Reason for Review']) || undefined,
      sheetNextReview: normalize(review?.['Next Review']) || undefined
    });
  }
  return [...cards.values()];
}
