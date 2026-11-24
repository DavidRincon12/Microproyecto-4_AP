# Documento técnico

Microproyecto 1, Teoría de la Computación (UFPS, 2026-2): software para la construcción y simulación de autómatas a pila.

## 1. Propósito y alcance

El software recibe un alfabeto Σ y un lenguaje L escrito en notación de conjuntos, por ejemplo L = {(0ⁿ1ᵐ)ᵏ : n > 0, m > 1, k = n}. Con eso hace lo siguiente:

1. Construye un autómata a pila que reconoce L.
2. Explica paso a paso cada estado y cada transición creada.
3. Presenta la definición formal, la tabla y el diagrama de transición.
4. Simula cadenas, mostrando en cada paso el estado actual, la entrada pendiente y el contenido de las pilas.

El método de construcción es el que se usa en clase: cada variable del lenguaje se cuenta en su propia pila, con un símbolo de conteo y un fondo. Cuando un conteo se necesita varias veces, se apoya en una pila auxiliar. Como varios de los lenguajes de clase no son libres de contexto (el ejemplo anterior es uno de ellos), el autómata puede usar varias pilas.

Este documento cubre el núcleo (`src/core`). La capa de presentación se describe en `documento-tecnico-interfaz.md`.

## 2. Modelo y notación

### 2.1 Autómata con varias pilas

M = (Q, Σ, Γ, δ, q₀, {fondos}, F), donde:

- Q es el conjunto de estados (q0, q1, …).
- Σ es el alfabeto de entrada.
- Hay k pilas con nombre (X, Y, Z, …). La pila X tiene el alfabeto Γ_X = {X₀, X}, donde X₀ es su fondo, y Γ es la unión de los alfabetos de todas las pilas.
- δ asocia a un estado, un símbolo de entrada (o ε) y los topes de las pilas que la transición toca, un estado nuevo y el reemplazo de cada uno de esos topes. Las pilas que una transición no menciona no cambian.
- q₀ es el estado inicial y F es el conjunto de estados de aceptación.

Las pilas empiezan vacías. La primera transición no lee nada y pone el fondo de cada pila.

**Criterio de aceptación:** una cadena se acepta si, después de leerla completa, el autómata puede estar en un estado de aceptación. Por construcción, al llegar ahí cada pila tiene solo su fondo, así que el criterio de pila vacía también se cumple.

### 2.2 Notación de las transiciones

Cada transición se escribe, por cada pila que toca, como `tope, entrada, reemplazo`, y las pilas se separan con `;`:

- `X₀, 0, X₀X ; Z₀, 0, Z₀Z`: lee un 0, apila una X sobre X₀ y una Z sobre Z₀.
- `X, 0, ε ; Xₐ, 0, XₐXₐ`: lee un 0, saca una X y pone una Xₐ.
- `Z₀, ε, Z₀`: sin leer nada, comprueba que Z está en su fondo.
- `ε, ε, X₀`: inicialización, pone el fondo de X.
- `b` o `ε` solos: transición que no toca ninguna pila.

El reemplazo se escribe de fondo a tope: en `X₀X`, la X queda encima. `ε` como reemplazo significa desapilar. Las pilas auxiliares llevan subíndice a (Xₐ, con fondo Xₐ₀).

Toda la notación sale de `src/core/format.ts`. Si hiciera falta otra (λ en lugar de ε, otro separador), se cambia en ese único archivo.

## 3. Entradas

### 3.1 Alfabeto

Se acepta `0, 1`, `{a, b}`, `Σ = {a, b}` o `a b`. Cada símbolo debe tener un solo carácter, no puede repetirse y no puede ser un carácter reservado de la notación (`( ) { } ^ | : , ; = < > ! + * ε λ`, espacios, superíndices ni subíndices). Se admiten de 1 a 10 símbolos, y no puede quedar texto después de la llave de cierre.

### 3.2 Lenguaje

`L = { patrón | condiciones }`. `L =` y las llaves son opcionales, y en lugar de `|` también se acepta `:`.

