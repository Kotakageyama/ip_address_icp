import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Text "mo:base/Text";
import Http "mo:base/Http";

actor IpAddressBackend {
  // IPアドレス情報の型定義
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

  // 訪問者の履歴を保存
  private var visitHistory: [IpInfo] = [];

  // IPアドレス情報を記録
  public func recordVisit(ipInfo: IpInfo): async Bool {
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
    
    visitHistory := Array.append(visitHistory, [newInfo]);
    true
  };

  // 最新の訪問記録を取得
  public query func getLatestVisits(count: Nat): async [IpInfo] {
    let total = visitHistory.size();
    if (total <= count) {
      visitHistory
    } else {
      let start = total - count;
      Array.subArray(visitHistory, start, count)
    }
  };

  // 全ての訪問記録を取得
  public query func getAllVisits(): async [IpInfo] {
    visitHistory
  };

  // 統計情報を取得
  public query func getStats(): async {totalVisits: Nat; uniqueCountries: Nat} {
    let totalVisits = visitHistory.size();
    
    // ユニーク国数をカウント
    var countries: [Text] = [];
    for (visit in visitHistory.vals()) {
      let countryExists = Array.find<Text>(countries, func(c: Text): Bool { c == visit.country });
      switch (countryExists) {
        case null { countries := Array.append(countries, [visit.country]); };
        case (?_) { };
      };
    };
    
    {
      totalVisits = totalVisits;
      uniqueCountries = countries.size();
    }
  };

  // システム情報
  public query func whoami(): async Text {
    "IP Address Tracker Canister on Internet Computer"
  };
} 