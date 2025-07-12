// src/utils/enhancedDraftPlan.js

export function createEnhancedDraftPlan(players, prefs, leagueSize = 12) {
  // Map preference values to weights
  const PREF_WEIGHTS = {
    2: 3.0,   // Love - heavily prioritize
    1: 1.5,   // Like - moderate boost
    0: 0.7,   // Meh - slight penalty
    '-1': 0.1 // Pass - strong penalty
  };
  
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
      
      const compositeScore = (
        weight * 100 +                    // User preference (0-300)
        normalizedPts * 50 +              // Normalized points (0-50)
        valueScore * 20 +                 // Value score (0-40 for great values)
        vorpBonus * 10                    // VORP bonus (0-10+)
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
  const roundTargets = generateRoundTargets(scoredPlayers, leagueSize);
  
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

function generateRoundTargets(scoredPlayers, leagueSize) {
  const rounds = Array.from({ length: 16 }, () => []);
  const positionCounts = { QB: 0, RB: 0, WR: 0, TE: 0 };
  const maxPositions = { QB: 2, RB: 6, WR: 6, TE: 2 };
  
  // First pass: Assign loved players to appropriate rounds
  const lovedPlayers = scoredPlayers.filter(p => p.prefScore === 2);
  
  lovedPlayers.forEach(player => {
    if (positionCounts[player.position] >= maxPositions[player.position]) return;
    
    // Estimate round based on typical ADP patterns
    const estimatedRound = getEstimatedRound(player, leagueSize);
    if (estimatedRound <= 16) {
      rounds[estimatedRound - 1].push(player);
      positionCounts[player.position]++;
    }
  });
  
  // Second pass: Fill with liked players
  const likedPlayers = scoredPlayers.filter(p => p.prefScore === 1);
  
  likedPlayers.forEach(player => {
    if (positionCounts[player.position] >= maxPositions[player.position]) return;
    
    const estimatedRound = getEstimatedRound(player, leagueSize);
    if (estimatedRound <= 16 && rounds[estimatedRound - 1].length < 3) {
      rounds[estimatedRound - 1].push(player);
      positionCounts[player.position]++;
    }
  });
  
  return rounds.map((roundPlayers, index) => ({
    round: index + 1,
    targets: roundPlayers.sort((a, b) => b.compositeScore - a.compositeScore),
    strategy: getRoundStrategy(index + 1, roundPlayers)
  }));
}

function getEstimatedRound(player, leagueSize) {
  // Use fantasy points as proxy for ADP
  const allAtPosition = player.position;
  const rankEstimate = Math.ceil(player.fantasyPts / 20); // Rough estimate
  return Math.max(1, Math.ceil(rankEstimate / leagueSize));
}

function getRoundStrategy(round, targets) {
  if (round <= 3) return "Target elite players at key positions";
  if (round <= 6) return "Fill starting lineup with high-upside players";
  if (round <= 10) return "Depth and upside plays";
  return "Fliers and handcuffs";
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
      </section>
    </div>
  );
}