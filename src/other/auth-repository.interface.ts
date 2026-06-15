import { DynamicPolicy, DynamicPermission } from '@/types/auth.types';

export interface IAuthorizationRepository {
    // Retrieve all permissions matching a resource type and scope
    getPermissions(resourceType: string, scope: string): Promise<DynamicPermission[]>;
    
    // Retrieve policy detail by ID
    getPolicy(id: string): Promise<DynamicPolicy | null>;
    
    // Fetch all policies for administration UI
    getAllPolicies(): Promise<DynamicPolicy[]>;
    
    // Fetch all permissions for administration UI
    getAllPermissions(): Promise<DynamicPermission[]>;
    
    // Save or update policy
    savePolicy(policy: Omit<DynamicPolicy, 'id'> & { id?: string }): Promise<DynamicPolicy>;
    
    // Save or update permission
    savePermission(permission: Omit<DynamicPermission, 'id'> & { id?: string }): Promise<DynamicPermission>;
    
    // Delete policy
    deletePolicy(id: string): Promise<void>;
    
    // Delete permission
    deletePermission(id: string): Promise<void>;
}
