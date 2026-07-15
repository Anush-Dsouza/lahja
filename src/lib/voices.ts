export interface DialectProfile {
  id: string;
  label: string;
  region: string;
  locale: string;
  sample: string;
  transliteration: string;
}

// These are conversational examples, not Modern Standard Arabic translations.
// Gulf profiles intentionally lead the list because Lahja teaches Bahraini Arabic.
export const dialectProfiles: DialectProfile[] = [
  { id: 'bahraini', label: 'Bahraini', region: 'Gulf · preferred', locale: 'ar-BH', sample: 'شلونك؟ عساك بخير؟', transliteration: 'shlonak? asāk bikhayr?' },
  { id: 'gulf', label: 'Gulf Arabic', region: 'Gulf · general', locale: 'ar-SA', sample: 'شلونك؟ شخبارك؟', transliteration: 'shlonak? shakhbārak?' },
  { id: 'saudi-najdi', label: 'Saudi (Najdi)', region: 'Saudi Arabia', locale: 'ar-SA', sample: 'وش علومك؟ عساك طيب؟', transliteration: 'wesh ulūmak? asāk ṭayyib?' },
  { id: 'saudi-hijazi', label: 'Saudi (Hijazi)', region: 'Saudi Arabia', locale: 'ar-SA', sample: 'كيفك؟ إيش الأخبار؟', transliteration: 'kayfak? ēsh al-akhbār?' },
  { id: 'emirati', label: 'Emirati', region: 'United Arab Emirates', locale: 'ar-AE', sample: 'شحالَك؟ عساك طيب؟', transliteration: 'shḥālak? asāk ṭayyib?' },
  { id: 'qatari', label: 'Qatari', region: 'Qatar', locale: 'ar-QA', sample: 'شلونك؟ شخبارك؟', transliteration: 'shlonak? shakhbārak?' },
  { id: 'kuwaiti', label: 'Kuwaiti', region: 'Kuwait', locale: 'ar-KW', sample: 'شلونك؟ شخبارك؟', transliteration: 'shlonak? shakhbārak?' },
  { id: 'omani', label: 'Omani', region: 'Oman', locale: 'ar-OM', sample: 'شلونك؟ عساك طيب؟', transliteration: 'shlonak? asāk ṭayyib?' },
  { id: 'iraqi', label: 'Iraqi', region: 'Iraq', locale: 'ar-IQ', sample: 'شلونك؟ شكو ماكو؟', transliteration: 'shlonak? shaku māku?' },
  { id: 'levantine', label: 'Levantine', region: 'Levant', locale: 'ar-LB', sample: 'كيفك؟ شو الأخبار؟', transliteration: 'kīfak? shū al-akhbār?' }
];

export const preferredGulfLocales = ['ar-BH', 'ar-AE', 'ar-SA', 'ar-QA', 'ar-KW', 'ar-OM'];

export function profileFor(id?: string) {
  return dialectProfiles.find(profile => profile.id === id) || dialectProfiles[0];
}

export function bestVoice(voices: SpeechSynthesisVoice[], profileId?: string, selectedVoiceURI?: string) {
  if (selectedVoiceURI && selectedVoiceURI !== 'auto') {
    const selected = voices.find(voice => voice.voiceURI === selectedVoiceURI);
    if (selected) return selected;
  }
  const profile = profileFor(profileId);
  const locales = [profile.locale, ...preferredGulfLocales];
  for (const locale of locales) {
    const match = voices.find(voice => voice.lang.toLowerCase() === locale.toLowerCase());
    if (match) return match;
  }
  return voices[0];
}
