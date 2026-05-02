"use client";

import { useState, useEffect } from "react";
import { Trash2, AlertCircle, Info, Eye, RefreshCw, ToggleLeft, ToggleRight } from "lucide-react";
import { fetchLogsAction, deletePageViewLogsAction, togglePageViewLoggingAction } from "@/actions/log.actions";

export default function LogsDashboard({ initialEnabled }: { initialEnabled: boolean }) {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPageViewLoggingEnabled, setIsPageViewLoggingEnabled] = useState(initialEnabled);
    const [includePageViews, setIncludePageViews] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState("");

    const loadLogs = async () => {
        setLoading(true);
        setError("");
        const res = await fetchLogsAction(includePageViews);
        if (res.success) {
            setLogs(res.logs || []);
        } else {
            setError(res.error || "Failed to load logs");
        }
        setLoading(false);
    };

    useEffect(() => {
        loadLogs();
    }, [includePageViews]);

    const handleToggleLogging = async () => {
        const newState = !isPageViewLoggingEnabled;
        setIsPageViewLoggingEnabled(newState);
        await togglePageViewLoggingAction(newState);
    };

    const handleDeletePageViewLogs = async () => {
        if (!confirm("Are you sure you want to delete all page view logs? This cannot be undone.")) return;
        
        setIsDeleting(true);
        const res = await deletePageViewLogsAction();
        if (res.success) {
            await loadLogs();
        } else {
            alert("Failed to delete page view logs");
        }
        setIsDeleting(false);
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-playfair font-semibold text-[#2B2B2B]">System Logs</h1>
                    <p className="text-[#6B7280] mt-2">View and manage system activities and errors. Showing the last 100 logs.</p>
                </div>
                
                <div className="flex flex-col gap-4 items-end">
                    <button 
                        onClick={handleToggleLogging}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                            isPageViewLoggingEnabled 
                                ? 'bg-[#D4AF37]/10 text-[#D4AF37]' 
                                : 'bg-gray-100 text-gray-600'
                        }`}
                    >
                        {isPageViewLoggingEnabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        {isPageViewLoggingEnabled ? 'Page View Tracking On' : 'Page View Tracking Off'}
                    </button>
                    
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm text-[#4B5563] cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={includePageViews} 
                                onChange={(e) => setIncludePageViews(e.target.checked)}
                                className="rounded text-[#D4AF37] focus:ring-[#D4AF37]"
                            />
                            Show Page View Logs
                        </label>
                        
                        <button 
                            onClick={loadLogs}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#4B5563] bg-white border border-[#E5E7EB] rounded-md shadow-sm hover:bg-gray-50"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>

                        <button 
                            onClick={handleDeletePageViewLogs}
                            disabled={isDeleting}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-md shadow-sm hover:bg-red-100 disabled:opacity-50"
                        >
                            <Trash2 size={16} />
                            {isDeleting ? 'Deleting...' : 'Clear View Logs'}
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md border border-red-100 flex items-center gap-3">
                    <AlertCircle size={20} />
                    <p>{error}</p>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-[#E5E7EB] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#F9FAFB] text-[#6B7280] font-medium border-b border-[#E5E7EB]">
                            <tr>
                                <th className="px-6 py-4">Time</th>
                                <th className="px-6 py-4">Level</th>
                                <th className="px-6 py-4">Action</th>
                                <th className="px-6 py-4">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB]">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-[#6B7280]">
                                        Loading logs...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-[#6B7280]">
                                        No logs found.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-[#F9FAFB] transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-[#4B5563]">
                                            {new Date(log.created_at).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                                log.level === 'error' ? 'bg-red-100 text-red-800' :
                                                log.level === 'warn' ? 'bg-orange-100 text-orange-800' :
                                                'bg-blue-100 text-blue-800'
                                            }`}>
                                                {log.level === 'error' ? <AlertCircle size={14} /> : <Info size={14} />}
                                                {log.level.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-[#2B2B2B]">
                                            {log.action}
                                        </td>
                                        <td className="px-6 py-4 text-[#4B5563]">
                                            <div className="max-w-md">
                                                {log.error_message && (
                                                    <div className="text-red-600 mb-2 font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap" title={log.error_message}>
                                                        {log.error_message}
                                                    </div>
                                                )}
                                                {log.details && (
                                                    <pre className="text-[10px] bg-gray-50 p-2 rounded border border-gray-100 overflow-x-auto font-mono text-gray-500">
                                                        {JSON.stringify(log.details, null, 2)}
                                                    </pre>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
