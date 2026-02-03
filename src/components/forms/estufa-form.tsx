"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
// import { Switch } from "@/components/ui/switch" 
import { useToast } from "@/hooks/use-toast"
import { EstufaFormValues, estufaSchema } from "@/lib/validations/curado"
// Checking imports... usually Shadcn has Switch.

export function EstufaForm() {
    const router = useRouter()
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)

    const form = useForm<EstufaFormValues>({
        resolver: zodResolver(estufaSchema),
        defaultValues: {
            nombre: "",
            capacidad: 0,
            activa: true,
        },
    })

    async function onSubmit(data: EstufaFormValues) {
        setLoading(true)
        try {
            const response = await fetch("/api/produccion/estufas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                throw new Error("Error al crear la estufa")
            }

            toast({
                title: "Estufa creada",
                description: "La estufa se ha registrado correctamente.",
            })

            form.reset()
            router.refresh()
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo crear la estufa.",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre / Identificador</FormLabel>
                            <FormControl>
                                <Input placeholder="Estufa #1" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="capacidad"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Capacidad (kg)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="2000" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Checkbox for Active/Inactive if implemented, skipping for simplicity in MVP 
                    or defaulting to true in schema
                */}

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Registrar Estufa
                </Button>
            </form>
        </Form>
    )
}
