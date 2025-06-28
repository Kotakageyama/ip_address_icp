import Time "mo:base/Time";
import Array "mo:base/Array";
import Text "mo:base/Text";
import Buffer "mo:base/Buffer";
import Int "mo:base/Int";
import Debug "mo:base/Debug";
import Nat "mo:base/Nat";

actor IpAddressBackend {
  // IPアドレス情報の型定義
  public type IpInfo = {
    ip : Text;
    country : Text;
    region : Text;
    city : Text;
    latitude : Text;
    longitude : Text;
    timezone : Text;
    isp : Text;
    timestamp : Int;
  };

  // アップグレード時にデータを保持するためのstable variable
  private stable var stableVisits : [IpInfo] = [];
  private stable var totalVisitsCount : Nat = 0;

  // 実行時の効率的なデータ操作用Buffer
  private var visitBuffer = Buffer.Buffer<IpInfo>(0);

  // 国別カウント用のキャッシュ（パフォーマンス向上）
  private var uniqueCountriesCache : [Text] = [];
  private var cacheInvalidated : Bool = true;

  // システム初期化：アップグレード後の処理
  system func postupgrade() {
    Debug.print("Postupgrade: データを復元中...");
    visitBuffer := Buffer.fromArray<IpInfo>(stableVisits);
    totalVisitsCount := visitBuffer.size();
    cacheInvalidated := true;
    Debug.print("Postupgrade: " # Int.toText(totalVisitsCount) # " 件のデータを復元しました");
  };

  // システム終了：アップグレード前の処理
  system func preupgrade() {
    Debug.print("Preupgrade: データを保存中...");
    stableVisits := Buffer.toArray(visitBuffer);
    Debug.print("Preupgrade: " # Int.toText(stableVisits.size()) # " 件のデータを保存しました");
  };

  // IPアドレス情報を記録（効率的なBuffer追加）
  public func recordVisit(ipInfo : IpInfo) : async Bool {
    let newInfo = {
      ip = ipInfo.ip;
      country = ipInfo.country;
      region = ipInfo.region;
      city = ipInfo.city;
      latitude = ipInfo.latitude;
      longitude = ipInfo.longitude;
      timezone = ipInfo.timezone;
      isp = ipInfo.isp;
      timestamp = Time.now();
    };

    // Buffer.add() は O(1) の操作（配列全体コピーなし）
    visitBuffer.add(newInfo);
    totalVisitsCount += 1;
    cacheInvalidated := true; // キャッシュを無効化

    Debug.print("新しい訪問を記録: " # newInfo.country # " から " # newInfo.ip);
    true;
  };

  // 最新の訪問記録を取得（ページング対応）
  public query func getLatestVisits(count : Nat) : async [IpInfo] {
    let total = visitBuffer.size();
    if (total == 0) {
      return [];
    };

    if (count >= total) {
      return Buffer.toArray(visitBuffer);
    };

    // 効率的な後ろからN件取得
    let resultBuffer = Buffer.Buffer<IpInfo>(count);
    // 安全なインデックス計算（アンダーフロー防止）
    let startIndex = if (count == 0) {
      0;
    } else if (count >= total) {
      0;
    } else {
      // アンダーフロー安全な減算
      Int.abs(total - count);
    };

    var i = startIndex;
    while (i < total) {
      switch (visitBuffer.getOpt(i)) {
        case (?item) { resultBuffer.add(item) };
        case null { /* skip */ };
      };
      i += 1;
    };

    Buffer.toArray(resultBuffer);
  };

  // ページング機能付きの訪問記録取得
  public query func getVisitsPaged(page : Nat, pageSize : Nat) : async {
    visits : [IpInfo];
    totalPages : Nat;
    currentPage : Nat;
    totalItems : Nat;
  } {
    let total = visitBuffer.size();
    // 安全な総ページ数計算（オーバーフロー対策）
    let totalPages = if (total == 0 or pageSize == 0) {
      0;
    } else {
      // 安全な除算でページ数計算
      if (total % pageSize == 0) {
        total / pageSize;
      } else {
        total / pageSize + 1;
      };
    };

    if (page >= totalPages or pageSize == 0) {
      return {
        visits = [];
        totalPages = totalPages;
        currentPage = page;
        totalItems = total;
      };
    };

    // 安全な開始インデックス計算（オーバーフロー対策）
    let startIndex = if (page == 0 or pageSize == 0) {
      0;
    } else if (page > total / pageSize) {
      total;
    } else {
      page * pageSize;
    };
    // 安全な終了インデックス計算（オーバーフロー対策）
    // 安全な終了インデックス計算（アンダーフロー防止）
    let endIndex = if (startIndex > total) {
      total;
    } else if (startIndex == total) {
      total;
    } else {
      // アンダーフロー安全な減算
      let remainingItems = Int.abs(total - startIndex);
      if (pageSize > remainingItems) { total } else { startIndex + pageSize };
    };
    let resultBuffer = Buffer.Buffer<IpInfo>(pageSize);

    var i = startIndex;
    while (i < endIndex) {
      switch (visitBuffer.getOpt(i)) {
        case (?item) { resultBuffer.add(item) };
        case null { /* skip */ };
      };
      i += 1;
    };

    {
      visits = Buffer.toArray(resultBuffer);
      totalPages = totalPages;
      currentPage = page;
      totalItems = total;
    };
  };

  // 全ての訪問記録を取得（大量データ対応）
  public query func getAllVisits() : async [IpInfo] {
    Buffer.toArray(visitBuffer);
  };

  // 効率的な統計情報計算（キャッシュ付き）
  public query func getStats() : async {
    totalVisits : Nat;
    uniqueCountries : Nat;
  } {
    // キャッシュが無効化されている場合のみ再計算
    if (cacheInvalidated) {
      updateCountriesCache();
    };

    {
      totalVisits = visitBuffer.size();
      uniqueCountries = uniqueCountriesCache.size();
    };
  };

  // 国別統計の詳細情報
  public query func getCountryStats() : async [(Text, Nat)] {
    if (cacheInvalidated) {
      updateCountriesCache();
    };

    // 国別の訪問数をカウント
    var countryStats : [(Text, Nat)] = [];

    for (country in uniqueCountriesCache.vals()) {
      var count = 0;
      for (visit in visitBuffer.vals()) {
        if (visit.country == country) {
          count += 1;
        };
      };
      countryStats := Array.append(countryStats, [(country, count)]);
    };

    countryStats;
  };

  // プライベート関数：国別キャッシュの更新
  private func updateCountriesCache() {
    var countries : [Text] = [];

    for (visit in visitBuffer.vals()) {
      let countryExists = Array.find<Text>(countries, func(c : Text) : Bool { c == visit.country });
      switch (countryExists) {
        case null {
          countries := Array.append(countries, [visit.country]);
        };
        case (?_) { /* 既に存在 */ };
      };
    };

    uniqueCountriesCache := countries;
    cacheInvalidated := false;
  };

  // データクリア機能（管理用）
  public func clearAllData() : async Bool {
    visitBuffer.clear();
    totalVisitsCount := 0;
    uniqueCountriesCache := [];
    cacheInvalidated := true;
    Debug.print("全データをクリアしました");
    true;
  };

  // メモリ使用状況の取得
  public query func getMemoryStats() : async {
    totalVisits : Nat;
    bufferCapacity : Nat;
    uniqueCountries : Nat;
  } {
    {
      totalVisits = visitBuffer.size();
      bufferCapacity = visitBuffer.capacity();
      uniqueCountries = uniqueCountriesCache.size();
    };
  };

  // システム情報
  public query func whoami() : async Text {
    "IP Address Tracker Canister on Internet Computer (Scalable Version v2.0)";
  };
};
