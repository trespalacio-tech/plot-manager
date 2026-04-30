import type { CropType, OperationType, SoilAnalysis } from '@/lib/db/types';
import { isTreeCrop } from '@/lib/db/cropFamilies';

export type InterpretationLevel = 'OK' | 'WATCH' | 'ACTION';

export interface ParamInterpretation {
  key: string;
  label: string;
  value: number | undefined;
  unit?: string;
  level: InterpretationLevel;
  band?: string;
  message: string;
}

export interface Recommendation {
  id: string;
  title: string;
  rationale: string;
  operationType: OperationType;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  triggerParams: string[];
}

export interface SoilInterpretation {
  params: ParamInterpretation[];
  recommendations: Recommendation[];
  summary: { ok: number; watch: number; action: number };
}

export interface InterpretationContext {
  cropType?: CropType;
}

const VAN_BEMMELEN = 1.724;

export function organicCarbonFromOM(organicMatterPct: number): number {
  return organicMatterPct / VAN_BEMMELEN;
}

export function cnRatio(organicMatterPct: number, totalNitrogenPct: number): number | undefined {
  if (totalNitrogenPct <= 0) return undefined;
  return organicCarbonFromOM(organicMatterPct) / totalNitrogenPct;
}

function pushOK(
  params: ParamInterpretation[],
  key: string,
  label: string,
  value: number | undefined,
  unit: string | undefined,
  band: string,
  message: string,
) {
  params.push({ key, label, value, unit, level: 'OK', band, message });
}

function pushWatch(
  params: ParamInterpretation[],
  key: string,
  label: string,
  value: number | undefined,
  unit: string | undefined,
  band: string,
  message: string,
) {
  params.push({ key, label, value, unit, level: 'WATCH', band, message });
}

function pushAction(
  params: ParamInterpretation[],
  key: string,
  label: string,
  value: number | undefined,
  unit: string | undefined,
  band: string,
  message: string,
) {
  params.push({ key, label, value, unit, level: 'ACTION', band, message });
}

function interpretPh(a: SoilAnalysis, out: ParamInterpretation[]) {
  const ph = a.phWater;
  if (ph === undefined) return;
  if (ph < 5.5) {
    pushAction(out, 'phWater', 'pH (agua)', ph, '', 'muy ácido', 'pH muy ácido: bloqueo de P y Ca, toxicidad de Al. Encalar con dolomita certificada.');
  } else if (ph < 6.5) {
    pushWatch(out, 'phWater', 'pH (agua)', ph, '', 'ácido', 'pH ácido para frutales/vid. Ajusta con enmiendas cálcicas según análisis de caliza.');
  } else if (ph <= 7.5) {
    pushOK(out, 'phWater', 'pH (agua)', ph, '', 'óptimo', 'pH en rango óptimo para la mayoría de frutales y vid.');
  } else if (ph <= 8.3) {
    pushOK(out, 'phWater', 'pH (agua)', ph, '', 'alcalino habitual en Burgos', 'pH alcalino típico en suelos calizos de Burgos. Compatible con especies adaptadas.');
  } else if (ph <= 8.8) {
    pushWatch(out, 'phWater', 'pH (agua)', ph, '', 'muy alcalino', 'pH muy alcalino: vigilar clorosis férrica; prioriza aportes orgánicos y azufre elemental localizado.');
  } else {
    pushAction(out, 'phWater', 'pH (agua)', ph, '', 'extremadamente alcalino', 'pH extremo, posible sodicidad. Confirma con Na intercambiable y plantea corrección con azufre y materia orgánica.');
  }
}

function interpretOM(a: SoilAnalysis, out: ParamInterpretation[]) {
  const om = a.organicMatterPct;
  if (om === undefined) return;
  if (om < 1.0) {
    pushAction(out, 'organicMatterPct', 'Materia orgánica', om, '%', 'muy baja', 'MO crítica: suelo pobre en carbono y fauna. Prioridad máxima de compostaje y cubiertas.');
  } else if (om < 1.5) {
    pushAction(out, 'organicMatterPct', 'Materia orgánica', om, '%', 'baja', 'MO baja, típica de cultivos convencionales en Burgos. Plan de recuperación a 3-5 años con compost + cubiertas.');
  } else if (om < 2.5) {
    pushWatch(out, 'organicMatterPct', 'Materia orgánica', om, '%', 'media-baja', 'MO en mejora pero todavía limitante. Mantén aportes anuales de compost y acolchado.');
  } else if (om < 3.5) {
    pushOK(out, 'organicMatterPct', 'Materia orgánica', om, '%', 'adecuada', 'MO adecuada para suelos de secano. Mantén prácticas regenerativas actuales.');
  } else {
    pushOK(out, 'organicMatterPct', 'Materia orgánica', om, '%', 'excelente', 'MO excelente. Suelo con alta capacidad de retención y actividad biológica.');
  }
}

