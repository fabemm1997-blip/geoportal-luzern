export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { layer, bbox } = req.query;
  if (!bbox) return res.status(400).json({ error: 'bbox fehlt (E_min,N_min,E_max,N_max)' });
  if (!layer) return res.status(400).json({ error: 'layer fehlt (zone|gewaesser|wald|baulinien)' });

  const [emin, nmin, emax, nmax] = bbox.split(',');

  // Layer-Definitionen
  const LAYERS = {
    zone: {
      // LU Zonenplan Grundnutzung – ESRI MapServer Query (zuverlässiger als WFS)
      url: `https://public.geo.lu.ch/ogd/services/managed/ZPGNDNTZ_V1_PY/MapServer/0/query` +
        `?geometry=${emin},${nmin},${emax},${nmax}` +
        `&geometryType=esriGeometryEnvelope` +
        `&inSR=2056&spatialRel=esriSpatialRelIntersects` +
        `&outFields=ZONE_NAME,ZONE_ART,UEZ,GFZ,BM,GM,GEMEINDE,RECHTSSTATUS` +
        `&f=geojson&outSR=4326`
    },
    gewaesser: {
      // geo.admin.ch Gewässerraum (CORS-offen, kein Proxy nötig – aber hier zur Vollständigkeit)
      url: `https://api3.geo.admin.ch/rest/services/api/MapServer/identify` +
        `?geometry=${emin},${nmin},${emax},${nmax}` +
        `&geometryType=esriGeometryEnvelope` +
        `&layers=all:ch.bafu.gewaesserschutz-gewaesserraum` +
        `&tolerance=0&mapExtent=${emin},${nmin},${emax},${nmax}` +
        `&imageDisplay=400,400,96` +
        `&returnGeometry=true&geometryFormat=geojson&lang=de&sr=2056`
    },
    wald: {
      // LU Wald – ESRI MapServer
      url: `https://public.geo.lu.ch/ogd/services/managed/WALDXX_COL_V2_MP/MapServer/0/query` +
        `?geometry=${emin},${nmin},${emax},${nmax}` +
        `&geometryType=esriGeometryEnvelope` +
        `&inSR=2056&spatialRel=esriSpatialRelIntersects` +
        `&outFields=*&f=geojson&outSR=4326`
    },
    baulinien: {
      // LU Baulinien aus Zonenplan Überlagerungen
      url: `https://public.geo.lu.ch/ogd/services/managed/ZPUEBPYXX_V1_PY/MapServer/0/query` +
        `?geometry=${emin},${nmin},${emax},${nmax}` +
        `&geometryType=esriGeometryEnvelope` +
        `&inSR=2056&spatialRel=esriSpatialRelIntersects` +
        `&outFields=*&f=geojson&outSR=4326`
    },
    gewaesserraum_lu: {
      // LU Gewässerraum kantonal
      url: `https://public.geo.lu.ch/ogd/services/managed/GEWAESXX_COL_V2_MP/MapServer/0/query` +
        `?geometry=${emin},${nmin},${emax},${nmax}` +
        `&geometryType=esriGeometryEnvelope` +
        `&inSR=2056&spatialRel=esriSpatialRelIntersects` +
        `&outFields=*&f=geojson&outSR=4326`
    }
  };

  const def = LAYERS[layer];
  if (!def) return res.status(400).json({ error: `Unbekannter Layer: ${layer}. Erlaubt: ${Object.keys(LAYERS).join(', ')}` });

  try {
    const r = await fetch(def.url, {
      headers: { 'User-Agent': 'ParcelIQ-Proxy/1.0' }
    });
    const body = await r.text();
    const ct = r.headers.get('content-type') || 'application/json';
    res.setHeader('Content-Type', ct);
    res.status(r.status).send(body);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
