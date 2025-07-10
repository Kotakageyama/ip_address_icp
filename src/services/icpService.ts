import { HttpAgent } from '@dfinity/agent';
import { IpInfo, Stats } from '../types';
// 生成された型定義をインポート
import { createActor, canisterId } from '../declarations/backend';
import type {
  IpInfo as GeneratedIpInfo,
  _SERVICE,
} from '../declarations/backend/backend.did';
import { ActorSubclass } from '@dfinity/agent';

// バックエンドアクターを作成
const backend = createActor(canisterId);

// 型変換ユーティリティ関数
const convertGeneratedIpInfoToIpInfo = (
  generated: GeneratedIpInfo,
): IpInfo => ({
  ip: generated.ip,
  country: generated.country,
  region: generated.region,
  city: generated.city,
  latitude: generated.latitude,
  longitude: generated.longitude,
  timezone: generated.timezone,
  isp: generated.isp,
  timestamp: generated.timestamp,
});

export class ICPService {
  // クライアントから送信されたIPアドレスで訪問を記録
  static async recordVisitFromClient(clientIp: string): Promise<IpInfo> {
    try {
      const result = await backend.recordVisitFromClient(clientIp);

      if ('ok' in result) {
        return convertGeneratedIpInfoToIpInfo(result.ok);
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('クライアントIPによる訪問記録の保存に失敗しました:', error);
      throw error;
    }
  }

  static async getLatestVisits(count: number): Promise<IpInfo[]> {
    try {
      const visits = await backend.getLatestVisits(BigInt(count));
      return visits.map(convertGeneratedIpInfoToIpInfo);
    } catch (error) {
      console.error('最近の訪問記録の取得に失敗しました:', error);
      throw error;
    }
  }

  static async getStats(): Promise<Stats> {
    try {
      const stats = await backend.getStats();
      return {
        totalVisits: stats.totalVisits,
        uniqueCountries: stats.uniqueCountries,
      };
    } catch (error) {
      console.error('統計情報の取得に失敗しました:', error);
      throw error;
    }
  }

  static async whoami(): Promise<string> {
    try {
      const result = await backend.whoami();
      return result;
    } catch (error) {
      console.error('Whoami呼び出しに失敗しました:', error);
      throw error;
    }
  }
}
