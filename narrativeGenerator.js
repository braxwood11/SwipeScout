// src/utils/narrativeGenerator.js

/**
 * Generates personalized narratives based on user preferences and patterns
 */

// Adaptive position-specific thresholds based on available players
const getAdaptiveEliteThreshold = (position, totalPlayers) => {
  // Base thresholds for full player pools
  const baseThresholds = {
    'QB': 10,   // Top 10 QBs
    'RB': 20,   // Top 20 RBs  
    'WR': 25,   // Top 25 WRs
    'TE': 10    // Top 10 TEs
  };
  
  // If we have fewer players, use percentage-based thresholds
  const percentageThreshold = 0.33; // Top 33%
  const adaptiveThreshold = Math.floor(totalPlayers * percentageThreshold);
  
  // Return the smaller of the two (base or adaptive)
  return Math.min(baseThresholds[position] || 10, adaptiveThreshold);
};

export const generateNarrativeInsights = (analysis, prefs, players, position = null) => {
  const narratives = [];
  
  // Determine if this is position-specific or overall
  const isPositionSpecific = position !== null;
  
  // Personality-based narratives
  narratives.push(...generatePersonalityNarratives(analysis, isPositionSpecific));
  
  // Strategy narratives - only for overall or if relevant to position
  if (!isPositionSpecific || ['RB', 'WR'].includes(position)) {
    narratives.push(...generateStrategyNarratives(analysis, players, prefs, position));
  }
  
  // Position-specific narratives
  if (isPositionSpecific) {
    narratives.push(...generatePositionNarratives(position, analysis, players, prefs));
  }
  
  // Contrarian narratives
  narratives.push(...generateContrarianNarratives(analysis, players, prefs, position));
  
  // Risk profile narratives
  narratives.push(...generateRiskNarratives(analysis, players, prefs, position));
  
  // Fallback narratives if we don't have enough
  if (narratives.length < 3) {
    narratives.push(...generateFallbackNarratives(analysis, players, prefs, position));
  }
  
  return narratives.filter(n => n !== null);
};

const generatePersonalityNarratives = (analysis, isPositionSpecific) => {
  const narratives = [];
  const loveRate = parseFloat(analysis.distribution.love);
  const passRate = parseFloat(analysis.distribution.pass);
  
  // Ultra-selective narrative
  if (loveRate < 5) {
    narratives.push({
      type: 'personality',
      priority: 'high',
      title: 'The Perfectionist Scout',
      icon: '🎯',
      summary: `You loved only ${analysis.ratings.love} player${analysis.ratings.love !== 1 ? 's' : ''}${isPositionSpecific ? ' at this position' : ''}.`,
      fullText: `With a love rate of just ${loveRate}%, you're ${isPositionSpecific ? 'extremely selective at this position' : 'one of the most selective drafters we\'ve seen'}. While others fall for every shiny name, you're waiting for perfection. This laser focus means when you do pull the trigger, it's with supreme confidence. Just make sure you have contingency plans - your targets will be in high demand.`,
      actionable: [
        'Be prepared to reach for your loved players',
        'Have backup plans if your targets get sniped',
        isPositionSpecific 
          ? `Consider if you're being too harsh on ${analysis.totalEvaluated} players`
          : 'Consider trading up in drafts to secure your guys'
      ]
    });
  }
  
  // Optimist narrative
  if (loveRate + parseFloat(analysis.distribution.like) > 60) {
    narratives.push({
      type: 'personality',
      priority: 'medium',
      title: 'The Eternal Optimist',
      icon: '😊',
      summary: `You see potential everywhere - ${Math.round(loveRate + parseFloat(analysis.distribution.like))}% positive ratings${isPositionSpecific ? ' at this position' : ''}!`,
      fullText: `Your glass-half-full approach to player evaluation could be a superpower. While others nitpick flaws, you're identifying upside. This positivity bias often correlates with finding league-winning values${isPositionSpecific ? ' at this position' : ''}. Just be careful not to overlook genuine red flags in your enthusiasm.`,
      actionable: [
        'Trust your positive instincts on boom/bust players',
        'Look for your liked players in the middle rounds',
        isPositionSpecific 
          ? `Your enthusiasm for this position could lead to reaching`
          : 'Don\'t be afraid to build unique roster constructions'
      ]
    });
  }
  
  // Skeptic narrative
  if (passRate > 40) {
    narratives.push({
      type: 'personality',
      priority: 'medium',
      title: 'The Skeptical Analyst',
      icon: '🔍',
      summary: `You passed on ${passRate}% of players${isPositionSpecific ? ' at this position' : ''} - you know what you don't want.`,
      fullText: `Your critical eye is a draft day advantage. By eliminating ${analysis.ratings.pass} players from consideration, you've simplified your draft board significantly${isPositionSpecific ? ' for this position' : ''}. This clarity prevents panic picks and reaches. Use your streamlined player pool to plan multiple draft paths.`,
      actionable: [
        'Create detailed tiers from your remaining players',
        'Be ready to pivot when runs happen',
        'Your "do not draft" list is as valuable as your targets'
      ]
    });
  }
  
  return narratives;
};

