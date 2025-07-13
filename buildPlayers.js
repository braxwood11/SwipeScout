/*
 * scripts/buildPlayers.js  (v10 – add Rookie flag; derive Fantasy Pts / VORP / Auction)
 * --------------------------------------------------------------------
 * Pulls a **flat** Google‑Sheets CSV that contains *raw* projection stats
 * (pass yards, rush TDs, receptions, etc.) and derives:
 *   • fantasyPts – based on scoring settings (standard / half‑PPR / PPR)
 *   • VORP       – value over replacement per position & league size
 *   • auction    – rough $ value scaled to league budget
 *   • rookie     – true/false if sheet marks player with "Y" in Rookie column
 *
 *   SHEET_CSV_URL=https://.../output=csv \
 *   TEAMS=12 BUDGET=200 FORMAT=ppr node scripts/buildPlayers.js
 *
 * Optional ENV overrides
 *   FORMAT    std | half | ppr        (default ppr)
 *   TEAMS     League size (12)        (drives replacement slots)
 *   BUDGET    $ per team (200)
 *   POOL      Fraction of cap spent in draft (0.7)
 *
 * Google‑sheet required *column headers* (any order, case/space tolerant)
 *   Player Name  Team  Position  Rookie  Pass_Yd Pass_TD Pass_Int
 *   Rush_Yd Rush_TD Rec Rec_Yd Rec_TD Fum_Lost
 * --------------------------------------------------------------------*/

import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';

// ---------------------- ENV -------------------------------------------
const SHEET_URL = process.env.SHEET_CSV_URL ??
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQh832G6WzcIp8nBMG19azD16sjCJUrPdCjeLt705wEvZBMqLlkEa2zNcUg41t2aDgyu8n8oJCB5vRs/pub?gid=247788213&single=true&output=csv';

const FORMAT   = (process.env.FORMAT ?? 'ppr').toLowerCase();   // std | half | ppr
const TEAMS    = Number(process.env.TEAMS   ?? 12);
const BUDGET   = Number(process.env.BUDGET  ?? 200);            // $ per team
const POOL_FRACTION = Number(process.env.POOL ?? 0.70);         // % of cap to starters

// Replacement slot defaults for 12‑team (QB1, RB2.5, WR3.5, TE1)
const BASE_REPL = { QB: 12, RB: 30, WR: 40, TE: 12 };
const REPL_IDX  = Object.fromEntries(
  Object.entries(BASE_REPL).map(([pos, n]) => [pos, Math.round(n / 12 * TEAMS)])
);

// ---------------------- helpers --------------------------------------
const SCORING = {
  std : { rec: 0   },
  half: { rec: 0.5 },
  ppr : { rec: 1   },
};
const SCORE = SCORING[FORMAT] ?? SCORING.ppr;

function toNum(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}
function slug(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
function normKey(k) { return k.trim().replace(/\s+/g, '_'); }
function pick(obj, ...opts) {
  for (const key of opts) {
    if (obj[key] != null && obj[key] !== '') return obj[key];
  }
  return undefined;
}

function calcFantasy(row) {
  const passYds = toNum(pick(row, 'Pass_Yd', 'Pass_Yds'));
  const passTD  = toNum(pick(row, 'Pass_TD'));
  const passInt = toNum(pick(row, 'Pass_Int'));
  const rushYds = toNum(pick(row, 'Rush_Yd', 'Rush_Yds'));
  const rushTD  = toNum(pick(row, 'Rush_TD'));
  const rec     = toNum(pick(row, 'Rec', 'Receptions'));
  const recYds  = toNum(pick(row, 'Rec_Yd', 'Rec_Yds'));
  const recTD   = toNum(pick(row, 'Rec_TD'));
  const fumLost = toNum(pick(row, 'Fum_Lost', 'Fumbles_Lost'));

  return (
    passYds / 25 + passTD * 4 - passInt * 2 +
    rushYds / 10 + rushTD * 6 +
    recYds / 10  + recTD * 6  + rec * SCORE.rec -
    fumLost * 2
  );
}

// ---------------------- main -----------------------------------------
(async () => {
  console.time('buildPlayers');
  console.log('↻  Downloading CSV …');

  const res = await fetch(SHEET_URL);
  if (!res.ok) throw new Error(`fetch ${SHEET_URL} → ${res.status}`);
  const csv = await res.text();

  const raw = parse(csv, { columns: true, trim: true, skip_empty_lines: true });
  if (!raw.length) throw new Error('CSV appears empty – check URL');

  const rows = raw.map(r => Object.fromEntries(
    Object.entries(r).map(([k, v]) => [normKey(k), v])
  ));

  // Derive fantasy points first ---------------------------------------
  for (const r of rows) {
    r._fantasy = calcFantasy(r);
  }

  // Replacement baselines ---------------------------------------------
  const replPts = {};
  for (const row of rows) {
    const pos = String(pick(row, 'Position')).toUpperCase();
    if (!pos) continue;
    (replPts[pos] ??= []).push(row._fantasy);
  }
  for (const [pos, list] of Object.entries(replPts)) {
    list.sort((a, b) => b - a);
    const idx = REPL_IDX[pos] ?? list.length - 1;
    replPts[pos] = list[idx] ?? 0;
  }

  // Build player objects ----------------------------------------------
  const players = rows
    .filter(r => pick(r, 'Player_Name') && pick(r, 'Position'))
    .map(r => {
      const name = pick(r, 'Player_Name');
      const team = String(pick(r, 'Team', 'Tm', 'NFL_Team') || 'FA').toUpperCase();
      const pos  = String(pick(r, 'Position')).toUpperCase();
      const pts  = +r._fantasy.toFixed(2);
      const vorp = +(pts - (replPts[pos] ?? 0)).toFixed(2);

      // rookie flag ----------------------------------------------------
      const rookie = String(pick(r, 'Rookie', 'Is_Rookie', 'Rk')).toUpperCase() === 'Y';

      // raw stats ------------------------------------------------------
      const passYds = toNum(pick(r, 'Pass_Yd', 'Pass_Yds'));
      const passTD  = toNum(pick(r, 'Pass_TD'));
      const rushYds = toNum(pick(r, 'Rush_Yd', 'Rush_Yds'));
      const rushTD  = toNum(pick(r, 'Rush_TD'));
      const rec     = toNum(pick(r, 'Rec', 'Receptions'));
      const recYds  = toNum(pick(r, 'Rec_Yd', 'Rec_Yds'));
      const recTD   = toNum(pick(r, 'Rec_TD'));

      return {
        id: `${slug(name)}-${team.toLowerCase()}`,
        name,
        team,
        position: pos,
        rookie,
        fantasyPts: pts,
        vorp,
        auction: 0, // temp – filled later
        // exposed raw stats --------------------------------------
        passYds,
        passTD,
        rushYds,
        rushTD,
        rec,
        recYds,
        recTD,
      };
    });

  // Auction values -----------------------------------------------------
  const positive = players.filter(p => p.vorp > 0);
  const pool = TEAMS * BUDGET * POOL_FRACTION;   // dollars to distribute
  const totalVorp = positive.reduce((s, p) => s + p.vorp, 0) || 1;
  for (const p of players) {
    p.auction = p.vorp > 0 ? Math.round((p.vorp / totalVorp) * pool) : 1;
  }

  // Write file ---------------------------------------------------------
  const out = 'public/players.json';
  await fs.mkdir('public', { recursive: true });
  await fs.writeFile(out, JSON.stringify(players, null, 2));
  console.log(`✅  Wrote ${players.length} players → ${out}`);
  console.timeEnd('buildPlayers');
})();
