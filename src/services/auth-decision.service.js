"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizationEngine = void 0;
const supabase_auth_repository_1 = require("./supabase-auth.repository");
class AuthorizationEngine {
    // Allows dynamic swapping of repositories (e.g. for mock testing or future adapters)
    static setRepository(repo) {
        this.repository = repo;
    }
    static getRepository() {
        return this.repository;
    }
    /**
     * Evaluates whether the given user context is allowed to access/perform the requested scope on the resource.
     */
    static async evaluate(context, resource, scope) {
        try {
            const permissions = await this.repository.getPermissions(resource.type, scope);
            // If no permissions are explicitly configured for this resource type and scope, default to ALLOW
            // because we only enforce rules on protected resource/scope combinations.
            if (permissions.length === 0) {
                return true;
            }
            // Evaluate all matching permissions. If any permission grants access, access is granted.
            for (const permission of permissions) {
                const isPermissionGranted = await this.evaluatePermission(permission, context, resource, scope);
                if (isPermissionGranted) {
                    return true;
                }
            }
            return false;
        }
        catch (error) {
            console.error('Error evaluating authorization decision:', error);
            // In case of any evaluation error, default to DENY for security
            return false;
        }
    }
    static async evaluatePermission(permission, context, resource, scope) {
        if (!permission.policyIds || permission.policyIds.length === 0) {
            return true;
        }
        const decisions = [];
        for (const policyId of permission.policyIds) {
            const policy = await this.repository.getPolicy(policyId);
            if (!policy) {
                // If a referenced policy does not exist, treat it as failed evaluation
                decisions.push(false);
                continue;
            }
            const decision = await this.evaluatePolicy(policy, context, resource, scope);
            decisions.push(decision);
        }
        if (permission.decisionStrategy === 'UNANIMOUS') {
            // All policies must evaluate to true
            return decisions.length > 0 && decisions.every(d => d === true);
        }
        else {
            // AFFIRMATIVE: At least one policy must evaluate to true
            return decisions.some(d => d === true);
        }
    }
    static async evaluatePolicy(policy, context, resource, scope) {
        switch (policy.type) {
            case 'ROLE': {
                const allowedRoles = policy.configuration?.roles || [];
                return allowedRoles.includes(context.userRole);
            }
            case 'FIELD_RESTRICTION': {
                const bypassRoles = policy.configuration?.roles || [];
                // If the user's role is in the bypass list, they are allowed to modify restricted fields
                if (bypassRoles.includes(context.userRole)) {
                    return true;
                }
                // Otherwise, check if the payload contains any restricted fields
                const restrictedFields = policy.configuration?.restricted_fields || [];
                const payload = context.payload;
                if (payload) {
                    for (const field of restrictedFields) {
                        if (this.hasField(payload, field)) {
                            // Non-bypassed role attempted to modify a restricted field
                            return false;
                        }
                    }
                }
                return true;
            }
            default:
                // Unknown policy types default to false
                return false;
        }
    }
    /**
     * Recursively checks if a field key exists and is non-empty/modified in a payload object or array.
     */
    static hasField(obj, fieldName) {
        if (obj === null || obj === undefined)
            return false;
        if (typeof obj === 'object') {
            // Check direct properties
            if (fieldName in obj) {
                const val = obj[fieldName];
                // If the value is present and non-empty/non-null, it is modified or added
                if (val !== undefined && val !== null) {
                    if (Array.isArray(val) && val.length === 0) {
                        return false; // Empty array means no rates/records added/changed
                    }
                    return true;
                }
            }
            // If it is an array, check elements
            if (Array.isArray(obj)) {
                return obj.some(item => this.hasField(item, fieldName));
            }
            // Recursively search object values
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    if (this.hasField(obj[key], fieldName)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
}
exports.AuthorizationEngine = AuthorizationEngine;
AuthorizationEngine.repository = new supabase_auth_repository_1.SupabaseAuthorizationRepository();
