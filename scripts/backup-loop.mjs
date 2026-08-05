import Database from "better-sqlite3";
import fs from "node:fs/promises";
import path from "node:path";

const source = process.env.AGROOS_DB_PATH ?? "/data/agroos.sqlite";
const backupDirectory = process.env.AGROOS_BACKUP_PATH ?? "/data/backups";
const intervalMs = 24 * 60 * 60 * 1000;
const retentionMs = 14 * intervalMs;

async function createBackup() {
  await fs.mkdir(backupDirectory, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const target = path.join(backupDirectory, `agroos-${stamp}.sqlite`);
  const database = new Database(source, { readonly: true, fileMustExist: true });
  await database.backup(target);
  database.close();

  const now = Date.now();
  for (const entry of await fs.readdir(backupDirectory, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".sqlite")) continue;
    const file = path.join(backupDirectory, entry.name);
    const stat = await fs.stat(file);
    if (now - stat.mtimeMs > retentionMs) await fs.unlink(file);
  }
  console.log(`SQLite backup created: ${target}`);
}

async function run() {
  while (true) {
    try {
      await createBackup();
    } catch (error) {
      console.error("SQLite backup failed", error);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

await run();
