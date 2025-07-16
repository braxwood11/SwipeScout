// src/pages/Plan.jsx
import React, { useEffect, useState } from 'react';
import { normalizePlayer } from '../utils/normalizePlayer';
import { buildVORPTiers, analyzeTierTransitions, generateAuctionStrategy } from '../utils/vorpTierBuilder';

/* quick rank stamping ------------------------------------------------ */
function stampRanks(list) {
  const byPos = {};
  list.forEach(p => { (byPos[p.position] ??= []).push(p); });
  Object.values(byPos).forEach(arr =>
    arr.sort((a,b) => b.fantasyPts - a.fantasyPts)
       .forEach((p,i) => { p.positionRank = i + 1; })
  );
  [...list].sort((a,b) => b.fantasyPts - a.fantasyPts)
           .forEach((p,i) => { p.overallRank  = i + 1; });
}

export default function Plan() {
  const [loading, setLoading] = useState(true);
  const [draftData, setDraftData] = useState(null);
  const [viewMode, setViewMode] = useState('snake'); // 'snake' or 'auction'
  const [selectedPosition, setSelectedPosition] = useState('overview');
  
  useEffect(() => {
    const loadDraftPlan = async () => {
      try {
        const response = await fetch('/players.json');
        const rawPlayers = await response.json();
        const players = rawPlayers.map(normalizePlayer);
        stampRanks(players);
        
        const prefs = JSON.parse(localStorage.getItem('draftswipe_prefs_v3_4direction') || '{}');
        
        // Build VORP-based tiers
        const tiers = buildVORPTiers(players, prefs);
        const analysis = analyzeTierTransitions(tiers, prefs);
        const auctionStrategy = generateAuctionStrategy(tiers);
        
        setDraftData({
          tiers,
          analysis,
          auctionStrategy,
          totalPlayers: players.length,
          evaluatedPlayers: Object.keys(prefs).length
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading draft plan:', error);
        setLoading(false);
      }
    };
    
    loadDraftPlan();
  }, []);
  
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingScreen}>
          <h2 style={styles.loadingText}>Building your championship blueprint...</h2>
        </div>
      </div>
    );
  }
  
  if (!draftData) {
    return (
      <div style={styles.container}>
        <div style={styles.errorScreen}>
          <h2>Unable to load draft plan</h2>
          <p>Please complete player evaluations first.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>Your Championship Draft Plan</h1>
        <p style={styles.subtitle}>
          Based on {draftData.evaluatedPlayers} player evaluations
        </p>
        
        {/* View Mode Toggle */}
        <div style={styles.viewToggle}>
          <button
            style={{
              ...styles.toggleButton,
              ...(viewMode === 'snake' ? styles.activeToggle : {})
            }}
            onClick={() => setViewMode('snake')}
          >
            🐍 Snake Draft
          </button>
          <button
            style={{
              ...styles.toggleButton,
              ...(viewMode === 'auction' ? styles.activeToggle : {})
            }}
            onClick={() => setViewMode('auction')}
          >
            💰 Auction
          </button>
        </div>
      </header>
      
      {/* Position Navigation */}
      <nav style={styles.positionNav}>
        <button
          style={{
            ...styles.navButton,
            ...(selectedPosition === 'overview' ? styles.activeNav : {})
          }}
          onClick={() => setSelectedPosition('overview')}
        >
          📊 Overview
        </button>
        {['QB', 'RB', 'WR', 'TE'].map(pos => (
          <button
            key={pos}
            style={{
              ...styles.navButton,
              ...(selectedPosition === pos ? styles.activeNav : {})
            }}
            onClick={() => setSelectedPosition(pos)}
          >
            {pos}
          </button>
        ))}
      </nav>
      
      {/* Main Content */}
      <main style={styles.mainContent}>
        {selectedPosition === 'overview' ? (
          <OverviewSection 
            analysis={draftData.analysis} 
            tiers={draftData.tiers}
            viewMode={viewMode}
            auctionStrategy={draftData.auctionStrategy}
          />
        ) : (
          <PositionSection 
            position={selectedPosition}
            tiers={draftData.tiers[selectedPosition]}
            viewMode={viewMode}
          />
        )}
      </main>
    </div>
  );
}