const generateStrategyNarratives = (analysis, players, prefs, position) => {
  const narratives = [];
  
  // Only generate RB/WR strategy narratives if looking at overall or those specific positions
  if (position && !['RB', 'WR'].includes(position)) {
    return narratives;
  }
  
  // For position-specific views, only show if it's about that position
  if (position === 'RB' && analysis.elitePositionTargets.RB >= 3) {
    narratives.push({
      type: 'strategy',
      priority: 'high',
      title: 'Running Back Whisperer',
      icon: '🏃',
      summary: `You're targeting ${analysis.elitePositionTargets.RB} elite RBs heavily.`,
      fullText: `Your RB preference is clear - you want to dominate on the ground. This approach values floor over ceiling and wants to control games through volume. The key is nailing those selections and having the depth to support them.`,
      actionable: [
        'Consider starting RB-RB in your draft',
        'Target your favorite RBs aggressively',
        'Don\'t forget to handcuff your top backs'
      ],
      relatedPlayers: players.filter(p => p.position === 'RB' && prefs[p.id] === 2).slice(0, 5)
    });
  }
  
  if (position === 'WR' && analysis.elitePositionTargets.WR >= 4) {
    narratives.push({
      type: 'strategy',
      priority: 'high',
      title: 'Air Raid Architect',
      icon: '🎯',
      summary: `You're loving ${analysis.elitePositionTargets.WR} elite WRs.`,
      fullText: `Your preference for wide receivers is clear. By focusing on the position with the most depth, you're positioning yourself to dominate through the air while finding RB value later.`,
      actionable: [
        'Lock in your favorite WRs early',
        'Be patient for RB value in middle rounds',
        'Stack WRs with their QBs when possible'
      ],
      relatedPlayers: players.filter(p => p.position === 'WR' && prefs[p.id] === 2).slice(0, 5)
    });
  }
  
  // Only show overall balanced strategy in overall view
  if (!position && Math.abs(analysis.elitePositionTargets.RB - analysis.elitePositionTargets.WR) <= 1) {
    narratives.push({
      type: 'strategy',
      priority: 'medium',
      title: 'The Balanced Builder',
      icon: '⚖️',
      summary: 'You maintain perfect balance between RB and WR targets.',
      fullText: `Your balanced approach between RBs and WRs suggests adaptability - the mark of a seasoned drafter. You're not married to any single strategy, which means you can capitalize on draft day value regardless of how the board falls.`,
      actionable: [
        'Stay true to your board regardless of runs',
        'Be the one who starts the second wave of a position run',
        'Focus on best player available'
      ]
    });
  }
  
  return narratives;
};

const generatePositionNarratives = (position, analysis, players, prefs) => {
  const narratives = [];
  const positionPlayers = players.filter(p => p.position === position);
  const lovedAtPosition = positionPlayers.filter(p => prefs[p.id] === 2);
  const hatedAtPosition = positionPlayers.filter(p => prefs[p.id] === -1);
  
  switch(position) {
    case 'QB':
      narratives.push(...generateQBNarratives(lovedAtPosition, hatedAtPosition, analysis, positionPlayers));
      break;
    case 'RB':
      narratives.push(...generateRBNarratives(lovedAtPosition, hatedAtPosition, positionPlayers, prefs));
      break;
    case 'WR':
      narratives.push(...generateWRNarratives(lovedAtPosition, hatedAtPosition, positionPlayers, prefs));
      break;
    case 'TE':
      narratives.push(...generateTENarratives(lovedAtPosition, hatedAtPosition, analysis, positionPlayers));
      break;
  }
  
  return narratives;
};

