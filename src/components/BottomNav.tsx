import { Home, Map, BookOpen, Settings } from './Icons';
export type Screen = 'today' | 'map' | 'library' | 'settings';
const items: { id: Screen; label: string; icon: typeof Home }[] = [
  { id: 'today', label: 'Today', icon: Home }, { id: 'map', label: 'Map', icon: Map },
  { id: 'library', label: 'Library', icon: BookOpen }, { id: 'settings', label: 'Settings', icon: Settings }
];
export default function BottomNav({ screen, onChange }: { screen: Screen; onChange: (s: Screen) => void }) {
  return <nav className="bottom-nav">{items.map(({ id, label, icon: Icon }) => <button key={id} className={screen === id ? 'active' : ''} onClick={() => onChange(id)}><Icon size={20}/><span>{label}</span></button>)}</nav>;
}
