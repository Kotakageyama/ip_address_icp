# 🌍 IP Address Location Tracker on Internet Computer

Internet Computer (ICP) 上で動作するFull on Chain IPアドレス位置情報トラッカーです。訪問者のIPアドレスとジオロケーション情報をリアルタイムで表示し、統計情報を管理します。

## 🚀 特徴

- **Full on Chain**: 完全分散アーキテクチャでICPネットワーク上で動作
- **リアルタイム地図**: Leafletマップによる訪問者位置の可視化
- **統計分析**: 訪問数、ユニーク国数などの統計情報
- **レスポンシブデザイン**: モバイル・デスクトップ対応
- **型安全**: TypeScriptによる堅牢な開発
- **モダンUI**: Glass Morphismを活用した美しいインターフェース

## 🏗️ アーキテクチャ

### システム全体構成

```
┌─────────────────────────────────────────────────────────────┐
│                Internet Computer Network                   │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │   Backend       │    │         Frontend                │ │
│  │   Canister      │◄───┤         Canister                │ │
│  │   (Motoko)      │    │    (React + TypeScript)        │ │
│  └─────────────────┘    └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
          ┌─────────▼─────────┐    ┌─────────▼─────────┐
          │   IP Geo APIs     │    │   Leaflet Maps    │
          │  • ipapi.co       │    │  • OpenStreetMap  │
          │  • ip-api.com     │    │  • Interactive UI │
          │  • ipinfo.io      │    │                   │
          └───────────────────┘    └───────────────────┘
```

## 📁 プロジェクト構造

```
ip_address_icp/
├── 📄 README.md                    # このファイル
├── 📄 package.json                 # Node.js依存関係
├── 📄 dfx.json                     # DFXプロジェクト設定
├── 📄 vite.config.ts              # Vite設定
├── 📄 tsconfig.json               # TypeScript設定
├── 📄 tsconfig.node.json          # Node.js用TypeScript設定
├── 📄 index.html                  # Viteエントリーポイント
│
├── 📁 docs/                       # ドキュメント
│   ├── 📄 backend-architecture.md # バックエンドアーキテクチャ
│   └── 📄 frontend-architecture.md # フロントエンドアーキテクチャ
│
├── 📁 src/                        # ソースコード
│   ├── 📁 ip_address_backend/     # バックエンドCanister
│   │   └── 📄 main.mo             # Motokoメインファイル
│   │
│   ├── 📁 components/             # Reactコンポーネント
│   │   ├── 📄 Header.tsx          # ヘッダーコンポーネント
│   │   ├── 📄 Header.css          # ヘッダースタイル
│   │   ├── 📄 CurrentVisitor.tsx  # 現在の訪問者情報
│   │   ├── 📄 CurrentVisitor.css  # 訪問者情報スタイル
│   │   ├── 📄 Map.tsx             # 地図コンポーネント
│   │   ├── 📄 Map.css             # 地図スタイル
│   │   ├── 📄 Stats.tsx           # 統計情報コンポーネント
│   │   ├── 📄 Stats.css           # 統計情報スタイル
│   │   ├── 📄 RecentVisits.tsx    # 最近の訪問者リスト
│   │   ├── 📄 RecentVisits.css    # 訪問者リストスタイル
│   │   ├── 📄 Footer.tsx          # フッターコンポーネント
│   │   └── 📄 Footer.css          # フッタースタイル
│   │
│   ├── 📁 services/               # サービス層
│   │   ├── 📄 icpService.ts       # ICP Canister通信
│   │   └── 📄 ipService.ts        # 外部IP API通信
│   │
│   ├── 📁 types/                  # TypeScript型定義
│   │   └── 📄 index.ts            # 共通型定義
│   │
│   ├── 📄 App.tsx                 # メインアプリケーション
│   ├── 📄 App.css                 # アプリスタイル
│   ├── 📄 main.tsx                # React エントリーポイント
│   ├── 📄 index.css               # グローバルスタイル
│   └── 📄 vite-env.d.ts          # Vite環境変数型定義
│
└── 📁 src/ip_address_frontend/    # ICP フロントエンドCanister出力
    └── 📁 assets/                 # ビルド済みアセット (自動生成)
```

## 🛠️ 技術スタック

### バックエンド
- **Motoko**: ICP用関数型プログラミング言語
- **Internet Computer**: 分散コンピューティングプラットフォーム
- **Candid**: ICPのIDLインターフェース

