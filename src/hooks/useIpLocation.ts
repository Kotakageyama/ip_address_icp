import { useState, useEffect } from 'react';
import { IpInfo } from '../types';
import { ICPService } from '../services/icpService';

export const useIpLocation = () => {
  const [currentIpInfo, setCurrentIpInfo] = useState<IpInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPrivacySecure, setIsPrivacySecure] = useState<boolean | null>(null); // IP漏洩チェック結果
  const [currentIp, setCurrentIp] = useState<string | null>(null);

  const whoamiData = ICPService.whoami();

  // WebRTC STUN サーバーを使用してクライアントIPを取得
  const fetchClientIpViaWebRTC = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      console.log('🔍 WebRTC IP取得を開始...');

      // WebRTC設定（複数のSTUNサーバーを使用）
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun.cloudflare.com:3478' },
        ],
      };

      console.log('📡 STUN サーバー設定:', configuration.iceServers);

      const peerConnection = new RTCPeerConnection(configuration);
      let ipDetected = false;
      let candidatesFound = 0;

      // ICE候補が見つかった時の処理
      peerConnection.onicecandidate = (event) => {
        candidatesFound++;
        console.log(
          `🎯 ICE候補 #${candidatesFound}:`,
          event.candidate?.candidate || 'null',
        );

        if (event.candidate && !ipDetected) {
          const candidate = event.candidate.candidate;

          // IPv4アドレスを抽出（正規表現を使用）
          const ipRegex = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/;
          const match = candidate.match(ipRegex);

          if (match && match[1]) {
            const ip = match[1];
            console.log(`🔍 発見されたIP: ${ip}`);

            // ローカルIPアドレス（192.168.x.x, 10.x.x.x, 172.16-31.x.x）を除外
            if (!isLocalIP(ip)) {
              console.log(`✅ パブリックIPを発見: ${ip}`);
              ipDetected = true;
              peerConnection.close();
              resolve(ip);
            } else {
              console.log(`🏠 ローカルIPをスキップ: ${ip}`);
            }
          }
        }
      };

      // 接続状態の変化を監視
      peerConnection.oniceconnectionstatechange = () => {
        console.log('🔗 ICE接続状態:', peerConnection.iceConnectionState);
      };

      // ICE収集状態を監視
      peerConnection.onicegatheringstatechange = () => {
        console.log('📊 ICE収集状態:', peerConnection.iceGatheringState);

        if (peerConnection.iceGatheringState === 'complete' && !ipDetected) {
          console.log('⚠️ ICE収集完了、しかしパブリックIPが見つからない');
          peerConnection.close();
          reject(new Error('パブリックIPアドレスが見つかりませんでした'));
        }
      };

      // エラー処理
      peerConnection.onicecandidateerror = (event) => {
        console.warn('❌ ICE candidate error:', event);
      };

      // ダミーのデータチャネルを作成してICE候補の収集を開始
      try {
        console.log('🚀 データチャネル作成とOffer生成中...');
        peerConnection.createDataChannel('dummy');

        peerConnection
          .createOffer()
          .then((offer) => {
            console.log('📄 Offer作成成功');
            return peerConnection.setLocalDescription(offer);
          })
          .then(() => {
            console.log('✅ LocalDescription設定完了、ICE候補収集開始');
          })
          .catch(reject);

        // タイムアウト設定（15秒）
        setTimeout(() => {
          if (!ipDetected) {
            console.log('⏰ WebRTC IP取得タイムアウト');
            peerConnection.close();
            reject(new Error('WebRTC IP取得がタイムアウトしました'));
          }
        }, 15000);
      } catch (error) {
        console.error('❌ WebRTC初期化エラー:', error);
        reject(new Error(`WebRTC初期化エラー: ${error}`));
      }
    });
  };

  // ローカルIPアドレスかどうかを判定
  const isLocalIP = (ip: string): boolean => {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4) return true;

    // プライベートIPアドレスの範囲をチェック
    return (
      // 192.168.x.x
      (parts[0] === 192 && parts[1] === 168) ||
      // 10.x.x.x
      parts[0] === 10 ||
      // 172.16.x.x - 172.31.x.x
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      // 127.x.x.x (localhost)
      parts[0] === 127 ||
      // 169.254.x.x (APIPA)
      (parts[0] === 169 && parts[1] === 254)
    );
  };

  const fetchIpLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsPrivacySecure(null);

      if (await whoamiData) {
        try {
          console.log('WebRTC経由でIP漏洩チェック開始...');

          let clientIp: string | null = null;

          try {
            // 1. WebRTCでIP取得を試行
            clientIp = await fetchClientIpViaWebRTC();
            console.log('⚠️ WebRTCでパブリックIPが漏洩しています:', clientIp);
            setIsPrivacySecure(false); // IP漏洩が検出された
          } catch (webrtcError) {
            console.log('✅ WebRTC IP漏洩は検出されませんでした');
            setIsPrivacySecure(true); // IP漏洩なし、プライバシーは安全
            // IP漏洩がない場合は記録せずに終了
            return;
          }

          // IP漏洩が検出された場合のみ記録
          if (clientIp) {
            setCurrentIp(clientIp);
            const ipInfo = await ICPService.recordVisitFromClient(clientIp);
            setCurrentIpInfo(ipInfo);
            console.log('IP漏洩情報を記録しました:', ipInfo);
          }
        } catch (error) {
          console.warn('IP漏洩チェックでエラーが発生:', error);
          setError(
            `IP漏洩チェックでエラーが発生しました: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          );
        }
      } else {
        setError('ICPServiceが利用できません');
      }
    } catch (error) {
      console.error('IP漏洩チェックに失敗しました:', error);
      setError('IP漏洩チェックに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIpLocation();
  }, []);

  return {
    currentIpInfo,
    currentIp,
    loading,
    error,
    isPrivacySecure, // IP漏洩チェック結果を追加
    refetch: fetchIpLocation,
  };
};