- **Patrón:** secuencia de símbolos de Σ y grupos entre paréntesis, cada uno con exponente opcional.
  - El exponente puede ser un número (`a^3`), una variable (`a^n`), un múltiplo (`a^2n`, `a^(2n)`, `a^(2*n)`) o una suma (`c^(n+m)`).
  - También se aceptan superíndices Unicode: `0ⁿ1ᵐ`, `b²ⁿ`.
  - Las variables son una letra minúscula. En la posición de base, los dígitos y las letras son símbolos (Σ = {0, 1} o Σ = {n, m} funcionan).
- **Condiciones:**
  - mínimos: `n > 0`, `n >= 1`, `n ≥ 1`;
  - listas: `n, m ≥ 1`;
  - igualdades entre variables: `k = n`, `m = 2n`;
  - valores fijos: `n = 3`.

  Una variable sin condición vale n ≥ 0.

Las validaciones, cada una con mensaje en español y posición en el texto, son:

- todo símbolo del patrón pertenece a Σ (RF-04);
- las variables de las condiciones aparecen en el patrón;
- los paréntesis y las llaves están balanceados;
- el exponente de un grupo es una sola variable o un número;
- no hay grupos anidados;
- las condiciones no se contradicen;
- el texto tiene como máximo 200 caracteres;
- los números (exponentes, coeficientes y valores de las condiciones) llegan hasta 100, y la cadena más corta de L no puede pasar de 100 símbolos, que es el máximo de la cadena de prueba.

### 3.3 Cadena de prueba

Símbolos de Σ escritos seguidos. La cadena vacía se escribe vacía, `ε` o `λ`. Se admiten hasta 100 símbolos.

## 4. Algoritmo de construcción

### 4.1 Normalización

`parseLanguage` lee el texto con un analizador descendente recursivo y después:

1. **Resuelve las igualdades.** Cada variable queda como un múltiplo de una variable raíz, o como una constante. k = n reemplaza k por n, y m = 2n convierte bᵐ en b²ⁿ.
2. **Traslada los mínimos a la raíz.** Si k ≥ 2 y k = n, entonces n ≥ 2. Si v = c·r, el mínimo de r es ⌈mín(v)/c⌉.
3. **Separa las sumas.** c^(n+m) se vuelve cⁿcᵐ, porque leer n + m símbolos c es leer n y luego m.
4. **Desenrolla los grupos con exponente numérico.** (ab)² se vuelve abab.

El resultado (`LanguageSpec`) es una lista de bloques sᵉ (con e constante o c·v) y de grupos (bloques)ᵛ, junto con el mínimo de cada variable. Por ejemplo, el ejercicio de clase queda como L = {(0ⁿ1ᵐ)ⁿ | n ≥ 1, m ≥ 2}.

### 4.2 Usos de cada variable

Se recorre el patrón en orden de lectura. Un bloque dentro de un grupo cuenta como un uso en cada repetición. Cada uso de una variable v tiene uno de estos papeles:

- **Definición:** el primer uso. Cuenta v apilando un símbolo por cada símbolo leído (o por cada c símbolos, si el exponente es c·v).
- **Verificación:** cualquier uso posterior en un bloque. Descuenta el conteo y exige que coincida.
- **Repeticiones:** el exponente de un grupo cuando v ya se conoce. Cuenta cuántas veces se repite el grupo.
- **Libre:** si v aparece una sola vez fuera de grupos, no hay nada que comparar y no necesita pila. Basta un lazo con su mínimo.

### 4.3 Pilas

- **Pila principal:** una por cada variable que se verifica, con letras X, Y, … en orden de definición.
- **Pila de repeticiones:** una por cada grupo cuyo número de repeticiones es una variable conocida (Z en el ejemplo). Se llena al mismo tiempo que la principal, mientras se define la variable.
- **Pila auxiliar:** Xₐ, para cada variable que se verifica más de una vez o dentro de un grupo. Durante la verificación, cada símbolo pasa de X a Xₐ en vez de descartarse, y al terminar se devuelve todo a X. Así el conteo queda completo para el siguiente uso.

### 4.4 Piezas

El autómata se arma encadenando piezas. Cada una recibe su estado de entrada y entrega un estado de salida:

