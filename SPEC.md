# Especificación funcional — App de gestión regenerativa de cultivos leñosos

**Versión:** 2.0
**Estado:** Definición lista para implementación con Claude Code
**Ámbito climático inicial:** Provincia de Burgos (clima continental mediterráneo)

---

## 1. Pilares (no negociables)

1. **Gestión sencilla de cultivos leñosos** (frutales y viñedo) bajo agricultura regenerativa.
2. **Todo basado en ciencia.** Sin biodinámica, sin calendario lunar, sin rituales. Cada recomendación cita su base agronómica.
3. **Guía interactiva paso a paso con avisos.** Un agricultor sin experiencia puede usarla y saber qué hacer cada día.
4. **Cuaderno de campo integrado.** Anotar a diario lo que se hace, con plantillas rápidas.
5. **Coste cero, sin servidor, sin internet obligatorio.** Funciona en local, instalable, gratis para siempre. Si se comparte con otros agricultores, no requiere infraestructura.

Estos cinco pilares condicionan toda decisión técnica posterior.

---

## 2. Decisiones de arquitectura

### 2.1 Local-first como principio rector

Toda la lógica y todos los datos viven en el dispositivo del usuario. La app puede usar internet de forma **opcional** (consulta de previsión meteorológica AEMET, descarga de actualizaciones), pero nunca lo necesita para funcionar. No hay backend, no hay base de datos remota, no hay cuentas de usuario.

### 2.2 PWA instalable + IndexedDB

La forma de cumplir los pilares 3, 4 y 5 simultáneamente es construir una **Progressive Web App** instalable:

- Se distribuye como sitio web estático (HTML+JS+CSS) hospedado en **GitHub Pages, Cloudflare Pages o Netlify** (todos con plan gratuito que cubre con sobra el uso previsto, sin caducidad).
- Los usuarios la abren en su móvil o escritorio, pulsan "Añadir a pantalla de inicio" y queda instalada como una app más.
- Funciona 100% sin conexión gracias a un Service Worker que cachea todo el código.
- Los datos se guardan en **IndexedDB** (la base de datos del navegador, sin límites prácticos para este uso).
- Las fotos se guardan como Blobs en IndexedDB con compresión previa.
- Cada usuario tiene su propia base de datos local. **No hay datos compartidos en ningún servidor.**

### 2.3 Implicaciones del modelo sin servidor

Lo que ganamos:
- Cero coste operativo de por vida.
- Privacidad absoluta: los datos no salen del dispositivo del agricultor.
- Funciona en zonas rurales sin cobertura.
- Compartir la app con otros = compartir una URL. Ellos instalan y empiezan.

Lo que asumimos como limitación consciente:
- No hay sincronización automática entre dispositivos. Se resuelve con **exportación/importación de backup en JSON** (manual, también automática local).
- No hay colaboración multi-usuario en tiempo real. Si dos personas gestionan la misma finca, comparten dispositivo o intercambian backups.
- Notificaciones programadas son limitadas por el navegador (ver §11). Se compensa con un patrón "check-in diario" en el que la app, al abrirse, muestra todo lo pendiente.

### 2.4 Stack técnico

- **Framework:** Vite + React + TypeScript
- **Estilos:** TailwindCSS + shadcn/ui (componentes accesibles, copia local, sin dependencia externa)
- **Base de datos local:** Dexie.js (envoltorio idiomático para IndexedDB)
- **PWA / offline:** Workbox para el Service Worker, manifest.json estándar
- **Mapas:** Leaflet + OpenStreetMap, con plugin de cacheo de tiles para uso offline en la zona de las fincas
- **Gráficas:** Recharts
- **Formularios:** react-hook-form + zod
- **Internacionalización:** i18next (arrancamos en español, dejamos preparado)
- **Tests:** Vitest + Testing Library + Playwright para flujos críticos
- **Build & deploy:** GitHub Actions → GitHub Pages (gratis, automático)

Cero dependencias de servicios de pago. Cero claves API obligatorias.

---

## 3. Paradigma UX: el "Coach"

Esta es la diferencia central frente a una app de cuaderno de campo al uso. El paradigma se llama internamente **Coach mode** y se basa en la idea de que la pantalla principal no es un dashboard de KPIs, sino una pregunta:

> **"¿Qué hago hoy?"**

### 3.1 Pantalla "Hoy"

Es la pantalla de inicio. Muestra, ordenado por urgencia y por parcela:

- **Tareas para hoy** (programadas o sugeridas por el motor).
- **Avisos activos** (helada prevista en 48h, umbral de plaga superado, fenología que dispara una acción, análisis de suelo pendiente, etc.).
- **Acción rápida**: botón flotante para "Apuntar lo que acabo de hacer" (cuaderno de campo).

Cada tarea tiene tres acciones posibles directamente desde la tarjeta: **Hacer ahora** (abre el flujo guiado), **Posponer** (con motivo opcional), **Marcar como hecha** (añade entrada al cuaderno automáticamente).

