import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface HttpRequestResult {
  'status' : bigint,
  'body' : Uint8Array | number[],
  'headers' : Array<{ 'value' : string, 'name' : string }>,
}
export interface IpAddressBackend {
  'getClientIpFromRequest' : ActorMethod<[], Result_2>,
  'getLatestVisits' : ActorMethod<[bigint], Array<IpInfo>>,
  'getStaticMap' : ActorMethod<
    [
      string,
      string,
      [] | [number],
      [] | [number],
      [] | [number],
      [] | [Array<Marker>],
    ],
    Result_2
  >,
  'getStats' : ActorMethod<
    [],
    { 'uniqueCountries' : bigint, 'totalVisits' : bigint }
  >,
  'recordVisitByIp' : ActorMethod<[string], Result>,
  'recordVisitFromClient' : ActorMethod<[string], Result_1>,
  'resetTestData' : ActorMethod<[], Result>,
  'transform' : ActorMethod<
    [{ 'context' : Uint8Array | number[], 'response' : HttpRequestResult }],
    HttpRequestResult
  >,
  'transformStaticMap' : ActorMethod<
    [{ 'context' : Uint8Array | number[], 'response' : HttpRequestResult }],
    HttpRequestResult
  >,
  'whoami' : ActorMethod<[], string>,
}
export interface IpInfo {
  'ip' : string,
  'isp' : string,
  'region' : string,
  'latitude' : string,
  'timezone' : string,
  'country' : string,
  'city' : string,
  'longitude' : string,
  'timestamp' : bigint,
}
export interface Marker { 'lat' : string, 'lon' : string, 'color' : string }
export type Result = { 'ok' : boolean } |
  { 'err' : string };
export type Result_1 = { 'ok' : IpInfo } |
  { 'err' : string };
export type Result_2 = { 'ok' : string } |
  { 'err' : string };
export interface _SERVICE extends IpAddressBackend {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
