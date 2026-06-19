import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { CreatePresupuestoSchema } from '@/lib/validations/insumo'
import { ZodError } from 'zod'
import type { PresupuestoInsumoWithCategoria } from '@/types/insumos'

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
        const anio = searchParams.get('anio')
        const mes = searchParams.get('mes')

        if (!anio) {
            return NextResponse.json({ error: 'El parámetro "anio" es requerido' }, { status: 400 })
        }

        let query = supabase
            .from('presupuestos_insumos')
            .select(`
                *,
                categorias_insumos (nombre)
            `)
            .eq('tenant_id', userData.tenant_id)
            .eq('periodo_anio', parseInt(anio, 10))
            .order('periodo_mes', { ascending: true })

        if (mes) {
            query = query.eq('periodo_mes', parseInt(mes, 10))
        } else {
            query = query.is('periodo_mes', null)
        }

        const { data, error } = await query

        if (error) throw error

        return NextResponse.json(data as PresupuestoInsumoWithCategoria[])
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const json = await request.json()

        const body = CreatePresupuestoSchema.parse(json)

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

        const { data, error } = await supabase
            .from('presupuestos_insumos')
            .insert({ ...body, tenant_id: userData.tenant_id })
            .select()
            .single()

        if (error) {
            // Handle unique constraint violation (duplicate period/category/insumo combo)
            if (error.code === '23505') {
                return NextResponse.json(
                    { error: 'Ya existe un presupuesto para esta categoría, insumo y período' },
                    { status: 409 }
                )
            }
            throw error
        }

        await logAudit({
            action: 'CREATE',
            resource: 'presupuestos_insumos',
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
