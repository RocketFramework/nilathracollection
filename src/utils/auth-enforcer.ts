import { AuthorizationEngine } from '@/services/auth-decision.service';
import { UserService } from '@/services/user.service';

export async function enforcePermission(
    resourceType: string,
    scope: string,
    details?: { id?: string; ownerId?: string; payload?: any }
): Promise<void> {
    const profile = await UserService.getCurrentUserProfile();
    if (!profile || !profile.id) {
        throw new Error('Not authenticated');
    }

    const context = {
        userId: profile.id,
        userRole: profile.role || 'tourist',
        payload: details?.payload
    };

    const resource = {
        type: resourceType,
        id: details?.id,
        ownerId: details?.ownerId
    };

    const isAuthorized = await AuthorizationEngine.evaluate(context, resource, scope);
    if (!isAuthorized) {
        throw new Error(`Forbidden: Access denied on scope '${scope}' for resource '${resourceType}'`);
    }
}

/**
 * Checks permission and returns a boolean instead of throwing an error.
 * Useful for conditional UI rendering on server side.
 */
export async function checkPermission(
    resourceType: string,
    scope: string,
    details?: { id?: string; ownerId?: string; payload?: any }
): Promise<boolean> {
    const profile = await UserService.getCurrentUserProfile();
    if (!profile || !profile.id) {
        return false;
    }

    const context = {
        userId: profile.id,
        userRole: profile.role || 'tourist',
        payload: details?.payload
    };

    const resource = {
        type: resourceType,
        id: details?.id,
        ownerId: details?.ownerId
    };

    return AuthorizationEngine.evaluate(context, resource, scope);
}
