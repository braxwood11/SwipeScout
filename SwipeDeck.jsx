import React, { useEffect, useState } from 'react';
import PlayerCard from './PlayerCard';
import { normalizePlayer } from '../utils/normalizePlayer';

// Position limits configuration
const POSITION_LIMITS = {
  'QB': 32,
  'RB': 75, 
  'WR': 100,
  'TE': 40
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
// New storage key for position progress
const PROGRESS_STORAGE_KEY = 'draftswipe_progress_v1';

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
  // New state for tracking progress per position
  const [positionProgress, setPositionProgress] = useState(() => {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  });

  // Helper function to save position progress
  const savePositionProgress = (position, currentIndex) => {
    const newProgress = { ...positionProgress, [position]: currentIndex };
    setPositionProgress(newProgress);
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(newProgress));
  };

  // Helper function to get saved progress for a position
  const getSavedProgress = (position) => {
    return positionProgress[position] || 0;
  };

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

  // Save progress whenever index changes and we have a current position
  useEffect(() => {
    if (currentPosition && index > 0) {
      savePositionProgress(currentPosition, index);
    }
  }, [index, currentPosition]);

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
    // Restore saved progress for this position
    const savedIndex = getSavedProgress(position);
    setIndex(savedIndex);
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
      // Clear progress for completed position
      const newProgress = { ...positionProgress };
      delete newProgress[currentPosition];
      setPositionProgress(newProgress);
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(newProgress));
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
    // Clear saved progress for this position
    const newProgress = { ...positionProgress };
    delete newProgress[currentPosition];
    setPositionProgress(newProgress);
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(newProgress));
  };

  const goBackToPositions = () => {
    // Save current progress before leaving
    if (currentPosition && index > 0 && index < positionPlayers.length) {
      savePositionProgress(currentPosition, index);
    }
    setCurrentPosition(null);
    setPositionPlayers([]);
    setIndex(0);
  };

  // Helper function to get position status and progress info
  const getPositionStatus = (position) => {
    const playerCount = processedPositions[position]?.length || 0;
    const isCompleted = completedPositions.has(position);
    const currentProgress = positionProgress[position] || 0;
    
    if (isCompleted) {
      return { status: 'Completed', progress: playerCount, total: playerCount };
    } else if (currentProgress > 0) {
      return { status: 'In Progress', progress: currentProgress, total: playerCount };
    } else {
      return { status: 'Not Started', progress: 0, total: playerCount };
    }
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
              const { status, progress, total } = getPositionStatus(position);
              const isCompleted = status === 'Completed';
              const isInProgress = status === 'In Progress';
              
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
                      <p style={styles.positionDetailsSubtitle}>Top {POSITION_LIMITS[position]} players</p>
                    </div>
                  </div>
                  
                  <div style={styles.positionStats}>
                    <span>{total} players loaded</span>
                    <span style={{
                      color: isCompleted ? '#10B981' : isInProgress ? '#F59E0B' : '#9CA3AF'
                    }}>
                      {status}
                    </span>
                    {isInProgress && (
                      <div style={styles.progressIndicator}>
                        <div style={styles.progressBar}>
                          <div 
                            style={{
                              ...styles.progressFill,
                              width: `${(progress / total) * 100}%`,
                              backgroundColor: config.color
                            }}
                          />
                        </div>
                        <span style={styles.progressText}>
                          {progress} / {total}
                        </span>
                      </div>
                    )}
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
        
        {/* Action Buttons for Desktop/Larger Screens */}
        {!isMobile && (
          <div style={styles.desktopActions}>
            <button 
              style={{...styles.actionBtn, ...styles.passBtn}}
              onClick={() => onSwipe(currentPlayer, 'down')}
            >
              Pass
            </button>
            <button 
              style={{...styles.actionBtn, ...styles.mehBtn}}
              onClick={() => onSwipe(currentPlayer, 'left')}
            >
              Meh
            </button>
            <button 
              style={{...styles.actionBtn, ...styles.likeBtn}}
              onClick={() => onSwipe(currentPlayer, 'right')}
            >
              Like
            </button>
            <button 
              style={{...styles.actionBtn, ...styles.loveBtn}}
              onClick={() => onSwipe(currentPlayer, 'up')}
            >
              Love
            </button>
          </div>
        )}

        {/* Swipe Instructions for Mobile */}
        {isMobile && (
          <div style={styles.swipeInstructions}>
            <div style={styles.instructionRow}>
              <span style={styles.instructionItem}>
                <span style={styles.instructionIcon}>👆</span>
                <span style={styles.instructionText}>Swipe Up: Love</span>
              </span>
            </div>
            <div style={styles.instructionRow}>
              <span style={styles.instructionItem}>
                <span style={styles.instructionIcon}>👈</span>
                <span style={styles.instructionText}>Swipe Left: Meh</span>
              </span>
              <span style={styles.instructionItem}>
                <span style={styles.instructionIcon}>👉</span>
                <span style={styles.instructionText}>Swipe Right: Like</span>
              </span>
            </div>
            <div style={styles.instructionRow}>
              <span style={styles.instructionItem}>
                <span style={styles.instructionIcon}>👇</span>
                <span style={styles.instructionText}>Swipe Down: Pass</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced styles with new progress indicator styles
const styles = {
  appContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'clamp(1rem, 3vw, 1.5rem)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    boxSizing: 'border-box',
    width: '100vw',
    overflow: 'hidden'
  },

  loadingScreen: {
    textAlign: 'center',
    color: 'white',
    fontSize: 'clamp(1.2rem, 3vw, 1.5rem)'
  },

  positionSelectionScreen: {
    maxWidth: 'min(600px, calc(100vw - 3rem))',
    width: '100%',
    textAlign: 'center',
    boxSizing: 'border-box'
  },

  positionHeader: {
    marginBottom: 'clamp(2rem, 5vw, 3rem)'
  },

  positionHeaderTitle: {
    fontSize: 'clamp(2rem, 6vw, 3.5rem)',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #3B82F6 0%, #10B981 50%, #F59E0B 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: '0 0 1rem 0'
  },

  positionHeaderSubtitle: {
    fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
    color: '#d1d5db',
    margin: '0'
  },

  positionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 'clamp(1rem, 3vw, 1.5rem)',
    marginBottom: 'clamp(2rem, 4vw, 3rem)',
    width: '100%',
    boxSizing: 'border-box'
  },

  positionCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '1rem',
    padding: 'clamp(1rem, 3vw, 1.5rem)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    color: 'white',
    textAlign: 'left',
    position: 'relative',
    overflow: 'hidden',
    minHeight: '120px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },

  positionCardCompleted: {
    background: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },

  completionBadge: {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    background: '#10B981',
    color: 'white',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: 'bold'
  },

  positionInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(0.75rem, 2vw, 1rem)',
    marginBottom: '1rem'
  },

  positionIcon: {
    width: 'clamp(2.5rem, 6vw, 3rem)',
    height: 'clamp(2.5rem, 6vw, 3rem)',
    borderRadius: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
    flexShrink: 0
  },

  positionDetails: {
    flex: 1,
    overflow: 'hidden'
  },

  positionDetailsTitle: {
    fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
    fontWeight: 'bold',
    margin: '0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },

  positionDetailsSubtitle: {
    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
    color: '#d1d5db',
    margin: '0.25rem 0 0 0'
  },

  positionStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
    color: '#d1d5db',
    marginTop: 'auto'
  },

  // New progress indicator styles
  progressIndicator: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    marginTop: '0.5rem'
  },

  progressBar: {
    width: '100%',
    height: '4px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '2px',
    overflow: 'hidden'
  },

  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease',
    borderRadius: '2px'
  },

  progressText: {
    fontSize: '0.75rem',
    color: '#9CA3AF',
    textAlign: 'center'
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
    width: 'clamp(3rem, 8vw, 5rem)',
    flexShrink: 0
  },

  // Progress Container
  progressContainer: {
    width: '100%',
    maxWidth: 'min(400px, calc(100vw - 3rem))',
    marginBottom: 'clamp(1rem, 3vw, 1.5rem)',
    boxSizing: 'border-box'
  },

  // Card Deck
  deckContainer: {
    position: 'relative',
    marginBottom: 'clamp(1rem, 3vw, 1.5rem)',
    boxSizing: 'border-box'
  },

  deck: {
    position: 'relative',
    width: 'min(320px, calc(100vw - 3rem))',
    height: 'min(480px, calc(100vh - 300px))',
    flexShrink: 0,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  // Desktop action buttons
  desktopActions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    marginTop: '1.5rem',
    flexWrap: 'wrap'
  },

  actionBtn: {
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '0.75rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '90px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
  },

  // Swipe instructions for mobile
  swipeInstructions: {
    marginTop: '1.5rem',
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '0.75rem',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },

  instructionRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    marginBottom: '0.5rem'
  },

  instructionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flex: 1,
    justifyContent: 'center',
    maxWidth: '140px'
  },

  instructionIcon: {
    fontSize: '1.2rem'
  },

  instructionText: {
    color: '#d1d5db',
    fontSize: '0.85rem',
    fontWeight: '500',
    whiteSpace: 'nowrap'
  },

  passBtn: {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white'
  },

  mehBtn: {
    background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
    color: 'white'
  },

  likeBtn: {
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    color: 'white'
  },

  loveBtn: {
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    color: 'white'
  },

  // Completion screen
  completionScreen: {
    textAlign: 'center',
    color: 'white',
    padding: 'clamp(2rem, 5vw, 3rem)',
    maxWidth: 'min(500px, calc(100vw - 3rem))',
    boxSizing: 'border-box'
  },

  completionTitle: {
    fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
    fontWeight: 'bold',
    marginBottom: '1rem',
    background: 'linear-gradient(135deg, #22c55e 0%, #3B82F6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },

  completionSubtitle: {
    fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
    color: '#d1d5db',
    marginBottom: '2rem'
  },

  completionActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    alignItems: 'center'
  },

  primaryBtn: {
    background: 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
    color: 'white',
    border: 'none',
    padding: '1rem 2rem',
    borderRadius: '0.75rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '200px'
  },

  secondaryBtn: {
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    padding: '1rem 2rem',
    borderRadius: '0.75rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '200px'
  }
};