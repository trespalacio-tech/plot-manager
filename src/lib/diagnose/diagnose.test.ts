import { describe, expect, it } from 'vitest';
import { DIAGNOSE_TREE } from './tree';
import { getInput } from '@/lib/catalogs';

describe('DIAGNOSE_TREE', () => {
  it('tiene un nodo raíz válido', () => {
    expect(DIAGNOSE_TREE.questions[DIAGNOSE_TREE.rootNodeId]).toBeDefined();
  });

  it('todas las opciones apuntan a un node o hipótesis válidos', () => {
    for (const q of Object.values(DIAGNOSE_TREE.questions)) {
      for (const opt of q.options) {
        if (opt.nextNode) {
          expect(DIAGNOSE_TREE.questions[opt.nextNode]).toBeDefined();
        } else if (opt.hypothesisId) {
          expect(DIAGNOSE_TREE.hypotheses[opt.hypothesisId]).toBeDefined();
        } else {
          throw new Error(`Opción sin destino en ${q.id}: "${opt.label}"`);
        }
      }
    }
  });

  it('todas las hipótesis tienen monitoreo y manejo definidos', () => {
    for (const h of Object.values(DIAGNOSE_TREE.hypotheses)) {
      expect(h.monitoring.length).toBeGreaterThan(0);
      expect(h.managementOptions.length).toBeGreaterThan(0);
    }
  });

  it('los inputIds referenciados existen en el catálogo de insumos', () => {
    for (const h of Object.values(DIAGNOSE_TREE.hypotheses)) {
      for (const id of h.inputIds ?? []) {
        expect(getInput(id), `input ${id} en hipótesis ${h.id}`).toBeDefined();
      }
    }
  });

  it('hipótesis de baja confianza recomienda consulta a técnico', () => {
    const lowConf = Object.values(DIAGNOSE_TREE.hypotheses).filter(
      (h) => h.confidence === 'LOW',
    );
    expect(lowConf.length).toBeGreaterThan(0);
    lowConf.forEach((h) => expect(h.whenToConsultExpert).toBeDefined());
  });

  it('hay al menos 8 hipótesis distintas', () => {
    expect(Object.keys(DIAGNOSE_TREE.hypotheses).length).toBeGreaterThanOrEqual(8);
  });
});
