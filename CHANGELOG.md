# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Nota:** A partir de v0.3.0, la documentación del proyecto (estado, issues, decisiones, estándares, manuales, specs de módulos) vive en el vault de Obsidian, **fuera del repositorio**. El repo contiene código + artefactos SDD (carpeta `openspec/`). Path del vault: `/run/media/vlongo/Archivos/obsidian/Projectos/AGRO-SAAS/`.

## [0.3.0] - 2026-06-19

### Security — Multi-tenant RPC hardening (SDD change `security-hardening`)

- **New helper** `public.assert_caller_tenant(p_expected_tenant uuid) RETURNS void` (migration 035) — `SECURITY DEFINER STABLE`, `SET search_path = public, auth`. Lee `auth.jwt() ->> 'tenant_id'` (top-level claim set by migration 033 custom hook) con fallback a `SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()`. Raises SQLSTATE `42501` con errcode `tenant_mismatch` si hay mismatch o NULL.
- **New helper** `public.assert_caller_has_no_tenant() RETURNS void` — Raises `42501 already_has_tenant` si el caller ya tiene tenant asignado.
- **Patched SECURITY DEFINER RPCs** with `PERFORM assert_caller_tenant(...)`:
  - `registrar_labor` (migration 032)
  - `seed_tenant_insumos` (migration 029)
  - `get_deviation_report` (migration 031)
- **Patched** `create_owner_tenant` with strict `assert_caller_has_no_tenant` guard (single-tenant-per-user SaaS assumption).
- **Rewritten** `registrar_almacigo` (preserving signature) — derives stock from `compras_insumos` ledger minus `almacigos.semilla|sustrato_usado` minus `labores_insumos.cantidad`, scoped per tenant. Race-safe via `ISOLATION LEVEL SERIALIZABLE`. Raises `23514` for `insufficient_stock_*`.
- **Dropped** `registrar_plantacion` — orphaned (0 callers in `src/`), `plantaciones` table is populated via direct INSERT in `src/app/api/produccion/plantaciones/route.ts`.
- **TS fix** in `src/app/api/produccion/almacigos/route.ts` — maps SQLSTATE `40001` (serialization_failure) to HTTP 409.

### Added — Insumos module (complete)

Catálogo global + tenant-seeded, compras en ARS/USD con auto-fetch de dólar blue, presupuestos mensuales/anuales, e informe de desvío con gráfico Recharts.

- **Catálogo global** (`catalogo_insumos`, migration 024): 41 insumos semilla compartidos por todos los tenants. RLS `USING (true)` para authenticated.
- **Tenant seeding** (`seed_tenant_insumos` RPC, migration 029): al crear un tenant nuevo, copia el catálogo activo a `insumos` del tenant. Backfill de tenants existentes.
- **Compras** (`compras_insumos`, migration 026): ledger de compras con `moneda` + `tipo_cambio`. Form con auto-fetch de cotización blue cuando se elige USD. Historial con filtros.
- **Presupuestos** (`presupuestos_insumos`, migration 027): monto por (tenant, categoría|insumo, mes, año) con `UNIQUE NULLS NOT DISTINCT`. CRUD con AlertDialog.
- **Informe de desvío** (`get_deviation_report` RPC, migrations 028 → 030 → 031): budget vs. real por categoría/insumo, conversión ARS↔USD configurable.
- **Stock mínimo por insumo** (`insumos.stock_minimo`, migration 034): cada insumo define su propio umbral configurable.
- **UI**: 4 páginas nuevas en `/insumos/*` (catálogo, compras, historial, presupuesto, informe). Componentes: `insumo-form`, `compra-insumo-form`, `presupuesto-insumo-form`, `insumo-edit-dialog`, `add-from-catalogo-dialog`, `desvio-table`.
- **API**: 5 nuevas rutas en `src/app/api/insumos/*` (catalogo, compras, compras/[id], presupuesto, presupuesto/[id], informe, dolar-blue, [id]).
- **Tipos**: `src/types/insumos.ts` (CatalogoInsumo, Insumo, CompraInsumo, PresupuestoInsumo, DeviationRow, InsumoBreakdownRow).
- **Validaciones Zod completadas** en `src/lib/validations/insumo.ts`: `CreateCompraSchema` (con `.refine()` para fecha no futura), `CreatePresupuestoSchema`, `UpdatePresupuestoSchema`, `UpdateInsumoSchema`, helper `stockMinimoDefault(unidad)`.

### Added — Auth & Middleware

- **JWT tenant_id claim** (`custom_access_token_hook`, migration 033): embed de `tenant_id` como claim custom al token de Supabase Auth.
- **`src/proxy.ts`**: nueva entrada de middleware (Next.js 16 renombró `middleware.ts` → `proxy.ts`). Lee `tenant_id` del JWT claim.
- **Password reset**: nueva página `/auth/reset-password` con `updateUser({ password })`.

### Added — Refactors de infraestructura

- **`src/lib/api.ts`** (359 líneas): capa centralizada de fetch con namespace `api.*` agrupado por dominio. Regla: nunca `fetch('/api/...')` directo.
- **`src/components/nav-link.tsx`**: `<Link>` con estado activo via `usePathname`.
- **`src/components/dashboard/dolar-ticker.tsx`**: 3 cards con cotizaciones oficial/blue/mep.
- **`src/lib/services/dolar-api.ts`**: `getDolarQuotations()` con `revalidate: 3600` + `formatCurrency`.

### Added — Producción

