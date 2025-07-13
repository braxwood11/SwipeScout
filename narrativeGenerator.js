// src/utils/narrativeGenerator.js

/**
 * Generates personalized narratives based on user preferences and patterns
 */

export const generateNarrativeInsights = (analysis, prefs, players, position = null) => {
  const narratives = [];
  
  // Personality-based narratives
  narratives.push(...generatePersonalityNarratives(analysis));
  
  // Strategy-based narratives
  narratives.push(...generateStrategyNarratives(analysis, players, prefs));
  
  // Position-specific narratives
  if (position) {
    narratives.push(...generatePositionNarratives(position, analysis, players, prefs));
  }
  
  // Contrarian narratives
  narratives.push(...generateContrarianNarratives(analysis, players, prefs));
  
  // Risk profile narratives
  narratives.push(...generateRiskNarratives(analysis, players, prefs));
  
  return narratives.filter(n => n !== null);
};

const generatePersonalityNarratives = (analysis) => {
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
      summary: `You loved only ${analysis.ratings.love} players across all positions.`,
      fullText: `With a love rate of just ${loveRate}%, you're one of the most selective drafters we've seen. While others fall for every shiny name, you're waiting for perfection. This laser focus means when you do pull the trigger, it's with supreme confidence. Just make sure you have contingency plans - your targets will be in high demand.`,
      actionable: [
        'Be prepared to reach for your loved players',
        'Have backup plans if your targets get sniped',
        'Consider trading up in drafts to secure your guys'
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
      summary: `You see potential everywhere - ${Math.round(loveRate + parseFloat(analysis.distribution.like))}% positive ratings!`,
      fullText: `Your glass-half-full approach to player evaluation could be a superpower. While others nitpick flaws, you're identifying upside. This positivity bias often correlates with finding league-winning values. Just be careful not to overlook genuine red flags in your enthusiasm.`,
      actionable: [
        'Trust your positive instincts on boom/bust players',
        'Look for your liked players in the middle rounds',
        'Don\'t be afraid to build unique roster constructions'
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
      summary: `You passed on ${passRate}% of players - you know what you don't want.`,
      fullText: `Your critical eye is a draft day advantage. By eliminating ${analysis.ratings.pass} players from consideration, you've simplified your draft board significantly. This clarity prevents panic picks and reaches. Use your streamlined player pool to plan multiple draft paths.`,
      actionable: [
        'Create detailed tiers from your remaining players',
        'Be ready to pivot when runs happen',
        'Your "do not draft" list is as valuable as your targets'
      ]
    });
  }
  
  return narratives;
};

const generateStrategyNarratives = (analysis, players, prefs) => {
  const narratives = [];
  
  // RB-heavy narrative
  if (analysis.elitePositionTargets.RB >= 4 && analysis.elitePositionTargets.WR <= 2) {
    narratives.push({
      type: 'strategy',
      priority: 'high',
      title: 'Running Back Whisperer',
      icon: '🏃',
      summary: `You're all-in on the ground game with ${analysis.elitePositionTargets.RB} elite RB targets.`,
      fullText: `While the fantasy community debates "Zero RB," you're zagging hard in the opposite direction. Your RB-heavy approach suggests you value floor over ceiling and want to control games through volume. History shows that RB-heavy teams can dominate when they hit on their picks. The key is nailing those early selections.`,
      actionable: [
        'Consider starting RB-RB or even RB-RB-RB',
        'Target high-upside WRs in rounds 4-7',
        'Handcuff your top RBs for safety'
      ],
      relatedPlayers: players.filter(p => p.position === 'RB' && prefs[p.id] === 2).slice(0, 5)
    });
  }
  
  // WR-heavy narrative
  if (analysis.elitePositionTargets.WR >= 5 && analysis.elitePositionTargets.RB <= 1) {
    narratives.push({
      type: 'strategy',
      priority: 'high',
      title: 'Air Raid Architect',
      icon: '🎯',
      summary: `You're building through the air with ${analysis.elitePositionTargets.WR} elite WR targets.`,
      fullText: `Your preference for wide receivers aligns with modern NFL trends. By fading the RB position, you're betting on the continued passing evolution. This strategy often yields the highest-scoring teams when executed well. The challenge is finding RB value later while everyone else is desperate.`,
      actionable: [
        'Lock in 3-4 elite WRs early',
        'Target pass-catching RBs in the middle rounds',
        'Stream RBs based on matchups if needed'
      ],
      relatedPlayers: players.filter(p => p.position === 'WR' && prefs[p.id] === 2).slice(0, 5)
    });
  }
  
  // Balanced approach
  if (Math.abs(analysis.elitePositionTargets.RB - analysis.elitePositionTargets.WR) <= 1) {
    narratives.push({
      type: 'strategy',
      priority: 'medium',
      title: 'The Balanced Builder',
      icon: '⚖️',
      summary: 'You maintain perfect position balance in your targets.',
      fullText: `Your balanced approach between RBs and WRs suggests adaptability - the mark of a seasoned drafter. You're not married to any single strategy, which means you can capitalize on draft day value regardless of how the board falls. This flexibility often leads to the most complete rosters.`,
      actionable: [
        'Stay true to your board regardless of runs',
        'Be the one who starts the second wave of a position run',
        'Focus on value over position in the middle rounds'
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
      narratives.push(...generateQBNarratives(lovedAtPosition, hatedAtPosition, analysis));
      break;
    case 'RB':
      narratives.push(...generateRBNarratives(lovedAtPosition, hatedAtPosition, positionPlayers, prefs));
      break;
    case 'WR':
      narratives.push(...generateWRNarratives(lovedAtPosition, hatedAtPosition, positionPlayers, prefs));
      break;
    case 'TE':
      narratives.push(...generateTENarratives(lovedAtPosition, hatedAtPosition, analysis));
      break;
  }
  
  return narratives;
};

const generateQBNarratives = (loved, hated, analysis) => {
  const narratives = [];
  
  // Elite QB strategy
  const eliteQBs = loved.filter(qb => qb.fantasyPts > 300);
  if (eliteQBs.length >= 2) {
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
        'Consider superflex leagues where QBs are even more valuable'
      ]
    });
  }
  
  // Late QB narrative
  if (loved.length === 0 || loved.every(qb => qb.fantasyPts < 250)) {
    narratives.push({
      type: 'position',
      priority: 'medium',
      title: 'Late-Round QB Specialist',
      icon: '🎲',
      summary: 'You\'re punting the QB position to load up elsewhere.',
      fullText: `By waiting on QB, you're following a time-tested strategy. The depth at QB means you can find startable options late while building dominant RB/WR groups. Your approach suggests you understand the replaceability of the position. Just make sure to grab two QBs you believe in.`,
      actionable: [
        'Wait until rounds 8-10 for your QB1',
        'Target QBs with rushing upside',
        'Grab a high-upside backup with a different bye week'
      ]
    });
  }
  
  return narratives;
};

