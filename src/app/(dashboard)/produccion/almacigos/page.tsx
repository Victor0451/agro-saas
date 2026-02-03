import { createClient } from "@/lib/supabase/server"
import { AlmacigoForm } from "@/components/forms/almacigo-form"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { AlmacigoHistory } from "@/components/almacigo-history"

export default async function AlmacigosPage() {
    const supabase = await createClient()

    // Fetch data
    const insumosRes = await supabase.from("insumos").select("*, categoria:categorias_insumos(nombre)").eq("activo", true)

    const insumos = insumosRes.data || []

    // Filter specifics
    const semillas = insumos.filter(i => i.categoria?.nombre?.toLowerCase().includes("semilla"))
    const sustratos = insumos.filter(i => i.categoria?.nombre?.toLowerCase().includes("sustrato"))

    // Fetch History
    const { data: history } = await supabase
        .from('almacigos')
        .select(`
        *,
        semilla:insumos!insumo_semilla_id(nombre, unidad),
        sustrato:insumos!insumo_sustrato_id(nombre, unidad)
      `)
        .order('fecha', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Almácigos</h1>
                    <p className="text-muted-foreground">
                        Registro de siembra y control de bandejas.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="lg:col-span-3">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Nueva Siembra</CardTitle>
                            <CardDescription>
                                Registra la siembra y descuenta materiales automáticamente.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AlmacigoForm semillas={semillas} sustratos={sustratos} />
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-4">
                    <AlmacigoHistory history={history || []} />
                </div>
            </div>
        </div>
    )
}
