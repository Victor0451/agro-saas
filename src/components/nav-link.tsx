"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface NavLinkProps {
    href: string
    icon: LucideIcon
    label: string
    exact?: boolean
    className?: string
}

export function NavLink({ href, icon: Icon, label, exact = false, className }: NavLinkProps) {
    const pathname = usePathname()
    const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/")

    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-primary hover:bg-muted",
                className
            )}
        >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
        </Link>
    )
}
