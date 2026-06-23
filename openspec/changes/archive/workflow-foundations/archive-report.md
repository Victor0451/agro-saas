# Archive Report: workflow-foundations

**Archived:** 2026-06-19
**Status:** ✅ ARCHIVED

## What was delivered

3 UX improvements in TypeScript/CSS, no SQL migrations:

1. Breadcrumb navigation on every dashboard route
2. `/reportes` link disabled in sidebar (no more 404)
3. Current stock displayed in Labor form

## Specs promoted to canonical
- `openspec/specs/workflow-breadcrumb/spec.md` (active)
- `openspec/specs/insumo-stock-derivation/spec.md` (active)

## Commits in this change (8 total, including the doc-archive followup)
- b2aa82d  feat(lib): add ROUTES config for breadcrumb navigation
- 7b4ae29  feat(breadcrumb): add Breadcrumb component for dashboard navigation
- 0b992b8  fix(dashboard): wire breadcrumb into dashboard layout and disable /reportes link
- 3d97dfe  feat(lib): add calcularStock helper to derive stock from ledger
- 9a3300a  feat(produccion): pass stockMap from cultivo page to labor form
- 9877bd3  fix(labor): display current stock in labor form and fix broken SelectItem text
- 1ad9506  chore(workflow-foundations): mark workflow-foundations applied
- 9fcf714  docs(sdd): add workflow-foundations proposal, design and specs to git history

## Outstanding (non-blocking)
- N+1 in `calcularStock` loop — documented as known tradeoff
- `toFixed(2)` formatting on stock display — minor visual polish

## Next planned change
campana-concept — introduces the campaign concept that unlocks dashboard-que-hacer, wizard-inicial, and liquidaciones-integracion.