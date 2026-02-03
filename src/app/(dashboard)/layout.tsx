import Link from "next/link"
import {
    Bell,
    Home,
    LineChart,
    Package,
    Package2,
    ShoppingCart,
    Users,
    DollarSign,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ModeToggle } from "@/components/mode-toggle"
import { UserNav } from "@/components/user-nav"
import { Menu } from "lucide-react"

import { FincaProvider } from "@/contexts/finca-context"
import { FincaSwitcher } from "@/components/finca-switcher"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <FincaProvider>
            <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
                <div className="hidden border-r bg-muted/40 md:block">
                    <div className="flex h-full max-h-screen flex-col gap-2">
                        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                            <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
                                <Package2 className="h-6 w-6" />
                                <span className="">AgroERP</span>
                            </Link>
                            <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
                                <Bell className="h-4 w-4" />
                                <span className="sr-only">Toggle notifications</span>
                            </Button>
                        </div>
                        <div className="flex-1">
                            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                                <FincaSwitcher />
                                <Link

                                    href="/dashboard"
                                    className="mt-4 flex items-center gap-3 rounded-lg bg-muted px-3 py-2 text-primary transition-all hover:text-primary"
                                >
                                    <Home className="h-4 w-4" />
                                    Dashboard
                                </Link>
                                <Link
                                    href="/fincas"
                                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                                >
                                    <Home className="h-4 w-4" />
                                    Mis Fincas
                                </Link>
                                <Link
                                    href="/lotes"
                                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                                >
                                    <Package2 className="h-4 w-4" />
                                    Lotes
                                </Link>
                                <Link
                                    href="/insumos"
                                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                                >
                                    <ShoppingCart className="h-4 w-4" />
                                    Insumos
                                </Link>
                                <Link
                                    href="/produccion"
                                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                                >
                                    <Package className="h-4 w-4" />
                                    Producción
                                </Link>
                                <Link
                                    href="/personal"
                                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                                >
                                    <Users className="h-4 w-4" />
                                    Personal
                                </Link>
                                <Link
                                    href="/personal/liquidacion"
                                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                                >
                                    <DollarSign className="h-4 w-4" />
                                    Liquidaciones
                                </Link>
                                <Link
                                    href="/reportes"
                                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                                >
                                    <LineChart className="h-4 w-4" />
                                    Reportes
                                </Link>
                            </nav>
                        </div>
                        <div className="mt-auto p-4">
                            <Card x-chunk="dashboard-02-chunk-0" className="shadow-sm">
                                <CardHeader className="p-2 pt-0 md:p-4">
                                    <CardTitle>Soporte Técnico</CardTitle>
                                    <CardDescription>
                                        ¿Necesitas ayuda con el sistema?
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                                    <Button size="sm" className="w-full">
                                        Contactar
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col">
                    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="shrink-0 md:hidden"
                                >
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">Toggle navigation menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="flex flex-col">
                                <nav className="grid gap-2 text-lg font-medium">
                                    <Link
                                        href="#"
                                        className="flex items-center gap-2 text-lg font-semibold"
                                    >
                                        <Package2 className="h-6 w-6" />
                                        <span className="sr-only">AgroERP</span>
                                    </Link>

                                    <Link
                                        href="/dashboard"
                                        className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                                    >
                                        <Home className="h-5 w-5" />
                                        Dashboard
                                    </Link>
                                    <Link
                                        href="/fincas"
                                        className="mx-[-0.65rem] flex items-center gap-4 rounded-xl bg-muted px-3 py-2 text-foreground hover:text-foreground"
                                    >
                                        <ShoppingCart className="h-5 w-5" />
                                        Mis Fincas
                                    </Link>
                                </nav>
                                <div className="mt-auto">
                                </div>
                            </SheetContent>
                        </Sheet>

                        <div className="ml-auto flex gap-2 items-center">
                            <ModeToggle />
                            <UserNav />
                        </div>
                    </header>
                    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/10">
                        {children}
                    </main>
                </div>
            </div>
        </FincaProvider>
    )
}
