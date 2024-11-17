/**
 * null to default
 * @param value
 * @param defaultVal
 */
export function nullToDefault(value: any, defaultVal: any): any {
    return value === undefined || value == null ? defaultVal : value;
}