// src/utils/vorpTierBuilder.js

/**
 * Creates VORP-based tiers with dropoff detection
 * Identifies "Draft Chasms of Doom" - significant value drops
 */

// VORP thresholds for tier breaks by position
const VORP_TIER_THRESHOLDS = {
  QB: 15,   // 15+ point drop = new tier
  RB: 14,   // RBs have steeper dropoffs
  WR: 13,   // WRs slightly less steep
  TE: 10    // TEs have smaller absolute differences
};

const MAX_TIER_SIZE = { QB: 7, RB: 12, WR: 15, TE: 7 };

// Minimum gap between players to consider tier break
const MIN_PLAYER_GAP = {
  QB: 8,
  RB: 10,
  WR: 8,
  TE: 6
};

const NATURAL_BREAKS = {
  QB: [6, 12, 18],
  RB: [8, 16, 24, 36],
  WR: [12, 24, 36, 48],
  TE: [4, 8, 12, 18],
};

export function buildVORPTiers(players, prefs) {
  const positions = ['QB', 'RB', 'WR', 'TE'];
  const allTiers = {};
  
  positions.forEach(position => {
    const positionPlayers = players
      .filter(p => p.position === position)
      .map(p => ({
        ...p,
        preference: prefs[p.id] || -2, // -2 for unrated
        isLiked: prefs[p.id] >= 1,
        isLoved: prefs[p.id] === 2
      }))
      .sort((a, b) => b.vorp - a.vorp); // Sort by VORP descending
    
    allTiers[position] = createPositionTiers(positionPlayers, position);
  });
  
  return allTiers;
}

const BASEMENT_VORP = -10;     // 0-5 VORP = replacement-ish
const MIN_TIER_SIZE = 3;

function createPositionTiers(players, position) {
  const tiers = [];
  let current = [];

  const pushTier = () => {
    if (!current.length) return;
    tiers.push(createTierObject(current, tiers.length + 1, position, 0));
    current = [];
  };

  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    const last = current[current.length - 1];

    // --- Basement rule ------------------------------------------------
    if (p.vorp <= BASEMENT_VORP) {           // everything after this ⇒ basement
      pushTier();
      const basement = players.slice(i);     // gobble rest
      tiers.push(createTierObject(basement, tiers.length + 1, position, 0));
      break;
    }

    // --- start new tier? ---------------------------------------------
    if (last) {
      const vorpDrop = last.vorp - p.vorp;
      const cliff    = vorpDrop >= VORP_TIER_THRESHOLDS[position];
      const natural  = NATURAL_BREAKS[position].includes(i);
      const bigEnough= current.length >= MIN_TIER_SIZE;
      const hitSize  = current.length >= MAX_TIER_SIZE[position];

      if (bigEnough && (cliff || hitSize || (natural && tiers.length >= 2))) {
        pushTier();
      }
    }

    current.push(p);
  }

  pushTier();       // final pending tier
  return tiers;
}


function createTierObject(players, tierNumber, position, vorpDropToNext) {
  const likedInTier = players.filter(p => p.isLiked);
  const lovedInTier = players.filter(p => p.isLoved);
  
  // Calculate tier statistics
  const avgVorp = players.reduce((sum, p) => sum + p.vorp, 0) / players.length;
  const avgPoints = players.reduce((sum, p) => sum + p.fantasyPts, 0) / players.length;
  const priceRange = {
    min: Math.min(...players.map(p => p.auction)),
    max: Math.max(...players.map(p => p.auction)),
    avg: players.reduce((sum, p) => sum + p.auction, 0) / players.length
  };
  
  // Determine tier quality
  const tierQuality = getTierQuality(tierNumber, position);
  
  return {
    tierNumber,
    quality: tierQuality,
    players,
    likedPlayers: likedInTier,
    lovedPlayers: lovedInTier,
    stats: {
      avgVorp,
      avgPoints,
      vorpRange: {
        min: players[players.length - 1].vorp,
        max: players[0].vorp
      },
      pointsRange: {
        min: players[players.length - 1].fantasyPts,
        max: players[0].fantasyPts
      }
    },
    priceRange,
    vorpDropToNext,
    isChasm: vorpDropToNext >= VORP_TIER_THRESHOLDS[position] * 1.5, // Major dropoff
    recommendation: generateTierRecommendation(tierNumber, tierQuality, likedInTier, position)
  };
}

