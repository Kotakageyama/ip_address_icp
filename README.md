# 🛡️ WebRTC IP 漏洩チェッカー on Internet Computer

Internet Computer (ICP) 上で動作する WebRTC による IP アドレス漏洩診断ツールです。WebRTC プロトコルを使用してあなたの実際の IP アドレスを検出し、VPN やプロキシを使用していても漏洩する可能性のある情報を可視化します。

## 🚀 特徴

-   **WebRTC 漏洩検出**: WebRTC プロトコルを使用した実際の IP 漏洩チェック
-   **Full on Chain**: 完全分散アーキテクチャで ICP ネットワーク上で動作
-   **セキュリティ診断**: リアルタイムでプライバシーリスクを評価
-   **漏洩可視化**: 地図上で漏洩した位置情報を表示
-   **対策提案**: WebRTC 漏洩を防ぐための具体的な対策を提示
-   **プライバシー保護**: 診断データは匿名化して表示
-   **レスポンシブデザイン**: モバイル・デスクトップ対応

## 🔍 WebRTC 漏洩とは

WebRTC（Web Real-Time Communication）は、ブラウザ間でのリアルタイム通信を可能にする技術ですが、VPN やプロキシを使用していても、以下の情報が漏洩する可能性があります：

-   **実際のパブリック IP アドレス**
-   **ローカルネットワーク IP アドレス**
-   **ISP（インターネットサービスプロバイダー）情報**
-   **おおよその地理的位置**

このツールは、これらの漏洩を実際に検出し、あなたのプライバシーリスクを評価します。

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
          │   WebRTC STUN     │    │   地図可視化      │
          │  • Google STUN    │    │  • OpenStreetMap  │
          │  • Cloudflare     │    │  • Leaflet Maps   │
          │  • IP検出         │    │  • 漏洩位置表示   │
          └───────────────────┘    └───────────────────┘
```

## 📁 プロジェクト構造

```
webrtc_leak_checker/
├── 📄 README.md                    # このファイル
├── 📄 package.json                 # Node.js依存関係
├── 📄 dfx.json                     # DFXプロジェクト設定
├── 📄 vite.config.ts              # Vite設定
├── 📄 tsconfig.json               # TypeScript設定
├── 📄 index.html                  # Viteエントリーポイント
│
├── 📁 docs/                       # ドキュメント
│   ├── 📄 security-analysis.md    # セキュリティ分析
│   └── 📄 webrtc-leak-guide.md    # WebRTC漏洩対策ガイド
│
├── 📁 src/                        # ソースコード
│   ├── 📁 backend/                # バックエンドCanister
│   │   └── 📄 main.mo             # Motokoメインファイル
│   │
│   ├── 📁 frontend/               # フロントエンド
│   │   ├── 📁 components/         # Reactコンポーネント
│   │   │   ├── 📁 layout/         # レイアウト
│   │   │   │   ├── 📄 Header.tsx  # セキュリティヘッダー
│   │   │   │   └── 📄 Footer.tsx  # フッター
│   │   │   ├── 📁 visitor/        # 漏洩検出
│   │   │   │   ├── 📄 CurrentVisitor.tsx # 漏洩診断結果
│   │   │   │   └── 📄 RecentVisits.tsx   # 漏洩履歴
│   │   │   ├── 📁 map/            # 地図表示
│   │   │   │   └── 📄 StaticMap.tsx # 漏洩位置マップ
│   │   │   └── 📁 stats/          # 統計
│   │   │       └── 📄 Stats.tsx   # 漏洩統計
│   │   │
│   │   ├── 📁 hooks/              # カスタムフック
│   │   │   ├── 📄 useIpLocation.ts # WebRTC IP検出
│   │   │   ├── 📄 useRecentVisits.ts # 漏洩履歴
│   │   │   └── 📄 useStats.ts     # 診断統計
│   │   │
│   │   ├── 📁 services/           # サービス層
│   │   │   └── 📄 icpService.ts   # ICP Canister通信
│   │   │
│   │   ├── 📁 utils/              # ユーティリティ
│   │   │   ├── 📄 formatters.ts   # データフォーマット
│   │   │   └── 📄 validators.ts   # バリデーション
│   │   │
│   │   └── 📁 types/              # TypeScript型定義
│   │       └── 📄 index.ts        # 共通型定義
│   │
│   ├── 📄 App.tsx                 # メインアプリケーション
│   ├── 📄 App.css                 # アプリスタイル
│   ├── 📄 main.tsx                # React エントリーポイント
│   └── 📄 index.css               # グローバルスタイル
```

## 🛠️ 技術スタック

### セキュリティ技術

-   **WebRTC**: リアルタイム通信プロトコル
-   **STUN servers**: NAT 越えと IP 検出
-   **ICE candidates**: ネットワーク候補収集

### バックエンド

-   **Motoko**: ICP 用関数型プログラミング言語
-   **Internet Computer**: 分散コンピューティングプラットフォーム
-   **HTTPS Outcalls**: 外部 API 連携

### フロントエンド

-   **React 18**: モダン UI ライブラリ
-   **TypeScript**: 型安全な開発
-   **Vite**: 高速ビルドツール
-   **Leaflet**: インタラクティブマップライブラリ

## 🚀 セットアップと実行

### 前提条件

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
cd webrtc_leak_checker
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. ローカル開発環境の起動

#### DFX ローカルネットワークの起動

```bash
dfx start --background
```

#### Canister のデプロイ

```bash
dfx deploy --network local
```

#### フロントエンド開発サーバーの起動

```bash
npm run dev
```

### 4. 漏洩チェックの実行

ブラウザで `http://localhost:3000` にアクセスし、WebRTC 漏洩診断を開始します。

