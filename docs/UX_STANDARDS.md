# Estándares de UX/UI y Funcionalidad - Módulo de Gestión (Base: Personal)

Este documento detalla los patrones de diseño, interacción y feedback visual establecidos en el módulo de Gestión de Personal. Estos estándares deben ser replicados en futuros desarrollos y refactorizaciones para asegurar una experiencia de usuario consistente.

## 1. Feedback Visual (Notificaciones)

El sistema utiliza **Toast Notifications** para informar al usuario sobre cambios de estado, éxitos y errores.

**Librería**: `src/components/ui/toast.tsx`, `src/hooks/use-toast.ts`
**Componente Global**: `<Toaster />` en `src/app/layout.tsx`.
**Posición**: Esquina Superior Derecha (`top-0 right-0`).

### Variantes y Uso

| Variante | Color | Uso | Ejemplo |
| :--- | :--- | :--- | :--- |
| **Default** | Fondo blanco / Borde gris | Información general. | "Cargando datos..." |
| **Success** | **Verde** (`bg-green-500`) | Confirmación de acciones exitosas. | "Personal Registrado Correctamente" |
| **Warning** | **Amarillo** (`bg-yellow-500`) | Cambios de estado importantes / Precaución. | "Modo Edición Activado" |
| **Destructive** | **Rojo** (Standard Shadcn) | Errores críticos o fallos de sistema. | "Error al guardar los datos" |

### Código de Ejemplo

```tsx
const { toast } = useToast()

// Éxito
toast({
  title: "Operación Exitosa",
  description: "Los datos se han guardado correctamente.",
  variant: "success",
})

// Aviso de Edición
toast({
  title: "Modo Edición",
  description: "Editando registro de: Juan Pérez",
  variant: "warning",
})
```

## 2. Acciones Críticas (Confirmación)

Para acciones que modifican datos existentes (Updates) o eliminan registros, **SIEMPRE** se debe solicitar confirmación explícita mediante un **Alert Dialog**.

**Componente**: `src/components/ui/alert-dialog.tsx`

### Patrón de Interacción "Actualizar"

1.  El usuario modifica el formulario.
2.  Clic en botón "Actualizar".
3.  Se intercepta el envío del formulario (`onSubmit` o `onClick`).
4.  Se muestra el `AlertDialog`.
5.  Si confirma -> Se ejecuta la lógica de guardado.
6.  Si cancela -> Se cierra el diálogo sin cambios.

### Estructura del Diálogo

*   **Título**: "¿Está seguro de guardar los cambios?" / "¿Está seguro de eliminar?"
*   **Descripción**: Explicación clara de la consecuencia. "Esta acción actualizará la información del empleado en el sistema."
*   **Botones**:
    *   Cancelar (Variant: Validation / Outline)
    *   Confirmar (Variant: Default / Destructive dependiendo la acción)

```tsx
<AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
    <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar cambios?</AlertDialogTitle>
            <AlertDialogDescription>...</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction}>Confirmar</AlertDialogAction>
        </AlertDialogFooter>
    </AlertDialogContent>
</AlertDialog>
```

## 3. Arquitectura "Manager" (Lista + Formulario)

Para módulos ABM (Alta, Baja, Modificación), utilizamos un componente "Manager" que orquesta la vista.

**Patrón**: `[Entity]Manager` (ej: `PersonalManager`)

*   **Responsabilidad**:
    *   Mantiene el estado de la lista (opcionalmente sincronizada con servidor).
    *   Mantiene el estado de "Selección" para edición (`selectedPerson`).
    *   Renderiza el Formulario (`[Entity]Form`) y la Tabla (`[Entity]Table`) lado a lado o en layout grid.
*   **Interacción**:
    *   Clic en "Editar" en la Tabla -> Llama a `onEdit` del Manager -> Setea `selectedPerson` -> Dispara Toast "Modo Edición".
    *   Formulario recibe `selectedPerson` como `initialData`.
    *   Al guardar exitosamente -> Llama a `onSuccess` del Manager -> Limpia `selectedPerson` ("Cancelar Edición") -> Refresca datos.

### 3.1. Feedback Visual de Edición

Cuando un registro es seleccionado para editar, el contenedor (`Card`) del formulario debe resaltar para indicar el cambio de contexto:

*   **Borde**: `ring-2 ring-yellow-400 dark:ring-yellow-600`
*   **Sombra**: `shadow-lg`
*   **Texto (Tag)**: Cambia de "Nueva Actividad" a "Editar" (o similar).

