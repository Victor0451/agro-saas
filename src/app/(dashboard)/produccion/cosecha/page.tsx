import { createClient } from "@/lib/supabase/server"
import { CosechaForm } from "@/components/forms/cosecha-form"
import { CosechaHistory } from "@/components/cosecha-history"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Scale } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function CosechaPage() {
    const supabase = await createClient()

    // Fetch history
    const { data: history } = await supabase
        .from('cosechas')
        .select(`
            *,
            lote:lotes(nombre)
        `)
        .order('fecha', { ascending: false })
        .limit(50)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Cosecha</h1>
                    <p className="text-muted-foreground">
                        Registro de producción en kilos y rendimiento por lote.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="lg:col-span-3">
                    <Card className="h-full border-green-100 dark:border-green-900/20">
                        <CardHeader className="bg-green-50/50 dark:bg-green-900/10">
                            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                                <Scale className="h-5 w-5" />
                                <span className="text-sm font-semibold uppercase tracking-wider">Nuevo Ingreso</span>
                            </div>
                            <CardTitle>Registrar Cosecha</CardTitle>
                            <CardDescription>
                                Ingresa los kilos recolectados de cada lote.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <CosechaForm />
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-4">
                    <CosechaHistory history={history || []} />
                </div>
            </div>
        </div>
    )
}