### 3.2 Flujos guiados (wizards)

Cada tipo de tarea tiene su propio flujo paso a paso. Ejemplo, "Aplicar mulching":

1. **Por qué ahora:** explicación breve y científica (conservar humedad antes del estío, suprimir adventicias, alimentar fauna del suelo). Cita la regla disparadora.
2. **Qué necesitas:** materiales y cantidades calculadas para la parcela (paja, restos de poda triturados, etc.).
3. **Cómo hacerlo:** instrucciones con ilustraciones o fotos (espesor recomendado, separación del tronco para evitar pudriciones, ancho de la banda).
4. **A qué prestar atención:** signos de problemas (ratones, exceso, desequilibrio C/N).
5. **Registrar:** confirmación que crea automáticamente la entrada en el cuaderno con valores precargados (parcela, fecha, materiales, dosis); el agricultor solo ajusta y guarda.

Este patrón se repite en cada operación: **por qué → qué → cómo → vigilar → registrar.**

### 3.3 Onboarding y onboarding por parcela

La primera vez que se abre la app, un asistente acompaña al usuario para crear su primera finca y parcela, eligiendo cultivo entre opciones aptas para Burgos, sugiriendo marcos de plantación según la especie y proponiendo un primer análisis de suelo si no existe. Cada vez que se añade una parcela nueva, se reactiva un asistente similar adaptado al estado elegido (DESIGN / TRANSITION / REGENERATIVE).

### 3.4 Modo "Explorar"

Para usuarios que ya tienen experiencia o quieren entender más, una sección **"¿Por qué?"** permite navegar el catálogo de reglas, prácticas y referencias científicas sin necesidad de tener una tarea activa. Toda recomendación enlaza aquí.

### 3.5 Decisión guiada: "Veo algo raro"

Wizard de diagnóstico. El usuario indica qué observa (manchas en hoja, insectos, color anómalo) y la app lo guía con preguntas y fotos de referencia hasta una hipótesis. Nunca ofrece tratamiento directo: ofrece (a) recomendación de monitoreo más fino, (b) opciones de manejo dentro de la lista blanca ecológica, (c) sugerencia de consulta a técnico si la confianza es baja. Honestidad por encima de pretensión diagnóstica.

---

## 4. Estados de parcela

| Código         | Etiqueta                     | Foco                                                                                                |
| -------------- | ---------------------------- | --------------------------------------------------------------------------------------------------- |
| `DESIGN`       | Diseño y establecimiento     | Plantación nueva o muy joven. Diagnóstico previo, diseño, enmiendas iniciales, primeros 1–2 años.   |
| `TRANSITION`   | En transición a regenerativa | Viene de manejo convencional. Plan plurianual con hitos.                                            |
| `REGENERATIVE` | En régimen regenerativo      | Consolidada. Optimización continua de KPIs.                                                         |

El cambio de estado es manual, requiere confirmación y queda registrado en el historial de la parcela. El motor de reglas y los playbooks se ajustan automáticamente.

---

## 5. Modelo de datos

Definido como interfaces TypeScript que se traducen a tablas Dexie. Todas las entidades llevan `id` (UUID), `createdAt`, `updatedAt`.

### 5.1 Núcleo

```ts
interface Farm {
  id: string;
  name: string;
  municipality: string;
  province: string;        // default: "Burgos"
  altitudeM?: number;
  centerLat?: number;
  centerLng?: number;
  notes?: string;
}

interface Parcel {
  id: string;
  farmId: string;
  name: string;
  code?: string;
  geometry?: GeoJSON.Polygon;     // dibujada en mapa
  areaHa: number;                 // calculada o introducida
  slopePct?: number;
  aspect?: 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'FLAT';
  status: 'DESIGN' | 'TRANSITION' | 'REGENERATIVE';
  statusChangedAt: Date;
  cropType: 'FRUIT_TREE' | 'VINEYARD' | 'MIXED';
  plantingYear?: number;
  spacingRowM?: number;
  spacingPlantM?: number;
  rowOrientationDeg?: number;
  irrigation: 'RAINFED' | 'DRIP' | 'MICROSPRINKLER' | 'FLOOD';
  notes?: string;
}

interface ParcelStatusHistory {
  id: string;
  parcelId: string;
  fromStatus?: Parcel['status'];
  toStatus: Parcel['status'];
  changedAt: Date;
  reason?: string;
}

interface Variety {
  id: string;
  parcelId: string;
  catalogId?: string;             // referencia al catálogo regional
  species: string;                // "Malus domestica"
  cultivar: string;               // "Reineta gris"
  rootstock?: string;
  isPollinator: boolean;
  plantsCount: number;
  plantingDate?: Date;
  sourceNursery?: string;
}

interface Plant {                 // opcional, granularidad individual
  id: string;
  parcelId: string;
  varietyId: string;
  rowNumber?: number;
  positionInRow?: number;
  geoPoint?: GeoJSON.Point;
  status: 'HEALTHY' | 'WEAK' | 'DEAD' | 'REPLACED';
  notes?: string;
}
```

