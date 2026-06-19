"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
    ShoppingCart,
    ChevronDown,
    ChevronRight,
    BookOpen,
    ReceiptText,
    ClipboardList,
    Wallet,
    BarChart2,
} from "lucide-react"
import { cn } from "@/lib/utils"

const SUB_ITEMS = [
    { href: "/insumos", label: "Catálogo", icon: BookOpen },
    { href: "/insumos/compras", label: "Registrar Compra", icon: ReceiptText },
    { href: "/insumos/compras/historial", label: "Historial", icon: ClipboardList },
    { href: "/insumos/presupuesto", label: "Presupuesto", icon: Wallet },
    { href: "/insumos/informe", label: "Informe de Desvío", icon: BarChart2 },
]

export function InsumosNavSection() {
    const pathname = usePathname()
    const isInsumosActive = pathname.startsWith("/insumos")
    const [open, setOpen] = useState(isInsumosActive)

    return (
        <div>
            <button
                onClick={() => setOpen(prev => !prev)}
                className={cn(
                    "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                    isInsumosActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-primary hover:bg-muted"
                )}
                aria-expanded={open}
            >
                <ShoppingCart className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">Insumos</span>
                {open
                    ? <ChevronDown className="h-4 w-4 shrink-0" />
                    : <ChevronRight className="h-4 w-4 shrink-0" />
                }
            </button>

            {open && (
                <div className="ml-4 mt-0.5 flex flex-col border-l border-border pl-3">
                    {SUB_ITEMS.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname === href
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-all",
                                    isActive
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-muted-foreground hover:text-primary hover:bg-muted"
                                )}
                            >
                                <Icon className="h-3.5 w-3.5 shrink-0" />
                                {label}
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
