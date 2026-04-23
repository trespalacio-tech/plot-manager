import type {
  AlertSeverity,
  Farm,
  FieldLogEntry,
  OperationType,
  Parcel,
  SoilAnalysis,
  SoilSample,
  TaskPriority,
} from '@/lib/db/types';

export interface RuleContext {
  now: Date;
  parcel: Parcel;
  farm?: Farm;
  latestSoilSample?: SoilSample;
  latestSoilAnalysis?: SoilAnalysis;
  recentFieldLog: FieldLogEntry[];
  lastFieldLogDate?: Date;
  month: number;
  doy: number;
  yearsInCurrentStatus: number;
}

export interface TaskProposal {
  kind: 'TASK';
  subKey?: string;
  operationType: OperationType;
  title: string;
  rationale: string;
  scientificBasis?: string;
  guidanceKey?: string;
  priority: TaskPriority;
  scheduledFor?: Date;
  dueDate?: Date;
}

export interface AlertProposal {
  kind: 'ALERT';
  subKey?: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  expiresAt?: Date;
}

export type Proposal = TaskProposal | AlertProposal;

export interface Rule {
  id: string;
  title: string;
  description: string;
  category: 'SOIL' | 'SEASON' | 'PHENOLOGY' | 'TRANSITION' | 'FIELD_LOG';
  evaluate(ctx: RuleContext): Proposal[];
}
