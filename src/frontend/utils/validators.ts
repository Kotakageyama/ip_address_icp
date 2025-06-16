/**
 * IPアドレスのバリデーション
 */
export const isValidIpAddress = (ip: string): boolean => {
  if (!ip || ip === '不明') return false;
  
  // IPv4の正規表現
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  // IPv6の簡易チェック（完全ではないが基本的なケースをカバー）
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
};

/**
 * 緯度のバリデーション
 */
export const isValidLatitude = (lat: string | number): boolean => {
  const latitude = typeof lat === 'string' ? parseFloat(lat) : lat;
  return !isNaN(latitude) && latitude >= -90 && latitude <= 90;
};

/**
 * 経度のバリデーション
 */
export const isValidLongitude = (lng: string | number): boolean => {
  const longitude = typeof lng === 'string' ? parseFloat(lng) : lng;
  return !isNaN(longitude) && longitude >= -180 && longitude <= 180;
};

/**
 * 座標のバリデーション
 */
export const isValidCoordinates = (lat: string | number, lng: string | number): boolean => {
  return isValidLatitude(lat) && isValidLongitude(lng);
};

/**
 * 国コードのバリデーション（ISO 3166-1 alpha-2）
 */
export const isValidCountryCode = (code: string): boolean => {
  if (!code || code.length !== 2) return false;
  return /^[A-Z]{2}$/.test(code.toUpperCase());
};

/**
 * タイムゾーンのバリデーション
 */
export const isValidTimezone = (timezone: string): boolean => {
  if (!timezone || timezone === '不明') return false;
  
  // 基本的なタイムゾーン形式のチェック
  const timezoneRegex = /^[A-Za-z_]+\/[A-Za-z_]+$|^UTC[+-]\d{1,2}$|^GMT[+-]\d{1,2}$/;
  return timezoneRegex.test(timezone);
};

/**
 * 文字列が空でないかチェック
 */
export const isNotEmpty = (str: string): boolean => {
  return str !== null && str !== undefined && str.trim().length > 0 && str !== '不明';
};

/**
 * URLのバリデーション
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Canister IDのバリデーション
 */
export const isValidCanisterId = (canisterId: string): boolean => {
  if (!canisterId) return false;
  
  // ICPのCanister IDは通常、英数字とハイフンを含む形式
  const canisterIdRegex = /^[a-z0-9-]+$/;
  return canisterIdRegex.test(canisterId) && canisterId.length > 10;
};

/**
 * 数値範囲のバリデーション
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return !isNaN(value) && value >= min && value <= max;
}; 