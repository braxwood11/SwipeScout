// improvedSnakeDraftStrategy.js

export function generateImprovedDraftFlow(players, prefs, tiers, leagueSize = 12, draftPosition = 6) {
  const flow = [];
  const draftedPositions = { QB: 0, RB: 0, WR: 0, TE: 0 };
  const rosterNeeds = { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 2, BENCH: 6 }; // Standard roster
  
  // Get all players with preferences
  // Handle both player.id and player.ID formats
  const allTargets = players.filter(p => {
    const pref = prefs[p.id] || prefs[p.ID];
    return pref !== undefined && pref >= 0;
  });
  
  // Debug: Check if we have top WRs
  const topWRs = players
    .filter(p => p.position === 'WR')
    .sort((a, b) => b.fantasyPts - a.fantasyPts)
    .slice(0, 10);
  
  console.log('Top 10 WRs in player pool:', topWRs.map(p => 
    `${p.name} - ${p.fantasyPts} pts - Pref: ${prefs[p.id] || prefs[p.ID] || 'not rated'}`
  ));
  
  // If user hasn't liked/loved enough players, include top-rated meh players
  const minTargetsNeeded = 60; // Enough for a full draft
  if (allTargets.length < minTargetsNeeded) {
    // Get all meh players not already included
    const mehPlayers = players.filter(p => {
      const pref = prefs[p.id] || prefs[p.ID];
      return pref === 0;
    });
    
    // Sort meh players by fantasy points and add best ones
    const sortedMeh = mehPlayers.sort((a, b) => b.fantasyPts - a.fantasyPts);
    const needed = minTargetsNeeded - allTargets.length;
    allTargets.push(...sortedMeh.slice(0, needed));
    
    console.log(`Added ${Math.min(needed, sortedMeh.length)} meh players to reach minimum targets`);
  }
  
  console.log(`Total targets: ${allTargets.length} players`);
  
  // CRITICAL FIX: Include unrated elite players
  // If top players haven't been rated, we still need to show them in appropriate rounds
  const unratedElites = players.filter(p => {
    const pref = prefs[p.id] || prefs[p.ID];
    const isUnrated = pref === undefined;
    const isElite = (
      (p.position === 'WR' && p.fantasyPts >= 200) ||
      (p.position === 'RB' && p.fantasyPts >= 200) ||
      (p.position === 'QB' && p.fantasyPts >= 280) ||
      (p.position === 'TE' && p.fantasyPts >= 150)
    );
    return isUnrated && isElite;
  });
  
  if (unratedElites.length > 0) {
    console.log('Found unrated elite players:', unratedElites.map(p => 
      `${p.name} (${p.position}) - ${p.fantasyPts} pts`
    ));
    
    // Add them to allTargets with proper round estimation
    unratedElites.forEach(player => {
      // Force proper rounds for elite unrated players
      if (player.position === 'WR' && player.fantasyPts >= 240) {
        player.estimatedRound = 1;
      } else if (player.position === 'WR' && player.fantasyPts >= 200) {
        player.estimatedRound = 2;
      } else if (player.position === 'RB' && player.fantasyPts >= 250) {
        player.estimatedRound = 1;
      } else if (player.position === 'RB' && player.fantasyPts >= 200) {
        player.estimatedRound = 2;
      } else {
        player.estimatedRound = estimateRoundByPosition(player, players);
      }
      player.estimationMethod = 'Unrated Elite';
      allTargets.push(player);
    });
  }
  
  // Add accurate round estimation based on ADP
  allTargets.forEach(player => {
    // Skip if already estimated (unrated elites)
    if (player.estimatedRound) return;
    // Priority 1: Use actual ADP if available (most accurate)
    if (player.adp && !isNaN(player.adp) && player.adp > 0) {
      player.estimatedRound = Math.ceil(player.adp / leagueSize);
      player.estimationMethod = 'ADP';
    } 
    // Priority 2: Use overall rank if available
    else if (player.overallRank && player.overallRank > 0) {
      player.estimatedRound = Math.ceil(player.overallRank / leagueSize);
      player.estimationMethod = 'Rank';
    } 
    // Priority 3: Use position-based estimation (least accurate)
    else {
      player.estimatedRound = estimateRoundByPosition(player, players);
      player.estimationMethod = 'Estimated';
      
      // Log warnings for elite players with estimated rounds
      if (player.fantasyPts > 200 && player.estimatedRound > 3) {
        console.warn(`Warning: ${player.name} (${player.fantasyPts} pts) estimated at round ${player.estimatedRound} - this may be too late`);
      }
    }
    
    // Sanity check: Elite players shouldn't go too late
    if (player.fantasyPts > 250 && player.estimatedRound > 2) {
      console.warn(`Adjusting ${player.name} from round ${player.estimatedRound} to round 2 (elite player)`);
      player.estimatedRound = 2;
    }
  });

  // Track if we're working with limited targets
  const lovedAndLikedCount = allTargets.filter(p => {
    const pref = prefs[p.id] || prefs[p.ID];
    return pref >= 1; // Only Love (2) and Like (1)
  }).length;
  const isLimitedTargets = lovedAndLikedCount < 30;
  
  // Group players by their estimated round
  const playersByRound = {};
  allTargets.forEach(player => {
    const round = player.estimatedRound;
    if (round >= 1 && round <= 16) {
      if (!playersByRound[round]) playersByRound[round] = [];
      playersByRound[round].push(player);
    }
  });
  
  // Debug: Show what's in each round
  console.log('Players by round:');
  for (let r = 1; r <= 5; r++) {
    if (playersByRound[r]) {
      console.log(`Round ${r}:`, playersByRound[r].map(p => 
        `${p.name} (${p.position})`
      ));
    }
  }

  // Calculate pick numbers for snake draft
  const getPickNumbers = (round, draftPos, leagueSize) => {
    if (round % 2 === 1) {
      // Odd round - normal order
      return [draftPos + (round - 1) * leagueSize];
    } else {
      // Even round - reverse order
      return [(leagueSize - draftPos + 1) + (round - 1) * leagueSize];
    }
  };

  // Generate recommendations for each round
  for (let round = 1; round <= 16; round++) {
    const pickNumber = getPickNumbers(round, draftPosition, leagueSize)[0];
    const recommendations = [];
    
    // Get available players for this round (±1 round window)
    const availablePlayers = [];
    [round, round + 1].forEach(r => {
      if (playersByRound[r]) availablePlayers.push(...playersByRound[r]);
    });
    
    // Debug log for round 1-2 to see what's available
    if (round <= 2) {
      console.log(`Round ${round} available players:`, 
        availablePlayers
          .filter(p => p.position === 'WR' || p.position === 'RB')
          .slice(0, 10)
          .map(p => `${p.name} (${p.position}${p.positionRank || '?'}) - ${p.fantasyPts} pts - Est R${p.estimatedRound}`)
      );
    }
    
    // Sort by preference and value
    const scoredPlayers = availablePlayers.map(player => ({
      ...player,
      score: calculatePlayerScore(player, prefs, round, draftedPositions, rosterNeeds)
    })).sort((a, b) => b.score - a.score);
    
    // Generate strategic recommendations based on round
    const strategy = getRoundSpecificStrategy(round, draftedPositions, scoredPlayers, tiers, isLimitedTargets);
    
    // Get top recommendations for each relevant position
    const positionsToConsider = getRelevantPositions(round, draftedPositions, rosterNeeds);
    
    positionsToConsider.forEach(position => {
      const positionPlayers = scoredPlayers.filter(p => p.position === position);
      if (positionPlayers.length > 0) {
        const topTargets = positionPlayers.slice(0, 3);
        const tierInfo = getTierContext(topTargets[0], tiers[position]);
        const playerPref = prefs[topTargets[0].id] || prefs[topTargets[0].ID] || 0;
        
        recommendations.push({
          position,
          reason: getPositionReason(position, round, tierInfo, draftedPositions, playerPref),
          targets: topTargets,
          priority: calculatePriority(position, round, tierInfo, draftedPositions)
        });
      }
    });
    
    // Sort recommendations by priority
    recommendations.sort((a, b) => b.priority - a.priority);
    
    // Track what positions we're drafting
    if (recommendations.length > 0) {
      const primaryRec = recommendations[0];
      if (primaryRec.targets.length > 0) {
        draftedPositions[primaryRec.position]++;
      }
    }
    
    flow.push({
      round,
      pickNumber,
      strategy,
      recommendations: recommendations.slice(0, 4), // Top 4 recommendations
      context: getRoundContext(round, draftPosition, leagueSize)
    });
  }
  
  return flow;
}

