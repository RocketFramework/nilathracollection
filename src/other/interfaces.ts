import { TrackType, BasicStep, PrepareBasicSubStep, FinalStep } from '../types/types';

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
