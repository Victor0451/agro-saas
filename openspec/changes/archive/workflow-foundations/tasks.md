# Tasks: workflow-foundations

> Implementation tasks for change `workflow-foundations`. Maps 1:1 to commits. Run tasks in order — each builds on the previous.

## Review Workload Forecast

- **Total estimated lines of change:** ~200-300 (TS+CSS, 2 new files + 3 modified)
- **Number of work units (commits):** 7
- **400-line budget risk:** **Low**
- **Chained PRs recommended:** **No**
- **Decision needed before apply:** **No**

## Task 1: Add ROUTES config

**Work unit:** Create `src/lib/routes.ts` with the `ROUTES` constant mapping URL segments to labels and parent hierarchy.

**Files:**
- `src/lib/routes.ts` (new)

**Commit message:** `feat(routes): add ROUTES constant for breadcrumb navigation`

**Acceptance criteria:**
- [x] File exists at `src/lib/routes.ts`
- [x] Exports `ROUTES: Record<string, { label: string; parent?: string }>`
- [x] All 18 keys present: `dashboard`, `fincas`, `lotes`, `insumos`, `compras`, `historial`, `presupuesto`, `informe`, `produccion`, `almacigos`, `plantacion`, `cultivo`, `cosecha`, `curado`, `estufas`, `personal`, `liquidacion`, `reportes`
- [x] Each non-root entry has correct `parent` (e.g. `cultivo.parent = "produccion"`, `compras.parent = "insumos"`)

**Verification steps:**
```bash
ls src/lib/routes.ts
node -e "const { ROUTES } = require('./src/lib/routes.ts'); console.log(Object.keys(ROUTES).length)"
```

**Estimated diff:** ~25 lines

**Dependencies:** none

---

## Task 2: Add Breadcrumb component

**Work unit:** Create `src/components/breadcrumb.tsx` as a client component that reads `usePathname()` and walks `ROUTES` to render the navigation chain.

**Files:**
- `src/components/breadcrumb.tsx` (new)

**Commit message:** `feat(breadcrumb): add breadcrumb component using usePathname and ROUTES map`

**Acceptance criteria:**
- [x] File exists at `src/components/breadcrumb.tsx`
- [x] Component is `"use client"`, uses `usePathname()` from `next/navigation`
- [x] Imports `ROUTES` from `@/lib/routes`
- [x] Renders `<nav><ol>` with `Inicio` linked to `/dashboard`
- [x] Each non-last segment is a `<Link>`, last segment is plain text
- [x] Uses `lucide-react` `Home` and `ChevronRight` for icons
- [x] Graceful fallback for unknown segments (capitalize as-is, no crash)

**Verification steps:**
```bash
ls src/components/breadcrumb.tsx
# Visual: add temporary test page at /test-breadcrumb, navigate to /produccion/cultivo and verify "Inicio > Producción > Cultivo"
```

**Estimated diff:** ~60 lines

**Dependencies:** Task 1

---

## Task 3: Wire breadcrumb into dashboard layout + disable /reportes link

**Work unit:** Modify `src/app/(dashboard)/layout.tsx` to mount `<Breadcrumb />` above `{children}` and replace the `/reportes` link with a disabled `<span>` in both desktop sidebar and mobile Sheet.

**Files:**
- `src/app/(dashboard)/layout.tsx` (modify)

**Commit message:** `fix(dashboard): disable /reportes link and mount breadcrumb in layout`

**Acceptance criteria:**
- [x] `<Breadcrumb />` is imported and mounted inside `<main>` above `{children}` (after line 176)
- [x] Desktop sidebar: `<Link href="/reportes">` (lines 102-108) replaced with disabled `<span>` styled `text-muted-foreground/50 cursor-not-allowed` with `aria-disabled="true"`, text "Reportes · próximamente"
- [x] Mobile Sheet: no existing Reportes link — ADD a disabled `<span>` after the Mis Fincas link (after line 164), matching the Sheet's `mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2` pattern
- [x] `LineChart` import from `lucide-react` is retained (used by disabled items)

**Verification steps:**
```bash
npm run build
# Visual: open /dashboard in desktop and mobile viewport; verify breadcrumb and disabled Reportes item in both
```

**Estimated diff:** ~30 lines

**Dependencies:** Task 2

---

## Task 4: Add calcularStock helper

**Work unit:** Create `src/lib/services/stock.ts` with the two-query `calcularStock(insumoId, tenantId)` function.

**Files:**
- `src/lib/services/stock.ts` (new)

**Commit message:** `feat(stock): add calcularStock(insumoId, tenantId) using two-query ledger approach`

