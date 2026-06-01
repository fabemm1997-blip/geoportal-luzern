const WFS_BASE = 'https://public.geo.lu.ch/ogd/services/managed/ZONPLANX_COL_V3_MP/MapServer/WFSServer';

// Alle verfügbaren Layer aus den Capabilities
const LAYERS = {
  grundnutzung:          { typeName: 'esri:Grundnutzung',                color: null },
  grundnutzung_verweise: { typeName: 'esri:Grundnutzung__Verweise',       color: null },
  ueberlagerung_fl:      { typeName: 'esri:Überlagerungen__Flächen_',     color: null },
  ueberlagerung_li:      { typeName: 'esri:Überlagerungen__Linien_',      color: null },
  ueberlagerung_pt:      { typeName: 'esri:Überlagerungen__Punkte_',      color: null },
  baulinien:             { typeName: 'esri:Baulinien',                     color: null },
  wald:                  { typeName: 'esri:Statische_Waldgrenzen',         color: null },
  naturgefahren:         { typeName: 'esri:Zonenpläne__Naturgefahren',     color: null },
  bemassungen:           { typeName: 'esri:Bemassungen',                   color: null },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { layer, bbox, debug } = req.query;

  // Debug: Capabilities XML
  if (debug === 'caps') {
    const r = await fetch(`${WFS_BASE}?SERVICE=WFS&REQUEST=GetCapabilities`,
      { headers: { 'User-Agent': 'ParcelIQ/1.0' } });
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(await r.text());
  }

  // Debug: Layer-Liste als JSON
  if (debug === 'list') {
    return res.status(200).json({ layers: Object.keys(LAYERS), base: WFS_BASE });
  }

  if (!layer) return res.status(400).json({ error: 'layer fehlt', available: Object.keys(LAYERS) });
  if (!bbox)  return res.status(400).json({ error: 'bbox fehlt (E_min,N_min,E_max,N_max in LV95)' });

  const def = LAYERS[layer];
  if (!def) return res.status(400).json({ error: `Unbekannter Layer: ${layer}`, available: Object.keys(LAYERS) });

  // WFS GetFeature mit BBOX in LV95 (EPSG:2056), Output als GEOJSON
  const url = `${WFS_BASE}?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature` +
    `&TYPENAMES=${encodeURIComponent(def.typeName)}` +
    `&BBOX=${bbox},urn:ogc:def:crs:EPSG::2056` +
    `&OUTPUTFORMAT=GEOJSON` +
    `&COUNT=500`;

  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'ParcelIQ/1.0' } });
    const ct = r.headers.get('content-type') || '';
    const body = await r.text();

    // GML Response → trotzdem zurückgeben mit Hinweis
    if (!ct.includes('json') && !ct.toLowerCase().includes('geojson')) {
      // Versuche GeoJSON-Antwort zu parsen falls body doch JSON enthält
      try {
        const json = JSON.parse(body);
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json(json);
      } catch {
        res.setHeader('Content-Type', ct);
        return res.status(r.status).send(body);
      }
    }

    res.setHeader('Content-Type', 'application/json');
    res.status(r.status).send(body);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
