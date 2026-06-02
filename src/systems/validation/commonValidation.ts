export interface DataValidationResult {
    valid: boolean;
    errors: string[];
}

export function success(): DataValidationResult {
    return { valid: true, errors: [] };
}

export function result(errors: string[]): DataValidationResult {
    return { valid: errors.length === 0, errors };
}

export function findDuplicates(values: string[]): string[] {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    values.forEach(value => {
        if (seen.has(value)) duplicates.add(value);
        seen.add(value);
    });

    return [...duplicates];
}
