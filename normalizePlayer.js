// src/utils/normalizePlayer.js
export function normalizePlayer(row, index) {
  return {
    /* unique id for React & localStorage.
       In a real app you’d use an NFL player-id; for now index is fine. */
    id: index,

    // rename the awkward column headers →
    name: row["Player Name"],
    team: row.Team,
    position: row.Position,
    rookie: row.Rookie === "Y",

    // numbers arrive as strings → coerce with +
    fantasyPts: +row.Fantasy_Pts,
    auction: +row.Auction_Value,
    vorp: +row.VORP,

    // you can add more when you need them
    passYds: +row.Pass_Yd,
    rushYds: +row.Rush_Yd,
    recYds:  +row.Rec_Yd,
  };
}