function calculatePlayerScore(player, prefs, round, draftedPositions, rosterNeeds) {
  let score = 0;
  
  // Base score from preference (handle both id and ID)
  const pref = prefs[player.id] || prefs[player.ID] || 0;
  score += pref * 100; // Heavy weight on preference
  
  // Value score based on ADP vs current round
  const adpValue = player.adp ? (player.adp / 12) - round : 0;
  score += adpValue * 20; // Positive if getting value, negative if reaching
  
  // Positional need score
  const currentCount = draftedPositions[player.position] || 0;
  const neededCount = getPositionalNeed(player.position, rosterNeeds);
  if (currentCount < neededCount) {
    score += 30; // Bonus for filling needs
  }
  
  // Tier-based scoring (elite players get bonus in early rounds)
  if (round <= 6 && player.fantasyPts > 200) {
    score += 40;
  }

  const roundDiff = round - player.estimatedRound;   // +ve = we waited
  if (roundDiff > 0)    score -= roundDiff * 50;     // 50 pts per round late
  if (roundDiff < -1)   score -= Math.abs(roundDiff) * 10; // mild penalty for reaching >1 rd early
  
  return score;
}

function getRoundSpecificStrategy(round, draftedPositions, availablePlayers, tiers, isLimitedTargets = false) {
  const hasRB = draftedPositions.RB || 0;
  const hasWR = draftedPositions.WR || 0;
  const hasTE = draftedPositions.TE || 0;
  const hasQB = draftedPositions.QB || 0;
  
  // Add warning if mostly working with meh players
  if (isLimitedTargets && round === 1) {
    return "⚠️ Limited Targets: Consider evaluating more players for better recommendations. Target best available talent.";
  }
  
  // Round 1-2: Foundation
  if (round <= 2) {
    if (hasRB === 0 && hasWR === 0) {
      return "🏗️ Foundation Pick: Target an elite RB or WR to anchor your team";
    } else if (hasRB === 1 && hasWR === 0) {
      return "⚖️ Balance Your Core: Consider elite WR or double down on RB dominance";
    } else if (hasRB === 0 && hasWR === 1) {
      return "🎯 Critical Decision: Last chance for elite RB or embrace Zero-RB strategy";
    }
  }
  
  // Round 3-4: Flex and Elite Positions
  if (round <= 4) {
    if (hasTE === 0 && tierHasElite('TE', availablePlayers)) {
      return "🎪 Positional Advantage: Elite TE window - huge weekly edge available";
    }
    if (hasQB === 0 && tierHasElite('QB', availablePlayers)) {
      return "🚀 QB Sweet Spot: Top-tier QBs offer consistency and ceiling";
    }
    return "💪 Build Your Flex: Secure your third starter from RB/WR";
  }
  
  // Round 5-7: Fill Starters
  if (round <= 7) {
    const needs = [];
    if (hasQB === 0) needs.push("QB");
    if (hasTE === 0) needs.push("TE");
    if (hasRB < 2) needs.push("RB");
    if (hasWR < 2) needs.push("WR");
    
    if (needs.length > 0) {
      return `📋 Complete Your Starters: Still need ${needs.join(", ")} - don't wait too long`;
    }
    return "🎲 Best Player Available: Take value where it falls";
  }
  
  // Round 8-10: Depth and Upside
  if (round <= 10) {
    return "📈 Upside Hunting: Target high-ceiling players and your favorite sleepers";
  }
  
  // Round 11-13: Bench Building
  if (round <= 13) {
    return "🔄 Strategic Depth: Handcuffs, rookies, and high-upside backups";
  }
  
  // Round 14-16: Lottery Tickets
  return "🎰 Swing for the Fences: Dynasty stashes, elite handcuffs, and league winners";
}

