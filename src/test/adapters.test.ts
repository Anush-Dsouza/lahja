import { describe, expect, it } from 'vitest';
import { gvizTableToRows, spreadsheetIdFromUrl } from '../lib/adapters';

describe('public Google Sheet adapter', () => {
  it('extracts a spreadsheet id from a shared edit URL', () => {
    expect(spreadsheetIdFromUrl('https://docs.google.com/spreadsheets/d/abc-123_X/edit?usp=sharing')).toBe('abc-123_X');
    expect(spreadsheetIdFromUrl('https://script.google.com/macros/s/example/exec')).toBeNull();
  });

  it('converts a Google Visualization table into vocabulary rows', () => {
    const rows = gvizTableToRows({
      status: 'ok',
      table: {
        cols: [{ label: 'Arabic' }, { label: 'Lesson #' }, { label: 'Status' }],
        rows: [{ c: [{ v: 'شكراً' }, { v: 2, f: '2' }, { v: 'Mastered' }] }]
      }
    });

    expect(rows).toEqual([{ Arabic: 'شكراً', 'Lesson #': '2', Status: 'Mastered' }]);
  });
});