function interpretCEC(a: SoilAnalysis, out: ParamInterpretation[]) {
  const cec = a.cecMeq100g;
  if (cec === undefined) return;
  if (cec < 10) {
    pushWatch(out, 'cecMeq100g', 'CIC', cec, 'meq/100 g', 'baja', 'CIC baja: suelo arenoso o pobre en arcilla/MO. Fertiliza fraccionado y aumenta MO.');
  } else if (cec <= 20) {
    pushOK(out, 'cecMeq100g', 'CIC', cec, 'meq/100 g', 'media', 'CIC media, adecuada para frutales y vid.');
  } else {
    pushOK(out, 'cecMeq100g', 'CIC', cec, 'meq/100 g', 'alta', 'CIC alta: buena reserva de nutrientes y agua.');
  }
}

function interpretActiveLimestone(a: SoilAnalysis, out: ParamInterpretation[], ctx: InterpretationContext) {
  const al = a.activeLimestonePct;
  if (al === undefined) return;
  const isFruit = isTreeCrop(ctx.cropType);
  if (al < 5) {
    pushOK(out, 'activeLimestonePct', 'Caliza activa', al, '%', 'baja', 'Caliza activa baja: sin riesgo de clorosis por carbonatos.');
  } else if (al < 9) {
    pushOK(out, 'activeLimestonePct', 'Caliza activa', al, '%', 'media', 'Caliza activa tolerable para portainjertos adaptados.');
  } else if (al <= 12) {
    const msg = isFruit
      ? 'Caliza activa alta: elige portainjertos tolerantes (GF-677 para almendro/melocotón, OHxF para peral) y vigila clorosis.'
      : 'Caliza activa alta: selecciona portainjertos de vid tolerantes (41B, Fercal, 140Ru).';
    pushWatch(out, 'activeLimestonePct', 'Caliza activa', al, '%', 'alta', msg);
  } else {
    const msg = isFruit
      ? 'Caliza activa muy alta: riesgo serio de clorosis férrica. Exige portainjertos muy tolerantes y Fe-EDDHA.'
      : 'Caliza activa muy alta: solo portainjertos de vid muy tolerantes (Fercal, 41B). Considera ubicación alternativa.';
    pushAction(out, 'activeLimestonePct', 'Caliza activa', al, '%', 'muy alta', msg);
  }
}

function interpretTotalCarbonates(a: SoilAnalysis, out: ParamInterpretation[]) {
  const tc = a.totalCarbonatesPct;
  if (tc === undefined) return;
  if (tc < 5) {
    pushOK(out, 'totalCarbonatesPct', 'Carbonatos totales', tc, '%', 'bajos', 'Carbonatos totales bajos.');
  } else if (tc < 20) {
    pushOK(out, 'totalCarbonatesPct', 'Carbonatos totales', tc, '%', 'medios', 'Carbonatos totales medios, habituales en Burgos.');
  } else if (tc < 40) {
    pushWatch(out, 'totalCarbonatesPct', 'Carbonatos totales', tc, '%', 'altos', 'Carbonatos totales altos: revisar caliza activa y reacción del pH.');
  } else {
    pushWatch(out, 'totalCarbonatesPct', 'Carbonatos totales', tc, '%', 'muy altos', 'Suelo muy calizo. Combina con caliza activa para afinar el riesgo real de bloqueos.');
  }
}

function interpretEC(a: SoilAnalysis, out: ParamInterpretation[]) {
  const ec = a.ecDsM;
  if (ec === undefined) return;
  if (ec < 0.5) {
    pushOK(out, 'ecDsM', 'Conductividad (CE)', ec, 'dS/m', 'no salina', 'Sin problemas de salinidad.');
  } else if (ec < 2) {
    pushWatch(out, 'ecDsM', 'Conductividad (CE)', ec, 'dS/m', 'ligeramente salina', 'Salinidad ligera: vigilar calidad del agua de riego y acumulación en bulbo.');
  } else if (ec < 4) {
    pushAction(out, 'ecDsM', 'Conductividad (CE)', ec, 'dS/m', 'moderada', 'Salinidad moderada: efecto en cultivos sensibles. Lavado invernal y agua de baja CE.');
  } else {
    pushAction(out, 'ecDsM', 'Conductividad (CE)', ec, 'dS/m', 'alta', 'Salinidad alta: riesgo severo. Replantea estrategia de riego y cultivo.');
  }
}

