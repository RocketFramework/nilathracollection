import React, { useState } from "react";
import { X, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { MasterDataApprovalsService, ApprovalRequest } from "@/services/master-data-approvals.service";

interface ApprovalReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: ApprovalRequest | null;
    onResolved: () => void;
}

export default function ApprovalReviewModal({ isOpen, onClose, request, onResolved }: ApprovalReviewModalProps) {
    const [loading, setLoading] = useState(false);

    if (!isOpen || !request) return null;

    const handleResolve = async (status: 'APPROVED' | 'REJECTED') => {
        if (!confirm(`Are you sure you want to ${status.toLowerCase()} this request?`)) return;
        setLoading(true);
        try {
            await MasterDataApprovalsService.resolveApproval(request.id!, status);
            onResolved();
            onClose();
        } catch (error: any) {
            alert(`Error updating request: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const isUpdate = request.action === 'UPDATE';
    const parsedData = request.proposed_data || {};
    // Extracting agent details from joined relation if available
    const agentData = (request as any).agent || {};

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center overflow-y-auto pt-10 pb-10">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-neutral-100">
                    <div>
                        <h2 className="text-2xl font-bold font-playfair text-[#2B2B2B] capitalize">
                            Review {request.entity_type} {isUpdate ? 'Update' : 'Creation'}
                        </h2>
                        <p className="text-sm text-neutral-500 mt-1">Requested on {new Date(request.created_at!).toLocaleDateString()}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-neutral-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar space-y-8">
                    {/* Request Meta Info */}
                    <div className="grid grid-cols-2 gap-6 p-5 bg-neutral-50 rounded-xl border border-neutral-100">
                        <div>
                            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Agent Name</span>
                            <div className="text-sm font-bold text-brand-charcoal mt-1">
                                {agentData.first_name ? `${agentData.first_name} ${agentData.last_name || ''}` : request.requested_by}
                            </div>
                        </div>
                        <div>
                            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Entity Contact</span>
                            <div className="text-sm font-bold text-brand-charcoal mt-1">
                                {request.contact_details?.name || 'N/A'} • {request.contact_details?.phone || 'N/A'}
                            </div>
                        </div>
                    </div>

                    {/* Proposed Data View */}
                    <div>
                        <h3 className="text-sm font-bold text-brand-charcoal mb-4 border-b pb-2">Proposed Data Fields</h3>
                        <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                            <pre className="text-xs text-neutral-600 whitespace-pre-wrap font-mono uppercase">
                                {JSON.stringify(parsedData, null, 2)}
                            </pre>
                        </div>
                    </div>

                    {/* Payment Verification Proof */}
                    {request.proof_image_url ? (
                        <div>
                            <h3 className="text-sm font-bold text-brand-charcoal mb-4 border-b pb-2 flex items-center justify-between">
                                Verification Proof
                                <a href={request.proof_image_url} target="_blank" rel="noreferrer" className="text-xs text-brand-green flex items-center gap-1 hover:underline">
                                    Open Original <ExternalLink size={12} />
                                </a>
                            </h3>
                            <div className="rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 flex justify-center items-center">
                                {request.proof_image_url.toLowerCase().endsWith('.pdf') ? (
                                    <embed src={request.proof_image_url} type="application/pdf" className="w-full h-96" />
                                ) : (
                                    <img src={request.proof_image_url} alt="Payment Proof" className="max-w-full max-h-96 object-contain" />
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-sm font-medium">
                            No verification proof image was attached to this request.
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-4 rounded-b-2xl shadow-inner mt-auto">
                    <button
                        onClick={() => handleResolve('REJECTED')}
                        disabled={loading}
                        className="px-6 py-2.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                        <XCircle size={18} /> Reject
                    </button>
                    <button
                        onClick={() => handleResolve('APPROVED')}
                        disabled={loading}
                        className="px-8 py-2.5 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                        {loading ? "Processing..." : <><CheckCircle size={18} /> Approve & Apply</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
