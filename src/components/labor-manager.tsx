"use client"

import { useState } from "react"
import { LaborForm } from "@/components/forms/labor-form"
import { LaborHistory } from "@/components/labor-history"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Activity } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useFinca } from "@/contexts/finca-context"

interface LaborManagerProps {
    history: any[]
}

export function LaborManager({ history }: LaborManagerProps) {
    const [selectedLabor, setSelectedLabor] = useState<any>(null)
    const { toast } = useToast()
    const router = useRouter()
    const { activeFincaId } = useFinca()

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const [limit, setLimit] = useState(15)

    // Filter and Sort Logic
    // Sort DESC by date (already likely sorted by server but reinforcing)
    const sortedHistory = [...history].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

    // Filter by Finca
    const filteredHistory = activeFincaId
        ? sortedHistory.filter((item) => item.finca_id === activeFincaId)
        : []

    // Paginate
    const totalCount = filteredHistory.length
    const totalPages = Math.ceil(totalCount / limit)
    const offset = (currentPage - 1) * limit
    const paginatedData = filteredHistory.slice(offset, offset + limit)

    const handleEdit = (labor: any) => {
        setSelectedLabor(labor)
        toast({
            title: "Modo Edición",
            description: `Editando labor de fecha: ${labor.fecha}`,
            variant: "default",
            className: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900/50"
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleCancelEdit = () => {
        setSelectedLabor(null)
        toast({
            title: "Edición Cancelada",
            description: "Se ha limpiado el formulario.",
        })
    }

    const handleSuccess = () => {
        if (selectedLabor) {
            toast({
                title: "Labor Actualizada",
                description: "Los cambios se guardaron correctamente.",
                variant: "success",
            })
            setSelectedLabor(null)
        } else {
            toast({
                title: "Labor Registrada",
                description: "Nueva labor creada exitosamente.",
                variant: "success",
            })
        }
        router.refresh()
    }

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/produccion/cultivo/${id}`, {
                method: "DELETE"
            })

            if (!res.ok) throw new Error("Error al eliminar")

            toast({
                title: "Labor Eliminada",
                description: "El registro ha sido eliminado correctamente.",
                variant: "success",
            })
            router.refresh()
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo eliminar el registro.",
                variant: "destructive",
            })
        }
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            <div className="lg:col-span-3">
                <Card className={`h-full border-indigo-100 dark:border-indigo-900/20 transition-all duration-300 ${selectedLabor ? 'ring-2 ring-yellow-400 dark:ring-yellow-600 shadow-lg' : ''}`}>
                    <CardHeader className="bg-indigo-50/50 dark:bg-indigo-900/10 transition-colors">
                        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 mb-2">
                            <Activity className="h-5 w-5" />
                            <span className="text-sm font-semibold uppercase tracking-wider">
                                {selectedLabor ? "Editar Labor" : "Nueva Actividad"}
                            </span>
                        </div>
                        <CardTitle>{selectedLabor ? "Modificar Registro" : "Registrar Labor"}</CardTitle>
                        <CardDescription>
                            {selectedLabor
                                ? "Modifique los datos y confirme para actualizar."
                                : "Asigna tareas a lotes e imputa consumo de insumos/jornales."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <LaborForm
                            onSuccess={handleSuccess}
                            initialData={selectedLabor}
                            onCancel={handleCancelEdit}
                        />
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-4">
                <LaborHistory
                    history={paginatedData}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    // Pagination Props
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    limit={limit}
                    onLimitChange={(val) => {
                        setLimit(val)
                        setCurrentPage(1) // Reset to first page
                    }}
                    totalCount={totalCount}
                />
            </div>
        </div>
    )
}
