import { useEffect, useRef, useState } from 'react';
import type { Flashcard, Rating, ReviewState } from '../types';
import { Volume2 } from './Icons';
import type { VoicePack } from '../lib/audio';
import { audioFor } from '../lib/audio';

interface Props {
  card: Flashcard;
  progress?: ReviewState;
  onRate: (rating: Rating) => void;
  compact?: boolean;
  lessons?: string[];
  selectedLesson?: string;
  onLessonChange?: (lesson: string) => void;
  statusOptions?: { value: string; label: string }[];
  selectedStatus?: string;
  onStatusChange?: (status: string) => void;
  voicePack: VoicePack | null;
}

export default function FlashcardView({ card, onRate, compact = false, lessons, selectedLesson = 'all', onLessonChange, statusOptions, selectedStatus = 'all', onStatusChange, voicePack }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [fallbackVoice, setFallbackVoice] = useState<SpeechSynthesisVoice | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const loadFallbackVoice = () => {
      const voices = window.speechSynthesis.getVoices().filter(voice => voice.lang.toLowerCase().startsWith('ar'));
      const preferredLocales = ['ar-BH', 'ar-SA', 'ar-AE', 'ar-QA', 'ar-KW', 'ar-OM'];
      setFallbackVoice(preferredLocales.map(locale => voices.find(voice => voice.lang.toLowerCase() === locale.toLowerCase())).find(Boolean) || voices[0] || null);
    };
    loadFallbackVoice();
    window.speechSynthesis.addEventListener('voiceschanged', loadFallbackVoice);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadFallbackVoice);
  }, []);

  const phraseAudio = audioFor(card.arabic, card.audioUrl, voicePack);
  const exampleAudio = audioFor(card.example, card.exampleAudioUrl, voicePack);
  const play = (text: string, recordingUrl?: string) => {
    audioRef.current?.pause();
    if (recordingUrl) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      const recording = new Audio(recordingUrl);
      audioRef.current = recording;
      void recording.play().catch(() => undefined);
      return;
    }
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = fallbackVoice?.lang || 'ar-SA';
    if (fallbackVoice) utterance.voice = fallbackVoice;
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  return <section className={`study-card ${compact ? 'compact' : ''}`} aria-live="polite">
    <div className="card-topline">
      <div className="card-context">
        {lessons && onLessonChange && <div className="review-filters" aria-label="Choose what to revise">
          <label className="review-filter">
            <span>Lesson</span>
            <select value={selectedLesson} onChange={event => onLessonChange(event.target.value)} aria-label="Choose a lesson to revise">
              <option value="all">All lessons</option>
              {lessons.map(lesson => <option key={lesson} value={lesson}>Lesson {lesson}</option>)}
            </select>
          </label>
          {statusOptions && onStatusChange && <label className="review-filter">
            <span>Status</span>
            <select value={selectedStatus} onChange={event => onStatusChange(event.target.value)} aria-label="Choose a status to revise">
              <option value="all">All statuses</option>
              {statusOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>}
        </div>}
        <span className="eyebrow">Lesson {card.lesson} · {card.category}</span>
      </div>
      <span className={`status-pill status-${(card.sheetStatus || 'new').toLowerCase()}`}>{card.sheetStatus || 'New'}</span>
    </div>
    <p className="situation">{card.front || card.reviewReason || 'Recall the meaning and say the phrase naturally.'}</p>
    <div className="arabic-row">
      <h1 dir="rtl" lang="ar">{card.arabic}</h1>
      <button className="icon-button" onClick={() => play(card.arabic, phraseAudio)} disabled={!phraseAudio && !('speechSynthesis' in window)} aria-label="Listen to Arabic phrase"><Volume2 size={22}/></button>
    </div>
    <p className="voice-note">{phraseAudio ? `Voice: ${card.audioUrl ? 'source recording' : voicePack?.voice.label || 'loading open-source Gulf voice…'}` : 'Temporary device voice: regenerate the Gulf pack to replace it automatically.'}</p>
    {!revealed ? <button className="reveal-button" onClick={() => setRevealed(true)}>Reveal answer</button> : <>
      <div className="answer-panel">
        <p className="pronunciation" dir="ltr">{card.pronunciation || 'Pronunciation not provided'}</p>
        {card.meaning ? <p className="meaning">{card.meaning}</p> : <p className="missing">English meaning is missing in the sheet.</p>}
        {card.breakdown && <Detail label="Word breakdown" text={card.breakdown}/>} 
        {card.example && <div className="detail">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}><span>Bahraini example</span><button className="icon-button" onClick={() => play(card.example!, exampleAudio)} disabled={!exampleAudio && !('speechSynthesis' in window)} aria-label="Listen to Bahraini example"><Volume2 size={18}/></button></div>
          <p dir="rtl" lang="ar">{card.example}</p>
        </div>}
        {card.examplePronunciation && <Detail label="Example pronunciation" text={card.examplePronunciation}/>} 
        {card.pronunciationNote && <div className="coach-note"><strong>Coach note</strong><span>{card.pronunciationNote}</span></div>}
      </div>
      <div className="rating-grid" aria-label="Rate this card">
        <button onClick={() => onRate('again')}><b>Again</b><small>this session</small></button>
        <button onClick={() => onRate('hard')}><b>Hard</b><small>soon</small></button>
        <button onClick={() => onRate('good')}><b>Good</b><small>later</small></button>
        <button onClick={() => onRate('easy')}><b>Easy</b><small>much later</small></button>
      </div>
    </>}
  </section>;
}

function Detail({ label, text, rtl = false }: {label: string; text: string; rtl?: boolean}) {
  return <div className="detail"><span>{label}</span><p dir={rtl ? 'rtl' : 'ltr'} lang={rtl ? 'ar' : undefined}>{text}</p></div>;
}