function interpretOlsenP(a: SoilAnalysis, out: ParamInterpretation[]) {
  const p = a.pOlsenPpm;
  if (p === undefined) return;
  if (p < 10) {
    pushAction(out, 'pOlsenPpm', 'P (Olsen)', p, 'ppm', 'bajo', 'Fósforo Olsen bajo: aportar fosfato natural o compost rico en P.');
  } else if (p < 20) {
    pushWatch(out, 'pOlsenPpm', 'P (Olsen)', p, 'ppm', 'medio-bajo', 'P medio-bajo: mantener aportes orgánicos regulares.');
  } else if (p <= 40) {
    pushOK(out, 'pOlsenPpm', 'P (Olsen)', p, 'ppm', 'adecuado', 'P Olsen en rango adecuado para frutales.');
  } else {
    pushWatch(out, 'pOlsenPpm', 'P (Olsen)', p, 'ppm', 'alto', 'P alto: no aportar más fósforo, vigilar lixiviación.');
  }
}

function interpretK(a: SoilAnalysis, out: ParamInterpretation[]) {
  const k = a.kExchangeablePpm;
  if (k === undefined) return;
  if (k < 120) {
    pushAction(out, 'kExchangeablePpm', 'K intercambiable', k, 'ppm', 'bajo', 'K bajo: previsible deficiencia en años productivos. Aportar sulfato potásico autorizado o compost rico en K.');
  } else if (k < 240) {
    pushWatch(out, 'kExchangeablePpm', 'K intercambiable', k, 'ppm', 'medio', 'K medio: suficiente para años de carga moderada, vigilar tras cosechas grandes.');
  } else if (k <= 400) {
    pushOK(out, 'kExchangeablePpm', 'K intercambiable', k, 'ppm', 'adecuado', 'K en rango adecuado.');
  } else {
    pushWatch(out, 'kExchangeablePpm', 'K intercambiable', k, 'ppm', 'alto', 'K alto: no aportar, vigilar relación Mg/K y posibles bloqueos.');
  }
}

function interpretBulkDensity(a: SoilAnalysis, out: ParamInterpretation[]) {
  const bd = a.bulkDensityGCm3;
  if (bd === undefined) return;
  if (bd < 1.2) {
    pushOK(out, 'bulkDensityGCm3', 'Densidad aparente', bd, 'g/cm³', 'esponjoso', 'Densidad baja: suelo aireado y con buena estructura.');
  } else if (bd <= 1.4) {
    pushOK(out, 'bulkDensityGCm3', 'Densidad aparente', bd, 'g/cm³', 'adecuada', 'Densidad adecuada.');
  } else if (bd <= 1.55) {
    pushWatch(out, 'bulkDensityGCm3', 'Densidad aparente', bd, 'g/cm³', 'compactación incipiente', 'Compactación incipiente: reduce pases de maquinaria y planta cubierta con raíces pivotantes.');
  } else {
    pushAction(out, 'bulkDensityGCm3', 'Densidad aparente', bd, 'g/cm³', 'compactado', 'Suelo compactado: descompacta con púa sin voltear e introduce cubiertas con raíz profunda.');
  }
}

function interpretEarthworms(a: SoilAnalysis, out: ParamInterpretation[]) {
  const e = a.earthwormsCountM2;
  if (e === undefined) return;
  if (e < 30) {
    pushAction(out, 'earthwormsCountM2', 'Lombrices', e, 'ind/m²', 'escasas', 'Muy pocas lombrices: la fauna edáfica está limitada. Mantén cubierta viva y aportes orgánicos continuos.');
  } else if (e < 100) {
    pushWatch(out, 'earthwormsCountM2', 'Lombrices', e, 'ind/m²', 'bajo', 'Población baja de lombrices: sigue aumentando MO y evita laboreo vertical agresivo.');
  } else {
    pushOK(out, 'earthwormsCountM2', 'Lombrices', e, 'ind/m²', 'sana', 'Población de lombrices sana: suelo biológicamente activo.');
  }
}

