import React from "react";
import Header from "./components/layout/Header";
import CurrentVisitor from "./components/visitor/CurrentVisitor";
// import StaticMap from "./components/map/StaticMap";
import Stats from "./components/stats/Stats";
import RecentVisits from "./components/visitor/RecentVisits";
import Footer from "./components/layout/Footer";
import { useIpLocation } from "./hooks/useIpLocation";
import { useStats } from "./hooks/useStats";
import { ICPService } from "./services/icpService";
import "./App.css";

const App: React.FC = () => {
	const {
		currentIpInfo,
		loading: ipLoading,
		error: ipError,
		isPrivacySecure,
	} = useIpLocation();
	const { stats } = useStats();

	const loading = ipLoading;
	const error = ipError;

	if (loading) {
		return (
			<div className="container">
				<div className="loading-screen">
					<div className="loading-spinner"></div>
					<p>WebRTC漏洩チェックを実行中...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="container">
				<div className="error-screen">
					<h2>🔒 セキュリティチェックエラー</h2>
					<p>{error}</p>
					<button onClick={() => window.location.reload()}>
						再診断
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="container">
			<Header />

			<main className="main-content">
				<CurrentVisitor
					ipInfo={currentIpInfo}
					isPrivacySecure={isPrivacySecure}
				/>

				{/* IP漏洩が検出された場合のみマップと統計を表示 */}
				{/* {isPrivacySecure === false && (
					<>
						<StaticMap
							ipInfo={currentIpInfo}
							width={800}
							height={500}
						/>
					</>
				)} */}
				<Stats stats={stats} />
				<RecentVisits />
			</main>

			<Footer canisterId={ICPService.getCanisterId()} />
		</div>
	);
};

export default App;
