// src/components/PositionSummary.jsx
import React, { useState, useEffect } from 'react';
import { normalizePlayer } from '../utils/normalizePlayer';

// Storage keys matching your SwipeDeck
const STORAGE_KEY = 'draftswipe_prefs_v3_4direction';
const COMPLETED_POSITIONS_KEY = 'draftswipe_completed_positions_v1';

// Constants
const POSITION_CONFIG = {
  'QB': { icon: '🎯', name: 'Quarterbacks', color: '#3B82F6' },
  'RB': { icon: '🏃', name: 'Running Backs', color: '#10B981' },
  'WR': { icon: '🙌', name: 'Wide Receivers', color: '#F59E0B' },
  'TE': { icon: '🎪', name: 'Tight Ends', color: '#8B5CF6' }
};

const GM_TYPES = {
  'valueHunter': {
    name: 'The Value Hunter',
    icon: '💎',
    description: 'You find diamonds in the rough',
    color: '#10B981'
  },
  'eliteChaser': {
    name: 'The Elite Chaser', 
    icon: '👑',
    description: 'You target proven superstars',
    color: '#F59E0B'
  },
  'balancedBuilder': {
    name: 'The Balanced Builder',
    icon: '⚖️',
    description: 'You value consistency across the board',
    color: '#3B82F6'
  },
  'riskTaker': {
    name: 'The Risk Taker',
    icon: '🎲',
    description: 'You swing for the fences',
    color: '#EF4444'
  },
  'contrarian': {
    name: 'The Contrarian',
    icon: '🔄',
    description: 'You zig when others zag',
    color: '#8B5CF6'
  }
};

// Analyze user patterns
const analyzeUserTendencies = (players, prefs, position = null) => {
  const ratings = { love: 0, like: 0, meh: 0, pass: 0 };
  const positionPrefs = { QB: [], RB: [], WR: [], TE: [] };
  const valueMetrics = { highValue: [], lowValue: [], loved: [] };
  
  // Filter by position if specified
  const relevantPlayers = position 
    ? players.filter(p => p.position === position)
    : players;
  
  relevantPlayers.forEach(player => {
    const pref = prefs[player.id];
    if (pref === undefined) return;
    
    // Count ratings
    if (pref === 2) {
      ratings.love++;
      valueMetrics.loved.push(player);
    } else if (pref === 1) ratings.like++;
    else if (pref === 0) ratings.meh++;
    else if (pref === -1) ratings.pass++;
    
    // Track position preferences
    if (pref >= 1 && positionPrefs[player.position]) {
      positionPrefs[player.position].push({
        ...player,
        rating: pref
      });
    }
    
    // Identify value picks (low auction value but user likes)
    if (pref >= 1 && player.auction <= 5) {
      valueMetrics.lowValue.push(player);
    }
    
    // Identify premium picks
    if (pref >= 1 && player.auction >= 20) {
      valueMetrics.highValue.push(player);
    }
  });
  
  // Calculate percentages
  const total = Object.values(ratings).reduce((a, b) => a + b, 0);
  const distribution = {
    love: total > 0 ? (ratings.love / total * 100).toFixed(1) : '0',
    like: total > 0 ? (ratings.like / total * 100).toFixed(1) : '0',
    meh: total > 0 ? (ratings.meh / total * 100).toFixed(1) : '0',
    pass: total > 0 ? (ratings.pass / total * 100).toFixed(1) : '0'
  };
  
  // Determine GM type
  let gmType = 'balancedBuilder';
  if (valueMetrics.lowValue.length > valueMetrics.highValue.length * 2) {
    gmType = 'valueHunter';
  } else if (valueMetrics.highValue.length > 10) {
    gmType = 'eliteChaser';
  } else if (parseFloat(distribution.love) > 15) {
    gmType = 'riskTaker';
  } else if (parseFloat(distribution.pass) > 60) {
    gmType = 'contrarian';
  }
  
  // Position preference analysis
  const elitePositionTargets = {};
  Object.entries(positionPrefs).forEach(([pos, players]) => {
    const elitePlayers = players
      .sort((a, b) => b.fantasyPts - a.fantasyPts)
      .slice(0, 5)
      .filter(p => p.rating === 2);
    if (elitePlayers.length > 0) {
      elitePositionTargets[pos] = elitePlayers.length;
    }
  });
  
  // Find sleepers (loved players with low projected points relative to position)
  const sleepers = valueMetrics.loved
    .filter(p => {
      const posAvg = relevantPlayers
        .filter(pl => pl.position === p.position)
        .reduce((sum, pl) => sum + pl.fantasyPts, 0) / relevantPlayers.filter(pl => pl.position === p.position).length;
      return p.fantasyPts < posAvg * 0.8;
    })
    .slice(0, 5);
  
  return {
    distribution,
    gmType,
    positionPrefs,
    valueMetrics,
    elitePositionTargets,
    sleepers,
    totalRated: total,
    ratings
  };
};

