import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const personal_id = searchParams.get('personal_id')
        const fecha_inicio = searchParams.get('fecha_inicio')
        const fecha_fin = searchParams.get('fecha_fin')

        if (!fecha_inicio || !fecha_fin) {
            return NextResponse.json({ error: 'Fechas requeridas' }, { status: 400 })
        }

        const supabase = await createClient()

        // Filter pending labors (liquidacion_id IS NULL) using !inner join for date filtering
        let query = supabase
            .from('labores_personal')
            .select(`
                id,
                personal_id,
                dias_trabajados,
                costo_asignado,
                labor:labores!inner (
                    id,
                    fecha,
                    tipo_labor,
                    lote:lotes (nombre),
                    finca_id
                ),
                personal:personal!inner (
                    id,
                    nombre,
                    costo_jornal_referencia
                )
            `)
            .is('liquidacion_id', null)
            .gte('labor.fecha', fecha_inicio)
            .lte('labor.fecha', fecha_fin)
            .order('created_at', { ascending: true })

        if (personal_id && personal_id !== 'all') {
            query = query.eq('personal_id', personal_id)
        }

        const { data, error } = await query

        if (error) {
            console.error("Supabase Preview Error:", error)
            throw new Error(error.message)
        }

        // Group results by Personal
        const summary = (data || []).reduce((acc: any, curr: any) => {
            const personalObj = curr.personal
            if (!personalObj?.id) return acc

            const pid = personalObj.id
            if (!acc[pid]) {
                acc[pid] = {
                    personal: personalObj,
                    items: [],
                    total_dias: 0,
                    total_pagar: 0
                }
            }

            acc[pid].items.push(curr)
            acc[pid].total_dias += Number(curr.dias_trabajados || 0)
            acc[pid].total_pagar += Number(curr.costo_asignado || 0)

            return acc
        }, {})

        return NextResponse.json({
            data: Object.values(summary)
        })

    } catch (error) {
        console.error("Preview API Error:", error)
        return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 })
    }
}
