"use client";

import { TripData } from "../types";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";

export function OperationalReadiness({ tripData }: { tripData: TripData }) {

    // Metrics calculation logic
    const calculateFlightsReady = () => {
        if (!tripData.serviceScopes.includes('Book International Flights')) return null;
        if (tripData.flights.length === 0) return false;
        return tripData.flights.every(f => f.ticketIssued && f.paymentReceived);
    };

    const calculateHotelsReady = () => {
        if (!tripData.serviceScopes.includes('Book Accommodation')) return null;
        if (tripData.accommodations.length === 0) return false;
        return tripData.accommodations.every(h => h.status === 'Confirmed' && h.paymentStatus === 'Paid');
    };

    const calculateTransportReady = () => {
        if (!tripData.serviceScopes.includes('Arrange Transport')) return null;
        if (tripData.transports.length === 0) return false;
        return tripData.transports.every(t => t.status === 'Confirmed' && t.paymentStatus === 'Paid');
    };

    const calculateActivitiesReady = () => {
        if (!tripData.serviceScopes.includes('Plan Activities & Experiences')) return null;
        if (tripData.activities.length === 0) return false;
        return tripData.activities.every(a => a.status === 'Paid' || a.status === 'Voucher Issued');
    };

    const metrics = [
        { label: "Flights Ticketed", state: calculateFlightsReady() },
        { label: "Hotels Confirmed & Paid", state: calculateHotelsReady() },
        { label: "Transport Confirmed", state: calculateTransportReady() },
        { label: "Activities Voucher Ready", state: calculateActivitiesReady() }
    ];

    const activeMetrics = metrics.filter(m => m.state !== null);
    const score = activeMetrics.length === 0 ? 0 :
        (activeMetrics.filter(m => m.state === true).length / activeMetrics.length) * 100;

    const getScoreColor = (sc: number) => {
        if (sc === 100) return "text-green-600 bg-green-50 border-green-200";
        if (sc >= 50) return "text-yellow-600 bg-yellow-50 border-yellow-200";
        return "text-red-600 bg-red-50 border-red-200";
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between gap-8 h-full">
            <div className="flex-1 space-y-4">
                <h4 className="font-serif text-brand-green text-xl mb-4 border-b pb-2">Operational Readiness Checklist</h4>

                {activeMetrics.length === 0 && (
                    <p className="text-sm text-neutral-500 italic flex items-center gap-2">
                        <AlertCircle size={14} /> Please configure service scopes to activate operational tracking.
                    </p>
                )}

                <div className="space-y-3">
                    {activeMetrics.map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <span className="text-sm font-medium text-neutral-700">{item.label}</span>
                            {item.state ? (
                                <CheckCircle2 className="text-green-500 h-5 w-5" />
                            ) : (
                                <Circle className="text-neutral-300 h-5 w-5" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className={`w-32 h-32 rounded-full border-[6px] flex flex-col items-center justify-center shrink-0 shadow-inner ${getScoreColor(score)}`}>
                <span className="text-xs uppercase tracking-widest font-semibold mb-1 opacity-80 mt-2">Score</span>
                <span className="text-3xl font-bold font-serif -mt-1">{Math.round(score)}%</span>
            </div>
        </div>
    );
}
