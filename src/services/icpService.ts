import { Actor, HttpAgent } from '@dfinity/agent';
import { IpInfo, Stats } from '../types';

// ローカル開発環境用の設定
const agent = new HttpAgent({
  host: import.meta.env.DEV ? 'http://localhost:4943' : 'https://ic0.app'
});

// ローカル開発環境では証明書を検証しない
if (import.meta.env.DEV) {
  agent.fetchRootKey();
}

// Canister IDL インターフェース定義
const idlFactory = ({ IDL }: any) => {
  const IpInfoIDL = IDL.Record({
    'ip': IDL.Text,
    'country': IDL.Text,
    'region': IDL.Text,
    'city': IDL.Text,
    'latitude': IDL.Text,
    'longitude': IDL.Text,
    'timezone': IDL.Text,
    'isp': IDL.Text,
    'timestamp': IDL.Int
  });
  
  return IDL.Service({
    'recordVisit': IDL.Func([IpInfoIDL], [IDL.Bool], []),
    'getLatestVisits': IDL.Func([IDL.Nat], [IDL.Vec(IpInfoIDL)], ['query']),
    'getAllVisits': IDL.Func([], [IDL.Vec(IpInfoIDL)], ['query']),
    'getStats': IDL.Func([], [IDL.Record({
      'totalVisits': IDL.Nat,
      'uniqueCountries': IDL.Nat
    })], ['query']),
    'whoami': IDL.Func([], [IDL.Text], ['query'])
  });
};

// Canister ID（デプロイ後に更新が必要）
const canisterId = import.meta.env.VITE_CANISTER_ID_IP_ADDRESS_BACKEND || 'rdmx6-jaaaa-aaaaa-aaadq-cai';

// Actorインスタンスの作成
let backendActor: any = null;

try {
  backendActor = Actor.createActor(idlFactory, {
    agent,
    canisterId,
  });
} catch (error) {
  console.warn('Backend Actorの初期化に失敗しました:', error);
}

export class ICPService {
  static async recordVisit(ipInfo: IpInfo): Promise<boolean> {
    if (!backendActor) {
      throw new Error('Backend Actorが初期化されていません');
    }
    
    try {
      const result = await backendActor.recordVisit(ipInfo);
      return result;
    } catch (error) {
      console.error('訪問記録の保存に失敗しました:', error);
      throw error;
    }
  }

  static async getLatestVisits(count: number): Promise<IpInfo[]> {
    if (!backendActor) {
      throw new Error('Backend Actorが初期化されていません');
    }
    
    try {
      const visits = await backendActor.getLatestVisits(count);
      return visits;
    } catch (error) {
      console.error('最近の訪問記録の取得に失敗しました:', error);
      throw error;
    }
  }

  static async getStats(): Promise<Stats> {
    if (!backendActor) {
      throw new Error('Backend Actorが初期化されていません');
    }
    
    try {
      const stats = await backendActor.getStats();
      return stats;
    } catch (error) {
      console.error('統計情報の取得に失敗しました:', error);
      throw error;
    }
  }

  static async whoami(): Promise<string> {
    if (!backendActor) {
      throw new Error('Backend Actorが初期化されていません');
    }
    
    try {
      const result = await backendActor.whoami();
      return result;
    } catch (error) {
      console.error('Whoami呼び出しに失敗しました:', error);
      throw error;
    }
  }

  static isAvailable(): boolean {
    return backendActor !== null;
  }

  static getCanisterId(): string {
    return canisterId;
  }
} 