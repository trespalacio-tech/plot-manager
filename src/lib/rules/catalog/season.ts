import type { Proposal, Rule, RuleContext } from '../types';
import { isTreeCrop, isVineCrop } from '@/lib/db/cropFamilies';

function isFruit(ctx: RuleContext): boolean {
  return isTreeCrop(ctx.parcel.cropType);
}

function isVineyard(ctx: RuleContext): boolean {
  return isVineCrop(ctx.parcel.cropType);
}

export const seasonWinterPheromones: Rule = {
  id: 'season-winter-pheromones',
  title: 'Confusión sexual: preparar trampas',
  description: 'En febrero-marzo revisar/instalar difusores de feromonas antes del vuelo.',
  category: 'SEASON',
  evaluate(ctx): Proposal[] {
    if (!isFruit(ctx)) return [];
    if (ctx.month < 2 || ctx.month > 3) return [];
    return [
      {
        kind: 'TASK',
        operationType: 'PEST_TREATMENT',
        title: 'Colocar difusores de feromonas (carpocapsa/anarsia)',
        rationale:
          'En Burgos el primer vuelo de Cydia pomonella arranca a finales de marzo (200-250 grados-día base 10 desde enero). Los difusores deben estar colocados antes del primer macho capturado.',
        scientificBasis:
          'Ioriatti et al. (2019): confusión sexual reduce capturas > 90 % si la densidad es ≥ 500 difusores/ha y se instalan pre-vuelo.',
        priority: 'HIGH',
        dueDate: new Date(ctx.now.getFullYear(), 2, 25),
      },
    ];
  },
};

export const seasonSpringMulching: Rule = {
  id: 'season-spring-mulching',
  title: 'Acolchado de primavera',
  description: 'Antes de las altas temperaturas, acolchar bajo copa con restos triturados.',
  category: 'SEASON',
  evaluate(ctx): Proposal[] {
    if (ctx.month < 5 || ctx.month > 6) return [];
    const recentMulch = ctx.recentFieldLog.some((e) => e.type === 'MULCHING');
    if (recentMulch) return [];
    return [
      {
        kind: 'TASK',
        operationType: 'MULCHING',
        title: 'Acolchar bajo copa antes del estrés hídrico',
        rationale:
          'Mayo-junio en Burgos suele marcar el paso a balance hídrico negativo. 8-10 cm de mulch reducen evaporación 30-50 %.',
        scientificBasis:
          'Cook et al. (2018): mulch orgánico baja temperatura del suelo 2-4 °C y mantiene humedad 15-25 % más tiempo tras riego.',
        priority: 'MEDIUM',
        dueDate: new Date(ctx.now.getFullYear(), 5, 15),
      },
    ];
  },
};

export const seasonSummerWater: Rule = {
  id: 'season-summer-water',
  title: 'Control de estrés hídrico estival',
  description: 'Julio-agosto: monitorear humedad y ajustar riego deficitario.',
  category: 'SEASON',
  evaluate(ctx): Proposal[] {
    if (ctx.month < 7 || ctx.month > 8) return [];
    if (ctx.parcel.irrigation === 'RAINFED') return [];
    return [
      {
        kind: 'TASK',
        operationType: 'MONITORING',
        title: 'Monitorizar estado hídrico (tensiómetros/TDR)',
        rationale:
          'Pico de ETo en Burgos 4.5-6 mm/día. Riego deficitario controlado en fruto cuajado reduce brotación y mejora calidad si no se atraviesa periodo crítico.',
        scientificBasis:
          'Ruiz-Sánchez et al. (2010): RDI en melocotonero post-cuajado ahorra 25-40 % de agua sin pérdida de cosecha.',
        priority: 'MEDIUM',
      },
    ];
  },
};

export const seasonAutumnCoverCrop: Rule = {
  id: 'season-autumn-cover-crop',
  title: 'Siembra de cubierta otoñal',
  description: 'Octubre-noviembre: ventana para sembrar cubierta con leguminosas.',
  category: 'SEASON',
  evaluate(ctx): Proposal[] {
    if (ctx.month < 10 || ctx.month > 11) return [];
    const sowed = ctx.recentFieldLog.some((e) => e.type === 'COVER_CROP_SOWING');
    if (sowed) return [];
    return [
      {
        kind: 'TASK',
        operationType: 'COVER_CROP_SOWING',
        title: 'Sembrar cubierta vegetal invernal',
        rationale:
          'Octubre-noviembre con suelo tempero aprovechan las lluvias otoñales de Burgos. Mezcla veza + avena + trébol: fija N, protege frente a erosión y aporta biomasa para mulch.',
        scientificBasis:
          'Abdalla et al. (2019): cubiertas con leguminosas secuestran 0.3-0.6 t C/ha·año y fijan 40-80 kg N/ha.',
        priority: 'MEDIUM',
        dueDate: new Date(ctx.now.getFullYear(), 10, 10),
      },
    ];
  },
};

