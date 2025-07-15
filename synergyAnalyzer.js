// src/utils/synergyAnalyzer.js

/**
 * Analyzes player relationships, stacks, and synergies
 */

export const analyzePlayerSynergies = (prefs, players) => {
  const synergies = {
    stacks: findQBStacks(prefs, players),
    teamStacks: findTeamStacks(prefs, players),
    handcuffs: findHandcuffs(prefs, players),
    gameStacks: findGameStacks(prefs, players),
    byeWeekClusters: analyzeByeWeeks(prefs, players),
    divisionalStacks: findDivisionalStacks(prefs, players)
  };
  
  // Generate insights based on synergies found
  synergies.insights = generateSynergyInsights(synergies);
  
  return synergies;
};

// Find QB-pass catcher stacks
const findQBStacks = (prefs, players) => {
  const stacks = [];
  
  // Get all QBs that user likes (rating >= 1)
  const likedQBs = players.filter(p => 
    p.position === 'QB' && 
    prefs[p.id] !== undefined && 
    prefs[p.id] >= 1
  );
  
  likedQBs.forEach(qb => {
    // Find pass catchers from same team
    const teamPassCatchers = players.filter(p => 
      p.team === qb.team && 
      ['WR', 'TE'].includes(p.position) && 
      prefs[p.id] !== undefined && 
      prefs[p.id] >= 0 // Include meh and above
    );
    
    if (teamPassCatchers.length > 0) {
      const stack = {
        qb,
        receivers: teamPassCatchers.sort((a, b) => 
          (prefs[b.id] || 0) - (prefs[a.id] || 0)
        ),
        team: qb.team,
        totalRating: prefs[qb.id] + teamPassCatchers.reduce((sum, p) => sum + (prefs[p.id] || 0), 0),
        type: 'qb-stack'
      };
      
      // Calculate stack strength
      stack.strength = calculateStackStrength(stack, prefs);
      
      // Generate narrative
      stack.narrative = generateStackNarrative(stack, prefs);
      
      stacks.push(stack);
    }
  });
  
  return stacks.sort((a, b) => b.strength - a.strength);
};

// Find multiple players from same team
const findTeamStacks = (prefs, players) => {
  const teamStacks = {};
  
  // Group liked players by team
  players.forEach(player => {
    if (prefs[player.id] !== undefined && prefs[player.id] >= 1) {
      if (!teamStacks[player.team]) {
        teamStacks[player.team] = [];
      }
      teamStacks[player.team].push(player);
    }
  });
  
  // Convert to array and analyze
  return Object.entries(teamStacks)
    .filter(([team, players]) => players.length >= 2)
    .map(([team, teamPlayers]) => {
      const stack = {
        team,
        players: teamPlayers.sort((a, b) => b.fantasyPts - a.fantasyPts),
        positions: [...new Set(teamPlayers.map(p => p.position))],
        totalProjectedPoints: teamPlayers.reduce((sum, p) => sum + p.fantasyPts, 0),
        type: 'team-stack'
      };
      
      // Determine stack type
      if (stack.positions.includes('QB') && 
          (stack.positions.includes('WR') || stack.positions.includes('TE'))) {
        stack.stackType = 'passing-game';
        stack.narrative = `You're all-in on the ${team} passing attack`;
      } else if (stack.positions.includes('RB') && teamPlayers.filter(p => p.position === 'RB').length > 1) {
        stack.stackType = 'backfield';
        stack.narrative = `You're targeting multiple ${team} RBs - risky but could pay off`;
      } else {
        stack.stackType = 'mixed';
        stack.narrative = `You believe in the ${team} offense across multiple positions`;
      }
      
      // Risk assessment
      stack.risk = assessStackRisk(stack);
      
      return stack;
    })
    .sort((a, b) => b.players.length - a.players.length);
};

// Find RB handcuff relationships
const findHandcuffs = (prefs, players) => {
  const handcuffs = [];
  const rbs = players.filter(p => p.position === 'RB');
  
  // Group RBs by team
  const teamRBs = {};
  rbs.forEach(rb => {
    if (!teamRBs[rb.team]) teamRBs[rb.team] = [];
    teamRBs[rb.team].push(rb);
  });
  
  Object.entries(teamRBs).forEach(([team, backs]) => {
    // Sort by projected points to identify starter vs backup
    backs.sort((a, b) => b.fantasyPts - a.fantasyPts);
    
    if (backs.length >= 2) {
      const starter = backs[0];
      const backup = backs[1];
      
      // Check if user likes the starter
      if (prefs[starter.id] >= 1) {
        const handcuff = {
          starter,
          backup,
          team,
          starterRating: prefs[starter.id] || 0,
          backupRating: prefs[backup.id],
          type: 'handcuff'
        };
        
        // Determine handcuff strategy
        if (prefs[backup.id] >= 0) {
          handcuff.strategy = 'secured';
          handcuff.narrative = `Smart! You're protecting your ${starter.name} investment with ${backup.name}`;
        } else if (prefs[backup.id] === -1) {
          handcuff.strategy = 'risky';
          handcuff.narrative = `You love ${starter.name} but passed on handcuff ${backup.name} - living dangerously`;
        } else if (prefs[backup.id] === undefined) {
          handcuff.strategy = 'unaware';
          handcuff.narrative = `Consider evaluating ${backup.name} as a handcuff for ${starter.name}`;
        }
        
        handcuffs.push(handcuff);
      }
    }
  });
  
  return handcuffs;
};

