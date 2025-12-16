# Data Model: Frontend Refactor Structure

## Entities

### ModuleGroup
- **Represents**: A domain slice folder (e.g., `domains/investment`, `domains/admin`) or shared primitives (`shared/ui`, `shared/hooks`).
- **Fields**:
  - `name`: string (domain or shared scope)
  - `path`: string (folder path under `frontend/`)
  - `publicExports`: string[] (barrel exports exposed via `index.ts`)
  - `dependencies`: string[] (other ModuleGroups it is allowed to import)
  - `status`: enum { `stable`, `legacy`, `deprecated` }
- **Relationships**:
  - One `ModuleGroup` may depend on multiple `ModuleGroup` instances (directed DAG; no cycles permitted).
  - `ModuleGroup` owns multiple `ModuleContract` entries.

### ModuleContract
- **Represents**: The public surface of a ModuleGroup (components, hooks, utilities) as exported by the domain barrel.
- **Fields**:
  - `module`: reference to `ModuleGroup`
  - `exportName`: string (named/default export)
  - `type`: enum { `component`, `hook`, `utility`, `context`, `type` }
  - `consumers`: string[] (folders/files importing this contract)
  - `deprecated`: boolean (true if legacy path retained temporarily)
- **Relationships**:
  - Belongs to one `ModuleGroup`.
  - Consumed by many files across domains; consumption should occur via barrel, not deep paths.

## Validation Rules
- No circular dependencies between ModuleGroups (enforce via ESLint `import/no-cycle` and `no-restricted-imports`).
- All imports should resolve through barrel exports of the owning ModuleGroup (no deep file paths outside the module).
- Deprecated exports must be annotated and scheduled for removal once mapping is applied.
- Shared primitives (`shared/ui`, `shared/hooks`, `shared/lib`) must not import from domain ModuleGroups (one-way dependency).

## State Transitions (for modules during refactor)
- `legacy` → `deprecated` when an old path remains temporarily exposed via a compatibility barrel.
- `deprecated` → `removed` once all consumers migrate to the new path and lint rules block the old import.
- `legacy` → `stable` when the module is moved into its new domain folder with barrel exports and no legacy path remains.
