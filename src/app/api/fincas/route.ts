import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { fincaSchema } from '@/lib/validations/finca'

import { ZodError } from 'zod'

export async function GET() {
    try {
        const supabase = await createClient()

        // RLS filters automatically by tenant
        const { data, error } = await supabase
            .from('fincas')
            .select('*')
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

        // Validate payload
        const body = fincaSchema.parse(json)

        // Get current tenant (handled by RLS policies generally, but for insert we rely on default or explicit)
        // Actually, for Insert with RLS, the policy needs to allow it.
        // AND the 'tenant_id' column must be set.
        // Our 'get_current_tenant_id' function helps read policies, but inserting requires providing the ID
        // OR having a default value in DB getting it from context.
        // As we haven't set up a "default value from user meta" trigger, we must insert it explicitly.
        // We need to fetch the user's tenant_id securely.

        // Option 1: Fetch user's tenant first
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (userError || !userData?.tenant_id) {
            return NextResponse.json({ error: 'User not assigned to a tenant' }, { status: 400 })
        }

        // Insert
        const { data, error } = await supabase
            .from('fincas')
            .insert({
                ...body,
                tenant_id: userData.tenant_id,
                // config default {}
            })
            .select()
            .single()

        if (error) throw error

        // Audit Log
        if (data) {
            await logAudit({
                action: 'CREATE',
                resource: 'fincas',
                resourceId: data.id,
                payload: body,
                tenantId: userData.tenant_id
            })
        }

        return NextResponse.json(data)
    } catch (error: unknown) {
        console.error('Error creating finca:', error)
        if (error instanceof ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        const message = error instanceof Error ? error.message : "Error desconocido"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: 'Finca ID required' }, { status: 400 })

        const json = await request.json()
        const body = fincaSchema.parse(json)

        // Verify ownership via RLS or explicit check (RLS handles update policy)
        const { data, error } = await supabase
            .from('fincas')
            .update(body)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        // Audit Log
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data: userData } = await supabase.from('usuarios').select('tenant_id').eq('id', user.id).single()
            if (userData) {
                await logAudit({
                    action: 'UPDATE',
                    resource: 'fincas',
                    resourceId: id,
                    payload: body,
                    tenantId: userData.tenant_id
                })
            }
        }

        return NextResponse.json(data)
    } catch (error: unknown) {
        console.error('Error updating finca:', error)
        if (error instanceof ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        const message = error instanceof Error ? error.message : "Error desconocido"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
