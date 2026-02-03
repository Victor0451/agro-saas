import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Sprout, Tractor, Leaf, Scale } from "lucide-react"

const modules = [
    {
        title: "Almácigos",
        description: "Gestión de siembra, bandejas y uso de semillas.",
        href: "/produccion/almacigos",
        icon: Sprout,
        active: true,
    },
    {
        title: "Plantación",
        description: "Registro de plantación en lotes definitivos.",
        href: "/produccion/plantacion",
        icon: Tractor,
        active: true,
    },
    {
        title: "Cultivo",
        description: "Labores culturales, fertilización y tratamientos.",
        href: "/produccion/cultivo",
        icon: Leaf,
        active: true,
    },
    {
        title: "Cosecha",
        description: "Registro de cortes, clases y rendimiento.",
        href: "/produccion/cosecha",
        icon: Scale,
        active: true,
    },
]

export default function ProductionPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Producción</h1>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {modules.map((module) => (
                    <Link
                        key={module.title}
                        href={module.active ? module.href : "#"}
                        className={!module.active ? "cursor-not-allowed opacity-60" : ""}
                    >
                        <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {module.title}
                                </CardTitle>
                                <module.icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="pt-2">{module.description}</CardDescription>
                                {!module.active && (
                                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded mt-2 inline-block">
                                        Próximamente
                                    </span>
                                )}
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}
