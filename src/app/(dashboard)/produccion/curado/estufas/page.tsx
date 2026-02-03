import { createClient } from "@/lib/supabase/server"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

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
import { EstufaForm } from "@/components/forms/estufa-form"

export default async function EstufasPage() {
    const supabase = await createClient()

    const { data: estufas } = await supabase
        .from("estufas")
        .select("*")
        .order("nombre")

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/produccion/curado">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Estufas</h1>
                    <p className="text-muted-foreground">
                        Administrar infraestructura de secado.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Nueva Estufa</CardTitle>
                        <CardDescription>
                            Registrar una nueva unidad de curado.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <EstufaForm />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Listado de Estufas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Capacidad</TableHead>
                                    <TableHead className="text-right">Estado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {estufas && estufas.length > 0 ? (
                                    estufas.map((estufa) => (
                                        <TableRow key={estufa.id}>
                                            <TableCell className="font-medium">{estufa.nombre}</TableCell>
                                            <TableCell>{estufa.capacidad} kg</TableCell>
                                            <TableCell className="text-right">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${estufa.activa ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                                    }`}>
                                                    {estufa.activa ? "Activa" : "Inactiva"}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                            No hay estufas registradas.
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
