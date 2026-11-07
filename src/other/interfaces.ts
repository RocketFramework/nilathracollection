import { TrackType, BasicStep, PrepareBasicSubStep, FinalStep, TravelStyle, Gender, RequestType, RequestStatus, ServiceScope, TripStatus, ItineraryBlockType, VendorEmailStatus } from '../types/types';
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
    currency?: string;
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

    // Custom Contracted overrides
    customContractedUnitPrice?: number;
    customContractedTotalPrice?: number;
    customRateNote?: string;
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
    selectedRooms?: any[];

    // Binding IDs (Relational Links)
    hotelId?: string;
    vendorId?: string;
    activityId?: number;
    vendorActivityId?: string;
    contractedPrice?: number;
    agreedPrice?: number;
    headCount?: number;
    transportId?: string;
    vehicleId?: string;
    driverId?: string;
    guideId?: string;
    restaurantId?: string;
    restaurantQuantity?: number;
    quantity?: number;
    contractedTotalPrice?: number;
    isCustomPO?: boolean;

    // Room Standard Sizes & Counts
    single_room_id?: string;
    single_room_count?: number;
    double_room_id?: string;
    double_room_count?: number;
    twin_room_id?: string;
    twin_room_count?: number;
    triple_room_id?: string;
    triple_room_count?: number;
    family_room_id?: string;
    family_room_count?: number;

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
    transport_requirement_id?: string;
    transport_requirement?: any;
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
    ai_rules?: { generic: string; specific: string };
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
    attachments: string[] | any;
    shared_at: string;
    sent_by?: string;
    type?: string;
}

export interface TourRfqEmail {
    id: string;
    tour_id: string;
    recipient_email: string;
    sender_email: string;
    subject: string;
    body_html: string;
    attachments: any;
    sent_at: string;
    sent_by?: string;
    daily_activity_vendor_id?: string;
    po_block_id?: string;
    vendor_id?: string | null;
    vendor_name?: string | null;
    vendor_type?: 'hotel' | 'vendor' | 'transport_provider' | 'tour_guide' | 'driver' | 'restaurant' | null;
    status?: VendorEmailStatus;
    updated_at?: string | null;
    quoted_price?: number | null;
    notes?: string | null;
    selected_vendor?: boolean;
}

export interface DailyActivityVendor {
    id: string;
    tour_id?: string | null;
    vendor_id?: string | null;
    vendor_type?: 'hotel' | 'vendor' | 'transport_provider' | 'tour_guide' | 'driver' | 'restaurant' | null;
    vendor_name: string;
    to_email?: string | null;
    from_email?: string | null;
    subject?: string | null;
    email_content?: string | null;
    sent_date?: string | null;
    updated_at?: string | null;
    quoted_price?: number | null;
    currency?: string;
    status: VendorEmailStatus;
    selected_vendor?: boolean;
    notes?: string | null;
    created_by?: string | null;
    created_at?: string;
    booking_reference?: string | null;
    cancellation_deadline?: string | null;
    cancellation_policy?: string | null;
}

export interface DailyActivityVendorLink {
    id: string;
    daily_activity_id: string;
    daily_activity_vendor_id: string;
    tour_id?: string | null;
    itinerary_id?: string | null;
    activity_type?: string | null;
    created_at?: string;
    updated_at?: string;
}




export interface TourRfpEmail {

    id: string;
    tour_id: string;
    purchase_order_id?: string;
    recipient_email: string;
    sender_email: string;
    subject: string;
    body_html: string;
    attachments: any;
    sent_at: string;
    sent_by?: string;
    po_block_id?: string;
    vendor_id?: string | null;
    vendor_name?: string | null;
    vendor_type?: 'hotel' | 'vendor' | 'transport_provider' | 'tour_guide' | 'driver' | 'restaurant' | null;
    status?: VendorEmailStatus;
    updated_at?: string | null;
    quoted_price?: number | null;
    notes?: string | null;
    selected_vendor?: boolean;
}

