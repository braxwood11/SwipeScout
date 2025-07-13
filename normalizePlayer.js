// src/utils/normalizePlayer.js
export function normalizePlayer(row, index = 0) {
  /* ---------- 1. already-normalized objects (from buildPlayers) ---------- */
  if (row.name && row.fantasyPts !== undefined) {
    // tidy numeric strings that came through fetch()
    return {
      ...row,
      fantasyPts : +row.fantasyPts,
      auction    : +row.auction,
      vorp       : +row.vorp,
      rookie     : Boolean(row.rookie),
    };
  }

  /* ---------- 2. legacy CSV rows (just in case) ------------------------- */
  return {
    id     : index,
    name   : row["Player Name"],
    team   : row.Team,
    position: row.Position,
    rookie : row.Rookie === "Y",

    fantasyPts : +row.Fantasy_Pts,
    auction    : +row.Auction_Value,
    vorp       : +row.VORP,

    passYds : +row.Pass_Yd,
    rushYds : +row.Rush_Yd,
    recYds  : +row.Rec_Yd,
  };
}
