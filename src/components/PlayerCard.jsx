import React, { useState } from 'react';
import TinderCard from 'react-tinder-card';

// NFL Team Colors Mapping
const teamColors = {
  'ARI': { primary: '#97233F', secondary: '#000000' },
  'ATL': { primary: '#A71930', secondary: '#000000' },
  'BAL': { primary: '#241773', secondary: '#000000' },
  'BUF': { primary: '#00338D', secondary: '#C60C30' },
  'CAR': { primary: '#0085CA', secondary: '#000000' },
  'CHI': { primary: '#0B162A', secondary: '#C83803' },
  'CIN': { primary: '#FB4F14', secondary: '#000000' },
  'CLE': { primary: '#311D00', secondary: '#FF3C00' },
  'DAL': { primary: '#003594', secondary: '#869397' },
  'DEN': { primary: '#FB4F14', secondary: '#002244' },
  'DET': { primary: '#0076B6', secondary: '#B0B7BC' },
  'GB': { primary: '#203731', secondary: '#FFB612' },
  'HOU': { primary: '#03202F', secondary: '#A71930' },
  'IND': { primary: '#002C5F', secondary: '#A2AAAD' },
  'JAX': { primary: '#006778', secondary: '#9F792C' },
  'KC': { primary: '#E31837', secondary: '#FFB81C' },
  'LV': { primary: '#000000', secondary: '#A5ACAF' },
  'LAC': { primary: '#0080C6', secondary: '#FFC20E' },
  'LAR': { primary: '#003594', secondary: '#FFA300' },
  'MIA': { primary: '#008E97', secondary: '#FC4C02' },
  'MIN': { primary: '#4F2683', secondary: '#FFC62F' },
  'NE': { primary: '#002244', secondary: '#C60C30' },
  'NO': { primary: '#D3BC8D', secondary: '#000000' },
  'NYG': { primary: '#0B2265', secondary: '#A71930' },
  'NYJ': { primary: '#125740', secondary: '#000000' },
  'PHI': { primary: '#004C54', secondary: '#A5ACAF' },
  'PIT': { primary: '#FFB612', secondary: '#000000' },
  'SF': { primary: '#AA0000', secondary: '#B3995D' },
  'SEA': { primary: '#002244', secondary: '#69BE28' },
  'TB': { primary: '#D50A0A', secondary: '#FF7900' },
  'TEN': { primary: '#0C2340', secondary: '#4B92DB' },
  'WSH': { primary: '#5A1414', secondary: '#FFB612' }
};

// Position Icons and Shapes
const positionConfig = {
  'QB': { icon: '⚡', shape: 'circle', color: '#3B82F6' },
  'RB': { icon: '🏃', shape: 'square', color: '#10B981' },
  'WR': { icon: '🎯', shape: 'diamond', color: '#F59E0B' },
  'TE': { icon: '🎪', shape: 'hexagon', color: '#8B5CF6' },
  'K': { icon: '🦵', shape: 'triangle', color: '#EF4444' },
  'DEF': { icon: '🛡️', shape: 'shield', color: '#6B7280' }
};

