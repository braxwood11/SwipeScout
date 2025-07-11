import React, { useEffect, useState } from 'react';
import PlayerCard from './PlayerCard';
import { normalizePlayer } from '../utils/normalizePlayer';

// Position limits configuration
const POSITION_LIMITS = {
  'QB': 25,
  'RB': 50, 
  'WR': 75,
  'TE': 25
};

// Position display configuration
const POSITION_CONFIG = {
  'QB': { icon: '🎯', name: 'Quarterbacks', color: '#3B82F6' },
  'RB': { icon: '🏃', name: 'Running Backs', color: '#10B981' },
  'WR': { icon: '🙌', name: 'Wide Receivers', color: '#F59E0B' },
  'TE': { icon: '🎪', name: 'Tight Ends', color: '#8B5CF6' }
};

// Updated storage key for new 4-direction system
const STORAGE_KEY = 'draftswipe_prefs_v3_4direction';

// Direction to value mapping
const DIRECTION_VALUES = {
  'up': 2,    // Love
  'right': 1, // Like
  'left': 0,  // Meh
  'down': -1  // Pass
};

export default function SwipeDeck() {
  const [allPlayers, setAllPlayers] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [positionPlayers, setPositionPlayers] = useState([]);
  const [index, setIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [prefs, setPrefs] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  });
  const [completedPositions, setCompletedPositions] = useState(new Set());

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load all players on mount
  useEffect(() => {
    fetch('/players.json')
      .then(r => r.json())
      .then(raw => setAllPlayers(raw.map(normalizePlayer)));
  }, []);

  // Process players by position when data loads
  const processedPositions = React.useMemo(() => {
    if (!allPlayers.length) return {};
    
    const grouped = {};
    Object.keys(POSITION_LIMITS).forEach(position => {
      const positionPlayers = allPlayers
        .filter(p => p.position === position)
        .sort((a, b) => parseFloat(b.fantasyPts) - parseFloat(a.fantasyPts))
        .slice(0, POSITION_LIMITS[position]);
      
      grouped[position] = positionPlayers;
    });
    
    return grouped;
  }, [allPlayers]);

  const handlePositionSelect = (position) => {
    setCurrentPosition(position);
    setPositionPlayers(processedPositions[position] || []);
    setIndex(0);
  };

  // Updated onSwipe to handle 4 directions
  const onSwipe = (player, direction) => {
    const value = DIRECTION_VALUES[direction];
    const newPrefs = { ...prefs, [player.id]: value };
    setPrefs(newPrefs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
    
    const nextIndex = index + 1;
    setIndex(nextIndex);
    
    // Mark position as completed if we've reached the end
    if (nextIndex >= positionPlayers.length) {
      setCompletedPositions(prev => new Set([...prev, currentPosition]));
    }
  };

  const resetPosition = () => {
    setIndex(0);
    // Clear preferences for this position
    const newPrefs = { ...prefs };
    positionPlayers.forEach(player => {
      delete newPrefs[player.id];
    });
    setPrefs(newPrefs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
    setCompletedPositions(prev => {
      const updated = new Set(prev);
      updated.delete(currentPosition);
      return updated;
    });
  };

  const goBackToPositions = () => {
    setCurrentPosition(null);
    setPositionPlayers([]);
    setIndex(0);
  };

  // Loading state
  if (!allPlayers.length) {
    return (
      <div style={styles.appContainer}>
        <div style={styles.loadingScreen}>
          <h2>Loading players...</h2>
        </div>
      </div>
    );
  }

  // Position Selection Screen
  if (!currentPosition) {
    return (
      <div style={styles.appContainer}>
        <div style={styles.positionSelectionScreen}>
          <div style={styles.positionHeader}>
            <h1 style={styles.positionHeaderTitle}>SwipeScout</h1>
            <p style={styles.positionHeaderSubtitle}>Select a position to start evaluating players</p>
          </div>

          <div style={styles.positionGrid}>
            {Object.entries(POSITION_CONFIG).map(([position, config]) => {
              const playerCount = processedPositions[position]?.length || 0;
              const limit = POSITION_LIMITS[position];
              const isCompleted = completedPositions.has(position);
              
              return (
                <button
                  key={position}
                  onClick={() => handlePositionSelect(position)}
                  style={{
                    ...styles.positionCard,
                    ...(isCompleted ? styles.positionCardCompleted : {}),
                    borderColor: config.color
                  }}
                >
                  {isCompleted && <div style={styles.completionBadge}>✓</div>}
                  
                  <div style={styles.positionInfo}>
                    <div style={{...styles.positionIcon, backgroundColor: config.color}}>
                      {config.icon}
                    </div>
                    <div style={styles.positionDetails}>
                      <h3 style={styles.positionDetailsTitle}>{config.name}</h3>
                      <p style={styles.positionDetailsSubtitle}>Top {limit} players</p>
                    </div>
                  </div>
                  
                  <div style={styles.positionStats}>
                    <span>{playerCount} players loaded</span>
                    <span>{isCompleted ? 'Completed' : 'Not started'}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div style={styles.overallProgress}>
            Progress: {completedPositions.size} of {Object.keys(POSITION_CONFIG).length} positions completed
          </div>
        </div>
      </div>
    );
  }

  // Loading position players
  if (!positionPlayers.length) {
    return (
      <div style={styles.appContainer}>
        <div style={styles.loadingScreen}>
          <h2>Loading {POSITION_CONFIG[currentPosition]?.name}...</h2>
        </div>
      </div>
    );
  }

  // Completion state for current position
  if (index >= positionPlayers.length) {
    return (
      <div style={styles.appContainer}>
        <div style={styles.completionScreen}>
          <h2 style={styles.completionTitle}>{POSITION_CONFIG[currentPosition]?.name} Complete! 🎉</h2>
          <p style={styles.completionSubtitle}>You've evaluated all {positionPlayers.length} players in this position.</p>
          
          <div style={styles.completionActions}>
            <button onClick={goBackToPositions} style={styles.primaryBtn}>
              Choose Another Position
            </button>
            <button onClick={resetPosition} style={styles.secondaryBtn}>
              Restart This Position
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentPlayer = positionPlayers[index];
  
  return (
    <div style={styles.appContainer}>
      {/* Position Header */}
      <div style={styles.positionHeaderBar}>
        <button onClick={goBackToPositions} style={styles.backButton}>
          ← Back to Positions
        </button>
        <div style={styles.positionProgress}>
          <h3 style={styles.positionProgressTitle}>{POSITION_CONFIG[currentPosition]?.name}</h3>
          <p style={styles.positionProgressSubtitle}>{index + 1} of {positionPlayers.length}</p>
        </div>
        {!isMobile && <div style={styles.spacer}></div>}
      </div>
      
      {/* Progress Bar */}
      <div style={styles.progressContainer}>
        <div style={styles.progressBar}>
          <div 
            style={{
              ...styles.progressFill,
              width: `${(index / positionPlayers.length) * 100}%`,
              backgroundColor: POSITION_CONFIG[currentPosition]?.color 
            }}
          />
        </div>
        <div style={styles.progressText}>
          {index + 1} / {positionPlayers.length}
        </div>
      </div>

      {/* Card Deck */}
      <div style={styles.deckContainer}>
        <div style={styles.deck}>
          {/* Background card 2 (furthest back) */}
          {positionPlayers[index + 2] && (
            <PlayerCard
              key={`bg2-${positionPlayers[index + 2].id}`}
              player={positionPlayers[index + 2]}
              onSwipe={() => {}}
              cardIndex={2}
              isInteractive={false}
            />
          )}
          
          {/* Background card 1 (middle) */}
          {positionPlayers[index + 1] && (
            <PlayerCard
              key={`bg1-${positionPlayers[index + 1].id}`}
              player={positionPlayers[index + 1]}
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
      </div>

      {/* Instructions - Updated for 4 directions */}
      <div style={styles.instructions}>
        <p>Swipe ↑ love, → like, ← meh, ↓ pass</p>
      </div>
    </div>
  );
}

const styles = {
  appContainer: {
    minHeight: '100vh',
    width: '100vw', // Use full viewport width
    maxWidth: '100vw', // Prevent any overflow
    background: 'linear-gradient(135deg, #1e293b 0%, #7c3aed 50%, #1e293b 100%)',
    backgroundAttachment: 'fixed',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 'clamp(0.75rem, 2vw, 1.5rem)',
    color: 'white',
    overflowX: 'hidden', // Prevent horizontal scroll
    boxSizing: 'border-box',
    margin: 0, // Ensure no margin
    position: 'relative' // Establish containing block
  },

  // Position Selection Screen Styles
  positionSelectionScreen: {
    padding: '0',
    maxWidth: '100%',
    margin: '0',
    width: '100%',
    minHeight: 'calc(100vh - 3rem)', // Account for appContainer padding
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center', // Center content
    boxSizing: 'border-box'
  },

  positionHeader: {
    textAlign: 'center',
    marginBottom: 'clamp(2rem, 5vh, 3rem)',
    padding: '0',
    width: '100%',
    maxWidth: '100%'
  },

  positionHeaderTitle: {
    fontSize: 'clamp(2rem, 5vw, 3rem)',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: '0 0 0.5rem 0'
  },

  positionHeaderSubtitle: {
    fontSize: 'clamp(1rem, 2.5vw, 1.1rem)',
    color: '#d1d5db',
    margin: '0'
  },

  positionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, calc(100vw - 4rem)), 1fr))', // Better responsive sizing
    gap: 'clamp(0.75rem, 2.5vw, 1.5rem)',
    marginBottom: '2rem',
    width: '100%',
    maxWidth: 'min(1200px, calc(100vw - 3rem))', // Ensure it fits in viewport
    padding: '0',
    boxSizing: 'border-box'
  },

  positionCard: {
    position: 'relative',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    border: '2px solid',
    borderRadius: '1rem',
    padding: 'clamp(1rem, 3vw, 1.5rem)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    color: 'white',
    minHeight: '120px',
    width: '100%',
    boxSizing: 'border-box'
  },

  positionCardCompleted: {
    background: 'rgba(34, 197, 94, 0.2)',
    borderColor: '#22c55e'
  },

  completionBadge: {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    color: '#22c55e',
    fontSize: '1.5rem',
    fontWeight: 'bold'
  },

  positionInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    width: '100%',
    overflow: 'hidden'
  },

  positionIcon: {
    width: 'clamp(3rem, 8vw, 4rem)',
    height: 'clamp(3rem, 8vw, 4rem)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'clamp(1.5rem, 4vw, 2rem)',
    color: 'white',
    flexShrink: 0
  },

  positionDetails: {
    textAlign: 'left',
    flex: '1',
    overflow: 'hidden'
  },

  positionDetailsTitle: {
    fontSize: 'clamp(1.1rem, 3vw, 1.25rem)',
    fontWeight: 'bold',
    margin: '0',
    color: 'white',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },

  positionDetailsSubtitle: {
    margin: '0',
    color: '#d1d5db',
    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },

  positionStats: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
    color: '#d1d5db',
    marginTop: 'auto'
  },

  overallProgress: {
    textAlign: 'center',
    color: '#d1d5db',
    fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
    marginTop: '1rem'
  },

  // Position Header Bar
  positionHeaderBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 'min(500px, calc(100vw - 3rem))',
    marginBottom: 'clamp(1rem, 3vw, 1.5rem)',
    gap: '1rem',
    boxSizing: 'border-box'
  },

  backButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    color: 'white',
    padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 3vw, 1rem)',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap'
  },

  positionProgress: {
    textAlign: 'center',
    flex: '1',
    overflow: 'hidden'
  },

  positionProgressTitle: {
    fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
    fontWeight: 'bold',
    margin: '0',
    color: 'white',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },

  positionProgressSubtitle: {
    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
    color: '#d1d5db',
    margin: '0',
    marginTop: '0.25rem'
  },

  spacer: {
    width: 'clamp(3rem, 8vw, 5rem)', // Match backButton approximate width
    flexShrink: 0
  },

  // Progress Bar
  progressContainer: {
    width: '100%',
    maxWidth: 'min(400px, calc(100vw - 3rem))',
    marginBottom: 'clamp(1rem, 3vw, 1.5rem)',
    boxSizing: 'border-box'
  },

  progressBar: {
    width: '100%',
    height: '8px',
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '1rem',
    overflow: 'hidden',
    marginBottom: '0.5rem'
  },

  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease',
    borderRadius: '1rem'
  },

  progressText: {
    textAlign: 'center',
    color: '#d1d5db',
    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
    fontWeight: 'bold'
  },

  // Card Deck
  deckContainer: {
    position: 'relative',
    marginBottom: 'clamp(1rem, 3vw, 1.5rem)',
    boxSizing: 'border-box'
  },

  deck: {
    position: 'relative',
    width: 'min(320px, calc(100vw - 4rem))', // Ensure proper spacing from edges
    height: 'min(450px, 60vh)',
    maxHeight: '500px'
  },

  // Loading and Completion Styles
  loadingScreen: {
    textAlign: 'center',
    color: 'white',
    padding: 'clamp(2rem, 5vw, 3rem)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '50vh',
    width: '100%',
    boxSizing: 'border-box'
  },

  completionScreen: {
    textAlign: 'center',
    color: 'white',
    maxWidth: 'min(500px, calc(100vw - 3rem))', // Responsive max width
    padding: 'clamp(1rem, 3vw, 2rem)',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '50vh',
    width: '100%',
    boxSizing: 'border-box'
  },

  completionTitle: {
    fontSize: 'clamp(1.5rem, 4vw, 2rem)',
    marginBottom: '1rem'
  },

  completionSubtitle: {
    color: '#d1d5db',
    marginBottom: '2rem',
    fontSize: 'clamp(1rem, 2.5vw, 1.1rem)',
    lineHeight: '1.5'
  },

  completionActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginTop: '2rem',
    width: '100%',
    maxWidth: '300px'
  },

  primaryBtn: {
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: 'clamp(0.8rem, 2vw, 1rem) clamp(1.5rem, 3vw, 2rem)',
    borderRadius: '0.5rem',
    fontSize: 'clamp(0.9rem, 2vw, 1rem)',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: '100%'
  },

  secondaryBtn: {
    background: '#6b7280',
    color: 'white',
    border: 'none',
    padding: 'clamp(0.8rem, 2vw, 1rem) clamp(1.5rem, 3vw, 2rem)',
    borderRadius: '0.5rem',
    fontSize: 'clamp(0.9rem, 2vw, 1rem)',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: '100%'
  },

  // Instructions - Updated text only
  instructions: {
    textAlign: 'center',
    marginTop: '1rem',
    color: '#9ca3af',
    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
    padding: '0',
    width: '100%',
    boxSizing: 'border-box'
  }
};