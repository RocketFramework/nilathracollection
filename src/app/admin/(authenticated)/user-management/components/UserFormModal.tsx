"use client";

import { useState } from "react";
import { UserProfileDTO } from "@/dtos/user-vendor.dto";
import { createUserAction, updateUserAction } from "@/actions/user-management.actions";

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: UserProfileDTO | null;
    isEdit: boolean;
    currentTabRole: 'admin' | 'agent' | 'tourist';
}

export function UserFormModal({ isOpen, onClose, onSuccess, user, isEdit, currentTabRole }: UserFormModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        try {
            if (isEdit && user) {
                // Update specific fields
                const data = {
                    first_name: formData.get('first_name') as string,
                    last_name: formData.get('last_name') as string,
                    phone: formData.get('phone') as string,
                };
                const res = await updateUserAction(user.id, user.role || currentTabRole, data);
                if (res.error) throw new Error(res.error);
            } else {
                // Create mode includes email, password, role
                formData.append('role', currentTabRole);
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded shadow-xl w-full max-w-lg p-6">
                <h2 className="text-xl font-bold mb-4">
                    {isEdit ? 'Edit User Profile' : `Add New ${currentTabRole.charAt(0).toUpperCase() + currentTabRole.slice(1)}`}
                </h2>

                {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">First Name</label>
                            <input
                                type="text" name="first_name" required
                                defaultValue={user?.first_name || ''}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Last Name</label>
                            <input
                                type="text" name="last_name" required
                                defaultValue={user?.last_name || ''}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {!isEdit && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                                <input
                                    type="email" name="email" required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Initial Password</label>
                                <input
                                    type="password" name="password" required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">Provide this password to the user.</p>
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input
                            type="text" name="phone"
                            defaultValue={user?.phone || ''}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
