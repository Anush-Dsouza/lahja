# Lahja

Lahja is a mobile-first personal revision PWA for conversational Bahraini/Gulf Arabic. It reads phrases from **Bahraini Arabic Master Tracker**, shows cached cards immediately, syncs in the background, and stores personal spaced-repetition progress only in the browser.

## Product decisions

- **Static-safe architecture:** React + TypeScript + Vite; no backend is required on GitHub Pages.
- **Recommended data path:** a public, read-only Google Apps Script web-app that exposes only the two required tabs as JSON. No OAuth secret, service account, or private API key enters the repository.
- **Resilience:** bundled fallback cards → cached cards → background validation → atomic cache replacement. A failed sync never erases valid local cards.
- **Stable progress:** local scheduling is keyed by `Arabic phrase + lesson number`, so sheet refreshes do not overwrite ratings.
- **Sheet status remains authoritative but read-only:** Weak/New/Priority influence ordering; local ratings do not write back to Google Sheets.
- **Dynamic curriculum:** categories and lessons are derived from sheet values. New modules appear automatically.
- **Consistent Gulf pronunciation:** lesson audio is pre-generated with an Apache-2.0 Saudi/Khaleeji model and bundled as static MP3 files. The same voice plays on iPhone, Android, and desktop without a cloud API or device TTS.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

The first launch always has bundled fallback cards. Configure a live source in Settings or `.env.local`.

## Recommended Google Apps Script connection

1. Open `script.google.com` and create a project.
2. Paste `apps-script.gs` from this repository.
3. Confirm `SPREADSHEET_ID` is `1PtIalIvsOMeCrhMl5pXMU07s7-rYuK3_r-fQ_BhLm34`.
4. Select **Deploy → New deployment → Web app**.
5. Execute as **Me**. Set access to **Anyone** (the endpoint is read-only, but the selected sheet fields become public to anyone with the URL).
6. Copy the `/exec` URL.
7. In Lahja → Settings, select **Apps Script JSON**, paste the URL, and press **Sync now**.

The script reads only `Vocabulary Mastery` and `Review Queue`. Extend `ALLOWED_TABS` and the JSON payload later for another learning module.

## Published CSV alternative

For each required tab:

1. In Google Sheets choose **File → Share → Publish to web**.
2. Select the individual tab and **Comma-separated values (.csv)**.
3. Paste the Vocabulary URL and optional Review Queue URL in Lahja Settings.

Publishing exposes that tab publicly. CSV is simple but two-tab sync is less controlled than Apps Script.

## GitHub Pages deployment

1. Create a GitHub repository named `lahja`.
2. Push this project to the `main` branch.
3. In **Settings → Pages**, choose **GitHub Actions** as the source.
4. The included workflow tests and builds the app, then deploys `dist/`.
5. Open `https://YOUR-USERNAME.github.io/lahja/`.

The Vite production base is `/lahja/`. Change `base` in `vite.config.ts` when the repository name differs, or use `'/'` for a custom domain.

## PWA installation

- Android Chrome: open the deployed site → menu → **Install app** or **Add to Home screen**.
- Installed mode uses `display: standalone`, safe-area padding, offline app shell, and no browser address bar.
- iPhone Safari: Share → **Add to Home Screen**.

## Data validation

Required Vocabulary columns: `Arabic`, `English Pronunciation`, `Lesson #`.

Optional fields remain empty when absent. Lahja never invents an English translation. Rows are ignored when completely empty. CSV parsing uses Papa Parse for quoted commas, quotation marks, semicolons, Unicode, and Arabic text.

Lahja includes a fixed synthetic Gulf Arabic voice for the current lesson phrases and examples. A newly added phrase that is not in the pack temporarily uses the device's best available Gulf/Arabic speech synthesizer; regenerating and publishing the pack automatically replaces that fallback when its exact text appears in the new manifest. An explicit public MP3/WAV URL in the optional `Bahraini Audio URL` column (and `Bahrain Example Audio URL` for examples) still takes priority when supplied. See [VOICE_MODEL.md](VOICE_MODEL.md) for the model, license, and regeneration details.

## Scheduling model

- Sheet Weak/New and Review Queue priority boost initial order.
- **Again:** approximately 10 minutes and reinserted into the current session.
- **Hard:** approximately 6 hours initially.
- **Good:** 1 day initially, then multiplied by ease.
- **Easy:** 4 days initially, then a larger multiplier.
- Ratings, intervals, ease, lapses, and due dates are stored locally.

## Tests and production verification

```bash
npm test
npm run build
```

Coverage includes quoted CSV parsing, Arabic data, deduplication, missing meanings, scheduling behavior, priority ordering, and bundled offline fallback.

## Future modules

The adapter layer is intentionally interchangeable. Add a module definition containing its tab names and field mapper, then reuse the same cache/scheduler UI. Keep each Apps Script response sanitized and read-only. Do not expose private tabs through a broad spreadsheet export.
