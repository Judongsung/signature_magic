export interface DataValidationResult {
    valid: boolean;
    errors: string[];
}

export type ValidationPathSegment = string | number;
export type ValidationErrorKind = string;

export function success(): DataValidationResult {
    return { valid: true, errors: [] };
}

export function result(errors: string[]): DataValidationResult {
    return { valid: errors.length === 0, errors };
}

export function formatValidationPath(...segments: ValidationPathSegment[]): string {
    return segments.map(String).join(' -> ');
}

export function formatValidationError(
    kind: ValidationErrorKind,
    subject: string,
    ...pathSegments: ValidationPathSegment[]
): string {
    const path = formatValidationPath(...pathSegments);
    return path ? `${kind} ${subject}: ${path}` : `${kind} ${subject}`;
}

export function formatLabeledValidationError(
    label: string,
    subject: string,
    ...pathSegments: ValidationPathSegment[]
): string {
    const path = formatValidationPath(...pathSegments);
    return path ? `${label}: ${subject} -> ${path}` : `${label}: ${subject}`;
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function isPlainObjectArray(value: unknown): value is Record<string, unknown>[] {
    return Array.isArray(value) && value.every(isPlainObject);
}

export function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

export function isFiniteNumber(value: unknown): value is number {
    return Number.isFinite(value);
}

export function isKnownStringValue<T extends string>(
    value: unknown,
    allowedValues: ReadonlySet<T>
): value is T {
    return typeof value === 'string' && allowedValues.has(value as T);
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

export function collectDuplicateErrors(values: string[], subject: string): string[] {
    return findDuplicates(values).map(id =>
        formatValidationError('Duplicate', subject, id)
    );
}