function getRelevantPositions(round, draftedPositions, rosterNeeds) {
  const positions = [];
  
  // Always consider RB/WR in early rounds
  if (round <= 8) {
    positions.push('RB', 'WR');
  }
  
  // Add TE if we don't have one by round 3
  if (round >= 3 && (draftedPositions.TE || 0) === 0) {
    positions.push('TE');
  }
  
  // Add QB if we don't have one by round 5
  if (round >= 5 && (draftedPositions.QB || 0) === 0) {
    positions.push('QB');
  }
  
  // Late rounds - all positions for depth
  if (round > 8) {
    return ['RB', 'WR', 'TE', 'QB'];
  }
  
  return [...new Set(positions)]; // Remove duplicates
}

function getPositionReason(position, round, tierInfo, draftedPositions, playerPref) {
  const count = draftedPositions[position] || 0;
  
  // Add preference context to reasons
  const prefContext = playerPref === 2 ? " (your love pick)" : 
                     playerPref === 1 ? " (your like pick)" :
                     playerPref === 0 ? " (best available)" : "";
  
  // Position-specific contexts
  const contexts = {
    RB: {
      early: "Elite workhorse back - foundation of championship teams",
      tierBreak: "Significant dropoff after this tier - secure reliable production",
      late: "Lottery ticket RB with league-winning upside"
    },
    WR: {
      early: "Target hog with elite ceiling - consistent 15+ points weekly",
      tierBreak: "Last of the alpha receivers before committee approaches",
      late: "Breakout candidate with clear path to targets"
    },
    TE: {
      early: "Positional advantage play - 5+ PPG edge over streaming",
      tierBreak: "Reliable TE1 before the wasteland",
      late: "Upside TE with expanding role"
    },
    QB: {
      early: "Elite QB for set-and-forget consistency",
      tierBreak: "Last proven QB1 before streaming tier",
      late: "High-upside QB2 or streaming option"
    }
  };
  
  let baseReason = "";
  if (round <= 4) baseReason = contexts[position].early;
  else if (tierInfo.isLastInTier) baseReason = contexts[position].tierBreak;
  else if (round >= 11) baseReason = contexts[position].late;
  else {
    // Default reason based on need
    if (count === 0) baseReason = `Fill starting ${position} need`;
    else if (count === 1 && position !== 'QB' && position !== 'TE') baseReason = `Secure ${position}2 for lineup flexibility`;
    else baseReason = `Depth and upside at ${position}`;
  }
  
  return baseReason + prefContext;
}

