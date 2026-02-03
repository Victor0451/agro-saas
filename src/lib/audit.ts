import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'ERROR' | 'VIEW';

interface AuditParams {
    action: AuditAction;
    resource: string;
    resourceId?: string;
    payload?: unknown;
    tenantId?: string;
    details?: object; // Additional metadata
}

export async function logAudit(params: AuditParams) {
    try {
        const supabase = await createClient()

        // Get Request Metadata (IP, UA)
        const headersList = await headers()
        const ip = headersList.get('x-forwarded-for') || 'unknown'
        const userAgent = headersList.get('user-agent') || 'unknown'

        // Get User info (if not provided)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            console.warn('Audit Log: No authenticated user found');
            // We might still want to log anonymous actions (like login failures)
        }

        const logEntry = {
            tenant_id: params.tenantId || null, // Will be filled by RLS/Trigger or explicit pass
            user_id: user?.id || null,
            action: params.action,
            resource: params.resource,
            resource_id: params.resourceId || null,
            payload: params.payload ? JSON.stringify(params.payload) : null,
            metadata: {
                ip,
                userAgent,
                ...params.details
            }
        }

        // Insert into DB
        const { error } = await supabase.from('audit_logs').insert(logEntry)

        if (error) {
            console.error('Failed to write audit log:', error)
        }
    } catch (error) {
        console.error('Audit Log System Error:', error)
    }
}