const generateQBNarratives = (loved, hated, analysis, allQBs) => {
  const narratives = [];
  
  // Sort QBs by fantasy points to determine elite tier
  const sortedQBs = [...allQBs].sort((a, b) => b.fantasyPts - a.fantasyPts);
  
  // Adaptive elite threshold based on available QBs
  const eliteCount = Math.min(6, Math.floor(allQBs.length * 0.25)); // Top 25% or 6, whichever is less
  const eliteThreshold = sortedQBs[eliteCount - 1]?.fantasyPts || 300;
  
  const eliteQBs = loved.filter(qb => qb.fantasyPts >= eliteThreshold);
  
  // Adaptive threshold - if few QBs available, be less strict
  const minEliteRequired = allQBs.length <= 25 ? 1 : 2;
  
  if (eliteQBs.length >= minEliteRequired) {
    narratives.push({
      type: 'position',
      priority: 'high',
      title: 'Elite QB Theory Believer',
      icon: '⚡',
      summary: `You're targeting ${eliteQBs.length} elite QBs for a difference-making advantage.`,
      fullText: `Your love for elite QBs like ${eliteQBs.map(q => q.name).join(' and ')} shows you believe in paying up for the position. The top QBs can provide a 5-8 point weekly advantage - that's a massive edge over a full season. Just ensure you're not reaching too early and missing out on RB/WR depth.`,
      actionable: [
        `Target ${eliteQBs[0].name} in rounds 3-5`,
        'Have a clear backup plan if your QB1 gets sniped',
        'Consider stacking with their pass catchers'
      ]
    });
  }
  
  // Late QB narrative - check if no loved QBs or only lower-tier ones
  const lateQBCount = Math.min(12, Math.floor(allQBs.length * 0.5)); // Top 50% or 12
  const lateQBThreshold = sortedQBs[lateQBCount - 1]?.fantasyPts || 250;
  
  if (loved.length === 0 || loved.every(qb => qb.fantasyPts < lateQBThreshold)) {
    narratives.push({
      type: 'position',
      priority: 'medium',
      title: 'Late-Round QB Specialist',
      icon: '🎲',
      summary: 'You\'re punting the QB position to load up elsewhere.',
      fullText: `By waiting on QB, you're following a time-tested strategy. The depth at QB means you can find startable options late while building dominant RB/WR groups. Your approach suggests you understand the replaceability of the position. Just make sure to grab two QBs you believe in.`,
      actionable: [
        'Wait until rounds 8-10 for your QB1',
        'Target QBs with rushing upside for ceiling',
        'Grab two QBs with different bye weeks'
      ]
    });
  }
  
  return narratives;
};

const generateRBNarratives = (loved, hated, allRBs, prefs) => {
  const narratives = [];
  
  // Adaptive thresholds based on pool size
  const minWorkhorses = allRBs.length <= 50 ? 2 : 3;
  const minYoungRBs = allRBs.length <= 50 ? 2 : 2; // Keep at 2
  const minReceivers = 2; // Keep at 2
  
  // Workhorse preference - only if we have touch projections
  const workhorses = loved.filter(rb => rb.projectedTouches && rb.projectedTouches > 250);
  if (workhorses.length >= minWorkhorses) {
    narratives.push({
      type: 'position',
      priority: 'high',
      title: 'Volume is King',
      icon: '👑',
      summary: `You're targeting ${workhorses.length} workhorse backs who project for 250+ touches.`,
      fullText: `Your preference for high-volume backs like ${workhorses.slice(0, 3).map(r => r.name).join(', ')} shows you value floor and consistency. These backs might not have the highest ceilings, but their week-to-week reliability wins championships. Volume is the most predictable fantasy metric.`,
      actionable: [
        'Prioritize these backs even if it means reaching slightly',
        'Handcuff your workhorses for insurance',
        'Avoid committee backfields in your RB3/4 spots too'
      ]
    });
  }
  
  // Rookie/young RB preference
  const youngLoved = loved.filter(rb => rb.rookie || (rb.experience && rb.experience <= 2));
  if (youngLoved.length >= 2) {
    narratives.push({
      type: 'position',
      priority: 'medium',
      title: 'Youth Movement',
      icon: '🌟',
      summary: `You're betting on ${youngLoved.length} young RBs with upside.`,
      fullText: `Your faith in young backs like ${youngLoved.slice(0, 2).map(r => r.name).join(' and ')} suggests you're chasing upside and breakout potential. Young RBs often provide the best fantasy value as they get expanded roles. Just balance with some proven veterans for stability.`,
      actionable: [
        'Target your young RBs a round early to ensure you get them',
        'Mix in some proven veterans for stability',
        'Monitor training camp reports closely for role changes'
      ]
    });
  }
  
  // Pass-catching back preference
  const receivers = loved.filter(rb => rb.projectedReceptions && rb.projectedReceptions > 50);
  if (receivers.length >= 2) {
    narratives.push({
      type: 'position',
      priority: 'medium',
      title: 'PPR Specialist',
      icon: '🎯',
      summary: `You favor pass-catching backs with ${receivers.length} reception monsters targeted.`,
      fullText: `Your love for receiving backs shows sophisticated thinking. In PPR formats, these players provide both floor and ceiling. Players like ${receivers[0].name} can be RB1s without dominating carries.`,
      actionable: [
        'These backs are perfect for PPR leagues',
        'They pair well with early-down bruisers',
        'Target them in the middle rounds for value'
      ]
    });
  }
  
  return narratives;
};