| Pieza                     | Qué construye                                                                                                                                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Inicio                    | q0 → q1, poniendo el fondo de cada pila.                                                                                                                                                                                                   |
| Bloque constante sᵏ       | Una cadena de k lecturas de s, sin tocar pilas.                                                                                                                                                                                            |
| Bloque libre              | Las lecturas del mínimo en cadena, un lazo y una salida por ε.                                                                                                                                                                             |
| Definición                | Lecturas obligatorias en cadena (la primera apila sobre el fondo: `X₀, s, X₀X`), un lazo (`X, s, XX`) y una salida por ε. Si el mínimo es 0, el lazo está en el estado de entrada con ambas variantes.                                     |
| Verificación final        | Lazo `X, s, ε` y salida `X₀, ε, X₀`, que solo pasa si la pila quedó en su fondo.                                                                                                                                                           |
| Verificación con traspaso | Lazo `X, s, ε ; Xₐ, s, XₐXₐ` (o con `Xₐ₀` si Xₐ está vacía), salida `X₀, ε, X₀` y devolución por ε de Xₐ a X hasta `Xₐ₀`.                                                                                                                  |
| Grupo                     | Una copia de su cuerpo para la primera repetición (la que define), otra para las siguientes (que verifican) y un estado de decisión que sale cuando la pila de repeticiones queda en su fondo o entra a otra repetición desapilando una Z. |
| Limpieza y aceptación     | Lazos `X, ε, ε` para los conteos que sobran y una transición que exige todos los fondos antes del estado de aceptación.                                                                                                                    |

Cada lazo vive en un estado propio, y una pieza con lazo sale siempre hacia un estado nuevo. Esa regla evita mezclar lazos de bloques distintos; por ejemplo, el autómata de aⁿbⁿ no acepta `abab`.

### 4.5 Ejemplo completo: (0ⁿ1ᵐ)ᵏ con n > 0, m > 1, k = n

Variables: n se define con los 0 de la primera repetición, se verifica en las siguientes y controla las repeticiones; m se define con los 1 de la primera repetición y se verifica en las siguientes. Pilas: X (n), Y (m), Z (repeticiones que faltan), Xₐ y Yₐ (auxiliares).

| Desde → hacia | Transición                                               | Para qué                                       |
| ------------- | -------------------------------------------------------- | ---------------------------------------------- |
| q0 → q1       | `ε, ε, X₀ ; ε, ε, Y₀ ; ε, ε, Z₀ ; ε, ε, Xₐ₀ ; ε, ε, Yₐ₀` | Pone el fondo de las cinco pilas.              |
| q1 → q2       | `X₀, 0, X₀X ; Z₀, 0, Z₀Z`                                | Primer 0: empieza a contar n en X y en Z.      |
| q2 → q2       | `X, 0, XX ; Z, 0, ZZ`                                    | Más ceros del primer bloque.                   |
| q2 → q3       | `ε`                                                      | Termina de contar n.                           |
| q3 → q4       | `Y₀, 1, Y₀Y`                                             | Primer 1: empieza a contar m.                  |
| q4 → q5       | `Y, 1, YY`                                               | Segundo 1 (m ≥ 2).                             |
| q5 → q5       | `Y, 1, YY`                                               | Más unos.                                      |
| q5 → q6       | `ε`                                                      | Termina de contar m.                           |
| q6 → q7       | `Z, ε, ε`                                                | Descuenta la primera repetición.               |
| q7 → q8       | `Z, ε, ε`                                                | Quedan repeticiones: descuenta otra y empieza. |
| q8 → q8       | `X, 0, ε ; Xₐ₀, 0, Xₐ₀Xₐ` y `X, 0, ε ; Xₐ, 0, XₐXₐ`      | Verifica n pasando X a Xₐ.                     |
| q8 → q9       | `X₀, ε, X₀`                                              | La cantidad de ceros coincidió con n.          |
| q9 → q9       | `Xₐ, ε, ε ; X₀, ε, X₀X` y `Xₐ, ε, ε ; X, ε, XX`          | Devuelve el conteo a X.                        |
| q9 → q10      | `Xₐ₀, ε, Xₐ₀`                                            | Devolución completa.                           |
| q10 → q10     | `Y, 1, ε ; Yₐ₀, 1, Yₐ₀Yₐ` y `Y, 1, ε ; Yₐ, 1, YₐYₐ`      | Verifica m pasando Y a Yₐ.                     |
| q10 → q11     | `Y₀, ε, Y₀`                                              | La cantidad de unos coincidió con m.           |
| q11 → q11     | `Yₐ, ε, ε ; Y₀, ε, Y₀Y` y `Yₐ, ε, ε ; Y, ε, YY`          | Devuelve el conteo a Y.                        |
| q11 → q12     | `Yₐ₀, ε, Yₐ₀`                                            | Devolución completa.                           |
| q12 → q7      | `ε`                                                      | Vuelve a decidir si hay otra repetición.       |
| q7 → q13      | `Z₀, ε, Z₀`                                              | No quedan repeticiones: sale del grupo.        |
| q13 → q13     | `X, ε, ε` y `Y, ε, ε`                                    | Vacía los conteos que sobran.                  |
| q13 → q14     | `X₀, ε, X₀ ; Y₀, ε, Y₀`                                  | Todo en su fondo: aceptación.                  |