**Acceptance criteria:**
- [x] File exists at `src/lib/services/stock.ts`
- [x] Exports `calcularStock(insumo_id: string, tenant_id: string): Promise<number>`
- [x] First query: `SUM(cantidad)` from `compras_insumos` filtered by `insumo_id` and `tenant_id`
- [x] Second query: `SUM(cantidad)` from `labores_insumos` JOIN `labores` filtered by `insumo_id` and `tenant_id`
- [x] Returns `Math.max(0, totalCompras − totalConsumos)`
- [x] Returns `0` for unknown insumo_id (no error thrown)

**Verification steps:**
```bash
ls src/lib/services/stock.ts
# Manual test: create a temp script that imports calcularStock and calls it with a known insumo_id
```

**Estimated diff:** ~35 lines

**Dependencies:** none (independent utility)

---

## Task 5: Page server component builds stockMap

**Work unit:** Modify `src/app/(dashboard)/produccion/cultivo/page.tsx` to look up `tenant_id`, query insumos, build `stockByInsumo`, and pass it to `<LaborManager>`.

**Files:**
- `src/app/(dashboard)/produccion/cultivo/page.tsx` (modify)

**Commit message:** `feat(cultivo): build stockByInsumo map server-side and pass to LaborManager`

**Acceptance criteria:**
- [x] Adds `await supabase.auth.getUser()` + `usuarios.tenant_id` lookup (canonical pattern from `api/insumos/route.ts`)
- [x] Queries `insumos` with `select('id, nombre, unidad').eq('activo', true)` filtered by tenant
- [x] Builds `stockByInsumo: Record<string, { stock: number; unidad: string }>` by iterating insumos and calling `calcularStock`
- [x] Passes `stockByInsumo` to `<LaborManager stockByInsumo={stockByInsumo} />`

**Verification steps:**
```bash
npm run build
# Visual: navigate to /produccion/cultivo, open browser DevTools → Network, confirm no client-side fetch for stock
```

**Estimated diff:** ~30 lines

**Dependencies:** Task 4

---

## Task 6: Labor manager forwards stockByInsumo + Labor form displays stock

**Work unit:** Modify `src/components/labor-manager.tsx` to accept and forward `stockByInsumo`, then modify `src/components/forms/labor-form.tsx` to display stock under each quantity input and fix the broken `SelectItem` text.

**Files:**
- `src/components/labor-manager.tsx` (modify)
- `src/components/forms/labor-form.tsx` (modify)

**Commit message:** `feat(labor): display derived stock under cantidad input and fix broken SelectItem text`

**Acceptance criteria:**
- [x] `LaborManagerProps` includes `stockByInsumo: Record<string, { stock: number; unidad: string }>`
- [x] `LaborManager` forwards `stockByInsumo` to `<LaborForm stockByInsumo={stockByInsumo} />`
- [x] `LaborFormProps` includes `stockByInsumo?: Record<string, { stock: number; unidad: string }>` with default `{}`
- [x] Inside `fields.map` for insumos rows, `form.watch(`insumos.${index}.insumo_id`)` is called per row
- [x] Below the quantity `<Input>` (after line 509), renders `<p className="text-[10px] text-muted-foreground mt-1">Stock actual: {stock.toFixed(2)} {unidad}</p>` when `selectedInsumoId` and `stockByInsumo[selectedInsumoId]` are both present
- [x] Line 494 fixed: `{i.nombre} ({i.stock_actual} {i.unidad})` → `{i.nombre} ({i.unidad})`

**Verification steps:**
```bash
npm run build
# Visual: navigate to /produccion/cultivo, click "Registrar Nueva Labor", add insumo row, select an insumo — verify "Stock actual: N kg" appears below the quantity input
```

**Estimated diff:** ~40 lines

**Dependencies:** Task 5

---

## Task 7: Build + state update

**Work unit:** Run `npm run build` to verify no TypeScript errors, then update `state.yaml` to `status: applied` and create `apply-progress.md`.

**Files:**
- `openspec/changes/workflow-foundations/state.yaml` (modify)
- `openspec/changes/workflow-foundations/apply-progress.md` (new)

**Commit message:** `chore(workflow-foundations): mark as applied after successful build`

**Acceptance criteria:**
- [x] `npm run build` exits with code 0 (no TS errors)
- [x] `state.yaml` has `status: applied` and `next_recommended: null` or removed
- [x] `apply-progress.md` exists with a summary of what was implemented

**Verification steps:**
```bash
npm run build
cat openspec/changes/workflow-foundations/state.yaml | grep status
ls openspec/changes/workflow-foundations/apply-progress.md
```

**Estimated diff:** ~5 lines

**Dependencies:** Tasks 1–6

---

## Out of scope (tracked separately)

- 4 future changes in the "Ciclo de la Campaña" plan
- `CultivoForm` orphan cleanup
- Stock display in Almacigos form (separate change: `frontend-stock-display`)
- `src/lib/validations/insumo.ts` cleanup (stock_actual default 0)
- Tests (no test infra in project per `openspec/config.yaml`)
- Type-safety cleanup (`LaborManager`/`LaborForm` `any` types — not introduced by this change)
