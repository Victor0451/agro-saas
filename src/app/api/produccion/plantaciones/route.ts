import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { plantacionSchema } from '@/lib/validations/plantacion'
import { logAudit } from '@/lib/audit'

import { ZodError } from 'zod'

export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const fincaId = searchParams.get('finca_id')

        let query = supabase
            .from('plantaciones')
            .select(`
                *,
                lote:lotes(nombre),
                almacigo:almacigos(fecha, variedad)
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
        const body = plantacionSchema.parse(json)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: userData } = await supabase
            .from('usuarios')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (!userData?.tenant_id) return NextResponse.json({ error: 'No tenant' }, { status: 400 })

        const { data, error } = await supabase
            .from('plantaciones')
            .insert({
                ...body,
                tenant_id: userData.tenant_id
            })
            .select()
            .single()

        if (error) throw error

        await logAudit({
            action: 'CREATE',
            resource: 'plantaciones',
            resourceId: data.id,
            payload: body,
            tenantId: userData.tenant_id
        })

        return NextResponse.json(data)
    } catch (error: unknown) {
        console.error('Error create plantacion:', error)
        if (error instanceof ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        const message = error instanceof Error ? error.message : "Error desconocido"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
