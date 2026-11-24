# Plan de trabajo

Este documento fija cómo nos repartimos el microproyecto y las reglas para trabajar en paralelo sin pisarnos.

## División

| Integrante | Parte                                                                                                                                                              | Carpetas                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| 1          | Base del proyecto y núcleo: validación de Σ y L, construcción del autómata con sus pasos, simulación, definición formal, ejemplos y documento técnico              | `src/core/`, configuración del proyecto, `docs/` (salvo lo del integrante 2)                               |
| 2          | Interfaz: entradas, pasos, definición formal, tabla, diagrama, simulación paso a paso, historial, manual de usuario y la sección de interfaz del documento técnico | `src/app/`, `src/features/`, `src/shared/`, `docs/manual-usuario.md`, `docs/documento-tecnico-interfaz.md` |

Cada requisito queda cubierto así:

| Requisito                | Núcleo (integrante 1)      | Pantalla (integrante 2)   |
| ------------------------ | -------------------------- | ------------------------- |
| RF-01 Alfabeto           | `parseAlphabet`            | Campo Σ con sus errores   |
| RF-02 Lenguaje           | `parseLanguage`            | Campo L con sus errores   |
| RF-04 Símbolos de L en Σ | `parseLanguage`            | Mensaje junto al campo L  |
| RF-05 Construcción       | `buildConstruction`        | Botón Construir           |
| RF-06 Paso a paso        | `steps` de la construcción | Pestaña Pasos             |
| RF-07 Definición formal  | `formalDefinition`         | Pestaña Definición formal |
| RF-08 Tabla              | `automaton.transitions`    | Pestaña Tabla             |
| RF-09 Diagrama           | `automaton`                | Pestaña Diagrama          |
| RF-10 y RF-11 Simulación | `simulate`                 | Pestaña Simulación        |
| RF-12 Volver a consultar |                            | Pestañas e historial      |

## Reglas para no pisarnos

- Cada uno edita solo sus carpetas. Si hace falta tocar algo del otro, se habla antes.
- `package.json`, la configuración, el CI y este documento los cambia el integrante 1. Si se necesita una dependencia nueva, se pide.
- El contrato entre el núcleo y la interfaz está en `src/core/types.ts` y `src/core/index.ts`. La interfaz importa el núcleo solo desde `src/core/index.ts` (por ejemplo `import { simulate } from '../../core'`). `npm run lint` falla si se importa otro archivo del núcleo.
- Si el contrato necesita un cambio, lo hace el integrante 1 en un PR aparte y avisa. Agregar campos opcionales no rompe nada.

## Flujo de git

1. Partir siempre de `main` actualizado: `git checkout main` y `git pull`.
2. Crear una rama por tarea: `git checkout -b feat/<tema>`, por ejemplo `feat/tabla-transicion`.
3. Commits pequeños con el formato `tipo(alcance): descripción en español`, en una sola línea. Tipos: `feat`, `fix`, `test`, `docs`, `refactor`, `style`, `chore`. Ejemplo: `feat(tabla): muestra las transiciones por estado y símbolo`.
4. Antes de subir: `npm run check` en verde.
5. Subir la rama (`git push -u origin feat/<tema>`) y abrir un PR hacia `main` con la plantilla.
6. El otro integrante revisa. Se fusiona con "Squash and merge" cuando el CI está en verde.

Antes de cada commit conviene mirar `git status` y agregar solo los archivos de la tarea: nada de carpetas de configuración personal del editor ni archivos generados.

## Contrato en una mirada

```ts
import {
  parseAlphabet,
  parseLanguage,
  buildConstruction,
  simulate,
  formatTransition,
  formalDefinition,
  EXAMPLES,
} from '../../core'

const sigma = parseAlphabet('0, 1') // Result<Alphabet>
if (!sigma.ok) mostrarErrores(sigma.errors) // [{ message, position }]

const lenguaje = parseLanguage('{(0^n 1^m)^k | n > 0, m > 1, k = n}', sigma.value)
if (!lenguaje.ok) mostrarErrores(lenguaje.errors)

const construccion = buildConstruction(lenguaje.value) // { language, automaton, steps }
const resultado = simulate(construccion.automaton, '00110011')
resultado.accepted // true
resultado.trace // configuraciones paso a paso
formatTransition(construccion.automaton.transitions[1]) // 'X₀, 0, X₀X ; Z₀, 0, Z₀Z'
```

Los tipos completos, con comentarios, están en `src/core/types.ts`.

## Comandos

- `npm run dev`: servidor de desarrollo.
- `npm test`: pruebas.
- `npm run check`: lint, formato, pruebas y build. Es lo que corre el CI en cada PR.

## Terminado significa

- La funcionalidad cumple su requisito y se ve en la aplicación.
- Tiene sus pruebas y `npm run check` pasa.
- Si cambió el uso, el manual o el documento técnico lo dicen.
