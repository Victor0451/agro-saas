"use client"

import { useState } from "react"
import { CheckCircle2 } from "lucide-react"

import { CompraInsumoForm } from "@/components/forms/compra-insumo-form"

export default function ComprasPage() {
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    function handleSuccess() {
        setSuccessMessage("¡Compra registrada correctamente!")
        setTimeout(() => setSuccessMessage(null), 4000)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Registrar Compra de Insumo</h1>
                <p className="text-muted-foreground">
                    Registrá una nueva compra para mantener el historial actualizado.
                </p>
            </div>

            {/* Success alert */}
            {successMessage && (
                <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300 animate-in fade-in slide-in-from-top-2 duration-300">
                    <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span className="text-sm font-medium">{successMessage}</span>
                </div>
            )}

            {/* Form */}
            <div className="max-w-2xl">
                <CompraInsumoForm onSuccess={handleSuccess} />
            </div>
        </div>
    )
}
