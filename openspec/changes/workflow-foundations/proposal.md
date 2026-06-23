# Change: workflow-foundations

## Why

The operator has been using AgroERP for the current campaña and reported three small but high-leverage UX issues that break their sense of "knowing what to do": **(1)** the sidebar advertises a `/reportes` section but the route does not exist, so clicking it lands on a 404 — the most-cited trust issue in the audit; **(2)** the dashboard layout has no breadcrumb, so once an operator is three menus deep they have no spatial anchor; **(3)** the Labor form (`/produccion/cultivo`) lets the operator pick an insumo without surfacing current stock, forcing a context switch to Insumos before every labor record. This is change **#1 of 5** in the "Ciclo de la Campaña" plan — the other four (campana concept, "what to do today" panel, onboarding wizard, Liquidaciones–Labores integration) are explicitly out of scope here.

## What changes

### 1. Sidebar — `/reportes` link → disabled item

- **File:** `src/app/(dashboard)/layout.tsx` (lines 102–108) and the mobile Sheet nav (lines 142–165).
- **Behavior:** replace the `<Link href="/reportes">` with a non-clickable, visually dimmed `<div>` reading "Reportes · próximamente". No 404 path. Icon stays as `LineChart`. Both desktop and mobile (Sheet) nav must be updated.

### 2. New `Breadcrumb` component on every dashboard page

- **New files:**
  - `src/lib/routes.ts` — single source of truth mapping path segments to Spanish labels and an optional `parent` path (e.g. `produccion.cultivo → { label: "Cultivo", parent: "/produccion" }`). Includes entries for every existing dashboard route under `src/app/(dashboard)/` plus an explicit opt-out for routes that should not show breadcrumbs (e.g. the login/onboarding routes).
  - `src/components/breadcrumb.tsx` — client component that reads `usePathname()`, walks the `ROUTES` config, and renders a Shadcn-style breadcrumb (`Home` icon → sections → current page). Current segment is non-clickable plain text; previous segments are `<Link>` to their parent path.
- **Install (one shell command):** `npx shadcn@latest add breadcrumb` — adds `src/components/ui/breadcrumb.tsx` (not present today, confirmed by `ls src/components/ui/`). If the Shadcn CLI is unavailable, build the equivalent inline using `<nav><ol>` + Tailwind utilities — exact same visual output.
- **Mount:** render `<Breadcrumb />` inside `<main>` at the top of `src/app/(dashboard)/layout.tsx` (line 176, just inside the `<main>` element) so it appears above every page title automatically — no per-page wiring needed.

### 3. Derived-stock display in the Labor form

- **New file:** `src/lib/services/stock.ts` — exports `calcularStock(insumoId: string, tenantId: string): Promise<number>`. Single query against `compras_insumos` (sum of `cantidad`) minus `labores_insumos.cantidad` for the same insumo, scoped by `tenant_id`. **No DB column, no view, no migration** — stock is fully derived per the post-025 model. Mirrors the same formula used by the rewritten `registrar_almacigo` RPC (see `security-hardening/proposal.md`).
- **File:** `src/app/(dashboard)/produccion/cultivo/page.tsx` — already a server component with `export const dynamic = 'force-dynamic'`. Extend it to fetch all insumos for the tenant and build a `Map<insumo_id, { stock: number, unidad: string }>` in one pass. Pass the map down to `<LaborManager>` as a prop. **Decision: server-side prop (Option A), not a per-selection fetch** — one query total, no waterfall, no `useEffect` race with stock changes mid-form.
- **File:** `src/components/labor-manager.tsx` — accept the new `stockByInsumo` prop and forward to `<LaborForm>`.
- **File:** `src/components/forms/labor-form.tsx` — in the `insumos` field-array loop (line 479), when `insumo_id` is set, render `<p className="text-xs text-muted-foreground">Stock actual: {stock} {unidad}</p>` directly under the quantity `<Input>` (line 509). Also fix the existing broken `<SelectItem>` text on line 494 — `i.stock_actual` is always `undefined` post-025; remove it (the new under-input display supersedes it). The `Resource` interface (`stock_actual?: number` on line 29) becomes vestigial in this file; leave the type alone to keep the diff small.

