import React, { useState, useRef, useEffect } from 'react';
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
    console.log('Swipe success!', direction); // Debug log
    setShowSuccess(direction);
    
    setTimeout(() => {
      setShowSuccess(null);
    }, 1000);
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
            {isLike ? 'DRAFT' : 'PASS'}
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

      {/* Swipe Hint */}
      {isInteractive && (
        <div className="swipe-hint">
          <div className="hint-arrow hint-left">←</div>
          <span className="hint-text">Swipe to evaluate</span>
          <div className="hint-arrow hint-right">→</div>
        </div>
      )}

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

        .player-card.swiping-right {
          background: linear-gradient(135deg, #1a1a1a 0%, rgba(34, 197, 94, 0.15) 100%);
        }

        .player-card.swiping-left {
          background: linear-gradient(135deg, #1a1a1a 0%, rgba(239, 68, 68, 0.15) 100%);
        }

        .particle-container {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 1000;
        }

        .team-accent {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--team-primary) 0%, var(--team-secondary) 100%);
        }

        .card-header {
          position: relative;
          padding: 20px 20px 0;
        }

        .header-content {
          margin-top: 16px;
        }

        .position-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          color: white;
          margin-bottom: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .position-icon {
          font-size: 1rem;
        }

        .position-text {
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .player-name {
          font-size: 1.5rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 8px 0;
          line-height: 1.2;
        }

        .team-name {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .rookie-badge {
          display: inline-block;
          margin-top: 8px;
          padding: 4px 8px;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          font-size: 0.7rem;
          font-weight: 700;
          border-radius: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
        }

        .card-body {
          flex: 1;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 32px;
        }

        .avatar-section {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar-placeholder {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 
            0 12px 30px rgba(0, 0, 0, 0.4),
            0 0 0 4px rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .avatar-initials {
          font-size: 2.5rem;
          font-weight: 700;
          color: white;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          width: 100%;
          max-width: 280px;
        }

        .stat-item {
          text-align: center;
          padding: 12px 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .stat-item:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-2px);
        }

        .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 4px;
        }

        .stat-item.positive .stat-value {
          color: #22c55e;
        }

        .stat-item.negative .stat-value {
          color: #ef4444;
        }

        .stat-label {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 500;
        }

        .swipe-hint {
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }

        .hint-arrow {
          font-size: 1.2rem;
          animation: pulse 2s infinite;
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
          letter-spacing: 3px;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
        }

        @keyframes burstRight {
          0% { 
            opacity: 1;
            transform: scale(0) translate(0, 0);
          }
          100% { 
            opacity: 0;
            transform: scale(1) translate(var(--burst-x, 150px), var(--burst-y, -100px));
          }
        }

        @keyframes burstLeft {
          0% { 
            opacity: 1;
            transform: scale(0) translate(0, 0);
          }
          100% { 
            opacity: 0;
            transform: scale(1) translate(var(--burst-x, -150px), var(--burst-y, -100px));
          }
        }

        .particle-1 { --burst-x: 120px; --burst-y: -80px; }
        .particle-2 { --burst-x: 80px; --burst-y: -120px; }
        .particle-3 { --burst-x: 140px; --burst-y: -40px; }
        .particle-4 { --burst-x: 100px; --burst-y: -100px; }
        .particle-5 { --burst-x: 160px; --burst-y: -60px; }
        .particle-6 { --burst-x: 90px; --burst-y: -140px; }
        .particle-7 { --burst-x: 130px; --burst-y: -20px; }
        .particle-8 { --burst-x: 110px; --burst-y: -110px; }
        .particle-9 { --burst-x: 170px; --burst-y: -70px; }
        .particle-10 { --burst-x: 70px; --burst-y: -130px; }
        .particle-11 { --burst-x: 150px; --burst-y: -50px; }
        .particle-12 { --burst-x: 95px; --burst-y: -95px; }

        @keyframes rippleGreen {
          0% { 
            opacity: 0.9;
            transform: translate(-50%, -50%) scale(0);
            border-width: 4px;
          }
          100% { 
            opacity: 0;
            transform: translate(-50%, -50%) scale(4);
            border-width: 0px;
          }
        }

        @keyframes rippleRed {
          0% { 
            opacity: 0.9;
            transform: translate(-50%, -50%) scale(0);
            border-width: 4px;
          }
          100% { 
            opacity: 0;
            transform: translate(-50%, -50%) scale(4);
            border-width: 0px;
          }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
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
          .player-card.interactive-card:hover {
            transform: none;
            box-shadow: 
              0 20px 40px rgba(0, 0, 0, 0.3),
              0 0 0 1px rgba(255, 255, 255, 0.1);
          }

          .player-card.background-card:hover {
            transform: scale(calc(0.95 - var(--card-index) * 0.03)) translateY(calc(var(--card-index) * 6px)) !important;
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
        handleSuccessfulSwipe(dir === 'right' ? 'right' : 'left');
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