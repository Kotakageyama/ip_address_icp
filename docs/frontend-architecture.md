# フロントエンドアーキテクチャ

## 概要

本プロジェクトのフロントエンドは、React + TypeScript + Viteで構築されたモダンなWebアプリケーションです。Internet Computer (ICP) Canisterとの通信を行い、IPアドレス位置情報をリアルタイムで表示します。

## アーキテクチャ図

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend Application                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     React App                            │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌──────────┐  │  │
│  │  │   Components    │  │    Services     │  │  Types   │  │  │
│  │  │  • Header       │  │  • ICPService   │  │• IpInfo  │  │  │
│  │  │  • CurrentVisit │  │  • IPService    │  │• Stats   │  │  │
│  │  │  • Map          │  │                 │  │• ApiInfo │  │  │
│  │  │  • Stats        │  │                 │  │          │  │  │
│  │  │  • RecentVisits │  │                 │  │          │  │  │
│  │  │  • Footer       │  │                 │  │          │  │  │
│  │  └─────────────────┘  └─────────────────┘  └──────────┘  │  │
│  │           │                      │               │        │  │
│  │           └──────────────────────┼───────────────┘        │  │
│  │                                  │                        │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │                 App.tsx                             │  │  │
│  │  │  • State Management                                 │  │  │
│  │  │  • Component Orchestration                          │  │  │
│  │  │  • Error Handling                                   │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                External Integrations                     │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌──────────┐  │  │
│  │  │   IP Geo APIs   │  │  Leaflet Maps   │  │   ICP    │  │  │
│  │  │  • ipapi.co     │  │  • OpenStreetM  │  │Canister  │  │  │
│  │  │  • ip-api.com   │  │  • Markers      │  │Backend   │  │  │
│  │  │  • ipinfo.io    │  │  • Popups       │  │          │  │  │
│  │  └─────────────────┘  └─────────────────┘  └──────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 技術スタック

### 核心技術
- **React 18**: UIライブラリ
- **TypeScript**: 型安全な開発
- **Vite**: 高速ビルドツール

### 依存ライブラリ
- **@dfinity/agent**: ICP Canister通信
- **Leaflet**: インタラクティブマップ
- **CSS3**: スタイリング（CSS-in-JS不使用）

### 開発ツール
- **TypeScript Compiler**: 型チェック
- **ESLint**: コード品質管理（設定可能）

## プロジェクト構造

```
src/
├── components/          # Reactコンポーネント
│   ├── Header.tsx      # ヘッダーコンポーネント
│   ├── Header.css      # ヘッダー専用スタイル
│   ├── CurrentVisitor.tsx  # 現在の訪問者情報
│   ├── CurrentVisitor.css
│   ├── Map.tsx         # 地図表示
│   ├── Map.css
│   ├── Stats.tsx       # 統計情報表示
│   ├── Stats.css
│   ├── RecentVisits.tsx    # 最近の訪問者一覧
│   ├── RecentVisits.css
│   ├── Footer.tsx      # フッター
│   └── Footer.css
├── services/           # ビジネスロジック層
│   ├── icpService.ts   # ICP Canister通信
│   └── ipService.ts    # 外部IP情報API
├── types/              # TypeScript型定義
│   └── index.ts        # 共通型定義
├── App.tsx             # メインアプリケーション
├── App.css             # アプリ全体スタイル
├── main.tsx            # エントリーポイント
├── index.css           # グローバルスタイル
└── vite-env.d.ts      # Vite環境変数型定義
```

## コンポーネント設計

### コンポーネント階層

```
App
├── Header
├── CurrentVisitor
├── Map
├── Stats
├── RecentVisits
└── Footer
```

### 各コンポーネントの責務

#### `App.tsx`
- **役割**: アプリケーション全体の状態管理
- **責務**: 
  - データ取得の協調
  - エラーハンドリング
  - ローディング状態管理
  - 子コンポーネントへのprops渡し

#### `Header.tsx`
- **役割**: アプリケーションタイトル表示
- **責務**: ブランディング、ナビゲーション情報

#### `CurrentVisitor.tsx`
- **役割**: 現在の訪問者のIP情報表示
- **責務**: 
  - IP情報の整理された表示
  - ローディング状態の表示