## Impact

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/(dashboard)/layout.tsx` | Modified | `/reportes` Link → disabled div (desktop + mobile Sheet). `<Breadcrumb />` mounted inside `<main>`. |
| `src/lib/routes.ts` | New | Route → label config; single source of truth for breadcrumb AND future nav highlights. |
| `src/components/breadcrumb.tsx` | New | Client component, derives path from `usePathname()`. |
| `src/components/ui/breadcrumb.tsx` | New (via CLI) | Shadcn primitive installed once. |
| `src/lib/services/stock.ts` | New | `calcularStock(insumoId, tenantId)` — derived stock helper. |
| `src/app/(dashboard)/produccion/cultivo/page.tsx` | Modified | Server component now builds `stockByInsumo` map and passes it as a prop. |
| `src/components/labor-manager.tsx` | Modified | Forwards `stockByInsumo` to `<LaborForm>`. |
| `src/components/forms/labor-form.tsx` | Modified | Renders derived stock next to quantity input. Removes broken `stock_actual` reference inside SelectItem. |

**Risk if applied: low.** Three independent, well-scoped UI changes. No DB migration. No new RPC. No API contract change (the existing `/api/insumos` route stays as-is — the new derived-stock path is opt-in via the cultivo page).

**Risk if NOT applied: medium (UX).** Operators continue to hit the 404, lack spatial orientation, and switch contexts to check stock. No data risk, no security risk.

## Out of scope

- The remaining 4 changes of the "Ciclo de la Campaña" plan: `campana` concept, "what to do today" panel, onboarding wizard, Liquidaciones–Labores integration.
- `almacigo-form.tsx` and `cultivo-form.tsx` also reference the dropped `stock_actual` column (grep confirmed: `almacigo-form.tsx:32,202,242`; `cultivo-form.tsx:34,246,247`). The same `calcularStock` helper will be reusable, but the form-level wiring is deferred to a follow-up `frontend-stock-display` change.
- Cleaning up the now-vestigial `stock_actual?: number` field on `Resource` in `labor-form.tsx` (cosmetic).
- Type-safety cleanup (e.g. typing `stockByInsumo` precisely — left as `Record<string, { stock: number; unidad: string }>` with a Zod check at the boundary).
- Tests. The project has no test infra (`openspec/config.yaml: tdd: false, test_command: ""`); verification is manual.
- `CultivoForm` orphan cleanup (separate concern flagged in earlier audit).

## Decisions needed (blocking sdd-spec)

1. **`/reportes` link — A / B / C**
   - **A:** Delete the link entirely. Cleanest. Loses the "future roadmap" signal — operators who remember the link will be confused when it disappears with no trace.
   - **B (recommended):** Replace with a disabled, dimmed menu item reading "Reportes · próximamente". Sets expectation, preserves the roadmap signal, costs ~6 lines.
   - **C:** Create a minimal `/reportes` page with a "Próximamente" placeholder. Hides the problem behind a page, but creates a new maintenance surface and the mobile Sheet version would still need a separate treatment.

2. **Stock display — server prop (a) / client fetch (b)**
   - **a (recommended):** Server component computes a stock map for all tenant insumos in a single SQL pass and passes it as a prop. **Rationale:** the cultivo page already runs on the server with `force-dynamic`; the insumos list is small (per-tenant, typically <100 rows); avoids any per-selection waterfall; stock reflects "as of page load" which matches the existing semantics of every other number in the form.
   - **b:** Add a new `/api/insumos/[id]/stock` route, fetch on `insumo_id` change. **Rationale against:** doubles the query count (list + N stock fetches), introduces a brief loading state per selection, and the value will go stale mid-session anyway (a labor in another tab will not refresh this view).

3. **Breadcrumb data source — derived from `usePathname()` (recommended) / explicit per-page config**
   - **Derived (recommended):** `usePathname()` walks `src/lib/routes.ts` config. Single source of truth; new routes only need a config entry. Trade-off: hidden coupling — a typo in the URL won't show in the breadcrumb (acceptable, the 404 page handles it).
   - **Explicit:** Each page passes its own breadcrumb segments via a `<Breadcrumb segments={[...]} />` prop. More typing per page, more chance of drift, but each breadcrumb is locally readable.

## Verification plan

No automated tests — manual verification only.

1. **Sidebar fix.** Visit any dashboard page in both desktop and mobile (Sheet) layouts. Confirm: clicking the disabled "Reportes" item does nothing; it appears visually dimmed; navigating to `/reportes` directly via URL still shows the Next.js 404 (out of scope to fix the URL itself — that's a separate `/reportes` placeholder page, not chosen here).
2. **Breadcrumb.** Navigate through these paths and confirm the breadcrumb reads correctly:
   - `/dashboard` → `Inicio`
   - `/produccion` → `Inicio > Producción`
   - `/produccion/cultivo` → `Inicio > Producción > Cultivo`
   - `/insumos/compras` → `Inicio > Insumos > Compras`
   - `/insumos/informe` → `Inicio > Insumos > Informe`
   - Confirm current segment is non-clickable plain text; previous segments are clickable links.
   - Confirm on mobile the breadcrumb truncates gracefully (no horizontal scroll on a 375px viewport).
3. **Stock display.** As a tenant with existing compras and at least one recorded labor:
   - Open `/produccion/cultivo`, click "Registrar Nueva Labor", add an insumo to the insumos field-array.
   - Confirm `Stock actual: <n> <unidad>` appears directly under the quantity input.
   - Cross-check the number against `/insumos` table — must match.
   - Record the labor, then refresh the page — confirm the stock number decreased by exactly the cantidad entered.
4. **Build sanity.** `npm run build` (configured in `openspec/config.yaml`) must pass.

## Capabilities (contract with sdd-spec)

> `openspec/specs/` is empty. This is the first change to introduce new capabilities since the project adopted SDD.

### New Capabilities

- `workflow-breadcrumb`: every dashboard page under `(dashboard)/` renders a breadcrumb derived from the current pathname via the `ROUTES` config in `src/lib/routes.ts`. The current page segment is non-clickable; previous segments are links. Routes not in `ROUTES` show only the `Home` segment.
- `insumo-stock-derivation`: a server-side helper `calcularStock(insumoId, tenantId): Promise<number>` in `src/lib/services/stock.ts` returns the current derived stock for a given insumo as `SUM(compras_insumos.cantidad) − SUM(labores_insumos.cantidad)` for that `tenant_id`. The helper is a single Supabase query and respects the post-025 model (no `stock_actual` column).

### Modified Capabilities

- None (no existing specs).

## Rollback plan

All three changes are forward-revertible in minutes:

- **Sidebar:** revert the diff in `src/app/(dashboard)/layout.tsx` (the old `<Link href="/reportes">` comes back). No data effect.
- **Breadcrumb:** remove `<Breadcrumb />` mount from `<main>` and delete the three new files (`src/lib/routes.ts`, `src/components/breadcrumb.tsx`, and either delete `src/components/ui/breadcrumb.tsx` or leave it unused). No data effect.
- **Stock display:** remove the `stockByInsumo` prop threading through `cultivo/page.tsx` → `labor-manager.tsx` → `labor-form.tsx`, delete `src/lib/services/stock.ts`. Reverts the form to its pre-change shape; the broken `stock_actual` display inside SelectItems reappears (it was broken before this change — see `security-hardening/proposal.md` "out of scope" #5).

## Dependencies

- None blocking. The custom JWT hook from `security-hardening` is already active in the Supabase Dashboard (per project context), so tenant scoping in the new stock helper uses the standard Supabase server client and RLS — no manual `tenant_id` parameter.
- Related future debt (still tracked, still out of scope here): the same `calcularStock` helper will be reused by `frontend-stock-display` to fix `almacigo-form.tsx` and `cultivo-form.tsx`.
