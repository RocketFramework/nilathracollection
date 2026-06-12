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
  Globe,
  Search,
  Check,
  MapPin,
  Clock,
  ChevronUp,
  ChevronDown,
  MessageSquare,
  Upload,
  Image,
  CloudSun,
  Download
} from 'lucide-react';
import { TrackType, BasicStep, PrepareBasicSubStep, FinalStep, TravelStyle, Gender, RequestType, RequestStatus, TRAVEL_STYLES, GENDERS, REQUEST_TYPES, REQUEST_STATUSES } from '../../types/types';
import { ItineraryElements, TouristActivity, TripData, InternalItineraryBlock, BlockComment, DraftItineraryVersion, ItineraryLock } from '../../other/interfaces';
import { TouristDataDTO, TouristTeamMemberDTO, TouristProfileDTO, TravelPreferencesDTO, TripRequestDTO } from '../../dtos/tourist-data.dto';
import { 
  getTouristDataAction, 
  saveTouristDataAction, 
  getActivitiesAction, 
  getAppMarkupsAction, 
  getTourDataAction, 
  saveTourAction, 
  getAIRulesAction, 
  saveAIRuleAction,
  getDraftVersionsAction,
  saveDraftVersionAction,
  acquireItineraryLockAction,
  refreshItineraryLockAction,
  releaseItineraryLockAction,
  checkItineraryLockStatusAction
} from '@/actions/admin.actions';
import { createClient } from '@/utils/supabase/client';
import { generateAIRoutePlan } from '@/lib/ai-route-engine-new';
import { GeoLocation } from '@/lib/route-engine-new';
import { AIRule } from '@/types/ai';
import { ItineraryPdfTemplateNew } from './components/ItineraryPdfTemplateNew';

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
    status: "Pending"
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

// Client-side image resizing using HTML5 Canvas
const resizeImage = (file: File, maxWidth = 800): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas toBlob failed'));
          }
        }, 'image/jpeg', 0.85);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// Client-side upload of resized image to Supabase payment-proofs bucket
