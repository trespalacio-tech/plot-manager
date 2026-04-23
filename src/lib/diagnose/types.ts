export type DiagnoseConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export interface DiagnoseOption {
  label: string;
  nextNode?: string;
  hypothesisId?: string;
}

export interface DiagnoseQuestion {
  id: string;
  prompt: string;
  hint?: string;
  options: DiagnoseOption[];
}

export interface DiagnoseHypothesis {
  id: string;
  title: string;
  confidence: DiagnoseConfidence;
  description: string;
  monitoring: string[];
  managementOptions: string[];
  inputIds?: string[];
  references?: string[];
  whenToConsultExpert?: string;
}

export interface DiagnoseTree {
  rootNodeId: string;
  questions: Record<string, DiagnoseQuestion>;
  hypotheses: Record<string, DiagnoseHypothesis>;
}
