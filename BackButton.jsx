// src/components/BackButton.jsx
export default function BackButton({ onClick, children = '← Back' }) {
  return (
    <button
      onClick={onClick}   // ← fallback
      style={{
        position: 'absolute',
        top: '1rem',
        left: '2rem',
        background: 'rgba(255,255,255,0.1)',
        border: '1px solid #475569',
        color: '#f1f5f9',
        padding: '0.65rem 1.4rem',
        borderRadius: '0.5rem',
        fontSize: '0.9rem',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all .2s ease'
      }}
    >
      {children}
    </button>
  );
}
