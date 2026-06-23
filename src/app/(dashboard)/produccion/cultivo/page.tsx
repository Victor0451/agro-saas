import { createClient } from "@/lib/supabase/server"
import { LaborManager } from "@/components/labor-manager"
import { calcularStock } from "@/lib/services/stock"
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

    // Build stockByInsumo map server-side
    const { data: { user } } = await supabase.auth.getUser()
    let stockByInsumo: Record<string, { stock: number; unidad: string }> = {}

    if (user) {
        const { data: userData } = await supabase
            .from('usuarios')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (userData?.tenant_id) {
            const { data: insumos } = await supabase
                .from('insumos')
                .select('id, nombre, unidad')
                .eq('activo', true)
                .eq('tenant_id', userData.tenant_id)

            if (insumos) {
                for (const insumo of insumos) {
                    const stock = await calcularStock(insumo.id, userData.tenant_id)
                    stockByInsumo[insumo.id] = { stock, unidad: insumo.unidad }
                }
            }
        }
    }

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

            <LaborManager history={history || []} stockByInsumo={stockByInsumo} />
        </div>
    )
}
