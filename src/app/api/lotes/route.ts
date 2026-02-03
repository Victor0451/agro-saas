import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { loteSchema } from '@/lib/validations/lote'

import { ZodError } from 'zod'

export async function GET() {
    try {
        const supabase = await createClient()

        // Fetch lotes with Finca name
        const { data, error } = await supabase
            .from('lotes')
            .select('*, fincas (nombre)')
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

        const body = loteSchema.parse(json)

        // Get User Tenant
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

        // Optional: Validate Finca belongs to Tenant (RLS handles insert, but good for error msg)
        // Actually, if we insert with correct tenant_id, FK check on finca_id ensures it exists.
        // However, does FK ensure finca belongs to SAME tenant?
        // DB allows generic FK reference. We rely on RLS logic or app logic.
        // Our 'lotes' table has 'tenant_id'. 'fincas' has 'tenant_id'.
        // We should ensure they match.
        // Ideally, we fetch the finca first to check.

        const { data: finca } = await supabase
            .from('fincas')
            .select('tenant_id')
            .eq('id', body.finca_id)
            .single()

        if (!finca || finca.tenant_id !== userData.tenant_id) {
            return NextResponse.json({ error: 'Invalid Finca' }, { status: 400 })
        }

        // Insert
        const { data, error } = await supabase
            .from('lotes')
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
            resource: 'lotes',
            resourceId: data.id,
            payload: body,
            tenantId: userData.tenant_id
        })

        return NextResponse.json(data)
    } catch (error: unknown) {
        console.error('Error creating lote:', error)
        if (error instanceof ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        const message = error instanceof Error ? error.message : "Error desconocido"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
