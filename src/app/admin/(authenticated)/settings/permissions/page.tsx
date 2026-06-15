'use client';

import React, { useState, useEffect } from 'react';
import {
    Shield,
    Key,
    Plus,
    Edit2,
    Trash2,
    Save,
    Loader2,
    Check,
    X,
    AlertCircle,
    Lock,
    Settings,
    PlusCircle,
    Info
} from 'lucide-react';
import {
    getPoliciesAction,
    getPermissionsAction,
    savePolicyAction,
    savePermissionAction,
    deletePolicyAction,
    deletePermissionAction
} from '@/actions/auth-management.actions';
import { DynamicPolicy, DynamicPermission } from '@/types/auth.types';

export default function PermissionsPage() {
    const [activeTab, setActiveTab] = useState<'permissions' | 'policies'>('permissions');
    const [policies, setPolicies] = useState<DynamicPolicy[]>([]);
    const [permissions, setPermissions] = useState<DynamicPermission[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Modal state for Policies
    const [policyModalOpen, setPolicyModalOpen] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState<Partial<DynamicPolicy> | null>(null);

    // Modal state for Permissions
    const [permissionModalOpen, setPermissionModalOpen] = useState(false);
    const [editingPermission, setEditingPermission] = useState<Partial<DynamicPermission> | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [policiesRes, permissionsRes] = await Promise.all([
                getPoliciesAction(),
                getPermissionsAction()
            ]);

            if (policiesRes.success && policiesRes.policies) {
                setPolicies(policiesRes.policies);
            }
            if (permissionsRes.success && permissionsRes.permissions) {
                setPermissions(permissionsRes.permissions);
            }
        } catch (error) {
            showToast('Failed to load authorization configuration data.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // --- Policy CRUD Handlers ---

    const handleOpenPolicyModal = (policy?: DynamicPolicy) => {
        if (policy) {
            setEditingPolicy({ ...policy });
        } else {
            setEditingPolicy({
                name: '',
                description: '',
                type: 'ROLE',
                configuration: { roles: [], restricted_fields: [] }
            });
        }
        setPolicyModalOpen(true);
    };

    const handleSavePolicy = async () => {
        if (!editingPolicy?.name || !editingPolicy.type) {
            showToast('Please specify a policy name and type.', 'error');
            return;
        }

        setActionLoading(true);
        try {
            const res = await savePolicyAction(editingPolicy as Omit<DynamicPolicy, 'id'> & { id?: string });
            if (res.success) {
                showToast(`Policy '${editingPolicy.name}' saved successfully.`, 'success');
                setPolicyModalOpen(false);
                loadData();
            } else {
                showToast(res.error || 'Failed to save policy.', 'error');
            }
        } catch (error: any) {
            showToast(error.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeletePolicy = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete the policy '${name}'? This might break permissions mapped to it.`)) {
            return;
        }

        setActionLoading(true);
        try {
            const res = await deletePolicyAction(id);
            if (res.success) {
                showToast(`Policy '${name}' deleted successfully.`, 'success');
                loadData();
            } else {
                showToast(res.error || 'Failed to delete policy.', 'error');
            }
        } catch (error: any) {
            showToast(error.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // --- Permission CRUD Handlers ---

    const handleOpenPermissionModal = (permission?: DynamicPermission) => {
        if (permission) {
            setEditingPermission({ ...permission });
        } else {
            setEditingPermission({
                name: '',
                resourceType: '',
                scopes: [],
                policyIds: [],
                decisionStrategy: 'UNANIMOUS'
            });
        }
        setPermissionModalOpen(true);
    };

    const handleSavePermission = async () => {
        if (!editingPermission?.name || !editingPermission.resourceType || !editingPermission.scopes || editingPermission.scopes.length === 0) {
            showToast('Please specify a permission name, resource type, and at least one scope.', 'error');
            return;
        }

        setActionLoading(true);
        try {
            const res = await savePermissionAction(editingPermission as Omit<DynamicPermission, 'id'> & { id?: string });
            if (res.success) {
                showToast(`Permission '${editingPermission.name}' saved successfully.`, 'success');
                setPermissionModalOpen(false);
                loadData();
            } else {
                showToast(res.error || 'Failed to save permission.', 'error');
            }
        } catch (error: any) {
            showToast(error.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeletePermission = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete permission '${name}'?`)) {
            return;
        }

        setActionLoading(true);
        try {
            const res = await deletePermissionAction(id);
            if (res.success) {
                showToast(`Permission '${name}' deleted successfully.`, 'success');
                loadData();
            } else {
                showToast(res.error || 'Failed to delete permission.', 'error');
            }
        } catch (error: any) {
            showToast(error.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const toggleRoleInPolicy = (role: string) => {
        if (!editingPolicy) return;
        const currentRoles = editingPolicy.configuration?.roles || [];
        const updatedRoles = currentRoles.includes(role)
            ? currentRoles.filter((r: string) => r !== role)
            : [...currentRoles, role];
        
        setEditingPolicy({
            ...editingPolicy,
            configuration: {
                ...editingPolicy.configuration,
                roles: updatedRoles
            }
        });
    };

    const handleRestrictedFieldsChange = (val: string) => {
        if (!editingPolicy) return;
        const fields = val.split(',').map(f => f.trim()).filter(Boolean);
        setEditingPolicy({
            ...editingPolicy,
            configuration: {
                ...editingPolicy.configuration,
                restricted_fields: fields
            }
        });
    };

    const togglePolicyInPermission = (policyId: string) => {
        if (!editingPermission) return;
        const currentPolicies = editingPermission.policyIds || [];
        const updatedPolicies = currentPolicies.includes(policyId)
            ? currentPolicies.filter((p: string) => p !== policyId)
            : [...currentPolicies, policyId];

        setEditingPermission({
            ...editingPermission,
            policyIds: updatedPolicies
        });
    };

    const handleScopesChange = (val: string) => {
        if (!editingPermission) return;
        const scopes = val.split(',').map(s => s.trim()).filter(Boolean);
        setEditingPermission({
            ...editingPermission,
            scopes
        });
    };

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-brand-gold w-10 h-10 mb-4" />
                <p className="text-neutral-500 font-medium">Loading authorization settings...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            {/* Toast System */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-xl transition-all duration-300 border ${
                    toast.type === 'success' 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                    <AlertCircle size={20} className={toast.type === 'success' ? 'text-emerald-500' : 'text-rose-500'} />
                    <p className="font-bold text-sm">{toast.message}</p>
                </div>
            )}

            {/* Header section with Outfit design tokens */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold font-playfair text-neutral-800 tracking-tight flex items-center gap-3">
                        <Shield className="text-brand-gold" size={32} />
                        Fine-Grained Authorization
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        Configure dynamic, Keycloak-inspired policies and enforce field-level permissions across resources.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleOpenPermissionModal()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-brand-charcoal text-white hover:bg-black font-bold rounded-xl shadow-sm transition-all duration-200"
                    >
                        <PlusCircle size={18} />
                        New Permission
                    </button>
                    <button
                        onClick={() => handleOpenPolicyModal()}
                        className="flex items-center gap-2 px-5 py-2.5 border border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50 font-bold rounded-xl shadow-sm transition-all duration-200"
                    >
                        <Plus size={18} />
                        New Policy
                    </button>
                </div>
            </div>

            {/* Tab Bar Selector */}
            <div className="flex border-b border-neutral-200">
                <button
                    onClick={() => setActiveTab('permissions')}
                    className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
                        activeTab === 'permissions'
                            ? 'border-brand-gold text-brand-gold'
                            : 'border-transparent text-neutral-500 hover:text-neutral-700'
                    }`}
                >
                    <Key size={16} />
                    Permissions Mapping ({permissions.length})
                </button>
                <button
                    onClick={() => setActiveTab('policies')}
                    className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
                        activeTab === 'policies'
                            ? 'border-brand-gold text-brand-gold'
                            : 'border-transparent text-neutral-500 hover:text-neutral-700'
                    }`}
                >
                    <Settings size={16} />
                    Authorization Policies ({policies.length})
                </button>
            </div>

            {/* Main Content Area */}
            {activeTab === 'permissions' ? (
                <div className="grid gap-6">
                    {permissions.length === 0 ? (
                        <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-12 text-center">
                            <Lock className="mx-auto text-neutral-400 mb-3" size={40} />
                            <h3 className="font-bold text-[#2B2B2B] text-lg">No permissions mapped</h3>
                            <p className="text-neutral-500 text-sm mt-1 max-w-md mx-auto">
                                Create permission rules to map dynamic resources and operations (scopes) to validation policies.
                            </p>
                        </div>
                    ) : (
                        permissions.map(permission => (
                            <div key={permission.id} className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                                <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-neutral-50/50 border-b border-neutral-100">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-brand-gold uppercase tracking-wider bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                                                {permission.decisionStrategy}
                                            </span>
                                            <h3 className="font-bold text-[#2B2B2B] text-lg">{permission.name}</h3>
                                        </div>
                                        <p className="text-xs text-neutral-500 mt-1 font-mono">
                                            Resource: {permission.resourceType}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleOpenPermissionModal(permission)}
                                            className="p-2 text-neutral-500 hover:text-brand-charcoal hover:bg-neutral-100 rounded-lg transition-colors"
                                            title="Edit Permission"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeletePermission(permission.id, permission.name)}
                                            className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                            title="Delete Permission"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Evaluated Scopes</h4>
                                        <div className="flex flex-wrap gap-1.5">
                                            {permission.scopes.map(scope => (
                                                <span key={scope} className="text-xs font-medium font-mono text-neutral-700 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-md">
                                                    {scope}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Mapped Policies</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {permission.policyIds.length === 0 ? (
                                                <span className="text-xs text-neutral-400 italic">No policies mapped (Always permit)</span>
                                            ) : (
                                                permission.policyIds.map(pId => {
                                                    const policy = policies.find(p => p.id === pId);
                                                    return (
                                                        <span key={pId} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-charcoal bg-amber-50/50 border border-brand-gold/30 px-3 py-1 rounded-full">
                                                            <Shield size={12} className="text-brand-gold" />
                                                            {policy ? policy.name : 'Unknown Policy'}
                                                        </span>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="grid gap-6">
                    {policies.length === 0 ? (
                        <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-12 text-center">
                            <Settings className="mx-auto text-neutral-400 mb-3" size={40} />
                            <h3 className="font-bold text-[#2B2B2B] text-lg">No policies defined</h3>
                            <p className="text-neutral-500 text-sm mt-1 max-w-md mx-auto">
                                Create reusable policies to specify access rules, role lists, or field-level modifications.
                            </p>
                        </div>
                    ) : (
                        policies.map(policy => (
                            <div key={policy.id} className="bg-white rounded-2xl border border-neutral-200 p-6 hover:shadow-md transition-all duration-200">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                                policy.type === 'ROLE' 
                                                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                                    : 'bg-purple-50 text-purple-700 border border-purple-200'
                                            }`}>
                                                {policy.type === 'FIELD_RESTRICTION' ? 'Field Restriction' : 'Role Policy'}
                                            </span>
                                            <h3 className="font-bold text-[#2B2B2B] text-lg">{policy.name}</h3>
                                        </div>
                                        <p className="text-sm text-neutral-500 mt-1">{policy.description || 'No description provided.'}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleOpenPolicyModal(policy)}
                                            className="p-2 text-neutral-500 hover:text-brand-charcoal hover:bg-neutral-100 rounded-lg transition-colors"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeletePolicy(policy.id, policy.name)}
                                            className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-neutral-100 flex flex-col sm:flex-row gap-4 justify-between">
                                    {policy.type === 'ROLE' ? (
                                        <div>
                                            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-1">Allowed Roles</span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {policy.configuration?.roles?.map((role: string) => (
                                                    <span key={role} className="text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200 px-2.5 py-0.5 rounded-md">
                                                        {role}
                                                    </span>
                                                )) || <span className="text-xs text-neutral-400 italic">None configured</span>}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                            <div>
                                                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-1">Authorized Roles (Bypass Restriction)</span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {policy.configuration?.roles?.map((role: string) => (
                                                        <span key={role} className="text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200 px-2.5 py-0.5 rounded-md">
                                                            {role}
                                                        </span>
                                                    )) || <span className="text-xs text-neutral-400 italic">None configured</span>}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-1">Restricted Payload Fields</span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {policy.configuration?.restricted_fields?.map((field: string) => (
                                                        <span key={field} className="text-xs font-mono font-medium bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-md">
                                                            {field}
                                                        </span>
                                                    )) || <span className="text-xs text-neutral-400 italic">None configured</span>}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Policy Modal */}
            {policyModalOpen && editingPolicy && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-lg text-[#2B2B2B]">
                                    {editingPolicy.id ? 'Edit Authorization Policy' : 'Create New Policy'}
                                </h3>
                                <p className="text-xs text-neutral-500">Define role boundaries or field block lists.</p>
                            </div>
                            <button
                                onClick={() => setPolicyModalOpen(false)}
                                className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Policy Name</label>
                                <input
                                    type="text"
                                    value={editingPolicy.name || ''}
                                    onChange={(e) => setEditingPolicy({ ...editingPolicy, name: e.target.value })}
                                    placeholder="e.g. Only Agents, Block Rate Modification"
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none text-sm font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Description</label>
                                <textarea
                                    value={editingPolicy.description || ''}
                                    onChange={(e) => setEditingPolicy({ ...editingPolicy, description: e.target.value })}
                                    placeholder="Explain the purpose of this rule."
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none text-sm font-medium h-20"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Policy Type</label>
                                <select
                                    value={editingPolicy.type || 'ROLE'}
                                    onChange={(e) => setEditingPolicy({
                                        ...editingPolicy,
                                        type: e.target.value as 'ROLE' | 'FIELD_RESTRICTION',
                                        configuration: { roles: [], restricted_fields: [] }
                                    })}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none text-sm font-medium"
                                >
                                    <option value="ROLE">Role-Based Policy (RBAC)</option>
                                    <option value="FIELD_RESTRICTION">Field-Level Restriction Policy (ABAC)</option>
                                </select>
                            </div>

                            {/* Role selection for ROLE or bypass roles in FIELD_RESTRICTION */}
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                                    {editingPolicy.type === 'ROLE' ? 'Allowed Roles' : 'Bypass Roles (Roles that CAN edit restricted fields)'}
                                </label>
                                <div className="grid grid-cols-2 gap-2 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                                    {['admin', 'agent', 'agent_supervisor', 'tourist', 'finance'].map(role => {
                                        const isChecked = editingPolicy.configuration?.roles?.includes(role) || false;
                                        return (
                                            <label key={role} className="flex items-center gap-2.5 p-1.5 hover:bg-white rounded-lg cursor-pointer transition-colors text-sm font-medium text-neutral-700">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => toggleRoleInPolicy(role)}
                                                    className="w-4 h-4 text-brand-gold rounded border-neutral-300 focus:ring-brand-gold"
                                                />
                                                <span className="capitalize">{role.replace('_', ' ')}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {editingPolicy.type === 'FIELD_RESTRICTION' && (
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Restricted Fields (Comma-separated)</label>
                                    <input
                                        type="text"
                                        defaultValue={editingPolicy.configuration?.restricted_fields?.join(', ') || ''}
                                        onBlur={(e) => handleRestrictedFieldsChange(e.target.value)}
                                        placeholder="e.g. room_rates, contracted_price"
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none text-sm font-medium"
                                    />
                                    <span className="text-[10px] text-neutral-400 mt-1 block flex items-center gap-1">
                                        <Info size={12} />
                                        If the payload contains any of these keys, modifications are blocked for un-bypassed roles.
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-2">
                            <button
                                onClick={() => setPolicyModalOpen(false)}
                                className="px-5 py-2 border border-neutral-300 text-neutral-600 rounded-xl hover:bg-neutral-100 font-bold text-sm transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSavePolicy}
                                disabled={actionLoading}
                                className="flex items-center gap-2 px-5 py-2 bg-brand-charcoal hover:bg-black text-white font-bold rounded-xl text-sm shadow-sm transition-colors disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Save Policy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Permission Modal */}
            {permissionModalOpen && editingPermission && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-lg text-[#2B2B2B]">
                                    {editingPermission.id ? 'Edit Permission Mapping' : 'Create Permission Mapping'}
                                </h3>
                                <p className="text-xs text-neutral-500">Map protected resources to evaluation policies.</p>
                            </div>
                            <button
                                onClick={() => setPermissionModalOpen(false)}
                                className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Permission Name</label>
                                <input
                                    type="text"
                                    value={editingPermission.name || ''}
                                    onChange={(e) => setEditingPermission({ ...editingPermission, name: e.target.value })}
                                    placeholder="e.g. Hotel Update Policy Rule"
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none text-sm font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Resource Type Identifier</label>
                                <input
                                    type="text"
                                    value={editingPermission.resourceType || ''}
                                    onChange={(e) => setEditingPermission({ ...editingPermission, resourceType: e.target.value })}
                                    placeholder="e.g. urn:nilathra:resource:hotel"
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none text-sm font-medium font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Scopes (Comma-separated)</label>
                                <input
                                    type="text"
                                    defaultValue={editingPermission.scopes?.join(', ') || ''}
                                    onBlur={(e) => handleScopesChange(e.target.value)}
                                    placeholder="e.g. scopes:hotel:update, scopes:hotel:create"
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none text-sm font-medium font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Decision Strategy</label>
                                <select
                                    value={editingPermission.decisionStrategy || 'UNANIMOUS'}
                                    onChange={(e) => setEditingPermission({
                                        ...editingPermission,
                                        decisionStrategy: e.target.value as 'UNANIMOUS' | 'AFFIRMATIVE'
                                    })}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none text-sm font-medium"
                                >
                                    <option value="UNANIMOUS">UNANIMOUS (All mapped policies must pass)</option>
                                    <option value="AFFIRMATIVE">AFFIRMATIVE (Any mapped policy passing is sufficient)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Map Evaluation Policies</label>
                                <div className="grid gap-2 bg-neutral-50 p-3 rounded-xl border border-neutral-200 max-h-[160px] overflow-y-auto">
                                    {policies.length === 0 ? (
                                        <p className="text-xs text-neutral-400 italic">No policies defined yet.</p>
                                    ) : (
                                        policies.map(policy => {
                                            const isChecked = editingPermission.policyIds?.includes(policy.id) || false;
                                            return (
                                                <label key={policy.id} className="flex items-center gap-2.5 p-1.5 hover:bg-white rounded-lg cursor-pointer transition-colors text-sm font-medium text-neutral-700">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => togglePolicyInPermission(policy.id)}
                                                        className="w-4 h-4 text-brand-gold rounded border-neutral-300 focus:ring-brand-gold"
                                                    />
                                                    <div>
                                                        <span>{policy.name}</span>
                                                        <span className="text-[10px] text-neutral-400 ml-2">({policy.type.replace('_', ' ')})</span>
                                                    </div>
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-2">
                            <button
                                onClick={() => setPermissionModalOpen(false)}
                                className="px-5 py-2 border border-neutral-300 text-neutral-600 rounded-xl hover:bg-neutral-100 font-bold text-sm transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSavePermission}
                                disabled={actionLoading}
                                className="flex items-center gap-2 px-5 py-2 bg-brand-charcoal hover:bg-black text-white font-bold rounded-xl text-sm shadow-sm transition-colors disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Save Mapping
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
