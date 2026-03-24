"use client";

import { useState } from "react";
import { UserProfileDTO } from "@/dtos/user-vendor.dto";
import { resetPasswordAction } from "@/actions/user-management.actions";

interface PasswordResetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: UserProfileDTO;
}

export function PasswordResetModal({ isOpen, onClose, onSuccess, user }: PasswordResetModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const newPassword = formData.get('password') as string;

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters.");
            setLoading(false);
            return;
        }

        try {
            const res = await resetPasswordAction(user.id, newPassword);
            if (res.error) throw new Error(res.error);
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
            <div className="bg-white rounded shadow-xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold mb-4 text-red-600">Force Password Reset</h2>
                <p className="text-sm text-gray-600 mb-4">
                    You are changing the password for <strong>{user.email || user.first_name}</strong>. They will need to use this new password to log in.
                </p>

                {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">New Password</label>
                        <input
                            type="text" name="password" required minLength={6}
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
                            className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded disabled:opacity-50"
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
