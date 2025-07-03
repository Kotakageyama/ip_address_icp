export const idlFactory = ({ IDL }) => {
  const Result_2 = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const IpInfo = IDL.Record({
    'ip' : IDL.Text,
    'isp' : IDL.Text,
    'region' : IDL.Text,
    'latitude' : IDL.Text,
    'timezone' : IDL.Text,
    'country' : IDL.Text,
    'city' : IDL.Text,
    'longitude' : IDL.Text,
    'timestamp' : IDL.Int,
  });
  const Marker = IDL.Record({
    'lat' : IDL.Text,
    'lon' : IDL.Text,
    'color' : IDL.Text,
  });
  const Result = IDL.Variant({ 'ok' : IDL.Bool, 'err' : IDL.Text });
  const Result_1 = IDL.Variant({ 'ok' : IpInfo, 'err' : IDL.Text });
  const HttpRequestResult = IDL.Record({
    'status' : IDL.Nat,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(IDL.Record({ 'value' : IDL.Text, 'name' : IDL.Text })),
  });
  const IpAddressBackend = IDL.Service({
    'getClientIpFromRequest' : IDL.Func([], [Result_2], []),
    'getLatestVisits' : IDL.Func([IDL.Nat], [IDL.Vec(IpInfo)], ['query']),
    'getStaticMap' : IDL.Func(
        [
          IDL.Text,
          IDL.Text,
          IDL.Opt(IDL.Nat8),
          IDL.Opt(IDL.Nat16),
          IDL.Opt(IDL.Nat16),
          IDL.Opt(IDL.Vec(Marker)),
        ],
        [Result_2],
        [],
      ),
    'getStats' : IDL.Func(
        [],
        [IDL.Record({ 'uniqueCountries' : IDL.Nat, 'totalVisits' : IDL.Nat })],
        ['query'],
      ),
    'recordVisitByIp' : IDL.Func([IDL.Text], [Result], []),
    'recordVisitFromClient' : IDL.Func([IDL.Text], [Result_1], []),
    'resetTestData' : IDL.Func([], [Result], []),
    'transform' : IDL.Func(
        [
          IDL.Record({
            'context' : IDL.Vec(IDL.Nat8),
            'response' : HttpRequestResult,
          }),
        ],
        [HttpRequestResult],
        ['query'],
      ),
    'transformStaticMap' : IDL.Func(
        [
          IDL.Record({
            'context' : IDL.Vec(IDL.Nat8),
            'response' : HttpRequestResult,
          }),
        ],
        [HttpRequestResult],
        ['query'],
      ),
    'whoami' : IDL.Func([], [IDL.Text], ['query']),
  });
  return IpAddressBackend;
};
export const init = ({ IDL }) => { return [IDL.Bool]; };
