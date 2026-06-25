export interface CreateQuotationRequestDTO {
    vendor_id?: string; // Optional if non-registered vendor
    vendor_name: string;
    to_email: string;
    from_email: string;
    subject: string;
    email_content: string;
    daily_activity_id?: string;
    daily_activity_ids?: string[];
    tour_id: string;
    itinerary_id: string;
    activity_type: string;
    po_block_id?: string;
}

export interface UpdateQuotationDTO {
    status?: 'Pending' | 'Sent' | 'Replied' | 'Declined' | 'Expired' | 'Selected';
    quoted_price?: number;
    currency?: string;
    replied_date?: string; // ISO string
    notes?: string;
}
