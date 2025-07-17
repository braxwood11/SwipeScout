import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

// Team colors configuration (keeping exact original)
const teamColors = {
  'ARI': { primary: '#97233F', secondary: '#000000' },
  'ATL': { primary: '#A71930', secondary: '#000000' },
  'BAL': { primary: '#241773', secondary: '#000000' },
  'BUF': { primary: '#00338D', secondary: '#C60C30' },
  'CAR': { primary: '#0085CA', secondary: '#101820' },
  'CHI': { primary: '#0B162A', secondary: '#C83803' },
  'CIN': { primary: '#FB4F14', secondary: '#000000' },
  'CLE': { primary: '#311D00', secondary: '#FF3C00' },
  'DAL': { primary: '#003594', secondary: '#041E42' },
  'DEN': { primary: '#FB4F14', secondary: '#002244' },
  'DET': { primary: '#0076B6', secondary: '#B0B7BC' },
  'GB': { primary: '#203731', secondary: '#FFB612' },
  'HOU': { primary: '#03202F', secondary: '#A71930' },
  'IND': { primary: '#002C5F', secondary: '#A2AAAD' },
  'JAX': { primary: '#101820', secondary: '#D7A22A' },
  'KC': { primary: '#E31837', secondary: '#FFB81C' },
  'LV': { primary: '#000000', secondary: '#A5ACAF' },
  'LAC': { primary: '#0080C6', secondary: '#FFC20E' },
  'LAR': { primary: '#003594', secondary: '#FFA300' },
  'MIA': { primary: '#008E97', secondary: '#FC4C02' },
  'MIN': { primary: '#4F2683', secondary: '#FFC62F' },
  'NE': { primary: '#002244', secondary: '#C60C30' },
  'NO': { primary: '#101820', secondary: '#D3BC8D' },
  'NYG': { primary: '#0B2265', secondary: '#A71930' },
  'NYJ': { primary: '#125740', secondary: '#000000' },
  'PHI': { primary: '#004C54', secondary: '#A5ACAF' },
  'PIT': { primary: '#FFB612', secondary: '#101820' },
  'SF': { primary: '#AA0000', secondary: '#B3995D' },
  'SEA': { primary: '#002244', secondary: '#69BE28' },
  'TB': { primary: '#D50A0A', secondary: '#FF7900' },
  'TEN': { primary: '#0C2340', secondary: '#4B92DB' },
  'WAS': { primary: '#5A1414', secondary: '#FFB612' }
};

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
  const [isDragging, setIsDragging] = useState(false);

  const {
    name, team, position,
    fantasyPts, auction, vorp, rookie
  } = player;

  const teamColor = teamColors[team] || { primary: '#374151', secondary: '#6B7280' };
  const posConfig = positionConfig[position] || positionConfig['QB'];

  const handleSuccessfulSwipe = (direction) => {
  console.log('Swiped', direction);
  setShowSuccess(direction);
  
};

  const getCardTransform = () => {
    // For background cards, apply the scaling
    if (!isInteractive) {
      return undefined; // Let CSS handle background card transforms
    }
    
    // For success animation only
    if (showSuccess) {
      let translateX = '0px';
      let translateY = '0px';
      let rotate = '0deg';
      
      switch(showSuccess) {
        case 'right':
          translateX = '150px';
          rotate = '25deg';
          break;
        case 'left':
          translateX = '-150px';
          rotate = '-25deg';
          break;
        case 'up':
          translateY = '-150px';
          rotate = '10deg';
          break;
        case 'down':
          translateY = '150px';
          rotate = '-10deg';
          break;
      }
      
      return `translateX(${translateX}) translateY(${translateY}) rotate(${rotate}) scale(1.1)`;
    }
    
    return undefined;
  };

  // Updated to handle 4 directions
  const getSwipeOverlay = () => {
    if (!showSuccess) return null;
    
    const swipeConfig = {
      'up': { icon: '❤️', text: 'LOVE' },
      'right': { icon: '✓', text: 'LIKE' },
      'left': { icon: '~', text: 'MEH' },
      'down': { icon: '✕', text: 'PASS' }
    };
    
    const config = swipeConfig[showSuccess];
    
    return (
      <div 
        className={`swipe-overlay ${showSuccess} success`}
        style={{ opacity: 1 }}
      >
        <div className="overlay-content">
          <div className="swipe-icon">
            {config.icon}
          </div>
          <div className="swipe-text">
            {config.text}
          </div>
        </div>
      </div>
    );
  };

  const cardContent = (
    <div 
      className={`player-card ${!isInteractive ? 'background-card' : 'interactive-card'} ${showSuccess ? 'success' : ''} ${isDragging ? 'dragging' : ''}`}
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

        {/* Stats section - FIXED: Better responsive layout */}
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
          width: min(320px, calc(100vw - 2rem));
          height: min(480px, calc(100vh - 200px));
          max-height: 500px;
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
          box-sizing: border-box;
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
          z-index: 9999;
        }

        .player-card.success {
          transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .team-accent {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, var(--team-primary), var(--team-secondary));
  border-radius: 4px 4px 0 0;
  overflow: hidden;
}

        .card-header {
          padding: clamp(1rem, 4vw, 1.5rem) clamp(1rem, 4vw, 1.25rem) 0;
          flex-shrink: 0;
        }

        .header-content {
          display: flex;
          flex-direction: column;
          gap: clamp(0.5rem, 2vw, 0.75rem);
        }

        .position-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: clamp(0.7rem, 2vw, 0.875rem);
          font-weight: 600;
          color: white;
          width: fit-content;
        }

        .position-icon {
          font-size: clamp(0.8rem, 2.5vw, 1rem);
        }

        .player-name {
          font-size: clamp(1.25rem, 4vw, 1.75rem);
          font-weight: 700;
          color: white;
          margin: 0;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .team-name {
          font-size: clamp(0.9rem, 2.5vw, 1rem);
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .rookie-badge {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: clamp(0.65rem, 2vw, 0.75rem);
          font-weight: 600;
          text-transform: uppercase;
          width: fit-content;
        }

        .card-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: clamp(0.75rem, 3vw, 1.25rem);
          gap: clamp(1rem, 4vw, 1.5rem);
          min-height: 0;
        }

        .avatar-section {
          display: flex;
          justify-content: center;
          align-items: center;
          flex: 1;
          min-height: 0;
        }

        .avatar-placeholder {
          width: clamp(80px, 20vw, 120px);
          height: clamp(80px, 20vw, 120px);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          border: 3px solid rgba(255, 255, 255, 0.1);
        }

        .avatar-initials {
          font-size: clamp(1.5rem, 5vw, 2.5rem);
          font-weight: 700;
          color: white;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
        }

        /* FIXED: Responsive stats grid that doesn't overflow */
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: clamp(0.5rem, 2vw, 0.75rem);
          margin-top: auto;
          flex-shrink: 0;
        }

        .stat-item {
          text-align: center;
          padding: clamp(0.75rem, 3vw, 1rem) clamp(0.5rem, 2vw, 0.75rem);
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: clamp(0.25rem, 1vw, 0.5rem);
        }

        .stat-item.positive .stat-value {
          color: #22c55e;
        }

        .stat-item.negative .stat-value {
          color: #ef4444;
        }

        .stat-value {
          font-size: clamp(0.9rem, 3vw, 1.25rem);
          font-weight: 700;
          color: white;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* FIXED: Allow text wrapping for stat labels */
        .stat-label {
          font-size: clamp(0.6rem, 2vw, 0.75rem);
          color: #9ca3af;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          line-height: 1.2;
          word-wrap: break-word;
          hyphens: auto;
          text-align: center;
          overflow-wrap: break-word;
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
          transition: all 0.2s ease;
        }

        .swipe-overlay.up {
          border: 4px solid #EC4899;
          background: linear-gradient(135deg, rgba(236, 72, 153, 0.4) 0%, rgba(236, 72, 153, 0.2) 100%);
          box-shadow: 
            0 0 50px rgba(236, 72, 153, 0.6),
            inset 0 0 30px rgba(236, 72, 153, 0.1);
        }

        .swipe-overlay.right {
          border: 4px solid #22c55e;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.4) 0%, rgba(34, 197, 94, 0.2) 100%);
          box-shadow: 
            0 0 50px rgba(34, 197, 94, 0.6),
            inset 0 0 30px rgba(34, 197, 94, 0.1);
        }

        .swipe-overlay.left {
          border: 4px solid #F59E0B;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.4) 0%, rgba(245, 158, 11, 0.2) 100%);
          box-shadow: 
            0 0 50px rgba(245, 158, 11, 0.6),
            inset 0 0 30px rgba(245, 158, 11, 0.1);
        }

        .swipe-overlay.down {
          border: 4px solid #ef4444;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.4) 0%, rgba(239, 68, 68, 0.2) 100%);
          box-shadow: 
            0 0 50px rgba(239, 68, 68, 0.6),
            inset 0 0 30px rgba(239, 68, 68, 0.1);
        }

        .swipe-overlay.success {
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
        }

        .particle {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          opacity: 1;
          animation: particleExplosion 0.6s ease-out forwards;
        }

        .particle-1 { animation-delay: 0ms; }
        .particle-2 { animation-delay: 50ms; }
        .particle-3 { animation-delay: 100ms; }
        .particle-4 { animation-delay: 150ms; }
        .particle-5 { animation-delay: 200ms; }
        .particle-6 { animation-delay: 250ms; }
        .particle-7 { animation-delay: 300ms; }
        .particle-8 { animation-delay: 350ms; }
        .particle-9 { animation-delay: 400ms; }
        .particle-10 { animation-delay: 450ms; }
        .particle-11 { animation-delay: 500ms; }
        .particle-12 { animation-delay: 550ms; }

        .particle-burst.right .particle {
          background: #22c55e;
        }

        .particle-burst.left .particle {
          background: #F59E0B;
        }

        .particle-burst.up .particle {
          background: #EC4899;
        }

        .particle-burst.down .particle {
          background: #ef4444;
        }

        @keyframes particleExplosion {
          0% {
            transform: scale(1) translate(0, 0);
            opacity: 1;
          }
          100% {
            transform: scale(0) translate(var(--random-x, 0), var(--random-y, 0));
            opacity: 0;
          }
        }

        .particle-1 { --random-x: 40px; --random-y: -20px; }
        .particle-2 { --random-x: -30px; --random-y: 35px; }
        .particle-3 { --random-x: 25px; --random-y: 45px; }
        .particle-4 { --random-x: -45px; --random-y: -15px; }
        .particle-5 { --random-x: 35px; --random-y: -40px; }
        .particle-6 { --random-x: -25px; --random-y: 30px; }
        .particle-7 { --random-x: 50px; --random-y: 10px; }
        .particle-8 { --random-x: -40px; --random-y: -35px; }
        .particle-9 { --random-x: 20px; --random-y: 50px; }
        .particle-10 { --random-x: -35px; --random-y: -25px; }
        .particle-11 { --random-x: 45px; --random-y: -30px; }
        .particle-12 { --random-x: -20px; --random-y: 40px; }

        .ripple-effect {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          pointer-events: none;
          animation: ripple 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        .ripple-effect.right {
          border: 3px solid #22c55e;
        }

        .ripple-effect.left {
          border: 3px solid #F59E0B;
        }

        .ripple-effect.up {
          border: 3px solid #EC4899;
        }

        .ripple-effect.down {
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

        /* Enhanced mobile responsiveness */
        @media (max-width: 480px) {
          .player-card {
            width: calc(100vw - 1.5rem);
            height: min(420px, calc(100vh - 180px));
          }

          .stats-grid {
            gap: 0.5rem;
          }

          .stat-item {
            padding: 0.75rem 0.5rem;
          }

          .stat-value {
            font-size: 1rem;
          }

          .stat-label {
            font-size: 0.6rem;
          }

          .avatar-placeholder {
            width: 80px;
            height: 80px;
          }

          .avatar-initials {
            font-size: 1.8rem;
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
            transform: scale(calc(0.95 - var(--card-index) * 0.03)) translateY(calc(var(--card-index) * 6px)) !important;
          }
        }
      `}</style>
    </div>
  );

  // Only wrap interactive cards
  if (!isInteractive) {
    return (
      <div 
        className="background-card-wrapper"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none'
        }}
      >
        {cardContent}
      </div>
    );
  }

const x = useMotionValue(0);
const y = useMotionValue(0);
const rotateZ = useTransform(x, [-200, 200], [-25, 25]);
const [isExiting, setIsExiting] = useState(false);

return (
  <motion.div
    drag={!isExiting}
    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
    dragElastic={0.4}
    style={{
      x,
      y,
      rotateZ,
      position: 'absolute',
      inset   : 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      margin: 'auto',
      width: '100%',
      height: '100%',
      maxWidth : 320, 
      maxHeight: 480,
      cursor: isExiting ? 'default' : 'grab',
      userSelect: 'none',
      willChange: 'transform'
    }}
    whileDrag={{ cursor: 'grabbing' }}
    onDragStart={() => {
      setIsDragging(true);
      setShowSuccess(null);
    }}
    onDrag={(event, info) => {
      if (isExiting) return;
      
      const { offset } = info;
      
      if (Math.abs(offset.x) > 40 || Math.abs(offset.y) > 40) {
        if (Math.abs(offset.x) > Math.abs(offset.y)) {
          setShowSuccess(offset.x > 0 ? 'right' : 'left');
        } else {
          setShowSuccess(offset.y < 0 ? 'up' : 'down');
        }
      } else {
        setShowSuccess(null);
      }
    }}
    onDragEnd={(event, info) => {
      if (isExiting) return;
      
      setIsDragging(false);
      
      const { offset, velocity } = info;
      const threshold = 80;
      const velocityThreshold = 500;
      
      let direction = null;
      
      if (Math.abs(offset.x) > Math.abs(offset.y)) {
        if (offset.x > threshold || velocity.x > velocityThreshold) {
          direction = 'right';
        } else if (offset.x < -threshold || velocity.x < -velocityThreshold) {
          direction = 'left';
        }
      } else {
        if (offset.y < -threshold || velocity.y < -velocityThreshold) {
          direction = 'up';
        } else if (offset.y > threshold || velocity.y > velocityThreshold) {
          direction = 'down';
        }
      }
      
      if (direction) {
        // DON'T set isExiting yet - keep card fully visible
        setShowSuccess(direction);
        
        // Show success animation for 800ms while card stays fully visible
        setTimeout(() => {
          // NOW start the exit process
          setIsExiting(true);
          
          // Move off-screen in the swipe direction
          const exitDistance = 500;
          switch(direction) {
            case 'right':
              x.set(exitDistance);
              break;
            case 'left':
              x.set(-exitDistance);
              break;
            case 'up':
              y.set(-exitDistance);
              break;
            case 'down':
              y.set(exitDistance);
              break;
          }
          
          // Call onSwipe after exit animation starts
          setTimeout(() => {
            setShowSuccess(null);
            onSwipe(player, direction);
          }, 50); // Time for exit animation to complete
          
        }, 450); // Card stays fully visible with overlay for 550ms
        
      } else {
        setShowSuccess(null);
      }
    }}
    animate={isExiting ? {
      opacity: 0,
      scale: 0.8
    } : {
      opacity: 1,
      scale: 1
    }}
    transition={{
      type: "spring",
      stiffness: 400,
      damping: 40
    }}
  >
    {cardContent}
  </motion.div>
);
}