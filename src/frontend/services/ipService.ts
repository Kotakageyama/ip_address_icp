import { IpInfo, ApiIpInfo } from '../types';

export class IPService {
  private static readonly APIs = [
    'https://ipapi.co/json/',
    'https://ip-api.com/json/',
    'https://ipinfo.io/json'
  ];

  static async fetchIpInfo(): Promise<IpInfo | null> {
    try {
      for (const api of this.APIs) {
        try {
          const response = await fetch(api);
          if (response.ok) {
            const data: ApiIpInfo = await response.json();
            return this.normalizeIpData(data, api);
          }
        } catch (error) {
          console.warn(`API ${api} の呼び出しに失敗:`, error);
        }
      }
      
      // すべてのAPIが失敗した場合のフォールバック
      return {
        ip: '取得できませんでした',
        country: '不明',
        region: '不明',
        city: '不明',
        latitude: '0',
        longitude: '0',
        timezone: '不明',
        isp: '不明',
        timestamp: BigInt(Date.now() * 1000000) // Motoko時間に変換
      };
    } catch (error) {
      console.error('IP情報取得エラー:', error);
      return null;
    }
  }

  private static normalizeIpData(data: ApiIpInfo, apiUrl: string): IpInfo {
    if (apiUrl.includes('ipapi.co')) {
      return {
        ip: data.ip || '不明',
        country: data.country_name || '不明',
        region: data.region || '不明',
        city: data.city || '不明',
        latitude: String(data.latitude || 0),
        longitude: String(data.longitude || 0),
        timezone: data.timezone || '不明',
        isp: data.org || '不明',
        timestamp: BigInt(Date.now() * 1000000)
      };
    } else if (apiUrl.includes('ip-api.com')) {
      return {
        ip: data.query || '不明',
        country: data.country || '不明',
        region: data.regionName || '不明',
        city: data.city || '不明',
        latitude: String(data.lat || 0),
        longitude: String(data.lon || 0),
        timezone: data.timezone || '不明',
        isp: data.isp || '不明',
        timestamp: BigInt(Date.now() * 1000000)
      };
    } else {
      // ipinfo.io format
      return {
        ip: data.ip || '不明',
        country: data.country || '不明',
        region: data.region || '不明',
        city: data.city || '不明',
        latitude: String(data.loc ? data.loc.split(',')[0] : 0),
        longitude: String(data.loc ? data.loc.split(',')[1] : 0),
        timezone: data.timezone || '不明',
        isp: data.org || '不明',
        timestamp: BigInt(Date.now() * 1000000)
      };
    }
  }
} 