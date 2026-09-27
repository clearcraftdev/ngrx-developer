#!/usr/bin/env node

// Type-checks the TypeScript an eval run produced against the latest stable
// NgRx and the Angular and TypeScript versions it requires.
// Usage: node evals/check-types.mjs <outputs-dir> [--json]
// Exit code 0 means strict tsc is clean. Test-runner configuration files
// (*.config.ts) are not part of an answer and are skipped.

import { execFile } from 'node:child_process';
import { cp, mkdir, mkdtemp, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const ngrxPackages = [
  'store',
  'effects',
  'entity',
  'operators',
  'signals',
  'router-store',
  'store-devtools',
];
const angularPackages = [
  'core',
  'common',
  'compiler',
  'platform-browser',
  'platform-browser-dynamic',
  'router',
];

async function npmView(spec, field) {
  const { stdout } = await execFileAsync('npm', ['view', spec, field, '--json']);
  const value = JSON.parse(stdout);
  // A range matching several versions returns one entry per version.
  return Array.isArray(value) ? value.at(-1) : value;
}

async function resolveToolchain() {
  const ngrx = await npmView('@ngrx/store@latest', 'version');
  const angularRange = (await npmView(`@ngrx/store@${ngrx}`, 'peerDependencies'))['@angular/core'];
  const angularMajor = angularRange.match(/\d+/)[0];
  const angular = await npmView(`@angular/core@${angularMajor}`, 'version');
  const typescriptRange = (await npmView(`@angular/compiler-cli@${angular}`, 'peerDependencies')).typescript;
  const typescript = await npmView(`typescript@${typescriptRange}`, 'version');

  return { angular, ngrx, typescript };
}

async function installToolchain(toolchain) {
  const directory = join(
    process.env.NGRX_EVAL_CACHE ?? join(homedir(), '.cache', 'ngrx-developer-evals'),
    `ngrx-${toolchain.ngrx}-angular-${toolchain.angular}-ts-${toolchain.typescript}`
  );

  if (
    await stat(join(directory, 'node_modules', '@angular', 'platform-browser-dynamic')).catch(() => null)
  ) {
    return directory;
  }

  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'package.json'), '{ "private": true }\n');
  await execFileAsync(
    'npm',
    [
      'install',
      '--silent',
      '--no-audit',
      '--no-fund',
      ...ngrxPackages.map((name) => `@ngrx/${name}@${toolchain.ngrx}`),
      ...angularPackages.map((name) => `@angular/${name}@${toolchain.angular}`),
      'rxjs@7',
      'zone.js',
      `typescript@${toolchain.typescript}`,
      'vitest@latest',
    ],
    { cwd: directory, maxBuffer: 16 * 1024 * 1024 }
  );

  return directory;
}

async function listTypeScript(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true, recursive: true })) {
    if (
      entry.isFile() &&
      entry.name.endsWith('.ts') &&
      !entry.name.endsWith('.d.ts') &&
      !entry.name.endsWith('.config.ts')
    ) {
      files.push(join(entry.parentPath, entry.name));
    }
  }
  return files;
}

async function main() {
  const [outputs, ...flags] = process.argv.slice(2);
  if (!outputs) {
    throw new Error('Usage: node evals/check-types.mjs <outputs-dir> [--json]');
  }

  const source = resolve(outputs);
  const files = await listTypeScript(source);
  const toolchain = await resolveToolchain();
  const result = { toolchain, files: files.map((file) => relative(source, file)), passed: false, errors: [] };

  if (files.length === 0) {
    result.errors.push('No TypeScript files were produced.');
  } else {
    const dependencies = await installToolchain(toolchain);
    // The work directory lives inside the toolchain so imports resolve from its node_modules.
    const work = await mkdtemp(join(dependencies, 'run-'));

    try {
      await cp(source, work, {
        recursive: true,
        filter: async (path) =>
          (await stat(path)).isDirectory() || (path.endsWith('.ts') && !path.endsWith('.config.ts')),
      });
      await writeFile(
        join(work, 'tsconfig.json'),
        `${JSON.stringify(
          {
            compilerOptions: {
              strict: true,
              noEmit: true,
              target: 'es2022',
              module: 'preserve',
              moduleResolution: 'bundler',
              lib: ['es2022', 'dom'],
              experimentalDecorators: true,
              useDefineForClassFields: false,
              skipLibCheck: true,
              types: ['vitest/globals'],
            },
            include: ['**/*.ts'],
          },
          null,
          2
        )}\n`
      );

      try {
        await execFileAsync(join(dependencies, 'node_modules', '.bin', 'tsc'), ['-p', work], {
          maxBuffer: 16 * 1024 * 1024,
        });
        result.passed = true;
      } catch (error) {
        result.errors = `${error.stdout ?? ''}${error.stderr ?? ''}`
          .split('\n')
          .filter((line) => line.includes('error TS'))
          .map((line) => line.replace(/^.*?run-[^/]+\//, ''));
      }
    } finally {
      await rm(work, { force: true, recursive: true });
    }
  }

  if (flags.includes('--json')) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    const { angular, ngrx, typescript } = toolchain;
    console.log(`NgRx ${ngrx}, Angular ${angular}, TypeScript ${typescript}; ${files.length} files`);
    console.log(result.passed ? 'tsc: clean' : result.errors.join('\n'));
  }

  process.exitCode = result.passed ? 0 : 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