## 🔒 セキュリティ対策

### WebRTC 漏洩を防ぐ方法

#### 1. ブラウザ設定での無効化

**Chrome/Edge:**

```
chrome://flags/#disable-webrtc
```

**Firefox:**

```
about:config
media.peerconnection.enabled = false
```

#### 2. ブラウザ拡張機能

-   **WebRTC Leak Prevent** (Chrome)
-   **Disable WebRTC** (Firefox)
-   **uBlock Origin** (全ブラウザ対応)

#### 3. VPN 設定

WebRTC 漏洩対応の VPN サービス:

-   NordVPN (WebRTC 漏洩保護機能)
-   ExpressVPN (DNS 漏洩保護)
-   ProtonVPN (Advanced Leak Protection)

### このツールの安全性

-   **完全匿名**: 個人特定情報は収集しません
-   **一時的**: セッション終了でデータは削除
-   **透明性**: オープンソースで検証可能
-   **分散型**: ICP ネットワークで分散実行

## 📊 診断結果の読み方

### リスクレベル

| レベル | 説明                 | 対策の緊急度   |
| ------ | -------------------- | -------------- |
| 🛡️ 低  | ローカル IP のみ検出 | 予防的対策     |
| ⚠️ 中  | 一部情報が漏洩       | 早期対策推奨   |
| 🚨 高  | パブリック IP が漏洩 | 即座に対策必要 |

### 検出情報の意味

-   **漏洩 IP**: WebRTC で検出された IP アドレス
-   **推定位置**: IP から算出された地理的位置
-   **ISP 情報**: インターネットプロバイダー
-   **リスク評価**: 総合的なプライバシーリスク

## 🌐 プロダクションデプロイ

### IC 本番環境へのデプロイ

```bash
# 本番環境にデプロイ
dfx deploy --network ic

# デプロイされたURLを確認
dfx canister --network ic id ip_address_frontend
```

## 📖 API 仕様

### WebRTC 検出機能

#### `fetchClientIpViaWebRTC(): Promise<string>`

WebRTC プロトコルを使用してクライアント IP を検出

#### `recordVisitFromClient(ip: string): Promise<IpInfo>`

検出された IP アドレスから漏洩情報を記録

#### `getLeakageStats(): Promise<LeakageStats>`

WebRTC 漏洩の統計情報を取得

## 🧪 テスト

### セキュリティテスト

```bash
# WebRTC漏洩テスト
npm run test:webrtc

# VPN漏洩テスト
npm run test:vpn-leak

# プライバシー保護テスト
npm run test:privacy
```

## 🤝 コントリビューション

セキュリティツールとして、以下のガイドラインをお守りください：

1. **セキュリティ第一**: 新機能はプライバシーを侵害しないこと
2. **透明性**: コードは監査可能であること
3. **匿名性**: ユーザーの匿名性を保護すること
4. **教育目的**: セキュリティ意識向上に貢献すること

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。セキュリティツールとして自由に利用・改良してください。

## 📞 サポート

### セキュリティに関する問い合わせ

-   **一般的な質問**: GitHub Issues
-   **セキュリティ脆弱性**: security@example.com
-   **プライバシー問題**: privacy@example.com

### 参考リソース

-   [WebRTC Security Guide](https://webrtcsecurity.github.io/)
-   [Mozilla WebRTC Documentation](https://developer.mozilla.org/docs/Web/API/WebRTC_API)
-   [Internet Computer Security Best Practices](https://internetcomputer.org/docs/current/developer-docs/security/)

## 🎯 今後のロードマップ

### v1.1.0 (近日公開予定)

-   [ ] IPv6 漏洩検出対応
-   [ ] WebRTC フィンガープリンティング検出
-   [ ] 詳細なセキュリティレポート生成

### v1.2.0 (計画中)

-   [ ] 自動セキュリティ監視機能
-   [ ] カスタム STUN サーバー設定
-   [ ] 企業向けセキュリティダッシュボード

### v2.0.0 (長期計画)

-   [ ] AI 駆動のセキュリティ分析
-   [ ] ブラウザ拡張機能版
-   [ ] モバイルアプリ版

---

**WebRTC によるプライバシー漏洩からあなたを守る、次世代のセキュリティツール**

🛡️ あなたのプライバシーを守ります 🛡️
