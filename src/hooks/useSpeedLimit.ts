import { useState, useEffect, useRef } from 'react';

export type RoadZone = 'highway' | 'city' | 'school' | 'residential' | 'unknown';

export interface SpeedLimitState {
  /** Dynamic speed limit in km/h for the current road */
  limit: number;
  /** Human-readable zone label */
  zone: RoadZone;
  /** OSM road type tag (e.g. "motorway", "residential") */
  roadType: string;
  /** True while the API query is in-flight */
  loading: boolean;
}

// ─── Road type → default speed limit heuristics (India-biased) ──────────────
const ROAD_DEFAULTS: Record<string, { limit: number; zone: RoadZone }> = {
  motorway:       { limit: 120, zone: 'highway' },
  motorway_link:  { limit: 80,  zone: 'highway' },
  trunk:          { limit: 100, zone: 'highway' },
  trunk_link:     { limit: 80,  zone: 'highway' },
  primary:        { limit: 80,  zone: 'city' },
  primary_link:   { limit: 60,  zone: 'city' },
  secondary:      { limit: 60,  zone: 'city' },
  secondary_link: { limit: 50,  zone: 'city' },
  tertiary:       { limit: 50,  zone: 'city' },
  tertiary_link:  { limit: 40,  zone: 'city' },
  unclassified:   { limit: 40,  zone: 'city' },
  residential:    { limit: 30,  zone: 'residential' },
  living_street:  { limit: 20,  zone: 'residential' },
  service:        { limit: 20,  zone: 'residential' },
};

function parseMaxspeed(raw: string): number | null {
  if (!raw) return null;
  const n = parseInt(raw, 10);
  if (!isNaN(n) && n > 0) return n;
  // Handle "XX mph" (convert to km/h)
  const mph = raw.match(/^(\d+)\s*mph$/i);
  if (mph) return Math.round(parseInt(mph[1], 10) * 1.60934);
  // Handle zone tags
  if (raw === 'IN:urban')   return 50;
  if (raw === 'IN:rural')   return 80;
  if (raw === 'IN:motorway') return 120;
  return null;
}

function isSchoolZone(tags: Record<string, string>): boolean {
  const name = (tags.name ?? tags['name:en'] ?? '').toLowerCase();
  return (
    name.includes('school') ||
    name.includes('college') ||
    name.includes('university') ||
    tags.amenity === 'school' ||
    tags.amenity === 'college' ||
    tags.amenity === 'university'
  );
}

// Minimum distance (metres) between consecutive queries
const QUERY_MIN_DIST = 200;

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const d = (x: number) => (x * Math.PI) / 180;
  const a =
    Math.sin(d(lat2 - lat1) / 2) ** 2 +
    Math.cos(d(lat1)) * Math.cos(d(lat2)) * Math.sin(d(lon2 - lon1) / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

async function queryRoad(lat: number, lng: number): Promise<SpeedLimitState> {
  // Build Overpass QL: find nearest way within 50 m
  const query = `
    [out:json][timeout:6];
    way(around:50,${lat},${lng})["highway"];
    out tags 1;
  `.trim();

  try {
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const elements: Array<{ tags?: Record<string, string> }> = json.elements ?? [];

    if (elements.length === 0) {
      return { limit: 50, zone: 'city', roadType: 'unknown', loading: false };
    }

    const tags = elements[0].tags ?? {};
    const highway = tags.highway ?? 'unclassified';

    // School-zone check
    if (isSchoolZone(tags)) {
      return { limit: 20, zone: 'school', roadType: highway, loading: false };
    }

    // Explicit maxspeed tag
    const explicit = parseMaxspeed(tags.maxspeed ?? '');
    if (explicit !== null) {
      const zone: RoadZone =
        explicit <= 20 ? 'school' :
        explicit <= 30 ? 'residential' :
        explicit <= 60 ? 'city' : 'highway';
      return { limit: explicit, zone, roadType: highway, loading: false };
    }

    // Heuristic from road type
    const fallback = ROAD_DEFAULTS[highway] ?? { limit: 50, zone: 'city' as RoadZone };
    return { limit: fallback.limit, zone: fallback.zone, roadType: highway, loading: false };
  } catch {
    // Network error — return sensible default
    return { limit: 60, zone: 'city', roadType: 'unknown', loading: false };
  }
}

/**
 * useSpeedLimit
 *
 * Queries OpenStreetMap Overpass API for the current road's speed limit.
 * Re-queries every QUERY_MIN_DIST metres to update the zone automatically.
 * Falls back to road-type heuristics when maxspeed tag is absent.
 */
export function useSpeedLimit(lat: number | null, lng: number | null): SpeedLimitState {
  const [state, setState] = useState<SpeedLimitState>({
    limit: 60,
    zone: 'city',
    roadType: 'unknown',
    loading: false,
  });

  const lastQueried = useRef<{ lat: number; lng: number } | null>(null);
  const fetching = useRef(false);

  useEffect(() => {
    if (lat === null || lng === null) return;

    // Skip if we haven't moved QUERY_MIN_DIST metres since last query
    if (lastQueried.current) {
      const dist = haversineM(lastQueried.current.lat, lastQueried.current.lng, lat, lng);
      if (dist < QUERY_MIN_DIST) return;
    }

    if (fetching.current) return;

    lastQueried.current = { lat, lng };
    fetching.current = true;
    setState((prev) => ({ ...prev, loading: true }));

    queryRoad(lat, lng).then((result) => {
      setState(result);
      fetching.current = false;
    });
  }, [lat, lng]);

  return state;
}
