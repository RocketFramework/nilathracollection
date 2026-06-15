"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseAuthorizationRepository = void 0;
const admin_1 = require("../utils/supabase/admin");
class SupabaseAuthorizationRepository {
    getClient() {
        return (0, admin_1.createAdminClient)();
    }
    async getPermissions(resourceType, scope) {
        const { data, error } = await this.getClient()
            .from('auth_permissions')
            .select('*')
            .eq('resource_type', resourceType)
            .contains('scopes', [scope]);
        if (error)
            throw error;
        return (data || []).map(row => ({
            id: row.id,
            name: row.name,
            resourceType: row.resource_type,
            scopes: row.scopes,
            policyIds: row.policy_ids,
            decisionStrategy: row.decision_strategy
        }));
    }
    async getPolicy(id) {
        const { data, error } = await this.getClient()
            .from('auth_policies')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error || !data)
            return null;
        return {
            id: data.id,
            name: data.name,
            description: data.description,
            type: data.type,
            configuration: data.configuration
        };
    }
    async getAllPolicies() {
        const { data, error } = await this.getClient()
            .from('auth_policies')
            .select('*')
            .order('name', { ascending: true });
        if (error)
            throw error;
        return (data || []).map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            type: row.type,
            configuration: row.configuration
        }));
    }
    async getAllPermissions() {
        const { data, error } = await this.getClient()
            .from('auth_permissions')
            .select('*')
            .order('name', { ascending: true });
        if (error)
            throw error;
        return (data || []).map(row => ({
            id: row.id,
            name: row.name,
            resourceType: row.resource_type,
            scopes: row.scopes,
            policyIds: row.policy_ids,
            decisionStrategy: row.decision_strategy
        }));
    }
    async savePolicy(policy) {
        const dbPayload = {
            name: policy.name,
            description: policy.description,
            type: policy.type,
            configuration: policy.configuration,
            updated_at: new Date().toISOString()
        };
        let result;
        if (policy.id) {
            const { data, error } = await this.getClient()
                .from('auth_policies')
                .update(dbPayload)
                .eq('id', policy.id)
                .select()
                .single();
            if (error)
                throw error;
            result = data;
        }
        else {
            const { data, error } = await this.getClient()
                .from('auth_policies')
                .insert({ ...dbPayload })
                .select()
                .single();
            if (error)
                throw error;
            result = data;
        }
        return {
            id: result.id,
            name: result.name,
            description: result.description,
            type: result.type,
            configuration: result.configuration
        };
    }
    async savePermission(permission) {
        const dbPayload = {
            name: permission.name,
            resource_type: permission.resourceType,
            scopes: permission.scopes,
            policy_ids: permission.policyIds,
            decision_strategy: permission.decisionStrategy,
            updated_at: new Date().toISOString()
        };
        let result;
        if (permission.id) {
            const { data, error } = await this.getClient()
                .from('auth_permissions')
                .update(dbPayload)
                .eq('id', permission.id)
                .select()
                .single();
            if (error)
                throw error;
            result = data;
        }
        else {
            const { data, error } = await this.getClient()
                .from('auth_permissions')
                .insert({ ...dbPayload })
                .select()
                .single();
            if (error)
                throw error;
            result = data;
        }
        return {
            id: result.id,
            name: result.name,
            resourceType: result.resource_type,
            scopes: result.scopes,
            policyIds: result.policy_ids,
            decisionStrategy: result.decision_strategy
        };
    }
    async deletePolicy(id) {
        const { error } = await this.getClient()
            .from('auth_policies')
            .delete()
            .eq('id', id);
        if (error)
            throw error;
    }
    async deletePermission(id) {
        const { error } = await this.getClient()
            .from('auth_permissions')
            .delete()
            .eq('id', id);
        if (error)
            throw error;
    }
}
exports.SupabaseAuthorizationRepository = SupabaseAuthorizationRepository;
