import type { Proposal, Rule, RuleContext } from '../types';

function analysisAgeDays(ctx: RuleContext): number | undefined {
  if (!ctx.latestSoilSample) return undefined;
  return (ctx.now.getTime() - ctx.latestSoilSample.samplingDate.getTime()) / (24 * 3600 * 1000);
}

export const soilLowOm: Rule = {
  id: 'soil-low-om',
  title: 'MO baja',
  description: 'Propone plan de recuperación si la materia orgánica está por debajo de 1.5 %.',
  category: 'SOIL',
  evaluate(ctx): Proposal[] {
    const a = ctx.latestSoilAnalysis;
    if (!a) return [];
    if (a.organicMatterPct >= 1.5) return [];
    return [
      {
        kind: 'TASK',
        operationType: 'COMPOSTING',
        title: 'Plan de recuperación de MO del suelo',
        rationale: `La materia orgánica está en ${a.organicMatterPct.toFixed(2)} %, por debajo del umbral de 1.5 %. En suelos calizos de Burgos esto limita CIC efectiva, retención hídrica y actividad biológica.`,
        scientificBasis:
          'Lal (2006), Montanaro et al. (2017): aportes anuales de compost maduro (5-10 t/ha) + cubierta vegetal invernal aumentan 0.1-0.2 % MO/año en suelos mediterráneos semiáridos.',
        priority: a.organicMatterPct < 1 ? 'HIGH' : 'MEDIUM',
      },
    ];
  },
};

export const soilAcidicPh: Rule = {
  id: 'soil-acidic-ph',
  title: 'pH ácido',
  description: 'Propone enmienda cálcica si el pH (agua) está por debajo de 6.',
  category: 'SOIL',
  evaluate(ctx): Proposal[] {
    const a = ctx.latestSoilAnalysis;
    if (!a || a.phWater === undefined) return [];
    if (a.phWater >= 6) return [];
    return [
      {
        kind: 'TASK',
        operationType: 'SOIL_WORK',
        title: 'Corregir acidez con enmienda cálcica',
        rationale: `pH ${a.phWater.toFixed(1)} demasiado ácido para frutales/vid: limita disponibilidad de P, Ca, Mg y aumenta riesgo de toxicidad por Al.`,
        scientificBasis:
          'Havlin et al. (2014): rango óptimo 6.0-7.5. Dolomita (CaMg(CO3)2) a dosis calculada por prueba de requerimiento de cal (SMP buffer).',
        priority: a.phWater < 5.5 ? 'HIGH' : 'MEDIUM',
      },
    ];
  },
};

export const soilAlkalineChlorosis: Rule = {
  id: 'soil-alkaline-chlorosis',
  title: 'Riesgo de clorosis férrica',
  description: 'Si pH > 8.5 combinado con caliza activa alta, alerta y propone azufre elemental.',
  category: 'SOIL',
  evaluate(ctx): Proposal[] {
    const a = ctx.latestSoilAnalysis;
    if (!a || a.phWater === undefined) return [];
    if (a.phWater <= 8.5) return [];
    const lime = a.activeLimestonePct ?? 0;
    const out: Proposal[] = [
      {
        kind: 'TASK',
        operationType: 'SOIL_WORK',
        title: 'Acidificar zona radicular con azufre elemental',
        rationale: `pH ${a.phWater.toFixed(1)}${lime ? ` y caliza activa ${lime.toFixed(1)} %` : ''} favorecen clorosis férrica. Aplicar azufre en banda bajo copa (200-500 kg/ha fraccionado) con aportes orgánicos.`,
        scientificBasis:
          'Sanz-Sáez et al. (2018): azufre elemental bajo copa reduce pH 0.3-0.5 unidades por campaña en suelos calizos. Fe-EDDHA como rescate si hay síntomas.',
        priority: 'MEDIUM',
      },
    ];
    if (lime > 9) {
      out.push({
        kind: 'ALERT',
        severity: 'WARNING',
        title: 'Clorosis férrica probable esta campaña',
        message: `pH ${a.phWater.toFixed(1)} y caliza activa ${lime.toFixed(1)} %. Vigila hojas jóvenes en brotación (marzo-abril). Si aparecen síntomas, actúa con Fe-EDDHA.`,
      });
    }
    return out;
  },
};

export const soilCnHigh: Rule = {
  id: 'soil-cn-high',
  title: 'C/N alta',
  description: 'C/N > 15 indica inmovilización de N; propone compost maduro.',
  category: 'SOIL',
  evaluate(ctx): Proposal[] {
    const a = ctx.latestSoilAnalysis;
    if (!a || a.cnRatio === undefined) return [];
    if (a.cnRatio <= 15) return [];
    return [
      {
        kind: 'TASK',
        operationType: 'COMPOSTING',
        title: 'Compensar inmovilización de N con compost maduro',
        rationale: `Relación C/N ${a.cnRatio.toFixed(1)}: el carbono fresco está inmovilizando el N disponible para el cultivo.`,
        scientificBasis:
          'Nicolardot et al. (2001): a C/N > 15 la mineralización neta de N es negativa en las primeras semanas. Compost con C/N 10-12 restaura disponibilidad.',
        priority: a.cnRatio > 20 ? 'HIGH' : 'MEDIUM',
      },
    ];
  },
};

