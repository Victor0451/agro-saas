import { Suspense } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Plus, Thermometer } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { CuradoForm } from "@/components/forms/curado-form"
import { EstufaForm } from "@/components/forms/estufa-form"
// import { Separator } from "@/components/ui/separator"

export default async function CuradoPage() {
    const supabase = await createClient()

    // 1. Fetch Estufas
    const { data: estufasRaw } = await supabase
        .from("estufas")
        .select("id, nombre, capacidad, activa")
        .eq("activa", true)
        .order("nombre")

    const estufas = estufasRaw || []

    // 2. Fetch Lotes (for source)
    const { data: lotesRaw } = await supabase
        .from("lotes")
        .select("id, nombre")
        .eq("activo", true)
        .order("nombre")

    const lotes = lotesRaw || []

    // 3. Fetch Active Curing Cycles
    const { data: activeCycles } = await supabase
        .from("curados")
        .select(`
            *,
            estufa:estufas(nombre),
            lote:lotes(nombre)
        `)
        .eq("estado", "en_proceso")
        .order("fecha_inicio", { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Curado (Estufas)</h1>
                    <p className="text-muted-foreground">
                        Gestión de ciclos de secado y control de estufas.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/produccion/curado/estufas">
                        <Button variant="outline">
                            <Thermometer className="mr-2 h-4 w-4" />
                            Gestionar Estufas
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Nueva Carga de Estufa</CardTitle>
                        <CardDescription>
                            Registrar el inicio de un ciclo de curado.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {estufas.length > 0 ? (
                            <CuradoForm estufas={estufas} lotes={lotes} />
                        ) : (
                            <div className="text-center py-6">
                                <p className="text-muted-foreground mb-4">No hay estufas activas.</p>
                                <Link href="/produccion/curado/estufas">
                                    <Button variant="secondary">Crear Estufa</Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Ciclos en Proceso</CardTitle>
                        <CardDescription>
                            Estufas actualmente cargadas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Estufa</TableHead>
                                    <TableHead>Fecha Inicio</TableHead>
                                    <TableHead className="text-right">Peso Verde</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeCycles && activeCycles.length > 0 ? (
                                    activeCycles.map((cycle) => (
                                        <TableRow key={cycle.id}>
                                            <TableCell className="font-medium">
                                                {/* @ts-ignore join */}
                                                {cycle.estufa?.nombre}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(cycle.fecha_inicio).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {cycle.peso_verde} kg
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                            No hay estufas en proceso.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
