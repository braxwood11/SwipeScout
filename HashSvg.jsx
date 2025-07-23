// src/components/HashSvg.jsx
import React from "react";

/**
 * Enhanced texture generator that creates actual geometric patterns
 * instead of just a "#" symbol. Creates consistent but unique patterns
 * based on the provided id.
 */
export function HashSvg({ id = "default", color = "#6B7280", className = "", ...props }) {
  // Generate pattern based on id
  const hash = id.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const patternType = Math.abs(hash) % 5;
  const rotation = (Math.abs(hash) % 8) * 45;
  const density = 0.1 + (Math.abs(hash) % 3) * 0.05;
  const uniqueId = `texture-${id}-${patternType}`;
  
  // Different texture patterns
  const getPattern = () => {
    const size = 12;
    switch (patternType) {
      case 0: // Diamond grid
        return (
          <pattern id={uniqueId} patternUnits="userSpaceOnUse" width={size} height={size} patternTransform={`rotate(${rotation})`}>
            <rect width={size} height={size} fill="none"/>
            <path d={`M0,${size/2} L${size/2},0 L${size},${size/2} L${size/2},${size} Z`} 
                  fill="none" stroke={color} strokeWidth="0.5" opacity={density}/>
          </pattern>
        );
      
      case 1: // Dots pattern
        return (
          <pattern id={uniqueId} patternUnits="userSpaceOnUse" width={size} height={size} patternTransform={`rotate(${rotation})`}>
            <rect width={size} height={size} fill="none"/>
            <circle cx={size/4} cy={size/4} r="1" fill={color} opacity={density}/>
            <circle cx={size*3/4} cy={size*3/4} r="1" fill={color} opacity={density * 0.7}/>
          </pattern>
        );
      
      case 2: // Crosshatch
        return (
          <pattern id={uniqueId} patternUnits="userSpaceOnUse" width={size} height={size} patternTransform={`rotate(${rotation})`}>
            <rect width={size} height={size} fill="none"/>
            <path d={`M0,0 L${size},${size}`} stroke={color} strokeWidth="0.5" opacity={density}/>
            <path d={`M0,${size} L${size},0`} stroke={color} strokeWidth="0.5" opacity={density * 0.6}/>
          </pattern>
        );
      
      case 3: // Hexagonal
        return (
          <pattern id={uniqueId} patternUnits="userSpaceOnUse" width={size} height={size} patternTransform={`rotate(${rotation})`}>
            <rect width={size} height={size} fill="none"/>
            <path d={`M${size/2},2 L${size-2},${size/4} L${size-2},${size*3/4} L${size/2},${size-2} L2,${size*3/4} L2,${size/4} Z`} 
                  fill="none" stroke={color} strokeWidth="0.5" opacity={density}/>
          </pattern>
        );
      
      case 4: // Wave pattern
        return (
          <pattern id={uniqueId} patternUnits="userSpaceOnUse" width={size} height={size} patternTransform={`rotate(${rotation})`}>
            <rect width={size} height={size} fill="none"/>
            <path d={`M0,${size/2} Q${size/4},0 ${size/2},${size/2} Q${size*3/4},${size} ${size},${size/2}`} 
                  fill="none" stroke={color} strokeWidth="0.5" opacity={density}/>
          </pattern>
        );
      
      default:
        return (
          <pattern id={uniqueId} patternUnits="userSpaceOnUse" width={size} height={size}>
            <rect width={size} height={size} fill="none"/>
            <circle cx={size/2} cy={size/2} r="1" fill={color} opacity={density}/>
          </pattern>
        );
    }
  };

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      {...props}
    >
      <defs>
        {getPattern()}
      </defs>
      <rect width="100" height="100" fill={`url(#${uniqueId})`} />
    </svg>
  );
}