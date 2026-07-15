import { describe, expect, it } from 'vitest';
import { mergeRows, parseCsv } from '../lib/parser';
describe('sheet parsing', () => {
  it('handles quoted commas and Arabic', () => {
    const rows = parseCsv('Arabic,English Pronunciation,English Meaning,Lesson #,Category\n"لو سمحت","law sa-maht","Excuse me, please",1,"daily, polite"');
    expect(rows[0]['English Meaning']).toBe('Excuse me, please'); expect(rows[0].Arabic).toBe('لو سمحت');
  });
  it('deduplicates by Arabic and lesson, keeping the latest row', () => {
    const rows = [{Arabic:'زين','English Pronunciation':'zain','Lesson #':'1','English Meaning':'Good'},{Arabic:'زين','English Pronunciation':'zain','Lesson #':'1','English Meaning':'Okay'}];
    const cards = mergeRows(rows); expect(cards).toHaveLength(1); expect(cards[0].meaning).toBe('Okay');
  });
  it('does not invent a missing meaning', () => {
    const cards = mergeRows([{Arabic:'يلا','English Pronunciation':'yalla','Lesson #':'1'}]); expect(cards[0].meaning).toBeUndefined();
  });
});
