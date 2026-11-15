"use client";

import { UserProfileDTO } from "@/dtos/user-vendor.dto";
import { deactivateUserAction, activateUserAction } from "@/actions/user-management.actions";

interface UserListTableProps {
    users: UserProfileDTO[];
    onEdit: (user: UserProfileDTO) => void;
    onResetPassword: (user: UserProfileDTO) => void;
    onRefresh: () => void;
}

const HIERARCHY_REPORTING_ROLES = new Set([
    "agent",
    "senior_agent",
    "executive_agent",
    "agent_supervisor",
    "senior_supervisor",
    "executive_supervisor"
]);

function roleBadgeStyle(roleName: string): string {
    if (roleName === "admin") {
        return "bg-neutral-900 text-[#D4AF37] border-neutral-800";
    }
    if (roleName === "finance") {
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
    }
    if (roleName === "tourist") {
        return "bg-amber-50 text-amber-800 border-amber-200";
    }
    if (roleName.includes("supervisor")) {
        return "bg-indigo-50 text-indigo-800 border-indigo-200";
    }
    return "bg-blue-50 text-blue-800 border-blue-200";
}

function formatRoleLabel(roleName: string): string {
    switch (roleName) {
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
            return roleName;
    }
}

export function UserListTable({ users, onEdit, onResetPassword, onRefresh }: UserListTableProps) {
    const handleDeactivate = async (userId: string, role: string) => {
        if (!confirm("Are you sure you want to deactivate this user?")) return;

        try {
            const res = await deactivateUserAction(userId, role as any);
            if (res.error) throw new Error(res.error);
            onRefresh();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleActivate = async (userId: string, role: string) => {
        if (!confirm("Are you sure you want to activate this user?")) return;

        try {
            const res = await activateUserAction(userId, role as any);
            if (res.error) throw new Error(res.error);
            onRefresh();
        } catch (error: any) {
            alert(error.message);
        }
    };

    if (users.length === 0) {
        return (
            <div className="text-gray-500 py-10 text-center bg-gray-50 rounded-xl border border-gray-200">
                No users found for this role.
            </div>
        );
    }

    const showSupervisorCol = users.some((u) => {
        const allRoles = u.roles && u.roles.length > 0 ? u.roles : u.role ? [u.role] : [];
        return allRoles.some((r) => HIERARCHY_REPORTING_ROLES.has(r));
    });

    return (
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Assigned Role(s)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Phone
                        </th>
                        {showSupervisorCol && (
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Reports To (Superior)
                            </th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => {
                        const assignedRoles =
                            user.roles && user.roles.length > 0
                                ? user.roles
                                : user.role
                                  ? [user.role]
                                  : [];
                        const isDualRole = assignedRoles.length > 1;
                        const isTourist =
                            assignedRoles.length === 1 && assignedRoles[0] === "tourist";
                        const canEditRoles = Boolean(user.can_edit_roles);
                        const userSupportsSupervisor = assignedRoles.some((r) =>
                            HIERARCHY_REPORTING_ROLES.has(r)
                        );

                        return (
                            <tr key={user.id} className="hover:bg-gray-50/60">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-semibold text-gray-900">
                                        {user.first_name || "N/A"} {user.last_name || ""}
                                    </div>
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {assignedRoles.map((r, idx) => (
                                            <span key={r} className="inline-flex items-center gap-1">
                                                {idx > 0 && (
                                                    <span className="text-xs font-bold text-gray-400">
                                                        +
                                                    </span>
                                                )}
                                                <span
                                                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleBadgeStyle(
                                                        r
                                                    )}`}
                                                >
                                                    {formatRoleLabel(r)}
                                                </span>
                                            </span>
                                        ))}
                                        {isDualRole && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                                Dual Role
                                            </span>
                                        )}
                                        {isTourist && (
                                            <span className="text-[10px] font-medium text-amber-700">
                                                (Tourist Portal Only)
                                            </span>
                                        )}
                                        {!canEditRoles && !isTourist && (
                                            <span className="text-[10px] text-gray-400">
                                                Fixed Role
                                            </span>
                                        )}
                                    </div>
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                    {user.email}
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                    {user.phone || "N/A"}
                                </td>

                                {showSupervisorCol && (
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                        {userSupportsSupervisor
                                            ? user.supervisor
                                                ? `${user.supervisor.first_name} ${
                                                      user.supervisor.last_name || ""
                                                  }${
                                                      user.supervisor.role_label
                                                          ? ` (${user.supervisor.role_label})`
                                                          : ""
                                                  }`.trim()
                                                : "None"
                                            : "—"}
                                    </td>
                                )}

                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            user.is_active === false
                                                ? "bg-red-100 text-red-800"
                                                : "bg-green-100 text-green-800"
                                        }`}
                                    >
                                        {user.is_active === false ? "Inactive" : "Active"}
                                    </span>
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                    <button
                                        className="text-blue-600 hover:text-blue-900 font-semibold cursor-pointer"
                                        onClick={() => onEdit(user)}
                                    >
                                        {canEditRoles ? "Edit / Roles" : "Edit"}
                                    </button>
                                    <button
                                        className="text-yellow-700 hover:text-yellow-900 cursor-pointer"
                                        onClick={() => onResetPassword(user)}
                                    >
                                        Reset Password
                                    </button>
                                    {user.is_active === false ? (
                                        <button
                                            className="text-green-600 hover:text-green-900 cursor-pointer"
                                            onClick={() => handleActivate(user.id, user.role!)}
                                        >
                                            Enable
                                        </button>
                                    ) : (
                                        <button
                                            className="text-red-600 hover:text-red-900 cursor-pointer"
                                            onClick={() => handleDeactivate(user.id, user.role!)}
                                        >
                                            Disable
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
