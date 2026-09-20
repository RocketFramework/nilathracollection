export interface OnboardDriverDTO {
    first_name: string;
    last_name?: string;
    phone: string;
    nic_number: string;
    license_number: string;
    per_day_rate?: number;
    license_image_url?: string;
    bank_name?: string;
    branch_name?: string;
    account_name?: string;
    account_number?: string;
    swift_code?: string;
}

export interface OnboardVendorActivityDTO {
    activity_id: number | string;
    vendor_price?: number;
}

export interface OnboardVendorDTO {
    name: string;
    phone?: string;
    email?: string;
    description?: string;
    address?: string;
    lat?: number;
    lng?: number;
    has_contracted_price?: boolean;
    activities: OnboardVendorActivityDTO[];
    bank_name?: string;
    branch_name?: string;
    account_name?: string;
    account_number?: string;
    swift_code?: string;
}
