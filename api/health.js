export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'ok',
    service: 'ParcelIQ WFS Proxy',
    version: '1.0',
    layers: ['zone', 'gewaesser', 'wald', 'baulinien', 'gewaesserraum_lu'],
    usage: '/api/wfs?layer=zone&bbox=E_min,N_min,E_max,N_max',
    example: '/api/wfs?layer=zone&bbox=2644500,1201000,2644800,1201400'
  });
}
