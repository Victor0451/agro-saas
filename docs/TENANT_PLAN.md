# Plan de Creación de Tenants y Fincas

## Estrategia de "Tenant Creation"
La creación de un Tenant (Organización) es el punto de entrada al sistema. Dado que el sistema es multi-tenant, cada usuario debe pertenecer a un tenant.

### Flujo Propuesto: "Registro de Productor"

1.  **Registro de Usuario (`/register`)**:
    *   Formulario simple: Email, Password, Nombre Completo.
    *   Acción: `supabase.auth.signUp()`.
    *   trigger DB (opcional) o paso 2 explícito.

2.  **Onboarding ("Crear tu Organización")**:
    *   Si el usuario no tiene `tenant_id`, se redirige a `/onboarding`.
    *   **Formulario**:
        *   Nombre de la Organización (e.g., "Tabacalera del Norte").
        *   Slug (generado automáticamente).
    *   **Acción Backend**:
        *   Crear registro en tabla `tenants`.
        *   Actualizar `usuarios.tenant_id` con el nuevo ID.
        *   Roles: Asignar rol `'admin'` al usuario creador.

3.  **Configuración de Finca (`/finca/new`)**:
    *   Una vez con Tenant, el usuario crea su primera Finca.
    *   (Ya implementado en `/finca`).

### Implementación Técnica

#### Opción A: Server Action `createTenant`
```typescript
// src/actions/tenant.ts
export async function createTenant(data: { name: string }) {
    // 1. Validar usuario auth
    // 2. Insertar tenant
    // 3. Update user profile (usando Service Role si RLS bloquea update propio de tenant_id)
}
```

#### Opción B: Postgres Trigger (Más robusto)
*   Al insertar usuario en `auth.users`, un trigger inserta en `public.usuarios`.
*   La creación de `tenants` se hace via RPC o Server Action segura.

## Tareas Pendientes para Tenant Flow:
- [ ] Crear página `/register`.
- [ ] Crear página `/onboarding` (Creación de Tenant).
- [ ] Implementar Server Action para creación atómica de Tenant + Asignación de Usuario.
