# Spec: workflow-breadcrumb

> Delta spec for change `workflow-foundations`. After archive, becomes canonical at `openspec/specs/workflow-breadcrumb/spec.md`.

## Purpose

The dashboard layout SHALL provide spatial orientation for operators by showing the current page's position in the app hierarchy, AND SHALL communicate upcoming features without breaking the UX with dead links.

## Requirements

### Requirement: breadcrumb component
The system SHALL render a breadcrumb component above the page title on every dashboard route, AND SHALL render the current page segment as non-clickable plain text while rendering previous segments as clickable links.

#### Scenario: dashboard route has breadcrumb
- GIVEN the user is on `/dashboard`
- WHEN the dashboard page renders
- THEN a breadcrumb is visible with text "Inicio"

#### Scenario: nested route has full path
- GIVEN the user is on `/produccion/cultivo`
- WHEN the page renders
- THEN breadcrumb shows "Inicio > Producción > Cultivo"

#### Scenario: deep route has full chain
- GIVEN the user is on `/insumos/compras/historial`
- WHEN the page renders
- THEN breadcrumb shows "Inicio > Insumos > Compras > Historial"

#### Scenario: last segment is not clickable
- GIVEN a breadcrumb is rendered
- WHEN the user looks at the last segment
- THEN it is visually distinct (e.g., `font-medium` or muted color) and not wrapped in a `<Link>`

#### Scenario: previous segments are clickable
- GIVEN a breadcrumb is rendered
- WHEN the user looks at any non-last segment
- THEN it is wrapped in a `<Link>` that navigates to the parent path

#### Scenario: route not in config degrades gracefully
- GIVEN the user is on a path not declared in `ROUTES`
- WHEN the page renders
- THEN the breadcrumb shows only the "Inicio" segment (no broken labels, no crash)

### Requirement: route config
The system SHALL provide `src/lib/routes.ts` exporting a `ROUTES` constant that maps URL path segments to human-readable Spanish labels, with an optional `parent` field for hierarchy.

#### Scenario: routes constant exists
- WHEN the file is imported
- THEN it exports a `ROUTES` object keyed by URL path

#### Scenario: routes constant shape
- WHEN the constant is used
- THEN each entry has a `label: string` and optionally a `parent?: string` for hierarchy

#### Scenario: routes constant covers all dashboard paths
- WHEN the constant is used
- THEN it includes at least: `dashboard`, `produccion`, `cultivo`, `insumos`, `compras`, `historial`, `presupuesto`, `informe`, `personal`, `liquidacion`, `almacigos`, `plantacion`, `cosecha`, `curado`, `estufas`, `fincas`, `lotes`, `reportes`

### Requirement: /reportes link is disabled
The system SHALL render the "Reportes" item in the dashboard sidebar (both desktop sidebar and mobile Sheet) as a non-clickable, visually muted menu item with text "Reportes · próximamente".

#### Scenario: desktop sidebar disabled
- GIVEN the user is on a dashboard route
- WHEN the desktop sidebar renders
- THEN the Reportes item is visible but not clickable
- AND it has muted styling (e.g., `text-muted-foreground/50 cursor-not-allowed`)

#### Scenario: mobile Sheet disabled
- GIVEN the user opens the mobile nav Sheet
- WHEN it renders
- THEN the Reportes item has the same disabled treatment as desktop

#### Scenario: disabled item does not navigate
- GIVEN the Reportes item is rendered as disabled
- WHEN the user clicks or taps it
- THEN no navigation occurs and the URL remains unchanged