const generateWRNarratives = (loved, hated, allWRs, prefs) => {
  const narratives = [];
  
  // Adaptive thresholds
  const minTargetHogs = allWRs.length <= 50 ? 2 : 3;
  const minBigPlayGuys = 2; // Keep at 2
  const minSlotGuys = 2; // Keep at 2
  
  // Target hog preference - only if we have target projections
  const targetHogs = loved.filter(wr => wr.projectedTargets && wr.projectedTargets > 140);
  if (targetHogs.length >= minTargetHogs) {
    narratives.push({
      type: 'position',
      priority: 'high',
      title: 'Target Share Hunter',
      icon: '🎯',
      summary: `You love WRs who dominate targets, with ${targetHogs.length} players projected for 140+.`,
      fullText: `Your focus on high-target receivers like ${targetHogs.slice(0, 3).map(w => w.name).join(', ')} reveals a PPR-minded approach. You understand that opportunity trumps talent in fantasy. These target hogs provide the safest floors and often have the highest ceilings too.`,
      actionable: [
        'These WRs are perfect for PPR leagues',
        'Don\'t overlook them in standard scoring either',
        'Stack them with their QBs when possible'
      ]
    });
  }
  
  // Big play preference - only if we have YPR data
  const bigPlayGuys = loved.filter(wr => wr.yardsPerReception && wr.yardsPerReception > 14);
  if (bigPlayGuys.length >= 2) {
    narratives.push({
      type: 'position',
      priority: 'medium',
      title: 'Big Play Hunter',
      icon: '💥',
      summary: 'You favor explosive receivers who stretch the field.',
      fullText: `Your preference for deep threats like ${bigPlayGuys.slice(0, 2).map(w => w.name).join(' and ')} shows you're not afraid of volatility. These players can win you weeks with a single catch but might also disappear at times. It's a high-risk, high-reward approach that pairs well with consistent players at other positions.`,
      actionable: [
        'Balance these boom/bust players with high-floor options',
        'They make excellent FLEX plays',
        'Target them in best ball formats especially'
      ]
    });
  }
  
  // Slot receiver preference
  const slotGuys = loved.filter(wr => wr.catchRate && wr.catchRate > 0.75);
  if (slotGuys.length >= 2) {
    narratives.push({
      type: 'position',
      priority: 'medium',
      title: 'Possession Receiver Fan',
      icon: '🎪',
      summary: `You appreciate reliable possession receivers.`,
      fullText: `Your love for high catch-rate receivers shows you value consistency. These players might not break many big plays, but they move the chains and provide reliable fantasy production week after week.`,
      actionable: [
        'These players excel in PPR formats',
        'They\'re great WR2/3 options for stability',
        'Often undervalued in drafts'
      ]
    });
  }
  
  return narratives;
};

