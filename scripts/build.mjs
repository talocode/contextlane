/**
 * ContextLane build script.
 * Uses esbuild (looked up from devtool's node_modules if not locally installed).
 */
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// Try to resolve esbuild
function findEsbuild() {
  const locations = [
    join(ROOT, 'node_modules', 'esbuild'),
    '/workspace/projects/devtool/node_modules/esbuild',
    '/workspace/projects/node_modules/esbuild',
  ]
  for (const loc of locations) {
    if (existsSync(join(loc, 'lib', 'main.js'))) {
      return createRequire(join(loc, 'package.json'))
    }
  }
  // Try global require
  try {
    return createRequire(join(ROOT, 'package.json'))
  } catch { /* fall through */ }
  throw new Error(
    'esbuild not found. Install it:\n' +
    '  npm install --save-dev esbuild\n' +
    '  or run from a workspace that has esbuild'
  )
}

const req = findEsbuild()
const esbuild = req('esbuild')

esbuild.buildSync({
  entryPoints: [
    join(ROOT, 'src/index.ts'),
    join(ROOT, 'src/cli.ts'),
    join(ROOT, 'src/server.ts'),
    join(ROOT, 'src/mcp.ts'),
  ],
  outdir: join(ROOT, 'dist'),
  format: 'cjs',
  target: 'node18',
  bundle: true,
  platform: 'node',
  nodePaths: [
    join(ROOT, 'node_modules'),
    '/workspace/projects/devtool/node_modules',
  ],
  outExtension: { '.js': '.cjs' },
})

console.log('Build complete')
