import React, { useEffect, useState } from 'react';
import PlayerCard from './PlayerCard';
import { normalizePlayer } from '../utils/normalizePlayer';
import PositionSummary from './PositionSummary';
import OverallSummary from './OverallSummary';
import { recordSwipe, getGlobalSwipeCount } from '../utils/supabase';
import GlobalStatsDisplay from './GlobalStatsDisplay';
import RatingSetupModal from './RatingSetupModal';

// Position limits configuration
const POSITION_LIMITS_KEY = 'draftswipe_position_limits_v1';

// Position display configuration
const POSITION_CONFIG = {
  'QB': { icon: '🎯', name: 'Quarterbacks', color: '#3B82F6' },
  'RB': { icon: '🏃🏾', name: 'Running Backs', color: '#10B981' },
  'WR': { icon: '🙌', name: 'Wide Receivers', color: '#F59E0B' },
  'TE': { icon: '🎪', name: 'Tight Ends', color: '#8B5CF6' }
};

// Updated storage key for new 4-direction system
const STORAGE_KEY = 'draftswipe_prefs_v3_4direction';
// New storage key for position progress
const PROGRESS_STORAGE_KEY = 'draftswipe_progress_v1';
// NEW: Storage key for completed positions
const COMPLETED_POSITIONS_KEY = 'draftswipe_completed_positions_v1';
// SWIPE COUNTER: Storage key for global swipe counter
const SWIPE_COUNTER_KEY = 'draftswipe_global_counter';

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
  const [showSummary, setShowSummary] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showSupportBanner, setShowSupportBanner] = useState(
  !localStorage.getItem('support_banner_dismissed_v1')
);
const [positionLimits, setPositionLimits] = useState(() => {
  const saved = localStorage.getItem(POSITION_LIMITS_KEY);
  if (saved) {
    return JSON.parse(saved);
  }
  // Default limits if nothing saved
  return { QB: 15, RB: 30, WR: 35, TE: 20 };
});
  const [prefs, setPrefs] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  });
  
  // FIXED: Load completed positions from localStorage on startup
  const [completedPositions, setCompletedPositions] = useState(() => {
    const raw = localStorage.getItem(COMPLETED_POSITIONS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  });
  
  // New state for tracking progress per position
  const [positionProgress, setPositionProgress] = useState(() => {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  });

  // Add state for global counter (replace your existing globalSwipeCount)
  const [globalSwipeCount, setGlobalSwipeCount] = useState(0);

  // NEW: Helper function to save completed positions
  const saveCompletedPositions = (newCompletedPositions) => {
    setCompletedPositions(newCompletedPositions);
    localStorage.setItem(COMPLETED_POSITIONS_KEY, JSON.stringify([...newCompletedPositions]));
  };

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


// Load global count on component mount
useEffect(() => {
  const loadGlobalCount = async () => {
    const count = await getGlobalSwipeCount();
    if (count !== null) {
      setGlobalSwipeCount(count);
    }
  };
  
  loadGlobalCount();
}, []);


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

  useEffect(() => {
   const hasCompletedSetup = localStorage.getItem('draftswipe_setup_complete_v1');
   if (!hasCompletedSetup && !showSetupModal) {
    setShowSetupModal(true);
   }
  }, []);

  // Process players by position when data loads
  const processedPositions = React.useMemo(() => {
    if (!allPlayers.length) return {};
    
    const grouped = {};
    Object.keys(positionLimits).forEach(position => {
      const positionPlayers = allPlayers
        .filter(p => p.position === position)
        .sort((a, b) => parseFloat(b.fantasyPts) - parseFloat(a.fantasyPts))
        .slice(0, positionLimits[position]);
      
      grouped[position] = positionPlayers;
    });
    
    return grouped;
  }, [allPlayers, positionLimits]);

  const getCounts = React.useCallback((position) => {
  const list  = processedPositions[position] ?? [];
  const total = list.length;
  const rated = list.reduce((n, p) => n + (prefs[p.id] !== undefined), 0);
  return { total, rated };
}, [processedPositions, prefs]);

  const handleSetupConfirm = (selection) => {
  setPositionLimits(selection.limits);
  localStorage.setItem(POSITION_LIMITS_KEY, JSON.stringify(selection.limits));
  localStorage.setItem('draftswipe_setup_complete_v1', 'true');
  setShowSetupModal(false);
};

  const handlePositionSelect = (position) => {
    setCurrentPosition(position);
    setPositionPlayers(processedPositions[position] || []);
    // Restore saved progress for this position
    const savedIndex = getSavedProgress(position);
    setIndex(savedIndex);
  };

const getPositionStatus = (position) => {
   const { total, rated } = getCounts(position);
   if (total === 0) return { status: 'Not Started', progress: 0, total };
   if (rated >= total) return { status: 'Completed', progress: total, total };
   if (rated > 0)      return { status: 'In Progress', progress: rated, total };
      return { status: 'Not Started', progress: 0, total };
 };


  const [swipeHistory, setSwipeHistory] = useState([]);
  const onSwipe = async (player, direction) => {
  const value = DIRECTION_VALUES[direction];
  setSwipeHistory(h => [...h, { player, direction, value }]);
  const newPrefs = { ...prefs, [player.id]: value };
  setPrefs(newPrefs);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
  
  // Record analytics and get updated global count
  try {
    const result = await recordSwipe(player.id, value);
    if (result.success && result.globalCount !== null) {
      // Update global counter from server response
      setGlobalSwipeCount(result.globalCount);
    }
  } catch (error) {
    console.warn('Analytics recording failed:', error);
    // Fallback: increment local counter
    setGlobalSwipeCount(prev => prev + 1);
  }
  
  const nextIndex = index + 1;
  setIndex(nextIndex);
  
  // Mark position as completed if we've reached the end
  if (nextIndex >= positionPlayers.length) {
    const newCompletedPositions = new Set([...completedPositions, currentPosition]);
    saveCompletedPositions(newCompletedPositions);

    // show support banner after a completion
  setShowSupportBanner(true);
    
    // Clear progress for completed position
    const newProgress = { ...positionProgress };
    delete newProgress[currentPosition];
    setPositionProgress(newProgress);
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(newProgress));
  }
};

