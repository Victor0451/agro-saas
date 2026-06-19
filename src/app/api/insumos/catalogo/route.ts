import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { CatalogoInsumo } from '@/types/insumos'

export async function GET(request: Request) {
    try {
        const supabase = await createClient()

        // Auth check — catalog is global but must be authenticated
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const categoria_id = searchParams.get('categoria_id')

        let query = supabase
            .from('catalogo_insumos')
            .select('*')
            .eq('activo', true)
            .order('nombre')

        if (categoria_id) {
            query = query.eq('categoria_id', categoria_id)
        }

        const { data, error } = await query

        if (error) throw error

        return NextResponse.json(data as CatalogoInsumo[])
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
