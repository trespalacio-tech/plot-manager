import type { Geometry, Point, Polygon } from 'geojson';

export type ParcelStatus = 'DESIGN' | 'TRANSITION' | 'REGENERATIVE';

export type CropType = 'FRUIT_TREE' | 'VINEYARD' | 'MIXED';

export type Aspect =
  | 'N'
  | 'NE'
  | 'E'
  | 'SE'
  | 'S'
  | 'SW'
  | 'W'
  | 'NW'
  | 'FLAT';

export type IrrigationType =
  | 'RAINFED'
  | 'DRIP'
  | 'MICROSPRINKLER'
  | 'FLOOD';

export type OperationType =
  | 'PRUNING'
  | 'MOWING'
  | 'MULCHING'
  | 'COMPOSTING'
  | 'COVER_CROP_SOWING'
  | 'COVER_CROP_TERMINATION'
  | 'IRRIGATION'
  | 'FERTIGATION'
  | 'PEST_TREATMENT'
  | 'DISEASE_TREATMENT'
  | 'MONITORING'
  | 'PHENOLOGY_OBSERVATION'
  | 'HARVEST'
  | 'SOIL_WORK'
  | 'BIODIVERSITY_INSTALL'
  | 'PLANTING'
  | 'REPLANTING'
  | 'OTHER';

export type TaskStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'DONE'
  | 'POSTPONED'
  | 'DISMISSED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TaskSource = 'PLAYBOOK' | 'RULE_ENGINE' | 'USER';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

interface WithId {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Farm extends WithId {
  name: string;
  municipality: string;
  province: string;
  altitudeM?: number;
  centerLat?: number;
  centerLng?: number;
  notes?: string;
}

export interface Parcel extends WithId {
  farmId: string;
  name: string;
  code?: string;
  geometry?: Polygon;
  areaHa: number;
  slopePct?: number;
  aspect?: Aspect;
  status: ParcelStatus;
  statusChangedAt: Date;
  cropType: CropType;
  plantingYear?: number;
  spacingRowM?: number;
  spacingPlantM?: number;
  rowOrientationDeg?: number;
  irrigation: IrrigationType;
  notes?: string;
}

export interface ParcelStatusHistory extends WithId {
  parcelId: string;
  fromStatus?: ParcelStatus;
  toStatus: ParcelStatus;
  changedAt: Date;
  reason?: string;
}

export interface Variety extends WithId {
  parcelId: string;
  catalogId?: string;
  species: string;
  cultivar: string;
  rootstock?: string;
  isPollinator: boolean;
  plantsCount: number;
  plantingDate?: Date;
  sourceNursery?: string;
}

export interface Plant extends WithId {
  parcelId: string;
  varietyId: string;
  rowNumber?: number;
  positionInRow?: number;
  geoPoint?: Point;
  status: 'HEALTHY' | 'WEAK' | 'DEAD' | 'REPLACED';
  notes?: string;
}

export interface SoilSample extends WithId {
  parcelId: string;
  samplingDate: Date;
  depthCmFrom: number;
  depthCmTo: number;
  samplingMethod: 'COMPOSITE' | 'ZONAL' | 'GRID';
  samplePointsCount?: number;
  labName?: string;
  labReportId?: string;
  labReportFileBlob?: Blob;
  notes?: string;
}

export interface SoilAnalysis extends WithId {
  sampleId: string;

  textureSandPct?: number;
  textureSiltPct?: number;
  textureClayPct?: number;
  textureClass?: string;
  bulkDensityGCm3?: number;
  waterHoldingCapacityPct?: number;
  infiltrationRateMmH?: number;
  aggregateStabilityPct?: number;

  phWater?: number;
  phKcl?: number;
  ecDsM?: number;
  organicMatterPct: number;
  organicCarbonPct?: number;
  totalNitrogenPct?: number;
  cnRatio?: number;
  cecMeq100g?: number;

  pOlsenPpm?: number;
  pBrayPpm?: number;
  kExchangeablePpm?: number;
  caExchangeablePpm?: number;
  mgExchangeablePpm?: number;
  naExchangeablePpm?: number;

