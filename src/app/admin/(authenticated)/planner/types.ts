import { Activity } from "@/data/activities";

export type ServiceScope =
    | 'Book International Flights'
    | 'Book Accommodation'
    | 'Arrange Transport'
    | 'Plan Activities & Experiences'
    | 'Arrange Dining / Culinary Experiences'
    | 'Book Event / Entry Tickets'
    | 'Visa Assistance'
    | 'Full End-to-End Luxury Handling';

export type TravelStyle = 'Budget' | 'Premium' | 'Luxury' | 'Ultra Luxury VIP' | 'Mixed';

export type TripStatus =
    | 'Draft'
    | 'Proposal Sent'
    | 'Client Reviewing'
    | 'Approved'
    | 'Booking In Progress'
    | 'Fully Confirmed'
    | 'Documents Sent'
    | 'Completed'
    | 'Archived';

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
    roomStandard: string;
    numberOfRooms: number;
    numberOfGuests?: number;
    pricePerNight: number;
    mealPlan: 'BB' | 'HB' | 'FB' | 'AI';
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
    type: 'activity' | 'travel' | 'meal' | 'sleep' | 'train' | 'buffer' | 'wait' | 'guide' | 'custom';
    name: string;
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    bufferMins: number; // buffer inserted
    durationHours: number;

    // Binding IDs (Relational Links)
    hotelId?: string;
    vendorId?: string;
    activityId?: number;
    vendorActivityId?: string;
    agreedPrice?: number;
    transportId?: string;
    vehicleId?: string;
    driverId?: string;
    guideId?: string;
    restaurantId?: string;

    linkedSupplierId?: string; // Legacy field - to be phased out or used as label
    confirmationStatus: 'Pending' | 'Confirmed';
    paymentStatus: 'Pending' | 'Paid';
    internalNotes: string;
    clientVisibleNotes: string;
    locationName?: string;
    lat?: number;
    lng?: number;
    serviceProvider?: string;
    mealType?: string;
}

export interface DBPurchaseOrderItem {
    id: string;
    purchase_order_id: string;
    tour_itinerary_id?: string;
    day_number?: number | null;
    description: string;
    service_date?: string;
    quantity: number;
    unit_price: number;
    total_price: number;

    // Hotel specific
    check_in_date?: string;
    check_out_date?: string;
    room_type?: string;
    meal_plan?: string;
    number_of_nights?: number;

    // Transport specific
    vehicle_type?: string;
    pick_up_location?: string;
    drop_off_location?: string;
    driver_included?: boolean;
    fuel_included?: boolean;

    // Activity/Guide specific
    number_of_guests?: number;
    language?: string;

    special_notes?: string;
    created_at?: string;
}

export type POStatus = 'Draft' | 'Pending Confirmation' | 'Sent' | 'Accepted' | 'Rejected' | 'Cancelled' | 'Completed';

export interface DBPurchaseOrder {
    id: string;
    tour_id: string;
    po_number: string;
    po_date: string;

    hotel_id?: string;
    activity_vendor_id?: string;
    transport_provider_id?: string;
    guide_id?: string;
    restaurant_id?: string;

    vendor_type: 'hotel' | 'vendor' | 'transport' | 'guide' | 'restaurant' | 'other';
    vendor_name?: string;
    vendor_address?: string;
    vendor_phone?: string;
    vendor_email?: string;

    currency: string;
    payment_terms?: string;
    status: POStatus;

    subtotal: number;
    discount: number;
    tax: number;
    service_charge: number;
    total_amount: number;
    advance_paid: number;
    balance_payable: number;

    internal_notes?: string;
    vendor_notes?: string;
    cancellation_policy?: string;

    items?: DBPurchaseOrderItem[];
    invoices?: DBVendorInvoice[];

    created_at: string;
    updated_at: string;
}

export interface DBVendorInvoice {
    id: string;
    purchase_order_id: string;
    invoice_number: string;
    invoice_date?: string;
    due_date?: string;
    amount: number;
    status: 'Pending' | 'Received' | 'Partial Paid' | 'Paid' | 'Confirmed';
    attachment_url?: string;
    payments?: DBVendorPayment[];
    created_at: string;
    updated_at: string;
}

export interface DBVendorPayment {
    id: string;
    vendor_invoice_id: string;
    payment_date: string;
    amount: number;
    payment_method: string;
    payment_reference?: string;
    notes?: string;
    created_at: string;
}

export interface Financials {
    costs: {
        flights: number;
        hotels: number;
        transport: number;
        activities: number;
        guide: number;
        misc: number;
        commission: number;
        tax: number;
    };
    /** @deprecated Use relational purchase_orders table */
    purchaseOrders: any[];
    /** @deprecated Use relational vendor_invoices table */
    supplierInvoices: any[];
    sellingPrice: number;
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
    financials: Financials;
}
