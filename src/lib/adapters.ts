import type { AppSettings, Flashcard, SyncResult } from '../types';
import { fallbackCards } from '../data/fallback';
import { mergeRows, parseCsv } from './parser';

interface GvizPayload {
  status?: string;
  errors?: { detailed_message?: string; message?: string }[];
  table?: {
    cols?: { label?: string }[];
    rows?: { c?: ({ v?: unknown; f?: string } | null)[] }[];
  };
}

export function spreadsheetIdFromUrl(value: string) {
  return value.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1] || null;
}

export function gvizTableToRows(payload: GvizPayload): Record<string, unknown>[] {
  const columns = payload.table?.cols || [];
  return (payload.table?.rows || []).map(row => Object.fromEntries(columns.map((column, index) => {
    const cell = row.c?.[index];
    return [column.label || `Column ${index + 1}`, cell?.f ?? cell?.v ?? ''];
  })));
}

function fetchPublicSheet(spreadsheetId: string, sheetName: string): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const callbackName = `__lahjaGviz${Date.now()}${Math.random().toString(36).slice(2)}`;
    const root = globalThis as unknown as Record<string, unknown>;
    const script = document.createElement('script');
    const cleanup = () => { delete root[callbackName]; script.remove(); clearTimeout(timeout); };
    const timeout = window.setTimeout(() => { cleanup(); reject(new Error(`Timed out reading ${sheetName}.`)); }, 15000);

    root[callbackName] = (payload: GvizPayload) => {
      cleanup();
      if (payload.status && payload.status !== 'ok') {
        reject(new Error(payload.errors?.[0]?.detailed_message || payload.errors?.[0]?.message || `Could not read ${sheetName}.`));
        return;
      }
      resolve(gvizTableToRows(payload));
    };
    script.onerror = () => { cleanup(); reject(new Error(`Could not load ${sheetName} from the public Google Sheet.`)); };
    const query = encodeURIComponent(`out:json;responseHandler:${callbackName}`);
    script.src = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(spreadsheetId)}/gviz/tq?sheet=${encodeURIComponent(sheetName)}&tqx=${query}`;
    document.head.append(script);
  });
}

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
  const publicSpreadsheetId = spreadsheetIdFromUrl(settings.appsScriptUrl);
  if (publicSpreadsheetId) {
    const [vocabulary, reviewQueue] = await Promise.all([
      fetchPublicSheet(publicSpreadsheetId, 'Vocabulary Mastery'),
      fetchPublicSheet(publicSpreadsheetId, 'Review Queue').catch(() => [])
    ]);
    return { cards: mergeRows(vocabulary, reviewQueue), source: 'Public Google Sheet' };
  }
  const response = await fetch(settings.appsScriptUrl, { cache: 'no-store', redirect: 'follow' });
  if (!response.ok) throw new Error(`Apps Script request failed (${response.status})`);
  const payload = await response.json() as { vocabulary?: Record<string, unknown>[]; reviewQueue?: Record<string, unknown>[]; cards?: Flashcard[] };
  if (Array.isArray(payload.cards)) return { cards: payload.cards, source: 'Google Apps Script JSON' };
  if (!Array.isArray(payload.vocabulary)) throw new Error('Apps Script response must include vocabulary[].');
  return { cards: mergeRows(payload.vocabulary, payload.reviewQueue || []), source: 'Google Apps Script JSON' };
}
