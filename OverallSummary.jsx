import React, { useState } from 'react';
import PositionSummary from './PositionSummary';

// Position configuration (matching SwipeDeck.jsx)
const POSITION_CONFIG = {
  'QB': { icon: '🎯', name: 'Quarterbacks', color: '#3B82F6' },
  'RB': { icon: '🏃', name: 'Running Backs', color: '#10B981' },
  'WR': { icon: '🙌', name: 'Wide Receivers', color: '#F59E0B' },
  'TE': { icon: '🎪', name: 'Tight Ends', color: '#8B5CF6' }
};

export default function OverallSummary({ onViewDraftPlan, onStartOver }) {
  const [selectedPosition, setSelectedPosition] = useState(null); // null = overall summary

  return (
    <div style={styles.container}>          {/* ← dark gradient again */}
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>🎉 All Positions Complete!</h1>
        <p style={styles.heroSubtitle}>
          You've evaluated players across all positions.
          Time to see your complete draft strategy!
        </p>

        <div style={styles.mainActions}>
          <button onClick={onViewDraftPlan} style={styles.mainActionButton}>
            📋 View Draft Plan
          </button>
          <button onClick={onStartOver} style={styles.secondaryActionButton}>
            🔄 Start Over
          </button>
        </div>
      </div>

      {/* Position Navigation */}
      <div style={styles.navigationContainer}>
        <div style={styles.positionTabs}>
          {/* Overall Tab */}
          <button
            style={{
              ...styles.positionTab,
              ...(selectedPosition === null ? styles.activePositionTab : {})
            }}
            onClick={() => setSelectedPosition(null)}
          >
            <span style={styles.tabIcon}>📊</span>
            <span style={styles.tabLabel}>Overall</span>
          </button>
          
          {/* Position Tabs */}
          {Object.entries(POSITION_CONFIG).map(([position, config]) => (
            <button
              key={position}
              style={{
                ...styles.positionTab,
                ...(selectedPosition === position ? styles.activePositionTab : {}),
                borderColor: config.color
              }}
              onClick={() => setSelectedPosition(position)}
            >
              <span style={styles.tabIcon}>{config.icon}</span>
              <span style={styles.tabLabel}>{position}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Show overall analysis or specific position */}
      <PositionSummary 
        position={selectedPosition}
        allPositionsComplete={true}
        onViewDraftPlan={onViewDraftPlan}
        onStartOver={onStartOver}
        onContinue={onViewDraftPlan}
        onRestart={onStartOver}
      />
    </div>
  );
}

const styles = {
  container: {
  minHeight: '100vh',
  background: 'linear-gradient(135deg,#0f0f23 0%,#1a1a2e 50%,#16213e 100%)',
  display: 'flex',
  flexDirection: 'column'
},
  
  hero: {
    textAlign: 'center',
    padding: '3rem 1rem 2rem',
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  },
  
  heroTitle: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '1rem'
  },
  
  heroSubtitle: {
    fontSize: '1.25rem',
    color: '#d1d5db'
  },

  navigationContainer: {
    padding: '2rem 1rem',
    maxWidth: '800px',
    margin: '0 auto'
  },

  positionTabs: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },

  positionTab: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '0.75rem',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '80px',
    fontSize: '0.875rem'
  },

  activePositionTab: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    transform: 'translateY(-2px)'
  },

  tabIcon: {
    fontSize: '1.5rem'
  },

  tabLabel: {
    fontWeight: '600',
    fontSize: '0.75rem'
  },

  mainActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginTop: '2rem',
    flexWrap: 'wrap'
  },

  mainActionButton: {
    padding: '1rem 2rem',
    background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
    border: 'none',
    borderRadius: '0.75rem',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '1.1rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '160px',
    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
  },

  secondaryActionButton: {
    padding: '1rem 2rem',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '0.75rem',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '1.1rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '160px'
  },
};