/**
 * Superpowers plugin for DeepSeek Harness (dsh).
 *
 * Shape B (in-process plugin). The bundle patch mounts this module; it does two
 * things:
 *
 * 1. Registers the repository's `skills/` tree as a skill provider on
 *    `ctx.skills`, so every `skills/<name>/SKILL.md` appears in the harness
 *    catalog and loads on demand through the native `skill` tool.
 * 2. Injects the `using-superpowers` bootstrap once per top-level session as
 *    required runtime context. Channel/runtime context is a sourced user-role
 *    snapshot, so it is delivered at the start of the first request, is not
 *    repeated while it stays retained, and is re-injected after compaction
 *    shadows it. Task subagents (sessions with a durable parent) are skipped
 *    structurally; they keep skill access but never restart the controller
 *    workflow their parent already authorised.
 *
 * No runtime dependencies: built-in Node modules only, so the superpowers
 * package stays a zero-dependency plugin.
 *
 * @module superpowers/.dsh-plugin
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Stable Cordis plugin name. */
export const name = "superpowers";

/** Host services this plugin contributes to. */
export const inject = ["skills", "systemPrompt"];

/** Provider name and source label reported for every skill in `skills/`. */
const PROVIDER_NAME = "superpowers";

/** Standard rank for packaged skill providers; keeps local/user skills ahead. */
const SKILL_RANK = 600;

/** Runtime-context entry carrying the bootstrap; order sorts after first-party context. */
const BOOTSTRAP_CONTEXT = "superpowers:bootstrap";
const BOOTSTRAP_CONTEXT_ORDER = 300;

const PACKAGE_ROOT = fileURLToPath(new URL("../", import.meta.url));
const SKILLS_DIR = join(PACKAGE_ROOT, "skills");
const BOOTSTRAP_SKILL = join(SKILLS_DIR, "using-superpowers", "SKILL.md");
const TOOL_MAPPING_FILE = join(SKILLS_DIR, "using-superpowers", "references", "dsh-tools.md");

const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const TRUE_VALUES = new Set(["true", "yes", "on", "1"]);
const FALSE_VALUES = new Set(["false", "no", "off", "0"]);

/**
 * Strip one matching pair of surrounding quotes.
 * @param {string} value - raw scalar text.
 * @returns {string} the unquoted scalar.
 */
