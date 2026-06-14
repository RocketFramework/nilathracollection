export type TrackType = 'basic' | 'final';

export type BasicStep = 
  | 'tourist-data' 
  | 'activity-selection' 
  | 'prepare-basic';

export type PrepareBasicSubStep = 
  | 'ai-builder' 
  | 'share-tourist';

export type FinalStep =
  | 'tour-itinerary'
  | 'element-selection'
  | 'hotel-selection'
  | 'activity-provider'
  | 'restaurant-selection'
  | 'transport-provider'
  | 'security-service'
  | 'guide-selection'
  | 'driver-selection'
  | 'quote-request'
  | 'po-submission'
  | 'final-cost'
  | 'payment-receive'
  | 'invoice-receive'
  | 'payment-supplier'
  | 'profit-loss';

export const TRAVEL_STYLES = ['Luxury', 'Ultra VIP', 'Premium', 'Regular', 'Mixed'] as const;
export type TravelStyle = typeof TRAVEL_STYLES[number];

export const GENDERS = ['Male', 'Female', 'Other'] as const;
export type Gender = typeof GENDERS[number];

export const REQUEST_TYPES = ['package', 'custom-plan', 'inquiry', 'ultra-vip'] as const;
export type RequestType = typeof REQUEST_TYPES[number];

export const REQUEST_STATUSES = ['Pending', 'Assigned', 'Active', 'Completed', 'Cancelled'] as const;
export type RequestStatus = typeof REQUEST_STATUSES[number];

export type ServiceScope =
    | 'Book International Flights'
    | 'Plan Activities & Experiences'
    | 'Visa Assistance';

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
