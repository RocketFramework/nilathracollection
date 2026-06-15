"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_decision_service_1 = require("../src/services/auth-decision.service");
// Mock repository implementation
class MockAuthorizationRepository {
    constructor() {
        this.policies = [
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
        this.permissions = [
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
    }
    async getPermissions(resourceType, scope) {
        return this.permissions.filter(p => p.resourceType === resourceType && p.scopes.includes(scope));
    }
    async getPolicy(id) {
        return this.policies.find(p => p.id === id) || null;
    }
    async getAllPolicies() {
        return this.policies;
    }
    async getAllPermissions() {
        return this.permissions;
    }
    async savePolicy(policy) { return policy; }
    async savePermission(permission) { return permission; }
    async deletePolicy(id) { }
    async deletePermission(id) { }
}
async function runTests() {
    console.log("=== STARTING AUTHORIZATION PDP TESTING ===");
    // Inject the mock repository to prevent Supabase connection side effects
    const mockRepo = new MockAuthorizationRepository();
    auth_decision_service_1.AuthorizationEngine.setRepository(mockRepo);
    // Test cases for save/update hotel
    const hotelResource = { type: 'urn:nilathra:resource:hotel' };
    // 1. Admin should be allowed to save hotel with rates
    const adminContextWithRates = {
        userId: 'admin-uuid',
        userRole: 'admin',
        payload: {
            name: 'Grand Hotel',
            rooms: [
                { room_name: 'Deluxe', room_rates: [{ rate: 150 }] }
            ]
        }
    };
    const adminSaveWithRates = await auth_decision_service_1.AuthorizationEngine.evaluate(adminContextWithRates, hotelResource, 'scopes:hotel:update');
    console.log("Test 1 (Admin saving rates):", adminSaveWithRates === true ? "PASS" : "FAIL");
    // 2. Agent should NOT be allowed to save hotel if modifying rates
    const agentContextWithRates = {
        userId: 'agent-uuid',
        userRole: 'agent',
        payload: {
            name: 'Grand Hotel',
            rooms: [
                { room_name: 'Deluxe', room_rates: [{ rate: 120 }] }
            ]
        }
    };
    const agentSaveWithRates = await auth_decision_service_1.AuthorizationEngine.evaluate(agentContextWithRates, hotelResource, 'scopes:hotel:update');
    console.log("Test 2 (Agent saving rates - should be blocked):", agentSaveWithRates === false ? "PASS" : "FAIL");
    // 3. Agent should be allowed to save general hotel details if NO rates are present in payload
    const agentContextNoRates = {
        userId: 'agent-uuid',
        userRole: 'agent',
        payload: {
            name: 'Grand Hotel - Updated Name',
            location_address: 'City Center'
        }
    };
    const agentSaveNoRates = await auth_decision_service_1.AuthorizationEngine.evaluate(agentContextNoRates, hotelResource, 'scopes:hotel:update');
    console.log("Test 3 (Agent saving info without rates):", agentSaveNoRates === true ? "PASS" : "FAIL");
    // 4. Tourist should NOT be allowed to save hotel at all
    const touristContext = {
        userId: 'tourist-uuid',
        userRole: 'tourist',
        payload: { name: 'Attempt' }
    };
    const touristSave = await auth_decision_service_1.AuthorizationEngine.evaluate(touristContext, hotelResource, 'scopes:hotel:update');
    console.log("Test 4 (Tourist saving hotel - should be blocked):", touristSave === false ? "PASS" : "FAIL");
    // 5. Admin should be allowed to delete hotel
    const adminDelete = await auth_decision_service_1.AuthorizationEngine.evaluate({ userId: 'admin-1', userRole: 'admin' }, hotelResource, 'scopes:hotel:delete');
    console.log("Test 5 (Admin deleting hotel):", adminDelete === true ? "PASS" : "FAIL");
    // 6. Agent should NOT be allowed to delete hotel
    const agentDelete = await auth_decision_service_1.AuthorizationEngine.evaluate({ userId: 'agent-1', userRole: 'agent' }, hotelResource, 'scopes:hotel:delete');
    console.log("Test 6 (Agent deleting hotel - should be blocked):", agentDelete === false ? "PASS" : "FAIL");
    console.log("=== TESTS COMPLETED ===");
}
runTests().catch(console.error);
