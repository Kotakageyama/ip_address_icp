# バックエンドアーキテクチャ

## 概要

Internet Computer (ICP) 上で動作する Motoko 言語で書かれた Canister。IP アドレス情報と位置データの永続化、統計情報の管理を行います。

## 技術スタック

-   **言語**: Motoko
-   **実行環境**: Internet Computer Canister
-   **データストレージ**: Canister 内メモリ
-   **通信プロトコル**: Candid IDL

## データモデル

```motoko
public type IpInfo = {
    ip: Text;
    country: Text;
    region: Text;
    city: Text;
    latitude: Text;
    longitude: Text;
    timezone: Text;
    isp: Text;
    timestamp: Int;
};
```

## API 関数

-   `recordVisit(ipInfo: IpInfo): async Bool` - 訪問記録
-   `getLatestVisits(count: Nat): async [IpInfo]` - 最新の訪問記録取得
-   `getAllVisits(): async [IpInfo]` - 全訪問記録取得
-   `getStats(): async {totalVisits: Nat; uniqueCountries: Nat}` - 統計取得
-   `whoami(): async Text` - Canister 識別情報取得

## デプロイメント

```bash
# ローカル開発
dfx start --background
dfx deploy --network local

# 本番環境
dfx deploy --network ic
```
