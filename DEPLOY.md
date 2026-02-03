# Guía de Despliegue - AgroERP

Esta guía detalla los pasos para desplegar la aplicación AgroERP en un entorno de producción utilizando **Vercel** (Frontend) y **Supabase** (Backend).

## 1. Requisitos Previos

- Cuenta de GitHub (para el código fuente).
- Cuenta de Vercel (para el hosting del frontend).
- Cuenta de Supabase (para la base de datos y autenticación).
- Node.js 18+ instalado localmente (opcional, para pruebas).

## 2. Configuración del Backend (Supabase)

1.  **Crear Proyecto**:
    - Ingresa a [database.new](https://database.new) y crea un nuevo proyecto.
    - Guarda la contraseña de la base de datos en un lugar seguro.

2.  **Configurar Base de Datos**:
    - Ve al `SQL Editor` en Supabase.
    - Ejecuta los scripts de migración que se encuentran en la carpeta `supabase/migrations/` de este repositorio, en orden secuencial (001, 002, 003...).
    - Esto creará las tablas `tenants`, `usuarios`, `fincas`, `lotes`, `insumos`, etc., y configurará las políticas de seguridad (RLS).

3.  **Configurar Autenticación**:
    - Ve a `Authentication` > `Settings`.
    - Deshabilita "Email Confirmations" si deseas un registro inmediato para pruebas (recomendado habilitar en producción).
    - Agrega la URL de tu despliegue en Vercel (una vez la tengas) en `Site URL` y `Redirect URLs`.

4.  **Obtener Credenciales**:
    - Ve a `Project Settings` > `API`.
    - Copia la `Project URL` y la `anon public key`.

## 3. Configuración del Frontend (Vercel)

1.  **Importar Proyecto**:
    - Ingresa a Vercel y haz clic en "Add New..." > "Project".
    - Selecciona tu repositorio de GitHub `agro-saas`.

2.  **Configurar Variables de Entorno**:
    - En la sección "Environment Variables", agrega las siguientes claves (valores obtenidos de Supabase):
        - `NEXT_PUBLIC_SUPABASE_URL`: Tu Project URL.
        - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Tu anon public key.

3.  **Desplegar**:
    - Haz clic en "Deploy".
    - Vercel construirá la aplicación. Si todo es correcto, verás la pantalla de felicitaciones.

## 4. Verificación Post-Despliegue

1.  **Acceso Inicial**:
    - Abre la URL proporcionada por Vercel (ej: `https://agro-saas.vercel.app`).
    - Intenta registrarte (`/register`).

2.  **Creación de Organización**:
    - Completa el flujo de `/onboarding` para crear tu primer Tenant.

3.  **Logs de Build**:
    - Si el despliegue falla, revisa los logs en Vercel.
    - Error común: "Missing Supabase Environment Variables". Asegúrate de haber realizado el paso 3.2 correctamente.

## 5. Actualizaciones

Para actualizar el sitio:
1.  Haz tus cambios en local.
2.  Haz commit y push a la rama `main` en GitHub.
3.  Vercel detectará el cambio y redeplegará automáticamente.
