import { useRef, useState } from 'react';
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechRequestRef = useRef(0);

  const selectVoice = (voices: SpeechSynthesisVoice[], arabic: boolean) => {
    const language = arabic ? 'ar' : 'en';
    const matchingVoices = voices.filter(voice => voice.lang.toLowerCase().startsWith(language));
    const preferredLocales = arabic
      ? ['ar-AE', 'ar-BH', 'ar-SA', 'ar-QA', 'ar-KW', 'ar-OM']
      : ['en-US', 'en-GB'];
    return preferredLocales.map(locale => matchingVoices.find(voice => voice.lang.toLowerCase() === locale.toLowerCase())).find(Boolean) || matchingVoices[0] || null;
  };

  const phraseAudio = audioFor(card.arabic, card.audioUrl, voicePack);
  const exampleAudio = audioFor(card.example, card.exampleAudioUrl, voicePack);
  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    const requestId = ++speechRequestRef.current;
    window.speechSynthesis.cancel();
    const voices = window.speechSynthesis.getVoices();
    const segments = text.split(/\s+—\s+/).map(segment => segment.trim()).filter(Boolean);
    const speakNext = (index: number) => {
      if (requestId !== speechRequestRef.current || index >= segments.length) {
        utteranceRef.current = null;
        return;
      }
      const segment = segments[index];
      const arabic = /[\u0600-\u06ff]/.test(segment);
      const voice = selectVoice(voices, arabic);
      const utterance = new SpeechSynthesisUtterance(segment);
      utterance.lang = voice?.lang || (arabic ? 'ar-AE' : 'en-US');
      if (voice) utterance.voice = voice;
      utterance.rate = 0.8;
      utteranceRef.current = utterance;
      const continuePlayback = () => {
        if (utteranceRef.current === utterance) utteranceRef.current = null;
        speakNext(index + 1);
      };
      utterance.addEventListener('end', continuePlayback, { once: true });
      utterance.addEventListener('error', continuePlayback, { once: true });
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
    };
    speakNext(0);
  };
  const play = (text: string, recordingUrl?: string) => {
    audioRef.current?.pause();
    if (recordingUrl) {
      speechRequestRef.current += 1;
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      const recording = new Audio(recordingUrl);
      audioRef.current = recording;
      let fellBack = false;
      const fallback = () => {
        if (fellBack) return;
        fellBack = true;
        speak(text);
      };
      recording.addEventListener('error', fallback, { once: true });
      void recording.play().catch(fallback);
      return;
    }
    speak(text);
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
    <p className="voice-note">{phraseAudio ? `Voice: ${card.audioUrl ? 'source recording' : voicePack?.voice.label || 'loading open-source Gulf voice…'}` : 'Temporary Emirati/UAE device voice: regenerate the Gulf pack to replace it automatically.'}</p>
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
