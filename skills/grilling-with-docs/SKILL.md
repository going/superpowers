---
name: grilling-with-docs
description: Grilling session that challenges a plan against the existing domain model, sharpens terminology, and updates the docs (CONTEXT.md glossary, ADRs) inline as decisions crystallise. Use when the user wants to stress-test or grill a plan or design against their project's language and documented decisions.
---

Run a `/grilling` session to interview the user about the plan or design — one question at a time, each with your recommended answer.

Throughout the interview — not batched at the end — use the `/domain-modeling` skill as decisions crystallise: read the existing glossary and ADRs first, challenge new terms against `docs/superpowers/CONTEXT.md`, sharpen fuzzy language, and update the glossary inline the moment a term resolves. Offer an ADR only when the decision is hard to reverse, surprising without context, and a real trade-off. The interview and the documentation happen together, in one pass.
