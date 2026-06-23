# Design: workflow-foundations

> Status: designed · Change ID: `workflow-foundations` · Phase: design

## Context

This change ships three independent UX improvements from the "Ciclo de la Campaña" plan:

1. **Disable `/reportes`** — replace the dead link with a non-clickable "Reportes · próximamente" item.
2. **Breadcrumb on every dashboard page** — spatial anchor derived from `usePathname()`.
3. **Derived stock display in the Labor form** — surface current `SUM(compras) − SUM(labores)` next to the quantity input.

Specs: [`workflow-breadcrumb/spec.md`](specs/workflow-breadcrumb/spec.md) · [`insumo-stock-derivation/spec.md`](specs/insumo-stock-derivation/spec.md)

### Corrections vs proposal (verified against actual code)

| Item | Proposal said | Code says | Design decision |
|---|---|---|---|
| Mobile Sheet `/reportes` link | Modify lines 142-165 | No `/reportes` link exists in the mobile Sheet (it has only Dashboard + Mis Fincas, lines 143-164) | **ADD** the disabled Reportes item to the mobile Sheet — spec scenario "mobile Sheet disabled" requires it |
| `ROUTES.catalogo` | Included `catalogo: { label: "Catálogo", parent: "insumos" }` | No `/insumos/catalogo` page exists; `insumos/catalogo` is an API route only | **Drop** `catalogo` from the map. Real pages under `insumos/`: `compras`, `compras/historial`, `informe`, `presupuesto` |
| `calcularStock` query count | Two Supabase queries per insumo | OK — spec scenarios verify the result, not the query count. Proposal explicitly chose "no migration" | **Keep** two-query approach (no new migration, faster ship) |
| `tenant_id` source | `userData.tenant_id` | Confirmed canonical pattern (e.g. `src/app/api/insumos/route.ts:38-46` reads `usuarios.tenant_id` via `auth.getUser()`) | **Use** the same pattern in `cultivo/page.tsx` |

## Architecture decisions

| # | Decision | Alternatives | Rationale |
|---|---|---|---|
| AD-1 | Two-query `calcularStock` in TypeScript | A) Single RPC (new migration) · B) Single SQL with subselects (not expressible via PostgREST) | No new migration. Spec scenarios verify the formula, not the query shape. N+1 is acceptable for v1 (small N per tenant). |
| AD-2 | Breadcrumb data source: `usePathname()` walks `ROUTES` | A) Explicit per-page `<Breadcrumb segments={...} />` prop | Per proposal decision. Single source of truth — new routes only need a `ROUTES` entry. |
| AD-3 | Shadcn `breadcrumb` install via `npx shadcn@latest add breadcrumb`; inline Tailwind + `lucide-react` `ChevronRight` + `Home` as fallback | Always inline | Spec scenario "mobile truncates gracefully" is easier to meet with shadcn's responsive primitives. |
| AD-4 | Mount `<Breadcrumb />` inside `<main>` in `src/app/(dashboard)/layout.tsx`, above `{children}` | Mount in each page | One mount, every dashboard route gets it. No per-page wiring. |
| AD-5 | Disabled Reportes item in mobile Sheet **added** (not modified) | Modify existing | The mobile Sheet has no Reportes link today; spec mandates parity with desktop. |
| AD-6 | Form uses `form.watch(\`insumos.${index}.insumo_id\`)` per row inside `fields.map` | Extract `<InsumoRow>` with `useWatch` | Minimum invasiveness. Form re-renders the whole form on each insumo change — acceptable for this size. |
| AD-7 | Stock text rendered **inside** the existing `cantidad` `FormItem`, below the `<Input>`, font-size `text-[10px]`, color `text-muted-foreground` | New column in the flex row | Avoids restructuring the row. Integrates with the existing `FormMessage` slot. |
| AD-8 | Replace broken `SelectItem` text `{i.nombre} ({i.stock_actual} {i.unidad})` with `{i.nombre} ({i.unidad})` | Remove the unit display too | Unit is still useful in the dropdown. `stock_actual` is `undefined` post-025 (column dropped in migration 025). |
| AD-9 | `stockByInsumo` shape `Record<string, { stock: number; unidad: string }>` (per spec) | `Record<string, number>` only | Spec mandates the shape. The form reads `unidad` from the prop for parity with the spec's render format. |

