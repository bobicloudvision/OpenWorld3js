import crypto from 'crypto';
import { getDb } from './db.js';

const findTokenStmt = () => getDb().prepare(
  `SELECT pat.id, pat.tokenable_type, pat.tokenable_id, pat.abilities, pat.expires_at
   FROM personal_access_tokens pat
   WHERE pat.token = ?
   LIMIT 1`
);

export function extractSanctumPlainToken(inputToken) {
  if (!inputToken || typeof inputToken !== 'string') return '';
  const trimmed = inputToken.startsWith('Bearer ')
    ? inputToken.slice('Bearer '.length)
    : inputToken;
  const pipeIndex = trimmed.indexOf('|');
  return pipeIndex >= 0 ? trimmed.slice(pipeIndex + 1) : trimmed;
}

export function hashSanctumToken(inputToken) {
  const plainToken = extractSanctumPlainToken(inputToken);
  return crypto.createHash('sha256').update(plainToken).digest('hex');
}

export function parseAbilities(abilitiesText) {
  if (!abilitiesText) return [];
  try {
    return JSON.parse(abilitiesText);
  } catch {
    return [];
  }
}

export function isExpired(expiresAt) {
  if (!expiresAt) return false;
  const exp = new Date(expiresAt).getTime();
  return Number.isFinite(exp) && Date.now() > exp;
}

export function findToken(inputToken) {
  const tokenHash = hashSanctumToken(inputToken);
  return findTokenStmt().get(tokenHash) || null;
}