// Find game stack opportunities (players from opposing teams)
const findGameStacks = (prefs, players) => {
  const gameStacks = [];
  const schedule = getProjectedShootouts(); // You'd need schedule data
  
  // For now, find players user likes from traditional rivalries
  const rivalries = [
    ['KC', 'LV'], ['GB', 'CHI'], ['DAL', 'PHI'], 
    ['PIT', 'BAL'], ['NO', 'ATL'], ['SF', 'SEA']
  ];
  
  rivalries.forEach(([team1, team2]) => {
    const team1Players = players.filter(p => 
      p.team === team1 && prefs[p.id] >= 1
    );
    const team2Players = players.filter(p => 
      p.team === team2 && prefs[p.id] >= 1
    );
    
    if (team1Players.length > 0 && team2Players.length > 0) {
      gameStacks.push({
        teams: [team1, team2],
        players: [...team1Players, ...team2Players],
        narrative: `You're stacking the ${team1}-${team2} rivalry games`,
        type: 'game-stack',
        bestWeeks: findBestStackWeeks(team1, team2) // Would need schedule
      });
    }
  });
  
  return gameStacks;
};

// Analyze bye week clustering
const analyzeByeWeeks = (prefs, players) => {
  const byeWeeks = {};
  
  // Group loved players by bye week
  players.forEach(player => {
    if (prefs[player.id] >= 1 && player.byeWeek) {
      if (!byeWeeks[player.byeWeek]) {
        byeWeeks[player.byeWeek] = [];
      }
      byeWeeks[player.byeWeek].push(player);
    }
  });
  
  const analysis = {
    clusters: [],
    risk: 'low',
    narrative: ''
  };
  
  // Find problematic bye weeks
  Object.entries(byeWeeks).forEach(([week, players]) => {
    if (players.length >= 3) {
      analysis.clusters.push({
        week: parseInt(week),
        players,
        severity: players.length >= 5 ? 'critical' : 'moderate',
        positions: [...new Set(players.map(p => p.position))]
      });
    }
  });
  
  if (analysis.clusters.length > 0) {
    const worstCluster = analysis.clusters.sort((a, b) => b.players.length - a.players.length)[0];
    analysis.risk = worstCluster.severity === 'critical' ? 'high' : 'moderate';
    analysis.narrative = `Week ${worstCluster.week} could be rough with ${worstCluster.players.length} players on bye`;
    analysis.recommendation = 'Consider diversifying bye weeks or plan to punt that week';
  } else {
    analysis.narrative = 'Your bye weeks are well distributed';
    analysis.recommendation = 'No bye week concerns';
  }
  
  return analysis;
};

// Find divisional stacking opportunities
const findDivisionalStacks = (prefs, players) => {
  const divisions = {
    'AFC East': ['BUF', 'MIA', 'NE', 'NYJ'],
    'AFC North': ['BAL', 'CIN', 'CLE', 'PIT'],
    'AFC South': ['HOU', 'IND', 'JAX', 'TEN'],
    'AFC West': ['DEN', 'KC', 'LV', 'LAC'],
    'NFC East': ['DAL', 'NYG', 'PHI', 'WSH'],
    'NFC North': ['CHI', 'DET', 'GB', 'MIN'],
    'NFC South': ['ATL', 'CAR', 'NO', 'TB'],
    'NFC West': ['ARI', 'LAR', 'SF', 'SEA']
  };
  
  const divisionalStacks = [];
  
  Object.entries(divisions).forEach(([division, teams]) => {
    const divisionPlayers = players.filter(p => 
      teams.includes(p.team) && prefs[p.id] >= 1
    );
    
    if (divisionPlayers.length >= 3) {
      const uniqueTeams = [...new Set(divisionPlayers.map(p => p.team))];
      
      divisionalStacks.push({
        division,
        players: divisionPlayers,
        teams: uniqueTeams,
        narrative: `You're heavily invested in the ${division} with ${divisionPlayers.length} players`,
        type: 'divisional',
        benefit: 'Six guaranteed head-to-head matchups create stacking opportunities',
        risk: uniqueTeams.length === 1 ? 'high' : 'moderate'
      });
    }
  });
  
  return divisionalStacks;
};

