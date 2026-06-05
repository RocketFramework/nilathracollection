export type TrackType = 'basic' | 'final';

export type BasicStep = 
  | 'tourist-data' 
  | 'activity-selection' 
  | 'prepare-basic';

export type PrepareBasicSubStep = 
  | 'ai-builder' 
  | 'rough-costing' 
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