### 5.2 Suelo y materia orgánica (módulo central)

```ts
interface SoilSample {
  id: string;
  parcelId: string;
  samplingDate: Date;
  depthCmFrom: number;
  depthCmTo: number;
  samplingMethod: 'COMPOSITE' | 'ZONAL' | 'GRID';
  samplePointsCount?: number;
  labName?: string;
  labReportId?: string;
  labReportFileBlob?: Blob;       // PDF adjunto (IndexedDB)
  notes?: string;
}

interface SoilAnalysis {
  id: string;
  sampleId: string;

  // Físicos
  textureSandPct?: number;
  textureSiltPct?: number;
  textureClayPct?: number;
  textureClass?: string;          // calculado USDA
  bulkDensityGCm3?: number;
  waterHoldingCapacityPct?: number;
  infiltrationRateMmH?: number;
  aggregateStabilityPct?: number;

  // Químicos básicos
  phWater?: number;
  phKcl?: number;
  ecDsM?: number;
  organicMatterPct: number;       // OBLIGATORIO
  organicCarbonPct?: number;      // calculable: OM% / 1.724
  totalNitrogenPct?: number;
  cnRatio?: number;               // calculado
  cecMeq100g?: number;

  // Macronutrientes
  pOlsenPpm?: number;
  pBrayPpm?: number;
  kExchangeablePpm?: number;
  caExchangeablePpm?: number;
  mgExchangeablePpm?: number;
  naExchangeablePpm?: number;

  // Saturación de bases (calculada si hay CIC)
  baseSaturationKPct?: number;
  baseSaturationCaPct?: number;
  baseSaturationMgPct?: number;
  baseSaturationNaPct?: number;

  // Micronutrientes
  fePpm?: number;
  mnPpm?: number;
  znPpm?: number;
  cuPpm?: number;
  bPpm?: number;

  // Carbonatos (clave en Burgos, suelos calizos)
  totalCarbonatesPct?: number;
  activeLimestonePct?: number;

  // Biología (avanzado, opcional)
  microbialBiomassCMgKg?: number;
  basalRespirationMgCo2KgDay?: number;
  earthwormsCountM2?: number;
  haneyTestScore?: number;

  interpretationNotes?: string;
  recommendationsGenerated?: string[];   // IDs de recomendaciones disparadas
}
```

**Funcionalidad obligatoria del módulo de suelo:**

1. Formulario de carga manual con validación por rangos plausibles (avisos suaves si un valor parece atípico).
2. Adjuntar PDF del informe (almacenado como Blob en IndexedDB).
3. Vista de **evolución temporal** por parcela: gráficas de cada parámetro clave a lo largo de los años.
4. **Comparación con línea base** (primer análisis): especialmente importante para `TRANSITION` y `REGENERATIVE`, visualiza el progreso regenerativo.
5. **Interpretación automática** frente a rangos de referencia para suelos típicos de Burgos (calizos, pH 7.5–8.5, MO frecuentemente baja 1–2%).
6. **Recomendaciones** calculadas a partir del análisis y la extracción esperada del cultivo, siempre dentro de la lista blanca ecológica.
7. Exportable a CSV para análisis externo.
8. Vinculable a operaciones (cuando aplico una enmienda, queda asociada al análisis que la motivó).

### 5.3 Cuaderno de campo

```ts
interface FieldLogEntry {
  id: string;
  date: Date;
  parcelIds: string[];            // puede afectar a una o varias parcelas
  type: OperationType;
  title: string;
  description?: string;
  durationMinutes?: number;
  weatherConditions?: string;     // texto libre o estructurado
  photoBlobs?: Blob[];
  voiceNoteBlob?: Blob;           // grabación rápida
  costEur?: number;
  linkedOperationId?: string;     // si proviene de una tarea sugerida
  linkedInputs?: InputApplication[];
}

type OperationType =
  | 'PRUNING'
  | 'MOWING'
  | 'MULCHING'
  | 'COMPOSTING'
  | 'COVER_CROP_SOWING'
  | 'COVER_CROP_TERMINATION'
  | 'IRRIGATION'
  | 'FERTIGATION'
  | 'PEST_TREATMENT'
  | 'DISEASE_TREATMENT'
  | 'MONITORING'
  | 'PHENOLOGY_OBSERVATION'
  | 'HARVEST'
  | 'SOIL_WORK'
  | 'BIODIVERSITY_INSTALL'
  | 'PLANTING'
  | 'REPLANTING'
  | 'OTHER';

interface InputApplication {
  id: string;
  fieldLogEntryId: string;
  inputId: string;                // del catálogo
  dosePerHa?: number;
  totalQuantity?: number;
  unit: string;
  rationale?: string;             // por qué se aplicó
  preHarvestIntervalDays?: number;
}
```

