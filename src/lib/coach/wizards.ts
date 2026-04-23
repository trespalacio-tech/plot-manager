import type { OperationType } from '@/lib/db/types';

export interface WizardStep {
  title: string;
  body: string;
}

export interface CoachWizard {
  key: string;
  title: string;
  subtitle: string;
  operationType: OperationType;
  durationLabel?: string;
  materials: string[];
  safety: string[];
  steps: WizardStep[];
  references: string[];
}

export const COACH_WIZARDS: Record<string, CoachWizard> = {
  'mulching-under-canopy': {
    key: 'mulching-under-canopy',
    title: 'Acolchado bajo copa',
    subtitle:
      'Cómo instalar 8-10 cm de mulch en frutal o vid para proteger el suelo antes del estío.',
    operationType: 'MULCHING',
    durationLabel: 'Medio día por ha en parcela mediana',
    materials: [
      'Restos de poda triturados del invierno',
      'Paja de cereal (cebada preferente) sin tratamientos',
      'Cartón kraft marrón sin tintas (opcional, base antihierba)',
      'Horca y rastrillo',
    ],
    safety: [
      'Evita mulch fresco muy fino pegado al tronco: deja un anillo de 10 cm libre para que no se asfixie el cuello.',
      'Si hay riesgo de topillos, prefiere mulch de leña gruesa triturada y no demasiado húmedo.',
    ],
    steps: [
      {
        title: '1. Elige el momento',
        body:
          'Mayo-junio, con el suelo ya en tempero pero antes de las mínimas altas. Mejor tras una lluvia que en suelo seco: el mulch sella la humedad retenida.',
      },
      {
        title: '2. Prepara la superficie',
        body:
          'Siega la cubierta bajo copa (o arranca las malas hierbas anuales). Si vas a usar cartón, extiéndelo primero solapando 10 cm.',
      },
      {
        title: '3. Extiende 8-10 cm',
        body:
          'Capa homogénea desde el gotero hasta la línea de goteo del árbol. No hace falta llegar al tronco: deja anillo libre de 10 cm.',
      },
      {
        title: '4. Combina fracciones',
        body:
          'Mezcla restos de poda (C/N alto) con paja más fina: mejor estructura y degradación lenta controlada.',
      },
      {
        title: '5. Revisa y refresca',
        body:
          'A los 2 meses el espesor cae a la mitad. Añade 3-5 cm adicionales si observas suelo desnudo o en zonas de viento.',
      },
    ],
    references: [
      'Cook et al. 2018 — Mulch mitigation of evaporation in Mediterranean orchards.',
      'Rodríguez-Entrena et al. 2014 — Impacto del acolchado orgánico en suelos calizos de Castilla.',
    ],
  },
  'cover-crop-sowing': {
    key: 'cover-crop-sowing',
    title: 'Siembra de cubierta vegetal',
    subtitle: 'Cómo implantar una cubierta de invierno en calles o bajo copa.',
    operationType: 'COVER_CROP_SOWING',
    durationLabel: 'Una jornada por ha si preparas siembra a voleo',
    materials: [
      'Mezcla de semillas (ej. veza 25 kg + avena 40 kg + trébol subterráneo 5 kg por ha)',
      'Inoculante de Rhizobium si la mezcla lleva veza o guisante',
      'Grada ligera o rastra para cubrir semilla',
      'Rulo para compactar y asegurar contacto semilla-suelo',
    ],
    safety: [
      'No siembres sobre herbicida residual reciente: la germinación cae bruscamente.',
      'Ajusta la mezcla a tu pluviometría: zonas < 400 mm → aumenta gramíneas y evita exceso de leguminosa.',
    ],
    steps: [
      {
        title: '1. Ventana óptima',
        body:
          'Del 20 de septiembre al 10 de noviembre en Burgos: siembra antes de que el suelo se enfríe para garantizar nacencia antes de heladas.',
      },
      {
        title: '2. Prepara el lecho',
        body:
          'Siega corta la cubierta previa y pasa grada ligera a 3-5 cm. Evita volteo profundo para conservar la estructura.',
      },
      {
        title: '3. Siembra y dosis',
        body:
          'Siembra a voleo y enterrar 1-2 cm. Mezcla típica: 50-70 kg/ha total, con 30-50 % de leguminosa inoculada.',
      },
      {
        title: '4. Compacta',
        body:
          'Pasa rulo o rastra pesada: asegura contacto semilla-suelo y rebaja la evaporación superficial.',
      },
      {
        title: '5. Control temprano',
        body:
          'A las 3 semanas revisa nacencia. Si hay calvas > 20 %, resiembra puntualmente con mezcla rápida (avena).',
      },
    ],
    references: [
      'Abdalla et al. 2019 — Cover crops carbon and nitrogen dynamics.',
      'MAPA Guía de cubiertas vegetales en frutal y viñedo.',
    ],
  },
  'cover-crop-termination': {
    key: 'cover-crop-termination',
    title: 'Terminación de cubierta',
    subtitle: 'Cómo cerrar la cubierta en primavera sin laboreo agresivo.',
    operationType: 'COVER_CROP_TERMINATION',
    durationLabel: '3-4 horas por ha con rodillo',
    materials: [
      'Rodillo crimper o rulo pesado',
      'Segadora de mayales (alternativa a rolado)',
      'Marcadores para observar fenología de veza',
    ],
    safety: [
      'No termines antes de la floración plena de la leguminosa si quieres fijación N completa.',
      'Evita pases sobre suelo encharcado: compactas y pierdes estructura.',
    ],
    steps: [
      {
        title: '1. Observa la fenología',
        body:
          'Termina cuando la veza esté en antesis plena y las gramíneas en espigado. Antes te llevas biomasa verde con poca eficiencia.',
      },
      {
        title: '2. Elige método',
        body:
          'Rolado/crimper aplasta y lignifica el mulch en el sitio (ideal). Siega alta es buena alternativa si no tienes rodillo.',
      },
      {
        title: '3. Pasa en el momento justo',
        body:
          'Con rocío matinal la planta se tumba mejor y los tallos no rebrotan. Trabaja sobre suelo con tempero.',
      },
      {
        title: '4. Deja mulch en superficie',
        body:
          'No incorpores: la cubierta funciona como acolchado vivo hasta el verano y devuelve N mineralizado lentamente.',
      },
      {
        title: '5. Registra biomasa',
        body:
          'Si tienes balanza, pesa 1 m² por punto para estimar t/ha y apuntar en el cuaderno el aporte.',
      },
    ],
    references: [
      'Mirsky et al. 2012 — Roller-crimper termination of cover crops.',
      'Delpuech & Metay 2018 — Cover crop termination in Mediterranean vineyards.',
    ],
  },
  'pest-trap-setup': {
    key: 'pest-trap-setup',
    title: 'Instalación de trampas de monitoreo',
    subtitle: 'Cómo montar trampas delta y difusores de confusión sexual.',
    operationType: 'PEST_TREATMENT',
    durationLabel: '2-3 horas por ha',
    materials: [
      'Trampas delta con fondo pegajoso y feromona específica',
      'Difusores de confusión sexual (500-600 unidades/ha para carpocapsa)',
      'Guantes de nitrilo y bolsas para trampas usadas',
      'Ficha de seguimiento semanal',
    ],
    safety: [
      'Usa guantes: las feromonas contaminan la trampa si las manejas a mano.',
      'Evita mezclar feromonas de distintas especies en la misma posición.',
    ],
    steps: [
      {
        title: '1. Momento de instalación',
        body:
          'Finales de marzo en Burgos para carpocapsa. Antes del primer vuelo estimado (200 GDD base 10 desde 1 de enero).',
      },
      {
        title: '2. Altura y orientación',
        body:
          'Trampas a 1.5-1.8 m, en el tercio superior de la copa. Lado sureste, sombreadas.',
      },
      {
        title: '3. Densidad',
        body:
          'Trampas delta: 1 cada 2-4 ha. Difusores Isomate/CheckMate: 500-600 u/ha con borde perimetral reforzado.',
      },
      {
        title: '4. Seguimiento semanal',
        body:
          'Cuenta machos capturados, cambia fondo pegajoso cada 4 semanas y feromona según fabricante.',
      },
      {
        title: '5. Decisión por umbral',
        body:
          '3-5 machos/trampa·semana ya activa intervención complementaria (granulovirus, Bt, caolín).',
      },
    ],
    references: [
      'Ioriatti et al. 2019 — Codling moth mating disruption.',
      'Knight & Hilton 2007 — Trap catch thresholds for codling moth.',
    ],
  },
  'compost-application': {
    key: 'compost-application',
    title: 'Aplicación de compost bajo copa',
    subtitle: 'Cómo dosificar y extender compost maduro sin quemar raíces.',
    operationType: 'COMPOSTING',
    durationLabel: 'Media jornada por ha con remolque distribuidor',
    materials: [
      'Compost maduro (C/N 10-14, olor terroso)',
      'Remolque esparcidor o carretilla',
      'Rastrillo para nivelar',
    ],
    safety: [
      'Descarta compost que no haya superado fase termófila (>55 °C 15 días): riesgo de semillas y patógenos.',
      'No aportes sobre suelo encharcado ni con lluvia intensa prevista (lixiviación de N).',
    ],
    steps: [
      {
        title: '1. Verifica madurez',
        body:
          'Test de germinación rápido: germina cress sobre lixiviado de compost; > 80 % confirma madurez.',
      },
      {
        title: '2. Calcula la dosis',
        body:
          'Transición: 8-10 t/ha. Mantenimiento: 4-6 t/ha. Reparte solo en superficie bajo copa (hasta goteo).',
      },
      {
        title: '3. Momento',
        body:
          'Final de invierno (feb-abr) antes del acolchado. En vid, antes de brotación para que mineralice acompasado.',
      },
      {
        title: '4. Aplica',
        body:
          'Capa uniforme de 1-2 cm bajo copa. No amontonar contra tronco. Puedes complementar con riego suave para activar microflora.',
      },
      {
        title: '5. Cubre con mulch',
        body:
          'A los 10-15 días añade mulch encima: protege el compost de UV y mantiene humedad para la microflora.',
      },
    ],
    references: [
      'Scharenbroch et al. 2013 — Compost effects on soil microbial activity.',
      'Bernal et al. 2009 — Composting of organic wastes, quality parameters.',
    ],
  },
};

export function getWizard(key: string): CoachWizard | undefined {
  return COACH_WIZARDS[key];
}

export function wizardKeyForType(type: OperationType): string | undefined {
  for (const [key, w] of Object.entries(COACH_WIZARDS)) {
    if (w.operationType === type) return key;
  }
  return undefined;
}
