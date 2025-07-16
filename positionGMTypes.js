// src/utils/positionGMTypes.js

/**
 * Position-specific GM personality types with multi-signal detection
 */

// QB-specific GM types
export const QB_GM_TYPES = {
  'eliteTruther': {
    name: 'The Elite QB Truther',
    icon: '👑',
    description: 'You believe championships require elite QB play',
    color: '#FFD700',
    detection: (analysis, players, prefs) => {
      const eliteQBs = players
        .filter(p => p.position === 'QB')
        .sort((a, b) => b.fantasyPts - a.fantasyPts)
        .slice(0, 5);
      const lovedElites = eliteQBs.filter(qb => prefs[qb.id] === 2);
      const willingToPayUp = lovedElites.some(qb => qb.auction >= 20);
      return lovedElites.length >= 2 && willingToPayUp;
    }
  },
  
  'matchupMaestro': {
    name: 'The Matchup Maestro',
    icon: '🎯',
    description: 'You see value in the QB middle class and matchups',
    color: '#4B0082',
    detection: (analysis, players, prefs) => {
      const qbs = players.filter(p => p.position === 'QB');
      const sortedQBs = qbs.sort((a, b) => b.fantasyPts - a.fantasyPts);
      const midTierQBs = sortedQBs.slice(7, 18); // QB8-18
      const likedMidTier = midTierQBs.filter(qb => prefs[qb.id] >= 1);
      return likedMidTier.length >= 4 && analysis.distribution.love < 15;
    }
  },
  
  'stackArchitect': {
    name: 'The Stack Architect',
    icon: '🏗️',
    description: 'You build around QB-receiver synergy',
    color: '#FF6347',
    detection: (analysis, players, prefs) => {
      const lovedQBs = players.filter(p => p.position === 'QB' && prefs[p.id] >= 1);
      let stackCount = 0;
      lovedQBs.forEach(qb => {
        const hasStack = players.some(p => 
          p.team === qb.team && 
          ['WR', 'TE'].includes(p.position) && 
          prefs[p.id] >= 1
        );
        if (hasStack) stackCount++;
      });
      return stackCount >= 2;
    }
  },
  
  'konamiCode': {
    name: 'The Konami Code',
    icon: '🎮',
    description: 'You know the secret: wait on QB with surgical precision',
    color: '#00CED1',
    detection: (analysis, players, prefs) => {
      const qbs = players.filter(p => p.position === 'QB');
      const sortedQBs = qbs.sort((a, b) => b.fantasyPts - a.fantasyPts);
      const lateQBs = sortedQBs.slice(11); // QB12+
      const lovedLateQBs = lateQBs.filter(qb => prefs[qb.id] === 2);
      const passedElites = sortedQBs.slice(0, 8).filter(qb => prefs[qb.id] === -1);
      return lovedLateQBs.length === 2 && passedElites.length >= 4;
    }
  },
  
  'chaosAgent': {
    name: 'The Chaos Agent',
    icon: '🌪️',
    description: 'Your QB board defies conventional wisdom',
    color: '#FF1493',
    detection: (analysis, players, prefs) => {
      const qbs = players.filter(p => p.position === 'QB');
      const sortedQBs = qbs.sort((a, b) => b.fantasyPts - a.fantasyPts);
      const lovedElite = sortedQBs.slice(0, 5).some(qb => prefs[qb.id] === 2);
      const lovedSleeper = sortedQBs.slice(15).some(qb => prefs[qb.id] === 2);
      const highVariance = analysis.ratings.love > 0 && analysis.ratings.pass > 0;
      return lovedElite && lovedSleeper && highVariance;
    }
  },
  
  'floorGeneral': {
    name: 'The Field General',
    icon: '🛡️',
    description: 'You value QB consistency above all',
    color: '#228B22',
    detection: (analysis, players, prefs) => {
      const qbs = players.filter(p => p.position === 'QB' && prefs[p.id] >= 1);
      // Use fantasy points as proxy for consistency - established QBs tend to have higher projections
      const avgProjection = qbs.reduce((sum, qb) => sum + qb.fantasyPts, 0) / (qbs.length || 1);
      const provenQBs = qbs.filter(qb => qb.fantasyPts > avgProjection && !qb.rookie);
      return provenQBs.length >= 3 && analysis.ratings.love <= 3;
    }
  }
};

