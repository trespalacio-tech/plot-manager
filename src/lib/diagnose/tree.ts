import type { DiagnoseTree } from './types';

/**
 * Árbol de decisión "Veo algo raro" — versión MVP, 8 hipótesis frecuentes.
 * Diseño honesto: confianza explícita, recomendación de consulta a técnico cuando hay riesgo.
 */
export const DIAGNOSE_TREE: DiagnoseTree = {
  rootNodeId: 'q-root',
  questions: {
    'q-root': {
      id: 'q-root',
      prompt: '¿Dónde observas el problema?',
      options: [
        { label: 'En las hojas', nextNode: 'q-hojas-color' },
        { label: 'En el fruto', nextNode: 'q-fruto-tipo' },
        { label: 'En la corteza, ramas o tronco', nextNode: 'q-corteza' },
        { label: 'Insectos visibles en planta o trampa', nextNode: 'q-insectos' },
        { label: 'En el suelo o en la base', nextNode: 'q-suelo-base' },
      ],
    },
    'q-hojas-color': {
      id: 'q-hojas-color',
      prompt: '¿Qué patrón observas en las hojas?',
      hint: 'Mira el envés y la zona afectada (nervios, bordes, manchas).',
      options: [
        {
          label: 'Amarillean entre los nervios (clorosis internervial)',
          hypothesisId: 'h-clorosis-ferrica',
        },
        { label: 'Manchas marrones o negras pequeñas', nextNode: 'q-hojas-manchas' },
        { label: 'Polvo blanco-grisáceo en haz/envés', hypothesisId: 'h-oidio' },
        {
          label: 'Manchas amarillas en haz + plumón gris en envés',
          hypothesisId: 'h-mildiu',
        },
        { label: 'Hojas enrolladas o deformadas', nextNode: 'q-hojas-deform' },
      ],
    },
    'q-hojas-manchas': {
      id: 'q-hojas-manchas',
      prompt: '¿En qué cultivo y qué aspecto tienen las manchas?',
      options: [
        {
          label: 'Manzano/peral: manchas oscuras, irregulares, también en fruto',
          hypothesisId: 'h-moteado-manzano',
        },
        {
          label: 'Vid: manchas necróticas pequeñas con halo claro',
          hypothesisId: 'h-mildiu',
        },
        {
          label: 'No estoy seguro · pedir ayuda al técnico',
          hypothesisId: 'h-baja-confianza',
        },
      ],
    },
    'q-hojas-deform': {
      id: 'q-hojas-deform',
      prompt: '¿Aprecias insectos pequeños bajo las hojas o brotes?',
      options: [
        {
          label: 'Sí, colonias verdes/negras blandas (pulgón)',
          hypothesisId: 'h-pulgon',
        },
        {
          label: 'No veo insectos, hojas hervidas/abolladas (melocotonero)',
          hypothesisId: 'h-abolladura',
        },
        {
          label: 'No estoy seguro',
          hypothesisId: 'h-baja-confianza',
        },
      ],
    },
    'q-fruto-tipo': {
      id: 'q-fruto-tipo',
      prompt: '¿Qué cultivo y qué tipo de daño observas en el fruto?',
      options: [
        {
          label: 'Manzano/peral: galería con orificio y excremento marrón',
          hypothesisId: 'h-carpocapsa',
        },
        {
          label: 'Manzano/peral: manchas oscuras rugosas',
          hypothesisId: 'h-moteado-manzano',
        },
        {
          label: 'Vid: racimo cubierto de moho gris',
          hypothesisId: 'h-botritis',
        },
        {
          label: 'Vid: granos secos o con mildiu polvoriento',
          hypothesisId: 'h-mildiu',
        },
      ],
    },
    'q-corteza': {
      id: 'q-corteza',
      prompt: '¿Qué observas en la corteza o ramas?',
      options: [
        {
          label: 'Exudados gomosos en hueso (cerezo, ciruelo, almendro)',
          hypothesisId: 'h-gomosis',
        },
        {
          label: 'Cancro deprimido con bordes evidentes',
          hypothesisId: 'h-cancro',
        },
        {
          label: 'Líquenes/musgo abundante (no patológico)',
          hypothesisId: 'h-liquenes',
        },
      ],
    },
    'q-insectos': {
      id: 'q-insectos',
      prompt: '¿Qué tipo de capturas o insectos ves?',
      options: [
        {
          label: 'Polilla en trampa de carpocapsa (manzano/peral/nogal)',
          hypothesisId: 'h-carpocapsa',
        },
        {
          label: 'Polilla pequeña en trampa de polilla del racimo (vid)',
          hypothesisId: 'h-lobesia',
        },
        {
          label: 'Pulgones en brotes',
          hypothesisId: 'h-pulgon',
        },
        {
          label: 'Insectos no identificados',
          hypothesisId: 'h-baja-confianza',
        },
      ],
    },
    'q-suelo-base': {
      id: 'q-suelo-base',
      prompt: '¿Qué observas a nivel de suelo o cuello del árbol?',
      options: [
        {
          label: 'Encharcamiento prolongado o suelo costroso',
          hypothesisId: 'h-compactacion',
        },
        {
          label: 'Cuello hinchado o exudados negros (Phytophthora)',
          hypothesisId: 'h-phytophthora',
        },
        {
          label: 'Galerías o roeduras en cuello/raíz',
          hypothesisId: 'h-roedores',
        },
      ],
    },
  },
  hypotheses: {
    'h-clorosis-ferrica': {
      id: 'h-clorosis-ferrica',
      title: 'Clorosis férrica',
      confidence: 'HIGH',
      description:
        'Hojas amarillas con nervios verdes, especialmente en brotes nuevos. Causada por bloqueo de hierro en suelos calizos (caliza activa > 7-9 %) o encharcamiento.',
      monitoring: [
        'Confirmar caliza activa en analítica de suelo (> 9 % es factor decisivo).',
        'Observar si afecta solo a variedades sensibles (Conferencia, manzano sobre M-9).',
        'Revisar drenaje: encharcamiento agrava el bloqueo.',
      ],
      managementOptions: [
        'Aporte foliar urgente de quelato de hierro EDDHA en suelo básico.',
        'Mejorar materia orgánica (compost + mulch) para activar movilización biológica del Fe.',
        'En replante futuro, elegir patrones tolerantes a caliza (MM-111, 41B en vid).',
      ],
      inputIds: [],
      references: ['Drouineau 1942 — Méthode d’analyse du calcaire actif.'],
      whenToConsultExpert:
        'Si afecta a > 30 % del árbol o se repite cada año pese a aportes, consulta agronomía regional para evaluar replante o sustitución de patrón.',
    },
    'h-oidio': {
      id: 'h-oidio',
      title: 'Oídio',
      confidence: 'HIGH',
      description:
        'Polvo blanco-grisáceo en hojas, brotes y racimo (vid) o frutos (manzano). Favorecido por días cálidos/secos con noches húmedas.',
      monitoring: [
        'Revisar 20 hojas/parcela semanalmente desde brotación.',
        'En vid, especial atención a yemas basales del año anterior.',
      ],
      managementOptions: [
        'Azufre mojable 3-6 kg/ha; evitar > 28 °C.',
        'Bicarbonato sódico 5 g/L con humectante en focos puntuales.',
        'Cubierta vegetal moderada para mantener humedad relativa estable.',
      ],
      inputIds: ['azufre-mojable', 'bicarbonato-sodico'],
    },
    'h-mildiu': {
      id: 'h-mildiu',
      title: 'Mildiu (Plasmopara viticola en vid; Phytophthora infestans en otros)',
      confidence: 'HIGH',
      description:
        'Manchas amarillas o aceitosas en haz y plumón blanquecino en envés. Vid: muy destructivo en floración con humedad y temperatura > 12 °C.',
      monitoring: [
        'Modelo "regla de los 3-10": > 10 mm de lluvia + 10 °C + 10 cm brote = riesgo.',
        'Inspección tras lluvia primaveral.',
      ],
      managementOptions: [
        'Cobre (caldo bordelés) 200-400 g Cu/ha tras lluvia. Respetar 4 kg Cu/ha/año acumulado.',
        'Cubierta vegetal en calle para airear.',
        'Poda en verde para mejorar aireación del racimo.',
      ],
      inputIds: ['cobre-bordeles'],
    },
    'h-carpocapsa': {
      id: 'h-carpocapsa',
      title: 'Carpocapsa (Cydia pomonella)',
      confidence: 'HIGH',
      description:
        'Lepidóptero principal en pomáceas y nogal. Larva entra en fruto dejando galería con excremento.',
      monitoring: [
        'Trampa delta con feromona desde finales de marzo.',
        'Umbral: 3-5 machos/trampa·semana → activar manejo.',
        'Calcular GDD base 10 desde 1-ene para predecir vuelos.',
      ],
      managementOptions: [
        'Confusión sexual con Isomate C+ 500-600 dif/ha antes del primer vuelo.',
        'Granulovirus (CpGV) en eclosión, repetir cada 7-10 días.',
        'Bt kurstaki para complementar en picos (eficacia limitada > L3).',
      ],
      inputIds: ['feromona-isomate', 'cpgv-granulovirus', 'bt-kurstaki'],
      references: ['Ioriatti et al. 2019 — Codling moth mating disruption.'],
    },
    'h-moteado-manzano': {
      id: 'h-moteado-manzano',
      title: 'Moteado del manzano (Venturia inaequalis)',
      confidence: 'MEDIUM',
      description:
        'Manchas oliváceas en hoja y fruto. Favorecido por primaveras lluviosas. Defolia y reduce calidad del fruto.',
      monitoring: [
        'Modelo Mills: horas de humedad + temperatura predicen ataque.',
        'Revisar variedades susceptibles (Golden, Gala) en primaveras lluviosas.',
      ],
      managementOptions: [
        'Cobre preventivo en hinchado de yema y caída de pétalo (respetar límite anual).',
        'Azufre o bicarbonato sódico en infecciones leves.',
        'Triturar hojarasca caída y compostar para reducir inóculo invernante.',
      ],
      inputIds: ['cobre-bordeles', 'azufre-mojable'],
      whenToConsultExpert:
        'Si tras 2 años de manejo persiste con > 30 % fruto afectado, valora cambio de variedad o injerto.',
    },
    'h-pulgon': {
      id: 'h-pulgon',
      title: 'Pulgón (varias especies)',
      confidence: 'HIGH',
      description:
        'Pulgones verdes/negros en brotes y envés de hojas. Causan deformación, melaza y negrilla. Suele autorregularse con auxiliares (mariquitas, sírfidos).',
      monitoring: [
        'Inspección semanal de brotes nuevos.',
        'Buscar también auxiliares (huevos de sírfido, ninfas de mariquita) antes de tratar.',
      ],
      managementOptions: [
        'Esperar 7-10 días si hay auxiliares: regulación natural frecuente.',
        'Jabón potásico 1-2 % en horas frescas si la infestación es alta.',
        'Bandas florales y refugios para sostener auxiliares.',
      ],
      inputIds: ['jabon-potasico'],
    },
    'h-abolladura': {
      id: 'h-abolladura',
      title: 'Abolladura del melocotonero (Taphrina deformans)',
      confidence: 'HIGH',
      description:
        'Hojas hinchadas, gruesas y rojizas en primavera, en melocotonero y nectarino. Infección invernal en yema.',
      monitoring: [
        'Inspeccionar a partir de hinchado de yema en febrero.',
      ],
      managementOptions: [
        'Tratamiento de cobre en caída de hoja y al hinchado de yema (preventivo).',
        'Una vez visible la abolladura, es tarde: planificar invierno siguiente.',
      ],
      inputIds: ['cobre-bordeles'],
    },
    'h-botritis': {
      id: 'h-botritis',
      title: 'Botritis del racimo (Botrytis cinerea)',
      confidence: 'MEDIUM',
      description:
        'Moho gris en racimo de vid, especialmente con humedad alta y heridas. Pérdida de cosecha y calidad.',
      monitoring: [
        'Inspeccionar racimos en envero y maduración.',
        'Revisar daños previos (oídio, polilla, rajado): puerta de entrada.',
      ],
      managementOptions: [
        'Deshojado del racimo en envero: aireación clave.',
        'Bicarbonato sódico aplicado preventivamente en envero.',
        'Reducir vigor con cubierta competidora.',
      ],
      inputIds: ['bicarbonato-sodico'],
    },
    'h-lobesia': {
      id: 'h-lobesia',
      title: 'Polilla del racimo (Lobesia botrana)',
      confidence: 'HIGH',
      description:
        'Tres generaciones anuales en vid. Dañan racimos y abren puerta a botritis.',
      monitoring: [
        'Trampa delta con feromona desde inicio de brotación.',
        'Umbral de 2ª generación: 10 capturas/trampa·semana.',
      ],
      managementOptions: [
        'Confusión sexual (RAK 1+2) en parcelas grandes.',
        'Bt kurstaki dirigido a 2ª y 3ª generación.',
      ],
      inputIds: ['bt-kurstaki'],
    },
    'h-gomosis': {
      id: 'h-gomosis',
      title: 'Gomosis bacteriana o por estrés',
      confidence: 'MEDIUM',
      description:
        'Exudado gomoso en cerezo, ciruelo o almendro. Origen variado: Pseudomonas, podas mal cicatrizadas, encharcamiento, plagas de madera.',
      monitoring: [
        'Identificar si hay cancro asociado o solo exudado.',
        'Revisar drenaje de la zona y estado de raíces.',
      ],
      managementOptions: [
        'Podar fuera de épocas de lluvia, sellar cortes con pasta cicatrizante natural.',
        'Cobre preventivo en caída de hoja para Pseudomonas.',
        'Mejorar drenaje y reducir compactación con mulch.',
      ],
      inputIds: ['cobre-bordeles'],
      whenToConsultExpert:
        'Si la gomosis afecta a > 3 árboles agrupados, sospecha problema sistémico (suelo o patógeno) y consulta técnico antes de actuar.',
    },
    'h-cancro': {
      id: 'h-cancro',
      title: 'Cancro de la madera',
      confidence: 'LOW',
      description:
        'Lesión deprimida en corteza, posible secado de rama. Múltiples agentes (Nectria, Phomopsis, Botryosphaeria, Pseudomonas).',
      monitoring: [
        'Identificar si la zona seca avanza estacionalmente.',
        'Fotografía y muestra de tejido afectado para diagnóstico de laboratorio.',
      ],
      managementOptions: [
        'Podar y eliminar madera afectada en seco (no en lluvia).',
        'Sellar cortes con pasta cicatrizante.',
        'Cobre preventivo en caída de hoja.',
      ],
      inputIds: ['cobre-bordeles'],
      whenToConsultExpert:
        'Confianza baja: identificar el patógeno requiere análisis. Consulta servicio agronómico antes de tratar.',
    },
    'h-liquenes': {
      id: 'h-liquenes',
      title: 'Líquenes y musgo en corteza',
      confidence: 'HIGH',
      description:
        'Manchas grises, verdes o amarillas en corteza. Indicador de baja contaminación y, generalmente, no patológico.',
      monitoring: [
        'Observar si conviven con grietas, gomosis u otros síntomas.',
      ],
      managementOptions: [
        'Sin actuación necesaria: son inofensivos para el árbol.',
        'Si abundan en árboles muy debilitados, mejorar manejo (poda, fertilidad, drenaje).',
      ],
    },
    'h-compactacion': {
      id: 'h-compactacion',
      title: 'Compactación del suelo',
      confidence: 'HIGH',
      description:
        'Suelo costroso, encharcamiento, infiltración lenta. Reduce raíces y favorece patógenos radiculares.',
      monitoring: [
        'Test de infiltración (anillo): < 10 mm/h indica compactación severa.',
        'Inspección visual tras lluvia.',
      ],
      managementOptions: [
        'Cubierta vegetal con raíz pivotante (rábano forrajero, esparceta).',
        'Reducir pase de maquinaria en suelo húmedo.',
        'Aporte de compost + mulch para regenerar estructura.',
      ],
      inputIds: ['compost-maduro'],
    },
    'h-phytophthora': {
      id: 'h-phytophthora',
      title: 'Phytophthora del cuello',
      confidence: 'MEDIUM',
      description:
        'Necrosis del cuello, exudados oscuros, decaimiento general. Asociado a encharcamiento prolongado y patrones susceptibles.',
      monitoring: [
        'Excavar superficialmente: corteza marrón con olor agrio confirma sospecha.',
      ],
      managementOptions: [
        'Mejorar drenaje urgentemente: la encharcamiento es la causa principal.',
        'Trichoderma spp. al suelo como medida preventiva en árboles vecinos.',
        'Eliminar árboles muy afectados para evitar reservorio.',
      ],
      inputIds: ['trichoderma'],
      whenToConsultExpert:
        'Si afecta a > 2 árboles, consulta técnico: diagnóstico de laboratorio recomendado.',
    },
    'h-roedores': {
      id: 'h-roedores',
      title: 'Daños por topillos / conejos',
      confidence: 'HIGH',
      description:
        'Galerías o roeduras en cuello y raíz, especialmente bajo mulch grueso o en parcelas con cubierta densa.',
      monitoring: [
        'Inspección invernal del cuello (apartar mulch).',
        'Buscar galerías frescas en perímetro.',
      ],
      managementOptions: [
        'Anillo libre de mulch de 10-15 cm alrededor del tronco.',
        'Protectores de tronco en plantaciones jóvenes.',
        'Mantener depredadores (lechuzas, comadrejas) con cajas nido y refugios.',
      ],
    },
    'h-baja-confianza': {
      id: 'h-baja-confianza',
      title: 'Diagnóstico no concluyente',
      confidence: 'LOW',
      description:
        'Los síntomas descritos no permiten una hipótesis robusta. La honestidad pesa más que adivinar.',
      monitoring: [
        'Documenta con varias fotos (lejos, cerca, envés y haz).',
        'Anota fecha, parcela, variedad y condiciones meteo recientes.',
      ],
      managementOptions: [
        'No tratar a ciegas. Espera a confirmar diagnóstico.',
        'Crea una entrada en cuaderno con la observación para seguimiento.',
      ],
      whenToConsultExpert:
        'Recomendación: contacta con tu técnico de zona (cooperativa, ITACyL, oficina comarcal del MAPA) antes de cualquier intervención.',
    },
  },
};
