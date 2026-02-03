import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        const { name, fincaName, superficie, rendimiento } = body

        if (!name || name.length < 3) {
            return NextResponse.json({ error: 'Nombre inválido' }, { status: 400 })
        }

        // Use RPC (Security Definer) to bypass RLS and perform atomic transaction
        // The function 'create_owner_tenant' must be created in the database first.
        // 3. Call the Security Definer RPC to create tenant and assign user + create first farm
        const { data: result, error: rpcError } = await supabase.rpc('create_owner_tenant', {
            tenant_name: name,
            finca_name: fincaName || 'Finca Principal',
            superficie: superficie || 0,
            rendimiento: rendimiento || 0
        })

        if (rpcError) {
            console.error("RPC Error:", rpcError)
            return NextResponse.json(
                { error: 'Error al crear la organización: ' + rpcError.message },
                { status: 500 }
            )
        }

        // Audit
        await logAudit({
            action: 'CREATE',
            resource: 'tenants',
            resourceId: (result as { tenant_id: string }).tenant_id,
            payload: { name, fincaName },
            tenantId: (result as { tenant_id: string }).tenant_id
        })

        return NextResponse.json({ success: true, result })

    } catch (error: unknown) {
        console.error("Create Tenant Error:", error)
        const message = error instanceof Error ? error.message : "Error desconocido"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
