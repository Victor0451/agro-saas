"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"

type Finca = {
    id: string
    nombre: string
}

interface FincaContextType {
    fincas: Finca[]
    activeFincaId: string | null
    setActiveFincaId: (id: string) => void
    isLoading: boolean
    activeFinca: Finca | undefined
}

const FincaContext = React.createContext<FincaContextType | undefined>(undefined)

export function FincaProvider({ children }: { children: React.ReactNode }) {
    const [fincas, setFincas] = React.useState<Finca[]>([])
    const [activeFincaId, setActiveFincaId] = React.useState<string | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)
    const supabase = createClient()

    // Load Fincas on mount
    React.useEffect(() => {
        const fetchFincas = async () => {
            try {
                setIsLoading(true)
                const { data, error } = await supabase
                    .from("fincas")
                    .select("id, nombre")
                    .order("created_at", { ascending: true })

                if (error) {
                    console.error("Error fetching fincas:", error)
                    return
                }

                if (data) {
                    setFincas(data)

                    // Auto-select logic
                    // 1. Try to restore from localStorage
                    const savedId = localStorage.getItem("erp_active_finca_id")

                    if (savedId && data.find(f => f.id === savedId)) {
                        setActiveFincaId(savedId)
                    } else if (data.length > 0) {
                        // 2. Default to first one if none selected or invalid
                        const firstId = data[0].id
                        setActiveFincaId(firstId)
                        localStorage.setItem("erp_active_finca_id", firstId)
                    }
                }
            } catch (err) {
                console.error("Context error:", err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchFincas()
    }, [supabase])

    const handleSetActive = (id: string) => {
        setActiveFincaId(id)
        localStorage.setItem("erp_active_finca_id", id)
    }

    const activeFinca = fincas.find(f => f.id === activeFincaId)

    return (
        <FincaContext.Provider value={{
            fincas,
            activeFincaId,
            setActiveFincaId: handleSetActive,
            isLoading,
            activeFinca
        }}>
            {children}
        </FincaContext.Provider>
    )
}

export function useFinca() {
    const context = React.useContext(FincaContext)
    if (context === undefined) {
        throw new Error("useFinca must be used within a FincaProvider")
    }
    return context
}
