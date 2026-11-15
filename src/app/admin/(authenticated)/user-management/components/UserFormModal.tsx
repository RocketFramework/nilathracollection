"use client";

import { useState, useEffect } from "react";
import { UserProfileDTO, UserRoleType } from "@/dtos/user-vendor.dto";
import {
    createUserAction,
    updateUserAction,
    getAllSupervisorsAction
} from "@/actions/user-management.actions";

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: UserProfileDTO | null;
    isEdit: boolean;
    currentTabRole: UserRoleType;
}

const isAgentLayerRole = (r?: string | null) =>
    r === "agent" ||
    r === "senior_agent" ||
    r === "executive_agent" ||
    r === "agent_supervisor" ||
    r === "senior_supervisor" ||
    r === "executive_supervisor";

const SECONDARY_ROLE_OPTIONS: Array<{ id: UserRoleType; label: string }> = [
    { id: "admin", label: "Admin" },
    { id: "finance", label: "Finance Staff" },
    { id: "principal_supervisor", label: "Principal Supervisor" },
    { id: "executive_supervisor", label: "Executive Supervisor" },
    { id: "senior_supervisor", label: "Senior Supervisor" },
    { id: "agent_supervisor", label: "Supervisor" },
    { id: "executive_agent", label: "Executive Agent" },
    { id: "senior_agent", label: "Senior Agent" },
    { id: "agent", label: "Agent" }
];

const getRoleLabel = (r: UserRoleType | string) => {
    switch (r) {
        case "admin":
            return "Admin";
        case "finance":
            return "Finance Staff";
        case "principal_supervisor":
            return "Principal Supervisor";
        case "executive_supervisor":
            return "Executive Supervisor";
        case "senior_supervisor":
            return "Senior Supervisor";
        case "agent_supervisor":
            return "Supervisor";
        case "executive_agent":
            return "Executive Agent";
        case "senior_agent":
            return "Senior Agent";
        case "agent":
            return "Agent";
        case "tourist":
            return "Tourist";
        default:
            return r.charAt(0).toUpperCase() + r.slice(1);
    }
};

