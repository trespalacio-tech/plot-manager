export const BACKUP_FORMAT_VERSION = 1;

export const BACKUP_TABLES = [
  'farms',
  'parcels',
  'parcelStatusHistory',
  'varieties',
  'plants',
  'soilSamples',
  'soilAnalyses',
  'fieldLogEntries',
  'inputApplications',
  'coverCrops',
  'biodiversityFeatures',
  'transitionPlans',
  'milestones',
  'phenologyObservations',
  'pestMonitorings',
  'harvests',
  'tasks',
  'alerts',
] as const;

export type BackupTableName = (typeof BACKUP_TABLES)[number];

export interface SerializedBlob {
  __blob: true;
  type: string;
  base64: string;
}

export interface BackupSnapshot {
  formatVersion: number;
  appVersion: string;
  exportedAt: string;
  includesBlobs: boolean;
  counts: Record<BackupTableName, number>;
  data: Record<BackupTableName, unknown[]>;
}

export interface AutoBackupRecord {
  id: string;
  createdAt: Date;
  appVersion: string;
  payload: BackupSnapshot;
  sizeBytes: number;
}

export interface BackupSummary {
  exportedAt: string;
  appVersion: string;
  includesBlobs: boolean;
  formatVersion: number;
  counts: Record<BackupTableName, number>;
  totalRows: number;
}

export interface RestoreResult {
  inserted: Record<BackupTableName, number>;
  totalInserted: number;
}
