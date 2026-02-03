import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { laborSchema } from '@/lib/validations/labor'
import { logAudit } from '@/lib/audit'

import { ZodError } from 'zod'

export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const fincaId = searchParams.get('finca_id')

        let query = supabase
            .from('labores')
            .select(`
                *,
                lote:lotes(nombre),
                detalles:labores_insumos(
                    cantidad,
                    insumo:insumos(nombre, unidad)
                )
            `)
            .order('fecha', { ascending: false })

        if (fincaId) {
            query = query.eq('finca_id', fincaId)
        }

        const { data, error } = await query

        if (error) throw error

        return NextResponse.json(data)
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Error desconocido"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

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

        const { data, error } = await supabase.rpc('registrar_labor', {
            p_tenant_id: userData.tenant_id,
            p_finca_id: body.finca_id,
            p_lote_id: body.lote_id,
            p_fecha: body.fecha,
            p_tipo_labor: body.tipo_labor,
            p_estado_fenologico: body.estado_fenologico || null,
            p_jornales: body.jornales || 0,
            p_observaciones: body.observaciones || '',
            p_insumos: body.insumos || []
        })

        if (error) throw error

        await logAudit({
            action: 'CREATE',
            resource: 'labores',
            resourceId: (data as { id: string })?.id,
            payload: body,
            tenantId: userData.tenant_id
        })

        return NextResponse.json(data)
    } catch (error: unknown) {
        console.error('Error recording labor:', error)
        if (error instanceof ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        const message = error instanceof Error ? error.message : "Error desconocido"
        if (message.includes('Stock insuficiente')) {
            return NextResponse.json({ error: message }, { status: 409 })
        }
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
