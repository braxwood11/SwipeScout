// src/components/PlayerAvatar.jsx
import { memo } from 'react';
import { HashSvg } from './HashSvg';          // tiny util that returns an <svg> w/ a hashed line pattern
import { positionIcons, teamColors } from '../constants'; // 🎯 🏃 🙌 🎪 🦵 🛡️

export const PlayerAvatar = memo(({ player, size = 96 }) => {
  const team = teamColors[player.team] ?? { primary:'#374151', secondary:'#6B7280' };
  const rim  = {
    QB : '#3B82F6', RB : '#10B981', WR : '#F59E0B',
    TE : '#8B5CF6', K  : '#EF4444', DEF: '#6B7280',
  }[player.position] ?? '#9CA3AF';

  const initials = player.name.split(' ').map(s => s[0]).join('').slice(0,2).toUpperCase();

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      {/* base */}
      <circle cx="50" cy="50" r="48" fill={team.primary} />
      {/* subtle hash texture */}
      <HashSvg id={player.id} color={team.secondary} />
      {/* rim / notch */}
      <circle cx="50" cy="50" r="48" fill="none" stroke={rim} strokeWidth="6" />
      {/* glyph + initials */}
      <text x="50" y="50" textAnchor="middle" dominantBaseline="central"
            fontSize="36" fontWeight="700" fill="#FFF" fontFamily="Inter, sans-serif">
        {positionIcons[player.position]} {initials}
      </text>
    </svg>
  );
});
