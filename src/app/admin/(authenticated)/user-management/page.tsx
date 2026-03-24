"use client";

import { useEffect, useState } from "react";
import { UserProfileDTO } from "@/dtos/user-vendor.dto";
import { getUsersByRoleAction } from "@/actions/user-management.actions";
import { UserListTable } from "./components/UserListTable";
import { UserFormModal } from "./components/UserFormModal";
import { PasswordResetModal } from "./components/PasswordResetModal";

type Role = 'admin' | 'agent' | 'tourist';

export default function UserManagementPage() {
    const [activeTab, setActiveTab] = useState<Role>('agent');
    const [users, setUsers] = useState<UserProfileDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modals state
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    const [selectedUser, setSelectedUser] = useState<UserProfileDTO | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        loadUsers(activeTab);
    }, [activeTab]);

    const loadUsers = async (role: Role) => {
        setLoading(true);
        setError(null);
        try {
            const res = await getUsersByRoleAction(role);
            if (res.error) throw new Error(res.error);
            setUsers(res.users || []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        setSelectedUser(null);
        setIsEditMode(false);
        setIsFormModalOpen(true);
    };

    const handleEdit = (user: UserProfileDTO) => {
        setSelectedUser(user);
        setIsEditMode(true);
        setIsFormModalOpen(true);
    };

    const handleResetPassword = (user: UserProfileDTO) => {
        setSelectedUser(user);
        setIsPasswordModalOpen(true);
    };

    const handleModalClose = (refresh: boolean) => {
        setIsFormModalOpen(false);
        setIsPasswordModalOpen(false);
        setSelectedUser(null);
        if (refresh) loadUsers(activeTab);
    };

    const tabs: { id: Role, label: string }[] = [
        { id: 'admin', label: 'Admins' },
        { id: 'agent', label: 'Agents' },
        { id: 'tourist', label: 'Tourists' },
    ];

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">User Management</h1>
                <button
                    onClick={handleCreateNew}
                    className="bg-black text-white px-4 py-2 rounded shadow hover:bg-gray-800"
                >
                    + Add New {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`${activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 border border-red-200 rounded mb-6">
                    {error}
                </div>
            )}

            {/* Table */}
            {loading ? (
                <div className="text-center py-10">Loading users...</div>
            ) : (
                <UserListTable
                    users={users}
                    onEdit={handleEdit}
                    onResetPassword={handleResetPassword}
                    onRefresh={() => loadUsers(activeTab)}
                />
            )}

            {/* Modals */}
            {isFormModalOpen && (
                <UserFormModal
                    isOpen={isFormModalOpen}
                    onClose={() => handleModalClose(false)}
                    onSuccess={() => handleModalClose(true)}
                    user={selectedUser}
                    isEdit={isEditMode}
                    currentTabRole={activeTab}
                />
            )}

            {isPasswordModalOpen && selectedUser && (
                <PasswordResetModal
                    isOpen={isPasswordModalOpen}
                    onClose={() => handleModalClose(false)}
                    onSuccess={() => handleModalClose(true)}
                    user={selectedUser}
                />
            )}
        </div>
    );
}