export function UserFormModal({
    isOpen,
    onClose,
    onSuccess,
    user,
    isEdit,
    currentTabRole
}: UserFormModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [supervisors, setSupervisors] = useState<Array<{ id: string; name: string }>>([]);

    const canConfigureRoles = isEdit
        ? Boolean(
              user?.can_edit_roles ||
                  user?.roles?.some((r) => r === "admin" || r === "finance") ||
                  (!user?.roles && (currentTabRole === "admin" || currentTabRole === "finance"))
          )
        : currentTabRole === "admin" || currentTabRole === "finance";

    const initialPrimary: UserRoleType = isEdit
        ? user?.primary_role ||
          (user?.roles?.includes("admin")
              ? "admin"
              : user?.roles?.includes("finance")
                ? "finance"
                : user?.role || currentTabRole)
        : currentTabRole;

    const initialSecondary: string = isEdit
        ? user?.secondary_role ||
          user?.roles?.find((r) => r !== initialPrimary) ||
          ""
        : "";

    const [primaryRole, setPrimaryRole] = useState<UserRoleType>(initialPrimary);
    const [secondaryRole, setSecondaryRole] = useState<string>(initialSecondary);
    const [supervisorId, setSupervisorId] = useState<string>(user?.supervisor_id || "");

    useEffect(() => {
        if (isOpen) {
            setPrimaryRole(initialPrimary);
            setSecondaryRole(initialSecondary);
            setSupervisorId(user?.supervisor_id || "");
            setError(null);
        }
    }, [isOpen, user?.id, currentTabRole]);

    // Determine which operational role (if any) needs a "Reports To" superior dropdown
    const activeHierarchyRole: UserRoleType | null = canConfigureRoles
        ? isAgentLayerRole(secondaryRole)
            ? (secondaryRole as UserRoleType)
            : null
        : isAgentLayerRole(user?.role || currentTabRole)
          ? ((user?.role || currentTabRole) as UserRoleType)
          : null;

    useEffect(() => {
        if (isOpen && activeHierarchyRole) {
            getAllSupervisorsAction(activeHierarchyRole).then((res) => {
                if (res.success && res.supervisors) {
                    setSupervisors(
                        res.supervisors.filter((sup: any) => !user || sup.id !== user.id)
                    );
                }
            });
        } else {
            setSupervisors([]);
        }
    }, [isOpen, activeHierarchyRole, user?.id]);

    const handlePrimaryRoleChange = (nextPrimary: UserRoleType) => {
        setPrimaryRole(nextPrimary);
        if (secondaryRole === nextPrimary) {
            setSecondaryRole("");
        }
    };

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        try {
            if (isEdit && user) {
                const payload: any = {
                    first_name: formData.get("first_name") as string,
                    last_name: formData.get("last_name") as string,
                    phone: formData.get("phone") as string
                };

                if (canConfigureRoles) {
                    payload.primary_role = primaryRole;
                    payload.secondary_role = secondaryRole
                        ? (secondaryRole as UserRoleType)
                        : null;
                    payload.supervisor_id = activeHierarchyRole ? supervisorId || "" : "";
                } else if (activeHierarchyRole) {
                    payload.supervisor_id = supervisorId || "";
                }

                const res = await updateUserAction(
                    user.id,
                    user.role || currentTabRole,
                    payload
                );
                if (res.error) throw new Error(res.error);
            } else {
                formData.set("role", canConfigureRoles ? primaryRole : currentTabRole);
                if (canConfigureRoles && secondaryRole && secondaryRole !== primaryRole) {
                    formData.set("secondary_role", secondaryRole);
                } else {
                    formData.delete("secondary_role");
                }
                if (activeHierarchyRole && supervisorId) {
                    formData.set("supervisor_id", supervisorId);
                }
                const res = await createUserAction(formData);
                if (res.error) throw new Error(res.error);
            }
            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (!isOpen) return null;

    const isTouristAccount = (user?.role || currentTabRole) === "tourist" && !canConfigureRoles;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[92vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                    {isEdit
                        ? `Edit User Profile${canConfigureRoles ? " & Roles" : ""}`
                        : `Add New ${getRoleLabel(canConfigureRoles ? primaryRole : currentTabRole)}`}
                </h2>

                {error && (
                    <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                First Name
                            </label>
                            <input
                                type="text"
                                name="first_name"
                                required
                                defaultValue={user?.first_name || ""}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-xs p-2 border focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Last Name
                            </label>
                            <input
                                type="text"
                                name="last_name"
                                required
                                defaultValue={user?.last_name || ""}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-xs p-2 border focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {!isEdit && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-xs p-2 border focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Initial Password
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-xs p-2 border focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Provide this initial password to the user.
                                </p>
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input
                            type="text"
                            name="phone"
                            defaultValue={user?.phone || ""}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-xs p-2 border focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* ROLE CONFIGURATION SECTION */}
                    {canConfigureRoles ? (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Role &amp; Dual-Role Assignment (Admin / Finance)
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Admin and Finance users can switch between Admin and Finance or hold two roles together (for example, Finance Staff + Senior Agent).
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Primary Role
                                    </label>
                                    <select
                                        value={primaryRole}
                                        onChange={(e) =>
                                            handlePrimaryRoleChange(e.target.value as UserRoleType)
                                        }
                                        className="block w-full rounded-lg border-gray-300 p-2 border bg-white text-sm"
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="finance">Finance Staff</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Second Role (Optional)
                                    </label>
                                    <select
                                        value={secondaryRole}
                                        onChange={(e) => setSecondaryRole(e.target.value)}
                                        className="block w-full rounded-lg border-gray-300 p-2 border bg-white text-sm"
                                    >
                                        <option value="">None (Single Role)</option>
                                        {SECONDARY_ROLE_OPTIONS.filter(
                                            (opt) => opt.id !== primaryRole
                                        ).map((opt) => (
                                            <option key={opt.id} value={opt.id}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="text-xs text-slate-600 bg-white px-3 py-2 rounded-lg border border-slate-200">
                                Effective Assignment:{" "}
                                <strong>
                                    {getRoleLabel(primaryRole)}
                                    {secondaryRole ? ` + ${getRoleLabel(secondaryRole)}` : ""}
                                </strong>
                            </div>
                        </div>
                    ) : isTouristAccount ? (
                        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                            <p className="font-bold">Assigned Role: Tourist (Portal Only)</p>
                            <p className="mt-0.5 text-amber-800">
                                Tourist accounts only have access to the Tourist Portal (<code>/tourist</code>) and cannot hold administrative, finance, or agent roles.
                            </p>
                        </div>
                    ) : (
                        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700">
                            <p className="font-bold">
                                Assigned Role: {getRoleLabel(user?.role || currentTabRole)} (Fixed Role)
                            </p>
                            <p className="mt-0.5 text-gray-500">
                                Operational hierarchy roles (Supervisors and Agents) have a fixed single role. Role switching and dual roles apply only to Admin and Finance accounts.
                            </p>
                        </div>
                    )}

                    {activeHierarchyRole && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Reports To (Supervisor / Senior for {getRoleLabel(activeHierarchyRole)})
                            </label>
                            <select
                                name="supervisor_id"
                                value={supervisorId}
                                onChange={(e) => setSupervisorId(e.target.value)}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-xs p-2 border focus:ring-blue-500 focus:border-blue-500 bg-white"
                            >
                                <option value="">No Superior Assigned</option>
                                {supervisors.map((sup) => (
                                    <option key={sup.id} value={sup.id}>
                                        {sup.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50 cursor-pointer"
                        >
                            {loading ? "Saving..." : "Save User"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
