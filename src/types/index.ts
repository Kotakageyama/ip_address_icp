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