function getTierQuality(tierNumber, position) {
  const qualityMap = {
    QB: ['Elite', 'High QB1', 'Low QB1', 'QB2', 'Streaming', 'Deep'],
    RB: ['Elite', 'RB1', 'High RB2', 'Low RB2', 'Flex', 'Depth', 'Handcuff'],
    WR: ['Elite', 'WR1', 'High WR2', 'Low WR2', 'Flex', 'Depth', 'Deep'],
    TE: ['Elite', 'TE1', 'Low TE1', 'Streaming', 'Dart Throw']
  };
  
  const qualities = qualityMap[position];
  return qualities[Math.min(tierNumber - 1, qualities.length - 1)];
}

function generateTierRecommendation(tierNumber, quality, likedPlayers, position) {
  const hasTargets = likedPlayers.length > 0;
  
  if (quality === 'Elite') {
    return {
      priority: 'CRITICAL',
      strategy: hasTargets 
        ? `You have ${likedPlayers.length} elite ${position}s targeted. Secure at least one!`
        : `No targets in elite tier. Be ready to pivot to other positions.`,
      timing: 'Rounds 1-3 for most, earlier for TE'
    };
  }
  
  if (quality.includes('1') && !quality.includes('Low')) {
    return {
      priority: 'HIGH',
      strategy: hasTargets
        ? `Strong ${position}1 options you like. Don't let them all pass by.`
        : `Consider best available at other positions.`,
      timing: `Rounds ${position === 'QB' ? '4-6' : '2-5'}`
    };
  }
  
  if (quality.includes('2')) {
    return {
      priority: 'MEDIUM',
      strategy: hasTargets
        ? `Good depth here with ${likedPlayers.length} targets. Can wait if needed.`
        : `Similar production available later. Focus elsewhere.`,
      timing: `Rounds ${position === 'QB' ? '7-10' : '5-8'}`
    };
  }
  
  return {
    priority: 'LOW',
    strategy: 'Replacement level. Only if you love them or need depth.',
    timing: 'Double-digit rounds or $1-3 in auction'
  };
}

// Analyze tier transitions for strategic advice
export function analyzeTierTransitions(tiers, prefs) {
  const analysis = {
    criticalDecisions: [],
    positionPriority: [],
    draftFlow: []
  };
  
  // Find critical decision points
  Object.entries(tiers).forEach(([position, positionTiers]) => {
    positionTiers.forEach((tier, index) => {
      if (tier.isChasm && tier.likedPlayers.length > 0) {
        analysis.criticalDecisions.push({
          position,
          tier: tier.tierNumber,
          message: `MAJOR DROPOFF after ${tier.quality} ${position}s! Last chance for this tier.`,
          players: tier.likedPlayers,
          urgency: 'CRITICAL'
        });
      }
      
      // Last player in tier strategy
      if (tier.likedPlayers.length === 1 && index < positionTiers.length - 1) {
        const nextTier = positionTiers[index + 1];
        if (nextTier.likedPlayers.length >= 3) {
          analysis.criticalDecisions.push({
            position,
            tier: tier.tierNumber,
            message: `${tier.likedPlayers[0].name} is last in tier, but you have options in next tier.`,
            players: tier.likedPlayers,
            urgency: 'MEDIUM'
          });
        } else {
          analysis.criticalDecisions.push({
            position,
            tier: tier.tierNumber,
            message: `${tier.likedPlayers[0].name} is your last ${tier.quality} option!`,
            players: tier.likedPlayers,
            urgency: 'HIGH'
          });
        }
      }
    });
  });
  
  // Determine position priority based on scarcity
  const positionScarcity = calculatePositionScarcity(tiers);
  analysis.positionPriority = positionScarcity;
  
  // Create draft flow recommendations
  analysis.draftFlow = generateDraftFlow(tiers, positionScarcity);
  
  return analysis;
}

function calculatePositionScarcity(tiers) {
  const scarcity = [];
  
  Object.entries(tiers).forEach(([position, positionTiers]) => {
    // Count liked players in top tiers
    const topTierCount = positionTiers
      .slice(0, 3)
      .reduce((sum, tier) => sum + tier.likedPlayers.length, 0);
    
    // Count total liked players
    const totalLiked = positionTiers
      .reduce((sum, tier) => sum + tier.likedPlayers.length, 0);
    
    // Calculate dropoff severity
    const majorDropoffs = positionTiers.filter(t => t.isChasm).length;
    
    scarcity.push({
      position,
      topTierCount,
      totalLiked,
      majorDropoffs,
      scarcityScore: (topTierCount * 3) + majorDropoffs - (totalLiked * 0.5),
      priority: topTierCount === 0 ? 'SKIP_EARLY' : 
               topTierCount <= 2 ? 'HIGH_PRIORITY' : 
               'NORMAL'
    });
  });
  
  return scarcity.sort((a, b) => b.scarcityScore - a.scarcityScore);
}

