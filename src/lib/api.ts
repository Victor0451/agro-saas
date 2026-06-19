/**
 * Centralized API client for all internal fetch calls.
 * Every component should import from here — never call fetch('/api/...') directly.
 *
 * Pattern:
 *   - GET  → returns typed data, throws ApiError on failure
 *   - POST/PUT/DELETE → returns typed data or void, throws ApiError on failure
 */

import type {
    Insumo,
    InsumoWithCategoria,
    CatalogoInsumo,
    CompraInsumoWithRelations,
    PresupuestoInsumoWithCategoria,
    DeviationRow,
    InsumoBreakdownRow,
    CreateCompraInput,
    CreatePresupuestoInput,
    UpdateInsumoInput,
} from "@/types/insumos"

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

export class ApiError extends Error {
    constructor(
        public readonly status: number,
        message: string,
    ) {
        super(message)
        this.name = "ApiError"
    }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(path, options)

    if (!res.ok) {
        let message = `Error ${res.status}`
        try {
            const body = await res.json()
            message = body.error ?? body.message ?? message
        } catch {
            // response body is not JSON — use status text
            message = res.statusText || message
        }
        throw new ApiError(res.status, message)
    }

    // 204 No Content — return undefined cast to T
    if (res.status === 204) return undefined as T

    return res.json() as Promise<T>
}

function get<T>(path: string): Promise<T> {
    return request<T>(path)
}

function post<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    })
}

function put<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    })
}

function del<T = void>(path: string): Promise<T> {
    return request<T>(path, { method: "DELETE" })
}

// ---------------------------------------------------------------------------
// Shared types (non-insumos)
// ---------------------------------------------------------------------------

export interface CategoriaInsumo {
    id: string
    nombre: string
    descripcion: string | null
}

export interface InsumoOption {
    id: string
    nombre: string
    unidad: string
    activo: boolean
    stock_minimo: number | null
    categorias_insumos?: { nombre: string } | null
}

export interface DolarBlueResponse {
    compra: number
    venta: number
    fecha: string
}

// Matches actual API response from /api/insumos/informe
export interface InformeResponse {
    report: DeviationRow[]
    breakdown: InsumoBreakdownRow[]
}

// Matches actual API response from /api/personal/liquidacion/preview
export interface LiquidacionPreviewItem {
    personal: { id: string; nombre: string; costo_jornal_referencia: number }
    items: unknown[]
    total_dias: number
    total_pagar: number
}

export interface LiquidacionPreviewResponse {
    data: LiquidacionPreviewItem[]
}

export interface Lote {
    id: string
    nombre: string
    finca_id: string
    superficie_ha: number | null
}

export interface Almacigo {
    id: string
    nombre: string
    finca_id: string
}

export interface Personal {
    id: string
    nombre: string
    apellido: string
    dni: string | null
    activo: boolean
}

// ---------------------------------------------------------------------------
// API namespace
// ---------------------------------------------------------------------------

