"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, ChevronRight } from "lucide-react"
import { ROUTES } from "@/lib/routes"

export function Breadcrumb() {
    const pathname = usePathname()

    // Split pathname into segments, filtering out empty strings
    const segments = pathname.split("/").filter(Boolean)

    // Build the breadcrumb chain
    // Each segment: { key, label, href, isLast }
    const crumbs = segments.map((segment, index) => {
        const key = segment
        const routeEntry = ROUTES[key]
        const label = routeEntry?.label ?? segment.charAt(0).toUpperCase() + segment.slice(1)
        const href = "/" + segments.slice(0, index + 1).join("/")
        const isLast = index === segments.length - 1
        return { key, label, href, isLast }
    })

    // If only root or empty, show only "Inicio"
    if (crumbs.length === 0) {
        return (
            <nav aria-label="Breadcrumb" className="mb-2">
                <ol className="flex items-center gap-1 text-sm">
                    <li className="flex items-center gap-1">
                        <Home className="h-3 w-3" />
                        <span className="font-medium">Inicio</span>
                    </li>
                </ol>
            </nav>
        )
    }

    return (
        <nav aria-label="Breadcrumb" className="mb-2">
            <ol className="flex items-center gap-1 text-sm">
                <li className="flex items-center gap-1">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Home className="h-3 w-3" />
                        <span>Inicio</span>
                    </Link>
                </li>
                {crumbs.map((crumb) => (
                    <li key={crumb.key} className="flex items-center gap-1">
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        {crumb.isLast ? (
                            <span className="font-medium text-foreground">{crumb.label}</span>
                        ) : (
                            <Link
                                href={crumb.href}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {crumb.label}
                            </Link>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    )
}
