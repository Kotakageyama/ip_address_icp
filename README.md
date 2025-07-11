# WebRTC IP 漏洩チェッカー on Internet Computer

Internet Computer (ICP) 上で動作する WebRTC による IP アドレス漏洩診断ツールです。

<img width="1203" height="817" alt="img_IP_ICP" src="https://github.com/user-attachments/assets/5e3c45ae-5681-444e-92f5-c0563ae0d6a4" />

## 概要

WebRTC プロトコルを使用してあなたの実際の IP アドレスを検出し、VPN やプロキシを使用していても漏洩する可能性のある情報を可視化します。

こちらはMotokoの学習のために作成したリポジトリです。本番環境には適切ではありません。

## 注意
IPアドレス情報を取得するサービスプロバイダは https://ipapi.co/ です。
こちら無料プランでは本番環境での利用は不適切であり、利用規約としても取得したデータを永続的に保持することは認められないとしています。

> (v) cache, store, or retain any data or information, including but not limited to the location of an IP address, obtained from the Services beyond the minimum time necessary for immediate use, which shall not exceed 24 hours. You must re-fetch any required data from the Services for each instance of subsequent use. You are expressly prohibited from creating any persistent copy, database, or archive of the data obtained from the Services, regardless of format or storage medium. Any data obtained from the Services must be treated as ephemeral and must not persist on your systems or those of your end users beyond the immediate context of its use.

そのため本番キャニスター上にIP情報を保持するサイトを展開すると規約違反に引っかかる可能性があるためおやめください。

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
