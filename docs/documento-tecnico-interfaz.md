# Documento técnico de la interfaz

Este documento describe la capa de presentación de **Autómatas con pilas** (`src/app/`, `src/features/` y `src/shared/`), complementando el [documento técnico del núcleo](documento-tecnico.md).

## 1. Estructura y ubicación del estado

La interfaz sigue una arquitectura por funcionalidades (_feature-based_) en React y TypeScript, desacoplada de la lógica matemática mediante el único punto de entrada `src/core/index.ts` (verificado automáticamente por `dependency-cruiser`).

| Archivo                                              | Responsabilidad                                                                                                                     |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/App.tsx`                                    | Estado central de la sesión: textos de entrada, resultado de construcción, pestaña activa, traza e historial                        |
| `src/app/styles.css`                                 | Hoja de estilos global con tokens claro/oscuro, contraste WCAG AA y diseño adaptable                                                |
| `src/shared/Tabs.tsx`                                | Componente reutilizable de pestañas accesibles (WAI-ARIA) con navegación por teclado                                                |
| `src/features/input/buildFromTexts.ts`               | Función pura que encadena `parseAlphabet`, `parseLanguage` y `buildConstruction`                                                    |
| `src/features/input/InputPanel.tsx`                  | Formulario de entrada de Σ y L, selector de `EXAMPLES`, alertas de error y ayuda de sintaxis                                        |
| `src/features/construction/StepsView.tsx`            | Lista numerada de los pasos de construcción con estados, pilas, transiciones y expandir/contraer                                    |
| `src/features/construction/FormalDefinitionView.tsx` | Presentación de la séptupla formal, alfabetos por pila y listado de `δ`                                                             |
| `src/features/table/transitionTable.ts`              | Modelo puro (`buildTransitionTable`) que agrupa las transiciones por estado y símbolo                                               |
| `src/features/table/TransitionTable.tsx`             | Renderizado semántico de la tabla con encabezados fijos y desplazamiento accesible                                                  |
| `src/features/diagram/toDot.ts`                      | Generador puro de código Graphviz DOT con agrupamiento de aristas y escape de caracteres                                            |
| `src/features/diagram/StateDiagram.tsx`              | Renderizado SVG en navegador mediante `@viz-js/viz` (WebAssembly) y descarga como archivo `.svg`                                    |
| `src/features/simulation/SimulationPanel.tsx`        | Formulario de cadena, veredicto, controles de traza (`Inicio`/`Anterior`/`Siguiente`/`Fin`/`Reproducir`) y verificación de ejemplos |
| `src/features/simulation/StackView.tsx`              | Renderizado apilado de abajo hacia arriba de cada pila del autómata                                                                 |
| `src/features/history/historyStorage.ts`             | Persistencia y lectura defensiva en `localStorage` bajo la clave `automatas-pila:historial`                                         |
| `src/features/history/HistoryPanel.tsx`              | Listado de construcciones guardadas con acciones para reabrir y volver a simular cadenas                                            |

El estado reside en `App.tsx` para garantizar **RF-12**: cambiar entre pestañas no destruye ni reinicia la construcción ni el progreso de la simulación en curso.

## 2. Flujo de datos

1. **Entrada y construcción:** el usuario selecciona un ejemplo o escribe en `InputPanel`. Al enviar el formulario, `App` llama a `buildFromTexts(alphabetText, languageText)`:
   - Primero ejecuta `parseAlphabet`. Si falla, devuelve `alphabetErrors` y no intenta analizar `L`.
   - Luego ejecuta `parseLanguage` verificando también pertenencia a `Σ` (RF-04).
   - Si ambos son válidos, llama a `buildConstruction` y guarda `alphabetText` y `languageText` en `lastBuilt` y en el historial (`saveConstruction`).
   - Si el usuario edita posteriormente `Σ` o `L` sin volver a construir, `App` compara contra `lastBuilt` y marca `isStale = true` para mostrar un aviso de actualización pendiente.
2. **Visualización:** la propiedad `construction` alimenta las pestañas `Pasos`, `Definición formal`, `Tabla` y `Diagrama`.
3. **Simulación y resaltado:** al enviar una cadena en `SimulationPanel`, `App` invoca `simulate(construction.automaton, rawInput)`, registra el resultado en el historial (`addSimulation`) y guarda `simulationResult` y `simulationStep`. El estado activo de la configuración actual (`trace[simulationStep].configuration.state`) se envía opcionalmente a `StateDiagram` para resaltarlo en el grafo.

## 3. Construcción de la tabla de transición

`buildTransitionTable(automaton)` construye las columnas en orden `[...automaton.inputAlphabet, EPSILON]` y recorre `automaton.states` en orden de creación.

- Cada fila calcula su etiqueta anteponiendo `→` si coincide con `automaton.initial`, `*` si pertenece a `automaton.finals`, o `→*` si cumple ambas condiciones.
- Cada transición `t` se inserta en la columna correspondiente a `t.input ?? EPSILON` usando estrictamente `formatTransition(t) + ' → ' + t.to`, evitando duplicar lógica de notación en la interfaz.
- En el DOM (`TransitionTable.tsx`), la tabla usa `<th scope="col">`, `<th scope="row">`, `<caption className="visually-hidden">` y un contenedor con `tabIndex={0}` y `role="region"`, fijando los encabezados al desplazarse.

## 4. Generación del diagrama DOT y renderizado

`toDot(automaton, activeState?)` genera una descripción dirigida de izquierda a derecha (`rankdir=LR`):

1. Declara el punto de entrada `inicio -> <initial>` y el doble círculo `[shape=doublecircle]` para cada estado de aceptación.
2. Agrupa todas las transiciones con el mismo par `(from, to)` en un `Map`, evitando múltiples aristas superpuestas y uniendo sus etiquetas en una sola con `\n` entre líneas.
3. Escapa `\` por `\\` y `"` por `\"` en cada etiqueta antes de unirlas, protegiendo símbolos especiales como comillas dentro del alfabeto.
4. `StateDiagram` carga `@viz-js/viz` de forma asíncrona en `useEffect`, inserta el elemento SVG resultante mediante `replaceChildren` (sin usar `innerHTML`) dentro de un lienzo blanco con `color-scheme: light` para preservar la legibilidad en modo oscuro, y ofrece exportación mediante `XMLSerializer` y `Blob`.

