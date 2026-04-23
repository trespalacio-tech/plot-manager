import { useMemo, useState } from 'react';
import { PageContainer } from '@/components/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  COVER_MIXES,
  INPUTS,
  VARIETIES,
  type CoverObjective,
  type CoverCropMix,
  type InputType,
  type OrganicInput,
  type RegionalVariety,
} from '@/lib/catalogs';

const RISK_CLASS = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-amber-100 text-amber-800',
  HIGH: 'bg-red-100 text-red-800',
} as const;

const FLOWERING_LABEL = {
  EARLY: 'Floración temprana',
  MID: 'Floración media',
  LATE: 'Floración tardía',
  EXTRA_LATE: 'Floración extra-tardía',
} as const;

const COVER_OBJECTIVE_LABEL: Record<CoverObjective, string> = {
  NITROGEN_FIXATION: 'Fijación de N',
  BIOMASS: 'Biomasa',
  SOIL_STRUCTURE: 'Estructura del suelo',
  POLLINATORS: 'Polinizadores',
  PEST_REPELLENT: 'Repelente de plagas',
  MIXED: 'Mixto',
};

const INPUT_TYPE_LABEL: Record<InputType, string> = {
  FERTILIZER: 'Fertilizante',
  AMENDMENT: 'Enmienda',
  BIOSTIMULANT: 'Bioestimulante',
  FUNGICIDE: 'Fungicida',
  INSECTICIDE: 'Insecticida',
  INOCULANT: 'Inoculante',
  ATTRACTANT: 'Atrayente / feromona',
  OTHER: 'Otro',
};

const INPUT_TYPE_CLASS: Record<InputType, string> = {
  FERTILIZER: 'bg-amber-100 text-amber-800',
  AMENDMENT: 'bg-stone-100 text-stone-800',
  BIOSTIMULANT: 'bg-emerald-100 text-emerald-800',
  FUNGICIDE: 'bg-blue-100 text-blue-800',
  INSECTICIDE: 'bg-red-100 text-red-800',
  INOCULANT: 'bg-violet-100 text-violet-800',
  ATTRACTANT: 'bg-pink-100 text-pink-800',
  OTHER: 'bg-slate-100 text-slate-800',
};

const DOY_MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function doyLabel(d: number): string {
  const date = new Date(2025, 0, d);
  const day = date.getDate();
  const month = DOY_MONTHS[date.getMonth()]!;
  return `${day} ${month}`;
}

