export type TrackType = 'basic' | 'final';

export type BasicStep = 
  | 'tourist-data' 
  | 'activity-selection' 
  | 'prepare-basic';

export type PrepareBasicSubStep = 
  | 'ai-builder' 
  | 'share-tourist';

export type FinalStep =
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
  | 'finance-controlling'
  | 'profit-loss';

export const TRAVEL_STYLES = ['Luxury', 'Ultra VIP', 'Premium', 'Regular', 'Mixed'] as const;
export type TravelStyle = typeof TRAVEL_STYLES[number];

export const TravelStylePolicyKeys: Record<Exclude<TravelStyle, 'Mixed'>, string> = {
  'Regular': 'policy_regular',
  'Premium': 'policy_premium',
  'Luxury': 'policy_luxury',
  'Ultra VIP': 'policy_ultra_vip'
};


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

export const ITINERARY_BLOCK_TYPES = ['activity', 'travel', 'meal', 'sleep', 'train', 'buffer', 'wait', 'guide', 'custom'] as const;
export type ItineraryBlockType = typeof ITINERARY_BLOCK_TYPES[number];

export const BINDABLE_BLOCK_TYPES = ['sleep', 'activity', 'meal', 'travel', 'guide'] as const;
export type BindableBlockType = typeof BINDABLE_BLOCK_TYPES[number];

export const ItineraryBlockTypes = {
  ACTIVITY: 'activity',
  TRAVEL: 'travel',
  MEAL: 'meal',
  SLEEP: 'sleep',
  TRAIN: 'train',
  BUFFER: 'buffer',
  WAIT: 'wait',
  GUIDE: 'guide',
  CUSTOM: 'custom'
} as const;

export const TierSettingDefinitions = {
  LUNCH_COST: { key: 'lunch_cost', defaultValue: 15 },
  VEHICLE_KM_RATE: { key: 'vehicle_km_rate', defaultValue: 0.50 },
  CONCIERGE_COST: { key: 'concierge_cost', defaultValue: 40 },
  SERVICE_FEE: { key: 'service_fee', defaultValue: 10 }
} as const;

export type RoomSizeName = 'single_room' | 'double_room' | 'twin_room' | 'triple_room' | 'family_room';

