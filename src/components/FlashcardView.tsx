import { useState } from 'react';
import type { Flashcard, Rating, ReviewState } from '../types';
import { Volume2 } from './Icons';

interface Props {
  card: Flashcard;
  progress?: ReviewState;
  onRate: (rating: Rating) => void;
  compact?: boolean;
}

export default function FlashcardView({ card, onRate, compact = false }: Props) {
  const [revealed, setRevealed] = useState(false);
  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-BH'; utterance.rate = 0.72;
    window.speechSynthesis.speak(utterance);
  };

  return <section className={`study-card ${compact ? 'compact' : ''}`} aria-live="polite">
    <div className="card-topline">
      <span className="eyebrow">Lesson {card.lesson} · {card.category}</span>
      <span className={`status-pill status-${(card.sheetStatus || 'new').toLowerCase()}`}>{card.sheetStatus || 'New'}</span>
    </div>
    <p className="situation">{card.front || card.reviewReason || 'Recall the meaning and say the phrase naturally.'}</p>
    <div className="arabic-row">
      <h1 dir="rtl" lang="ar">{card.arabic}</h1>
      <button className="icon-button" onClick={() => speak(card.arabic)} aria-label="Listen to Arabic phrase"><Volume2 size={22}/></button>
    </div>
    {!revealed ? <button className="reveal-button" onClick={() => setRevealed(true)}>Reveal answer</button> : <>
      <div className="answer-panel">
        <p className="pronunciation" dir="ltr">{card.pronunciation || 'Pronunciation not provided'}</p>
        {card.meaning ? <p className="meaning">{card.meaning}</p> : <p className="missing">English meaning is missing in the sheet.</p>}
        {card.breakdown && <Detail label="Word breakdown" text={card.breakdown}/>} 
        {card.example && <div className="detail">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}><span>Bahraini example</span><button className="icon-button" onClick={() => speak(card.example!)} aria-label="Listen to Bahraini example"><Volume2 size={18}/></button></div>
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
