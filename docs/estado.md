# Estado del proyecto

## Estado actual

- El proyecto está completo y cubre RF-01 a RF-12.
- El núcleo (`src/core`) valida Σ y L, construye el autómata por contadores con varias pilas y explica sus pasos, simula por búsqueda en anchura y genera la definición formal.
- La interfaz tiene seis pestañas: pasos, definición formal, tabla, diagrama con Graphviz, simulación paso a paso con las pilas e historial en `localStorage`.
- Hay 128 pruebas en verde (102 del núcleo y 26 de la interfaz), incluido un oráculo sobre 19 lenguajes.
- Documentos listos: README, documento técnico (núcleo e interfaz) y manual de usuario con capturas.

## Último cambio

Interfaz completa (PR #2) y cierre de la documentación para la entrega.

## Siguiente paso

Ensayar la sustentación y, si la piden en PDF, exportar el documento técnico (`documento-tecnico.md` y `documento-tecnico-interfaz.md`) y el manual.

## Decisiones vigentes

- App web sin servidor ([ADR 0001](decisions/0001-app-web-sin-servidor.md)).
- Construcción por contadores con varias pilas ([ADR 0002](decisions/0002-construccion-por-contadores-con-varias-pilas.md)).
- Notación de transiciones centralizada en `src/core/format.ts`.

## Pendientes y gotchas

- TypeScript está fijado en 6.0.3: dependency-cruiser no soporta la 7.0.
- El build avisa que el paquete pesa más de 500 kB, porque incluye Graphviz. Funciona igual; se podría cargar el diagrama con `import()` dinámico.
- «Descargar SVG» libera el enlace justo después del clic; en Firefox la descarga podría no arrancar.