## Data flow

```
                                          ┌──────────────────────────┐
                                          │  compras_insumos ledger  │
                                          │  (tenant_id, insumo_id)  │
                                          └────────────┬─────────────┘
                                                       │ SUM(cantidad)
                                                       ▼
┌──────────────┐    insumo_id, tenant_id    ┌──────────────────┐
│  page.tsx    │ ────────────────────────▶ │  calcularStock   │
│  (RSC)       │                            │  (lib/services)  │
│  builds      │ ◀──── { stock, unidad } ───└────────┬─────────┘
│  stockMap    │                                     │ SUM(cantidad)
│              │                                     ▼
│              │                            ┌──────────────────┐
│              │                            │  labores_insumos │
│              │                            │  JOIN labores    │
│              │                            │  (tenant_id)     │
│              │                            └──────────────────┘
└──────┬───────┘
       │ stockByInsumo prop
       ▼
┌──────────────┐    stockByInsumo prop
│ LaborManager │ ─────────────────────────▶
│ (client)     │
└──────┬───────┘
       │ stockByInsumo prop
       ▼
┌──────────────┐    form.watch(insumos[i].insumo_id) per row
│  LaborForm   │ ────▶  renders "Stock actual: N unidad"
│  (client)    │         under the quantity <Input>
└──────────────┘
```

Breadcrumb data flow (orthogonal):

```
usePathname() ──▶ split('/') ──▶ walk ROUTES map ──▶ [<Link>Inicio</Link>, ...chain]
                                                          ▲
                                  first segment links to /dashboard
                                  last segment is plain text (not a Link)
```

## File changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/routes.ts` | **Create** | `ROUTES` const: `Record<string, { label: string; parent?: string }>`. Keys: `dashboard`, `fincas`, `lotes`, `insumos`, `compras`, `historial`, `presupuesto`, `informe`, `produccion`, `almacigos`, `plantacion`, `cultivo`, `cosecha`, `curado`, `estufas`, `personal`, `liquidacion`, `reportes`. Each non-root entry has `parent` pointing to its key (e.g. `cultivo.parent = "produccion"`). |
| `src/components/breadcrumb.tsx` | **Create** | `"use client"`. Reads `usePathname()`, splits into segments, walks `ROUTES` (graceful fallback for unknown segments: capitalize as-is). Prepends "Inicio" linked to `/dashboard`. Renders inline `<nav><ol>` with `lucide-react` `Home` icon and `ChevronRight` separator. |
| `src/app/(dashboard)/layout.tsx` | **Modify** | (a) Replace desktop sidebar `<Link href="/reportes">` (lines 102-108) with a `<span>` styled `text-muted-foreground/50 cursor-not-allowed` and `aria-disabled="true"`, text "Reportes · próximamente". (b) **Add** the same disabled Reportes item to the mobile Sheet nav (after the Mis Fincas link at line 164), styled to match the Sheet's larger-item pattern (`mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2`). (c) Mount `<Breadcrumb />` inside `<main>` above `{children}` (after line 176). |
| `src/lib/services/stock.ts` | **Create** | Exports `calcularStock(insumoId: string, tenantId: string): Promise<number>`. Two `.from().select()` calls: one against `compras_insumos` (filter by `insumo_id` + `tenant_id`), one against `labores_insumos` (filter by `insumo_id` + `labores!inner(tenant_id)`). Returns `Math.max(0, totalCompras − totalConsumos)`. |
| `src/app/(dashboard)/produccion/cultivo/page.tsx` | **Modify** | (a) Add `await supabase.auth.getUser()` + `await supabase.from('usuarios').select('tenant_id').eq('id', user.id).single()` (canonical pattern from `api/insumos/route.ts`). (b) Query `insumos` for the tenant (`select('id, nombre, unidad').eq('activo', true)`). (c) Build `stockByInsumo: Record<string, { stock: number; unidad: string }>` by iterating insumos and calling `calcularStock(insumo.id, userData.tenant_id)`. (d) Pass `stockByInsumo` as a prop to `<LaborManager>`. |
| `src/components/labor-manager.tsx` | **Modify** | Add `stockByInsumo: Record<string, { stock: number; unidad: string }>` to `LaborManagerProps`. Forward to `<LaborForm stockByInsumo={stockByInsumo} />` (line 126-130). |
| `src/components/forms/labor-form.tsx` | **Modify** | (a) Add `stockByInsumo?: Record<string, { stock: number; unidad: string }>` to `LaborFormProps` (default `{}`). (b) In the `insumos` field-array row (lines 479-518), watch `insumos.${index}.insumo_id` per row via `form.watch(...)`. (c) Below the quantity `<Input>` (after line 509), inside the same `FormItem`, render `<p className="text-[10px] text-muted-foreground mt-1">Stock actual: {stock.toFixed(2)} {unidad}</p>` when both `selectedInsumoId` and `stockByInsumo[selectedInsumoId]` are present. (d) Replace the broken `SelectItem` text on line 494: `{i.nombre} ({i.stock_actual} {i.unidad})` → `{i.nombre} ({i.unidad})`. |

