// api/wfs.js — ParcelIQ WFS Proxy
// Kanton Luzern Geoportal — 23 Layer
// Schema: https://public.geo.lu.ch/ogd/services/managed/[PRODUKT-ID]_MP/MapServer/WFSServer

const BASE = 'https://public.geo.lu.ch/ogd/services/managed';

// Layer-Konfiguration
// typename: null  → erster verfügbarer Layer per GetCapabilities
// typename: [...]  → explizite Liste von Typenames (alle werden abgefragt)
const LAYERS = {

  // ── Raumplanung / Nutzungsplanung ──────────────────────────────────────────
  grundnutzung: {
    name: 'Zonenplan: Grundnutzung',
    product: 'ZONPLANX_COL_V3',
    typenames: ['esri:Grundnutzung'],
  },
  ueberlagerung_fl: {
    name: 'Zonenplan: Überlagerungen (Flächen)',
    product: 'ZONPLANX_COL_V3',
    typenames: ['esri:Überlagerungen__Flächen_'],
  },
  ueberlagerung_li: {
    name: 'Zonenplan: Überlagerungen (Linien)',
    product: 'ZONPLANX_COL_V3',
    typenames: ['esri:Überlagerungen__Linien_'],
  },
  baulinien: {
    name: 'Zonenplan: Baulinien',
    product: 'ZONPLANX_COL_V3',
    typenames: ['esri:Baulinien'],
  },
  naturgefahren: {
    name: 'Zonenplan: Naturgefahren',
    product: 'ZONPLANX_COL_V3',
    typenames: ['esri:Zonenpläne__Naturgefahren'],
  },
  bemassungen: {
    name: 'Zonenplan: Bemassungen',
    product: 'ZONPLANX_COL_V3',
    typenames: ['esri:Bemassungen'],
  },
  waldgrenzen_zp: {
    name: 'Zonenplan: Statische Waldgrenzen',
    product: 'ZONPLANX_COL_V3',
    typenames: ['esri:Statische_Waldgrenzen'],
  },
  gewaesserraum_zp: {
    name: 'Zonenpläne: Gewässerraum',
    product: 'ZPUEBGEW_DS_V1',
    typenames: null, // auto via GetCapabilities
  },
  bebauungsplaene: {
    name: 'Kommunale Bebauungspläne',
    product: 'BEPLXXXX_COL_V2',
    typenames: null,
  },
  gestaltungsplaene: {
    name: 'Gestaltungspläne: Geltungsbereiche',
    product: 'GEPLPERI_DS_V1',
    typenames: null,
  },
  baulinien_sb: {
    name: 'Baulinien nach Strassen- und Baulinienplänen',
    product: 'BAULINSB_COL_V1',
    typenames: null,
  },
  waldgrenzen: {
    name: 'Statische Waldgrenzen',
    product: 'STWALDGR_DS_V2',
    typenames: null,
  },
  mobilitaetskonzepte: {
    name: 'Übersicht Mobilitätskonzepte',
    product: 'MOBILIKO_DS_V1',
    typenames: null,
  },

  // ── Naturgefahren / Risiken ────────────────────────────────────────────────
  gefahrenkarte: {
    name: 'Gefahrenkarte',
    product: 'GKXXXXXX_COL_V1',
    typenames: null,
  },
  gefahrenhinweis: {
    name: 'Gefahrenhinweiskarte',
    product: 'GHKXXXXX_COL_V1',
    typenames: null,
  },
  oberflaechenabfluss: {
    name: 'Oberflächenabflusskarte Naturgefahren',
    product: 'OFLABKAR_DS_V1',
    typenames: null,
  },
  bodenverschiebung: {
    name: 'Prüfperimeter Bodenverschiebung',
    product: 'PBVXXXXX_DS_V4',
    typenames: null,
  },
  baugrundklassen: {
    name: 'Baugrundklassen',
    product: 'BGKLASSX_COL_V4',
    typenames: null,
  },

  // ── Wald / Flora / Fauna ───────────────────────────────────────────────────
  einzelbaeume: {
    name: 'Einzelbäume',
    product: 'EINZBAUM_DS_V1',
    typenames: null,
  },

  // ── Energie ───────────────────────────────────────────────────────────────
  erdwaerme: {
    name: 'Erdwärmenutzung',
    product: 'EWNUTZXX_COL_V3',
    typenames: null,
  },

  // ── Verkehr ───────────────────────────────────────────────────────────────
  strassennetz: {
    name: 'Strassen- und Wegnetz',
    product: 'STRWXXXX_COL_V3',
    typenames: null,
  },
  kantonsstrassen: {
    name: 'Kantonsstrassen: Routen',
    product: 'KSTRRTEX_COL_V1',
    typenames: null,
  },
  fussgaengerstreifen: {
    name: 'Fussgängerstreifen',
    product: 'FUSSGSTR_DS_V1',
    typenames: null,
  },
  oev_einzugsgebiete: {
    name: 'ÖV: Haltestelleneinzugsgebiete',
    product: 'OEVHEAST_DS_V2',
    typenames: null,
  },

  // ── Gebäude / Anlagen ─────────────────────────────────────────────────────
  denkmal: {
    name: 'Denkmalverzeichnis und Bauinventar',
    product: 'BILUKDVX_COL_V4',
    typenames: null,
  },
  isos: {
    name: 'Inventar schützenswerte Ortsbilder (ISOS)',
    product: 'ISOSINVE_DS_V2',
    typenames: null,
  },

  // ── Militär / Sicherheit ──────────────────────────────────────────────────
  zivilschutz: {
    name: 'Schutzbauten Zivilschutz',
    product: 'LUFTSCHR_DS_V3',
    typenames: null,
  },

  // ── Umwelt / Lärm / Klima ─────────────────────────────────────────────────
  kbs: {
    name: 'Kataster belastete Standorte (KbS)',
    product: 'KBSTANDO_DS_V3',
    typenames: null,
  },
  strassenlaerm: {
    name: 'Strassenlärmkataster 2018',
    product: 'SLKAT18X_COL_V1',
    typenames: null,
  },
};

