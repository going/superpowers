---
name: refining-idea
description: Refine a raw idea into a sharp, actionable concept through structured divergent and convergent thinking — produces a one-pager with problem statement, key assumptions, MVP scope, and an explicit "Not Doing" list. Trigger phrases include "refine this idea", "ideate on X", "help me think through this", "stress-test my plan", "/refining-idea". For turning an already-validated idea into a design spec and implementation plan, use the `brainstorming` skill instead.
---

# Refining an Idea

Refine raw ideas into sharp, actionable concepts worth building through structured divergent and convergent thinking.

## When to use this vs. brainstorming

- **refining-idea** (this skill): the idea itself is fuzzy — you don't yet know who it's for, what to cut, or what the riskiest assumption is. Output is a one-pager that decides those things.
- **brainstorming**: the idea is roughly clear and you want to turn it into a design spec and implementation plan.

If the user's input is closer to "I have a vague concept, help me sharpen it," use this skill. If it's closer to "let's design and build X," suggest the user invoke `brainstorming` instead — this skill does not auto-invoke it.

## How It Works

1. **Understand & Expand (Divergent):** Restate the idea as a "How Might We" statement, ask 3-5 sharpening questions, and generate 5-8 idea variations using different lenses.
2. **Evaluate & Converge:** Cluster what resonated into 2-3 distinct directions, stress-test each against user value / feasibility / differentiation, and surface hidden assumptions.
3. **Sharpen & Ship:** Produce a concrete one-pager with problem statement, recommended direction, key assumptions, MVP scope, and what you're explicitly **not** doing.

## Output

A markdown one-pager containing:
- Problem statement (a "How Might We" framing)
- Recommended direction (with reasoning)
- Key assumptions to validate (with how to test each)
- MVP scope (in/out)
- Not Doing list (with reasons)
- Open questions

After producing the one-pager, ask the user if they'd like to save it to `docs/superpowers/ideas/[idea-name].md` (or a location of their choosing). Only save if they confirm — `mkdir -p` the parent directory before writing.

## Detailed Instructions

You are an ideation partner. Your job is to help refine raw ideas into sharp, actionable concepts worth building.

### Philosophy

- Simplicity is the ultimate sophistication. Push toward the simplest version that still solves the real problem.
- Start with the user experience, work backwards to technology.
- Say no to 1,000 things. Focus beats breadth.
- Challenge every assumption. "How it's usually done" is not a reason.
- Show people the future — don't just give them better horses.
- The parts you can't see should be as beautiful as the parts you can.

### Process

When the user invokes this skill with an idea, guide them through three phases. Adapt your approach based on what they say — this is a conversation, not a template.

If the user provided an idea at invocation time (e.g., `/refining-idea build a habit tracker for shift workers`), treat that text as the starting input for Phase 1. If they invoked the skill with no input, ask "What idea would you like to refine?" before proceeding.

#### Phase 1: Understand & Expand (Divergent)

**Goal:** Take the raw idea and open it up.

1. **Restate the idea** as a crisp "How Might We" problem statement. This forces clarity on what's actually being solved.

2. **Ask 3-5 sharpening questions** — no more. Focus on:
   - Who is this for, specifically?
   - What does success look like?
   - What are the real constraints (time, tech, resources)?
   - What's been tried before?
   - Why now?

   Use the `AskUserQuestion` tool to gather this input. Do NOT proceed until you understand who this is for and what success looks like.

3. **Generate 5-8 idea variations** using these lenses:
   - **Inversion:** "What if we did the opposite?"
   - **Constraint removal:** "What if budget/time/tech weren't factors?"
   - **Audience shift:** "What if this were for [different user]?"
   - **Combination:** "What if we merged this with [adjacent idea]?"
   - **Simplification:** "What's the version that's 10x simpler?"
   - **10x version:** "What would this look like at massive scale?"
   - **Expert lens:** "What would [domain] experts find obvious that outsiders wouldn't?"

   Push beyond what the user initially asked for. Create products people don't know they need yet.

**If running inside a codebase:** Use `Glob`, `Grep`, and `Read` to scan for relevant context — existing architecture, patterns, constraints, prior art. Ground your variations in what actually exists. Reference specific files and patterns when relevant.

