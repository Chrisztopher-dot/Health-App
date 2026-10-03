import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

const dbPath = path.join(DATA_DIR, 'health_records.sqlite');
export const db = new Database(dbPath);

// Enable WAL mode for high performance and durability
db.pragma('journal_mode = WAL');

// Initialize Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS user_profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    data_json TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS check_ins (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    timestamp TEXT NOT NULL,
    mood TEXT NOT NULL,
    systolic INTEGER,
    diastolic INTEGER,
    pulse INTEGER,
    energy_level INTEGER,
    sleep_quality INTEGER,
    pain_level INTEGER,
    medication_status TEXT,
    data_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    priority TEXT NOT NULL,
    due_date TEXT,
    completed INTEGER DEFAULT 0,
    data_json TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    data_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS backup_snapshots (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    total_records INTEGER NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export class HealthDatabaseService {
  /**
   * Sync complete user state (called periodically or on change from client)
   */
  public static syncAllData(payload: {
    profile?: any;
    checkIns?: any[];
    reminders?: any[];
    activities?: any[];
  }) {
    const transaction = db.transaction(() => {
      // 1. Profile
      if (payload.profile) {
        const stmt = db.prepare(`
          INSERT INTO user_profiles (id, name, age, data_json, updated_at)
          VALUES ('primary_user', ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            age = excluded.age,
            data_json = excluded.data_json,
            updated_at = CURRENT_TIMESTAMP
        `);
        stmt.run(
          payload.profile.name || 'User',
          payload.profile.age || 75,
          JSON.stringify(payload.profile)
        );
      }

      // 2. CheckIns
      if (payload.checkIns && Array.isArray(payload.checkIns)) {
        const stmt = db.prepare(`
          INSERT INTO check_ins (id, date, timestamp, mood, systolic, diastolic, pulse, energy_level, sleep_quality, pain_level, medication_status, data_json)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(date) DO UPDATE SET
            timestamp = excluded.timestamp,
            mood = excluded.mood,
            systolic = excluded.systolic,
            diastolic = excluded.diastolic,
            pulse = excluded.pulse,
            energy_level = excluded.energy_level,
            sleep_quality = excluded.sleep_quality,
            pain_level = excluded.pain_level,
            medication_status = excluded.medication_status,
            data_json = excluded.data_json
        `);

        for (const r of payload.checkIns) {
          stmt.run(
            r.id || `chk-${r.date}`,
            r.date,
            r.timestamp || new Date().toISOString(),
            r.mood || 'good',
            r.bloodPressure?.measured ? r.bloodPressure.systolic : null,
            r.bloodPressure?.measured ? r.bloodPressure.diastolic : null,
            r.bloodPressure?.measured ? r.bloodPressure.pulse : null,
            r.energyLevel || 7,
            r.sleepQuality || 7,
            r.painLevel || 0,
            r.medicationStatus || 'taken',
            JSON.stringify(r)
          );
        }
      }

      // 3. Reminders
      if (payload.reminders && Array.isArray(payload.reminders)) {
        const stmt = db.prepare(`
          INSERT INTO reminders (id, title, priority, due_date, completed, data_json)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            priority = excluded.priority,
            due_date = excluded.due_date,
            completed = excluded.completed,
            data_json = excluded.data_json,
            updated_at = CURRENT_TIMESTAMP
        `);
        for (const rem of payload.reminders) {
          stmt.run(
            rem.id,
            rem.title,
            rem.priority || 'less_urgent',
            rem.dueDate || null,
            rem.completed ? 1 : 0,
            JSON.stringify(rem)
          );
        }
      }

      // 4. Activities
      if (payload.activities && Array.isArray(payload.activities)) {
        const stmt = db.prepare(`
          INSERT INTO activity_logs (id, date, title, category, duration_minutes, data_json)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            category = excluded.category,
            duration_minutes = excluded.duration_minutes,
            data_json = excluded.data_json
        `);
        for (const act of payload.activities) {
          stmt.run(
            act.id,
            act.date,
            act.title,
            act.category || 'walking',
            act.durationMinutes || 30,
            JSON.stringify(act)
          );
        }
      }
    });

    transaction();
    return { success: true, timestamp: new Date().toISOString() };
  }

  /**
   * Export complete database backup as JSON
   */
  public static createBackup(): {
    backupData: any;
    filename: string;
    filePath: string;
    sizeBytes: number;
  } {
    const profileRow = db.prepare(`SELECT data_json FROM user_profiles WHERE id = 'primary_user'`).get() as any;
    const checkInRows = db.prepare(`SELECT data_json FROM check_ins ORDER BY date ASC`).all() as any[];
    const reminderRows = db.prepare(`SELECT data_json FROM reminders ORDER BY created_at DESC`).all() as any[];
    const activityRows = db.prepare(`SELECT data_json FROM activity_logs ORDER BY date ASC`).all() as any[];

    const backupData = {
      appVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      profile: profileRow ? JSON.parse(profileRow.data_json) : null,
      checkIns: checkInRows.map((r) => JSON.parse(r.data_json)),
      reminders: reminderRows.map((r) => JSON.parse(r.data_json)),
      activities: activityRows.map((r) => JSON.parse(r.data_json)),
      stats: {
        totalCheckIns: checkInRows.length,
        totalReminders: reminderRows.length,
        totalActivities: activityRows.length,
      },
    };

    const dateStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    const filename = `health_backup_${dateStr}_${timeStr}.json`;
    const filePath = path.join(BACKUPS_DIR, filename);

    const jsonStr = JSON.stringify(backupData, null, 2);
    fs.writeFileSync(filePath, jsonStr, 'utf-8');

    const totalRecords = checkInRows.length + reminderRows.length + activityRows.length;
    const sizeBytes = Buffer.byteLength(jsonStr, 'utf-8');

    // Save snapshot record to table
    db.prepare(`
      INSERT INTO backup_snapshots (id, filename, total_records, file_size_bytes)
      VALUES (?, ?, ?, ?)
    `).run(`bcp-${Date.now()}`, filename, totalRecords, sizeBytes);

    return {
      backupData,
      filename,
      filePath,
      sizeBytes,
    };
  }

  /**
   * Get all past backup files
   */
  public static listBackups() {
    return db.prepare(`SELECT * FROM backup_snapshots ORDER BY created_at DESC LIMIT 20`).all();
  }

  /**
   * Restore database from backup JSON data
   */
  public static restoreFromBackup(backupData: any) {
    if (!backupData || (!backupData.checkIns && !backupData.profile)) {
      throw new Error('Invalid backup file format.');
    }

    return this.syncAllData({
      profile: backupData.profile,
      checkIns: backupData.checkIns,
      reminders: backupData.reminders,
      activities: backupData.activities,
    });
  }
}
