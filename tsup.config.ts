import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: { index: 'src/index.ts', cli: 'src/cli.ts', server: 'src/server.ts', mcp: 'src/mcp.ts' },
    format: ['esm'],
    target: 'node18',
    clean: true,
    dts: true,
  },
])
