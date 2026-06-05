"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Compass, 
  BrainCircuit, 
  Coins, 
  Share2, 
  CheckSquare, 
  BedDouble, 
  Award, 
  Utensils, 
  Car, 
  Shield, 
  UserCheck, 
  User, 
  MailQuestion, 
  Send, 
  Receipt, 
  CircleDollarSign, 
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  Save,
  CheckCircle,
  Play,
  Settings,
  HelpCircle,
  Map,
  ShieldCheck,
  CalendarDays,
  Loader2
} from 'lucide-react';
import { TrackType, BasicStep, PrepareBasicSubStep, FinalStep } from '../../types/types';
import { ItineraryElements } from '../../other/interfaces';

interface StepItem {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  isSubStep?: boolean;
}

function PlannerWizardWorkspace() {
  const [tourId, setTourId] = useState<string>('draft-tour');
  const STORAGE_KEY = `nilathra_planner_wizard_state_${tourId}`;

  // 1. Wizard Track State
  const [track, setTrack] = useState<TrackType>('basic');

  // 2. Active Step States
  const [activeBasicStepIndex, setActiveBasicStepIndex] = useState<number>(0);
  const [activeFinalStepIndex, setActiveFinalStepIndex] = useState<number>(0);

  // 3. Dynamic Selection Elements for Final Itinerary
  const [elements, setElements] = useState<ItineraryElements>({
    hotel: true,
    activity: true,
    restaurant: false,
    transport: true,
    security: false,
    guide: true,
    driver: true,
  });

  // Track completion state to guide flow
  const [basicCompleted, setBasicCompleted] = useState<boolean>(false);
  const [isStateRestored, setIsStateRestored] = useState<boolean>(false);

  // Define the ordered steps for Basic Track
  const basicSteps: StepItem[] = useMemo(() => [
    { 
      id: 'tourist-data', 
      label: 'Tourist Data', 
      description: 'Capture tourist personal details, budget constraints, travel styles, and group size.', 
      icon: Users 
    },
    { 
      id: 'activity-selection', 
      label: 'Activity Selection', 
      description: 'Browse, select, and prioritize high-level tourist activities and experiences.', 
      icon: Compass 
    },
    { 
      id: 'ai-builder', 
      label: 'AI Itinerary Builder', 
      description: 'Generate a smart AI-powered skeleton draft itinerary optimized for routing.', 
      icon: BrainCircuit,
      isSubStep: true
    },
    { 
      id: 'rough-costing', 
      label: 'Rough Costing', 
      description: 'Perform a high-level budget estimation and profit margin check.', 
      icon: Coins,
      isSubStep: true
    },
    { 
      id: 'share-tourist', 
      label: 'Share with Tourist', 
      description: 'Export and share the draft basic itinerary link with the tourist for initial feedback.', 
      icon: Share2,
      isSubStep: true
    },
  ], []);

  // Dynamically compute the active steps for Final Track based on element selections
  const finalSteps: StepItem[] = useMemo(() => {
    const list: StepItem[] = [
      { 
        id: 'tour-itinerary', 
        label: 'Tour Itinerary', 
        description: 'Review and refine the locked base itinerary before assigning specific operational resources.', 
        icon: CalendarDays 
      },
      { 
        id: 'element-selection', 
        label: 'Itinerary Element Selection', 
        description: 'Choose which operational resources are needed for this custom tour package.', 
        icon: CheckSquare 
      },
    ];

    // Dynamic resource selection steps
    if (elements.hotel) {
      list.push({ 
        id: 'hotel-selection', 
        label: 'Hotel Selection', 
        description: 'Filter hotels, select specific room categories, and agree rates.', 
        icon: BedDouble 
      });
    }
    if (elements.activity) {
      list.push({ 
        id: 'activity-provider', 
        label: 'Activity Provider Selection', 
        description: 'Book specific vendors and entrance passes for all selected experiences.', 
        icon: Award 
      });
    }
    if (elements.restaurant) {
      list.push({ 
        id: 'restaurant-selection', 
        label: 'Restaurant Selection', 
        description: 'Reserve dining setups and select specific meal plans or menus.', 
        icon: Utensils 
      });
    }
    if (elements.transport) {
      list.push({ 
        id: 'transport-provider', 
        label: 'Transport Provider Selection', 
        description: 'Select transport fleet operator, vehicle tier, and negotiate base transfer rates.', 
        icon: Car 
      });
    }
    if (elements.security) {
      list.push({ 
        id: 'security-service', 
        label: 'Security Service Selection', 
        description: 'Deploy VIP security escorts, armored vehicles, or route protection guards.', 
        icon: Shield 
      });
    }
    if (elements.guide) {
      list.push({ 
        id: 'guide-selection', 
        label: 'Guide Selection', 
        description: 'Assign expert national guides, language specialists, or site coordinators.', 
        icon: UserCheck 
      });
    }
    if (elements.driver) {
      list.push({ 
        id: 'driver-selection', 
        label: 'Driver Selection', 
        description: 'Assign certified chauffeurs, safety-vetted drivers, and coordinate allowances.', 
        icon: User 
      });
    }

    // Core operational flow steps
    list.push(
      { 
        id: 'quote-request', 
        label: 'Supplier Quote Requests', 
        description: 'Dispatch automated quote sheets to all selected hotels and transport providers.', 
        icon: MailQuestion 
      },
      { 
        id: 'po-submission', 
        label: 'PO Submission to Suppliers', 
        description: 'Generate and submit legally binding Purchase Orders to confirm services.', 
        icon: Send 
      },
      { 
        id: 'final-cost', 
        label: 'Final Cost Structure', 
        description: 'View fully consolidated tour budgets, precise markups, and final client pricing.', 
        icon: Coins 
      },
      { 
        id: 'payment-receive', 
        label: 'Collect Tourist Payment', 
        description: 'Record client deposit receipts and configure installment schedules.', 
        icon: CircleDollarSign 
      },
      { 
        id: 'invoice-receive', 
        label: 'Receive Supplier Invoices', 
        description: 'Collect, check, and match inbound supplier invoices against issued POs.', 
        icon: Receipt 
      },
      { 
        id: 'payment-supplier', 
        label: 'Pay Suppliers', 
        description: 'Release bank wire transfers or credit disbursements to vendors.', 
        icon: CircleDollarSign 
      },
      { 
        id: 'profit-loss', 
        label: 'Profit & Loss Analysis', 
        description: 'Perform real-time yield audits, analyze actual margins, and close tour accounting.', 
        icon: TrendingUp 
      }
    );

    return list;
  }, [elements]);

  // Determine current active steps array & index
  const activeSteps = track === 'basic' ? basicSteps : finalSteps;
  const activeIndex = track === 'basic' ? activeBasicStepIndex : activeFinalStepIndex;
  const currentStep = activeSteps[activeIndex] || activeSteps[0];

  // A. RESTORE STATE ON MOUNT (Runs exactly once on mount)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    async function restoreSession() {
      try {
        const params = new URLSearchParams(window.location.search);
        const activeTourId = params.get('tourId') || 'draft-tour';
        setTourId(activeTourId);

        const urlTrack = params.get('track') as TrackType | null;
        const urlStep = params.get('step');

        let restoredTrack: TrackType | null = null;
        let restoredBasicIdx = 0;
        let restoredFinalIdx = 0;
        let restoredElements: ItineraryElements | null = null;

        let restoredFromDb = false;

        // 1. Try to fetch from database
        const storageKey = `nilathra_planner_wizard_state_${activeTourId}`;
        const res = await fetch(`/api/app-state?stateKey=${storageKey}`);
        if (res.ok) {
          const data = await res.json();
          if (data.state) {
            const state = data.state;
            restoredTrack = state.track;
            if (state.activeBasicStepIndex !== undefined) restoredBasicIdx = state.activeBasicStepIndex;
            if (state.activeFinalStepIndex !== undefined) restoredFinalIdx = state.activeFinalStepIndex;
            if (state.elements) restoredElements = state.elements;
            restoredFromDb = true;
          }
        }

        // 2. Fallback to localStorage if database fetch did not restore state
        if (!restoredFromDb) {
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.elements) restoredElements = parsed.elements;
            if (parsed.track) restoredTrack = parsed.track;
            if (parsed.activeBasicStepIndex !== undefined) restoredBasicIdx = parsed.activeBasicStepIndex;
            if (parsed.activeFinalStepIndex !== undefined) restoredFinalIdx = parsed.activeFinalStepIndex;
          }
        }

        // 3. Apply restored values or default fallback
        let finalTrack = urlTrack || restoredTrack || 'basic';
        let finalBasicIdx = restoredBasicIdx;
        let finalFinalIdx = restoredFinalIdx;
        const activeElements = restoredElements || {
          hotel: true,
          activity: true,
          restaurant: false,
          transport: true,
          security: false,
          guide: true,
          driver: true,
        };

        if (restoredElements) {
          setElements(restoredElements);
        }

        // 4. If URL specifies a step, decode its index with precedence
        if (urlTrack && (urlTrack === 'basic' || urlTrack === 'final') && urlStep) {
          finalTrack = urlTrack;

          const localBasicSteps = [
            'tourist-data',
            'activity-selection',
            'ai-builder',
            'rough-costing',
            'share-tourist'
          ];
          const localFinalSteps = [
            'tour-itinerary',
            'element-selection',
            activeElements.hotel && 'hotel-selection',
            activeElements.activity && 'activity-provider',
            activeElements.restaurant && 'restaurant-selection',
            activeElements.transport && 'transport-provider',
            activeElements.security && 'security-service',
            activeElements.guide && 'guide-selection',
            activeElements.driver && 'driver-selection',
            'quote-request',
            'po-submission',
            'final-cost',
            'payment-receive',
            'invoice-receive',
            'payment-supplier',
            'profit-loss'
          ].filter(Boolean) as string[];

          if (urlTrack === 'basic') {
            const idx = localBasicSteps.indexOf(urlStep);
            if (idx !== -1) finalBasicIdx = idx;
          } else {
            const idx = localFinalSteps.indexOf(urlStep);
            if (idx !== -1) finalFinalIdx = idx;
          }
        }

        setTrack(finalTrack);
        setActiveBasicStepIndex(finalBasicIdx);
        setActiveFinalStepIndex(finalFinalIdx);
      } catch (e) {
        console.error("Failed to restore planner state:", e);
      } finally {
        setIsStateRestored(true);
      }
    }

    restoreSession();
  }, []);

  // B. SYNC STATE TO LOCALSTORAGE & DATABASE & URL (whenever track, step, or elements change)
  useEffect(() => {
    if (!isStateRestored) return;

    try {
      // 1. Sync to LocalStorage (Instant local fallback)
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        track,
        activeBasicStepIndex,
        activeFinalStepIndex,
        elements
      }));

      // 2. Sync to Database in background
      fetch('/api/app-state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stateKey: STORAGE_KEY,
          stateData: {
            track,
            activeBasicStepIndex,
            activeFinalStepIndex,
            elements
          }
        })
      }).catch(err => {
        console.error("Background state sync failed:", err);
      });

      // 3. Sync to browser address bar silently using native history API
      const activeStepsList = track === 'basic' ? basicSteps : finalSteps;
      const activeIdx = track === 'basic' ? activeBasicStepIndex : activeFinalStepIndex;
      const stepObj = activeStepsList[activeIdx];

      if (stepObj) {
        const params = new URLSearchParams(window.location.search);
        const currentTrack = params.get('track');
        const currentStep = params.get('step');
        const currentTourId = params.get('tourId');

        if (currentTrack !== track || currentStep !== stepObj.id || currentTourId !== tourId) {
          params.set('track', track);
          params.set('step', stepObj.id);
          params.set('tourId', tourId);
          window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
        }
      }
    } catch (e) {
      console.error("Failed to persist state:", e);
    }
  }, [track, activeBasicStepIndex, activeFinalStepIndex, elements, isStateRestored, STORAGE_KEY, tourId, basicSteps, finalSteps]);

  if (!isStateRestored) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] bg-[#F8F6F2] items-center justify-center">
        <Loader2 className="animate-spin text-emerald-800 w-10 h-10 mb-4" />
        <p className="text-neutral-500 font-medium text-sm">Restoring Planner Session State...</p>
      </div>
    );
  }

  // Handlers for Navigation
  const handleNext = () => {
    if (activeIndex < activeSteps.length - 1) {
      if (track === 'basic') {
        setActiveBasicStepIndex(prev => prev + 1);
      } else {
        setActiveFinalStepIndex(prev => prev + 1);
      }
    } else if (track === 'basic') {
      // Finished basic track, unlock/shift to final
      setBasicCompleted(true);
      setTrack('final');
      setActiveFinalStepIndex(0);
    }
  };

  const handleBack = () => {
    if (activeIndex > 0) {
      if (track === 'basic') {
        setActiveBasicStepIndex(prev => prev - 1);
      } else {
        setActiveFinalStepIndex(prev => prev - 1);
      }
    } else if (track === 'final') {
      // Transition back to basic track
      setTrack('basic');
      setActiveBasicStepIndex(basicSteps.length - 1);
    }
  };

  const handleStepClick = (index: number) => {
    if (track === 'basic') {
      setActiveBasicStepIndex(index);
    } else {
      setActiveFinalStepIndex(index);
    }
  };

  const toggleElement = (key: keyof ItineraryElements) => {
    // 1. Compute new elements state
    const nextElements = { ...elements, [key]: !elements[key] };
    setElements(nextElements);

    // 2. Compute the new final steps length
    let dynamicStepsCount = 9; // 2 base steps + 7 operational closing steps
    if (nextElements.hotel) dynamicStepsCount++;
    if (nextElements.activity) dynamicStepsCount++;
    if (nextElements.restaurant) dynamicStepsCount++;
    if (nextElements.transport) dynamicStepsCount++;
    if (nextElements.security) dynamicStepsCount++;
    if (nextElements.guide) dynamicStepsCount++;
    if (nextElements.driver) dynamicStepsCount++;

    // 3. Clamp the active index to prevent out-of-bounds
    setActiveFinalStepIndex(prev => Math.min(prev, dynamicStepsCount - 1));
  };



  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#F8F6F2] font-sans overflow-hidden">
      {/* 1. Header Toolbar */}
      <header className="bg-white border-b border-neutral-200 px-6 py-4 flex flex-wrap items-center justify-between shadow-sm shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="bg-brand-green/10 text-brand-green p-2 rounded-xl">
            <Settings className="w-5 h-5 text-emerald-800" />
          </div>
          <div>
            <h1 className="text-lg font-serif font-bold text-neutral-800 flex items-center gap-2">
              Next-Gen Planner Wizard
              <span className="text-[10px] font-sans font-bold bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-wider">
                Preview (admin-new)
              </span>
            </h1>
            <p className="text-xs text-neutral-400">Build comprehensive client journeys through a structured relational workflow.</p>
          </div>
        </div>

        {/* Dynamic Track Toggle */}
        <div className="flex items-center gap-2 bg-neutral-100 p-1.5 rounded-xl border border-neutral-200 mt-2 sm:mt-0">
          <button
            onClick={() => {
              setTrack('basic');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wide
              ${track === 'basic' 
                ? 'bg-white text-emerald-800 shadow-sm' 
                : 'text-neutral-500 hover:text-neutral-800'
              }`}
          >
            <Map className="w-3.5 h-3.5" />
            1. Basic Itinerary
          </button>
          <button
            onClick={() => {
              setTrack('final');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wide relative
              ${track === 'final' 
                ? 'bg-white text-emerald-800 shadow-sm' 
                : 'text-neutral-500 hover:text-neutral-800'
              }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            2. Final Itinerary
            {basicCompleted && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar Step Tracker */}
        <aside className="w-80 bg-white border-r border-neutral-200 flex flex-col shrink-0 overflow-y-auto">
          {/* Active Track Status Indicator */}
          <div className="p-5 border-b border-neutral-100 bg-neutral-50/50">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">
              Active Workflow Track
            </span>
            <div className="flex items-center gap-2">
              {track === 'basic' ? (
                <>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-sm font-bold text-neutral-700 font-serif">Basic Draft Stage</span>
                </>
              ) : (
                <>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="text-sm font-bold text-neutral-700 font-serif">Final Booking Stage</span>
                </>
              )}
            </div>
            {/* Progress Bar */}
            <div className="mt-4 bg-neutral-200 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${track === 'basic' ? 'bg-amber-500' : 'bg-emerald-600'}`}
                style={{ width: `${((activeIndex + 1) / activeSteps.length) * 100}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-1.5 text-[10px] text-neutral-400 font-semibold font-mono">
              <span>STEP {activeIndex + 1} OF {activeSteps.length}</span>
              <span>{Math.round(((activeIndex + 1) / activeSteps.length) * 100)}% COMPLETE</span>
            </div>
          </div>

          {/* Steps List */}
          <nav className="flex-1 p-4 space-y-1">
            {activeSteps.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = step.id === currentStep.id;
              const isPast = idx < activeIndex;

              return (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(idx)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left group
                    ${isActive 
                      ? 'bg-neutral-50 border border-neutral-200 shadow-sm' 
                      : 'hover:bg-neutral-50 border border-transparent'
                    }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-all mt-0.5
                    ${isActive 
                      ? 'bg-emerald-800 border-emerald-800 text-white shadow-md scale-105' 
                      : isPast 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-400 group-hover:text-neutral-700'
                    }`}
                  >
                    {isPast ? <CheckCircle className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                  </div>
                  <div className="overflow-hidden">
                    <span className={`text-xs font-bold block transition-colors leading-tight
                      ${isActive 
                        ? 'text-emerald-800' 
                        : 'text-neutral-600 group-hover:text-neutral-800'
                      }`}
                    >
                      {step.label}
                    </span>
                    <span className="text-[10px] text-neutral-400 block truncate max-w-[190px]">
                      {step.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Panel Content (Step Panel) */}
        <main className="flex-1 bg-[#F8F6F2] p-8 overflow-y-auto relative flex flex-col">
          <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col justify-between pb-24">
            
            {/* Step Panel Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white rounded-2xl border border-neutral-200 shadow-sm text-emerald-800">
                  <currentStep.icon className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest font-mono">
                    {track === 'basic' ? 'Basic Draft Workflow' : 'Final Procurement Workflow'}
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-neutral-800 mt-0.5">{currentStep.label}</h2>
                </div>
              </div>

              {/* Dynamic / Interactive Switch Panel for Element Selection (Step 2 of Final Track) */}
              {track === 'final' && currentStep.id === 'element-selection' ? (
                <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-md animate-in fade-in slide-in-from-bottom-3 duration-300">
                  <div className="border-b border-neutral-100 pb-4 mb-6">
                    <h3 className="text-lg font-serif font-bold text-neutral-800">Operational Inclusions Manifest</h3>
                    <p className="text-xs text-neutral-400">Select which operational layers are active for this tour package. The navigation bar will automatically adapt.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Hotels Switch */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 border border-neutral-200 hover:bg-neutral-50/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                          <BedDouble className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-neutral-700 block">Hotel Accommodations</span>
                          <span className="text-[10px] text-neutral-400 block">Manage bookings & night indices</span>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={elements.hotel} 
                        onChange={() => toggleElement('hotel')}
                        className="w-4 h-4 accent-emerald-800 cursor-pointer"
                      />
                    </div>

                    {/* Activities Switch */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 border border-neutral-200 hover:bg-neutral-50/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                          <Award className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-neutral-700 block">Experience & Activity Providers</span>
                          <span className="text-[10px] text-neutral-400 block">Ticket booking & operator setup</span>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={elements.activity} 
                        onChange={() => toggleElement('activity')}
                        className="w-4 h-4 accent-emerald-800 cursor-pointer"
                      />
                    </div>

                    {/* Restaurants Switch */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 border border-neutral-200 hover:bg-neutral-50/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                          <Utensils className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-neutral-700 block">Dining Reservations</span>
                          <span className="text-[10px] text-neutral-400 block">Configure restaurant options</span>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={elements.restaurant} 
                        onChange={() => toggleElement('restaurant')}
                        className="w-4 h-4 accent-emerald-800 cursor-pointer"
                      />
                    </div>

                    {/* Transport Switch */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 border border-neutral-200 hover:bg-neutral-50/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                          <Car className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-neutral-700 block">Transport Logistics</span>
                          <span className="text-[10px] text-neutral-400 block">Select fleet & transfer settings</span>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={elements.transport} 
                        onChange={() => toggleElement('transport')}
                        className="w-4 h-4 accent-emerald-800 cursor-pointer"
                      />
                    </div>

                    {/* Security Switch */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 border border-neutral-200 hover:bg-neutral-50/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-neutral-700 block">VIP Security Escorts</span>
                          <span className="text-[10px] text-neutral-400 block">Route protection & armored units</span>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={elements.security} 
                        onChange={() => toggleElement('security')}
                        className="w-4 h-4 accent-emerald-800 cursor-pointer"
                      />
                    </div>

                    {/* Guides Switch */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 border border-neutral-200 hover:bg-neutral-50/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-neutral-700 block">Professional Tour Guides</span>
                          <span className="text-[10px] text-neutral-400 block">Assign expert local guides</span>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={elements.guide} 
                        onChange={() => toggleElement('guide')}
                        className="w-4 h-4 accent-emerald-800 cursor-pointer"
                      />
                    </div>

                    {/* Drivers Switch */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 border border-neutral-200 hover:bg-neutral-50/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-neutral-700 block">Chauffeurs & Drivers</span>
                          <span className="text-[10px] text-neutral-400 block">Coordinate allowances</span>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={elements.driver} 
                        onChange={() => toggleElement('driver')}
                        className="w-4 h-4 accent-emerald-800 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Premium Placeholder Panel for Empty Steps */
                <div className="bg-white rounded-3xl p-10 border border-neutral-200 shadow-md relative overflow-hidden flex flex-col items-center justify-center min-h-[350px] text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-neutral-50 rounded-full translate-x-12 -translate-y-12 opacity-50" />
                  
                  <div className="w-16 h-16 bg-neutral-50 text-neutral-300 rounded-2xl flex items-center justify-center mb-6 border border-neutral-100">
                    <currentStep.icon className="w-8 h-8 text-neutral-400" />
                  </div>
                  
                  <h3 className="text-lg font-serif font-bold text-neutral-800 mb-2">
                    {currentStep.label} Panel
                  </h3>
                  <p className="text-xs text-neutral-500 max-w-md mb-6 leading-relaxed">
                    {currentStep.description}
                  </p>
                  
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-wider">
                    <Play className="w-2.5 h-2.5 text-neutral-400" /> Page Content Placeholder
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Navigation */}
            <div className="fixed bottom-0 left-80 right-0 bg-white border-t border-neutral-200 px-8 py-4 flex items-center justify-between shadow-lg z-20 shrink-0">
              <button
                onClick={handleBack}
                disabled={track === 'basic' && activeBasicStepIndex === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-600 hover:text-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition-all text-xs font-bold uppercase tracking-wider"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => alert('Tour Workspace draft updated locally and database reference prepped.')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-600 hover:text-neutral-800 transition-all text-xs font-bold uppercase tracking-wider"
                >
                  <Save className="w-4 h-4" /> Save Progress
                </button>
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white shadow-md hover:shadow-lg transition-all text-xs font-bold uppercase tracking-wider"
                >
                  {activeIndex === activeSteps.length - 1 && track === 'final' ? 'Complete Tour' : 'Next'} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

export default function NewPlannerWizard() {
  return <PlannerWizardWorkspace />;
}
