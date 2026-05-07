import { useEffect, useState } from 'react';
import { evaluateCoach } from '@/lib/playbooks';
import { runCoachMigrations } from './migrations';
import { runOpLogBackfill } from '@/lib/sync/backfill';

const LAST_EVAL_KEY = 'coach:lastEvalAt';
const THROTTLE_MS = 30 * 60 * 1000;

export interface AutoCoachState {
  evaluating: boolean;
  ranAt?: Date;
  error?: string;
}

function readLast(): number {
  try {
    const raw = localStorage.getItem(LAST_EVAL_KEY);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

function writeLast(ts: number): void {
  try {
    localStorage.setItem(LAST_EVAL_KEY, String(ts));
  } catch {
    /* ignore */
  }
}

/** Force the next mount of `useAutoCoach` to re-evaluate, ignoring throttle. */
export function markCoachStale(): void {
  try {
    localStorage.removeItem(LAST_EVAL_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Runs the Coach (rules + playbooks) on mount, throttled to once every
 * 30 minutes per browser. Marks dates so tasks become visible in the calendar
 * even on first launch after creating a parcel.
 */
export function useAutoCoach(): AutoCoachState {
  const [state, setState] = useState<AutoCoachState>({ evaluating: false });

  useEffect(() => {
    const last = readLast();
    if (Date.now() - last < THROTTLE_MS) return;
    let cancelled = false;
    setState({ evaluating: true });
    void runCoachMigrations()
      // Backfill one-shot del op-log: si la BD existe desde antes del
      // sync P2P, generamos una Op PUT inicial por fila para que un peer
      // recién pareado pueda recibir todo el estado anterior.
      .then(() => runOpLogBackfill())
      .then(() => evaluateCoach())
      .then(() => {
        if (cancelled) return;
        const now = Date.now();
        writeLast(now);
        setState({ evaluating: false, ranAt: new Date(now) });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          evaluating: false,
          error: err instanceof Error ? err.message : String(err),
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
