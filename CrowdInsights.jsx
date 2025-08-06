import React, { useEffect, useState } from 'react';
import { getAllPlayerStats } from '../utils/supabase';

export default function CrowdInsights({ onBack }) {
  const [stats, setStats] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [sortConfig, setSortConfig] = useState({ key: 'total_swipes', direction: 'descending' });
  const [insights, setInsights] = useState([]);
  const [viewMode, setViewMode] = useState('percent');

  useEffect(() => {
    const loadData = async () => {
      const rawStats = await getAllPlayerStats();
      const rawPlayers = await fetch('/players.json').then(r => r.json());

      const playerMap = {};
      rawPlayers.forEach(p => {
        playerMap[p.id] = p;
      });

      const merged = rawStats.map(s => {
        const total = s.total_swipes || 1; // prevent division by zero
        return {
          ...s,
          name: playerMap[s.player_id]?.name || 'Unknown',
          position: playerMap[s.player_id]?.position || 'N/A',
          like_pct: (s.like_count / total * 100),
          love_pct: (s.love_count / total * 100),
          meh_pct: (s.meh_count / total * 100),
          pass_pct: (s.pass_count / total * 100)
        };
      });

      const insights = generateInsights(merged);

      setStats(merged);
      setPlayers(rawPlayers);
      setInsights(insights);
      setLoading(false);
    };

    loadData();
  }, []);

  const generateInsights = (data) => {
  const sortedBy = (key, desc = true) =>
    [...data].sort((a, b) =>
      desc ? b[key] - a[key] : a[key] - b[key]
    );

  const insights = [];

  const mostLoved = sortedBy('love_count')[0];
  const mostLiked = sortedBy('like_count')[0];
  const mostMeh = sortedBy('meh_count')[0];
  const mostPassed = sortedBy('pass_count')[0];
  const highestEngagement = sortedBy('total_swipes')[0];
  const mostLovedPct = sortedBy('love_pct')[0];
  const mostOverwhelminglyLoved = data.find(p => p.love_pct > 70);

  // Better polarizing score: both > 20%
  const polarizingCandidates = data
    .filter(p => p.love_pct >= 20 && p.pass_pct >= 20)
    .map(p => ({
      ...p,
      polarization_score: (p.love_pct + p.pass_pct) / 2
    }));

  const mostPolarizing = sortedBy.call(polarizingCandidates, 'polarization_score')?.[0];

  const options = [
    mostLoved && `💜 ${mostLoved.name} received the most total Love votes.`,
    mostLiked && `👍 ${mostLiked.name} had the most Likes overall.`,
    mostMeh && `😐 ${mostMeh.name} got the most Meh votes.`,
    mostPassed && `🚫 ${mostPassed.name} was passed on more than anyone else.`,
    highestEngagement && `📊 ${highestEngagement.name} has been swiped the most overall.`,
    mostLovedPct && `🔥 ${mostLovedPct.name} has the highest Love % of any player.`,
    mostOverwhelminglyLoved && `💯 ${mostOverwhelminglyLoved.name} was Loved by over 70% of users.`,
  ].filter(Boolean);

  // Shuffle & return 3
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return options.slice(0, 3);
};


  const sortedStats = React.useMemo(() => {
    const filtered = positionFilter === 'ALL'
      ? stats
      : stats.filter(p => p.position === positionFilter);

    if (!sortConfig.key) return filtered;

    return [...filtered].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (typeof aVal === 'string') {
        return sortConfig.direction === 'ascending'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortConfig.direction === 'ascending'
        ? aVal - bVal
        : bVal - aVal;
    });
  }, [stats, positionFilter, sortConfig]);

  const requestSort = (key) => {
    let direction = 'descending';
    if (sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = 'ascending';
    }
    setSortConfig({ key, direction });
  };

  const positions = ['ALL', 'QB', 'RB', 'WR', 'TE'];

  const renderSortArrow = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? ' 🔼' : ' 🔽';
  };

  if (loading) {
    return <div style={styles.container}><h2>Loading insights...</h2></div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.headerBar}>
        <button onClick={onBack} style={styles.backButton}>← Back</button>
        <h1 style={styles.title}>Crowd Insights</h1>
      </div>

      <div style={styles.insightBox}>
        {insights.map((line, i) => (
          <div key={i} style={styles.insightLine}>{line}</div>
        ))}
      </div>

      <div style={styles.filterBar}>
        <label style={styles.filterLabel}>Filter by Position:</label>
        <select
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value)}
          style={styles.dropdown}
        >
          {positions.map(pos => (
            <option key={pos} value={pos}>{pos}</option>
          ))}
        </select>

        <label style={{ marginLeft: '1rem', fontWeight: 500 }}>View Mode:</label>
        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
          style={styles.dropdown}
        >
          <option value="percent">Percent</option>
          <option value="count">Count</option>
        </select>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th} onClick={() => requestSort('name')}>Player{renderSortArrow('name')}</th>
              <th style={styles.th} onClick={() => requestSort('position')}>Pos{renderSortArrow('position')}</th>
              <th style={styles.th} onClick={() => requestSort(viewMode === 'percent' ? 'like_pct' : 'like_count')}>Like{viewMode === 'percent' ? ' %' : ''}{renderSortArrow(viewMode === 'percent' ? 'like_pct' : 'like_count')}</th>
              <th style={styles.th} onClick={() => requestSort(viewMode === 'percent' ? 'love_pct' : 'love_count')}>Love{viewMode === 'percent' ? ' %' : ''}{renderSortArrow(viewMode === 'percent' ? 'love_pct' : 'love_count')}</th>
              <th style={styles.th} onClick={() => requestSort(viewMode === 'percent' ? 'meh_pct' : 'meh_count')}>Meh{viewMode === 'percent' ? ' %' : ''}{renderSortArrow(viewMode === 'percent' ? 'meh_pct' : 'meh_count')}</th>
              <th style={styles.th} onClick={() => requestSort(viewMode === 'percent' ? 'pass_pct' : 'pass_count')}>Pass{viewMode === 'percent' ? ' %' : ''}{renderSortArrow(viewMode === 'percent' ? 'pass_pct' : 'pass_count')}</th>
              <th style={styles.th} onClick={() => requestSort('total_swipes')}>Total{renderSortArrow('total_swipes')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedStats.map(p => (
              <tr key={p.player_id} style={styles.row}>
                <td style={styles.td}>{p.name}</td>
                <td style={{ ...styles.td, color: positionColor(p.position) }}>{p.position}</td>
                <td style={styles.td}>{viewMode === 'percent' ? `${p.like_pct.toFixed(1)}%` : p.like_count}</td>
                <td style={styles.td}>{viewMode === 'percent' ? `${p.love_pct.toFixed(1)}%` : p.love_count}</td>
                <td style={styles.td}>{viewMode === 'percent' ? `${p.meh_pct.toFixed(1)}%` : p.meh_count}</td>
                <td style={styles.td}>{viewMode === 'percent' ? `${p.pass_pct.toFixed(1)}%` : p.pass_count}</td>
                <td style={styles.td}>{p.total_swipes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const positionColor = (pos) => {
  const map = {
    QB: '#3B82F6',
    RB: '#10B981',
    WR: '#F59E0B',
    TE: '#8B5CF6'
  };
  return map[pos] || '#e5e7eb';
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
    color: 'white',
    padding: '2rem 1rem',
    fontFamily: 'system-ui, sans-serif'
  },
  headerBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.5rem'
  },
  backButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer'
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    margin: 0
  },
  insightBox: {
    marginBottom: '1.5rem',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '10px',
    padding: '1rem',
    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
    lineHeight: 1.6
  },
  insightLine: {
    fontSize: '0.95rem',
    marginBottom: '0.5rem'
  },
  filterBar: {
    marginBottom: '1rem'
  },
  filterLabel: {
    marginRight: '0.5rem',
    fontWeight: 500
  },
  dropdown: {
    padding: '0.5rem',
    fontSize: '1rem',
    borderRadius: '6px',
    border: '1px solid #ccc'
  },
  tableContainer: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '12px',
    overflow: 'hidden'
  },
  th: {
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
    textAlign: 'left',
    padding: '0.75rem',
    cursor: 'pointer'
  },
  td: {
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    padding: '0.75rem',
    color: 'white'
  },
  row: {
    transition: 'background 0.2s'
  }
};