// RB-specific GM types
export const RB_GM_TYPES = {
  'bellCowBeliever': {
    name: 'The Bell Cow Believer',
    icon: '🐄',
    description: 'You chase workhorse backs with guaranteed volume',
    color: '#8B4513',
    detection: (analysis, players, prefs) => {
      const rbs = players.filter(p => p.position === 'RB');
      const topRBs = rbs.sort((a, b) => b.fantasyPts - a.fantasyPts).slice(0, 15);
      const lovedTopRBs = topRBs.filter(rb => prefs[rb.id] === 2);
      const avoidedCommittees = rbs.filter(rb => {
        const teamRBs = rbs.filter(r => r.team === rb.team);
        return teamRBs.length > 1 && prefs[rb.id] === -1;
      });
      return lovedTopRBs.length >= 3 && avoidedCommittees.length >= 2;
    }
  },
  
  'committeeFadeCaptain': {
    name: 'The Committee Fade Captain',
    icon: '🚫',
    description: 'You avoid backfield committees like the plague',
    color: '#DC143C',
    detection: (analysis, players, prefs) => {
      const rbs = players.filter(p => p.position === 'RB');
      const teams = {};
      rbs.forEach(rb => {
        if (!teams[rb.team]) teams[rb.team] = [];
        teams[rb.team].push(rb);
      });
      
      let committeesFaded = 0;
      Object.values(teams).forEach(teamRBs => {
        if (teamRBs.length >= 2) {
          const allFaded = teamRBs.every(rb => prefs[rb.id] === -1 || prefs[rb.id] === 0);
          if (allFaded) committeesFaded++;
        }
      });
      
      return committeesFaded >= 3;
    }
  },
  
  'rookieWhisperer': {
    name: 'The Rookie Whisperer',
    icon: '🌟',
    description: 'You bet on young legs and untapped potential',
    color: '#FFD700',
    detection: (analysis, players, prefs) => {
      const lovedRBs = players.filter(p => p.position === 'RB' && prefs[p.id] === 2);
      const youngRBs = lovedRBs.filter(rb => rb.rookie || (rb.experience && rb.experience <= 2));
      const proportion = lovedRBs.length > 0 ? youngRBs.length / lovedRBs.length : 0;
      return youngRBs.length >= 2 && proportion >= 0.5;
    }
  },
  
  'pprSavant': {
    name: 'The PPR Savant',
    icon: '🎯',
    description: 'You target pass-catching backs for PPR dominance',
    color: '#4169E1',
    detection: (analysis, players, prefs) => {
      const lovedRBs = players.filter(p => p.position === 'RB' && prefs[p.id] >= 1);
      // Use receiving yards as proxy for pass-catching
      const receivingRBs = lovedRBs.filter(rb => {
        const totalYards = rb.rushYds + rb.recYds;
        const recProportion = totalYards > 0 ? rb.recYds / totalYards : 0;
        return recProportion > 0.3 || rb.recYds > 400;
      });
      return receivingRBs.length >= 3;
    }
  },
  
  'handcuffHoarder': {
    name: 'The Handcuff Hoarder',
    icon: '🔒',
    description: 'You secure your backfields with strategic handcuffs',
    color: '#708090',
    detection: (analysis, players, prefs) => {
      const rbs = players.filter(p => p.position === 'RB');
      const teams = {};
      rbs.forEach(rb => {
        if (!teams[rb.team]) teams[rb.team] = [];
        teams[rb.team].push({ ...rb, pref: prefs[rb.id] });
      });
      
      let handcuffPairs = 0;
      Object.values(teams).forEach(teamRBs => {
        if (teamRBs.length >= 2) {
          teamRBs.sort((a, b) => b.fantasyPts - a.fantasyPts);
          if (teamRBs[0].pref >= 1 && teamRBs[1].pref >= 0) {
            handcuffPairs++;
          }
        }
      });
      
      return handcuffPairs >= 2;
    }
  },
  
  'zeroRBZealot': {
    name: 'The Zero RB Zealot',
    icon: '⭕',
    description: 'You fade early RBs to build elite WR/TE cores',
    color: '#FF4500',
    detection: (analysis, players, prefs) => {
      const rbs = players.filter(p => p.position === 'RB');
      const sortedRBs = rbs.sort((a, b) => b.fantasyPts - a.fantasyPts);
      const top20RBs = sortedRBs.slice(0, 20);
      const late30RBs = sortedRBs.slice(30);
      
      const fadedEarly = top20RBs.filter(rb => prefs[rb.id] === -1 || prefs[rb.id] === 0);
      const lovedLate = late30RBs.filter(rb => prefs[rb.id] >= 1);
      
      return fadedEarly.length >= 15 && lovedLate.length >= 3;
    }
  },
  
  'antifragileArchitect': {
    name: 'The Antifragile Architect',
    icon: '🏛️',
    description: 'You build RB depth to withstand any storm',
    color: '#2F4F4F',
    detection: (analysis, players, prefs) => {
      const lovedRBs = players.filter(p => p.position === 'RB' && prefs[p.id] >= 1);
      const uniqueTeams = new Set(lovedRBs.map(rb => rb.team));
      const priceRange = Math.max(...lovedRBs.map(rb => rb.auction)) - Math.min(...lovedRBs.map(rb => rb.auction));
      return lovedRBs.length >= 6 && uniqueTeams.size >= 5 && priceRange > 20;
    }
  }
};

