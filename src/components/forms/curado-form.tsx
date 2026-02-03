"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { format } from "date-fns"

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { CuradoFormValues, curadoSchema } from "@/lib/validations/curado"

interface CuradoFormProps {
    estufas: { id: string; nombre: string }[]
    lotes: { id: string; nombre: string }[]
}

export function CuradoForm({ estufas, lotes }: CuradoFormProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)

    const form = useForm<CuradoFormValues>({
        resolver: zodResolver(curadoSchema),
        defaultValues: {
            fecha_inicio: format(new Date(), "yyyy-MM-dd"),
            numero_carga: 1,
            peso_verde: 0,
            estado: 'en_proceso',
        },
    })

    async function onSubmit(data: CuradoFormValues) {
        setLoading(true)
        try {
            const response = await fetch("/api/produccion/curado", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                throw new Error("Error al registrar carga")
            }

            toast({
                title: "Ciclo iniciado",
                description: "La carga de estufa se registró correctamente.",
            })

            form.reset()
            router.refresh()
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo registrar la carga.",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="estufa_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Estufa</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar Estufa" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {estufas.map((estufa) => (
                                            <SelectItem key={estufa.id} value={estufa.id}>
                                                {estufa.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="lote_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Lote Origen</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar Lote" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {lotes.map((lote) => (
                                            <SelectItem key={lote.id} value={lote.id}>
                                                {lote.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="numero_carga"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>N° Carga</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="fecha_inicio"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fecha Inicio</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="peso_verde"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Peso Verde (kg)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="variedad"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Variedad (Opcional)</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: Virginia" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Registrar Carga
                </Button>
            </form>
        </Form>
    )
}
