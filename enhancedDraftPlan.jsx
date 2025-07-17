// src/utils/enhancedDraftPlan.js

/* quick rank stamping ------------------------------------------------ */
function stampRanks(list) {
  const byPos = {};
  list.forEach(p => { (byPos[p.position] ??= []).push(p); });
  Object.values(byPos).forEach(arr =>
    arr.sort((a,b) => b.fantasyPts - a.fantasyPts)
       .forEach((p,i) => { p.positionRank = i + 1; })
  );
  [...list].sort((a,b) => b.fantasyPts - a.fantasyPts)
           .forEach((p,i) => { p.overallRank  = i + 1; });
}

export function createEnhancedDraftPlan(players, prefs, leagueSize = 12) {
  stampRanks(players);
  // Map preference values to weights
  const PREF_WEIGHTS = {
    2: 3.0,   // Love - heavily prioritize
    1: 1.5,   // Like - moderate boost
    0: 0.7,   // Meh - slight penalty
    '-1': 0.1 // Pass - strong penalty
  };

  const ROOKIE_BONUS = { 2: 25, 1: 10, 0: 0, '-1': -5 };
  
  // Calculate composite score for each player
  const scoredPlayers = players
    .filter(p => prefs[p.id] !== undefined)
    .map(player => {
      const prefScore = prefs[player.id];
      const weight = PREF_WEIGHTS[prefScore] || 0.5;
      
      // Composite score factors:
      // 1. User preference (heavily weighted)
      // 2. Projected points (normalized by position)
      // 3. Value over replacement (VORP)
      // 4. Auction value (inverse - lower is better for value)
      
      const positionPlayers = players.filter(p => p.position === player.position);
      const maxPts = Math.max(...positionPlayers.map(p => p.fantasyPts));
      const normalizedPts = player.fantasyPts / maxPts;
      
      const valueScore = player.auction > 0 ? (50 / player.auction) : 1;
      const vorpBonus = player.vorp > 0 ? (player.vorp / 100) : 0;
      const rookieBoost = player.rookie ? (ROOKIE_BONUS[prefScore] ?? 0) : 0;
      
      const compositeScore = (
        weight * 100 +                    // User preference (0-300)
        normalizedPts * 50 +              // Normalized points (0-50)
        valueScore * 20 +                 // Value score (0-40 for great values)
        vorpBonus * 10 +                    // VORP bonus (0-10+)
        rookieBoost                       // upside pop
      );
      
      return {
        ...player,
        prefScore,
        compositeScore,
        weight,
        normalizedPts,
        valueScore
      };
    })
    .sort((a, b) => b.compositeScore - a.compositeScore);
  
  // Create smart tiers based on composite scores and natural breaks
  const tiers = createSmartTiers(scoredPlayers);
  
  // Generate round-by-round targets
  const roundTargets = generateRoundTargets(scoredPlayers, leagueSize, players);
  
  // Identify draft strategies based on preferences
  const strategy = identifyDraftStrategy(scoredPlayers, prefs);
  
  // Find sleepers and values
  const insights = generateDraftInsights(scoredPlayers, players);
  
  return {
    tiers,
    roundTargets,
    strategy,
    insights,
    scoredPlayers
  };
}

function createSmartTiers(scoredPlayers) {
  const tiers = [];
  let currentTier = [];
  let lastScore = null;
  
  scoredPlayers.forEach((player, index) => {
    // Start new tier if:
    // 1. Large score drop (>15% from last player)
    // 2. Different preference level from last player
    // 3. Natural position break (e.g., QB1-5 vs QB6-10)
    
    const shouldBreak = lastScore && (
      (lastScore - player.compositeScore) / lastScore > 0.15 ||
      (currentTier.length > 0 && currentTier[0].prefScore !== player.prefScore) ||
      (currentTier.length >= 8) // Max tier size
    );
    
    if (shouldBreak && currentTier.length > 0) {
      tiers.push({
        players: currentTier,
        avgScore: currentTier.reduce((sum, p) => sum + p.compositeScore, 0) / currentTier.length,
        description: getTierDescription(currentTier, tiers.length + 1)
      });
      currentTier = [];
    }
    
    currentTier.push(player);
    lastScore = player.compositeScore;
  });
  
  if (currentTier.length > 0) {
    tiers.push({
      players: currentTier,
      avgScore: currentTier.reduce((sum, p) => sum + p.compositeScore, 0) / currentTier.length,
      description: getTierDescription(currentTier, tiers.length + 1)
    });
  }
  
  return tiers;
}

