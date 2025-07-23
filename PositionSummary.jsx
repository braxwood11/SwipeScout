// src/components/PositionSummary.jsx
import React, { useState, useEffect } from 'react';
import { normalizePlayer } from '../utils/normalizePlayer';
import { generateNarrativeInsights, prioritizeNarratives } from '../utils/narrativeGenerator';
import { analyzePlayerSynergies } from '../utils/synergyAnalyzer';
import { getPositionGMType } from '../utils/positionGMTypes';
import { getOverallGMType } from '../utils/overallGMTypes';
import BackButton from '../components/BackButton';

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

// Enhanced analysis function
const analyzeUserTendencies = (players, prefs, position = null) => {
  const ratings = { love: 0, like: 0, meh: 0, pass: 0 };
  const positionPrefs = { QB: [], RB: [], WR: [], TE: [] };
  const valueMetrics = { highValue: [], lowValue: [], loved: [] };
  const elitePositionTargets = { QB: 0, RB: 0, WR: 0, TE: 0 };
  
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
      
      // Count elite targets (top 50 players loved/liked)
      if (player.fantasyPts > 150) {
        elitePositionTargets[player.position]++;
      }
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
  
  // Determine GM type based on patterns
  let gmType = 'balancedBuilder';
  let gmTypeDetails = null;
  const base = { distribution, ratings, valueMetrics };
  
  if (position) {
    // Use position-specific GM types
    gmTypeDetails = getPositionGMType(
     position,
     { ...base, gmType },
     relevantPlayers,
     prefs
   );
    gmType = gmTypeDetails.key;
  } else {
    // Use new overall GM type system with multi-signal detection
  gmTypeDetails = getOverallGMType(
     { ...base, gmType },
     players,       // all players
     prefs
   );
  gmType = gmTypeDetails.key;
 }
  
  // Find sleepers (loved players with low projections)
  const avgFantasyPts = relevantPlayers.reduce((sum, p) => sum + p.fantasyPts, 0) / relevantPlayers.length;
  const sleepers = valueMetrics.loved.filter(p => p.fantasyPts < avgFantasyPts * 0.8);
  
  return {
    ratings,
    distribution,
    gmType,
    gmTypeDetails, // Include full GM type details
    positionPrefs,
    valueMetrics,
    elitePositionTargets,
    sleepers,
    totalEvaluated: total
  };
};

// Create tier groupings
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

