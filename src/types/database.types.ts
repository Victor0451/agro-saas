export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            tenants: {
                Row: {
                    id: string
                    nombre: string
                    slug: string
                    configuracion: Json
                    activo: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    nombre: string
                    slug: string
                    configuracion?: Json
                    activo?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    nombre?: string
                    slug?: string
                    configuracion?: Json
                    activo?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            fincas: {
                Row: {
                    id: string
                    tenant_id: string
                    nombre: string
                    superficie_total: number | null
                    rendimiento_esperado: number | null
                    produccion_total: number | null
                    b1f_2025: number | null
                    configuracion: Json
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    nombre: string
                    superficie_total?: number | null
                    rendimiento_esperado?: number | null
                    produccion_total?: number | null
                    b1f_2025?: number | null
                    configuracion?: Json
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    nombre?: string
                    superficie_total?: number | null
                    rendimiento_esperado?: number | null
                    produccion_total?: number | null
                    b1f_2025?: number | null
                    configuracion?: Json
                    created_at?: string
                    updated_at?: string
                }
            }
            lotes: {
                Row: {
                    id: string
                    tenant_id: string
                    finca_id: string
                    nombre: string
                    superficie: number | null
                    variedad: string | null
                    activo: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    finca_id: string
                    nombre: string
                    superficie?: number | null
                    variedad?: string | null
                    activo?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    finca_id?: string
                    nombre?: string
                    superficie?: number | null
                    variedad?: string | null
                    activo?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            almacigos: {
                Row: {
                    id: string
                    tenant_id: string
                    fecha: string
                    variedad: string | null
                    cantidad_bandejas: number | null
                    semilla_usada: number | null
                    sustrato_usado: number | null
                    observaciones: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    fecha: string
                    variedad?: string | null
                    cantidad_bandejas?: number | null
                    semilla_usada?: number | null
                    sustrato_usado?: number | null
                    observaciones?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    fecha?: string
                    variedad?: string | null
                    cantidad_bandejas?: number | null
                    semilla_usada?: number | null
                    sustrato_usado?: number | null
                    observaciones?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            // Add other tables as needed (shortened for brevity in this manual step, but should be complete in real app)
        }
    }
}