**Funcionalidad clave del cuaderno:**

- Entrada rápida desde el botón flotante "Apuntar". Plantillas precargadas por tipo de operación (campos relevantes según tipo).
- Entrada por voz (Web Speech API) opcional, transcrita a texto editable.
- Vista timeline filtrable por parcela, tipo, fechas.
- Búsqueda por texto.
- **Resumen diario / semanal / mensual.**
- Exportación a PDF con formato del **Cuaderno Digital de Explotación (SIEX)** y a CSV.
- Inmutabilidad blanda: las entradas no se borran, se anulan con motivo (auditable).

### 5.4 Catálogos (datos semilla incluidos en la app)

```ts
interface Input {                 // catálogo de insumos permitidos
  id: string;
  name: string;
  type: 'FERTILIZER' | 'AMENDMENT' | 'BIOSTIMULANT' |
        'FUNGICIDE' | 'INSECTICIDE' | 'INOCULANT' |
        'ATTRACTANT' | 'OTHER';
  activeIngredient?: string;
  formulation?: string;
  organicCertified: true;          // siempre true por construcción
  registrationNumber?: string;     // Registro de Productos Fitosanitarios
  allowedCrops: string[];
  restrictions?: string;           // ej. "máx 4 kg Cu/ha/año acumulado"
  preHarvestIntervalDays?: number;
  notes?: string;
  scientificReferences?: string[]; // bibliografía
}

interface RegionalCropCatalog {
  id: string;
  species: string;
  commonName: string;
  cultivar: string;
  suitableForBurgos: boolean;
  coldHardinessZone?: string;
  lateFrostRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  floweringPeriod: 'EARLY' | 'MID' | 'LATE' | 'EXTRA_LATE';
  recommendedRootstocks?: string[];
  recommendedSpacingRowM?: [number, number];
  recommendedSpacingPlantM?: [number, number];
  notes?: string;
}

interface CoverCropMix {
  id: string;
  name: string;
  recipe: { species: string; kgPerHa: number }[];
  sowingWindowStartDoy: number;   // día del año
  sowingWindowEndDoy: number;
  primaryObjective: 'NITROGEN_FIXATION' | 'BIOMASS' |
                    'SOIL_STRUCTURE' | 'POLLINATORS' |
                    'PEST_REPELLENT' | 'MIXED';
  suitableForBurgos: boolean;
  notes?: string;
}
```

### 5.5 Prácticas regenerativas

```ts
interface CoverCrop {
  id: string;
  parcelId: string;
  mixId?: string;
  sowingDate: Date;
  terminationDate?: Date;
  terminationMethod?: 'ROLLING' | 'MOWING' | 'GRAZING' | 'INCORPORATION';
  estimatedBiomassTHa?: number;
  notes?: string;
}

interface BiodiversityFeature {
  id: string;
  farmId: string;
  parcelId?: string;
  type: 'HEDGEROW' | 'FLOWER_STRIP' | 'POND' | 'NEST_BOX' |
        'INSECT_HOTEL' | 'BAT_BOX' | 'ISLAND' | 'OTHER';
  geometry?: GeoJSON.Geometry;
  installationDate: Date;
  speciesPlanted?: string[];
  areaOrLength?: number;
  maintenanceNotes?: string;
}

interface TransitionPlan {        // solo para parcelas TRANSITION
  id: string;
  parcelId: string;
  startDate: Date;
  targetEndDate: Date;
  baselineSoilSampleId?: string;
  currentYear: number;
  milestones: Milestone[];
  notes?: string;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  completedAt?: Date;
  yearOfPlan: number;             // 1, 2, 3
}
```

### 5.6 Monitoreo y fenología

```ts
interface PhenologyObservation {
  id: string;
  parcelId: string;
  date: Date;
  bbchStage: number;              // 0–99
  bbchDescription?: string;
  varietyId?: string;
  notes?: string;
  photoBlob?: Blob;
}

interface PestMonitoring {
  id: string;
  parcelId: string;
  date: Date;
  pestOrDisease: string;
  method: 'PHEROMONE_TRAP' | 'VISUAL_COUNT' | 'STICKY_TRAP' |
          'BEATING_TRAY' | 'OTHER';
  count?: number;
  unit?: string;                  // "adultos/trampa/semana"
  thresholdReference?: number;
  actionRequired: boolean;
  notes?: string;
}

interface Harvest {
  id: string;
  parcelId: string;
  varietyId?: string;
  date: Date;
  quantityKg: number;
  qualityNotes?: string;
  brix?: number;                  // vid
  priceEurKg?: number;
  destination?: string;
}
```

### 5.7 Tareas y sugerencias