const generateRBNarratives = (loved, hated, allRBs, prefs) => {
  const narratives = [];
  
  // Workhorse preference
  const workhorses = loved.filter(rb => rb.projectedTouches && rb.projectedTouches > 250);
  if (workhorses.length >= 3) {
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
  
  // Young RB preference
  const youngLoved = loved.filter(rb => rb.experience && rb.experience <= 2);
  if (youngLoved.length >= 3) {
    narratives.push({
      type: 'position',
      priority: 'medium',
      title: 'Youth Movement',
      icon: '🌟',
      summary: `You love young RBs with ${youngLoved.length} sophomore or rookie targets.`,
      fullText: `Your faith in young backs suggests you're chasing upside and breakout potential. Second-year RBs historically provide the best fantasy value as they get expanded roles. Just remember that youth also brings volatility - have some stable veterans to balance your roster.`,
      actionable: [
        'Target your young RBs a round early to ensure you get them',
        'Mix in some proven veterans for stability',
        'Monitor training camp reports closely for role changes'
      ]
    });
  }
  
  return narratives;
};

const generateWRNarratives = (loved, hated, allWRs, prefs) => {
  const narratives = [];
  
  // Target hog preference
  const targetHogs = loved.filter(wr => wr.projectedTargets && wr.projectedTargets > 140);
  if (targetHogs.length >= 3) {
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
  
  // Big play preference
  const bigPlayGuys = loved.filter(wr => wr.yardsPerReception && wr.yardsPerReception > 14);
  if (bigPlayGuys.length >= 2) {
    narratives.push({
      type: 'position',
      priority: 'medium',
      title: 'Big Play Hunter',
      icon: '💥',
      summary: 'You favor explosive receivers who stretch the field.',
      fullText: `Your preference for deep threats shows you're not afraid of volatility. These players can win you weeks with a single catch but might also disappear at times. It's a high-risk, high-reward approach that pairs well with consistent players at other positions.`,
      actionable: [
        'Balance these boom/bust players with high-floor options',
        'They make excellent FLEX plays',
        'Target them in best ball formats especially'
      ]
    });
  }
  
  return narratives;
};

const generateTENarratives = (loved, hated, analysis) => {
  const narratives = [];
  
  // Elite TE strategy
  if (loved.length >= 2 && loved.some(te => te.fantasyPts > 150)) {
    narratives.push({
      type: 'position',
      priority: 'high',
      title: 'Tight End Advantage Seeker',
      icon: '🎪',
      summary: `You're investing in the scarce TE position with ${loved.length} targets.`,
      fullText: `Your willingness to invest in TEs shows sophisticated thinking. The positional advantage from an elite TE can be massive - often 8-10 points per week over streaming options. With ${loved.map(te => te.name).join(' and ')} on your radar, you're setting up for a major edge.`,
      actionable: [
        'Be willing to take your TE1 in rounds 2-4',
        'Consider taking two top-8 TEs for trade leverage',
        'Avoid TE purgatory - go elite or wait'
      ]
    });
  }
  
  // TE punt strategy
  if (loved.length === 0 || (loved.length === 1 && loved[0].fantasyPts < 100)) {
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
        'Be aggressive on the waiver wire'
      ]
    });
  }
  
  return narratives;
};

