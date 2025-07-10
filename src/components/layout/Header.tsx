import React from "react";
import "./Header.css";

const Header: React.FC = () => {
	return (
		<header className="header">
			<div className="header-content">
				<div className="header-title">
					<h1>🛡️ WebRTC IP漏洩チェッカー</h1>
					<p className="header-subtitle">
						WebRTCによるIPアドレス漏洩を診断し、あなたのプライバシーをチェックします
					</p>
				</div>
				<div className="header-badges">
					<span className="badge badge-security">
						🔒 セキュリティ診断
					</span>
					<span className="badge badge-webrtc">📡 WebRTC検査</span>
					<span className="badge badge-realtime">
						⚡ リアルタイム
					</span>
				</div>
			</div>
			<div className="security-notice">
				<div className="notice-content">
					<span className="notice-icon">⚠️</span>
					<span className="notice-text">
						この診断ツールはWebRTCを使用してあなたの実際のIPアドレスを検出します。
						VPNやプロキシを使用していても、WebRTCによって本来のIPアドレスが漏洩する可能性があります。
					</span>
				</div>
			</div>
		</header>
	);
};

export default Header;
