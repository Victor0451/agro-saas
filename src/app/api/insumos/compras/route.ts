import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { CreateCompraSchema } from '@/lib/validations/insumo'
import { ZodError } from 'zod'
import type { CompraInsumoWithRelations } from '@/types/insumos'

export async function GET(request: Request) {
    try {
        const supabase = await createClient()

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

        const { searchParams } = new URL(request.url)
        const insumo_id = searchParams.get('insumo_id')
        const categoria_id = searchParams.get('categoria_id')
        const fecha_desde = searchParams.get('fecha_desde')
        const fecha_hasta = searchParams.get('fecha_hasta')

        let query = supabase
            .from('compras_insumos')
            .select(`
                *,
                insumos (
                    nombre,
                    unidad,
                    categoria_id,
                    categorias_insumos (nombre)
                )
            `)
            .eq('tenant_id', userData.tenant_id)
            .order('fecha_compra', { ascending: false })

        if (insumo_id) {
            query = query.eq('insumo_id', insumo_id)
        }

        if (fecha_desde) {
            query = query.gte('fecha_compra', fecha_desde)
        }

        if (fecha_hasta) {
            query = query.lte('fecha_compra', fecha_hasta)
        }

        if (categoria_id) {
            // Get insumo IDs for this category (tenant-scoped)
            const { data: insumoIds } = await supabase
                .from('insumos')
                .select('id')
                .eq('tenant_id', userData.tenant_id)
                .eq('categoria_id', categoria_id)

            if (insumoIds && insumoIds.length > 0) {
                query = query.in('insumo_id', insumoIds.map(i => i.id))
            } else {
                // No insumos for this category — return empty
                return NextResponse.json([])
            }
        }

        const { data, error } = await query

        if (error) throw error

        return NextResponse.json(data as CompraInsumoWithRelations[])
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const json = await request.json()

        const body = CreateCompraSchema.parse(json)

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

        // Validate insumo_id belongs to current tenant
        const { data: insumo, error: insumoError } = await supabase
            .from('insumos')
            .select('id, tenant_id')
            .eq('id', body.insumo_id)
            .eq('tenant_id', userData.tenant_id)
            .single()

        if (insumoError || !insumo) {
            return NextResponse.json({ error: 'Insumo not found' }, { status: 404 })
        }

        const { data, error } = await supabase
            .from('compras_insumos')
            .insert({ ...body, tenant_id: userData.tenant_id })
            .select()
            .single()

        if (error) throw error

        await logAudit({
            action: 'CREATE',
            resource: 'compras_insumos',
            resourceId: data.id,
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
