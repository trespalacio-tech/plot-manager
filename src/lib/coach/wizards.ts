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
  'nut-bordeaux-leaf-fall': {
    key: 'nut-bordeaux-leaf-fall',
    title: 'Caldo bordelés a caída de hoja (frutos secos)',
    subtitle:
      'Cómo aplicar dos pasadas de cobre en otoño para reducir bacteriosis, antracnosis, mancha ocre y abolladura.',
    operationType: 'DISEASE_TREATMENT',
    durationLabel: 'Media jornada por ha + 2ª pasada 10-15 días después',
    materials: [
      'Caldo bordelés (sulfato de cobre + cal apagada) en polvo mojable, 600-1.000 g/hl',
      'Pulverizador de presión (mochila para parcelas pequeñas, atomizador para >1 ha)',
      'EPI completo: mono, guantes nitrilo, gafas, mascarilla FFP2',
      'Agua limpia (preferible no clorada)',
    ],
    safety: [
      'No tratar con viento >15 km/h: deriva y pérdida de eficacia.',
      'Cobre se acumula en suelo: máximo 4 kg Cu metal/ha·año en producción ecológica.',
      'No mezclar con productos de reacción ácida (vinagre, azufre líquido).',
    ],
    steps: [
      {
        title: '1. Elige el momento exacto',
        body:
          'Primera pasada al 50 % de hojas caídas (sirve aún algo de cobertura), segunda al 100 %. En Burgos: ~5-15 nov para almendro/avellano y 10-25 nov para nogal/pistacho.',
      },
      {
        title: '2. Prepara el caldo',
        body:
          'Llena el tanque al 70 % con agua. Añade el cobre poco a poco con agitación constante. Mantén agitación durante toda la aplicación: el cobre sedimenta rápido.',
      },
      {
        title: '3. Pulveriza hasta goteo incipiente',
        body:
          'Cubre toda la copa, ramas principales y tronco. En árboles grandes empieza por arriba y baja. Caudal típico 600-1.000 L/ha en árbol adulto.',
      },
      {
        title: '4. Repite a 10-15 días',
        body:
          'Si llueve >15 mm en las 24 h posteriores, anota el lavado y prevé adelantar la 2ª pasada.',
      },
      {
        title: '5. Limpia y registra',
        body:
          'Lava el equipo con agua limpia 2-3 veces. Anota dosis, fecha y condiciones en el cuaderno de campo (obligatorio en ecológico).',
      },
    ],
    references: [
      'Vargas & Romero (2012) — Tratamientos de cobre en almendro.',
      'Lindow et al. (2014) — Cu post-cosecha en nogal contra Xanthomonas.',
      'GIP MAPA Nogal y Avellano.',
      'Reglamento (CE) 889/2008 — anexo II productos autorizados ecológico.',
    ],
  },
  'nut-winter-oil': {
    key: 'nut-winter-oil',
    title: 'Aceite de parafina a yema hinchada',
    subtitle:
      'Tratamiento clave de invierno-prefloración contra cochinilla y huevos invernantes.',
    operationType: 'PEST_TREATMENT',
    durationLabel: '2-3 horas por ha',
    materials: [
      'Aceite parafínico al 1,5-2 % (autorizado ecológico)',
      'Pulverizador con boquilla de cono hueco',
      'EPI: guantes nitrilo, gafas, mono',
    ],
    safety: [
      'Solo aplicar en yema hinchada (B-C): si hay flor abierta produce fitotoxicidad y mata polinizadores.',
      'Temperatura mínima >5 °C; no aplicar si pronostican heladas en 48 h.',
      'No mezclar con cobre el mismo día (incompatibilidad química).',
    ],
    steps: [
      {
        title: '1. Diagnostica fenología',
        body:
          'Confirma estado B-C (yema hinchada, antes de pétalo visible). En almendro Vairo en Burgos suele caer 20-feb a 10-mar.',
      },
      {
        title: '2. Prepara dosis',
        body:
          '1,5-2 L de aceite por 100 L de agua. Agita primero el agua, añade aceite con agitación enérgica para emulsionar.',
      },
      {
        title: '3. Pulveriza con cobertura total',
        body:
          'Mojado completo de tronco, ramas y yemas. La acción es por asfixia: si no moja, no funciona.',
      },
      {
        title: '4. Registra',
        body:
          'Anota fecha, dosis y estado fenológico exacto en el cuaderno.',
      },
    ],
    references: [
      'GIP MAPA Almendro — uso de aceite parafínico en prefloración.',
      'Cataluña GIP frutos secos: ficha técnica aceite parafina.',
    ],
  },
  'almond-monilia-prevention': {
    key: 'almond-monilia-prevention',
    title: 'Prevención de monilia en almendro (prefloración)',
    subtitle:
      'Combinado anti-monilia, abolladura y cribado en estado C-D de Vairo/Lauranne.',
    operationType: 'DISEASE_TREATMENT',
    durationLabel: '3-4 horas por ha',
    materials: [
      'Sulfato cuprocálcico u oxicloruro de cobre (300-500 g cobre metal/hl)',
      'Aceite parafínico 1 % como adherente (opcional pero recomendado)',
      'EPI completo',
    ],
    safety: [
      'No aplicar con flor abierta: daño a abejas y polinización.',
      'Si aparecen pétalos blancos visibles, suspende.',
      'Respetar plazos de seguridad y registro CCPAE/SOHISCERT en ecológico.',
    ],
    steps: [
      {
        title: '1. Verifica estado fenológico',
        body:
          'Estado C-D: yema con escamas separadas, pétalos no visibles. Si encuentras una flor abierta, ya es tarde.',
      },
      {
        title: '2. Decisión por humedad',
        body:
          'Si AEMET prevé >3 días con HR > 80 % o lluvia en próximos 7 días, el tratamiento es URGENTE: monilia coloniza pistilos durante floración húmeda.',
      },
      {
        title: '3. Aplica con cobertura completa',
        body:
          'Pulveriza ramas, brotes y yemas hasta goteo incipiente. En árbol adulto 600-800 L/ha.',
      },
      {
        title: '4. Refuerzo si la floración se alarga',
        body:
          'Solo si llueve durante floración: aplica caldo bordelés justo después, en estado G-H (caída de pétalos), para cerrar la ventana.',
      },
    ],
    references: [
      'BASF Camposcopio (2024) — Momento más sensible del almendro.',
      'Holb (2008) — Monilinia laxa epidemiology in stone fruits.',
      'Martínez Carra — Tratamiento prefloración almendro.',
    ],
  },
  'nut-walnut-codling-confusion': {
    key: 'nut-walnut-codling-confusion',
    title: 'Confusión sexual de carpocapsa en nogal',
    subtitle: 'Instalación de difusores de feromona antes del primer vuelo.',
    operationType: 'PEST_TREATMENT',
    durationLabel: '2-3 horas por ha (instalación)',
    materials: [
      'Difusores Cydia pomonella (Isomate CTT, CheckMate, Ecodian) a 500-600 unid./ha',
      'Trampa delta testigo con feromona de monitoreo',
      'Escalera o pértiga para colgar a 2/3 de altura del árbol',
      'Bridas o alambres de plástico no agresivo',
    ],
    safety: [
      'No tocar el difusor con la piel directa: usa guantes.',
      'No es venenoso, pero confunde tu olfato durante horas.',
    ],
    steps: [
      {
        title: '1. Instala antes del primer vuelo',
        body:
          'En Burgos a partir de 25-abr a 15-may según altitud. Indicador: temperatura media >10 °C durante 5 días seguidos = activación de adultos.',
      },
      {
        title: '2. Distribución uniforme',
        body:
          '500-600 difusores/ha en cuadrícula regular; reforzar bordes con +25 % (la confusión decae en linde por dilución de feromona).',
      },
      {
        title: '3. Cuelga a 2/3 de altura del árbol',
        body:
          'Donde se concentra la actividad sexual. En nogal adulto = 3-5 m del suelo.',
      },
      {
        title: '4. Coloca trampa testigo',
        body:
          '1-2 trampas delta/ha CON feromona de monitoreo (NO confusión). Si captura >5 machos/semana = confusión rota, refuerza con granulovirus o Bt aizawai.',
      },
      {
        title: '5. Renovación',
        body:
          'Los difusores duran 120-150 días. Si la cosecha se alarga (Franquette), prevé recambio a finales de julio.',
      },
    ],
    references: [
      'Ioriatti et al. (2019) — Mating disruption in walnut.',
      'Knight & Hilton (2007) — Trampas testigo bajo confusión.',
      'GIP MAPA Nogal — confusión sexual.',
    ],
  },
  'hazelnut-balanino-control': {
    key: 'hazelnut-balanino-control',
    title: 'Control biológico del balanino del avellano',
    subtitle: 'Manejo de Curculio nucum con Beauveria, nematodos y mangueo.',
    operationType: 'PEST_TREATMENT',
    durationLabel: 'Variable: 1 jornada/ha por aplicación',
    materials: [
      'Mosquitero o vara de mangueo (1 m, fondo blanco)',
      'Cuaderno de capturas',
      'Beauveria bassiana o Metarhizium anisopliae (cepa registrada)',
      'Nematodos Steinernema carpocapsae (preparación líquida, 0,5·10⁶ JI/m²)',
      'Pulverizador o regadera para nematodos (boquilla >0,8 mm)',
    ],
    safety: [
      'Beauveria: respeta atrasos con auxiliares (compatible en general).',
      'Nematodos: aplicar al atardecer y con suelo húmedo (sensibles a UV y desecación).',
    ],
    steps: [
      {
        title: '1. Mangueo semanal',
        body:
          'Desde mediados de abril, golpea 25 ramas al azar sobre la vara. Cuenta adultos caídos. Apunta fecha y nº.',
      },
      {
        title: '2. Decisión de intervención',
        body:
          'Umbral: 5-10 adultos/100 mangueos justifica actuar. Si <5, mantén vigilancia y mejora hábitat de auxiliares (setos).',
      },
      {
        title: '3. Aplicación de Beauveria (mayo-junio)',
        body:
          'Aplica al suelo bajo copa antes del descenso de larvas. Suelo ligeramente húmedo, al atardecer. Repite a 10-15 días si humedad lo permite.',
      },
      {
        title: '4. Refuerzo otoñal con nematodos',
        body:
          'Octubre-noviembre, con suelo HÚMEDO: 0,5·10⁶ JI/m² de S. carpocapsae aplicados con regadera o pulverizador a baja presión. Riega ligeramente después si no hay lluvia.',
      },
      {
        title: '5. Hábitat para auxiliares',
        body:
          'Mantén bandas florales (umbelíferas) y refugios de carábidos: depredan larvas y adultos invernantes.',
      },
    ],
    references: [
      'Phytoma 267 (2015) — Curculio nucum, plaga clave del avellano.',
      'Phytoma 312 (2019) — Nematodos entomopatógenos contra Curculio.',
      'GIP MAPA Avellano.',
    ],
  },
  'pistachio-formation-prune': {
    key: 'pistachio-formation-prune',
    title: 'Poda de formación del pistacho',
    subtitle:
      'Estructurar copa los primeros 4 años para entrar bien en producción.',
    operationType: 'PRUNING',
    durationLabel: '20-40 min por árbol joven',
    materials: [
      'Tijera de poda de mano y serrucho',
      'Pasta cicatrizante (opcional, solo cortes >3 cm)',
      'Cubo de alcohol 70 % para desinfectar entre árboles',
    ],
    safety: [
      'Desinfecta herramientas: Botryosphaeria entra por cortes recientes.',
      'No podar con lluvia ni temperaturas <0 °C (heridas no cicatrizan).',
    ],
    steps: [
      {
        title: 'Año 1 — establecimiento',
        body:
          'No podar salvo retirar competidores del eje. El plantón necesita masa foliar para enraizar.',
      },
      {
        title: 'Año 2 — selección de pisos',
        body:
          'Marca 3 ramas principales bien repartidas a 50-90 cm del suelo, con ángulos abiertos (>45°). Eliminar el resto de ramas bajas.',
      },
      {
        title: 'Año 3 — segundo piso',
        body:
          'Sobre cada rama principal selecciona 2 sub-ramas a 30-50 cm de la inserción. Mantén la estructura abierta.',
      },
      {
        title: 'Año 4 — preparar producción',
        body:
          'Rebajar dominantes, abrir centro para luz. Pistacho fructifica en madera del año, así que conserva ramificación joven.',
      },
      {
        title: 'Adulto — mantenimiento',
        body:
          'Aclareo anual: 15-20 % de leña vieja. Eliminar ramas con chancro de Botryosphaeria (madera marrón, exudado seco). Quemar restos.',
      },
    ],
    references: [
      'Ferguson & Haviland (2016) — Pistachio Production Manual, UC Davis.',
      'Agroforestales Esla — Guía de cultivo de Kerman en Castilla y León.',
    ],
  },
  'nut-harvest-shaker': {
    key: 'nut-harvest-shaker',
    title: 'Recolección con vibrador y secado',
    subtitle:
      'Cómo recolectar almendra/nuez/pistacho sin dañar el árbol y con secado correcto.',
    operationType: 'HARVEST',
    durationLabel: '1-2 horas por hectárea con vibrador, +secado',
    materials: [
      'Vibrador de tronco (o paraguas vibrador para parcelas pequeñas)',
      'Lonas o redes bajo copa (5×5 m)',
      'Cajones ventilados o sacos de yute (NO plástico cerrado)',
      'Era de cemento, secadero o invernadero limpio',
      'Cuaderno para anotar producción por árbol/parcela',
    ],
    safety: [
      'Vibrar el tronco a baja altura (a 50-70 cm) y con corteza limpia, sin heridas frescas.',
      'Tiempo máximo de vibración: 5-8 segundos por árbol. Más alarga riesgo de dañar cambium.',
      'No vibrar con tronco mojado: la corteza se desprende.',
    ],
    steps: [
      {
        title: '1. Diagnostica madurez',
        body:
          'Almendra: cáscara >80 % abierta y mesocarpio seco. Nuez: pericarpio rajado y verdino que se separa con la mano. Pistacho: cáscara separable del epicarpio en >70 %.',
      },
      {
        title: '2. Tiende lonas y vibra',
        body:
          'Coloca lonas cubriendo proyección de copa. Coloca vibrador, agarra a 50-70 cm. 5-8 segundos por árbol bastan.',
      },
      {
        title: '3. Pelado in situ (nogal y pistacho)',
        body:
          'Eliminar pericarpio verde lo antes posible (manualmente o con peladora). En pistacho, hacerlo en menos de 24 h evita mancha negra.',
      },
      {
        title: '4. Secado controlado',
        body:
          'Almendra/nuez/pistacho: capas finas en cajón ventilado bajo techo (no sol directo prolongado). Voltear a diario. Humedad final objetivo <8 % en almendra/pistacho, <10 % en nuez.',
      },
      {
        title: '5. Almacenado',
        body:
          'Una vez seco, en sacos de yute o tolva ventilada, en local fresco y seco. Vigila roedores. Pistacho con cáscara y nuez con cáscara aguantan 6-12 meses sin problema.',
      },
    ],
    references: [
      'Vargas et al. (2010) — Producción de almendra.',
      'Buchner et al. (2003) — Walnut harvest and post-harvest handling, UC Davis.',
      'Ferguson & Haviland (2016) — Pistachio Production Manual.',
    ],
  },
  'late-frost-protection': {
    key: 'late-frost-protection',
    title: 'Protección contra heladas tardías de primavera',
    subtitle:
      'Decisiones rápidas para proteger floración o brotación ante un aviso de helada.',
    operationType: 'MONITORING',
    durationLabel: 'Preparación 1-2 h, vigilancia toda la noche',
    materials: [
      'Termómetro de mínima en zona de copa (no bajo el árbol)',
      'Aspersión de baja intensidad o microaspersión funcional',
      'Quemadores estáticos / fardos de paja ECO (último recurso, solo en parcelas grandes)',
      'Anemómetro o app de viento (clave para decidir aspersión)',
    ],
    safety: [
      'Aspersión antihelada: solo con T° prevista entre -1 y -4 °C. Por debajo daña más por sobrepeso de hielo.',
      'Quemadores: cumple normativa local de quema y CO₂. No uses neumáticos ni plásticos.',
    ],
    steps: [
      {
        title: '1. Anticípate 24-48 h',
        body:
          'Si AEMET avisa de mínima <0 °C en floración, planifica desde la víspera. La decisión nocturna sin medios falla casi siempre.',
      },
      {
        title: '2. Protege el suelo',
        body:
          'El suelo desnudo, compactado y húmedo libera calor mejor. Riega ligero la víspera y siega cubierta a ras: el calor del suelo es tu mejor aliado.',
      },
      {
        title: '3. Aspersión ininterrumpida',
        body:
          'Si dispones de riego: arranca cuando T° = +1 °C, sigue hasta que el sol funda el hielo de las flores. Cortar antes daña más que no haber regado.',
      },
      {
        title: '4. Documenta el daño post-helada',
        body:
          'A las 48-72 h, abre 100 flores al azar y cuenta % de pistilos negros. Es tu predicción de cosecha y dato para el plan del año siguiente.',
      },
      {
        title: '5. Actúa contra bacteriosis tras helada',
        body:
          'Las heridas por hielo abren puerta a Xanthomonas (avellano y nogal). Aplica cobre 2-3 días después si la helada fue severa.',
      },
    ],
    references: [
      'AEMET — Pronóstico de heladas en cuencas frías de Castilla y León.',
      'Snyder & Melo-Abreu (2005) — Frost Protection FAO Manual.',
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
