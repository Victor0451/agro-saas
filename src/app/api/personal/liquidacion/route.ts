import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'

export async function POST(request: Request) {
    try {
        const json = await request.json()
        const { personal_id, periodo_inicio, periodo_fin, items, total_dias, total_pagar } = json

        if (!personal_id || !items || !items.length) {
            return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
        }

        const supabase = await createClient()

        // 1. Create Liquidacion Record
        const { data: liq, error: liqError } = await supabase
            .from('liquidaciones')
            .insert({
                personal_id,
                periodo_inicio,
                periodo_fin,
                total_dias,
                total_a_pagar: total_pagar,
                fecha_liquidacion: new Date().toISOString()
            })
            .select()
            .single()

        if (liqError) throw new Error(liqError.message)

        // 2. Update Labores
        const itemIds = items.map((i: any) => i.id)
        const { error: updateError } = await supabase
            .from('labores_personal')
            .update({ liquidacion_id: liq.id })
            .in('id', itemIds)

        if (updateError) throw new Error("Error linking labors: " + updateError.message)

        await logAudit({
            action: 'CREATE',
            resource: 'liquidaciones',
            resourceId: liq.id,
            payload: { personal_id, total: total_pagar },
            tenantId: 'system' // can fetch from user context if critical
        })

        return NextResponse.json({ success: true, id: liq.id })

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 })
    }
}
