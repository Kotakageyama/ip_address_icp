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
import Error "mo:base/Error";

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
    } = actor ("aaaaa-aa"); // 管理キャニスターID

    // より詳細なデバッグ情報を出力
    Debug.print("HTTP Request URL: " # args.url);
    Debug.print("HTTP Request Headers: " # debug_show (args.headers));
    Debug.print("HTTP Request max_response_bytes: " # debug_show (args.max_response_bytes));

    try {
      let response = await ic.http_request(args);
      Debug.print("HTTP Response Status: " # Nat.toText(response.status));
      Debug.print("HTTP Response Headers: " # debug_show (response.headers));
      Debug.print("HTTP Response Body Size: " # Nat.toText(response.body.size()));
      response;
    } catch (error) {
      Debug.print("HTTP Request Error: リクエストが失敗しました");
      throw error;
    };
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

    // localModeの場合は初期テストデータを生成
    if (localMode and visitBuffer.size() == 0) {
      generateInitialTestData();
    };

    Debug.print("Postupgrade: " # Int.toText(totalVisitsCount) # " 件のデータを復元しました");
  };

  // システム終了：アップグレード前の処理
  system func preupgrade() {
    Debug.print("Preupgrade: データを保存中...");
    stableVisits := Buffer.toArray(visitBuffer);
    Debug.print("Preupgrade: " # Int.toText(stableVisits.size()) # " 件のデータを保存しました");
  };

  // レスポンスの変換関数（コンセンサス用）
  public query func transform(
    args : {
      response : HttpRequestResult;
      context : Blob;
    }
  ) : async HttpRequestResult {
    // デバッグ情報をログ出力
    Debug.print("Transform function called");
    Debug.print("Original status: " # Nat.toText(args.response.status));
    Debug.print("Original body size: " # Nat.toText(args.response.body.size()));
    Debug.print("Original headers: " # debug_show (args.response.headers));

    // より厳密にレスポンスを正規化
    let normalizedHeaders = [
      { name = "Content-Type"; value = "application/json" },
      { name = "Cache-Control"; value = "no-cache" },
    ];

    let result = {
      status = args.response.status;
      body = args.response.body;
      headers = normalizedHeaders; // 一貫したヘッダーを設定
    };

    Debug.print("Transform result status: " # Nat.toText(result.status));
    Debug.print("Transform result body size: " # Nat.toText(result.body.size()));

    result;
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

  // マスクされたIPアドレスで情報を取得して記録
  private func recordVisitByIpWithMask(originalIp : Text, maskedIp : Text) : async Result.Result<IpInfo, Text> {
    try {
      // localModeの場合はテストデータを使用
      if (localMode) {
        let testIpInfo : IpInfo = {
          ip = maskedIp; // マスクされたIPを使用
          country = "日本";
          region = "東京都";
          city = "渋谷区";
          latitude = "35.6762";
          longitude = "139.6503";
          timezone = "Asia/Tokyo";
          isp = "Test ISP";
          timestamp = Time.now();
        };

        visitBuffer.add(testIpInfo);
        totalVisitsCount += 1;
        cacheInvalidated := true;

        Debug.print("テストモード: 新しい訪問を記録（マスク版）: " # testIpInfo.country # " から " # testIpInfo.ip);
        return #ok(testIpInfo);
      };

      Debug.print("HTTPS Outcall開始: " # originalIp # " -> " # maskedIp);

      // フォールバック機能付きでIPアドレス情報を取得
      let apiResult = await fetchIpInfoWithFallback(originalIp);
      let decoded_text = switch (apiResult) {
        case (#ok(text)) {
          Debug.print("IPアドレス情報取得成功: " # Nat.toText(Text.size(text)) # " bytes");
          text;
        };
        case (#err(errorMsg)) {
          Debug.print("IPアドレス情報取得失敗: " # errorMsg);
          return #err(errorMsg);
        };
      };

      // JSON応答をパースしてIP情報を作成（マスクされたIPを使用）
      let parsedIp = maskedIp; // 元のIPではなくマスクされたIPを使用
      let country = extractJsonValue(decoded_text, "country_name");
      let region = extractJsonValue(decoded_text, "region");
      let city = extractJsonValue(decoded_text, "city");
      let latitude = extractJsonValue(decoded_text, "latitude");
      let longitude = extractJsonValue(decoded_text, "longitude");
      let timezone = extractJsonValue(decoded_text, "timezone");
      let org = extractJsonValue(decoded_text, "org");

      Debug.print("JSON解析結果: country=" # country);

      if (country == "") {
        Debug.print("無効なJSON応答");
        return #err("Invalid JSON response: " # decoded_text);
      };

      let ipInfo : IpInfo = {
        ip = parsedIp; // マスクされたIPを記録
        country = country;
        region = region;
        city = city;
        latitude = latitude;
        longitude = longitude;
        timezone = timezone;
        isp = org;
        timestamp = Time.now();
      };

      // 訪問情報を記録
      visitBuffer.add(ipInfo);
      totalVisitsCount += 1;
      cacheInvalidated := true; // キャッシュを無効化

      Debug.print("新しい訪問を記録（マスク版）: " # ipInfo.country # " から " # ipInfo.ip);
      #ok(ipInfo);

    } catch (_error) {
      let errorMsg = "HTTPSアウトコール処理中にエラーが発生しました";
      Debug.print(errorMsg);
      #err(errorMsg);
    };
  };

  // IPアドレスから自動的に情報を取得して記録
  public func recordVisitByIp(ip : Text) : async Result.Result<Bool, Text> {
    try {
      // localModeの場合はテストデータを使用
      if (localMode) {
        let testIpInfo : IpInfo = {
          ip = ip;
          country = "日本";
          region = "東京都";
          city = "渋谷区";
          latitude = "35.6762";
          longitude = "139.6503";
          timezone = "Asia/Tokyo";
          isp = "Test ISP";
          timestamp = Time.now();
        };

        visitBuffer.add(testIpInfo);
        totalVisitsCount += 1;
        cacheInvalidated := true;

        Debug.print("テストモード: 新しい訪問を記録: " # testIpInfo.country # " から " # testIpInfo.ip);
        return #ok(true);
      };

      // IPv6をサポートするipapi.coを使用してIP情報を取得
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

      // HTTPリクエストを実行（HTTPS outcall用に約100M cyclsを追加）
      let http_response : HttpRequestResult = await (with cycles = 100_000_000) httpRequest(request);
      if (http_response.status != 200) {
        return #err("HTTP Error: " # Nat.toText(http_response.status));
      };

      let decoded_text : Text = switch (Text.decodeUtf8(http_response.body)) {
        case (null) { return #err("Failed to decode response") };
        case (?text) { text };
      };

      // JSON応答をパースしてIP情報を作成
      let parsedIp = extractJsonValue(decoded_text, "ip");
      let country = extractJsonValue(decoded_text, "country_name");
      let region = extractJsonValue(decoded_text, "region");
      let city = extractJsonValue(decoded_text, "city");
      let latitude = extractJsonValue(decoded_text, "latitude");
      let longitude = extractJsonValue(decoded_text, "longitude");
      let timezone = extractJsonValue(decoded_text, "timezone");
      let org = extractJsonValue(decoded_text, "org");

      if (parsedIp == "" or country == "") {
        return #err("Invalid JSON response");
      };

      let ipInfo : IpInfo = {
        ip = maskIpAddress(parsedIp); // IPアドレスをマスクして記録
        country = country;
        region = region;
        city = city;
        latitude = latitude;
        longitude = longitude;
        timezone = timezone;
        isp = org;
        timestamp = Time.now();
      };

      // 訪問情報を記録
      visitBuffer.add(ipInfo);
      totalVisitsCount += 1;
      cacheInvalidated := true; // キャッシュを無効化

      Debug.print("新しい訪問を記録: " # ipInfo.country # " から " # ipInfo.ip);
      #ok(true);

    } catch (_) {
      #err("Request failed");
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
      // localModeの場合はテスト画像のBase64データを返す
      if (localMode) {
        // 小さなテスト用のPNG画像（1x1ピクセルの透明画像）のBase64
        let testImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        let dataUrl = "data:image/png;base64," # testImageBase64;
        Debug.print("テストモード: 静的マップを返しました");
        return #ok(dataUrl);
      };

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

      // HTTPリクエストを実行（HTTPS outcall用に約100M cyclsを追加）
      Debug.print("Static map request URL: " # url);
      let http_response : HttpRequestResult = await (with cycles = 100_000_000) httpRequest(request);

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

  // システム情報
  public query func whoami() : async Text {
    "IP Address Tracker Canister on Internet Computer (Scalable Version v2.0)";
  };

  // HTTPリクエストからクライアントIPアドレスを取得
  public func getClientIpFromRequest() : async Result.Result<Text, Text> {
    // ICPでは、IC0インターフェイスを通じてリクエスト情報にアクセスできます
    // ただし、この機能は制限されているため、代替手段を使用します

    // 注意: ICPのFullOnChainでは、直接的なクライアントIP取得は技術的に困難です
    // 以下のアプローチが考えられます：

    // 1. フロントエンドからIPアドレスを明示的に送信してもらう
    // 2. WebRTCを使用してクライアント側でIPを取得し、それをcanisterに送信
    // 3. 外部サービス（STUN server）を使用

    #err("FullOnChainではクライアントIPの直接取得は不可能です。フロントエンドから明示的に送信する必要があります。");
  };

  // クライアントから送信されたIPアドレスで訪問を記録
  public func recordVisitFromClient(clientIp : Text) : async Result.Result<IpInfo, Text> {
    try {
      // IPアドレスをマスクする
      let maskedIp = maskIpAddress(clientIp);

      // localModeの場合はテストデータを直接返す
      if (localMode) {
        let testIpInfo : IpInfo = {
          ip = maskedIp; // マスクされたIPを使用
          country = "日本";
          region = "東京都";
          city = "渋谷区";
          latitude = "35.6762";
          longitude = "139.6503";
          timezone = "Asia/Tokyo";
          isp = "Test ISP";
          timestamp = Time.now();
        };

        visitBuffer.add(testIpInfo);
        totalVisitsCount += 1;
        cacheInvalidated := true;

        Debug.print("テストモード: クライアント訪問を記録: " # testIpInfo.country # " から " # testIpInfo.ip);
        return #ok(testIpInfo);
      };

      // IPアドレスの基本的な検証（元のIPで検証）
      if (clientIp == "" or not isValidIpAddress(clientIp)) {
        return #err("無効なIPアドレスです: " # clientIp);
      };

      // 元のIPでIP情報を取得してから、マスクして記録
      let recordResult = await recordVisitByIpWithMask(clientIp, maskedIp);
      switch (recordResult) {
        case (#ok(ipInfo)) {
          #ok(ipInfo);
        };
        case (#err(msg)) { #err("記録失敗: " # msg) };
      };
    } catch (_) {
      #err("処理中にエラーが発生しました");
    };
  };

  // IPアドレスのマスキング関数
  private func maskIpAddress(ip : Text) : Text {
    let parts = Text.split(ip, #char '.');
    var partArray : [Text] = [];
    var partCount = 0;

    for (part in parts) {
      partCount += 1;
      if (partCount <= 2) {
        partArray := Array.append(partArray, [part]);
      } else {
        partArray := Array.append(partArray, ["xxx"]);
      };
    };

    // IPv6の場合
    if (Text.contains(ip, #char ':')) {
      let ipv6Parts = Text.split(ip, #char ':');
      var ipv6Array : [Text] = [];
      var ipv6Count = 0;

      for (part in ipv6Parts) {
        ipv6Count += 1;
        if (ipv6Count <= 2) {
          ipv6Array := Array.append(ipv6Array, [part]);
        } else {
          ipv6Array := Array.append(ipv6Array, ["xxxx"]);
        };
      };

      return Text.join(":", ipv6Array.vals());
    };

    Text.join(".", partArray.vals());
  };

  // 簡単なIPアドレス検証
  private func isValidIpAddress(ip : Text) : Bool {
    // IPv4の基本的な検証（xxx.xxx.xxx.xxx形式）
    let parts = Text.split(ip, #char '.');
    var partCount = 0;

    for (part in parts) {
      partCount += 1;
      if (partCount > 4) return false;

      // 各部分が数字かどうかの簡単なチェック
      if (Text.size(part) == 0 or Text.size(part) > 3) return false;
    };

    partCount == 4;
  };

  // localMode用の初期テストデータ生成
  private func generateInitialTestData() {
    Debug.print("テストモード: 初期テストデータを生成中...");

    let testVisits : [IpInfo] = [
      {
        ip = maskIpAddress("192.168.1.100"); // マスクされたIP
        country = "日本";
        region = "東京都";
        city = "新宿区";
        latitude = "35.6896";
        longitude = "139.6917";
        timezone = "Asia/Tokyo";
        isp = "Test ISP Tokyo";
        timestamp = Time.now() - 3600_000_000_000; // 1時間前
      },
      {
        ip = maskIpAddress("10.0.0.55"); // マスクされたIP
        country = "アメリカ";
        region = "カリフォルニア州";
        city = "サンフランシスコ";
        latitude = "37.7749";
        longitude = "-122.4194";
        timezone = "America/Los_Angeles";
        isp = "Test ISP California";
        timestamp = Time.now() - 7200_000_000_000; // 2時間前
      },
      {
        ip = maskIpAddress("172.16.0.123"); // マスクされたIP
        country = "イギリス";
        region = "イングランド";
        city = "ロンドン";
        latitude = "51.5074";
        longitude = "-0.1278";
        timezone = "Europe/London";
        isp = "Test ISP London";
        timestamp = Time.now() - 10800_000_000_000; // 3時間前
      },
    ];

    for (visit in testVisits.vals()) {
      visitBuffer.add(visit);
    };

    totalVisitsCount := visitBuffer.size();
    cacheInvalidated := true;

    Debug.print("テストモード: " # Int.toText(testVisits.size()) # " 件のテストデータを生成しました");
  };

  // テスト用：手動でテストデータをリセット（localModeでのみ有効）
  public func resetTestData() : async Result.Result<Bool, Text> {
    if (not localMode) {
      return #err("この機能はテストモードでのみ利用可能です");
    };

    visitBuffer := Buffer.Buffer<IpInfo>(0);
    totalVisitsCount := 0;
    cacheInvalidated := true;
    generateInitialTestData();

    #ok(true);
  };

  // 複数のIPアドレス情報取得APIを試行する関数
  private func fetchIpInfoWithFallback(ip : Text) : async Result.Result<Text, Text> {
    // 複数のIPアドレス情報APIエンドポイント（IPv6対応）
    let apis = [
      "https://ipapi.co/" # ip # "/json/",
      "https://api6.ipify.org?format=json&ip=" # ip,
      "https://api.ipgeolocation.io/ipgeo?apiKey=&ip=" # ip # "&format=json",
    ];

    var lastError = "";

    for (apiUrl in apis.vals()) {
      try {
        Debug.print("API試行中: " # apiUrl);

        let request : HttpRequestArgs = {
          url = apiUrl;
          max_response_bytes = ?4000; // レスポンスサイズを増加
          headers = [
            {
              name = "User-Agent";
              value = "Mozilla/5.0 (compatible; ICP-Canister/1.0)";
            },
            { name = "Accept"; value = "application/json" },
            { name = "Accept-Encoding"; value = "identity" }, // 圧縮を無効化
          ];
          body = null;
          method = #get;
          transform = ?{
            function = transform;
            context = Blob.fromArray([]);
          };
        };

        Debug.print("リクエスト送信開始: " # apiUrl);
        Debug.print("使用サイクル数: 200,000,000");

        let http_response : HttpRequestResult = try {
          await (with cycles = 200_000_000) httpRequest(request);
        } catch (httpError) {
          Debug.print("httpRequest内でエラー発生: " # apiUrl);
          throw httpError;
        };

        Debug.print("リクエスト完了 - Status: " # Nat.toText(http_response.status) # ", Body size: " # Nat.toText(http_response.body.size()));

        if (http_response.status == 200) {
          switch (Text.decodeUtf8(http_response.body)) {
            case (?text) {
              Debug.print("API成功: " # apiUrl # " - Response: " # text);
              // ipapi.coの場合のみフル情報を期待
              if (Text.contains(apiUrl, #text "ipapi.co")) {
                return #ok(text);
              } else {
                // 他のAPIの場合は基本的な応答チェック
                if (Text.size(text) > 5) {
                  Debug.print("代替API成功: " # apiUrl);
                  return #ok(text);
                };
              };
            };
            case null {
              lastError := "API応答デコード失敗: " # apiUrl;
              Debug.print(lastError);
            };
          };
        } else {
          lastError := "API HTTPエラー: " # apiUrl # " - Status: " # Nat.toText(http_response.status);
          Debug.print(lastError);

          // エラーレスポンスの内容も確認
          switch (Text.decodeUtf8(http_response.body)) {
            case (?errorText) {
              Debug.print("エラーレスポンス内容: " # errorText);
              lastError := lastError # " - " # errorText;
            };
            case null {
              Debug.print("エラーレスポンスのデコードに失敗");
            };
          };
        };
      } catch (error) {
        // Error.message()を使用してエラーメッセージを取得
        let errorMsg = Error.message(error);
        Debug.print("API例外エラー: " # apiUrl # " - " # errorMsg);
        lastError := "API例外エラー: " # apiUrl # " - " # errorMsg;
      };
    };

    #err("すべてのIPアドレス情報APIが失敗しました。最後のエラー: " # lastError);
  };

};
