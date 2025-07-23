// src/components/PlayerAvatar.jsx
import { memo } from 'react';

// Complete team colors (same as used in PlayerCard)
const teamColors = {
  'ARI': { primary: '#97233F', secondary: '#000000' },
  'ATL': { primary: '#A71930', secondary: '#000000' },
  'BAL': { primary: '#241773', secondary: '#000000' },
  'BUF': { primary: '#00338D', secondary: '#C60C30' },
  'CAR': { primary: '#0085CA', secondary: '#101820' },
  'CHI': { primary: '#0B162A', secondary: '#C83803' },
  'CIN': { primary: '#FB4F14', secondary: '#000000' },
  'CLE': { primary: '#311D00', secondary: '#FF3C00' },
  'DAL': { primary: '#003594', secondary: '#041E42' },
  'DEN': { primary: '#FB4F14', secondary: '#002244' },
  'DET': { primary: '#0076B6', secondary: '#B0B7BC' },
  'GB': { primary: '#203731', secondary: '#FFB612' },
  'HOU': { primary: '#03202F', secondary: '#A71930' },
  'IND': { primary: '#002C5F', secondary: '#A2AAAD' },
  'JAX': { primary: '#101820', secondary: '#D7A22A' },
  'KC': { primary: '#E31837', secondary: '#FFB81C' },
  'LV': { primary: '#000000', secondary: '#A5ACAF' },
  'LAC': { primary: '#0080C6', secondary: '#FFC20E' },
  'LAR': { primary: '#003594', secondary: '#FFA300' },
  'MIA': { primary: '#008E97', secondary: '#FC4C02' },
  'MIN': { primary: '#4F2683', secondary: '#FFC62F' },
  'NE': { primary: '#002244', secondary: '#C60C30' },
  'NO': { primary: '#101820', secondary: '#D3BC8D' },
  'NYG': { primary: '#0B2265', secondary: '#A71930' },
  'NYJ': { primary: '#125740', secondary: '#000000' },
  'PHI': { primary: '#004C54', secondary: '#A5ACAF' },
  'PIT': { primary: '#FFB612', secondary: '#101820' },
  'SF': { primary: '#AA0000', secondary: '#B3995D' },
  'SEA': { primary: '#002244', secondary: '#69BE28' },
  'TB': { primary: '#D50A0A', secondary: '#FF7900' },
  'TEN': { primary: '#0C2340', secondary: '#4B92DB' },
  'WAS': { primary: '#5A1414', secondary: '#FFB612' }
};

// Helper function to generate accent shapes based on player name
const generateAccentShapes = (playerId, teamColors) => {
  const hash = playerId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const shapeCount = 2 + (Math.abs(hash) % 3); // 2-4 shapes
  const shapes = [];
  
  // Use team secondary color for shapes, or bright primary if secondary is black
  const shapeColor = teamColors.secondary === '#000000' 
    ? brightenColor(teamColors.primary, 80)
    : brightenColor(teamColors.secondary, 40);
  
  for (let i = 0; i < shapeCount; i++) {
    const seedValue = Math.abs(hash + i * 1234);
    const shapeType = seedValue % 4;
    const size = 3 + (seedValue % 6);
    const x = 15 + (seedValue % 70);
    const y = 15 + ((seedValue * 7) % 70);
    const opacity = 0.25 + ((seedValue % 4) * 0.05);
    const rotation = (seedValue % 8) * 45;
    
    let shapeElement;
    switch (shapeType) {
      case 0: // Triangle
        shapeElement = (
          <polygon 
            key={i}
            points={`${x},${y} ${x + size},${y + size} ${x - size},${y + size}`}
            fill={shapeColor}
            opacity={opacity}
            transform={`rotate(${rotation} ${x} ${y})`}
          />
        );
        break;
      case 1: // Circle
        shapeElement = (
          <circle 
            key={i}
            cx={x} cy={y} r={size} 
            fill={shapeColor}
            opacity={opacity}
          />
        );
        break;
      case 2: // Rectangle
        shapeElement = (
          <rect 
            key={i}
            x={x - size/2} y={y - size/2} 
            width={size} height={size * 1.5} 
            fill={shapeColor}
            opacity={opacity}
            rx="1"
            transform={`rotate(${rotation} ${x} ${y})`}
          />
        );
        break;
      case 3: // Diamond
        shapeElement = (
          <polygon 
            key={i}
            points={`${x},${y - size} ${x + size},${y} ${x},${y + size} ${x - size},${y}`}
            fill={shapeColor}
            opacity={opacity}
            transform={`rotate(${rotation} ${x} ${y})`}
          />
        );
        break;
      default:
        shapeElement = null;
    }
    
    if (shapeElement) {
      shapes.push(shapeElement);
    }
  }
  
  return shapes;
};

