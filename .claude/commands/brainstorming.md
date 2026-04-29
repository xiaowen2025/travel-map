---
description: A structured workflow to explore project requirements, resolve ambiguities, and create a technical design before implementation.
---

# Superpower: Brainstorming

The goal of this skill is to help turn high-level ideas into fully-formed designs and specifications through collaborative dialogue. This protocol ensures that we fully understand the problem space before any implementation.

## Mandatory Workflow

### 1. Understand Context
Start by exploring the high-level goal. Identify:
- The core purpose of the project/feature.
- Success criteria (what does "done" look like?).
- Any known constraints or technical requirements.

### 2. Clarifying Questions
Ask questions to narrow down the scope and resolve ambiguities.
- **Rule:** Ask only one question at a time to avoid overwhelming the user.
- **Format:** Prefer multiple-choice questions when possible to speed up decision-making.

### 3. Propose Approaches
Once the scope is clear, propose 2-3 different technical approaches.
- Detail the trade-offs (Pros/Cons) for each.
- Provide a specific recommendation on which path to take and why.

### 4. Detailed Design
Present the chosen design in logical sections (e.g., Data Model, API Interface, UI Flow).
- **Checkpoint:** Pause for user approval after each major design section.
- **RESTRICTION:** Do NOT write implementation code, scaffold projects, or take any implementation actions until the design is approved.

### 5. Final Specification
Once the design is approved, document it formally.
- **Path:** Create a spec file at `docs/specs/YYYY-MM-DD-<topic>-design.md`.
- **Content:** Include the approved architecture, components, and acceptance criteria.
- **Self-Review:** Check the spec for placeholders, contradictions, or ambiguity.

## Transitioning to Implementation
After the user signs off on the final specification, invoke the **Planning** skill to break the design down into actionable implementation steps.
