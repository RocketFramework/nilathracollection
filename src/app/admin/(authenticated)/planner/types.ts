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
    hotelName: string;
    stayClass: string;
    address: string;
    mapLink: string;
    contactPerson: string;
    contactNumber: string;
    email: string;
    rateCardUrl: string;
    roomType: string;
    numberOfRooms: number;
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
    mode: 'Bus' | 'Sedan' | 'SUV' | 'Luxury Van' | 'Tuk Tuk' | 'Helicopter' | 'Private Jet' | 'Train';
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
    supplierContactPerson: string;
    paymentTerms: string;
    bookingReference: string;
    cutOffDate: string;
}

export interface InternalItineraryBlock {
    id: string;
    dayNumber: number;
    type: 'activity' | 'travel' | 'meal' | 'sleep' | 'train' | 'buffer' | 'wait' | 'custom';
    name: string;
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    bufferMins: number; // buffer inserted
    durationHours: number;
    linkedSupplierId?: string; // id of flight, hotel, transport, or activity
    confirmationStatus: 'Pending' | 'Confirmed';
    paymentStatus: 'Pending' | 'Paid';
    internalNotes: string;
    clientVisibleNotes: string;
    locationName?: string;
    lat?: number;
    lng?: number;
    serviceProvider?: string;
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
    flights: FlightBooking[];
    accommodations: AccommodationBooking[];
    transports: TransportBooking[];
    activities: ActivityBooking[];
    itinerary: InternalItineraryBlock[];
    financials: Financials;
}
