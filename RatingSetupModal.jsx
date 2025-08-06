import React, { useState } from 'react';

const RATING_PRESETS = {
  quick: { 
    total: 100, 
    label: 'Quick Draft Prep',
    subtitle: 'Top 100 players',
    distribution: { QB: 15, RB: 30, WR: 35, TE: 20 } 
  },
  standard: { 
    total: 150, 
    label: 'Standard Prep',
    subtitle: 'Top 150 players',
    distribution: { QB: 25, RB: 45, WR: 50, TE: 30 } 
  },
  deep: { 
    total: 200, 
    label: 'Deep Research',
    subtitle: 'Top 200 players',
    distribution: { QB: 30, RB: 60, WR: 70, TE: 40 } 
  }
};

export default function RatingSetupModal({ onConfirm, onClose }) {
  const [selectedOption, setSelectedOption] = useState('standard');
  const [showCustom, setShowCustom] = useState(false);
  const [customLimits, setCustomLimits] = useState({
    QB: 25, RB: 45, WR: 50, TE: 30
  });

  const handleConfirm = () => {
    if (selectedOption === 'custom') {
      onConfirm({ type: 'custom', limits: customLimits });
    } else {
      onConfirm({ 
        type: selectedOption, 
        limits: RATING_PRESETS[selectedOption].distribution 
      });
    }
  };

  const handleCustomChange = (position, value) => {
  // Allow any input while typing
  setCustomLimits(prev => ({
    ...prev,
    [position]: value === '' ? '' : parseInt(value) || 0
  }));
};

const handleCustomBlur = (position, value) => {
  // Validate only when user is done typing (on blur)
  const numValue = parseInt(value) || 0;
  const validatedValue = Math.max(5, Math.min(100, numValue));
  
  setCustomLimits(prev => ({
    ...prev,
    [position]: validatedValue
  }));
};

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 style={styles.title}>How many players would you like to rate?</h2>
        
        {!showCustom ? (
          <>
            <div style={styles.options}>
              {Object.entries(RATING_PRESETS).map(([key, preset]) => (
                <label key={key} style={styles.optionCard}>
                  <input
                    type="radio"
                    name="rating-option"
                    value={key}
                    checked={selectedOption === key}
                    onChange={(e) => setSelectedOption(e.target.value)}
                    style={styles.radio}
                  />
                  <div style={styles.optionContent}>
                    <div style={styles.optionLabel}>{preset.label}</div>
                    <div style={styles.optionSubtitle}>{preset.subtitle}</div>
                  </div>
                </label>
              ))}
              
              <label style={styles.optionCard}>
                <input
                  type="radio"
                  name="rating-option"
                  value="custom"
                  checked={selectedOption === 'custom'}
                  onChange={() => {
                    setSelectedOption('custom');
                    setShowCustom(true);
                  }}
                  style={styles.radio}
                />
                <div style={styles.optionContent}>
                  <div style={styles.optionLabel}>Custom</div>
                  <div style={styles.optionSubtitle}>Set by position</div>
                </div>
              </label>
            </div>

            <div style={styles.buttonGroup}>
              <button onClick={onClose} style={styles.cancelButton}>
                Maybe Later
              </button>
              <button onClick={handleConfirm} style={styles.confirmButton}>
                Start Rating
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={styles.customSection}>
              <p style={styles.customHint}>Set players to rate per position.<br /><i>Fewer players = less reliable strategy advice</i></p>
              {Object.entries(customLimits).map(([position, value]) => (
                <div key={position} style={styles.customRow}>
                  <span style={styles.positionLabel}>{position}</span>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => handleCustomChange(position, e.target.value)}
                    onBlur={(e) => handleCustomBlur(position, e.target.value)}
                    max="100"
                    style={styles.numberInput}
                  />
                </div>
              ))}
              <div style={styles.totalRow}>
                Total: {Object.values(customLimits).reduce((a, b) => a + b, 0)} players
              </div>
            </div>

            <div style={styles.buttonGroup}>
              <button onClick={() => setShowCustom(false)} style={styles.cancelButton}>
                ← Back
              </button>
              <button onClick={handleConfirm} style={styles.confirmButton}>
                Start Rating
              </button>
            </div>
          </>
        )}
        <div style={{marginTop: 24, textAlign: 'center', fontSize: '0.9rem', color: '#94a3b8'}}>
  SwipeScout is ad-free. If you're enjoying it, you can{' '}
  <a
    href="https://ko-fi.com/dicestdev"
    target="_blank"
    rel="noopener noreferrer"
    style={{ color: '#60a5fa', textDecoration: 'underline' }}
  >
    chip in here
  </a>.
</div>

      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem'
  },
  modal: {
    background: '#1e293b',
    borderRadius: '1rem',
    padding: '2rem',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    textAlign: 'center',
    color: '#f1f5f9'
  },
  options: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '2rem'
  },
  optionCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid transparent',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  radio: {
    width: '20px',
    height: '20px',
    flexShrink: 0
  },
  optionContent: {
    flex: 1
  },
  optionLabel: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: '0.25rem'
  },
  optionSubtitle: {
    fontSize: '0.875rem',
    color: '#94a3b8'
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end'
  },
  cancelButton: {
    padding: '0.75rem 1.5rem',
    background: 'transparent',
    border: '1px solid #475569',
    borderRadius: '0.5rem',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '1rem'
  },
  confirmButton: {
    padding: '0.75rem 1.5rem',
    background: '#3b82f6',
    border: 'none',
    borderRadius: '0.5rem',
    color: 'white',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600'
  },
  customSection: {
    marginBottom: '2rem'
  },
  customHint: {
    color: '#94a3b8',
    marginBottom: '1rem'
  },
  customRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '0.5rem',
    marginBottom: '0.5rem'
  },
  positionLabel: {
    fontSize: '1rem',
    fontWeight: '500',
    color: '#f1f5f9'
  },
  numberInput: {
    width: '80px',
    padding: '0.5rem',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '0.25rem',
    color: '#f1f5f9',
    fontSize: '1rem',
    textAlign: 'center'
  },
  totalRow: {
    marginTop: '1rem',
    padding: '0.75rem',
    background: 'rgba(59, 130, 246, 0.1)',
    borderRadius: '0.5rem',
    textAlign: 'center',
    color: '#3b82f6',
    fontWeight: '600'
  }
};