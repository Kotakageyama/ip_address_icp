import React from "react";
import Header from "./frontend/components/layout/Header";
import CurrentVisitor from "./frontend/components/visitor/CurrentVisitor";
import StaticMap from "./frontend/components/map/StaticMap";
import Stats from "./frontend/components/stats/Stats";
import RecentVisits from "./frontend/components/visitor/RecentVisits";
import Footer from "./frontend/components/layout/Footer";
import { useIpLocation } from "./frontend/hooks/useIpLocation";
import { useStats } from "./frontend/hooks/useStats";
import { ICPService } from "./frontend/services/icpService";
import "./App.css";

const App: React.FC = () => {
	const {
		currentIpInfo,
		loading: ipLoading,
		error: ipError,
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
				<CurrentVisitor ipInfo={currentIpInfo} />
				<StaticMap ipInfo={currentIpInfo} width={800} height={500} />
				<Stats stats={stats} />
				<RecentVisits />
			</main>

			<Footer canisterId={ICPService.getCanisterId()} />
		</div>
	);
};

export default App;
