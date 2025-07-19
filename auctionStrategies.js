/* utils/auctionStrategies.js --------------------------------------- */
const BASE = { QB: 1, RB1: 1, RB2: 1, WR1: 1, WR2: 1, WR3: 1, TE: 1, FLEX: 1, DST: .5, K: .5 };

export const STRATEGIES = {
  starsAndScrubs: {
    label: '⭐ Stars & Scrubs',
    // pay up for 3 studs, everything else $1-3
    weights: { ...BASE, RB1: 3, WR1: 3, FLEX: 2, QB: .7, RB2: .8, WR3: .6, TE: .7 },
    nomRules: {
      early: 'toss out elite names you **do not** want (drain budgets)',
      mid  : 'nominate tier-break WR/RB you *do* want at price-enforcing times',
      late : 'sprinkle $1 rookies / handcuffs you like before money is gone'
    }
  },

  balanced: {
    label: '⚖️ Balanced Roster',
    // 5 core starters in the $20-30 range
    weights: { ...BASE, QB: 1.2, RB1: 2.2, RB2: 1.8,
                          WR1: 2.0, WR2: 1.6, WR3: 1.4, TE: 1.2, FLEX: 1.4 },
    nomRules: {
      early: 'nominate 2nd-tier studs at your target slots—let elites go crazy',
      mid  : 'nominate boring vets you dislike (eat others’ $)',
      late : 'attack undervalued tiers that slipped'
    }
  },

  valueHunter: {
    label: '🕵️ Value Hunter',
    // slow-play bankroll, crush the room once bargains start
    weights: { ...BASE, QB: .8, RB1: 1.5, RB2: 1.5,
                          WR1: 1.5, WR2: 1.5, WR3: 1.5, TE: .9, FLEX: 1.2 },
    nomRules: {
      early: 'throw out shiny rookies / break-out hype (let room over-pay)',
      mid  : 'sit back, sprinkle $1 noms, keep bankroll intact',
      late : 'pounce on your “liked” names once avg team bankroll < $40'
    }
  }
};
