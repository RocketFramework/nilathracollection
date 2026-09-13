import { ITransportProviderOnboardingInput, ITourGuideOnboardingInput } from '../other/interfaces';

export interface TransportProviderOnboardingDTO extends ITransportProviderOnboardingInput {}

export interface TourGuideOnboardingDTO extends ITourGuideOnboardingInput {}

export interface PartnerVerificationResultDTO {
    success: boolean;
    error?: string;
    isExisting?: boolean;
    partnerType?: 'transport' | 'guide';
    data?: any;
}