export interface GenerateCustomerInvoiceOptions {
    discountAmount: number;
    taxAmount: number;
    agencyNote?: string;
    customServiceFee?: number;
    flightsQuotedSeparately?: boolean;
    flightsQuotedPrice?: number;
    billingDetails: {
        name: string;
        email: string;
        phone: string;
        address: string;
    };
    dueDate?: string;
}

export interface ProfitLossLineItem {
    dailyActivityId: string;
    dayNumber: number;
    date: string | null;
    title: string;
    vendorName: string;
    vendorType: string;
    quantity: number;
    contractedPrice: number; // agreed unit price with supplier (USD) (contracted_unit_price)
    contractedTotal: number; // contractedPrice * quantity (USD) (contracted_total_price)
    contractedNegotiated?: boolean; // false => contracted is a display-only estimate (charged x 0.9), not a saved negotiated value
    chargedPrice: number; // charged unit price from customer (USD) (charged_unit_price)
    chargedTotal: number; // chargedPrice * quantity (USD) (charged_total_price)
    invoicedQty: number; // invoiced quantity from supplier_invoice_items
    invoicedUnitPrice: number; // invoiced unit price from supplier_invoice_items (USD)
    invoicedTotal: number; // invoiced total price from supplier_invoice_items (USD)
    invoicedDiscrepancy: number; // invoicedTotal - contractedTotal
    margin: number; // chargedTotal - contractedTotal
    marginPercentage: number; // (margin / chargedTotal) * 100
    poNumber: string | null; // PO reference number
    supplierInvoiceNumber: string | null; // Supplier invoice reference number
    supplierInvoiceCurrency: string | null; // Original currency of supplier invoice
    supplierInvoiceRate: number | null; // Exchange rate of supplier invoice
    vendorPhone: string | null;
    vendorEmail: string | null;
    reservationContactName: string | null;
    reservationContactPhone: string | null;
    reservationContactEmail: string | null;
    salesContactName: string | null;
    salesContactPhone: string | null;
    salesContactEmail: string | null;
    hasDiscrepancy: boolean;
}

export interface ProfitLossCustomerItem {
    invoiceItemId: string;
    invoiceId: string;
    invoiceNumber: string;
    description: string;
    agreedAmount: number; // customer agreed amount (USD) - sum of linked daily activities
    invoicedAmount: number; // customer invoiced amount (USD) - from the customer invoice item
    paidAmount: number; // allocated customer payment (USD) - proportional from invoice payments
    discrepancy: number; // paidAmount - invoicedAmount
    dailyActivitySum: number; // sum of linked daily activities (USD) (same as agreedAmount)
    dailyActivityDiscrepancy: number; // invoicedAmount - dailyActivitySum (detects invoicing mismatch/delay)
    totalSupplierAgreed: number; // sum of supplier agreed cost for linked activities (USD)
    totalSupplierInvoiced: number; // sum of supplier invoiced cost for linked activities (USD)
    linkedActivities: {
        id: string;
        dayNumber: number;
        title: string;
        chargedTotal: number;
    }[];
    hasDiscrepancy: boolean;
}

export interface ProfitLossSummary {
    totalCustomerAgreed: number;
    totalCustomerInvoiced: number;
    totalCustomerPaid: number;
    totalCustomerPaidLkr: number; // sum of each customer payment converted to LKR with its own saved rate
    totalSupplierPaidLkr: number; // sum of each supplier payment converted to LKR with its own saved rate
    totalSupplierAgreed: number;
    totalSupplierInvoiced: number;
    totalSupplierPaid: number;
    totalMiscExpenses: number;
    netAgreedProfit: number;
    netActualProfit: number;
    customerPaymentExchangeRate: number;
}

export interface TourDailyDriver {
    id?: string;
    tour_id?: string;
    tour_itinerary_id?: string;
    day_number: number;
    driver_id: string;
    per_day_rate: number;
    accommodation_cost: number;
    meal_cost: number;
    other_allowance: number;
    notes?: string;
    created_at?: string;
    updated_at?: string;
}