## Interfaces / contracts

```ts
// src/lib/routes.ts
export const ROUTES: Record<string, { label: string; parent?: string }> = {
  dashboard:    { label: "Dashboard" },
  fincas:       { label: "Fincas" },
  lotes:        { label: "Lotes" },
  insumos:      { label: "Insumos" },
  compras:      { label: "Compras",      parent: "insumos" },
  historial:    { label: "Historial",    parent: "compras" },
  presupuesto:  { label: "Presupuesto",  parent: "insumos" },
  informe:      { label: "Informe de Desvío", parent: "insumos" },
  produccion:   { label: "Producción" },
  almacigos:    { label: "Almácigos",    parent: "produccion" },
  plantacion:   { label: "Plantación",   parent: "produccion" },
  cultivo:      { label: "Cultivo",      parent: "produccion" },
  cosecha:      { label: "Cosecha",      parent: "produccion" },
  curado:       { label: "Curado",       parent: "produccion" },
  estufas:      { label: "Estufas",      parent: "curado" },
  personal:     { label: "Personal" },
  liquidacion:  { label: "Liquidación",  parent: "personal" },
  reportes:     { label: "Reportes · próximamente" },
};
```

```ts
// src/lib/services/stock.ts
import { createClient } from "@/lib/supabase/server";

/**
 * Derived stock for one insumo, scoped to one tenant.
 * Formula: SUM(compras_insumos.cantidad) − SUM(labores_insumos.cantidad).
 * Returns 0 for unknown insumo_id. Never returns negative (clamped at 0).
 * Mirrors the formula in migration 035 (`registrar_almacigo`).
 */
export async function calcularStock(
  insumo_id: string,
  tenant_id: string
): Promise<number>;
```

```tsx
// LaborManagerProps extension
interface LaborManagerProps {
  history: any[];
  stockByInsumo: Record<string, { stock: number; unidad: string }>;
}

// LaborFormProps extension
interface LaborFormProps {
  onSuccess?: () => void;
  initialData?: any;
  onCancel?: () => void;
  stockByInsumo?: Record<string, { stock: number; unidad: string }>; // default {}
}
```

```tsx
// Disabled Reportes (desktop sidebar)
<span
  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground/50 cursor-not-allowed"
  aria-disabled="true"
>
  <LineChart className="h-4 w-4" />
  Reportes · próximamente
</span>

// Disabled Reportes (mobile Sheet)
<span
  className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground/50 cursor-not-allowed"
  aria-disabled="true"
>
  <LineChart className="h-5 w-5" />
  Reportes · próximamente
</span>
```

