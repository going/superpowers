import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');
const pluginPath = resolve(repoRoot, '.dsh-plugin/index.js');
const patchPath = resolve(repoRoot, '.dsh-plugin/cordis.patch.yml');
const skillsDir = resolve(repoRoot, 'skills');
const bootstrapSkillPath = resolve(skillsDir, 'using-superpowers/SKILL.md');
const toolMappingPath = resolve(skillsDir, 'using-superpowers/references/dsh-tools.md');

const plugin = await import(pathToFileURL(pluginPath).href);
const packageJson = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8'));

/** Create a minimal fake Cordis context that records registrations. */
function fakeContext() {
  const warnings = [];
  const providers = [];
  const contexts = [];
  const ctx = {
    logger: {
      warn(...args) {
        warnings.push(args.join(' '));
      },
    },
    skills: {
      registerProvider(create) {
        const control = { signal: new AbortController().signal, invalidate() {} };
        providers.push(create(control));
        return () => {};
      },
    },
    systemPrompt: {
      context(contribution) {
        contexts.push(contribution);
        return () => {};
      },
    },
  };
  return { ctx, providers, contexts, warnings };
}

/** A context shaped like an agent assembly for one session. */
function assemblyFor(sessionHeader) {
  return { agent: { session: { header: sessionHeader } } };
}

/** Read every skill directory that contains a SKILL.md. */
function onDiskSkillNames() {
  return readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .filter((entry) => existsSync(join(skillsDir, entry.name, 'SKILL.md')))
    .map((entry) => entry.name)
    .sort();
}

test('package manifest declares the dsh bundle and its display resources', () => {
  assert.equal(packageJson.name, 'superpowers');
  assert.equal(packageJson.dsh.bundle.patch, './.dsh-plugin/cordis.patch.yml');
  assert.ok(existsSync(patchPath), 'bundle patch file exists');
  assert.equal(packageJson.exports['./dsh'], './.dsh-plugin/index.js');
  assert.equal(packageJson.exports['./dsh/icon'], './.dsh-plugin/icon.svg');
  assert.equal(packageJson.exports['./dsh/locale/*.json'], './.dsh-plugin/locale/*.json');
  assert.equal(packageJson.exports['./locale/*.json'], './.dsh-plugin/locale/*.json');
  assert.equal(packageJson.exports['./package.json'], './package.json');
  assert.equal(packageJson.icon, './.dsh-plugin/icon.svg');
  // The OpenCode package entry must survive the exports map.
  assert.equal(packageJson.exports['.'], `./${packageJson.main.replace(/^\.\//, '')}`);
  for (const file of ['.dsh-plugin/icon.svg', '.dsh-plugin/locale/en.json', '.dsh-plugin/locale/zh.json']) {
    assert.ok(existsSync(resolve(repoRoot, file)), `${file} exists`);
  }
});

test('bundle patch inserts the superpowers plugin row', () => {
  const patch = readFileSync(patchPath, 'utf8');
  assert.match(patch, /insert:/);
  assert.match(patch, /id: superpowers/);
  assert.match(patch, /name: "superpowers\/dsh"/);
});

test('plugin exports the expected Cordis shape', () => {
  assert.equal(plugin.name, 'superpowers');
  assert.deepEqual(plugin.inject, ['skills', 'systemPrompt']);
  assert.equal(typeof plugin.apply, 'function');
});

test('apply registers exactly one skill provider and one bootstrap context', () => {
  const { ctx, providers, contexts } = fakeContext();
  plugin.apply(ctx);
  assert.equal(providers.length, 1);
  assert.equal(providers[0].name, 'superpowers');
  assert.equal(contexts.length, 1);
  assert.equal(contexts[0].name, 'superpowers:bootstrap');
  assert.equal(contexts[0].order, 300);
  assert.equal(contexts[0].interpolate, false);
  assert.equal(contexts[0].required, true);
  assert.equal(typeof contexts[0].text, 'function');
});

test('provider list and get return promises for the registry waitWithAbort race', async () => {
  const { ctx, providers } = fakeContext();
  plugin.apply(ctx);
  const provider = providers[0];

  // DSH's skill registry wraps both calls in waitWithAbort(promise, signal),
  // which calls promise.then when a lookup signal exists. A sync return value
  // is skipped with "promise.then is not a function" and the catalog vanishes.
  const listed = provider.list({});
  assert.ok(listed instanceof Promise, 'list() must return a promise');
  const candidates = await listed;
  assert.ok(Array.isArray(candidates));
  const loaded = provider.get(candidates[0], {});
  assert.ok(loaded instanceof Promise, 'get() must return a promise');
  assert.equal((await loaded).name, candidates[0].name);
});