const uploadItineraryImage = async (file: File): Promise<string> => {
  const supabase = createClient();
  const fileExt = 'jpg'; // We compress canvas output to JPEG
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  // Resize the image to max 800px width
  const resizedBlob = await resizeImage(file, 800);

  const { error: uploadError } = await supabase.storage
    .from('payment-proofs')
    .upload(filePath, resizedBlob, {
      contentType: 'image/jpeg'
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('payment-proofs')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

function PlannerWizardWorkspace() {
  const [tourId, setTourId] = useState<string>('60dec7e8-cbd9-4801-9f97-b41e5062fcc2');
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

  // Collaborative edit locking & versioning states
  const [isLockedByOther, setIsLockedByOther] = useState<boolean>(false);
  const [lockOwnerName, setLockOwnerName] = useState<string>('');
  const [draftVersions, setDraftVersions] = useState<DraftItineraryVersion[]>([]);

  // 4. Interactive Tourist Data Form States
  const [touristData, setTouristData] = useState<TouristDataDTO>(MOCK_TOURIST_DATA);
  const [activeFormTab, setActiveFormTab] = useState<'profile' | 'preferences' | 'team'>('profile');
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

  const [isSaving, setIsSaving] = useState(false);

  // Activity selection states
  const [activitiesList, setActivitiesList] = useState<TouristActivity[]>([]);
  const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>([]);
  const [activitySearchTerm, setActivitySearchTerm] = useState<string>('');
  const [activityCategoryFilter, setActivityCategoryFilter] = useState<string>('All');
  const [activityTravelPrepTime, setActivityTravelPrepTime] = useState<number>(2);
  const [dailyActivityHoursLimit, setDailyActivityHoursLimit] = useState<number>(6);
  const [activityAverageSpeedKm, setActivityAverageSpeedKm] = useState<number>(30);

  // Next-Gen Itinerary States
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [itinerary, setItinerary] = useState<InternalItineraryBlock[]>([]);

  // Fetch activities and settings from the database
  useEffect(() => {
    async function loadActivitiesAndSettings() {
      try {
        const res = await getActivitiesAction();
        if (res.success && res.data) {
          setActivitiesList(res.data as TouristActivity[]);
        }
      } catch (error) {
        console.error("Failed to load activities from database:", error);
      }

      try {
        const res = await getAppMarkupsAction();
        if (res.success && res.markups) {
          const settings = res.markups as any;
          if (settings.activity_travel_prep_time !== undefined) {
            setActivityTravelPrepTime(Number(settings.activity_travel_prep_time));
          }
          if (settings.daily_activity_hours_limit !== undefined) {
            setDailyActivityHoursLimit(Number(settings.daily_activity_hours_limit));
          }
          if (settings.activity_average_speed_km !== undefined) {
            setActivityAverageSpeedKm(Number(settings.activity_average_speed_km));
          }
        }
      } catch (error) {
        console.error("Failed to load app settings from database:", error);
      }
    }
    loadActivitiesAndSettings();
  }, []);

  const filteredActivities = useMemo(() => {
    return activitiesList.filter(act => {
      const matchesCategory = activityCategoryFilter === 'All' || act.category === activityCategoryFilter;
      if (!activitySearchTerm) return matchesCategory;
      
      const term = activitySearchTerm.toLowerCase();
      return matchesCategory && (
        act.activity_name.toLowerCase().includes(term) ||
        act.location_name.toLowerCase().includes(term) ||
        act.district.toLowerCase().includes(term) ||
        act.description.toLowerCase().includes(term)
      );
    });
  }, [activitiesList, activitySearchTerm, activityCategoryFilter]);

  const selectedActivities = useMemo(() => {
    return selectedActivityIds
      .map(id => activitiesList.find(act => act.id === id))
      .filter(Boolean) as TouristActivity[];
  }, [selectedActivityIds, activitiesList]);

  const totalInferredDuration = useMemo(() => {
    return selectedActivities.reduce((acc, act) => acc + act.duration_hours + activityTravelPrepTime, 0);
  }, [selectedActivities, activityTravelPrepTime]);

  const activityBudgetStats = useMemo(() => {
    const days = touristData?.preferences?.duration_days || 0;
    const availableHours = days * dailyActivityHoursLimit;
    const remainingHours = availableHours - totalInferredDuration;
    const remainingDays = remainingHours / dailyActivityHoursLimit;
    return {
      days,
      availableHours,
      remainingHours,
      remainingDays
    };
  }, [touristData?.preferences?.duration_days, totalInferredDuration, dailyActivityHoursLimit]);

  const handleAddActivity = (id: number) => {
    if (!selectedActivityIds.includes(id)) {
      setSelectedActivityIds(prev => [...prev, id]);
    }
  };

  const handleRemoveActivity = (id: number) => {
    setSelectedActivityIds(prev => prev.filter(x => x !== id));
  };


  const handleSaveProgress = async () => {
    if (!tourId || tourId === 'draft-tour') {
      alert('This planner is in preview mode and not attached to a definitive Tour yet.');
      return;
    }
    const activeStepsList = track === 'basic' ? basicSteps : finalSteps;
    const activeIdx = track === 'basic' ? activeBasicStepIndex : activeFinalStepIndex;
    const currentStepObj = activeStepsList[activeIdx] || activeStepsList[0];

    if (track === 'basic' && currentStepObj?.id === 'ai-builder' && isLockedByOther) {
      alert(`Cannot save: This itinerary is currently locked by ${lockOwnerName || 'another user'}.`);
      return;
    }

    setIsSaving(true);
    try {
      const res = await saveTouristDataAction(tourId, touristData);
      if (!res.success) {
        throw new Error(res.error || 'Failed to save tourist data');
      }

      if (tripData) {
        const updatedTripData = { ...tripData, itinerary };
        const tourRes = await saveTourAction(tourId, updatedTripData);
        if (!tourRes.success) {
          throw new Error(tourRes.error || 'Failed to save itinerary');
        }
      }

      // Automatically create a draft version snapshot when saving progress
      if (track === 'basic' && currentStepObj?.id === 'ai-builder') {
        const autoLabel = `Auto-saved on ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        const draftRes = await saveDraftVersionAction(tourId, itinerary, autoLabel);
        if (draftRes.success && draftRes.version) {
          // Update draft versions list
          setDraftVersions(prev => [draftRes.version as DraftItineraryVersion, ...prev]);
        }
      }

      alert('Workflow state, client profile and itinerary saved to database successfully.');
    } catch (error: any) {
      console.error("Failed to save progress:", error);
      alert("Error saving: " + (error.message || error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadVersion = (version: DraftItineraryVersion) => {
    if (window.confirm(`Are you sure you want to load version ${version.version_number} (${version.label || 'no label'})? Any unsaved edits will be replaced.`)) {
      setItinerary(version.itinerary_data);
    }
  };

  const handleSaveNewVersion = async (label: string) => {
    try {
      const res = await saveDraftVersionAction(tourId, itinerary, label);
      if (res.success && res.version) {
        setDraftVersions(prev => [res.version as DraftItineraryVersion, ...prev]);
        alert("Draft version snapshot saved successfully!");
        return true;
      } else {
        alert("Failed to save draft version snapshot: " + res.error);
        return false;
      }
    } catch (err: any) {
      alert("Error saving version: " + (err.message || err));
      return false;
    }
  };

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
        const activeTourId = params.get('tourId') || '60dec7e8-cbd9-4801-9f97-b41e5062fcc2';
        setTourId(activeTourId);

        if (activeTourId && activeTourId !== 'draft-tour') {
          const touristRes = await getTouristDataAction(activeTourId);
          if (touristRes.success && touristRes.data) {
            setTouristData(touristRes.data);
          } else {
            console.error("Failed to load tourist relational data:", touristRes.error);
          }

          const tourRes = await getTourDataAction(activeTourId);
          if (tourRes.success && tourRes.data) {
            const fullTripData = tourRes.data.tripData as TripData;
            setTripData(fullTripData);
            setItinerary(fullTripData.itinerary || []);
          } else {
            console.error("Failed to load tour itinerary data:", tourRes.error);
          }
        }

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
            if (state.selectedActivityIds) setSelectedActivityIds(state.selectedActivityIds);
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
            if (parsed.selectedActivityIds) setSelectedActivityIds(parsed.selectedActivityIds);
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
        elements,
        selectedActivityIds
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
            elements,
            selectedActivityIds
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
  }, [track, activeBasicStepIndex, activeFinalStepIndex, elements, selectedActivityIds, isStateRestored, STORAGE_KEY, tourId, basicSteps, finalSteps]);

  // Collaborative edit locking lifecycle
  useEffect(() => {
    let intervalId: any = null;
    let isActive = true;

    async function manageLock() {
      const activeStepsList = track === 'basic' ? basicSteps : finalSteps;
      const activeIdx = track === 'basic' ? activeBasicStepIndex : activeFinalStepIndex;
      const currentStepObj = activeStepsList[activeIdx];

      if (track === 'basic' && currentStepObj?.id === 'ai-builder' && tourId && tourId !== 'draft-tour') {
        try {
          const res = await acquireItineraryLockAction(tourId, 5);
          if (!isActive) return;

          if (res.success) {
            if (res.acquired) {
              setIsLockedByOther(false);
              setLockOwnerName('');
              // Heartbeat every 2 minutes to refresh the lock
              intervalId = setInterval(async () => {
                if (isActive) {
                  const refreshRes = await refreshItineraryLockAction(tourId, 5);
                  if (refreshRes.success && !refreshRes.refreshed) {
                    const statusRes = await checkItineraryLockStatusAction(tourId);
                    if (statusRes.success && statusRes.lock) {
                      setIsLockedByOther(true);
                      setLockOwnerName(statusRes.ownerName || 'Another planner');
                    }
                  }
                }
              }, 2 * 60 * 1000);
            } else {
              setIsLockedByOther(true);
              setLockOwnerName(res.message || 'Another planner');
            }
          }
        } catch (err) {
          console.error("Lock acquisition failed:", err);
        }
      } else {
        setIsLockedByOther(false);
        setLockOwnerName('');
      }
    }

    manageLock();

    return () => {
      isActive = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
      const activeStepsList = track === 'basic' ? basicSteps : finalSteps;
      const activeIdx = track === 'basic' ? activeBasicStepIndex : activeFinalStepIndex;
      const currentStepObj = activeStepsList[activeIdx];

      if (track === 'basic' && currentStepObj?.id === 'ai-builder' && tourId && tourId !== 'draft-tour') {
        releaseItineraryLockAction(tourId).catch(err => {
          console.error("Failed to release lock on cleanup:", err);
        });
      }
    };
  }, [track, activeBasicStepIndex, activeFinalStepIndex, tourId, basicSteps, finalSteps]);

  // Tab unload lock release handler
  useEffect(() => {
    const handleBeforeUnload = () => {
      const activeStepsList = track === 'basic' ? basicSteps : finalSteps;
      const activeIdx = track === 'basic' ? activeBasicStepIndex : activeFinalStepIndex;
      const currentStepObj = activeStepsList[activeIdx];

      if (track === 'basic' && currentStepObj?.id === 'ai-builder' && tourId && tourId !== 'draft-tour' && !isLockedByOther) {
        releaseItineraryLockAction(tourId).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [track, activeBasicStepIndex, activeFinalStepIndex, tourId, isLockedByOther, basicSteps, finalSteps]);

  // Fetch draft versions when in the AI Builder step
  useEffect(() => {
    let isActive = true;
    async function loadVersions() {
      const activeStepsList = track === 'basic' ? basicSteps : finalSteps;
      const activeIdx = track === 'basic' ? activeBasicStepIndex : activeFinalStepIndex;
      const currentStepObj = activeStepsList[activeIdx];

      if (track === 'basic' && currentStepObj?.id === 'ai-builder' && tourId && tourId !== 'draft-tour') {
        try {
          const res = await getDraftVersionsAction(tourId);
          if (res.success && res.versions && isActive) {
            setDraftVersions(res.versions);
          }
        } catch (err) {
          console.error("Error loading versions:", err);
        }
      }
    }
    loadVersions();
    return () => {
      isActive = false;
    };
  }, [track, activeBasicStepIndex, activeFinalStepIndex, tourId, basicSteps, finalSteps]);

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
      id: crypto.randomUUID()
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
                        onClick={() => setActiveFormTab('profile')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wide
                          ${activeFormTab === 'profile'
                            ? 'bg-white text-emerald-800 shadow-sm border border-neutral-200/60'
                            : 'text-neutral-500 hover:text-neutral-800'
                          }`}
                      >
                        <User className="w-3.5 h-3.5" />
                        1. Profile & Inquiry Lead
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
                        2. Travel Preferences
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
                        3. Companions ({touristData.team.length})
                      </button>
                    </div>

                    {/* Tab Content Panels */}
                    <div className="p-8">
                      
                      {/* TAB 1: Profile & Inquiry Lead */}
                      {activeFormTab === 'profile' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                          <div className="border-b border-neutral-100 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                              <h3 className="text-md font-serif font-bold text-neutral-800">Primary Tourist Profile & Inquiry Lead</h3>
                              <p className="text-xs text-neutral-400">Manage basic profile details and review the linked inquiry lead request information.</p>
                            </div>
                            <div className="flex items-center gap-3 bg-neutral-50 px-4 py-2 rounded-2xl border border-neutral-100 text-xs">
                              <span className="font-mono text-neutral-500 font-semibold">Lead ID: {touristData.request.id}</span>
                              <span className="font-bold bg-amber-500/10 text-amber-600 px-2.5 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-wider">
                                {touristData.request.status}
                              </span>
                              <span className="font-bold bg-emerald-700/10 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-700/20 uppercase tracking-wider">
                                {touristData.request.request_type}
                              </span>
                            </div>
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
                                {TRAVEL_STYLES.map((style) => (
                                  <option key={style} value={style}>
                                    {style}
                                  </option>
                                ))}
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
                                    {GENDERS.map((g) => (
                                      <option key={g} value={g}>{g}</option>
                                    ))}
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
                ) : track === 'basic' && currentStep.id === 'activity-selection' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-3 duration-300">
                    
                    {/* Left Column: Activity List & Search */}
                    <div className="lg:col-span-6 xl:col-span-6 space-y-6">
                      
                      {/* Search & Filters */}
                      <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-md space-y-4">
                        <div className="relative">
                          <Search className="absolute left-4 top-3.5 text-neutral-400 w-5 h-5" />
                          <input 
                            type="text"
                            value={activitySearchTerm}
                            onChange={(e) => setActivitySearchTerm(e.target.value)}
                            placeholder="Search activities by name, location, district or description..."
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20 text-sm bg-neutral-50/30 font-medium"
                          />
                        </div>
                        
                        <div className="flex flex-wrap gap-2 pt-1">
                          {['All', 'Adventure', 'Beach', 'Cultural & Heritage', 'Nature', 'Casino', 'Food & Drink', 'Urban', 'Nature & Wildlife', 'Cultural', 'Wildlife', 'Wellness', 'Food', 'Water Sports'].map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setActivityCategoryFilter(cat)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wide
                                ${activityCategoryFilter === cat
                                  ? 'bg-emerald-800 text-white shadow-sm'
                                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                                }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Activities Display List */}
                      <div className="space-y-4">
                        {filteredActivities.map((act) => {
                          const isSelected = selectedActivityIds.includes(act.id);
                          return (
                            <div 
                              key={act.id}
                              className={`bg-white rounded-3xl p-6 border transition-all flex flex-col md:flex-row gap-6 hover:shadow-md
                                ${isSelected 
                                  ? 'border-emerald-800/30 ring-1 ring-emerald-800/20 bg-emerald-50/5' 
                                  : 'border-neutral-200'
                                }`}
                            >
                              {/* Left side: Thumbnail */}
                              <div className="w-full md:w-48 h-36 shrink-0 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200 relative">
                                {act.images && act.images.length > 0 ? (
                                  <img 
                                    src={act.images[0]} 
                                    alt={act.activity_name} 
                                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-tr from-neutral-100 to-neutral-200 flex items-center justify-center text-neutral-400">
                                    <MapPin className="w-8 h-8 opacity-40" />
                                  </div>
                                )}
                                <div className="absolute top-3 left-3">
                                  <span className="text-[9px] font-bold bg-white/95 text-neutral-700 px-2 py-0.5 rounded-full border border-neutral-200/50 shadow-sm uppercase tracking-wide">
                                    {act.category}
                                  </span>
                                </div>
                              </div>

                              {/* Middle side: Details */}
                              <div className="flex-1 space-y-3">
                                <div>
                                  <h3 className="text-md font-serif font-bold text-neutral-800">{act.activity_name}</h3>
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1.5 text-xs text-neutral-500 font-medium">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                                      {act.location_name}, {act.district}
                                    </span>
                                    {act.lat !== null && act.lng !== null && (
                                      <span className="text-[10px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded font-mono">
                                        {act.lat.toFixed(4)}°N, {act.lng.toFixed(4)}°E
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                                  {act.description}
                                </p>

                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                  <span className="flex items-center gap-1 text-[11px] font-bold text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-xl">
                                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                                    {act.duration_hours} hrs
                                  </span>
                                  {act.optimal_start_time && act.optimal_end_time && (
                                    <span className="text-[10px] font-semibold text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-xl">
                                      Optimal: {act.optimal_start_time.substring(0, 5)} - {act.optimal_end_time.substring(0, 5)}
                                    </span>
                                  )}
                                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border
                                    ${act.time_flexible 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' 
                                      : 'bg-amber-50 text-amber-600 border-amber-200/50'
                                    }`}
                                  >
                                    {act.time_flexible ? 'Flexible Time' : 'Fixed Schedule'}
                                  </span>
                                </div>
                              </div>

                              {/* Right side: Actions */}
                              <div className="flex items-center justify-end md:flex-col md:justify-center shrink-0">
                                {isSelected ? (
                                  <button
                                    onClick={() => handleRemoveActivity(act.id)}
                                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/50 hover:border-red-200 transition-all shadow-sm"
                                  >
                                    <Check className="w-4 h-4" /> Selected
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleAddActivity(act.id)}
                                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-800/30 hover:border-emerald-800 transition-all shadow-sm"
                                  >
                                    <Plus className="w-4 h-4" /> Add to Tour
                                  </button>
                                )}
                              </div>

                            </div>
                          );
                        })}

                        {filteredActivities.length === 0 && (
                          <div className="bg-white border border-neutral-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[200px]">
                            <Compass className="w-10 h-10 text-neutral-300 mb-3" />
                            <span className="text-sm font-bold text-neutral-600">No matching activities found</span>
                            <span className="text-xs text-neutral-400 mt-1">Try expanding your search query or choosing a different category.</span>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Right Column: Selected Activities Sidebar */}
                    <div className="lg:col-span-6 xl:col-span-6 sticky top-6 space-y-6">
                      
                      {/* Sidebar Container */}
                      <div className="bg-white rounded-3xl border border-neutral-200 shadow-md p-6">
                        
                        {/* Header */}
                        <div className="border-b border-neutral-100 pb-4 mb-4">
                          <h3 className="text-md font-serif font-bold text-neutral-800">Selected Activities</h3>
                          <p className="text-xs text-neutral-400">Order and prioritize the selected experiences for this basic itinerary draft.</p>
                        </div>

                        {/* Summary Stats / Trip Duration Budget */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                          
                          {/* Trip Duration */}
                          <div className="bg-blue-50/40 border border-blue-100/50 rounded-2xl p-3 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                              <CalendarDays className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Trip Duration</span>
                              <span className="text-sm font-extrabold text-blue-950">{activityBudgetStats.days} Days</span>
                            </div>
                          </div>

                          {/* Available Time */}
                          <div className="bg-amber-50/40 border border-amber-100/50 rounded-2xl p-3 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                              <Clock className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Available Time</span>
                              <span className="text-sm font-extrabold text-amber-950">{activityBudgetStats.availableHours} hrs <span className="text-[8px] font-normal text-neutral-400 font-sans normal-case">({dailyActivityHoursLimit}h/d)</span></span>
                            </div>
                          </div>

                          {/* Selected Items */}
                          <div className="bg-purple-50/40 border border-purple-100/50 rounded-2xl p-3 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 shrink-0">
                              <Compass className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Selected Items</span>
                              <span className="text-sm font-extrabold text-purple-950">{selectedActivities.length} selected</span>
                            </div>
                          </div>

                          {/* Est. Duration */}
                          <div className="bg-emerald-50/40 border border-emerald-100/50 rounded-2xl p-3 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                              <CheckSquare className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Est. Duration</span>
                              <span className="text-sm font-extrabold text-emerald-800">{totalInferredDuration.toFixed(1)} hrs</span>
                            </div>
                          </div>

                          {/* Remaining Time */}
                          <div className={`border rounded-2xl p-3 flex items-center gap-3 transition-colors ${
                            activityBudgetStats.remainingHours < 0 
                              ? 'bg-red-50/40 border-red-100 text-red-900' 
                              : 'bg-neutral-50/40 border-neutral-200/80 text-neutral-900'
                          }`}>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              activityBudgetStats.remainingHours < 0 
                                ? 'bg-red-500/10 text-red-600 animate-pulse' 
                                : 'bg-neutral-500/10 text-neutral-600'
                            }`}>
                              <Clock className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Remaining Time</span>
                              <span className="text-sm font-extrabold">{activityBudgetStats.remainingHours.toFixed(1)} hrs</span>
                            </div>
                          </div>

                          {/* Remaining Days */}
                          <div className={`border rounded-2xl p-3 flex items-center gap-3 transition-colors ${
                            activityBudgetStats.remainingDays < 0 
                              ? 'bg-red-50/40 border-red-100 text-red-900' 
                              : 'bg-neutral-50/40 border-neutral-200/80 text-neutral-900'
                          }`}>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              activityBudgetStats.remainingDays < 0 
                                ? 'bg-red-500/10 text-red-600 animate-pulse' 
                                : 'bg-neutral-500/10 text-neutral-600'
                            }`}>
                              <CalendarDays className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Remaining Days</span>
                              <span className="text-sm font-extrabold">{activityBudgetStats.remainingDays.toFixed(1)} Days</span>
                            </div>
                          </div>

                        </div>

                        {/* Selected List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                          {selectedActivities.map((act, index) => (
                            <div 
                              key={act.id} 
                              className="flex items-center gap-3 p-3 rounded-2xl border border-neutral-200/80 bg-white hover:border-neutral-300 transition-all relative group"
                            >
                              {/* Order Badge */}
                              <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100/50 flex items-center justify-center text-xs font-bold shrink-0">
                                {index + 1}
                              </div>

                              {/* Details */}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-neutral-800 truncate">{act.activity_name}</h4>
                                <span className="text-[10px] text-neutral-400 block truncate">{act.location_name} &bull; {act.duration_hours}h (+{activityTravelPrepTime}h travel/prep)</span>
                              </div>

                              {/* Controls (Remove) */}
                              <div className="flex items-center shrink-0">
                                <button
                                  onClick={() => handleRemoveActivity(act.id)}
                                  className="p-1.5 hover:bg-red-50 rounded-xl text-neutral-400 hover:text-red-600 transition-all"
                                  title="Remove"
                                >
                                  <Trash2 className="w-4.5 h-4.5" />
                                </button>
                              </div>
                            </div>
                          ))}

                          {selectedActivities.length === 0 && (
                            <div className="md:col-span-2 border border-dashed border-neutral-200 bg-neutral-50/50 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[180px]">
                              <Compass className="w-8 h-8 text-neutral-300 mb-2" />
                              <span className="text-xs font-bold text-neutral-500">No activities selected</span>
                              <span className="text-[10px] text-neutral-400 mt-1 max-w-[180px]">Click "+ Add to Tour" on any activity card to prioritize it for this itinerary.</span>
                            </div>
                          )}
                        </div>

                      </div>

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
                ) : track === 'basic' && currentStep.id === 'ai-builder' ? (
                  <AIItineraryBuilder
                    itinerary={itinerary}
                    setItinerary={setItinerary}
                    durationDays={touristData?.preferences?.duration_days || 0}
                    tourId={tourId}
                    selectedActivities={selectedActivities}
                    travelStyle={touristData?.preferences?.travel_style || 'Luxury'}
                    onTravelStyleChange={(style) => handlePreferenceChange('travel_style', style)}
                    arrivalDate={touristData?.preferences?.arrival_date || ''}
                    departureDate={touristData?.preferences?.departure_date || ''}
                    adults={touristData?.preferences?.adults || 2}
                    children={touristData?.preferences?.children || 0}
                    infants={touristData?.preferences?.infants || 0}
                    onAdultsChange={(count) => handlePreferenceChange('adults', count)}
                    onChildrenChange={(count) => handlePreferenceChange('children', count)}
                    onInfantsChange={(count) => handlePreferenceChange('infants', count)}
                    guideNeeded={elements.guide}
                    onGuideNeededChange={(needed) => setElements(prev => ({ ...prev, guide: needed }))}
                    chauffeurNeeded={elements.driver}
                    onChauffeurNeededChange={(needed) => setElements(prev => ({ ...prev, driver: needed }))}
                    touristData={touristData}
                    isLockedByOther={isLockedByOther}
                    lockOwnerName={lockOwnerName}
                    versions={draftVersions}
                    onLoadVersion={handleLoadVersion}
                    onSaveNewVersion={handleSaveNewVersion}
                  />
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
                onClick={handleSaveProgress}
                disabled={isSaving || (track === 'basic' && currentStep.id === 'ai-builder' && isLockedByOther)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-600 hover:text-neutral-800 transition-all text-xs font-bold uppercase tracking-wider disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Progress'}
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

interface AIItineraryBuilderProps {
  itinerary: InternalItineraryBlock[];
  setItinerary: React.Dispatch<React.SetStateAction<InternalItineraryBlock[]>>;
  durationDays: number;
  tourId: string;
  selectedActivities: TouristActivity[];
  travelStyle: TravelStyle;
  onTravelStyleChange: (style: TravelStyle) => void;
  arrivalDate: string;
  departureDate: string;
  adults: number;
  children: number;
  infants: number;
  onAdultsChange: (count: number) => void;
  onChildrenChange: (count: number) => void;
  onInfantsChange: (count: number) => void;
  guideNeeded: boolean;
  onGuideNeededChange: (needed: boolean) => void;
  chauffeurNeeded: boolean;
  onChauffeurNeededChange: (needed: boolean) => void;
  touristData: TouristDataDTO;
  isLockedByOther: boolean;
  lockOwnerName: string;
  versions: DraftItineraryVersion[];
  onLoadVersion: (version: DraftItineraryVersion) => void;
  onSaveNewVersion: (label: string) => Promise<boolean>;
}

function AIItineraryBuilder({
  itinerary,
  setItinerary,
  durationDays,
  tourId,
  selectedActivities,
  travelStyle,
  onTravelStyleChange,
  arrivalDate,
  departureDate,
  adults,
  children,
  infants,
  onAdultsChange,
  onChildrenChange,
  onInfantsChange,
  guideNeeded,
  onGuideNeededChange,
  chauffeurNeeded,
  onChauffeurNeededChange,
  touristData,
  isLockedByOther,
  lockOwnerName,
  versions,
  onLoadVersion,
  onSaveNewVersion
}: AIItineraryBuilderProps) {
  const [activeDay, setActiveDay] = useState<number>(1);
  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [openCommentsBlockId, setOpenCommentsBlockId] = useState<string | null>(null);

  const getCardAccentBorder = (type: InternalItineraryBlock['type']) => {
    switch (type) {
      case 'sleep': return 'border-l-4 border-l-amber-500';
      case 'activity': return 'border-l-4 border-l-emerald-500';
      case 'meal': return 'border-l-4 border-l-rose-500';
      case 'travel': return 'border-l-4 border-l-sky-500';
      case 'train': return 'border-l-4 border-l-purple-500';
      case 'guide': return 'border-l-4 border-l-teal-500';
      default: return 'border-l-4 border-l-neutral-400';
    }
  };

  const renderTypeBadge = (type: InternalItineraryBlock['type']) => {
    switch (type) {
      case 'sleep':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-amber-50 text-amber-800 border border-amber-200/50 shadow-sm shrink-0">
            <BedDouble className="w-3.5 h-3.5 text-amber-600" /> Sleep
          </span>
        );
      case 'activity':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200/50 shadow-sm shrink-0">
            <Compass className="w-3.5 h-3.5 text-emerald-600" /> Activity
          </span>
        );
      case 'meal':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-rose-50 text-rose-800 border border-rose-200/50 shadow-sm shrink-0">
            <Utensils className="w-3.5 h-3.5 text-rose-600" /> Meal
          </span>
        );
      case 'travel':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-sky-50 text-sky-800 border border-sky-200/50 shadow-sm shrink-0">
            <Car className="w-3.5 h-3.5 text-sky-600" /> Travel
          </span>
        );
      case 'train':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-purple-50 text-purple-800 border border-purple-200/50 shadow-sm shrink-0">
            <Compass className="w-3.5 h-3.5 text-purple-600" /> Train
          </span>
        );
      case 'guide':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-teal-50 text-teal-800 border border-teal-200/50 shadow-sm shrink-0">
            <UserCheck className="w-3.5 h-3.5 text-teal-600" /> Guide
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-neutral-100 text-neutral-800 border border-neutral-200/60 shadow-sm shrink-0">
            Custom
          </span>
        );
    }
  };

  const printRef = React.useRef<HTMLDivElement>(null);

  const clientName = touristData.profile 
    ? `${touristData.profile.first_name || ''} ${touristData.profile.last_name || ''}`.trim() || 'Valued Guest'
    : 'Valued Guest';

  const handleDownloadPdf = () => {
    const printContent = printRef.current?.innerHTML;
    if (printContent) {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`
          <html>
            <head>
              <title>Itinerary PDF - ${clientName}</title>
              ${Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]')).map(n => n.outerHTML).join('\n')}
              <style>
                body { background: white !important; margin: 0; padding: 0; }
                @page { size: A4; margin: 0; }
              </style>
            </head>
            <body>
              <div class="pdf-container">${printContent}</div>
            </body>
          </html>
        `);
        doc.close();
        
        // Wait for styles/images to render before printing
        iframe.contentWindow?.focus();
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }, 800);
      }
    } else {
      alert("Error: PDF content not prepared.");
    }
  };

  // Room preference calculation from team members
  const calculateRoomsFromTeam = () => {
    let single = 0;
    let double = 0;
    let triple = 0;
    let family = 0;

    if (touristData?.team && touristData.team.length > 0) {
      const processedIds = new Set<string>();

      touristData.team.forEach(member => {
        if (processedIds.has(member.id)) return;

        processedIds.add(member.id);

        if (member.shared_with_ids && member.shared_with_ids.length > 0) {
          member.shared_with_ids.forEach(id => {
            processedIds.add(id);
          });
        }

        const pref = (member.room_preference || 'Double').toLowerCase();
        if (pref.includes('single')) {
          single++;
        } else if (pref.includes('double') || pref.includes('twin')) {
          double++;
        } else if (pref.includes('triple')) {
          triple++;
        } else if (pref.includes('family')) {
          family++;
        } else {
          double++; // default fallback
        }
      });
    }
    return { single, double, triple, family };
  };

  const teamRooms = useMemo(() => calculateRoomsFromTeam(), [touristData?.team]);
  const hasTeam = touristData?.team && touristData.team.length > 0;

  const [manualSingle, setManualSingle] = useState<number>(0);
  const [manualDouble, setManualDouble] = useState<number>(1);
  const [manualTriple, setManualTriple] = useState<number>(0);
  const [manualFamily, setManualFamily] = useState<number>(0);

  // Final resolved room counts:
  const singleRoomsCount = hasTeam ? teamRooms.single : manualSingle;
  const doubleRoomsCount = hasTeam ? teamRooms.double : manualDouble;
  const tripleRoomsCount = hasTeam ? teamRooms.triple : manualTriple;
  const familyRoomsCount = hasTeam ? teamRooms.family : manualFamily;

  // Dynamically recalculate and update hotel prices across all days when room configuration changes
  useEffect(() => {
    setItinerary(prevItinerary => {
      let changed = false;
      const updated = prevItinerary.map(block => {
        if (block.type === 'sleep') {
          const baseRate = block.baseRoomRate || block.agreedPrice || 150;
          
          const singleRate = baseRate * 0.85;
          const doubleRate = baseRate;
          const tripleRate = baseRate * 1.4;
          const familyRate = baseRate * 1.8;

          let sleepPrice = (singleRoomsCount * singleRate) + 
                           (doubleRoomsCount * doubleRate) + 
                           (tripleRoomsCount * tripleRate) + 
                           (familyRoomsCount * familyRate);
          if (sleepPrice === 0) {
            sleepPrice = baseRate;
          }

          const roundedPrice = Math.round(sleepPrice * 100) / 100;

          if (block.agreedPrice !== roundedPrice || block.baseRoomRate !== baseRate) {
            changed = true;
            return {
              ...block,
              baseRoomRate: baseRate,
              agreedPrice: roundedPrice
            };
          }
        }
        return block;
      });
      return changed ? updated : prevItinerary;
    });
  }, [singleRoomsCount, doubleRoomsCount, tripleRoomsCount, familyRoomsCount, setItinerary]);

  // AI & Rules configuration state
  const [aiRules, setAiRules] = useState({ generic: '', specific: '' });
  const [isLoadingRules, setIsLoadingRules] = useState(false);
  const [isSavingRules, setIsSavingRules] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showRulesConfig, setShowRulesConfig] = useState(false);

  // Compute days list based on durationDays (default to 5 if 0 or invalid)
  const totalDays = durationDays > 0 ? durationDays : 5;
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);

  const getDayDateString = (dayNum: number) => {
    if (!arrivalDate) return '';
    try {
      const d = new Date(arrivalDate);
      if (isNaN(d.getTime())) return '';
      d.setDate(d.getDate() + (dayNum - 1));
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return '';
    }
  };

  // Load AI rules on mount
  useEffect(() => {
    async function loadRules() {
      setIsLoadingRules(true);
      try {
        const res = await getAIRulesAction(tourId);
        if (res.success && res.rules) {
          const generic = res.rules.find((r: any) => r.rule_type === 'generic')?.content || '';
          const specific = res.rules.find((r: any) => r.rule_type === 'specific')?.content || '';
          setAiRules({ generic, specific });
        }
      } catch (err) {
        console.error("Failed to load AI rules:", err);
      } finally {
        setIsLoadingRules(false);
      }
    }
    if (tourId) {
      loadRules();
    }
  }, [tourId]);

  const [appSettings, setAppSettings] = useState<any>(null);

  // Load app settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await getAppMarkupsAction();
        if (res.success && res.markups) {
          setAppSettings(res.markups);
        }
      } catch (err) {
        console.error("Failed to load settings in AIItineraryBuilder:", err);
      }
    }
    loadSettings();
  }, []);

  // Helper to calculate daily cost summary
  const calculateDayTotal = (dayNum: number) => {
    const blocksForDay = itinerary.filter(b => b.dayNumber === dayNum);
    
    // 1. Hotel Cost
    const hotel = blocksForDay
      .filter(b => b.type === 'sleep')
      .reduce((sum, b) => sum + (Number(b.agreedPrice) || 0), 0);

    // 2. Pax Count
    const pax = (adults || 0) + (children || 0);

    // Helper to get settings keys
    const getTierValue = (suffix: string, defaultValue: number) => {
      if (!appSettings) return defaultValue;
      const key = travelStyle?.toLowerCase().replace(' ', '_') || 'luxury';
      const fullKey = `${key}_${suffix}`;
      return appSettings[fullKey] !== undefined ? Number(appSettings[fullKey]) : defaultValue;
    };

    // 3. Meal Cost (Lunch cost per tourist * pax)
    const lunchCostPerHead = getTierValue('lunch_cost', 15);
    const meals = pax * lunchCostPerHead;

    // 4. Transport Cost
    const kmRate = getTierValue('vehicle_km_rate', 0.50);
    const getBlockKm = (block: InternalItineraryBlock) => {
      if (!block.distance) return 0;
      const parsed = parseFloat(block.distance.toString().replace(/[^\d.]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    };
    const km = blocksForDay.reduce((sum, b) => sum + getBlockKm(b), 0);
    const transport = km * kmRate;

    // 5. Concierge Cost (ticket, refreshment, seamless concierge)
    const conciergeCostPerHead = getTierValue('concierge_cost', 40);
    const concierge = pax * conciergeCostPerHead;

    // 6. Agency Fee & Tax
    const agencyFeePercent = getTierValue('service_fee', 10);
    const subtotal = hotel + meals + transport + concierge;
    const agencyFee = subtotal * (agencyFeePercent / 100);

    const total = subtotal + agencyFee;

    return {
      hotel,
      meals,
      km,
      transport,
      concierge,
      agencyFeePercent,
      agencyFee,
      total
    };
  };

  const handleSaveRules = async () => {
    setIsSavingRules(true);
    try {
      const res1 = await saveAIRuleAction({
        rule_type: 'generic',
        content: aiRules.generic,
        tour_id: null
      });
      const res2 = await saveAIRuleAction({
        rule_type: 'specific',
        content: aiRules.specific,
        tour_id: tourId || null
      });
      if (res1.success && res2.success) {
        alert("AI rules saved successfully!");
      } else {
        throw new Error("Failed to save rules to database");
      }
    } catch (err: any) {
      console.error("Failed to save AI rules:", err);
      alert("Error saving rules: " + (err.message || err));
    } finally {
      setIsSavingRules(false);
    }
  };

  const handleGenerateItinerary = async () => {
    setIsGenerating(true);
    try {
      // 1. Save rules first to ensure DB is in sync
      await Promise.all([
        saveAIRuleAction({
          rule_type: 'generic',
          content: aiRules.generic,
          tour_id: null
        }),
        saveAIRuleAction({
          rule_type: 'specific',
          content: aiRules.specific,
          tour_id: tourId || null
        })
      ]);

      // 2. Map chosen activities
      const chosenActivities = selectedActivities.map(a => ({
        id: a.id,
        category: a.category,
        activity_name: a.activity_name,
        location_name: a.location_name,
        district: a.district,
        lat: a.lat,
        lng: a.lng,
        description: a.description,
        duration_hours: a.duration_hours,
        optimal_start_time: a.optimal_start_time,
        optimal_end_time: a.optimal_end_time,
        time_flexible: a.time_flexible
      }));

      // 3. Collect locations map
      const locationsMap = new globalThis.Map<string, GeoLocation>();
      chosenActivities.forEach(act => {
        if (act.lat && act.lng) {
          const key = `${act.lat.toFixed(3)},${act.lng.toFixed(3)}`;
          if (!locationsMap.has(key)) {
            locationsMap.set(key, {
              lat: act.lat,
              lng: act.lng,
              name: `${act.location_name}, ${act.district}`
            });
          }
        }
      });
      const locations = Array.from(locationsMap.values());
      const combinedRules = `GENERIC RULES:\n${aiRules.generic}\n\nSPECIFIC RULES FOR THIS ITINERARY:\n${aiRules.specific}`;

      // 4. Generate plan
      const routeResult = await generateAIRoutePlan(
        chosenActivities as any,
        locations,
        totalDays,
        combinedRules,
        travelStyle,
        arrivalDate || undefined,
        departureDate || undefined,
        adults,
        children,
        infants,
        guideNeeded,
        chauffeurNeeded
      );

      // 5. Map events to InternalItineraryBlock
      const generatedBlocks: InternalItineraryBlock[] = [];
      routeResult.plan.forEach(day => {
        day.events.forEach(event => {
          // Lookup original activity for exact location metadata if type is activity
          let matchedLat: number | undefined = undefined;
          let matchedLng: number | undefined = undefined;
          let matchedLocName: string | undefined = undefined;
          let matchedActId: number | undefined = undefined;

          if (event.type === 'activity') {
            const act = chosenActivities.find(a => 
              String(a.id) === String(event.activityId) || 
              a.activity_name.toLowerCase() === event.name.toLowerCase()
            );
            if (act) {
              matchedLat = act.lat || undefined;
              matchedLng = act.lng || undefined;
              matchedLocName = act.location_name;
              matchedActId = act.id;
            }
          }

          let sleepPrice = event.rateUsd;
          if (event.type === 'sleep' && event.rateUsd) {
            const singleRate = event.rateUsd * 0.85;
            const doubleRate = event.rateUsd;
            const tripleRate = event.rateUsd * 1.4;
            const familyRate = event.rateUsd * 1.8;

            sleepPrice = (singleRoomsCount * singleRate) + 
                         (doubleRoomsCount * doubleRate) + 
                         (tripleRoomsCount * tripleRate) + 
                         (familyRoomsCount * familyRate);
            if (sleepPrice === 0) {
              sleepPrice = event.rateUsd;
            }
          }

          const block: InternalItineraryBlock = {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
            dayNumber: day.day,
            type: event.type as any,
            name: event.name,
            startTime: event.startTime,
            endTime: event.endTime,
            bufferMins: 15,
            durationHours: event.duration,
            hotelName: event.type === 'sleep' ? (event.hotelName || event.name) : '',
            roomName: event.type === 'sleep' ? (event.roomCategory || '') : '',
            mealPlan: event.type === 'sleep' ? (event.mealPlan || 'BB') : '',
            agreedPrice: event.type === 'sleep' ? sleepPrice : undefined,
            baseRoomRate: event.type === 'sleep' ? event.rateUsd : undefined,
            imageUrl: '',
            confirmationStatus: 'Pending',
            paymentStatus: 'Pending',
            internalNotes: '',
            distance: event.distance || '',
            comments: [],
            // Bind location data
            locationName: matchedLocName || event.locationName || '',
            lat: matchedLat !== undefined ? matchedLat : event.location?.lat,
            lng: matchedLng !== undefined ? matchedLng : event.location?.lng,
            activityId: matchedActId,
            weather: day.weather || ''
          };
          generatedBlocks.push(block);
        });
      });

      // Post-process itinerary to automatically insert travel blocks and compute distances
      const postProcessedBlocks: InternalItineraryBlock[] = [];
      const nonDropped = generatedBlocks.filter(b => b.dayNumber > 0);
      const dropped = generatedBlocks.filter(b => b.dayNumber === 0);
      
      const getDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c * 1.3); // Sri Lanka road multiplier factor
      };

      // Set initial location to Airport (Katunayake)
      let lastLocBlock: { lat: number; lng: number; locationName: string; endTime?: string } = {
        lat: 7.1725,
        lng: 79.8853,
        locationName: 'Katunayake Airport'
      };

      nonDropped.forEach((block, index) => {
        if (block.type === 'travel') {
          // If a travel block is generated, resolve its destination coordinates from itself or lookahead
          let destLat = block.lat;
          let destLng = block.lng;
          if (destLat === undefined || destLng === undefined) {
            // Look ahead for the first block with coordinates
            for (let i = index + 1; i < nonDropped.length; i++) {
              const nextB = nonDropped[i];
              if (nextB.type !== 'travel' && nextB.lat !== undefined && nextB.lng !== undefined) {
                destLat = nextB.lat;
                destLng = nextB.lng;
                break;
              }
            }
          }

          if (destLat !== undefined && destLng !== undefined) {
            block.lat = destLat;
            block.lng = destLng;
            const dist = getDistanceKm(lastLocBlock.lat, lastLocBlock.lng, destLat, destLng);
            block.distance = `${dist} km`;
          }
          postProcessedBlocks.push(block);
        } else {
          // It's a static location block (activity, meal, sleep, wait)
          if (block.lat !== undefined && block.lng !== undefined) {
            const dist = getDistanceKm(lastLocBlock.lat, lastLocBlock.lng, block.lat, block.lng);
            if (dist > 3) { // Location changed by more than 3 km
              // Check if the immediately preceding block in postProcessedBlocks is a travel block
              const prevInProcessed = postProcessedBlocks[postProcessedBlocks.length - 1];
              const hasPrecedingTravel = prevInProcessed && prevInProcessed.type === 'travel';

              if (!hasPrecedingTravel) {
                // Insert an auto-generated travel block
                const travelDuration = Math.max(0.5, Math.round((dist / 35) * 2) / 2); // 35 km/h avg speed
                const travelBlock: InternalItineraryBlock = {
                  id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
                  dayNumber: block.dayNumber,
                  type: 'travel',
                  name: `Travel to ${block.locationName || block.name}`,
                  startTime: lastLocBlock.endTime || block.startTime,
                  endTime: block.startTime,
                  bufferMins: 15,
                  durationHours: travelDuration,
                  hotelName: '',
                  roomName: '',
                  mealPlan: '',
                  imageUrl: '',
                  confirmationStatus: 'Pending',
                  paymentStatus: 'Pending',
                  internalNotes: 'Auto-generated travel block due to location change',
                  comments: [],
                  locationName: block.locationName || '',
                  lat: block.lat,
                  lng: block.lng,
                  distance: `${dist} km`,
                  weather: block.weather
                };
                postProcessedBlocks.push(travelBlock);
              } else {
                // Ensure the existing travel block has the correct destination and distance
                prevInProcessed.lat = block.lat;
                prevInProcessed.lng = block.lng;
                prevInProcessed.distance = `${dist} km`;
                if (!prevInProcessed.locationName) {
                  prevInProcessed.locationName = block.locationName;
                }
              }
            }
            lastLocBlock = {
              lat: block.lat,
              lng: block.lng,
              locationName: block.locationName || block.name,
              endTime: block.endTime
            };
          }
          postProcessedBlocks.push(block);
        }
      });

      // 6. Handle dropped activities
      if (routeResult.droppedActivities && routeResult.droppedActivities.length > 0) {
        routeResult.droppedActivities.forEach(act => {
          dropped.push({
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
            dayNumber: 0,
            type: 'activity',
            name: act.activity_name,
            startTime: '',
            endTime: '',
            bufferMins: 0,
            durationHours: act.duration_hours || 2,
            hotelName: '',
            roomName: '',
            mealPlan: '',
            imageUrl: '',
            confirmationStatus: 'Pending',
            paymentStatus: 'Pending',
            internalNotes: 'This activity could not fit in the AI schedule.',
            comments: []
          });
        });
      }

      setItinerary([...postProcessedBlocks, ...dropped]);
      alert("AI itinerary generated successfully! Review the itinerary days and verify the plan.");
    } catch (error: any) {
      console.error("AI Generation failed:", error);
      alert("AI Route Generation Error: " + (error.message || error));
    } finally {
      setIsGenerating(false);
    }
  };

  // Filter blocks for active day
  const dayBlocks = useMemo(() => {
    return itinerary.filter(b => b.dayNumber === activeDay);
  }, [itinerary, activeDay]);

  const droppedBlocks = useMemo(() => {
    return itinerary.filter(b => b.dayNumber === 0);
  }, [itinerary]);

  // Helper to find the closest preceding location for travel blocks
  const getPrecedingLocation = (currentIdx: number) => {
    // 1. Search preceding blocks in the same day (dayBlocks)
    for (let i = currentIdx - 1; i >= 0; i--) {
      const prevBlock = dayBlocks[i];
      if (prevBlock.locationName && prevBlock.locationName.trim() !== '') {
        return prevBlock.locationName.trim();
      }
    }
    // 2. Search preceding days in order
    for (let d = activeDay - 1; d >= 1; d--) {
      const prevDayBlocks = itinerary.filter(b => b.dayNumber === d);
      for (let i = prevDayBlocks.length - 1; i >= 0; i--) {
        const prevBlock = prevDayBlocks[i];
        if (prevBlock.locationName && prevBlock.locationName.trim() !== '') {
          return prevBlock.locationName.trim();
        }
      }
    }
    // 3. Fallback to Airport
    return 'Katunayake';
  };

  const handleAddBlock = () => {
    const newBlock: InternalItineraryBlock = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      dayNumber: activeDay,
      type: 'activity',
      name: '',
      startTime: '09:00',
      endTime: '11:00',
      bufferMins: 0,
      durationHours: 2,
      hotelName: '',
      roomName: '',
      mealPlan: 'BB',
      imageUrl: '',
      confirmationStatus: 'Pending',
      paymentStatus: 'Pending',
      internalNotes: '',
      distance: '',
      locationName: '',
      comments: []
    };
    setItinerary(prev => [...prev, newBlock]);
  };

  const handleDeleteBlock = (id: string) => {
    setItinerary(prev => prev.filter(b => b.id !== id));
  };

  const handleUpdateBlockField = (id: string, field: keyof InternalItineraryBlock, value: any) => {
    setItinerary(prev => prev.map(b => {
      if (b.id === id) {
        const updated = { ...b, [field]: value };
        if (b.type === 'sleep' && field === 'agreedPrice' && value !== undefined) {
          const factor = (singleRoomsCount * 0.85) + 
                         (doubleRoomsCount * 1.0) + 
                         (tripleRoomsCount * 1.4) + 
                         (familyRoomsCount * 1.8);
          const activeFactor = factor > 0 ? factor : 1.0;
          updated.baseRoomRate = Math.round((Number(value) / activeFactor) * 100) / 100;
        }
        return updated;
      }
      return b;
    }));
  };

  const handleMoveBlock = (id: string, direction: 'up' | 'down') => {
    const dayBlocksList = itinerary.filter(b => b.dayNumber === activeDay);
    const index = dayBlocksList.findIndex(b => b.id === id);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const swapped = [...dayBlocksList];
      [swapped[index], swapped[index - 1]] = [swapped[index - 1], swapped[index]];
      
      const otherBlocks = itinerary.filter(b => b.dayNumber !== activeDay);
      setItinerary([...otherBlocks, ...swapped]);
    } else if (direction === 'down' && index < dayBlocksList.length - 1) {
      const swapped = [...dayBlocksList];
      [swapped[index], swapped[index + 1]] = [swapped[index + 1], swapped[index]];
      
      const otherBlocks = itinerary.filter(b => b.dayNumber !== activeDay);
      setItinerary([...otherBlocks, ...swapped]);
    }
  };

  const handleImageUpload = async (blockId: string, file: File) => {
    setUploadingBlockId(blockId);
    try {
      const url = await uploadItineraryImage(file);
      handleUpdateBlockField(blockId, 'imageUrl', url);
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploadingBlockId(null);
    }
  };

  const handleAddComment = (blockId: string) => {
    const text = commentDrafts[blockId] || '';
    if (!text.trim()) return;

    const newComment: BlockComment = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      role: 'agent',
      text: text.trim(),
      timestamp: new Date().toISOString()
    };

    setItinerary(prev => prev.map(b => {
      if (b.id === blockId) {
        return {
          ...b,
          comments: b.comments ? [...b.comments, newComment] : [newComment]
        };
      }
      return b;
    }));

    setCommentDrafts(prev => ({ ...prev, [blockId]: '' }));
  };

  const blockTypes: { value: InternalItineraryBlock['type']; label: string }[] = [
    { value: 'activity', label: 'Activity' },
    { value: 'sleep', label: 'Hotel / Sleep' },
    { value: 'meal', label: 'Meal' },
    { value: 'travel', label: 'Transfer / Travel' },
    { value: 'train', label: 'Train' },
    { value: 'guide', label: 'Guide assignment' },
    { value: 'custom', label: 'Custom Item' }
  ];

  const mealPlans = ['None', 'BB', 'HB', 'FB', 'AI'];  return (
    <div className="relative overflow-hidden bg-white/95 backdrop-blur-md rounded-3xl p-8 border border-neutral-200/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-3 duration-300 space-y-8">
      {/* Decorative Glowing Blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-full filter blur-3xl -translate-y-12 translate-x-12 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-amber-500/5 to-emerald-500/5 rounded-full filter blur-3xl translate-y-12 -translate-x-12 pointer-events-none" />

      {/* Cooperative Lock Warning Banner */}
      {isLockedByOther && (
        <div className="relative bg-rose-50/70 border border-rose-200/80 text-rose-900 rounded-2xl p-5 flex items-start gap-4 shadow-sm animate-in fade-in duration-200">
          <div className="p-2 bg-rose-100/80 text-rose-800 rounded-xl shrink-0">
            <Shield className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <span className="font-serif font-black text-sm text-rose-950 block">Cooperative Editing Lock Active</span>
            <span className="text-xs text-rose-700 leading-relaxed block mt-1">
              This itinerary is currently being edited by <strong className="font-black text-rose-900">{lockOwnerName || 'another planner'}</strong>. 
              Editing controls have been temporarily disabled to prevent conflicting changes. You can still view the itinerary and load older draft versions.
            </span>
          </div>
        </div>
      )}

      {/* Header with AI Generator Button */}
      <div className="relative border-b border-neutral-100 pb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h3 className="text-2xl font-serif font-extrabold text-neutral-800 tracking-tight">AI Itinerary Builder</h3>
          <p className="text-xs text-neutral-500/90 font-medium leading-relaxed max-w-2xl mt-1">Design a customized flat skeleton itinerary. Refine parameters, pacing rules, and let Gemini route day-by-day plans.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Travel Style Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wide">Style:</span>
            <select
              value={travelStyle}
              onChange={(e) => onTravelStyleChange(e.target.value as TravelStyle)}
              disabled={isLockedByOther}
              className="text-xs border border-neutral-200/80 rounded-xl px-3.5 py-2.5 bg-white text-neutral-800 font-bold hover:border-neutral-300 focus:outline-none focus:ring-4 focus:ring-emerald-800/10 focus:border-emerald-800 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              {TRAVEL_STYLES.map(style => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
          </div>

          {/* Travel Dates Display */}
          {(arrivalDate || departureDate) && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200/60 text-xs font-bold text-neutral-800 shadow-sm shrink-0">
              <Calendar className="w-4 h-4 text-emerald-800" />
              <span>{arrivalDate || 'TBD'} to {departureDate || 'TBD'}</span>
            </div>
          )}

          {/* Versions Dropdown Select */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wide">Version:</span>
            <select
              value=""
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  const selectedVer = versions.find(v => v.id === val);
                  if (selectedVer) onLoadVersion(selectedVer);
                }
              }}
              className="text-xs border border-neutral-200/80 rounded-xl px-3.5 py-2.5 bg-white text-neutral-800 font-bold hover:border-neutral-300 focus:outline-none focus:ring-4 focus:ring-emerald-800/10 focus:border-emerald-800 transition-all cursor-pointer shadow-sm max-w-[200px]"
            >
              <option value="" disabled>Select Version...</option>
              {versions.map(v => (
                <option key={v.id} value={v.id}>
                  V{v.version_number} - {v.label || `Draft V${v.version_number}`}
                </option>
              ))}
              {versions.length === 0 && (
                <option disabled>No versions saved yet</option>
              )}
            </select>
          </div>

          {/* Save Version Snapshot */}
          <button
            onClick={() => {
              const label = prompt("Enter a label/description for this version snapshot (e.g. 'Changed Sigiriya hotel'):");
              if (label !== null) {
                onSaveNewVersion(label || `Snapshot V${versions.length + 1}`);
              }
            }}
            disabled={isLockedByOther}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200/80 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-950 transition-all text-xs font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shrink-0"
            title="Save manual version snapshot"
          >
            <Save className="w-4 h-4 text-neutral-500" /> Save Version
          </button>

          {/* Rules toggle */}
          <button
            onClick={() => setShowRulesConfig(!showRulesConfig)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 border ${
              showRulesConfig
                ? 'bg-neutral-100 border-neutral-300/80 text-neutral-800 shadow-inner'
                : 'bg-white hover:bg-neutral-50 border-neutral-200/80 text-neutral-700 hover:text-neutral-900'
            }`}
          >
            <Settings className="w-4 h-4 text-neutral-500" /> AI Rules Config
          </button>

          {/* Download PDF */}
          <button
            onClick={handleDownloadPdf}
            disabled={itinerary.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200/80 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-950 transition-all text-xs font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <Download className="w-4 h-4 text-neutral-500" /> Download PDF
          </button>

          {/* AI Generator */}
          <button
            onClick={handleGenerateItinerary}
            disabled={isGenerating || selectedActivities.length === 0 || isLockedByOther}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white transition-all duration-300 text-xs font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed disabled:from-neutral-300 disabled:to-neutral-400 shadow-md hover:shadow-lg hover:shadow-emerald-800/10 active:scale-[0.98] shrink-0"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Route...</span>
              </>
            ) : (
              <>
                <BrainCircuit className="w-4 h-4 animate-pulse" />
                <span>Auto-Generate Route</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Traveler & Service Controls Box */}
      <div className="bg-neutral-50/40 p-6 rounded-2xl border border-neutral-200/50 space-y-5">
        {/* Row 1: Travelers & Services */}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-5">
          {/* Adults */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Adults</label>
            <input
              type="number"
              min="1"
              value={adults}
              disabled={isLockedByOther}
              onChange={(e) => onAdultsChange(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3.5 py-2 text-xs border border-neutral-200 rounded-xl bg-white font-bold text-neutral-800 focus:outline-none focus:ring-4 focus:ring-emerald-800/10 focus:border-emerald-800 shadow-sm transition-all disabled:opacity-50"
            />
          </div>
          {/* Children */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Children</label>
            <input
              type="number"
              min="0"
              value={children}
              disabled={isLockedByOther}
              onChange={(e) => onChildrenChange(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3.5 py-2 text-xs border border-neutral-200 rounded-xl bg-white font-bold text-neutral-800 focus:outline-none focus:ring-4 focus:ring-emerald-800/10 focus:border-emerald-800 shadow-sm transition-all disabled:opacity-50"
            />
          </div>
          {/* Infants */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Infants</label>
            <input
              type="number"
              min="0"
              value={infants}
              disabled={isLockedByOther}
              onChange={(e) => onInfantsChange(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3.5 py-2 text-xs border border-neutral-200 rounded-xl bg-white font-bold text-neutral-800 focus:outline-none focus:ring-4 focus:ring-emerald-800/10 focus:border-emerald-800 shadow-sm transition-all disabled:opacity-50"
            />
          </div>
          {/* Guide Needed checkbox */}
          <div className="flex items-center gap-3 sm:pt-4 md:pt-5">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                id="top-guide-needed"
                checked={guideNeeded}
                disabled={isLockedByOther}
                onChange={(e) => onGuideNeededChange(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-300 text-emerald-800 focus:ring-emerald-800 cursor-pointer accent-emerald-800 disabled:opacity-50"
              />
            </div>
            <label htmlFor="top-guide-needed" className="text-xs font-bold text-neutral-700 cursor-pointer select-none">
              Guide Needed
            </label>
          </div>
          {/* Chauffeur Needed checkbox */}
          <div className="flex items-center gap-3 sm:pt-4 md:pt-5">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                id="top-chauffeur-needed"
                checked={chauffeurNeeded}
                disabled={isLockedByOther}
                onChange={(e) => onChauffeurNeededChange(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-300 text-emerald-800 focus:ring-emerald-800 cursor-pointer accent-emerald-800 disabled:opacity-50"
              />
            </div>
            <label htmlFor="top-chauffeur-needed" className="text-xs font-bold text-neutral-700 cursor-pointer select-none">
              Vehicle & Chauffeur
            </label>
          </div>
        </div>

        {/* Row 2: Room Configurations */}
        <div className="border-t border-neutral-200/60 pt-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
            {/* Single Rooms */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Single Rooms</label>
              <input
                type="number"
                min="0"
                value={singleRoomsCount}
                disabled={hasTeam || isLockedByOther}
                onChange={(e) => setManualSingle(Math.max(0, parseInt(e.target.value) || 0))}
                className={`w-full px-3.5 py-2 text-xs border rounded-xl font-bold focus:outline-none focus:ring-4 focus:ring-emerald-800/10 focus:border-emerald-800 transition-all ${
                  (hasTeam || isLockedByOther)
                    ? 'bg-neutral-100/80 text-neutral-400 cursor-not-allowed border-neutral-200' 
                    : 'bg-white text-neutral-800 border-neutral-200 shadow-sm'
                }`}
              />
            </div>
            {/* Double Rooms */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Double / Twin Rooms</label>
              <input
                type="number"
                min="0"
                value={doubleRoomsCount}
                disabled={hasTeam || isLockedByOther}
                onChange={(e) => setManualDouble(Math.max(0, parseInt(e.target.value) || 0))}
                className={`w-full px-3.5 py-2 text-xs border rounded-xl font-bold focus:outline-none focus:ring-4 focus:ring-emerald-800/10 focus:border-emerald-800 transition-all ${
                  (hasTeam || isLockedByOther)
                    ? 'bg-neutral-100/80 text-neutral-400 cursor-not-allowed border-neutral-200' 
                    : 'bg-white text-neutral-800 border-neutral-200 shadow-sm'
                }`}
              />
            </div>
            {/* Triple Rooms */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Triple Rooms</label>
              <input
                type="number"
                min="0"
                value={tripleRoomsCount}
                disabled={hasTeam || isLockedByOther}
                onChange={(e) => setManualTriple(Math.max(0, parseInt(e.target.value) || 0))}
                className={`w-full px-3.5 py-2 text-xs border rounded-xl font-bold focus:outline-none focus:ring-4 focus:ring-emerald-800/10 focus:border-emerald-805 transition-all ${
                  (hasTeam || isLockedByOther)
                    ? 'bg-neutral-100/80 text-neutral-400 cursor-not-allowed border-neutral-200' 
                    : 'bg-white text-neutral-800 border-neutral-200 shadow-sm'
                }`}
              />
            </div>
            {/* Family Rooms */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Family Rooms</label>
              <input
                type="number"
                min="0"
                value={familyRoomsCount}
                disabled={hasTeam || isLockedByOther}
                onChange={(e) => setManualFamily(Math.max(0, parseInt(e.target.value) || 0))}
                className={`w-full px-3.5 py-2 text-xs border rounded-xl font-bold focus:outline-none focus:ring-4 focus:ring-emerald-800/10 focus:border-emerald-800 transition-all ${
                  (hasTeam || isLockedByOther)
                    ? 'bg-neutral-100/80 text-neutral-400 cursor-not-allowed border-neutral-200' 
                    : 'bg-white text-neutral-800 border-neutral-200 shadow-sm'
                }`}
              />
            </div>
          </div>
          <div className="flex items-center self-end md:self-center">
            {hasTeam ? (
              <span className="text-[10px] bg-emerald-50/80 text-emerald-800 font-extrabold border border-emerald-200/50 px-3.5 py-2 rounded-xl shadow-sm">
                ✓ Calculated from Client Team
              </span>
            ) : (
              <span className="text-[10px] bg-amber-50/80 text-amber-800 font-extrabold border border-amber-200/50 px-3.5 py-2 rounded-xl shadow-sm">
                ⚠ Manual room configuration
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Rules Configuration Card */}
      {showRulesConfig && (
        <div className="bg-neutral-50/50 border border-neutral-200/70 rounded-2xl p-5 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between border-b border-neutral-200/60 pb-3">
            <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">AI Routing & Generation Constraints</h4>
            <button
              onClick={handleSaveRules}
              disabled={isSavingRules || isLockedByOther}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-950 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all disabled:opacity-50 shadow-sm hover:shadow-emerald-800/10"
            >
              {isSavingRules ? 'Saving...' : 'Save Rules'}
            </button>
          </div>

          {isLoadingRules ? (
            <div className="flex items-center justify-center py-8 text-xs text-neutral-400 gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-800" />
              <span>Fetching rules from database...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">General Rules (All Tours)</label>
                <textarea
                  rows={4}
                  placeholder="Specify universal rules, e.g. 'Always place breakfast first', 'Schedule lunch around 1:00 PM'."
                  value={aiRules.generic}
                  disabled={isLockedByOther}
                  onChange={(e) => setAiRules(prev => ({ ...prev, generic: e.target.value }))}
                  className="w-full text-xs border border-neutral-200 rounded-xl px-3.5 py-2.5 bg-white text-neutral-800 focus:outline-none focus:ring-4 focus:ring-emerald-800/10 focus:border-emerald-800 transition-all font-medium resize-y shadow-inner disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">Itinerary-Specific Rules (This Tour Only)</label>
                <textarea
                  rows={4}
                  placeholder="Specify rules for this client, e.g. 'Must plan Sigiriya rock climb for morning due to heat', 'Avoid travel after 6 PM'."
                  value={aiRules.specific}
                  disabled={isLockedByOther}
                  onChange={(e) => setAiRules(prev => ({ ...prev, specific: e.target.value }))}
                  className="w-full text-xs border border-neutral-200 rounded-xl px-3.5 py-2.5 bg-white text-neutral-800 focus:outline-none focus:ring-4 focus:ring-emerald-800/10 focus:border-emerald-800 transition-all font-medium resize-y shadow-inner disabled:opacity-50"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dropped Activities warning list */}
      {droppedBlocks.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-200/50 rounded-2xl p-5 space-y-3 text-xs text-amber-900 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="font-extrabold flex items-center gap-2 text-amber-800">
            <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Dropped Activities ({droppedBlocks.length})</span>
          </div>
          <p className="text-[10px] text-amber-700 leading-relaxed">These activities were selected but could not be routed within the requested day boundaries by Gemini. You can manually edit or move them to a day number:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {droppedBlocks.map(block => (
              <div key={block.id} className="bg-white/80 backdrop-blur-sm border border-amber-200/50 rounded-xl p-3 flex items-center justify-between gap-3 shadow-inner">
                <span className="font-bold truncate text-neutral-800">{block.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={block.dayNumber}
                    disabled={isLockedByOther}
                    onChange={(e) => handleUpdateBlockField(block.id, 'dayNumber', Number(e.target.value))}
                    className="text-[10px] border border-neutral-200 rounded-lg px-2 py-1 bg-neutral-50 text-neutral-800 font-bold focus:outline-none focus:border-amber-500 shadow-sm disabled:opacity-50"
                  >
                    <option value={0}>Unassigned</option>
                    {daysArray.map(day => (
                      <option key={day} value={day}>Day {day}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleDeleteBlock(block.id)}
                    disabled={isLockedByOther}
                    className="p-1.5 text-neutral-400 hover:text-red-600 transition-all hover:bg-neutral-100 rounded-lg disabled:opacity-30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Days Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 border-b border-neutral-100">
        <div className="flex items-center gap-1.5 bg-neutral-100/80 p-1.5 rounded-2xl border border-neutral-200/30 shrink-0">
          {daysArray.map(day => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 shrink-0 ${
                activeDay === day
                  ? 'bg-white text-emerald-900 border border-neutral-200/60 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800 hover:bg-white/40'
              }`}
            >
              Day {day}
            </button>
          ))}
        </div>
      </div>

      {/* Day Content */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-neutral-700 flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span>Day {activeDay} Schedule {getDayDateString(activeDay) ? `(${getDayDateString(activeDay)})` : ''}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 font-mono">
                {dayBlocks.length} {dayBlocks.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            {dayBlocks[0]?.weather && (
              <span className="text-xs text-neutral-500 font-semibold bg-amber-50 text-amber-800 border border-amber-200/60 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                <CloudSun className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span>{dayBlocks[0].weather}</span>
              </span>
            )}
          </h4>
        </div>

        {/* Daily Cost Summary Banner */}
        {appSettings && (
          <div className="bg-gradient-to-tr from-neutral-50/70 to-emerald-50/20 rounded-2xl border border-neutral-200/50 p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200/60 pb-3">
              <h5 className="text-xs font-bold text-neutral-600 uppercase tracking-wider flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-800 shrink-0" />
                <span>Day {activeDay} Cost Summary ({travelStyle} Tier)</span>
              </h5>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Est. Day Total:</span>
                <span className="text-lg font-black text-emerald-800 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-xl">
                  ${calculateDayTotal(activeDay).total.toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {/* Hotel Cost */}
              <div className="bg-white p-4 rounded-xl border border-neutral-200/50 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-2">
                <div className="flex items-center gap-2 text-neutral-400">
                  <BedDouble className="w-4 h-4 text-amber-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Hotel Cost</span>
                </div>
                <span className="text-base font-extrabold text-neutral-800">${calculateDayTotal(activeDay).hotel.toFixed(2)}</span>
              </div>

              {/* Meal Cost */}
              <div className="bg-white p-4 rounded-xl border border-neutral-200/50 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between gap-1 text-neutral-400">
                  <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-rose-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Meals</span>
                  </div>
                  <span className="text-[9px] text-neutral-400 font-bold shrink-0">({(adults || 0) + (children || 0)} Pax)</span>
                </div>
                <span className="text-base font-extrabold text-neutral-800">${calculateDayTotal(activeDay).meals.toFixed(2)}</span>
              </div>

              {/* Transport Cost */}
              <div className="bg-white p-4 rounded-xl border border-neutral-200/50 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between gap-1 text-neutral-400">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-sky-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Transport</span>
                  </div>
                  <span className="text-[9px] text-neutral-400 font-bold shrink-0">({calculateDayTotal(activeDay).km.toFixed(0)} km)</span>
                </div>
                <span className="text-base font-extrabold text-neutral-800">${calculateDayTotal(activeDay).transport.toFixed(2)}</span>
              </div>

              {/* Concierge & Tickets */}
              <div className="bg-white p-4 rounded-xl border border-neutral-200/50 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between gap-1 text-neutral-400">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-indigo-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Concierge</span>
                  </div>
                  <span className="text-[9px] text-neutral-400 font-bold shrink-0">({(adults || 0) + (children || 0)} Pax)</span>
                </div>
                <span className="text-base font-extrabold text-neutral-800">${calculateDayTotal(activeDay).concierge.toFixed(2)}</span>
              </div>

              {/* Agency Fee & Tax */}
              <div className="bg-white p-4 rounded-xl border border-neutral-200/50 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between gap-1 text-neutral-400">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-emerald-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Agency Fee</span>
                  </div>
                  <span className="text-[9px] text-neutral-400 font-bold shrink-0">({calculateDayTotal(activeDay).agencyFeePercent}%)</span>
                </div>
                <span className="text-base font-extrabold text-neutral-800">${calculateDayTotal(activeDay).agencyFee.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Schedule list */}
        <div className="space-y-5">
          {dayBlocks.map((block, idx) => {
            const isCommentsOpen = openCommentsBlockId === block.id;
            return (
              <div
                key={block.id}
                className={`group border border-neutral-200/70 ${getCardAccentBorder(block.type)} rounded-2xl bg-white hover:shadow-md hover:border-neutral-300/80 transition-all duration-300 overflow-hidden shadow-sm`}
              >
                {/* Card Top Banner / Drag / Ordering */}
                <div className="bg-neutral-50/80 px-5 py-3 border-b border-neutral-100 flex items-center justify-between text-xs text-neutral-500 font-medium select-none">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="w-6 h-6 rounded-full bg-neutral-105 border border-neutral-200/40 flex items-center justify-center font-bold text-[10px] text-neutral-600 shadow-sm">
                      {idx + 1}
                    </span>
                    {renderTypeBadge(block.type)}
                    {block.type === 'travel' ? (
                      <>
                        <span className="text-neutral-300 font-normal">|</span>
                        <span className="text-emerald-800 font-bold flex items-center gap-1.5 bg-emerald-50/60 px-2.5 py-1 rounded-lg border border-emerald-100/60 text-[11px] shadow-sm">
                          <span>{getPrecedingLocation(idx)}</span>
                          <span className="text-emerald-400 font-black">→</span>
                          <span>{block.locationName || 'TBD'}</span>
                          {block.distance && (
                            <span className="text-[10px] text-emerald-700 font-extrabold bg-white px-2 py-0.5 rounded-md border border-emerald-200/40 ml-1 shrink-0">
                              {block.distance}
                            </span>
                          )}
                        </span>
                      </>
                    ) : (
                      block.locationName && (
                        <>
                          <span className="text-neutral-300 font-normal">|</span>
                          <span className="text-neutral-705 font-bold flex items-center gap-1.5 bg-neutral-50 px-2.5 py-1 rounded-lg border border-neutral-200/50 text-[11px] shadow-sm">
                            <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span>{block.locationName}</span>
                            {block.distance && (
                              <span className="text-[10px] text-neutral-500 font-extrabold bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200/40 ml-1 shrink-0">
                                {block.distance}
                              </span>
                            )}
                          </span>
                        </>
                      )
                    )}
                  </div>

                  {/* Ordering Controls & Delete */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleMoveBlock(block.id, 'up')}
                      disabled={idx === 0 || isLockedByOther}
                      className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 disabled:opacity-25 disabled:pointer-events-none transition-all"
                      title="Move Up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveBlock(block.id, 'down')}
                      disabled={idx === dayBlocks.length - 1 || isLockedByOther}
                      className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 disabled:opacity-25 disabled:pointer-events-none transition-all"
                      title="Move Down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <span className="h-4 w-[1px] bg-neutral-200 mx-1" />
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      disabled={isLockedByOther}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-650 transition-all disabled:opacity-25"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Main Card Body */}
                <div className="p-5 space-y-5">
                  {/* Grid fields */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Item Type Dropdown */}
                    <div className="md:col-span-3">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">Type</label>
                      <select
                        value={block.type}
                        onChange={(e) => handleUpdateBlockField(block.id, 'type', e.target.value)}
                        disabled={isLockedByOther}
                        className="w-full text-xs border border-neutral-200 rounded-xl px-3.5 py-2 bg-white text-neutral-805 font-bold focus:outline-none focus:ring-4 focus:ring-emerald-800/10 focus:border-emerald-800 transition-all shadow-sm disabled:opacity-50"
                      >
                        {blockTypes.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Item Name Input */}
                    <div className="md:col-span-5">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">Item Title / Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Cinnamon Grand Stay, Sigiriya Tour, Dinner..."
                        value={block.name || ''}
                        onChange={(e) => handleUpdateBlockField(block.id, 'name', e.target.value)}
                        disabled={isLockedByOther}
                        className="w-full text-xs border border-neutral-200 rounded-xl px-3.5 py-2 bg-white text-neutral-805 font-bold placeholder:text-neutral-300 focus:outline-none focus:ring-4 focus:ring-emerald-800/10 focus:border-emerald-800 transition-all shadow-sm disabled:opacity-50"
                      />
                    </div>

                    {/* Time Range */}
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">Start Time</label>
                      <input
                        type="text"
                        placeholder="09:00"
                        value={block.startTime || ''}
                        onChange={(e) => handleUpdateBlockField(block.id, 'startTime', e.target.value)}
                        disabled={isLockedByOther}
                        className="w-full text-xs border border-neutral-200 rounded-xl px-3.5 py-2 bg-white text-neutral-805 font-bold placeholder:text-neutral-300 focus:outline-none focus:ring-4 focus:ring-emerald-800/10 focus:border-emerald-800 transition-all shadow-sm text-center disabled:opacity-50"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">End Time</label>
                      <input
                        type="text"
                        placeholder="18:00"
                        value={block.endTime || ''}
                        onChange={(e) => handleUpdateBlockField(block.id, 'endTime', e.target.value)}
                        disabled={isLockedByOther}
                        className="w-full text-xs border border-neutral-200 rounded-xl px-3.5 py-2 bg-white text-neutral-850 font-bold placeholder:text-neutral-300 focus:outline-none focus:ring-4 focus:ring-emerald-800/10 focus:border-emerald-800 transition-all shadow-sm text-center disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Location & Distance Row */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4 border-t border-dashed border-neutral-200">
                    <div className="md:col-span-8">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">Location / Destination</label>
                      <input
                        type="text"
                        placeholder="e.g. Sigiriya, Colombo, Galle"
                        value={block.locationName || ''}
                        onChange={(e) => handleUpdateBlockField(block.id, 'locationName', e.target.value)}
                        disabled={isLockedByOther}
                        className="w-full text-xs border border-neutral-200 rounded-xl px-3.5 py-2 bg-white text-neutral-800 font-bold placeholder:text-neutral-300 focus:outline-none focus:ring-4 focus:ring-emerald-800/10 focus:border-emerald-800 transition-all shadow-sm disabled:opacity-50"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">Distance (km)</label>
                      <input
                        type="text"
                        placeholder="e.g. 50 km"
                        value={block.distance || ''}
                        onChange={(e) => handleUpdateBlockField(block.id, 'distance', e.target.value)}
                        disabled={isLockedByOther}
                        className="w-full text-xs border border-neutral-200 rounded-xl px-3.5 py-2 bg-white text-neutral-800 font-bold placeholder:text-neutral-300 focus:outline-none focus:ring-4 focus:ring-emerald-800/10 focus:border-emerald-800 transition-all shadow-sm disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Sleep type specific fields */}
                  {block.type === 'sleep' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-dashed border-neutral-200">
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">Hotel Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Cinnamon Grand"
                          value={block.hotelName || ''}
                          onChange={(e) => handleUpdateBlockField(block.id, 'hotelName', e.target.value)}
                          disabled={isLockedByOther}
                          className="w-full text-xs border border-neutral-200 rounded-xl px-3.5 py-2 bg-white text-neutral-800 font-bold placeholder:text-neutral-300 focus:outline-none focus:ring-4 focus:ring-emerald-800/10 focus:border-emerald-800 transition-all shadow-sm disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">Room Category / Type</label>
                        <input
                          type="text"
                          placeholder="e.g. Deluxe Double Room"
                          value={block.roomName || ''}
                          onChange={(e) => handleUpdateBlockField(block.id, 'roomName', e.target.value)}
                          disabled={isLockedByOther}
                          className="w-full text-xs border border-neutral-200 rounded-xl px-3.5 py-2 bg-white text-neutral-800 font-bold placeholder:text-neutral-300 focus:outline-none focus:ring-4 focus:ring-emerald-800/10 focus:border-emerald-800 transition-all shadow-sm disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">Meal Plan</label>
                        <select
                          value={block.mealPlan || 'BB'}
                          onChange={(e) => handleUpdateBlockField(block.id, 'mealPlan', e.target.value)}
                          disabled={isLockedByOther}
                          className="w-full text-xs border border-neutral-200 rounded-xl px-3.5 py-2 bg-white text-neutral-850 font-bold focus:outline-none focus:ring-4 focus:ring-emerald-800/10 focus:border-emerald-800 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          {mealPlans.map(mp => (
                            <option key={mp} value={mp}>{mp}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">Rate (USD)</label>
                        <input
                          type="number"
                          placeholder="e.g. 250"
                          value={block.agreedPrice !== undefined ? block.agreedPrice : ''}
                          onChange={(e) => handleUpdateBlockField(block.id, 'agreedPrice', e.target.value ? Number(e.target.value) : undefined)}
                          disabled={isLockedByOther}
                          className="w-full text-xs border border-neutral-200 rounded-xl px-3.5 py-2 bg-white text-neutral-800 font-bold placeholder:text-neutral-300 focus:outline-none focus:ring-4 focus:ring-emerald-800/10 focus:border-emerald-800 transition-all shadow-sm disabled:opacity-50"
                        />
                      </div>
                    </div>
                  )}

                  {/* Description / Notes text area */}
                  <div className="pt-4 border-t border-dashed border-neutral-200">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">Description / Notes</label>
                    <textarea
                      rows={2}
                      placeholder="Specify important details or descriptions for this itinerary item..."
                      value={block.internalNotes || ''}
                      onChange={(e) => handleUpdateBlockField(block.id, 'internalNotes', e.target.value)}
                      disabled={isLockedByOther}
                      className="w-full text-xs border border-neutral-200 rounded-xl px-3.5 py-2.5 bg-white text-neutral-800 focus:outline-none focus:ring-4 focus:ring-emerald-800/10 focus:border-emerald-800 transition-all font-medium resize-none shadow-sm placeholder:text-neutral-300 disabled:opacity-50"
                    />
                  </div>

                  {/* Image display & Image Uploading & Discussion controls */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-dashed border-neutral-200">
                    
                    {/* Left side: Upload Button & Image thumbnail */}
                    <div className="flex items-center gap-3">
                      {block.imageUrl ? (
                        <div className="relative group/img w-16 h-12 rounded-xl border border-neutral-200/80 overflow-hidden shadow-sm transition-all duration-300 hover:scale-105">
                          <img
                             src={block.imageUrl}
                             alt="Itinerary item"
                             className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => handleUpdateBlockField(block.id, 'imageUrl', '')}
                            disabled={isLockedByOther}
                            className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 disabled:group-hover/img:opacity-0 transition-all text-[10px] font-extrabold uppercase tracking-wide disabled:pointer-events-none"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200/80 hover:bg-neutral-50 text-[10px] font-extrabold text-neutral-600 hover:text-neutral-800 cursor-pointer transition-all shadow-sm select-none ${isLockedByOther ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}>
                          {uploadingBlockId === block.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-800" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5 text-neutral-400" />
                              <span>Upload Image</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingBlockId === block.id || isLockedByOther}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(block.id, file);
                            }}
                          />
                        </label>
                      )}
                    </div>

                    {/* Right side: Comments button */}
                    <button
                      onClick={() => setOpenCommentsBlockId(isCommentsOpen ? null : block.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] font-extrabold transition-all duration-200 shadow-sm ${
                        isCommentsOpen
                          ? 'bg-neutral-100 border-neutral-300 text-neutral-850 shadow-inner'
                          : 'border-neutral-200/80 hover:bg-neutral-50 text-neutral-600 hover:text-neutral-800'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-neutral-400" />
                      <span>
                        {block.comments && block.comments.length > 0
                          ? `${block.comments.length} Comments`
                          : 'Discussion'}
                      </span>
                    </button>

                  </div>

                </div>

                {/* Comments Section Drawer (inside the card) */}
                {isCommentsOpen && (
                  <div className="bg-neutral-50/50 border-t border-neutral-200/60 p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-200/60 pb-2 flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Discussion Thread</span>
                    </div>

                    {/* Comment list */}
                    <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                      {block.comments && block.comments.length > 0 ? (
                        block.comments.map(c => {
                          const isAgent = c.role === 'agent';
                          return (
                            <div key={c.id} className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}>
                              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-sm leading-relaxed ${
                                isAgent
                                  ? 'bg-emerald-800 text-white rounded-tr-none'
                                  : 'bg-white text-neutral-800 border border-neutral-200/80 rounded-tl-none'
                              }`}>
                                <p>{c.text}</p>
                              </div>
                              <span className="text-[9px] text-neutral-400 mt-1 font-bold">
                                {isAgent ? 'Agent' : 'Tourist'} &bull; {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-6 text-xs text-neutral-400 italic">
                          No messages yet. Start collaborating by leaving a note.
                        </div>
                      )}
                    </div>

                    {/* Add Comment Input */}
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Write a message..."
                        value={commentDrafts[block.id] || ''}
                        onChange={(e) => setCommentDrafts(prev => ({ ...prev, [block.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddComment(block.id);
                        }}
                        disabled={isLockedByOther}
                        className="flex-1 text-xs border border-neutral-200 rounded-xl px-3.5 py-2 bg-white text-neutral-850 placeholder:text-neutral-300 focus:outline-none focus:ring-4 focus:ring-emerald-800/10 focus:border-emerald-800 transition-all shadow-inner disabled:opacity-50"
                      />
                      <button
                        onClick={() => handleAddComment(block.id)}
                        disabled={isLockedByOther}
                        className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
                      >
                        Send
                      </button>
                    </div>

                  </div>
                )}

              </div>
            );
          })}

          {dayBlocks.length === 0 && (
            <div className="border border-dashed border-neutral-200 bg-neutral-50/20 rounded-2xl p-16 text-center flex flex-col items-center justify-center min-h-[220px]">
              <Compass className="w-12 h-12 text-neutral-300 mb-3 animate-pulse" />
              <span className="text-sm font-bold text-neutral-600">No items planned for Day {activeDay}</span>
              <span className="text-[11px] text-neutral-400 mt-1 max-w-[280px] leading-relaxed">Click "+ Add Itinerary Item" below to start scheduling experiences and accommodations.</span>
            </div>
          )}
        </div>

        {/* Add block button */}
        <button
          onClick={handleAddBlock}
          disabled={isLockedByOther}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-dashed border-neutral-350 hover:border-emerald-800/60 bg-neutral-50/10 hover:bg-emerald-50/30 text-xs font-bold text-neutral-600 hover:text-emerald-800 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" /> Add Itinerary Item
        </button>
      </div>

      {/* Hidden PDF template container for printing */}
      <div style={{ display: 'none' }}>
        <ItineraryPdfTemplateNew
          ref={printRef}
          itinerary={itinerary}
          touristData={touristData}
          travelStyle={travelStyle}
          singleRoomsCount={singleRoomsCount}
          doubleRoomsCount={doubleRoomsCount}
          tripleRoomsCount={tripleRoomsCount}
          familyRoomsCount={familyRoomsCount}
          guideNeeded={guideNeeded}
          chauffeurNeeded={chauffeurNeeded}
          appSettings={appSettings}
        />
      </div>
    </div>
  );
}
