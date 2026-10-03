import { UserProfile, CheckInRecord, ReminderItem, ActivityLogEntry } from '../types/health';

export interface BackupPayload {
  appVersion: string;
  exportedAt: string;
  profile: UserProfile | null;
  checkIns: CheckInRecord[];
  reminders: ReminderItem[];
  activities: Record<string, ActivityLogEntry[]> | ActivityLogEntry[];
  stats?: {
    totalCheckIns: number;
    totalReminders: number;
    totalActivities: number;
  };
}

export interface BackupSnapshotRecord {
  id: string;
  filename: string;
  total_records: number;
  file_size_bytes: number;
  created_at: string;
}

export class BackupService {
  /**
   * Sync complete local state to backend SQLite database
   */
  public static async syncToDatabase(data: {
    profile: UserProfile | null;
    checkIns: CheckInRecord[];
    reminders: ReminderItem[];
    activities?: Record<string, ActivityLogEntry[]> | ActivityLogEntry[];
  }): Promise<boolean> {
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.ok;
    } catch (err) {
      console.warn('SQLite Sync unavailable (running client-only or offline):', err);
      return false;
    }
  }

  /**
   * Trigger backend backup snapshot and download JSON file locally
   */
  public static async exportAndDownloadBackup(data: {
    profile: UserProfile | null;
    checkIns: CheckInRecord[];
    reminders: ReminderItem[];
    activities?: Record<string, ActivityLogEntry[]> | ActivityLogEntry[];
  }): Promise<{ filename: string; sizeBytes: number }> {
    // Sync first to ensure backend SQLite is current
    await this.syncToDatabase(data);

    // Try backend backup endpoint
    try {
      const res = await fetch('/api/backup', { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        this.downloadJsonFile(result.backupData, result.filename);
        return { filename: result.filename, sizeBytes: result.sizeBytes };
      }
    } catch {
      // Fallback to purely client-side export
    }

    // Client-side fallback export
    const payload: BackupPayload = {
      appVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      profile: data.profile,
      checkIns: data.checkIns,
      reminders: data.reminders,
      activities: data.activities || {},
      stats: {
        totalCheckIns: data.checkIns.length,
        totalReminders: data.reminders.length,
        totalActivities: Array.isArray(data.activities) 
          ? data.activities.length 
          : Object.values(data.activities || {}).reduce((acc, list) => acc + list.length, 0),
      },
    };

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `senior_health_backup_${dateStr}.json`;
    const jsonStr = JSON.stringify(payload, null, 2);
    this.downloadJsonFile(payload, filename);

    return {
      filename,
      sizeBytes: new Blob([jsonStr]).size,
    };
  }

  /**
   * Fetch list of server snapshots
   */
  public static async fetchSnapshotHistory(): Promise<BackupSnapshotRecord[]> {
    try {
      const res = await fetch('/api/backups');
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Could not fetch backup snapshots:', err);
    }
    return [];
  }

  /**
   * Parse uploaded backup file
   */
  public static async parseBackupFile(file: File): Promise<BackupPayload> {
    const text = await file.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('File is not valid JSON. Please upload a valid health backup file.');
    }

    if (!data.profile && (!data.checkIns || !Array.isArray(data.checkIns))) {
      throw new Error('Invalid health backup format. Expected profile or checkIns data.');
    }

    // Sync to SQLite backend as well
    try {
      await fetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {
      // Offline fallback
    }

    return {
      appVersion: data.appVersion || '1.0.0',
      exportedAt: data.exportedAt || new Date().toISOString(),
      profile: data.profile || null,
      checkIns: data.checkIns || [],
      reminders: data.reminders || [],
      activities: data.activities || [],
      stats: data.stats,
    };
  }

  private static downloadJsonFile(data: any, filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