## Testing strategy

`openspec/config.yaml` has `tdd: false`, `test_command: ""`. Verification is manual.

| Layer | What to verify | How |
|---|---|---|
| Visual | Disabled Reportes shows in both desktop sidebar and mobile Sheet; visually muted; no hover effect | Open `/dashboard` in desktop, then mobile viewport; click does nothing |
| Visual | Breadcrumb renders "Inicio > Producción > Cultivo" on `/produccion/cultivo`; "Inicio" on `/dashboard`; truncates on 375px | Navigate the paths from the proposal's verification plan |
| Visual | Stock line "Stock actual: 38 kg" appears under the quantity Input after selecting an insumo | Open `/produccion/cultivo`, click "Registrar Nueva Labor", add an insumo row, pick an insumo with existing purchases |
| Functional | Recorded labor decrements stock on next page load | Record a labor, `router.refresh()` runs, open the form again — stock decreased by exactly the cantidad |
| Build | `npm run build` passes | Per `openspec/config.yaml` `verify.build_command: "npm run build"` |
| Lint | `npm run lint` passes | No new lint errors introduced |

## Migration / rollout

**No SQL migration.** All changes are TypeScript + CSS.

Deployment order (one PR, ~200-300 lines changed):

1. Add `src/lib/routes.ts` (new).
2. Add `src/components/breadcrumb.tsx` (new). If `npx shadcn@latest add breadcrumb` succeeds, prefer the shadcn primitive; else inline.
3. Modify `src/app/(dashboard)/layout.tsx` — disabled Reportes (desktop + mobile) + mount Breadcrumb.
4. Add `src/lib/services/stock.ts` (new).
5. Modify `src/app/(dashboard)/produccion/cultivo/page.tsx` — add tenant lookup, insumos query, stockMap build, pass to LaborManager.
6. Modify `src/components/labor-manager.tsx` — add prop, forward.
7. Modify `src/components/forms/labor-form.tsx` — add prop, render stock under input, fix broken SelectItem text.

**Rollback**: forward-revertible. Reverting commits reverses all changes. No DB impact (no migration, no schema change).

## Out of scope (tracked separately)

- `frontend-stock-display` change: same `calcularStock` helper reused in `almacigo-form.tsx` and `cultivo-form.tsx` (still reference `stock_actual` directly — see `grep` results: `almacigo-form.tsx:32,202,242`; `cultivo-form.tsx:34,246,247`).
- `validations/insumo.ts` cleanup: `stock_actual: z.coerce.number().min(0).default(0)` on line 13 is now dead.
- Type-safety cleanup: `LaborManager` and `LaborForm` use `any` for history/initialData (not introduced by this change).
- Tests: no infra in the project.
- Other 4 changes in the "Ciclo de la Campaña" plan.

## Risk analysis

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| `calcularStock` is N+1 (2N queries per page load) | Medium | Low (typical N < 100) | Document. Future change: batch into a single RPC or a `vw_stock_actual` view. |
| Unknown pathname segment breaks breadcrumb | Low | Low | Graceful fallback per spec scenario: capitalize as-is, do not crash. |
| `npx shadcn@latest add breadcrumb` fails in this env | Low | Low | Fallback: inline Tailwind + `lucide-react` `Home` + `ChevronRight`. Same visual output. |
| Disabled `<span>` looks like a link | Low | Low | Explicit `text-muted-foreground/50` + `cursor-not-allowed` + `aria-disabled="true"`. |
| Stock text wraps under the narrow `w-24` quantity input | Low | Low | `text-[10px]` + `mt-1`; verify on 375px viewport (per spec scenario "stock is visible after selection"). |
| Form re-renders fully on each insumo selection (via `form.watch` in `.map`) | Low | Low | Form is small; sub-50ms re-render. Acceptable for v1. |

## Open questions

None. All spec scenarios are implementable from the proposal + corrections above.
