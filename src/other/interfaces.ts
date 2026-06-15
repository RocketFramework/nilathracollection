import { TrackType, BasicStep, PrepareBasicSubStep, FinalStep, TravelStyle, Gender, RequestType, RequestStatus, ServiceScope, TripStatus, ItineraryBlockType } from '../types/types';
import { Activity } from '@/data/activities';

export interface ItineraryElements {
    hotel: boolean;
    activity: boolean;
    restaurant: boolean;
    transport: boolean;
    security: boolean;
    guide: boolean;
    driver: boolean;
}

export interface WizardState {
    track: TrackType;
    activeBasicStep: BasicStep;
    activePrepareSubStep: PrepareBasicSubStep;
    activeFinalStep: FinalStep;
    selectedElements: ItineraryElements;
    completedSteps: string[];
}

export interface TouristProfile {
    id: string; // UUID references users(id)
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    country: string | null;
    passport_number: string | null;
    address: string | null;
    adults: number;
    children: number;
    infants: number;
    arrival_date?: string | null;
    departure_date?: string | null;
    duration_days: number;
    budget_total: number;
    budget_per_person: number;
    travel_style: TravelStyle;
    departure_country: string | null;
    dietary_requirements?: string | null;
    medical_conditions?: string | null;
    accessibility_requirements?: string | null;
    language_preference: string;
    special_notes?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface TouristTeamMember {
    id: string; // UUID
    tour_id: string; // UUID
    tourist_id: string; // UUID references users(id)
    full_name: string;
    passport_number?: string | null;
    nationality?: string | null;
    date_of_birth?: string | null;
    gender?: Gender | null;
    dietary_preferences?: string | null;
    meal_preference: string;
    room_preference: string;
    shared_with_ids: string[]; // UUID[]
    medical_notes?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface TripRequest {
    id: string; // UUID
    tourist_id: string | null; // UUID references users(id)
    email: string | null;
    request_type: RequestType;
    status: RequestStatus;
    admin_assigned_to?: string | null; // UUID references users(id)
    created_at?: string;
    updated_at?: string;
}

export interface TouristActivity {
  id: number;
  category: string;
  activity_name: string;
  location_name: string;
  district: string;
  lat: number | null;
  lng: number | null;
  description: string;
  duration_hours: number;
  optimal_start_time: string | null;
  optimal_end_time: string | null;
  time_flexible: boolean;
  images: string[] | null;
}

export interface BlockComment {
    id: string;
    role: 'agent' | 'tourist';
    text: string;
    timestamp: string;
}

export interface TripProfile {
    adults: number;
    children: number;
    infants: number;
    arrivalDate: string;
    departureDate: string;
    durationDays: number;
    budgetTotal: number;
    budgetPerPerson: number;
    travelStyle: TravelStyle;
    departureCountry?: string;
    specialConditions: {
        dietary: string;
        medical: string;
        accessibility: string;
        language: string;
        occasion: string;
    };
}

export interface TripSummary {
    totalCities: number;
    totalDistanceKm: number;
    totalActivities: number;
    activityTypeMix: { [key: string]: number };
}

export interface FlightBooking {
    id: string;
    numberOfSeats: number;
    departureCountry: string;
    preferredAirlines: string;
    travelClass: string;
    mealPreference: string;
    baggage: string;
    dateFlexibility: string;

    // Operational Tracking Fields
    airlineSelected: string;
    pnr: string;
    ticketNumber: string;
    bookingConfirmationUrl: string;
    paymentConfirmationUrl: string;
    ticketIssued: boolean;
    customerConfirmed: boolean;
    paymentReceived: boolean;
    refundableStatus: string;
}

export interface AccommodationBooking {
    id: string;
    nightIndex: number; // e.g. 1 for first night
    hotelId?: string; // Links to 'hotels' table
    hotelName: string;
    stayClass: string;
    address: string;
    mapLink: string;
    contactPerson: string;
    contactNumber: string;
    email: string;
    rateCardUrl: string;
    // Legacy flat bindings (kept for compatibility)
    roomId?: string;
    roomName?: string;
    roomStandard?: string;
    numberOfRooms?: number;
    pricePerNight?: number;
    mealPlan?: 'BB' | 'HB' | 'FB' | 'AI' | string;

    // Next-Gen Multi-Room Schema Sync
    selectedRooms?: {
        reqId?: string; // e.g. Single-0
        roomId: string; // The physical database UUID for the room category
        roomName: string;
        roomStandard: string;
        quantity: number;
        contractedPrice?: number; // The actual room rate from room_rates table
        pricePerNight: number; // Agreed unit price (Contracted * Markup)
        agreedTotal?: number; // The dynamically negotiated total rate for this exact room category
        mealPlan: 'BB' | 'HB' | 'FB' | 'AI' | string;
    }[];

    status: 'Tentative' | 'Confirmed';
    confirmationReference: string;
    paymentStatus: 'Pending' | 'Paid';
    cancellationDeadline: string;
    beddingConfiguration: string;
    specialRequests: string;
}

export interface TransportBooking {
    id: string;
    mode:
    // =========================
    // SMALL GROUP (1–3 Pax)
    // =========================
    | 'SMALL_BUDGET_SEDAN'
    | 'SMALL_PREMIUM_SEDAN'
    | 'SMALL_LUXURY_SUV'
    | 'SMALL_ULTRA_VIP_EUROPE_SEDAN'
    | 'SMALL_ULTRA_VIP_EUROPE_SUV'
    | 'SMALL_ULTRA_VIP_ARMORED_SUV'

    // =========================
    // MEDIUM GROUP (4–9 Pax)
    // =========================
    | 'MEDIUM_BUDGET_VAN'
    | 'MEDIUM_PREMIUM_HIGHROOF_VAN'
    | 'MEDIUM_LUXURY_EXECUTIVE_VAN'
    | 'MEDIUM_ULTRA_VIP_EUROPE_SUV_FLEET'
    | 'MEDIUM_ULTRA_VIP_EXECUTIVE_VAN'
    | 'MEDIUM_ULTRA_VIP_HELICOPTER_TRANSFER'

    // =========================
    // LARGE GROUP (10–25 Pax)
    // =========================
    | 'LARGE_BUDGET_MINI_COACH'
    | 'LARGE_PREMIUM_COACH'
    | 'LARGE_LUXURY_EXECUTIVE_COACH'
    | 'LARGE_ULTRA_VIP_EUROPE_COACH'
    | 'LARGE_ULTRA_VIP_EXECUTIVE_VAN_FLEET'
    | 'LARGE_ULTRA_VIP_PRIVATE_JET';
    supplier: string;
    vehicleNumber: string;
    driverName: string;
    driverContact: string;
    guideAssigned: boolean;
    guideDetails: string;
    status: 'Tentative' | 'Confirmed';
    bookingReference: string;
    paymentStatus: 'Pending' | 'Paid';
    contractUrl: string;
}

export interface ActivityBooking {
    id: string;
    activityId: number;
    activityData: Activity;
    status: 'Random / Walk-in' | 'Tentative Booking' | 'Confirmed' | 'Paid' | 'Voucher Issued';
    vendorId?: string;
    vendorPrice?: number;
    supplierContactPerson: string;
    paymentTerms: string;
    bookingReference: string;
    cutOffDate: string;
}

export interface InternalItineraryBlock {
    id: string;
    dayNumber: number;
    type: ItineraryBlockType;
    name: string;
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    bufferMins: number; // buffer inserted
    durationHours: number;

    // Flat text fields for simplified/Next-Gen wizard
    hotelName?: string;
    roomName?: string;
    mealPlan?: string;
    imageUrl?: string;

    // Binding IDs (Relational Links)
    hotelId?: string;
    vendorId?: string;
    activityId?: number;
    vendorActivityId?: string;
    contractedPrice?: number;
    agreedPrice?: number;
    transportId?: string;
    vehicleId?: string;
    driverId?: string;
    guideId?: string;
    restaurantId?: string;
    restaurantQuantity?: number;

    // Negotiation Flags
    driverMealIncluded?: boolean;
    driverAccIncluded?: boolean;
    guideRoomDiscount?: 'Free' | 'Half Price' | 'None' | '';
    parkingIncluded?: boolean;
    forceNegotiation?: boolean;
    alternativeSuppliers?: string[];

    linkedSupplierId?: string; // Legacy field - to be phased out or used as label
    confirmationStatus: 'Pending' | 'Confirmed';
    paymentStatus: 'Pending' | 'Paid';
    internalNotes: string;
    priceFinalized?: boolean;
    comments?: BlockComment[];
    touristNotes?: string; // Feedback from tourist
    locationName?: string;
    distance?: string;
    lat?: number;
    lng?: number;
    serviceProvider?: string;
    mealType?: string;
    transportRateType?: 'day' | 'km';
    transportQuantity?: number;
    weather?: string;
    baseRoomRate?: number;
}

export interface Traveler {
    id: string;
    fullName: string;
    passportNumber?: string;
    nationality?: string;
    dateOfBirth?: string;
    gender?: 'Male' | 'Female' | 'Other';
    dietaryPreferences?: string;
    mealPreference?: string;
    roomPreference?: 'Single' | 'Double' | 'Twin' | 'Triple' | 'Family';
    sharedWithIds?: string[];
    medicalNotes?: string;
}

export interface TripData {
    id?: string;
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    clientAddress?: string;
    clientPassport?: string;
    status: TripStatus;
    serviceScopes: ServiceScope[];
    profile: TripProfile;
    travelers?: Traveler[];

    // Default Trip-Wide Assignments
    defaultDriverId?: string;
    defaultGuideId?: string;
    defaultTransportId?: string;
    defaultVehicleId?: string;

    flights: FlightBooking[];
    accommodations: AccommodationBooking[];
    transports: TransportBooking[];
    activities: ActivityBooking[];
    itinerary: InternalItineraryBlock[];
    financials: any; // Imported in index
    summary?: TripSummary;
    manualSingle?: number;
    manualDouble?: number;
    manualTriple?: number;
    manualFamily?: number;
    dayCostOverrides?: Record<number, {
        hotel?: number;
        meals?: number;
        transport?: number;
        concierge?: number;
        agencyFeePercent?: number;
        agencyFee?: number;
        total?: number;
    }>;
}

export interface DraftItineraryVersion {
    id: string;
    tour_id: string;
    version_number: number;
    label: string | null;
    itinerary_data: InternalItineraryBlock[];
    created_by: string | null;
    created_at: string;
    parent_version_id: string | null;
    adults?: number;
    children?: number;
    infants?: number;
    single_rooms?: number;
    double_rooms?: number;
    triple_rooms?: number;
    family_rooms?: number;
}

export interface ItineraryLock {
    tour_id: string;
    locked_by: string;
    locked_at: string;
    expires_at: string;
}

export interface TourSharedEmail {
    id: string;
    tour_id: string;
    recipient_email: string;
    sender_email: string;
    subject: string;
    body_html: string;
    attachments: string[];
    shared_at: string;
    sent_by?: string;
}