```ts
interface Task {
  id: string;
  parcelId?: string;
  source: 'PLAYBOOK' | 'RULE_ENGINE' | 'USER';
  sourceRef?: string;             // id del playbook o regla
  type: OperationType;
  title: string;
  rationale: string;              // por qué se sugiere (Coach mode)
  scientificBasis?: string;       // referencia / cita
  scheduledFor?: Date;
  dueDate?: Date;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'POSTPONED' | 'DISMISSED';
  postponeReason?: string;
  completedAt?: Date;
  completedFieldLogEntryId?: string;
}

interface Alert {
  id: string;
  parcelId?: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  triggerSource: string;
  createdAt: Date;
  acknowledgedAt?: Date;
  expiresAt?: Date;
}
```

---

## 6. Motor de reglas + Playbooks

Dos mecanismos complementarios generan tareas y avisos. **Ambos son determinísticos, declarativos y testeables.** Nada de IA generativa aquí: reproducibilidad y honestidad científica primero.

### 6.1 Playbooks (calendarios anuales por cultivo y estado)

Plantillas de tareas anuales adaptadas a cultivo, estado de parcela y fenología típica regional. Estructura ejemplo:

```ts
interface Playbook {
  id: string;
  cropType: 'FRUIT_TREE' | 'VINEYARD';
  applicableStatuses: ('DESIGN' | 'TRANSITION' | 'REGENERATIVE')[];
  species?: string;               // null = aplicable a todos
  region: 'BURGOS';
  tasks: PlaybookTask[];
}

interface PlaybookTask {
  id: string;
  type: OperationType;
  title: string;
  rationale: string;
  scientificBasis: string;
  windowStartDoy: number;
  windowEndDoy: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  preconditions?: string[];        // ids de otras tareas o estados
  guidanceMarkdown: string;        // contenido del wizard "cómo hacerlo"
}
```

Playbooks que el MVP debe traer precargados:

- **Manzano regenerativo en Burgos** (`REGENERATIVE`)
- **Manzano en transición** (`TRANSITION`, plan a 3 años)
- **Manzano en establecimiento** (`DESIGN`)
- Idem para **peral, cerezo, almendro, nogal, viñedo Tempranillo**.

### 6.2 Reglas reactivas

Disparadas por eventos: nuevo análisis de suelo, nueva observación fenológica, nueva entrada de monitoreo, cambio de estado, fecha calendario, dato meteorológico introducido.

```ts
interface Rule {
  id: string;
  description: string;
  scientificBasis: string;
  trigger: RuleTrigger;
  condition: (ctx: RuleContext) => boolean;
  effect: (ctx: RuleContext) => RuleEffect;
}

type RuleEffect =
  | { type: 'CREATE_TASK'; task: Partial<Task> }
  | { type: 'CREATE_ALERT'; alert: Partial<Alert> }
  | { type: 'ENABLE_PLAYBOOK_BRANCH'; playbookId: string };
```

Catálogo mínimo de reglas para el MVP (15–20 reglas):

**Suelo:**
- MO < 1.5% → tarea "Aplicar 15–25 t/ha de compost maduro en otoño"
- pH < 6.0 → tarea "Considerar enmienda calcárea (raro en Burgos pero contemplado)"
- pH > 8.5 + Fe bajo → aviso "Riesgo de clorosis férrica; revisar variedades y portainjertos"
- Relación C/N > 25 → aviso "Posible inmovilización de N tras incorporar restos"
- P Olsen > 50 ppm → aviso "P excesivo, suspender aportes"
- K bajo + viñedo → tarea "Programar aporte de K orgánico"
- Carbonatos activos > 8% → aviso varietal/portainjerto

**Fenología (vid):**
- BBCH 53 (botones florales separados) → habilitar monitoreo activo de mildiu y oídio
- BBCH 71 (cuajado) → tarea "Comenzar deshojado en zona de racimo si humedad alta"

**Fenología (frutal):**
- BBCH 60 (floración) en almendro → aviso "Vigilar previsión de helada los próximos 7 días"
- BBCH 71 (cuajado) → instalación de trampas de carpocapsa

**Estacionales:**
- Fin de invierno (febrero-marzo) → tarea "Revisar/instalar trampas de feromonas"
- Fin de primavera (mayo-junio) → tarea "Aplicar mulching antes del estío"
- Otoño (octubre-noviembre) → tarea "Sembrar cubierta vegetal de invierno"
- Anual → recordatorio "Realizar análisis de suelo (cada 2–3 años por parcela)"

**Monitoreo:**
- Carpocapsa ≥ 5 capturas/trampa/semana → tarea "Evaluar tratamiento (confusión sexual, granulovirus, Bt)"
- Polilla del racimo umbral superado → tarea similar adaptada
- Síntomas visuales reportados de mildiu → wizard de confirmación + tratamientos permitidos

**Transición:**
- Año 1 finalizado → milestone "Análisis de suelo de control + revisión de cubierta vegetal"
- Año 3 finalizado → milestone "Auditoría de paso a régimen regenerativo"

