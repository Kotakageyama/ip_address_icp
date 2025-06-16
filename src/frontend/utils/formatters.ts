/**
 * 日付フォーマッター
 */
export const formatDate = (timestamp: bigint): string => {
  try {
    // MotokoのTimestamp（ナノ秒）をJavaScriptのmillisecond単位に変換
    const date = new Date(Number(timestamp) / 1000000);
    
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('日付フォーマットエラー:', error);
    return '不明';
  }
};

/**
 * 相対時間フォーマッター（何分前、何時間前など）
 */
export const formatTimeAgo = (timestamp: bigint): string => {
  try {
    const now = Date.now();
    const date = Number(timestamp) / 1000000;
    const diffMs = now - date;
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) return 'たった今';
    if (diffMinutes < 60) return `${diffMinutes}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    return `${diffDays}日前`;
  } catch (error) {
    console.error('相対時間フォーマットエラー:', error);
    return '不明';
  }
};

/**
 * 国名フォーマッター（コードから日本語名への変換）
 */
export const formatCountryName = (countryCode: string): string => {
  const countryNames: Record<string, string> = {
    'JP': '日本',
    'US': 'アメリカ',
    'CN': '中国',
    'KR': '韓国',
    'GB': 'イギリス',
    'FR': 'フランス',
    'DE': 'ドイツ',
    'CA': 'カナダ',
    'AU': 'オーストラリア',
    'IN': 'インド'
  };
  
  return countryNames[countryCode] || countryCode;
};

/**
 * IPアドレスのマスキング
 */
export const maskIpAddress = (ip: string): string => {
  if (!ip || ip === '不明') return ip;
  
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }
  
  // IPv6の場合
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return `${parts[0]}:${parts[1]}:xxxx:xxxx`;
  }
  
  return ip;
};

/**
 * 大きな数値のフォーマッター
 */
export const formatLargeNumber = (num: bigint): string => {
  const number = Number(num);
  
  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`;
  }
  if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}K`;
  }
  
  return number.toString();
};

/**
 * 緯度経度のフォーマッター
 */
export const formatCoordinates = (lat: string, lng: string): string => {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  
  if (isNaN(latitude) || isNaN(longitude)) {
    return '座標不明';
  }
  
  const latDir = latitude >= 0 ? 'N' : 'S';
  const lngDir = longitude >= 0 ? 'E' : 'W';
  
  return `${Math.abs(latitude).toFixed(4)}°${latDir}, ${Math.abs(longitude).toFixed(4)}°${lngDir}`;
}; 