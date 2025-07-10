# WebRTC IP 漏洩チェッカー on Internet Computer

Internet Computer (ICP) 上で動作する WebRTC による IP アドレス漏洩診断ツールです。

<img width="1203" height="817" alt="img_IP_ICP" src="https://github.com/user-attachments/assets/5e3c45ae-5681-444e-92f5-c0563ae0d6a4" />

## 概要

WebRTC プロトコルを使用してあなたの実際の IP アドレスを検出し、VPN やプロキシを使用していても漏洩する可能性のある情報を可視化します。

## URLs
- Frontend canister via browser
  - https://xysua-saaaa-aaaaj-qnq5q-cai.icp0.io/
- Backend canister via Candid interface
  - https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=x7tsu-7yaaa-aaaaj-qnq5a-cai

## セットアップ

### 前提条件

- DFX (Internet Computer SDK)
- Node.js v16 以上
- npm

### インストールと実行

```bash
# DFXローカルネットワークを起動
dfx start --background

npm run setup

npm start
```

ブラウザで `http://localhost:3000` にアクセスしてください。

## 技術スタック

- **フロントエンド**: React 18, TypeScript, Vite
- **バックエンド**: Motoko, Internet Computer
- **その他**: WebRTC, Leaflet Maps

## ライセンス

MIT License

## 謝辞

このリポジトリは 公式Docsにて紹介されていた[rvanasa/vite-react-motoko](https://github.com/rvanasa/vite-react-motoko/tree/main) を参考にしています。

初めてのICP開発はこのリポジトリがなければできなかったと思います。本当にありがとうございました。
