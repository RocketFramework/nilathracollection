export interface NICValidationResult {
    isValid: boolean;
    error?: string;
    format?: 'old' | 'new';
    birthYear?: number;
    dayOfYear?: number;
    gender?: 'Male' | 'Female';
    convertedNewNic?: string;
}

/**
 * Validates a Sri Lankan National Identity Card (NIC) number.
 * Supports both Old Format (9 digits + V/X) and New Format (12 digits).
 */
export function validateSriLankanNIC(nic: string): NICValidationResult {
    const cleanNic = (nic || '').trim().toUpperCase();

    if (!cleanNic) {
        return { isValid: false, error: 'Sri Lankan National ID (NIC) number is required.' };
    }

    const oldFormatRegex = /^([0-9]{9})([VX])$/;
    const newFormatRegex = /^([0-9]{12})$/;

    const isOld = oldFormatRegex.test(cleanNic);
    const isNew = newFormatRegex.test(cleanNic);

    if (!isOld && !isNew) {
        return {
            isValid: false,
            error: 'Invalid Sri Lankan NIC format. Must be either 10 characters ending with V or X (e.g., 923612573V) or 12 numeric digits (e.g., 199226125738).'
        };
    }

    let rawDay: number;
    let birthYear: number;
    let gender: 'Male' | 'Female';
    let convertedNewNic: string | undefined;

    if (isOld) {
        const yyStr = cleanNic.substring(0, 2);
        const dddStr = cleanNic.substring(2, 5);
        const serialStr = cleanNic.substring(5, 9);

        rawDay = parseInt(dddStr, 10);
        const yy = parseInt(yyStr, 10);

        // Standard Sri Lankan NIC birth year conversion for 2-digit years:
        // Years >= 30 indicate 19yy, years < 30 indicate 20yy
        const yearPrefix = yy >= 30 ? '19' : '20';
        birthYear = parseInt(`${yearPrefix}${yyStr}`, 10);
        convertedNewNic = `${yearPrefix}${yyStr}${dddStr}0${serialStr}`;
    } else {
        const yyyyStr = cleanNic.substring(0, 4);
        const dddStr = cleanNic.substring(4, 7);

        rawDay = parseInt(dddStr, 10);
        birthYear = parseInt(yyyyStr, 10);
    }

    // Gender check and day-of-year calculation
    if (rawDay > 500) {
        gender = 'Female';
        dayOfYear = rawDay - 500;
    } else {
        gender = 'Male';
        dayOfYear = rawDay;
    }

    // Day Range Check: Day of year must be between 1 and 366
    if (dayOfYear < 1 || dayOfYear > 366) {
        return {
            isValid: false,
            error: `Invalid day of year (${dayOfYear}) in NIC. Day value must be between 1 and 366 (or 501–866 for females).`
        };
    }

    return {
        isValid: true,
        format: isOld ? 'old' : 'new',
        birthYear,
        dayOfYear,
        gender,
        convertedNewNic
    };
}

/**
 * Converts an old 10-character Sri Lankan NIC (e.g. 923612573V) to 12-digit format.
 * If already a 12-digit NIC, returns as is.
 */
export function convertOldToNewNIC(nic: string): string | null {
    const result = validateSriLankanNIC(nic);
    if (!result.isValid) return null;
    if (result.format === 'new') return (nic || '').trim().toUpperCase();
    return result.convertedNewNic || null;
}