const generateContrarianNarratives = (analysis, players, prefs) => {
  const narratives = [];
  
  // Find consensus top players that user hates
  const topPlayers = players
    .sort((a, b) => b.fantasyPts - a.fantasyPts)
    .slice(0, 50);
  
  const fadedElites = topPlayers.filter(p => prefs[p.id] === -1);
  
  if (fadedElites.length >= 5) {
    narratives.push({
      type: 'contrarian',
      priority: 'high',
      title: 'The Contrarian',
      icon: '🔄',
      summary: `You're fading ${fadedElites.length} consensus top-50 players.`,
      fullText: `Your willingness to fade popular players like ${fadedElites.slice(0, 3).map(p => p.name).join(', ')} shows independent thinking. While risky, contrarian drafters who hit often build the most unique and powerful rosters. Just ensure your fades are based on process, not just gut feeling.`,
      actionable: [
        'Document why you\'re fading each player',
        'Be prepared for these players to fall to you anyway',
        'Have contingency plans if you\'re wrong'
      ],
      relatedPlayers: fadedElites.slice(0, 5)
    });
  }
  
  // Find lower-ranked players that user loves
  const bottomHalf = players
    .sort((a, b) => b.fantasyPts - a.fantasyPts)
    .slice(Math.floor(players.length / 2));
  
  const lovedSleepers = bottomHalf.filter(p => prefs[p.id] === 2);
  
  if (lovedSleepers.length >= 3) {
    narratives.push({
      type: 'contrarian',
      priority: 'medium',
      title: 'The Sleeper Hunter',
      icon: '💎',
      summary: `You've identified ${lovedSleepers.length} deep sleepers others will miss.`,
      fullText: `Your love for players like ${lovedSleepers.slice(0, 3).map(p => p.name).join(', ')} who are being overlooked shows you're doing your own research. These are the picks that win leagues when they hit. The fact you're confident enough to love them speaks volumes.`,
      actionable: [
        'Don\'t reach too early for your sleepers',
        'Target them 1-2 rounds before their ADP',
        'Grab multiple shots at your sleeper thesis'
      ]
    });
  }
  
  return narratives;
};

const generateRiskNarratives = (analysis, players, prefs) => {
  const narratives = [];
  const lovedPlayers = players.filter(p => prefs[p.id] === 2);
  
  // Calculate risk metrics
  const rookieCount = lovedPlayers.filter(p => p.rookie).length;
  const youngCount = lovedPlayers.filter(p => p.experience && p.experience <= 2).length;
  const veteranCount = lovedPlayers.filter(p => p.experience && p.experience >= 8).length;
  
  // High risk tolerance
  if (rookieCount >= 3 || youngCount >= 5) {
    narratives.push({
      type: 'risk',
      priority: 'high',
      title: 'High Risk, High Reward',
      icon: '🎲',
      summary: `You're betting big on youth with ${rookieCount} rookies and ${youngCount} young players loved.`,
      fullText: `Your portfolio shows massive risk tolerance. You're chasing league-winning upside over safe floors. This approach can yield spectacular results but requires strong contingency planning. History shows that 2-3 rookies break out huge each year - you're positioned to catch them.`,
      actionable: [
        'Balance your youth with some proven veterans',
        'Have multiple shots at each thesis',
        'Be patient - rookies often start slow'
      ]
    });
  }
  
  // Risk averse
  if (rookieCount === 0 && veteranCount >= 5) {
    narratives.push({
      type: 'risk',
      priority: 'medium',
      title: 'The Safe Harbor',
      icon: '🛡️',
      summary: 'You prefer proven veterans over risky upside plays.',
      fullText: `Your love for established veterans shows risk aversion - and that's not bad! You're prioritizing floor over ceiling, which often leads to consistent playoff teams. While you might miss the league-winner, you're also avoiding the busts that sink seasons.`,
      actionable: [
        'Your strategy works best in standard leagues',
        'Consider taking 1-2 upside swings late',
        'Focus on winning the draft, not the lottery'
      ]
    });
  }
  
  return narratives;
};

// Helper function to sort narratives by priority and relevance
export const prioritizeNarratives = (narratives, limit = 5) => {
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

// Export individual generators for flexibility
export {
  generatePersonalityNarratives,
  generateStrategyNarratives,
  generatePositionNarratives,
  generateContrarianNarratives,
  generateRiskNarratives
};