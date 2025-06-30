import React from "react";
import { useRecentVisits } from "../../hooks/useRecentVisits";
import "./RecentVisits.css";

const RecentVisits: React.FC = () => {
	const { recentVisits } = useRecentVisits(10);

	if (recentVisits.length === 0) {
		return (
			<section className="recent-visits">
				<h2>👥 最近の訪問者</h2>
				<div className="visits-list">
					<div className="loading">まだ訪問記録がありません</div>
				</div>
			</section>
		);
	}

	return (
		<section className="recent-visits">
			<h2>👥 最近の訪問者</h2>
			<div className="visits-list">
				{recentVisits.map((visit) => {
					const visitTime = new Date(
						Number(visit.timestamp) / 1000000
					);
					return (
						<div
							key={`${visit.ip}-${visit.timestamp}`}
							className="visit-item"
						>
							<div className="visit-header">
								<span className="visit-ip">{visit.ip}</span>
								<span className="visit-time">
									{visitTime.toLocaleString("ja-JP")}
								</span>
							</div>
							<div className="visit-location">
								📍 {visit.city}, {visit.region}, {visit.country}
							</div>
							<div className="visit-location">🌐 {visit.isp}</div>
						</div>
					);
				})}
			</div>
		</section>
	);
};

export default RecentVisits;
