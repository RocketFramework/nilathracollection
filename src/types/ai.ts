export interface AIRule {
    id?: string;
    tour_id?: string | null;
    rule_type: 'generic' | 'specific';
    content: string;
    created_at?: string;
    updated_at?: string;
}
