---
description: "Generate an Architecture Decision Record (ADR) for an Electron or TypeScript design decision. Use when choosing between storage engines, IPC strategies, update mechanisms, state management libraries, source provider patterns, or any significant architectural trade-off."
argument-hint: "Describe the decision to record (e.g. 'SQLite vs IndexedDB for local persistence')"
agent: "agent"
tools: [read, search]
---

Generate a well-structured Architecture Decision Record (ADR) for the following decision in this Electron desktop application:

**Decision topic**: {{userInput}}

---

Research the codebase first to understand:

- What already exists related to this decision
- Any constraints visible in existing code or config files
- The current tech stack in use

Then produce the ADR following this exact format:

---

# ADR-XXX: [Short Title of the Decision]

**Date**: [today's date]
**Status**: Proposed | Accepted | Deprecated | Superseded

## Context

Describe the situation that requires a decision. Include:

- What problem this solves
- Why a decision is needed now
- Any constraints (platform, performance, security, team skills)

## Decision Drivers

- [driver 1]
- [driver 2]
- [driver 3]

## Considered Options

### Option 1: [Name]

- **Description**: brief explanation
- **Pros**: [list]
- **Cons**: [list]

### Option 2: [Name]

- **Description**: brief explanation
- **Pros**: [list]
- **Cons**: [list]

### Option 3: [Name] (if applicable)

- **Description**: brief explanation
- **Pros**: [list]
- **Cons**: [list]

## Decision

**Chosen option**: [Option N] — [one-sentence justification]

## Rationale

Explain in depth why this option was chosen over the others. Reference:

- SOLID principles or design patterns applied
- Security implications (especially for Electron: Main/Renderer boundaries, IPC safety)
- Cross-platform considerations (Windows / macOS / Linux)
- Scalability and maintainability impact

## Consequences

### Positive

- [consequence 1]
- [consequence 2]

### Negative / Risks

- [risk 1 and mitigation strategy]

### Neutral

- [implementation notes or migration steps if applicable]

## Implementation Notes

Provide a brief code sketch or folder structure change to illustrate the decision in practice.

---

Save the ADR to `docs/adr/ADR-XXX-[slug].md` where XXX is the next sequential number. Check `docs/adr/` for existing ADRs to determine the correct number.