export const seasonAlmondFrost: Rule = {
  id: 'season-almond-frost',
  title: 'Aviso de heladas en floración',
  description: 'Febrero-marzo: frutal de hueso temprano en zonas altas de Burgos.',
  category: 'SEASON',
  evaluate(ctx): Proposal[] {
    if (!isFruit(ctx)) return [];
    if (ctx.month < 2 || ctx.month > 3) return [];
    return [
      {
        kind: 'ALERT',
        severity: 'WARNING',
        title: 'Ventana de heladas tardías',
        message:
          'Almendro y melocotonero entran en floración entre F10 y F50 este mes. Activa protocolo de protección (riego por aspersión, ventiladores, velas) si la AEMET prevé mínimas < -1 °C.',
        expiresAt: new Date(ctx.now.getFullYear(), 3, 20),
      },
    ];
  },
};

export const seasonVineyardFlowering: Rule = {
  id: 'season-vineyard-flowering',
  title: 'Vid: vigilancia mildiu en floración',
  description: 'Mayo-junio BBCH 53-65: periodo crítico de mildiu.',
  category: 'SEASON',
  evaluate(ctx): Proposal[] {
    if (!isVineyard(ctx)) return [];
    if (ctx.month < 5 || ctx.month > 6) return [];
    return [
      {
        kind: 'TASK',
        operationType: 'MONITORING',
        title: 'Monitorear mildiu alrededor de la floración',
        rationale:
          'BBCH 53 (yemas algodonosas) a BBCH 68 (fin floración) es la ventana crítica: Plasmopara viticola infecta racimos jóvenes con 3-2-10 (≥10 mm lluvia, ≥10 °C, ≥10 cm brotes).',
        scientificBasis:
          'Rossi et al. (2008) modelo VitiMeteo: protección con cobre autorizado (máx 4 kg Cu/ha·año UE) fraccionado en lluvias significativas.',
        priority: 'HIGH',
        dueDate: new Date(ctx.now.getFullYear(), 5, 15),
      },
    ];
  },
};

export const seasonVineyardCluster: Rule = {
  id: 'season-vineyard-cluster',
  title: 'Vid: deshojado sanitario en cuajado',
  description: 'Julio: deshojado lado este en BBCH 71-75 para airear racimos.',
  category: 'SEASON',
  evaluate(ctx): Proposal[] {
    if (!isVineyard(ctx)) return [];
    if (ctx.month !== 7) return [];
    return [
      {
        kind: 'TASK',
        operationType: 'PRUNING',
        title: 'Deshojado sanitario lado este (BBCH 71-75)',
        rationale:
          'Retirar 4-6 hojas basales en el lado de menor insolación mejora aireación del racimo, reduce botritis y facilita penetración de tratamientos.',
        scientificBasis:
          'Palliotti et al. (2012): deshojado pre-cierre de racimo reduce severidad de Botrytis 40-60 % sin pérdida de antocianos en tintas.',
        priority: 'MEDIUM',
        dueDate: new Date(ctx.now.getFullYear(), 6, 20),
      },
    ];
  },
};

export const seasonFruitCodlingMoth: Rule = {
  id: 'season-fruit-codling-moth',
  title: 'Carpocapsa: trampas de monitoreo',
  description: 'Junio-agosto: revisar trampas delta en frutal de pepita/hueso.',
  category: 'SEASON',
  evaluate(ctx): Proposal[] {
    if (!isFruit(ctx)) return [];
    if (ctx.month < 6 || ctx.month > 8) return [];
    return [
      {
        kind: 'TASK',
        operationType: 'MONITORING',
        title: 'Revisar trampas delta de carpocapsa y umbrales',
        rationale:
          'Segunda y tercera generación de Cydia pomonella concentran daño. Cambiar fondo pegajoso cada 4 semanas y feromona según fabricante.',
        scientificBasis:
          'Knight & Hilton (2007): umbral 3-5 machos/trampa·semana activa intervención complementaria (Cydia granulosis virus, caolín).',
        priority: 'MEDIUM',
      },
    ];
  },
};
