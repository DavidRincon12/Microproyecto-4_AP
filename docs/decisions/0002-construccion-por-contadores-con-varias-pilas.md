# 0002. Construir el autómata por contadores, con varias pilas

- Fecha: 2026-11-24
- Estado: Aceptada

## Contexto

En clase, el ejercicio es «dado Σ y L, diseñar el autómata», con L en notación de conjuntos, por ejemplo L = {(0ⁿ1ᵐ)ᵏ : n > 0, m > 1, k = n}. La profesora resuelve contando cada variable en su propia pila (X para n, Y para m, Z para las repeticiones) y usa pilas auxiliares (X_A, Y_A) para no perder un conteo que se vuelve a usar. Ese lenguaje no es libre de contexto, así que una sola pila no alcanza. El enunciado del microproyecto también pide la entrada como «alfabeto, descripción del lenguaje y cadena de prueba».

## Decisión

La entrada es Σ y L en notación de conjuntos, con una sintaxis definida. A partir de ella, la construcción hace lo siguiente:

1. Normaliza las condiciones.
2. Asigna una pila por cada variable que se verifica, una pila de repeticiones por cada grupo contado y una auxiliar por cada variable que se verifica más de una vez.
3. Arma el autómata con piezas fijas: inicio, bloques, grupos, limpieza y aceptación.

Cada pieza deja explicados sus estados y transiciones.

## Alternativas consideradas

- **Gramática libre de contexto y luego autómata de una pila (construcción clásica).** Es general para lenguajes libres de contexto, pero no se parece al método de clase y no puede reconocer el ejemplo de la profesora. Revertir costaría bajo, porque sería un modo de entrada adicional que reutiliza la simulación, la tabla y el diagrama.
- **Diseños compactos como los de clase (5 estados en el ejemplo).** Alternar el conteo entre X y X_A dentro de los mismos estados permite ir y volver en un mismo bloque, y obliga a revisar con cuidado el último bloque. Sería difícil de generalizar y de verificar.
- **Comprobación:** un oráculo compara la simulación con un generador de referencia en 19 lenguajes, sobre todas las cadenas hasta longitud 10, 7 o 6 según el tamaño de Σ, y no hay diferencias.

## Consecuencias

- Se reconocen lenguajes como aⁿbⁿ, aⁿb²ⁿ, aⁿbᵐcⁿ, aⁿbⁿcⁿ, aⁿbᵐcⁿ⁺ᵐ, (ab)ⁿcⁿ y (0ⁿ1ᵐ)ⁿ, con varias pilas cuando hace falta.
- Los autómatas tienen más estados que un diseño a mano: 15 en el ejemplo de clase. Cada estado se puede explicar y la construcción se verifica automáticamente.
- Quedan fuera las desigualdades entre variables, las cotas superiores, los grupos anidados, las variables de cadena y las gramáticas. Se rechazan con un mensaje claro.

## Cuándo revisar

- Revisar si en clase o en la sustentación se piden lenguajes por gramática (agregar la construcción clásica como segundo modo) o con desigualdades entre variables (n < m, n ≠ m).
