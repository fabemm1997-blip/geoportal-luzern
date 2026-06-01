export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { layer, bbox, debug } = req.query;

  // Debug-Modus: Capabilities abrufen
  if (debug === 'caps') {
    const caps = await fetch(
      'https://public.geo.lu.ch/ogd/services/managed/ZONPLANX_COL_V3_MP/MapServer/WFSServer?SERVICE=WFS&REQUEST=GetCapabilities',
      { headers: { 'User-Agent': 'ParcelIQ/1.0' } }
    );
    const txt = await caps.text();
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(txt);
  }

  // Debug-Modus: MapServer Layers auflisten
  if (debug === 'layers') {
    const r = await fetch(
      'https://public.geo.lu.ch/ogd/services/managed/ZONPLANX_COL_V3_MP/MapServer?f=json',
      { headers: { 'User-Agent': 'ParcelIQ/1.0' } }
    );
    const txt = await r.text();
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(txt);
  }

  // Debug-Modus: STAC collections
  if (debug === 'stac') {
    const r = await fetch(
      'https://daten.geo.lu.ch/api/stac/v1/collections/ZONPLANX_COL_V3',
      { headers: { 'User-Agent': 'ParcelIQ/1.0' } }
    );
    const txt = await r.text();
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(txt);
  }

  if (!bbox) return res.status(400).json({ error: 'bbox fehlt (E_min,N_min,E_max,N_max in LV95)' });
  if (!layer) return res.status(400).json({ error: 'layer fehlt' });

  const [emin, nmin, emax, nmax] = bbox.split(',');

  // Alle Layer via MapServer Query (ESRI REST API – zuverlässiger als WFS)
  const BASE = 'https://public.geo.lu.ch/ogd/services/managed/ZONPLANX_COL_V3_MP/MapServer';

  const LAYERS = {
    // Grundnutzung (Zonen)
    zone:         { id: 0,  name: 'Grundnutzung' },
    zone_txt:     { id: 1,  name: 'Grundnutzung Beschriftung' },
    ueberlagerung:{ id: 2,  name: 'Überlagerungen' },
    baulinien:    { id: 3,  name: 'Baulinien' },
    gestaltung:   { id: 4,  name: 'Gestaltungspläne' },
    schutz:       { id: 5,  name: 'Schutzzonen' },
  };

  const def = LAYERS[layer];
  if (!def) {
    return res.status(400).json({
      error: `Unbekannter Layer: ${layer}`,
      available: Object.keys(LAYERS)
    });
  }

  const url = `${BASE}/${def.id}/query` +
    `?geometry=${emin},${nmin},${emax},${nmax}` +
    `&geometryType=esriGeometryEnvelope` +
    `&inSR=2056` +
    `&spatialRel=esriSpatialRelIntersects` +
    `&outFields=*` +
    `&returnGeometry=true` +
    `&f=geojson` +
    `&outSR=4326`;

  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'ParcelIQ/1.0' } });
    const body = await r.text();
    res.setHeader('Content-Type', 'application/json');
    res.status(r.status).send(body);
  } catch (e) {
    res.status(500).json({ error: e.message, url });
  }
}