function generateDraftFlow(tiers, scarcity) {
  const flow = [];
  const rounds = 16;
  
  for (let round = 1; round <= rounds; round++) {
    const recommendations = [];
    
    // Early rounds (1-3): Focus on elite tiers
    if (round <= 3) {
      scarcity.forEach(pos => {
        if (pos.priority !== 'SKIP_EARLY') {
          const tier = tiers[pos.position][0]; // Elite tier
          if (tier && tier.likedPlayers.length > 0) {
            recommendations.push({
              position: pos.position,
              targets: tier.likedPlayers.slice(0, 3),
              reason: `Elite ${pos.position} opportunity`
            });
          }
        }
      });
    }
    // Middle rounds (4-8): Balance and value
    else if (round <= 8) {
      scarcity.forEach(pos => {
        const relevantTiers = tiers[pos.position].slice(1, 4); // Tiers 2-4
        relevantTiers.forEach(tier => {
          if (tier.likedPlayers.length > 0) {
            recommendations.push({
              position: pos.position,
              targets: tier.likedPlayers.slice(0, 2),
              reason: tier.isChasm ? 'Last chance before dropoff' : 'Good value'
            });
          }
        });
      });
    }
    // Late rounds (9+): Best available and upside
    else {
      Object.entries(tiers).forEach(([position, positionTiers]) => {
        positionTiers.slice(4).forEach(tier => {
          if (tier.lovedPlayers.length > 0) {
            recommendations.push({
              position,
              targets: tier.lovedPlayers,
              reason: 'Late-round love'
            });
          }
        });
      });
    }
    
    flow.push({
      round,
      recommendations: recommendations.slice(0, 4) // Top 4 options
    });
  }
  
  return flow;
}

// Auction-specific analysis
export function generateAuctionStrategy(tiers, budget = 200) {
  const strategy = {
    budgetAllocation: {},
    targetValues: [],
    avoidValues: [],
    nominations: []
  };
  
  // Calculate optimal budget allocation
  const allocation = {
    QB: 0,
    RB: 0,
    WR: 0,
    TE: 0
  };
  
  // Analyze each position
  Object.entries(tiers).forEach(([position, positionTiers]) => {
    let positionBudget = 0;
    
    positionTiers.forEach((tier, index) => {
      if (tier.likedPlayers.length > 0) {
        // Allocate more budget to higher tiers
        const tierMultiplier = Math.max(1, 5 - index);
        const avgPrice = tier.priceRange.avg;
        
        tier.likedPlayers.forEach(player => {
          if (player.auction <= avgPrice * 1.2) {
            strategy.targetValues.push({
              player,
              maxBid: Math.ceil(avgPrice * 1.1),
              reason: `Good value in ${tier.quality} tier`
            });
          }
        });
        
        positionBudget += avgPrice * Math.min(tier.likedPlayers.length, 2) * (tierMultiplier / 5);
      }
    });
    
    allocation[position] = Math.round(positionBudget);
  });
  
  // Normalize to budget
  const totalAllocation = Object.values(allocation).reduce((a, b) => a + b, 0);
  const budgetMultiplier = (budget - 20) / totalAllocation; // Save $20 for bench
  
  Object.keys(allocation).forEach(pos => {
    allocation[pos] = Math.round(allocation[pos] * budgetMultiplier);
  });
  
  strategy.budgetAllocation = allocation;
  
  // Nomination strategy
  strategy.nominations = generateNominationStrategy(tiers);
  
  return strategy;
}

function generateNominationStrategy(tiers) {
  const nominations = [];
  
  // Nominate expensive players you don't want
  Object.values(tiers).forEach(positionTiers => {
    positionTiers[0]?.players.forEach(player => {
      if (player.preference === -1 && player.auction > 30) {
        nominations.push({
          player,
          reason: 'Expensive player you fade - drain budgets',
          priority: 'HIGH'
        });
      }
    });
  });
  
  // Nominate players just above your tier breaks
  Object.values(tiers).forEach(positionTiers => {
    positionTiers.forEach((tier, index) => {
      if (tier.isChasm && index > 0) {
        const prevTier = positionTiers[index - 1];
        const lastPlayer = prevTier.players[prevTier.players.length - 1];
        if (lastPlayer.preference <= 0) {
          nominations.push({
            player: lastPlayer,
            reason: 'Force decision on tier break',
            priority: 'MEDIUM'
          });
        }
      }
    });
  });
  
  return nominations.slice(0, 10); // Top 10 nominations
}