En total son 15 estados y 27 transiciones (los renglones con «y» agrupan dos). El estado inicial es q0 y el de aceptación, q14. Por ejemplo, `011` y `00110011` se aceptan; `0011001` se rechaza (al segundo bloque le falta un 1) y `011011` también (n = 1 exige un solo bloque).

### 4.6 Ejemplo del enunciado: aⁿbⁿ con n ≥ 0

| Desde → hacia | Transición                |
| ------------- | ------------------------- |
| q0 → q1       | `ε, ε, X₀`                |
| q1 → q1       | `X₀, a, X₀X` y `X, a, XX` |
| q1 → q2       | `ε`                       |
| q2 → q2       | `X, b, ε`                 |
| q2 → q3       | `X₀, ε, X₀`               |

Son 4 estados y 6 transiciones, con una sola pila. q3 es el estado de aceptación.

## 5. Algoritmo de simulación

`simulate` hace una búsqueda en anchura sobre configuraciones (estado, posición en la cadena, contenido de cada pila):

1. Parte de q0, en la posición 0 y con las pilas vacías.
2. Desde cada configuración aplica todas las transiciones posibles: las que leen el siguiente símbolo y las ε. Una transición aplica si cada pila que toca tiene el tope indicado.
3. Lleva un conjunto de configuraciones visitadas para no repetir trabajo ni quedar en ciclos de transiciones ε.
4. Acepta en cuanto llega a un estado de aceptación con la cadena consumida. La búsqueda en anchura entrega el camino aceptado más corto.

La búsqueda es necesaria porque el autómata no es determinista: las salidas por ε permiten varios caminos y la simulación debe probarlos todos.

**Límites:** como máximo 200 000 configuraciones exploradas, y pilas de como máximo 2·|w| + 4 símbolos de conteo. Si se alcanza un límite sin aceptar, el resultado es «rechazada» y lo dice.

**Resultado:** si se acepta o no, el motivo en español, la traza de configuraciones con la transición aplicada en cada paso y el número de configuraciones exploradas. Si se rechaza, la traza muestra el camino que más entrada consumió, y el motivo es uno de estos:

- ningún camino llega a la aceptación;
- no hay transición para el siguiente símbolo con los topes actuales;
- un símbolo no pertenece a Σ.

## 6. Estructuras de datos

Los tipos están en `src/core/types.ts`.

