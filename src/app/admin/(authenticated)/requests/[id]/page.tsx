"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, User, Calendar, MapPin, DollarSign, Briefcase, Mail, Phone, Clock, FileText } from "lucide-react";
import Link from "next/link";
import { getAgentsAction, assignAgentAction, createTourAction, updateRequestStatusAction } from "@/actions/admin.actions";

const supabase = createClient();

export default function RequestDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const requestId = params.id as string;

    const [userRole, setUserRole] = useState<'admin' | 'agent'>('admin');
    const [request, setRequest] = useState<any>(null);
    const [agents, setAgents] = useState<{ id: string, first_name: string, last_name: string }[]>([]);
    const [isAssigning, setIsAssigning] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreatingTour, setIsCreatingTour] = useState(false);
    const [actionError, setActionError] = useState('');

    useEffect(() => {
        const fetchRequestDetails = async () => {
            setIsLoading(true);
            try {
                const agentsRes = await getAgentsAction();
                if (agentsRes.success && agentsRes.agents) {
                    setAgents(agentsRes.agents);
                }

                const { data, error } = await supabase
                    .from('requests')
                    .select(`
                        *,
                        details:request_details(*),
                        tourist:users!requests_tourist_id_fkey(
                            email,
                            tourist_profile:tourist_profiles(first_name, last_name, phone)
                        ),
                        agent:users!requests_admin_assigned_to_fkey(
                            email,
                            agent_profile:agent_profiles(first_name, last_name)
                        )
                    `)
                    .eq('id', requestId)
                    .single();

                if (error) throw error;
                setRequest(data);
            } catch (error) {
                console.error("Failed to fetch request:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (requestId) {
            fetchRequestDetails();
        }
    }, [requestId]);

    const handleAssignAgent = async (agentId: string) => {
        setIsAssigning(true);
        try {
            const res = await assignAgentAction(requestId, agentId);
            if (res.success) {
                const selectedAgent = agents.find(a => a.id === agentId);
                setRequest((prev: any) => ({
                    ...prev,
                    admin_assigned_to: agentId,
                    status: 'Assigned',
                    agent: {
                        agent_profile: [{
                            first_name: selectedAgent?.first_name,
                            last_name: selectedAgent?.last_name
                        }]
                    }
                }));
            } else {
                setActionError(res.error || 'Failed to assign agent');
            }
        } catch (error) {
            console.error(error);
            setActionError('An error occurred during assignment');
        } finally {
            setIsAssigning(false);
        }
    };

    const handleUpdateStatus = async (newStatus: string) => {
        setIsUpdatingStatus(true);
        try {
            const res = await updateRequestStatusAction(requestId, newStatus as 'Pending' | 'Assigned' | 'Active' | 'Completed' | 'Cancelled');
            if (res.success) {
                setRequest((prev: any) => ({ ...prev, status: newStatus }));
            } else {
                setActionError(res.error || 'Failed to update status');
            }
        } catch (error) {
            console.error(error);
            setActionError('An error occurred during status update');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleCreateTour = async () => {
        setIsCreatingTour(true);
        setActionError('');
        try {
            const res = await createTourAction(requestId);
            if (res.success && res.tourId) {
                router.push(`/admin/planner?tourId=${res.tourId}`);
            } else {
                setActionError(res.error || 'Failed to create tour.');
            }
        } catch (error: any) {
            console.error(error);
            setActionError(error.message || 'Failed to create tour. Please try again.');
        } finally {
            setIsCreatingTour(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-[#F5F3EF]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold mx-auto mb-4"></div>
                    <p className="text-neutral-500">Loading Request Details...</p>
                </div>
            </div>
        );
    }

    if (!request) {
        return (
            <div className="flex h-[calc(100vh-64px)] flex-col items-center justify-center bg-[#F5F3EF] p-6 text-center">
                <FileText size={48} className="text-neutral-300 mb-4" />
                <h2 className="text-xl font-bold text-brand-charcoal mb-2">Request Not Found</h2>
                <p className="text-neutral-500 mb-6 max-w-md">We couldn't locate this request in the database.</p>
                <Link href="/admin/requests" className="bg-brand-gold text-white px-6 py-2.5 rounded-lg hover:bg-[#B3932F] font-medium transition-colors">
                    Back to All Requests
                </Link>
            </div>
        );
    }

    const details = request.details?.[0] || {};
    const touristProfile = request.tourist?.tourist_profile?.[0];
    const touristName = touristProfile?.first_name
        ? `${touristProfile.first_name} ${touristProfile.last_name || ''}`.trim()
        : request.name || 'Client';
    const touristPhone = touristProfile?.phone || request.phone_number || 'Not provided';

    const agentProfile = request.agent?.agent_profile?.[0];
    const agentName = agentProfile?.first_name
        ? `${agentProfile.first_name} ${agentProfile.last_name}`
        : request.agent?.email || 'Unassigned';

    const canCreateTour = userRole === 'admin'
        ? !!request.admin_assigned_to
        : request.admin_assigned_to;

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-10 animate-in fade-in duration-500">
            <div className="flex gap-2 mb-8 p-4 bg-brand-gold/10 border border-brand-gold/20 rounded-xl">
                <span className="text-sm font-bold text-brand-gold flex items-center mr-4">DEV TOGGLE:</span>
                <button onClick={() => setUserRole('admin')} className={`px-4 py-1 rounded text-sm font-bold ${userRole === 'admin' ? 'bg-brand-gold text-white' : 'bg-white text-brand-charcoal'}`}>Admin View</button>
                <button onClick={() => setUserRole('agent')} className={`px-4 py-1 rounded text-sm font-bold ${userRole === 'agent' ? 'bg-brand-gold text-white' : 'bg-white text-brand-charcoal'}`}>Agent View</button>
            </div>

            <div className="mb-6 flex items-center justify-between">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-brand-charcoal transition-colors">
                    <ArrowLeft size={16} /> Back
                </button>
                <div className="flex items-center gap-3">
                    <select
                        value={request.status}
                        onChange={(e) => handleUpdateStatus(e.target.value)}
                        disabled={isUpdatingStatus}
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider outline-none cursor-pointer transition-all border-none ${
                            request.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                            request.status === 'Assigned' ? 'bg-blue-100 text-blue-700' :
                            request.status === 'Active' ? 'bg-green-100 text-green-700' : 
                            request.status === 'Completed' ? 'bg-brand-green text-white' : 
                            request.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 
                            'bg-neutral-200 text-neutral-700'
                        }`}
                    >
                        <option value="Pending">Pending</option>
                        <option value="Assigned">Assigned</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
                <div className="bg-brand-charcoal text-white p-8">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-bold font-playfair mb-2">{details.package_name || 'Custom Trip Request'}</h1>
                            <p className="text-neutral-300 flex items-center gap-2">
                                <MapPin size={16} />
                                {details.destinations?.length > 0 ? details.destinations.join(" • ") : 'Destinations TBD'}
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-4 text-center min-w-[140px]">
                            <p className="text-xs text-brand-gold uppercase tracking-widest font-bold mb-1">Duration</p>
                            <p className="text-2xl font-bold">{details.nights || request.duration_nights || '?'} Nights</p>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <div className="mb-8 p-6 bg-neutral-50 border border-neutral-100 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="font-bold text-brand-charcoal mb-1">Tour Planning</h3>
                            <p className="text-sm text-neutral-500 max-w-md">
                                {canCreateTour
                                    ? "This request has an assigned agent and is ready to be converted into an official tour itinerary."
                                    : "An agent must be assigned to this request before a tour itinerary can be created."}
                            </p>
                            {actionError && (
                                <p className="text-xs text-red-600 mt-2 font-medium">{actionError}</p>
                            )}
                        </div>
                        <button
                            onClick={handleCreateTour}
                            disabled={!canCreateTour || isCreatingTour}
                            className={`px-6 py-3 rounded-lg font-bold text-sm tracking-wide transition-all min-w-[200px] flex justify-center items-center gap-2 ${canCreateTour
                                ? 'bg-brand-green text-white hover:bg-green-900 shadow-md'
                                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                                }`}
                        >
                            {isCreatingTour ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Processing...
                                </span>
                            ) : (
                                "Open Trip Planner"
                            )}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        <div>
                            <h3 className="text-lg font-bold text-brand-charcoal mb-4 flex items-center gap-2 border-b border-neutral-100 pb-2">
                                <User size={18} className="text-brand-gold" /> Client Information
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Primary Contact</p>
                                    <p className="font-medium text-brand-charcoal">{touristName}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Email Address</p>
                                    <div className="flex items-center gap-2 font-medium text-brand-charcoal">
                                        <Mail size={14} className="text-neutral-400" />
                                        {request.email || request.tourist?.email || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Phone Number</p>
                                    <div className="flex items-center gap-2 font-medium text-brand-charcoal">
                                        <Phone size={14} className="text-neutral-400" />
                                        {touristPhone}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-brand-charcoal mb-4 flex items-center gap-2 border-b border-neutral-100 pb-2">
                                <Briefcase size={18} className="text-brand-gold" /> Trip Requirements
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Target Dates</p>
                                    <div className="flex items-center gap-2 font-medium text-brand-charcoal text-sm">
                                        <Calendar size={14} className="text-neutral-400" />
                                        {details.start_date || request.start_date ? new Date(details.start_date || request.start_date).toLocaleDateString() : 'Flexible'}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Passengers</p>
                                    <div className="font-medium text-brand-charcoal text-sm">
                                        {details.adults || request.adults || 0} Adults
                                        {(details.children > 0 || request.children > 0) && `, ${details.children || request.children} Kids`}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {(details.special_requirements || request.note) && (
                            <div className="md:col-span-2">
                                <h3 className="text-lg font-bold text-brand-charcoal mb-4 flex items-center gap-2 border-b border-neutral-100 pb-2">
                                    <Clock size={18} className="text-brand-gold" /> Notes & Requirements
                                </h3>
                                <div className="bg-neutral-50 p-4 rounded-lg text-sm text-neutral-700 whitespace-pre-wrap border border-neutral-100">
                                    {details.special_requirements || request.note}
                                </div>
                            </div>
                        )}

                        <div className="md:col-span-2 pt-6 border-t border-neutral-100">
                            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-4">Operations Information</h3>
                            <div className="flex flex-wrap gap-8">
                                <div>
                                    <p className="text-xs text-neutral-500 mb-1">Assigned Agent</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-brand-gold text-white flex items-center justify-center text-xs font-bold">
                                            {agentName !== 'Unassigned' ? agentName.charAt(0) : '?'}
                                        </div>
                                        {userRole === 'admin' ? (
                                            <select
                                                value={request.admin_assigned_to || ""}
                                                onChange={(e) => handleAssignAgent(e.target.value)}
                                                disabled={isAssigning}
                                                className="bg-neutral-50 border border-neutral-200 text-brand-charcoal text-sm rounded-lg p-2 outline-none font-medium transition-colors cursor-pointer"
                                            >
                                                <option value="" disabled>Select Agent to Assign</option>
                                                {agents.map((ag) => (
                                                    <option key={ag.id} value={ag.id}>
                                                        {ag.first_name} {ag.last_name}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className="font-medium text-sm text-brand-charcoal">{agentName}</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500 mb-1">Request ID</p>
                                    <p className="font-mono text-xs font-medium text-neutral-600">{request.id}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500 mb-1">Submitted On</p>
                                    <p className="font-medium text-sm text-neutral-600">
                                        {new Date(request.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
