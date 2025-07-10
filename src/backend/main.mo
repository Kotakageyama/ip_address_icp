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

import IC "ic:aaaaa-aa";

actor class IpAddressBackend(localMode : Bool) = this {
  Debug.print("IpAddressBackend: LocalMode=" # Bool.toText(localMode));

  // 公式のIC管理キャニスターの型定義を使用
  public type HttpHeader = {
    name : Text;
    value : Text;
  };

  public type HttpMethod = {
    #get;
    #head;
    #post;
  };

  // 公式ドキュメントに基づくHTTPS Outcall実行用のプライベート関数
  private func httpRequest(args : IC.http_request_args) : async IC.http_request_result {
    // 詳細なデバッグ情報を出力
    Debug.print("HTTP Request URL: " # args.url);
    Debug.print("HTTP Request Headers: " # debug_show (args.headers));
    Debug.print("HTTP Request max_response_bytes: " # debug_show (args.max_response_bytes));

    try {
      // 新しい構文でサイクルを付与してHTTP リクエストを実行
      let response = await (with cycles = 230_949_972_000) IC.http_request(args);
      Debug.print("HTTP Response Status: " # Nat.toText(response.status));
      Debug.print("HTTP Response Headers: " # debug_show (response.headers));
      Debug.print("HTTP Response Body Size: " # Nat.toText(response.body.size()));
      response;
    } catch (error) {
      Debug.print("HTTP Request Error: " # Error.message(error));
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

  // 公式ドキュメントに基づくレスポンス変換関数（コンセンサス用）
  public query func transform(
    args : {
      response : IC.http_request_result;
      context : Blob;
    }
  ) : async IC.http_request_result {
    // レスポンスのヘッダーを除去してコンセンサスを確保
    {
      args.response with headers = []; // ヘッダーは不要なので除去
    };
  };

  // JSONから特定のフィールドの値を抽出（改良版）
  private func extractJsonValue(json : Text, field : Text) : Text {
    // 文字列フィールドの場合（"field":"value"）
    let stringPattern = "\"" # field # "\":\"";
    if (Text.contains(json, #text stringPattern)) {
      let parts = Text.split(json, #text stringPattern);
      switch (parts.next()) {
        case null { "" };
        case (?_) {
          switch (parts.next()) {
            case null { "" };
            case (?remaining) {
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
      // 数値フィールドの場合（"field":value）
      let numberPattern = "\"" # field # "\":";
      if (Text.contains(json, #text numberPattern)) {
        extractNumberValue(json, numberPattern);
      } else {
        "";
      };
    };
  };

  // 数値フィールドの値を抽出するヘルパー関数
  private func extractNumberValue(json : Text, pattern : Text) : Text {
    let parts = Text.split(json, #text pattern);
    switch (parts.next()) {
      case null { "" };
      case (?_) {
        switch (parts.next()) {
          case null { "" };
          case (?remaining) {
            var result = "";
            let chars = remaining.chars();
            var foundStart = false;

            label charLoop loop {
              switch (chars.next()) {
                case null { break charLoop };
                case (?ch) {
                  if (ch == ' ' and not foundStart) {
                    // 先頭のスペースをスキップ
                  } else if (ch == ',' or ch == '}' or ch == '\n' or ch == '\r' or ch == ' ') {
                    // 終了文字に到達
                    break charLoop;
                  } else {
                    foundStart := true;
                    result := result # Text.fromChar(ch);
                  };
                };
              };
            };
            result;
          };
        };
      };
    };
  };

  // ApiIpInfo型定義に基づく複数フィールド対応パース関数
  private func parseApiField(json : Text, fieldNames : [Text]) : Text {
    for (fieldName in fieldNames.vals()) {
      let value = extractJsonValue(json, fieldName);
      if (value != "") {
        return value;
      };
    };
    "";
  };

  // 緯度経度をloc フィールド（"lat,lon"形式）からパースするヘルパー関数
  private func parseLocationFromLoc(json : Text) : (Text, Text) {
    let loc = extractJsonValue(json, "loc");
    if (loc != "" and Text.contains(loc, #char ',')) {
      let parts = Text.split(loc, #char ',');
      switch (parts.next()) {
        case (?lat) {
          switch (parts.next()) {
            case (?lon) { (lat, lon) };
            case null { ("", "") };
          };
        };
        case null { ("", "") };
      };
    } else {
      ("", "");
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
      // ApiIpInfo型定義に基づく複数フィールド対応パース
      let parsedIp = maskedIp; // 元のIPではなくマスクされたIPを使用
      let country = parseApiField(decoded_text, ["country_name", "country"]);
      let region = parseApiField(decoded_text, ["region", "regionName"]);
      let city = parseApiField(decoded_text, ["city"]);

      // 緯度経度は複数形式に対応（直接フィールドまたはloc フィールドから）
      let latitude = parseApiField(decoded_text, ["latitude", "lat"]);
      let longitude = parseApiField(decoded_text, ["longitude", "lon"]);
      let (locLat, locLon) = if (latitude == "" or longitude == "") {
        parseLocationFromLoc(decoded_text);
      } else {
        ("", "");
      };
      let finalLatitude = if (latitude != "") { latitude } else { locLat };
      let finalLongitude = if (longitude != "") { longitude } else { locLon };

      let timezone = parseApiField(decoded_text, ["timezone"]);
      let org = parseApiField(decoded_text, ["org", "isp"]);

      Debug.print("JSON解析結果: country=" # country # ", region=" # region # ", city=" # city);

      if (country == "") {
        Debug.print("無効なJSON応答 - country情報が見つかりません");
        Debug.print("レスポンス内容: " # decoded_text);
        return #err("Invalid JSON response: country field not found");
      };

      let ipInfo : IpInfo = {
        ip = parsedIp; // マスクされたIPを記録
        country = country;
        region = region;
        city = city;
        latitude = finalLatitude;
        longitude = finalLongitude;
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
      let request : IC.http_request_args = {
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

      // HTTPリクエストを実行（公式ドキュメントのパターンに従う）
      let http_response : IC.http_request_result = await httpRequest(request);
      if (http_response.status != 200) {
        return #err("HTTP Error: " # Nat.toText(http_response.status));
      };

      let decoded_text : Text = switch (Text.decodeUtf8(http_response.body)) {
        case (null) { return #err("Failed to decode response") };
        case (?text) { text };
      };

      // JSON応答をパースしてIP情報を作成（ApiIpInfo型定義に基づく）
      let parsedIp = parseApiField(decoded_text, ["ip", "query"]);
      let country = parseApiField(decoded_text, ["country_name", "country"]);
      let region = parseApiField(decoded_text, ["region", "regionName"]);
      let city = parseApiField(decoded_text, ["city"]);

      // 緯度経度は複数形式に対応（直接フィールドまたはloc フィールドから）
      let latitude = parseApiField(decoded_text, ["latitude", "lat"]);
      let longitude = parseApiField(decoded_text, ["longitude", "lon"]);
      let (locLat, locLon) = if (latitude == "" or longitude == "") {
        parseLocationFromLoc(decoded_text);
      } else {
        ("", "");
      };
      let finalLatitude = if (latitude != "") { latitude } else { locLat };
      let finalLongitude = if (longitude != "") { longitude } else { locLon };

      let timezone = parseApiField(decoded_text, ["timezone"]);
      let org = parseApiField(decoded_text, ["org", "isp"]);

      Debug.print("JSON解析結果: ip=" # parsedIp # ", country=" # country # ", region=" # region # ", city=" # city);

      if (parsedIp == "" or country == "") {
        Debug.print("重要フィールドが見つかりません - ip:" # parsedIp # ", country:" # country);
        Debug.print("レスポンス内容: " # decoded_text);
        return #err("Invalid JSON response: missing ip or country field");
      };

      let ipInfo : IpInfo = {
        ip = maskIpAddress(parsedIp); // IPアドレスをマスクして記録
        country = country;
        region = region;
        city = city;
        latitude = finalLatitude;
        longitude = finalLongitude;
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

      let request : IC.http_request_args = {
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

      // HTTPリクエストを実行（公式ドキュメントのパターンに従う）
      Debug.print("Static map request URL: " # url);
      let http_response : IC.http_request_result = await httpRequest(request);

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

  // 静的マップ用のレスポンス変換関数（公式ドキュメントに基づく）
  public query func transformStaticMap(
    args : {
      response : IC.http_request_result;
      context : Blob;
    }
  ) : async IC.http_request_result {
    {
      args.response with headers = []; // 画像用のヘッダーは除去してコンセンサスを確保
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
    // 複数のIPアドレス情報APIエンドポイント（IPv6対応、APIキー不要のもののみ）
    let apis = [
      "https://ipapi.co/" # ip # "/json/",
      "https://api.iplocation.net/?ip=" # ip,
      "https://ipwhois.app/json/" # ip,
    ];

    var lastError = "";

    for (apiUrl in apis.vals()) {
      try {
        Debug.print("API試行中: " # apiUrl);

        let request : IC.http_request_args = {
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

        let http_response : IC.http_request_result = try {
          await httpRequest(request);
        } catch (httpError) {
          Debug.print("httpRequest内でエラー発生: " # apiUrl);
          throw httpError;
        };

        Debug.print("リクエスト完了 - Status: " # Nat.toText(http_response.status) # ", Body size: " # Nat.toText(http_response.body.size()));

        if (http_response.status == 200) {
          switch (Text.decodeUtf8(http_response.body)) {
            case (?text) {
              Debug.print("API成功: " # apiUrl # " - Response: " # text);

              // 基本的なJSON応答チェック
              if (Text.size(text) > 10 and (Text.contains(text, #text "{") and Text.contains(text, #text "}"))) {
                // レスポンスに基本的な地理情報が含まれているかチェック
                if (Text.contains(text, #text "country") or Text.contains(text, #text "region") or Text.contains(text, #text "city")) {
                  Debug.print("API成功: " # apiUrl # " - 有効な地理情報を取得");
                  return #ok(text);
                } else {
                  Debug.print("API警告: " # apiUrl # " - 地理情報が不完全");
                  lastError := "API応答に地理情報が不完全: " # apiUrl;
                };
              } else {
                Debug.print("API警告: " # apiUrl # " - 無効なJSON応答");
                lastError := "無効なJSON応答: " # apiUrl;
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
