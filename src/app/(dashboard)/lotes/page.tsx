"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus, RotateCw } from "lucide-react"
import { LoteForm } from "@/components/forms/lote-form"

interface Lote {
    id: string
    nombre: string
    superficie: number
    variedad?: string
    activo: boolean
    fincas?: {
        nombre: string
    }
}

export default function LotesPage() {
    const [lotes, setLotes] = useState<Lote[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const supabase = createClient()

    const fetchLotes = useCallback(async () => {
        setLoading(true)
        // Fetch lotes joining with fincas for display
        const { data } = await supabase
            .from('lotes')
            .select(`
            *,
            fincas (nombre)
        `)
            .order('created_at', { ascending: false })

        if (data) setLotes(data as unknown as Lote[])
        setLoading(false)
    }, [supabase])

    useEffect(() => {
        fetchLotes()
    }, [fetchLotes])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Lotes</h1>
                    <p className="text-muted-foreground">
                        Administra los cuadros de plantación asociados a tus fincas.
                    </p>
                </div>
                <Button onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Cancelar" : (
                        <>
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Lote
                        </>
                    )}
                </Button>
            </div>

            {showForm && (
                <div className="max-w-2xl mx-auto animate-in slide-in-from-top-4 fade-in duration-300">
                    <LoteForm onSuccess={() => {
                        setShowForm(false)
                        fetchLotes()
                    }} />
                </div>
            )}

            <div className="border rounded-lg bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Finca</TableHead>
                            <TableHead>Superficie</TableHead>
                            <TableHead>Variedad</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    <RotateCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : lotes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No hay lotes registrados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            lotes.map((lote) => (
                                <TableRow key={lote.id}>
                                    <TableCell className="font-medium">{lote.nombre}</TableCell>
                                    <TableCell>{lote.fincas?.nombre || "Sin finca"}</TableCell>
                                    <TableCell>{lote.superficie} has</TableCell>
                                    <TableCell>{lote.variedad || "-"}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${lote.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {lote.activo ? "Activo" : "Inactivo"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm">Editar</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