// Helper functions
const calculateStackStrength = (stack, prefs) => {
  let strength = 0;
  
  // QB rating is most important
  strength += (prefs[stack.qb.id] || 0) * 2;
  
  // Add receiver ratings
  stack.receivers.forEach(receiver => {
    strength += (prefs[receiver.id] || 0) * 1.5;
  });
  
  // Bonus for elite QB
  if (stack.qb.fantasyPts > 300) strength += 2;
  
  // Bonus for multiple loved receivers
  const lovedReceivers = stack.receivers.filter(r => prefs[r.id] === 2);
  if (lovedReceivers.length >= 2) strength += 3;
  
  return strength;
};

const generateStackNarrative = (stack, prefs) => {
  const lovedReceivers = stack.receivers.filter(r => prefs[r.id] === 2);
  const receiverNames = stack.receivers.slice(0, 2).map(r => r.name).join(' and ');
  
  if (prefs[stack.qb.id] === 2 && lovedReceivers.length > 0) {
    return `Elite stack alert! ${stack.qb.name} with ${receiverNames} could win you weeks`;
  } else if (stack.receivers.length >= 3) {
    return `You're all-in on the ${stack.team} passing game with ${stack.receivers.length} targets`;
  } else {
    return `Solid ${stack.team} stack with ${stack.qb.name} and ${receiverNames}`;
  }
};

const assessStackRisk = (stack) => {
  if (stack.players.length >= 4) return 'high';
  if (stack.players.length === 3 && !stack.positions.includes('QB')) return 'high';
  if (stack.stackType === 'backfield') return 'high';
  if (stack.players.length === 2) return 'low';
  return 'moderate';
};

const getProjectedShootouts = () => {
  // This would need actual schedule data
  // For now, return empty array
  return [];
};

const findBestStackWeeks = (team1, team2) => {
  // This would need actual schedule data
  // For now, return placeholder
  return ['Week 3', 'Week 11'];
};

// Generate insights from all synergies
const generateSynergyInsights = (synergies) => {
  const insights = [];
  
  // QB Stack insights
  if (synergies.stacks.length > 0) {
    const bestStack = synergies.stacks[0];
    insights.push({
      type: 'stack',
      priority: 'high',
      title: 'Stack Attack Strategy',
      summary: `Your best stack: ${bestStack.qb.name} with ${bestStack.receivers[0].name}`,
      detail: bestStack.narrative,
      actionable: [
        'Prioritize securing both pieces of your stack',
        'Consider reaching for the receiver if needed',
        'Have backup stacks identified'
      ]
    });
  }
  
  // Team concentration insights
  const heavilyInvestedTeams = synergies.teamStacks.filter(s => s.players.length >= 3);
  if (heavilyInvestedTeams.length > 0) {
    const riskiestStack = heavilyInvestedTeams[0];
    insights.push({
      type: 'concentration',
      priority: riskiestStack.risk === 'high' ? 'high' : 'medium',
      title: 'Team Concentration Risk',
      summary: `You have ${riskiestStack.players.length} ${riskiestStack.team} players targeted`,
      detail: `This concentration in ${riskiestStack.team} could boom or bust your season. ${riskiestStack.narrative}`,
      actionable: [
        'Consider diversifying if this wasn\'t intentional',
        'If intentional, own it and grab the whole offense',
        'Have a plan B if the offense disappoints'
      ]
    });
  }
  
  // Handcuff insights
  const riskyHandcuffs = synergies.handcuffs.filter(h => h.strategy === 'risky');
  if (riskyHandcuffs.length > 0) {
    insights.push({
      type: 'handcuff',
      priority: 'medium',
      title: 'Handcuff Alert',
      summary: `You're exposed with ${riskyHandcuffs.length} unhandcuffed RBs`,
      detail: riskyHandcuffs.map(h => h.narrative).join('. '),
      actionable: riskyHandcuffs.map(h => 
        `Consider ${h.backup.name} as insurance for ${h.starter.name}`
      )
    });
  }
  
  // Bye week insights
  if (synergies.byeWeekClusters.risk !== 'low') {
    insights.push({
      type: 'schedule',
      priority: synergies.byeWeekClusters.risk === 'high' ? 'high' : 'medium',
      title: 'Bye Week Bottleneck',
      summary: synergies.byeWeekClusters.narrative,
      detail: `You'll need to navigate ${synergies.byeWeekClusters.clusters.length} difficult bye weeks`,
      actionable: [
        synergies.byeWeekClusters.recommendation,
        'Target players with different bye weeks',
        'Plan your waiver strategy around these weeks'
      ]
    });
  }
  
  return insights;
};

// Export main function and helpers
export {
  findQBStacks,
  findTeamStacks,
  findHandcuffs,
  analyzeByeWeeks,
  generateSynergyInsights
};