function getTierDescription(tierPlayers, tierNumber) {
  const prefScores = tierPlayers.map(p => p.prefScore);
  const avgPref = prefScores.reduce((a, b) => a + b, 0) / prefScores.length;
  
  if (avgPref >= 1.8) return "Elite Targets";
  if (avgPref >= 1.2) return "Priority Picks";
  if (avgPref >= 0.5) return "Solid Options";
  if (avgPref >= 0) return "Acceptable Alternatives";
  return "Avoid Unless Necessary";
}

function generateRoundTargets(scoredPlayers, leagueSize, allPlayers) {
  const rounds = Array.from({ length: 16 }, () => []);
  const positionCounts = { QB: 0, RB: 0, WR: 0, TE: 0 };
  const maxPositions = { QB: 2, RB: 6, WR: 6, TE: 2 };
  
  // Create a combined list of loved and liked players, sorted by composite score
  const targetPlayers = scoredPlayers
    .filter(p => p.prefScore >= 1) // Love (2) or Like (1)
    .sort((a, b) => {
      // Sort by preference first (love > like), then by composite score
      if (a.prefScore !== b.prefScore) {
        return b.prefScore - a.prefScore;
      }
      return b.compositeScore - a.compositeScore;
    });
  
  // Assign players to rounds
  targetPlayers.forEach(player => {
    if (positionCounts[player.position] >= maxPositions[player.position]) return;
    
    const estimatedRound = getEstimatedRound(player, leagueSize, allPlayers);
    
    // Try to place in estimated round, but be flexible within 1 round
    for (let r = Math.max(1, estimatedRound - 1); r <= Math.min(16, estimatedRound + 1); r++) {
      if (rounds[r - 1].length < 4) { // Max 4 targets per round
        rounds[r - 1].push(player);
        positionCounts[player.position]++;
        break;
      }
    }
  });
  
  // Sort players within each round by composite score
  return rounds.map((roundPlayers, index) => ({
    round: index + 1,
    targets: roundPlayers.sort((a, b) => b.compositeScore - a.compositeScore),
    strategy: getRoundStrategy(index + 1, roundPlayers)
  }));
}

function getEstimatedRound(player, leagueSize = 12, allPlayers) {
  // 1️⃣ Use real ADP if available (most reliable)
  if (Number.isFinite(player.adp)) {
    return Math.max(1, Math.ceil(player.adp / leagueSize));
  }

  // 2️⃣ Use overall rank if available
  if (player.overallRank) {
    return Math.max(1, Math.ceil(player.overallRank / leagueSize));
  }

  // 3️⃣ Enhanced position-based estimation using VORP and fantasy points
  
  // Get all players at this position for context
  const positionPlayers = allPlayers
    .filter(p => p.position === player.position)
    .sort((a, b) => b.fantasyPts - a.fantasyPts);
  
  // Calculate player's position rank if not already set
  const posRank = player.positionRank || 
    (1 + positionPlayers.findIndex(p => p.id === player.id));
  
  // Base round estimates by position (when top players typically go)
  const positionStartRounds = {
    QB: 4,   // Elite QBs start going round 4-5
    RB: 1,   // Elite RBs go immediately
    WR: 1,   // Elite WRs also go early
    TE: 3    // Elite TEs go rounds 3-4
  };
  
  // How many players per round after the elite tier
  const playersPerRound = {
    QB: 1.5,  // ~1-2 QBs per round after the rush
    RB: 2.5,  // ~2-3 RBs per round (high demand)
    WR: 3,    // ~3 WRs per round
    TE: 1     // ~1 TE per round after elite
  };
  
  // Elite tier sizes (these go before the per-round pace)
  const eliteTierSize = {
    QB: 3,   // Top 3 QBs are elite
    RB: 8,   // Top 8 RBs are elite (scarcity!)
    WR: 10,  // Top 10 WRs are elite
    TE: 3    // Top 3 TEs are elite
  };
  
  const startRound = positionStartRounds[player.position] || 3;
  const perRound = playersPerRound[player.position] || 2;
  const eliteSize = eliteTierSize[player.position] || 5;
  
  // If player is in elite tier, distribute them across early rounds
  if (posRank <= eliteSize) {
    // Spread elite players across their typical draft range
    const eliteRounds = player.position === 'QB' ? 3 : 
                       player.position === 'TE' ? 2 : 4;
    return startRound + Math.floor((posRank - 1) * eliteRounds / eliteSize);
  }
  
  // For non-elite players, calculate based on steady per-round pace
  const playersAfterElite = posRank - eliteSize;
  const roundsAfterElite = Math.ceil(playersAfterElite / perRound);
  const estimatedRound = startRound + Math.ceil(eliteSize / perRound) + roundsAfterElite;
  
  // 4️⃣ Apply VORP-based adjustments
  if (player.vorp) {
    // High VORP players should go earlier
    if (player.vorp > 50) {
      return Math.max(1, estimatedRound - 2);
    } else if (player.vorp > 30) {
      return Math.max(1, estimatedRound - 1);
    } else if (player.vorp < 0) {
      // Negative VORP means below replacement level
      return Math.min(16, estimatedRound + 2);
    }
  }
  
  // 5️⃣ Apply fantasy points-based adjustments
  if (player.fantasyPts && positionPlayers.length > 0) {
    const maxPts = positionPlayers[0].fantasyPts;
    const ptsRatio = player.fantasyPts / maxPts;
    
    // If player has 90%+ of top player's points, they should go early
    if (ptsRatio > 0.9 && estimatedRound > 6) {
      return Math.max(3, estimatedRound - 2);
    } else if (ptsRatio < 0.6 && estimatedRound < 10) {
      // Low scoring players should go later
      return Math.min(14, estimatedRound + 2);
    }
  }
  
  return Math.max(1, Math.min(16, Math.round(estimatedRound)));
}


