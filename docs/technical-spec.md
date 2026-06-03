# Technical Specification

## Planned Stack

- Desktop shell: Electron
- UI: React
- Language: TypeScript
- Local data: SQLite or a file-backed local database layer
- Styling: CSS with a restrained light-blue visual system

The stack should remain simple and maintainable for a small desktop app.

## Architecture Principles

- Keep scoring logic separate from UI components.
- Keep data persistence separate from scoring and presentation.
- Keep domain types explicit and readable.
- Prefer deterministic functions for scoring so they are easy to test.
- Avoid network dependencies in v1 app behavior.

## Planned App Boundaries

- Main process: desktop window, local filesystem/database access, export operations.
- Renderer process: table UI, filters, editing forms, scoring display.
- Shared domain layer: country/bond types, scoring functions, weight configuration.

## Data Model Direction

The core entity is a country-level sovereign bond record:

- One country.
- One representative 10-year local-currency sovereign bond.
- Country-level risk metrics.
- Bond-level return and liquidity metrics.
- UI state such as pinned or hidden.
- Metadata such as last updated and source note.

## Persistence Direction

Local persistence must preserve:

- Sovereign bond records.
- Weight settings.
- Pinned countries.
- Hidden countries.
- Last updated timestamps and source notes.

## Export Direction

CSV export should reflect the current table view, including active filters, sorting, score columns, and visible records.

## Verification Expectations

Each technical increment should have at least one practical verification step:

- Type check for TypeScript changes.
- Unit tests for scoring changes.
- Manual launch check for desktop shell changes.
- UI interaction check for table and form changes.
- Export file inspection for CSV changes.

