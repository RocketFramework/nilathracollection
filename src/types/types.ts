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

const TRAVEL_STYLES_ARRAY = ['Luxury', 'Ultra VIP', 'Premium', 'Regular', 'Mixed'] as const;
export const TRAVEL_STYLES = Object.assign(
  ['Luxury', 'Ultra VIP', 'Premium', 'Regular', 'Mixed'] as const,
  {
    LUXURY: 'Luxury' as const,
    ULTRA_VIP: 'Ultra VIP' as const,
    PREMIUM: 'Premium' as const,
    REGULAR: 'Regular' as const,
    MIXED: 'Mixed' as const
  }
);
export type TravelStyle = typeof TRAVEL_STYLES_ARRAY[number];

export const TravelStylePolicyKeys: Record<Exclude<TravelStyle, 'Mixed'>, string> = {
  'Regular': 'policy_regular',
  'Premium': 'policy_premium',
  'Luxury': 'policy_luxury',
  'Ultra VIP': 'policy_ultra_vip'
};

export const TravelStyleSettingKeys: Record<Exclude<TravelStyle, 'Mixed'>, string> = {
  'Regular': 'regular',
  'Premium': 'premium',
  'Luxury': 'luxury',
  'Ultra VIP': 'ultra_vip'
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

export const GUIDE_RATE_KEYS = {
  NATIONAL: 'guide_national_day_rate',
  REGULAR: 'guide_regular_day_rate',
  LOCATION: 'guide_location_day_rate'
} as const;
export const Settings = {
  Room_Markup: 'room_markup',
  Diver_Markup: 'diver_markup',
  Driver_Markup: 'driver_markup',
  Restaurant_Markup: 'restaurant_markup',
  Tour_Guide_Markup: 'tour_guide_markup',
  Vendor_Activity_Markup: 'vendor_activity_markup',
  Transport_Markup: 'transport_markup',
  Regular_Vehicle_Km_Rate: 'regular_vehicle_km_rate',
  Premium_Vehicle_Km_Rate: 'premium_vehicle_km_rate',
  Luxury_Vehicle_Km_Rate: 'luxury_vehicle_km_rate',
  Ultra_Vip_Vehicle_Km_Rate: 'ultra_vip_vehicle_km_rate',
  Regular_Vehicle_Day_Rate: 'regular_vehicle_day_rate',
  Premium_Vehicle_Day_Rate: 'premium_vehicle_day_rate',
  Luxury_Vehicle_Day_Rate: 'luxury_vehicle_day_rate',
  Ultra_Vip_Vehicle_Day_Rate: 'ultra_vip_vehicle_day_rate',
  Regular_Chauffeur_Day_Rate: 'regular_chauffeur_day_rate',
  Premium_Chauffeur_Day_Rate: 'premium_chauffeur_day_rate',
  Luxury_Chauffeur_Day_Rate: 'luxury_chauffeur_day_rate',
  Ultra_Vip_Chauffeur_Day_Rate: 'ultra_vip_chauffeur_day_rate',
  Guide_National_Day_Rate: 'guide_national_day_rate',
  Guide_Regular_Day_Rate: 'guide_regular_day_rate',
  Guide_Location_Day_Rate: 'guide_location_day_rate',
  Activity_Travel_Prep_Time: 'activity_travel_prep_time',
  Daily_Activity_Hours_Limit: 'daily_activity_hours_limit',
  Activity_Average_Speed_Km: 'activity_average_speed_km',
  Regular_Breakfast_Cost: 'regular_breakfast_cost',
  Premium_Breakfast_Cost: 'premium_breakfast_cost',
  Luxury_Breakfast_Cost: 'luxury_breakfast_cost',
  Ultra_Vip_Breakfast_Cost: 'ultra_vip_breakfast_cost',
  Regular_Lunch_Cost: 'regular_lunch_cost',
  Premium_Lunch_Cost: 'premium_lunch_cost',
  Luxury_Lunch_Cost: 'luxury_lunch_cost',
  Ultra_Vip_Lunch_Cost: 'ultra_vip_lunch_cost',
  Regular_Dinner_Cost: 'regular_dinner_cost',
  Premium_Dinner_Cost: 'premium_dinner_cost',
  Luxury_Dinner_Cost: 'luxury_dinner_cost',
  Ultra_Vip_Dinner_Cost: 'ultra_vip_dinner_cost',
  Regular_Service_Fee: 'regular_service_fee',
  Premium_Service_Fee: 'premium_service_fee',
  Luxury_Service_Fee: 'luxury_service_fee',
  Ultra_Vip_Service_Fee: 'ultra_vip_service_fee',
  Regular_Concierge_Cost: 'regular_concierge_cost',
  Premium_Concierge_Cost: 'premium_concierge_cost',
  Luxury_Concierge_Cost: 'luxury_concierge_cost',
  Ultra_Vip_Concierge_Cost: 'ultra_vip_concierge_cost',
  Policy_Generic: 'policy_generic',
  Policy_Regular: 'policy_regular',
  Policy_Premium: 'policy_premium',
  Policy_Luxury: 'policy_luxury',
  Policy_Ultra_Vip: 'policy_ultra_vip',
  Policy_Draft: 'policy_draft',
  Address: 'address',
  Company_Logo: 'company_logo'
} as const;

export type RoomSizeName = 'single_room' | 'double_room' | 'twin_room' | 'triple_room' | 'family_room';
