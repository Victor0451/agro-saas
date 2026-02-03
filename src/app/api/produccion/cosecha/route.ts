import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cosechaSchema } from '@/lib/validations/cosecha'
import { logAudit } from '@/lib/audit'

import { ZodError } from 'zod'

export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const fincaId = searchParams.get('finca_id')

        let query = supabase
            .from('cosechas')
            .select(`
                *,
                lote:lotes(nombre)
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
        const body = cosechaSchema.parse(json)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: userData } = await supabase
            .from('usuarios')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (!userData?.tenant_id) return NextResponse.json({ error: 'No tenant' }, { status: 400 })

        const { data, error } = await supabase
            .from('cosechas')
            .insert({
                tenant_id: userData.tenant_id,
                finca_id: body.finca_id,
                lote_id: body.lote_id,
                fecha: body.fecha,
                kilos_brutos: body.kilos_brutos,
                cantidad_bultos: body.cantidad_bultos || 0,
                clase: body.clase || null,
                observaciones: body.observaciones || ''
            })
            .select()
            .single()

        if (error) throw error

        await logAudit({
            action: 'CREATE',
            resource: 'cosechas',
            resourceId: data.id,
            payload: body,
            tenantId: userData.tenant_id
        })

        return NextResponse.json(data)
    } catch (error: unknown) {
        console.error('Error creating cosecha:', error)
        if (error instanceof ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        const message = error instanceof Error ? error.message : "Error desconocido"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