function getTierContext(player, positionTiers) {
  if (!positionTiers) return { tier: 1, isLastInTier: false };
  
  for (const tier of positionTiers) {
    const playerInTier = tier.players.find(p => p.id === player.id);
    if (playerInTier) {
      const lovedAndLiked = [...tier.lovedPlayers, ...tier.likedPlayers];
      const isLastInTier = lovedAndLiked.length === 1 && lovedAndLiked[0].id === player.id;
      return {
        tier: tier.tierNumber,
        isLastInTier,
        isChasm: tier.isChasm
      };
    }
  }
  
  return { tier: 99, isLastInTier: false };
}

function calculatePriority(position, round, tierInfo, draftedPositions) {
  let priority = 0;
  
  // Positional need is highest priority
  const count = draftedPositions[position] || 0;
  if (count === 0 && position !== 'QB' && round >= 5) priority += 50;
  if (count === 0 && position === 'QB' && round >= 8) priority += 40;
  
  // Tier breaks are important
  if (tierInfo.isLastInTier) priority += 30;
  if (tierInfo.isChasm) priority += 20;
  
  // Position scarcity by round
  const scarcityBonus = {
    RB: round <= 6 ? 25 : 10,
    WR: round <= 8 ? 20 : 10,
    TE: round >= 3 && round <= 7 ? 30 : 5,
    QB: round >= 5 && round <= 9 ? 25 : 5
  };
  priority += scarcityBonus[position] || 0;
  
  return priority;
}

function getRoundContext(round, draftPosition, leagueSize) {
  const pickInRound = round % 2 === 1 ? draftPosition : (leagueSize - draftPosition + 1);
  
  let context = "";
  if (pickInRound <= 3) {
    context = "🔥 Early in round - more options available";
  } else if (pickInRound >= leagueSize - 2) {
    context = "⏰ Late in round - consider reaching for targets";
  } else {
    context = "🎯 Middle of round - balance value and need";
  }
  
  // Add tier run warnings
  if (round >= 5 && round <= 10) {
    context += " | Watch for position runs";
  }
  
  return context;
}

