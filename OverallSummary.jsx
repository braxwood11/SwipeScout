import React from 'react';
import PositionSummary from './PositionSummary';

export default function OverallSummary({ onViewDraftPlan, onStartOver }) {
  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>🎉 All Positions Complete!</h1>
        <p style={styles.heroSubtitle}>
          You've evaluated players across all positions. 
          Time to see your complete draft strategy!
        </p>
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
  }
};

// In your position selection screen, add logic to show overall summary
if (allPositionsCompleted) {
  return (
    <OverallSummary 
      onViewDraftPlan={() => {
        // Navigate to draft plan or final recommendations
        window.location.href = '?plan';
      }}
      onStartOver={() => {
        // Clear all data and start fresh
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(PROGRESS_STORAGE_KEY);
        localStorage.removeItem(COMPLETED_POSITIONS_KEY);
        window.location.reload();
      }}
    />
  );
}