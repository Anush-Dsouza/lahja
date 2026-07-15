import { useEffect, useMemo, useState } from 'react';
import type { AppSettings, Flashcard, Rating, ReviewState } from './types';
import { fallbackCards } from './data/fallback';
import { storage } from './lib/storage';
import { syncCards } from './lib/adapters';
import { initialState, rateCard, sortForReview, strengthFor } from './lib/scheduler';
import FlashcardView from './components/FlashcardView';
import BottomNav, { type Screen } from './components/BottomNav';
import { CheckCircle2, Cloud, CloudOff, Clock3, Download, Search, Sparkles, Trash2, Upload } from './components/Icons';

export default function App() {
  const [screen, setScreen] = useState<Screen>('today');
  const [cards, setCards] = useState<Flashcard[]>(() => storage.loadCards().length ? storage.loadCards() : fallbackCards);
  const [progress, setProgress] = useState<Record<string, ReviewState>>(() => storage.loadProgress());
  const [settings, setSettings] = useState<AppSettings>(() => storage.loadSettings());
  const [syncState, setSyncState] = useState<'idle'|'syncing'|'success'|'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('Using saved cards');
  const [lastSync, setLastSync] = useState<string | null>(() => storage.loadLastSync());
  const [sessionDone, setSessionDone] = useState(0);
  const [sessionAgain, setSessionAgain] = useState<string[]>([]);
  const [focusCategory, setFocusCategory] = useState<string | null>(null);
  const [focusLesson, setFocusLesson] = useState('all');
  const [focusStatus, setFocusStatus] = useState('all');

  const lessons = useMemo(
    () => [...new Set(cards.map(card => card.lesson))].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    ),
    [cards]
  );

  useEffect(() => {
    if (focusLesson !== 'all' && !lessons.includes(focusLesson)) setFocusLesson('all');
  }, [focusLesson, lessons]);

  const lessonCards = useMemo(
    () => focusLesson === 'all' ? cards : cards.filter(card => card.lesson === focusLesson),
    [cards, focusLesson]
  );

  const statusOptions = useMemo(() => {
    const options = new Map<string, string>();
    lessonCards.forEach(card => {
      const label = card.sheetStatus?.trim() || 'Unassigned';
      const value = label.toLocaleLowerCase();
      if (!options.has(value)) options.set(value, label);
    });
    return [...options].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [lessonCards]);

  useEffect(() => {
    if (focusStatus !== 'all' && !statusOptions.some(option => option.value === focusStatus)) setFocusStatus('all');
  }, [focusStatus, statusOptions]);

  const reviewCards = useMemo(
    () => focusStatus === 'all'
      ? lessonCards
      : lessonCards.filter(card => (card.sheetStatus?.trim() || 'Unassigned').toLocaleLowerCase() === focusStatus),
    [lessonCards, focusStatus]
  );

  const ordered = useMemo(() => {
    const pool = focusCategory ? reviewCards.filter(c => c.category === focusCategory) : reviewCards;
    const normal = sortForReview(pool, progress);
    const againCards = sessionAgain.map(id => pool.find(c => c.id === id)).filter(Boolean) as Flashcard[];
    return [...againCards, ...normal.filter(c => !sessionAgain.includes(c.id))];
  }, [reviewCards, progress, sessionAgain, focusCategory]);
  const current = ordered[0];

  async function sync() {
    setSyncState('syncing'); setSyncMessage('Checking Google Sheet…');
    try {
      const result = await syncCards(settings);
      if (!result.cards.length) throw new Error('The source returned no usable cards.');
      setCards(result.cards); storage.saveCards(result.cards);
      const time = new Date().toISOString(); storage.saveLastSync(time); setLastSync(time);
      setSyncState('success'); setSyncMessage(`${result.cards.length} cards · ${result.source}`);
    } catch (error) {
      setSyncState('error'); setSyncMessage(error instanceof Error ? error.message : 'Sync failed.');
    }
  }
  useEffect(() => { void sync(); }, []);

  function rate(rating: Rating) {
    if (!current) return;
    const state = progress[current.id] || initialState(current);
    const next = { ...progress, [current.id]: rateCard(state, rating) };
    setProgress(next); storage.saveProgress(next); setSessionDone(v => v + 1);
    if (rating === 'again') setSessionAgain(v => [...v.filter(id => id !== current.id), current.id]);
    else setSessionAgain(v => v.filter(id => id !== current.id));
  }

  const recentlyStrong = Object.values(progress).filter(p => p.lastRating === 'good' || p.lastRating === 'easy').sort((a,b) => (b.lastReviewedAt || '').localeCompare(a.lastReviewedAt || '')).slice(0,3);
  const dueCount = reviewCards.filter(c => new Date((progress[c.id] || initialState(c)).dueAt) <= new Date()).length;

  return <div className="app-shell">
    <header className="topbar">
      <div><div className="brand">Lahja<span>لهجة</span></div><p>Personal Bahraini Arabic revision</p></div>
      <button className={`sync-chip ${syncState}`} onClick={sync} title={syncMessage}>
        {syncState === 'error' ? <CloudOff size={16}/> : <Cloud size={16}/>}<span>{syncState === 'syncing' ? 'Syncing' : syncState === 'error' ? 'Offline' : 'Synced'}</span>
      </button>
    </header>

    <main>
      {screen === 'today' && <>
        <section className="today-summary">
          <div><span>Due now</span><strong>{dueCount}</strong></div>
          <div><span>Session</span><strong>{sessionDone}</strong></div>
          <div><span>{focusLesson === 'all' && focusStatus === 'all' ? 'Total phrases' : 'Filtered phrases'}</span><strong>{reviewCards.length}</strong></div>
        </section>
        {focusCategory && <button className="focus-banner" onClick={() => setFocusCategory(null)}>Focused practice: {focusCategory} · Clear</button>}
        {current ? <FlashcardView
          key={`${current.id}-${currentStateKey(progress[current.id])}`}
          card={current}
          progress={progress[current.id]}
          lessons={lessons}
          selectedLesson={focusLesson}
          onLessonChange={lesson => { setFocusLesson(lesson); setFocusStatus('all'); setFocusCategory(null); }}
          statusOptions={statusOptions}
          selectedStatus={focusStatus}
          onStatusChange={status => { setFocusStatus(status); setFocusCategory(null); }}
          onRate={rate}
        /> : <EmptyState/>}
        <section className="mini-section"><div className="section-heading"><h2>Five-minute review</h2><span>{Math.min(8, dueCount || reviewCards.length)} suggested</span></div><p>Start with weak and overdue phrases. “Again” loops the phrase back into this session.</p></section>
        <section className="mini-section"><div className="section-heading"><h2>Recently strengthened</h2></div>{recentlyStrong.length ? recentlyStrong.map(item => { const card = cards.find(c => c.id === item.cardId); return card && <div className="recent-row" key={item.cardId}><CheckCircle2 size={18}/><span dir="rtl">{card.arabic}</span><small>{item.lastRating}</small></div>; }) : <p>Your successful reviews will appear here.</p>}</section>
      </>}
      {screen === 'map' && <LearningMap cards={cards} progress={progress} onFocus={category => { setFocusCategory(category); setScreen('today'); }}/>} 
      {screen === 'library' && <Library cards={cards} progress={progress} onOpen={card => { setFocusCategory(card.category); setScreen('today'); }}/>} 
      {screen === 'settings' && <Settings settings={settings} setSettings={setSettings} sync={sync} syncState={syncState} syncMessage={syncMessage} lastSync={lastSync} onProgressImported={() => setProgress(storage.loadProgress())} onReset={() => { storage.resetProgress(); setProgress({}); }}/>} 
    </main>
    <BottomNav screen={screen} onChange={setScreen}/>
  </div>;
}