function tierHasElite(position, players) {
  const positionPlayers = players.filter(p => p.position === position);
  // Check if any available players are in elite scoring range
  const eliteThresholds = { QB: 250, RB: 220, WR: 200, TE: 150 };
  return positionPlayers.some(p => p.fantasyPts >= eliteThresholds[position]);
}

function getPositionalNeed(position, rosterNeeds) {
  switch(position) {
    case 'QB': return rosterNeeds.QB;
    case 'TE': return rosterNeeds.TE;
    case 'RB': return rosterNeeds.RB + Math.floor(rosterNeeds.FLEX / 2);
    case 'WR': return rosterNeeds.WR + Math.ceil(rosterNeeds.FLEX / 2);
    default: return 0;
  }
}

function estimateRoundByPosition(player, allPlayers) {
  // First, try to use the player's existing positionRank if available
  let posRank = player.positionRank;
  
  // If no positionRank, calculate it
  if (!posRank) {
    // Get all players at this position for context
    const positionPlayers = allPlayers
      .filter(p => p.position === player.position)
      .sort((a, b) => b.fantasyPts - a.fantasyPts);
    
    // Find player's rank - handle both id and ID
    posRank = positionPlayers.findIndex(p => 
      (p.id && p.id === player.id) || 
      (p.ID && p.ID === player.ID) ||
      (p.id && player.ID && p.id === player.ID) ||
      (p.ID && player.id && p.ID === player.id)
    ) + 1;
    
    // If we still couldn't find the player
    if (posRank === 0) {
      console.error(`ERROR: Could not find ${player.name} (${player.position}) in position list!`);
      console.log('Player:', player);
      console.log('First few position players:', positionPlayers.slice(0, 5).map(p => ({ name: p.name, id: p.id, ID: p.ID })));
      
      // Last resort: estimate based on fantasy points
      const betterPlayers = positionPlayers.filter(p => p.fantasyPts > player.fantasyPts).length;
      posRank = betterPlayers + 1;
      console.log(`Estimated ${player.name} as ${player.position}${posRank} based on fantasy points`);
    }
  }
  
  console.log(`${player.name} - ${player.position}${posRank} - ${player.fantasyPts} pts`);
  
  // Force elite players to early rounds based on rank alone
  if (player.position === 'WR' && posRank <= 3) {
    console.log(`FORCING ${player.name} to round 1 (alpha WR)`);
    return 1;
  }
  if (player.position === 'RB' && posRank <= 5) {
    console.log(`FORCING ${player.name} to round 1 (elite RB)`);
    return 1;
  }
  
  // More realistic draft patterns based on actual ADP data
  const draftPatterns = {
    QB: [
      { maxRank: 1, rounds: [3, 4] },      // QB1 (Mahomes, Allen)
      { maxRank: 3, rounds: [4, 6] },      // Elite QBs
      { maxRank: 6, rounds: [6, 8] },      // Solid QB1s
      { maxRank: 12, rounds: [8, 11] },    // Mid QB1s
      { maxRank: 20, rounds: [11, 14] },   // QB2s
      { maxRank: 99, rounds: [14, 16] }    // Deep QBs
    ],
    RB: [
      { maxRank: 5, rounds: [1, 1] },      // Elite RBs
      { maxRank: 10, rounds: [1, 2] },     // Top tier RBs
      { maxRank: 15, rounds: [2, 3] },     // Strong RB1s
      { maxRank: 24, rounds: [3, 4] },     // RB2s
      { maxRank: 36, rounds: [5, 7] },     // Flex RBs
      { maxRank: 48, rounds: [8, 10] },    // Depth RBs
      { maxRank: 99, rounds: [11, 16] }    // Handcuffs/lottery tickets
    ],
    WR: [
      { maxRank: 5, rounds: [1, 1] },      // CHANGED: Elite WRs go round 1!
      { maxRank: 12, rounds: [2, 3] },     // Top WR1s
      { maxRank: 20, rounds: [3, 4] },     // Solid WR1s
      { maxRank: 30, rounds: [4, 6] },     // WR2s
      { maxRank: 40, rounds: [6, 8] },     // Flex WRs
      { maxRank: 60, rounds: [8, 11] },    // Depth WRs
      { maxRank: 99, rounds: [11, 16] }    // Deep sleepers
    ],
    TE: [
      { maxRank: 2, rounds: [2, 3] },      // Elite TEs (Kelce, Andrews)
      { maxRank: 5, rounds: [4, 6] },      // Top tier TEs
      { maxRank: 10, rounds: [6, 8] },     // Solid TE1s
      { maxRank: 15, rounds: [8, 11] },    // Streaming TEs
      { maxRank: 99, rounds: [12, 16] }    // TE2s/lottery tickets
    ]
  };
  
  const patterns = draftPatterns[player.position];
  if (!patterns) {
    console.warn(`No draft pattern for position: ${player.position}`);
    return 10;
  }
  
  // Find the appropriate round range based on position rank
  for (const pattern of patterns) {
    if (posRank <= pattern.maxRank) {
      // Return average of the round range
      const avgRound = Math.round((pattern.rounds[0] + pattern.rounds[1]) / 2);
      console.log(`${player.name} matches pattern: rank ${posRank} <= ${pattern.maxRank}, rounds ${pattern.rounds[0]}-${pattern.rounds[1]}, avg: ${avgRound}`);
      return avgRound;
    }
  }
  
  console.warn(`${player.name} fell through all patterns with rank ${posRank}`);
  return 12; // Very late if not found
}

