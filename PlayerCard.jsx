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
  'QB': { icon: '🎯', shape: 'circle', color: '#3B82F6' },
  'RB': { icon: '🏃', shape: 'square', color: '#10B981' },
  'WR': { icon: '🙌', shape: 'diamond', color: '#F59E0B' },
  'TE': { icon: '🎪', shape: 'hexagon', color: '#8B5CF6' },
  'K': { icon: '🦵', shape: 'triangle', color: '#EF4444' },
  'DEF': { icon: '🛡️', shape: 'shield', color: '#6B7280' }
};

export default function PlayerCard({ player, onSwipe, cardIndex = 0, isInteractive = true }) {
  const [showSuccess, setShowSuccess] = useState(null);

  const { name, team, position, fantasyPts, auction, vorp, rookie } = player;
  
  const teamColor = teamColors[team] || { primary: '#6B7280', secondary: '#374151' };
  const posConfig = positionConfig[position] || positionConfig['WR'];

  const handleSwipeEnd = () => {
    // Simple cleanup function
  };

  const handleSuccessfulSwipe = (direction) => {
    console.log('Swipe success!', direction);
    setShowSuccess(direction);
    
    // FIXED: Delay the onSwipe callback to allow animation to play
    setTimeout(() => {
      setShowSuccess(null);
      onSwipe(player, direction);
    }, 600); // Match animation duration
  };

  const getCardTransform = () => {
    // For background cards, apply the scaling
    if (!isInteractive) {
      return undefined; // Let CSS handle background card transforms
    }
    
    // For success animation only
    if (showSuccess) {
      const translateX = showSuccess === 'right' ? '150px' : '-150px';
      const rotate = showSuccess === 'right' ? '25deg' : '-25deg';
      return `translateX(${translateX}) rotate(${rotate}) scale(1.1)`;
    }
    
    return undefined;
  };

  const getSwipeOverlay = () => {
    if (!showSuccess) return null;
    
    const isLike = showSuccess === 'right';
    
    return (
      <div 
        className={`swipe-overlay ${isLike ? 'like' : 'pass'} success`}
        style={{ opacity: 1 }}
      >
        <div className="overlay-content">
          <div className="swipe-icon">
            {isLike ? '✓' : '✕'}
          </div>
          <div className="swipe-text">
            {isLike ? 'LIKE' : 'PASS'}
          </div>
        </div>
      </div>
    );
  };

  const cardContent = (
    <div 
      className={`player-card ${!isInteractive ? 'background-card' : 'interactive-card'} ${showSuccess ? 'success' : ''}`}
      style={{
        '--team-primary': teamColor.primary,
        '--team-secondary': teamColor.secondary,
        '--card-index': cardIndex,
        transform: getCardTransform(),
      }}
    >
      {/* CSS Particle Effects */}
      {showSuccess && (
        <div className={`particle-burst ${showSuccess}`}>
          <div className="particle particle-1"></div>
          <div className="particle particle-2"></div>
          <div className="particle particle-3"></div>
          <div className="particle particle-4"></div>
          <div className="particle particle-5"></div>
          <div className="particle particle-6"></div>
          <div className="particle particle-7"></div>
          <div className="particle particle-8"></div>
          <div className="particle particle-9"></div>
          <div className="particle particle-10"></div>
          <div className="particle particle-11"></div>
          <div className="particle particle-12"></div>
        </div>
      )}

      {/* Ripple Effect */}
      {showSuccess && (
        <div className={`ripple-effect ${showSuccess}`}></div>
      )}

      {/* Team accent bar */}
      <div className="team-accent"></div>

      {/* Card header */}
      <div className="card-header">
        <div className="header-content">
          <div className="position-badge" style={{ backgroundColor: posConfig.color }}>
            <span className="position-icon">{posConfig.icon}</span>
            <span className="position-text">{position}</span>
          </div>
          <h2 className="player-name">{name}</h2>
          <div className="team-name">{team}</div>
          {rookie && <div className="rookie-badge">ROOKIE</div>}
        </div>
      </div>

      {/* Avatar section */}
      <div className="card-body">
        <div className="avatar-section">
          <div 
            className="avatar-placeholder"
            style={{
              background: `linear-gradient(135deg, ${teamColor.primary} 0%, ${teamColor.secondary} 100%)`
            }}
          >
            <div className="avatar-initials">
              {name.split(' ').map(n => n[0]).join('')}
            </div>
          </div>
        </div>

        {/* Stats section */}
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{fantasyPts?.toFixed(1) || '0.0'}</div>
            <div className="stat-label">Fantasy Pts</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">${auction || 0}</div>
            <div className="stat-label">Auction</div>
          </div>
          <div className={`stat-item ${vorp >= 0 ? 'positive' : 'negative'}`}>
            <div className="stat-value">
              {vorp > 0 ? '+' : ''}{vorp?.toFixed(1) || '0.0'}
            </div>
            <div className="stat-label">VORP</div>
          </div>
        </div>
      </div>

      {/* Swipe overlay */}
      {getSwipeOverlay()}

      <style jsx>{`
        .player-card {
          will-change: transform;
          width: 320px;
          height: 480px;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          border-radius: 24px;
          overflow: hidden;
          position: relative;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          cursor: grab;
          user-select: none;
        }

        .player-card.interactive-card {
          opacity: 1;
          pointer-events: auto;
        }

        .player-card.background-card {
          pointer-events: none;
          opacity: 0.4;
          transform: scale(calc(0.95 - var(--card-index) * 0.03)) translateY(calc(var(--card-index) * 6px)) !important;
          transform-origin: center center;
        }

        .player-card.background-card .swipe-hint {
          display: none;
        }

        .player-card.interactive-card:hover {
          transform: translateY(-4px);
          box-shadow: 
            0 25px 50px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.15);
        }

        .player-card.background-card:hover {
          transform: scale(calc(0.95 - var(--card-index) * 0.03)) translateY(calc(var(--card-index) * 6px)) !important;
        }

        .player-card.dragging {
          cursor: grabbing;
          transition: none;
          z-index: 1000;
        }

        .player-card.success {
          transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .team-accent {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--team-primary), var(--team-secondary));
        }

        .card-header {
          padding: 24px 20px 16px;
          background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, transparent 100%);
        }

        .header-content {
          text-align: center;
        }

        .position-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
          margin-bottom: 12px;
        }

        .position-icon {
          font-size: 1rem;
        }

        .player-name {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          margin: 8px 0 4px;
          line-height: 1.2;
        }

        .team-name {
          font-size: 0.875rem;
          color: #9ca3af;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .rookie-badge {
          display: inline-block;
          padding: 2px 8px;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 8px;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .card-body {
          flex: 1;
          padding: 0 20px 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .avatar-section {
          display: flex;
          justify-content: center;
          margin-top: 8px;
        }

        .avatar-placeholder {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid rgba(255, 255, 255, 0.2);
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.3),
            inset 0 2px 8px rgba(255, 255, 255, 0.1);
        }

        .avatar-initials {
          font-size: 2.5rem;
          font-weight: 700;
          color: white;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: auto;
        }

        .stat-item {
          text-align: center;
          padding: 12px 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stat-item.positive .stat-value {
          color: #22c55e;
        }

        .stat-item.negative .stat-value {
          color: #ef4444;
        }

        .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: white;
          line-height: 1.2;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #9ca3af;
          font-weight: 500;
          margin-top: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .swipe-hint {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 16px;
          background: rgba(0, 0, 0, 0.8);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 0.875rem;
          color: #d1d5db;
          backdrop-filter: blur(10px);
          z-index: 10;
        }

        .hint-arrow {
          font-size: 1.25rem;
          font-weight: bold;
        }

        .hint-left {
          color: #ef4444;
        }

        .hint-right {
          color: #22c55e;
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
          border-radius: 24px;
          pointer-events: none;
          z-index: 100;
          transition: all 0.2s ease;
        }

        .swipe-overlay.like {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(34, 197, 94, 0.1) 100%);
          border: 3px solid rgba(34, 197, 94, 0.8);
          box-shadow: 0 0 30px rgba(34, 197, 94, 0.3);
        }

        .swipe-overlay.pass {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(239, 68, 68, 0.1) 100%);
          border: 3px solid rgba(239, 68, 68, 0.8);
          box-shadow: 0 0 30px rgba(239, 68, 68, 0.3);
        }

        .swipe-overlay.success {
          animation: successPulse 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .swipe-overlay.success.like {
          border: 4px solid #22c55e;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.4) 0%, rgba(34, 197, 94, 0.2) 100%);
          box-shadow: 
            0 0 50px rgba(34, 197, 94, 0.6),
            inset 0 0 30px rgba(34, 197, 94, 0.1);
          animation: successPulse 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .swipe-overlay.success.pass {
          border: 4px solid #ef4444;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.4) 0%, rgba(239, 68, 68, 0.2) 100%);
          box-shadow: 
            0 0 50px rgba(239, 68, 68, 0.6),
            inset 0 0 30px rgba(239, 68, 68, 0.1);
          animation: successPulse 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .overlay-content {
          text-align: center;
          filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5));
        }

        .swipe-icon {
          font-size: 5rem;
          font-weight: bold;
          color: white;
          margin-bottom: 8px;
          animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .swipe-text {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        @keyframes successPulse {
          0% { 
            transform: scale(0.8);
            opacity: 0;
          }
          50% { 
            transform: scale(1.05);
            opacity: 1;
          }
          100% { 
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes bounceIn {
          0% { 
            transform: scale(0) rotate(-45deg);
            opacity: 0;
          }
          60% { 
            transform: scale(1.2) rotate(10deg);
            opacity: 1;
          }
          100% { 
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        /* Particle Effects */
        .particle-burst {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 150;
        }

        .particle {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          opacity: 1;
          animation: particleExplode 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        .particle-burst.right .particle {
          background: #22c55e;
          box-shadow: 0 0 6px #22c55e;
        }

        .particle-burst.left .particle {
          background: #ef4444;
          box-shadow: 0 0 6px #ef4444;
        }

        .particle-1 { animation-delay: 0.0s; }
        .particle-2 { animation-delay: 0.1s; }
        .particle-3 { animation-delay: 0.05s; }
        .particle-4 { animation-delay: 0.15s; }
        .particle-5 { animation-delay: 0.02s; }
        .particle-6 { animation-delay: 0.12s; }
        .particle-7 { animation-delay: 0.08s; }
        .particle-8 { animation-delay: 0.18s; }
        .particle-9 { animation-delay: 0.04s; }
        .particle-10 { animation-delay: 0.14s; }
        .particle-11 { animation-delay: 0.06s; }
        .particle-12 { animation-delay: 0.16s; }

        @keyframes particleExplode {
          0% {
            transform: translate(0, 0) scale(0);
            opacity: 1;
          }
          15% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--particle-x, 0), var(--particle-y, 0)) scale(0);
            opacity: 0;
          }
        }

        .particle-1 { --particle-x: 60px; --particle-y: -40px; }
        .particle-2 { --particle-x: -50px; --particle-y: -30px; }
        .particle-3 { --particle-x: 70px; --particle-y: 20px; }
        .particle-4 { --particle-x: -60px; --particle-y: 30px; }
        .particle-5 { --particle-x: 40px; --particle-y: -60px; }
        .particle-6 { --particle-x: -40px; --particle-y: -50px; }
        .particle-7 { --particle-x: 80px; --particle-y: 10px; }
        .particle-8 { --particle-x: -70px; --particle-y: 15px; }
        .particle-9 { --particle-x: 30px; --particle-y: 50px; }
        .particle-10 { --particle-x: -30px; --particle-y: 60px; }
        .particle-11 { --particle-x: 55px; --particle-y: -20px; }
        .particle-12 { --particle-x: -55px; --particle-y: -10px; }

        /* Ripple Effect */
        .ripple-effect {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100px;
          height: 100px;
          border-radius: 50%;
          pointer-events: none;
          z-index: 90;
          animation: ripple 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        .ripple-effect.right {
          border: 3px solid #22c55e;
        }

        .ripple-effect.left {
          border: 3px solid #ef4444;
        }

        @keyframes ripple {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(4);
            opacity: 0;
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
      `}</style>
    </div>
  );

  // Background cards (non-interactive)
  if (!isInteractive) {
    return (
      <div 
        className="background-card-wrapper"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '320px',
          height: '480px',
          pointerEvents: 'none',
        }}
      >
        {cardContent}
      </div>
    );
  }

  // Interactive card with TinderCard wrapper
  return (
    <TinderCard
      className="tinder-card"
      onSwipe={(dir) => {
        // FIXED: Only call handleSuccessfulSwipe, which now handles the delay
        handleSuccessfulSwipe(dir);
        handleSwipeEnd();
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
        width: '320px',
        height: '480px',
        cursor: 'grab',
        userSelect: 'none',
        willChange: 'transform',
      }}
    >
      {cardContent}
    </TinderCard>
  );
}