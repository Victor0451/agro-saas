"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Store, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useFinca } from "@/contexts/finca-context"
import { useRouter } from "next/navigation"

export function FincaSwitcher({ className }: { className?: string }) {
    const { fincas, activeFinca, setActiveFincaId, isLoading } = useFinca()
    const [open, setOpen] = React.useState(false)
    const router = useRouter()

    if (isLoading) {
        return <div className="w-[200px] h-9 bg-muted animate-pulse rounded-md" />
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    aria-label="Seleccionar finca"
                    className={cn("w-[200px] justify-between", className)}
                >
                    <Store className="mr-2 h-4 w-4" />
                    {activeFinca ? activeFinca.nombre : "Seleccionar Finca..."}
                    <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandList>
                        <CommandInput placeholder="Buscar finca..." />
                        <CommandEmpty>No se encontró finca.</CommandEmpty>
                        <CommandGroup heading="Mis Fincas">
                            {fincas.map((finca) => (
                                <CommandItem
                                    key={finca.id}
                                    onSelect={() => {
                                        setActiveFincaId(finca.id)
                                        setOpen(false)
                                        // Optional: Refresh page or just let Context update
                                        // router.refresh() 
                                    }}
                                    className="text-sm"
                                >
                                    <Store className="mr-2 h-4 w-4" />
                                    {finca.nombre}
                                    <Check
                                        className={cn(
                                            "ml-auto h-4 w-4",
                                            activeFinca?.id === finca.id
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                    <CommandSeparator />
                    <CommandList>
                        <CommandGroup>
                            <CommandItem
                                onSelect={() => {
                                    setOpen(false)
                                    router.push("/fincas")
                                }}
                            >
                                <PlusCircle className="mr-2 h-5 w-5" />
                                Crear Finca
                            </CommandItem>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