test('skill catalog covers every skills/<name>/SKILL.md exactly once', async () => {
  const { ctx, providers } = fakeContext();
  plugin.apply(ctx);
  const candidates = await providers[0].list();
  assert.ok(Array.isArray(candidates));

  const names = candidates.map((candidate) => candidate.name);
  assert.deepEqual(names, onDiskSkillNames());
  assert.equal(new Set(names).size, names.length, 'no duplicate skill names');

  for (const candidate of candidates) {
    assert.equal(candidate.provider, 'superpowers');
    assert.equal(candidate.source, 'superpowers');
    assert.equal(candidate.rank, 600);
    assert.equal(typeof candidate.description, 'string');
    assert.ok(candidate.description.length > 0, `${candidate.name} has a description`);
    assert.match(candidate.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.equal(typeof candidate.invocation.modelInvocable, 'boolean');
    assert.equal(typeof candidate.invocation.userInvocable, 'boolean');
    assert.ok(candidate.path.endsWith(`${candidate.name}/SKILL.md`));
  }
  assert.deepEqual(names, [...names].sort());
});

test('disable-model-invocation frontmatter hides a skill from the model only', async () => {
  const { ctx, providers } = fakeContext();
  plugin.apply(ctx);
  const candidates = await providers[0].list();
  const hidden = candidates.filter((candidate) => candidate.invocation.modelInvocable === false);
  assert.deepEqual(
    hidden.map((candidate) => candidate.name),
    ['improve-codebase-architecture', 'interview-me', 'teaching'],
  );
  for (const candidate of hidden) assert.equal(candidate.invocation.userInvocable, true);
});

test('get() loads the body, resource base, and invocation policy', async () => {
  const { ctx, providers } = fakeContext();
  plugin.apply(ctx);
  const provider = providers[0];
  const candidate = (await provider.list()).find((entry) => entry.name === 'brainstorming');
  assert.ok(candidate);

  const skill = await provider.get(candidate);
  assert.equal(skill.name, 'brainstorming');
  assert.equal(skill.provider, 'superpowers');
  assert.equal(skill.source, 'superpowers');
  assert.equal(skill.path, candidate.path);
  assert.deepEqual(skill.invocation, { modelInvocable: true, userInvocable: true });
  assert.deepEqual(skill.resourceBase, { kind: 'directory', path: dirname(candidate.path) });
  assert.ok(!skill.content.startsWith('---'), 'frontmatter is stripped from the body');
  assert.match(skill.content, /^# Brainstorming/m);
});

test('get() rejects stale, foreign, and missing locators', async () => {
  const { ctx, providers } = fakeContext();
  plugin.apply(ctx);
  const provider = providers[0];
  const candidate = (await provider.list())[0];

  assert.equal(await provider.get({ ...candidate, locator: undefined }), undefined);

  const directory = mkdtempSync(join(tmpdir(), 'superpowers-dsh-test-'));
  try {
    const renamed = join(directory, 'SKILL.md');
    writeFileSync(renamed, '---\nname: some-other-skill\ndescription: Wrong skill.\n---\n\n# Wrong\n', 'utf8');
    assert.equal(await provider.get({ ...candidate, locator: { path: renamed } }), undefined);
    assert.equal(await provider.get({ ...candidate, locator: { path: join(directory, 'missing.md') } }), undefined);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('bootstrap context carries the loaded skill and the dsh tool mapping', () => {
  const { ctx, contexts } = fakeContext();
  plugin.apply(ctx);
  const bootstrap = contexts[0].text(assemblyFor({ id: 'session-1' }));

  assert.match(bootstrap, /^<EXTREMELY_IMPORTANT>/);
  assert.match(bootstrap, /You have superpowers\./);
  assert.match(bootstrap, /ALREADY LOADED/);
  assert.match(bootstrap, /Do NOT use the skill tool to load "using-superpowers" again/);
  assert.match(bootstrap, /## The Rule/); // body of using-superpowers/SKILL.md
  assert.ok(!bootstrap.includes('name: using-superpowers'), 'frontmatter is not injected');
  assert.match(bootstrap, /DeepSeek Harness \(dsh\) Tool Mapping/); // references/dsh-tools.md
  assert.match(bootstrap, /\| Read a file \| `read` \|/);
  assert.ok(bootstrap.trimEnd().endsWith('</EXTREMELY_IMPORTANT>'));
  assert.equal(bootstrap, contexts[0].text(assemblyFor({ id: 'session-2' })), 'static across top-level sessions');
});

test('bootstrap is skipped for task subagents but kept for agentless assembly', () => {
  const { ctx, contexts } = fakeContext();
  plugin.apply(ctx);

  assert.equal(contexts[0].text(assemblyFor({ id: 'child', parentSession: 'parent' })), '');
  assert.match(contexts[0].text(assemblyFor({ id: 'root', parentSession: undefined })), /You have superpowers\./);
  assert.match(contexts[0].text({}), /You have superpowers\./);
  assert.match(contexts[0].text(undefined), /You have superpowers\./);
});

test('bootstrap files stay in sync with the repository', () => {
  assert.ok(existsSync(bootstrapSkillPath));
  assert.ok(existsSync(toolMappingPath));
  assert.match(readFileSync(toolMappingPath, 'utf8'), /^# DeepSeek Harness \(dsh\) Tool Mapping/);
  assert.match(readFileSync(bootstrapSkillPath, 'utf8'), /DeepSeek Harness: `references\/dsh-tools\.md`/);
});

test('frontmatter parsing handles quoted values, continuations, and absent blocks', () => {
  const directory = mkdtempSync(join(tmpdir(), 'superpowers-dsh-fm-'));
  try {
    const quoted = join(directory, 'quoted.md');
    writeFileSync(
      quoted,
      '---\nname: my-skill\ndescription: "Use when the task: needs it"\ndisable-model-invocation: true\n---\n\n# Body\n',
      'utf8',
    );
    const parsed = plugin.parseSkillFile(quoted);
    assert.equal(parsed.name, 'my-skill');
    assert.equal(parsed.description, 'Use when the task: needs it');
    assert.equal(parsed.disableModelInvocation, 'true');
    assert.equal(parsed.content, '\n# Body\n');

    const continuation = join(directory, 'continuation.md');
    writeFileSync(continuation, '---\nname: long\ndescription: first line\n  second line\n---\n\n# Body\n', 'utf8');
    assert.equal(plugin.parseSkillFile(continuation).description, 'first line second line');

    const plain = join(directory, 'plain.md');
    writeFileSync(plain, '# No frontmatter\n', 'utf8');
    assert.equal(plugin.parseSkillFile(plain), undefined);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
