/**
 * 空转default
 * @param val
 * @param defaultVal
 * @returns {*}
 */
export function nullToDefault(val, defaultVal) {
  return val === undefined || val == null ? defaultVal : val;
}