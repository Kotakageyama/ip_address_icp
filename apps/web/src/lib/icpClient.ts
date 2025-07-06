import { HttpAgent, Actor } from '@dfinity/agent';
// Principal is not used, so removing it
// import { Principal } from '@dfinity/principal';

// Candid interface definition (from main.did)
export interface IpInfo {
  city: string;
  country: string;
  ip: string;
  isp: string;
  latitude: string;
  longitude: string;
  region: string;
  timestamp: bigint;
  timezone: string;
}

export interface Marker {
  lat: string;
  lon: string;
  color: string;
}

export interface Stats {
  totalVisits: bigint;
  uniqueCountries: bigint;
}

export interface BackendActor {
  getLatestVisits: (count: bigint) => Promise<IpInfo[]>;
  getStats: () => Promise<Stats>;
  whoami: () => Promise<string>;
  recordVisitByIp: (ip: string) => Promise<{ ok?: boolean; err?: string }>;
  recordVisitFromClient: (ip: string) => Promise<{ ok?: IpInfo; err?: string }>;
  getStaticMap: (
    lat: string,
    lon: string,
    zoom?: [number] | [],
    width?: [number] | [],
    height?: [number] | [],
    markers?: [Marker[]] | []
  ) => Promise<{ ok?: string; err?: string }>;
}

// IDL factory for the backend canister
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const idlFactory = ({ IDL }: any) => {
  const IpInfo = IDL.Record({
    city: IDL.Text,
    country: IDL.Text,
    ip: IDL.Text,
    isp: IDL.Text,
    latitude: IDL.Text,
    longitude: IDL.Text,
    region: IDL.Text,
    timestamp: IDL.Int,
    timezone: IDL.Text,
  });

  const Marker = IDL.Record({
    lat: IDL.Text,
    lon: IDL.Text,
    color: IDL.Text,
  });

  return IDL.Service({
    getLatestVisits: IDL.Func([IDL.Nat], [IDL.Vec(IpInfo)], ['query']),
    getStats: IDL.Func(
      [],
      [IDL.Record({ totalVisits: IDL.Nat, uniqueCountries: IDL.Nat })],
      ['query']
    ),
    whoami: IDL.Func([], [IDL.Text], ['query']),
    recordVisitByIp: IDL.Func(
      [IDL.Text],
      [IDL.Variant({ ok: IDL.Bool, err: IDL.Text })],
      []
    ),
    recordVisitFromClient: IDL.Func(
      [IDL.Text],
      [IDL.Variant({ ok: IpInfo, err: IDL.Text })],
      []
    ),
    getStaticMap: IDL.Func(
      [
        IDL.Text,
        IDL.Text,
        IDL.Opt(IDL.Nat8),
        IDL.Opt(IDL.Nat16),
        IDL.Opt(IDL.Nat16),
        IDL.Opt(IDL.Vec(Marker)),
      ],
      [IDL.Variant({ ok: IDL.Text, err: IDL.Text })],
      []
    ),
  });
};

// Determine network and configuration
const getNetworkConfig = () => {
  const isDev = import.meta.env.MODE === 'development';
  const isLocal =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('.local');
  const isLocalNetwork = import.meta.env.VITE_IS_LOCAL_NETWORK === 'true';

  if (isDev || isLocal) {
    return {
      host: import.meta.env.VITE_LOCAL_BACKEND_HOST || 'http://127.0.0.1:4943',
      isLocal: true,
      isLocalNetwork,
    };
  }

  return {
    host: 'https://icp0.io',
    isLocal: false,
    isLocalNetwork: false,
  };
};

// Get canister ID from environment variables
const getCanisterId = (): string => {
  const config = getNetworkConfig();

  // For local development, always use local canister ID
  if (config.isLocal) {
    return 'uxrrr-q7777-77774-qaaaq-cai'; // Local canister ID
  }

  // For production, use canister ID from environment variables
  const canisterId = import.meta.env.VITE_CANISTER_ID_IP_ADDRESS_BACKEND;
  if (canisterId) {
    return canisterId;
  }

  // Fallback
  return 'uxrrr-q7777-77774-qaaaq-cai';
};

// Create and configure the ICP agent
const createAgent = async (): Promise<HttpAgent> => {
  const config = getNetworkConfig();

  const agent = new HttpAgent({
    host: config.host,
  });

  // Fetch root key for local development
  if (config.isLocal) {
    try {
      await agent.fetchRootKey();
    } catch (error) {
      console.warn('Unable to fetch root key:', error);
    }
  }

  return agent;
};

// Create the backend actor
export const createBackendActor = async (): Promise<BackendActor> => {
  const agent = await createAgent();
  const canisterId = getCanisterId();

  console.log(`Creating backend actor with canister ID: ${canisterId}`);
  console.log(`Network config:`, getNetworkConfig());

  return Actor.createActor(idlFactory, {
    agent,
    canisterId,
  }) as BackendActor;
};

// Utility function to get client IP (placeholder for WebRTC implementation)
export const getClientIP = async (): Promise<string> => {
  try {
    // This is a placeholder - in a real implementation, you would use WebRTC
    // to get the client's actual IP address
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Failed to get client IP:', error);
    return '127.0.0.1'; // Fallback
  }
};