export function CatalogsPage(): JSX.Element {
  return (
    <PageContainer
      title="Catálogos"
      subtitle="Variedades, mezclas de cubierta e insumos ecológicos precargados para Burgos."
    >
      <Tabs defaultValue="varieties">
        <TabsList className="flex-wrap">
          <TabsTrigger value="varieties">Variedades ({VARIETIES.length})</TabsTrigger>
          <TabsTrigger value="cover">Cubiertas ({COVER_MIXES.length})</TabsTrigger>
          <TabsTrigger value="inputs">Insumos ({INPUTS.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="varieties">
          <VarietiesTab />
        </TabsContent>
        <TabsContent value="cover">
          <CoverMixesTab />
        </TabsContent>
        <TabsContent value="inputs">
          <InputsTab />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

function VarietiesTab(): JSX.Element {
  const [query, setQuery] = useState('');
  const [species, setSpecies] = useState<string>('all');
  const [suitableOnly, setSuitableOnly] = useState(true);

  const speciesList = useMemo(() => {
    return [...new Set(VARIETIES.map((v) => v.species))].sort();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return VARIETIES.filter((v) => {
      if (species !== 'all' && v.species !== species) return false;
      if (suitableOnly && !v.suitableForBurgos) return false;
      if (q) {
        const hay = `${v.cultivar} ${v.commonName} ${v.species} ${v.notes}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [query, species, suitableOnly]);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="grid flex-1 gap-1">
          <Input
            placeholder="Buscar por cultivar, nombre o notas…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={species} onValueChange={setSpecies}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las especies</SelectItem>
            {speciesList.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-1 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={suitableOnly}
            onChange={(e) => setSuitableOnly(e.target.checked)}
          />
          Solo aptas Burgos
        </label>
      </div>
      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-4 text-sm text-slate-600">Sin resultados.</CardContent>
        </Card>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((v) => (
          <VarietyCard key={v.id} variety={v} />
        ))}
      </div>
    </div>
  );
}

function VarietyCard({ variety }: { variety: RegionalVariety }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{variety.cultivar}</CardTitle>
            <p className="text-xs text-slate-500">
              {variety.commonName} · <em>{variety.species}</em>
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${RISK_CLASS[variety.lateFrostRisk]}`}
          >
            Helada {variety.lateFrostRisk}
          </span>
        </div>
      </CardHeader>
      <CardContent className="grid gap-2 pt-0 text-sm text-slate-700">
        <div className="flex flex-wrap gap-1 text-xs text-slate-500">
          <span className="rounded bg-slate-100 px-2 py-0.5">
            {FLOWERING_LABEL[variety.floweringPeriod]}
          </span>
          {variety.coldHardinessZone && (
            <span className="rounded bg-slate-100 px-2 py-0.5">
              Zona {variety.coldHardinessZone}
            </span>
          )}
          {!variety.suitableForBurgos && (
            <span className="rounded bg-red-100 px-2 py-0.5 text-red-800">
              No apta Burgos
            </span>
          )}
        </div>
        {variety.recommendedRootstocks && variety.recommendedRootstocks.length > 0 && (
          <p>
            <span className="font-medium text-slate-600">Patrones: </span>
            {variety.recommendedRootstocks.join(', ')}
          </p>
        )}
        {variety.recommendedSpacingRowM && variety.recommendedSpacingPlantM && (
          <p>
            <span className="font-medium text-slate-600">Marco: </span>
            {variety.recommendedSpacingRowM[0]}-{variety.recommendedSpacingRowM[1]} m × {variety.recommendedSpacingPlantM[0]}-{variety.recommendedSpacingPlantM[1]} m
          </p>
        )}
        {variety.pollinators && variety.pollinators.length > 0 && (
          <p>
            <span className="font-medium text-slate-600">Polinizadores: </span>
            {variety.pollinators.join(', ')}
          </p>
        )}
        <p className="text-slate-600">{variety.notes}</p>
      </CardContent>
    </Card>
  );
}

function CoverMixesTab(): JSX.Element {
  const [query, setQuery] = useState('');
  const [objective, setObjective] = useState<string>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COVER_MIXES.filter((m) => {
      if (objective !== 'all' && m.primaryObjective !== objective) return false;
      if (q) {
        const hay = `${m.name} ${m.notes} ${m.recipe.map((r) => r.species).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [query, objective]);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="grid flex-1 gap-1">
          <Input
            placeholder="Buscar por especie o nombre…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={objective} onValueChange={setObjective}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los objetivos</SelectItem>
            {Object.entries(COVER_OBJECTIVE_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-4 text-sm text-slate-600">Sin resultados.</CardContent>
        </Card>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((m) => (
          <CoverMixCard key={m.id} mix={m} />
        ))}
      </div>
    </div>
  );
}

function CoverMixCard({ mix }: { mix: CoverCropMix }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base">{mix.name}</CardTitle>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
            {COVER_OBJECTIVE_LABEL[mix.primaryObjective]}
          </span>
        </div>
      </CardHeader>
      <CardContent className="grid gap-2 pt-0 text-sm text-slate-700">
        <p className="text-xs text-slate-500">
          Siembra: {doyLabel(mix.sowingWindowStartDoy)} – {doyLabel(mix.sowingWindowEndDoy)}{' '}
          {mix.irrigationDependent && '· requiere riego de apoyo'}
        </p>
        <ul className="list-disc pl-5 text-sm text-slate-700">
          {mix.recipe.map((r, i) => (
            <li key={i}>
              {r.species} — {r.kgPerHa} kg/ha
            </li>
          ))}
        </ul>
        <p className="text-slate-600">{mix.notes}</p>
        {mix.references && mix.references.length > 0 && (
          <p className="text-xs text-slate-500">{mix.references.join(' · ')}</p>
        )}
      </CardContent>
    </Card>
  );
}

function InputsTab(): JSX.Element {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<string>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return INPUTS.filter((i) => {
      if (type !== 'all' && i.type !== type) return false;
      if (q) {
        const hay = `${i.name} ${i.activeIngredient ?? ''} ${i.notes ?? ''} ${i.allowedCrops.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [query, type]);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="grid flex-1 gap-1">
          <Input
            placeholder="Buscar por nombre, activo o cultivo…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {Object.entries(INPUT_TYPE_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-4 text-sm text-slate-600">Sin resultados.</CardContent>
        </Card>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((i) => (
          <InputCard key={i.id} input={i} />
        ))}
      </div>
    </div>
  );
}

function InputCard({ input }: { input: OrganicInput }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{input.name}</CardTitle>
            {input.activeIngredient && (
              <p className="text-xs text-slate-500">{input.activeIngredient}</p>
            )}
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${INPUT_TYPE_CLASS[input.type]}`}
          >
            {INPUT_TYPE_LABEL[input.type]}
          </span>
        </div>
      </CardHeader>
      <CardContent className="grid gap-2 pt-0 text-sm text-slate-700">
        <p>
          <span className="font-medium text-slate-600">Cultivos: </span>
          {input.allowedCrops.join(', ')}
        </p>
        {typeof input.preHarvestIntervalDays === 'number' && (
          <p>
            <span className="font-medium text-slate-600">Plazo seguridad: </span>
            {input.preHarvestIntervalDays} d
          </p>
        )}
        {input.restrictions && (
          <p className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
            {input.restrictions}
          </p>
        )}
        {input.notes && <p className="text-slate-600">{input.notes}</p>}
        {input.scientificReferences && input.scientificReferences.length > 0 && (
          <p className="text-xs text-slate-500">
            {input.scientificReferences.join(' · ')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
