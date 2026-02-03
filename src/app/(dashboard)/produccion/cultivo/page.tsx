import { createClient } from "@/lib/supabase/server"
import { LaborManager } from "@/components/labor-manager"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Activity } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function CultivoPage() {
    const supabase = await createClient()

    // Fetch history
    const { data: history } = await supabase
        .from('labores')
        .select(`
            *,
            lote:lotes(nombre),
            detalles:labores_insumos(
                insumo_id,
                cantidad,
                insumo:insumos(nombre, unidad)
            ),
            personal:labores_personal(
                personal_id,
                dias_trabajados,
                personal:personal(nombre)
            )
        `)
        .order('fecha', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Labores Culturales</h1>
                    <p className="text-muted-foreground">
                        Registro de mantenimiento, fertilización y curaciones.
                    </p>
                </div>
            </div>

            <LaborManager history={history || []} />
        </div>
    )
}
