import {useEffect, useState} from 'react';
import PlayerCard from './PlayerCard';
import { normalizePlayer } from '../utils/normalizePlayer';

const STORAGE_KEY = 'draftswipe_prefs_v1';

export default function SwipeDeck() {
  const [players, setPlayers] = useState([]);
  const [index, setIndex] = useState(0);
  const [prefs, setPrefs] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  });

  useEffect(() => {
    fetch('/players.json')
      .then(r => r.json())
      .then(raw => setPlayers(raw.map(normalizePlayer)));
  }, []);

  const onSwipe = (player, dir) => {
    // Fixed: use player.id instead of player.ID to match normalizePlayer
    const newPrefs = {...prefs, [player.id]: dir === 'right' ? 1 : -1};
    setPrefs(newPrefs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
    setIndex(i => i + 1);
  };

  if (!players.length) return (
    <div className="app-container">
      <div className="loading-screen">
        <h2>Loading players...</h2>
      </div>
    </div>
  );
  
  if (index >= players.length) return (
    <div className="app-container">
      <div className="completion-screen">
        <h2>All done! 🎉</h2>
        <p>You've evaluated all players. Check your draft plan!</p>
        <button onClick={() => { setIndex(0); setPrefs({}); }} className="restart-btn">
          Start Over
        </button>
      </div>
    </div>
  );

  const currentPlayer = players[index];
  
  return (
    <div className="app-container">
      <div className="deck-container">
        <div className="deck">
          {/* Background card 2 (furthest back) */}
          {players[index + 2] && (
            <PlayerCard
              key={`bg2-${players[index + 2].id}`}
              player={players[index + 2]}
              onSwipe={() => {}}
              cardIndex={2}
              isInteractive={false}
            />
          )}
          
          {/* Background card 1 (middle) */}
          {players[index + 1] && (
            <PlayerCard
              key={`bg1-${players[index + 1].id}`}
              player={players[index + 1]}
              onSwipe={() => {}}
              cardIndex={1}
              isInteractive={false}
            />
          )}
          
          {/* Current card (on top) */}
          <PlayerCard
            key={`current-${currentPlayer.id}`}
            player={currentPlayer}
            onSwipe={onSwipe}
            cardIndex={0}
            isInteractive={true}
          />
        </div>
        
        {/* Progress Indicator */}
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${(index / players.length) * 100}%` }}
            ></div>
          </div>
          <div className="progress-text">
            {index + 1} of {players.length}
          </div>
        </div>

        {/* Action Buttons for Desktop */}
        <div className="action-buttons">
          <button 
            className="action-btn pass-btn"
            onClick={() => onSwipe(currentPlayer, 'left')}
          >
            Pass
          </button>
          <button 
            className="action-btn like-btn"
            onClick={() => onSwipe(currentPlayer, 'right')}
          >
            Like
          </button>
        </div>
      </div>

      <style jsx>{`
        .app-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: system-ui, -apple-system, sans-serif;
          box-sizing: border-box;
        }

        .deck-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          max-width: 400px;
          width: 100%;
          position: relative;
        }

        .deck {
          position: relative;
          width: 320px;
          height: 480px;
          flex-shrink: 0;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .progress-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          width: 100%;
          max-width: 320px;
        }

        .progress-bar {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6 0%, #22c55e 100%);
          transition: width 0.3s ease;
        }

        .progress-text {
          color: #9ca3af;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .action-buttons {
          display: flex;
          gap: 16px;
        }

        .action-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 100px;
        }

        .pass-btn {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }

        .pass-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3);
        }

        .like-btn {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: white;
        }

        .like-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(34, 197, 94, 0.3);
        }

        .completion-screen {
          text-align: center;
          color: white;
          padding: 40px;
        }

        .completion-screen h2 {
          font-size: 2rem;
          margin-bottom: 16px;
        }

        .completion-screen p {
          color: #9ca3af;
          margin-bottom: 24px;
        }

        .loading-screen {
          text-align: center;
          color: white;
          padding: 40px;
        }

        .loading-screen h2 {
          font-size: 1.5rem;
          color: #9ca3af;
        }

        .restart-btn {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .restart-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
        }

        /* Mobile Optimizations */
        @media (max-width: 640px) {
          .app-container {
            padding: 10px;
          }
          
          .deck {
            width: 280px;
            height: 420px;
          }

          .action-buttons {
            gap: 12px;
          }

          .action-btn {
            min-width: 80px;
            padding: 10px 20px;
            font-size: 0.875rem;
          }
        }

        /* Remove hover effects on touch devices */
        @media (hover: none) {
          .action-btn:hover {
            transform: none;
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  );
}