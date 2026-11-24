# Arquitectura

## Contexto

Aplicación web de una sola página, sin servidor. Una persona escribe Σ, L y cadenas de prueba. La aplicación construye el autómata, lo muestra (pasos, definición formal, tabla y diagrama) y simula las cadenas. No hay sistemas externos: el historial vive en el `localStorage` del navegador.

## Capas y módulos

```
src/core/            Lógica pura (sin React ni DOM)
  index.ts           API pública: lo único que usa la interfaz
  types.ts           Contrato de datos
  alphabet.ts        Validación de Σ
  language/          Lectura de L, normalización e impresión con superíndices
  construction/      Análisis de usos, piezas, pasos y construcción
  simulation/        Búsqueda en anchura sobre configuraciones
  format.ts          Notación de las transiciones (único lugar)
  formalDefinition.ts
  examples.ts        Ejemplos precargados
src/app/             Aplicación: pantalla principal y pestañas
src/features/        Entradas, pasos, definición formal, tabla, diagrama, simulación, historial
src/shared/          Componentes y estilos comunes
```

**Reglas de dependencias**, comprobadas con dependency-cruiser en `npm run lint` (archivo `.dependency-cruiser.cjs`):

- `core-sin-interfaz`: `src/core` no importa React ni nada de `src/app`, `src/features` o `src/shared`.
- `interfaz-usa-core-por-index`: la interfaz entra al núcleo solo por `src/core/index.ts`.
- `no-circular` y `not-to-unresolvable`: no hay ciclos ni imports que no resuelven.

## Flujo principal

1. **Construir:** `parseAlphabet(texto)`, luego `parseLanguage(texto, Σ)` y luego `buildConstruction(L)`, que da el autómata y los pasos.
2. **Mostrar:**
   - `steps` para la pestaña de pasos;
   - `formalDefinition(automaton)` para la definición formal;
   - `automaton.transitions` y `formatTransition` para la tabla y el diagrama.
3. **Simular:** `simulate(automaton, cadena)` da el resultado y la traza que recorre la vista paso a paso.

## Modelo de datos

Ver `documento-tecnico.md`, sección 6, y `src/core/types.ts`.

## Atributos de calidad

- **Correctitud:** el autómata acepta exactamente L. Lo verifica el oráculo sobre 19 lenguajes.
- **Claridad:** cada estado y cada transición llevan su explicación.
- **Rendimiento:** con una cadena de 100 símbolos, la simulación del ejemplo de clase termina en menos de 2 s. Los límites de exploración evitan que la página se congele.
- **Mantenibilidad:** la notación está en un solo módulo, y las capas están separadas y comprobadas.

## Riesgos y deuda técnica

- **Autómatas más grandes que los diseñados a mano.** Impacto bajo: se documenta en el documento técnico y en `decisions/0002-…`.
- **Construcciones no soportadas** (desigualdades, gramáticas). Impacto medio si se piden en la sustentación. Plan: segundo modo de entrada (ver ADR 0002).
- **TypeScript fijado en 6.0.3** por dependency-cruiser. Plan: subir a 7.x cuando dependency-cruiser lo soporte.
