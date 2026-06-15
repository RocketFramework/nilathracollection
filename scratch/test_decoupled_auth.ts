import { AuthorizationEngine } from '../src/services/auth-decision.service';
import { IAuthorizationRepository } from '../src/other/auth-repository.interface';
import { DynamicPolicy, DynamicPermission, AuthContext, Resource } from '../src/types/auth.types';

// Mock repository implementation
class MockAuthorizationRepository implements IAuthorizationRepository {
    private policies: DynamicPolicy[] = [
        {
            id: '1',
            name: 'Only Admins',
            type: 'ROLE',
            configuration: { roles: ['admin'] }
        },
        {
            id: '2',
            name: 'Only Agents and Supervisors',
            type: 'ROLE',
            configuration: { roles: ['admin', 'agent', 'agent_supervisor'] }
        },
        {
            id: '3',
            name: 'Room Rates Field Restriction',
            type: 'FIELD_RESTRICTION',
            configuration: { roles: ['admin'], restricted_fields: ['room_rates'] }
        }
    ];

    private permissions: DynamicPermission[] = [
        {
            id: 'p1',
            name: 'Hotel Save Permission',
            resourceType: 'urn:nilathra:resource:hotel',
            scopes: ['scopes:hotel:create', 'scopes:hotel:update'],
            policyIds: ['2', '3'], // Must satisfy both (UNANIMOUS): Agent/Admin check AND Rate edit check
            decisionStrategy: 'UNANIMOUS'
        },
        {
            id: 'p2',
            name: 'Hotel Delete Permission',
            resourceType: 'urn:nilathra:resource:hotel',
            scopes: ['scopes:hotel:delete'],
            policyIds: ['1'], // Only Admins
            decisionStrategy: 'UNANIMOUS'
        }
    ];

    async getPermissions(resourceType: string, scope: string): Promise<DynamicPermission[]> {
        return this.permissions.filter(p => p.resourceType === resourceType && p.scopes.includes(scope));
    }

    async getPolicy(id: string): Promise<DynamicPolicy | null> {
        return this.policies.find(p => p.id === id) || null;
    }

    async getAllPolicies(): Promise<DynamicPolicy[]> {
        return this.policies;
    }

    async getAllPermissions(): Promise<DynamicPermission[]> {
        return this.permissions;
    }

    async savePolicy(policy: any): Promise<DynamicPolicy> { return policy; }
    async savePermission(permission: any): Promise<DynamicPermission> { return permission; }
    async deletePolicy(id: string): Promise<void> {}
    async deletePermission(id: string): Promise<void> {}
}

async function runTests() {
    console.log("=== STARTING AUTHORIZATION PDP TESTING ===");
    
    // Inject the mock repository to prevent Supabase connection side effects
    const mockRepo = new MockAuthorizationRepository();
    AuthorizationEngine.setRepository(mockRepo);

    // Test cases for save/update hotel
    const hotelResource: Resource = { type: 'urn:nilathra:resource:hotel' };

    // 1. Admin should be allowed to save hotel with rates
    const adminContextWithRates: AuthContext = {
        userId: 'admin-uuid',
        userRole: 'admin',
        payload: {
            name: 'Grand Hotel',
            rooms: [
                { room_name: 'Deluxe', room_rates: [{ rate: 150 }] }
            ]
        }
    };
    const adminSaveWithRates = await AuthorizationEngine.evaluate(adminContextWithRates, hotelResource, 'scopes:hotel:update');
    console.log("Test 1 (Admin saving rates):", adminSaveWithRates === true ? "PASS" : "FAIL");

    // 2. Agent should NOT be allowed to save hotel if modifying rates
    const agentContextWithRates: AuthContext = {
        userId: 'agent-uuid',
        userRole: 'agent',
        payload: {
            name: 'Grand Hotel',
            rooms: [
                { room_name: 'Deluxe', room_rates: [{ rate: 120 }] }
            ]
        }
    };
    const agentSaveWithRates = await AuthorizationEngine.evaluate(agentContextWithRates, hotelResource, 'scopes:hotel:update');
    console.log("Test 2 (Agent saving rates - should be blocked):", agentSaveWithRates === false ? "PASS" : "FAIL");

    // 3. Agent should be allowed to save general hotel details if NO rates are present in payload
    const agentContextNoRates: AuthContext = {
        userId: 'agent-uuid',
        userRole: 'agent',
        payload: {
            name: 'Grand Hotel - Updated Name',
            location_address: 'City Center'
        }
    };
    const agentSaveNoRates = await AuthorizationEngine.evaluate(agentContextNoRates, hotelResource, 'scopes:hotel:update');
    console.log("Test 3 (Agent saving info without rates):", agentSaveNoRates === true ? "PASS" : "FAIL");

    // 4. Tourist should NOT be allowed to save hotel at all
    const touristContext: AuthContext = {
        userId: 'tourist-uuid',
        userRole: 'tourist',
        payload: { name: 'Attempt' }
    };
    const touristSave = await AuthorizationEngine.evaluate(touristContext, hotelResource, 'scopes:hotel:update');
    console.log("Test 4 (Tourist saving hotel - should be blocked):", touristSave === false ? "PASS" : "FAIL");

    // 5. Admin should be allowed to delete hotel
    const adminDelete = await AuthorizationEngine.evaluate({ userId: 'admin-1', userRole: 'admin' }, hotelResource, 'scopes:hotel:delete');
    console.log("Test 5 (Admin deleting hotel):", adminDelete === true ? "PASS" : "FAIL");

    // 6. Agent should NOT be allowed to delete hotel
    const agentDelete = await AuthorizationEngine.evaluate({ userId: 'agent-1', userRole: 'agent' }, hotelResource, 'scopes:hotel:delete');
    console.log("Test 6 (Agent deleting hotel - should be blocked):", agentDelete === false ? "PASS" : "FAIL");

    console.log("=== TESTS COMPLETED ===");
}

runTests().catch(console.error);