function interpretCN(a: SoilAnalysis, out: ParamInterpretation[]) {
  if (a.totalNitrogenPct === undefined) return;
  const cn = cnRatio(a.organicMatterPct, a.totalNitrogenPct);
  if (cn === undefined || !Number.isFinite(cn)) return;
  const val = Number(cn.toFixed(1));
  if (cn < 8) {
    pushWatch(out, 'cnRatio', 'Relación C/N', val, '', 'baja', 'C/N baja: mineralización rápida, riesgo de pérdidas de N. Aporta carbono (paja, acolchado leñoso).');
  } else if (cn <= 12) {
    pushOK(out, 'cnRatio', 'Relación C/N', val, '', 'óptima', 'C/N en rango óptimo, buena disponibilidad de N.');
  } else if (cn <= 15) {
    pushWatch(out, 'cnRatio', 'Relación C/N', val, '', 'alta', 'C/N alta: inmovilización de N probable tras aportes leñosos recientes.');
  } else {
    pushAction(out, 'cnRatio', 'Relación C/N', val, '', 'muy alta', 'C/N muy alta: inmovilización de N; compensa con compost maduro o N ecológico (gallinaza compostada).');
  }
}

export function interpretSoilAnalysis(
  analysis: SoilAnalysis,
  context: InterpretationContext = {},
): SoilInterpretation {
  const params: ParamInterpretation[] = [];
  interpretPh(analysis, params);
  interpretOM(analysis, params);
  interpretCN(analysis, params);
  interpretCEC(analysis, params);
  interpretActiveLimestone(analysis, params, context);
  interpretTotalCarbonates(analysis, params);
  interpretEC(analysis, params);
  interpretOlsenP(analysis, params);
  interpretK(analysis, params);
  interpretBulkDensity(analysis, params);
  interpretEarthworms(analysis, params);

  const recommendations = buildRecommendations(params, context);
  const summary = params.reduce(
    (acc, p) => {
      if (p.level === 'OK') acc.ok += 1;
      else if (p.level === 'WATCH') acc.watch += 1;
      else acc.action += 1;
      return acc;
    },
    { ok: 0, watch: 0, action: 0 },
  );
  return { params, recommendations, summary };
}

