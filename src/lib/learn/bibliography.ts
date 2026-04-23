import { LEARN_SHEETS } from './sheets';
import { COACH_WIZARDS } from '@/lib/coach/wizards';

export interface BiblioRef {
  citation: string;
  sources: string[];
}

const STATIC_REFS: string[] = [
  'Reglamento (UE) 2018/848 sobre producción ecológica.',
  'Reglamento (UE) 2021/1165 — sustancias y productos autorizados.',
  'MAPA — Guías de gestión integrada para frutales y vid.',
  'IPM Europe — Guidelines for Integrated Pest Management.',
  'Meier 2018 — Escala BBCH para frutales y vid.',
  'INTIA, IRTA, ITACyL — publicaciones técnicas regionales.',
  'FAO 2017 — Soil Organic Carbon: the hidden potential.',
  'Köppen-Geiger — clasificación climática regional.',
  'Haney — Soil Health Test methodology.',
];

export function buildBibliography(): BiblioRef[] {
  const map = new Map<string, Set<string>>();

  for (const ref of STATIC_REFS) {
    if (!map.has(ref)) map.set(ref, new Set());
    map.get(ref)!.add('Marco normativo y técnico');
  }

  for (const sheet of LEARN_SHEETS) {
    for (const ref of sheet.references) {
      if (!map.has(ref)) map.set(ref, new Set());
      map.get(ref)!.add(`Ficha · ${sheet.title}`);
    }
  }

  for (const wizard of Object.values(COACH_WIZARDS)) {
    for (const ref of wizard.references) {
      if (!map.has(ref)) map.set(ref, new Set());
      map.get(ref)!.add(`Wizard · ${wizard.title}`);
    }
  }

  return [...map.entries()]
    .map(([citation, sources]) => ({ citation, sources: [...sources].sort() }))
    .sort((a, b) => a.citation.localeCompare(b.citation, 'es'));
}