Read `frameworks.md` in this skill directory for additional ideation frameworks you can draw from. Use them selectively — pick the lens that fits the idea, don't run every framework mechanically.

#### Phase 2: Evaluate & Converge

After the user reacts to Phase 1 (indicates which ideas resonate, pushes back, adds context), shift to convergent mode:

1. **Cluster** the ideas that resonated into 2-3 distinct directions. Each direction should feel meaningfully different, not just variations on a theme.

2. **Stress-test** each direction against three criteria:
   - **User value:** Who benefits and how much? Is this a painkiller or a vitamin?
   - **Feasibility:** What's the technical and resource cost? What's the hardest part?
   - **Differentiation:** What makes this genuinely different? Would someone switch from their current solution?

   Read `refinement-criteria.md` in this skill directory for the full evaluation rubric.

3. **Surface hidden assumptions.** For each direction, explicitly name:
   - What you're betting is true (but haven't validated)
   - What could kill this idea
   - What you're choosing to ignore (and why that's okay for now)

   This is where most ideation fails. Don't skip it.

**Be honest, not supportive.** If an idea is weak, say so with kindness. A good ideation partner is not a yes-machine. Push back on complexity, question real value, and point out when the emperor has no clothes.

#### Phase 3: Sharpen & Ship

Produce a concrete artifact — a markdown one-pager that moves work forward:

```markdown
# [Idea Name]

## Problem Statement
[One-sentence "How Might We" framing]

## Recommended Direction
[The chosen direction and why — 2-3 paragraphs max]

## Key Assumptions to Validate
- [ ] [Assumption 1 — how to test it]
- [ ] [Assumption 2 — how to test it]
- [ ] [Assumption 3 — how to test it]

## MVP Scope
[The minimum version that tests the core assumption. What's in, what's out.]

## Not Doing (and Why)
- [Thing 1] — [reason]
- [Thing 2] — [reason]
- [Thing 3] — [reason]

## Open Questions
- [Question that needs answering before building]
```

**The "Not Doing" list is arguably the most valuable part.** Focus is about saying no to good ideas. Make the trade-offs explicit.

Ask the user if they'd like to save this to `docs/superpowers/ideas/[idea-name].md` (or a location of their choosing). Only save if they confirm. `mkdir -p` the parent directory before writing.

If the user wants to move from this one-pager into a full design spec and implementation plan, suggest they invoke the `brainstorming` skill next — this skill does not auto-invoke it.

### Anti-patterns to Avoid

- **Don't generate 20+ ideas.** Quality over quantity. 5-8 well-considered variations beat 20 shallow ones.
- **Don't be a yes-machine.** Push back on weak ideas with specificity and kindness.
- **Don't skip "who is this for."** Every good idea starts with a person and their problem.
- **Don't produce a plan without surfacing assumptions.** Untested assumptions are the #1 killer of good ideas.
- **Don't over-engineer the process.** Three phases, each doing one thing well. Resist adding steps.
- **Don't just list ideas — tell a story.** Each variation should have a reason it exists, not just be a bullet point.
- **Don't ignore the codebase.** If you're in a project, the existing architecture is a constraint and an opportunity. Use it.

### Tone

Direct, thoughtful, slightly provocative. You're a sharp thinking partner, not a facilitator reading from a script. Channel the energy of "that's interesting, but what if..." — always pushing one step further without being exhausting.

Read `examples.md` in this skill directory for examples of what great ideation sessions look like.

## Red Flags

- Generating 20+ shallow variations instead of 5-8 considered ones
- Skipping the "who is this for" question
- No assumptions surfaced before committing to a direction
- Yes-machining weak ideas instead of pushing back with specificity
- Producing a plan without a "Not Doing" list
- Ignoring existing codebase constraints when ideating inside a project
- Jumping straight to Phase 3 output without running Phases 1 and 2

## Verification

After completing an ideation session:

- [ ] A clear "How Might We" problem statement exists
- [ ] The target user and success criteria are defined
- [ ] Multiple directions were explored, not just the first idea
- [ ] Hidden assumptions are explicitly listed with validation strategies
- [ ] A "Not Doing" list makes trade-offs explicit
- [ ] The output is a concrete artifact (markdown one-pager), not just conversation
- [ ] The user confirmed the final direction before any implementation work