function buildRecommendations(
  params: ParamInterpretation[],
  ctx: InterpretationContext,
): Recommendation[] {
  const byKey = new Map(params.map((p) => [p.key, p] as const));
  const recs: Recommendation[] = [];

  const om = byKey.get('organicMatterPct');
  if (om && (om.level === 'ACTION' || om.level === 'WATCH')) {
    recs.push({
      id: 'rec-om-boost',
      title: 'Plan de recuperación de materia orgánica',
      rationale:
        'La MO está por debajo del 2.5%. En suelos calizos de Burgos esto limita la CIC efectiva, la retención hídrica y la actividad biológica. Aporta compost maduro (5-10 t/ha), acolchado de restos de poda y cubierta vegetal invernal con leguminosas.',
      operationType: 'COMPOSTING',
      priority: om.level === 'ACTION' ? 'HIGH' : 'MEDIUM',
      triggerParams: ['organicMatterPct'],
    });
    recs.push({
      id: 'rec-cover-crop',
      title: 'Sembrar cubierta vegetal con leguminosas',
      rationale:
        'Mezcla de veza + avena o trébol subterráneo para fijar N, proteger el suelo en invierno y aumentar MO tras terminación superficial (rolado o siega + mulch).',
      operationType: 'COVER_CROP_SOWING',
      priority: 'MEDIUM',
      triggerParams: ['organicMatterPct'],
    });
  }

  const al = byKey.get('activeLimestonePct');
  if (al && al.level === 'ACTION') {
    const isFruit = isTreeCrop(ctx.cropType);
    recs.push({
      id: 'rec-lime-rootstock',
      title: isFruit
        ? 'Seleccionar portainjertos tolerantes a caliza'
        : 'Seleccionar portainjertos de vid tolerantes a caliza',
      rationale: isFruit
        ? 'Con caliza activa >12% el riesgo de clorosis férrica es alto. Usa GF-677 (almendro/melocotón/ciruelo), OHxF 97 (peral) o Krymsk 86. Complementa con Fe-EDDHA localizado cuando haya síntomas.'
        : 'Con caliza activa >12% selecciona Fercal (hasta 40% caliza activa) o 41B (hasta 40%). Evita SO4 y 110R en estos suelos.',
      operationType: 'PLANTING',
      priority: 'HIGH',
      triggerParams: ['activeLimestonePct'],
    });
  }

  const ph = byKey.get('phWater');
  if (ph && ph.level === 'ACTION' && ph.value !== undefined && ph.value > 8.5) {
    recs.push({
      id: 'rec-sulfur-localized',
      title: 'Acidificar zona radicular con azufre elemental',
      rationale:
        'pH por encima de 8.5 combinado con caliza alta agrava la clorosis. Aplica azufre elemental en banda (200-500 kg/ha fraccionado) solo bajo copa y acompaña con aportes orgánicos.',
      operationType: 'SOIL_WORK',
      priority: 'MEDIUM',
      triggerParams: ['phWater'],
    });
  }

  const p = byKey.get('pOlsenPpm');
  if (p && p.level === 'ACTION') {
    recs.push({
      id: 'rec-phosphorus',
      title: 'Aportar fósforo de origen natural',
      rationale:
        'P Olsen < 10 ppm limita el crecimiento radicular y la fructificación. Aporta fosfato natural (Gafsa, Reno) en compost y prioriza cubiertas con raíz profunda (rábano forrajero) que solubilizan P.',
      operationType: 'COMPOSTING',
      priority: 'MEDIUM',
      triggerParams: ['pOlsenPpm'],
    });
  }

  const k = byKey.get('kExchangeablePpm');
  if (k && k.level === 'ACTION') {
    recs.push({
      id: 'rec-potassium',
      title: 'Reponer potasio con fuentes autorizadas en ecológico',
      rationale:
        'K < 120 ppm se quedará corto tras cosechas medias-altas. Usa sulfato potásico autorizado, cenizas certificadas o compost de orujo/mosto.',
      operationType: 'FERTIGATION',
      priority: 'MEDIUM',
      triggerParams: ['kExchangeablePpm'],
    });
  }

  const ec = byKey.get('ecDsM');
  if (ec && ec.level === 'ACTION') {
    recs.push({
      id: 'rec-salinity',
      title: 'Mitigar salinidad del suelo',
      rationale:
        'CE por encima de 2 dS/m afecta ya a cultivos sensibles. Revisa calidad del agua de riego, aplica lavado controlado en invierno y mantén acolchado para reducir ascenso capilar.',
      operationType: 'IRRIGATION',
      priority: 'HIGH',
      triggerParams: ['ecDsM'],
    });
  }

  const bd = byKey.get('bulkDensityGCm3');
  if (bd && bd.level === 'ACTION') {
    recs.push({
      id: 'rec-compaction',
      title: 'Descompactar sin voltear',
      rationale:
        'Densidad > 1.55 g/cm³ limita el enraizamiento. Pasa un descompactador de púa en tempero y siembra cubierta con raíz pivotante (nabo forrajero, rábano).',
      operationType: 'SOIL_WORK',
      priority: 'HIGH',
      triggerParams: ['bulkDensityGCm3'],
    });
  }

  const e = byKey.get('earthwormsCountM2');
  if (e && e.level === 'ACTION') {
    recs.push({
      id: 'rec-biology',
      title: 'Revitalizar la fauna del suelo',
      rationale:
        'Población de lombrices escasa. Mantén cubierta viva todo el año, reduce laboreo y añade aportes regulares de materia orgánica (compost, mulch de poda).',
      operationType: 'MULCHING',
      priority: 'MEDIUM',
      triggerParams: ['earthwormsCountM2'],
    });
  }

  const cn = byKey.get('cnRatio');
  if (cn && cn.level === 'ACTION') {
    recs.push({
      id: 'rec-cn',
      title: 'Compensar inmovilización de nitrógeno',
      rationale:
        'C/N por encima de 15 inmoviliza N disponible. Añade compost maduro o gallinaza compostada autorizada para equilibrar.',
      operationType: 'COMPOSTING',
      priority: 'MEDIUM',
      triggerParams: ['cnRatio'],
    });
  }

  return recs;
}

export const PARAM_LABELS: Record<string, string> = {
  phWater: 'pH (agua)',
  phKcl: 'pH (KCl)',
  organicMatterPct: 'Materia orgánica %',
  organicCarbonPct: 'Carbono orgánico %',
  totalNitrogenPct: 'N total %',
  cnRatio: 'Relación C/N',
  cecMeq100g: 'CIC (meq/100 g)',
  ecDsM: 'CE (dS/m)',
  pOlsenPpm: 'P Olsen (ppm)',
  kExchangeablePpm: 'K interc. (ppm)',
  caExchangeablePpm: 'Ca interc. (ppm)',
  mgExchangeablePpm: 'Mg interc. (ppm)',
  totalCarbonatesPct: 'Carbonatos totales %',
  activeLimestonePct: 'Caliza activa %',
  bulkDensityGCm3: 'Densidad aparente (g/cm³)',
  waterHoldingCapacityPct: 'Retención de agua %',
  aggregateStabilityPct: 'Estabilidad agregados %',
  earthwormsCountM2: 'Lombrices (ind/m²)',
};
