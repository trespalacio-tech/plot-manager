import type { Proposal, Rule } from '../types';

export const transitionYear1Review: Rule = {
  id: 'transition-year1-review',
  title: 'Revisión de primer año de transición',
  description: 'Tras 1 año en estado TRANSITION, programar revisión global.',
  category: 'TRANSITION',
  evaluate(ctx): Proposal[] {
    if (ctx.parcel.status !== 'TRANSITION') return [];
    if (ctx.yearsInCurrentStatus < 1 || ctx.yearsInCurrentStatus >= 1.25) return [];
    return [
      {
        kind: 'TASK',
        operationType: 'MONITORING',
        title: 'Revisión de hitos del primer año en transición',
        rationale:
          'Primer ciclo completo en transición: revisa evolución de MO, implantación de cubiertas, plagas emergentes y cumplimiento de los hitos del plan.',
        scientificBasis:
          'Protocolo SARE / Lampkin et al. (2017): los años 1-2 son los más críticos para la cooperación suelo-planta; la revisión anual guía decisiones de mezcla de cubiertas y fertilización orgánica.',
        priority: 'MEDIUM',
      },
    ];
  },
};

export const transitionYear3Audit: Rule = {
  id: 'transition-year3-audit',
  title: 'Auditoría de paso a régimen regenerativo',
  description: 'Cuando la parcela lleva 3+ años en transición, proponer auditoría de paso.',
  category: 'TRANSITION',
  evaluate(ctx): Proposal[] {
    if (ctx.parcel.status !== 'TRANSITION') return [];
    if (ctx.yearsInCurrentStatus < 3) return [];
    return [
      {
        kind: 'TASK',
        operationType: 'MONITORING',
        title: 'Auditoría para paso a estado REGENERATIVE',
        rationale:
          'La parcela lleva más de 3 años en transición. Es hora de auditar indicadores (MO, lombrices, infiltración, biodiversidad funcional) y, si procede, cambiar estado a REGENERATIVE.',
        scientificBasis:
          'Moebius-Clune et al. (2016) — CASH / SHA: auditoría estructurada con física, química y biología del suelo valida el paso entre fases de manejo.',
        priority: 'HIGH',
      },
    ];
  },
};

export const transitionDesignSetup: Rule = {
  id: 'transition-design-setup',
  title: 'Parcela en diseño: hoja de ruta',
  description: 'Parcelas en estado DESIGN necesitan plan de transición formal antes de plantar.',
  category: 'TRANSITION',
  evaluate(ctx): Proposal[] {
    if (ctx.parcel.status !== 'DESIGN') return [];
    return [
      {
        kind: 'TASK',
        operationType: 'OTHER',
        title: 'Definir plan de diseño regenerativo de la parcela',
        rationale:
          'Antes de plantar, fija decisiones clave: análisis de suelo inicial, selección de especies/portainjertos según caliza activa y pH, marco, cubiertas pioneras y elementos de biodiversidad.',
        scientificBasis:
          'SARE / Altieri (2018): diseño ecológico previo al cultivo evita costes de reconfiguración en año 3-5 por decisiones irreversibles (marco, orientación, estructura hídrica).',
        priority: 'HIGH',
      },
    ];
  },
};
