// src/utils/overallGMTypes.js

/**
 * Overall GM personality types with multi-signal detection
 * For when viewing all positions combined
 */

export const OVERALL_GM_TYPES = {
  'architectOfChaos': {
    name: 'The Architect of Chaos',
    icon: '🏗️🌪️',
    description: 'You blend elite talent with deep sleepers across all positions',
    color: '#FF1493',
    detection: (analysis, players, prefs) => {
      const lovedPlayers = players.filter(p => prefs[p.id] === 2);
      const topTierLoved = lovedPlayers.filter(p => {
        const posPlayers = players.filter(pl => pl.position === p.position);
        const sorted = posPlayers.sort((a, b) => b.fantasyPts - a.fantasyPts);
        const rank = sorted.findIndex(pl => pl.id === p.id) + 1;
        return rank <= 10;
      });
      const bottomTierLoved = lovedPlayers.filter(p => {
        const posPlayers = players.filter(pl => pl.position === p.position);
        const sorted = posPlayers.sort((a, b) => b.fantasyPts - a.fantasyPts);
        const rank = sorted.findIndex(pl => pl.id === p.id) + 1;
        return rank > posPlayers.length * 0.6;
      });
      
      const hasEliteAndSleepers = topTierLoved.length >= 3 && bottomTierLoved.length >= 3;
      const highVariance = analysis.distribution.love > 5 && analysis.distribution.pass > 40;
      
      return hasEliteAndSleepers && highVariance;
    }
  },
  
  'moneyballGM': {
    name: 'The Moneyball GM',
    icon: '💰📊',
    description: 'You find inefficiencies and build through value',
    color: '#32CD32',
    detection: (analysis, players, prefs) => {
      const lovedPlayers = players.filter(p => prefs[p.id] >= 1);
      const valueRatio = lovedPlayers.filter(p => p.auction <= 10).length / (lovedPlayers.length || 1);
      const avoidsExpensive = players.filter(p => p.auction > 30 && prefs[p.id] === -1).length;
      const lovesRookies = analysis.rookieLove >= 4 || lovedPlayers.filter(p => p.rookie).length >= 4;
      
      return valueRatio > 0.6 && avoidsExpensive >= 5 && lovesRookies;
    }
  },
  
  'studsAndDuds': {
    name: 'The Studs and Duds Strategist',
    icon: '💎🗑️',
    description: 'You go all-in on elite players and punt the rest',
    color: '#FFD700',
    detection: (analysis, players, prefs) => {
      const lovedPlayers = players.filter(p => prefs[p.id] === 2);
      const expensiveLoved = lovedPlayers.filter(p => p.auction >= 25);
      const cheapLiked = players.filter(p => prefs[p.id] >= 0 && p.auction <= 5);
      const middleIgnored = players.filter(p => p.auction > 5 && p.auction < 25 && prefs[p.id] === -1);
      
      return expensiveLoved.length >= 6 && cheapLiked.length >= 15 && middleIgnored.length >= 20;
    }
  },
  
  'positionSpecialist': {
    name: 'The Position Specialist',
    icon: '🎯📍',
    description: 'You heavily favor specific positions in your build',
    color: '#4B0082',
    detection: (analysis, players, prefs) => {
      const positionCounts = { QB: 0, RB: 0, WR: 0, TE: 0 };
      const lovedPlayers = players.filter(p => prefs[p.id] === 2);
      
      lovedPlayers.forEach(p => {
        if (positionCounts[p.position] !== undefined) {
          positionCounts[p.position]++;
        }
      });
      
      const counts = Object.values(positionCounts);
      const maxCount = Math.max(...counts);
      const totalLoved = counts.reduce((a, b) => a + b, 0);
      const dominantPosition = maxCount / totalLoved > 0.4;
      
      // Check if they also fade another position
      const fadeCounts = { QB: 0, RB: 0, WR: 0, TE: 0 };
      players.filter(p => prefs[p.id] === -1).forEach(p => {
        if (fadeCounts[p.position] !== undefined) {
          fadeCounts[p.position]++;
        }
      });
      
      const maxFade = Math.max(...Object.values(fadeCounts));
      
      return dominantPosition && maxCount >= 8 && maxFade >= 15;
    }
  },
  
  'correlationCommander': {
    name: 'The Correlation Commander',
    icon: '🔗⚡',
    description: 'You build around team stacks and game theory',
    color: '#FF6347',
    detection: (analysis, players, prefs) => {
      const likedPlayers = players.filter(p => prefs[p.id] >= 1);
      const teams = {};
      
      likedPlayers.forEach(p => {
        if (!teams[p.team]) teams[p.team] = [];
        teams[p.team].push(p);
      });
      
      let stackCount = 0;
      let qbStackCount = 0;
      
      Object.entries(teams).forEach(([team, teamPlayers]) => {
        if (teamPlayers.length >= 3) stackCount++;
        
        const hasQB = teamPlayers.some(p => p.position === 'QB');
        const hasPassCatcher = teamPlayers.some(p => ['WR', 'TE'].includes(p.position));
        if (hasQB && hasPassCatcher) qbStackCount++;
      });
      
      return stackCount >= 3 && qbStackCount >= 2;
    }
  },
  
  'theTinkerTailor': {
    name: 'The Tinker Tailor',
    icon: '🔧✂️',
    description: 'You see every player as having potential value at the right price',
    color: '#4169E1',
    detection: (analysis, players, prefs) => {
      const distribution = analysis.distribution;
      const balancedRatings = 
        Math.abs(parseFloat(distribution.love) - parseFloat(distribution.like)) < 10 &&
        Math.abs(parseFloat(distribution.like) - parseFloat(distribution.meh)) < 15 &&
        parseFloat(distribution.pass) < 30;
      
      const diverseValues = analysis.valueMetrics.highValue.length >= 5 && 
                           analysis.valueMetrics.lowValue.length >= 10;
      
      const noExtremeBias = parseFloat(distribution.love) < 15 && parseFloat(distribution.pass) < 40;
      
      return balancedRatings && diverseValues && noExtremeBias;
    }
  },
  
  'antifantasy': {
    name: 'The Anti-Fantasy Contrarian',
    icon: '🙃🔄',
    description: 'Your board completely defies consensus rankings',
    color: '#FF4500',
    detection: (analysis, players, prefs) => {
      // Fade top players
      const topPlayers = ['QB', 'RB', 'WR', 'TE'].flatMap(pos => {
        return players
          .filter(p => p.position === pos)
          .sort((a, b) => b.fantasyPts - a.fantasyPts)
          .slice(0, 5);
      });
      
      const fadedElites = topPlayers.filter(p => prefs[p.id] === -1).length;
      
      // Love bottom tier
      const lovedSleepers = players.filter(p => {
        const posPlayers = players.filter(pl => pl.position === p.position);
        const sorted = posPlayers.sort((a, b) => b.fantasyPts - a.fantasyPts);
        const rank = sorted.findIndex(pl => pl.id === p.id) + 1;
        return rank > posPlayers.length * 0.7 && prefs[p.id] === 2;
      });
      
      return fadedElites >= 10 && lovedSleepers.length >= 8;
    }
  },
  
  'theScientist': {
    name: 'The Fantasy Scientist',
    icon: '🧪📈',
    description: 'You follow projections and analytics religiously',
    color: '#00CED1',
    detection: (analysis, players, prefs) => {
      const lovedPlayers = players.filter(p => prefs[p.id] === 2);
      const likedPlayers = players.filter(p => prefs[p.id] === 1);
      
      // Check if loved players are mostly high projected
      const lovedAvgProjection = lovedPlayers.reduce((sum, p) => sum + p.fantasyPts, 0) / (lovedPlayers.length || 1);
      const overallAvgProjection = players.reduce((sum, p) => sum + p.fantasyPts, 0) / players.length;
      
      const followsProjections = lovedAvgProjection > overallAvgProjection * 1.5;
      
      // Consistent value preferences
      const consistentValues = lovedPlayers.filter(p => {
        const expectedValue = p.fantasyPts / 10; // Rough value calculation
        return Math.abs(p.auction - expectedValue) < 5;
      }).length / lovedPlayers.length > 0.7;
      
      return followsProjections && consistentValues && analysis.distribution.love < 10;
    }
  },
  
  'dynastyInDisguise': {
    name: 'Dynasty in Disguise',
    icon: '👶🎭',
    description: 'You draft for the future even in redraft',
    color: '#9370DB',
    detection: (analysis, players, prefs) => {
      const lovedPlayers = players.filter(p => prefs[p.id] >= 1);
      const youngPlayers = lovedPlayers.filter(p => 
        p.rookie || (p.experience !== undefined && p.experience <= 2)
      );
      const proportion = lovedPlayers.length > 0 ? youngPlayers.length / lovedPlayers.length : 0;
      
      const avoidsVeterans = players.filter(p => 
        p.experience !== undefined && p.experience >= 8 && prefs[p.id] === -1
      ).length;
      
      return proportion > 0.4 && youngPlayers.length >= 15 && avoidsVeterans >= 10;
    }
  },
  
  'riskAverseRuler': {
    name: 'The Risk-Averse Ruler',
    icon: '🛡️📏',
    description: 'You prioritize floor and proven production',
    color: '#2F4F4F',
    detection: (analysis, players, prefs) => {
      const lovedPlayers = players.filter(p => prefs[p.id] >= 1);
      
      // No rookies loved
      const rookiesLoved = lovedPlayers.filter(p => p.rookie).length;
      
      // Loves consistent producers (high fantasy points, reasonable auction value)
      const consistentPlayers = lovedPlayers.filter(p => 
        p.fantasyPts > 150 && p.auction > 10 && p.auction < 40
      ).length;
      
      // Avoids volatility - check for defined experience
      const avoidedYoung = players.filter(p => 
        (p.rookie || (p.experience !== undefined && p.experience <= 2)) && prefs[p.id] === -1
      ).length;
      
      // High pass rate and low love rate
      const highPassRate = parseFloat(analysis.distribution.pass) > 50;
      const lowLoveRate = parseFloat(analysis.distribution.love) < 8;
      
      return rookiesLoved <= 1 && consistentPlayers >= 10 && (avoidedYoung >= 5 || highPassRate) && lowLoveRate;
    }
  }
};

// Function to determine overall GM type with fallback
export const getOverallGMType = (analysis, players, prefs) => {
  // Check each type in order of specificity
  for (const [key, type] of Object.entries(OVERALL_GM_TYPES)) {
    if (type.detection(analysis, players, prefs)) {
      return { key, ...type };
    }
  }
  
  // Enhanced fallback logic based on primary signals
  if (analysis.valueMetrics.lowValue.length > 20) {
    return {
      key: 'valueSeeker',
      name: 'The Value Seeker',
      icon: '💵',
      description: 'You consistently find underpriced talent',
      color: '#228B22'
    };
  }
  
  if (parseFloat(analysis.distribution.love) > 12) {
    return {
      key: 'enthusiast',
      name: 'The Fantasy Enthusiast',
      icon: '🎊',
      description: 'You see potential everywhere',
      color: '#FF69B4'
    };
  }
  
  // Default fallback
  return {
    key: 'balanced',
    name: 'The Balanced Builder',
    icon: '⚖️',
    description: 'You maintain a measured approach',
    color: '#4682B4'
  };
};