function currentStateKey(state?: ReviewState) { return state?.lastReviewedAt || 'new'; }
function EmptyState() { return <div className="empty"><Sparkles/><h2>You are caught up</h2><p>Open the Learning Map for focused practice.</p></div>; }

function LearningMap({ cards, progress, onFocus }: { cards: Flashcard[]; progress: Record<string, ReviewState>; onFocus: (c:string)=>void }) {
  const groups = useMemo(() => {
    const map = new Map<string, Flashcard[]>();
    cards.forEach(card => { const keys = card.category.split('/').map(v => v.trim()).filter(Boolean); (keys.length ? keys : ['Uncategorised']).forEach(key => map.set(key, [...(map.get(key)||[]), card])); });
    return [...map.entries()].sort((a,b) => b[1].length-a[1].length);
  }, [cards]);
  return <section><div className="page-title"><span>Learning map</span><h1>Your phrases, organised by real life</h1><p>Categories grow automatically from the sheet. Nothing here is a fixed curriculum.</p></div>
    <div className="map-grid">{groups.map(([category, group]) => { const strengths = group.map(c => strengthFor(c, progress[c.id])); const steady = strengths.filter(s => s === 'steady' || s === 'familiar').length; const weak = strengths.filter(s => s === 'weak').length; const pct = Math.round(steady/group.length*100); return <button className="map-card" key={category} onClick={() => onFocus(category)}><div><span>{category}</span><strong>{group.length}</strong></div><div className="progress-track"><i style={{width:`${pct}%`}}/></div><footer><small>{pct}% familiar+</small><small>{weak} weak</small></footer></button>; })}</div>
    <div className="strength-legend">{(['new','learning','weak','familiar','steady'] as const).map(s => <span key={s}><i className={`dot ${s}`}/>{s}</span>)}</div>
  </section>;
}

