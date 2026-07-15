import { describe, expect, it, vi } from 'vitest';
import { syncCards } from '../lib/adapters';
describe('offline fallback', () => {
  it('returns bundled cards when fallback adapter is selected', async () => { const result=await syncCards({adapter:'fallback',appsScriptUrl:'',vocabCsvUrl:'',reviewCsvUrl:'',voiceDialect:'bahraini',voiceURI:'auto'}); expect(result.cards.length).toBeGreaterThan(0); });
  it('throws cleanly when network source is missing', async () => { vi.stubGlobal('fetch',vi.fn()); await expect(syncCards({adapter:'csv',appsScriptUrl:'',vocabCsvUrl:'',reviewCsvUrl:'',voiceDialect:'bahraini',voiceURI:'auto'})).rejects.toThrow(/not configured/); });
});
