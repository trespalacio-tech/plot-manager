# Fincas — Gestión regenerativa de cultivos leñosos

App local-first (PWA) para gestión regenerativa de frutales y viñedo en Burgos.
Sin servidor, sin cuentas, sin internet obligatorio. Todos los datos viven en el
dispositivo del usuario (IndexedDB).

La especificación funcional completa está en [SPEC.md](./SPEC.md).

## Estado

Sprint 1 — Cimientos. Shell de 6 pestañas, Dexie base, PWA instalable, CI/CD.

## Desarrollo

```bash
npm install
npm run dev         # http://localhost:5173
npm test            # Vitest
npm run typecheck   # TS strict
npm run build       # build estático en ./dist
npm run preview     # sirve ./dist
```

## Estructura (resumen)

```
src/
  components/       # AppShell y UI compartida
  pages/            # Hoy, Cuaderno, Parcelas, Calendario, Aprender, Ajustes
  lib/
    db/             # Dexie: esquema + tipos
    pwa/            # registro del service worker
    utils.ts        # cn() para shadcn
  test/setup.ts     # jest-dom + fake-indexeddb
```

## Despliegue

Se publica automáticamente en GitHub Pages al empujar a `main` mediante el workflow
`.github/workflows/deploy.yml`. Si la Pages sirve desde `https://<user>.github.io/<repo>/`,
el workflow ajusta automáticamente `BASE_URL` al nombre del repo. Para un dominio raíz,
define la variable de repo `BASE_URL=/` en Settings → Variables.

## Principios (de SPEC.md)

- Local-first. Los datos no salen del dispositivo.
- Todo basado en ciencia. Cada recomendación cita su base agronómica.
- Coach mode: la pantalla principal responde "¿Qué hago hoy?".
- Coste cero operativo. GitHub Pages gratis, sin claves de API obligatorias.
