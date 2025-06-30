# フロントエンドアーキテクチャ

## 概要

React + TypeScript + Vite で構築された Web アプリケーション。Internet Computer Canister との通信を行い、IP アドレス位置情報をリアルタイムで表示します。

## 技術スタック

-   **React 18**: UI ライブラリ
-   **TypeScript**: 型安全な開発
-   **Vite**: ビルドツール
-   **@dfinity/agent**: ICP Canister 通信
-   **Leaflet**: マップライブラリ

## プロジェクト構造

```
src/
├── components/          # React コンポーネント
│   ├── layout/         # レイアウト
│   ├── visitor/        # 訪問者情報
│   ├── map/           # 地図表示
│   └── stats/         # 統計情報
├── services/          # サービス層
│   └── icpService.ts  # ICP 通信
├── types/             # TypeScript 型定義
├── App.tsx           # メインアプリ
└── main.tsx          # エントリーポイント
```

## 主要コンポーネント

-   **App.tsx**: 全体の状態管理
-   **CurrentVisitor.tsx**: 現在の訪問者 IP 情報表示
-   **StaticMap.tsx**: 地理的位置の可視化
-   **Stats.tsx**: 統計情報表示
-   **RecentVisits.tsx**: 最近の訪問者一覧

## サービス層

### ICPService

```typescript
class ICPService {
	static async recordVisit(ipInfo: IpInfo): Promise<boolean>;
	static async getLatestVisits(count: number): Promise<IpInfo[]>;
	static async getStats(): Promise<Stats>;
}
```

## デプロイメント

```bash
# 開発サーバー
npm run dev

# プロダクションビルド
npm run build

# ICP デプロイ
dfx deploy --network ic
```
