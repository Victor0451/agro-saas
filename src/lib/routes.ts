/**
 * ROUTES constant for breadcrumb navigation.
 * Maps URL path segments to human-readable labels and parent hierarchy.
 */
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
}