// Overview Section Component
function OverviewSection({ analysis, tiers, viewMode, auctionStrategy }) {
  return (
    <div style={styles.overviewContainer}>
      {/* Critical Decisions Alert */}
      {analysis.criticalDecisions.length > 0 && (
        <div style={styles.alertSection}>
          <h2 style={styles.alertTitle}>⚠️ Critical Draft Decisions</h2>
          {analysis.criticalDecisions
            .filter(d => d.urgency === 'CRITICAL')
            .map((decision, idx) => (
              <div key={idx} style={styles.criticalAlert}>
                <div style={styles.alertHeader}>
                  <span style={styles.alertPosition}>{decision.position}</span>
                  <span style={styles.alertUrgency}>{decision.urgency}</span>
                </div>
                <p style={styles.alertMessage}>{decision.message}</p>
                <div style={styles.alertPlayers}>
                  {decision.players.map(p => (
                    <span key={p.id} style={styles.playerChip}>
                      {p.name} ({p.team})
                    </span>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
      
      {/* Position Priority */}
      <div style={styles.prioritySection}>
        <h2 style={styles.sectionTitle}>Position Priority Based on Your Targets</h2>
        <div style={styles.priorityGrid}>
          {analysis.positionPriority.map(pos => (
            <div key={pos.position} style={styles.priorityCard}>
              <h3 style={styles.priorityPosition}>{pos.position}</h3>
              <div style={styles.priorityStats}>
                <div>
                  <span style={styles.statValue}>{pos.topTierCount}</span>
                  <span style={styles.statLabel}>Elite Targets</span>
                </div>
                <div>
                  <span style={styles.statValue}>{pos.totalLiked}</span>
                  <span style={styles.statLabel}>Total Liked</span>
                </div>
              </div>
              <div style={{
                ...styles.priorityIndicator,
                backgroundColor: pos.priority === 'HIGH_PRIORITY' ? '#ef4444' :
                               pos.priority === 'SKIP_EARLY' ? '#6b7280' : '#3b82f6'
              }}>
                {pos.priority.replace('_', ' ')}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {viewMode === 'snake' ? (
        <SnakeDraftFlow draftFlow={analysis.draftFlow} />
      ) : (
        <AuctionBudget strategy={auctionStrategy} />
      )}
    </div>
  );
}

// Snake Draft Flow Component
function SnakeDraftFlow({ draftFlow }) {
  return (
    <div style={styles.flowSection}>
      <h2 style={styles.sectionTitle}>Round-by-Round Strategy</h2>
      <div style={styles.roundsGrid}>
        {draftFlow.slice(0, 10).map(round => (
          <div key={round.round} style={styles.roundCard}>
            <h4 style={styles.roundNumber}>Round {round.round}</h4>
            {round.recommendations.length > 0 ? (
              round.recommendations.map((rec, idx) => (
                <div key={idx} style={styles.roundRec}>
                  <span style={styles.recPosition}>{rec.position}</span>
                  <span style={styles.recReason}>{rec.reason}</span>
                  <div style={styles.recTargets}>
                    {rec.targets.slice(0, 2).map(p => (
                      <span key={p.id} style={styles.miniChip}>
                        {p.name.split(' ').pop()}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p style={styles.noTargets}>Best available</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Auction Budget Component
function AuctionBudget({ strategy }) {
  const total = Object.values(strategy.budgetAllocation).reduce((a, b) => a + b, 0);
  
  return (
    <div style={styles.auctionSection}>
      <h2 style={styles.sectionTitle}>Optimal Budget Allocation ($200)</h2>
      <div style={styles.budgetGrid}>
        {Object.entries(strategy.budgetAllocation).map(([position, budget]) => (
          <div key={position} style={styles.budgetCard}>
            <h3 style={styles.budgetPosition}>{position}</h3>
            <div style={styles.budgetAmount}>${budget}</div>
            <div style={styles.budgetBar}>
              <div 
                style={{
                  ...styles.budgetFill,
                  width: `${(budget / 60) * 100}%` // Max $60 for scale
                }}
              />
            </div>
            <span style={styles.budgetPercent}>
              {Math.round((budget / 200) * 100)}%
            </span>
          </div>
        ))}
      </div>
      
      {/* Nomination Strategy */}
      <div style={styles.nominationSection}>
        <h3 style={styles.subsectionTitle}>Nomination Strategy</h3>
        <p style={styles.nominationDesc}>
          Nominate these players early to control the draft:
        </p>
        <div style={styles.nominationList}>
          {strategy.nominations.slice(0, 5).map((nom, idx) => (
            <div key={idx} style={styles.nominationItem}>
              <span style={styles.nomPlayer}>
                {nom.player.name} (${nom.player.auction})
              </span>
              <span style={styles.nomReason}>{nom.reason}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Position Section Component
function PositionSection({ position, tiers, viewMode }) {
  return (
    <div style={styles.positionContainer}>
      <h2 style={styles.positionTitle}>{position} Tier Breakdown</h2>
      
      {tiers.map((tier, index) => (
        <div key={index} style={styles.tierSection}>
          {/* Tier Header */}
          <div style={{
            ...styles.tierHeader,
            backgroundColor: tier.isChasm ? '#dc2626' : '#1e293b'
          }}>
            <div style={styles.tierInfo}>
              <h3 style={styles.tierName}>
                Tier {tier.tierNumber}: {tier.quality}
              </h3>
              <div style={styles.tierStats}>
                <span>VORP: {tier.stats.vorpRange.max.toFixed(1)} to {tier.stats.vorpRange.min.toFixed(1)}</span>
                <span>•</span>
                <span>{tier.players.length} players</span>
              </div>
            </div>
            {tier.isChasm && (
              <div style={styles.chasmWarning}>
                ⚠️ MAJOR DROPOFF
              </div>
            )}
          </div>
          
          {/* Tier Recommendation */}
          <div style={styles.tierRec}>
            <div style={{
              ...styles.recPriority,
              backgroundColor: tier.recommendation.priority === 'CRITICAL' ? '#dc2626' :
                             tier.recommendation.priority === 'HIGH' ? '#f59e0b' :
                             tier.recommendation.priority === 'MEDIUM' ? '#3b82f6' : '#6b7280'
            }}>
              {tier.recommendation.priority}
            </div>
            <p style={styles.recStrategy}>{tier.recommendation.strategy}</p>
            <p style={styles.recTiming}>
              {viewMode === 'snake' 
                ? tier.recommendation.timing 
                : `$${tier.priceRange.min}-${tier.priceRange.max} (avg: $${tier.priceRange.avg.toFixed(0)})`}
            </p>
          </div>
          
          {/* Your Targets in Tier */}
          {(tier.likedPlayers.length > 0 || tier.lovedPlayers.length > 0) && (
            <div style={styles.tierTargets}>
              <h4 style={styles.targetsTitle}>Your Targets:</h4>
              <div style={styles.playerGrid}>
                {tier.lovedPlayers.map(player => (
                  <PlayerCard key={player.id} player={player} isLoved={true} viewMode={viewMode} />
                ))}
                {tier.likedPlayers
                  .filter(p => !tier.lovedPlayers.includes(p))
                  .map(player => (
                    <PlayerCard key={player.id} player={player} isLoved={false} viewMode={viewMode} />
                  ))}
              </div>
            </div>
          )}
          
          {/* All Players Toggle */}
          <details style={styles.allPlayersToggle}>
            <summary style={styles.toggleSummary}>
              View all {tier.players.length} players in tier
            </summary>
            <div style={styles.allPlayersList}>
              {tier.players.map(player => (
                <div key={player.id} style={styles.compactPlayer}>
                  <span>{player.name}</span>
                  <span style={styles.compactStats}>
                    {player.team} • {player.fantasyPts.toFixed(0)} pts • VORP: {player.vorp.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </details>
          
          {/* VORP Dropoff Indicator */}
          {tier.vorpDropToNext > 0 && (
            <div style={styles.dropoffIndicator}>
              <span style={styles.dropoffArrow}>↓</span>
              <span style={styles.dropoffValue}>
                {tier.vorpDropToNext.toFixed(1)} VORP drop to next tier
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Player Card Component
function PlayerCard({ player, isLoved, viewMode }) {
  return (
    <div style={{
      ...styles.playerCard,
      borderColor: isLoved ? '#ec4899' : '#3b82f6'
    }}>
      <div style={styles.playerHeader}>
        <span style={styles.playerName}>{player.name} {player.rookie && <span style={{marginLeft:4,fontSize:'0.8em'}}>🎓</span>}</span>
        <span style={styles.loveIndicator}>{isLoved ? '❤️' : '👍'}</span>
      </div>
      <div style={styles.playerStats}>
        <span>{player.team}</span>
        <span>•</span>
        <span>{player.fantasyPts.toFixed(0)} pts</span>
        <span>•</span>
        <span>VORP: {player.vorp.toFixed(1)}</span>
      </div>
      <div style={styles.playerValue}>
        {viewMode === 'snake' 
          ? `ADP: ${player.adp || 'N/A'}`
          : `Value: $${player.auction}`}
      </div>
    </div>
  );
}

// Styles
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    color: '#f1f5f9',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  
  loadingScreen: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh'
  },
  
  loadingText: {
    fontSize: '1.5rem',
    color: '#64748b'
  },
  
  errorScreen: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    textAlign: 'center'
  },
  
  header: {
    padding: '2rem',
    textAlign: 'center',
    borderBottom: '1px solid #334155'
  },
  
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  
  subtitle: {
    fontSize: '1.125rem',
    color: '#94a3b8',
    marginBottom: '1.5rem'
  },
  
  viewToggle: {
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'center'
  },
  
  toggleButton: {
    padding: '0.75rem 1.5rem',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '0.5rem',
    color: '#94a3b8',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '1rem'
  },
  
  activeToggle: {
    background: '#3b82f6',
    color: 'white',
    borderColor: '#3b82f6'
  },
  
  positionNav: {
    display: 'flex',
    gap: '0.5rem',
    padding: '1rem 2rem',
    borderBottom: '1px solid #334155',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  
  navButton: {
    padding: '0.5rem 1.25rem',
    background: 'transparent',
    border: '1px solid #475569',
    borderRadius: '0.375rem',
    color: '#cbd5e1',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '0.95rem'
  },
  
  activeNav: {
    background: '#475569',
    borderColor: '#64748b',
    color: 'white'
  },
  
  mainContent: {
    padding: '2rem',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  
  // Overview Styles
  overviewContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  },
  
  alertSection: {
    background: '#7f1d1d',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    border: '1px solid #dc2626'
  },
  
  alertTitle: {
    fontSize: '1.5rem',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  
  criticalAlert: {
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '0.5rem',
    padding: '1rem',
    marginBottom: '1rem'
  },
  
  alertHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.5rem'
  },
  
  alertPosition: {
    fontWeight: 'bold',
    fontSize: '1.125rem'
  },
  
  alertUrgency: {
    background: '#dc2626',
    padding: '0.25rem 0.75rem',
    borderRadius: '0.25rem',
    fontSize: '0.875rem',
    fontWeight: 'bold'
  },
  
  alertMessage: {
    marginBottom: '0.75rem',
    lineHeight: '1.5'
  },
  
  alertPlayers: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap'
  },
  
  playerChip: {
    background: '#1e293b',
    padding: '0.375rem 0.75rem',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    border: '1px solid #334155'
  },
  
  prioritySection: {
    background: '#1e293b',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    border: '1px solid #334155'
  },
  
  sectionTitle: {
    fontSize: '1.5rem',
    marginBottom: '1.25rem',
    fontWeight: 'bold'
  },
  
  priorityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem'
  },
  
  priorityCard: {
    background: '#0f172a',
    borderRadius: '0.5rem',
    padding: '1.25rem',
    border: '1px solid #334155'
  },
  
  priorityPosition: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    marginBottom: '0.75rem'
  },
  
  priorityStats: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '1rem'
  },
  
  statValue: {
    display: 'block',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#3b82f6'
  },
  
  statLabel: {
    display: 'block',
    fontSize: '0.75rem',
    color: '#94a3b8',
    marginTop: '0.25rem'
  },
  
  priorityIndicator: {
    padding: '0.5rem',
    borderRadius: '0.375rem',
    textAlign: 'center',
    fontSize: '0.875rem',
    fontWeight: 'bold',
    color: 'white'
  },
  
  // Snake Draft Flow Styles
  flowSection: {
    background: '#1e293b',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    border: '1px solid #334155'
  },
  
  roundsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1rem'
  },
  
  roundCard: {
    background: '#0f172a',
    borderRadius: '0.5rem',
    padding: '1rem',
    border: '1px solid #334155'
  },
  
  roundNumber: {
    fontSize: '1.125rem',
    fontWeight: 'bold',
    marginBottom: '0.75rem',
    color: '#3b82f6'
  },
  
  roundRec: {
    marginBottom: '0.75rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid #1e293b'
  },
  
  recPosition: {
    display: 'inline-block',
    background: '#3b82f6',
    padding: '0.125rem 0.5rem',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    marginRight: '0.5rem'
  },
  
  recReason: {
    fontSize: '0.875rem',
    color: '#94a3b8'
  },
  
  recTargets: {
    display: 'flex',
    gap: '0.375rem',
    marginTop: '0.5rem'
  },
  
  miniChip: {
    background: '#1e293b',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    border: '1px solid #334155'
  },
  
  noTargets: {
    color: '#64748b',
    fontSize: '0.875rem',
    fontStyle: 'italic'
  },
  
  // Auction Styles
  auctionSection: {
    background: '#1e293b',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    border: '1px solid #334155'
  },
  
  budgetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem'
  },
  
  budgetCard: {
    background: '#0f172a',
    borderRadius: '0.5rem',
    padding: '1.25rem',
    border: '1px solid #334155'
  },
  
  budgetPosition: {
    fontSize: '1.125rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem'
  },
  
  budgetAmount: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: '0.5rem'
  },
  
  budgetBar: {
    height: '8px',
    background: '#1e293b',
    borderRadius: '4px',
    marginBottom: '0.5rem',
    overflow: 'hidden'
  },
  
  budgetFill: {
    height: '100%',
    background: '#10b981',
    borderRadius: '4px',
    transition: 'width 0.3s ease'
  },
  
  budgetPercent: {
    fontSize: '0.875rem',
    color: '#94a3b8'
  },
  
  nominationSection: {
    marginTop: '2rem',
    paddingTop: '2rem',
    borderTop: '1px solid #334155'
  },
  
  subsectionTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    marginBottom: '0.75rem'
  },
  
  nominationDesc: {
    color: '#94a3b8',
    marginBottom: '1rem'
  },
  
  nominationList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  
  nominationItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    background: '#0f172a',
    borderRadius: '0.375rem',
    border: '1px solid #334155'
  },
  
  nomPlayer: {
    fontWeight: 'bold'
  },
  
  nomReason: {
    fontSize: '0.875rem',
    color: '#94a3b8'
  },
  
  // Position Section Styles
  positionContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  
  positionTitle: {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '1rem'
  },
  
  tierSection: {
    background: '#1e293b',
    borderRadius: '0.75rem',
    overflow: 'hidden',
    border: '1px solid #334155'
  },
  
  tierHeader: {
    padding: '1.25rem',
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  
  tierInfo: {
    flex: 1
  },
  
  tierName: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    marginBottom: '0.375rem'
  },
  
  tierStats: {
    fontSize: '0.875rem',
    color: '#e5e7eb',
    display: 'flex',
    gap: '1rem'
  },
  
  chasmWarning: {
    background: 'rgba(0, 0, 0, 0.3)',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    fontWeight: 'bold',
    animation: 'pulse 2s infinite'
  },
  
  tierRec: {
    padding: '1.25rem',
    borderTop: '1px solid #334155',
    borderBottom: '1px solid #334155'
  },
  
  recPriority: {
    display: 'inline-block',
    padding: '0.375rem 0.75rem',
    borderRadius: '0.375rem',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '0.75rem'
  },
  
  recStrategy: {
    marginBottom: '0.5rem',
    lineHeight: '1.5'
  },
  
  recTiming: {
    fontSize: '0.875rem',
    color: '#94a3b8'
  },
  
  tierTargets: {
    padding: '1.25rem',
    background: '#0f172a'
  },
  
  targetsTitle: {
    fontSize: '1rem',
    fontWeight: 'bold',
    marginBottom: '1rem'
  },
  
  playerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem'
  },
  
  playerCard: {
    background: '#1e293b',
    borderRadius: '0.5rem',
    padding: '1rem',
    border: '2px solid',
    transition: 'transform 0.2s'
  },
  
  playerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem'
  },
  
  playerName: {
    fontWeight: 'bold',
    fontSize: '1.125rem'
  },
  
  loveIndicator: {
    fontSize: '1.25rem'
  },
  
  playerStats: {
    display: 'flex',
    gap: '0.5rem',
    fontSize: '0.875rem',
    color: '#94a3b8',
    marginBottom: '0.5rem'
  },
  
  playerValue: {
    fontWeight: 'bold',
    color: '#3b82f6'
  },
  
  allPlayersToggle: {
    margin: '1.25rem',
    marginTop: 0
  },
  
  toggleSummary: {
    cursor: 'pointer',
    padding: '0.75rem',
    background: '#0f172a',
    borderRadius: '0.375rem',
    fontWeight: 'bold',
    listStyle: 'none'
  },
  
  allPlayersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginTop: '1rem'
  },
  
  compactPlayer: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.5rem',
    background: '#0f172a',
    borderRadius: '0.25rem',
    fontSize: '0.875rem'
  },
  
  compactStats: {
    color: '#94a3b8'
  },
  
  dropoffIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '1rem',
    background: 'linear-gradient(to bottom, #1e293b, #0f172a)',
    color: '#f59e0b',
    fontWeight: 'bold'
  },
  
  dropoffArrow: {
    fontSize: '1.5rem'
  },
  
  dropoffValue: {
    fontSize: '0.875rem'
  }
};