const generateTENarratives = (loved, hated, analysis, allTEs) => {
  const narratives = [];
  
  // Sort TEs by fantasy points to determine elite tier
  const sortedTEs = [...allTEs].sort((a, b) => b.fantasyPts - a.fantasyPts);
  
  // Adaptive elite threshold
  const eliteCount = Math.min(4, Math.floor(allTEs.length * 0.2)); // Top 20% or 4
  const eliteThreshold = sortedTEs[eliteCount - 1]?.fantasyPts || 150;
  
  // Elite TE strategy
  const eliteTEs = loved.filter(te => te.fantasyPts >= eliteThreshold);
  if (eliteTEs.length >= 1) {
    narratives.push({
      type: 'position',
      priority: 'high',
      title: 'Tight End Advantage Seeker',
      icon: '🎪',
      summary: `You're investing in the scarce TE position with ${loved.length} targets.`,
      fullText: `Your willingness to invest in elite TEs like ${eliteTEs.map(te => te.name).join(' and ')} shows sophisticated thinking. The positional advantage from an elite TE can be massive - often 8-10 points per week over streaming options. You're setting up for a major edge.`,
      actionable: [
        'Be willing to take your TE1 in rounds 2-4',
        'Consider taking two top-8 TEs for trade leverage',
        'Pair with late-round QB strategy for balance'
      ]
    });
  }
  
  // TE punt strategy
  const lateCount = Math.min(12, Math.floor(allTEs.length * 0.6)); // Top 60% or 12
  const lateThreshold = sortedTEs[lateCount - 1]?.fantasyPts || 100;
  
  if (loved.length === 0 || loved.every(te => te.fantasyPts < lateThreshold)) {
    narratives.push({
      type: 'position',
      priority: 'medium',
      title: 'Tight End Streamer',
      icon: '🔄',
      summary: 'You\'re punting TE to focus resources elsewhere.',
      fullText: `By fading the TE position, you're accepting weekly disadvantage there to build strength at RB/WR. This strategy works best if you're willing to be active on waivers and stream based on matchups. The saved draft capital can create powerful RB/WR rooms.`,
      actionable: [
        'Wait until round 10+ for your first TE',
        'Draft 2-3 upside TEs late',
        'Be aggressive on the waiver wire',
        'Target TEs against weak defenses weekly'
      ]
    });
  }
  
  return narratives;
};

const generateContrarianNarratives = (analysis, players, prefs, position) => {
  const narratives = [];
  
  // Filter to only players at the specified position (or all if no position)
  const relevantPlayers = position 
    ? players.filter(p => p.position === position)
    : players;
  
  // Get adaptive elite threshold
  const threshold = position 
    ? getAdaptiveEliteThreshold(position, relevantPlayers.length) 
    : null;
  
  // Sort by fantasy points and get elite players
  const sortedPlayers = [...relevantPlayers].sort((a, b) => b.fantasyPts - a.fantasyPts);
  
  // Determine elite players based on position
  let elitePlayers;
  if (position) {
    elitePlayers = sortedPlayers.slice(0, threshold);
  } else {
    // For overall, get top players from each position
    elitePlayers = [];
    ['QB', 'RB', 'WR', 'TE'].forEach(pos => {
      const posPlayers = players.filter(p => p.position === pos);
      const posThreshold = getAdaptiveEliteThreshold(pos, posPlayers.length);
      const positionElites = posPlayers
        .sort((a, b) => b.fantasyPts - a.fantasyPts)
        .slice(0, posThreshold);
      elitePlayers.push(...positionElites);
    });
  }
  
  const fadedElites = elitePlayers.filter(p => prefs[p.id] === -1);
  
  // Adaptive minimum fades required based on player pool size
  const minFadesRequired = relevantPlayers.length <= 30 ? 2 : 3;
  
  if (fadedElites.length >= minFadesRequired) {
    const displayCount = position ? 3 : 5;
    narratives.push({
      type: 'contrarian',
      priority: 'high',
      title: 'The Contrarian',
      icon: '🔄',
      summary: `You're fading ${fadedElites.length} consensus top-${threshold || 'tier'} ${position || 'players'}.`,
      fullText: `Your willingness to fade popular ${position || 'players'} like ${fadedElites.slice(0, displayCount).map(p => p.name).join(', ')} shows independent thinking. While risky, contrarian drafters who hit often build the most unique and powerful rosters. Just ensure your fades are based on process, not just gut feeling.`,
      actionable: [
        'Document why you\'re fading each player',
        'Be prepared for these players to fall to you anyway',
        'Have contingency plans if you\'re wrong',
        position ? `Trust your evaluation of ${position}s` : 'Stay consistent across positions'
      ],
      relatedPlayers: fadedElites.slice(0, 5)
    });
  }
  
  // Find sleepers - players loved but ranked low
  const bottomHalf = sortedPlayers.slice(Math.floor(sortedPlayers.length / 2));
  const lovedSleepers = bottomHalf.filter(p => prefs[p.id] === 2);
  
  // Adaptive minimum sleepers required
  const minSleepersRequired = relevantPlayers.length <= 30 ? 1 : 2;
  
  if (lovedSleepers.length >= minSleepersRequired) {
    narratives.push({
      type: 'contrarian',
      priority: 'medium',
      title: 'The Sleeper Hunter',
      icon: '💎',
      summary: `You've identified ${lovedSleepers.length} deep ${position || 'sleepers'} others will miss.`,
      fullText: `Your love for ${position ? 'lower-ranked ' + position + 's' : 'players'} like ${lovedSleepers.slice(0, 3).map(p => p.name).join(', ')} who are being overlooked shows you're doing your own research. These are the picks that win leagues when they hit. The fact you're confident enough to love them speaks volumes.`,
      actionable: [
        'Don\'t reach too early for your sleepers',
        'Target them 1-2 rounds before their ADP',
        'Grab multiple shots at your sleeper thesis',
        position ? `These ${position}s could be league winners` : 'Trust your evaluation process'
      ]
    });
  }
  
  return narratives;
};