function Library({ cards, progress, onOpen }: {cards: Flashcard[]; progress: Record<string, ReviewState>; onOpen:(c:Flashcard)=>void}) {
  const [query, setQuery] = useState(''); const [category, setCategory] = useState('all'); const [lesson, setLesson] = useState('all'); const [status, setStatus] = useState('all');
  const categories = [...new Set(cards.map(c => c.category))].sort(); const lessons = [...new Set(cards.map(c => c.lesson))].sort((a,b)=>Number(a)-Number(b));
  const visible = cards.filter(c => {
    const hay = [c.arabic,c.pronunciation,c.meaning,c.lesson,c.category].join(' ').toLowerCase();
    return hay.includes(query.toLowerCase()) && (category==='all'||c.category===category) && (lesson==='all'||c.lesson===lesson) && (status==='all'||strengthFor(c,progress[c.id])===status);
  });
  return <section><div className="page-title"><span>Phrase library</span><h1>Find anything you learned</h1></div>
    <div className="searchbox"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search Arabic, meaning, lesson…"/></div>
    <div className="filters"><select value={category} onChange={e=>setCategory(e.target.value)}><option value="all">All categories</option>{categories.map(x=><option key={x}>{x}</option>)}</select><select value={lesson} onChange={e=>setLesson(e.target.value)}><option value="all">All lessons</option>{lessons.map(x=><option key={x} value={x}>Lesson {x}</option>)}</select><select value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All strengths</option>{['new','learning','weak','familiar','steady'].map(x=><option key={x}>{x}</option>)}</select></div>
    <div className="library-list">{visible.map(card => <button key={card.id} onClick={()=>onOpen(card)}><div><strong dir="rtl">{card.arabic}</strong><span>{card.pronunciation}</span><small>{card.meaning || 'Meaning not provided'}</small></div><em className={`strength ${strengthFor(card,progress[card.id])}`}>{strengthFor(card,progress[card.id])}</em></button>)}</div>
  </section>;
}

function Settings({ settings, setSettings, sync, syncState, syncMessage, lastSync, onProgressImported, onReset }: {settings:AppSettings; setSettings:(s:AppSettings)=>void; sync:()=>void; syncState:string; syncMessage:string; lastSync:string|null; onProgressImported:()=>void; onReset:()=>void}) {
  const save = (next: AppSettings) => { setSettings(next); storage.saveSettings(next); };
  const exportData = () => { const blob = new Blob([JSON.stringify(storage.exportAll(),null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`lahja-progress-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(a.href); };
  const importData = async (file?: File) => { if(!file)return; storage.importAll(JSON.parse(await file.text())); onProgressImported(); alert('Progress imported.'); };
  return <section><div className="page-title"><span>Settings</span><h1>Data, sync and installation</h1></div>
    <div className="settings-card"><h2>Data source</h2><label>Adapter<select value={settings.adapter} onChange={e=>save({...settings,adapter:e.target.value as AppSettings['adapter']})}><option value="apps-script">Apps Script JSON — recommended</option><option value="csv">Published CSV</option><option value="fallback">Bundled fallback only</option></select></label>
      {settings.adapter==='apps-script' && <label>Apps Script web-app URL<input value={settings.appsScriptUrl} onChange={e=>save({...settings,appsScriptUrl:e.target.value})} placeholder="https://script.google.com/macros/s/.../exec"/></label>}
      {settings.adapter==='csv' && <><label>Vocabulary Mastery CSV URL<input value={settings.vocabCsvUrl} onChange={e=>save({...settings,vocabCsvUrl:e.target.value})}/></label><label>Review Queue CSV URL (optional)<input value={settings.reviewCsvUrl} onChange={e=>save({...settings,reviewCsvUrl:e.target.value})}/></label></>}
      <button className="primary" onClick={sync} disabled={syncState==='syncing'}><Cloud size={18}/>Sync now</button><p className="sync-detail">{syncMessage}</p><p className="sync-detail"><Clock3 size={14}/> Last successful sync: {lastSync ? new Date(lastSync).toLocaleString() : 'Not yet'}</p>
    </div>
    <div className="settings-card"><h2>Install Lahja</h2><p>In Chrome on Android, open the menu and choose <strong>Add to Home screen</strong> or <strong>Install app</strong>. Launching the installed app uses standalone mode without Chrome’s address bar.</p></div>
    <div className="settings-card"><h2>Local progress</h2><div className="settings-actions"><button onClick={exportData}><Download size={18}/>Export</button><label className="file-button"><Upload size={18}/>Import<input type="file" accept="application/json" onChange={e=>void importData(e.target.files?.[0])}/></label><button className="danger" onClick={()=>{if(confirm('Reset all local review scheduling? Sheet data will not be changed.')) onReset();}}><Trash2 size={18}/>Reset</button></div></div>
  </section>;
}
