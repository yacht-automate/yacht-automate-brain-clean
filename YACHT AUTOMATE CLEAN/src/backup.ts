import * as fs from 'fs';
import * as path from 'path';
import { DatabaseService } from './db';

export class BackupService {
  private db: DatabaseService;
  private backupDir: string;

  constructor(db: DatabaseService) {
    this.db = db;
    this.backupDir = 'db/backups';
    this.ensureBackupDirectory();
    this.startDailyBackup();
  }

  private ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  private startDailyBackup() {
    // Run backup every 24 hours
    setInterval(() => {
      this.createBackup();
    }, 24 * 60 * 60 * 1000);

    // Create initial backup
    setTimeout(() => this.createBackup(), 5000);
  }

  public createBackup(): string {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `yacht-automate-${timestamp}.db`;
      const backupPath = path.join(this.backupDir, backupFileName);

      // Copy the SQLite database file
      const sourcePath = 'db/data.sqlite';
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, backupPath);
        
        console.log(`[BACKUP] Database backed up to: ${backupPath}`);
        
        // Clean up old backups (keep last 7 days)
        this.cleanupOldBackups();
        
        return backupPath;
      } else {
        console.warn('[BACKUP] Source database file not found');
        return '';
      }
    } catch (error) {
      console.error('[BACKUP] Failed to create backup:', error);
      return '';
    }
  }

  private cleanupOldBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      const backupFiles = files
        .filter(file => file.startsWith('yacht-automate-') && file.endsWith('.db'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          mtime: fs.statSync(path.join(this.backupDir, file)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      // Keep only the latest 7 backups
      const filesToDelete = backupFiles.slice(7);
      
      filesToDelete.forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`[BACKUP] Cleaned up old backup: ${file.name}`);
      });
    } catch (error) {
      console.error('[BACKUP] Failed to cleanup old backups:', error);
    }
  }

  public exportData(): any {
    try {
      // Get basic export data (simplified for now)
      const data = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        message: 'Database backup available as SQLite file'
      };

      return data;
    } catch (error) {
      console.error('[BACKUP] Failed to export data:', error);
      return null;
    }
  }

  public getBackupStatus() {
    try {
      const backupFiles = fs.readdirSync(this.backupDir)
        .filter(file => file.startsWith('yacht-automate-') && file.endsWith('.db'))
        .map(file => {
          const filePath = path.join(this.backupDir, file);
          const stats = fs.statSync(filePath);
          return {
            filename: file,
            size: stats.size,
            created: stats.mtime.toISOString()
          };
        })
        .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

      return {
        backupDirectory: this.backupDir,
        totalBackups: backupFiles.length,
        latestBackup: backupFiles[0] || null,
        backups: backupFiles
      };
    } catch (error) {
      console.error('[BACKUP] Failed to get backup status:', error);
      return {
        backupDirectory: this.backupDir,
        totalBackups: 0,
        latestBackup: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}