#!/usr/bin/env node

import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const skillDir = join(repoRoot, 'skills', 'ngrx-developer');
const referencesDir = join(skillDir, 'references');
const guideDir = join(referencesDir, 'guide');
const skillFile = join(skillDir, 'SKILL.md');
const readmeFile = join(repoRoot, 'README.md');

const requiredGuideFiles = [
  'effects/index.md',
  'signals/signal-store/index.md',
  'store/index.md',
];

const problems = [];

async function exists(path) {
  return (await stat(path).catch(() => null)) !== null;
}

async function countMarkdownFiles(directory) {
  let count = 0;
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      count += await countMarkdownFiles(path);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      count += 1;
    }
  }

  return count;
}

function requireText(content, text, label) {
  if (!content.includes(text)) {
    problems.push(`${label} does not mention ${text}`);
  }
}

async function checkProvenance(skill, readme) {
  const source = JSON.parse(
    await readFile(join(referencesDir, 'ngrx-source.json'), 'utf8')
  );

  requireText(skill, `official NgRx ${source.version} guide snapshot`, 'SKILL.md');
  requireText(skill, `package version ${source.version}:`, 'SKILL.md');
  requireText(skill, source.commit, 'SKILL.md');
  requireText(
    readme,
    `official NgRx ${source.version} guide snapshot pinned to commit \`${source.commit}\``,
    'README.md'
  );
}

async function checkGuide() {
  for (const relativePath of requiredGuideFiles) {
    if (!(await exists(join(guideDir, relativePath)))) {
      problems.push(`Required guide file is missing: ${relativePath}`);
    }
  }

  const markdownFiles = await countMarkdownFiles(guideDir);
  if (markdownFiles < 100) {
    problems.push(`Expected at least 100 guide files, found ${markdownFiles}`);
  }
}

function checkFrontmatter(skill) {
  const frontmatter = skill.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatter) {
    problems.push('SKILL.md has no frontmatter');
    return;
  }

  if (!/^name: ngrx-developer$/m.test(frontmatter[1])) {
    problems.push('SKILL.md frontmatter name must be ngrx-developer');
  }

  if (!/^description: \S/m.test(frontmatter[1])) {
    problems.push('SKILL.md frontmatter has no description');
  }
}

// Curated files point into the upstream snapshot; an upstream reorganization
// must not silently leave agents with dead references.
async function checkReferences(file, content) {
  const base = dirname(file);
  const targets = new Set();

  for (const match of content.matchAll(/\]\(([^)\s]+)\)/g)) {
    const target = match[1].split('#')[0];
    if (target && !/^[a-z]+:/i.test(target)) {
      targets.add(resolve(base, target));
    }
  }

  for (const match of content.matchAll(/`(references\/[^`*\s]+)`/g)) {
    targets.add(resolve(skillDir, match[1]));
  }

  for (const target of targets) {
    if (!(await exists(target))) {
      problems.push(`${file.slice(repoRoot.length + 1)} references missing ${target.slice(repoRoot.length + 1)}`);
    }
  }
}

async function main() {
  const [skill, readme] = await Promise.all([
    readFile(skillFile, 'utf8'),
    readFile(readmeFile, 'utf8'),
  ]);

  checkFrontmatter(skill);
  await checkProvenance(skill, readme);
  await checkGuide();
  await checkReferences(skillFile, skill);

  const curated = (await readdir(referencesDir)).filter((name) => name.endsWith('.md'));
  for (const name of curated) {
    const file = join(referencesDir, name);
    await checkReferences(file, await readFile(file, 'utf8'));
  }

  if (problems.length > 0) {
    console.error(problems.join('\n'));
    process.exitCode = 1;
    return;
  }

  console.log(`Skill check passed (${curated.length} curated references).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