function getRoundStrategy(round, targets) {
  const positions = targets.map(p => p.position);
  const hasRB = positions.includes('RB');
  const hasWR = positions.includes('WR');
  
  if (round <= 2) {
    if (hasRB && hasWR) return "Foundation picks - grab your top RB or WR";
    if (hasRB) return "Secure an elite RB while they last";
    if (hasWR) return "Elite WR value - consider hero RB strategy";
    return "Focus on elite talent at any position";
  }
  
  if (round <= 4) {
    if (positions.includes('TE')) return "Elite TE window - positional advantage";
    if (positions.includes('QB')) return "Top QB tier - consider if value aligns";
    return "Fill out your core starters";
  }
  
  if (round <= 7) {
    return "Balance your roster - target best available from your list";
  }
  
  if (round <= 10) {
    return "Upside plays and depth - your sleeper picks";
  }
  
  if (round <= 13) {
    return "High-upside bench and handcuffs";
  }
  
  return "Lottery tickets and your favorite deep sleepers";
}

function identifyDraftStrategy(scoredPlayers, prefs) {
  const lovedByPosition = { QB: [], RB: [], WR: [], TE: [] };
  
  scoredPlayers.forEach(player => {
    if (player.prefScore === 2 && lovedByPosition[player.position]) {
      lovedByPosition[player.position].push(player);
    }
  });

  // Analyze patterns
  const strategies = [];
  
  if (lovedByPosition.RB.length >= 5 && lovedByPosition.RB.length > lovedByPosition.WR.length) {
    strategies.push({
      name: "RB Heavy",
      description: "You strongly prefer running backs - consider going RB-RB to start",
      confidence: "High"
    });
  }
  
  if (lovedByPosition.WR.length >= 6 && lovedByPosition.RB.filter(rb => rb.fantasyPts > 200).length <= 1) {
    strategies.push({
      name: "Zero RB",
      description: "You love receivers and fade RBs - perfect for Zero RB strategy",
      confidence: "High"
    });
  }
  
  if (lovedByPosition.TE.filter(te => te.fantasyPts > 150).length >= 2) {
    strategies.push({
      name: "Elite TE",
      description: "You value top tight ends - grab one early for positional advantage",
      confidence: "Medium"
    });
  }
  
  const valueTargets = scoredPlayers.filter(p => p.valueScore > 10 && p.prefScore >= 1);
  if (valueTargets.length > 20) {
    strategies.push({
      name: "Value Drafter",
      description: "You excel at finding value - wait on positions to get your guys later",
      confidence: "High"
    });
  }
  
  return strategies.length > 0 ? strategies : [{
    name: "Best Player Available",
    description: "You have diverse preferences - stay flexible and take value as it comes",
    confidence: "Medium"
  }];
}