Cada regla está en su propio fichero TypeScript dentro de `/lib/rules/`, con tests unitarios. Toda regla cita su base científica en el campo `scientificBasis` (referencias agronómicas, manuales del MAPA, EFSA, IPM Europe, etc.).

### 6.3 Modelos agronómicos básicos (sin estación meteorológica propia)

Datos meteorológicos vía **introducción manual** (entrada rápida de "lluvia de hoy", "mín/máx") o vía **AEMET OpenData** opcional cuando hay conexión. No se requiere ningún hardware.

- **Acumulación de grados-día (GDD)** base 10°C desde brotación.
- **Balance hídrico simplificado** mensual: ETo de tablas regionales × Kc por estado fenológico − precipitación − riego.
- **Riesgo de helada tardía:** si hay datos de previsión, comparar con fenología actual.
- **Modelo simplificado de mildiu de la vid** (regla "3-10" de Müller adaptada).

Modelos avanzados (RIMpro, Magarey) → fase 2.

---

## 7. Contenido educativo embebido

Para cumplir el pilar 3 (guía interactiva paso a paso para alguien sin experiencia), la app no puede ser solo formularios. Cada elemento tiene contexto.

- **"¿Por qué?" en cada tarea:** breve explicación científica visible al expandir la tarjeta.
- **Glosario integrado:** palabras como "BBCH", "calle", "marco", "mulching", "C/N", "CIC" abren tooltip.
- **Fichas de práctica:** documentos cortos en markdown sobre cada práctica regenerativa (mulching, cubiertas, biodiversidad funcional, compost, inoculación micorrícica…). Acompañan al wizard correspondiente.
- **Fichas de plaga/enfermedad:** descripción, ciclo, síntomas, fotos, umbrales, manejo permitido.
- **Fichas varietales:** datos clave, época de floración, susceptibilidades, polinizadores compatibles.

Todo este contenido se versiona con el código (markdown en `/content/`), en español, con bibliografía. Editable y revisable como cualquier código.

---

## 8. Catálogo regional de Burgos (datos semilla)

Tabla precargada en la migración inicial. Validable y ampliable.

**Frutales aptos:**
- Manzano: Reineta gris, Reineta blanca de Canadá, Verde Doncella, Golden Delicious, Fuji
- Peral: Conferencia, Ercolini (con cuidado), Blanquilla
- Cerezo: Burlat, Sunburst, Sweetheart, Lapins (zonas abrigadas)
- Ciruelo japonés y europeo: Reina Claudia, Santa Rosa
- Guindo, almendro extra-tardío (Vairo, Penta, Soleta, Lauranne)
- Nogal: Chandler, Franquette, Lara
- Avellano, membrillo

**Vid:**
- Tempranillo (Tinta del País), Garnacha tinta, Albillo Mayor, Viura, Verdejo

**Bloqueados con aviso:** cítricos, kaki en zonas frías, aguacate, frutales tropicales.

**Mezclas de cubiertas para Burgos:**
- Mezcla otoñal "Veza-Avena-Yeros" (40-60 kg/ha) para fijación de N e invernación
- Mezcla floral primaveral con facelia, trébol blanco, mostaza
- Cubierta permanente de gramíneas autóctonas en calle de viña

**Insumos ecológicos precargados:**
Cobre (con límite acumulado 4 kg/ha/año), azufre, *Bacillus thuringiensis*, feromonas de confusión sexual (carpocapsa, polilla del racimo, Anarsia, Cydia), caolín, jabón potásico, *Beauveria bassiana*, *Trichoderma* spp., extractos vegetales autorizados, compost, estiércol compostado, harinas de roca, granulovirus de carpocapsa.

---

## 9. Pantallas y navegación

**Pestañas principales (bottom navigation en móvil, sidebar en escritorio):**

1. **Hoy** — Coach: tareas y avisos del día. Pantalla por defecto.
2. **Cuaderno** — Timeline del cuaderno de campo. Botón "Apuntar".
3. **Parcelas** — Lista y mapa. Detalle con pestañas internas (Resumen, Suelo, Variedades, Operaciones, Cubiertas, Monitoreo, Cosechas, Plan transición).
4. **Calendario** — Vista mensual/semanal de tareas pasadas y futuras.
5. **Aprender** — Catálogo de fichas, glosario, motor de "¿Por qué?".
6. **Ajustes** — Backup, importar/exportar, idioma, ubicación, datos del usuario, "Acerca de".

**Botón flotante global:** "Apuntar" → entrada rápida en cuaderno.

**Acción "Veo algo raro"** accesible desde la pantalla "Hoy" y desde el detalle de parcela.

---

## 10. Cuaderno de campo: requisitos detallados

