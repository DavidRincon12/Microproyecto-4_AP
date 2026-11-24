// Reglas de dependencias de docs/architecture.md: el núcleo no conoce la interfaz
// y la interfaz solo entra al núcleo por src/core/index.ts.
module.exports = {
  forbidden: [
    { name: 'no-circular', severity: 'error', from: {}, to: { circular: true } },
    { name: 'not-to-unresolvable', severity: 'error', from: {}, to: { couldNotResolve: true } },
    {
      name: 'core-sin-interfaz',
      comment: 'src/core es lógica pura: no importa React ni código de la interfaz.',
      severity: 'error',
      from: { path: '^src/core/' },
      to: { path: ['^src/(app|features|shared)/', 'node_modules/react', 'node_modules/react-dom'] },
    },
    {
      name: 'interfaz-usa-core-por-index',
      comment: 'La interfaz usa el núcleo solo a través de src/core/index.ts.',
      severity: 'error',
      from: { path: '^src/(app|features|shared)/' },
      to: { path: '^src/core/', pathNot: '^src/core/index\\.ts$' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.app.json' },
  },
}
