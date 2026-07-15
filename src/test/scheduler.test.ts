import { describe, expect, it } from 'vitest';
import { initialState, rateCard, sortForReview } from '../lib/scheduler';
import { fallbackCards } from '../data/fallback';
describe('scheduler', () => {
  it('Again returns within the same session window', () => { const now=new Date('2026-07-15T10:00:00Z'); const next=rateCard(initialState(fallbackCards[0],now),'again',now); expect(new Date(next.dueAt).getTime()-now.getTime()).toBeLessThan(15*60*1000); });
  it('Easy schedules farther than Good', () => { const now=new Date(); const s=initialState(fallbackCards[0],now); expect(rateCard(s,'easy',now).intervalDays).toBeGreaterThan(rateCard(s,'good',now).intervalDays); });
  it('prioritises weak cards', () => { const cards=[{...fallbackCards[0],sheetStatus:'Mastered'},{...fallbackCards[1],sheetStatus:'Weak'}]; expect(sortForReview(cards,{},new Date())[0].sheetStatus).toBe('Weak'); });
});
