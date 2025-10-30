import { getDb } from './db.js';

const findPlayerByIdStmt = () => getDb().prepare(
  `SELECT id, name, email, level, experience, currency, active_hero_id
   FROM players
   WHERE id = ?`
);

export function getPlayerById(playerId) {
  return findPlayerByIdStmt().get(playerId) || null;
}


