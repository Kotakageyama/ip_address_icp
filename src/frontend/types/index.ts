export interface IpInfo {
	ip: string;
	country: string;
	region: string;
	city: string;
	latitude: string;
	longitude: string;
	timezone: string;
	isp: string;
	timestamp: bigint;
}

export interface Stats {
	totalVisits: bigint;
	uniqueCountries: bigint;
}

// 新しいスケーラブル機能用の型定義
export interface PagedVisitsResult {
	visits: IpInfo[];
	totalPages: bigint;
	currentPage: bigint;
	totalItems: bigint;
}

export interface CountryStats {
	country: string;
	visitCount: bigint;
}

export interface MemoryStats {
	totalVisits: number;
	bufferCapacity: number;
	uniqueCountries: number;
}

export interface ApiIpInfo {
	ip?: string;
	country?: string;
	country_name?: string;
	region?: string;
	regionName?: string;
	city?: string;
	latitude?: number;
	lat?: number;
	longitude?: number;
	lon?: number;
	timezone?: string;
	org?: string;
	isp?: string;
	query?: string;
	loc?: string;
}

export interface Marker {
	lat: string;
	lon: string;
	color: string;
}
