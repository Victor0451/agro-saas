import { createClient } from "@/lib/supabase/server"
import { CultivoForm } from "@/components/forms/cultivo-form"
import { CultivoHistory } from "@/components/cultivo-history"
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
                cantidad,
                insumo:insumos(nombre, unidad)
            )
        `)
        .order('fecha', { ascending: false })
        .limit(50)

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

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="lg:col-span-3">
                    <Card className="h-full border-indigo-100 dark:border-indigo-900/20">
                        <CardHeader className="bg-indigo-50/50 dark:bg-indigo-900/10">
                            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 mb-2">
                                <Activity className="h-5 w-5" />
                                <span className="text-sm font-semibold uppercase tracking-wider">Nueva Actividad</span>
                            </div>
                            <CardTitle>Registrar Labor</CardTitle>
                            <CardDescription>
                                Asigna tareas a lotes e imputa consumo de insumos/jornales.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <CultivoForm />
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-4">
                    <CultivoHistory history={history || []} />
                </div>
            </div>
        </div>
    )
}