// Component for displaying narrative insights
const NarrativeCard = ({ narrative, isExpanded, onToggle }) => {
  return (
    <div 
      style={{
        ...styles.narrativeCard,
        ...(narrative.priority === 'high' ? styles.highPriorityCard : {})
      }}
      onClick={onToggle}
    >
      <div style={styles.narrativeHeader}>
        <span style={styles.narrativeIcon}>{narrative.icon}</span>
        <h3 style={styles.narrativeTitle}>{narrative.title}</h3>
        <span style={styles.expandIcon}>{isExpanded ? '−' : '+'}</span>
      </div>
      
      <p style={styles.narrativeSummary}>{narrative.summary}</p>
      
      {isExpanded && (
        <div style={styles.narrativeExpanded}>
          <p style={styles.narrativeFullText}>{narrative.fullText}</p>
          
          {narrative.actionable && narrative.actionable.length > 0 && (
            <div style={styles.actionableSection}>
              <h4 style={styles.actionableTitle}>Action Items:</h4>
              <ul style={styles.actionableList}>
                {narrative.actionable.map((action, idx) => (
                  <li key={idx} style={styles.actionableItem}>{action}</li>
                ))}
              </ul>
            </div>
          )}
          
          {narrative.relatedPlayers && narrative.relatedPlayers.length > 0 && (
            <div style={styles.relatedPlayersSection}>
              <h4 style={styles.relatedTitle}>Related Players:</h4>
              <div style={styles.relatedPlayersGrid}>
                {narrative.relatedPlayers.map(player => (
                  <div key={player.id} style={styles.relatedPlayer}>
                    <span style={styles.relatedPlayerName}>{player.name}</span>
                    <span style={styles.relatedPlayerInfo}>
                      {player.team} • {player.fantasyPts.toFixed(0)} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Component for displaying synergies
const SynergyCard = ({ synergy, type }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getIcon = () => {
    switch(type) {
      case 'stack': return '🔗';
      case 'team': return '🏟️';
      case 'handcuff': return '🔒';
      case 'bye': return '📅';
      default: return '✨';
    }
  };
  
  return (
    <div style={styles.synergyCard} onClick={() => setIsExpanded(!isExpanded)}>
      <div style={styles.synergyHeader}>
        <span style={styles.synergyIcon}>{getIcon()}</span>
        <h4 style={styles.synergyTitle}>{synergy.title || synergy.narrative}</h4>
      </div>
      
      {isExpanded && (
        <div style={styles.synergyDetails}>
          {synergy.players && (
            <div style={styles.synergyPlayers}>
              {synergy.players.map(p => (
                <span key={p.id} style={styles.synergyPlayer}>
                  {p.name} ({p.position})
                </span>
              ))}
            </div>
          )}
          {synergy.recommendation && (
            <p style={styles.synergyRecommendation}>{synergy.recommendation}</p>
          )}
        </div>
      )}
    </div>
  );
};

// Component for displaying player tiers with expand/collapse
const TierCard = ({ title, players, borderColor, showAll = false, initialShow = 10 }) => {
  const [isExpanded, setIsExpanded] = useState(showAll);
  const displayPlayers = isExpanded ? players : players.slice(0, initialShow);
  const hasMore = players.length > initialShow;
  
  return (
    <div style={{...styles.card, borderLeft: `4px solid ${borderColor}`}}>
      <div style={styles.tierHeader}>
        <h3 style={styles.tierTitle}>{title} ({players.length})</h3>
        {hasMore && !showAll && (
          <button 
            style={styles.expandButton}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Show Less' : `Show All ${players.length}`}
          </button>
        )}
      </div>
      <div style={styles.playerList}>
        {displayPlayers.map(player => (
          <div key={player.id} style={styles.playerRow}>
            <div style={styles.playerInfo}>
              <span style={styles.playerName}>{player.name}</span>
              <span style={styles.playerMeta}>
                {player.team} • {player.fantasyPts.toFixed(1)} pts • ${player.auction}
              </span>
            </div>
            {player.rookie && <span style={styles.rookieBadge}>R</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function PositionSummary({ position, onClose, onContinue, onRestart, allPositionsComplete = false, onViewDraftPlan, onStartOver }) {
  const [analysis, setAnalysis] = useState(null);
  const [tierData, setTierData] = useState(null);
  const [narratives, setNarratives] = useState([]);
  const [synergies, setSynergies] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('insights');
  const [expandedNarratives, setExpandedNarratives] = useState(new Set());
  
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
        
        // Generate narratives
        const narrativeResults = generateNarrativeInsights(analysisResult, prefs, players, position);
        const prioritizedNarratives = prioritizeNarratives(narrativeResults, 6);
        
        // Analyze synergies (only for overall view)
        let synergyResults = null;
        if (!position) {
          synergyResults = analyzePlayerSynergies(prefs, players);
        }
        
        setAnalysis(analysisResult);
        setTierData(tiersResult);
        setNarratives(prioritizedNarratives);
        setSynergies(synergyResults);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    
    loadAndAnalyze();
  }, [position]);
  
  const toggleNarrative = (index) => {
    const newExpanded = new Set(expandedNarratives);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedNarratives(newExpanded);
  };
  
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
  
 const personality = analysis.gmTypeDetails || {
 
  name: 'The Balanced Builder',
  icon: '⚖️',
  description: 'You maintain a measured approach',
  color: '#3B82F6'
 };
  
  return (
    <div style={styles.container}>
    
      <div style={styles.content}>
        {/* Header */}
        {position && (
        <button onClick={onContinue} style={styles.secondaryButton}>
        ← Back
            </button>
        )}
        <h1 style={styles.title}>
        
          {position ? `${POSITION_CONFIG[position]?.name} Analysis` : 'Overall Analysis'}
        </h1>
        
        {/* GM Personality Card */}
        <div style={{...styles.card, ...styles.personalityCard, borderColor: personality.color}}>
          <div style={styles.personalityIcon}>{personality.icon}</div>
          <h2 style={styles.personalityTitle}>{personality.name}</h2>
          <p style={styles.personalityDesc}>{personality.description}</p>
          {position && (
            <p style={styles.personalityPosition}>
              Your {POSITION_CONFIG[position].name} Personality
            </p>
          )}
        </div>
        
        {/* Tab Navigation */}
        <div style={styles.tabContainer}>
          {['insights', 'tiers', 'synergies'].map(view => (
            <button
              key={view}
              style={{
                ...styles.tab,
                ...(selectedView === view ? styles.activeTab : {}),
                ...(view === 'synergies' && position ? styles.disabledTab : {})
              }}
              onClick={() => {
                if (!(view === 'synergies' && position)) {
                  setSelectedView(view);
                }
              }}
              disabled={view === 'synergies' && position}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Insights Tab - Now with Narratives */}
        {selectedView === 'insights' && (
          <div style={styles.viewContainer}>
            {/* Narrative Cards */}
            <div style={styles.narrativesSection}>
              {narratives.map((narrative, idx) => (
                <NarrativeCard
                  key={idx}
                  narrative={narrative}
                  isExpanded={expandedNarratives.has(idx)}
                  onToggle={() => toggleNarrative(idx)}
                />
              ))}
            </div>
            
            {/* Quick Stats Grid */}
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
                <div style={styles.statValue}>{analysis.sleepers.length}</div>
                <div style={styles.statLabel}>Sleepers</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Tiers Tab */}
        {selectedView === 'tiers' && (
          <div style={styles.viewContainer}>
            {/* Love Tier */}
            {tierData.tiers.love.length > 0 && (
              <TierCard 
                title="❤️ Love Tier"
                players={tierData.tiers.love}
                borderColor="#EC4899"
                showAll={true}
              />
            )}
            
            {/* Like Tier */}
            {tierData.tiers.like.length > 0 && (
              <TierCard 
                title="👍 Like Tier"
                players={tierData.tiers.like}
                borderColor="#22C55E"
                showAll={false}
                initialShow={12}
              />
            )}
            
            {/* Neutral/Meh Tier - only show if it has players */}
            {tierData.tiers.neutral.length > 0 && (
              <TierCard 
                title="😐 Meh Tier"
                players={tierData.tiers.neutral}
                borderColor="#F59E0B"
                showAll={false}
                initialShow={8}
              />
            )}
            
            {/* Pass Tier (Avoid List) - only show notable fades */}
            {(() => {
              // Get position-specific "notable" threshold
              const notableThreshold = position ? {
                'QB': 200,  // Top 20-25 QBs
                'RB': 150,  // Top 40-50 RBs
                'WR': 140,  // Top 50-60 WRs
                'TE': 100   // Top 20 TEs
              }[position] : 150;
              
              const notableFades = tierData.tiers.pass.filter(p => p.fantasyPts > notableThreshold);
              
              if (notableFades.length > 0) {
                return (
                  <div style={{...styles.card, borderLeft: '4px solid #EF4444'}}>
                    <h3 style={styles.tierTitle}>🚫 Notable Fades</h3>
                    <p style={styles.avoidDescription}>
                      High-projected {position || 'players'} you're avoiding:
                    </p>
                    <div style={styles.avoidGrid}>
                      {notableFades
                        .slice(0, 12)
                        .map(player => (
                          <div key={player.id} style={styles.avoidPlayer}>
                            {player.name} ({player.team})
                          </div>
                        ))}
                    </div>
                    {notableFades.length > 12 && (
                      <p style={styles.moreText}>
                        ...and {notableFades.length - 12} more
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}
        
        {/* Synergies Tab (Overall only) */}
        {selectedView === 'synergies' && !position && synergies && (
          <div style={styles.viewContainer}>
            {/* QB Stacks */}
            {synergies.stacks.length > 0 && (
              <div style={styles.card}>
                <h3 style={styles.synergyTypeTitle}>🔗 QB Stack Opportunities</h3>
                {synergies.stacks.slice(0, 3).map((stack, idx) => (
                  <SynergyCard key={idx} synergy={stack} type="stack" />
                ))}
              </div>
            )}
            
            {/* Team Concentrations */}
            {synergies.teamStacks.length > 0 && (
              <div style={styles.card}>
                <h3 style={styles.synergyTypeTitle}>🏟️ Team Concentrations</h3>
                {synergies.teamStacks.slice(0, 3).map((stack, idx) => (
                  <SynergyCard key={idx} synergy={stack} type="team" />
                ))}
              </div>
            )}
            
            {/* Handcuff Analysis */}
            {synergies.handcuffs.length > 0 && (
              <div style={styles.card}>
                <h3 style={styles.synergyTypeTitle}>🔒 Handcuff Strategy</h3>
                {synergies.handcuffs.slice(0, 4).map((handcuff, idx) => (
                  <SynergyCard key={idx} synergy={handcuff} type="handcuff" />
                ))}
              </div>
            )}
            
            {/* Bye Week Analysis */}
            {synergies.byeWeekClusters.risk !== 'low' && (
              <div style={styles.card}>
                <h3 style={styles.synergyTypeTitle}>📅 Bye Week Analysis</h3>
                <SynergyCard synergy={synergies.byeWeekClusters} type="bye" />
              </div>
            )}
          </div>
        )}
        
       {/* Action Buttons - simplified since main actions are in hero */}
        {!allPositionsComplete && (
          <div style={styles.actions}>
            <button onClick={onContinue} style={styles.primaryButton}>
              View other positions
            </button>
            <button onClick={onRestart} style={styles.secondaryButton}>
              Restart This Position
            </button>
          </div>
        )}
        </div>
      </div>
  );
}

// Enhanced styles
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
    padding: '2rem 1rem',
    color: 'white'
  },
  
  content: {
    maxWidth: '1000px',
    margin: '0 auto'
  },
  
  loadingText: {
    textAlign: 'center',
    fontSize: '1.5rem',
    color: '#d1d5db',
    paddingTop: '4rem'
  },
  
  errorText: {
    textAlign: 'center',
    fontSize: '1.5rem',
    color: '#ef4444',
    paddingTop: '4rem'
  },
  
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '2rem'
  },
  
  card: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '1rem',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  
  personalityCard: {
    textAlign: 'center',
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
    borderWidth: '2px',
    borderStyle: 'solid'
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
  
  personalityPosition: {
    marginTop: '0.75rem',
    fontSize: '0.875rem',
    color: '#9ca3af',
    fontStyle: 'italic'
  },
  
  tabContainer: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    justifyContent: 'center'
  },
  
  tab: {
    padding: '0.75rem 2rem',
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '0.5rem',
    color: 'white',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  
  activeTab: {
    background: 'rgba(255, 255, 255, 0.2)',
    transform: 'translateY(-2px)'
  },
  
  disabledTab: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  
  viewContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  
  // Narrative styles
  narrativesSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  
  narrativeCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '0.75rem',
    padding: '1.25rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  
  highPriorityCard: {
    borderColor: 'rgba(236, 72, 153, 0.3)',
    background: 'rgba(236, 72, 153, 0.05)'
  },
  
  narrativeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.5rem'
  },
  
  narrativeIcon: {
    fontSize: '1.5rem'
  },
  
  narrativeTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    flex: 1,
    margin: 0
  },
  
  expandIcon: {
    fontSize: '1.25rem',
    color: '#9ca3af'
  },
  
  narrativeSummary: {
    color: '#d1d5db',
    marginBottom: '0.5rem'
  },
  
  narrativeExpanded: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
  },
  
  narrativeFullText: {
    color: '#e5e7eb',
    lineHeight: '1.6',
    marginBottom: '1rem'
  },
  
  actionableSection: {
    background: 'rgba(59, 130, 246, 0.1)',
    borderRadius: '0.5rem',
    padding: '1rem',
    marginTop: '1rem'
  },
  
  actionableTitle: {
    fontSize: '1rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    color: '#60a5fa'
  },
  
  actionableList: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  },
  
  actionableItem: {
    padding: '0.25rem 0',
    paddingLeft: '1.5rem',
    position: 'relative',
    color: '#e5e7eb'
  },
  
  relatedPlayersSection: {
    marginTop: '1rem'
  },
  
  relatedTitle: {
    fontSize: '1rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem'
  },
  
  relatedPlayersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '0.5rem'
  },
  
  relatedPlayer: {
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '0.5rem',
    borderRadius: '0.25rem',
    fontSize: '0.875rem'
  },
  
  relatedPlayerName: {
    fontWeight: 'bold',
    display: 'block'
  },
  
  relatedPlayerInfo: {
    color: '#9ca3af',
    fontSize: '0.75rem'
  },
  
  // Synergy styles
  synergyTypeTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    marginBottom: '1rem'
  },
  
  synergyCard: {
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '0.5rem',
    padding: '1rem',
    marginBottom: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  
  synergyHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  
  synergyIcon: {
    fontSize: '1.25rem'
  },
  
  synergyTitle: {
    fontSize: '1rem',
    fontWeight: '500',
    margin: 0
  },
  
  synergyDetails: {
    marginTop: '0.75rem',
    paddingTop: '0.75rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)'
  },
  
  synergyPlayers: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginBottom: '0.5rem'
  },
  
  synergyPlayer: {
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    fontSize: '0.875rem'
  },
  
  synergyRecommendation: {
    color: '#e5e7eb',
    fontSize: '0.875rem',
    fontStyle: 'italic'
  },
  
  // Stats grid styles
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
    marginBottom: '0.25rem'
  },
  
  statLabel: {
    color: '#9ca3af',
    fontSize: '0.875rem'
  },
  
  // Tier styles
  tierHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  
  tierTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    margin: 0
  },
  
  expandButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '0.375rem',
    padding: '0.375rem 0.75rem',
    color: 'white',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
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
    padding: '0.5rem',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '0.25rem'
  },
  
  playerInfo: {
    flex: 1
  },
  
  playerName: {
    fontWeight: 'bold',
    display: 'block'
  },
  
  playerMeta: {
    color: '#9ca3af',
    fontSize: '0.875rem'
  },
  
  rookieBadge: {
    background: '#f59e0b',
    color: 'black',
    padding: '0.125rem 0.375rem',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    fontWeight: 'bold'
  },
  
  avoidDescription: {
    color: '#d1d5db',
    marginBottom: '1rem'
  },
  
  avoidGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.5rem'
  },
  
  avoidPlayer: {
    background: 'rgba(239, 68, 68, 0.1)',
    padding: '0.5rem',
    borderRadius: '0.25rem',
    fontSize: '0.875rem'
  },
  
  moreText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '0.875rem',
    marginTop: '0.5rem',
    fontStyle: 'italic'
  },
  
  // Action buttons
  actions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginTop: '2rem'
  },
  
  primaryButton: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    color: 'white',
    border: 'none',
    padding: '0.75rem 2rem',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.2s ease'
  },
  
  secondaryButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    padding: '0.75rem 2rem',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
};