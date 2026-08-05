import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const databasePath = process.env.AGROOS_DB_PATH ?? path.join(process.cwd(), "data", "agroos.sqlite");
fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const globalForDatabase = globalThis as unknown as { agroosDatabase?: Database.Database };

function createDatabase() {
  const database = new Database(databasePath);
  database.pragma("journal_mode = WAL");
  database.pragma("synchronous = NORMAL");
  database.pragma("foreign_keys = ON");
  database.pragma("busy_timeout = 5000");
  database.exec(`
    CREATE TABLE IF NOT EXISTS telemetry_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      message_id TEXT NOT NULL UNIQUE,
      sequence INTEGER NOT NULL,
      recorded_at TEXT,
      received_at TEXT NOT NULL,
      temperature_c REAL NOT NULL,
      humidity_pct REAL NOT NULL,
      rssi_dbm INTEGER,
      uptime_seconds INTEGER,
      firmware_version TEXT,
      quality TEXT NOT NULL DEFAULT 'GOOD'
    );
    CREATE INDEX IF NOT EXISTS telemetry_device_received_idx
      ON telemetry_readings(device_id, received_at);
    CREATE INDEX IF NOT EXISTS telemetry_device_sequence_idx
      ON telemetry_readings(device_id, sequence);
  `);
  return database;
}

export function getDatabase() {
  globalForDatabase.agroosDatabase ??= createDatabase();
  return globalForDatabase.agroosDatabase;
}