#### `Map.tsx`
- **役割**: 地理的位置の可視化
- **責務**: 
  - Leafletマップの初期化
  - 現在位置マーカー表示
  - 過去の訪問者マーカー表示
  - マップイベント処理

#### `Stats.tsx`
- **役割**: 統計情報の表示
- **責務**: 
  - 総訪問数表示
  - ユニーク国数表示

#### `RecentVisits.tsx`
- **役割**: 最近の訪問者一覧表示
- **責務**: 
  - 訪問履歴のリスト表示
  - 時刻フォーマット
  - スクロール可能なリスト

#### `Footer.tsx`
- **役割**: フッター情報表示
- **責務**: 
  - Canister ID表示
  - プラットフォーム情報

## サービス層設計

### `ICPService`

**目的**: ICP Canisterとの通信を抽象化

**主要メソッド**:
```typescript
class ICPService {
  static async recordVisit(ipInfo: IpInfo): Promise<boolean>
  static async getLatestVisits(count: number): Promise<IpInfo[]>
  static async getStats(): Promise<Stats>
  static isAvailable(): boolean
  static getCanisterId(): string
}
```

**特徴**:
- シングルトンパターン
- エラーハンドリング内蔵
- 環境別設定対応

### `IPService`

**目的**: 外部IP情報APIとの通信

**主要メソッド**:
```typescript
class IPService {
  static async fetchIpInfo(): Promise<IpInfo | null>
  private static normalizeIpData(data: ApiIpInfo, apiUrl: string): IpInfo
}
```

**特徴**:
- 複数APIのフォールバック対応
- データ正規化機能
- レート制限対応

## 状態管理

### ローカル状態（useState）

```typescript
const [currentIpInfo, setCurrentIpInfo] = useState<IpInfo | null>(null);
const [stats, setStats] = useState<Stats | null>(null);
const [recentVisits, setRecentVisits] = useState<IpInfo[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

### 状態フロー

1. **初期化**: アプリ起動時にローディング状態
2. **データ取得**: 
   - IP情報の並行取得
   - ICP Canisterへの記録
   - 統計情報の取得
3. **表示更新**: 各コンポーネントに状態を配布
4. **エラーハンドリング**: エラー時の代替表示

## スタイリング戦略

### CSS設計原則
- **Component-Scoped CSS**: 各コンポーネント専用CSS
- **BEM Methodology**: クラス命名規則
- **Responsive Design**: モバイルファースト
- **Glass Morphism**: モダンなUI効果

### レスポンシブブレークポイント
```css
/* Mobile */
@media (max-width: 768px) { ... }

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) { ... }

/* Desktop */
@media (min-width: 1025px) { ... }
```

## パフォーマンス最適化

### React最適化
- **Function Components**: クラスコンポーネント不使用
- **useCallback/useMemo**: 不要な再レンダリング防止
- **React.memo**: Pure Componentの最適化

### バンドル最適化
- **Vite Tree Shaking**: 未使用コードの除去
- **Code Splitting**: 動的インポート活用
- **Asset Optimization**: 画像圧縮、CSS最小化

### 外部API最適化
- **API Fallback**: 複数APIの順次試行
- **Request Caching**: ブラウザキャッシュ活用
- **Error Recovery**: 失敗時の代替処理

## セキュリティ

### クライアントサイド
- **Input Validation**: ユーザー入力の検証
- **XSS Prevention**: HTMLエスケープ
- **HTTPS Only**: セキュア通信の強制

### ICP通信
- **Agent Configuration**: 証明書検証
- **Error Masking**: 内部エラー情報の秘匿
- **Rate Limiting**: 過剰リクエスト防止

## 環境設定

### 開発環境変数
```
VITE_CANISTER_ID_IP_ADDRESS_BACKEND=rdmx6-jaaaa-aaaaa-aaadq-cai
```

### ビルド設定
```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview"
}
```

## デプロイメント

### ローカル開発
```bash
npm run dev
```

### プロダクションビルド
```bash
npm run build
```

### ICP デプロイ
```bash
dfx deploy --network ic
```

## 今後の拡張予定

1. **Progressive Web App (PWA)**: オフライン対応
2. **Service Worker**: キャッシングの最適化
3. **Dark Mode**: テーマ切り替え機能
4. **Internationalization**: 多言語対応
5. **Advanced Analytics**: より詳細な分析機能
6. **Real-time Updates**: WebSocketによるリアルタイム更新 