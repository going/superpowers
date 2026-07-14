---
name: wayfinder
description: Use when an effort is too big to hold in one agent session and too foggy to plan — the open questions still have open questions, and the way from here to the destination isn't visible yet. Also use when resuming or working an existing wayfinder map. For work one session can hold, use `brainstorming`; to stress-test an already-drafted plan, use `grilling`.
disable-model-invocation: true
---

# Wayfinder

A loose idea has arrived — too big for one agent session, and wrapped in fog: the way from here to the **destination** isn't visible yet. Wayfinding is finding that way, not charging at the destination.

This skill charts the way as a **map** under `docs/superpowers/wayfinder/`, then works its **decision tickets** — questions whose resolution is a decision, not slices of a build to execute — one at a time until the route is clear.

Naming the destination is the first act of charting, and it shapes every ticket. It might be a spec to hand off, a decision to lock before planning starts, or a change made in place like a data migration.

## Plan, don't do

Wayfinder **decides**. It does not build.

The map is done when nothing is left to decide — not when the thing is built. The pull to just do the work is the signal you've reached the edge of the map and it's time to hand off.

This repo already has homes for the doing:

| Phase | Skill |
|---|---|
| Extract intent before any idea is formed | `interview-me` |
| Explore one goal a single session can hold | `brainstorming` |
| **Find the way through an effort no session can hold** | **`wayfinder`** |
| Stress-test an already-drafted plan | `grilling` |
| Turn a settled spec into steps | `writing-plans` |
| Build it | `executing-plans`, `subagent-driven-development` |

