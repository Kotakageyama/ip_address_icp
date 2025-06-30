import Time "mo:base/Time";
import Array "mo:base/Array";
import Text "mo:base/Text";
import Buffer "mo:base/Buffer";
import Int "mo:base/Int";
import Debug "mo:base/Debug";
import Nat "mo:base/Nat";
import Nat8 "mo:base/Nat8";
import Nat16 "mo:base/Nat16";
import Blob "mo:base/Blob";
import Result "mo:base/Result";
import Bool "mo:base/Bool";

actor class IpAddressBackend(localMode : Bool) = this {
  Debug.print("IpAddressBackend: LocalMode=" # Bool.toText(localMode));
  // HTTPS Outcalls用の型定義
  public type HttpRequestArgs = {
    url : Text;
    max_response_bytes : ?Nat64;
    headers : [{ name : Text; value : Text }];
    body : ?Blob;
    method : { #get; #head; #post };
    transform : ?{
      function : shared query ({
        response : HttpRequestResult;
        context : Blob;
      }) -> async HttpRequestResult;
      context : Blob;
    };
  };

  public type HttpRequestResult = {
    status : Nat;
    headers : [{ name : Text; value : Text }];
    body : Blob;
  };

  // HTTPS Outcall実行用のプライベート関数
  private func httpRequest(args : HttpRequestArgs) : async HttpRequestResult {
    let ic : actor {
      http_request : HttpRequestArgs -> async HttpRequestResult;
    } = actor ("aaaaa-aa");
    await ic.http_request(args);
  };
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

  // 静的マップのマーカー型定義
  public type Marker = {
    lat : Text;
    lon : Text;
    color : Text;
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

  // HTTPS Outcallsを使用してIPアドレス情報を取得
  public func fetchIpInfo(ip : Text) : async Result.Result<IpInfo, Text> {
    try {
      // IPv6をサポートするipapi.coを使用
      let request : HttpRequestArgs = {
        url = "https://ipapi.co/" # ip # "/json/";
        max_response_bytes = ?2000; // 2KB制限
        headers = [
          { name = "User-Agent"; value = "ICP-Canister/1.0" },
          { name = "Accept"; value = "application/json" },
        ];
        body = null;
        method = #get;
        transform = ?{
          function = transform;
          context = Blob.fromArray([]);
        };
      };
      // HTTPリクエストを実行（HTTPS outcall用に約50M cyclsを追加）
      let http_response : HttpRequestResult = await (with cycles = 50_000_000) httpRequest(request);
      if (http_response.status != 200) {
        return #err("HTTP Error: " # Nat.toText(http_response.status));
      };
      let decoded_text : Text = switch (Text.decodeUtf8(http_response.body)) {
        case (null) { return #err("Failed to decode response") };
        case (?text) { text };
      };
      switch (parseIpInfo(decoded_text)) {
        case (#ok(ipInfo)) { #ok(ipInfo) };
        case (#err(msg)) { #err(msg) };
      };
    } catch (_) {
      #err("Request failed");
    };
  };

  // レスポンスの変換関数（コンセンサス用）
  public query func transform(
    args : {
      response : HttpRequestResult;
      context : Blob;
    }
  ) : async HttpRequestResult {
    {
      status = args.response.status;
      body = args.response.body;
      headers = []; // ヘッダーは除外してコンセンサスを容易にする
    };
  };

  // 簡単なJSONパーサー（IP情報用）
  private func parseIpInfo(json : Text) : Result.Result<IpInfo, Text> {
    let ip = extractJsonValue(json, "ip");
    let country = extractJsonValue(json, "country_name");
    let region = extractJsonValue(json, "region");
    let city = extractJsonValue(json, "city");
    let latitude = extractJsonValue(json, "latitude");
    let longitude = extractJsonValue(json, "longitude");
    let timezone = extractJsonValue(json, "timezone");
    let org = extractJsonValue(json, "org");

    if (ip == "" or country == "") {
      return #err("Invalid JSON response");
    };

    let ipInfo : IpInfo = {
      ip = ip;
      country = country;
      region = region;
      city = city;
      latitude = latitude;
      longitude = longitude;
      timezone = timezone;
      isp = org;
      timestamp = Time.now();
    };

    #ok(ipInfo);
  };

  // JSONから特定のフィールドの値を抽出（簡単な実装）
  private func extractJsonValue(json : Text, field : Text) : Text {
    let pattern = "\"" # field # "\":\"";
    if (Text.contains(json, #text pattern)) {
      // パターンで分割
      let parts = Text.split(json, #text pattern);
      switch (parts.next()) {
        case null { "" };
        case (?_) {
          // 次の部分を取得
          switch (parts.next()) {
            case null { "" };
            case (?remaining) {
              // クォートまでの部分を取得
              let endParts = Text.split(remaining, #text "\"");
              switch (endParts.next()) {
                case null { "" };
                case (?value) { value };
              };
            };
          };
        };
      };
    } else {
      "";
    };
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

  // IPアドレスから自動的に情報を取得して記録
  public func recordVisitByIp(ip : Text) : async Result.Result<Bool, Text> {
    switch (await fetchIpInfo(ip)) {
      case (#ok(ipInfo)) {
        let result = await recordVisit(ipInfo);
        #ok(result);
      };
      case (#err(msg)) {
        #err(msg);
      };
    };
  };

  // マップタイルを取得（OpenStreetMap）
  public func fetchMapTile(z : Nat, x : Nat, y : Nat) : async Result.Result<Blob, Text> {
    try {
      // OpenStreetMapのタイルサーバーを使用
      let url = "https://tile.openstreetmap.org/" # Nat.toText(z) # "/" # Nat.toText(x) # "/" # Nat.toText(y) # ".png";

      let request : HttpRequestArgs = {
        url = url;
        max_response_bytes = ?1048576; // 1MB制限（タイル画像用）
        headers = [
          { name = "User-Agent"; value = "ICP-Canister/1.0" },
          { name = "Accept"; value = "image/png,image/*" },
        ];
        body = null;
        method = #get;
        transform = ?{
          function = transformTile;
          context = Blob.fromArray([]);
        };
      };

      // HTTPリクエストを実行（HTTPS outcall用に約50M cyclsを追加）
      let http_response : HttpRequestResult = await (with cycles = 50_000_000) httpRequest(request);

      // レスポンスのステータスコードをチェック
      if (http_response.status != 200) {
        return #err("HTTP Error: " # Nat.toText(http_response.status));
      };

      #ok(http_response.body);

    } catch (_) {
      #err("Map tile request failed");
    };
  };

  // マップタイル用のレスポンス変換関数
  public query func transformTile(
    args : {
      response : HttpRequestResult;
      context : Blob;
    }
  ) : async HttpRequestResult {
    {
      status = args.response.status;
      body = args.response.body;
      headers = [
        { name = "Content-Type"; value = "image/png" },
        { name = "Cache-Control"; value = "public, max-age=3600" },
      ];
    };
  };

  // 静的マップ画像を取得（OpenStreetMap静的マップサービス）
  public func getStaticMap(
    lat : Text,
    lon : Text,
    zoom : ?Nat8,
    width : ?Nat16,
    height : ?Nat16,
    markers : ?[Marker],
  ) : async Result.Result<Text, Text> {
    try {
      let zoomValue = switch (zoom) {
        case (?z) { Nat8.toNat(z) };
        case null { 14 };
      };
      let widthValue = switch (width) {
        case (?w) { Nat16.toNat(w) };
        case null { 600 };
      };
      let heightValue = switch (height) {
        case (?h) { Nat16.toNat(h) };
        case null { 400 };
      };

      // デフォルトマーカー（指定された座標に赤いマーカー）
      let markersValue = switch (markers) {
        case (?m) { m };
        case null { [{ lat = lat; lon = lon; color = "red" }] };
      };

      let markerParams = buildMarkerParams(markersValue);

      // StaticMap APIのURL構築（複数のサービスでフォールバック）
      // まずOpenStreetMapを試す
      let url = "https://staticmap.openstreetmap.de/staticmap.php" #
      "?center=" # lat # "," # lon #
      "&zoom=" # Nat.toText(zoomValue) #
      "&size=" # Nat.toText(widthValue) # "x" # Nat.toText(heightValue) #
      "&maptype=mapnik" #
      "&format=png" #
      markerParams;

      let request : HttpRequestArgs = {
        url = url;
        max_response_bytes = ?1048576; // 1MB制限
        headers = [
          { name = "User-Agent"; value = "ICP-Canister/1.0" },
          { name = "Accept"; value = "image/png,image/jpeg,image/*" },
        ];
        body = null;
        method = #get;
        transform = ?{
          function = transformStaticMap;
          context = Blob.fromArray([]);
        };
      };

      // HTTPリクエストを実行（HTTPS outcall用に約50M cyclsを追加）
      Debug.print("Static map request URL: " # url);
      let http_response : HttpRequestResult = await (with cycles = 50_000_000) httpRequest(request);

      Debug.print("Static map response status: " # Nat.toText(http_response.status));
      if (http_response.status != 200) {
        let errorBody = switch (Text.decodeUtf8(http_response.body)) {
          case (?text) { text };
          case null { "Unable to decode response body" };
        };
        return #err("HTTP Error: " # Nat.toText(http_response.status) # " - " # errorBody);
      };

      // レスポンスサイズチェック（1MB以下）
      let responseSize = http_response.body.size();
      if (responseSize > 1048576) {
        return #err("Response too large: " # Nat.toText(responseSize) # " bytes");
      };

      // Base64エンコード
      let base64Data = encodeBase64(http_response.body);
      let dataUrl = "data:image/png;base64," # base64Data;

      #ok(dataUrl);

    } catch (_) {
      Debug.print("Static map error occurred");
      #err("Static map request failed");
    };
  };

  // 静的マップ用のレスポンス変換関数
  public query func transformStaticMap(
    args : {
      response : HttpRequestResult;
      context : Blob;
    }
  ) : async HttpRequestResult {
    {
      status = args.response.status;
      body = args.response.body;
      headers = [
        { name = "Content-Type"; value = "image/png" },
        { name = "Cache-Control"; value = "public, max-age=3600" },
      ];
    };
  };

  // マーカーパラメータ構築用のヘルパー関数
  private func buildMarkerParams(markers : [Marker]) : Text {
    if (markers.size() == 0) {
      return "";
    };

    var params = "";
    for (marker in markers.vals()) {
      params := params # "&markers=" # marker.lat # "," # marker.lon # "," # marker.color;
    };
    params;
  };

  // シンプルなBase64エンコード実装
  private func encodeBase64(blob : Blob) : Text {
    let bytes = Blob.toArray(blob);
    let base64CharsArray = [
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
      'K',
      'L',
      'M',
      'N',
      'O',
      'P',
      'Q',
      'R',
      'S',
      'T',
      'U',
      'V',
      'W',
      'X',
      'Y',
      'Z',
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
      'g',
      'h',
      'i',
      'j',
      'k',
      'l',
      'm',
      'n',
      'o',
      'p',
      'q',
      'r',
      's',
      't',
      'u',
      'v',
      'w',
      'x',
      'y',
      'z',
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '+',
      '/',
    ];

    var result = "";
    var i = 0;

    while (i < bytes.size()) {
      let b1 = Nat8.toNat(bytes[i]);
      let b2 = if (i + 1 < bytes.size()) { Nat8.toNat(bytes[i + 1]) } else { 0 };
      let b3 = if (i + 2 < bytes.size()) { Nat8.toNat(bytes[i + 2]) } else { 0 };

      let c1 = b1 / 4;
      let c2 = ((b1 % 4) * 16) + (b2 / 16);
      let c3 = ((b2 % 16) * 4) + (b3 / 64);
      let c4 = b3 % 64;

      result := result # Text.fromChar(base64CharsArray[c1]);
      result := result # Text.fromChar(base64CharsArray[c2]);

      if (i + 1 < bytes.size()) {
        result := result # Text.fromChar(base64CharsArray[c3]);
      } else {
        result := result # "=";
      };

      if (i + 2 < bytes.size()) {
        result := result # Text.fromChar(base64CharsArray[c4]);
      } else {
        result := result # "=";
      };

      i := i + 3;
    };

    result;
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

  // クライアントのグローバルIPアドレスを取得（ipifyを利用）
  public func fetchGlobalIp() : async Result.Result<Text, Text> {
    try {
      let request : HttpRequestArgs = {
        url = "https://api64.ipify.org?format=json";
        max_response_bytes = ?200;
        headers = [
          { name = "User-Agent"; value = "ICP-Canister/1.0" },
          { name = "Accept"; value = "application/json" },
        ];
        body = null;
        method = #get;
        transform = ?{
          function = transform;
          context = Blob.fromArray([]);
        };
      };
      let http_response : HttpRequestResult = await (with cycles = 50_000_000) httpRequest(request);
      if (http_response.status != 200) {
        return #err("HTTP Error: " # Nat.toText(http_response.status));
      };
      let decoded_text : Text = switch (Text.decodeUtf8(http_response.body)) {
        case (null) { return #err("Failed to decode response") };
        case (?text) { text };
      };
      let ip = extractJsonValue(decoded_text, "ip");
      if (ip == "") {
        return #err("Invalid JSON response");
      };
      #ok(ip);
    } catch (_) {
      #err("Request failed");
    };
  };
};