function unquote(value) {
	return value.replace(/^(["'])([\s\S]*)\1$/, "$2");
}

/**
 * Read one SKILL.md's flat YAML frontmatter and body.
 *
 * Superpowers skills use a flat frontmatter block (`name`, `description`,
 * optional `disable-model-invocation`), so a line scan covers the catalog
 * without a YAML dependency. Indented continuation lines append to the previous
 * key, which keeps long descriptions intact.
 *
 * @param {string} file - absolute instruction-file path.
 * @returns {{name?: string, description?: string, disableModelInvocation?: unknown, content: string} | undefined}
 *   parsed fields and the body, or `undefined` when the file has no frontmatter.
 */
export function parseSkillFile(file) {
	const raw = readFileSync(file, "utf8");
	const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
	if (match === null) return undefined;
	const fields = {};
	let lastKey;
	for (const rawLine of match[1].split("\n")) {
		const line = rawLine.replace(/\r$/, "");
		const pair = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
		if (pair !== null) {
			lastKey = pair[1];
			fields[lastKey] = unquote(pair[2].trim());
		} else if (lastKey !== undefined && /^\s+\S/.test(line)) {
			fields[lastKey] = `${fields[lastKey]} ${line.trim()}`.trim();
		}
	}
	return {
		name: fields.name,
		description: fields.description,
		disableModelInvocation: fields["disable-model-invocation"],
		content: match[2],
	};
}

/**
 * Resolve a skill's invocation policy from its optional frontmatter flag.
 * @param {unknown} value - raw `disable-model-invocation` scalar.
 * @returns {{modelInvocable: boolean, userInvocable: boolean} | undefined} the policy, or `undefined` when the spelling is invalid.
 */
function invocationOf(value) {
	if (value === undefined || value === "") return { modelInvocable: true, userInvocable: true };
	const normalized = value.trim().toLowerCase();
	if (TRUE_VALUES.has(normalized)) return { modelInvocable: false, userInvocable: true };
	if (FALSE_VALUES.has(normalized)) return { modelInvocable: true, userInvocable: true };
	return undefined;
}

/**
 * Build the complete skill definition for one catalog candidate.
 * @param {string} file - absolute SKILL.md path.
 * @returns {object | undefined} a validated definition, or `undefined` for a malformed skill.
 */
function readSkill(file) {
	const parsed = parseSkillFile(file);
	if (parsed === undefined) return undefined;
	if (typeof parsed.name !== "string" || !SKILL_NAME.test(parsed.name)) return undefined;
	if (typeof parsed.description !== "string" || parsed.description.length === 0) return undefined;
	const invocation = invocationOf(parsed.disableModelInvocation);
	if (invocation === undefined) return undefined;
	return {
		name: parsed.name,
		description: parsed.description,
		invocation,
		source: PROVIDER_NAME,
		provider: PROVIDER_NAME,
		resourceBase: { kind: "directory", path: dirname(file) },
		path: file,
		content: parsed.content,
	};
}

/**
 * Read the local skill catalog from `skills/`.
 * @param {object} logger - plugin logger for malformed-skill warnings.
 * @returns {object[]} provider candidates for every valid skill directory.
 */
function discoverSkills(logger) {
	const candidates = [];
	for (const entry of readdirSync(SKILLS_DIR, { withFileTypes: true })) {
		if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
		const file = join(SKILLS_DIR, entry.name, "SKILL.md");
		if (!existsSync(file)) continue;
		const skill = readSkill(file);
		if (skill === undefined) {
			logger.warn(`superpowers: skipping malformed skill ${file}`);
			continue;
		}
		candidates.push({
			name: skill.name,
			description: skill.description,
			invocation: skill.invocation,
			source: PROVIDER_NAME,
			provider: PROVIDER_NAME,
			rank: SKILL_RANK,
			path: file,
			locator: { path: file },
		});
	}
	return candidates.sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0));
}

/**
 * Read the two files that make up the bootstrap and assemble the injected text.
 *
 * Fails loud when the installation is broken: a silently skipped bootstrap is
 * how a broken port masquerades as a working one.
 *
 * @returns {string} the complete `<EXTREMELY_IMPORTANT>` wrapper.
 */
function readBootstrap() {
	let skill;
	try {
		skill = parseSkillFile(BOOTSTRAP_SKILL);
	} catch (error) {
		throw new Error(`superpowers: cannot read ${BOOTSTRAP_SKILL}: ${String(error)}`);
	}
	if (skill === undefined || skill.content.trim().length === 0) {
		throw new Error(`superpowers: ${BOOTSTRAP_SKILL} has no usable bootstrap body`);
	}
	let toolMapping;
	try {
		toolMapping = readFileSync(TOOL_MAPPING_FILE, "utf8").trim();
	} catch (error) {
		throw new Error(`superpowers: cannot read ${TOOL_MAPPING_FILE}: ${String(error)}`);
	}
	if (toolMapping.length === 0) {
		throw new Error(`superpowers: ${TOOL_MAPPING_FILE} is empty`);
	}
	return [
		"<EXTREMELY_IMPORTANT>",
		"You have superpowers.",
		"",
		"**IMPORTANT: The using-superpowers skill content is included below. It is ALREADY LOADED - you are currently following it. Do NOT use the skill tool to load \"using-superpowers\" again - that would be redundant.**",
		"",
		skill.content.trim(),
		"",
		toolMapping,
		"</EXTREMELY_IMPORTANT>",
	].join("\n");
}

/**
 * Whether a session is a task subagent (has a durable parent session).
 * @param {object | undefined} session - the live session, when assembly has one.
 * @returns {boolean} whether this is a child session.
 */
function isSubagentSession(session) {
	const header = session?.header;
	return header !== undefined && header !== null && header.parentSession !== undefined;
}

/**
 * Mount the superpowers skill provider and session bootstrap.
 * @param {object} ctx - plugin context carrying `skills` and `systemPrompt`.
 */
export function apply(ctx) {
	// Build the bootstrap during activation so a broken checkout fails visibly
	// in the Plugins inventory instead of silently injecting nothing.
	const bootstrap = readBootstrap();

	ctx.skills.registerProvider(() => ({
		name: PROVIDER_NAME,
		// The registry races both calls against the lookup's abort signal via
		// `promise.then`, so they must return promises even for local reads.
		async list() {
			return discoverSkills(ctx.logger);
		},
		async get(candidate) {
			const file = candidate?.locator?.path;
			if (typeof file !== "string") return undefined;
			let definition;
			try {
				definition = readSkill(file);
			} catch {
				return undefined;
			}
			if (definition === undefined || definition.name !== candidate.name) return undefined;
			return definition;
		},
	}));

	ctx.systemPrompt.context({
		name: BOOTSTRAP_CONTEXT,
		order: BOOTSTRAP_CONTEXT_ORDER,
		interpolate: false,
		required: true,
		text: (assembly) => (isSubagentSession(assembly?.agent?.session) ? "" : bootstrap),
	});
}
