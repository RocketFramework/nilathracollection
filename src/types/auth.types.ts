export interface Resource {
    type: string;       // e.g. 'urn:nilathra:resource:hotel'
    id?: string;        // instance ID
    ownerId?: string;   // owner details
}

export interface AuthContext {
    userId: string;
    userRole: string;
    payload?: any;       // data payload for field-level validations
}

export interface DynamicPolicy {
    id: string;
    name: string;
    description?: string;
    type: 'ROLE' | 'FIELD_RESTRICTION' | 'CUSTOM';
    configuration: Record<string, any>;
}

export interface DynamicPermission {
    id: string;
    name: string;
    resourceType: string;
    scopes: string[];
    policyIds: string[];
    decisionStrategy: 'AFFIRMATIVE' | 'UNANIMOUS';
}
