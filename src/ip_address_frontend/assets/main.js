// ICPのActor接続用の設定
import { Actor, HttpAgent } from "@dfinity/agent";

// ローカル開発環境用の設定
const agent = new HttpAgent({
    host: process.env.NODE_ENV === 'development' ? 'http://localhost:4943' : 'https://ic0.app'
});

// ローカル開発環境では証明書を検証しない
if (process.env.NODE_ENV === 'development') {
    agent.fetchRootKey();
}

// Canister IDL インターフェース定義
const idlFactory = ({ IDL }) => {
    const IpInfo = IDL.Record({
        'ip': IDL.Text,
        'country': IDL.Text,
        'region': IDL.Text,
        'city': IDL.Text,
        'latitude': IDL.Text,
        'longitude': IDL.Text,
        'timezone': IDL.Text,
        'isp': IDL.Text,
        'timestamp': IDL.Int
    });

    return IDL.Service({
        'recordVisit': IDL.Func([IpInfo], [IDL.Bool], []),
        'getLatestVisits': IDL.Func([IDL.Nat], [IDL.Vec(IpInfo)], ['query']),
        'getAllVisits': IDL.Func([], [IDL.Vec(IpInfo)], ['query']),
        'getStats': IDL.Func([], [IDL.Record({
            'totalVisits': IDL.Nat,
            'uniqueCountries': IDL.Nat
        })], ['query']),
        'whoami': IDL.Func([], [IDL.Text], ['query'])
    });
};

// Canister ID（デプロイ後に更新が必要）
const canisterId = process.env.CANISTER_ID_IP_ADDRESS_BACKEND || 'rdmx6-jaaaa-aaaaa-aaadq-cai';

// Actorインスタンスの作成
let backendActor;

try {
    backendActor = Actor.createActor(idlFactory, {
        agent,
        canisterId,
    });
} catch (error) {
    console.warn('Backend Actorの初期化に失敗しました:', error);
}

// グローバル変数
let map;
let currentLocationMarker;

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('アプリケーションを初期化中...');

    // Canister IDを表示
    updateCanisterId();

    // 地図を初期化
    initializeMap();

    // IPアドレス情報を取得
    await fetchAndDisplayCurrentInfo();

    // 統計情報を取得
    await fetchAndDisplayStats();

    // 最近の訪問者を取得
    await fetchAndDisplayRecentVisits();
});

// Canister IDを表示
function updateCanisterId() {
    const canisterIdElement = document.getElementById('canister-id');
    if (canisterIdElement) {
        canisterIdElement.textContent = canisterId;
    }
}

// 地図を初期化
function initializeMap() {
    try {
        map = L.map('map').setView([35.6762, 139.6503], 2); // 東京を中心に設定

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
    } catch (error) {
        console.error('地図の初期化に失敗しました:', error);
    }
}

// 現在の訪問者情報を取得・表示
async function fetchAndDisplayCurrentInfo() {
    const currentInfoElement = document.getElementById('current-info');

    try {
        // IPアドレス情報を取得
        const ipInfo = await fetchIpInfo();

        if (ipInfo) {
            // UIに表示
            displayCurrentInfo(ipInfo);

            // 地図にマーカーを追加
            addMarkerToMap(ipInfo);

            // Canisterに記録（バックエンドが利用可能な場合のみ）
            if (backendActor) {
                try {
                    await backendActor.recordVisit(ipInfo);
                    console.log('訪問情報をCanisterに記録しました');
                } catch (error) {
                    console.warn('Canisterへの記録に失敗しました:', error);
                }
            }
        }
    } catch (error) {
        console.error('IP情報の取得に失敗しました:', error);
        currentInfoElement.innerHTML = '<div class="error">情報の取得に失敗しました</div>';
    }
}

// 外部APIからIPアドレス情報を取得
async function fetchIpInfo() {
    try {
        // 複数のAPIを試行（フォールバック対応）
        const apis = [
            'https://ipapi.co/json/',
            'https://ip-api.com/json/',
            'https://ipinfo.io/json'
        ];

        for (const api of apis) {
            try {
                const response = await fetch(api);
                if (response.ok) {
                    const data = await response.json();
                    return normalizeIpData(data, api);
                }
            } catch (error) {
                console.warn(`API ${api} の呼び出しに失敗:`, error);
            }
        }

        // すべてのAPIが失敗した場合のフォールバック
        return {
            ip: '取得できませんでした',
            country: '不明',
            region: '不明',
            city: '不明',
            latitude: '0',
            longitude: '0',
            timezone: '不明',
            isp: '不明',
            timestamp: Date.now()
        };
    } catch (error) {
        console.error('IP情報取得エラー:', error);
        return null;
    }
}

// 異なるAPIからのデータを正規化
function normalizeIpData(data, apiUrl) {
    if (apiUrl.includes('ipapi.co')) {
        return {
            ip: data.ip || '不明',
            country: data.country_name || '不明',
            region: data.region || '不明',
            city: data.city || '不明',
            latitude: String(data.latitude || 0),
            longitude: String(data.longitude || 0),
            timezone: data.timezone || '不明',
            isp: data.org || '不明',
            timestamp: Date.now()
        };
    } else if (apiUrl.includes('ip-api.com')) {
        return {
            ip: data.query || '不明',
            country: data.country || '不明',
            region: data.regionName || '不明',
            city: data.city || '不明',
            latitude: String(data.lat || 0),
            longitude: String(data.lon || 0),
            timezone: data.timezone || '不明',
            isp: data.isp || '不明',
            timestamp: Date.now()
        };
    } else {
        // ipinfo.io format
        return {
            ip: data.ip || '不明',
            country: data.country || '不明',
            region: data.region || '不明',
            city: data.city || '不明',
            latitude: String(data.loc ? data.loc.split(',')[0] : 0),
            longitude: String(data.loc ? data.loc.split(',')[1] : 0),
            timezone: data.timezone || '不明',
            isp: data.org || '不明',
            timestamp: Date.now()
        };
    }
}