// Helper to brighten dark colors for better visibility
const brightenColor = (hex, amount = 60) => {
  // Convert hex to RGB
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0x00FF) + amount);
  const b = Math.min(255, (num & 0x0000FF) + amount);
  
  return `rgb(${r}, ${g}, ${b})`;
};

// Helper to create dynamic team gradients with better contrast
const createTeamGradient = (teamColors, playerId) => {
  const hash = Math.abs(playerId.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0));
  const gradientType = hash % 3;
  
  const gradientId = `teamGradient-${playerId}`;
  
  // Always brighten colors for better visibility
  const primaryBright = brightenColor(teamColors.primary, 50);
  const primaryBrighter = brightenColor(teamColors.primary, 80);
  const secondaryBright = teamColors.secondary === '#000000' 
    ? brightenColor(teamColors.primary, 100) // If secondary is black, use a much brighter version of primary
    : brightenColor(teamColors.secondary, 50);
  
  switch (gradientType) {
    case 0: // Linear diagonal with boosted colors
      return (
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primaryBrighter}/>
          <stop offset="100%" stopColor={secondaryBright}/>
        </linearGradient>
      );
    case 1: // Radial from corner with multiple bright stops
      return (
        <radialGradient id={gradientId} cx="0.3" cy="0.3" r="1.0">
          <stop offset="0%" stopColor={secondaryBright}/>
          <stop offset="60%" stopColor={primaryBright}/>
          <stop offset="100%" stopColor={primaryBrighter}/>
        </radialGradient>
      );
    case 2: // Linear with enhanced contrast - all bright colors
      return (
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={primaryBrighter}/>
          <stop offset="50%" stopColor={primaryBright}/>
          <stop offset="100%" stopColor={secondaryBright}/>
        </linearGradient>
      );
    default:
      return (
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primaryBright}/>
          <stop offset="100%" stopColor={secondaryBright}/>
        </linearGradient>
      );
  }
};

export const PlayerAvatar = memo(({ player, size = 96 }) => {
  const team = teamColors[player.team] ?? { primary: '#374151', secondary: '#6B7280' };
  const initials = player.name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
  const playerId = player.id || player.name.replace(/\s+/g, '');
  
  // Generate unique elements for this player
  const accentShapes = generateAccentShapes(playerId, team);
  const teamGradient = createTeamGradient(team, playerId);
  const gradientId = `teamGradient-${playerId}`;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Team gradient */}
        {teamGradient}
        
        {/* Text glow effect */}
        <filter id={`glow-${playerId}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        {/* Subtle text shadow */}
        <filter id={`shadow-${playerId}`} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="1" dy="2" stdDeviation="1" floodColor="rgba(0,0,0,0.4)"/>
        </filter>
      </defs>
      
      {/* Main background circle with gradient */}
      <circle 
        cx="50" cy="50" r="48" 
        fill={`url(#${gradientId})`}
      />
      
      {/* Accent shapes for personality */}
      <g opacity="0.6">
        {accentShapes}
      </g>
      
      {/* Main typography - the star of the show */}
      <text 
        x="50" y="50" 
        textAnchor="middle" 
        dominantBaseline="central" 
        fontFamily="system-ui, -apple-system, 'Segoe UI', Arial, sans-serif" 
        fontSize="38" 
        fontWeight="900" 
        fill="white" 
        filter={`url(#glow-${playerId}) url(#shadow-${playerId})`}
        letterSpacing="1px"
      >
        {initials}
      </text>
      
      {/* Subtle rim highlight using team colors */}
      <circle 
        cx="50" cy="50" r="47" 
        fill="none" 
        stroke={team.secondary === '#000000' ? brightenColor(team.primary, 60) : team.secondary}
        strokeWidth="1.5"
        opacity="0.6"
      />
    </svg>
  );
});