function generateDraftInsights(scoredPlayers, allPlayers) {
  const insights = {
    sleepers: [],
    avoids: [],
    valueTargets: [],
    reachTargets: [],
    positionStrengths: {}
  };
  
  // Find sleepers (loved players ranked low)
  insights.sleepers = scoredPlayers
    .filter(p => p.prefScore === 2 && p.fantasyPts < getPositionAverage(p.position, allPlayers))
    .slice(0, 5)
    .map(p => ({
      ...p,
      reason: "You love them despite lower projections"
    }));
  
  // Find avoid candidates
  insights.avoids = allPlayers
    .filter(p => p.prefScore === -1 && p.fantasyPts > getPositionAverage(p.position, allPlayers))
    .slice(0, 5)
    .map(p => ({
      ...p,
      reason: "Highly ranked but you're not buying in"
    }));

    // Rookies

    insights.rookieUpside = scoredPlayers
  .filter(p => p.rookie && p.prefScore >= 1)
  .slice(0, 6);
  
  // Value targets
  insights.valueTargets = scoredPlayers
    .filter(p => p.valueScore > 15 && p.prefScore >= 1)
    .slice(0, 8)
    .map(p => ({
      ...p,
      reason: `Great value at $${p.auction}`
    }));
  
  // Position strengths
  ['QB', 'RB', 'WR', 'TE'].forEach(pos => {
    const posPlayers = scoredPlayers.filter(p => p.position === pos);
    const avgPref = posPlayers.reduce((sum, p) => sum + p.prefScore, 0) / posPlayers.length;
    
    insights.positionStrengths[pos] = {
      strength: avgPref > 1 ? 'Strong' : avgPref > 0 ? 'Moderate' : 'Weak',
      topTargets: posPlayers.filter(p => p.prefScore >= 1).slice(0, 5)
    };
  });
  
  return insights;
}

function getPositionAverage(position, players) {
  const posPlayers = players.filter(p => p.position === position);
  return posPlayers.reduce((sum, p) => sum + p.fantasyPts, 0) / posPlayers.length;
}

// Export a display component for the enhanced draft plan
export function DraftPlanDisplay({ plan }) {
  return (
    <div className="draft-plan">
      <h1>Your Personalized Draft Plan</h1>
      {/* Draft Strategy */}
      <section className="strategy-section">
        <h2>Recommended Strategies</h2>
        {plan.strategy.map((strat, idx) => (
          <div key={idx} className="strategy-card">
            <h3>{strat.name}</h3>
            <p>{strat.description}</p>
            <span className="confidence">Confidence: {strat.confidence}</span>
          </div>
        ))}
      </section>
      
      {/* Tier Board */}
      <section className="tiers-section">
        <h2>Your Personal Tier Board</h2>
        {plan.tiers.slice(0, 8).map((tier, idx) => (
          <div key={idx} className="tier">
            <h3>Tier {idx + 1}: {tier.description}</h3>
            <div className="tier-players">
              {tier.players.slice(0, 10).map(player => (
                <div key={player.id} className="tier-player">
                  <span className="player-name">{player.name}</span>
                  <span className="player-pos">{player.position}</span>
                  <span className="player-score">{player.compositeScore.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
      
      {/* Round by Round */}
      <section className="rounds-section">
        <h2>Round-by-Round Targets</h2>
        {plan.roundTargets.filter(r => r.targets.length > 0).map(round => (
          <div key={round.round} className="round">
            <h3>Round {round.round}</h3>
            <p className="round-strategy">{round.strategy}</p>
            <div className="round-targets">
              {round.targets.map(player => (
                <span key={player.id} className="target-player">
                  {player.name} ({player.position})
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>
      
      {/* Insights */}
      <section className="insights-section">
        <h2>Key Insights</h2>
        
        {plan.insights.sleepers.length > 0 && (
          <div className="insight-group">
            <h3>🎯 Your Sleepers</h3>
            {plan.insights.sleepers.map(player => (
              <div key={player.id} className="insight-player">
                {player.name} - {player.reason}
              </div>
            ))}
          </div>
        )}
        
        {plan.insights.valueTargets.length > 0 && (
          <div className="insight-group">
            <h3>💎 Best Values</h3>
            {plan.insights.valueTargets.map(player => (
              <div key={player.id} className="insight-player">
                {player.name} - {player.reason}
              </div>
            ))}
          </div>
        )}
        {plan.insights.rookieUpside?.length > 0 && (
  <div className="insight-group">
    <h3>🚀 Rookie Upside</h3>
    {plan.insights.rookieUpside.map(p => (
      <div key={p.id} className="insight-player">
        {p.name} – loved for ceiling plays
      </div>
    ))}
  </div>
)}
      </section>
    </div>
  );
}