- **Entrada rápida** en menos de 30 segundos: tipo, parcela (precargada por última usada o por GPS), fecha (hoy por defecto), opcional foto, opcional voz, guardar.
- **Plantillas por tipo:** cada `OperationType` precarga los campos relevantes (poda no necesita dosis, tratamiento sí).
- **Vinculación automática:** si la entrada nace al completar una tarea sugerida, todos los campos relevantes (parcela, tipo, justificación) se rellenan solos.
- **Voz a texto** con Web Speech API (se degrada a texto manual si no disponible).
- **Fotos:** se comprimen a un máximo configurable (por defecto 1600 px ancho, calidad 0.8) antes de almacenarse en IndexedDB.
- **Resumen automático del día/semana/mes:** agregaciones por parcela, tipo, horas, costes.
- **Búsqueda:** por texto, por parcela, por tipo, por fechas, por insumo aplicado.
- **Exportación oficial:** generación de PDF compatible con el formato del Cuaderno Digital de Explotación obligatorio en España (formato a verificar y plantillar; en MVP basta con un PDF estructurado y un CSV).

---

## 11. Notificaciones y avisos

Limitación honesta: una PWA no puede programar notificaciones arbitrarias hacia el futuro sin servidor (la API `Notification Triggers` está en pruebas y solo en algunos navegadores). Estrategia:

1. **Modelo "check-in diario":** la app incentiva al usuario a abrirla cada mañana. Al abrir, se evalúan reglas, se generan tareas y se muestran avisos en pantalla "Hoy".
2. **Notificaciones del sistema cuando la app está abierta** o cuando el Service Worker se activa (eventos legítimos).
3. **Recordatorio diario opcional** con la API `showNotification` programada al abrir la app (registra una notificación para X horas después).
4. En el futuro, una versión empaquetada con **Capacitor (Android)** o **Tauri (escritorio)** puede añadir notificaciones programadas reales sin coste para el usuario. No forma parte del MVP.

Esta limitación se documenta visiblemente en el **Acerca de** y en el onboarding.

---

## 12. Backup, restauración y compartir

- **Backup manual:** botón "Exportar todo" → fichero JSON descargado. Incluye opcionalmente blobs (PDFs e imágenes). Versión sin blobs es compacta y recomendada para sincronización entre dispositivos.
- **Backup automático local:** al cierre, se guarda una copia del último estado en una entrada especial de IndexedDB; se mantienen las últimas 7 versiones.
- **Restauración:** importar JSON. El sistema valida esquema y muestra resumen antes de aplicar.
- **Compartir parcela / finca:** exportación parcial (una parcela o finca concreta con su histórico) → JSON que otro usuario puede importar.
- **Sincronización entre dispositivos del mismo usuario:** mediante export/import manual o, en fase 2, integración opcional con almacenamiento del propio usuario (Google Drive, Dropbox, WebDAV) usando el File System Access API.

---

## 13. MVP: alcance del primer entregable

Implementar **solo** lo siguiente en la primera iteración. Todo lo demás, fuera.

1. PWA inicializada, instalable, offline funcional.
2. CRUD de Fincas y Parcelas con mapa Leaflet (dibujar polígono).
3. Onboarding y wizard al crear parcela según estado.
4. **Módulo completo de suelo** (formulario, PDF adjunto, evolución temporal, interpretación, recomendaciones).
5. CRUD de Variedades.
6. **Cuaderno de campo** con entrada rápida, plantillas, fotos, búsqueda, resumen, exportación CSV y PDF básica.
7. Pantalla **"Hoy"** con tareas y avisos del día.
8. **Motor de reglas** con 15–20 reglas iniciales documentadas.
9. **Playbooks** precargados para manzano y vid (estados DESIGN, TRANSITION, REGENERATIVE).
10. Catálogos precargados (variedades de Burgos, mezclas de cubiertas, insumos ecológicos).
11. Wizards "Coach" para al menos 5 operaciones clave (mulching, siembra de cubierta, terminación de cubierta, monitoreo de plagas, aplicación de compost).
12. Wizard "Veo algo raro" con 5–10 problemas frecuentes catalogados.
13. Backup manual export/import en JSON.
14. Sección "Aprender" con fichas y glosario.

**Fuera del MVP (fase 2 y siguientes):**
- Integración AEMET OpenData.
- Modelos avanzados (RIMpro, Magarey).
- Empaquetado nativo con Capacitor o Tauri.
- Notificaciones programadas reales.
- Sincronización con Drive/Dropbox.
- Integración formal con Cuaderno Digital de Explotación oficial.
- Multiusuario.
- Visión por computador para diagnóstico fotográfico.
- Otras zonas climáticas.

---

## 14. Requisitos no funcionales

