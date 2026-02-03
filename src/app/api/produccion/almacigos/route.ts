import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { almacigoSchema } from '@/lib/validations/almacigo'
import { logAudit } from '@/lib/audit'

import { ZodError } from 'zod'

// GET: List Almacigos
export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // We can join with insumos to get names
        // Note: Supabase JS syntax for foreign table joins.
        const { searchParams } = new URL(request.url)
        const fincaId = searchParams.get('finca_id')

        let query = supabase
            .from('almacigos')
            .select(`
        *,
        semilla:insumos!insumo_semilla_id(nombre),
        sustrato:insumos!insumo_sustrato_id(nombre)
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

// POST: Create Almacigo (Via RPC)
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const json = await request.json()

        // Validate
        const body = almacigoSchema.parse(json)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: userData } = await supabase
            .from('usuarios')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (!userData?.tenant_id) return NextResponse.json({ error: 'No tenant' }, { status: 400 })

        // Call RPC
        const { data, error } = await supabase.rpc('registrar_almacigo', {
            p_tenant_id: userData.tenant_id,
            p_finca_id: body.finca_id,
            p_fecha: body.fecha,
            p_variedad: body.variedad,
            p_cantidad_bandejas: body.cantidad_bandejas,
            p_insumo_semilla_id: body.insumo_semilla_id,
            p_semilla_usada: body.semilla_usada,
            p_insumo_sustrato_id: body.insumo_sustrato_id || null, // Handle optional/empty string
            p_sustrato_usado: body.sustrato_usado || 0,
            p_observaciones: body.observaciones || ''
        })

        if (error) throw error

        // Audit
        await logAudit({
            action: 'CREATE',
            resource: 'almacigos',
            resourceId: (data as { id: string })?.id,
            payload: body,
            tenantId: userData.tenant_id
        })

        return NextResponse.json({ success: true, id: (data as { id: string })?.id })
    } catch (error: unknown) {
        console.error('Error creating almacigo:', error)
        if (error instanceof ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        // Handle Custom Exceptions from DB (e.g. "Stock insuficiente")
        const message = error instanceof Error ? error.message : "Error desconocido"
        if (message.includes('Stock insuficiente')) {
            return NextResponse.json({ error: message }, { status: 409 }) // Conflict
        }
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
