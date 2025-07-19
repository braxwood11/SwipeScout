// src/constants/index.js
// ------------------------------------------------------------------
// Put every small “shared lookup” object in here so any component
// can import from `../constants`.
export const positionIcons = {
  QB : '🎯',  // or a <svg> component if you prefer
  RB : '🏃',
  WR : '🙌',
  TE : '🎪',
  K  : '🦵',
  DEF: '🛡️',
};

export const teamColors = {
  ARI: { primary: '#97233F', secondary: '#000000' },
  ATL: { primary: '#A71930', secondary: '#000000' },
  // …keep the rest here so every component can share it
};