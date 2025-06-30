# WebRTC IP 漏洩チェッカー on Internet Computer

Internet Computer (ICP) 上で動作する WebRTC による IP アドレス漏洩診断ツールです。

## 概要

WebRTC プロトコルを使用してあなたの実際の IP アドレスを検出し、VPN やプロキシを使用していても漏洩する可能性のある情報を可視化します。

## セットアップ

### 前提条件

-   DFX (Internet Computer SDK)
-   Node.js v16 以上
-   npm

### インストールと実行

```bash
# DFXローカルネットワークを起動
dfx start --background

# 依存関係をインストール
npm install

# Canisterをデプロイ
dfx deploy --network local

# 開発サーバーを起動
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスしてください。

## 技術スタック

-   **フロントエンド**: React 18, TypeScript, Vite
-   **バックエンド**: Motoko, Internet Computer
-   **その他**: WebRTC, Leaflet Maps

## ライセンス

MIT License
