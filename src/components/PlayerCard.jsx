import TinderCard from 'react-tinder-card';
import clsx from 'clsx';
import './PlayerCard.css';

export default function PlayerCard({ player, onSwipe }) {
  const {
    name, team, position,
    fantasyPts, auction, vorp, rookie
  } = player;

  return (
    <TinderCard
      className="swipe"
      onSwipe={dir => onSwipe(player, dir)}
      preventSwipe={['up','down']}
    >
      <div className="card">
        {/* ─── header row ─────────────────────────────── */}
        <header className="flex justify-between items-center mb-1">
          <h2 className="text-lg font-semibold">
            {name}
            {rookie && <span className="ml-1 text-xs bg-emerald-700 px-1 rounded">R</span>}
          </h2>
          <span className="text-sm opacity-70">{team} • {position}</span>
        </header>

        {/* ─── “stats strip” ─────────────────────────── */}
        <ul className="grid grid-cols-3 gap-y-1 text-center text-sm">
          <li>
            <div className="font-medium">{fantasyPts.toFixed(1)}</div>
            <div className="opacity-60 text-xs">Proj Pts</div>
          </li>
          <li>
            <div className="font-medium">${auction.toFixed(0)}</div>
            <div className="opacity-60 text-xs">Auction</div>
          </li>
          <li>
            <div
              className={clsx(
                "font-medium",
                vorp > 0 ? "text-emerald-400" : "text-rose-400"
              )}
            >
              {vorp.toFixed(1)}
            </div>
            <div className="opacity-60 text-xs">VORP</div>
          </li>
        </ul>
      </div>
    </TinderCard>
  );
}
