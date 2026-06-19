import type { CreateCompraInput, CreatePresupuestoInput, UpdateInsumoInput } from '@/lib/validations/insumo'

// Re-export input types from Zod schemas
export type { CreateCompraInput, CreatePresupuestoInput, UpdateInsumoInput }

// Global catalog entry
export interface CatalogoInsumo {
    id: string
    nombre: string
    unidad_default: string
    categoria_id: string | null
    activo: boolean
    created_at: string
}

// Tenant insumo (may reference a catalog entry or be custom)
export interface Insumo {
    id: string
    tenant_id: string
    catalogo_id: string | null
    nombre: string
    unidad: string
    categoria_id: string
    activo: boolean
    created_at: string
    updated_at: string
}

export interface InsumoWithCategoria extends Insumo {
    categorias_insumos: {
        nombre: string
    } | null
}

// Purchase record
export interface CompraInsumo {
    id: string
    tenant_id: string
    insumo_id: string
    fecha_compra: string // ISO date string YYYY-MM-DD
    cantidad: number
    costo_unitario: number
    moneda: 'ARS' | 'USD'
    tipo_cambio: number
    notas: string | null
    created_at: string
    updated_at: string
}

// Purchase with joined relations
export interface CompraInsumoWithRelations extends CompraInsumo {
    insumos: {
        nombre: string
        unidad: string
        categoria_id: string
        categorias_insumos: {
            nombre: string
        } | null
    } | null
}

// Budget entry
export interface PresupuestoInsumo {
    id: string
    tenant_id: string
    categoria_id: string
    insumo_id: string | null // null = category-level budget
    periodo_mes: number | null // null = yearly budget
    periodo_anio: number
    monto_presupuestado: number
    moneda: 'ARS' | 'USD'
    created_at: string
    updated_at: string
}

export interface PresupuestoInsumoWithCategoria extends PresupuestoInsumo {
    categorias_insumos: {
        nombre: string
    } | null
}

// Return shape of get_deviation_report RPC
export interface DeviationRow {
    categoria_id: string
    categoria_nombre: string
    monto_presupuestado: number
    gasto_real: number
    desvio_monto: number
    desvio_pct: number | null
}

// Insumo-level breakdown row for DesvioTable
export interface InsumoBreakdownRow {
    insumo_id: string
    insumo_nombre: string
    categoria_id: string
    gasto_real: number
}