// WR-specific GM types
export const WR_GM_TYPES = {
  'alphaAccumulator': {
    name: 'The Alpha Accumulator',
    icon: '👑',
    description: 'You target true WR1s who dominate targets',
    color: '#FFD700',
    detection: (analysis, players, prefs) => {
      const wrs = players.filter(p => p.position === 'WR');
      const teams = {};
      wrs.forEach(wr => {
        if (!teams[wr.team]) teams[wr.team] = [];
        teams[wr.team].push(wr);
      });
      
      const lovedWRs = wrs.filter(wr => prefs[wr.id] === 2);
      const lovedWR1s = lovedWRs.filter(wr => {
        const teamWRs = teams[wr.team];
        teamWRs.sort((a, b) => b.fantasyPts - a.fantasyPts);
        return teamWRs[0].id === wr.id;
      });
      
      const proportion = lovedWRs.length > 0 ? lovedWR1s.length / lovedWRs.length : 0;
      return lovedWR1s.length >= 3 && proportion >= 0.75;
    }
  },
  
  'breakoutProphet': {
    name: 'The Breakout Prophet',
    icon: '🔮',
    description: 'You identify WR2/3s ready to ascend',
    color: '#9370DB',
    detection: (analysis, players, prefs) => {
      const wrs = players.filter(p => p.position === 'WR');
      const teams = {};
      wrs.forEach(wr => {
        if (!teams[wr.team]) teams[wr.team] = [];
        teams[wr.team].push(wr);
      });
      
      const lovedWRs = wrs.filter(wr => prefs[wr.id] >= 1);
      const lovedWR2Plus = lovedWRs.filter(wr => {
        const teamWRs = teams[wr.team];
        teamWRs.sort((a, b) => b.fantasyPts - a.fantasyPts);
        const position = teamWRs.findIndex(w => w.id === wr.id);
        return position >= 1; // WR2 or lower on team
      });
      
      return lovedWR2Plus.length >= 4 && lovedWRs.some(wr => wr.auction <= 10);
    }
  },
  
  'targetHogHunter': {
    name: 'The Target Hog Hunter',
    icon: '🎯',
    description: 'You chase volume above all else',
    color: '#FF6347',
    detection: (analysis, players, prefs) => {
      const lovedWRs = players.filter(p => p.position === 'WR' && prefs[p.id] >= 1);
      // Top fantasy points often correlates with high targets
      const avgPoints = lovedWRs.reduce((sum, wr) => sum + wr.fantasyPts, 0) / (lovedWRs.length || 1);
      const highVolumeWRs = lovedWRs.filter(wr => wr.fantasyPts > avgPoints * 1.1);
      return highVolumeWRs.length >= 4 && analysis.gmType !== 'eliteChaser';
    }
  },
  
  'fieldStretcher': {
    name: 'The Field Stretcher',
    icon: '⚡',
    description: 'You love explosive big-play receivers',
    color: '#00CED1',
    detection: (analysis, players, prefs) => {
      const lovedWRs = players.filter(p => p.position === 'WR' && prefs[p.id] >= 1);
      // Use high yards as proxy for big play ability
      const bigPlayWRs = lovedWRs.filter(wr => {
        const ypr = wr.recYds / 80; // Assume ~80 receptions for estimation
        return ypr > 15 || wr.recYds > 1200;
      });
      const hasLowFloorTolerance = analysis.distribution.meh > 30;
      return bigPlayWRs.length >= 3 && hasLowFloorTolerance;
    }
  },
  
  'slotSurgeon': {
    name: 'The Slot Surgeon',
    icon: '🔧',
    description: 'You value possession receivers and floor',
    color: '#32CD32',
    detection: (analysis, players, prefs) => {
      const lovedWRs = players.filter(p => p.position === 'WR' && prefs[p.id] >= 1);
      // Lower yards but consistent (slot receivers typically)
      const possessionWRs = lovedWRs.filter(wr => {
        const ypr = wr.recYds / 80;
        return ypr < 13 && wr.fantasyPts > 150; // Good fantasy points but lower YPR
      });
      const avoidsVolatile = analysis.ratings.pass > analysis.ratings.love * 2;
      return possessionWRs.length >= 3 && avoidsVolatile;
    }
  },
  
  'valueVulture': {
    name: 'The Value Vulture',
    icon: '💎',
    description: 'You find WR gold in the discount bin',
    color: '#FFD700',
    detection: (analysis, players, prefs) => {
      const lovedWRs = players.filter(p => p.position === 'WR' && prefs[p.id] >= 1);
      const cheapWRs = lovedWRs.filter(wr => wr.auction <= 15);
      const expensiveFades = players.filter(p => 
        p.position === 'WR' && p.auction > 30 && prefs[p.id] === -1
      );
      return cheapWRs.length >= 5 && expensiveFades.length >= 2;
    }
  },
  
  'correlationKing': {
    name: 'The Correlation King',
    icon: '🔗',
    description: 'You stack WRs with their QBs for ceiling',
    color: '#4B0082',
    detection: (analysis, players, prefs) => {
      const lovedWRs = players.filter(p => p.position === 'WR' && prefs[p.id] >= 1);
      let stackedWRs = 0;
      
      lovedWRs.forEach(wr => {
        const hasQBStack = players.some(p => 
          p.position === 'QB' && 
          p.team === wr.team && 
          prefs[p.id] >= 1
        );
        if (hasQBStack) stackedWRs++;
      });
      
      const proportion = lovedWRs.length > 0 ? stackedWRs / lovedWRs.length : 0;
      return stackedWRs >= 3 && proportion >= 0.6;
    }
  }
};

