import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_DB_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  'backend-php',
  'database',
  'database.sqlite'
);

const DB_PATH = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : DEFAULT_DB_PATH;

let dbInstance = null;

export function getDb() {
  if (!dbInstance) {
    dbInstance = new Database(DB_PATH, {});
  }
  return dbInstance;
}

export function getDbPath() {
  return DB_PATH;
}


