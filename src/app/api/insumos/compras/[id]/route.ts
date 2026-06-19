import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { CreateCompraSchema } from '@/lib/validations/insumo'
import { ZodError } from 'zod'

const UpdateCompraSchema = CreateCompraSchema.partial().omit({ insumo_id: true })

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params

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
        const body = UpdateCompraSchema.parse(json)

        // Ownership check
        const { data: existing, error: fetchError } = await supabase
            .from('compras_insumos')
            .select('id, tenant_id')
            .eq('id', id)
            .eq('tenant_id', userData.tenant_id)
            .single()

        if (fetchError || !existing) {
            return NextResponse.json({ error: 'Compra not found' }, { status: 404 })
        }

        const { data, error } = await supabase
            .from('compras_insumos')
            .update({ ...body, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        await logAudit({
            action: 'UPDATE',
            resource: 'compras_insumos',
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

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params

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

        // Ownership check
        const { data: existing, error: fetchError } = await supabase
            .from('compras_insumos')
            .select('id, tenant_id')
            .eq('id', id)
            .eq('tenant_id', userData.tenant_id)
            .single()

        if (fetchError || !existing) {
            return NextResponse.json({ error: 'Compra not found' }, { status: 404 })
        }

        const { error } = await supabase
            .from('compras_insumos')
            .delete()
            .eq('id', id)

        if (error) throw error

        await logAudit({
            action: 'DELETE',
            resource: 'compras_insumos',
            resourceId: id,
            tenantId: userData.tenant_id,
        })

        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
