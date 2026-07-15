/** Lahja read-only JSON adapter. Deploy as a Web App: execute as Me, access: Anyone. */
const SPREADSHEET_ID = '1-uPRGmXQo7ygtf2WxDdczal0QPHvn4rt3R8bqi12I9I';
const ALLOWED_TABS = ['Vocabulary Mastery', 'Review Queue'];

function doGet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    vocabulary: sheetToObjects_(ss.getSheetByName(ALLOWED_TABS[0])),
    reviewQueue: sheetToObjects_(ss.getSheetByName(ALLOWED_TABS[1]))
  };
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function sheetToObjects_(sheet) {
  if (!sheet) return [];
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return [];
  const headers = values[0].map(String);
  return values.slice(1).filter(row => row.some(cell => String(cell).trim()))
    .map(row => Object.fromEntries(headers.map((header, i) => [header, row[i] || ''])));
}