const generateRiskNarratives = (analysis, players, prefs, position) => {
  const narratives = [];
  
  // Filter to relevant players
  const relevantPlayers = position 
    ? players.filter(p => p.position === position)
    : players;
  
  const lovedPlayers = relevantPlayers.filter(p => prefs[p.id] === 2);
  
  // Calculate risk metrics
  const rookieCount = lovedPlayers.filter(p => p.rookie).length;
  const youngCount = lovedPlayers.filter(p => p.experience && p.experience <= 2).length;
  const veteranCount = lovedPlayers.filter(p => p.experience && p.experience >= 8).length;
  
  // Adaptive thresholds based on pool size
  const minRookiesForRisk = relevantPlayers.length <= 50 ? 1 : 2;
  const minYoungForRisk = relevantPlayers.length <= 50 ? 2 : 3;
  const minVeteransForSafe = relevantPlayers.length <= 50 ? 2 : 3;
  
  // High risk tolerance
  if (rookieCount >= minRookiesForRisk || (youngCount >= minYoungForRisk && position)) {
    narratives.push({
      type: 'risk',
      priority: 'high',
      title: 'High Risk, High Reward',
      icon: '🎲',
      summary: `You're betting big on youth${position ? ' at ' + position : ''} with ${rookieCount} rookies${youngCount > rookieCount ? ' and ' + (youngCount - rookieCount) + ' second-year players' : ''} loved.`,
      fullText: `Your portfolio shows massive risk tolerance${position ? ' at the ' + position + ' position' : ''}. You're chasing league-winning upside over safe floors. This approach can yield spectacular results but requires strong contingency planning. ${rookieCount > 0 ? 'Rookies often start slow but can explode in the second half.' : 'Young players have the highest ceiling but also the highest bust rate.'}`,
      actionable: [
        'Balance your youth with some proven veterans',
        'Have multiple shots at each thesis',
        'Be patient - young players often need time',
        position ? `Don't put all your ${position} eggs in the youth basket` : 'Diversify risk across positions'
      ]
    });
  }
  
  // Risk averse
  if (rookieCount === 0 && veteranCount >= minVeteransForSafe && lovedPlayers.length >= minVeteransForSafe) {
    narratives.push({
      type: 'risk',
      priority: 'medium',
      title: 'The Safe Harbor',
      icon: '🛡️',
      summary: `You prefer proven veterans${position ? ' at ' + position : ''} over risky upside plays.`,
      fullText: `Your love for established veterans shows risk aversion${position ? ' at the ' + position + ' position' : ''} - and that's not bad! You're prioritizing floor over ceiling, which often leads to consistent playoff teams. While you might miss the league-winner, you're also avoiding the busts that sink seasons.`,
      actionable: [
        'Your strategy works best in standard leagues',
        'Consider taking 1-2 upside swings late',
        'Focus on winning the draft, not the lottery',
        'Your consistency approach often wins'
      ]
    });
  }
  
  // Injury risk tolerance (if we have injury data)
  const injuryProneCount = lovedPlayers.filter(p => p.injuryHistory).length;
  const minInjuryProneForNarrative = relevantPlayers.length <= 50 ? 1 : 2;
  
  if (injuryProneCount >= minInjuryProneForNarrative) {
    narratives.push({
      type: 'risk',
      priority: 'medium',
      title: 'Injury Risk Tolerance',
      icon: '🏥',
      summary: `You're not scared off by injury history${position ? ' at ' + position : ''}.`,
      fullText: `${injuryProneCount} of your loved players have significant injury history. This shows you're willing to bet on talent over health. When these players stay on the field, they often provide league-winning value. Just make sure you have quality depth behind them.`,
      actionable: [
        'Handcuff or backup these players specifically',
        'Draft depth at these positions',
        'Monitor practice reports closely',
        'Have pivot plans ready'
      ]
    });
  }
  
  return narratives;
};