- **Idioma:** español. i18n preparado para añadir gallego, catalán, inglés posteriormente.
- **Accesibilidad:** WCAG AA en componentes (shadcn/ui ayuda).
- **Rendimiento:** carga inicial < 3s en 4G. Toda operación < 200ms tras primera carga (es local).
- **Tamaño del bundle:** objetivo < 500 KB gzipped para el shell crítico.
- **Privacidad:** todos los datos en local. Cero telemetría sin consentimiento explícito. Política de privacidad clara y corta.
- **Tests:** cobertura mínima del motor de reglas, cálculos agronómicos, interpretación de suelo y exportación/importación.
- **Documentación interna:** README con setup, arquitectura, esquema de Dexie, lista de reglas con su base científica, contribución de nuevas reglas y playbooks.
- **Versionado de esquema:** las migraciones de Dexie se versionan; nunca se rompe la base local del usuario en una actualización.

---

## 15. Estructura de carpetas propuesta

```
/src
  /app                    # routing y layouts
    /(today)              # pantalla "Hoy"
    /notebook
    /parcels/[id]
    /calendar
    /learn
    /settings
  /components
    /ui                   # shadcn
    /map
    /soil
    /coach                # wizards paso a paso
    /notebook
  /lib
    /db                   # Dexie schema, migraciones, repositorios
    /rules                # motor + reglas individuales
      /rules
        soil-low-om.ts
        vine-bbch53-mildew.ts
        ...
    /playbooks            # plantillas anuales por cultivo+estado
      apple-regenerative.ts
      vine-transition.ts
      ...
    /agronomy             # GDD, balance hídrico, interpretación suelo
    /export               # CSV, PDF, JSON
  /content                # markdown educativo
    /practices
    /pests
    /diseases
    /varieties
    glossary.json
  /data                   # catálogos semilla
    burgos-crops.json
    cover-crop-mixes.json
    organic-inputs.json
/public
  /icons
  manifest.json
/tests
  /rules
  /agronomy
  /export
.github/workflows         # build + deploy a GitHub Pages
```

---

## 16. Plan de sprints sugerido para Claude Code

**Sprint 1 — Cimientos**
- Inicializar Vite + React + TS + Tailwind + shadcn.
- Configurar PWA (Workbox, manifest, install prompt).
- Configurar Dexie con esquema base.
- Configurar GitHub Actions → GitHub Pages.
- Smoke test: la app arranca en local y desplegada, instalable, offline funcional con una pantalla vacía.

**Sprint 2 — Fincas y parcelas**
- CRUD de Farm y Parcel.
- Integración Leaflet con dibujo de polígonos.
- Onboarding inicial.
- Wizard de creación de parcela según estado.

**Sprint 3 — Suelo (módulo central)**
- Formulario completo de SoilSample + SoilAnalysis.
- Adjunto PDF (Blob).
- Vista de evolución temporal con Recharts.
- Interpretación automática contra rangos de Burgos.
- Generación de recomendaciones (vinculadas a tareas).
- Tests unitarios de interpretación.

**Sprint 4 — Cuaderno de campo**
- FieldLogEntry CRUD.
- Entrada rápida con plantillas.
- Captura de foto y voz.
- Timeline, búsqueda, filtros.
- Resumen diario/semanal.
- Exportación CSV.

**Sprint 5 — Coach: pantalla Hoy + Tasks + Rules**
- Modelo de Task y Alert.
- Motor de reglas con framework declarativo.
- 15–20 reglas iniciales con tests.
- Pantalla "Hoy" con tareas y avisos.
- Acciones rápidas (hacer / posponer / hecho).

**Sprint 6 — Playbooks y wizards**
- Modelo de Playbook + tareas anuales.
- Playbooks de manzano y vid precargados.
- Wizards "Coach" para 5 operaciones clave.
- Sección "Aprender" con fichas y glosario.

**Sprint 7 — Wizard "Veo algo raro" + Catálogos**
- Decisión guiada para 5–10 problemas frecuentes.
- Catálogos navegables de variedades, cubiertas e insumos.

**Sprint 8 — Backup, exportación, pulido**
- Export/import JSON completo.
- Backup automático local.
- Exportación PDF del cuaderno.
- Pulido UX, accesibilidad, rendimiento.
- Documentación final.

Cada sprint es una rama con PR, sus tests verdes y un changelog breve. Claude Code puede atacarlos en orden.

---

## 17. Bases científicas y referencias

Cada regla, playbook y ficha educativa debe citar al menos una fuente. Lista inicial recomendada:

- Reglamento (UE) 2018/848 sobre producción ecológica y Reg. 2021/1165 (sustancias autorizadas).
- Manuales del MAPA (Ministerio de Agricultura, Pesca y Alimentación), guías de gestión integrada para frutales y vid.
- IPM Europe — Guidelines for Integrated Pest Management.
- Escala BBCH para frutales y vid (Meier).
- INTIA, IRTA, ITACyL: publicaciones técnicas de manejo de frutales y viñedo.
- Köppen-Geiger / clasificación climática regional.
- Guías de FAO sobre suelos y carbono orgánico.
- "Soil Health Test" Haney.
- Bibliografía específica de cada plaga/enfermedad incluida.

Una pestaña "Bibliografía" en la sección "Aprender" lista todas las fuentes referenciadas por las reglas y fichas.
