# 0001. Hacer una aplicación web sin servidor con React y TypeScript

- Fecha: 2026-11-24
- Estado: Aceptada

## Contexto

El microproyecto pide un software funcional con instrucciones de ejecución, una tabla y un diagrama de transición, y una simulación paso a paso. Lo desarrollan dos personas en paralelo y se demuestra en la sustentación. No hay datos que compartir entre usuarios: todo se calcula a partir de lo que escribe quien lo usa.

## Decisión

Una aplicación de una sola página con React 19, TypeScript y Vite, sin servidor ni base de datos. El diagrama se dibuja con Graphviz compilado a WebAssembly (`@viz-js/viz`), y el historial se guarda en el navegador.

## Alternativas consideradas

- **Aplicación de escritorio en Python (Tkinter más Graphviz).** Es simple, pero exige instalar Graphviz en cada equipo y separar la lógica de la interfaz cuesta más. Revertir costaría medio: habría que reescribir la interfaz.
- **Aplicación en Java (Swing).** Es conocida en la carrera, pero dibujar el diagrama con calidad requiere más trabajo. El costo de revertir es el mismo que en la opción anterior.
- **Web con servidor (por ejemplo Django).** El servidor no aporta nada, porque no hay datos compartidos, y suma despliegue y mantenimiento.

## Consecuencias

- Se ejecuta con `npm install` y `npm run dev`, y el build es estático, así que se podría publicar en cualquier hosting gratuito.
- La lógica (`src/core`) es TypeScript puro y se prueba sin navegador. La interfaz solo la consume por `src/core/index.ts`, una regla que comprueba dependency-cruiser.
- TypeScript se fija en la versión 6.0.3, porque dependency-cruiser todavía no soporta la 7.0.

## Cuándo revisar

- Se sostiene con: un usuario a la vez, cadenas de hasta 100 símbolos y simulaciones de hasta 200 000 configuraciones.
- Revisar si se necesita guardar o compartir trabajos entre personas (haría falta un servidor) o si la simulación tarda más de 2 s en los ejemplos de clase.