- **Curado** (`curados` + `estufas`): flujo de post-cosecha con carga en estufas, peso verde/seco, costo. CRUD de estufas.
- **Liquidaciones de personal** (`liquidaciones` + `labores_personal.liquidacion_id`): wizard con date-range picker + preview + historial.

### Changed

- **Modelo de datos**: `insumos` se simplificó (migration 025) — dropeó `stock_actual`, `costo_unitario`, `fecha_compra`, `moneda`, `tipo_cambio`. Esos viven ahora en `compras_insumos` (ledger). Stock se calcula derivado.
- **Multicurrency** (migrations 017 → 019 → 032): 8 tablas tienen `moneda` + `tipo_cambio`. La labor incluye ambos campos en la RPC atómica.
- **RLS en `labores`**: consolidada de 3 policies a 1 ALL policy (migration 021).
- **Migración 023**: categorías de insumos reemplazadas (destructivo DELETE + INSERT). Pre-producción con seed canónico de 7 categorías.

### Fixed

- **Auth hook rotation bug**: trigger `handle_new_user` usaba columna `active` que no existía (era `activo`). Corregido en migration 016.
- **Server Action crash en SSR**: `createClient()` en `onboarding/page.tsx` movido dentro del handler.
- **Env vars**: `.env.local` con separador `:` en vez de `=` — variables no se cargaban.
- **Middleware conflict**: `src/middleware.ts` y `src/proxy.ts` no podían coexistir en Next.js 16. Eliminado `middleware.ts` (replaced by `src/proxy.ts`).
- **Form sync**: edit form no populaba data en inicialización (`liquidacion-manager`, `labor-form`).
- **Controlled vs uncontrolled inputs**: warning de React en `labor-form`.
- **API reliability**: query alias mismatch en liquidación preview.

### Security

- **JWT claim custom**: `tenant_id` ahora vive en el JWT (no requiere DB lookup por request) — requires manual activation in Supabase Dashboard.
- **API protection**: tenant_id validado en cada write operation.
- **Audit log**: `logAudit()` extendido para capturar `resource_id` y `tenant_id` correctamente.

### Known issues (pendientes para próximas versiones)

Críticos:
- 🔴 Auth hook (migration 033) requiere activación manual en Supabase Dashboard (Auth → Hooks → `custom_access_token_hook`).
- 🟡 Regresión: `next.config.mjs:12-27` reintroduce 4× `console.log('DEBUG CONFIG ...')`.
- 🟡 `/admin` route group accesible sin autenticación.
- 🟡 Frontend stock display: 3 forms (`almacigo-form.tsx`, `labor-form.tsx`, `cultivo-form.tsx`) referencian `insumos.stock_actual` dropeado en migration 025.

Deuda técnica (~20 items agrupados por categoría) documentada en el vault de Obsidian.

---

## [0.2.0] - 2026-02-03

### Added
- **Liquidation Module**: New system for grouping pending labor records (`labores_personal`) and generating personnel payments.
- **Liquidation Manager**: Interactive UI with "Nueva Liquidación" (Preview) and "Historial" tabs.
- **Labor Management Actions**: Implemented Edit and Delete functionality for the Cultivo (Labor) history table.
- **Table Pagination & Sorting**: Standardized pagination, rows per page selector (10, 15, 25, 50, 100), and descending date sorting for historical records.

### Changed
- **UX Standards update**: Added documented patterns for "Editing Visual Feedback" and "Table/Pagination patterns" into `UX_STANDARDS.md`.
- **UI Enhancements**: Added "Modo Edición" visual feedback (yellow ring + shadow) to forms when editing active records.
- **Navigation**: Integrated "Liquidaciones" into the main dashboard sidebar.

### Fixed
- **Form Synchronization**: Fixed issue where the Edit form failed to populate data on initialization.
- **Controlled Input Errors**: Resolved React warnings regarding controlled vs uncontrolled inputs in `LaborForm`.
- **API Reliability**: Fixed query alias mismatch in the liquidation previsualization endpoint.

## [0.1.0] - 2026-02-02

### Added
- **Multi-Tenant Support**: Full implementation of organization-based data isolation using RLS.
- **Onboarding Flow**: New `/onboarding` page for creating organizations after registration.
- **Production Modules**:
    - `Almácigos`: Seedbed management and tray tracking.
    - `Cultivo`: Cultural labor recording (irrigation, fertilization).
    - `Cosecha`: Harvest data entry.
- **History Tracking**: Visual history components for all production stages.
- **Forms**: Comprehensive forms with Zod validation for Fincas, Lotes, Insumos, and Labores.

### Changed
- **Type Safety Overhaul**: Replaced widespread use of `any` types with strict TypeScript interfaces (`Finca`, `Insumo`, `AlmacigoHistoryItem`, etc.).
- **Error Handling**: Standardized API error responses and frontend catch blocks to use `unknown` type guards and `ZodError` checks.
- **UI Improvements**: Updated `Layout` and navigation structure for better responsiveness.
- **Performance**: Optimized `useEffect` dependencies and memoized data fetching in critical dashboard pages.

### Fixed
- **Linting Errors**: Resolved all ESLint warnings including `no-explicit-any`, unused variables, and exhausted-deps in hooks.
- **Build Process**: Fixed production build failures related to strict type checking.
- **Duplicate Declarations**: Corrected variable shadowing issues in `almacigos/page.tsx`.
- **Layout Imports**: Restored missing icon imports in the main dashboard layout.

### Security
- **Audit Logging**: Enhanced `logAudit` function to accurately capture resource IDs and tenant context.
- **API Protection**: Enforced tenant ID validation on critical write operations.
