import Dexie, { type Table } from 'dexie';
import type {
  Alert,
  BiodiversityFeature,
  CoverCrop,
  Farm,
  FieldLogEntry,
  Harvest,
  InputApplication,
  Milestone,
  Parcel,
  ParcelStatusHistory,
  PestMonitoring,
  PhenologyObservation,
  Plant,
  SoilAnalysis,
  SoilSample,
  Task,
  TransitionPlan,
  Variety,
} from './types';
import type { IdentityRecord, Op, PeerRecord } from '@/lib/sync/types';

export class FincasDB extends Dexie {
  farms!: Table<Farm, string>;
  parcels!: Table<Parcel, string>;
  parcelStatusHistory!: Table<ParcelStatusHistory, string>;
  varieties!: Table<Variety, string>;
  plants!: Table<Plant, string>;
  soilSamples!: Table<SoilSample, string>;
  soilAnalyses!: Table<SoilAnalysis, string>;
  fieldLogEntries!: Table<FieldLogEntry, string>;
  inputApplications!: Table<InputApplication, string>;
  coverCrops!: Table<CoverCrop, string>;
  biodiversityFeatures!: Table<BiodiversityFeature, string>;
  transitionPlans!: Table<TransitionPlan, string>;
  milestones!: Table<Milestone, string>;
  phenologyObservations!: Table<PhenologyObservation, string>;
  pestMonitorings!: Table<PestMonitoring, string>;
  harvests!: Table<Harvest, string>;
  tasks!: Table<Task, string>;
  alerts!: Table<Alert, string>;
  // Tablas del op-log (versión 2 del schema).
  ops!: Table<Op, string>;
  peers!: Table<PeerRecord, string>;
  identity!: Table<IdentityRecord, 'self'>;

  constructor(name = 'fincas') {
    super(name);
    this.version(1).stores({
      farms: 'id, name, province, municipality',
      parcels: 'id, farmId, name, status, cropType',
      parcelStatusHistory: 'id, parcelId, changedAt',
      varieties: 'id, parcelId, catalogId, species, cultivar',
      plants: 'id, parcelId, varietyId, status',
      soilSamples: 'id, parcelId, samplingDate',
      soilAnalyses: 'id, sampleId',
      fieldLogEntries: 'id, date, type, *parcelIds',
      inputApplications: 'id, fieldLogEntryId, inputId',
      coverCrops: 'id, parcelId, sowingDate',
      biodiversityFeatures: 'id, farmId, parcelId, type',
      transitionPlans: 'id, parcelId, startDate',
      milestones: 'id, transitionPlanId, targetDate, yearOfPlan',
      phenologyObservations: 'id, parcelId, date, bbchStage',
      pestMonitorings: 'id, parcelId, date, pestOrDisease',
      harvests: 'id, parcelId, varietyId, date',
      tasks: 'id, parcelId, status, priority, scheduledFor, dueDate, source',
      alerts: 'id, parcelId, severity, createdAt, expiresAt',
    });
    // v2: añade el op-log P2P. Composite index [deviceId+seq] para que
    // cada peer pueda pedir "todo lo que tengas desde mi último seq".
    this.version(2).stores({
      ops: 'id, [deviceId+seq], deviceId, seq, ts, table, recordId',
      peers: 'id, lastSyncAt',
      identity: 'id',
    });
  }
}

let _db: FincasDB | null = null;

export function getDb(): FincasDB {
  if (!_db) _db = new FincasDB();
  return _db;
}

export function resetDbForTests(name?: string): FincasDB {
  if (_db) _db.close();
  _db = new FincasDB(name ?? `fincas-test-${crypto.randomUUID()}`);
  return _db;
}
