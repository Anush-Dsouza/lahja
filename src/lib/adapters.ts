import type { AppSettings, Flashcard, SyncResult } from '../types';
import { fallbackCards } from '../data/fallback';
import { mergeRows, parseCsv } from './parser';

async function fetchText(url: string) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.text();
}

export async function syncCards(settings: AppSettings): Promise<SyncResult> {
  if (settings.adapter === 'fallback') return { cards: fallbackCards, source: 'Bundled fallback' };
  if (settings.adapter === 'csv') {
    if (!settings.vocabCsvUrl) throw new Error('Vocabulary CSV URL is not configured.');
    const [vocabText, reviewText] = await Promise.all([
      fetchText(settings.vocabCsvUrl),
      settings.reviewCsvUrl ? fetchText(settings.reviewCsvUrl).catch(() => '') : Promise.resolve('')
    ]);
    return { cards: mergeRows(parseCsv(vocabText), reviewText ? parseCsv(reviewText) : []), source: 'Published Google Sheets CSV' };
  }
  if (!settings.appsScriptUrl) throw new Error('Apps Script URL is not configured.');
  const response = await fetch(settings.appsScriptUrl, { cache: 'no-store', redirect: 'follow' });
  if (!response.ok) throw new Error(`Apps Script request failed (${response.status})`);
  const payload = await response.json() as { vocabulary?: Record<string, unknown>[]; reviewQueue?: Record<string, unknown>[]; cards?: Flashcard[] };
  if (Array.isArray(payload.cards)) return { cards: payload.cards, source: 'Google Apps Script JSON' };
  if (!Array.isArray(payload.vocabulary)) throw new Error('Apps Script response must include vocabulary[].');
  return { cards: mergeRows(payload.vocabulary, payload.reviewQueue || []), source: 'Google Apps Script JSON' };
}
