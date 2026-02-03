import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()

        // 1. Fetch existing categories
        const { data: categories, error } = await supabase
            .from('categorias_insumos')
            .select('*')
            .order('nombre')

        if (error) throw error

        // 2. Default Seed if empty (This works because categorias_insumos is global/public or shared?
        // In our schema, categorias_insumos DOES NOT have tenant_id. It is a shared catalog.
        // If it is empty, we seed it.
        if (!categories || categories.length === 0) {
            const seed = [
                { nombre: 'Fertilizantes', descripcion: 'Nitrógeno, Fósforo, Potasio, etc.' },
                { nombre: 'Agroquímicos', descripcion: 'Herbicidas, Insecticidas, Fungicidas' },
                { nombre: 'Semillas', descripcion: 'Variedades de tabaco' },
                { nombre: 'Combustibles', descripcion: 'Gasoil, Nafta, Leña/Gas' },
                { nombre: 'Mano de Obra', descripcion: 'Categorías laborales' }, // Maybe separate?
                { nombre: 'Herramientas', descripcion: 'Palas, azadas, repuestos' },
            ]

            const { data: newCategories, error: seedError } = await supabase
                .from('categorias_insumos')
                .insert(seed)
                .select()

            if (seedError) throw seedError
            return NextResponse.json(newCategories)
        }

        return NextResponse.json(categories)
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Error desconocido"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