| Tipo                          | Contenido                                                                                                                                          |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Alphabet`                    | Lista ordenada de símbolos.                                                                                                                        |
| `LanguageSpec`                | Lenguaje normalizado: `items` (bloques y grupos con su `Count`), `variables` (nombre, mínimo, alias), `normalized` (L con superíndices) y `notes`. |
| `StackDef`                    | Nombre, símbolo de conteo, fondo y propósito de una pila.                                                                                          |
| `StackOp`                     | Operación sobre una pila: tope esperado y reemplazo, de fondo a tope.                                                                              |
| `Transition`                  | Origen, destino, entrada (o ε), operaciones y explicación.                                                                                         |
| `Automaton`                   | Estados, estado inicial, estados de aceptación, alfabeto, pilas y transiciones.                                                                    |
| `ConstructionStep`            | Título, explicación y los estados, transiciones y pilas que creó el paso.                                                                          |
| `Configuration` y `TraceStep` | Estado, posición y contenido de las pilas, con la transición que llevó ahí.                                                                        |
| `SimulationResult`            | Aceptación, motivo, traza y estadísticas.                                                                                                          |

La construcción usa un registro de usos por variable (definición, verificaciones y repeticiones) y un constructor que acumula estados, transiciones y pasos en orden. Cada transición se crea dentro de un paso, así cada una queda explicada exactamente una vez.

## 7. Decisiones de diseño

- **Aplicación web sin servidor** (React, TypeScript y Vite). Corre en el navegador sin instalar nada más que Node para desarrollarla, y Graphviz compilado a WebAssembly dibuja el diagrama. Ver `decisions/0001-app-web-sin-servidor.md`.
- **Construcción por contadores con varias pilas,** que es el método de clase. Permite lenguajes que no son libres de contexto, como el del ejemplo. Ver `decisions/0002-construccion-por-contadores-con-varias-pilas.md`.
- **Construcción sistemática antes que mínima.** Cada pieza sale de una regla general, así que el autómata puede tener más estados que uno hecho a mano: 15 para el ejemplo de clase. A cambio, cada estado tiene una razón explicable y la construcción se puede verificar automáticamente.
- **Devolver el conteo después de cada verificación,** en lugar de alternar el sentido entre X y Xₐ. Alternar en los mismos estados permitiría ir y volver dentro de un mismo bloque y aceptar cadenas incorrectas. Con la devolución, el conteo siempre está en X al empezar cada verificación.
- **Verificar el fondo al final de cada bloque** (`X₀, ε, X₀`). Es la forma de comprobar que se leyeron exactamente los símbolos del conteo, incluido el último bloque.
- **Transiciones ε sin pilas entre bloques.** Simplifican el encadenamiento. El no determinismo que agregan lo resuelve la simulación por búsqueda en anchura.
- **Notación en un solo módulo,** para ajustarla sin tocar la lógica.

## 8. Limitaciones

- No se admiten desigualdades entre variables (n ≠ m, n < m), cotas superiores (n ≤ 5), grupos anidados, variables de cadena (wcwᴿ, wwᴿ), unión, estrella de Kleene ni entrada por gramática. Estos casos se rechazan con un mensaje que explica qué sí se admite.
- El exponente de un grupo debe ser una sola variable (no 2n ni sumas). Un grupo con exponente numérico puede repetirse hasta 10 veces, y el mínimo de repeticiones de un grupo también llega hasta 10.
- Si un grupo puede repetirse 0 veces, las variables que se definen dentro de él no pueden usarse fuera.
- Los símbolos del alfabeto tienen un solo carácter.
- Los números del lenguaje llegan hasta 100 y la cadena más corta de L, hasta 100 símbolos. Así el autómata no crece sin control.
- El autómata no es mínimo en número de estados.
- La simulación tiene límites de exploración. Con los lenguajes admitidos y cadenas de hasta 100 símbolos no se alcanzan en la práctica.

## 9. Pruebas

Las pruebas están en `src/core/**/*.test.ts` y se corren con `npm test`.

- **Pruebas unitarias:** alfabeto, lectura del lenguaje (errores con posición, superíndices, condiciones), normalización (alias, mínimos, contradicciones, casos no soportados), formato, simulación (aceptación, rechazo con motivo, cadena vacía, límites) y definición formal.
- **Pruebas estructurales:** el autómata del ejemplo de clase y el de aⁿbⁿ se comparan transición por transición con las tablas de la sección 4.
- **Oráculo:** para 19 lenguajes se generan todas las cadenas sobre Σ hasta cierta longitud (10 con 2 símbolos, 7 con 3 y 6 con 4). Cada una se compara entre la simulación del autómata construido y un generador de referencia independiente, que expande el patrón para todos los valores posibles de las variables. Cualquier diferencia hace fallar la prueba.
- **Ejemplos:** cada ejemplo precargado verifica sus cadenas aceptadas y rechazadas.

## 10. Interfaz

La capa de presentación (pantallas, tabla, diagrama, simulación paso a paso e historial) está documentada en [documento-tecnico-interfaz.md](documento-tecnico-interfaz.md).
