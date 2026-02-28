"use client";

import { useState } from "react";
import { TripData } from "./types";
import { ScopeAndProfileStep } from "./steps/ScopeAndProfileStep";
import { FlightsStep } from "./steps/FlightsStep";
import { ActivitiesStep } from "./steps/ActivitiesStep";
import { HotelsStep } from "./steps/HotelsStep";
import { TransportStep } from "./steps/TransportStep";
import { ItineraryBuilder } from "./steps/ItineraryBuilder";
import { FinancialSummaryPanel } from "./components/FinancialSummaryPanel";
import { OperationalReadiness } from "./components/OperationalReadiness";
import { Save, FileCheck, CheckSquare, Users, Plane, Compass, BedDouble, CarFront, CalendarDays, Calculator, Activity } from "lucide-react";

const initialData: TripData = {
    clientName: 'New Client Inquiry',
    clientEmail: '',
    status: 'Draft',
    serviceScopes: [],
    profile: {
        adults: 2,
        children: 0,
        infants: 0,
        arrivalDate: '',
        departureDate: '',
        durationDays: 0,
        budgetTotal: 0,
        budgetPerPerson: 0,
        travelStyle: 'Luxury',
        specialConditions: {
            dietary: '',
            medical: '',
            accessibility: '',
            language: 'English',
            occasion: ''
        }
    },
    flights: [],
    accommodations: [],
    transports: [],
    activities: [],
    itinerary: [],
    financials: {
        costs: {
            flights: 0,
            hotels: 0,
            transport: 0,
            activities: 0,
            guide: 0,
            misc: 0,
            commission: 0,
            tax: 0
        },
        sellingPrice: 0
    }
};

const STEPS = [
    { id: 'summary', label: 'Summary', icon: Activity },
    { id: 'profile', label: 'Client Profile', icon: Users },
    { id: 'flights', label: 'Flights', icon: Plane },
    { id: 'activities', label: 'Activities', icon: Compass },
    { id: 'itinerary', label: 'Builder Engine', icon: CalendarDays },
    { id: 'hotels', label: 'Hotels', icon: BedDouble },
    { id: 'transport', label: 'Transport', icon: CarFront },
    { id: 'finance', label: 'Financials', icon: Calculator }
];

export default function PlannerWizard() {

    const [activeTab, setActiveTab] = useState('summary');
    const [tripData, setTripData] = useState<TripData>(initialData);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        // DB Mock logic / replace with Supabase insert in future
        await new Promise(r => setTimeout(r, 800));
        setIsSaving(false);
        alert("Workflow state saved to database successfully.");
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-[#F5F3EF]">
            {/* Top Compact Toolbar */}
            <div className="bg-white border-b border-neutral-200 shadow-sm z-10 flex flex-col shrink-0">
                <div className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <input
                            type="text"
                            value={tripData.clientName}
                            onChange={e => setTripData({ ...tripData, clientName: e.target.value })}
                            className="text-lg font-serif text-brand-green bg-transparent font-bold focus:outline-none focus:border-b border-brand-gold w-64 placeholder-neutral-300"
                            placeholder="Enter Trip Name/Client..."
                        />
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold bg-brand-gold/10 text-brand-gold px-2 py-0.5 rounded uppercase tracking-widest border border-brand-gold/20">
                                {tripData.status}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono">
                                ID: {tripData.id || 'Draft'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-1.5 bg-white text-neutral-600 border border-neutral-300 px-3 py-1.5 rounded-lg hover:bg-neutral-50 transition-all font-semibold shadow-sm text-xs">
                            <FileCheck size={14} /> Confirmed
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-1.5 bg-brand-green text-white px-3 py-1.5 rounded-lg hover:bg-green-900 transition-all shadow-md font-semibold text-xs disabled:opacity-50"
                        >
                            <Save size={14} /> {isSaving ? 'Synching...' : 'Save Workflow'}
                        </button>
                    </div>
                </div>

                {/* Horizontal Nav Bar containing the Workflow Stages */}
                <div className="px-4 border-t border-neutral-100 flex items-center overflow-x-auto no-scrollbar">
                    {STEPS.map(step => {
                        const Icon = step.icon;
                        const isActive = activeTab === step.id;

                        let disabled = false;
                        if (step.id === 'flights' && !tripData.serviceScopes.includes('Book International Flights')) disabled = true;
                        if (step.id === 'hotels' && !tripData.serviceScopes.includes('Book Accommodation')) disabled = true;
                        if (step.id === 'transport' && !tripData.serviceScopes.includes('Arrange Transport')) disabled = true;
                        if (step.id === 'activities' && !tripData.serviceScopes.includes('Plan Activities & Experiences')) disabled = true;

                        return (
                            <button
                                key={step.id}
                                onClick={() => !disabled && setActiveTab(step.id)}
                                disabled={disabled}
                                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-all border-b-2 whitespace-nowrap
                                    ${isActive ? 'border-brand-green text-brand-green bg-brand-green/5' : 'border-transparent text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'}
                                    ${disabled ? 'opacity-30 grayscale cursor-not-allowed hidden md:flex' : ''}
                                `}
                            >
                                <Icon size={14} className={isActive ? 'text-brand-gold' : 'text-neutral-400'} />
                                {step.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-6 lg:p-10 relative">
                <div className="max-w-6xl mx-auto pb-32">
                    {activeTab === 'summary' && (
                        <div className="space-y-8">
                            <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-sm relative overflow-hidden">
                                <h3 className="text-xl font-serif text-brand-green mb-2 flex items-center gap-2">
                                    <Activity size={20} className="text-brand-gold" /> Inquiry & Operational Summary
                                </h3>
                                <p className="text-neutral-500 text-sm mb-6 pb-4 border-b">A high-level overview of operational readiness before confirming client proposals.</p>
                                <OperationalReadiness tripData={tripData} />
                            </div>
                        </div>
                    )}
                    {activeTab === 'profile' && (
                        <ScopeAndProfileStep tripData={tripData} updateData={(d) => setTripData({ ...tripData, ...d })} />
                    )}
                    {activeTab === 'flights' && (
                        <FlightsStep tripData={tripData} updateFlights={(f) => setTripData({ ...tripData, flights: f })} />
                    )}
                    {activeTab === 'activities' && (
                        <ActivitiesStep tripData={tripData} updateActivities={(a) => setTripData({ ...tripData, activities: a })} />
                    )}
                    {activeTab === 'itinerary' && (
                        <div className="space-y-8">
                            <ItineraryBuilder tripData={tripData} updateData={(d) => setTripData({ ...tripData, ...d })} />
                        </div>
                    )}
                    {activeTab === 'hotels' && (
                        <HotelsStep tripData={tripData} updateHotels={(h) => setTripData({ ...tripData, accommodations: h })} />
                    )}
                    {activeTab === 'transport' && (
                        <TransportStep tripData={tripData} updateTransport={(t) => setTripData({ ...tripData, transports: t })} />
                    )}
                    {activeTab === 'finance' && (
                        <FinancialSummaryPanel tripData={tripData} updateFinancials={(f) => setTripData({ ...tripData, financials: f })} />
                    )}
                </div>
            </main>
        </div>
    );
}
