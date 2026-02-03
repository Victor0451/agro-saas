import { createClient } from "@/lib/supabase/server"
import { PlantacionForm } from "@/components/forms/plantacion-form"
import { PlantacionHistory } from "@/components/plantacion-history"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Sprout } from "lucide-react"

export default async function PlantacionPage() {
    const supabase = await createClient()

    // We fetch ALL plantations initially, handling filtering client-side or
    // ideally we should fetch strictly filtered server-side if we had the context server-side.
    // For now, simpler to fetch recent ones and filter in client list like Almacigos.

    // Better approach: We can't know Active Finca here easily (layout state). 
    // So we pass initial data to Client Component list.
    const { data: history } = await supabase
        .from('plantaciones')
        .select(`
            *,
            lote:lotes(nombre),
            almacigo:almacigos(variedad, fecha)
        `)
        .order('fecha', { ascending: false })
        .limit(50)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Plantación</h1>
                    <p className="text-muted-foreground">
                        Registro de trasplante a lotes definitivos.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="lg:col-span-3">
                    <Card className="h-full border-green-100 dark:border-green-900/20">
                        <CardHeader className="bg-green-50/50 dark:bg-green-900/10">
                            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                                <Sprout className="h-5 w-5" />
                                <span className="text-sm font-semibold uppercase tracking-wider">Nueva Labor</span>
                            </div>
                            <CardTitle>Registrar Plantación</CardTitle>
                            <CardDescription>
                                Asigna plantines a un lote y registra la superficie cubierta.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <PlantacionForm />
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-4">
                    <PlantacionHistory history={history || []} />
                </div>
            </div>
        </div>
    )
}