## 5. Persistencia defensiva del historial

`historyStorage.ts` almacena un máximo de 20 entradas (`HistoryEntry[]`) en `localStorage` bajo la clave `automatas-pila:historial`.

- **Sin duplicados:** al guardar una construcción con la misma pareja exacta `(alphabetText, languageText)`, se actualiza la fecha y se mueve al inicio conservando sus simulaciones previas.
- **Lectura defensiva:** toda lectura/escritura está envuelta en `try/catch` (protección ante modo privado o cuota llena) y valida tipo a tipo cada campo de cada entrada y simulación con predicados (`isValidEntry`, `isValidSimulation`). Ante JSON corrupto o alterado externamente, devuelve `[]` en lugar de lanzar excepciones.

## 6. Decisiones de diseño

- **Sin librería de componentes UI:** todos los controles se implementaron con HTML semántico nativo y CSS moderno (`light-dark()`, propiedades lógicas y `@media (prefers-color-scheme: dark)`), manteniendo bajo el peso del paquete y total control sobre la accesibilidad.
- **Notación centralizada en el núcleo:** tanto la tabla, los pasos, la definición formal, el diagrama DOT como la simulación consumen `formatTransition`, `formalDefinition` y `EPSILON` desde `src/core/index.ts`.
- **Pestañas WAI-ARIA completas:** `Tabs.tsx` implementa `role="tablist"`, `role="tab"`, `aria-selected`, `role="tabpanel"` y navegación por teclado (`ArrowLeft`, `ArrowRight`, `Home`, `End`) manteniendo montados los paneles con `hidden` para preservar el estado al cambiar de vista.
- **Importación explícita `.tsx` en `TransitionTable`:** al coexistir `transitionTable.ts` y `TransitionTable.tsx` en la misma carpeta, en sistemas de archivos insensibles a mayúsculas (Windows) la resolución sin extensión de Vite prioriza `.ts` sobre `.tsx`. Importar `./TransitionTable.tsx` (permitido por `allowImportingTsExtensions` en `tsconfig.app.json`) garantiza resolución inequívoca en cualquier sistema operativo.
- **Sincronización sin efectos en cascada:** tanto `StateDiagram` como `SimulationPanel` derivan estados transitorios durante el render o los actualizan exclusivamente en callbacks asíncronos, evitando llamadas síncronas a `setState` dentro de `useEffect` (0 advertencias en `oxlint`).

## 7. Limitaciones de la interfaz

- Autómatas con muchas transiciones simultáneas (como los generados para múltiples pilas) producen tablas y diagramas DOT horizontales extensos que requieren desplazamiento horizontal en pantalla.
- Las pruebas automatizadas en `jsdom` no ejecutan WebAssembly, por lo que verifican la generación del código DOT y la lógica de UI, mientras que el renderizado final del SVG con `@viz-js/viz` se verifica en navegador real.
- El historial se guarda únicamente de forma local en el navegador del usuario (`localStorage`) con un límite de 20 construcciones.

## 8. Pruebas de la interfaz

La capa de interfaz cuenta con 26 pruebas automatizadas distribuidas junto a cada módulo (`*.test.ts` y `*.test.tsx`), sumando 128 pruebas totales junto al núcleo:

- **Lógica pura:** `buildFromTexts.test.ts` (validación encadenada y formato de posición), `transitionTable.test.ts` (columnas, etiquetas `→`/`*`/`→*` y celdas de `aⁿbⁿ`), `toDot.test.ts` (agrupamiento de aristas paralelas y escape de comillas) y `historyStorage.test.ts` (lectura/escritura, límite de 20, deduplicación y JSON dañado).
- **Componentes e integración:** `Tabs.test.tsx`, `InputPanel.test.tsx`, `ConstructionViews.test.tsx`, `TransitionTable.test.tsx`, `SimulationPanel.test.tsx`, `HistoryPanel.test.tsx` y `App.test.tsx` (flujo completo desde selección de ejemplo hasta simulación y reapertura desde el historial).
- **Verificación en navegador real:** comprobación manual/automatizada en Chromium sobre `vite` en ejecución para validar el renderizado WebAssembly del diagrama, el apilamiento visual de `StackView` y la persistencia en `localStorage` tras recargar la página.