export const api = {

    // -----------------------------------------------------------------------
    // Insumos — categorías
    // -----------------------------------------------------------------------
    categorias: {
        list(): Promise<CategoriaInsumo[]> {
            return get("/api/insumos/categorias")
        },
    },

    // -----------------------------------------------------------------------
    // Insumos — catálogo global
    // -----------------------------------------------------------------------
    catalogo: {
        list(params?: { categoria_id?: string }): Promise<CatalogoInsumo[]> {
            const qs = params?.categoria_id ? `?categoria_id=${params.categoria_id}` : ""
            return get(`/api/insumos/catalogo${qs}`)
        },
        add(catalogoId: string): Promise<Insumo> {
            return post("/api/insumos/catalogo", { catalogo_id: catalogoId })
        },
    },

    // -----------------------------------------------------------------------
    // Insumos — catálogo del tenant
    // -----------------------------------------------------------------------
    insumos: {
        list(params?: { categoria_id?: string; finca_id?: string }): Promise<InsumoWithCategoria[]> {
            const qs = new URLSearchParams()
            if (params?.categoria_id) qs.set("categoria_id", params.categoria_id)
            if (params?.finca_id) qs.set("finca_id", params.finca_id)
            const query = qs.toString() ? `?${qs.toString()}` : ""
            return get(`/api/insumos${query}`)
        },
        create(data: Record<string, unknown>): Promise<Insumo> {
            return post("/api/insumos", data)
        },
        update(id: string, data: UpdateInsumoInput): Promise<Insumo> {
            return put(`/api/insumos/${id}`, data)
        },
        disable(id: string): Promise<Insumo> {
            return put(`/api/insumos/${id}`, { activo: false })
        },
    },

    // -----------------------------------------------------------------------
    // Insumos — compras
    // -----------------------------------------------------------------------
    compras: {
        // Route returns CompraInsumoWithRelations[] directly (bare array)
        list(params?: {
            categoria_id?: string
            insumo_id?: string
            from?: string
            to?: string
        }): Promise<CompraInsumoWithRelations[]> {
            const qs = new URLSearchParams()
            if (params?.categoria_id) qs.set("categoria_id", params.categoria_id)
            if (params?.insumo_id) qs.set("insumo_id", params.insumo_id)
            if (params?.from) qs.set("fecha_desde", params.from)
            if (params?.to) qs.set("fecha_hasta", params.to)
            return get(`/api/insumos/compras?${qs.toString()}`)
        },
        create(data: CreateCompraInput): Promise<{ id: string }> {
            return post("/api/insumos/compras", data)
        },
    },

    // -----------------------------------------------------------------------
    // Insumos — presupuesto
    // -----------------------------------------------------------------------
    presupuesto: {
        list(params: { anio: number; mes?: number | null }): Promise<PresupuestoInsumoWithCategoria[]> {
            const qs = new URLSearchParams({ anio: String(params.anio) })
            if (params.mes != null) qs.set("mes", String(params.mes))
            return get(`/api/insumos/presupuesto?${qs.toString()}`)
        },
        create(data: CreatePresupuestoInput): Promise<{ id: string }> {
            return post("/api/insumos/presupuesto", data)
        },
        update(id: string, data: CreatePresupuestoInput): Promise<{ id: string }> {
            return put(`/api/insumos/presupuesto/${id}`, data)
        },
        delete(id: string): Promise<void> {
            return del(`/api/insumos/presupuesto/${id}`)
        },
    },

    // -----------------------------------------------------------------------
    // Insumos — informe de desvío
    // -----------------------------------------------------------------------
    informe: {
        // Route returns { report: DeviationRow[], breakdown: InsumoBreakdownRow[] }
        get(params: {
            anio: number
            mes?: number | null
            tipo_cambio_ref?: number
            moneda_salida?: "ARS" | "USD"
        }): Promise<InformeResponse> {
            const qs = new URLSearchParams({ anio: String(params.anio) })
            if (params.mes != null) qs.set("mes", String(params.mes))
            if (params.tipo_cambio_ref != null) qs.set("tipo_cambio_ref", String(params.tipo_cambio_ref))
            if (params.moneda_salida) qs.set("moneda_salida", params.moneda_salida)
            return get(`/api/insumos/informe?${qs.toString()}`)
        },
    },

    // -----------------------------------------------------------------------
    // Dólar blue
    // -----------------------------------------------------------------------
    dolarBlue: {
        get(): Promise<DolarBlueResponse> {
            return get("/api/insumos/dolar-blue")
        },
    },

    // -----------------------------------------------------------------------
    // Lotes
    // -----------------------------------------------------------------------
    lotes: {
        list(params?: { finca_id?: string }): Promise<Lote[]> {
            const qs = params?.finca_id ? `?finca_id=${params.finca_id}` : ""
            return get(`/api/lotes${qs}`)
        },
        create(data: Record<string, unknown>): Promise<Lote> {
            return post("/api/lotes", data)
        },
    },

    // -----------------------------------------------------------------------
    // Personal
    // -----------------------------------------------------------------------
    personal: {
        list(): Promise<Personal[]> {
            return get("/api/personal")
        },
        liquidacion: {
            // Route expects: personal_id (optional), fecha_inicio, fecha_fin
            // Returns: { data: LiquidacionPreviewItem[] }
            preview(params: {
                personal_id?: string
                fecha_inicio: string
                fecha_fin: string
            }): Promise<LiquidacionPreviewResponse> {
                const qs = new URLSearchParams({
                    fecha_inicio: params.fecha_inicio,
                    fecha_fin: params.fecha_fin,
                })
                if (params.personal_id) qs.set("personal_id", params.personal_id)
                return get(`/api/personal/liquidacion/preview?${qs.toString()}`)
            },
            create(data: Record<string, unknown>): Promise<{ id: string }> {
                return post("/api/personal/liquidacion", data)
            },
        },
    },

    // -----------------------------------------------------------------------
    // Producción
    // -----------------------------------------------------------------------
    produccion: {
        almacigos: {
            list(params?: { finca_id?: string }): Promise<Almacigo[]> {
                const qs = params?.finca_id ? `?finca_id=${params.finca_id}` : ""
                return get(`/api/produccion/almacigos${qs}`)
            },
            create(data: Record<string, unknown>): Promise<Almacigo> {
                return post("/api/produccion/almacigos", data)
            },
        },
        cultivo: {
            create(data: Record<string, unknown>): Promise<{ id: string }> {
                return post("/api/produccion/cultivo", data)
            },
            delete(id: string): Promise<void> {
                return del(`/api/produccion/cultivo/${id}`)
            },
        },
        cosecha: {
            create(data: Record<string, unknown>): Promise<{ id: string }> {
                return post("/api/produccion/cosecha", data)
            },
        },
        estufa: {
            create(data: Record<string, unknown>): Promise<{ id: string }> {
                return post("/api/produccion/estufa", data)
            },
        },
        curado: {
            create(data: Record<string, unknown>): Promise<{ id: string }> {
                return post("/api/produccion/curado", data)
            },
        },
        plantacion: {
            create(data: Record<string, unknown>): Promise<{ id: string }> {
                return post("/api/produccion/plantacion", data)
            },
        },
    },

    // -----------------------------------------------------------------------
    // Tenants
    // -----------------------------------------------------------------------
    tenants: {
        create(data: Record<string, unknown>): Promise<{ tenant_id: string }> {
            return post("/api/tenants/create", data)
        },
    },
}
