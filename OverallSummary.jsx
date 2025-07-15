// src/components/OverallSummary.jsx
import React from 'react';
import PositionSummary from './PositionSummary';

/**
 * OverallSummary component displays when all positions are complete
 * It wraps PositionSummary with position=null to show overall analysis
 */
export default function OverallSummary({ onViewDraftPlan, onStartOver }) {
  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div style={styles.heroIcon}>🏆</div>
        <h1 style={styles.heroTitle}>All Positions Complete!</h1>
        <p style={styles.heroSubtitle}>
          You've evaluated players across all positions. Let's review your complete 
          draft profile and see your personalized strategy.
        </p>
        
        <div style={styles.statsRow}>
          <div style={styles.statItem}>
            <span style={styles.statIcon}>📊</span>
            <span style={styles.statText}>Full Analysis Ready</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statIcon}>🔗</span>
            <span style={styles.statText}>Stack Opportunities Found</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statIcon}>📋</span>
            <span style={styles.statText}>Draft Plan Available</span>
          </div>
        </div>
      </div>
      
      {/* Show overall analysis without position filter */}
      <PositionSummary 
        position={null}
        onContinue={onViewDraftPlan}
        onRestart={onStartOver}
      />
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
  },
  
  hero: {
    textAlign: 'center',
    padding: '2rem 1rem 3rem',
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
    borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
    position: 'relative',
    overflow: 'hidden'
  },
  
  heroIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
    animation: 'bounce 2s ease-in-out infinite'
  },
  
  heroTitle: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '1rem',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
  },
  
  heroSubtitle: {
    fontSize: '1.25rem',
    color: '#e5e7eb',
    maxWidth: '600px',
    margin: '0 auto 2rem',
    lineHeight: '1.6'
  },
  
  statsRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '2rem',
    flexWrap: 'wrap',
    marginTop: '2rem'
  },
  
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '0.75rem 1.5rem',
    borderRadius: '2rem',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  
  statIcon: {
    fontSize: '1.25rem'
  },
  
  statText: {
    color: 'white',
    fontWeight: '500'
  }
};