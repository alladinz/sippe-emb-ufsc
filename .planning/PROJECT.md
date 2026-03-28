# StudyPlan Management System

## What This Is

A web application for university teachers to create and manage semester Study Plans. It handles data entry for course details, methodology, and evaluation, and facilitates a review/approval workflow involving Department Coordinators, Department Chefs, and Secretaries.

## Core Value

Streamlining the creation, review, and archiving of academic study plans to ensure consistency and compliance across the department.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **Teacher Form**: User can fill out a comprehensive Study Plan form including course code, name, methodology, cronogram, evaluation, dates, and bibliography.
- [ ] **Data Import**: Support obtaining course code and name from a CSV file (initially manual entry).
- [ ] **Review Workflow**: Coordinators for each of the 8 bachelor degrees can review, approve, or reject Study Plans.
- [ ] **Revision Cycle**: Rejected plans are returned to the Teacher for necessary updates and re-submission.
- [ ] **Process Oversight**: Department Chef has visibility and responsibility for the entire study plan process.
- [ ] **Archiving**: Department Secretary can archive approved Study Plans for record-keeping.
- [ ] **PDF Export**: Users can export completed and approved Study Plans as PDF files.

### Out of Scope

- [ ] **Mobile App** — Focus is on a desktop-friendly web interface for administrative tasks.
- [ ] **Integration with University ERP** — Initially focused on a standalone system with CSV import.

## Context

- The project is intended for a university environment with specific roles (Teacher, Coordinator, Department Chef, Secretary).
- There are 8 different bachelor degrees, each with its own coordinator.
- The process requires a clear state transition from creation to approval to archiving.

## Constraints

- **Tech Stack**: [To be determined during research]
- **Timeline**: [To be determined]
- **Compatibility**: Must work in modern web browsers used by university staff.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Standard Granularity | Balanced phase size for a system with clear roles and workflows. | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: March 28, 2026 after initialization*
