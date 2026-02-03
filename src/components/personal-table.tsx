"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit2 } from "lucide-react"

interface Personal {
    id: string
    nombre: string
    dni: string
    tipo: string
    activo: boolean
    costo_jornal_referencia: number
}

export function PersonalTable({ data, onEdit }: { data: Personal[], onEdit?: (p: Personal) => void }) {

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>DNI</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Costo Ref.</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length > 0 ? (
                        data.map((p) => (
                            <TableRow key={p.id}>
                                <TableCell className="font-medium">{p.nombre}</TableCell>
                                <TableCell>{p.dni || "-"}</TableCell>
                                <TableCell>{p.tipo}</TableCell>
                                <TableCell>${p.costo_jornal_referencia}</TableCell>
                                <TableCell>
                                    <Badge variant={p.activo ? "default" : "secondary"}>
                                        {p.activo ? "Activo" : "Inactivo"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => onEdit?.(p)}>
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                No hay personal registrado.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
