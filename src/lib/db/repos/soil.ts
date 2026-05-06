import { getDb } from '../db';
import type { SoilAnalysis, SoilSample } from '../types';
import { newId, nowStamps } from './ids';
import { recordDelete, recordPut } from '@/lib/sync/log';

export type SoilSampleInput = Omit<SoilSample, 'id' | 'createdAt' | 'updatedAt'>;
export type SoilAnalysisInput = Omit<SoilAnalysis, 'id' | 'createdAt' | 'updatedAt' | 'sampleId'>;
export type SoilSamplePatch = Partial<SoilSampleInput>;
export type SoilAnalysisPatch = Partial<Omit<SoilAnalysis, 'id' | 'createdAt' | 'sampleId'>>;

export interface SoilRecord {
  sample: SoilSample;
  analysis: SoilAnalysis;
}

export async function listSoilSamplesByParcel(parcelId: string): Promise<SoilSample[]> {
  return getDb().soilSamples.where('parcelId').equals(parcelId).sortBy('samplingDate');
}

export async function listSoilRecordsByParcel(parcelId: string): Promise<SoilRecord[]> {
  const db = getDb();
  const samples = await db.soilSamples.where('parcelId').equals(parcelId).sortBy('samplingDate');
  const sampleIds = samples.map((s) => s.id);
  const analyses = sampleIds.length
    ? await db.soilAnalyses.where('sampleId').anyOf(sampleIds).toArray()
    : [];
  const byId = new Map(analyses.map((a) => [a.sampleId, a] as const));
  return samples
    .map((sample) => {
      const analysis = byId.get(sample.id);
      return analysis ? { sample, analysis } : null;
    })
    .filter((r): r is SoilRecord => r !== null);
}

export async function getSoilRecord(sampleId: string): Promise<SoilRecord | undefined> {
  const db = getDb();
  const sample = await db.soilSamples.get(sampleId);
  if (!sample) return undefined;
  const analysis = await db.soilAnalyses.where('sampleId').equals(sampleId).first();
  if (!analysis) return undefined;
  return { sample, analysis };
}

export async function createSoilRecord(
  sample: SoilSampleInput,
  analysis: SoilAnalysisInput,
): Promise<SoilRecord> {
  const db = getDb();
  const stamps = nowStamps();
  const sampleRow: SoilSample = { id: newId(), ...stamps, ...sample };
  const analysisRow: SoilAnalysis = {
    id: newId(),
    ...stamps,
    sampleId: sampleRow.id,
    ...analysis,
  };
  await db.transaction('rw', [db.soilSamples, db.soilAnalyses], async () => {
    await db.soilSamples.add(sampleRow);
    await db.soilAnalyses.add(analysisRow);
  });
  await recordPut({ table: 'soilSamples', recordId: sampleRow.id, patch: sampleRow });
  await recordPut({ table: 'soilAnalyses', recordId: analysisRow.id, patch: analysisRow });
  return { sample: sampleRow, analysis: analysisRow };
}

export async function updateSoilRecord(
  sampleId: string,
  samplePatch: SoilSamplePatch,
  analysisPatch: SoilAnalysisPatch,
): Promise<void> {
  const db = getDb();
  let analysisId: string | undefined;
  const now = new Date();
  await db.transaction('rw', [db.soilSamples, db.soilAnalyses], async () => {
    const analysis = await db.soilAnalyses.where('sampleId').equals(sampleId).first();
    if (!analysis) throw new Error(`SoilAnalysis for sample ${sampleId} not found`);
    analysisId = analysis.id;
    await db.soilSamples.update(sampleId, { ...samplePatch, updatedAt: now });
    await db.soilAnalyses.update(analysis.id, { ...analysisPatch, updatedAt: now });
  });
  await recordPut({
    table: 'soilSamples',
    recordId: sampleId,
    patch: { ...samplePatch, updatedAt: now },
  });
  if (analysisId) {
    await recordPut({
      table: 'soilAnalyses',
      recordId: analysisId,
      patch: { ...analysisPatch, updatedAt: now },
    });
  }
}

export async function deleteSoilRecord(sampleId: string): Promise<void> {
  const db = getDb();
  let analysisId: string | undefined;
  await db.transaction('rw', [db.soilSamples, db.soilAnalyses], async () => {
    const analysis = await db.soilAnalyses.where('sampleId').equals(sampleId).first();
    analysisId = analysis?.id;
    await db.soilAnalyses.where('sampleId').equals(sampleId).delete();
    await db.soilSamples.delete(sampleId);
  });
  if (analysisId) await recordDelete({ table: 'soilAnalyses', recordId: analysisId });
  await recordDelete({ table: 'soilSamples', recordId: sampleId });
}
