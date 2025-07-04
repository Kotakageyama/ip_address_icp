# IP Address Tracker

ICP上でIPアドレスと位置情報を表示するFull on Chainサイト

## 🌍 概要

このプロジェクトは、Internet Computer (ICP) 上で動作するIPアドレストラッカーです。ユーザーのIPアドレスと位置情報をリアルタイムで取得・表示し、グローバルな訪問者統計を提供します。

## ⚡ 新しいフロントエンド (Re-architected)

### feat/rewrite-frontend ブランチ

完全に新しく設計されたフロントエンドで、以下の問題を解決：

- ✅ TLS証明書エラーの完全解決
- ✅ ローカル環境での証明書警告ゼロ
- ✅ 動的canister ID注入
- ✅ DFX_NETWORK自動判定
- ✅ モダンな技術スタック

### 技術スタック

- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS 
- **State**: TanStack Query
- **Backend**: Motoko (Internet Computer)
- **Linting**: ESLint (Airbnb TypeScript) + Prettier

### フォルダ構成

```
apps/
  web/                    # 新しいReactフロントエンド
    src/
      components/         # UIコンポーネント
      lib/               # ICP Clientラッパー
src/
  backend/               # Motokoバックエンド
```

## 🚀 クイックスタート

### 新しいフロントエンドを使用する場合

1. 依存関係をインストール:
   ```bash
   pnpm install
   ```

2. ローカルICレプリカを起動:
   ```bash
   pnpm start
   ```

3. バックエンドをデプロイ:
   ```bash
   dfx deploy ip_address_backend
   ```

4. フロントエンド開発サーバーを起動:
   ```bash
   pnpm dev
   # または直接
   pnpm web:dev
   ```

5. ブラウザで `http://localhost:3000` を開く

### 本番デプロイ

```bash
# ビルド & デプロイ
pnpm deploy-local  # ローカル環境
pnpm deploy-ic     # IC本番環境
```

## 📋 利用可能なスクリプト

- `pnpm dev` - 開発サーバー起動
- `pnpm build` - プロダクションビルド
- `pnpm start` - ICレプリカ起動
- `pnpm deploy-local` - ローカルデプロイ
- `pnpm deploy-ic` - IC本番デプロイ
- `pnpm web:lint` - リント実行
- `pnpm web:format` - コードフォーマット

## 🔧 バックエンドAPI

### 主要機能

- `getLatestVisits(count)` - 最新訪問者リスト取得
- `getStats()` - 総訪問数・ユニーク国数統計
- `recordVisitFromClient(ip)` - クライアントからの訪問記録
- `getStaticMap(lat, lon, zoom, width, height)` - 静的マップ画像生成

## 🌟 主要機能

- **🌍 リアルタイム位置追跡**: ユーザーのIPアドレスから位置情報を取得
- **📊 グローバル統計**: 総訪問数とユニーク国数を表示
- **🗺️ 静的マップ生成**: 位置情報から地図画像を生成
- **🕒 訪問履歴**: 最新の訪問者一覧を表示
- **⚡ 高速読み込み**: TanStack Queryによる効率的な状態管理
- **🎨 モダンUI**: Tailwind CSSによる美しいレスポンシブデザイン

## ⚠️ トラブルシューティング

### 証明書エラーの解決

新しいフロントエンドは以下で証明書問題を自動解決：

- ローカル開発でのroot key自動取得
- ネットワーク環境の自動判定
- 適切なホスト設定の動的適用

### Canister接続問題

1. バックエンドcanisterがデプロイされているか確認
2. 環境変数のcanister IDを確認
3. ネットワーク設定(local vs IC)を確認

## 📄 ライセンス

MIT License

## 👥 開発者

ICP Developer