// 現在の情報をUIに表示
function displayCurrentInfo(ipInfo) {
    const currentInfoElement = document.getElementById('current-info');

    currentInfoElement.innerHTML = `
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">IPアドレス</div>
                <div class="info-value">${ipInfo.ip}</div>
            </div>
            <div class="info-item">
                <div class="info-label">国</div>
                <div class="info-value">${ipInfo.country}</div>
            </div>
            <div class="info-item">
                <div class="info-label">地域</div>
                <div class="info-value">${ipInfo.region}</div>
            </div>
            <div class="info-item">
                <div class="info-label">都市</div>
                <div class="info-value">${ipInfo.city}</div>
            </div>
            <div class="info-item">
                <div class="info-label">緯度・経度</div>
                <div class="info-value">${ipInfo.latitude}, ${ipInfo.longitude}</div>
            </div>
            <div class="info-item">
                <div class="info-label">タイムゾーン</div>
                <div class="info-value">${ipInfo.timezone}</div>
            </div>
            <div class="info-item">
                <div class="info-label">ISP</div>
                <div class="info-value">${ipInfo.isp}</div>
            </div>
            <div class="info-item">
                <div class="info-label">訪問時刻</div>
                <div class="info-value">${new Date().toLocaleString('ja-JP')}</div>
            </div>
        </div>
    `;
}

// 地図にマーカーを追加
function addMarkerToMap(ipInfo) {
    if (!map) return;

    const lat = parseFloat(ipInfo.latitude);
    const lng = parseFloat(ipInfo.longitude);

    if (isNaN(lat) || isNaN(lng)) return;

    // 既存のマーカーを削除
    if (currentLocationMarker) {
        map.removeLayer(currentLocationMarker);
    }

    // 新しいマーカーを追加
    currentLocationMarker = L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`
            <b>あなたの位置</b><br>
            ${ipInfo.city}, ${ipInfo.region}<br>
            ${ipInfo.country}<br>
            IP: ${ipInfo.ip}
        `);

    // 地図の中心をマーカー位置に設定
    map.setView([lat, lng], 8);
}

// 統計情報を取得・表示
async function fetchAndDisplayStats() {
    if (!backendActor) {
        document.getElementById('total-visits').textContent = '-';
        document.getElementById('unique-countries').textContent = '-';
        return;
    }

    try {
        const stats = await backendActor.getStats();
        document.getElementById('total-visits').textContent = stats.totalVisits.toString();
        document.getElementById('unique-countries').textContent = stats.uniqueCountries.toString();
    } catch (error) {
        console.error('統計情報の取得に失敗しました:', error);
        document.getElementById('total-visits').textContent = 'エラー';
        document.getElementById('unique-countries').textContent = 'エラー';
    }
}

// 最近の訪問者を取得・表示
async function fetchAndDisplayRecentVisits() {
    const visitsListElement = document.getElementById('visits-list');

    if (!backendActor) {
        visitsListElement.innerHTML = '<div class="loading">Canisterに接続できません</div>';
        return;
    }

    try {
        const recentVisits = await backendActor.getLatestVisits(10);

        if (recentVisits.length === 0) {
            visitsListElement.innerHTML = '<div class="loading">まだ訪問記録がありません</div>';
            return;
        }

        const visitsHtml = recentVisits.map(visit => {
            const visitTime = new Date(Number(visit.timestamp) / 1000000); // Motoko時間をJavaScript時間に変換
            return `
                <div class="visit-item">
                    <div class="visit-header">
                        <span class="visit-ip">${visit.ip}</span>
                        <span class="visit-time">${visitTime.toLocaleString('ja-JP')}</span>
                    </div>
                    <div class="visit-location">
                        📍 ${visit.city}, ${visit.region}, ${visit.country}
                    </div>
                    <div class="visit-location">
                        🌐 ${visit.isp}
                    </div>
                </div>
            `;
        }).join('');

        visitsListElement.innerHTML = visitsHtml;

        // 訪問者の位置を地図に追加
        addVisitorsToMap(recentVisits);

    } catch (error) {
        console.error('最近の訪問者取得に失敗しました:', error);
        visitsListElement.innerHTML = '<div class="loading">データの読み込みに失敗しました</div>';
    }
}

// 訪問者の位置を地図に追加
function addVisitorsToMap(visits) {
    if (!map) return;

    visits.forEach((visit, index) => {
        const lat = parseFloat(visit.latitude);
        const lng = parseFloat(visit.longitude);

        if (isNaN(lat) || isNaN(lng)) return;

        const marker = L.circleMarker([lat, lng], {
            radius: 6,
            fillColor: '#ff7675',
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map);

        marker.bindPopup(`
            <b>訪問者 #${visits.length - index}</b><br>
            ${visit.city}, ${visit.region}<br>
            ${visit.country}<br>
            IP: ${visit.ip}<br>
            時刻: ${new Date(Number(visit.timestamp) / 1000000).toLocaleString('ja-JP')}
        `);
    });
} 