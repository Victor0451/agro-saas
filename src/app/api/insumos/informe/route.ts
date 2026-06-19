import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { DeviationRow, InsumoBreakdownRow } from '@/types/insumos'

export async function GET(request: Request) {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: userData } = await supabase
            .from('usuarios')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (!userData?.tenant_id) {
            return NextResponse.json({ error: 'User not assigned to a tenant' }, { status: 400 })
        }

        const { searchParams } = new URL(request.url)
        const anio = searchParams.get('anio')
        const mes = searchParams.get('mes')
        const tipoCambio = searchParams.get('tipo_cambio_ref')
        const monedaSalida = searchParams.get('moneda_salida') ?? 'ARS'

        if (!anio) {
            return NextResponse.json({ error: 'El parámetro "anio" es requerido' }, { status: 400 })
        }

        const p_anio = parseInt(anio, 10)
        const p_mes = mes ? parseInt(mes, 10) : null
        const p_tipo_cambio_ref = tipoCambio ? parseFloat(tipoCambio) : 1
        const p_moneda_salida = monedaSalida === 'USD' ? 'USD' : 'ARS'

        const { data, error } = await supabase.rpc('get_deviation_report', {
            p_tenant_id: userData.tenant_id,
            p_anio,
            p_mes,
            p_tipo_cambio_ref,
            p_moneda_salida,
        })

        if (error) throw error

        // Compute date range for insumo-level breakdown query
        const startDate = p_mes != null
            ? `${p_anio}-${String(p_mes).padStart(2, '0')}-01`
            : `${p_anio}-01-01`
        const endDate = p_mes != null
            ? new Date(p_anio, p_mes, 0).toISOString().slice(0, 10) // last day of month
            : `${p_anio}-12-31`

        // Fetch insumo-level breakdown
        const { data: rawBreakdown } = await supabase
            .from('compras_insumos')
            .select(`
                insumo_id,
                cantidad,
                costo_unitario,
                moneda,
                tipo_cambio,
                insumos!inner(nombre, categoria_id)
            `)
            .eq('tenant_id', userData.tenant_id)
            .gte('fecha_compra', startDate)
            .lte('fecha_compra', endDate)

        // Group by insumo client-side
        const breakdownMap = new Map<string, InsumoBreakdownRow>()
        for (const row of rawBreakdown ?? []) {
            const insumo = row.insumos as unknown as { nombre: string; categoria_id: string }
            const gasto = row.cantidad * row.costo_unitario *
                (row.moneda === 'USD' ? row.tipo_cambio : 1)
            const existing = breakdownMap.get(row.insumo_id)
            if (existing) {
                existing.gasto_real += gasto
            } else {
                breakdownMap.set(row.insumo_id, {
                    insumo_id: row.insumo_id,
                    insumo_nombre: insumo.nombre,
                    categoria_id: insumo.categoria_id,
                    gasto_real: gasto,
                })
            }
        }
        const breakdown: InsumoBreakdownRow[] = Array.from(breakdownMap.values())

        return NextResponse.json({ report: data as DeviationRow[], breakdown })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
