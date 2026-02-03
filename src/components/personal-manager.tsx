"use client"

import { useState } from "react"
import { PersonalForm } from "@/components/forms/personal-form"
import { PersonalTable } from "@/components/personal-table"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Users, UserPlus, FileEdit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export function PersonalManager({ initialData }: { initialData: any[] }) {
    const [personal, setPersonal] = useState(initialData)
    const [selectedPerson, setSelectedPerson] = useState<any | null>(null)
    const { toast } = useToast()

    const handleEdit = (p: any) => {
        setSelectedPerson(p)
        toast({
            title: "Modo Edición Activado",
            description: `Editando datos de ${p.nombre}.`,
            duration: 3000,
            variant: "warning",
        })
    }

    const handleSuccess = async () => {
        // Refresh data manually or router.refresh()
        // Since page is server component, router.refresh() triggers re-fetch in server component
        // But we might want to update local state optimistically or re-fetch.
        // For simplicity, we rely on router.refresh() in the form, but let's clear selection.
        setSelectedPerson(null)
        // Re-fetch to update the table immediately if router.refresh is slow or separate
        const res = await fetch("/api/personal")
        if (res.ok) setPersonal(await res.json())
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            <div className="lg:col-span-2">
                <Card className="h-full border-indigo-100 dark:border-indigo-900/20">
                    <CardHeader className="bg-indigo-50/50 dark:bg-indigo-900/10">
                        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 mb-2">
                            {selectedPerson ? <FileEdit className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                            <span className="text-sm font-semibold uppercase tracking-wider">
                                {selectedPerson ? "Editar" : "Nuevo"}
                            </span>
                        </div>
                        <CardTitle>{selectedPerson ? "Editar Personal" : "Alta de Personal"}</CardTitle>
                        <CardDescription>
                            {selectedPerson
                                ? "Modifique los datos o estado del empleado."
                                : "Registre trabajadores temporales o permanentes."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <PersonalForm
                            // Force remount when selection changes to reset form defaults
                            key={selectedPerson?.id || 'new'}
                            initialData={selectedPerson}
                            onSuccess={handleSuccess}
                        />
                        {selectedPerson && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full mt-2"
                                onClick={() => setSelectedPerson(null)}
                            >
                                Cancelar Edición
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-5">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Listado de Personal
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PersonalTable
                            data={personal}
                            onEdit={handleEdit}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
