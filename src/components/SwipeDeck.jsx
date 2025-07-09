import {useEffect, useState} from 'react';
import PlayerCard from './PlayerCard';
import { normalizePlayer } from '../utils/normalizePlayer';

const STORAGE_KEY = 'draftswipe_prefs_v1';

export default function SwipeDeck() {
  const [players, setPlayers] = useState([]);
  const [index, setIndex]   = useState(0);
  const [prefs, setPrefs]   = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  });

useEffect(() => {
  fetch('/players.json')
    .then(r => r.json())
    .then(raw => setPlayers(raw.map(normalizePlayer)));
}, []);

  const onSwipe = (player, dir) => {
    const newPrefs = {...prefs, [player.ID]: dir === 'right' ? 1 : -1};
    setPrefs(newPrefs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
    setIndex(i => i + 1);
  };

  if (!players.length) return <p>Loading players...</p>;
  if (index >= players.length) return <p>All done! Check your draft plan.</p>;

  return (
    <div className="deck">
      {players.slice(index, index + 20).reverse().map(p =>
        <PlayerCard key={p.ID} player={p} onSwipe={onSwipe}/>
      )}
    </div>
  );
}