  baseSaturationKPct?: number;
  baseSaturationCaPct?: number;
  baseSaturationMgPct?: number;
  baseSaturationNaPct?: number;

  fePpm?: number;
  mnPpm?: number;
  znPpm?: number;
  cuPpm?: number;
  bPpm?: number;

  totalCarbonatesPct?: number;
  activeLimestonePct?: number;

  microbialBiomassCMgKg?: number;
  basalRespirationMgCo2KgDay?: number;
  earthwormsCountM2?: number;
  haneyTestScore?: number;

  interpretationNotes?: string;
  recommendationsGenerated?: string[];
}

export interface FieldLogEntry extends WithId {
  date: Date;
  parcelIds: string[];
  type: OperationType;
  title: string;
  description?: string;
  durationMinutes?: number;
  weatherConditions?: string;
  photoBlobs?: Blob[];
  voiceNoteBlob?: Blob;
  costEur?: number;
  linkedOperationId?: string;
  voidedAt?: Date;
  voidedReason?: string;
}

export interface InputApplication extends WithId {
  fieldLogEntryId: string;
  inputId: string;
  dosePerHa?: number;
  totalQuantity?: number;
  unit: string;
  rationale?: string;
  preHarvestIntervalDays?: number;
}

export interface CoverCrop extends WithId {
  parcelId: string;
  mixId?: string;
  sowingDate: Date;
  terminationDate?: Date;
  terminationMethod?: 'ROLLING' | 'MOWING' | 'GRAZING' | 'INCORPORATION';
  estimatedBiomassTHa?: number;
  notes?: string;
}

export interface BiodiversityFeature extends WithId {
  farmId: string;
  parcelId?: string;
  type:
    | 'HEDGEROW'
    | 'FLOWER_STRIP'
    | 'POND'
    | 'NEST_BOX'
    | 'INSECT_HOTEL'
    | 'BAT_BOX'
    | 'ISLAND'
    | 'OTHER';
  geometry?: Geometry;
  installationDate: Date;
  speciesPlanted?: string[];
  areaOrLength?: number;
  maintenanceNotes?: string;
}

export interface TransitionPlan extends WithId {
  parcelId: string;
  startDate: Date;
  targetEndDate: Date;
  baselineSoilSampleId?: string;
  currentYear: number;
  notes?: string;
}

export interface Milestone extends WithId {
  transitionPlanId: string;
  title: string;
  description: string;
  targetDate: Date;
  completedAt?: Date;
  yearOfPlan: number;
}

export interface PhenologyObservation extends WithId {
  parcelId: string;
  date: Date;
  bbchStage: number;
  bbchDescription?: string;
  varietyId?: string;
  notes?: string;
  photoBlob?: Blob;
}

export interface PestMonitoring extends WithId {
  parcelId: string;
  date: Date;
  pestOrDisease: string;
  method:
    | 'PHEROMONE_TRAP'
    | 'VISUAL_COUNT'
    | 'STICKY_TRAP'
    | 'BEATING_TRAY'
    | 'OTHER';
  count?: number;
  unit?: string;
  thresholdReference?: number;
  actionRequired: boolean;
  notes?: string;
}

export interface Harvest extends WithId {
  parcelId: string;
  varietyId?: string;
  date: Date;
  quantityKg: number;
  qualityNotes?: string;
  brix?: number;
  priceEurKg?: number;
  destination?: string;
}

export interface Task extends WithId {
  parcelId?: string;
  source: TaskSource;
  sourceRef?: string;
  type: OperationType;
  title: string;
  rationale: string;
  scientificBasis?: string;
  scheduledFor?: Date;
  dueDate?: Date;
  priority: TaskPriority;
  status: TaskStatus;
  postponeReason?: string;
  completedAt?: Date;
  completedFieldLogEntryId?: string;
}

export interface Alert extends WithId {
  parcelId?: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  triggerSource: string;
  acknowledgedAt?: Date;
  expiresAt?: Date;
}
