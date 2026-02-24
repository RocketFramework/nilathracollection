interface AllInclusivePricing {
    accommodation: true;  // All nights
    meals: 'all' | 'breakfast+dinner' | 'breakfast';
    transport: 'private' | 'shared' | 'self-drive';
    guide: 'private' | 'shared' | 'none';
    activities: 'all' | 'selected' | 'none';
    entrance_fees: boolean;
    flights: 'international' | 'domestic' | 'none';
    insurance: boolean;
    visas: boolean;
    tips: boolean;
}

interface LandPackagePricing {
    accommodation: true;
    meals: 'breakfast' | 'none';
    transport: 'private' | 'shared';
    guide: 'private' | 'shared';
    activities: 'included' | 'optional';
    entrance_fees: 'included' | 'pay-on-spot';
    flights: false;  // Not included
    insurance: false;
}

interface AccommodationOnlyPricing {
    accommodation: true;
    meals: 'breakfast' | 'room-only';
    transport: false;
    guide: false;
    activities: false;
    entrance_fees: false;
}