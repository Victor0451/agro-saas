import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { personalSchema } from '@/lib/validations/personal'
import { logAudit } from '@/lib/audit'
import { ZodError } from 'zod'

export async function GET(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data } = await supabase.from('personal').select('*').order('nombre')
    return NextResponse.json(data)
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const json = await request.json()
        const body = personalSchema.parse(json)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: userData } = await supabase
            .from('usuarios')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (!userData?.tenant_id) return NextResponse.json({ error: 'No tenant' }, { status: 400 })

        const { data, error } = await supabase
            .from('personal')
            .insert({ ...body, tenant_id: userData.tenant_id })
            .select()
            .single()

        if (error) throw new Error(error.message)

        await logAudit({
            action: 'CREATE',
            resource: 'personal',
            resourceId: data.id,
            payload: body,
            tenantId: userData.tenant_id
        })

        return NextResponse.json(data)
    } catch (error: unknown) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const supabase = await createClient()
        const json = await request.json()
        const { id, ...body } = json // Extract ID from body

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        const parsed = personalSchema.parse(body) // Validate body (without ID)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Check if user belongs to tenant (via RLS mostly, but good to check)
        // We rely on RLS update policy using 'using (tenant_id = get_current_tenant_id())'

        const { data, error } = await supabase
            .from('personal')
            .update({ ...parsed, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error) throw new Error(error.message)

        await logAudit({
            action: 'UPDATE',
            resource: 'personal',
            resourceId: id,
            payload: parsed,
            tenantId: data.tenant_id
        })

        return NextResponse.json(data)
    } catch (error: unknown) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        const message = error instanceof Error ? error.message : "Error desconocido"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
