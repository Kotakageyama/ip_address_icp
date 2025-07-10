import Time "mo:base/Time";
import Text "mo:base/Text";
import Buffer "mo:base/Buffer";
import Int "mo:base/Int";
import Nat "mo:base/Nat";

import Blob "mo:base/Blob";
import Result "mo:base/Result";
import Bool "mo:base/Bool";
import Error "mo:base/Error";

import IC "ic:aaaaa-aa";

actor class IpAddressBackend() {
  public type HttpHeader = {
    name : Text;
    value : Text;
  };

  public type HttpMethod = {
    #get;
    #head;
    #post;
  };

  private func httpRequest(args : IC.http_request_args) : async IC.http_request_result {
    try {
      let response = await (with cycles = 230_949_972_000) IC.http_request(args);
      response;
    } catch (error) {
      throw error;
    };
  };

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

  private stable var stableVisits : [IpInfo] = [];
  private stable var totalVisitsCount : Nat = 0;

  private var visitBuffer = Buffer.Buffer<IpInfo>(0);

  private var uniqueCountriesCache : [Text] = [];
  private var cacheInvalidated : Bool = true;

  system func postupgrade() {
    visitBuffer := Buffer.fromArray<IpInfo>(stableVisits);
    totalVisitsCount := visitBuffer.size();
    cacheInvalidated := true;
  };

  system func preupgrade() {
    stableVisits := Buffer.toArray(visitBuffer);
  };

  public query func transform(
    args : {
      response : IC.http_request_result;
      context : Blob;
    }
  ) : async IC.http_request_result {
    {
      args.response with headers = [];
    };
  };

  private func extractJsonValue(json : Text, field : Text) : Text {
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
      let numberPattern = "\"" # field # "\":";
      if (Text.contains(json, #text numberPattern)) {
        extractNumberValue(json, numberPattern);
      } else {
        "";
      };
    };
  };

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

  private func parseApiField(json : Text, fieldNames : [Text]) : Text {
    for (fieldName in fieldNames.vals()) {
      let value = extractJsonValue(json, fieldName);
      if (value != "") {
        return value;
      };
    };
    "";
  };

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

  private func recordVisitByIpWithMask(originalIp : Text, maskedIp : Text) : async Result.Result<IpInfo, Text> {
    try {
      let apiResult = await fetchIpInfoWithFallback(originalIp);
      let decoded_text = switch (apiResult) {
        case (#ok(text)) {
          text;
        };
        case (#err(errorMsg)) {
          return #err(errorMsg);
        };
      };

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

      if (country == "") {
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

      #ok(ipInfo);

    } catch (_error) {
      let errorMsg = "HTTPSアウトコール処理中にエラーが発生しました";
      #err(errorMsg);
    };
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
    let countriesBuffer = Buffer.Buffer<Text>(0);

    for (visit in visitBuffer.vals()) {
      let countryExists = Buffer.contains<Text>(countriesBuffer, visit.country, Text.equal);
      if (not countryExists) {
        countriesBuffer.add(visit.country);
      };
    };

    uniqueCountriesCache := Buffer.toArray(countriesBuffer);
    cacheInvalidated := false;
  };

  // システム情報
  public query func whoami() : async Text {
    "IP Address Tracker Canister on Internet Computer (Scalable Version v2.0)";
  };

  // クライアントから送信されたIPアドレスで訪問を記録
  public func recordVisitFromClient(clientIp : Text) : async Result.Result<IpInfo, Text> {
    try {
      // IPアドレスをマスクする
      let maskedIp = maskIpAddress(clientIp);

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
    let partBuffer = Buffer.Buffer<Text>(4);
    var partCount = 0;

    for (part in parts) {
      partCount += 1;
      if (partCount <= 2) {
        partBuffer.add(part);
      } else {
        partBuffer.add("xxx");
      };
    };

    // IPv6の場合
    if (Text.contains(ip, #char ':')) {
      let ipv6Parts = Text.split(ip, #char ':');
      let ipv6Buffer = Buffer.Buffer<Text>(8);
      var ipv6Count = 0;

      for (part in ipv6Parts) {
        ipv6Count += 1;
        if (ipv6Count <= 2) {
          ipv6Buffer.add(part);
        } else {
          ipv6Buffer.add("xxxx");
        };
      };

      return Text.join(":", ipv6Buffer.vals());
    };

    Text.join(".", partBuffer.vals());
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

        let http_response : IC.http_request_result = try {
          await httpRequest(request);
        } catch (httpError) {
          throw httpError;
        };

        if (http_response.status == 200) {
          switch (Text.decodeUtf8(http_response.body)) {
            case (?text) {

              // 基本的なJSON応答チェック
              if (Text.size(text) > 10 and (Text.contains(text, #text "{") and Text.contains(text, #text "}"))) {
                // レスポンスに基本的な地理情報が含まれているかチェック
                if (Text.contains(text, #text "country") or Text.contains(text, #text "region") or Text.contains(text, #text "city")) {
                  return #ok(text);
                } else {
                  lastError := "API応答に地理情報が不完全: " # apiUrl;
                };
              } else {
                lastError := "無効なJSON応答: " # apiUrl;
              };
            };
            case null {
              lastError := "API応答デコード失敗: " # apiUrl;
            };
          };
        } else {
          lastError := "API HTTPエラー: " # apiUrl # " - Status: " # Nat.toText(http_response.status);

          // エラーレスポンスの内容も確認
          switch (Text.decodeUtf8(http_response.body)) {
            case (?errorText) {
              lastError := lastError # " - " # errorText;
            };
            case null {};
          };
        };
      } catch (error) {
        // Error.message()を使用してエラーメッセージを取得
        let errorMsg = Error.message(error);
        lastError := "API例外エラー: " # apiUrl # " - " # errorMsg;
      };
    };

    #err("すべてのIPアドレス情報APIが失敗しました。最後のエラー: " # lastError);
  };

};
