/**
 * Price resolution helpers (pure functions, no DB access).
 *
 * Rule: saved columns are the source of truth.
 *  - charged  = AI-builder value (daily_activities.charged_* / *.charged_* columns)
 *  - contracted = final-track negotiated value (daily_activities.contracted_* / *.contracted_* columns)
 *
 * The ONLY allowed derivation is DISPLAY-ONLY: when no negotiated (contracted) value exists yet,
 * screens/documents show charged x NOT_NEGOTIATED_CONTRACT_RATIO and label it "Not negotiated".
 * This derived value must NEVER be written back to a contracted_* column.
 */
export const NOT_NEGOTIATED_CONTRACT_RATIO = 0.9;
export const NOT_NEGOTIATED_LABEL = 'Not negotiated';

export interface ResolvedContractedPrice {
    value: number;
    negotiated: boolean;
}

export class PriceResolutionService {
    /** A contracted value counts as negotiated only if it is a positive number. */
    static isNegotiated(contracted: unknown): boolean {
        if (contracted === null || contracted === undefined || contracted === '') return false;
        const n = Number(contracted);
        return !isNaN(n) && n > 0;
    }

    /** Display-only contracted value: saved value if negotiated, otherwise charged x 0.9 (flagged). */
    static resolveContractedForDisplay(contracted: unknown, charged: unknown): ResolvedContractedPrice {
        if (PriceResolutionService.isNegotiated(contracted)) {
            return { value: Number(contracted), negotiated: true };
        }
        const chargedNum = Number(charged);
        const derived = !isNaN(chargedNum) && chargedNum > 0 ? chargedNum * NOT_NEGOTIATED_CONTRACT_RATIO : 0;
        return { value: derived, negotiated: false };
    }
}
