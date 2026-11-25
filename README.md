# Autómatas con pilas

Software educativo que construye y simula autómatas a pila a partir de un alfabeto y de un lenguaje escrito en notación de conjuntos. Microproyecto 1 de Teoría de la Computación, UFPS, 2026-2.

## Qué hace

- Valida el alfabeto Σ y el lenguaje L, y revisa que todos los símbolos de L pertenezcan a Σ.
- Construye el autómata contando cada variable del lenguaje en su propia pila, como se trabaja en clase, y explica cada estado y cada transición que crea.
- Presenta la definición formal, la tabla de transición y el diagrama de transición.
- Simula cadenas paso a paso, mostrando el estado actual, la entrada pendiente y el contenido de cada pila, e informa si la cadena es aceptada o rechazada.
- Guarda un historial para consultar de nuevo los pasos y los resultados sin volver a escribir los datos.

## Requisitos

- Node.js 22 o superior (trae npm).

## Instalación y ejecución

```bash
npm install
```

```bash
npm run dev
```

Después se abre en el navegador la dirección que muestra la terminal (normalmente `http://localhost:5173`).

Para generar la versión final y probarla:

```bash
npm run build
```

```bash
npm run preview
```

## Versión de escritorio para Windows

La carpeta `escritorio/` empaqueta la misma aplicación como un ejecutable portable para Windows 10 y 11 de 64 bits. Es un solo archivo, no necesita instalación, funciona sin internet y no requiere Node.js en el equipo donde se usa.

Para usarlo basta con abrir `Automatas-con-pilas.exe`. La primera vez puede tardar unos segundos, mientras se descomprime. Como el ejecutable no está firmado digitalmente, Windows puede mostrar el aviso «Windows protegió su PC»: en ese caso se elige «Más información» y luego «Ejecutar de todas formas». El historial queda guardado en el equipo entre una apertura y otra.

Para generarlo de nuevo (desde Windows, macOS o Linux, con Node.js 22):

```bash
cd escritorio
```

```bash
npm install
```

```bash
npm run exe
```

El archivo queda en `escritorio/salida/Automatas-con-pilas.exe`. Con `npm run abrir` se prueba la versión de escritorio sin generar el ejecutable.

## Ejemplo rápido

| Campo  | Valor                                  |
| ------ | -------------------------------------- |
| Σ      | `0, 1`                                 |
| L      | `{(0^n 1^m)^k \| n > 0, m > 1, k = n}` |
| Cadena | `00110011` (aceptada)                  |

## Cómo se escribe el lenguaje

`L = { patrón | condiciones }`. `L =` y las llaves son opcionales, y en lugar de `|` también sirve `:`.

| Se escribe                           | Significa                          |
| ------------------------------------ | ---------------------------------- |
| `a^n b^n \| n >= 0`                  | aⁿbⁿ con n ≥ 0                     |
| `a^n b^(2n)` o `a^n b^2n`            | aⁿb²ⁿ                              |
| `a^n b^m c^(n+m) \| n, m >= 1`       | aⁿbᵐcⁿ⁺ᵐ con n, m ≥ 1              |
| `(0^n 1^m)^k \| n > 0, m > 1, k = n` | (0ⁿ1ᵐ)ᵏ con k = n                  |
| `(0ⁿ1ᵐ)ᵏ : n>0, m>1, k=n`            | lo mismo, escrito con superíndices |

Se admiten mínimos (`n > 0`, `n >= 1`, `n ≥ 1`) e igualdades entre variables (`k = n`, `m = 2n`). Una variable sin condición vale n ≥ 0. El detalle y las limitaciones están en el documento técnico.

## Comandos

| Comando          | Qué hace                                                  |
| ---------------- | --------------------------------------------------------- |
| `npm run dev`    | Servidor de desarrollo                                    |
| `npm test`       | Corre las pruebas                                         |
| `npm run lint`   | Revisa el código y las reglas de dependencias entre capas |
| `npm run format` | Da formato al código con Prettier                         |
| `npm run check`  | Lint, formato, pruebas y build (lo mismo que corre el CI) |

## Estructura

```
src/core/       Lógica: alfabeto, lenguaje, construcción, simulación, definición formal
src/app/        Aplicación: pantalla principal y pestañas
src/features/   Vistas: entradas, pasos, tabla, diagrama, simulación, historial
src/shared/     Componentes y estilos comunes
docs/           Documento técnico, manual de usuario, plan de trabajo y decisiones
```

## Documentación

- [Documento técnico](docs/documento-tecnico.md): algoritmo, estructuras de datos, decisiones de diseño y limitaciones.
- [Manual de usuario](docs/manual-usuario.md): uso de la aplicación con un ejemplo completo.
- [Plan de trabajo](docs/plan-de-trabajo.md): división del trabajo y reglas del equipo.
- [Arquitectura](docs/architecture.md) y [decisiones](docs/decisions/).

## Autores

- David Santiago Rincón Bautista
- Ángel Jhoan Díaz Vanegas