export interface ITransportProviderOnboardingInput {
    id?: string;
    name: string;
    nic_number: string;
    phone: string;
    email: string;
    address?: string;
    contact_person?: string;
    sltda_registered_driver?: boolean;
    onboarding_code?: string;
    approval_status?: string;
    approved_by?: string;
    approved_at?: string;
    bank_name?: string;
    branch_name?: string;
    account_name?: string;
    account_number?: string;
    swift_code?: string;
    vehicles?: {
        id?: string;
        vehicle_type: string;
        make?: string;
        model?: string;
        year_of_manufacture?: number;
        vehicle_number?: string;
        max_seat_capacity?: number;
        km_rate?: number;
        day_rate?: number;
        max_km_per_day?: number;
        additional_km_rate?: number;
        with_driver?: boolean;
        image_url?: string;
        approval_status?: string;
    }[];
}

export interface ITourGuideOnboardingInput {
    id?: string;
    first_name: string;
    last_name?: string;
    nic_number: string;
    sltda_registration_number: string;
    sltda_id_image_url?: string;
    phone: string;
    email?: string;
    address?: string;
    city?: string;
    district?: string;
    languages?: string[];
    german_proficiency?: boolean;
    french_proficiency?: boolean;
    experience_years?: number;
    daily_rate?: number;
    onboarding_code?: string;
    approval_status?: string;
    approved_by?: string;
    approved_at?: string;
    bank_name?: string;
    branch_name?: string;
    account_name?: string;
    account_number?: string;
    swift_code?: string;
}

export interface IActivityBookingItem {
    id: string;
    booking_id: string;
    activity_id: number;
    booking_date: string;
    preferred_time_slot?: string | null;
    adults: number;
    children: number;
    infants: number;
    item_price?: number | null;
    status: string;
    assigned_vendor_id?: string | null;
    agreed_vendor_price?: number | null;
    assigned_at?: string | null;
    activity?: any;
    vendor?: any;
}

export interface IActivityBooking {
    id: string;
    booking_number: string;
    tourist_id: string;
    total_price?: number | null;
    currency: string;
    status: string;
    admin_notes?: string | null;
    created_at?: string;
    updated_at?: string;
    items?: IActivityBookingItem[];
    tourist_profile?: any;
    user?: any;
}

export interface WeatherReportItem {
    location: string;
    category: 'seaside' | 'inland';
    swimmingRating: number; // 0 to 5, can be 4.5
    activityRating: number; // 0 to 5, Snorkelling for seaside, Outdoor Activities for inland
    weatherReliabilityRating: number; // 0 to 5
    monsoonConcern: 'Low' | 'Moderate' | 'Moderate-high' | 'High';
    overallTripAdvice: string;
}

export interface WeatherReportData {
    periodLabel: string; // e.g., "For 10–16 October" or "For October"
    monthName: string;
    items: WeatherReportItem[];
}

export interface ICommissionRuleConfig {
    poolPercentage: number; // % of Declared Gross Profit (e.g. 10)
    maxCeilingPoolPercentage: number; // Used in BASE_WITH_CEILING mode (e.g. 15)
    directSharePercentage: number; // % of Pool (e.g. 70)
    leadershipSharePercentage: number; // % of Pool (e.g. 30)
    teamDevSharePercentage: number; // % of Pool (e.g. 0 to 10; Direct + Leadership + TeamDev <= 100)
    leadershipTierWeights: {
        tier1: number; // % of Leadership Pool for Direct Mentor / Line Supervisor (e.g. 60)
        tier2: number; // % of Leadership Pool for Next-Level Operational Leader (e.g. 25)
        tier3: number; // % of Leadership Pool for Exec / Principal SPOC (e.g. 15)
    };
    performanceMultipliers: {
        below: number; // e.g. 0.5
        meets: number; // e.g. 1.0
        exceeds: number; // e.g. 1.2
        exceptional: number; // e.g. 1.5
    };
    multiplierCapMode: 'RESERVE_NORMALIZED' | 'BASE_WITH_CEILING';
    excellenceReserveRatio: number; // e.g. 0.20 (20% of sub-pool reserved for >1.0x in RESERVE_NORMALIZED mode)
    enablePerEmployeeCap: boolean; // Enforces a hard USD ceiling per employee per tour
    roleMaxCapUsd: Record<string, number>; // Default max USD payout per tour by role (e.g. agent: 350, senior_agent: 500)
}

