import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { insumoSchema } from '@/lib/validations/insumo'

import { ZodError } from 'zod'

export async function GET() {
    try {
        const supabase = await createClient()

        // Fetch insumos with category name
        const { data, error } = await supabase
            .from('insumos')
            .select('*, categorias_insumos (nombre)')
            .order('nombre')

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

        const body = insumoSchema.parse(json)

        // Get Tenant
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

        // Insert
        const { data, error } = await supabase
            .from('insumos')
            .insert({
                ...body,
                tenant_id: userData.tenant_id
            })
            .select()
            .single()

        if (error) throw error

        // Audit
        await logAudit({
            action: 'CREATE',
            resource: 'insumos',
            resourceId: data.id,
            payload: body,
            tenantId: userData.tenant_id
        })

        return NextResponse.json(data)
    } catch (error: unknown) {
        console.error('Error creating insumo:', error)
        if (error instanceof ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        const message = error instanceof Error ? error.message : "Error desconocido"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