// Cache für GetCapabilities (pro Produkt, pro Serverinstanz)
const capsCache = {};

// Hole alle Typenames eines Produkts via GetCapabilities
async function getTypenames(product) {
  if (capsCache[product]) return capsCache[product];
  const url = `${BASE}/${product}_MP/MapServer/WFSServer?service=WFS&version=2.0.0&request=GetCapabilities`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GetCapabilities failed for ${product}: HTTP ${res.status}`);
  const xml = await res.text();
  const matches = [...xml.matchAll(/<wfs:Name>([^<]+)<\/wfs:Name>/g)];
  const names = matches.map(m => m[1]).filter(n => !n.startsWith('esri:') || !n.includes('Beschriftung') && !n.includes('Verweis'));
  capsCache[product] = names;
  return names;
}

// WFS GetFeature Abfrage
async function fetchWFS(product, typename, bbox) {
  const url = new URL(`${BASE}/${product}_MP/MapServer/WFSServer`);
  url.searchParams.set('service', 'WFS');
  url.searchParams.set('version', '2.0.0');
  url.searchParams.set('request', 'GetFeature');
  url.searchParams.set('typenames', typename);
  url.searchParams.set('srsname', 'epsg:2056');
  url.searchParams.set('bbox', `${bbox},epsg:2056`);
  url.searchParams.set('outputformat', 'GEOJSON');
  url.searchParams.set('count', '500');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`WFS fetch failed: HTTP ${res.status}`);
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { layer, bbox } = req.query;

  // Listet alle verfügbaren Layer
  if (!layer) {
    return res.status(400).json({
      error: 'layer fehlt',
      available: Object.entries(LAYERS).map(([id, cfg]) => ({
        id,
        name: cfg.name,
        product: cfg.product,
      })),
    });
  }

  if (!bbox) {
    return res.status(400).json({ error: 'bbox fehlt (E_min,N_min,E_max,N_max in LV95)' });
  }

  const cfg = LAYERS[layer];
  if (!cfg) {
    return res.status(404).json({
      error: `Layer "${layer}" nicht gefunden`,
      available: Object.keys(LAYERS),
    });
  }

  try {
    // Bestimme Typenames
    let typenames = cfg.typenames;
    if (!typenames) {
      typenames = await getTypenames(cfg.product);
    }

    if (!typenames || typenames.length === 0) {
      return res.status(404).json({ error: `Keine Typenames gefunden für ${cfg.product}` });
    }

    // Alle Typenames parallel abfragen, zusammenführen
    const results = await Promise.allSettled(
      typenames.map(tn => fetchWFS(cfg.product, tn, bbox))
    );

    const features = [];
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value?.features) {
        features.push(...r.value.features);
      }
    }

    return res.status(200).json({
      type: 'FeatureCollection',
      layer,
      name: cfg.name,
      product: cfg.product,
      features,
    });

  } catch (err) {
    console.error(`[wfs] ${layer}:`, err.message);
    return res.status(502).json({ error: err.message, layer });
  }
}