// Create tiers based on ratings
const createTiers = (players, prefs, position = null) => {
  const relevantPlayers = position 
    ? players.filter(p => p.position === position)
    : players;
  
  const ratedPlayers = relevantPlayers
    .filter(p => prefs[p.id] !== undefined && prefs[p.id] >= -1)
    .map(p => ({ ...p, rating: prefs[p.id] }))
    .sort((a, b) => {
      // Sort by rating first, then by fantasy points
      if (b.rating !== a.rating) return b.rating - a.rating;
      return b.fantasyPts - a.fantasyPts;
    });
  
  const tiers = {
    love: ratedPlayers.filter(p => p.rating === 2),
    like: ratedPlayers.filter(p => p.rating === 1),
    neutral: ratedPlayers.filter(p => p.rating === 0),
    pass: ratedPlayers.filter(p => p.rating === -1)
  };
  
  return { tiers, allRated: ratedPlayers };
};

export default function PositionSummary({ position, onContinue, onRestart }) {
  const [analysis, setAnalysis] = useState(null);
  const [tierData, setTierData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('overview');
  
  useEffect(() => {
    const loadAndAnalyze = async () => {
      try {
        // Load players data
        const response = await fetch('/players.json');
        const rawPlayers = await response.json();
        const players = rawPlayers.map(normalizePlayer);
        
        // Load preferences
        const prefs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        
        // Perform analysis
        const analysisResult = analyzeUserTendencies(players, prefs, position);
        const tiersResult = createTiers(players, prefs, position);
        
        setAnalysis(analysisResult);
        setTierData(tiersResult);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    
    loadAndAnalyze();
  }, [position]);
  
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingText}>Analyzing your preferences...</div>
      </div>
    );
  }
  
  if (!analysis || !tierData) {
    return (
      <div style={styles.container}>
        <div style={styles.errorText}>No data available</div>
      </div>
    );
  }
  
  const personality = GM_TYPES[analysis.gmType];
  
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <h1 style={styles.title}>
          {position ? `${POSITION_CONFIG[position]?.name} Analysis` : 'Overall Analysis'}
        </h1>
        
        {/* Tab Navigation */}
        <div style={styles.tabContainer}>
          {['overview', 'tiers', 'insights'].map(view => (
            <button
              key={view}
              style={{
                ...styles.tab,
                ...(selectedView === view ? styles.activeTab : {})
              }}
              onClick={() => setSelectedView(view)}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Overview Tab */}
        {selectedView === 'overview' && (
          <div style={styles.viewContainer}>
            {/* GM Personality Card */}
            <div style={{...styles.card, ...styles.personalityCard}}>
              <div style={styles.personalityIcon}>{personality.icon}</div>
              <h2 style={styles.personalityTitle}>{personality.name}</h2>
              <p style={styles.personalityDesc}>{personality.description}</p>
            </div>
            
            {/* Rating Distribution */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Your Rating Breakdown</h3>
              <div style={styles.ratingGrid}>
                {[
                  { label: 'Love', value: analysis.ratings.love, emoji: '❤️', color: '#EC4899' },
                  { label: 'Like', value: analysis.ratings.like, emoji: '👍', color: '#22C55E' },
                  { label: 'Meh', value: analysis.ratings.meh, emoji: '😐', color: '#F59E0B' },
                  { label: 'Pass', value: analysis.ratings.pass, emoji: '👎', color: '#EF4444' }
                ].map(item => (
                  <div key={item.label} style={styles.ratingItem}>
                    <div style={styles.ratingEmoji}>{item.emoji}</div>
                    <div style={styles.ratingValue}>{item.value}</div>
                    <div style={styles.ratingLabel}>{item.label}</div>
                    <div style={{...styles.ratingBar, backgroundColor: item.color}} />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Quick Stats */}
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{analysis.distribution.love}%</div>
                <div style={styles.statLabel}>Love Rate</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{tierData.tiers.love.length}</div>
                <div style={styles.statLabel}>Must Haves</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{analysis.valueMetrics.lowValue.length}</div>
                <div style={styles.statLabel}>Value Picks</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Tiers Tab */}
        {selectedView === 'tiers' && (
          <div style={styles.viewContainer}>
            {/* Love Tier */}
            <div style={{...styles.card, borderLeft: '4px solid #EC4899'}}>
              <h3 style={styles.tierTitle}>❤️ Love Tier ({tierData.tiers.love.length})</h3>
              <div style={styles.playerList}>
                {tierData.tiers.love.slice(0, 10).map(player => (
                  <div key={player.id} style={styles.playerRow}>
                    <div style={styles.playerInfo}>
                      <span style={styles.playerName}>{player.name}</span>
                      <span style={styles.playerMeta}>
                        {player.team} • {player.fantasyPts.toFixed(1)} pts
                      </span>
                    </div>
                    <div style={styles.playerValue}>${player.auction}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Like Tier */}
            <div style={{...styles.card, borderLeft: '4px solid #22C55E'}}>
              <h3 style={styles.tierTitle}>👍 Like Tier ({tierData.tiers.like.length})</h3>
              <div style={styles.playerList}>
                {tierData.tiers.like.slice(0, 8).map(player => (
                  <div key={player.id} style={styles.playerRow}>
                    <div style={styles.playerInfo}>
                      <span style={styles.playerName}>{player.name}</span>
                      <span style={styles.playerMeta}>
                        {player.team} • {player.fantasyPts.toFixed(1)} pts
                      </span>
                    </div>
                    <div style={styles.playerValue}>${player.auction}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Insights Tab */}
        {selectedView === 'insights' && (
          <div style={styles.viewContainer}>
            {/* Value Picks */}
            {analysis.valueMetrics.lowValue.length > 0 && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>💎 Your Value Targets</h3>
                <p style={styles.insightText}>
                  Players you like that others might overlook:
                </p>
                <div style={styles.valueGrid}>
                  {analysis.valueMetrics.lowValue.slice(0, 6).map(player => (
                    <div key={player.id} style={styles.valueCard}>
                      <div style={styles.valueName}>{player.name}</div>
                      <div style={styles.valueMeta}>
                        ${player.auction} • {player.fantasyPts.toFixed(0)} pts
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Draft Strategy */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>📋 Your Draft Tendencies</h3>
              <div style={styles.tendencyList}>
                {analysis.elitePositionTargets.RB >= 3 && (
                  <div style={styles.tendency}>
                    • You favor elite running backs early
                  </div>
                )}
                {analysis.elitePositionTargets.WR >= 3 && (
                  <div style={styles.tendency}>
                    • You're building around elite receivers
                  </div>
                )}
                {analysis.valueMetrics.lowValue.length > 10 && (
                  <div style={styles.tendency}>
                    • You excel at finding late-round value
                  </div>
                )}
                {parseFloat(analysis.distribution.love) < 10 && (
                  <div style={styles.tendency}>
                    • You're highly selective with your targets
                  </div>
                )}
              </div>
            </div>
            
            {/* Sleepers */}
            {analysis.sleepers.length > 0 && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>🎯 Your Sleeper Picks</h3>
                <p style={styles.insightText}>
                  Lower-projected players you believe in:
                </p>
                <div style={styles.sleeperList}>
                  {analysis.sleepers.map(player => (
                    <div key={player.id} style={styles.sleeperItem}>
                      {player.name} ({player.position})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Action Buttons */}
        <div style={styles.actions}>
          <button onClick={onContinue} style={styles.primaryButton}>
            View other positions
          </button>
          <button onClick={onRestart} style={styles.secondaryButton}>
            Restart This Position
          </button>
        </div>
        
        {/* Shareable Summary */}
        <div style={{...styles.card, ...styles.shareCard}}>
          <h3 style={styles.shareTitle}>Share Your Results!</h3>
          <div style={styles.shareContent}>
            <div style={styles.shareIcon}>{personality.icon}</div>
            <div style={styles.shareText}>
              I'm a {personality.name} in fantasy football!
              <br />
              {position 
                ? `Evaluated ${analysis.totalRated} ${POSITION_CONFIG[position]?.name}`
                : `Evaluated ${analysis.totalRated} players`}
            </div>
            <div style={styles.shareStats}>
              <span>❤️ {analysis.ratings.love}</span>
              <span>👍 {analysis.ratings.like}</span>
              <span>💎 {analysis.valueMetrics.lowValue.length} values</span>
            </div>
          </div>
          <button style={styles.shareButton}>
            📱 Share to Social
          </button>
        </div>
      </div>
    </div>
  );
}

// Styles
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
    padding: '1rem',
    color: 'white'
  },
  
  content: {
    maxWidth: '800px',
    margin: '0 auto'
  },
  
  loadingText: {
    textAlign: 'center',
    fontSize: '1.5rem',
    marginTop: '10rem'
  },
  
  errorText: {
    textAlign: 'center',
    fontSize: '1.2rem',
    marginTop: '10rem',
    color: '#ef4444'
  },
  
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '2rem'
  },
  
  tabContainer: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '2rem',
    justifyContent: 'center'
  },
  
  tab: {
    padding: '0.75rem 1.5rem',
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '0.5rem',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  
  activeTab: {
    background: 'white',
    color: '#0f0f23'
  },
  
  viewContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  
  card: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '1rem',
    padding: '1.5rem',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  
  personalityCard: {
    textAlign: 'center',
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)'
  },
  
  personalityIcon: {
    fontSize: '4rem',
    marginBottom: '1rem'
  },
  
  personalityTitle: {
    fontSize: '1.75rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem'
  },
  
  personalityDesc: {
    color: '#d1d5db',
    fontSize: '1.1rem'
  },
  
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    marginBottom: '1rem'
  },
  
  ratingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1rem'
  },
  
  ratingItem: {
    textAlign: 'center',
    position: 'relative'
  },
  
  ratingEmoji: {
    fontSize: '2rem',
    marginBottom: '0.5rem'
  },
  
  ratingValue: {
    fontSize: '1.5rem',
    fontWeight: 'bold'
  },
  
  ratingLabel: {
    fontSize: '0.875rem',
    color: '#9ca3af',
    marginBottom: '0.5rem'
  },
  
  ratingBar: {
    height: '4px',
    borderRadius: '2px',
    width: '100%'
  },
  
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem'
  },
  
  statCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '0.75rem',
    padding: '1rem',
    textAlign: 'center'
  },
  
  statValue: {
    fontSize: '1.75rem',
    fontWeight: 'bold',
    color: '#3b82f6'
  },
  
  statLabel: {
    fontSize: '0.875rem',
    color: '#9ca3af'
  },
  
  tierTitle: {
    fontSize: '1.125rem',
    fontWeight: 'bold',
    marginBottom: '1rem'
  },
  
  playerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  
  playerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '0.5rem'
  },
  
  playerInfo: {
    display: 'flex',
    flexDirection: 'column'
  },
  
  playerName: {
    fontWeight: '600'
  },
  
  playerMeta: {
    fontSize: '0.875rem',
    color: '#9ca3af'
  },
  
  playerValue: {
    fontWeight: 'bold',
    color: '#10b981'
  },
  
  insightText: {
    color: '#d1d5db',
    marginBottom: '1rem'
  },
  
  valueGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.75rem'
  },
  
  valueCard: {
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '0.5rem',
    padding: '0.75rem'
  },
  
  valueName: {
    fontWeight: '600',
    fontSize: '0.875rem'
  },
  
  valueMeta: {
    fontSize: '0.75rem',
    color: '#10b981'
  },
  
  tendencyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  
  tendency: {
    color: '#d1d5db',
    fontSize: '1rem'
  },
  
  sleeperList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem'
  },
  
  sleeperItem: {
    background: 'rgba(139, 92, 246, 0.2)',
    border: '1px solid rgba(139, 92, 246, 0.4)',
    borderRadius: '2rem',
    padding: '0.5rem 1rem',
    fontSize: '0.875rem'
  },
  
  actions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '2rem',
    marginBottom: '2rem'
  },
  
  primaryButton: {
    flex: 1,
    padding: '1rem',
    background: 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
    border: 'none',
    borderRadius: '0.75rem',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '1rem',
    cursor: 'pointer'
  },
  
  secondaryButton: {
    flex: 1,
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '0.75rem',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '1rem',
    cursor: 'pointer'
  },
  
  shareCard: {
    background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
    textAlign: 'center'
  },
  
  shareTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    marginBottom: '1rem'
  },
  
  shareContent: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    marginBottom: '1rem'
  },
  
  shareIcon: {
    fontSize: '3rem',
    marginBottom: '0.5rem'
  },
  
  shareText: {
    fontSize: '1rem',
    marginBottom: '1rem'
  },
  
  shareStats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    fontSize: '0.875rem'
  },
  
  shareButton: {
    padding: '0.75rem 2rem',
    background: 'white',
    color: '#0f0f23',
    border: 'none',
    borderRadius: '0.5rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};