### フロントエンド
- **React 18**: モダンUIライブラリ
- **TypeScript**: 型安全な開発
- **Vite**: 高速ビルドツール
- **Leaflet**: インタラクティブマップライブラリ
- **CSS3**: ネイティブスタイリング

### 開発ツール
- **DFX**: ICPローカル開発環境
- **npm**: パッケージマネージャー
- **ESLint**: コード品質管理

## 🚀 セットアップと実行

### 前提条件

以下がインストールされている必要があります：

```bash
# DFX (Internet Computer SDK)
sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"

# Node.js (推奨: v16以上)
node --version

# npm
npm --version
```

### 1. プロジェクトのクローン

```bash
git clone <このリポジトリのURL>
cd ip_address_icp
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. ローカル開発環境の起動

#### DFXローカルネットワークの起動
```bash
dfx start --background
```

#### Canisterのデプロイ
```bash
dfx deploy --network local
```

#### フロントエンド開発サーバーの起動
```bash
npm run dev
```

### 4. アプリケーションにアクセス

ブラウザで `http://localhost:3000` にアクセスします。

## 🌐 プロダクションデプロイ

### IC本番環境へのデプロイ

```bash
# 本番環境にデプロイ
dfx deploy --network ic

# デプロイされたURLを確認
dfx canister --network ic id ip_address_frontend
```

## 📖 API仕様

### バックエンドCanister API

#### `recordVisit(ipInfo: IpInfo): async Bool`
訪問者情報を記録

#### `getLatestVisits(count: Nat): async [IpInfo]`
最新の訪問記録を取得

#### `getStats(): async {totalVisits: Nat; uniqueCountries: Nat}`
統計情報を取得

#### `getAllVisits(): async [IpInfo]`
全ての訪問記録を取得

#### `whoami(): async Text`
Canister情報を取得

詳細は [バックエンドアーキテクチャドキュメント](docs/backend-architecture.md) を参照してください。

## 🎨 UI/UX設計

### デザインコンセプト
- **Glass Morphism**: 透明感のあるモダンなデザイン
- **グラデーション**: 美しい色彩表現
- **レスポンシブ**: モバイルファーストアプローチ
- **アクセシビリティ**: WAI-ARIA準拠

### カラーパレット
```css
--primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
--info: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)
--success: linear-gradient(135deg, #00b894 0%, #00a085 100%)
--accent: linear-gradient(135deg, #fd79a8 0%, #e84393 100%)
```

## 🔒 セキュリティ

### プライバシー保護
- IPアドレス情報は統計目的のみで使用
- 個人特定可能な情報は収集しない
- データは匿名化されて保存

### セキュリティ機能
- HTTPS通信の強制
- XSS攻撃対策
- 入力値検証
- レート制限

## 🧪 テスト

### ユニットテスト（今後実装予定）
```bash
npm run test
```

### 統合テスト（今後実装予定）
```bash
npm run test:integration
```

## 📊 パフォーマンス

### フロントエンド最適化
- **Code Splitting**: 必要な部分のみ読み込み
- **Tree Shaking**: 未使用コードの除去
- **Lazy Loading**: 画像の遅延読み込み
- **Caching**: ブラウザキャッシュの活用

### バックエンド効率性
- **Query関数**: 読み取り専用の高速処理
- **メモリ効率**: 最小限のデータ構造
- **計算量最適化**: O(1)〜O(n)の効率的なアルゴリズム

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 📞 サポート

### ドキュメント
- [バックエンドアーキテクチャ](docs/backend-architecture.md)
- [フロントエンドアーキテクチャ](docs/frontend-architecture.md)

### 参考リソース
- [Internet Computer 公式ドキュメント](https://internetcomputer.org/docs/current/developer-docs/)
- [Motoko言語ガイド](https://internetcomputer.org/docs/current/motoko/main/motoko/)
- [React公式ドキュメント](https://react.dev/)
- [TypeScript公式ドキュメント](https://www.typescriptlang.org/docs/)

## 🎯 今後のロードマップ

### v1.1.0 (近日公開予定)
- [ ] Progressive Web App (PWA) 対応
- [ ] ダークモード実装
- [ ] 詳細統計機能

### v1.2.0 (計画中)
- [ ] リアルタイム更新機能
- [ ] 多言語対応
- [ ] 高度な地図機能

### v2.0.0 (長期計画)
- [ ] 機械学習による分析
- [ ] API公開機能
- [ ] 管理者ダッシュボード

---

**Internet Computer上で動作する次世代の分散Webアプリケーション**

Made with ❤️ for the decentralized web