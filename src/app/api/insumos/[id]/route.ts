import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { UpdateInsumoSchema } from '@/lib/validations/insumo'
import { ZodError } from 'zod'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params

        // Auth
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

        const json = await request.json()
        const body = UpdateInsumoSchema.parse(json)

        // Ownership check — insumo must belong to current tenant
        const { data: existing, error: fetchError } = await supabase
            .from('insumos')
            .select('id, tenant_id')
            .eq('id', id)
            .eq('tenant_id', userData.tenant_id)
            .single()

        if (fetchError || !existing) {
            return NextResponse.json({ error: 'Insumo not found' }, { status: 404 })
        }

        // Update
        const { data, error } = await supabase
            .from('insumos')
            .update({ ...body, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        await logAudit({
            action: 'UPDATE',
            resource: 'insumos',
            resourceId: id,
            payload: body,
            tenantId: userData.tenant_id,
        })

        return NextResponse.json(data)
    } catch (error: unknown) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
