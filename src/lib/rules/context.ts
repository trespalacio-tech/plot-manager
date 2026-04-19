import { getDb } from '@/lib/db';
import type { FieldLogEntry, Parcel, SoilAnalysis, SoilSample } from '@/lib/db/types';
import { getFarm, listFieldLogEntries } from '@/lib/db/repos';
import type { RuleContext } from './types';

const MS_DAY = 24 * 60 * 60 * 1000;

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / MS_DAY);
}

async function latestSoil(
  parcelId: string,
): Promise<{ sample?: SoilSample; analysis?: SoilAnalysis }> {
  const db = getDb();
  const samples = await db.soilSamples.where('parcelId').equals(parcelId).toArray();
  if (samples.length === 0) return {};
  samples.sort((a, b) => b.samplingDate.getTime() - a.samplingDate.getTime());
  const sample = samples[0]!;
  const analysis = await db.soilAnalyses.where('sampleId').equals(sample.id).first();
  return { sample, analysis };
}

export async function buildContext(parcel: Parcel, now: Date): Promise<RuleContext> {
  const farm = await getFarm(parcel.farmId);
  const { sample, analysis } = await latestSoil(parcel.id);

  const since = new Date(now.getTime() - 90 * MS_DAY);
  const recent: FieldLogEntry[] = await listFieldLogEntries({
    parcelId: parcel.id,
    dateFrom: since,
  });
  const lastFieldLogDate = recent[0]?.date;

  const yearsInCurrentStatus = Math.max(
    0,
    (now.getTime() - parcel.statusChangedAt.getTime()) / (365.25 * MS_DAY),
  );

  return {
    now,
    parcel,
    farm,
    latestSoilSample: sample,
    latestSoilAnalysis: analysis,
    recentFieldLog: recent,
    lastFieldLogDate,
    month: now.getMonth() + 1,
    doy: dayOfYear(now),
    yearsInCurrentStatus,
  };
}