// Helper function to sort narratives by priority and relevance
export const prioritizeNarratives = (narratives, limit = 6) => {
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  
  return narratives
    .sort((a, b) => {
      const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      
      // Secondary sort by whether they have related players
      const aHasPlayers = a.relatedPlayers && a.relatedPlayers.length > 0;
      const bHasPlayers = b.relatedPlayers && b.relatedPlayers.length > 0;
      if (aHasPlayers && !bHasPlayers) return -1;
      if (!aHasPlayers && bHasPlayers) return 1;
      
      return 0;
    })
    .slice(0, limit);
};

// Fallback narratives for small player pools
const generateFallbackNarratives = (analysis, players, prefs, position) => {
  const narratives = [];
  const relevantPlayers = position 
    ? players.filter(p => p.position === position)
    : players;
  
  // Basic evaluation summary
  if (analysis.totalEvaluated > 0) {
    narratives.push({
      type: 'summary',
      priority: 'medium',
      title: 'Evaluation Summary',
      icon: '📊',
      summary: `You've evaluated ${analysis.totalEvaluated} ${position || 'players'} so far.`,
      fullText: `Your evaluations show ${analysis.ratings.love} loved, ${analysis.ratings.like} liked, ${analysis.ratings.meh} neutral, and ${analysis.ratings.pass} passed. ${analysis.ratings.love === 0 ? 'You haven\'t found your must-have players yet - keep swiping!' : 'You\'ve identified some key targets to build around.'}`,
      actionable: [
        analysis.ratings.love === 0 ? 'Keep swiping to find players you love' : 'Focus on securing your loved players',
        'Use your tier rankings to plan draft strategy',
        position ? `Consider evaluating more ${position}s for better insights` : 'Complete all positions for full analysis'
      ]
    });
  }
  
  // Top targets narrative if any loved players
  const lovedPlayers = relevantPlayers.filter(p => prefs[p.id] === 2);
  if (lovedPlayers.length > 0) {
    narratives.push({
      type: 'targets',
      priority: 'high',
      title: 'Your Top Targets',
      icon: '🎯',
      summary: `You've identified ${lovedPlayers.length} must-have ${position || 'players'}.`,
      fullText: `Your top targets are ${lovedPlayers.slice(0, 3).map(p => p.name).join(', ')}${lovedPlayers.length > 3 ? ' and others' : ''}. These players will form the core of your draft strategy. Be prepared to reach for them if necessary.`,
      actionable: [
        'Rank these players within your loved tier',
        'Identify which rounds to target each player',
        'Have backup plans if they get drafted early'
      ],
      relatedPlayers: lovedPlayers.slice(0, 5)
    });
  }
  
  // Value finding narrative
  const valuePlayers = relevantPlayers.filter(p => 
    prefs[p.id] >= 1 && p.auction <= 10
  );
  if (valuePlayers.length > 0) {
    narratives.push({
      type: 'value',
      priority: 'medium',
      title: 'Value Finder',
      icon: '💰',
      summary: `You've spotted ${valuePlayers.length} potential value picks.`,
      fullText: `Players like ${valuePlayers.slice(0, 2).map(p => p.name).join(' and ')} offer strong value at their price points. These late-round targets could be league winners if they hit.`,
      actionable: [
        'Target these players in later rounds',
        'Consider stacking multiple value picks',
        'Monitor news for potential breakouts'
      ]
    });
  }
  
  return narratives;
};

// Export individual generators for flexibility
export {
  generatePersonalityNarratives,
  generateStrategyNarratives,
  generatePositionNarratives,
  generateContrarianNarratives,
  generateRiskNarratives,
  generateFallbackNarratives
};