export const soilPExcess: Rule = {
  id: 'soil-p-excess',
  title: 'P en exceso',
  description: 'P Olsen > 50 ppm: evitar aportes fosforados y vigilar lixiviación.',
  category: 'SOIL',
  evaluate(ctx): Proposal[] {
    const a = ctx.latestSoilAnalysis;
    if (!a || a.pOlsenPpm === undefined) return [];
    if (a.pOlsenPpm <= 50) return [];
    return [
      {
        kind: 'ALERT',
        severity: 'INFO',
        title: 'P Olsen alto: no aportes más fósforo',
        message: `P Olsen ${a.pOlsenPpm.toFixed(0)} ppm. Suspende fosfatos naturales y compost rico en P; revisa posible lixiviación si la parcela tiene pendiente o riego abundante.`,
      },
    ];
  },
};

export const soilLowK: Rule = {
  id: 'soil-low-k',
  title: 'K bajo',
  description: 'K intercambiable < 120 ppm: previsible deficiencia productiva.',
  category: 'SOIL',
  evaluate(ctx): Proposal[] {
    const a = ctx.latestSoilAnalysis;
    if (!a || a.kExchangeablePpm === undefined) return [];
    if (a.kExchangeablePpm >= 120) return [];
    return [
      {
        kind: 'TASK',
        operationType: 'FERTIGATION',
        title: 'Reponer potasio con fuentes autorizadas',
        rationale: `K intercambiable ${a.kExchangeablePpm.toFixed(0)} ppm. Cosechas medias-altas se quedarán cortas de K (agostado de madera, calibre, Brix).`,
        scientificBasis:
          'Mpelasoka et al. (2003): K es el nutriente más extraído por frutal y vid tras el N. Sulfato potásico autorizado en ecológico o compost de orujo/mosto.',
        priority: 'MEDIUM',
      },
    ];
  },
};

export const soilActiveLimestoneHigh: Rule = {
  id: 'soil-active-limestone-high',
  title: 'Caliza activa > 12 %',
  description: 'Solo portainjertos muy tolerantes; alto riesgo de clorosis.',
  category: 'SOIL',
  evaluate(ctx): Proposal[] {
    const a = ctx.latestSoilAnalysis;
    if (!a || a.activeLimestonePct === undefined) return [];
    if (a.activeLimestonePct <= 12) return [];
    const isFruit = ctx.parcel.cropType === 'FRUIT_TREE' || ctx.parcel.cropType === 'MIXED';
    return [
      {
        kind: 'TASK',
        operationType: 'PLANTING',
        title: isFruit
          ? 'Portainjertos muy tolerantes a caliza para replantes'
          : 'Portainjertos de vid muy tolerantes a caliza',
        rationale: `Caliza activa ${a.activeLimestonePct.toFixed(1)} % es el factor limitante principal. Selecciona genética antes de replantar.`,
        scientificBasis: isFruit
          ? 'Font i Forcada et al. (2012): GF-677 (almendro/melocotón) tolera hasta 13 %, Krymsk 86 hasta 15 %, OHxF 97 para peral.'
          : 'Bavaresco et al. (2010): Fercal tolera hasta 40 % caliza activa, 41B hasta 40 %, 140Ru hasta 17 %. Descarta SO4 y 110R.',
        priority: 'HIGH',
      },
    ];
  },
};

export const soilStaleAnalysis: Rule = {
  id: 'soil-stale-analysis',
  title: 'Análisis de suelo > 3 años',
  description: 'Propone programar nuevo análisis si el último tiene más de 3 años.',
  category: 'SOIL',
  evaluate(ctx): Proposal[] {
    const age = analysisAgeDays(ctx);
    if (age === undefined) {
      return [
        {
          kind: 'TASK',
          operationType: 'MONITORING',
          title: 'Tomar primer análisis de suelo de referencia',
          rationale:
            'No hay análisis de suelo registrado. Un análisis inicial (0-30 cm compuesto) establece la línea base para medir el progreso regenerativo.',
          scientificBasis:
            'AENOR UNE 77308 / protocolo SARE: muestreo compuesto 10-15 submuestras por zona homogénea, antes de fertilizar, misma fenología.',
          priority: 'HIGH',
        },
      ];
    }
    if (age < 365 * 3) return [];
    return [
      {
        kind: 'TASK',
        operationType: 'MONITORING',
        title: 'Repetir análisis de suelo',
        rationale: `El último análisis tiene ${Math.floor(age / 365)} años. Para ver evolución de MO, pH y nutrientes conviene un análisis cada 2-3 años en la misma época.`,
        scientificBasis:
          'ITGA / IFAPA: monitorización mínima trianual en parcelas en transición; mismo laboratorio y método para comparar.',
        priority: 'MEDIUM',
      },
    ];
  },
};
