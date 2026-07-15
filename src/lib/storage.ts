import type { AppSettings, Flashcard, ReviewState } from '../types';

const KEYS = {
  cards: 'lahja.cards.v1', progress: 'lahja.progress.v1', settings: 'lahja.settings.v1', lastSync: 'lahja.lastSync.v1'
};

export const defaultSettings: AppSettings = {
  adapter: (import.meta.env.VITE_LAHJA_ADAPTER as AppSettings['adapter']) || 'apps-script',
  appsScriptUrl: import.meta.env.VITE_LAHJA_APPS_SCRIPT_URL || '',
  vocabCsvUrl: import.meta.env.VITE_LAHJA_VOCAB_CSV_URL || '',
  reviewCsvUrl: import.meta.env.VITE_LAHJA_REVIEW_CSV_URL || '',
  voiceDialect: 'bahraini',
  voiceURI: 'auto'
};

function read<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; }
}
function write<T>(key: string, value: T) { localStorage.setItem(key, JSON.stringify(value)); }

export const storage = {
  loadCards: () => read<Flashcard[]>(KEYS.cards, []),
  saveCards: (cards: Flashcard[]) => write(KEYS.cards, cards),
  loadProgress: () => read<Record<string, ReviewState>>(KEYS.progress, {}),
  saveProgress: (value: Record<string, ReviewState>) => write(KEYS.progress, value),
  loadSettings: () => ({ ...defaultSettings, ...read<Partial<AppSettings>>(KEYS.settings, {}) }),
  saveSettings: (value: AppSettings) => write(KEYS.settings, value),
  loadLastSync: () => localStorage.getItem(KEYS.lastSync),
  saveLastSync: (value: string) => localStorage.setItem(KEYS.lastSync, value),
  exportAll: () => ({ version: 1, exportedAt: new Date().toISOString(), progress: storage.loadProgress(), settings: storage.loadSettings() }),
  importAll: (value: unknown) => {
    if (!value || typeof value !== 'object') throw new Error('Invalid backup file.');
    const data = value as { progress?: Record<string, ReviewState>; settings?: AppSettings };
    if (data.progress) storage.saveProgress(data.progress);
    if (data.settings) storage.saveSettings(data.settings);
  },
  resetProgress: () => localStorage.removeItem(KEYS.progress)
};