Wayfinder ends exactly where `writing-plans` begins. Producing a deliverable from inside the map is out of bounds — see [Reaching the destination](#reaching-the-destination).

**The discriminator vs. `brainstorming`:** can one session hold the whole thing? If yes, `brainstorming` — it is better at that and you should not reach for a map. If no — if resolving one question would just reveal three more you can't yet phrase — that fog is what the map is for.

## Refer by name

Every map and ticket has a **title**. In everything the human reads — narration, the map's Decisions-so-far — refer to it by that title, never by a bare number or filename. A wall of `003, 004, 007` is illegible; names read at a glance. The number doesn't vanish, it rides *inside* the link.

## The Map

One effort, one directory. The map is `MAP.md`; its tickets are files beside it.

```
docs/superpowers/wayfinder/
└── 2026-07-14-billing-multi-provider/
    ├── MAP.md
    └── tickets/
        ├── 001-provider-abstraction-shape.md
        ├── 002-adyen-sepa-dunning-support.md
        └── 003-existing-subscription-migration.md
```

The map is an **index**, not a store. A decision lives in exactly one place — its ticket. The map only gists it and links. Never restate a decision in the map; a reader who needs the detail follows the link.

`MAP.md` is the whole effort at low resolution, loaded once per session. **Open tickets are not listed in it** — they're found by query, so the map never goes stale about what's takeable.

```markdown
# <map title>

## Destination

<what reaching the end of this map looks like — the spec, decision, or change this
effort is finding its way to. One or two lines. Every session orients to it before
choosing a ticket.>

## Notes

<domain; skills every session should consult; standing preferences for this effort>

## Decisions so far

<!-- the index — one line per closed ticket: enough to judge relevance, then follow
     the link for the detail the ticket holds -->

_none yet_

## Not yet specified

<!-- fog: in-scope questions you can't ticket yet; graduates as the frontier advances -->

_none yet_

## Out of scope

<!-- work ruled beyond the destination; closed, never graduates -->

_none yet_
```

**All five headings — Destination, Notes, Decisions so far, Not yet specified, Out of scope — are required, and they stay even when the section is empty.** Write `_none yet_` under an empty one.

They are slots that later sessions fill, and a freshly-charted map has nothing to put in most of them. The pull is to drop an empty heading as clutter. Don't: a map that loses `Decisions so far` on day one has nowhere to accumulate the decisions it exists to hold, and a map that loses `Notes` strips every future session of the skills and standing preferences this effort runs on.

### Tickets

Each ticket is one file, sized to one agent session.

```markdown
---
id: 003
title: How do existing subscriptions migrate mid-flight?
type: grilling          # research | prototype | grilling | task
status: open            # open | closed
blocked-by: [001]       # ids that must close first; [] if none
claimed-by:             # empty = unclaimed
---

## Question

<the decision or investigation this ticket resolves>
```

**Blocking is the part the agent must not decide silently.** In baseline testing, agents invented a dependency order and never showed it to the human — "these were my unilateral architectural judgements." `blocked-by` exists to drag that judgement into the open where it can be argued with. When you wire an edge, say so, and say why.

**The frontier** is the open, unblocked, unclaimed tickets — the edge of the known, and the only tickets that are takeable. A ticket is **unblocked** when every id in its `blocked-by` is `status: closed`.

**Don't compute the frontier by eye — run the script.** Joining each ticket's `blocked-by` against the status of the tickets it names is mechanical, and it is the step that fails quietly: get it wrong and you claim a blocked ticket and decide on a foundation that isn't there yet.

```bash
skills/wayfinder/scripts/frontier.sh docs/superpowers/wayfinder/<map>/
```

It prints the frontier, what's blocked and on what, what another session has claimed, and what's closed.

A session **claims** a ticket by writing `claimed-by:` **first, before any work**, so a concurrent session skips it. An open, unclaimed ticket is free.

The value is a session handle — `<YYYY-MM-DD>-<who>`, e.g. `2026-07-14-tian`. **`<who>` must identify the session, not just the person**: two agents that both write `2026-07-14-claude` can't tell each other's claims from their own, which is the one job the field has. Use the git user, and add a discriminator if parallel sessions are in play. If you abandon a ticket without closing it, clear the field — a stale claim is indistinguishable from live work and will silently freeze the frontier.

The answer is not part of the body — it's appended on resolution. Assets made while resolving are saved beside the ticket and linked, never pasted in.

Links are relative to the file they sit in, and `tickets/` is one level deeper than `MAP.md`, which is the trap:

| From | To | Path |
|---|---|---|
| `MAP.md` | a ticket | `tickets/004-....md` |
| a ticket | another ticket | `004-....md` |
| a ticket | `docs/superpowers/adr/` | `../../../adr/` |
| `MAP.md` | `docs/superpowers/adr/` | `../../adr/` |

## Ticket types

Every ticket is either **HITL** — human in the loop, worked *with* a human who speaks for themselves — or **AFK**, driven by the agent alone. A HITL ticket resolves only through that live exchange. **The agent never stands in for the human's side of it.** An agent that grills itself and answers its own questions has produced fiction and corrupted the map.

- **research** (AFK) — Surfacing a fact a decision waits on, by **reading**: third-party APIs, documentation, prior art, or an audit of your own codebase. Resolved by dispatching a subagent (`Explore` or `general-purpose`); use `dispatching-parallel-agents` to fan several out at once. Doesn't count against the one-HITL-ticket-per-session cap.
- **prototype** (HITL) — Raise the fidelity of the argument by making something cheap and rough to react to: an outline, a stub, a throwaway UI. Not production code, not a deliverable — a thing to point at. Use when *"how should it look"* or *"how should it behave"* is the question that's actually blocking. Save it beside the ticket and link it.
- **grilling** (HITL) — Conversation, one question at a time, via `grilling-with-docs` — it runs the grilling interview and keeps `CONTEXT.md` and the ADRs current as decisions land. (Reach for `grilling-with-docs`, not `grilling`: the latter is user-invoked only.) **The default.** If you can't tell which type a ticket is, it's this one.
- **task** (HITL or AFK) — Work that **changes the world** before a decision can be made. Signing up for a service so its API can be judged, provisioning access, moving data so its shape can be seen.

  **Research reads; task acts.** If nothing outside the map changes state, it's research — an audit of your own code is research, however much legwork it takes.

  **`task` is the one type that does rather than decides, and it is fenced tightly.** It earns its place by *unblocking a decision*, never by *delivering the destination*. The test: after this work, is there still a decision to make? If no — if the work IS the outcome — it is not a wayfinder ticket. It belongs downstream, to `writing-plans` and `executing-plans`. A `task` ticket that quietly becomes the implementation has turned the map into a work queue and defeated the skill.

  The agent drives it alone where it can (AFK); otherwise it hands the human a precise checklist (HITL). Its answer records what was done, plus any facts later tickets depend on — where credentials live, new URLs, row counts.

## Fog of war

The map is *deliberately* incomplete. Don't chart what you can't yet see.

Beyond the live tickets lies the **fog**: decisions you can tell are coming but can't yet pin down, because they hang on questions still open. Resolving a ticket clears the fog ahead of it, graduating whatever became specifiable into fresh tickets — until the way to the destination is clear and no tickets remain.

**Not yet specified** is where that dim view is written down. This section is load-bearing: without it, an agent that half-sees a question drops it. Baseline agents noticed real gaps — unconfirmed tech stack, unasked scope questions, unvalidated assumptions — and reported afterward that "these were never written down as open questions; I quietly skipped them." Fog has to have somewhere to go, or it evaporates.

**Fog or ticket?** The test is whether you can state the question precisely *now* — **not** whether you can answer it now.

- **Ticket** when the question is already sharp — even if it's blocked and you can't act on it yet.
- **Not yet specified** when you can't phrase it that sharply. Don't pre-slice fog into ticket-sized pieces: it's coarser than a ticket, and one patch may graduate into several tickets, or none.

Excludes what's decided (Decisions so far), what's already a ticket, and what's out of scope.

## Out of scope

Fog only gathers *toward* the destination. The destination fixes the scope, so work beyond it is **out of scope** — it isn't fog, and it doesn't belong in Not yet specified. Scope, not sharpness, lands it here.

Out-of-scope work never graduates. It returns only if the destination is redrawn, and then as a fresh effort, not a resumption.

When a ticket that already exists turns out to sit past the destination — mis-scoped while charting, or exposed by a resolution — **close it** (a closed ticket is unambiguously off the frontier) and leave one line under **Out of scope**: the gist, why it's out, and a link. It stays out of **Decisions so far**, which records the route actually walked — a scope boundary is not a step on it.

## Invocation

Two modes. Either way: **resolve at most one HITL ticket per session** — one grilling, one prototype, or one HITL task. That is the cap, and it is the whole discipline: the fog clears in the gaps *between* decisions, not inside them.

AFK tickets don't count against it. Research, and any AFK task that merely records a fact, can be resolved as many at a time as the frontier offers.

### Chart the map

The user arrives with a loose idea.

1. **Name the destination.** Run `interview-me` — no plan exists yet, which is precisely the moment it is built for, and its restate-and-confirm gate is the one you want here. The destination fixes the scope, so it settles first, and it is the user's to name, not yours.

   Take `interview-me`'s gate literally: the destination is settled only on an **explicit yes** to a concrete restate. "Sounds good" and "whatever you think" are not yes. Baseline agents silently absorbed an unvalidated reading of the goal — *"I acted on that assumption without flagging it"* — and would have charted an entire map toward the wrong destination.
2. **Map the frontier.** Now run `grilling-with-docs`, **breadth-first**: fan out across the whole space rather than deep on any one thread, surfacing the open decisions and the first steps takeable now.

   **If this surfaces no fog, stop.** The way is already clear and one session can hold it — you don't need a map, you need `brainstorming`. Say so and ask how they'd like to proceed. Charting a map for work that doesn't need one is pure overhead.
3. **Create the map** — `docs/superpowers/wayfinder/<YYYY-MM-DD>-<slug>/MAP.md`, Destination and Notes filled in, Decisions-so-far empty, the fog sketched into Not yet specified.
4. **Create the tickets you can specify now**, then wire `blocked-by` in a **second pass** (ids must exist before they can be referenced). Everything you can't specify stays in the fog.

   **Show the human the blocking structure and why you wired it that way — then wait for their answer.** This is a checkpoint, not a disclosure. The edges are a judgement, and they're the judgement most likely to be wrong: baseline agents invented a dependency order and never surfaced it. In testing, the human pushed back on an over-gated edge and it was rewired before anything was persisted. That argument is the point. Showing the graph and moving straight on doesn't get it.
5. **Fire the research subagents — and finish them.** **Claim each `research` ticket first** (`claimed-by:`, before dispatch — the claim protocol applies here too, and a concurrent session will otherwise fire a second subagent at the same question). Then dispatch a subagent per ticket, wait, record each answer, and close them. Research is the one type charting *does* resolve: it's AFK, it's cheap, and the facts it returns often reshape the blocking graph before the human ever sits down to a decision.
6. **Stop.** Charting resolves no HITL ticket — no grilling, no prototype, no task. The first real decision belongs to the next session.

### Work the map

The user arrives with a map. A ticket is optional — without one, *you* pick the next decision, not the user.

1. Load `MAP.md` — the low-res view, not every ticket body. Run `scripts/frontier.sh` for what's takeable.
2. **Choose the ticket.** If the user named one, use it. Otherwise take the frontier ticket with the **lowest id** — an arbitrary rule, but a shared one, so two parallel sessions don't reach for the same ticket or argue about which is "first". **Claim it** — write `claimed-by:` before any work.
3. **Resolve it.** Zoom as needed: read the full body of any related or closed ticket on demand. Invoke the skills `## Notes` names. If in doubt, `grilling-with-docs`.
4. **Record the resolution.** Append an `## Answer` section to the ticket, set `status: closed`, and add its one-line gist to the map's **Decisions so far**.

   **Then consider an ADR.** If the decision is hard to reverse, surprising without context, and a real trade-off, offer one — `domain-modeling` holds the test and the format. The ticket records *what was decided*; the ADR is what makes it still make sense to someone a year from now who never read the map. Offer sparingly: most tickets don't earn one.
5. **Advance the frontier.** Add newly-surfaced tickets (create, then wire). Graduate any fog the answer made specifiable, clearing each graduated patch from **Not yet specified** so it lives only as its ticket. If the answer reveals a ticket sits beyond the destination, **rule it out of scope** rather than resolving it. If the decision invalidates other tickets, update or delete them.

The user may work unblocked tickets in parallel, so expect other sessions to be editing the map concurrently. Re-read before you write.

### Overturning a decision

A long effort will contradict itself: research returns a fact that kills a decision three sessions old. **A decision already in `Decisions so far` is not immutable, and it is not append-only.** Leaving a dead decision in the index is the worst outcome available — the index is what gets handed to `writing-plans`, so a stale line becomes a plan built on a foundation the map itself already disproved.

**First, is the fact ticketed?** The overturning fact usually arrives as a ticket you just closed. Sometimes it arrives in chat — the human learned it out of band. **Ticket it anyway before you strike anything**: a `task` ticket, closed immediately, whose answer is the fact and where it came from. The rule that a fact lives in exactly one place doesn't bend because the fact arrived in conversation, and `Decisions so far` cannot link to a chat message.

Then:

1. **Reopen the dead decision's ticket** — `status: open`, clear `claimed-by`, and append what overturned it and why, under the existing `## Answer`. The old answer stays; it is the record of what was believed and why it was wrong.
2. **Strike it in the map.** Replace its line in `Decisions so far` with the correction, linking both tickets: `- ~~[Old decision](tickets/004-....md)~~ → overturned by [New finding](tickets/011-....md) — <what's true now>`. Gist and link, as always — the detail belongs in the tickets, not here.
3. **Re-wire what stood on it.** Any ticket that closed *because* of the dead decision is now suspect. Reopen the ones whose answers depended on it, and say in each what specifically no longer holds.

**Not every wrong fact kills a decision.** If a closed ticket's answer contains a claim that turns out wrong but its top-line finding still stands, don't reopen it: append a `## Correction` to that ticket and leave its line in `Decisions so far` intact. Reopening is for decisions that are dead — not for answers that need a footnote.

If you can't tell whether a new fact overturns a decision or merely complicates it, that is a question for the human, not a call to make quietly.

## Reaching the destination

The map is finished when there are no open tickets and no fog. The way to the destination is now clear.

**Hand off — do not walk it.** The map is not the plan and it is not the build:

- **Decisions so far** + **Destination** are the input to `writing-plans`. The plan cites the tickets for its rationale.
- `executing-plans` or `subagent-driven-development` do the building.

The map stays in the repo as the record of *why* — the decisions, and the roads not taken. That's the artifact the baseline sessions never produced and could not recover.

## Red flags

Stop if you catch yourself:

- Resolving a second HITL ticket in one session because "they're related"
- Writing implementation code from inside a ticket
- A `task` ticket that, once done, leaves nothing to decide — that's execution wearing a map's clothes
- Answering your own questions on a HITL ticket because the human is slow to reply
- Wiring `blocked-by` edges you never showed the human
- Charting a map for an effort one session could hold
- Restating a decision in `MAP.md` instead of linking its ticket
- Noticing a question and not writing it down anywhere
- Filing something you've ruled out under **Not yet specified** — out-of-scope is not fog
- Referring to tickets by bare number in anything the human reads
- Computing the frontier by eye instead of running `scripts/frontier.sh`
- Leaving a decision standing in **Decisions so far** after learning it's wrong
- Dropping an empty heading from `MAP.md` because there's nothing under it yet

## Common rationalizations

| Rationalization | Reality |
|---|---|
| "I'm on a roll, I'll close three more tickets" | The map is read by future sessions, not just this one. A session that burns the frontier leaves no thinking time between decisions — which is where the fog actually clears. One HITL ticket per session. |
| "The human would obviously choose X, I'll record it and move on" | Then it costs you one question to confirm. A decision you invented is indistinguishable from one they made, once it's written in the map — and that is far more expensive to unwind than to ask. |
| "This ticket is basically implementation, let me just do it" | Then it isn't a ticket. Rule it out of scope or hand it to `writing-plans`. The map is the reason the build will be right; it is not the build. |
| "It's faster to just talk it through and write it up later" | Baseline sessions decomposed the effort well, then persisted *nothing* — "this session produced zero artifacts that survive outside the conversation." The thinking was good and it evaporated anyway. Write the map as you go. |
| "The dependency order is obvious" | It was obvious to the baseline agents too, and they were making unilateral architectural calls they never surfaced. Show the edges. |
| "I'm not sure how to phrase this question yet, I'll remember it" | You won't, and the next session certainly won't. That's what **Not yet specified** is for. Write the dim version. |
| "The map's gotten messy, I'll rewrite it at the end" | There is no end you'll be present for. The map is the handoff. |
