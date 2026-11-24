# Estado del proyecto

## Estado actual

- La base del proyecto funciona: Vite, React y TypeScript, con pruebas en Vitest, oxlint, Prettier, reglas de dependencias y CI.
- El núcleo (`src/core`) está completo:
  - validación de Σ y L;
  - construcción por contadores con varias pilas y sus pasos explicados;
  - simulación por búsqueda en anchura;
  - definición formal y ejemplos precargados.
- Hay 99 pruebas en verde, incluido un oráculo sobre 19 lenguajes.
- La interfaz todavía es provisional: solo muestra el título.

## Último cambio

Base del proyecto, núcleo completo y documento técnico (rama `feat/base-proyecto`).

## Siguiente paso

El integrante 2 construye la interfaz siguiendo `docs/plan-de-trabajo.md`:

- entradas;
- pasos y definición formal;
- tabla;
- diagrama;
- simulación paso a paso;
- historial;
- manual de usuario.

## Decisiones vigentes

- App web sin servidor ([ADR 0001](decisions/0001-app-web-sin-servidor.md)).
- Construcción por contadores con varias pilas ([ADR 0002](decisions/0002-construccion-por-contadores-con-varias-pilas.md)).
- Notación de transiciones centralizada en `src/core/format.ts`.

## Pendientes y gotchas

- TypeScript está fijado en 6.0.3: dependency-cruiser no soporta la 7.0 y con ella analiza 0 módulos.
- La interfaz importa el núcleo solo desde `src/core/index.ts`. Si no, `npm run lint` falla.
- Los archivos de prueba del núcleo que no necesitan DOM pueden declarar `// @vitest-environment node` para correr más rápido.
