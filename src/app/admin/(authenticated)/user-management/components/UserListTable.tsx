"use client";

import { UserProfileDTO } from "@/dtos/user-vendor.dto";
import { deactivateUserAction, activateUserAction } from "@/actions/user-management.actions";

interface UserListTableProps {
    users: UserProfileDTO[];
    onEdit: (user: UserProfileDTO) => void;
    onResetPassword: (user: UserProfileDTO) => void;
    onRefresh: () => void;
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
        return <div className="text-gray-500 py-10 text-center bg-gray-50 rounded">No users found for this role.</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-medium text-gray-900">{user.first_name || 'N/A'} {user.last_name || ''}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                {user.phone || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${(user as any).is_active === false ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                    {(user as any).is_active === false ? 'Inactive' : 'Active'}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                <button className="text-blue-600 hover:text-blue-900" onClick={() => onEdit(user)}>Edit</button>
                                <button className="text-yellow-600 hover:text-yellow-900" onClick={() => onResetPassword(user)}>Reset Password</button>
                                {(user as any).is_active === false ? (
                                    <button className="text-green-600 hover:text-green-900" onClick={() => handleActivate(user.id, user.role!)}>Enable</button>
                                ) : (
                                    <button className="text-red-600 hover:text-red-900" onClick={() => handleDeactivate(user.id, user.role!)}>Disable</button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
