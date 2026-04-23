export interface LearnSheet {
  slug: string;
  title: string;
  category: 'SUELO' | 'CUBIERTAS' | 'PLAGAS' | 'TRANSICION' | 'AGUA' | 'BIODIVERSIDAD';
  summary: string;
  body: { heading: string; text: string }[];
  references: string[];
}

export const LEARN_SHEETS: LearnSheet[] = [
  {
    slug: 'materia-organica',
    title: 'Materia orgánica del suelo (MO)',
    category: 'SUELO',
    summary:
      'Fracción orgánica que sostiene fertilidad, estructura y vida edáfica. Subir un punto exige años de manejo coherente.',
    body: [
      {
        heading: '¿Por qué importa?',
        text: 'La MO mantiene agregados estables, retiene agua (cada 1 % de MO suma ~15 L/m³ de retención útil), libera nutrientes lentamente y es la base de la microbiota.',
      },
      {
        heading: 'Rangos en Burgos',
        text: 'Suelos típicos de cereal de Castilla-León: 1.0-1.8 % MO. Frutal regenerativo objetivo: 2.5-3.5 %. Subir 0.1 % anual ya es ritmo notable.',
      },
      {
        heading: 'Cómo subirla',
        text: 'Aportes recurrentes de compost maduro (4-8 t/ha·año), cubiertas vegetales con leguminosas, mulch bajo copa y reducir laboreo agresivo.',
      },
    ],
    references: [
      'FAO 2017 — Soil Organic Carbon: the hidden potential.',
      'Lal 2004 — Soil carbon sequestration impacts on global climate change.',
    ],
  },
  {
    slug: 'caliza-activa',
    title: 'Caliza activa y clorosis férrica',
    category: 'SUELO',
    summary:
      'Fracción del carbonato cálcico realmente reactiva en suelo. > 9 % activa clorosis férrica en frutal y vid sensibles.',
    body: [
      {
        heading: 'Definición',
        text: 'Carbonato finamente dividido (< 50 µm) que reacciona con el suelo. Distinto del carbonato total: dos suelos con 25 % CaCO₃ pueden tener caliza activa muy distinta.',
      },
      {
        heading: 'Implicación práctica',
        text: 'En Burgos, > 9 % de caliza activa pide patrones tolerantes (manzano: MM-111; vid: 41B, 110R, 140Ru). Diagnóstico previo evita replantes.',
      },
      {
        heading: 'Manejo',
        text: 'No baja con enmienda: convive con el suelo. Hierro quelado EDDHA puntual + materia orgánica para activar movilización biológica del Fe.',
      },
    ],
    references: [
      'Drouineau 1942 — Méthode d’analyse du calcaire actif.',
      'INRAE — Choix du porte-greffe en sol calcaire.',
    ],
  },
  {
    slug: 'cubiertas-vegetales',
    title: 'Cubiertas vegetales en frutal y vid',
    category: 'CUBIERTAS',
    summary:
      'Especies sembradas en calles o bajo copa que protegen el suelo, captan N atmosférico y alimentan la red trófica.',
    body: [
      {
        heading: 'Funciones',
        text: 'Frenan erosión, fijan N (leguminosas), añaden biomasa, mejoran infiltración, hospedan auxiliares y rompen ciclo de hierbas adventicias.',
      },
      {
        heading: 'Mezclas para Burgos',
        text: 'Otoño: veza (25 kg/ha) + avena (40 kg/ha) + trébol subterráneo (5 kg/ha). Permanente: festuca arundinácea + trébol blanco enano.',
      },
      {
        heading: 'Manejo',
        text: 'Terminación con rolado o siega alta en plena floración leguminosa. Evitar incorporación: el mulch vivo protege el verano.',
      },
    ],
    references: [
      'Abdalla et al. 2019 — Cover crops effects on N and C dynamics.',
      'MAPA — Guía de cubiertas vegetales en frutal y viñedo.',
    ],
  },
  {
    slug: 'confusion-sexual-carpocapsa',
    title: 'Confusión sexual frente a carpocapsa',
    category: 'PLAGAS',
    summary:
      'Difusores de feromona saturan el aire y los machos no encuentran a las hembras. Reduce capturas y daño en pomáceas.',
    body: [
      {
        heading: 'Cuándo aplicar',
        text: 'Antes del primer vuelo (200 GDD base 10 desde 1-ene; en Burgos suele ser 1ª-2ª semana de abril). Tarde = pérdida de eficacia.',
      },
      {
        heading: 'Densidades',
        text: '500-600 difusores/ha distribuidos uniformemente con refuerzo perimetral (15-20 % extra en bordes).',
      },
      {
        heading: 'Combinación',
        text: 'Compatible con granulovirus (CpGV) tras alcanzar umbral de 3-5 machos/trampa·semana. Caolín ayuda en climas secos.',
      },
    ],
    references: [
      'Ioriatti et al. 2019 — Codling moth mating disruption.',
      'IPM Europe — Carpocapsa management guide.',
    ],
  },
  {
    slug: 'compost-maduro',
    title: 'Compost: madurez y dosis',
    category: 'SUELO',
    summary:
      'Aporte estable de carbono y microbiota. Dosis y madurez determinan si nutre o quema.',
    body: [
      {
        heading: 'Madurez',
        text: 'C/N 10-14, olor terroso, > 80 % germinación en bioensayo de cress. Compost inmaduro inmoviliza N y daña raíces.',
      },
      {
        heading: 'Dosis',
        text: 'Transición: 8-10 t/ha. Mantenimiento: 4-6 t/ha. Aplicado bajo copa, no incorporado, antes de mulch.',
      },
      {
        heading: 'Momento',
        text: 'Final invierno (feb-abr) para acompasar mineralización con brotación. En vid, antes de hinchado de yema.',
      },
    ],
    references: [
      'Bernal et al. 2009 — Composting of organic wastes, quality parameters.',
      'Scharenbroch et al. 2013 — Compost effects on soil microbial activity.',
    ],
  },
  {
    slug: 'transicion-3-anos',
    title: 'Transición regenerativa: ventana de 3 años',
    category: 'TRANSICION',
    summary:
      'Plazo realista para que el suelo y la finca respondan al cambio de manejo. Antes hay solo expectativas; después, datos.',
    body: [
      {
        heading: 'Año 1 — Diagnóstico y siembra',
        text: 'Línea base de suelo. Cubiertas pioneras. Reducción gradual de laboreo. Aceptar reducción de rendimiento del 10-20 %.',
      },
      {
        heading: 'Año 2 — Ajuste',
        text: 'Lecturas tempranas: mejora estructura, vida activa. Ajustar mezcla de cubierta y dosis de compost según suelo.',
      },
      {
        heading: 'Año 3 — Auditoría',
        text: 'Repetir analítica de suelo. Comparar MO, biología y compactación. Decidir si pasar a régimen "REGENERATIVE".',
      },
    ],
    references: [
      'Rodale Institute — Farming Systems Trial 40 years.',
      'LaCanne & Lundgren 2018 — Regenerative agriculture system.',
    ],
  },
  {
    slug: 'biodiversidad-funcional',
    title: 'Biodiversidad funcional en finca',
    category: 'BIODIVERSIDAD',
    summary:
      'Setos, bandas florales y refugios sostienen los enemigos naturales que regulan plagas sin coste recurrente.',
    body: [
      {
        heading: 'Setos perimetrales',
        text: 'Mezcla autóctona (endrino, majuelo, rosal silvestre, cornejo) cada 50-100 m. Tres estratos: porte alto, medio, bajo.',
      },
      {
        heading: 'Bandas florales',
        text: '2-3 m en cabeceras y entre parcelas. Mezcla de aliso, hinojo, milenrama, cilantro: floración escalonada marzo-octubre.',
      },
      {
        heading: 'Refugios',
        text: 'Cajas nido, hoteles de insectos, montones de piedra. Mantenimiento mínimo, impacto medible en 2-3 años.',
      },
    ],
    references: [
      'Tscharntke et al. 2012 — Landscape moderation of biodiversity.',
      'Garibaldi et al. 2014 — From research to action: enhancing crop yield.',
    ],
  },
  {
    slug: 'agua-secano',
    title: 'Gestión del agua en secano',
    category: 'AGUA',
    summary:
      'En Burgos (550-650 mm anuales con verano severo), el agua disponible se gana con suelo vivo y mulch, no con tubería.',
    body: [
      {
        heading: 'Agua útil del suelo',
        text: 'Suelo franco con 3 % MO retiene 40-60 mm más que el mismo suelo desnudo y compactado. Tres veranos sin compactar valen más que un riego de socorro.',
      },
      {
        heading: 'Mulch como reservorio',
        text: '8-10 cm de acolchado bajo copa reducen evaporación 30-50 % en julio-agosto. Coste único, protección estacional.',
      },
      {
        heading: 'Riego de apoyo',
        text: 'Si existe goteo, programar 2-3 riegos cortos en cuajado y engorde, no en floración. Evitar humedad permanente bajo copa.',
      },
    ],
    references: [
      'Cook et al. 2018 — Mulch mitigation of evaporation in Mediterranean orchards.',
      'FAO 56 — Crop evapotranspiration guidelines.',
    ],
  },
];

export function sheetsByCategory(category: LearnSheet['category']): LearnSheet[] {
  return LEARN_SHEETS.filter((s) => s.category === category);
}

export function getSheet(slug: string): LearnSheet | undefined {
  return LEARN_SHEETS.find((s) => s.slug === slug);
}