```tsx
<Card className={`... ${selectedLabor ? 'ring-2 ring-yellow-400 dark:ring-yellow-600 shadow-lg' : ''}`}>
```

## 4. Patrones de Tablas y Listados

Las tablas de datos históricos o maestros deben seguir las siguientes reglas de visualización y navegación:

### 4.1. Ordenamiento
*   Los registros se muestran en orden **Descendente** (DESC) por defecto (más recientes primero).

### 4.2. Paginación y Filtrado
Las tablas deben incluir siempre un pie (`CardFooter`) con controles de navegación uniformes:

1.  **Selector de Filas**: Dropdown (`Select`) para elegir "Filas por página".
    *   Opciones estándar: **10, 15 (Default), 25, 50, 100**.
2.  **Información de Estado**: Texto "Página X de Y".
3.  **Botones de Navegación**: Flechas `<` y `>` (Prev/Next).

```tsx
<CardFooter className="flex justify-between items-center ...">
   {/* Selector de Límite */}
   <div className="flex gap-2 ...">
       <span>Filas por página</span>
       <Select value={limit.toString()} onValueChange={...}>
            <SelectItem value="15">15</SelectItem>
            ...
       </Select>
   </div>
   {/* Paginación */}
   <div className="flex gap-2">
       <Button variant="outline" size="icon" onClick={prevPage}><ChevronLeft /></Button>
       <span>Página {current} de {total}</span>
       <Button variant="outline" size="icon" onClick={nextPage}><ChevronRight /></Button>
   </div>
</CardFooter>
```

## 5. Sistema de Diseño (Design System)

La estética del módulo se basa en un diseño **limpio, moderno y funcional**, utilizando `shadcn/ui` y `Tailwind CSS`. Los colores de acento se utilizan para denotar interactividad y jerarquía sin saturar la vista.

### 5.1. Tipografía

*   **Fuente Principal**: `Inter` (importada vía `next/font/google`).
*   **Encabezados de Página** (`<h1>`):
    *   Tamaño: `text-3xl`
    *   Peso: `font-bold`
    *   Espaciado: `tracking-tight`
*   **Subtítulos** (`<p>`):
    *   Color: `text-muted-foreground`
    *   Tamaño: `text-base` o `text-sm`
*   **Etiquetas de Estado/Sección**:
    *   Estilo: `text-sm font-semibold uppercase tracking-wider`
    *   Uso: Subtítulos pequeños dentro de cards para categorizar (ej: "EDITAR", "NUEVO").

### 5.2. Paleta de Colores (Theming)

El color primario para este módulo es el **Índigo**, utilizado para suavizar la interfaz administrativa.

| Elemento | Clases Tailwind (Light) | Clases Tailwind (Dark) | Efecto Visual |
| :--- | :--- | :--- | :--- |
| **Card Header Bg** | `bg-indigo-50/50` | `bg-indigo-900/10` | Separación sutil del contenido blanco. |
| **Card Border** | `border-indigo-100` | `border-indigo-900/20` | Delimitación suave. |
| **Iconos Accent** | `text-indigo-700` | `text-indigo-400` | Punto focal de atención. |
| **Active States** | `bg-accent` | `bg-accent` | Feedback de hover/focus. |

### 5.3. Componentes de UI

#### Cards (Contenedores)
Utilizamos `Card` de shadcn con modificaciones de borde y fondo en el header para crear jerarquía visual.
```tsx
<Card className="h-full border-indigo-100 dark:border-indigo-900/20">
  <CardHeader className="bg-indigo-50/50 dark:bg-indigo-900/10">
    {/* Contenido */}
  </CardHeader>
  {/* ... */}
</Card>
```

#### Formularios
*   **Layout**: `grid gap-6 md:grid-cols-2` para aprovechar el espacio horizontal en pantallas medianas.
*   **Inputs**: Estándar shadcn.
*   **Switches**: Utilizados para estados binarios (Activo/Inactivo) dentro de un contenedor con borde y sombra suave (`rounded-lg border p-3 shadow-sm`).
*   **Botones**:
    *   Primario: `w-full` en formularios laterales.
    *   Secundario/Cancelar: Variant `ghost` o `outline`.

#### Iconografía
Se utilizan iconos de `lucide-react` con tamaños consistentes:
*   Standard: `h-5 w-5` (20px).
*   Small: `h-4 w-4` (16px) dentro de botones o inputs.
*   Stroke Width: Default (2).

---
*Este documento sirve como referencia para mantener la coherencia visual y funcional en todo el ERP.*
