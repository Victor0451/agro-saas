import { createClient } from "@/lib/supabase/server"
import { LiquidacionManager } from "@/components/liquidacion-manager"

export default async function LiquidacionPage() {
    const supabase = await createClient()

    // Fetch Personal List for filters
    const { data: personalList } = await supabase
        .from('personal')
        .select('id, nombre, tipo')
        .eq('activo', true)
        .order('nombre')

    // Fetch History of Liquidaciones
    const { data: history } = await supabase
        .from('liquidaciones')
        .select(`
            *,
            personal (nombre, legajo)
        `)
        .order('fecha_liquidacion', { ascending: false })
        .limit(100) // Initial limit, client pagination handles it

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Liquidación de Jornales</h1>
                <p className="text-muted-foreground">
                    Gestión y pago de labores realizadas por el personal.
                </p>
            </div>

            <LiquidacionManager
                history={history || []}
                personalList={personalList || []}
            />
        </div>
    )
}
