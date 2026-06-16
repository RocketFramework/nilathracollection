"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  Mail, 
  MailQuestion, 
  Send, 
  Type, 
  Code, 
  Paperclip, 
  Receipt, 
  CircleDollarSign, 
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  Save,
  CheckCircle,
  AlertCircle,
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
  Download,
  Wifi,
  Waves,
  HeartPulse,
  Briefcase,
  Plane,
  X,
  CheckCircle2,
  Copy,
  Link as LinkIcon,
  Link2Off,
  Train,
  Pencil
} from 'lucide-react';
import { TrackType, BasicStep, PrepareBasicSubStep, FinalStep, TravelStyle, Gender, RequestType, RequestStatus, TRAVEL_STYLES, GENDERS, REQUEST_TYPES, REQUEST_STATUSES, BINDABLE_BLOCK_TYPES, BindableBlockType, ITINERARY_BLOCK_TYPES, ItineraryBlockType, ItineraryBlockTypes, TierSettingDefinitions } from '../../types/types';
import { ItineraryElements, TouristActivity, TripData, InternalItineraryBlock, BlockComment, DraftItineraryVersion, ItineraryLock, TourSharedEmail } from '../../other/interfaces';
import { TouristDataDTO, TouristTeamMemberDTO, TouristProfileDTO, TravelPreferencesDTO, TripRequestDTO } from '../../dtos/tourist-data.dto';
import { 
  getTouristDataAction, 
  saveTouristDataAction, 
  getActivitiesAction, 
  getAppMarkupsAction, 
  getTourDataAction, 
  getDailyActivitiesAction,
  saveTourAction, 
  getAIRulesAction, 
  saveAIRuleAction,
  getDraftVersionsAction,
  getDraftVersionAction,
  saveDraftVersionAction,
  acquireItineraryLockAction,
  refreshItineraryLockAction,
  releaseItineraryLockAction,
  checkItineraryLockStatusAction,
  getAssignedHotelsAction,
  getAssignedRestaurantsAction,
  searchHotelsAction,
  getVendorsAction,
  getTransportProvidersAction,
  getDriversAction,
  getTourGuidesAction,
  getRestaurantsAction,
  searchRestaurantsAction,
  getEmailTemplatesAction,
  sendCustomEmailAction,
  getSharedEmailsAction,
  logSharedEmailAction,
  createQuotationRequestAction,
  getQuotationRequestsForTourAction,
  updateQuotationAction,
  selectQuotationAction,
  getPurchaseOrdersAction,
  savePurchaseOrderAction,
  saveSupplierInvoiceAction,
  saveSupplierPaymentAction,
  createVendorBookingAction,
  confirmFinalVendorBookingAction,
  cancelVendorBookingAction,
  getVendorBookingsAction
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

  // Daily activities manifest states
  const [dbActivities, setDbActivities] = useState<any[]>([]);
  const [isLoadingDbActivities, setIsLoadingDbActivities] = useState<boolean>(false);
  const [dbActivitySearchQuery, setDbActivitySearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Procurement operational states
  const [quotationRequests, setQuotationRequests] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [vendorBookings, setVendorBookings] = useState<any[]>([]);
  const [isLoadingProcurement, setIsLoadingProcurement] = useState<boolean>(false);


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
  const [draftVersions, setDraftVersions] = useState<Omit<DraftItineraryVersion, 'itinerary_data'>[]>([]);

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
  const [manualSingle, setManualSingle] = useState<number>(0);
  const [manualDouble, setManualDouble] = useState<number>(1);
  const [manualTriple, setManualTriple] = useState<number>(0);
  const [manualFamily, setManualFamily] = useState<number>(0);

  // Master Data State for Binders
  const [masterData, setMasterData] = useState<any>({
    hotels: [],
    vendors: [],
    drivers: [],
    guides: [],
    restaurants: [],
    transportProviders: [],
    activities: []
  });

  // Share with Tourist email states
  const [shareEmailTo, setShareEmailTo] = useState('');
  const [shareEmailSubject, setShareEmailSubject] = useState('');
  const [shareEmailBody, setShareEmailBody] = useState('');
  const [shareEmailFrom, setShareEmailFrom] = useState('concierge@nilathra.com');
  const [isSendingShareEmail, setIsSendingShareEmail] = useState(false);
  const [shareEmailFeedback, setShareEmailFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [shareTemplateLoaded, setShareTemplateLoaded] = useState<string | null>(null);
  const shareEditorRef = React.useRef<HTMLDivElement>(null);
  const [showShareHtml, setShowShareHtml] = useState(false);
  const [shareEmailAttachments, setShareEmailAttachments] = useState<File[]>([]);
  const [sharedEmails, setSharedEmails] = useState<TourSharedEmail[]>([]);

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
        const updatedTripData = { 
          ...tripData, 
          itinerary,
          manualSingle,
          manualDouble,
          manualTriple,
          manualFamily,
          profile: tripData.profile ? {
            ...tripData.profile,
            adults: touristData.preferences.adults ?? tripData.profile.adults,
            children: touristData.preferences.children ?? tripData.profile.children,
            infants: touristData.preferences.infants ?? tripData.profile.infants,
          } : tripData.profile
        };
        const tourRes = await saveTourAction(tourId, updatedTripData);
        if (!tourRes.success) {
          throw new Error(tourRes.error || 'Failed to save itinerary');
        }
      }

      // Automatically create a draft version snapshot when saving progress
      if (track === 'basic' && currentStepObj?.id === 'ai-builder') {
        const autoLabel = `Auto-saved on ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        const counts = {
          adults: touristData?.preferences?.adults || 2,
          children: touristData?.preferences?.children || 0,
          infants: touristData?.preferences?.infants || 0,
          single_rooms: manualSingle,
          double_rooms: manualDouble,
          triple_rooms: manualTriple,
          family_rooms: manualFamily
        };
        const draftRes = await saveDraftVersionAction(tourId, itinerary, autoLabel, null, counts);
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

  const handleLoadVersion = async (version: Omit<DraftItineraryVersion, 'itinerary_data'>) => {
    if (window.confirm(`Are you sure you want to load version ${version.version_number} (${version.label || 'no label'})? Any unsaved edits will be replaced.`)) {
      try {
        const res = await getDraftVersionAction(version.id);
        if (res.success && res.version) {
          setItinerary(res.version.itinerary_data);

          // Fetch any assigned hotels and restaurants to populate masterData
          const hotelIds = (res.version.itinerary_data || [])
            .filter((b: any) => b.type === ItineraryBlockTypes.SLEEP && b.hotelId)
            .map((b: any) => b.hotelId as string);
          if (hotelIds.length > 0) {
            getAssignedHotelsAction(hotelIds).then(hRes => {
              if (hRes.success && hRes.hotels) {
                setMasterData((prev: any) => {
                  const existingIds = new Set(prev.hotels.map((h: any) => h.id));
                  const newHotels = hRes.hotels.filter((h: any) => !existingIds.has(h.id));
                  return { ...prev, hotels: [...prev.hotels, ...newHotels] };
                });
              }
            });
          }

          const restaurantIds = (res.version.itinerary_data || [])
            .filter((b: any) => b.type === ItineraryBlockTypes.MEAL && b.restaurantId)
            .map((b: any) => b.restaurantId as string);
          if (restaurantIds.length > 0) {
            getAssignedRestaurantsAction(restaurantIds).then(rRes => {
              if (rRes.success && rRes.restaurants) {
                setMasterData((prev: any) => {
                  const existingIds = new Set(prev.restaurants.map((r: any) => r.id));
                  const newRestaurants = rRes.restaurants.filter((r: any) => !existingIds.has(r.id));
                  return { ...prev, restaurants: [...prev.restaurants, ...newRestaurants] };
                });
              }
            });
          }
          
          // Restore guest counts and room counts from the selected version!
          if (res.version.adults !== undefined && res.version.adults !== null) {
            handlePreferenceChange('adults', res.version.adults);
          }
          if (res.version.children !== undefined && res.version.children !== null) {
            handlePreferenceChange('children', res.version.children);
          }
          if (res.version.infants !== undefined && res.version.infants !== null) {
            handlePreferenceChange('infants', res.version.infants);
          }
          if (res.version.single_rooms !== undefined && res.version.single_rooms !== null) {
            setManualSingle(res.version.single_rooms);
          }
          if (res.version.double_rooms !== undefined && res.version.double_rooms !== null) {
            setManualDouble(res.version.double_rooms);
          }
          if (res.version.triple_rooms !== undefined && res.version.triple_rooms !== null) {
            setManualTriple(res.version.triple_rooms);
          }
          if (res.version.family_rooms !== undefined && res.version.family_rooms !== null) {
            setManualFamily(res.version.family_rooms);
          }
        } else {
          alert("Failed to load version: " + res.error);
        }
      } catch (err: any) {
        alert("Error loading version: " + (err.message || err));
      }
    }
  };

  const handleSaveNewVersion = async (label: string) => {
    try {
      const counts = {
        adults: touristData?.preferences?.adults || 2,
        children: touristData?.preferences?.children || 0,
        infants: touristData?.preferences?.infants || 0,
        single_rooms: manualSingle,
        double_rooms: manualDouble,
        triple_rooms: manualTriple,
        family_rooms: manualFamily
      };
      const res = await saveDraftVersionAction(tourId, itinerary, label, null, counts);
      if (res.success && res.version) {
        setDraftVersions(prev => [res.version as any, ...prev]);
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
        id: 'element-selection', 
        label: 'Itinerary Element Selection', 
        description: 'Choose which operational resources are needed for this custom tour package.', 
        icon: CheckSquare 
      },
      { 
        id: 'daily-activities', 
        label: 'Daily Activities Manifest', 
        description: 'Review and audit the daily activities database manifest grouped by operational categories.', 
        icon: CalendarDays 
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

  // Load email template for Share with Tourist step
  useEffect(() => {
    if (currentStep?.id === 'share-tourist') {
      const cacheKey = `${tourId}_${touristData?.profile?.email || ''}`;
      if (shareTemplateLoaded === cacheKey) {
        return; // Already loaded for this session
      }

      // Pre-fill recipient email
      if (touristData?.profile?.email) {
        setShareEmailTo(touristData.profile.email);
      }

      async function loadShareTemplate() {
        try {
          const res = await getEmailTemplatesAction();
          if (res.success && res.templates) {
            const template = res.templates.find((t: any) => t.name === 'Draft Itinerary Share');
            if (template) {
              setShareEmailSubject(template.subject || 'Your Journey to Sri Lanka — A First Look');
              
              if (template.from_email) {
                setShareEmailFrom(template.from_email);
              } else {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user && user.email) {
                  setShareEmailFrom(user.email);
                }
              }

              let bodyHtml = template.body_html || '';
              
              const guestName = touristData?.profile 
                ? `${touristData.profile.first_name || ''} ${touristData.profile.last_name || ''}`.trim() || 'Valued Guest' 
                : 'Valued Guest';
              
              let agentName = 'Your Concierge Team';
              const supabase = createClient();
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                agentName = user.user_metadata?.full_name || user.user_metadata?.first_name || user.email?.split('@')[0] || 'Your Concierge Team';
              }

              bodyHtml = bodyHtml.replace(/\[Guest Name\]/g, guestName);
              bodyHtml = bodyHtml.replace(/\[Your Name\]/g, agentName);

              setShareEmailBody(bodyHtml);
              setShareTemplateLoaded(cacheKey);

              // Sync editor HTML after DOM mounts
              setTimeout(() => {
                if (shareEditorRef.current) {
                  shareEditorRef.current.innerHTML = bodyHtml;
                }
              }, 150);
            }
          }
        } catch (err) {
          console.error("Error loading share template:", err);
        }
      }

      loadShareTemplate();
    }
  }, [currentStep?.id, touristData, tourId, shareTemplateLoaded]);

  // Load email sharing history logs
  useEffect(() => {
    if (currentStep?.id === 'share-tourist' && tourId) {
      async function loadSharedEmails() {
        try {
          const res = await getSharedEmailsAction(tourId);
          if (res.success && res.emails) {
            setSharedEmails(res.emails as TourSharedEmail[]);
          }
        } catch (err) {
          console.error("Error loading shared emails history:", err);
        }
      }
      loadSharedEmails();
    }
  }, [currentStep?.id, tourId]);

  // Sync shareEditorRef on navigation/tab switch
  useEffect(() => {
    if (currentStep?.id === 'share-tourist' && !showShareHtml && shareEditorRef.current) {
      if (shareEditorRef.current.innerHTML !== shareEmailBody) {
        shareEditorRef.current.innerHTML = shareEmailBody;
      }
    }
  }, [currentStep?.id, showShareHtml, shareEmailBody]);

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
            if (fullTripData.manualSingle !== undefined) setManualSingle(fullTripData.manualSingle);
            if (fullTripData.manualDouble !== undefined) setManualDouble(fullTripData.manualDouble);
            if (fullTripData.manualTriple !== undefined) setManualTriple(fullTripData.manualTriple);
            if (fullTripData.manualFamily !== undefined) setManualFamily(fullTripData.manualFamily);

            // Fetch any assigned hotels and restaurants to populate masterData
            const hotelIds = (fullTripData.itinerary || [])
              .filter(b => b.type === ItineraryBlockTypes.SLEEP && b.hotelId)
              .map(b => b.hotelId as string);
            if (hotelIds.length > 0) {
              getAssignedHotelsAction(hotelIds).then(hRes => {
                if (hRes.success && hRes.hotels) {
                  setMasterData((prev: any) => {
                    const existingIds = new Set(prev.hotels.map((h: any) => h.id));
                    const newHotels = hRes.hotels.filter((h: any) => !existingIds.has(h.id));
                    return { ...prev, hotels: [...prev.hotels, ...newHotels] };
                  });
                }
              });
            }

            const restaurantIds = (fullTripData.itinerary || [])
              .filter(b => b.type === ItineraryBlockTypes.MEAL && b.restaurantId)
              .map(b => b.restaurantId as string);
            if (restaurantIds.length > 0) {
              getAssignedRestaurantsAction(restaurantIds).then(rRes => {
                if (rRes.success && rRes.restaurants) {
                  setMasterData((prev: any) => {
                    const existingIds = new Set(prev.restaurants.map((r: any) => r.id));
                    const newRestaurants = rRes.restaurants.filter((r: any) => !existingIds.has(r.id));
                    return { ...prev, restaurants: [...prev.restaurants, ...newRestaurants] };
                  });
                }
              });
            }

            if (fullTripData.profile) {
              setTouristData(prev => ({
                ...prev,
                preferences: {
                  ...prev.preferences,
                  adults: fullTripData.profile.adults !== undefined && fullTripData.profile.adults !== null
                    ? fullTripData.profile.adults
                    : prev.preferences.adults,
                  children: fullTripData.profile.children !== undefined && fullTripData.profile.children !== null
                    ? fullTripData.profile.children
                    : prev.preferences.children,
                  infants: fullTripData.profile.infants !== undefined && fullTripData.profile.infants !== null
                    ? fullTripData.profile.infants
                    : prev.preferences.infants,
                }
              }));
            }
          } else {
            console.error("Failed to load tour itinerary data:", tourRes.error);
          }

          const versionsRes = await getDraftVersionsAction(activeTourId);
          if (versionsRes.success && versionsRes.versions) {
            setDraftVersions(versionsRes.versions);
          } else {
            console.error("Failed to load draft versions:", versionsRes.error);
          }

          getDailyActivitiesAction(activeTourId).then(daRes => {
            if (daRes.success && daRes.activities) {
              setDbActivities(daRes.activities);
            }
          });
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
            'share-tourist'
          ];
          const localFinalSteps = [
            'element-selection',
            'daily-activities',
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

  const loadDailyActivities = async (tid: string) => {
    if (!tid || tid === 'draft-tour') return;
    setIsLoadingDbActivities(true);
    try {
      const res = await getDailyActivitiesAction(tid);
      if (res.success && res.activities) {
        setDbActivities(res.activities);
      } else {
        console.error("Failed to load daily activities:", res.error);
      }
    } catch (err) {
      console.error("Error loading daily activities:", err);
    } finally {
      setIsLoadingDbActivities(false);
    }
  };

  const loadProcurementData = async (tid: string) => {
    if (!tid || tid === 'draft-tour') return;
    setIsLoadingProcurement(true);
    try {
      const [quotesRes, posRes, bookingsRes] = await Promise.all([
        getQuotationRequestsForTourAction(tid),
        getPurchaseOrdersAction(tid),
        getVendorBookingsAction(tid)
      ]);
      if (quotesRes.success && quotesRes.quotes) {
        setQuotationRequests(quotesRes.quotes);
      }
      if (posRes.success && posRes.pos) {
        setPurchaseOrders(posRes.pos);
      }
      if (bookingsRes.success && bookingsRes.bookings) {
        setVendorBookings(bookingsRes.bookings);
      }
    } catch (err) {
      console.error("Error loading procurement data:", err);
    } finally {
      setIsLoadingProcurement(false);
    }
  };

  // Load hotels details from daily activities
  useEffect(() => {
    if (dbActivities && dbActivities.length > 0) {
      const hotelIds = Array.from(new Set(
        dbActivities
          .filter(a => a.hotel_id)
          .map(a => a.hotel_id as string)
      ));
      if (hotelIds.length > 0) {
        getAssignedHotelsAction(hotelIds).then(hRes => {
          if (hRes.success && hRes.hotels) {
            setMasterData((prev: any) => {
              const existingIds = new Set(prev.hotels.map((h: any) => h.id));
              const newHotels = hRes.hotels.filter((h: any) => !existingIds.has(h.id));
              return {
                ...prev,
                hotels: [...prev.hotels, ...newHotels]
              };
            });
          }
        });
      }
    }
  }, [dbActivities]);

  // Procurement flow event handlers
  const [activeRfqActivityId, setActiveRfqActivityId] = useState<string | null>(null);
  const [activeRfqVendorId, setActiveRfqVendorId] = useState<string>('');
  const [isSubmittingRfq, setIsSubmittingRfq] = useState<boolean>(false);

  // Quote input states
  const [enteringQuoteId, setEnteringQuoteId] = useState<string | null>(null);
  const [inputQuotePrice, setInputQuotePrice] = useState<string>('');
  const [inputQuoteNotes, setInputQuoteNotes] = useState<string>('');
  
  // Invoice input states
  const [enteringInvoicePoId, setEnteringInvoicePoId] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [invoiceAmount, setInvoiceAmount] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>('');
  const [invoiceAttachment, setInvoiceAttachment] = useState<string>('');

  // Payment input states
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>('');

  const handleSendRFQ = async (act: any, vendor: any) => {
    if (!vendor) return;
    setIsSubmittingRfq(true);
    try {
      const res = await createQuotationRequestAction({
        tour_id: tourId,
        itinerary_id: act.itinerary_id || act.itineraryId,
        daily_activity_id: act.id,
        vendor_id: vendor.id,
        vendor_name: vendor.name,
        to_email: vendor.email || 'supplier@nilathra.com',
        from_email: 'concierge@nilathra.com',
        subject: `Request for Quotation: ${act.name || act.title}`,
        email_content: `Dear ${vendor.name},\n\nPlease provide a quote for the following experience: ${act.name || act.title} scheduled in our guest itinerary.\n\nWarm regards,\nThe Nilathra Concierge Team`,
        activity_type: 'activity',
        daily_activity_ids: [act.id]
      });

      if (res.success) {
        alert("Quotation request sent successfully!");
        loadProcurementData(tourId);
        setActiveRfqActivityId(null);
      } else {
        alert("Failed to send RFQ: " + res.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmittingRfq(false);
    }
  };

  const handleRecordQuoteResponse = async (quoteId: string) => {
    const price = parseFloat(inputQuotePrice);
    if (isNaN(price) || price <= 0) {
      alert("Please enter a valid price.");
      return;
    }
    try {
      const res = await updateQuotationAction(quoteId, {
        status: 'Replied',
        quoted_price: price,
        replied_date: new Date().toISOString(),
        notes: inputQuoteNotes || undefined
      });
      if (res.success) {
        alert("Quote response recorded successfully!");
        setInputQuotePrice('');
        setInputQuoteNotes('');
        setEnteringQuoteId(null);
        loadProcurementData(tourId);
      } else {
        alert("Failed to record quote: " + res.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleSelectQuote = async (quoteId: string, actId: string) => {
    try {
      const res = await selectQuotationAction(quoteId, actId);
      if (res.success) {
        alert("Quote selected as finalized vendor!");
        loadProcurementData(tourId);
      } else {
        alert("Failed to select quote: " + res.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleGeneratePO = async (act: any, quote: any) => {
    try {
      const res = await createVendorBookingAction({
        tour_id: tourId,
        quotation_request_id: quote.id,
        vendor_type: 'vendor',
        vendor_id: quote.vendor_id,
        vendor_name: quote.vendor_name,
        agreed_price: quote.quoted_price || 0,
        currency: quote.currency || 'USD',
        daily_activity_ids: [act.id]
      });
      if (res.success) {
        alert("Vendor booking and parallel Draft PO generated successfully!");
        loadProcurementData(tourId);
      } else {
        alert("Failed to generate PO: " + res.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleSubmitPO = async (po: any) => {
    try {
      const res = await savePurchaseOrderAction(
        { ...po, status: 'Sent', sent_date: new Date().toISOString() },
        po.items || []
      );
      if (res.success) {
        alert("PO submitted successfully to supplier!");
        loadProcurementData(tourId);
      } else {
        alert("Failed to submit PO: " + res.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleCancelPO = async (bookingId: string, reason: string) => {
    if (!confirm("Are you sure you want to cancel this booking and its associated PO?")) return;
    try {
      const res = await cancelVendorBookingAction(bookingId, reason);
      if (res.success) {
        alert("Booking and Purchase Order cancelled.");
        loadProcurementData(tourId);
      } else {
        alert("Failed to cancel: " + res.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleFinalizeBooking = async (bookingId: string) => {
    try {
      const res = await confirmFinalVendorBookingAction(bookingId);
      if (res.success) {
        alert("Booking finalized! Other backup bookings and POs have been automatically cancelled.");
        loadProcurementData(tourId);
        loadDailyActivities(tourId);
      } else {
        alert("Failed to finalize booking: " + res.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleReceiveInvoice = async (po: any) => {
    const amount = parseFloat(invoiceAmount);
    if (!invoiceNumber) {
      alert("Please enter an invoice number.");
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    const discrepancy = amount - po.total_amount;
    const isTallied = discrepancy === 0;

    try {
      const res = await saveSupplierInvoiceAction({
        purchase_order_id: po.id,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate || new Date().toISOString().split('T')[0],
        amount: amount,
        status: isTallied ? 'Confirmed' : 'Pending',
        is_tallied: isTallied,
        discrepancy_amount: discrepancy,
        attachment_url: invoiceAttachment || undefined
      });

      if (res.success) {
        alert(isTallied ? "Invoice tallied and auto-approved!" : "Invoice recorded with discrepancy warning.");
        setInvoiceNumber('');
        setInvoiceAmount('');
        setInvoiceDate('');
        setInvoiceAttachment('');
        setEnteringInvoicePoId(null);
        loadProcurementData(tourId);
      } else {
        alert("Failed to save invoice: " + res.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleRecordPayment = async (invoiceId: string) => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }

    try {
      const res = await saveSupplierPaymentAction({
        supplier_invoice_id: invoiceId,
        payment_date: paymentDate || new Date().toISOString().split('T')[0],
        amount: amount,
        payment_method: paymentMethod,
        payment_reference: paymentRef || undefined,
        notes: paymentNotes || undefined
      });

      if (res.success) {
        alert("Payment recorded successfully!");
        setPaymentAmount('');
        setPaymentRef('');
        setPaymentNotes('');
        setPaymentDate('');
        setPayingInvoiceId(null);
        loadProcurementData(tourId);
      } else {
        alert("Failed to record payment: " + res.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  useEffect(() => {
    if (track === 'final' && tourId) {
      loadDailyActivities(tourId);
      loadProcurementData(tourId);
    }
  }, [track, tourId]);


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

  const handleSendShareEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareEmailTo.trim()) {
      setShareEmailFeedback({ type: 'error', text: 'Recipient email is required.' });
      return;
    }
    if (!shareEmailSubject.trim()) {
      setShareEmailFeedback({ type: 'error', text: 'Email subject is required.' });
      return;
    }
    if (!shareEmailBody.trim()) {
      setShareEmailFeedback({ type: 'error', text: 'Email body cannot be empty.' });
      return;
    }

    setIsSendingShareEmail(true);
    setShareEmailFeedback(null);

    try {
      const formData = new FormData();
      formData.append('from', shareEmailFrom);
      formData.append('to', shareEmailTo);
      formData.append('subject', shareEmailSubject);
      formData.append('body', shareEmailBody);

      shareEmailAttachments.forEach(file => {
        formData.append('attachments', file);
      });

      const result = await sendCustomEmailAction(formData);
      if (result.success) {
        setShareEmailFeedback({ type: 'success', text: 'Draft itinerary shared with client successfully!' });
        
        // Log shared email details to DB
        const attachmentNames = shareEmailAttachments.map(f => f.name);
        try {
          await logSharedEmailAction(
            tourId,
            shareEmailTo,
            shareEmailFrom,
            shareEmailSubject,
            shareEmailBody,
            attachmentNames
          );
          
          // Re-fetch shared emails list
          const refreshRes = await getSharedEmailsAction(tourId);
          if (refreshRes.success && refreshRes.emails) {
            setSharedEmails(refreshRes.emails as TourSharedEmail[]);
          }
        } catch (logErr) {
          console.error('Failed to log email sharing history:', logErr);
        }

        setShareEmailAttachments([]);
      } else {
        setShareEmailFeedback({ type: 'error', text: result.error || 'Failed to send email.' });
      }
    } catch (error: any) {
      console.error('Error sharing draft itinerary:', error);
      setShareEmailFeedback({ type: 'error', text: error.message || 'An unexpected error occurred.' });
    } finally {
      setIsSendingShareEmail(false);
    }
  };

  const handleShareAttachmentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setShareEmailAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeShareAttachment = (index: number) => {
    setShareEmailAttachments(prev => prev.filter((_, i) => i !== index));
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
          <main id="main-scroll-container" className="flex-1 bg-[#F8F6F2] p-8 overflow-y-auto relative flex flex-col pb-24">
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
                ) : track === 'final' && currentStep.id === 'daily-activities' ? (
                  <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-md animate-in fade-in slide-in-from-bottom-3 duration-300 space-y-6">
                    <div className="border-b border-neutral-100 pb-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-serif font-bold text-neutral-800 flex items-center gap-2">
                          <CalendarDays className="w-5 h-5 text-emerald-800" />
                          Daily Activities Operational Manifest
                        </h3>
                        <p className="text-xs text-neutral-400">
                          Verify and audit the complete daily itinerary activities loaded directly from database, grouped by operational category baskets.
                        </p>
                      </div>
                      <button
                        onClick={() => loadDailyActivities(tourId)}
                        disabled={isLoadingDbActivities}
                        className="px-4 py-2 border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 disabled:bg-neutral-100 disabled:text-neutral-400 text-neutral-700 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 self-start md:self-auto shrink-0"
                      >
                        {isLoadingDbActivities ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Compass className="w-3.5 h-3.5 text-emerald-800" />
                        )}
                        Refresh Manifest
                      </button>
                    </div>

                    {isLoadingDbActivities ? (
                      <div className="py-20 flex flex-col items-center justify-center text-center">
                        <Loader2 className="w-10 h-10 text-emerald-800 animate-spin mb-4" />
                        <span className="text-sm font-bold text-neutral-600">Retrieving Daily Activities...</span>
                        <span className="text-xs text-neutral-400 mt-1">Connecting to Supabase to fetch tour schedules...</span>
                      </div>
                    ) : (
                      <>
                        {/* Search & Stats Bar */}
                        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-[#FBFBFA] p-4 rounded-2xl border border-neutral-150">
                          <div className="relative flex-1">
                            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={dbActivitySearchQuery}
                              onChange={(e) => setDbActivitySearchQuery(e.target.value)}
                              placeholder="Search daily activities by title, description, or database ID..."
                              className="w-full bg-white border border-neutral-200 text-neutral-800 rounded-xl pl-10 pr-4 py-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-800 outline-none text-xs transition-all shadow-sm"
                            />
                          </div>
                          
                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400">Total Loaded:</span>
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs font-bold rounded-lg shadow-sm">
                              {dbActivities.length} items
                            </span>
                          </div>
                        </div>

                        {(() => {
                          const formatTime = (timeStr: string) => {
                            if (!timeStr) return '';
                            try {
                              const parts = timeStr.split(':');
                              if (parts.length < 2) return timeStr;
                              let hours = parseInt(parts[0], 10);
                              const minutes = parts[1];
                              const ampm = hours >= 12 ? 'PM' : 'AM';
                              hours = hours % 12;
                              hours = hours ? hours : 12;
                              return `${hours}:${minutes} ${ampm}`;
                            } catch (e) {
                              return timeStr;
                            }
                          };

                          const handleCopyId = (val: string, uniqueKey: string) => {
                            navigator.clipboard.writeText(val);
                            setCopiedId(uniqueKey);
                            setTimeout(() => setCopiedId(null), 2000);
                          };

                          const filtered = dbActivities.filter(a => {
                            if (!dbActivitySearchQuery) return true;
                            const query = dbActivitySearchQuery.toLowerCase();
                            const matchesTitle = (a.title || '').toLowerCase().includes(query);
                            const matchesDesc = (a.description || '').toLowerCase().includes(query);
                            const matchesHotelId = (a.hotel_id || '').toLowerCase().includes(query);
                            const matchesRoomId = (a.hotel_room_id || '').toLowerCase().includes(query);
                            const matchesRestId = (a.restaurant_id || '').toLowerCase().includes(query);
                            const matchesActId = String(a.activity_id || '').toLowerCase().includes(query);
                            const matchesVendorId = (a.vendor_id || '').toLowerCase().includes(query);
                            const matchesTransportId = (a.transport_id || '').toLowerCase().includes(query);
                            const matchesDriverId = (a.driver_id || '').toLowerCase().includes(query);
                            const matchesGuideId = (a.guide_id || '').toLowerCase().includes(query);
                            return matchesTitle || matchesDesc || matchesHotelId || matchesRoomId || matchesRestId || matchesActId || matchesVendorId || matchesTransportId || matchesDriverId || matchesGuideId;
                          });

                          const baskets: Record<ItineraryBlockType, any[]> = {
                            sleep: [],
                            meal: [],
                            activity: [],
                            travel: [],
                            train: [],
                            guide: [],
                            buffer: [],
                            wait: [],
                            custom: []
                          };

                          filtered.forEach(a => {
                            const type = (a.activity_type || 'custom') as ItineraryBlockType;
                            if (baskets[type]) {
                              baskets[type].push(a);
                            } else {
                              baskets['custom'].push(a);
                            }
                          });

                          const basketConfig: Record<ItineraryBlockType, {
                            label: string;
                            icon: React.ComponentType<any>;
                            themeColor: string;
                            borderColor: string;
                            textColor: string;
                            bgGradient: string;
                            keyMappers: Array<{ label: string; key: string }>;
                          }> = {
                            sleep: {
                              label: 'Sleep / Accommodation',
                              icon: BedDouble,
                              themeColor: 'indigo',
                              borderColor: 'border-indigo-100',
                              textColor: 'text-indigo-900',
                              bgGradient: 'from-indigo-50/70 to-purple-50/40',
                              keyMappers: [
                                { label: 'Hotel ID', key: 'hotel_id' },
                                { label: 'Room ID', key: 'hotel_room_id' }
                              ]
                            },
                            meal: {
                              label: 'Dining & Meals',
                              icon: Utensils,
                              themeColor: 'amber',
                              borderColor: 'border-amber-100',
                              textColor: 'text-amber-900',
                              bgGradient: 'from-amber-50/70 to-orange-50/40',
                              keyMappers: [
                                { label: 'Restaurant ID', key: 'restaurant_id' }
                              ]
                            },
                            activity: {
                              label: 'Experiences & Activities',
                              icon: Award,
                              themeColor: 'emerald',
                              borderColor: 'border-emerald-100',
                              textColor: 'text-emerald-950',
                              bgGradient: 'from-emerald-50/70 to-teal-50/40',
                              keyMappers: [
                                { label: 'Activity ID', key: 'activity_id' },
                                { label: 'Vendor ID', key: 'vendor_id' },
                                { label: 'Vendor Activity ID', key: 'vendor_activity_id' }
                              ]
                            },
                            travel: {
                              label: 'Travel & Logistics',
                              icon: Car,
                              themeColor: 'sky',
                              borderColor: 'border-sky-100',
                              textColor: 'text-sky-900',
                              bgGradient: 'from-sky-50/70 to-blue-50/40',
                              keyMappers: [
                                { label: 'Transport ID', key: 'transport_id' },
                                { label: 'Vehicle ID', key: 'vehicle_id' },
                                { label: 'Driver ID', key: 'driver_id' }
                              ]
                            },
                            train: {
                              label: 'Rail Transfers',
                              icon: Train,
                              themeColor: 'cyan',
                              borderColor: 'border-cyan-100',
                              textColor: 'text-cyan-900',
                              bgGradient: 'from-cyan-50/70 to-sky-50/40',
                              keyMappers: [
                                { label: 'Transport ID', key: 'transport_id' }
                              ]
                            },
                            guide: {
                              label: 'Guides',
                              icon: UserCheck,
                              themeColor: 'rose',
                              borderColor: 'border-rose-100',
                              textColor: 'text-rose-900',
                              bgGradient: 'from-rose-50/70 to-pink-50/40',
                              keyMappers: [
                                { label: 'Guide ID', key: 'guide_id' }
                              ]
                            },
                            buffer: {
                              label: 'Time Buffers',
                              icon: Clock,
                              themeColor: 'slate',
                              borderColor: 'border-slate-150',
                              textColor: 'text-slate-900',
                              bgGradient: 'from-slate-50/80 to-slate-100/50',
                              keyMappers: []
                            },
                            wait: {
                              label: 'Wait Times',
                              icon: Clock,
                              themeColor: 'neutral',
                              borderColor: 'border-neutral-200',
                              textColor: 'text-neutral-800',
                              bgGradient: 'from-neutral-50/80 to-neutral-100/50',
                              keyMappers: []
                            },
                            custom: {
                              label: 'Custom Events',
                              icon: Compass,
                              themeColor: 'purple',
                              borderColor: 'border-purple-100',
                              textColor: 'text-purple-900',
                              bgGradient: 'from-purple-50/70 to-violet-50/40',
                              keyMappers: []
                            }
                          };

                          return (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                              {Object.entries(basketConfig).map(([typeKey, cfg]) => {
                                const list = baskets[typeKey as ItineraryBlockType] || [];
                                const IconComp = cfg.icon;
                                
                                return (
                                  <div 
                                    key={typeKey} 
                                    className={`bg-white border rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden min-h-[300px] ${cfg.borderColor}`}
                                  >
                                    <div className={`bg-gradient-to-r ${cfg.bgGradient} p-4 border-b border-neutral-100 flex items-center justify-between shrink-0`}>
                                      <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl bg-white shadow-sm ${cfg.textColor}`}>
                                          <IconComp className="w-4 h-4" />
                                        </div>
                                        <span className={`text-xs font-extrabold ${cfg.textColor}`}>
                                          {cfg.label}
                                        </span>
                                      </div>
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm bg-white border ${cfg.textColor} ${cfg.borderColor}`}>
                                        {list.length} items
                                      </span>
                                    </div>

                                    <div className="p-4 flex-1 overflow-y-auto max-h-[350px] space-y-3 bg-[#FCFCFB]/40">
                                      {list.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                                          <IconComp className="w-8 h-8 text-neutral-300 mb-2 opacity-60" />
                                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">No activities loaded</span>
                                        </div>
                                      ) : (
                                        list.map((act) => (
                                          <div 
                                            key={act.id} 
                                            className="bg-white border border-neutral-200 hover:border-neutral-300 rounded-2xl p-3 shadow-sm transition-all space-y-2 group"
                                          >
                                            <div className="flex items-start justify-between gap-2">
                                              <span className="text-xs font-bold text-neutral-800 leading-snug group-hover:text-emerald-950 transition-colors">
                                                {act.title}
                                              </span>
                                              {act.time_start && (
                                                <span className="text-[9px] font-mono font-bold text-neutral-400 bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-100 shrink-0">
                                                  {formatTime(act.time_start)}
                                                </span>
                                              )}
                                            </div>

                                            {act.description && (
                                              <p className="text-[10px] text-neutral-500 leading-relaxed line-clamp-3">
                                                {act.description.startsWith('[') || act.description.startsWith('{')
                                                  ? (() => {
                                                      try {
                                                        const parsed = JSON.parse(act.description);
                                                        if (Array.isArray(parsed)) {
                                                          return parsed.map(c => c.text || c).join(', ');
                                                        }
                                                        return act.description;
                                                      } catch (e) {
                                                        return act.description;
                                                      }
                                                    })()
                                                  : act.description}
                                              </p>
                                            )}

                                            {cfg.keyMappers.length > 0 && (
                                              <div className="pt-2 border-t border-dashed border-neutral-100 space-y-1.5">
                                                {cfg.keyMappers.map((mapper) => {
                                                  const val = act[mapper.key];
                                                  if (!val) return null;
                                                  const isCopied = copiedId === `${act.id}_${mapper.key}`;
                                                  
                                                  return (
                                                    <div key={mapper.key} className="flex items-center justify-between gap-2 text-[9px]">
                                                      <span className="text-neutral-400 font-medium">{mapper.label}:</span>
                                                      <button
                                                        type="button"
                                                        onClick={() => handleCopyId(val, `${act.id}_${mapper.key}`)}
                                                        className="font-mono text-[9px] bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-600 rounded px-1.5 py-0.5 flex items-center gap-1 transition-all max-w-[150px] truncate"
                                                        title="Click to copy ID"
                                                      >
                                                        <span className="truncate">{val}</span>
                                                        {isCopied ? (
                                                          <Check className="w-2.5 h-2.5 text-emerald-600" />
                                                        ) : (
                                                          <Copy className="w-2.5 h-2.5 text-neutral-400 group-hover:text-neutral-600 shrink-0" />
                                                        )}
                                                      </button>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </>
                    )}
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
                ) : track === 'final' && currentStep.id === 'hotel-selection' ? (
                  <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-md animate-in fade-in slide-in-from-bottom-3 duration-300 space-y-6">
                    <div className="border-b border-neutral-100 pb-4 mb-6">
                      <h3 className="text-xl font-serif font-bold text-neutral-800 flex items-center gap-2">
                        <BedDouble className="w-5 h-5 text-emerald-800" />
                        Hotel Accommodations Selection
                      </h3>
                      <p className="text-xs text-neutral-400">
                        Review all hotel accommodations scheduled for this tour, consolidated by property.
                      </p>
                    </div>

                    <div className="space-y-6">
                      {(() => {
                        const sleepActivities = dbActivities.filter(a => a.activity_type === 'sleep' || a.hotel_id);
                        
                        // Group by hotel_id
                        const groups: Record<string, any[]> = {};
                        sleepActivities.forEach(act => {
                          const hId = act.hotel_id;
                          if (!hId) return;
                          if (!groups[hId]) {
                            groups[hId] = [];
                          }
                          groups[hId].push(act);
                        });

                        const formatDate = (dateStr: string) => {
                          if (!dateStr) return '';
                          try {
                            const d = new Date(dateStr);
                            if (isNaN(d.getTime())) return dateStr;
                            return d.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            });
                          } catch (e) {
                            return dateStr;
                          }
                        };

                        const clubbed = Object.entries(groups).map(([hotelId, activities]) => {
                          const hotel = masterData.hotels.find((h: any) => h.id === hotelId);
                          const sortedActivities = [...activities].sort((a, b) => {
                            const dayA = a.tour_itineraries?.day_number || a.day_number || a.dayNumber || 0;
                            const dayB = b.tour_itineraries?.day_number || b.day_number || b.dayNumber || 0;
                            return dayA - dayB;
                          });
                          return { hotelId, hotel, activities: sortedActivities };
                        });

                        if (clubbed.length === 0) {
                          return (
                            <div className="border border-dashed border-neutral-200 bg-neutral-50/50 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[180px]">
                              <BedDouble className="w-8 h-8 text-neutral-300 mb-2" />
                              <span className="text-xs font-bold text-neutral-500">No hotel accommodations booked</span>
                              <span className="text-[10px] text-neutral-400 mt-1">
                                There are no sleep/accommodation entries in the daily activities for this tour.
                              </span>
                            </div>
                          );
                        }

                        return clubbed.map(({ hotelId, hotel, activities: acts }) => {
                          return (
                            <div key={hotelId} className="border border-neutral-200 rounded-3xl p-6 bg-[#FBFBFA]/50 space-y-4 shadow-sm hover:shadow-md transition-all animate-in fade-in duration-200">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200/60 pb-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-base font-bold text-neutral-800 font-serif">
                                      {hotel?.name || 'Loading Hotel Details...'}
                                    </h4>
                                    {hotel?.hotel_class && (
                                      <span className="px-2 py-0.5 bg-emerald-800/10 text-emerald-855 border border-emerald-800/20 text-[9px] font-bold rounded-full uppercase tracking-wider">
                                        {hotel.hotel_class}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-neutral-500">
                                    {hotel?.location_address || hotel?.closest_city || 'Location Address not specified'}
                                  </p>
                                </div>
                                <div className="text-[10px] font-bold text-neutral-400 font-mono flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-neutral-200 shadow-sm self-start md:self-auto shrink-0">
                                  <span>Total Nights:</span>
                                  <span className="text-emerald-800 font-extrabold text-xs">{acts.length}</span>
                                </div>
                              </div>

                              {/* Nights Detail Rows */}
                              <div className="divide-y divide-neutral-150">
                                {acts.map((act) => {
                                  const room = hotel?.hotel_rooms?.find((r: any) => r.id === act.hotel_room_id);
                                  const dayNum = act.tour_itineraries?.day_number || act.day_number || act.dayNumber || 0;
                                  const dateVal = act.tour_itineraries?.date;
                                  return (
                                    <div key={act.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-3">
                                      <div className="flex items-start gap-3">
                                        <div className="px-2.5 py-1 bg-emerald-800 text-white font-mono text-[10px] font-bold rounded-lg mt-0.5 shrink-0 shadow-sm">
                                          {dateVal ? formatDate(dateVal) : `Day ${dayNum}`}
                                        </div>
                                        <div>
                                          <span className="text-xs font-bold text-neutral-800 block">
                                            {room?.room_name || 'Room Name Not Specified'}
                                          </span>
                                          {act.title && (
                                            <span className="text-[10px] text-neutral-400 block mt-0.5">
                                              {act.title}
                                            </span>
                                          )}
                                          <div className="flex flex-wrap items-center gap-2 mt-1">
                                            {act.meal_plan && (
                                              <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-150 text-indigo-700 font-bold rounded text-[9px] uppercase tracking-wider">
                                                {act.meal_plan}
                                              </span>
                                            )}
                                            {room?.breakfast_included && (
                                              <span className="px-2 py-0.5 bg-green-50 border border-green-150 text-green-700 font-bold rounded text-[9px] uppercase tracking-wider">
                                                Breakfast Incl.
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center justify-between sm:justify-end gap-6 text-xs text-neutral-600 font-semibold self-stretch sm:self-auto">
                                        <div className="flex items-center gap-1.5 bg-white border border-neutral-200 px-2 py-1 rounded-lg text-[10px] shadow-sm">
                                          <span className="text-neutral-400">Qty:</span>
                                          <span className="text-neutral-700 font-bold">{act.quantity || 1}</span>
                                        </div>
                                        {act.agreed_unit_price !== undefined && act.agreed_unit_price !== null && (
                                          <div className="text-right">
                                            <span className="text-[9px] text-neutral-450 uppercase block font-mono">Unit Rate</span>
                                            <span className="font-mono text-neutral-600 font-bold">${Number(act.agreed_unit_price).toFixed(2)}</span>
                                          </div>
                                        )}
                                        {act.agreed_total_price !== undefined && act.agreed_total_price !== null && (
                                          <div className="text-right">
                                            <span className="text-[9px] text-emerald-600 uppercase block font-mono">Total Rate</span>
                                            <span className="font-mono text-emerald-800 font-bold">${Number(act.agreed_total_price).toFixed(2)}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {hotel && (hotel.reservation_agent_name || hotel.reservation_email || hotel.reservation_agent_contact) && (
                                <div className="mt-3 pt-3 border-t border-neutral-200/60 flex flex-wrap gap-x-6 gap-y-2 text-[10px] text-neutral-400 font-medium">
                                  {hotel.reservation_agent_name && (
                                    <div>
                                      <span className="text-neutral-455 font-semibold">Reservation Contact:</span> <span className="text-neutral-600 font-bold">{hotel.reservation_agent_name}</span>
                                    </div>
                                  )}
                                  {hotel.reservation_email && (
                                    <div>
                                      <span className="text-neutral-455 font-semibold">Email:</span> <span className="text-neutral-600 font-mono font-bold">{hotel.reservation_email}</span>
                                    </div>
                                  )}
                                  {hotel.reservation_agent_contact && (
                                    <div>
                                      <span className="text-neutral-455 font-semibold">Phone:</span> <span className="text-neutral-600 font-mono font-bold">{hotel.reservation_agent_contact}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                ) : track === 'final' && currentStep.id === 'quote-request' ? (
                  <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-md animate-in fade-in slide-in-from-bottom-3 duration-300 space-y-6">
                    <div className="border-b border-neutral-100 pb-4 mb-6">
                      <h3 className="text-xl font-serif font-bold text-neutral-800 flex items-center gap-2">
                        <MailQuestion className="w-5 h-5 text-emerald-800" />
                        Supplier Quote Requests (RFQs)
                      </h3>
                      <p className="text-xs text-neutral-400">
                        Dispatch quote requests to vendors, track responses, and select the winning bids for your itinerary activities.
                      </p>
                    </div>

                    <div className="space-y-6">
                      {dbActivities
                        .filter(act => act.activity_type === 'activity' || act.type === 'activity')
                        .map(act => {
                          const actQuotes = quotationRequests.filter(q => q.daily_activity_id === act.id);
                          const activeQuote = actQuotes.find(q => q.quotation?.selected_vendor);

                          return (
                            <div key={act.id} className="border border-neutral-200 rounded-2xl p-6 bg-[#FBFBFA]/50 space-y-4 shadow-sm hover:shadow-md transition-all">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-[10px] bg-emerald-800/10 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Day {act.day_number || act.dayNumber}
                                  </span>
                                  <h4 className="text-sm font-bold text-neutral-850 mt-1 font-serif">{act.title || act.name}</h4>
                                  <p className="text-xs text-neutral-400 mt-0.5">{act.location_name || act.locationName || 'Location not specified'}</p>
                                </div>
                                
                                {activeQuote && (
                                  <span className="px-3 py-1 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                    {activeQuote.quotation?.vendor_name} Finalized (${activeQuote.quotation?.quoted_price})
                                  </span>
                                )}
                              </div>

                              {/* Quotes list */}
                              {actQuotes.length > 0 && (
                                <div className="space-y-3">
                                  <h5 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Quotations Sent</h5>
                                  <div className="grid grid-cols-1 gap-3">
                                    {actQuotes.map(qMap => {
                                      const quote = qMap.quotation;
                                      if (!quote) return null;
                                      const isSelected = quote.selected_vendor;

                                      return (
                                        <div key={quote.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                                          isSelected ? 'bg-green-50/30 border-green-200 shadow-sm' : 'bg-white border-neutral-200'
                                        }`}>
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs font-bold text-neutral-800">{quote.vendor_name}</span>
                                              <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                                                quote.status === 'Selected' ? 'bg-green-150 text-green-800' :
                                                quote.status === 'Replied' ? 'bg-amber-100 text-amber-800' :
                                                'bg-neutral-100 text-neutral-600'
                                              }`}>
                                                {quote.status}
                                              </span>
                                            </div>
                                            {quote.replied_date && (
                                              <p className="text-[10px] text-neutral-400 mt-1">
                                                Replied on: {new Date(quote.replied_date).toLocaleDateString()}
                                              </p>
                                            )}
                                            {quote.notes && (
                                              <p className="text-[10px] text-neutral-500 mt-1 italic">"{quote.notes}"</p>
                                            )}
                                          </div>

                                          <div className="flex items-center gap-3 self-end sm:self-auto">
                                            {quote.status === 'Sent' ? (
                                              enteringQuoteId === quote.id ? (
                                                <div className="flex items-center gap-2">
                                                  <input
                                                    type="number"
                                                    value={inputQuotePrice}
                                                    onChange={(e) => setInputQuotePrice(e.target.value)}
                                                    placeholder="Price ($)"
                                                    className="w-24 bg-white border border-neutral-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-800 outline-none"
                                                  />
                                                  <input
                                                    type="text"
                                                    value={inputQuoteNotes}
                                                    onChange={(e) => setInputQuoteNotes(e.target.value)}
                                                    placeholder="Notes"
                                                    className="w-32 bg-white border border-neutral-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-800 outline-none"
                                                  />
                                                  <button
                                                    onClick={() => handleRecordQuoteResponse(quote.id)}
                                                    className="px-3 py-1 bg-emerald-850 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold"
                                                  >
                                                    Save
                                                  </button>
                                                  <button
                                                    onClick={() => setEnteringQuoteId(null)}
                                                    className="px-2 py-1 border border-neutral-200 text-neutral-600 rounded-lg text-xs"
                                                  >
                                                    Cancel
                                                  </button>
                                                </div>
                                              ) : (
                                                <button
                                                  onClick={() => {
                                                    setEnteringQuoteId(quote.id);
                                                    setInputQuotePrice('');
                                                    setInputQuoteNotes('');
                                                  }}
                                                  className="px-3 py-1.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-600 hover:text-neutral-800 rounded-lg text-xs font-bold transition-all shadow-sm"
                                                >
                                                  Enter Response
                                                </button>
                                              )
                                            ) : (
                                              <div className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-neutral-855">${quote.quoted_price}</span>
                                                {quote.status === 'Replied' && (
                                                  <button
                                                    onClick={() => handleSelectQuote(quote.id, act.id)}
                                                    className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                                                  >
                                                    Select Vendor
                                                  </button>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Send RFQ Actions */}
                              {activeRfqActivityId === act.id ? (
                                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-4 animate-in slide-in-from-top-2 duration-200">
                                  <h5 className="text-xs font-bold text-neutral-700">Send New RFQ</h5>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                      <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Select Vendor</label>
                                      <select
                                        value={activeRfqVendorId}
                                        onChange={(e) => setActiveRfqVendorId(e.target.value)}
                                        className="w-full bg-white border border-neutral-200 text-neutral-850 rounded-xl p-2.5 text-xs outline-none"
                                      >
                                        <option value="">-- Choose Supplier --</option>
                                        {masterData?.vendors?.map((v: any) => (
                                          <option key={v.id} value={v.id}>{v.name}</option>
                                        ))}
                                      </select>
                                    </div>
                                    
                                    <div className="flex items-end gap-2">
                                      <button
                                        onClick={() => {
                                          const vendor = masterData?.vendors?.find((v: any) => v.id === activeRfqVendorId);
                                          handleSendRFQ(act, vendor);
                                        }}
                                        disabled={isSubmittingRfq || !activeRfqVendorId}
                                        className="flex-1 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-955 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                                      >
                                        {isSubmittingRfq ? "Sending..." : "Dispatch RFQ"}
                                      </button>
                                      <button
                                        onClick={() => setActiveRfqActivityId(null)}
                                        className="px-4 py-2.5 border border-neutral-200 text-neutral-600 rounded-xl text-xs font-bold"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setActiveRfqActivityId(act.id);
                                    setActiveRfqVendorId('');
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-600 rounded-xl text-xs font-bold transition-all shadow-sm"
                                >
                                  <Plus className="w-4 h-4 text-neutral-500" />
                                  Send RFQ to Supplier
                                </button>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : track === 'final' && currentStep.id === 'po-submission' ? (
                  <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-md animate-in fade-in slide-in-from-bottom-3 duration-300 space-y-6">
                    <div className="border-b border-neutral-100 pb-4 mb-6">
                      <h3 className="text-xl font-serif font-bold text-neutral-800 flex items-center gap-2">
                        <Send className="w-5 h-5 text-emerald-800" />
                        Purchase Order Lifecycle & Bookings
                      </h3>
                      <p className="text-xs text-neutral-400">
                        Generate legally-binding Purchase Orders for your finalized vendors, dispatch them, and complete operational bookings.
                      </p>
                    </div>

                    <div className="space-y-6">
                      {dbActivities
                        .filter(act => act.activity_type === 'activity' || act.type === 'activity')
                        .map(act => {
                          const actQuotes = quotationRequests.filter(q => q.daily_activity_id === act.id);
                          const winningQuote = actQuotes.find(q => q.quotation?.selected_vendor)?.quotation;
                          
                          const booking = vendorBookings.find(b => b.daily_activity_ids?.includes(act.id));
                          const po = booking?.purchase_order_id 
                            ? purchaseOrders.find(p => p.id === booking.purchase_order_id)
                            : purchaseOrders.find(p => p.items?.some((item: any) => item.daily_activity_id === act.id || item.tour_itinerary_id === act.id));

                          return (
                            <div key={act.id} className="border border-neutral-200 rounded-2xl p-6 bg-[#FBFBFA]/50 space-y-4 shadow-sm hover:shadow-md transition-all">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-[10px] bg-emerald-800/10 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Day {act.day_number || act.dayNumber}
                                  </span>
                                  <h4 className="text-sm font-bold text-neutral-850 mt-1 font-serif">{act.title || act.name}</h4>
                                  <p className="text-xs text-neutral-400 mt-0.5">{act.location_name || act.locationName || 'Location not specified'}</p>
                                </div>
                                
                                {booking && (
                                  <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                                    booking.status === 'Went Ahead' ? 'bg-green-100 border border-green-200 text-green-700' :
                                    booking.status === 'Confirmed' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' :
                                    booking.status === 'Cancelled' ? 'bg-red-50 border border-red-200 text-red-700' :
                                    'bg-neutral-50 border border-neutral-200 text-neutral-600'
                                  }`}>
                                    Booking: {booking.status}
                                  </span>
                                )}
                              </div>

                              {!winningQuote ? (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex items-center gap-2">
                                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                                  <span>No supplier quote has been selected for this activity. Please complete the **Supplier Quote Requests** step first.</span>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between text-xs bg-white border border-neutral-200 p-3 px-4 rounded-xl shadow-sm">
                                    <div>
                                      <span className="text-neutral-400">Selected Supplier:</span>
                                      <span className="font-bold text-neutral-700 ml-1.5">{winningQuote.vendor_name}</span>
                                    </div>
                                    <div>
                                      <span className="text-neutral-400">Contracted Rate:</span>
                                      <span className="font-bold text-neutral-855 ml-1.5">${winningQuote.quoted_price}</span>
                                    </div>
                                  </div>

                                  {!po ? (
                                    <button
                                      onClick={() => handleGeneratePO(act, winningQuote)}
                                      className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                                    >
                                      <Plus className="w-4 h-4" />
                                      Generate Purchase Order
                                    </button>
                                  ) : (
                                    <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-4 shadow-sm">
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-neutral-850 font-mono">{po.po_number}</span>
                                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                                              po.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                              po.status === 'Sent' ? 'bg-blue-100 text-blue-800' :
                                              po.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                              'bg-neutral-100 text-neutral-600'
                                            }`}>
                                              PO: {po.status}
                                            </span>
                                          </div>
                                          <p className="text-[10px] text-neutral-400 mt-0.5">Created: {new Date(po.po_date).toLocaleDateString()}</p>
                                        </div>
                                        <span className="text-sm font-bold text-neutral-800 font-mono">${po.total_amount}</span>
                                      </div>

                                      <div className="flex flex-wrap items-center gap-2 pt-1">
                                        {po.status === 'Draft' && (
                                          <button
                                            onClick={() => handleSubmitPO(po)}
                                            className="px-3.5 py-1.5 bg-emerald-850 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                                          >
                                            Submit PO to Supplier
                                          </button>
                                        )}

                                        {po.status === 'Sent' && booking && booking.status === 'Pending' && (
                                          <button
                                            onClick={() => handleFinalizeBooking(booking.id)}
                                            className="px-3.5 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                                          >
                                            <Check className="w-3.5 h-3.5" />
                                            Confirm Booking (Final)
                                          </button>
                                        )}

                                        {po.status !== 'Cancelled' && po.status !== 'Completed' && booking && (
                                          <button
                                            onClick={() => {
                                              const reason = prompt("Enter reason for cancellation:");
                                              if (reason !== null) handleCancelPO(booking.id, reason);
                                            }}
                                            className="px-3.5 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 rounded-lg text-xs font-bold transition-all shadow-sm"
                                          >
                                            Cancel PO & Booking
                                          </button>
                                        )}

                                        {po.status === 'Cancelled' && (
                                          <button
                                            onClick={() => handleGeneratePO(act, winningQuote)}
                                            className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-955 text-white rounded-lg text-xs font-bold"
                                          >
                                            Raise New PO
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : track === 'final' && currentStep.id === 'invoice-receive' ? (
                  <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-md animate-in fade-in slide-in-from-bottom-3 duration-300 space-y-6">
                    <div className="border-b border-neutral-100 pb-4 mb-6">
                      <h3 className="text-xl font-serif font-bold text-neutral-800 flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-emerald-800" />
                        Receive & Tally Supplier Invoices
                      </h3>
                      <p className="text-xs text-neutral-400">
                        Record supplier invoices received post-service and verify matching totals against purchase orders.
                      </p>
                    </div>

                    <div className="space-y-6">
                      {purchaseOrders
                        .filter(po => po.status === 'Sent' || po.status === 'Accepted' || po.status === 'Completed')
                        .map(po => {
                          const invoices = po.invoices || [];
                          
                          return (
                            <div key={po.id} className="border border-neutral-200 rounded-2xl p-6 bg-[#FBFBFA]/50 space-y-4 shadow-sm hover:shadow-md transition-all">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-150 pb-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-neutral-850 font-mono">{po.po_number}</span>
                                    <span className="text-xs font-medium text-neutral-500">({po.vendor_name})</span>
                                  </div>
                                  <span className="text-[10px] uppercase tracking-wider text-neutral-450 block mt-0.5">Vendor Type: {po.vendor_type}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-neutral-400 block font-bold font-sans">PO Total</span>
                                  <span className="text-sm font-bold text-neutral-800 font-mono">${po.total_amount}</span>
                                </div>
                              </div>

                              {invoices.length > 0 ? (
                                <div className="space-y-3">
                                  <h5 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Invoices Received</h5>
                                  <div className="space-y-2">
                                    {invoices.map((inv: any) => {
                                      const diff = inv.amount - po.total_amount;
                                      const isMatched = diff === 0;

                                      return (
                                        <div key={inv.id} className="bg-white border border-neutral-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs font-bold text-neutral-800">#{inv.invoice_number}</span>
                                              <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                                                inv.status === 'Paid' ? 'bg-green-100 text-green-800' :
                                                inv.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                                                'bg-amber-100 text-amber-800'
                                              }`}>
                                                {inv.status}
                                              </span>
                                            </div>
                                            <p className="text-[10px] text-neutral-400 mt-1">Date: {new Date(inv.invoice_date).toLocaleDateString()}</p>
                                          </div>

                                          <div className="flex items-center gap-4">
                                            <div className="text-right">
                                              <span className="text-xs font-bold text-neutral-800 block font-mono">${inv.amount}</span>
                                              <div className="flex items-center gap-1 mt-0.5">
                                                <span className={`w-1.5 h-1.5 rounded-full ${isMatched ? 'bg-green-500' : 'bg-red-500'}`} />
                                                <span className={`text-[9px] font-bold ${isMatched ? 'text-green-600' : 'text-red-600'}`}>
                                                  {isMatched ? 'TALLIED' : `DISCREPANCY: $${diff}`}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-neutral-400 italic">No supplier invoice received yet.</p>
                              )}

                              {enteringInvoicePoId === po.id ? (
                                <div className="p-4 bg-white border border-neutral-200 rounded-xl space-y-4 shadow-sm animate-in slide-in-from-top-2 duration-200">
                                  <h5 className="text-xs font-bold text-neutral-700">Record Inbound Invoice</h5>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                      <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Invoice Number</label>
                                      <input
                                        type="text"
                                        value={invoiceNumber}
                                        onChange={(e) => setInvoiceNumber(e.target.value)}
                                        placeholder="INV-10291"
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-emerald-800"
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Invoice Amount ($)</label>
                                      <input
                                        type="number"
                                        value={invoiceAmount}
                                        onChange={(e) => setInvoiceAmount(e.target.value)}
                                        placeholder={`${po.total_amount}`}
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-emerald-800"
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Invoice Date</label>
                                      <input
                                        type="date"
                                        value={invoiceDate}
                                        onChange={(e) => setInvoiceDate(e.target.value)}
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-emerald-800"
                                      />
                                    </div>
                                  </div>

                                  {invoiceAmount && (
                                    (() => {
                                      const amt = parseFloat(invoiceAmount);
                                      if (isNaN(amt)) return null;
                                      const diff = amt - po.total_amount;
                                      return (
                                        <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 font-medium ${
                                          diff === 0 
                                            ? 'bg-green-50 border-green-200 text-green-700' 
                                            : 'bg-red-50 border-red-200 text-red-700'
                                        }`}>
                                          <span className={`w-2 h-2 rounded-full ${diff === 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                                          {diff === 0 
                                            ? "Tally Result: MATCHED ($0 discrepancy)" 
                                            : `Tally Result: MISMATCH (Discrepancy of $${diff})`}
                                        </div>
                                      );
                                    })()
                                  )}

                                  <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                                    <button
                                      onClick={() => handleReceiveInvoice(po)}
                                      className="px-4 py-2 bg-emerald-800 hover:bg-emerald-950 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm"
                                    >
                                      Save Invoice
                                    </button>
                                    <button
                                      onClick={() => setEnteringInvoicePoId(null)}
                                      className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-xl text-xs font-bold"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEnteringInvoicePoId(po.id);
                                    setInvoiceNumber('');
                                    setInvoiceAmount(`${po.total_amount}`);
                                    setInvoiceDate(new Date().toISOString().split('T')[0]);
                                  }}
                                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-600 rounded-xl text-xs font-bold transition-all shadow-sm"
                                >
                                  <Plus className="w-4 h-4 text-neutral-500" />
                                  Receive Invoice
                                </button>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : track === 'final' && currentStep.id === 'payment-supplier' ? (
                  <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-md animate-in fade-in slide-in-from-bottom-3 duration-300 space-y-6">
                    <div className="border-b border-neutral-100 pb-4 mb-6">
                      <h3 className="text-xl font-serif font-bold text-neutral-800 flex items-center gap-2">
                        <CircleDollarSign className="w-5 h-5 text-emerald-800" />
                        Disburse Supplier Payments
                      </h3>
                      <p className="text-xs text-neutral-400">
                        Record and track payments issued to supplier bank wire details against confirmed invoices.
                      </p>
                    </div>

                    <div className="space-y-6">
                      {purchaseOrders
                        .filter(po => po.invoices && po.invoices.length > 0)
                        .map(po => {
                          return (po.invoices || []).map((inv: any) => {
                            const payments = inv.payments || [];
                            const totalPaid = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
                            const balance = inv.amount - totalPaid;

                            return (
                              <div key={inv.id} className="border border-neutral-200 rounded-2xl p-6 bg-[#FBFBFA]/50 space-y-4 shadow-sm hover:shadow-md transition-all">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-150 pb-3">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-neutral-850">Invoice: #{inv.invoice_number}</span>
                                      <span className="text-xs font-medium text-neutral-400 font-sans">({po.vendor_name})</span>
                                    </div>
                                    <span className="text-[10px] text-neutral-450 block mt-0.5 font-sans">PO Link: {po.po_number}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[10px] text-neutral-400 block font-bold font-serif">Invoice Amount</span>
                                    <span className="text-sm font-bold text-neutral-800 font-mono">${inv.amount}</span>
                                  </div>
                                </div>

                                {payments.length > 0 ? (
                                  <div className="space-y-3 bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
                                    <h5 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Disbursement History</h5>
                                    <div className="divide-y divide-neutral-100 text-xs">
                                      {payments.map((p: any) => (
                                        <div key={p.id} className="py-2.5 flex justify-between items-center first:pt-0 last:pb-0">
                                          <div>
                                            <span className="font-bold text-neutral-700">{p.payment_method}</span>
                                            {p.payment_reference && (
                                              <span className="text-[10px] text-neutral-400 font-mono ml-2">Ref: {p.payment_reference}</span>
                                            )}
                                            <p className="text-[9px] text-neutral-400 mt-0.5">Paid on: {new Date(p.payment_date).toLocaleDateString()}</p>
                                          </div>
                                          <span className="font-bold text-neutral-800 font-mono">${p.amount}</span>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="border-t border-neutral-150 pt-3 flex justify-between items-center text-xs font-bold">
                                      <span className="text-neutral-500">Total Paid:</span>
                                      <span className="text-neutral-800 font-mono">${totalPaid}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-xs text-neutral-400 italic">No disbursement recorded.</p>
                                )}

                                <div className="flex items-center justify-between text-xs p-3 px-4 bg-white border border-neutral-200 rounded-xl shadow-sm">
                                  <span className="text-neutral-500 font-bold">Remaining Balance:</span>
                                  <span className={`font-mono font-bold ${balance <= 0 ? 'text-green-600' : 'text-amber-600'}`}>
                                    ${balance}
                                  </span>
                                </div>

                                {balance > 0 && (
                                  payingInvoiceId === inv.id ? (
                                    <div className="p-4 bg-white border border-neutral-200 rounded-xl space-y-4 shadow-sm animate-in slide-in-from-top-2 duration-200">
                                      <h5 className="text-xs font-bold text-neutral-700">Record Payment</h5>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="space-y-1">
                                          <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Payment Amount ($)</label>
                                          <input
                                            type="number"
                                            value={paymentAmount}
                                            onChange={(e) => setPaymentAmount(e.target.value)}
                                            placeholder={`${balance}`}
                                            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-emerald-800"
                                          />
                                        </div>

                                        <div className="space-y-1">
                                          <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Disbursement Date</label>
                                          <input
                                            type="date"
                                            value={paymentDate}
                                            onChange={(e) => setPaymentDate(e.target.value)}
                                            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs outline-none"
                                          />
                                        </div>

                                        <div className="space-y-1">
                                          <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Method</label>
                                          <select
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs outline-none"
                                          >
                                            <option value="Bank Transfer">Bank Transfer</option>
                                            <option value="Cash">Cash</option>
                                            <option value="Card">Card</option>
                                            <option value="Cheque">Cheque</option>
                                          </select>
                                        </div>

                                        <div className="space-y-1">
                                          <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Reference Number</label>
                                          <input
                                            type="text"
                                            value={paymentRef}
                                            onChange={(e) => setPaymentRef(e.target.value)}
                                            placeholder="TXN-90210"
                                            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs outline-none"
                                          />
                                        </div>
                                      </div>

                                      <div className="space-y-1">
                                        <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Internal Notes</label>
                                        <input
                                          type="text"
                                          value={paymentNotes}
                                          onChange={(e) => setPaymentNotes(e.target.value)}
                                          placeholder="e.g., Wire transfer approved by operations team."
                                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs outline-none"
                                        />
                                      </div>

                                      <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                                        <button
                                          onClick={() => handleRecordPayment(inv.id)}
                                          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-950 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm"
                                        >
                                          Record Disbursement
                                        </button>
                                        <button
                                          onClick={() => setPayingInvoiceId(null)}
                                          className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-xl text-xs font-bold"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setPayingInvoiceId(inv.id);
                                        setPaymentAmount(`${balance}`);
                                        setPaymentDate(new Date().toISOString().split('T')[0]);
                                        setPaymentRef('');
                                        setPaymentNotes('');
                                      }}
                                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-600 rounded-xl text-xs font-bold transition-all shadow-sm"
                                    >
                                      <Plus className="w-4 h-4 text-neutral-500" />
                                      Record Payment
                                    </button>
                                  )
                                )}
                              </div>
                            );
                          });
                        })}
                    </div>
                  </div>
                ) : track === 'basic' && currentStep.id === 'ai-builder' ? (
                  <AIItineraryBuilder
                    itinerary={itinerary}
                    setItinerary={setItinerary}
                    tripData={tripData}
                    setTripData={setTripData}
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
                    manualSingle={manualSingle}
                    setManualSingle={setManualSingle}
                    manualDouble={manualDouble}
                    setManualDouble={setManualDouble}
                    manualTriple={manualTriple}
                    setManualTriple={setManualTriple}
                    manualFamily={manualFamily}
                    setManualFamily={setManualFamily}
                    masterData={masterData}
                    setMasterData={setMasterData}
                  />
                ) : track === 'basic' && currentStep.id === 'share-tourist' ? (
                  <div className="bg-white rounded-3xl border border-neutral-200 shadow-md p-8 space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-neutral-800 mb-1">Share Draft Itinerary</h3>
                      <p className="text-xs text-neutral-500">
                        Review the pre-filled email template below, customize the message, and send the draft itinerary to the guest.
                      </p>
                    </div>

                    {/* Sharing History Section */}
                    <div className="border border-neutral-200 rounded-3xl p-6 bg-[#FBFBFA]/50 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-neutral-800 font-serif flex items-center gap-2">
                          <Mail className="w-4 h-4 text-emerald-800" />
                          Itinerary Sharing History
                          {sharedEmails.length > 0 && (
                            <span className="px-2 py-0.5 bg-emerald-800/10 text-emerald-800 rounded-full text-[10px] font-mono font-bold">
                              {sharedEmails.length}
                            </span>
                          )}
                        </h4>
                      </div>

                      {sharedEmails.length === 0 ? (
                        <p className="text-xs text-neutral-500 italic py-2 text-center bg-white border border-neutral-150 rounded-2xl">
                          No emails have been shared with this guest yet.
                        </p>
                      ) : (
                        <div className="overflow-x-auto border border-neutral-200 rounded-2xl bg-white shadow-sm">
                          <table className="min-w-full divide-y divide-neutral-200 text-left text-xs">
                            <thead className="bg-neutral-50 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                              <tr>
                                <th scope="col" className="px-4 py-3">Date Shared</th>
                                <th scope="col" className="px-4 py-3">Sender</th>
                                <th scope="col" className="px-4 py-3">Recipient</th>
                                <th scope="col" className="px-4 py-3">Subject</th>
                                <th scope="col" className="px-4 py-3">Attachments</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 text-neutral-700 font-medium">
                              {sharedEmails.map((email) => (
                                <tr key={email.id} className="hover:bg-neutral-50/50 transition-colors">
                                  <td className="px-4 py-3 font-mono text-[10px] whitespace-nowrap text-neutral-500">
                                    {new Date(email.shared_at).toLocaleString(undefined, {
                                      dateStyle: 'short',
                                      timeStyle: 'short',
                                    })}
                                  </td>
                                  <td className="px-4 py-3 truncate max-w-[120px] font-mono text-neutral-600" title={email.sender_email}>
                                    {email.sender_email}
                                  </td>
                                  <td className="px-4 py-3 truncate max-w-[120px] font-mono text-neutral-600" title={email.recipient_email}>
                                    {email.recipient_email}
                                  </td>
                                  <td className="px-4 py-3 font-semibold text-neutral-800 truncate max-w-[180px]" title={email.subject}>
                                    {email.subject}
                                  </td>
                                  <td className="px-4 py-3">
                                    {Array.isArray(email.attachments) && email.attachments.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {email.attachments.map((name, i) => (
                                          <span
                                            key={i}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 border border-neutral-200 text-neutral-600 rounded-full text-[9px] font-bold"
                                            title={name}
                                          >
                                            <Paperclip className="w-2.5 h-2.5 text-neutral-400" />
                                            {name.length > 15 ? name.substring(0, 12) + '...' : name}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-neutral-400 text-[10px] italic">None</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {shareEmailFeedback && (
                      <div className={`p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
                        shareEmailFeedback.type === 'success' 
                          ? 'bg-green-50 text-green-700 border border-green-100' 
                          : 'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                        {shareEmailFeedback.type === 'success' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                        <p className="text-xs font-bold">{shareEmailFeedback.text}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Left: Metadata & Link Sharing */}
                      <div className="space-y-6 lg:col-span-1">
                        <div className="bg-[#FBFBFA] border border-neutral-200 rounded-2xl p-6 space-y-4">
                          <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest font-mono">Itinerary Link</h4>
                          <p className="text-xs text-neutral-500 leading-relaxed">
                            Guests can use this secure link to view their interactive draft itinerary, provide daily feedback, and view their summary details.
                          </p>
                          
                          <div className="bg-white border border-neutral-200 rounded-xl p-3 flex items-center justify-between gap-2 shadow-sm">
                            <span className="text-xs font-mono truncate text-neutral-600 select-all">
                              {typeof window !== 'undefined' 
                                ? `${window.location.origin}/tourist/tour/${tourId}` 
                                : `/tourist/tour/${tourId}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const shareLink = typeof window !== 'undefined' 
                                  ? `${window.location.origin}/tourist/tour/${tourId}` 
                                  : `/tourist/tour/${tourId}`;
                                navigator.clipboard.writeText(shareLink);
                                alert("Link copied to clipboard!");
                              }}
                              className="p-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg text-neutral-500 hover:text-emerald-800 transition-colors shadow-sm"
                              title="Copy Link"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="bg-[#FBFBFA] border border-neutral-200 rounded-2xl p-6 space-y-4">
                          <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest font-mono">Guest Details</h4>
                          <div className="space-y-3">
                            <div>
                              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Client Name</span>
                              <span className="text-xs text-neutral-700 font-medium">
                                {touristData?.profile 
                                  ? `${touristData.profile.first_name || ''} ${touristData.profile.last_name || ''}`.trim() || 'Valued Guest' 
                                  : 'Valued Guest'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Client Email</span>
                              <span className="text-xs text-neutral-700 font-mono block truncate">
                                {touristData?.profile?.email || 'No email provided'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Duration</span>
                              <span className="text-xs text-neutral-700 font-medium">
                                {touristData?.preferences?.duration_days 
                                  ? `${touristData.preferences.duration_days} Days` 
                                  : 'Not Specified'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-[#FBFBFA] border border-neutral-200 rounded-2xl p-6 space-y-4">
                          <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest font-mono font-serif">Guest Credentials</h4>
                          <p className="text-[11px] text-neutral-500 leading-relaxed">
                            Share these details to allow the guest to access their interactive online portal:
                          </p>
                          <div className="space-y-3 text-xs">
                            <div>
                              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Portal URL</span>
                              <span className="font-mono text-neutral-600 block bg-white border border-neutral-200 rounded-xl p-2 mt-1 truncate select-all">
                                {typeof window !== 'undefined' ? `${window.location.origin}/tourist/login` : '/tourist/login'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Login Email</span>
                              <span className="font-mono text-neutral-600 block bg-white border border-neutral-200 rounded-xl p-2 mt-1 truncate select-all">
                                {touristData?.profile?.email || 'No email provided'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Authentication Method</span>
                              <span className="text-neutral-700 font-medium block bg-white border border-neutral-200 rounded-xl p-2 mt-1">
                                Magic Link (Instant Login link sent to email)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Email Composer */}
                      <form onSubmit={handleSendShareEmail} className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-amber-600" /> Sender Email (From)
                            </label>
                            <input
                              type="email"
                              required
                              value={shareEmailFrom}
                              onChange={(e) => setShareEmailFrom(e.target.value)}
                              placeholder="sender@nilathra.com"
                              className="w-full bg-[#FBFBFA] border border-neutral-200 text-neutral-800 rounded-xl p-3 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 outline-none text-xs transition-all"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-amber-600" /> Recipient Email (To)
                            </label>
                            <input
                              type="email"
                              required
                              value={shareEmailTo}
                              onChange={(e) => setShareEmailTo(e.target.value)}
                              placeholder="client@example.com"
                              className="w-full bg-[#FBFBFA] border border-neutral-200 text-neutral-800 rounded-xl p-3 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 outline-none text-xs transition-all"
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Type className="w-3.5 h-3.5 text-amber-600" /> Subject Line
                            </label>
                            <input
                              type="text"
                              required
                              value={shareEmailSubject}
                              onChange={(e) => setShareEmailSubject(e.target.value)}
                              placeholder="Your Journey to Sri Lanka — A First Look"
                              className="w-full bg-[#FBFBFA] border border-neutral-200 text-neutral-800 rounded-xl p-3 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 outline-none text-xs transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-amber-600" /> Message Body
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowShareHtml(!showShareHtml)}
                              className="text-[10px] flex items-center gap-1 text-neutral-500 hover:text-neutral-800 transition-colors uppercase font-bold tracking-wider"
                            >
                              <Code className="w-3 h-3" /> {showShareHtml ? "View Formatted" : "View HTML Source"}
                            </button>
                          </div>
                          
                          {showShareHtml ? (
                            <textarea
                              required
                              rows={12}
                              value={shareEmailBody}
                              onChange={(e) => {
                                setShareEmailBody(e.target.value);
                                if (shareEditorRef.current) {
                                  shareEditorRef.current.innerHTML = e.target.value;
                                }
                              }}
                              placeholder="Dear Guest, ..."
                              className="w-full bg-[#FBFBFA] border border-neutral-200 text-neutral-800 rounded-xl p-4 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 outline-none text-xs transition-all resize-y font-mono"
                            />
                          ) : (
                            <div
                              ref={shareEditorRef}
                              contentEditable
                              onInput={() => {
                                if (shareEditorRef.current) {
                                  setShareEmailBody(shareEditorRef.current.innerHTML);
                                }
                              }}
                              onBlur={() => {
                                if (shareEditorRef.current) {
                                  setShareEmailBody(shareEditorRef.current.innerHTML);
                                }
                              }}
                              className="w-full bg-[#FBFBFA] border border-neutral-200 text-neutral-800 rounded-xl p-4 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 outline-none text-xs transition-all overflow-y-auto min-h-[250px] prose prose-sm max-w-none"
                            />
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Paperclip className="w-3.5 h-3.5 text-amber-600" /> Attachments (e.g. Itinerary PDF)
                          </label>
                          <div className="flex flex-col gap-3">
                            <input
                              type="file"
                              multiple
                              onChange={handleShareAttachmentsChange}
                              className="w-full text-xs text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-600/10 file:text-amber-700 hover:file:bg-amber-600/20 transition-all cursor-pointer"
                            />
                            {shareEmailAttachments.length > 0 && (
                              <ul className="space-y-2 mt-2">
                                {shareEmailAttachments.map((file, idx) => (
                                  <li key={idx} className="flex items-center justify-between bg-neutral-50 p-2 px-4 rounded-xl border border-neutral-200 text-xs shadow-sm">
                                    <span className="truncate text-neutral-700 font-medium">{file.name}</span>
                                    <button 
                                      type="button" 
                                      onClick={() => removeShareAttachment(idx)} 
                                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            type="submit"
                            disabled={isSendingShareEmail}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold tracking-wider transition-all text-xs uppercase ${
                              isSendingShareEmail 
                                ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed' 
                                : 'bg-emerald-800 text-white hover:bg-emerald-950 shadow-md hover:shadow-lg'
                            }`}
                          >
                            {isSendingShareEmail ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                Send Itinerary Email
                              </>
                            )}
                          </button>
                        </div>
                      </form>
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
  tripData: TripData | null;
  setTripData: React.Dispatch<React.SetStateAction<TripData | null>>;
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
  versions: Omit<DraftItineraryVersion, 'itinerary_data'>[];
  onLoadVersion: (version: Omit<DraftItineraryVersion, 'itinerary_data'>) => void;
  onSaveNewVersion: (label: string) => Promise<boolean>;
  manualSingle: number;
  setManualSingle: React.Dispatch<React.SetStateAction<number>>;
  manualDouble: number;
  setManualDouble: React.Dispatch<React.SetStateAction<number>>;
  manualTriple: number;
  setManualTriple: React.Dispatch<React.SetStateAction<number>>;
  manualFamily: number;
  setManualFamily: React.Dispatch<React.SetStateAction<number>>;
  masterData: any;
  setMasterData: React.Dispatch<React.SetStateAction<any>>;
}

function AIItineraryBuilder({
  itinerary,
  setItinerary,
  tripData,
  setTripData,
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
  onSaveNewVersion,
  manualSingle,
  setManualSingle,
  manualDouble,
  setManualDouble,
  manualTriple,
  setManualTriple,
  manualFamily,
  setManualFamily,
  masterData,
  setMasterData
}: AIItineraryBuilderProps) {
  const [activeDay, setActiveDay] = useState<number>(1);
  const [editingDayField, setEditingDayField] = useState<{ dayNum: number; field: 'hotel' | 'meals' | 'transport' | 'concierge' | 'agencyFeePercent' | 'agencyFee' } | null>(null);
  const [editingDayValue, setEditingDayValue] = useState<string>('');
  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [openCommentsBlockId, setOpenCommentsBlockId] = useState<string | null>(null);

  const [loadingMaster, setLoadingMaster] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState<{ blockId: string, type: ItineraryBlockType } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [pendingRoomState, setPendingRoomState] = useState<Record<string, { count?: number, mealPlan?: string }>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [roomMarkup, setRoomMarkup] = useState<number>(10);
  const [markups, setMarkups] = useState<Record<string, any>>({});

  // Hotel Search State
  const [hotelSearchCity, setHotelSearchCity] = useState('');
  const [hotelSearchName, setHotelSearchName] = useState('');
  const [hotelSearchResults, setHotelSearchResults] = useState<any[] | null>(null);
  const [isSearchingHotels, setIsSearchingHotels] = useState(false);

  // Restaurant Search State
  const [restaurantSearchCity, setRestaurantSearchCity] = useState('');
  const [restaurantSearchName, setRestaurantSearchName] = useState('');
  const [restaurantSearchResults, setRestaurantSearchResults] = useState<any[] | null>(null);
  const [isSearchingRestaurants, setIsSearchingRestaurants] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scroll when assignment drawer is active
  useEffect(() => {
    const mainScrollContainer = document.getElementById('main-scroll-container');
    if (activeAssignment) {
      document.body.style.overflow = 'hidden';
      if (mainScrollContainer) {
        mainScrollContainer.style.overflow = 'hidden';
      }
    } else {
      document.body.style.overflow = '';
      if (mainScrollContainer) {
        mainScrollContainer.style.overflow = '';
      }
    }
    return () => {
      document.body.style.overflow = '';
      if (mainScrollContainer) {
        mainScrollContainer.style.overflow = '';
      }
    };
  }, [activeAssignment]);

  // Load master data on mount
  useEffect(() => {
    async function loadData() {
      setLoadingMaster(true);
      try {
        const assignedHotelIds = itinerary
          .filter(b => b.type === ItineraryBlockTypes.SLEEP && b.hotelId)
          .map(b => b.hotelId as string);

        const [h, v, d, g, r, tp, act, markupRes] = await Promise.all([
          getAssignedHotelsAction(assignedHotelIds),
          getVendorsAction(),
          getDriversAction(),
          getTourGuidesAction(),
          getRestaurantsAction(),
          getTransportProvidersAction(),
          getActivitiesAction(),
          getAppMarkupsAction()
        ]);
        setMasterData({
          hotels: h.success ? h.hotels : [],
          vendors: v.success ? v.vendors : [],
          drivers: d.success ? d.drivers : [],
          guides: g.success ? g.guides : [],
          restaurants: r.success ? r.restaurants : [],
          transportProviders: tp.success ? tp.providers : [],
          activities: act.success ? (act.data || (act as any).activities || []) : []
        });
        if (markupRes && markupRes.success && markupRes.markups) {
          setMarkups(markupRes.markups);
          setRoomMarkup(markupRes.markups.room_markup ?? 10);
        }
      } catch (err) {
        console.error("Failed to load master data for assignment:", err);
      } finally {
        setLoadingMaster(false);
      }
    }
    if (tourId) {
      loadData();
    }
  }, [tourId]);

  const handleSearchHotels = async () => {
    setIsSearchingHotels(true);
    try {
      const res = await searchHotelsAction(hotelSearchCity, hotelSearchName);
      if (res.success && res.hotels) {
        setHotelSearchResults(res.hotels);
        // Merge into masterData.hotels
        setMasterData((prev: any) => {
          const existingIds = new Set(prev.hotels.map((h: any) => h.id));
          const newHotels = res.hotels.filter((h: any) => !existingIds.has(h.id));
          return { ...prev, hotels: [...prev.hotels, ...newHotels] };
        });
      } else {
        setHotelSearchResults([]);
      }
    } catch (err) {
      console.error(err);
      setHotelSearchResults([]);
    } finally {
      setIsSearchingHotels(false);
    }
  };

  const handleSearchRestaurants = async () => {
    setIsSearchingRestaurants(true);
    try {
      const combinedSearch = `${restaurantSearchCity} ${restaurantSearchName}`.trim();
      const res = await searchRestaurantsAction(combinedSearch);
      if (res.success && res.restaurants) {
        setRestaurantSearchResults(res.restaurants);
        // Merge into masterData.restaurants
        setMasterData((prev: any) => {
          const existingIds = new Set(prev.restaurants.map((r: any) => r.id));
          const newRestaurants = res.restaurants.filter((r: any) => !existingIds.has(r.id));
          return { ...prev, restaurants: [...prev.restaurants, ...newRestaurants] };
        });
      } else {
        setRestaurantSearchResults([]);
      }
    } catch (err) {
      console.error(err);
      setRestaurantSearchResults([]);
    } finally {
      setIsSearchingRestaurants(false);
    }
  };

  const updateBlock = (id: string, fields: Partial<InternalItineraryBlock>) => {
    setItinerary(prev => prev.map(b => b.id === id ? { ...b, ...fields } : b));
  };

  const bindProvider = (blockId: string, field: keyof InternalItineraryBlock, value: any) => {
    const block = itinerary.find(b => b.id === blockId);
    if (!block) return;

    // Sync logic for hotels
    if (field === 'hotelId' && block.type === ItineraryBlockTypes.SLEEP) {
      const hotel = masterData.hotels.find((h: any) => h.id === value);
      if (hotel) {
        // Auto-populate cover image if available
        const autoImageUrl = (hotel.images && hotel.images.length > 0) ? hotel.images[0] : (hotel.photo_url || block.imageUrl || '');
        
        setItinerary(prev => prev.map(b => b.id === blockId ? {
          ...b,
          hotelId: value,
          hotelName: hotel.name,
          imageUrl: autoImageUrl,
          // reset room specific selections if switching to a different hotel (do NOT reset agreedPrice)
          ...(b.hotelId !== value ? { roomName: '', mealPlan: 'BB' } : {})
        } : b));

        if (tripData) {
          let newAccs = [...(tripData.accommodations || [])];
          const existingAccIndex = newAccs.findIndex(a => Number(a.nightIndex) === Number(block.dayNumber));
          if (existingAccIndex >= 0) {
            newAccs[existingAccIndex] = {
              ...newAccs[existingAccIndex],
              hotelId: hotel.id,
              hotelName: hotel.name,
              stayClass: hotel.hotel_class || newAccs[existingAccIndex].stayClass,
              address: hotel.location_address || newAccs[existingAccIndex].address,
              ...(newAccs[existingAccIndex].hotelId !== hotel.id ? { roomId: undefined, roomName: '', roomStandard: '', mealPlan: undefined, pricePerNight: 0, selectedRooms: [] } : {})
            };
          } else {
            newAccs.push({
              id: crypto.randomUUID(),
              nightIndex: block.dayNumber,
              hotelId: hotel.id,
              hotelName: hotel.name,
              stayClass: hotel.hotel_class || 'Standard',
              address: hotel.location_address || '',
              mapLink: '',
              contactPerson: hotel.reservation_agent_name || '',
              contactNumber: hotel.reservation_agent_contact || '',
              email: '',
              rateCardUrl: '',
              roomStandard: 'Standard Room',
              numberOfRooms: 1,
              pricePerNight: 0,
              mealPlan: 'BB',
              status: 'Tentative',
              confirmationReference: '',
              paymentStatus: 'Pending',
              cancellationDeadline: '',
              beddingConfiguration: '',
              specialRequests: '',
              selectedRooms: []
            });
          }
          setTripData({
            ...tripData,
            accommodations: newAccs
          });
        }
      }
    }

    // Sync logic for restaurants
    else if (field === 'restaurantId' && block.type === ItineraryBlockTypes.MEAL) {
      const restaurant = masterData.restaurants.find((r: any) => r.id === value);
      if (restaurant) {
        const contractedRate = restaurant.lunch_rate_per_head || 25;
        const markupPercent = markups.restaurant_markup ?? 10;
        const agreedPrice = contractedRate * (1 + markupPercent / 100);
        
        setItinerary(prev => prev.map(b => b.id === blockId ? { 
          ...b, 
          restaurantId: value,
          contractedPrice: b.contractedPrice ?? contractedRate,
          agreedPrice: b.agreedPrice ?? agreedPrice
        } : b));
      }
    }

    else if (field === 'activityId' && block.type === ItineraryBlockTypes.ACTIVITY) {
      const activity = masterData.activities.find((a: any) => a.id === value);
      if (activity) {
        const autoImageUrl = (activity.images && activity.images.length > 0) ? activity.images[0] : (block.imageUrl || '');
        setItinerary(prev => prev.map(b => b.id === blockId ? {
          ...b,
          activityId: value,
          imageUrl: autoImageUrl,
          ...(b.activityId !== value ? { vendorId: undefined, vendorActivityId: undefined, contractedPrice: undefined, agreedPrice: undefined } : {})
        } : b));
      }
    }

    // Sync logic for activities (Vendors)
    else if (field === 'vendorId' && block.type === ItineraryBlockTypes.ACTIVITY) {
      const vendor = masterData.vendors.find((v: any) => v.id === value);
      if (vendor) {
        const blockActivityId = block.activityId || (() => {
          if (!block.name) return undefined;
          const cleanWords = (str: string) => {
            return str.toLowerCase()
              .replace(/[^\w\s]/g, '')
              .split(/\s+/)
              .filter(w => w.length > 2 && !['visit', 'explore', 'climb', 'tour', 'the', 'and', 'for', 'with', 'to', 'in', 'at'].includes(w));
          };
          const blockWords = cleanWords(block.name);
          if (blockWords.length === 0) return undefined;

          let bestMatch: any = null;
          let maxOverlap = 0;
          masterData.activities.forEach((a: any) => {
            const actWords = cleanWords(a.activity_name);
            const overlap = blockWords.filter(w => actWords.includes(w)).length;
            if (overlap > maxOverlap) {
              maxOverlap = overlap;
              bestMatch = a;
            }
          });
          return maxOverlap > 0 ? bestMatch?.id : undefined;
        })();

        const va = vendor.vendor_activities?.find((a: any) => Number(a.activity_id) === Number(blockActivityId));
        
        // Auto-populate cover image if available
        const activityDetail = masterData.activities.find((a: any) => Number(a.id) === Number(blockActivityId));
        const autoImageUrl = (activityDetail?.images && activityDetail.images.length > 0) 
          ? activityDetail.images[0] 
          : (block.imageUrl || '');

        if (va) {
          const markupPercent = markups.vendor_activity_markup ?? 10;
          const contractedRate = va.vendor_price || 0;
          const agreedPrice = contractedRate * (1 + markupPercent / 100);

          setItinerary(prev => prev.map(b => b.id === blockId ? {
            ...b,
            vendorId: value,
            activityId: blockActivityId,
            vendorActivityId: va.id,
            contractedPrice: b.contractedPrice ?? contractedRate,
            agreedPrice: b.agreedPrice ?? agreedPrice,
            imageUrl: autoImageUrl
          } : b));
        } else {
          setItinerary(prev => prev.map(b => b.id === blockId ? {
            ...b,
            vendorId: value,
            activityId: blockActivityId,
            vendorActivityId: undefined,
            contractedPrice: b.contractedPrice,
            agreedPrice: b.agreedPrice,
            imageUrl: autoImageUrl
          } : b));
        }
      }
    }

    // Sync logic for transport defaults
    else if (field === 'transportId' && block.type === ItineraryBlockTypes.TRAVEL) {
      const provider = masterData.transportProviders.find((p: any) => p.id === value);
      if (provider) {
        setItinerary(prev => prev.map(b => b.id === blockId ? {
          ...b,
          transportId: value,
          transportRateType: 'day',
          transportQuantity: 1
        } : b));
      }
    }
  };

  const getBindingDisplay = (block: InternalItineraryBlock) => {
    if (block.type === ItineraryBlockTypes.SLEEP && block.hotelId) {
      const h = masterData.hotels.find((x: any) => x.id === block.hotelId);
      let label = h?.name || block.hotelName || 'Linked Hotel';
      if (block.roomName) {
        label += ` - ${block.roomName}`;
      }
      if (block.mealPlan) {
        label += ` (${block.mealPlan})`;
      }
      return {
        name: label,
        icon: <BedDouble className="w-3.5 h-3.5 text-indigo-500" />,
        contact: h ? {
          name: h.sales_agent_name || h.reservation_agent_name || h.gm_name || 'Reservations / Sales',
          phone: h.sales_agent_contact || h.reservation_agent_contact || h.gm_contact || ''
        } : undefined
      };
    }
    if (block.type === ItineraryBlockTypes.ACTIVITY && (block.vendorId || block.vendorActivityId || block.activityId)) {
      const v = masterData.vendors.find((x: any) => x.id === block.vendorId);
      const resolvedActId = block.activityId || (() => {
        if (!block.name) return undefined;
        const cleanWords = (str: string) => {
          return str.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 2 && !['visit', 'explore', 'climb', 'tour', 'the', 'and', 'for', 'with', 'to', 'in', 'at', 'relax', 'unwind', 'leisure', 'hotel', 'stay', 'free', 'day', 'rest', 'evening', 'morning', 'afternoon', 'safari', 'hike', 'walk', 'trek', 'ride', 'drive', 'boat', 'boating', 'cruise', 'beach', 'lake', 'river', 'park', 'national', 'temple', 'fort', 'gardens', 'garden', 'waterfall', 'waterfalls', 'sightseeing', 'city', 'shopping', 'dinner', 'lunch', 'breakfast', 'meal', 'meals', 'transfer', 'transfers', 'arrival', 'departure', 'flight', 'flights', 'activity', 'activities', 'attraction', 'attractions'].includes(w));
        };
        const blockWords = cleanWords(block.name);
        if (blockWords.length === 0) return undefined;

        let bestMatch: any = null;
        let maxOverlap = 0;
        masterData.activities.forEach((a: any) => {
          const actWords = cleanWords(a.activity_name);
          const overlap = blockWords.filter(w => actWords.includes(w)).length;
          if (overlap > maxOverlap) {
            maxOverlap = overlap;
            bestMatch = a;
          }
        });
        return maxOverlap > 0 ? bestMatch?.id : undefined;
      })();
      const va = v?.vendor_activities?.find((x: any) => x.id === block.vendorActivityId) ||
                 v?.vendor_activities?.find((x: any) => Number(x.activity_id) === Number(resolvedActId));

      if (v) {
        const activityLabel = va?.activity_name || block.name || 'Activity';
        let label = `${v.name} - ${activityLabel}`;
        return {
          name: label,
          icon: <Compass className="w-3.5 h-3.5 text-orange-500" />,
          contact: { name: 'Vendor', phone: v.phone || '' }
        };
      }

      const activityDetail = masterData.activities.find((x: any) => Number(x.id) === Number(resolvedActId));
      let fallbackLabel = activityDetail?.activity_name || block.name || 'Linked Activity';

      return { name: fallbackLabel, icon: <Compass className="w-3.5 h-3.5 text-orange-500" /> };
    }
    if (block.type === ItineraryBlockTypes.TRAVEL && (block.driverId || block.transportId || block.vehicleId)) {
      const d = masterData.drivers.find((x: any) => x.id === block.driverId);
      const p = masterData.transportProviders.find((x: any) => x.id === block.transportId);
      const v = p?.transport_vehicles?.find((x: any) => x.id === block.vehicleId);

      let label = p?.name || 'Transport Provider';
      let contact = undefined;
      if (v) {
        label = `${p?.name || ''} - ${v.make_and_model || v.vehicle_type}`;
        if (block.transportQuantity) {
          label += ` [${block.transportQuantity} ${block.transportRateType === 'km' ? 'KM' : 'Day(s)'}]`;
        }
        if (v.with_driver) label += ' [Incl. Driver]';
        else if (d) label += ` [Driver: ${d.first_name}]`;

        if (d) contact = { name: `${d.first_name} (Driver)`, phone: d.phone || '' };
        else if (p) contact = { name: p.name, phone: p.phone || '' };

      } else if (d) {
        label = `Driver: ${d.first_name} ${d.last_name}`;
        contact = { name: `${d.first_name} (Driver)`, phone: d.phone || '' };
      } else if (p) {
        contact = { name: p.name, phone: p.phone || '' };
      }

      return { name: label, icon: <Car className="w-3.5 h-3.5 text-blue-500" />, contact };
    }
    if (block.type === ItineraryBlockTypes.GUIDE && block.guideId) {
      const g = masterData.guides.find((x: any) => x.id === block.guideId);
      return {
        name: g ? `${g.first_name} ${g.last_name}` : 'Linked Guide',
        icon: <UserCheck className="w-3.5 h-3.5 text-amber-500" />,
        contact: g ? { name: g.first_name, phone: g.phone || '' } : undefined
      };
    }
    if (block.type === ItineraryBlockTypes.MEAL && block.restaurantId) {
      const r = masterData.restaurants.find((x: any) => x.id === block.restaurantId);
      let label = r?.name || 'Linked Restaurant';
      if (block.mealType) label += ` - ${block.mealType}`;
      return {
        name: label,
        icon: <Utensils className="w-3.5 h-3.5 text-green-500" />,
        contact: r ? { name: r.contact_name || r.name, phone: r.contact_number || '' } : undefined
      };
    }
    return null;
  };

  const filteredMasterData = useMemo(() => {
    if (!activeAssignment) return [];
    const terms = searchTerm.toLowerCase().split(/\s+/).filter(Boolean);

    const checkMatch = (fields: (string | undefined | null)[]) => {
      if (terms.length === 0) return true;
      const combined = fields.filter(f => f).map(f => f!.toLowerCase()).join(' ');
      return terms.every(t => combined.includes(t));
    };

    switch (activeAssignment.type) {
      case ItineraryBlockTypes.SLEEP:
        return masterData.hotels.filter((h: any) => checkMatch([h.name, h.closest_city, h.location_address]));
      case ItineraryBlockTypes.ACTIVITY:
        return masterData.vendors.filter((v: any) => {
          const activityStrings = v.vendor_activities?.flatMap((va: any) => {
            const actData = (va as any).activities || (va as any).activity;
            return [
              va.activity_name,
              actData?.location_name,
              actData?.district
            ];
          }) || [];
          return checkMatch([v.name, v.address, ...activityStrings]);
        });
      case ItineraryBlockTypes.MEAL:
        return masterData.restaurants.filter((r: any) => checkMatch([r.name, r.address, r.city, r.district]));
      case ItineraryBlockTypes.TRAVEL:
        return {
          providers: masterData.transportProviders.filter((p: any) => checkMatch([p.name, p.address])),
          drivers: masterData.drivers.filter((d: any) => checkMatch([d.first_name, d.last_name]))
        };
      case ItineraryBlockTypes.GUIDE:
        return masterData.guides.filter((g: any) => checkMatch([g.first_name, g.last_name]));
      default:
        return [];
    }
  }, [activeAssignment, searchTerm, masterData]);

  const handleCopyRatePrompt = (block: InternalItineraryBlock) => {
    if (block.type !== ItineraryBlockTypes.SLEEP || !block.hotelId) return;
    const hotel = masterData.hotels.find((h: any) => h.id === block.hotelId);
    if (!hotel) return;

    let checkInStr = "<check_in_date>";
    let checkOutStr = "<check_out_date>";
    
    if (arrivalDate) {
      const checkInDate = new Date(arrivalDate);
      checkInDate.setDate(checkInDate.getDate() + (block.dayNumber - 1));
      
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() + 1);

      checkInStr = checkInDate.toISOString().split('T')[0];
      checkOutStr = checkOutDate.toISOString().split('T')[0];
    }

    const hotelName = hotel.name || "<hotel_name>";
    const hotelLocation = hotel.closest_city || "<hotel_location>";
    const mealPlan = block.mealPlan || "BB";

    const prompt = `Could you please provide the rate for a stay at ${hotelName} in ${hotelLocation} for ${adults} adults and ${children} children, from ${checkInStr} to ${checkOutStr}, on a ${mealPlan} basis?`;
    
    navigator.clipboard.writeText(prompt);
    window.alert("Rate prompt copied to clipboard:\n\n" + prompt);
  };

  const getCardAccentBorder = (type: InternalItineraryBlock['type']) => {
    switch (type) {
      case ItineraryBlockTypes.SLEEP: return 'border-l-4 border-l-amber-500';
      case ItineraryBlockTypes.ACTIVITY: return 'border-l-4 border-l-emerald-500';
      case ItineraryBlockTypes.MEAL: return 'border-l-4 border-l-rose-500';
      case ItineraryBlockTypes.TRAVEL: return 'border-l-4 border-l-sky-500';
      case ItineraryBlockTypes.TRAIN: return 'border-l-4 border-l-purple-500';
      case ItineraryBlockTypes.GUIDE: return 'border-l-4 border-l-teal-500';
      default: return 'border-l-4 border-l-neutral-400';
    }
  };

  const renderTypeBadge = (type: InternalItineraryBlock['type']) => {
    switch (type) {
      case ItineraryBlockTypes.SLEEP:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-amber-50 text-amber-800 border border-amber-200/50 shadow-sm shrink-0">
            <BedDouble className="w-3.5 h-3.5 text-amber-600" /> Sleep
          </span>
        );
      case ItineraryBlockTypes.ACTIVITY:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200/50 shadow-sm shrink-0">
            <Compass className="w-3.5 h-3.5 text-emerald-600" /> Activity
          </span>
        );
      case ItineraryBlockTypes.MEAL:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-rose-50 text-rose-800 border border-rose-200/50 shadow-sm shrink-0">
            <Utensils className="w-3.5 h-3.5 text-rose-600" /> Meal
          </span>
        );
      case ItineraryBlockTypes.TRAVEL:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-sky-50 text-sky-850 border border-sky-200/50 shadow-sm shrink-0">
            <Car className="w-3.5 h-3.5 text-sky-600" /> Travel
          </span>
        );
      case ItineraryBlockTypes.TRAIN:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-purple-50 text-purple-800 border border-purple-200/50 shadow-sm shrink-0">
            <Compass className="w-3.5 h-3.5 text-purple-600" /> Train
          </span>
        );
      case ItineraryBlockTypes.GUIDE:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-teal-50 text-teal-800 border border-teal-200/50 shadow-sm shrink-0">
            <UserCheck className="w-3.5 h-3.5 text-teal-600" /> Guide
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-neutral-50 text-neutral-800 border border-neutral-200/50 shadow-sm shrink-0">
            {type}
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
        if (block.type === ItineraryBlockTypes.SLEEP) {
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
    const overrides = tripData?.dayCostOverrides?.[dayNum] || {};
    const blocksForDay = itinerary.filter(b => b.dayNumber === dayNum);
    
    // 1. Hotel Cost
    const hotel = overrides.hotel !== undefined 
      ? overrides.hotel 
      : blocksForDay
          .filter(b => b.type === ItineraryBlockTypes.SLEEP)
          .reduce((sum, b) => sum + (Number(b.agreedPrice) || 0), 0);

    // 2. Pax Count
    const pax = (adults || 0) + (children || 0);

    // Helper to get settings keys
    const getTierValue = (setting: typeof TierSettingDefinitions[keyof typeof TierSettingDefinitions]) => {
      if (!appSettings) return setting.defaultValue;
      const key = travelStyle?.toLowerCase().replace(' ', '_') || 'luxury';
      const fullKey = `${key}_${setting.key}`;
      return appSettings[fullKey] !== undefined ? Number(appSettings[fullKey]) : setting.defaultValue;
    };

    // 3. Meal Cost (Lunch cost per tourist * pax)
    const lunchCostPerHead = getTierValue(TierSettingDefinitions.LUNCH_COST);
    const meals = overrides.meals !== undefined 
      ? overrides.meals 
      : pax * lunchCostPerHead;

    // 4. Transport Cost
    const kmRate = getTierValue(TierSettingDefinitions.VEHICLE_KM_RATE);
    const getBlockKm = (block: InternalItineraryBlock) => {
      if (!block.distance) return 0;
      const parsed = parseFloat(block.distance.toString().replace(/[^\d.]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    };
    const km = blocksForDay.reduce((sum, b) => sum + getBlockKm(b), 0);
    const transport = overrides.transport !== undefined 
      ? overrides.transport 
      : km * kmRate;

    // 5. Concierge Cost (ticket, refreshment, seamless concierge)
    const conciergeCostPerHead = getTierValue(TierSettingDefinitions.CONCIERGE_COST);
    const concierge = overrides.concierge !== undefined 
      ? overrides.concierge 
      : pax * conciergeCostPerHead;

    // 6. Agency Fee & Tax
    const agencyFeePercent = overrides.agencyFeePercent !== undefined
      ? overrides.agencyFeePercent
      : getTierValue(TierSettingDefinitions.SERVICE_FEE);
      
    const subtotal = hotel + meals + transport + concierge;
    const agencyFee = overrides.agencyFee !== undefined
      ? overrides.agencyFee
      : subtotal * (agencyFeePercent / 100);

    const total = overrides.total !== undefined
      ? overrides.total
      : subtotal + agencyFee;

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

  const handleSaveDayCostOverride = (dayNum: number, field: 'hotel' | 'meals' | 'transport' | 'concierge' | 'agencyFeePercent' | 'agencyFee', valStr: string) => {
    const val = parseFloat(valStr);
    
    setTripData(prev => {
      if (!prev) return prev;
      const dayCostOverrides = { ...(prev.dayCostOverrides || {}) };
      const dayOverrides = { ...(dayCostOverrides[dayNum] || {}) };
      
      if (isNaN(val)) {
        delete dayOverrides[field];
      } else {
        dayOverrides[field] = val;
      }
      
      if (Object.keys(dayOverrides).length === 0) {
        delete dayCostOverrides[dayNum];
      } else {
        dayCostOverrides[dayNum] = dayOverrides;
      }
      
      return {
        ...prev,
        dayCostOverrides
      };
    });
    
    setEditingDayField(null);
  };

  const handleResetDayCostOverrides = (dayNum: number) => {
    setTripData(prev => {
      if (!prev) return prev;
      const dayCostOverrides = { ...(prev.dayCostOverrides || {}) };
      delete dayCostOverrides[dayNum];
      return {
        ...prev,
        dayCostOverrides
      };
    });
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

          if (event.type === ItineraryBlockTypes.ACTIVITY) {
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
          if (event.type === ItineraryBlockTypes.SLEEP && event.rateUsd) {
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
            hotelName: event.type === ItineraryBlockTypes.SLEEP ? (event.hotelName || event.name) : '',
            roomName: event.type === ItineraryBlockTypes.SLEEP ? (event.roomCategory || '') : '',
            mealPlan: event.type === ItineraryBlockTypes.SLEEP ? (event.mealPlan || 'BB') : '',
            agreedPrice: event.type === ItineraryBlockTypes.SLEEP ? sleepPrice : undefined,
            baseRoomRate: event.type === ItineraryBlockTypes.SLEEP ? event.rateUsd : undefined,
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
        if (block.type === ItineraryBlockTypes.TRAVEL) {
          // If a travel block is generated, resolve its destination coordinates from itself or lookahead
          let destLat = block.lat;
          let destLng = block.lng;
          if (destLat === undefined || destLng === undefined) {
            // Look ahead for the first block with coordinates
            for (let i = index + 1; i < nonDropped.length; i++) {
              const nextB = nonDropped[i];
              if (nextB.type !== ItineraryBlockTypes.TRAVEL && nextB.lat !== undefined && nextB.lng !== undefined) {
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
              const hasPrecedingTravel = prevInProcessed && prevInProcessed.type === ItineraryBlockTypes.TRAVEL;

              if (!hasPrecedingTravel) {
                // Insert an auto-generated travel block
                const travelDuration = Math.max(0.5, Math.round((dist / 35) * 2) / 2); // 35 km/h avg speed
                const travelBlock: InternalItineraryBlock = {
                  id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
                  dayNumber: block.dayNumber,
                  type: ItineraryBlockTypes.TRAVEL,
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
            type: ItineraryBlockTypes.ACTIVITY,
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
      type: ItineraryBlockTypes.ACTIVITY,
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
        if (b.type === ItineraryBlockTypes.SLEEP && field === 'agreedPrice' && value !== undefined) {
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
    { value: ItineraryBlockTypes.ACTIVITY, label: 'Activity' },
    { value: ItineraryBlockTypes.SLEEP, label: 'Hotel / Sleep' },
    { value: ItineraryBlockTypes.MEAL, label: 'Meal' },
    { value: ItineraryBlockTypes.TRAVEL, label: 'Transfer / Travel' },
    { value: ItineraryBlockTypes.TRAIN, label: 'Train' },
    { value: ItineraryBlockTypes.GUIDE, label: 'Guide assignment' },
    { value: ItineraryBlockTypes.CUSTOM, label: 'Custom Item' }
  ];

  const mealPlans = ['None', 'BB', 'HB', 'FB', 'AI'];  return (
    <div className="relative overflow-hidden bg-white/95 backdrop-blur-md rounded-3xl p-8 border border-neutral-200/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-3 duration-300 space-y-8">
      {/* Decorative Glowing Blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-full filter blur-3xl -translate-y-12 translate-x-12 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-amber-500/5 to-emerald-500/5 rounded-full filter blur-3xl translate-y-12 -translate-x-12 pointer-events-none" />

      {/* Title & Description Header Section */}
      <div className="relative border-b border-neutral-100 pb-5">
        <h3 className="text-2xl font-serif font-extrabold text-neutral-800 tracking-tight">AI Itinerary Builder</h3>
        <p className="text-xs text-neutral-500/90 font-medium leading-relaxed max-w-3xl mt-1">Design a customized flat skeleton itinerary. Refine parameters, pacing rules, and let Gemini route day-by-day plans.</p>
      </div>

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

      {/* Toolbar Controls Section */}
      <div className="relative border-b border-neutral-100 pb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full">
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
          <div className="bg-gradient-to-tr from-neutral-50/70 to-emerald-50/20 rounded-2xl border border-neutral-200/50 p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200/60 pb-3">
              <div className="flex items-center gap-3">
                <h5 className="text-xs font-bold text-neutral-600 uppercase tracking-wider flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-800 shrink-0" />
                  <span>Day {activeDay} Cost Summary ({travelStyle} Tier)</span>
                </h5>
                {tripData?.dayCostOverrides?.[activeDay] && (
                  <button
                    onClick={() => handleResetDayCostOverrides(activeDay)}
                    className="text-[10px] text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200/50 px-2 py-0.5 rounded-lg transition-all font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                    title="Reset all overrides for this day"
                  >
                    Reset to Auto
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Est. Day Total:</span>
                <span className="text-lg font-black text-emerald-800 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-xl">
                  ${calculateDayTotal(activeDay).total.toFixed(2)}
                </span>
              </div>
            </div>
            
            {(() => {
              const renderCostCard = (
                label: string,
                field: 'hotel' | 'meals' | 'transport' | 'concierge' | 'agencyFeePercent',
                value: number,
                icon: React.ReactNode,
                paxText?: string
              ) => {
                const isEditing = editingDayField?.dayNum === activeDay && editingDayField?.field === field;
                const isOverridden = tripData?.dayCostOverrides?.[activeDay]?.[field] !== undefined;

                return (
                  <div className="bg-white p-4 rounded-xl border border-neutral-200/50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-2 relative group min-h-[90px]">
                    <div className="flex items-center justify-between text-neutral-400">
                      <div className="flex items-center gap-2">
                        {icon}
                        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
                      </div>
                      {!isEditing && (
                        <button
                          onClick={() => {
                            setEditingDayField({ dayNum: activeDay, field });
                            setEditingDayValue(value.toString());
                          }}
                          className="opacity-0 group-hover:opacity-100 hover:text-emerald-800 transition-opacity p-0.5 cursor-pointer"
                          title={`Edit ${label}`}
                        >
                          <Pencil className="w-3 h-3 text-neutral-400 hover:text-emerald-800" />
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <input
                          type="number"
                          step="any"
                          value={editingDayValue}
                          onChange={(e) => setEditingDayValue(e.target.value)}
                          className="w-full bg-[#FBFBFA] border border-neutral-300 text-neutral-805 rounded px-1.5 py-0.5 text-xs outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-850/10"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveDayCostOverride(activeDay, field, editingDayValue);
                            if (e.key === 'Escape') setEditingDayField(null);
                          }}
                        />
                        <button
                          onClick={() => handleSaveDayCostOverride(activeDay, field, editingDayValue)}
                          className="text-emerald-700 hover:text-emerald-950 shrink-0 cursor-pointer"
                          title="Save"
                        >
                          <Check className="w-3.5 h-3.5 font-black" />
                        </button>
                        <button
                          onClick={() => setEditingDayField(null)}
                          className="text-neutral-400 hover:text-neutral-600 shrink-0 cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-baseline justify-between gap-2">
                        <span className={`text-base font-extrabold ${isOverridden ? 'text-amber-600 font-black' : 'text-neutral-800'}`}>
                          {field === 'agencyFeePercent' ? `${value}%` : `$${value.toFixed(2)}`}
                        </span>
                        {paxText && <span className="text-[9px] text-neutral-400 font-bold shrink-0">{paxText}</span>}
                      </div>
                    )}
                  </div>
                );
              };

              const dayTotalObj = calculateDayTotal(activeDay);

              return (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {renderCostCard('Hotel Cost', 'hotel', dayTotalObj.hotel, <BedDouble className="w-4 h-4 text-amber-605 shrink-0" />)}
                  {renderCostCard('Meals', 'meals', dayTotalObj.meals, <Utensils className="w-4 h-4 text-rose-600 shrink-0" />, `(${(adults || 0) + (children || 0)} Pax)`)}
                  {renderCostCard('Transport', 'transport', dayTotalObj.transport, <Car className="w-4 h-4 text-sky-600 shrink-0" />, `(${dayTotalObj.km.toFixed(0)} km)`)}
                  {renderCostCard('Concierge', 'concierge', dayTotalObj.concierge, <Receipt className="w-4 h-4 text-indigo-600 shrink-0" />, `(${(adults || 0) + (children || 0)} Pax)`)}
                  {renderCostCard('Agency Fee', 'agencyFeePercent', dayTotalObj.agencyFeePercent, <Coins className="w-4 h-4 text-emerald-600 shrink-0" />, `($${dayTotalObj.agencyFee.toFixed(2)})`)}
                </div>
              );
            })()}
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
                    {block.type === ItineraryBlockTypes.TRAVEL ? (
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
                  {block.type === ItineraryBlockTypes.SLEEP && (
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
                    
                    {/* Left side: Upload Button & Image thumbnail AND Bind Provider */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {(() => {
                        let imgUrl = block.imageUrl;
                        if (imgUrl === 'none') {
                          imgUrl = '';
                        } else {
                          if (!imgUrl && block.type === ItineraryBlockTypes.SLEEP && block.hotelId) {
                            const h = masterData.hotels?.find((x: any) => x.id === block.hotelId);
                            if (h) {
                              imgUrl = (h.images && h.images.length > 0) ? h.images[0] : (h.photo_url || '');
                            }
                          }
                          if (!imgUrl && block.type === ItineraryBlockTypes.MEAL && block.restaurantId) {
                            const r = masterData.restaurants?.find((x: any) => x.id === block.restaurantId);
                            if (r) {
                              imgUrl = (r.images && r.images.length > 0) ? r.images[0] : (r.photo_url || '');
                            }
                          }
                          if (!imgUrl && block.type === ItineraryBlockTypes.ACTIVITY) {
                            const resolvedActId = block.activityId;
                            const v = block.vendorId ? masterData.vendors?.find((x: any) => x.id === block.vendorId) : null;
                            const va = v?.vendor_activities?.find((x: any) => x.id === block.vendorActivityId) ||
                                       (resolvedActId ? v?.vendor_activities?.find((x: any) => Number(x.activity_id) === Number(resolvedActId)) : null);
                            const activityDetail = masterData.activities?.find((a: any) => Number(a.id) === Number(resolvedActId || va?.activity_id));
                            if (activityDetail) {
                              imgUrl = (activityDetail.images && activityDetail.images.length > 0) ? activityDetail.images[0] : '';
                            }
                          }
                        }

                        if (imgUrl) {
                          return (
                            <div className="relative group/img w-16 h-12 rounded-xl border border-neutral-200/80 overflow-hidden shadow-sm transition-all duration-300 hover:scale-105">
                              <img
                                 src={imgUrl}
                                 alt="Itinerary item"
                                 className="w-full h-full object-cover"
                              />
                              <button
                                onClick={() => handleUpdateBlockField(block.id, 'imageUrl', 'none')}
                                disabled={isLockedByOther}
                                className="absolute inset-0 bg-red-650/80 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 disabled:group-hover/img:opacity-0 transition-all text-[10px] font-extrabold uppercase tracking-wide disabled:pointer-events-none"
                              >
                                Remove
                              </button>
                            </div>
                          );
                        }

                        return (
                          <div className="flex items-center gap-2">
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
                            {block.imageUrl === 'none' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateBlockField(block.id, 'imageUrl', '')}
                                disabled={isLockedByOther}
                                className="text-[10px] font-extrabold text-emerald-800 hover:text-emerald-950 hover:underline px-2 py-1 uppercase tracking-wider transition-all"
                              >
                                Restore Default
                              </button>
                            )}
                          </div>
                        );
                      })()}

                      {/* Binder Control */}
                      {(BINDABLE_BLOCK_TYPES as readonly ItineraryBlockType[]).includes(block.type) && (() => {
                        const binding = getBindingDisplay(block);
                        if (!binding) {
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveAssignment({ blockId: block.id, type: block.type });
                                setSearchTerm("");
                              }}
                              disabled={isLockedByOther}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-neutral-350 hover:border-emerald-800/50 hover:bg-emerald-50/20 text-[10px] font-extrabold text-neutral-600 hover:text-emerald-800 transition-all shadow-sm disabled:opacity-40"
                            >
                              <LinkIcon className="w-3.5 h-3.5 text-neutral-400" />
                              <span>Bind Provider</span>
                            </button>
                          );
                        }
                        return (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveAssignment({ blockId: block.id, type: block.type });
                                setSearchTerm("");
                              }}
                              disabled={isLockedByOther}
                              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 text-[10px] font-extrabold text-neutral-700 transition-all shadow-sm max-w-[200px] truncate disabled:opacity-50"
                              title="Edit binding"
                            >
                              {binding.icon}
                              <span className="truncate">{binding.name}</span>
                            </button>

                            {block.type === ItineraryBlockTypes.SLEEP && block.hotelId && (
                              <button
                                type="button"
                                onClick={() => handleCopyRatePrompt(block)}
                                className="p-2 hover:bg-neutral-100 text-neutral-500 hover:text-indigo-600 rounded-xl border border-neutral-200/60 shadow-sm transition-all"
                                title="Copy ChatGPT Rate Prompt"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })()}
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
          masterData={masterData}
          tripStatus={tripData?.status}
          dayCostOverrides={tripData?.dayCostOverrides}
        />
      </div>

      {/* Assignment Drawer Overlay */}
      {activeAssignment && mounted && createPortal((() => {
        const activeBlock = itinerary.find(b => b.id === activeAssignment.blockId);
        if (!activeBlock) return null;

        const dayNumber = activeBlock.dayNumber;
        let stayDate = "";
        if (arrivalDate) {
          try {
            const d = new Date(arrivalDate);
            d.setDate(d.getDate() + (dayNumber - 1));
            stayDate = d.toISOString().split('T')[0];
          } catch (e) {
            console.error(e);
          }
        }

        const calculateRoomPrice = (hotel: any, room: any, mealPlan: string, roomType: string) => {
          let baseRate = 0;
          let seasonLabel = "Standard";
          if (room.room_rates && room.room_rates.length > 0) {
            const applicableRates = room.room_rates.filter((r: any) => {
              if (!stayDate) return true;
              if (r.start_date) {
                if (stayDate < r.start_date) return false;
                if (r.end_date && stayDate > r.end_date) return false;
                return true;
              }
              return true;
            }).sort((a: any, b: any) => {
              const aHasDates = a.start_date ? 1 : 0;
              const bHasDates = b.start_date ? 1 : 0;
              return bHasDates - aHasDates;
            });
            
            const ratesToSearch = applicableRates.length > 0 ? applicableRates : room.room_rates;
            
            if (ratesToSearch.length > 0) {
              let prefix = 'dbl';
              if (roomType === 'Single') prefix = 'sgl';
              else if (roomType === 'Double' || roomType === 'Twin') prefix = 'dbl';
              else if (roomType === 'Triple') prefix = 'tpl';
              else if (roomType === 'Family') prefix = 'qud';

              const fieldName = `${prefix}_${mealPlan.toLowerCase()}_rate`;
              const matrixRateObj = ratesToSearch.find((r: any) => r[fieldName] !== undefined && r[fieldName] !== null && r[fieldName] > 0);
              
              if (matrixRateObj) {
                baseRate = matrixRateObj[fieldName];
                if (matrixRateObj.start_date) seasonLabel = `Rate applied`;
              } else {
                const fallbackFields = [`${prefix}_bb_rate`, `${prefix}_hb_rate`, `${prefix}_fb_rate`, `${prefix}_ai_rate`];
                let lowestRate = Infinity;
                let foundDate = false;
                
                ratesToSearch.forEach((r: any) => {
                  fallbackFields.forEach(ff => {
                    if (r[ff] !== undefined && r[ff] !== null && r[ff] > 0) {
                      if (r[ff] < lowestRate) {
                        lowestRate = r[ff];
                        if (r.start_date) foundDate = true;
                      }
                    }
                  });
                });
                
                if (lowestRate !== Infinity) {
                  baseRate = lowestRate;
                  if (foundDate) seasonLabel = `Rate applied`;
                } else {
                  baseRate = 0;
                }
              }
            }
          }
          return { total: baseRate, seasonLabel };
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-neutral-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md h-screen bg-white shadow-2xl animate-in slide-in-from-right duration-300 overflow-hidden flex flex-col">
              
              {/* Header */}
              <div className="p-6 border-b border-neutral-105 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-serif font-black text-emerald-900 uppercase tracking-wide">Assign Specialist</h4>
                    <p className="text-[10px] font-bold text-neutral-400 mt-0.5 uppercase tracking-wider">Provider Database for {activeAssignment.type.toUpperCase()} segments</p>
                  </div>
                  <button 
                    onClick={() => { setActiveAssignment(null); setSearchTerm(""); }} 
                    className="p-2 hover:bg-neutral-50 rounded-full transition-colors text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {activeAssignment.type === ItineraryBlockTypes.SLEEP && stayDate && (
                  <div className="mt-2.5 text-[10px] text-emerald-800 font-mono bg-emerald-50 border border-emerald-100/60 p-2 rounded-xl">
                    Day {dayNumber} Stay | Date: {stayDate}
                  </div>
                )}
              </div>

              {/* Scrollable Content */}
              <div className="p-6 flex-1 overflow-y-auto space-y-5">
                
                {/* Search Bar (non-hotel & non-restaurant types) */}
                {activeAssignment.type !== ItineraryBlockTypes.SLEEP && activeAssignment.type !== ItineraryBlockTypes.MEAL && (
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
                    <input
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder={`Search ${activeAssignment.type} database...`}
                      className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-800/10 focus:border-emerald-800 transition-all shadow-inner"
                    />
                  </div>
                )}

                {/* Hotel Search Form */}
                {activeAssignment.type === ItineraryBlockTypes.SLEEP && (
                  <div className="bg-neutral-50/50 p-4 rounded-2xl border border-neutral-200 shadow-sm space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1 block">City (Required)</label>
                        <input
                          value={hotelSearchCity}
                          onChange={e => setHotelSearchCity(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && hotelSearchCity.trim() && handleSearchHotels()}
                          placeholder="E.g. Colombo"
                          className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-emerald-800/10 focus:border-emerald-800 transition-all shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1 block">Hotel Name</label>
                        <input
                          value={hotelSearchName}
                          onChange={e => setHotelSearchName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && hotelSearchCity.trim() && handleSearchHotels()}
                          placeholder="Optional name"
                          className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-emerald-800/10 focus:border-emerald-800 transition-all shadow-sm"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleSearchHotels}
                      disabled={!hotelSearchCity.trim() || isSearchingHotels}
                      className="w-full py-2 bg-emerald-800 hover:bg-emerald-950 text-white text-xs font-bold uppercase tracking-wider rounded-xl disabled:opacity-50 transition-colors shadow-sm"
                    >
                      {isSearchingHotels ? "Searching..." : "Search Hotels"}
                    </button>
                  </div>
                )}

                {/* Restaurant Search Form */}
                {activeAssignment.type === ItineraryBlockTypes.MEAL && (
                  <div className="bg-neutral-50/55 p-4 rounded-2xl border border-neutral-200 shadow-sm space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1 block">City (Required)</label>
                        <input
                          value={restaurantSearchCity}
                          onChange={e => setRestaurantSearchCity(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && restaurantSearchCity.trim() && handleSearchRestaurants()}
                          placeholder="E.g. Colombo"
                          className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-emerald-800/10 focus:border-emerald-800 transition-all shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1 block">Restaurant Name</label>
                        <input
                          value={restaurantSearchName}
                          onChange={e => setRestaurantSearchName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && restaurantSearchCity.trim() && handleSearchRestaurants()}
                          placeholder="Optional name"
                          className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-emerald-800/10 focus:border-emerald-800 transition-all shadow-sm"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleSearchRestaurants}
                      disabled={!restaurantSearchCity.trim() || isSearchingRestaurants}
                      className="w-full py-2 bg-emerald-800 hover:bg-emerald-955 text-white text-xs font-bold uppercase tracking-wider rounded-xl disabled:opacity-50 transition-colors shadow-sm"
                    >
                      {isSearchingRestaurants ? "Searching..." : "Search Restaurants"}
                    </button>
                  </div>
                )}

                <div className="divide-y divide-neutral-100 border border-neutral-200/80 rounded-2xl overflow-hidden shadow-sm bg-white">
                  
                  {/* Hotel List */}
                  {activeAssignment.type === ItineraryBlockTypes.SLEEP && (() => {
                    const assignedHotelId = activeBlock.hotelId;
                    let dataToRender = hotelSearchResults !== null ? [...hotelSearchResults] : [];
                    if (assignedHotelId && !dataToRender.some(h => h.id === assignedHotelId)) {
                      const currentHotel = masterData.hotels.find((h: any) => h.id === assignedHotelId);
                      if (currentHotel) {
                        dataToRender = [currentHotel, ...dataToRender];
                      }
                    }

                    if (hotelSearchResults === null && !assignedHotelId) {
                      return <div className="p-8 text-center text-neutral-400 text-xs font-medium">Please search for a city to view available hotels.</div>;
                    }

                    if (dataToRender.length === 0) {
                      return <div className="p-8 text-center text-neutral-400 text-xs font-medium">No hotels found. Try adjusting your search.</div>;
                    }

                    return (
                      <div className="grid grid-cols-1 gap-4 p-4">
                        {dataToRender.map((h: any) => {
                          const isSelected = assignedHotelId === h.id;
                          const rooms = h.hotel_rooms || [];
                          
                          const applicableRates = rooms.flatMap((r: any) => {
                            if (!r.room_rates || r.room_rates.length === 0) return [];
                            return r.room_rates.filter((rr: any) => {
                              if (!stayDate) return true;
                              if (rr.start_date) {
                                if (stayDate < rr.start_date) return false;
                                if (rr.end_date && stayDate > rr.end_date) return false;
                                return true;
                              }
                              return true;
                            }).sort((a: any, b: any) => {
                              const aHasDates = a.start_date ? 1 : 0;
                              const bHasDates = b.start_date ? 1 : 0;
                              return bHasDates - aHasDates;
                            }).flatMap((rr: any) => {
                              return [
                                rr.sgl_bb_rate, rr.sgl_hb_rate, rr.sgl_fb_rate, rr.sgl_ai_rate,
                                rr.dbl_bb_rate, rr.dbl_hb_rate, rr.dbl_fb_rate, rr.dbl_ai_rate,
                                rr.tpl_bb_rate, rr.tpl_hb_rate, rr.tpl_fb_rate, rr.tpl_ai_rate,
                                rr.qud_bb_rate, rr.qud_hb_rate, rr.qud_fb_rate, rr.qud_ai_rate
                              ].filter(v => v && v > 0);
                            });
                          }).filter((rate: any) => rate && rate > 0);

                          const minRate = applicableRates.length > 0 ? Math.min(...applicableRates) : (h.base_rate || 0);

                          const amenities = [
                            { key: 'internet', icon: <Wifi className="w-3 h-3 text-neutral-400" />, label: 'WiFi' },
                            { key: 'outdoor_pool', icon: <Waves className="w-3 h-3 text-neutral-400" />, label: 'Pool' },
                            { key: 'wellness', icon: <HeartPulse className="w-3 h-3 text-neutral-400" />, label: 'Spa' },
                            { key: 'business_facility', icon: <Briefcase className="w-3 h-3 text-neutral-400" />, label: 'Business' },
                            { key: 'airport_shuttle', icon: <Plane className="w-3 h-3 text-neutral-400" />, label: 'Shuttle' },
                            { key: 'parking', icon: <Car className="w-3 h-3 text-neutral-400" />, label: 'Parking' },
                          ].filter(a => h[a.key]);

                          return (
                            <div key={h.id} className="space-y-3">
                              <button 
                                onClick={() => bindProvider(activeAssignment.blockId, 'hotelId', h.id)}
                                className={`w-full p-4 rounded-xl border text-left transition-all flex flex-col gap-3 ${
                                  isSelected 
                                    ? 'border-emerald-800 bg-emerald-50/10 shadow-sm ring-2 ring-emerald-800/10' 
                                    : 'border-neutral-200 bg-white hover:border-emerald-800/50'
                                }`}
                              >
                                <div className="flex justify-between items-start w-full">
                                  <div className="flex-1 min-w-0 pr-4">
                                    <p className="font-bold text-xs text-neutral-800 truncate">{h.name}</p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <MapPin size={10} className="text-neutral-400" />
                                      <span className="text-[9px] text-neutral-500 font-medium">{h.closest_city}</span>
                                    </div>
                                  </div>
                                  <div className="text-right flex flex-col items-end">
                                    <span className="text-[8px] font-black text-amber-600 uppercase tracking-tighter">Starting From</span>
                                    <span className="text-xs font-black text-neutral-800">${minRate}</span>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-1.5">
                                  {amenities.map(a => (
                                    <div key={a.key} className="flex items-center gap-1 px-2 py-0.5 bg-neutral-50 rounded-full border border-neutral-100">
                                      {a.icon}
                                      <span className="text-[8px] font-bold text-neutral-500">{a.label}</span>
                                    </div>
                                  ))}
                                </div>

                                {isSelected && (
                                  <div className="w-full flex items-center justify-center gap-1.5 py-1 bg-emerald-50/60 rounded-lg border border-emerald-250/20">
                                    <CheckCircle2 size={12} className="text-emerald-800" />
                                    <span className="text-[9px] font-black text-emerald-800 uppercase">Currently Assigned</span>
                                  </div>
                                )}
                              </button>

                              {isSelected && (
                                <div className="space-y-4 px-1 pb-4 pt-2">
                                  {(() => {
                                    const roomTypes = ['Single', 'Double', 'Twin', 'Triple', 'Family'];
                                    const currentAcc = (tripData?.accommodations || []).find(a => Number(a.nightIndex) === Number(activeBlock?.dayNumber)) || {} as any;
                                    const selectedRooms = currentAcc.selectedRooms || [];

                                    return (
                                      <div className="space-y-4">
                                        {roomTypes.map((rType) => {
                                          const reqId = rType;
                                          const stateKey = `${activeBlock?.id}-${reqId}`;
                                          const assignedRoom = selectedRooms.find((sr: any) => sr.reqId === reqId);
                                          const isReqMet = !!assignedRoom;
                                          
                                          const pendingState = pendingRoomState[stateKey] || {};
                                          const currentMealPlan = assignedRoom?.mealPlan || pendingState.mealPlan || 'BB';
                                          
                                          // Calculate a default suggestion based on travelers if not currently assigned
                                          let defaultCount = 0;
                                          if (!isReqMet) {
                                            const matchTravelers = (tripData?.travelers || []).filter(t => t.roomPreference === rType);
                                            if (matchTravelers.length > 0) {
                                              const roomCount = matchTravelers.reduce((acc, t) => {
                                                const validLinks = (t.sharedWithIds || []).filter(id => matchTravelers.some(mt => mt.id === id));
                                                return acc + (1 / (1 + validLinks.length));
                                              }, 0);
                                              defaultCount = Math.ceil(roomCount);
                                            }
                                          }
                                          const displayCount = assignedRoom?.quantity ?? pendingState.count ?? defaultCount ?? 0;

                                          return (
                                            <div key={reqId} className="border border-neutral-200 rounded-xl overflow-hidden shadow-sm bg-neutral-50/50">
                                              <div className="bg-neutral-100/80 px-3 py-2 border-b border-neutral-200 flex justify-between items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                  <span className="text-[10px] font-bold text-neutral-600 uppercase whitespace-nowrap">{rType} Rooms</span>
                                                  <input 
                                                    type="number" 
                                                    min="0" 
                                                    value={displayCount}
                                                    onChange={(e) => {
                                                      const newQty = parseInt(e.target.value) || 0;
                                                      if (assignedRoom) {
                                                        if (newQty === 0) {
                                                          // Remove room if qty goes to 0
                                                          const newSelected = selectedRooms.filter((sr: any) => sr.reqId !== reqId);
                                                          if (tripData) {
                                                            setTripData({
                                                              ...tripData,
                                                              accommodations: tripData.accommodations.map(a => Number(a.nightIndex) === Number(activeBlock?.dayNumber) ? { ...a, selectedRooms: newSelected } : a)
                                                            });
                                                          }
                                                        } else {
                                                          // Update quantity
                                                          const newSelected = selectedRooms.map((sr: any) => sr.reqId === reqId ? { ...sr, quantity: newQty } : sr);
                                                          if (tripData) {
                                                            setTripData({
                                                              ...tripData,
                                                              accommodations: tripData.accommodations.map(a => Number(a.nightIndex) === Number(activeBlock?.dayNumber) ? { ...a, selectedRooms: newSelected } : a)
                                                            });
                                                          }
                                                        }
                                                      } else {
                                                        // Save pending quantity
                                                        setPendingRoomState(prev => ({ ...prev, [stateKey]: { ...prev[stateKey], count: newQty } }));
                                                      }
                                                    }}
                                                    className="w-16 text-xs font-bold text-center py-1 px-2 border border-neutral-300 rounded focus:border-emerald-800 outline-none bg-white text-neutral-800"
                                                  />
                                                </div>
                                                {isReqMet ? (
                                                  <span className="text-[9px] font-black text-emerald-855 px-1.5 py-0.5 bg-emerald-50 rounded tracking-tight">ASSIGNED</span>
                                                ) : (
                                                  <span className="text-[9px] font-bold text-neutral-450 px-1.5 py-0.5 bg-neutral-100 rounded border border-neutral-200 tracking-tight">UNASSIGNED</span>
                                                )}
                                              </div>

                                              {displayCount > 0 && (
                                                <div className="p-2 space-y-2">
                                                  {/* Assigned Room Meal Plan Toggle Header */}
                                                  <div className="flex bg-neutral-200/50 p-1 rounded-xl gap-1 mb-2">
                                                    {(['BB', 'HB', 'FB', 'AI'] as const).map(mp => (
                                                      <button
                                                        key={mp}
                                                        onClick={(e) => {
                                                          e.preventDefault();
                                                          e.stopPropagation();
                                                          if (assignedRoom) {
                                                            const newSelected = selectedRooms.map((sr: any) => sr.reqId === reqId ? { ...sr, mealPlan: mp } : sr);
                                                            if (tripData) {
                                                              setTripData({
                                                                ...tripData,
                                                                accommodations: tripData.accommodations.map(a => Number(a.nightIndex) === Number(activeBlock?.dayNumber) ? { ...a, selectedRooms: newSelected } : a)
                                                              });
                                                            }
                                                          } else {
                                                            // Save pending meal plan
                                                            setPendingRoomState(prev => ({ ...prev, [stateKey]: { ...prev[stateKey], mealPlan: mp } }));
                                                          }
                                                        }}
                                                        className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${currentMealPlan === mp ? 'bg-white text-emerald-800 shadow-sm ring-1 ring-black/5' : 'text-neutral-500 hover:text-neutral-700'}`}
                                                      >
                                                        {mp}
                                                      </button>
                                                    ))}
                                                  </div>

                                                  <div className="grid grid-cols-1 gap-2">
                                                    {rooms.map((room: any) => {
                                                      const isRoomSelectedHere = assignedRoom?.roomId === room.id;
                                                      const pricing = calculateRoomPrice(h, room, currentMealPlan, rType);
                                                      const contractedPrice = pricing.total;
                                                      const agreedUnitPrice = contractedPrice * (1 + roomMarkup / 100);

                                                      return (
                                                        <button
                                                          key={room.id}
                                                          onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            const newSelected = [...selectedRooms.filter((sr: any) => sr.reqId !== reqId)];
                                                            newSelected.push({
                                                              reqId: reqId,
                                                              roomId: room.id,
                                                              roomName: room.room_name,
                                                              roomStandard: room.room_standard,
                                                              quantity: displayCount,
                                                              contractedPrice: contractedPrice,
                                                              pricePerNight: agreedUnitPrice,
                                                              mealPlan: currentMealPlan
                                                            });
                                                            
                                                            // Also, update the main block's roomName and mealPlan with the primary selection for simplicity
                                                            updateBlock(activeAssignment.blockId, {
                                                              roomName: room.room_name,
                                                              mealPlan: currentMealPlan
                                                            });

                                                            if (tripData) {
                                                              setTripData({
                                                                ...tripData,
                                                                accommodations: tripData.accommodations.map(a => Number(a.nightIndex) === Number(activeBlock?.dayNumber) ? {
                                                                  ...a,
                                                                  selectedRooms: newSelected,
                                                                  roomId: room.id,
                                                                  roomName: room.room_name,
                                                                  mealPlan: currentMealPlan
                                                                } : a)
                                                              });
                                                            }
                                                          }}
                                                          className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all bg-white ${isRoomSelectedHere ? 'border-emerald-800 bg-emerald-50/5 ring-1 ring-emerald-800/10' : 'border-neutral-200 hover:border-neutral-350'}`}
                                                        >
                                                          <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                              <p className="text-xs font-bold text-neutral-800">{room.room_name}</p>
                                                              <span className="text-[9px] px-1.5 py-0.5 bg-neutral-100 text-neutral-500 rounded font-bold uppercase tracking-tighter">Max {room.max_guests} Pax</span>
                                                            </div>
                                                            <div className="flex flex-col mt-1 space-y-0.5">
                                                              <span className="text-[9px] text-neutral-400 font-medium uppercase tracking-tighter">{room.room_standard} &bull; {pricing.seasonLabel}</span>
                                                            </div>
                                                          </div>
                                                          <div className="text-right">
                                                            <p className="text-xs font-black text-neutral-850">${agreedUnitPrice?.toFixed(0)}</p>
                                                            <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-tighter line-through">${contractedPrice?.toFixed(0)} Base</p>
                                                            <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-tighter">Per Night</p>
                                                          </div>
                                                        </button>
                                                      );
                                                    })}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    );
                                  })()}
                                  {rooms.length === 0 && (
                                    <span className="text-[10px] text-neutral-400 italic">No room categories configured.</span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Activity List */}
                  {activeAssignment.type === ItineraryBlockTypes.ACTIVITY && (() => {
                    const resolvedActId = activeBlock.activityId;

                    const baseActivity = masterData.activities.find((a: any) => Number(a.id) === Number(resolvedActId));

                    const matchedActivities = searchTerm.trim()
                      ? masterData.activities.filter((act: any) => {
                          const actName = act.activity_name?.toLowerCase() || '';
                          const locName = act.location_name?.toLowerCase() || '';
                          const dist = act.district?.toLowerCase() || '';
                          const searchLower = searchTerm.toLowerCase();
                          return actName.includes(searchLower) || locName.includes(searchLower) || dist.includes(searchLower);
                        })
                      : [];

                    const specializedVendorsUnfiltered = masterData.vendors.filter((v: any) =>
                      v.vendor_activities?.some((va: any) => 
                        (activeBlock.vendorActivityId && va.id === activeBlock.vendorActivityId) ||
                        (resolvedActId && Number(va.activity_id) === Number(resolvedActId))
                      )
                    );

                    const specializedVendors = specializedVendorsUnfiltered.filter((v: any) =>
                      (filteredMasterData as any[]).some((fv: any) => fv.id === v.id)
                    );

                    const otherVendors = (filteredMasterData as any[]).filter((v: any) =>
                      !specializedVendorsUnfiltered.some((sv: any) => sv.id === v.id)
                    );

                    return (
                      <>
                        {baseActivity && (
                          <div className="mx-4 mt-4 p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-white rounded-xl shadow-sm border border-neutral-100">
                                <Compass className="w-5 h-5 text-emerald-800" />
                              </div>
                              <div className="flex-1">
                                <h5 className="text-xs font-bold text-neutral-800">{baseActivity.activity_name}</h5>
                                <p className="text-[9px] text-neutral-500 font-bold mt-0.5 flex items-center gap-1">
                                  <MapPin size={10} /> {baseActivity.location_name}, {baseActivity.district}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {matchedActivities.length > 0 && (
                          <>
                            <div className="p-3 bg-neutral-50 text-[9px] font-bold text-neutral-400 uppercase tracking-widest border-y mt-4">
                              Matching Activities ({matchedActivities.length})
                            </div>
                            <div className="grid grid-cols-1 gap-3 p-4">
                              {matchedActivities.map((act: any) => {
                                const isActSelected = activeBlock.activityId === act.id;
                                return (
                                  <button
                                    key={'act-' + act.id}
                                    type="button"
                                    onClick={() => {
                                      bindProvider(activeAssignment.blockId, 'activityId', act.id);
                                    }}
                                    className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                                      isActSelected
                                        ? 'border-orange-500 bg-orange-50/10'
                                        : 'border-neutral-200 bg-white hover:border-orange-300'
                                    }`}
                                  >
                                    <div className="flex-1">
                                      <p className="font-bold text-xs text-neutral-800">{act.activity_name}</p>
                                      <p className="text-[9px] font-bold text-neutral-400 mt-1 flex items-center gap-1">
                                        <MapPin size={10} /> {act.location_name}, {act.district}
                                      </p>
                                    </div>
                                    <div className="text-[8px] uppercase font-extrabold text-orange-600 px-2 py-1 bg-orange-50 rounded-md">
                                      {isActSelected ? 'Linked' : 'Link Activity'}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}

                        <div className="p-3 bg-neutral-50 text-[9px] font-bold text-neutral-400 uppercase tracking-widest border-y mt-4">
                          Specialist Vendors ({specializedVendors.length})
                        </div>

                        <div className="grid grid-cols-1 gap-3 p-4">
                          {specializedVendors.map((v: any) => {
                            const isSelected = activeBlock.vendorId === v.id;
                            const va = v.vendor_activities?.find((a: any) => a.id === activeBlock.vendorActivityId) ||
                                       v.vendor_activities?.find((a: any) => Number(a.activity_id) === Number(resolvedActId));
                            return (
                              <button 
                                key={v.id} 
                                type="button"
                                onClick={() => bindProvider(activeAssignment.blockId, 'vendorId', v.id)}
                                className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                                  isSelected 
                                    ? 'border-emerald-800 bg-emerald-50/10' 
                                    : 'border-neutral-200 bg-white hover:border-emerald-800/30'
                                }`}
                              >
                                <div className="flex-1">
                                  <p className="font-bold text-xs text-neutral-800">{v.name}</p>
                                  {va && <p className="text-[10px] font-extrabold text-emerald-800 mt-1">${va.vendor_price?.toLocaleString()}</p>}
                                </div>
                                <ChevronRight size={16} className={isSelected ? 'text-emerald-800' : 'text-neutral-300'} />
                              </button>
                            );
                          })}
                        </div>

                        {otherVendors.length > 0 && (
                          <>
                            <div className="p-3 bg-neutral-50 text-[9px] font-bold text-neutral-400 uppercase tracking-widest border-y mt-2">
                              Other Matching Vendors ({otherVendors.length})
                            </div>
                            <div className="grid grid-cols-1 gap-3 p-4">
                              {otherVendors.map((v: any) => {
                                const isSelected = activeBlock.vendorId === v.id;
                                const va = v.vendor_activities?.find((a: any) => a.id === activeBlock.vendorActivityId) ||
                                           v.vendor_activities?.find((a: any) => Number(a.activity_id) === Number(resolvedActId));
                                return (
                                  <button 
                                    key={'other-' + v.id} 
                                    type="button"
                                    onClick={() => bindProvider(activeAssignment.blockId, 'vendorId', v.id)}
                                    className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between opacity-80 hover:opacity-100 ${
                                      isSelected 
                                        ? 'border-emerald-800 bg-emerald-50/10' 
                                        : 'border-neutral-200 bg-white hover:border-emerald-800/30'
                                    }`}
                                  >
                                    <div className="flex-1">
                                      <p className="font-bold text-xs text-neutral-800">{v.name}</p>
                                      {va && <p className="text-[10px] font-extrabold text-emerald-800 mt-1">${va.vendor_price?.toLocaleString()}</p>}
                                      <p className="text-[9px] font-bold text-neutral-400 mt-1 flex items-center gap-1"><MapPin size={10} /> {v.address || 'Address Unknown'}</p>
                                    </div>
                                    <div className="text-[8px] uppercase font-extrabold text-neutral-400 px-2 py-1 bg-neutral-100 rounded-md">General</div>
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </>
                    );
                  })()}

                  {/* Travel List */}
                  {activeAssignment.type === ItineraryBlockTypes.TRAVEL && (() => {
                    const providers = (filteredMasterData as any).providers || [];
                    const drivers = (filteredMasterData as any).drivers || [];
                    
                    return (
                      <>
                        <div className="p-3 bg-neutral-50 text-[9px] font-bold text-neutral-400 uppercase tracking-widest border-b">
                          Transport Providers
                        </div>
                        <div className="grid grid-cols-1 gap-3 p-4">
                          {providers.map((tp: any) => {
                            const isSelected = activeBlock.transportId === tp.id;
                            return (
                              <div key={tp.id} className="space-y-2">
                                <button 
                                  type="button"
                                  onClick={() => bindProvider(activeAssignment.blockId, 'transportId', tp.id)}
                                  className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                                    isSelected 
                                      ? 'border-sky-600 bg-sky-50/30 ring-1 ring-sky-500/10' 
                                      : 'border-neutral-200 bg-white hover:border-sky-450'
                                  }`}
                                >
                                  <div>
                                    <p className="font-bold text-xs text-neutral-805">{tp.name}</p>
                                    <p className="text-[9px] text-neutral-400 uppercase font-bold tracking-tight">{tp.transport_vehicles?.length || 0} Assets Available</p>
                                  </div>
                                  {isSelected && <div className="w-2 h-2 bg-sky-550 rounded-full" />}
                                </button>

                                {isSelected && tp.transport_vehicles && tp.transport_vehicles.length > 0 && (
                                  <div className="bg-neutral-50 rounded-2xl p-3 space-y-3 border border-neutral-200 mx-1 shadow-inner">
                                    <div className="grid grid-cols-1 gap-2">
                                      {tp.transport_vehicles.map((v: any) => {
                                        const isVehicleSelected = activeBlock.vehicleId === v.id;
                                        return (
                                          <button
                                            key={v.id}
                                            type="button"
                                            onClick={() => {
                                              const updates: Partial<InternalItineraryBlock> = {
                                                vehicleId: v.id,
                                                transportId: tp.id,
                                                transportRateType: 'day',
                                                transportQuantity: 1
                                              };
                                              if (v.with_driver) {
                                                updates.driverId = undefined;
                                              }
                                              updateBlock(activeAssignment.blockId, updates);
                                            }}
                                            className={`w-full p-3 rounded-xl border text-left transition-all flex flex-col gap-2 shadow-sm ${
                                              isVehicleSelected
                                                ? 'bg-white border-sky-500 ring-1 ring-sky-500/10'
                                                : 'bg-white/70 border-neutral-100 hover:border-sky-400/30'
                                            }`}
                                          >
                                            <div className="flex justify-between items-start w-full">
                                              <div className="flex-1">
                                                <p className="text-xs font-bold text-neutral-800">{v.make_and_model || v.vehicle_type}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                  <span className="text-[9px] bg-neutral-150 px-1.5 py-0.5 rounded text-neutral-500 font-bold uppercase tracking-wider">{v.vehicle_number}</span>
                                                  {v.with_driver && <span className="text-[9px] bg-green-50 px-1.5 py-0.5 rounded text-green-600 font-bold uppercase">Incl. Driver</span>}
                                                </div>
                                              </div>
                                              <div className="text-right shrink-0">
                                                <p className="text-[10px] font-extrabold text-emerald-805">${v.day_rate?.toLocaleString()}<span className="text-[9px] text-neutral-400 font-normal">/day</span></p>
                                              </div>
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className="p-3 bg-neutral-50 text-[9px] font-bold text-neutral-400 uppercase tracking-widest border-y mt-2">
                          Chauffeur Database
                        </div>
                        <div className="grid grid-cols-1 gap-3 p-4">
                          {drivers.map((d: any) => {
                            const isSelected = activeBlock.driverId === d.id;
                            return (
                              <button 
                                key={d.id} 
                                type="button"
                                onClick={() => updateBlock(activeAssignment.blockId, { driverId: d.id })}
                                className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                                  isSelected 
                                    ? 'border-sky-500 bg-sky-50/20' 
                                    : 'border-neutral-200 bg-white hover:border-sky-400'
                                }`}
                              >
                                <div>
                                  <p className="font-bold text-xs text-neutral-800">{d.first_name} {d.last_name}</p>
                                  <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-tight">Professional Driver</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-extrabold text-emerald-805">${d.per_day_rate?.toLocaleString()}<span className="text-[9px] text-neutral-400 font-normal">/day</span></p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}

                  {/* Restaurant List */}
                  {activeAssignment.type === ItineraryBlockTypes.MEAL && (() => {
                    const assignedRestaurantId = activeBlock.restaurantId;
                    let dataToRender = restaurantSearchResults !== null ? [...restaurantSearchResults] : [];
                    if (assignedRestaurantId && !dataToRender.some(r => r.id === assignedRestaurantId)) {
                      const currentRestaurant = masterData.restaurants.find((r: any) => r.id === assignedRestaurantId);
                      if (currentRestaurant) {
                        dataToRender = [currentRestaurant, ...dataToRender];
                      }
                    }

                    if (restaurantSearchResults === null && !assignedRestaurantId) {
                      return <div className="p-8 text-center text-neutral-400 text-xs font-medium">Please search for a city to view available restaurants.</div>;
                    }

                    if (dataToRender.length === 0) {
                      return <div className="p-8 text-center text-neutral-400 text-xs font-medium">No restaurants found. Try adjusting your search.</div>;
                    }
                    
                    return (
                      <div className="grid grid-cols-1 gap-4 p-4">
                        {dataToRender.map((r: any) => {
                          const isSelected = assignedRestaurantId === r.id;
                          return (
                            <div key={r.id} className="space-y-3">
                              <button 
                                type="button"
                                onClick={() => bindProvider(activeAssignment.blockId, 'restaurantId', r.id)}
                                className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                                  isSelected 
                                    ? 'border-emerald-800 bg-emerald-50/10' 
                                    : 'border-neutral-200 bg-white hover:border-emerald-800/30'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-xs text-neutral-800">{r.name}</p>
                                    {r.city && <span className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 text-neutral-500 rounded text-[8px] uppercase font-bold tracking-tight">{r.city}</span>}
                                  </div>
                                  <div className="text-[9px] text-neutral-400 font-bold uppercase tracking-tight mt-1 flex flex-wrap gap-2 items-center">
                                    <span>{r.cuisine_type || 'General'} Cuisine</span>
                                    <span>&bull;</span>
                                    <span>{r.is_buffet ? 'Buffet Available' : 'A La Carte Only'}</span>
                                    {r.total_capacity && (
                                      <>
                                        <span>&bull;</span>
                                        <span>{r.total_capacity} Pax Capacity</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                {isSelected && <div className="w-2 h-2 bg-emerald-800 rounded-full" />}
                              </button>
                              
                              {isSelected && (
                                <div className="bg-neutral-50 rounded-2xl p-3 grid grid-cols-1 gap-3 border border-neutral-100 mx-1">
                                  <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-neutral-100">
                                    <span className="text-xs font-bold text-neutral-600 px-2">Pax Count</span>
                                    <input 
                                      type="number" 
                                      min="1"
                                      className="w-16 text-center text-xs font-bold bg-neutral-50 border border-neutral-200 rounded-md py-1 outline-none focus:border-emerald-800"
                                      value={activeBlock.restaurantQuantity || adults || 1}
                                      onChange={(e) => updateBlock(activeAssignment.blockId, { restaurantQuantity: parseInt(e.target.value) || 1 })}
                                    />
                                  </div>
                                  <div className="grid grid-cols-1 gap-2">
                                    {[
                                      { id: 'breakfast', label: 'Breakfast', active: r.has_breakfast, price: r.breakfast_rate_per_head },
                                      { id: 'lunch', label: 'Lunch', active: r.has_lunch, price: r.lunch_rate_per_head },
                                      { id: 'dinner', label: 'Dinner', active: r.has_dinner, price: r.dinner_rate_per_head }
                                    ].filter(m => m.active).map(meal => {
                                      const contractedRate = meal.price || 0;
                                      const markupPercent = markups.restaurant_markup ?? 10;
                                      const agreedPrice = contractedRate * (1 + markupPercent / 100);
                                      return (
                                        <button 
                                          key={meal.id} 
                                          type="button"
                                          onClick={() => updateBlock(activeAssignment.blockId, { mealType: meal.label, contractedPrice: contractedRate, agreedPrice: agreedPrice })}
                                          className={`p-3 rounded-xl flex items-center justify-between text-xs font-bold ${
                                            activeBlock.mealType === meal.label 
                                              ? 'bg-white border-emerald-800 border shadow-sm' 
                                              : 'bg-white/50 border-transparent hover:border-neutral-200 border'
                                          }`}
                                        >
                                          <span>{meal.label}</span>
                                          <span className="text-emerald-800">${agreedPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Guide List */}
                  {activeAssignment.type === ItineraryBlockTypes.GUIDE && (() => {
                    const guidesList = (filteredMasterData as any[]) || [];
                    return (
                      <div className="grid grid-cols-1 gap-4 p-4">
                        {guidesList.map((g: any) => {
                          const isSelected = activeBlock.guideId === g.id;
                          return (
                            <button 
                              key={g.id} 
                              type="button"
                              onClick={() => bindProvider(activeAssignment.blockId, 'guideId', g.id)}
                              className={`p-4 rounded-xl border text-left transition-all flex flex-col gap-2 ${
                                isSelected 
                                  ? 'border-amber-500 bg-amber-50/10' 
                                  : 'border-neutral-200 bg-white hover:border-amber-400'
                              }`}
                            >
                              <div className="flex justify-between items-start w-full">
                                <div>
                                  <p className="font-bold text-xs text-neutral-800">{g.first_name} {g.last_name}</p>
                                  <p className="text-[9px] text-neutral-500 font-mono mt-0.5">{g.license_id ? `Lic: ${g.license_id}` : 'Professional Guide'}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-extrabold text-emerald-850">${g.per_day_rate || 0}<span className="text-[9px] text-neutral-400 font-normal">/day</span></p>
                                </div>
                              </div>
                              {g.languages && g.languages.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {g.languages.map((l: string) => (
                                    <span key={l} className="px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded text-[8px] font-bold uppercase tracking-tight">{l}</span>
                                  ))}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* No Results Check */}
                  {(() => {
                    const noResults = activeAssignment.type === ItineraryBlockTypes.TRAVEL
                      ? (((filteredMasterData as any).providers?.length || 0) === 0 && ((filteredMasterData as any).drivers?.length || 0) === 0)
                      : ((filteredMasterData as any[]) || []).length === 0;

                    if (noResults) {
                      return (
                        <div className="p-12 text-center text-neutral-400 italic text-xs">
                          No providers found matching "{searchTerm}"
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
 
               {/* Finish Drawer Footer */}
               <div className="p-6 sticky bottom-0 bg-white border-t border-neutral-100 flex gap-3">
                 <button
                   type="button"
                   onClick={() => {
                     const block = itinerary.find(b => b.id === activeAssignment.blockId);
                     if (block) {
                       if (tripData && block.type === ItineraryBlockTypes.SLEEP) {
                         const newAccs = (tripData.accommodations || []).filter(a => Number(a.nightIndex) !== Number(block.dayNumber));
                         setTripData({
                           ...tripData,
                           accommodations: newAccs
                         });
                       }
                     }
                     updateBlock(activeAssignment.blockId, {
                       hotelId: undefined,
                       hotelName: undefined,
                       roomName: undefined,
                       mealPlan: 'BB',
                       baseRoomRate: undefined,
                       agreedPrice: undefined,
                       vendorId: undefined,
                       activityId: undefined,
                       vendorActivityId: undefined,
                       contractedPrice: undefined,
                       transportId: undefined,
                       vehicleId: undefined,
                       driverId: undefined,
                       guideId: undefined,
                       restaurantId: undefined,
                       restaurantQuantity: undefined,
                       mealType: undefined,
                       transportRateType: undefined,
                       transportQuantity: undefined,
                       imageUrl: ''
                     });
                     setActiveAssignment(null);
                     setSearchTerm("");
                   }}
                   className="flex-1 flex items-center justify-center gap-2 py-3 text-red-500 hover:text-red-700 text-[10px] font-extrabold uppercase tracking-widest hover:bg-red-50/80 rounded-xl transition-all border border-red-100"
                 >
                   <Link2Off size={14} /> Clear Assignment
                 </button>
                 <button 
                   type="button"
                   onClick={() => { setActiveAssignment(null); setSearchTerm(""); }}
                   className="flex-1 py-3 bg-emerald-800 hover:bg-emerald-950 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                 >
                   <CheckCircle2 size={18} /> Finish Assignment
                 </button>
               </div>

            </div>
          </div>
        );
      })(), document.body)}
    </div>
  );
}
