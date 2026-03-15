/**
 * null to default
 * @param value
 * @param defaultVal
 */
export function nullToDefault<T>(value: T | null | undefined, defaultVal: T): T {
    return value === undefined || value == null ? defaultVal : value;
}