export interface ICommissionContributorInput {
    id: string;
    name: string;
    role: string;
    roleLabel: string;
    sharePercentage: number; // % of Direct Pool (must sum to 100 across contributors)
    ratingTier: 'below' | 'meets' | 'exceeds' | 'exceptional';
    customMultiplier?: number;
    maxCapUsd?: number | null; // Optional per-agent USD cap override on this tour
}

export interface ICommissionLeaderInput {
    id: string;
    name: string;
    role: string;
    roleLabel: string;
    tier: 1 | 2 | 3;
    hasActiveContribution: boolean; // Anti-MLM gate: must have active tour sign-off / review / mentoring
    contributionEvidence: string;
    ratingTier: 'below' | 'meets' | 'exceeds' | 'exceptional';
    overrideSharePercentage?: number | null; // Optional Admin override of Leadership Pool %
    overrideJustification?: string;
    maxCapUsd?: number | null; // Optional per-leader USD cap override on this tour
}

export interface ITeamDevRecipientInput {
    id: string;
    name: string;
    role: string;
    roleLabel: string;
    menteesQualifiedCount: number;
    isEligible: boolean;
    evidence: string;
}

export interface ICommissionSimulationInput {
    tourLabel: string;
    tourId?: string | null;
    customerRevenueUsd: number;
    systemDirectExpensesUsd: number;
    declaredGrossProfitUsd: number; // Authoritative entered Gross Profit for commission
    useDeclaredGrossProfit: boolean;
    declaredGrossProfitNotes?: string;
    exchangeRateLkr: number;
    isTourCompleted: boolean;
    isCancelled: boolean;
    rules: ICommissionRuleConfig;
    directContributors: ICommissionContributorInput[];
    leadershipChain: ICommissionLeaderInput[];
    teamDevRecipient?: ITeamDevRecipientInput | null;
}

export interface ICommissionAllocationBreakdown {
    recipientId: string;
    recipientName: string;
    role: string;
    roleLabel: string;
    allocationType: 'DIRECT' | 'LEADERSHIP_TIER_1' | 'LEADERSHIP_TIER_2' | 'LEADERSHIP_TIER_3' | 'TEAM_DEVELOPMENT';
    sharePercentageOfSubPool: number;
    ratingTier: string;
    appliedMultiplier: number;
    baseAmountUsd: number;
    uncappedAmountUsd: number;
    appliedCapUsd: number | null;
    cappedExcessReturnedUsd: number;
    finalAmountUsd: number;
    finalAmountLkr: number;
    effectiveShareOfTotalPoolPct: number;
    eligibilityStatus: 'ELIGIBLE' | 'BLOCKED_DOUBLE_COUNT' | 'BLOCKED_PASSIVE_NO_CONTRIBUTION' | 'OVERRIDE_APPLIED';
    notes: string;
}

export interface ICommissionSimulationResult {
    status: 'Not Eligible' | 'Calculated';
    ineligibilityReason?: string;
    customerRevenueUsd: number;
    systemDirectExpensesUsd: number;
    systemCalculatedGrossProfitUsd: number;
    declaredGrossProfitUsd: number;
    effectiveGrossProfitUsd: number;
    grossMarginPct: number;
    exchangeRateLkr: number;
    baseCommissionPoolUsd: number;
    hardCapCeilingPoolUsd: number;
    directSubPoolUsd: number;
    leadershipSubPoolUsd: number;
    teamDevSubPoolUsd: number;
    totalDirectDistributedUsd: number;
    totalLeadershipDistributedUsd: number;
    totalTeamDevDistributedUsd: number;
    totalCommissionDistributedUsd: number;
    totalCommissionDistributedLkr: number;
    totalCappedExcessReturnedUsd: number;
    unallocatedPoolReturnedToCompanyUsd: number;
    companyRetainedGrossProfitUsd: number;
    companyRetainedGrossProfitLkr: number;
    companyRetainedShareOfGpPct: number;
    poolUtilizationPct: number;
    isWithinPoolCap: boolean;
    validationWarnings: string[];
    allocations: ICommissionAllocationBreakdown[];
}