// React Component for displaying the improved draft flow
export function ImprovedSnakeDraftFlow({ draftFlow, styles, prefs }) {
  if (!draftFlow || draftFlow.length === 0) {
    return (
      <div style={styles.improvedDraftFlow}>
        <h2 style={styles.improvedDraftFlowTitle}>📋 Round-by-Round Game Plan</h2>
        <p>No draft recommendations available. Make sure you've evaluated some players first!</p>
      </div>
    );
  }
  
  // Check if strategy is based on limited targets
  const hasLimitedTargetsWarning = draftFlow[0]?.strategy?.includes("Limited Targets");
  
  return (
    <div style={styles.improvedDraftFlow}>
      <h2 style={styles.improvedDraftFlowTitle}>📋 Round-by-Round Game Plan</h2>
      
      {hasLimitedTargetsWarning && (
        <div style={{
          background: '#78350f',
          border: '1px solid #fbbf24',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
          color: '#fef3c7'
        }}>
          <strong>💡 Tip:</strong> You've mostly rated players as "Meh" so far. For better recommendations, go back and rate more players as Love/Like to identify your true targets!
        </div>
      )}
      
      {draftFlow.map(round => (
        <div key={round.round} style={styles.improvedRoundCard}>
          <div style={styles.improvedRoundHeader}>
            <h3 style={styles.improvedRoundTitle}>Round {round.round}</h3>
          </div>
          
          <div style={styles.improvedRoundStrategy}>{round.strategy}</div>
          
          <div style={styles.improvedRecommendations}>
            {round.recommendations.map((rec, idx) => (
              <div key={idx} style={
                rec.priority > 60 ? styles.improvedRecommendationHigh :
                rec.priority > 30 ? styles.improvedRecommendationMedium :
                styles.improvedRecommendationLow
              }>
                <div style={styles.improvedRecHeader}>
                  <span style={
                    rec.priority > 60 ? styles.improvedPositionBadgeHigh :
                    rec.priority > 30 ? styles.improvedPositionBadgeMedium :
                    styles.improvedPositionBadge
                  }>
                    {rec.position}
                  </span>
                  <span style={styles.improvedRecReason}>{rec.reason}</span>
                </div>
                <div style={styles.improvedRecTargets}>
                  {rec.targets.map(player => {
                    const pref = prefs?.[player.id] || prefs?.[player.ID] || 0;
                    const prefEmoji = pref === 2 ? '❤️' : pref === 1 ? '👍' : '😐';
                    
                    return (
                      <div key={player.id || player.ID} style={styles.improvedTargetPlayer}>
                        <span style={styles.improvedPlayerName}>
                          {prefEmoji} {player.name}
                        </span>
                        <span style={styles.improvedPlayerTeam}>{player.team || 'FA'}</span>
                        
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}