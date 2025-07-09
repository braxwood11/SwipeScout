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
      {/* Sleek top progress bar */}
      <div className="top-progress-bar">
        <div 
          className="top-progress-fill"
          style={{ width: `${(index / players.length) * 100}%` }}
        ></div>
      </div>
      
      {/* Progress text overlay */}
      <div className="progress-overlay">
        {index + 1} / {players.length}
      </div>
      
      <div className="deck-container">
        <div className="deck">
          {/* FIXED: Render interactive card LAST so it's naturally on top */}
          
          {/* Background card 2 (furthest back) - RENDER FIRST */}
          {players[index + 2] && (
            <PlayerCard
              key={`bg2-${players[index + 2].id}`}
              player={players[index + 2]}
              onSwipe={() => {}}
              cardIndex={2}
              isInteractive={false}
            />
          )}
          
          {/* Background card 1 (middle) - RENDER SECOND */}
          {players[index + 1] && (
            <PlayerCard
              key={`bg1-${players[index + 1].id}`}
              player={players[index + 1]}
              onSwipe={() => {}}
              cardIndex={1}
              isInteractive={false}
            />
          )}
          
          {/* Current card (on top) - RENDER LAST */}
          <PlayerCard
            key={`current-${currentPlayer.id}`}
            player={currentPlayer}
            onSwipe={onSwipe}
            cardIndex={0}
            isInteractive={true}
          />
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
          width: 100vw;
          background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
          background-attachment: fixed;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: system-ui, -apple-system, sans-serif;
          box-sizing: border-box;
          position: relative;
          overflow-x: hidden;
        }

        .top-progress-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: rgba(0, 0, 0, 0.3);
          z-index: 1000;
          backdrop-filter: blur(10px);
        }

        .top-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6 0%, #10b981 50%, #8b5cf6 100%);
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
        }

        .progress-overlay {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.6);
          color: #e5e7eb;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 600;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          z-index: 1000;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .deck-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 32px;
          max-width: 600px;
          width: 100%;
          position: relative;
          z-index: 1;
        }

        .deck {
          position: relative;
          width: 320px;
          height: 480px;
          flex-shrink: 0;
          margin: 0 auto;
          /* CRITICAL: Force new stacking context to isolate cards */
          isolation: isolate;
          /* Reset any transform that might interfere */
          transform: none;
          transition: transform 0.3s ease;
          /* Ensure perfect centering when scaled */
          transform-origin: center center;
        }

        .action-buttons {
          display: flex;
          gap: 24px;
          justify-content: center;
          width: 100%;
          max-width: 400px;
        }

        .action-btn {
          padding: 16px 32px;
          border: 2px solid transparent;
          border-radius: 16px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          min-width: 120px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          backdrop-filter: blur(20px);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          position: relative;
          overflow: hidden;
        }

        .action-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left 0.5s ease;
        }

        .action-btn:hover::before {
          left: 100%;
        }

        .action-btn:hover {
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
        }

        .pass-btn {
          border-color: #ef4444;
          box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.2);
        }

        .pass-btn:hover {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          box-shadow: 0 12px 30px rgba(239, 68, 68, 0.4);
          border-color: #ef4444;
        }

        .like-btn {
          border-color: #22c55e;
          box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.2);
        }

        .like-btn:hover {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          box-shadow: 0 12px 30px rgba(34, 197, 94, 0.4);
          border-color: #22c55e;
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

        /* Desktop Enhancements */
        @media (min-width: 769px) {
          .app-container {
            padding: 40px;
          }
          
          .deck-container {
            gap: 28px;
            max-width: 800px;
            align-items: center;
          }
          
          .deck {
            /* Let PlayerCard handle its own responsive sizing */
            width: 360px;
            height: 540px;
            /* Remove transform scaling */
            align-self: center;
          }
          
          .action-buttons {
            max-width: 400px;
            gap: 32px;
            align-self: center;
          }
          
          .action-btn {
            padding: 18px 36px;
            font-size: 1.2rem;
            min-width: 140px;
          }

          .progress-overlay {
            top: 30px;
            right: 30px;
            font-size: 1rem;
            padding: 10px 20px;
          }
        }

        /* Large Desktop */
        @media (min-width: 1200px) {
          .app-container {
            padding: 60px 40px;
          }
          
          .deck {
            /* Let PlayerCard handle its own responsive sizing */
            width: 360px;
            height: 540px;
            /* Remove transform scaling */
            align-self: center;
          }
          
          .deck-container {
            gap: 32px;
          }

          .action-buttons {
            max-width: 400px;
            align-self: center;
          }

          .progress-overlay {
            top: 40px;
            right: 40px;
            font-size: 1.1rem;
            padding: 12px 24px;
          }
        }

        /* Mobile Optimizations */
        @media (max-width: 640px) {
          .app-container {
            padding: 15px;
          }
          
          .deck-container {
            gap: 20px;
            max-width: 100%;
          }
          
          .deck {
            width: 280px;
            height: 420px;
          }

          .action-buttons {
            gap: 16px;
            max-width: 100%;
          }

          .action-btn {
            min-width: 90px;
            padding: 12px 20px;
            font-size: 0.9rem;
          }
          
          .progress-overlay {
            top: 15px;
            right: 15px;
            font-size: 0.8rem;
            padding: 6px 12px;
          }
        }

        /* Tablet Portrait */
        @media (min-width: 641px) and (max-width: 768px) {
          .deck {
            transform: scale(1.05);
          }
          
          .deck-container {
            gap: 24px;
          }

          .progress-overlay {
            top: 25px;
            right: 25px;
            font-size: 0.95rem;
            padding: 8px 16px;
          }
        }

        /* Remove hover effects on touch devices */
        @media (hover: none) {
          .action-btn:hover {
            transform: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
        }
      `}</style>
    </div>
  );
}