export interface ITourFinancialReference {
    tourId: string;
    tourCode: string | null;
    title: string;
    status: string;
    agentId: string | null;
    agentName: string;
    agentRole: string;
    systemAgreedRevenueUsd: number;
    systemAgreedCostUsd: number;
    systemAgreedGrossProfitUsd: number;
    systemReconciledPaidRevenueUsd: number;
    systemReconciledPaidCostUsd: number;
    systemReconciledMiscExpensesUsd: number;
    systemReconciledGrossProfitUsd: number;
    exchangeRateLkr: number;
}

export interface IProgressionCriterion {
    nextRole: string;
    nextRoleLabel: string;
    minTours: number;
    minGpUsd: number;
    minMentees: number;
}

export interface ICommissionRuleVersionRecord {
    id: string;
    versionNumber: number;
    versionName: string;
    isActive: boolean;
    rules: ICommissionRuleConfig;
    progressionCriteria: Record<string, IProgressionCriterion>;
    notes: string;
    createdBy?: string | null;
    createdAt: string;
}

export interface ITourCommissionAllocationRecord {
    id: string;
    tourCommissionId: string;
    tourId: string;
    userId: string | null;
    recipientName: string;
    roleAtTime: string;
    roleLabel: string;
    allocationType: 'DIRECT' | 'LEADERSHIP_TIER_1' | 'LEADERSHIP_TIER_2' | 'LEADERSHIP_TIER_3' | 'TEAM_DEVELOPMENT';
    leadershipTier?: 1 | 2 | 3 | null;
    hasActiveContribution: boolean;
    sharePercentage: number;
    ratingTier: 'below' | 'meets' | 'exceeds' | 'exceptional';
    appliedMultiplier: number;
    customMaxCapUsd?: number | null;
    appliedCapUsd?: number | null;
    baseAmountUsd: number;
    uncappedAmountUsd: number;
    cappedExcessReturnedUsd: number;
    finalAmountUsd: number;
    finalAmountLkr: number;
    eligibilityStatus: 'ELIGIBLE' | 'BLOCKED_DOUBLE_COUNT' | 'BLOCKED_PASSIVE_NO_CONTRIBUTION' | 'OVERRIDE_APPLIED';
    eligibilityNotes: string;
    isOverride: boolean;
    overrideJustification?: string | null;
    createdAt: string;
}

export interface ICommissionAdjustmentRecord {
    id: string;
    tourCommissionId: string;
    tourId: string;
    userId?: string | null;
    actionType: 'CALCULATED' | 'STATUS_CHANGE' | 'DECLARED_GP_UPDATE' | 'MANUAL_ADJUSTMENT' | 'CAP_OVERRIDE' | 'PAID';
    previousStatus?: string | null;
    newStatus?: string | null;
    adjustmentAmountUsd: number;
    justification: string;
    performedBy?: string | null;
    performedByName: string;
    createdAt: string;
}

export interface ITourCommissionRecord {
    id: string;
    tourId: string;
    tourCode: string | null;
    tourTitle: string;
    tourStatus: string;
    tourStartDate?: string | null;
    leadAgentId: string | null;
    leadAgentName: string;
    leadAgentRole: string;
    ruleVersionId: string | null;
    ruleVersionNumber: number;
    ruleVersionName: string;
    ruleSnapshot: ICommissionRuleConfig;
    status: 'Not Eligible' | 'Calculated' | 'Pending Approval' | 'Approved' | 'Paid' | 'Disputed' | 'Cancelled';
    customerRevenueUsd: number;
    systemDirectExpensesUsd: number;
    declaredGrossProfitUsd: number;
    declaredGrossProfitNotes: string;
    exchangeRateLkr: number;
    baseCommissionPoolUsd: number;
    hardCapCeilingPoolUsd: number;
    directSubPoolUsd: number;
    leadershipSubPoolUsd: number;
    teamDevSubPoolUsd: number;
    totalDirectDistributedUsd: number;
    totalLeadershipDistributedUsd: number;
    totalTeamDevDistributedUsd: number;
    totalCommissionDistributedUsd: number;
    totalCommissionDistributedLkr: number;
    totalCappedExcessReturnedUsd: number;
    unallocatedPoolReturnedUsd: number;
    companyRetainedGrossProfitUsd: number;
    allocations: ITourCommissionAllocationRecord[];
    adjustments: ICommissionAdjustmentRecord[];
    calculatedAt: string;
    approvedBy?: string | null;
    approvedAt?: string | null;
    paidBy?: string | null;
    paidAt?: string | null;
    paymentReference?: string | null;
    updatedAt: string;
}

