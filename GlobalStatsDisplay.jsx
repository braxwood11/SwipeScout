// src/components/GlobalStatsDisplay.jsx
import React from 'react';

export default function GlobalStatsDisplay({ globalSwipeCount }) {
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  const styles = {
    container: {
      position: 'relative',
      maxWidth: '240px',
      margin: '0 auto 16px auto',
    },
    
    glowBackground: {
      position: 'absolute',
      top: '-2px',
      left: '-2px',
      right: '-2px',
      bottom: '-2px',
      background: 'linear-gradient(135deg, #3B82F6, #8B5CF6, #EC4899)',
      borderRadius: '12px',
      filter: 'blur(4px)',
      opacity: 0.6,
    },
    
    mainCard: {
      position: 'relative',
      background: 'linear-gradient(135deg, #1F2937, #1E3A8A)',
      borderRadius: '10px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '8px 16px',
      textAlign: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    },
    
    number: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#FFFFFF',
      margin: 0,
    },
    
    label: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: '12px',
      fontWeight: '500',
      margin: 0,
    },
  };

  return (
    <div style={styles.container}>
      {/* Subtle background glow */}
      <div style={styles.glowBackground}></div>
      
      {/* Simple single card */}
      <div style={styles.mainCard}>
        <span style={styles.number}>
          {formatNumber(globalSwipeCount)}
        </span>
        <span style={styles.label}>
          🌍 Total Global Swipes
        </span>
      </div>
    </div>
  );
}