const allDone = React.useMemo(
   () => Object.keys(POSITION_CONFIG).every(pos => {
     const { total, rated } = getCounts(pos);
     return total > 0 && rated >= total;
   }),
   [getCounts]
 );


const handleUndo = async () => {
  if (!swipeHistory.length || index === 0) return;

  // pull the last action
  const last = swipeHistory[swipeHistory.length - 1];

  // 1) roll the deck back one card
  setIndex(i => i - 1);

  // 2) delete the local rating
  setPrefs(p => {
    const copy = { ...p };
    delete copy[last.player.id];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
    return copy;
  });

  // 3) optionally delete the row in Supabase
  if (last.dbRowId) {
    supabase.from('swipes').delete().eq('id', last.dbRowId);
  }

  // 4) pop the history
  setSwipeHistory(h => h.slice(0, -1));
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
    
    // FIXED: Use helper function to save completed positions
    const newCompletedPositions = new Set(completedPositions);
    newCompletedPositions.delete(currentPosition);
    saveCompletedPositions(newCompletedPositions);
    
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

  // SWIPE COUNTER: Format swipe count with commas for readability
  const formatSwipeCount = (count) => {
    return count.toLocaleString();
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

   // Show overall summary only when all positions are done *and*
   // you’re no longer inside an individual position screen
  if (!currentPosition && allDone &&
      completedPositions.size === Object.keys(POSITION_CONFIG).length) {
  return (
    <OverallSummary 
      onViewDraftPlan={() => {
        window.location.href = '?plan'; // Or navigate however you'd like
      }}
      onStartOver={() => {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(PROGRESS_STORAGE_KEY);
        localStorage.removeItem(COMPLETED_POSITIONS_KEY);
        localStorage.removeItem(SWIPE_COUNTER_KEY);
        localStorage.removeItem(POSITION_LIMITS_KEY);  // Add this
  localStorage.removeItem('draftswipe_setup_complete_v1');  // Add this
        setCompletedPositions(new Set());
        setPrefs({});
        setPositionProgress({});
        setPositionLimits({ QB: 15, RB: 30, WR: 35, TE: 20 });  // Add this
      }}
    />
  );
}

  // Position Selection Screen
  if (!currentPosition) {
    return (
      <div style={styles.appContainer}>
        <div style={styles.positionSelectionScreen}>

         <div style={styles.topBar}>
  <a
    href="https://donate.stripe.com/fZufZbaGMdrKe2g51HaAw00"
    target="_blank"
    rel="noopener noreferrer"
    style={styles.supportBtn}
    aria-label="Support SwipeScout"
  >
    <span style={styles.supportGlyph}>♥︎</span>
  </a>

  <div style={styles.counterSlot}>
    <GlobalStatsDisplay globalSwipeCount={globalSwipeCount} />
  </div>
  <button
  onClick={() => setShowSetupModal(true)}
  style={styles.settingsBtn}
  aria-label="Settings"
>
  <span style={styles.settingsGlyph}>⚙︎</span>
</button>
</div>
          <div style={styles.positionHeader}>
            <h1 style={styles.positionHeaderTitle}>SwipeScout</h1>
            <p style={styles.positionHeaderSubtitle}>Select a position. Swipe ⬆️, ⬇️, ⬅️, or ➡️ to rate players.<br /><br />Complete all 4 positions to unlock your fantasy football draft personality and strategy!</p>
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
                      <p style={styles.positionDetailsSubtitle}>Top {positionLimits[position]} players</p>
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
            {(() => {
     const done = Object.keys(POSITION_CONFIG).filter(pos => {
       const { total, rated } = getCounts(pos);
       return total > 0 && rated >= total;
     }).length;
     return `Progress: ${done} of ${Object.keys(POSITION_CONFIG).length} positions completed`;
   })()}
          </div>
          <div>&nbsp;</div>
       {showSupportBanner && (
  <div
    style={{
      ...styles.supportBanner,
      ...(isMobile ? { gridTemplateColumns: '1fr', gap: 10 } : {})
    }}
  >
    <span style={styles.supportText}>
      SwipeScout is free. If it helps your draft prep, consider a small tip.
    </span>

    <div
      style={{
        ...styles.supportActions,
        ...(isMobile ? { width: '100%', justifyContent: 'stretch' } : {})
      }}
    >
      <a
        href="https://donate.stripe.com/fZufZbaGMdrKe2g51HaAw00"
        target="_blank"
        rel="noopener noreferrer"
        style={{ ...styles.bannerBtn, ...(isMobile ? { width: '100%' } : {}) }}
      >
        ❤️ Support
      </a>

      <button
        onClick={() => {
          setShowSupportBanner(false);
          localStorage.setItem('support_banner_dismissed_v1', '1');
        }}
        style={{ ...styles.bannerDismiss, ...(isMobile ? { width: '100%' } : {}) }}
      >
        Dismiss
      </button>
    </div>
  </div>
)}

        </div>
        {showSetupModal && (
        <RatingSetupModal
          onConfirm={handleSetupConfirm}
          onClose={() => setShowSetupModal(false)}
        />
      )}
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
  if (index >= positionPlayers.length && !showSummary) {
  // Show summary instead of immediate completion
  return (
    <PositionSummary 
      position={currentPosition}
      onContinue={() => {
        // Mark position as completed
        const newCompleted = new Set(completedPositions);
        newCompleted.add(currentPosition);
        setCompletedPositions(newCompleted);
        localStorage.setItem(COMPLETED_POSITIONS_KEY, JSON.stringify(Array.from(newCompleted)));
        
        // Go back to position selection
        goBackToPositions();
      }}
      onRestart={() => {
        resetPosition();
        setShowSummary(false);
      }}
      onClose={() => navigate(-1)}
    />
  );
}

  const currentPlayer = positionPlayers[index];
  const { total: totalHere, rated: ratedHere } = getCounts(currentPosition);
  
  return (
    <div style={styles.appContainer}>
      {/* Position Header */}
      <div style={styles.positionHeaderBar}>
        <button onClick={goBackToPositions} style={styles.backButton}>
          ← Back
        </button>
        <div style={styles.positionProgress}>
          <h3 style={styles.positionProgressTitle}>{POSITION_CONFIG[currentPosition]?.name}</h3>
          <p style={styles.positionProgressSubtitle}>{index + 1} of {positionPlayers.length}</p>
        </div>
        {/* SWIPE COUNTER: Global Swipe Counter - shown during swiping */}
        <div style={styles.globalCounterCompact}>
          <div style={styles.counterLabelSmall}>Swipes</div>
          <div style={styles.counterValueSmall}>{formatSwipeCount(globalSwipeCount)}</div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div style={styles.progressContainer}>
        <div style={styles.progressBar}>
          <div 
            style={{
              ...styles.progressFill,
              width: `${(ratedHere / totalHere) * 100}%`,
              backgroundColor: POSITION_CONFIG[currentPosition]?.color 
            }}
          />
        </div>
        <div style={styles.progressText}>
          {ratedHere} of {totalHere} rated
        </div>
      </div>

      {/* Card Deck */}
      <div style={styles.deckContainer}>
        {isMobile && swipeHistory.length > 0 && (
  <button
    onClick={handleUndo}
    style={styles.undoFab}
    aria-label="Undo last swipe"
  >
    Undo
  </button>
)}
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
            {swipeHistory.length > 0 && (
     <button
      onClick={handleUndo}
       style={{ ...styles.actionBtn, ...styles.undoBtn }}
       title="Undo last swipe"
     >
       Undo
     </button>
   )}
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
                <span style={styles.instructionIcon}>👇</span>
                <span style={styles.instructionText}>Pass  &nbsp;|</span>
                <span style={styles.instructionIcon}>👈</span>
                <span style={styles.instructionText}>Meh  &nbsp;|</span>
                <span style={styles.instructionIcon}>👉</span>
                <span style={styles.instructionText}>Like  &nbsp;|</span>
                <span style={styles.instructionIcon}>👆</span>
                <span style={styles.instructionText}>Love</span>
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

  // SWIPE COUNTER: Global counter on position selection screen
  globalCounter: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '0.75rem',
    padding: '0.75rem 1rem',
    marginBottom: '2rem',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '0.5rem'
  },

  counterLabel: {
    color: '#d1d5db',
    fontSize: '0.9rem',
    fontWeight: '500'
  },

  counterValue: {
    color: '#22c55e',
    fontSize: '1.1rem',
    fontWeight: 'bold'
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

  // SWIPE COUNTER: Compact global counter for header
  globalCounterCompact: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '0.5rem',
    padding: '0.5rem',
    backdropFilter: 'blur(10px)',
    textAlign: 'center',
    minWidth: '60px'
  },

  counterLabelSmall: {
    color: '#9ca3af',
    fontSize: '0.7rem',
    fontWeight: '500',
    lineHeight: 1
  },

  counterValueSmall: {
    color: '#22c55e',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    lineHeight: 1
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

  undoBtn: {
  order: -1,                // appear at the far-left of the row
  width: 46,
  height: 46,
  fontSize: '1rem',
  lineHeight: 1,
  background: 'linear-gradient(135deg,#0ea5e9 0%,#0284c7 100%)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
},

// floating action button for mobile
undoFab: {
  position: 'absolute',
bottom: '75px',
  left: '0px',
  zIndex: 10,
  padding: '4px 5px',
  fontSize: '1rem',
  borderRadius: '9999px',
  background: 'linear-gradient(135deg,#0ea5e9 0%,#0284c7 100%)',
  color: '#fff',
  border: 'none',
  boxShadow: '0 4px 10px rgba(0,0,0,.25)',
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
  },

 topBar: {
  width: '100%',
  maxWidth: 'min(600px, calc(100vw - 3rem))',
  margin: '0 auto 1.25rem',
  display: 'grid',
  gridTemplateColumns: '40px 1fr 40px',
  alignItems: 'center'
},
topSlot: { width: 40, height: 1 },
counterSlot: { justifySelf: 'center' },

supportBtn: {
  all: 'unset',
  WebkitAppearance: 'none',
  appearance: 'none',
  boxSizing: 'border-box',
  width: 36,
  height: 36,
  borderRadius: '8px',
  display: 'grid',
  placeItems: 'center',
  background: 'rgba(255,255,255,0.10)',
  border: '1px solid rgba(255,255,255,0.20)',
  color: '#f87171',
  cursor: 'pointer',
  transition: 'background .15s, border-color .15s, transform .08s',
  WebkitTapHighlightColor: 'transparent',
  textDecoration: 'none'
},
supportGlyph: {
  fontSize: 20,
  lineHeight: 1,
  transform: 'translateY(-1px)'
},

supportBanner: {
  width: '100%',
  maxWidth: 'min(600px, calc(100vw - 3rem))',
  margin: '0 auto 1.25rem',
  padding: 'clamp(0.75rem, 2.5vw, 1rem)',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.14)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
  backdropFilter: 'blur(8px)',
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: '12px',
  alignItems: 'center',
},

// Text scales nicely and wraps
supportText: {
  color: '#e5e7eb',
  fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
  lineHeight: 1.4,
  textAlign: 'left',
},

// Button row that collapses on mobile
supportActions: {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
},

bannerBtn: {
  all: 'unset',
  cursor: 'pointer',
  padding: '0.6rem 1rem',
  borderRadius: '10px',
  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  color: '#fff',
  fontWeight: 700,
  fontSize: '0.95rem',
  textAlign: 'center',
  boxShadow: '0 6px 16px rgba(16, 185, 129, 0.28)'
},


bannerDismiss: {
  all: 'unset',
  cursor: 'pointer',
  padding: '0.6rem 1rem',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.25)',
  color: '#cbd5e1',
  fontWeight: 600,
  fontSize: '0.95rem',
  textAlign: 'center',
  background: 'rgba(255,255,255,0.04)',
},

settingsBtn: {
  all: 'unset',                 // nukes UA defaults (including iOS white bg)
  WebkitAppearance: 'none',
  appearance: 'none',
  boxSizing: 'border-box',
  width: 36,
  height: 36,
  borderRadius: '8px',
  display: 'grid',
  placeItems: 'center',
  background: 'rgba(255,255,255,0.10)',
  border: '1px solid rgba(255,255,255,0.20)',
  cursor: 'pointer',
  transition: 'background .15s, color .15s, border-color .15s',
  color: '#94a3b8',             // icon color
  WebkitTapHighlightColor: 'transparent'
},
settingsGlyph: {
  fontSize: '22px',
  lineHeight: 1,
  transform: 'translateY(-1px)' // nudges emoji to visual center
},
settingsBtnHover: {             // if you handle :hover in JS
  background: 'rgba(255,255,255,0.15)',
  color: '#f1f5f9'
},

};