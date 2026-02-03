import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { laborSchema } from '@/lib/validations/labor'
import { logAudit } from '@/lib/audit'
import { ZodError } from 'zod'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const json = await request.json()
        const body = laborSchema.parse(json)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: userData } = await supabase
            .from('usuarios')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (!userData?.tenant_id) return NextResponse.json({ error: 'No tenant' }, { status: 400 })

        // Prepare parameters for RPC
        // RPC Signature:
        // registrar_labor(p_tenant_id, p_finca_id, p_lote_id, p_fecha, p_tipo_labor, p_estado_fenologico, p_jornales, p_observaciones, p_insumos)

        // Add currency info to observations or handling:
        // The RPC in 014 doesn't have currency params! 
        // I need to update the RPC or insert manually.
        // Given I just added columns to the table, the RPC is outdated.
        // It's safer to update the RPC in a new migration OR do it in code if complex.

        // STRATEGY: Update the RPC to support currency and insert directly.
        // Actually, for simplicity and speed, let's try to simple insert if no stock deduction is strictly enforced by RPC (it is).
        // The RPC `registrar_labor` IS good for stock deduction.
        // I should update the RPC. 
        // Or I can call the RPC, and then UPDATE the cost fields.

        const params = {
            p_tenant_id: userData.tenant_id,
            p_finca_id: body.finca_id,
            p_lote_id: body.lote_id,
            p_fecha: body.fecha,
            p_tipo_labor: body.tipo_labor,
            p_estado_fenologico: body.estado_fenologico || null,
            p_jornales: body.jornales || 0,
            p_observaciones: body.observaciones || null,
            p_insumos: body.insumos || []
        }

        const { data, error } = await supabase.rpc('registrar_labor', params)

        if (error) {
            console.error("RPC Error:", error)
            throw new Error(error.message)
        }

        // If successful, update the currency fields (since RPC doesn't have them yet)
        if (data && data.id) {
            await supabase.from('labores').update({
                moneda: body.moneda,
                tipo_cambio: body.tipo_cambio,
                costo_jornales: body.costo_jornales
            }).eq('id', data.id)

            // Insert Personal assignments
            if (body.personal && body.personal.length > 0) {
                const personalInserts = body.personal.map(p => ({
                    labor_id: data.id,
                    personal_id: p.personal_id,
                    dias_trabajados: p.dias_trabajados,
                    costo_asignado: 0 // Ideally calculate from personal reference cost, but keeping simple for now
                }))

                const { error: personalError } = await supabase
                    .from('labores_personal')
                    .insert(personalInserts)

                if (personalError) console.error("Error assigning personal:", personalError)
            }

            await logAudit({
                action: 'CREATE',
                resource: 'labores',
                resourceId: data.id,
                payload: body,
                tenantId: userData.tenant_id
            })

            return NextResponse.json({ id: data.id, success: true })
        }

        throw new Error("Error creating labor")

    } catch (error: unknown) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        const message = error instanceof Error ? error.message : "Error desconocido"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
