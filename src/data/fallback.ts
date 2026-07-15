import type { Flashcard } from '../types';

export const fallbackCards: Flashcard[] = [
  {
    id: 'لو سمحت::1', arabic: 'لو سمحت', pronunciation: 'law sa-maht', meaning: 'Excuse me / please',
    example: 'لو سمحت، وين الحمام؟', examplePronunciation: 'law sa-maht, wain al-hammaam?',
    sheetStatus: 'Weak', pronunciationNote: 'Keep a breathy h before the final t.', lesson: '1',
    breakdown: 'لو = if; سمحت = you permit', front: 'Politely get someone’s attention.', category: 'everyday survival'
  },
  {
    id: 'عندكم هذا؟::3', arabic: 'عندكم هذا؟', pronunciation: 'in-da-kum haa-tha?', meaning: 'Do you have this?',
    example: 'عندكم هذا بلون ثاني؟', examplePronunciation: 'in-da-kum haa-tha bi-loon thaa-ni?',
    sheetStatus: 'Weak', pronunciationNote: 'Use عندكم when speaking to a shop or group.', lesson: '3',
    breakdown: 'عندكم = do you have; هذا = this', front: 'Ask a shop assistant whether an item is available.', category: 'shopping'
  },
  {
    id: 'وقف هني لو سمحت::4', arabic: 'وقف هني لو سمحت', pronunciation: 'waggif hnee law samaht', meaning: 'Stop here, please.',
    example: 'وقف هني لو سمحت عند الإشارة', examplePronunciation: 'waggif hnee law samaht ind il-ishaara',
    sheetStatus: 'New', pronunciationNote: 'هني is natural Bahraini Arabic for “here”.', lesson: '4',
    breakdown: 'وقف = stop; هني = here; لو سمحت = please', front: 'Tell a taxi driver where to stop.', category: 'taxi / directions'
  },
  {
    id: 'أبي ماي بارد::5', arabic: 'أبي ماي بارد', pronunciation: 'abi mai baarid', meaning: 'I want cold water.',
    example: 'في كافتيريا بعد الحر: أبي ماي بارد.', examplePronunciation: 'fi kafteeriya baad il-harr: abi mai baarid.',
    sheetStatus: 'Familiar', pronunciationNote: 'بارد = baa-rid.', lesson: '5',
    breakdown: 'أبي = I want; ماي = water; بارد = cold', front: 'Order cold water.', category: 'drinks'
  }
];