export interface ISaveTourCommissionPayload {
    tourId: string;
    declaredGrossProfitUsd: number;
    declaredGrossProfitNotes: string;
    exchangeRateLkr: number;
    status: 'Not Eligible' | 'Calculated' | 'Pending Approval' | 'Approved' | 'Paid' | 'Disputed' | 'Cancelled';
    directContributors: ICommissionContributorInput[];
    leadershipChain: ICommissionLeaderInput[];
    teamDevRecipient?: ITeamDevRecipientInput | null;
    justification: string;
    paymentReference?: string;
}

export interface IEmployeeHierarchyNode {
    userId: string;
    name: string;
    email: string;
    role: string;
    roleLabel: string;
    supervisorId: string | null;
    supervisorName: string | null;
    supervisorRoleLabel: string | null;
    directSubordinatesCount: number;
}

export interface IEmployeeCommissionDashboardData {
    employee: IEmployeeHierarchyNode;
    teamMembers: IEmployeeHierarchyNode[];
    reportingChainUpwards: IEmployeeHierarchyNode[];
    toursManagedCount: number;
    toursSupportedCount: number;
    totalTourRevenueContributedUsd: number;
    totalDeclaredGrossProfitGeneratedUsd: number;
    totalCommissionEarnedUsd: number;
    totalCommissionEarnedLkr: number;
    pendingCommissionUsd: number;
    approvedCommissionUsd: number;
    paidCommissionUsd: number;
    directCommissionEarnedUsd: number;
    leadershipCommissionEarnedUsd: number;
    teamDevCommissionEarnedUsd: number;
    averageMultiplier: number;
    currentRatingLabel: string;
    progression: {
        currentRoleLabel: string;
        nextRoleLabel: string;
        overallProgressPct: number;
        toursCompleted: number;
        targetTours: number;
        grossProfitUsd: number;
        targetGrossProfitUsd: number;
        qualifiedMenteesCount: number;
        targetMenteesCount: number;
    };
    allocationsHistory: Array<{
        allocation: ITourCommissionAllocationRecord;
        tourCode: string | null;
        tourTitle: string;
        tourCommissionStatus: string;
        declaredGrossProfitUsd: number;
        calculatedAt: string;
    }>;
}

export interface IManagementCommissionDashboardData {
    totalCompletedTours: number;
    totalCommissionedTours: number;
    totalTourRevenueUsd: number;
    totalDeclaredGrossProfitUsd: number;
    totalCommissionLiabilityUsd: number;
    totalCommissionLiabilityLkr: number;
    totalCommissionPaidUsd: number;
    totalCommissionPendingUsd: number;
    totalCommissionApprovedUsd: number;
    totalCompanyRetainedGrossProfitUsd: number;
    totalUnallocatedAndCappedReturnedUsd: number;
    directPoolTotalUsd: number;
    leadershipPoolTotalUsd: number;
    teamDevPoolTotalUsd: number;
    employeeRankings: Array<{
        userId: string;
        name: string;
        role: string;
        roleLabel: string;
        supervisorName: string | null;
        toursManaged: number;
        toursSupported: number;
        declaredGpGeneratedUsd: number;
        directCommissionUsd: number;
        leadershipCommissionUsd: number;
        teamDevCommissionUsd: number;
        totalCommissionUsd: number;
        totalCommissionLkr: number;
        paidCommissionUsd: number;
        pendingCommissionUsd: number;
    }>;
}










