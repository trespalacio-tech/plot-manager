export interface GlossaryTerm {
  term: string;
  definition: string;
}

export const GLOSSARY: GlossaryTerm[] = [
  {
    term: 'Acolchado (mulch)',
    definition:
      'Capa de materia orgánica (paja, restos de poda, cartón) extendida en superficie para proteger el suelo, reducir evaporación y aportar carbono.',
  },
  {
    term: 'Auxiliares',
    definition:
      'Organismos beneficiosos que regulan plagas: depredadores (chinches, mariquitas, sírfidos) y parasitoides (avispillas como Trichogramma).',
  },
  {
    term: 'BBCH',
    definition:
      'Escala internacional de fenología para cultivos. Numerada 0-99 y agrupada en estados principales (00 latente, 60 floración, 89 maduración).',
  },
  {
    term: 'C/N (relación carbono/nitrógeno)',
    definition:
      'Indica cómo se descompondrá un material orgánico. C/N < 20 → mineraliza N. C/N > 30 → inmoviliza N temporalmente al descomponerse.',
  },
  {
    term: 'Caliza activa',
    definition:
      'Carbonato cálcico finamente dividido (< 50 µm) reactivo en el suelo. > 9 % en frutal o vid puede causar clorosis férrica.',
  },
  {
    term: 'CEC (Capacidad de intercambio catiónico)',
    definition:
      'Cantidad de cationes (Ca, Mg, K, Na) que el suelo puede retener e intercambiar. Se expresa en meq/100 g; alta en arcillas y MO.',
  },
  {
    term: 'Confusión sexual',
    definition:
      'Técnica de control con difusores de feromona femenina sintética que satura el aire e impide a los machos localizar hembras.',
  },
  {
    term: 'Cubierta vegetal',
    definition:
      'Vegetación sembrada o espontánea entre filas o bajo copa para proteger suelo, fijar N, atraer biodiversidad y aportar biomasa.',
  },
  {
    term: 'EDDHA',
    definition:
      'Quelato de hierro estable en suelos básicos y calizos. Aplicación foliar o al riego para corregir clorosis férrica puntual.',
  },
  {
    term: 'GDD (grados-día acumulados)',
    definition:
      'Suma térmica que predice fenología y vuelos de plaga. Para carpocapsa: 200 GDD base 10 desde 1-ene = primer vuelo en Burgos.',
  },
  {
    term: 'Granulovirus (CpGV)',
    definition:
      'Virus específico de carpocapsa, autorizado en producción ecológica. Aplicación cada 7-10 días en eclosión de huevos.',
  },
  {
    term: 'Materia orgánica (MO)',
    definition:
      'Fracción del suelo formada por restos vegetales, animales y biomasa microbiana en distintos grados de descomposición.',
  },
  {
    term: 'Mineralización',
    definition:
      'Transformación de N orgánico en formas inorgánicas (NH₄⁺, NO₃⁻) que la planta puede absorber. La realiza la microbiota.',
  },
  {
    term: 'Olsen P',
    definition:
      'Método de extracción de fósforo asimilable adecuado para suelos básicos y calizos. Rangos en Castilla: 12-25 ppm = adecuado.',
  },
  {
    term: 'Patrón (porta-injerto)',
    definition:
      'Sistema radicular sobre el que se injerta la variedad. Determina vigor, resistencia a caliza y a plagas radiculares.',
  },
  {
    term: 'Rolado (crimper)',
    definition:
      'Terminación de cubierta con rodillo aplastante que tumba y lignifica la planta sin incorporarla, dejando mulch en superficie.',
  },
  {
    term: 'Sustancia básica',
    definition:
      'Categoría reglamentaria UE de productos de bajo riesgo (vinagre, sacarosa, hidrogenocarbonato sódico) autorizada en ecológico.',
  },
  {
    term: 'Tempero',
    definition:
      'Estado del suelo con humedad óptima para trabajarlo: cede pero no embarra. Ventana clave para siembra y enmiendas.',
  },
  {
    term: 'Transición',
    definition:
      'Periodo de adaptación del manejo convencional al regenerativo. En esta app: estado intermedio antes de "Régimen regenerativo".',
  },
  {
    term: 'Umbral de tratamiento',
    definition:
      'Nivel de plaga a partir del cual interviene el manejo: 3-5 capturas/trampa·semana en carpocapsa, 30 % brotes con araña roja, etc.',
  },
];