// TE-specific GM types
export const TE_GM_TYPES = {
  'positionalAdvantagePursuer': {
    name: 'The Positional Advantage Pursuer',
    icon: '🎪',
    description: 'You pay up for elite TE advantage',
    color: '#FF1493',
    detection: (analysis, players, prefs) => {
      const tes = players.filter(p => p.position === 'TE');
      const eliteTEs = tes.sort((a, b) => b.fantasyPts - a.fantasyPts).slice(0, 4);
      const lovedElites = eliteTEs.filter(te => prefs[te.id] === 2);
      const willingToPayUp = lovedElites.some(te => te.auction >= 15);
      return lovedElites.length >= 2 && willingToPayUp;
    }
  },
  
  'teTruthers': {
  detection: (analysis, players, prefs) => {
    const tes = players.filter(p => p.position === 'TE');
    const ratedTEs = tes.filter(te => prefs[te.id] !== undefined);
    
    if (ratedTEs.length < 8) return false;
    
    const likedTEs = tes.filter(te => prefs[te.id] >= 1);
    const passedTEs = tes.filter(te => prefs[te.id] === -1);
    
    const positiveRate = likedTEs.length / ratedTEs.length;
    const passRate = passedTEs.length / ratedTEs.length;
    
    // More realistic: 40%+ positive, 50% or lower pass rate
    return positiveRate >= 0.4 && passRate <= 0.5 && likedTEs.length >= 4;
  }
},
  
  'kelceTheorySubscriber': {
  detection: (analysis, players, prefs) => {
    const tes = players.filter(p => p.position === 'TE');
    const sortedTEs = tes.sort((a, b) => b.fantasyPts - a.fantasyPts);
    const ratedTEs = tes.filter(te => prefs[te.id] !== undefined);
    
    if (ratedTEs.length < 8) return false;
    
    const lovedElite = sortedTEs.slice(0, 5).filter(te => prefs[te.id] === 2);
    const likedTEs = tes.filter(te => prefs[te.id] >= 1);
    const passRate = tes.filter(te => prefs[te.id] === -1).length / ratedTEs.length;
    
    // More realistic: 75%+ pass rate, 1-2 elite loves, ≤4 total likes
    return lovedElite.length >= 1 && lovedElite.length <= 2 && 
           passRate >= 0.75 && likedTEs.length <= 4;
  }
},
  
  'streamerSupreme': {
    name: 'The Streamer Supreme',
    icon: '🔄',
    description: 'You\'ll find TE points on waivers',
    color: '#20B2AA',
    detection: (analysis, players, prefs) => {
      const tes = players.filter(p => p.position === 'TE');
      const lateTEs = tes.sort((a, b) => b.fantasyPts - a.fantasyPts).slice(10);
      const likedLate = lateTEs.filter(te => prefs[te.id] === 1);
      const noLoves = !tes.some(te => prefs[te.id] === 2);
      return likedLate.length >= 4 && noLoves;
    }
  },
  
  'fadePhilosopher': {
    name: 'The TE Fade Philosopher',
    icon: '🤔',
    description: 'You reject the TE position entirely',
    color: '#696969',
    detection: (analysis, players, prefs) => {
      const tes = players.filter(p => p.position === 'TE');
      const ratedTEs = tes.filter(te => prefs[te.id] !== undefined);
      const passedTEs = tes.filter(te => prefs[te.id] === -1);
      const proportion = ratedTEs.length > 0 ? passedTEs.length / ratedTEs.length : 0;
      return proportion >= 0.8 && passedTEs.length >= 5;
    }
  },
  
  'breakoutBeliever': {
    name: 'The Breakout Believer',
    icon: '🚀',
    description: 'You chase the next big TE breakout',
    color: '#FF8C00',
    detection: (analysis, players, prefs) => {
      const lovedTEs = players.filter(p => p.position === 'TE' && prefs[p.id] >= 1);
      const cheapTEs = lovedTEs.filter(te => te.auction <= 5);
      const youngTEs = lovedTEs.filter(te => te.rookie || (te.experience && te.experience <= 3));
      return cheapTEs.length >= 2 && youngTEs.length >= 2 && lovedTEs.length <= 4;
    }
  }
};

// Function to determine position-specific GM type
export const getPositionGMType = (position, analysis, players, prefs) => {
  let types;
  switch(position) {
    case 'QB': types = QB_GM_TYPES; break;
    case 'RB': types = RB_GM_TYPES; break;
    case 'WR': types = WR_GM_TYPES; break;
    case 'TE': types = TE_GM_TYPES; break;
    default: return null;
  }
  
  // Check each type in order (priority based on specificity)
  for (const [key, type] of Object.entries(types)) {
    if (type.detection(analysis, players, prefs)) {
      return { key, ...type };
    }
  }
  
  // Fallback to generic balanced builder if no specific type matches
  return {
    key: 'balanced',
    name: 'The Balanced Builder',
    icon: '⚖️',
    description: `You maintain flexibility at ${position}`,
    color: '#4682B4'
  };
};