export default function PlayerCard({ player, onSwipe, cardIndex = 0, isInteractive = true }) {
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const {
    name, team, position,
    fantasyPts, auction, vorp, rookie
  } = player;

  const teamColor = teamColors[team] || { primary: '#374151', secondary: '#6B7280' };
  const posConfig = positionConfig[position] || positionConfig['QB'];

  const handleSwipeStart = (dir) => {
    setSwipeDirection(dir);
    setIsDragging(true);
  };

  const handleSwipeEnd = () => {
    setSwipeDirection(null);
    setIsDragging(false);
  };

  const getSwipeOverlay = () => {
    if (!swipeDirection) return null;
    
    const isLike = swipeDirection === 'right';
    return (
      <div className={`swipe-overlay ${isLike ? 'like' : 'pass'}`}>
        <div className="swipe-icon">
          {isLike ? '✓' : '✗'}
        </div>
      </div>
    );
  };

  const cardContent = (
    <div 
      className={`player-card ${swipeDirection ? `swiping-${swipeDirection}` : ''} ${isDragging ? 'dragging' : ''} ${!isInteractive ? 'background-card' : ''}`}
      style={{
        '--team-primary': teamColor.primary,
        '--team-secondary': teamColor.secondary,
        '--position-color': posConfig.color,
        '--card-index': cardIndex
      }}
    >
      {isInteractive && getSwipeOverlay()}
      
      {/* Header with team accent */}
      <div className="card-header">
        <div className="team-accent"></div>
        <div className="header-content">
          <div className="player-info">
            <h2 className="player-name">
              {name}
              {rookie && <span className="rookie-badge">R</span>}
            </h2>
            <div className="team-position">
              <span className="team">{team}</span>
              <div className={`position-badge ${posConfig.shape}`}>
                <span className="position-icon">{posConfig.icon}</span>
                <span className="position-text">{position}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Player Avatar */}
      <div className="player-avatar">
        <div className="avatar-placeholder">
          <span className="avatar-initials">
            {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-container">
        <div className="stat-item">
          <div className="stat-value">{fantasyPts.toFixed(1)}</div>
          <div className="stat-label">Proj Pts</div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <div className="stat-value">${auction}</div>
          <div className="stat-label">Auction</div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <div className={`stat-value ${vorp > 0 ? 'positive' : 'negative'}`}>
            {vorp > 0 ? '+' : ''}{vorp.toFixed(1)}
          </div>
          <div className="stat-label">VORP</div>
        </div>
      </div>

      {/* Swipe Hint */}
      {isInteractive && (
        <div className="swipe-hint">
          <div className="hint-arrow hint-left">←</div>
          <span className="hint-text">Swipe to evaluate</span>
          <div className="hint-arrow hint-right">→</div>
        </div>
      )}

      <style jsx>{`
        .player-card {
          width: 320px;
          height: 480px;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          border-radius: 24px;
          overflow: hidden;
          position: absolute;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          top: 0;
          left: 0;
          z-index: 10;
        }

        .player-card.background-card {
          pointer-events: none;
          opacity: 0.4;
          transform: scale(calc(1 - var(--card-index) * 0.05)) translateY(calc(var(--card-index) * 8px));
          z-index: calc(5 - var(--card-index)) !important;
        }

        .player-card.background-card .swipe-hint {
          display: none;
        }

        .player-card:hover {
          transform: translateY(-4px);
          box-shadow: 
            0 25px 50px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.15);
        }

        .player-card.background-card:hover {
          transform: scale(calc(1 - var(--card-index) * 0.05)) translateY(calc(var(--card-index) * 8px));
        }

        .player-card.dragging {
          z-index: 1000 !important;
          transform: scale(1.02);
        }

        .player-card.swiping-right {
          background: linear-gradient(135deg, #1a1a1a 0%, #16a34a22 100%);
        }

        .player-card.swiping-left {
          background: linear-gradient(135deg, #1a1a1a 0%, #dc262622 100%);
        }

        .swipe-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          border-radius: 24px;
          transition: all 0.2s ease;
        }

        .swipe-overlay.like {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.1) 100%);
          border: 2px solid #22c55e;
        }

        .swipe-overlay.pass {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%);
          border: 2px solid #ef4444;
        }

        .swipe-icon {
          font-size: 4rem;
          font-weight: bold;
          color: white;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
        }

        .card-header {
          position: relative;
          padding: 20px 20px 0;
        }

        .team-accent {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--team-primary) 0%, var(--team-secondary) 100%);
        }

        .header-content {
          margin-top: 16px;
        }

        .player-name {
          font-size: 1.5rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 8px 0;
          line-height: 1.2;
        }

        .rookie-badge {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          margin-left: 8px;
        }

        .team-position {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .team {
          color: #9ca3af;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .position-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          background: var(--position-color);
          color: white;
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .position-badge.circle {
          border-radius: 50px;
        }

        .position-badge.square {
          border-radius: 4px;
        }

        .position-badge.diamond {
          border-radius: 0;
          transform: rotate(45deg);
          padding: 6px;
        }

        .position-badge.diamond .position-icon,
        .position-badge.diamond .position-text {
          transform: rotate(-45deg);
        }

        .position-badge.hexagon {
          clip-path: polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%);
          padding: 4px 12px;
        }

        .position-badge.triangle {
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
          padding: 6px 8px 2px;
        }

        .position-badge.shield {
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
          padding: 6px 10px;
        }

        .position-icon {
          font-size: 0.875rem;
        }

        .player-avatar {
          display: flex;
          justify-content: center;
          padding: 32px 20px;
        }

        .avatar-placeholder {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--team-primary) 0%, var(--team-secondary) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid rgba(255, 255, 255, 0.1);
          box-shadow: 
            0 8px 24px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .avatar-initials {
          font-size: 2.5rem;
          font-weight: 700;
          color: white;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .stats-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          margin: 20px 0;
        }

        .stat-item {
          text-align: center;
          flex: 1;
        }

        .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 4px;
        }

        .stat-value.positive {
          color: #22c55e;
        }

        .stat-value.negative {
          color: #ef4444;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #9ca3af;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-divider {
          width: 1px;
          height: 40px;
          background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.1), transparent);
          margin: 0 8px;
        }

        .swipe-hint {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 20px;
          margin-top: auto;
        }

        .hint-text {
          color: #6b7280;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .hint-arrow {
          color: #4b5563;
          font-size: 1.125rem;
          font-weight: bold;
          animation: pulse 2s infinite;
        }

        .hint-arrow.hint-left {
          color: #ef4444;
        }

        .hint-arrow.hint-right {
          color: #22c55e;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
        }

        /* Mobile Optimizations */
        @media (max-width: 640px) {
          .player-card {
            width: 280px;
            height: 420px;
          }

          .player-name {
            font-size: 1.25rem;
          }

          .avatar-placeholder {
            width: 100px;
            height: 100px;
          }

          .avatar-initials {
            font-size: 2rem;
          }

          .stat-value {
            font-size: 1.1rem;
          }

          .swipe-hint {
            padding: 16px;
          }
        }

        /* Remove hover effects on touch devices */
        @media (hover: none) {
          .player-card:hover {
            transform: none;
            box-shadow: 
              0 20px 40px rgba(0, 0, 0, 0.3),
              0 0 0 1px rgba(255, 255, 255, 0.1);
          }

          .player-card.background-card:hover {
            transform: scale(calc(1 - var(--card-index) * 0.05)) translateY(calc(var(--card-index) * 8px));
          }
        }
      `}</style>
    </div>
  );

  // Only wrap interactive cards in TinderCard
  if (!isInteractive) {
    return (
      <div 
        className="background-card-wrapper"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 1
        }}
      >
        {cardContent}
      </div>
    );
  }

  return (
    <TinderCard
      className="tinder-card"
      onSwipe={(dir) => {
        handleSwipeEnd();
        onSwipe(player, dir);
      }}
      onCardLeftScreen={handleSwipeEnd}
      preventSwipe={['up', 'down']}
      swipeRequirementType="position"
      swipeThreshold={80}
      flickOnSwipe={true}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        cursor: 'grab',
        userSelect: 'none',
        willChange: 'transform',
        zIndex: 100
      }}
    >
      {cardContent}
    </TinderCard>
  );
}