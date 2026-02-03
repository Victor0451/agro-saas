"use client"

import { useFinca } from "@/contexts/finca-context"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AlmacigoHistoryItem {
    id: string
    finca_id: string
    fecha: string
    variedad: string
    cantidad_bandejas: number
    semilla_usada: number
    semilla?: {
        nombre: string
        unidad: string
    }
}

interface AlmacigoHistoryProps {
    history: AlmacigoHistoryItem[]
}

export function AlmacigoHistory({ history }: AlmacigoHistoryProps) {
    const { activeFincaId, fincas } = useFinca()
    const activeFinca = fincas.find(f => f.id === activeFincaId)

    const filteredHistory = activeFincaId
        ? history.filter((item) => item.finca_id === activeFincaId)
        : []

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>Historial de Siembra</span>
                    {activeFinca && (
                        <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
                            {activeFinca.nombre}
                        </span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Variedad</TableHead>
                            <TableHead>Bandejas</TableHead>
                            <TableHead>Semilla</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredHistory.length > 0 ? (
                            filteredHistory.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{format(new Date(item.fecha), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell>{item.variedad}</TableCell>
                                    <TableCell className="font-bold">{item.cantidad_bandejas}</TableCell>
                                    <TableCell>
                                        {item.semilla?.nombre} <br />
                                        <span className="text-xs text-muted-foreground">
                                            {item.semilla_usada} {item.semilla?.unidad}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    {activeFincaId
                                        ? "No hay siembras registradas en esta finca."
                                        : "Seleccione una finca para ver el historial."
                                    }
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
