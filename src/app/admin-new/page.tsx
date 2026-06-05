"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
  Loader2,
  ArrowLeft,
  Trash2,
  Plus,
  UserPlus,
  DollarSign,
  Calendar,
  Heart,
  Globe
} from 'lucide-react';
import { TrackType, BasicStep, PrepareBasicSubStep, FinalStep, TravelStyle, Gender, RequestType, RequestStatus } from '../../types/types';
import { ItineraryElements } from '../../other/interfaces';
import { TouristDataDTO, TouristTeamMemberDTO, TouristProfileDTO, TravelPreferencesDTO, TripRequestDTO } from '../../dtos/tourist-data.dto';

interface StepItem {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  isSubStep?: boolean;
}

const MOCK_TOURIST_DATA: TouristDataDTO = {
  profile: {
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    country: "United States",
    passport_number: "US12345678",
    address: "123 Adventure Lane, Seattle, WA, 98101"
  },
  preferences: {
    travel_style: "Luxury",
    budget_total: 12000,
    budget_per_person: 4000,
    arrival_date: "2026-07-10",
    departure_date: "2026-07-20",
    duration_days: 10,
    adults: 3,
    children: 0,
    infants: 0,
    departure_country: "United States",
    language_preference: "English",
    dietary_requirements: "No shellfish, standard vegetarian meals for companion.",
    medical_conditions: "One companion carries asthma inhaler.",
    accessibility_requirements: "Ground floor hotel rooms preferred due to light knee injury.",
    special_notes: "Celebrating John and Jane's 10th wedding anniversary. Prefers rooms with ocean views and late check-outs if available."
  },
  request: {
    id: "req-9823-a1",
    request_type: "custom-plan",
    status: "Pending",
    package_name: "Sri Lanka Golden Route & Coastline Custom Plan",
    nights: 10,
    estimated_price: 11500,
    destinations: ["Colombo", "Kandy", "Nuwara Eliya", "Ella", "Galle"],
    special_requirements: "Wants a highly knowledgeable English-speaking private chauffeur guide, premium boutique hotels, and cooking masterclass in Galle.",
    budget_tier: "Premium"
  },
  team: [
    {
      id: "member-1",
      full_name: "Jane Doe",
      passport_number: "US87654321",
      nationality: "United States",
      date_of_birth: "1988-04-12",
      gender: "Female",
      dietary_preferences: "Strictly vegetarian",
      meal_preference: "Vegetarian",
      room_preference: "Double",
      medical_notes: "Asthmatic, carries inhaler."
    },
    {
      id: "member-2",
      full_name: "Tommy Doe",
      passport_number: "US98765432",
      nationality: "United States",
      date_of_birth: "2018-09-25",
      gender: "Male",
      dietary_preferences: "None",
      meal_preference: "Standard",
      room_preference: "Shared",
      medical_notes: "None"
    }
  ]
};

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

  // 4. Interactive Tourist Data Form States
  const [touristData, setTouristData] = useState<TouristDataDTO>(MOCK_TOURIST_DATA);
  const [activeFormTab, setActiveFormTab] = useState<'profile' | 'preferences' | 'request' | 'team'>('request');
  const [isAddingMember, setIsAddingMember] = useState<boolean>(false);
  const [newMember, setNewMember] = useState<TouristTeamMemberDTO>({
    id: '',
    full_name: '',
    passport_number: '',
    nationality: '',
    date_of_birth: '',
    gender: 'Male',
    dietary_preferences: '',
    meal_preference: 'Standard',
    room_preference: 'Double',
    medical_notes: ''
  });

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
      <div className="flex flex-col h-screen bg-[#F8F6F2] items-center justify-center">
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

  // Tourist Data Form Handlers
  const handleProfileChange = (key: keyof TouristProfileDTO, value: string) => {
    setTouristData(prev => ({
      ...prev,
      profile: { ...prev.profile, [key]: value }
    }));
  };

  const handlePreferenceChange = (key: keyof TravelPreferencesDTO, value: string | number) => {
    setTouristData(prev => {
      const nextPrefs = { ...prev.preferences, [key]: value };
      
      // Auto duration recalculation if dates are edited
      if (key === 'arrival_date' || key === 'departure_date') {
        const arr = nextPrefs.arrival_date ? new Date(nextPrefs.arrival_date) : null;
        const dep = nextPrefs.departure_date ? new Date(nextPrefs.departure_date) : null;
        if (arr && dep && dep >= arr) {
          const diffTime = Math.abs(dep.getTime() - arr.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          nextPrefs.duration_days = diffDays;
        }
      }

      // Auto per-person budget recalculation
      if (key === 'budget_total' || key === 'adults') {
        const total = Number(nextPrefs.budget_total) || 0;
        const people = Number(nextPrefs.adults) || 1;
        nextPrefs.budget_per_person = Math.round(total / people);
      }

      return { ...prev, preferences: nextPrefs };
    });
  };

  const handleRequestChange = (key: keyof TripRequestDTO, value: string | number | string[]) => {
    setTouristData(prev => ({
      ...prev,
      request: { ...prev.request, [key]: value }
    }));
  };

  const addTeamMember = () => {
    if (!newMember.full_name) {
      alert("Companions must have a full name.");
      return;
    }
    const memberToAdd: TouristTeamMemberDTO = {
      ...newMember,
      id: `member-${Date.now()}`
    };
    setTouristData(prev => ({
      ...prev,
      team: [...prev.team, memberToAdd],
      preferences: {
        ...prev.preferences,
        adults: prev.preferences.adults + 1,
        budget_per_person: Math.round(prev.preferences.budget_total / (prev.preferences.adults + 1))
      }
    }));
    // Reset add companion form
    setNewMember({
      id: '',
      full_name: '',
      passport_number: '',
      nationality: '',
      date_of_birth: '',
      gender: 'Male',
      dietary_preferences: '',
      meal_preference: 'Standard',
      room_preference: 'Double',
      medical_notes: ''
    });
    setIsAddingMember(false);
  };

  const removeTeamMember = (id: string) => {
    setTouristData(prev => {
      const filtered = prev.team.filter(m => m.id !== id);
      const nextAdults = Math.max(1, prev.preferences.adults - 1);
      return {
        ...prev,
        team: filtered,
        preferences: {
          ...prev.preferences,
          adults: nextAdults,
          budget_per_person: Math.round(prev.preferences.budget_total / nextAdults)
        }
      };
    });
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8F6F2] font-sans overflow-hidden">
      {/* 1. Header Toolbar */}
      <header className="bg-white border-b border-neutral-200 px-6 py-4 flex flex-wrap items-center justify-between shadow-sm shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin" 
            className="flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-emerald-800 hover:bg-neutral-50 px-3 py-2 rounded-xl transition-all border border-neutral-200 shadow-sm mr-2 group"
          >
            <ArrowLeft className="w-4 h-4 text-neutral-400 group-hover:text-emerald-800 transition-colors" />
            Back to Dashboard
          </Link>
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

        {/* Main Workspace Area Wrapper */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* Main Panel Content (Step Panel) */}
          <main className="flex-1 bg-[#F8F6F2] p-8 overflow-y-auto relative flex flex-col pb-24">
            <div className="w-full flex-1 flex flex-col justify-between">
              
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

                {/* 1. Tourist Data Workspace Form (Basic Track Step 1) */}
                {track === 'basic' && currentStep.id === 'tourist-data' ? (
                  <div className="bg-white rounded-3xl border border-neutral-200 shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-300">
                    
                    {/* Tab Navigation */}
                    <div className="flex flex-wrap border-b border-neutral-100 bg-neutral-50/50 p-3 gap-2">
                      <button
                        onClick={() => setActiveFormTab('request')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wide
                          ${activeFormTab === 'request'
                            ? 'bg-white text-emerald-800 shadow-sm border border-neutral-200/60'
                            : 'text-neutral-500 hover:text-neutral-800'
                          }`}
                      >
                        <MailQuestion className="w-3.5 h-3.5" />
                        1. Original Inquiry Lead
                      </button>
                      <button
                        onClick={() => setActiveFormTab('profile')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wide
                          ${activeFormTab === 'profile'
                            ? 'bg-white text-emerald-800 shadow-sm border border-neutral-200/60'
                            : 'text-neutral-500 hover:text-neutral-800'
                          }`}
                      >
                        <User className="w-3.5 h-3.5" />
                        2. Profile & Contact
                      </button>
                      <button
                        onClick={() => setActiveFormTab('preferences')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wide
                          ${activeFormTab === 'preferences'
                            ? 'bg-white text-emerald-800 shadow-sm border border-neutral-200/60'
                            : 'text-neutral-500 hover:text-neutral-800'
                          }`}
                      >
                        <Compass className="w-3.5 h-3.5" />
                        3. Travel Preferences
                      </button>
                      <button
                        onClick={() => setActiveFormTab('team')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wide
                          ${activeFormTab === 'team'
                            ? 'bg-white text-emerald-800 shadow-sm border border-neutral-200/60'
                            : 'text-neutral-500 hover:text-neutral-800'
                          }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        4. Companions ({touristData.team.length})
                      </button>
                    </div>

                    {/* Tab Content Panels */}
                    <div className="p-8">
                      
                      {/* TAB 1: Profile & Contact */}
                      {activeFormTab === 'profile' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                          <div className="border-b border-neutral-100 pb-3">
                            <h3 className="text-md font-serif font-bold text-neutral-800">Primary Tourist Contact Info</h3>
                            <p className="text-xs text-neutral-400">Manage basic profile details mapping directly to the users & tourist_profiles tables.</p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="text-xs font-bold text-neutral-500 block mb-1.5 uppercase tracking-wide">First Name</label>
                              <input 
                                type="text"
                                value={touristData.profile.first_name}
                                onChange={(e) => handleProfileChange('first_name', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20 transition-all text-sm bg-neutral-50/30 font-medium"
                                placeholder="Enter first name"
                              />
                            </div>
                            
                            <div>
                              <label className="text-xs font-bold text-neutral-500 block mb-1.5 uppercase tracking-wide">Last Name</label>
                              <input 
                                type="text"
                                value={touristData.profile.last_name}
                                onChange={(e) => handleProfileChange('last_name', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20 transition-all text-sm bg-neutral-50/30 font-medium"
                                placeholder="Enter last name"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-neutral-500 block mb-1.5 uppercase tracking-wide">Email Address</label>
                              <input 
                                type="email"
                                value={touristData.profile.email}
                                onChange={(e) => handleProfileChange('email', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20 transition-all text-sm bg-neutral-50/30 font-medium"
                                placeholder="name@example.com"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-neutral-500 block mb-1.5 uppercase tracking-wide">Phone Number</label>
                              <input 
                                type="text"
                                value={touristData.profile.phone}
                                onChange={(e) => handleProfileChange('phone', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20 transition-all text-sm bg-neutral-50/30 font-medium"
                                placeholder="+1 (555) 000-0000"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-neutral-500 block mb-1.5 uppercase tracking-wide">Country of Residence</label>
                              <input 
                                type="text"
                                value={touristData.profile.country}
                                onChange={(e) => handleProfileChange('country', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20 transition-all text-sm bg-neutral-50/30 font-medium"
                                placeholder="United States"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-neutral-500 block mb-1.5 uppercase tracking-wide">Passport Number</label>
                              <input 
                                type="text"
                                value={touristData.profile.passport_number}
                                onChange={(e) => handleProfileChange('passport_number', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20 transition-all text-sm bg-neutral-50/30 font-medium text-neutral-700"
                                placeholder="Passport identifier"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="text-xs font-bold text-neutral-500 block mb-1.5 uppercase tracking-wide">Street Address</label>
                              <textarea 
                                rows={3}
                                value={touristData.profile.address}
                                onChange={(e) => handleProfileChange('address', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20 transition-all text-sm bg-neutral-50/30 font-medium"
                                placeholder="Full residential physical address"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 2: Travel Preferences */}
                      {activeFormTab === 'preferences' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                          <div className="border-b border-neutral-100 pb-3">
                            <h3 className="text-md font-serif font-bold text-neutral-800">Trip Preferences & Parameters</h3>
                            <p className="text-xs text-neutral-400">Detailed constraints, date ranges, and styles mapping to client fields inside tourist_profiles.</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                              <label className="text-xs font-bold text-neutral-500 block mb-1.5 uppercase tracking-wide">Travel Style</label>
                              <select 
                                value={touristData.preferences.travel_style}
                                onChange={(e) => handlePreferenceChange('travel_style', e.target.value as TravelStyle)}
                                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20 transition-all text-sm bg-white font-medium"
                              >
                                <option value="Luxury">Luxury</option>
                                <option value="Standard">Standard</option>
                                <option value="Budget">Budget</option>
                                <option value="Adventure">Adventure</option>
                                <option value="Family">Family</option>
                                <option value="Wellness">Wellness</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-xs font-bold text-neutral-500 block mb-1.5 uppercase tracking-wide">Total Budget ($)</label>
                              <div className="relative">
                                <span className="absolute left-4 top-3.5 text-neutral-400 text-sm font-semibold">$</span>
                                <input 
                                  type="number"
                                  value={touristData.preferences.budget_total}
                                  onChange={(e) => handlePreferenceChange('budget_total', Number(e.target.value))}
                                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20 transition-all text-sm bg-neutral-50/30 font-medium"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-xs font-bold text-neutral-500 block mb-1.5 uppercase tracking-wide">Budget Per Person ($)</label>
                              <div className="relative">
                                <span className="absolute left-4 top-3.5 text-neutral-400 text-sm font-semibold">$</span>
                                <input 
                                  type="number"
                                  disabled
                                  value={touristData.preferences.budget_per_person}
                                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-neutral-200 text-sm bg-neutral-100/60 text-neutral-500 font-bold"
                                  placeholder="Calculated automatically"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-xs font-bold text-neutral-500 block mb-1.5 uppercase tracking-wide">Arrival Date</label>
                              <input 
                                type="date"
                                value={touristData.preferences.arrival_date}
                                onChange={(e) => handlePreferenceChange('arrival_date', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20 transition-all text-sm bg-neutral-50/30 font-medium"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-neutral-500 block mb-1.5 uppercase tracking-wide">Departure Date</label>
                              <input 
                                type="date"
                                value={touristData.preferences.departure_date}
                                onChange={(e) => handlePreferenceChange('departure_date', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20 transition-all text-sm bg-neutral-50/30 font-medium"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-neutral-500 block mb-1.5 uppercase tracking-wide">Duration (Days)</label>
                              <input 
                                type="number"
                                value={touristData.preferences.duration_days}
                                onChange={(e) => handlePreferenceChange('duration_days', Number(e.target.value))}
                                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20 transition-all text-sm bg-neutral-50/30 font-medium"
                                placeholder="Days index"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-neutral-500 block mb-1.5 uppercase tracking-wide">Adults Count</label>
                              <input 
                                type="number"
                                value={touristData.preferences.adults}
                                onChange={(e) => handlePreferenceChange('adults', Number(e.target.value))}
                                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20 transition-all text-sm bg-neutral-50/30 font-medium"
                                placeholder="Count"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-neutral-500 block mb-1.5 uppercase tracking-wide">Children Count</label>
                              <input 
                                type="number"
                                value={touristData.preferences.children}
                                onChange={(e) => handlePreferenceChange('children', Number(e.target.value))}
                                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20 transition-all text-sm bg-neutral-50/30 font-medium"
                                placeholder="Count"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-neutral-500 block mb-1.5 uppercase tracking-wide">Infants Count</label>
                              <input 
                                type="number"
                                value={touristData.preferences.infants}
                                onChange={(e) => handlePreferenceChange('infants', Number(e.target.value))}
                                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20 transition-all text-sm bg-neutral-50/30 font-medium"
                                placeholder="Count"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-neutral-500 block mb-1.5 uppercase tracking-wide">Departure Country</label>
                              <input 
                                type="text"
                                value={touristData.preferences.departure_country}
                                onChange={(e) => handlePreferenceChange('departure_country', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20 transition-all text-sm bg-neutral-50/30 font-medium"
                                placeholder="USA / UK / etc."
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-neutral-500 block mb-1.5 uppercase tracking-wide">Language Preference</label>
                              <input 
                                type="text"
                                value={touristData.preferences.language_preference}
                                onChange={(e) => handlePreferenceChange('language_preference', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20 transition-all text-sm bg-neutral-50/30 font-medium"
                                placeholder="English / French / etc."
                              />
                            </div>

                            <div className="md:col-span-3">
                              <label className="text-xs font-bold text-neutral-500 block mb-1.5 uppercase tracking-wide">Dietary Requirements</label>
                              <textarea 
                                rows={2}
                                value={touristData.preferences.dietary_requirements}
                                onChange={(e) => handlePreferenceChange('dietary_requirements', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20 transition-all text-sm bg-neutral-50/30 font-medium"
                                placeholder="e.g. Vegetarian, Nut allergies"
                              />
                            </div>

                            <div className="md:col-span-3">
                              <label className="text-xs font-bold text-neutral-500 block mb-1.5 uppercase tracking-wide">Medical Conditions</label>
                              <textarea 
                                rows={2}
                                value={touristData.preferences.medical_conditions}
                                onChange={(e) => handlePreferenceChange('medical_conditions', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20 transition-all text-sm bg-neutral-50/30 font-medium"
                                placeholder="Any important medical details operators should know"
                              />
                            </div>

                            <div className="md:col-span-3">
                              <label className="text-xs font-bold text-neutral-500 block mb-1.5 uppercase tracking-wide">Accessibility Requirements</label>
                              <textarea 
                                rows={2}
                                value={touristData.preferences.accessibility_requirements}
                                onChange={(e) => handlePreferenceChange('accessibility_requirements', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20 transition-all text-sm bg-neutral-50/30 font-medium"
                                placeholder="Wheelchair access, ground floors, etc."
                              />
                            </div>

                            <div className="md:col-span-3">
                              <label className="text-xs font-bold text-neutral-500 block mb-1.5 uppercase tracking-wide">Special Notes</label>
                              <textarea 
                                rows={3}
                                value={touristData.preferences.special_notes}
                                onChange={(e) => handlePreferenceChange('special_notes', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20 transition-all text-sm bg-neutral-50/30 font-medium"
                                placeholder="Any other general requirements or celebration notes"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 3: Linked Inquiry Lead Request */}
                      {activeFormTab === 'request' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                          <div className="border-b border-neutral-100 pb-3">
                            <h3 className="text-md font-serif font-bold text-neutral-800">Original Inquiry Metadata</h3>
                            <p className="text-xs text-neutral-400">Metadata linked to requests and request_details database layers. This carries initial planning requirements.</p>
                          </div>

                          <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-5 mb-4 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">Lead Identifier</span>
                              <span className="text-sm font-semibold text-neutral-700 block font-mono mt-0.5">{touristData.request.id}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-bold bg-amber-500/10 text-amber-600 px-2.5 py-1 rounded-full border border-amber-500/20 uppercase tracking-wider">
                                Status: {touristData.request.status}
                              </span>
                              <span className="text-[10px] font-bold bg-emerald-700/10 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-700/20 uppercase tracking-wider">
                                {touristData.request.request_type}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="text-xs font-bold text-neutral-500 block mb-1.5 uppercase tracking-wide">Target Package Name</label>
                              <input 
                                type="text"
                                value={touristData.request.package_name}
                                onChange={(e) => handleRequestChange('package_name', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20 transition-all text-sm bg-neutral-50/30 font-medium"
                                placeholder="Package name"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-neutral-500 block mb-1.5 uppercase tracking-wide">Budget Tier</label>
                              <input 
                                type="text"
                                value={touristData.request.budget_tier}
                                onChange={(e) => handleRequestChange('budget_tier', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20 transition-all text-sm bg-neutral-50/30 font-medium"
                                placeholder="Budget classification (e.g. Mid-range, Premium)"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-neutral-500 block mb-1.5 uppercase tracking-wide">Inquiry Nights</label>
                              <input 
                                type="number"
                                value={touristData.request.nights}
                                onChange={(e) => handleRequestChange('nights', Number(e.target.value))}
                                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20 transition-all text-sm bg-neutral-50/30 font-medium"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-neutral-500 block mb-1.5 uppercase tracking-wide">Estimated Client Price ($)</label>
                              <div className="relative">
                                <span className="absolute left-4 top-3.5 text-neutral-400 text-sm font-semibold">$</span>
                                <input 
                                  type="number"
                                  value={touristData.request.estimated_price}
                                  onChange={(e) => handleRequestChange('estimated_price', Number(e.target.value))}
                                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20 transition-all text-sm bg-neutral-50/30 font-medium"
                                />
                              </div>
                            </div>

                            <div className="md:col-span-2">
                              <label className="text-xs font-bold text-neutral-500 block mb-1.5 uppercase tracking-wide">Destinations Inquired (Comma Separated)</label>
                              <input 
                                type="text"
                                value={touristData.request.destinations.join(', ')}
                                onChange={(e) => handleRequestChange('destinations', e.target.value.split(',').map(s => s.trim()))}
                                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20 transition-all text-sm bg-neutral-50/30 font-medium font-mono"
                                placeholder="Colombo, Galle, Kandy"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="text-xs font-bold text-neutral-500 block mb-1.5 uppercase tracking-wide">Lead Special Requirements</label>
                              <textarea 
                                rows={3}
                                value={touristData.request.special_requirements}
                                onChange={(e) => handleRequestChange('special_requirements', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20 transition-all text-sm bg-neutral-50/30 font-medium"
                                placeholder="Requirements described in the customer lead form"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 4: Travel Companions (Team List & Add Form) */}
                      {activeFormTab === 'team' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                          <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
                            <div>
                              <h3 className="text-md font-serif font-bold text-neutral-800">Travel Companion Team (tourist_team)</h3>
                              <p className="text-xs text-neutral-400">List of travelers accompanying the primary tourist. Linked to database rows.</p>
                            </div>
                            {!isAddingMember && (
                              <button
                                onClick={() => setIsAddingMember(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-800/30 hover:border-emerald-800 bg-emerald-50/50 hover:bg-emerald-50 rounded-xl transition-all shadow-sm"
                              >
                                <UserPlus className="w-3.5 h-3.5" /> Add Companion
                              </button>
                            )}
                          </div>

                          {/* Companion Add Form */}
                          {isAddingMember && (
                            <div className="bg-neutral-50/80 border border-neutral-200 rounded-2xl p-6 space-y-4 animate-in slide-in-from-top-3 duration-200">
                              <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-2">
                                <UserPlus className="w-4 h-4 text-emerald-800" /> Enter Companion Details
                              </h4>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1">Full Name *</label>
                                  <input 
                                    type="text"
                                    value={newMember.full_name}
                                    onChange={(e) => setNewMember(prev => ({ ...prev, full_name: e.target.value }))}
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 bg-white"
                                    placeholder="Enter full name"
                                  />
                                </div>

                                <div>
                                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1">Gender</label>
                                  <select 
                                    value={newMember.gender}
                                    onChange={(e) => setNewMember(prev => ({ ...prev, gender: e.target.value as Gender }))}
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 bg-white"
                                  >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1">Nationality</label>
                                  <input 
                                    type="text"
                                    value={newMember.nationality}
                                    onChange={(e) => setNewMember(prev => ({ ...prev, nationality: e.target.value }))}
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 bg-white"
                                    placeholder="e.g. USA"
                                  />
                                </div>

                                <div>
                                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1">Passport Number</label>
                                  <input 
                                    type="text"
                                    value={newMember.passport_number}
                                    onChange={(e) => setNewMember(prev => ({ ...prev, passport_number: e.target.value }))}
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 bg-white"
                                    placeholder="ID identifier"
                                  />
                                </div>

                                <div>
                                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1">Date of Birth</label>
                                  <input 
                                    type="date"
                                    value={newMember.date_of_birth}
                                    onChange={(e) => setNewMember(prev => ({ ...prev, date_of_birth: e.target.value }))}
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 bg-white"
                                  />
                                </div>

                                <div>
                                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1">Room Preference</label>
                                  <input 
                                    type="text"
                                    value={newMember.room_preference}
                                    onChange={(e) => setNewMember(prev => ({ ...prev, room_preference: e.target.value }))}
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 bg-white"
                                    placeholder="e.g. Double / Single"
                                  />
                                </div>

                                <div>
                                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1">Meal Preference</label>
                                  <input 
                                    type="text"
                                    value={newMember.meal_preference}
                                    onChange={(e) => setNewMember(prev => ({ ...prev, meal_preference: e.target.value }))}
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 bg-white"
                                    placeholder="e.g. Halal / Standard"
                                  />
                                </div>

                                <div className="md:col-span-3">
                                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1">Dietary Preferences</label>
                                  <input 
                                    type="text"
                                    value={newMember.dietary_preferences}
                                    onChange={(e) => setNewMember(prev => ({ ...prev, dietary_preferences: e.target.value }))}
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 bg-white"
                                    placeholder="e.g. Vegetarian, Gluten-free"
                                  />
                                </div>

                                <div className="md:col-span-3">
                                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1">Medical / Special Notes</label>
                                  <textarea 
                                    rows={2}
                                    value={newMember.medical_notes}
                                    onChange={(e) => setNewMember(prev => ({ ...prev, medical_notes: e.target.value }))}
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 bg-white"
                                    placeholder="Allergies, asthma, accessibility requirements"
                                  />
                                </div>
                              </div>

                              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200/50">
                                <button
                                  type="button"
                                  onClick={() => setIsAddingMember(false)}
                                  className="px-4 py-2 text-xs font-bold text-neutral-500 hover:text-neutral-700 bg-white border border-neutral-200 rounded-lg transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={addTeamMember}
                                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Save Companion
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Companion List Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {touristData.team.map((member) => (
                              <div 
                                key={member.id} 
                                className="border border-neutral-200/70 hover:border-neutral-300 rounded-2xl p-5 bg-white relative group transition-all hover:shadow-sm"
                              >
                                <button
                                  onClick={() => removeTeamMember(member.id)}
                                  className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                  title="Remove companion"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>

                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-10 h-10 bg-neutral-50 border border-neutral-100 rounded-xl flex items-center justify-center text-neutral-600 font-bold text-xs uppercase">
                                    {member.full_name.substring(0, 2)}
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold text-neutral-800 leading-tight">{member.full_name}</h4>
                                    <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-mono">
                                      {member.gender} &bull; DOB: {member.date_of_birth || "N/A"}
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-1.5 border-t border-neutral-100 pt-3 text-xs text-neutral-600 font-medium">
                                  <div className="flex justify-between">
                                    <span className="text-neutral-400">Nationality / Passport:</span>
                                    <span className="text-neutral-700 font-semibold">{member.nationality || "N/A"} &bull; {member.passport_number || "N/A"}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-neutral-400">Meal / Room:</span>
                                    <span className="text-neutral-700 font-semibold">{member.meal_preference} / {member.room_preference} Prefer</span>
                                  </div>
                                  {member.dietary_preferences && (
                                    <div className="flex justify-between">
                                      <span className="text-neutral-400">Dietary:</span>
                                      <span className="text-red-700 font-semibold">{member.dietary_preferences}</span>
                                    </div>
                                  )}
                                  {member.medical_notes && member.medical_notes !== 'None' && (
                                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-2 mt-2 text-[10px] text-amber-700">
                                      <strong className="uppercase font-bold block mb-0.5">Medical Conditions Note</strong>
                                      {member.medical_notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}

                            {touristData.team.length === 0 && (
                              <div className="md:col-span-2 bg-neutral-50 border border-dashed border-neutral-200 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[160px]">
                                <Users className="w-8 h-8 text-neutral-300 mb-2" />
                                <span className="text-xs font-bold text-neutral-500">No Companions Registered</span>
                                <span className="text-[10px] text-neutral-400 mt-1">This traveler is planning a solo journey. Click Add Companion to include family members or group travelers.</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    </div>

                  </div>
                ) : track === 'final' && currentStep.id === 'element-selection' ? (
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

            </div>
          </main>

          {/* Sticky/Absolute Bottom Actions Navigation */}
          <div className="bg-white border-t border-neutral-200 px-8 py-4 flex items-center justify-between shadow-lg z-20 shrink-0">
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

      </div>
    </div>
  );
}

export default function NewPlannerWizard() {
  return <PlannerWizardWorkspace />;
}
