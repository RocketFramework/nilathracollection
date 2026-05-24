"use client";

import { TripData, Financials } from "../types";
import { useState } from "react";
import { Calculator, RefreshCw } from "lucide-react";

import { getFinalizedActivitiesAction } from "@/actions/admin.actions";

export function FinanceAndBookingStep({
    tripData,
    updateFinancials
}: {
    tripData: TripData,
    updateFinancials: (f: Financials) => void
}) {
    const [isSyncing, setIsSyncing] = useState(false);
    const [finalizedActivities, setFinalizedActivities] = useState<any[]>([]);
    const tourId = tripData.id;

    const syncWithItinerary = async () => {
        if (!tourId) {
            alert("Tour must be saved before generating POs.");
            return;
        }

        setIsSyncing(true);
        try {
            const result = await getFinalizedActivitiesAction(tourId);

            if (!result.success) {
                alert("Failed to fetch daily activities: " + result.error);
                return;
            }

            const activities = result.activities || [];

            if (activities.length === 0) {
                alert("There are no finalized items to generate PO, please go back to negotiation step and finalize price");
                return;
            }

            // Keep valid records under the else part for the next step
            setFinalizedActivities(activities);
            alert(`Found ${activities.length} finalized items. We will build the PO generation logic next!`);
        } catch (error) {
            console.error("Error syncing with itinerary:", error);
            alert("An error occurred while syncing with the itinerary.");
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-serif text-brand-green flex items-center gap-2">
                        <Calculator className="text-brand-gold" /> Finance & Supplier Control
                    </h3>
                    <p className="text-sm text-neutral-500 mt-1">Manage vendor payments, reconcile POs, and verify supplier invoices.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={syncWithItinerary}
                        disabled={isSyncing}
                        className="flex items-center gap-2 bg-brand-gold text-white px-5 py-2.5 rounded-2xl hover:bg-yellow-600 transition-all shadow-lg shadow-yellow-200/50 font-bold text-sm disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} /> {isSyncing ? 'Syncing...' : 'Sync with Itinerary'}
                    </button>
                </div>
            </div>

            <div className="bg-white p-12 rounded-[40px] border border-neutral-200 shadow-sm text-center">
                <p className="text-neutral-400 italic">This module is currently being rebuilt. Click "Sync with Itinerary" to test the initial workflow.</p>
            </div>
        </div>
    );
}
